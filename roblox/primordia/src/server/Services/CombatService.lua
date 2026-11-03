-- Swinging (one action does it all: harvest / fight / repair / smash), health
-- bars, hunger, bounties and death satchels.

local Players = game:GetService("Players")
local Debris = game:GetService("Debris")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Items = require(Shared.Items)
local Remotes = require(Shared.Remotes)

local CombatService = {}
local S

local lastSwing: { [Player]: number } = {}
local streaks: { [Player]: number } = {}

---------------------------------------------------------------------------
-- overhead name + faction tag + health bar (the green bars from the trailer)
---------------------------------------------------------------------------
local function makeOverhead(player: Player, char: Model)
	local head = char:WaitForChild("Head", 5)
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not head or not hum then
		return
	end
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	local bb = Instance.new("BillboardGui")
	bb.Name = "Overhead"
	bb.Size = UDim2.fromOffset(160, 44)
	bb.StudsOffset = Vector3.new(0, 2.6, 0)
	bb.MaxDistance = 120
	bb.AlwaysOnTop = false

	local name = Instance.new("TextLabel")
	name.BackgroundTransparency = 1
	name.Size = UDim2.new(1, 0, 0, 20)
	name.Font = Enum.Font.GothamBold
	name.TextSize = 14
	name.TextColor3 = Color3.new(1, 1, 1)
	name.TextStrokeTransparency = 0.4
	name.Parent = bb

	local back = Instance.new("Frame")
	back.Position = UDim2.new(0.15, 0, 0, 24)
	back.Size = UDim2.new(0.7, 0, 0, 8)
	back.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	back.BorderSizePixel = 0
	back.Parent = bb
	Instance.new("UICorner", back).CornerRadius = UDim.new(1, 0)
	local fill = Instance.new("Frame")
	fill.Size = UDim2.fromScale(1, 1)
	fill.BackgroundColor3 = Color3.fromRGB(150, 255, 60)
	fill.BorderSizePixel = 0
	fill.Parent = back
	Instance.new("UICorner", fill).CornerRadius = UDim.new(1, 0)
	bb.Parent = head

	local function refresh()
		local tag = player:GetAttribute("FactionTag")
		local bounty = player:GetAttribute("Bounty")
		name.Text = (tag and ("[" .. tag .. "] ") or "") .. player.DisplayName .. (bounty and ("  💰" .. bounty) or "")
		local col = player:GetAttribute("FactionColor")
		name.TextColor3 = col and Color3.fromHex(col) or Color3.new(1, 1, 1)
		local pct = math.clamp(hum.Health / hum.MaxHealth, 0, 1)
		fill.Size = UDim2.fromScale(pct, 1)
		fill.BackgroundColor3 = pct > 0.5 and Color3.fromRGB(150, 255, 60) or (pct > 0.25 and Color3.fromRGB(255, 200, 40) or Color3.fromRGB(255, 60, 60))
	end
	refresh()
	hum.HealthChanged:Connect(refresh)
	player:GetAttributeChangedSignal("FactionTag"):Connect(refresh)
	player:GetAttributeChangedSignal("Bounty"):Connect(refresh)
end

---------------------------------------------------------------------------
-- hunger
---------------------------------------------------------------------------
function CombatService:Feed(player: Player, food: number, heal: number)
	local profile = S.DataService:Get(player)
	if not profile then
		return
	end
	profile.hunger = math.clamp(profile.hunger + food, 0, 100)
	player:SetAttribute("Hunger", profile.hunger)
	local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if hum and heal > 0 then
		hum.Health = math.min(hum.MaxHealth, hum.Health + heal)
	end
end

---------------------------------------------------------------------------
-- death: anarchy drops a satchel with 30% of your resources
---------------------------------------------------------------------------
local function dropSatchel(victim: Player, pos: Vector3)
	if not S.DoomsdayService:IsAnarchy() then
		return
	end
	local profile = S.DataService:Get(victim)
	if not profile then
		return
	end
	local loot = {}
	for id, n in profile.inventory do
		local def = Items.Get(id)
		if def and not def.tool and not def.armor and n > 0 then
			local take = math.floor(n * 0.3)
			if take > 0 then
				loot[id] = take
			end
		end
	end
	if next(loot) == nil then
		return
	end
	S.InventoryService:Take(victim, loot)
	local bag = Instance.new("Part")
	bag.Name = "Satchel"
	bag.Size = Vector3.new(2, 2, 2)
	bag.Shape = Enum.PartType.Ball
	bag.Color = Color3.fromRGB(140, 95, 60)
	bag.Material = Enum.Material.Fabric
	bag.Anchored = true
	bag.Position = pos
	bag.Parent = workspace
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Loot"
	prompt.ObjectText = victim.DisplayName .. "'s satchel"
	prompt.Parent = bag
	prompt.Triggered:Connect(function(looter)
		if not bag.Parent then
			return
		end
		bag:Destroy()
		for id, n in loot do
			S.InventoryService:Add(looter, id, n)
		end
	end)
	Debris:AddItem(bag, 300)
end

