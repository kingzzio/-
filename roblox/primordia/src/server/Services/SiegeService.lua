-- Siege machines: Catapult (arcing, any pot ammo), Ballista (fast, anti-machine),
-- Battering Ram (push it up to a gate and smash). All machines are buildables, so
-- they persist and can themselves be destroyed (ballistas counter catapults).

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Debris = game:GetService("Debris")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Buildables = require(Shared.Buildables)
local WorldGen = require(Shared.WorldGen)
local Remotes = require(Shared.Remotes)

local SiegeService = {}
local S

local AMMO_ORDER = {
	Catapult = { "Boulder", "FirePot", "AcidFlask", "SmokePot" },
	Ballista = { "BallistaBolt" },
}
local lastFire: { [string]: number } = {}

local function canOperate(player: Player, model: Model): boolean
	local fac = player:GetAttribute("Faction")
	local owner, mf = model:GetAttribute("Owner"), model:GetAttribute("Faction")
	return owner == player.UserId or (fac ~= nil and fac == mf)
end

local function near(player: Player, model: Model, dist: number): boolean
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	return root ~= nil and model.PrimaryPart ~= nil and (root.Position - model.PrimaryPart.Position).Magnitude <= dist
end

---------------------------------------------------------------------------
-- impact
---------------------------------------------------------------------------
local function impact(attacker: Player, ammoId: string, pos: Vector3, dir: Vector3)
	local ammo = Buildables.Ammo[ammoId]
	if not ammo then
		return
	end
	local fx = Instance.new("Explosion")
	fx.BlastPressure = 0
	fx.DestroyJointRadiusPercent = 0
	fx.BlastRadius = ammo.radius
	fx.Position = pos
	fx.Parent = workspace

	if ammo.type == "smoke" then
		local cloud = Instance.new("Part")
		cloud.Anchored = true
		cloud.CanCollide = false
		cloud.Transparency = 1
		cloud.Position = pos
		cloud.Parent = workspace
		local smoke = Instance.new("Smoke")
		smoke.Size = 20
		smoke.Opacity = 0.6
		smoke.RiseVelocity = 3
		smoke.Parent = cloud
		Debris:AddItem(cloud, 12)
	elseif ammo.type == "fire" then
		local p = Instance.new("Part")
		p.Anchored = true
		p.CanCollide = false
		p.Transparency = 1
		p.Position = pos
		p.Parent = workspace
		local f = Instance.new("Fire")
		f.Size = 12
		f.Heat = 15
		f.Parent = p
		Debris:AddItem(p, ammo.burn or 6)
	end

	-- structures in the blast
	local hitModels = {}
	for _, b in S.BuildService:InRadius(pos, ammo.radius + 4) do
		if not hitModels[b.model] then
			hitModels[b.model] = true
			local d = (b.model.PrimaryPart.Position - pos).Magnitude
			local falloff = math.clamp(1 - d / (ammo.radius + 4), 0.25, 1)
			S.BuildService:Damage(b.model, ammo.damage * falloff, ammo.type, attacker, dir)
		end
	end
	-- burn ticks for fire pots
	if ammo.type == "fire" then
		task.spawn(function()
			for _ = 1, ammo.burn or 6 do
				task.wait(1)
				for _, b in S.BuildService:InRadius(pos, ammo.radius) do
					S.BuildService:Damage(b.model, ammo.damage * 0.25, "fire", attacker, nil)
				end
			end
		end)
	end
	-- players caught in it
	for _, p in Players:GetPlayers() do
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
		if root and hum and p ~= attacker and (root.Position - pos).Magnitude <= ammo.radius then
			if S.DoomsdayService:PvPAllowed(attacker, p) then
				hum:SetAttribute("LastAttacker", attacker.UserId)
				hum:TakeDamage(ammo.type == "smoke" and 5 or 30)
			end
		end
	end
end

local function launch(attacker: Player, machine: Model, ammoId: string, target: Vector3)
	local from = machine.PrimaryPart.Position + Vector3.new(0, 6, 0)
	local item = Items.Get(ammoId)
	local proj = Instance.new("Part")
	proj.Shape = Enum.PartType.Ball
	proj.Size = Vector3.new(3, 3, 3)
	proj.Anchored = true
	proj.CanCollide = false
	proj.Color = item and item.color or Color3.new(0.5, 0.5, 0.5)
	proj.Material = ammoId == "FirePot" and Enum.Material.Neon or Enum.Material.Slate
	proj.Position = from
	proj.Parent = workspace
	if ammoId == "FirePot" then
		Instance.new("Fire", proj)
	end
	local trail = Instance.new("Trail")
	local a0, a1 = Instance.new("Attachment", proj), Instance.new("Attachment", proj)
	a1.Position = Vector3.new(0, 0.8, 0)
	trail.Attachment0, trail.Attachment1 = a0, a1
	trail.Lifetime = 0.4
	trail.Color = ColorSequence.new(proj.Color)
	trail.Parent = proj

	local isBolt = ammoId == "BallistaBolt"
	local dist = (target - from).Magnitude
	local flight = isBolt and math.max(0.25, dist / 220) or math.clamp(dist / 70, 1, 4)
	local apex = isBolt and 0 or math.clamp(dist * 0.35, 15, 90)
	local t0 = os.clock()
	local conn
	conn = RunService.Heartbeat:Connect(function()
		local t = math.min(1, (os.clock() - t0) / flight)
		local p = from:Lerp(target, t) + Vector3.new(0, apex * 4 * t * (1 - t), 0)
		proj.Position = p
		if t >= 1 then
			conn:Disconnect()
			proj:Destroy()
			impact(attacker, ammoId, target, (target - from) * Vector3.new(1, 0, 1))
		end
	end)
