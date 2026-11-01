-- Inventory, crafting, favourites, eating, and turning tool items into real Tools.

local Players = game:GetService("Players")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Recipes = require(Shared.Recipes)
local Remotes = require(Shared.Remotes)

local InventoryService = {}
local S -- services

function InventoryService:Count(player: Player, id: string): number
	local p = S.DataService:Get(player)
	return p and (p.inventory[id] or 0) or 0
end

function InventoryService:Sync(player: Player)
	local p = S.DataService:Get(player)
	if not p then
		return
	end
	Remotes.InventoryUpdate:FireClient(player, p.inventory, p.coins, p.favorites)
	self:RefreshTools(player)
end

function InventoryService:Add(player: Player, id: string, n: number, quiet: boolean?)
	local p = S.DataService:Get(player)
	if not p or not Items.Get(id) or n == 0 then
		return
	end
	p.inventory[id] = math.max(0, (p.inventory[id] or 0) + n)
	if p.inventory[id] == 0 then
		p.inventory[id] = nil
	end
	self:Sync(player)
	if not quiet and n > 0 then
		Remotes.Notify:FireClient(player, "+" .. n .. " " .. Items.Get(id).name, "item", Items.Get(id).rarity)
	end
end

function InventoryService:Has(player: Player, cost: { [string]: number }): boolean
	for id, n in cost do
		if self:Count(player, id) < n then
			return false
		end
	end
	return true
end

function InventoryService:Take(player: Player, cost: { [string]: number }): boolean
	if not self:Has(player, cost) then
		return false
	end
	local p = S.DataService:Get(player)
	for id, n in cost do
		p.inventory[id] -= n
		if p.inventory[id] <= 0 then
			p.inventory[id] = nil
		end
	end
	self:Sync(player)
	return true
end

function InventoryService:AddCoins(player: Player, amount: number, reason: string?)
	local p = S.DataService:Get(player)
	if not p then
		return
	end
	p.coins = math.max(0, math.floor(p.coins + amount))
	if amount > 0 then
		p.stats.earned += amount
		Remotes.CoinPopup:FireClient(player, math.floor(amount), reason or "")
	end
	self:Sync(player)
	player:SetAttribute("Coins", p.coins)
end

---------------------------------------------------------------------------
-- Tools: one physical Tool per tool item you own.
---------------------------------------------------------------------------
local function makeTool(id: string, def): Tool
	local tool = Instance.new("Tool")
	tool.Name = def.name
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool:SetAttribute("ItemId", id)
	tool.ToolTip = def.rarity .. " " .. def.tool.kind

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.4, 3.2, 0.4)
	handle.Color = Color3.fromRGB(120, 85, 50)
	handle.Material = Enum.Material.Wood
	handle.CanCollide = false
	handle.Massless = true
	handle.Parent = tool

	local head = Instance.new("Part")
	head.Name = "Head"
	head.CanCollide = false
	head.Massless = true
	head.Color = def.color
	head.Material = (def.rarity == "Legendary" or def.rarity == "Epic") and Enum.Material.Neon or Enum.Material.Metal
	local kind = def.tool.kind
	if kind == "axe" then
		head.Size = Vector3.new(0.3, 1, 1.4)
	elseif kind == "pick" then
		head.Size = Vector3.new(0.35, 0.35, 2.6)
	elseif kind == "hammer" then
		head.Size = Vector3.new(0.9, 0.9, 1.6)
	else
		head.Size = Vector3.new(0.25, 3.4, 0.6)
	end
	local offset = kind == "weapon" and CFrame.new(0, 3.2, 0) or CFrame.new(0, 1.4, kind == "axe" and 0.5 or 0)
	head.CFrame = handle.CFrame * offset
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = handle
	weld.Part1 = head
	weld.Parent = head
	head.Parent = tool
	tool.Grip = CFrame.new(0, -1, 0)
	return tool
end

function InventoryService:RefreshTools(player: Player)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack then
		return
	end
	local char = player.Character
	local have = {}
	for _, container in { backpack, char } do
		if container then
			for _, t in container:GetChildren() do
				if t:IsA("Tool") and t:GetAttribute("ItemId") then
					local id = t:GetAttribute("ItemId")
					if self:Count(player, id) <= 0 or have[id] then
						t:Destroy()
					else
						have[id] = true
					end
				end
			end
		end
	end
	local p = S.DataService:Get(player)
	if not p then
		return
	end
	for id, n in p.inventory do
		local def = Items.Get(id)
		if def and def.tool and n > 0 and not have[id] then
			makeTool(id, def).Parent = backpack
		end
	end
end

function InventoryService:EquippedTool(player: Player)
	local char = player.Character
	local tool = char and char:FindFirstChildOfClass("Tool")
	if tool and tool:GetAttribute("ItemId") then
		local id = tool:GetAttribute("ItemId")
		return id, Items.Get(id)
	end
	return nil, nil
end

---------------------------------------------------------------------------

function InventoryService:Init(services)
	S = services

	S.DataService:OnLoaded(function(player, profile)
		player:SetAttribute("Coins", profile.coins)
		self:Sync(player)
		player.CharacterAdded:Connect(function()
			task.wait(0.2)
			self:RefreshTools(player)
		end)
	end)

	Remotes.Craft.OnServerEvent:Connect(function(player, index)
		local recipe = typeof(index) == "number" and Recipes.List[index]
		if not recipe then
			return
		end
		if recipe.station and not S.BuildService:FindNearby(player, recipe.station, Recipes.StationRange) then
			Remotes.Notify:FireClient(player, "Needs a " .. recipe.station .. " nearby", "error")
			return
		end
		if not self:Take(player, recipe.cost) then
			Remotes.Notify:FireClient(player, "Missing materials", "error")
			return
		end
		self:Add(player, recipe.out, recipe.n)
	end)

	Remotes.ToggleFavorite.OnServerEvent:Connect(function(player, id)
		local p = S.DataService:Get(player)
		if p and typeof(id) == "string" and Items.Get(id) then
			p.favorites[id] = not p.favorites[id] or nil
			self:Sync(player)
		end
	end)

	Remotes.EatItem.OnServerEvent:Connect(function(player, id)
		local def = typeof(id) == "string" and Items.Get(id)
		if not def or not (def.food or def.heal) then
			return
		end
		if not self:Take(player, { [id] = 1 }) then
			return
		end
		S.CombatService:Feed(player, def.food or 0, def.heal or 0)
	end)
end

return InventoryService