local function onDied(player: Player, hum: Humanoid)
	local root = hum.Parent and hum.Parent:FindFirstChild("HumanoidRootPart")
	if root then
		dropSatchel(player, root.Position)
	end
	local killerId = hum:GetAttribute("LastAttacker")
	local killer = killerId and Players:GetPlayerByUserId(killerId)
	local bounty = player:GetAttribute("Bounty")
	streaks[player] = 0
	player:SetAttribute("Bounty", nil)
	if killer and killer ~= player then
		local kp = S.DataService:Get(killer)
		if kp then
			kp.stats.kills += 1
		end
		streaks[killer] = (streaks[killer] or 0) + 1
		if streaks[killer] >= 3 then
			local b = 50 * streaks[killer]
			killer:SetAttribute("Bounty", b)
			Remotes.Notify:FireAllClients("BOUNTY: " .. killer.DisplayName .. " — " .. b .. " coins", "alert")
		end
		if bounty then
			S.InventoryService:AddCoins(killer, bounty, "Bounty claimed")
		end
	end
end

---------------------------------------------------------------------------
-- the swing
---------------------------------------------------------------------------
local function findTarget(player: Player, toolDef)
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if not root then
		return nil, nil
	end
	local params = OverlapParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { char, workspace.Terrain }
	local center = root.Position + root.CFrame.LookVector * (Config.SwingRange * 0.5)
	local parts = workspace:GetPartBoundsInRadius(center, Config.SwingRange * 0.7, params)
	local kind = toolDef and toolDef.tool and toolDef.tool.kind
	local best, bestKind, bestScore = nil, nil, math.huge
	local seen = {}
	for _, p in parts do
		local model = p:FindFirstAncestorOfClass("Model")
		while model and model.Parent and model.Parent:IsA("Model") do
			model = model.Parent
		end
		if model and not seen[model] then
			seen[model] = true
			local tKind
			if model:GetAttribute("NodeType") then
				tKind = "node"
			elseif model:GetAttribute("BuildId") then
				tKind = "build"
			elseif model:FindFirstChildOfClass("Humanoid") then
				tKind = "player"
			end
			if tKind then
				local d = (p.Position - root.Position).Magnitude
				-- tool preference: weapons want players, gatherers want nodes, hammers want builds
				if (kind == "weapon" and tKind == "player") or ((kind == "axe" or kind == "pick") and tKind == "node") or (kind == "hammer" and tKind == "build") then
					d -= 100
				end
				if d < bestScore then
					best, bestKind, bestScore = model, tKind, d
				end
			end
		end
	end
	return best, bestKind
end

local function onSwing(player: Player)
	local now = os.clock()
	if lastSwing[player] and now - lastSwing[player] < Config.SwingCooldown then
		return
	end
	lastSwing[player] = now
	local _, toolDef = S.InventoryService:EquippedTool(player)
	local target, kind = findTarget(player, toolDef)
	if not target then
		return
	end
	if kind == "node" then
		S.HarvestService:Hit(player, target, toolDef)
	elseif kind == "build" then
		if toolDef and toolDef.tool.kind == "hammer" then
			S.BuildService:HammerHit(player, target)
		else
			local power = toolDef and toolDef.tool.power or Config.FistDamage
			local root = player.Character.HumanoidRootPart
			S.BuildService:Damage(target, power, "melee", player, root.CFrame.LookVector)
		end
	elseif kind == "player" then
		local victim = Players:GetPlayerFromCharacter(target)
		local hum = target:FindFirstChildOfClass("Humanoid")
		if not hum or hum.Health <= 0 then
			return
		end
		if victim and not S.DoomsdayService:PvPAllowed(player, victim) then
			Remotes.Notify:FireClient(player, "PvP is off here until DOOMSDAY", "error")
			return
		end
		local power = (toolDef and toolDef.tool.kind == "weapon") and toolDef.tool.power or (toolDef and toolDef.tool.power * 0.5 or Config.FistDamage)
		hum:SetAttribute("LastAttacker", player.UserId)
		hum:TakeDamage(power)
		if toolDef and toolDef.tool.burn then
			local root = target:FindFirstChild("HumanoidRootPart")
			if root and not root:FindFirstChild("Burn") then
				local f = Instance.new("Fire")
				f.Name = "Burn"
				f.Parent = root
				Debris:AddItem(f, 3)
				for _ = 1, 3 do
					task.wait(1)
					if hum.Parent then
						hum:TakeDamage(4)
					end
				end
			end
		end
	end
end

---------------------------------------------------------------------------
function CombatService:Init(services)
	S = services
	Remotes.Swing.OnServerEvent:Connect(onSwing)

	local function hook(player: Player)
		player.CharacterAdded:Connect(function(char)
			task.spawn(makeOverhead, player, char)
			local hum = char:WaitForChild("Humanoid", 5)
			if hum then
				hum.Died:Connect(function()
					onDied(player, hum)
				end)
			end
		end)
	end
	Players.PlayerAdded:Connect(hook)
	for _, p in Players:GetPlayers() do
		hook(p)
	end
	Players.PlayerRemoving:Connect(function(p)
		lastSwing[p] = nil
		streaks[p] = nil
	end)
	S.DataService:OnLoaded(function(player, profile)
		player:SetAttribute("Hunger", profile.hunger)
	end)
end

function CombatService:Start()
	while true do
		task.wait(20)
		for _, player in Players:GetPlayers() do
			local profile = S.DataService:Get(player)
			if profile then
				profile.hunger = math.max(0, profile.hunger - 1)
				player:SetAttribute("Hunger", profile.hunger)
				if profile.hunger <= 0 then
					local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
					if hum then
						hum:TakeDamage(6)
						Remotes.Notify:FireClient(player, "You're starving — eat something (G)", "error")
					end
				end
			end
		end
	end
end

return CombatService