end

---------------------------------------------------------------------------
-- machine behaviours
---------------------------------------------------------------------------
local function setupRanged(model: Model, kind: string)
	local main = model.PrimaryPart
	local def = Buildables.Get(kind)
	local reload = Instance.new("ProximityPrompt")
	reload.ActionText = "Reload " .. kind
	reload.ObjectText = "Empty"
	reload.HoldDuration = 1
	reload.KeyboardKeyCode = Enum.KeyCode.R
	reload.Parent = main

	local fire = Instance.new("ProximityPrompt")
	fire.ActionText = "Aim & Fire"
	fire.ObjectText = kind
	fire.KeyboardKeyCode = Enum.KeyCode.E
	fire.UIOffset = Vector2.new(0, 70)
	fire.Enabled = false
	fire.Parent = main

	reload.Triggered:Connect(function(player)
		if not canOperate(player, model) then
			Remotes.Notify:FireClient(player, "Not your machine", "error")
			return
		end
		if model:GetAttribute("Loaded") then
			return
		end
		for _, ammoId in AMMO_ORDER[kind] do
			if S.InventoryService:Take(player, { [ammoId] = 1 }) then
				model:SetAttribute("Loaded", ammoId)
				reload.ObjectText = "Loaded: " .. Items.Get(ammoId).name
				fire.Enabled = true
				return
			end
		end
		Remotes.Notify:FireClient(player, "No ammo — craft some at a Siege Workshop", "error")
	end)

	fire.Triggered:Connect(function(player)
		if canOperate(player, model) and model:GetAttribute("Loaded") then
			Remotes.SiegeAim:FireClient(player, model:GetAttribute("BuildId"), kind, def.range)
		end
	end)

	model:GetAttributeChangedSignal("Loaded"):Connect(function()
		local l = model:GetAttribute("Loaded")
		fire.Enabled = l ~= nil
		reload.ObjectText = l and ("Loaded: " .. Items.Get(l).name) or "Empty"
	end)
end

local function setupRam(model: Model)
	local main = model.PrimaryPart
	local def = Buildables.Get("Ram")
	local smash = Instance.new("ProximityPrompt")
	smash.ActionText = "Ram!"
	smash.ObjectText = "Battering Ram"
	smash.HoldDuration = 0.4
	smash.Parent = main
	local push = Instance.new("ProximityPrompt")
	push.ActionText = "Push forward"
	push.ObjectText = "Battering Ram"
	push.KeyboardKeyCode = Enum.KeyCode.R
	push.UIOffset = Vector2.new(0, 70)
	push.Parent = main

	smash.Triggered:Connect(function(player)
		local id = model:GetAttribute("BuildId")
		if not canOperate(player, model) then
			return
		end
		if lastFire[id] and os.clock() - lastFire[id] < def.reload then
			return
		end
		lastFire[id] = os.clock()
		local front = main.CFrame * CFrame.new(0, 0, -main.Size.Z / 2 - 4)
		for _, b in S.BuildService:InRadius(front.Position, 7) do
			if b.model ~= model then
				S.BuildService:Damage(b.model, def.damage, "blunt", player, main.CFrame.LookVector)
			end
		end
		local fx = Instance.new("Explosion")
		fx.BlastPressure = 0
		fx.BlastRadius = 2
		fx.DestroyJointRadiusPercent = 0
		fx.Position = front.Position
		fx.Parent = workspace
	end)

	push.Triggered:Connect(function(player)
		if not canOperate(player, model) then
			return
		end
		local cf = model:GetPivot() * CFrame.new(0, 0, -4)
		local h = WorldGen.Ground(cf.Position.X, cf.Position.Z)
		local blocked = #S.BuildService:InRadius(cf.Position + cf.LookVector * 6, 3) > 0
		if blocked then
			Remotes.Notify:FireClient(player, "Something's in the way — Ram it!", "info")
			return
		end
		model:PivotTo(CFrame.new(cf.Position.X, h + main.Size.Y / 2, cf.Position.Z) * (cf - cf.Position))
	end)
end

---------------------------------------------------------------------------
function SiegeService:Init(services)
	S = services

	S.BuildService:OnSpawned(function(model, rec)
		if rec.t == "Catapult" or rec.t == "Ballista" then
			setupRanged(model, rec.t)
		elseif rec.t == "Ram" then
			setupRam(model)
		end
	end)

	Remotes.FireSiege.OnServerEvent:Connect(function(player, machineId, target)
		if typeof(machineId) ~= "string" or typeof(target) ~= "Vector3" then
			return
		end
		local b = S.BuildService:Get(machineId)
		if not b then
			return
		end
		local model = b.model
		local kind = b.rec.t
		local def = Buildables.Get(kind)
		local ammoId = model:GetAttribute("Loaded")
		if not ammoId or not canOperate(player, model) or not near(player, model, 18) then
			return
		end
		if lastFire[machineId] and os.clock() - lastFire[machineId] < def.reload then
			return
		end
		local origin = model.PrimaryPart.Position
		local flat = (target - origin) * Vector3.new(1, 0, 1)
		if flat.Magnitude > def.range then
			target = origin + flat.Unit * def.range
			target = Vector3.new(target.X, WorldGen.Ground(target.X, target.Z), target.Z)
		end
		lastFire[machineId] = os.clock()
		model:SetAttribute("Loaded", nil)
		-- turn to face the target
		local look = CFrame.lookAt(origin, Vector3.new(target.X, origin.Y, target.Z))
		model:PivotTo(look)
		launch(player, model, ammoId, target)
	end)
end

return SiegeService
