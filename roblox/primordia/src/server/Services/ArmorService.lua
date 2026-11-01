-- Wearable armour: equip a head + body piece from the inventory. Each piece adds
-- max health and is physically shown on your character (horned war helms, golden
-- face-guard helms, red warlord plate with shoulder pads, glowing crowns…).

local Players = game:GetService("Players")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Remotes = require(Shared.Remotes)

local ArmorService = {}
local S

local C = Color3.fromRGB
local M = Enum.Material

local function piece(folder: Instance, attachTo: BasePart, size: Vector3, offset: CFrame, color: Color3, material: Enum.Material, shape: Enum.PartType?): Part
	local p = Instance.new("Part")
	p.Size = size
	p.Color = color
	p.Material = material
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Massless = true
	if shape then
		p.Shape = shape
	end
	p.CFrame = attachTo.CFrame * offset
	local w = Instance.new("WeldConstraint")
	w.Part0 = attachTo
	w.Part1 = p
	w.Parent = p
	p.Parent = folder
	return p
end

local HEAD = {}

HEAD.hood = function(f, head, def)
	piece(f, head, Vector3.new(1.35, 1.25, 1.35), CFrame.new(0, 0.12, 0.08), def.color, M.Fabric)
end

HEAD.helm = function(f, head, def)
	piece(f, head, Vector3.new(1.35, 0.75, 1.35), CFrame.new(0, 0.38, 0), def.color, M.Metal)
	piece(f, head, Vector3.new(0.25, 0.9, 0.25), CFrame.new(0, 0.05, -0.68), def.color, M.Metal) -- nose guard
	piece(f, head, Vector3.new(1.4, 0.15, 1.4), CFrame.new(0, 0.05, 0), C(90, 90, 98), M.Metal)
end

-- The viking-style horned helmet.
HEAD.horned = function(f, head, def)
	piece(f, head, Vector3.new(1.35, 0.8, 1.35), CFrame.new(0, 0.38, 0), C(150, 150, 160), M.Metal)
	piece(f, head, Vector3.new(1.42, 0.2, 1.42), CFrame.new(0, 0.02, 0), C(200, 160, 60), M.Metal)
	for _, side in { -1, 1 } do
		local base = CFrame.new(side * 0.75, 0.55, 0) * CFrame.Angles(0, 0, side * math.rad(-55))
		piece(f, head, Vector3.new(0.38, 0.75, 0.38), base * CFrame.new(0, 0.3, 0), C(235, 225, 200), M.SmoothPlastic)
		piece(f, head, Vector3.new(0.3, 0.6, 0.3), base * CFrame.new(0, 0.75, 0) * CFrame.Angles(0, 0, side * math.rad(40)) * CFrame.new(0, 0.25, 0), C(235, 225, 200), M.SmoothPlastic)
		piece(f, head, Vector3.new(0.2, 0.4, 0.2), base * CFrame.new(0, 0.75, 0) * CFrame.Angles(0, 0, side * math.rad(75)) * CFrame.new(0, 0.6, 0), C(60, 50, 45), M.SmoothPlastic)
	end
end

-- Full golden helm with a barred face guard and crest.
HEAD.golden = function(f, head, def)
	piece(f, head, Vector3.new(1.4, 1.3, 1.4), CFrame.new(0, 0.1, 0.02), def.color, M.Metal)
	for i = -1, 1 do
		piece(f, head, Vector3.new(0.12, 0.7, 0.1), CFrame.new(i * 0.25, -0.05, -0.72), C(60, 45, 20), M.Metal)
	end
	piece(f, head, Vector3.new(0.9, 0.12, 0.1), CFrame.new(0, 0.25, -0.72), C(60, 45, 20), M.Metal)
	piece(f, head, Vector3.new(0.25, 0.6, 1.5), CFrame.new(0, 0.95, 0), C(200, 40, 45), M.Fabric)
	for _, side in { -1, 1 } do
		piece(f, head, Vector3.new(0.15, 0.7, 0.5), CFrame.new(side * 0.75, 0.5, 0) * CFrame.Angles(0, 0, side * math.rad(-30)), def.color, M.Metal)
	end
end

HEAD.crown = function(f, head, def)
	piece(f, head, Vector3.new(1.4, 0.35, 1.4), CFrame.new(0, 0.6, 0), C(255, 200, 60), M.Metal)
	for k = 0, 5 do
		local a = k * math.pi / 3
		local p = piece(f, head, Vector3.new(0.3, 0.6, 0.3), CFrame.new(math.cos(a) * 0.6, 0.95, math.sin(a) * 0.6) * CFrame.Angles(0, a, math.rad(45)), def.color, M.Neon)
		if k == 0 then
			local l = Instance.new("PointLight")
			l.Color = def.color
			l.Range = 10
			l.Parent = p
		end
	end
end

local BODY = {}

local function shoulders(f, torso, color, material, size)
	for _, side in { -1, 1 } do
		piece(f, torso, size, CFrame.new(side * (torso.Size.X / 2 + 0.35), torso.Size.Y / 2 - 0.15, 0) * CFrame.Angles(0, 0, side * math.rad(-15)), color, material)
	end
end

BODY.tunic = function(f, torso, def)
	piece(f, torso, torso.Size + Vector3.new(0.12, 0.1, 0.12), CFrame.new(0, -0.05, 0), def.color, M.Fabric)
	piece(f, torso, Vector3.new(torso.Size.X + 0.16, 0.25, torso.Size.Z + 0.16), CFrame.new(0, -torso.Size.Y / 2 + 0.35, 0), C(80, 55, 35), M.Fabric)
end

BODY.plate = function(f, torso, def)
	piece(f, torso, torso.Size + Vector3.new(0.15, 0, 0.18), CFrame.new(), def.color, M.Metal)
	piece(f, torso, Vector3.new(torso.Size.X + 0.2, 0.3, torso.Size.Z + 0.22), CFrame.new(0, -torso.Size.Y / 2 + 0.3, 0), C(110, 75, 45), M.Fabric)
	shoulders(f, torso, def.color, M.Metal, Vector3.new(0.9, 0.45, 1.15))
end

-- Red-and-gold warlord armour with big shoulder pads and a backpack (trailer look).
BODY.warlord = function(f, torso, def)
	piece(f, torso, torso.Size + Vector3.new(0.15, 0, 0.18), CFrame.new(), def.color, M.SmoothPlastic)
	piece(f, torso, Vector3.new(0.5, torso.Size.Y * 0.8, 0.1), CFrame.new(0, 0, -torso.Size.Z / 2 - 0.12), C(255, 200, 60), M.Metal)
	shoulders(f, torso, C(255, 200, 60), M.Metal, Vector3.new(1, 0.55, 1.25))
	piece(f, torso, Vector3.new(torso.Size.X * 0.9, torso.Size.Y * 0.9, 0.8), CFrame.new(0, 0, torso.Size.Z / 2 + 0.45), C(150, 95, 55), M.Fabric)
	piece(f, torso, Vector3.new(torso.Size.X * 0.95, 0.2, 0.85), CFrame.new(0, 0.2, torso.Size.Z / 2 + 0.46), C(90, 60, 35), M.Fabric)
end

BODY.hive = function(f, torso, def)
	piece(f, torso, torso.Size + Vector3.new(0.15, 0, 0.18), CFrame.new(), C(160, 95, 20), M.SmoothPlastic)
	for i = -1, 1 do
		for j = -1, 1 do
			for k = 0, 2 do
				piece(f, torso, Vector3.new(0.35, 0.6, 0.08), CFrame.new(i * 0.6, j * 0.55, -torso.Size.Z / 2 - 0.12) * CFrame.Angles(0, 0, math.rad(60 * k)), def.color, M.Foil)
			end
		end
	end
	shoulders(f, torso, def.color, M.Foil, Vector3.new(0.9, 0.45, 1.15))
end

---------------------------------------------------------------------------

function ArmorService:Apply(player: Player)
	local char = player.Character
	local profile = S.DataService:Get(player)
	if not char or not profile then
		return
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	local head = char:FindFirstChild("Head") :: BasePart
	local torso = (char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")) :: BasePart
	if not hum or not head or not torso then
		return
	end
	local old = char:FindFirstChild("Armor")
	if old then
		old:Destroy()
	end
	local folder = Instance.new("Folder")
	folder.Name = "Armor"
	folder.Parent = char

	local bonus = 0
	for slot, id in profile.armor do
		local def = Items.Get(id)
		if def and def.armor and S.InventoryService:Count(player, id) > 0 then
			bonus += def.armor.hp
			local builder = (slot == "head" and HEAD or BODY)[def.armor.style]
			if builder then
				builder(folder, slot == "head" and head or torso, def)
			end
		else
			profile.armor[slot] = nil
		end
	end
	local pct = hum.Health / math.max(hum.MaxHealth, 1)
	hum.MaxHealth = 100 + bonus
	hum.Health = math.max(1, hum.MaxHealth * pct)
	player:SetAttribute("ArmorBonus", bonus)
end

function ArmorService:Init(services)
	S = services
	Remotes.EquipArmor.OnServerEvent:Connect(function(player, id)
		local def = typeof(id) == "string" and Items.Get(id)
		local profile = S.DataService:Get(player)
		if not def or not def.armor or not profile then
			return
		end
		if S.InventoryService:Count(player, id) <= 0 then
			return
		end
		local slot = def.armor.slot
		profile.armor[slot] = profile.armor[slot] ~= id and id or nil
		self:Apply(player)
		S.InventoryService:Sync(player)
	end)
	local function hook(player)
		player.CharacterAppearanceLoaded:Connect(function()
			task.wait(0.2)
			self:Apply(player)
		end)
	end
	Players.PlayerAdded:Connect(hook)
	for _, p in Players:GetPlayers() do
		hook(p)
	end
	S.DataService:OnLoaded(function(player)
		if player.Character then
			self:Apply(player)
		end
	end)
end

return ArmorService
