-- The spawn HUB: a round studded plaza with sand paths running out in four
-- directions, striped market stalls (Global Shop, Crafting Hall, Siege Workshop,
-- Faction Hall), fenced pens, lanterns, a ring of voxel trees and a glowing
-- monument in the middle. It is a safe zone: no PvP, no building.

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local WorldGen = require(Shared.WorldGen)
local Remotes = require(Shared.Remotes)
local NodeFactory = require(script.Parent.NodeFactory)

local Hub = {}
local C = Color3.fromRGB
local M = Enum.Material

local function P(parent: Instance, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material?, opts: { [string]: any }?): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or M.Plastic
	p.TopSurface = Enum.SurfaceType.Studs
	p.BottomSurface = Enum.SurfaceType.Smooth
	if opts then
		for k, v in opts do
			(p :: any)[k] = v
		end
	end
	p.Parent = parent
	return p
end

local function label(part: BasePart, text: string, color: Color3, offsetY: number, size: Vector2?)
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset((size or Vector2.new(220, 50)).X, (size or Vector2.new(220, 50)).Y)
	bb.StudsOffset = Vector3.new(0, offsetY, 0)
	bb.MaxDistance = 220
	bb.LightInfluence = 0
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.Size = UDim2.fromScale(1, 1)
	t.Font = Enum.Font.LuckiestGuy
	t.TextScaled = true
	t.TextColor3 = color
	t.Text = text
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 3
	stroke.Color = C(30, 20, 20)
	stroke.Parent = t
	t.Parent = bb
	bb.Parent = part
	return bb
end

local STALLS = {
	{ name = "GLOBAL SHOP", a = 45, colors = { C(80, 200, 90), C(250, 250, 245) }, kind = "shop" },
	{ name = "CRAFTING HALL", a = 135, colors = { C(70, 150, 255), C(250, 250, 245) }, kind = "craft" },
	{ name = "SIEGE WORKSHOP", a = 225, colors = { C(235, 70, 70), C(250, 250, 245) }, kind = "siege" },
	{ name = "FACTION HALL", a = 315, colors = { C(170, 80, 255), C(250, 250, 245) }, kind = "faction" },
}

local function stall(model: Model, base: CFrame, def, services, stations)
	local wood, woodDark = C(176, 124, 78), C(124, 84, 52)
	-- floor + counter
	P(model, Vector3.new(14, 0.6, 10), base * CFrame.new(0, 0.3, 0), C(196, 150, 100), M.WoodPlanks)
	local counter = P(model, Vector3.new(12, 3.6, 2.4), base * CFrame.new(0, 2.4, -3.2), wood, M.Plastic)
	P(model, Vector3.new(12.4, 0.5, 2.8), base * CFrame.new(0, 4.4, -3.2), woodDark, M.Plastic)
	-- posts
	for _, x in { -6.2, 6.2 } do
		for _, z in { -4.2, 4.2 } do
			P(model, Vector3.new(0.8, 9, 0.8), base * CFrame.new(x, 4.8, z), woodDark, M.Plastic)
		end
	end
	-- striped, slanted awning
	local stripes = 8
	for i = 0, stripes - 1 do
		local x = -7 + (i + 0.5) * (14 / stripes)
		P(model, Vector3.new(14 / stripes, 0.5, 11.5), base * CFrame.new(x, 9.8, 0) * CFrame.Angles(math.rad(-12), 0, 0), def.colors[(i % 2) + 1], M.Plastic, { TopSurface = Enum.SurfaceType.Smooth })
	end
	-- scalloped edge
	for i = 0, 6 do
		P(model, Vector3.new(1.6, 1, 0.4), base * CFrame.new(-6 + i * 2, 8.6, -5.9), def.colors[1], M.Plastic, { TopSurface = Enum.SurfaceType.Smooth })
	end
	-- goods on the counter
	local goods = { C(255, 200, 60), C(230, 70, 70), C(110, 200, 90), C(120, 90, 200), C(255, 140, 40) }
	for i = 0, 4 do
		P(model, Vector3.new(1.4, 1.4, 1.4), base * CFrame.new(-4.4 + i * 2.2, 5.4, -3.2) * CFrame.Angles(0, math.rad(i * 17), 0), goods[i + 1], M.Plastic)
	end
	local sign = P(model, Vector3.new(10, 2.2, 0.6), base * CFrame.new(0, 11.6, -5.4), woodDark, M.Plastic)
	label(sign, def.name, C(255, 236, 120), 1.8, Vector2.new(260, 56))

	local prompt = Instance.new("ProximityPrompt")
	prompt.MaxActivationDistance = 14
	prompt.RequiresLineOfSight = false
	prompt.Parent = counter
	if def.kind == "shop" then
		prompt:Destroy()
		services.ShopService:AttachPrompt(counter, "Global Shop")
	elseif def.kind == "craft" then
		prompt.ActionText = "Craft"
		prompt.ObjectText = "Crafting Hall (Workbench + Forge)"
		prompt.Triggered:Connect(function(player)
			Remotes.OpenPanel:FireClient(player, "Craft")
		end)
		table.insert(stations, { kind = "Workbench", pos = counter.Position })
		table.insert(stations, { kind = "Forge", pos = counter.Position })
		local glow = P(model, Vector3.new(3, 2.4, 3), base * CFrame.new(4, 1.8, 2.6), C(90, 90, 96), M.Cobblestone)
		local fire = Instance.new("Fire")
		fire.Size = 3
		fire.Parent = glow
	elseif def.kind == "siege" then
		prompt.ActionText = "Craft"
		prompt.ObjectText = "Siege Workshop"
		prompt.Triggered:Connect(function(player)
			Remotes.OpenPanel:FireClient(player, "Craft")
		end)
		table.insert(stations, { kind = "SiegeWorkshop", pos = counter.Position })
		table.insert(stations, { kind = "Workbench", pos = counter.Position })
	else
		prompt.ActionText = "Open"
		prompt.ObjectText = "Faction Hall"
		prompt.Triggered:Connect(function(player)
			Remotes.OpenPanel:FireClient(player, "Faction")
		end)
	end
end

local function pen(model: Model, cf: CFrame, w: number, d: number)
	P(model, Vector3.new(w, 0.5, d), cf * CFrame.new(0, 0.25, 0), C(212, 164, 112), M.WoodPlanks)
	local post = C(110, 74, 46)
	local rail = C(150, 104, 66)
	for _, x in { -w / 2, w / 2 } do
		for _, z in { -d / 2, d / 2 } do
			P(model, Vector3.new(0.8, 3.4, 0.8), cf * CFrame.new(x, 1.7, z), post, M.Plastic)
		end
	end
	for _, y in { 1.4, 2.6 } do
		for _, z in { -d / 2, d / 2 } do
			P(model, Vector3.new(w, 0.4, 0.4), cf * CFrame.new(0, y, z), rail, M.Plastic, { TopSurface = Enum.SurfaceType.Smooth })
		end
		P(model, Vector3.new(0.4, 0.4, d), cf * CFrame.new(-w / 2, y, 0), rail, M.Plastic, { TopSurface = Enum.SurfaceType.Smooth })
	end
	-- a couple of hay bales / crates inside
	P(model, Vector3.new(3, 2, 2), cf * CFrame.new(-w / 4, 1.5, 0), C(232, 200, 100), M.Plastic)
	P(model, Vector3.new(2.4, 2.4, 2.4), cf * CFrame.new(w / 4, 1.7, -d / 6) * CFrame.Angles(0, 0.4, 0), C(160, 110, 70), M.WoodPlanks)
end

local function lantern(model: Model, pos: Vector3)
	P(model, Vector3.new(0.6, 7, 0.6), CFrame.new(pos + Vector3.new(0, 3.5, 0)), C(70, 60, 55), M.Plastic)
	local lamp = P(model, Vector3.new(1.4, 1.4, 1.4), CFrame.new(pos + Vector3.new(0, 7.6, 0)), C(255, 210, 120), M.Neon)
	local l = Instance.new("PointLight")
	l.Color = C(255, 200, 120)
	l.Range = 18
	l.Brightness = 1.4
	l.Parent = lamp
end

function Hub.Build(services, parent: Instance)
	local hub = WorldGen.Hub
	local h = hub.h
	local center = Vector3.new(hub.x, h, hub.z)
	local model = Instance.new("Model")
	model.Name = "Hub"
	local stations = {}

	-- plaza: dark rim + light stone disk + inner ring
	local up = CFrame.Angles(0, 0, math.pi / 2)
	P(model, Vector3.new(0.8, 54, 54), CFrame.new(center + Vector3.new(0, 0.4, 0)) * up, C(150, 112, 76), M.Plastic, { Shape = Enum.PartType.Cylinder })
	P(model, Vector3.new(1, 48, 48), CFrame.new(center + Vector3.new(0, 0.5, 0)) * up, C(222, 204, 168), M.Plastic, { Shape = Enum.PartType.Cylinder })
	P(model, Vector3.new(1.1, 20, 20), CFrame.new(center + Vector3.new(0, 0.55, 0)) * up, C(196, 176, 140), M.Plastic, { Shape = Enum.PartType.Cylinder })

	-- four sand paths
	for k = 0, 3 do
		local a = k * math.pi / 2
		local dir = Vector3.new(math.cos(a), 0, math.sin(a))
		local len = hub.r - 24
		local mid = center + dir * (24 + len / 2)
		P(model, Vector3.new(len, 0.4, 10), CFrame.lookAt(mid + Vector3.new(0, 0.2, 0), mid + Vector3.new(0, 0.2, 0) + dir) * CFrame.Angles(0, math.pi / 2, 0), WorldGen.Palette.Path[1], M.Plastic)
		for t = 30, hub.r - 6, 16 do
			for _, side in { -1, 1 } do
				lantern(model, center + dir * t + Vector3.new(-dir.Z, 0, dir.X) * 7 * side)
			end
		end
	end

	-- monument
	P(model, Vector3.new(10, 2, 10), CFrame.new(center + Vector3.new(0, 2, 0)), C(120, 120, 130), M.Plastic)
	P(model, Vector3.new(7, 2, 7), CFrame.new(center + Vector3.new(0, 4, 0)), C(150, 150, 160), M.Plastic)
	local pillar = P(model, Vector3.new(3, 12, 3), CFrame.new(center + Vector3.new(0, 11, 0)), C(245, 240, 230), M.Plastic)
	P(model, Vector3.new(3.6, 1, 3.6), CFrame.new(center + Vector3.new(0, 17.5, 0)), C(255, 200, 60), M.Plastic)
	local crystal = P(model, Vector3.new(4, 4, 4), CFrame.new(center + Vector3.new(0, 21, 0)) * CFrame.Angles(math.rad(45), 0, math.rad(45)), C(170, 110, 255), M.Neon)
	crystal.Name = "HubCrystal"
	local light = Instance.new("PointLight")
	light.Color = C(190, 130, 255)
	light.Range = 40
	light.Brightness = 2.5
	light.Parent = crystal
	label(pillar, Config.GameName, C(255, 220, 60), 14, Vector2.new(360, 80))

	-- stalls between the paths
	for _, def in STALLS do
		local a = math.rad(def.a)
		local pos = center + Vector3.new(math.cos(a), 0, math.sin(a)) * 18
		stall(model, CFrame.lookAt(pos, Vector3.new(center.X, pos.Y, center.Z)), def, services, stations)
	end

	-- fenced pens out in the meadow
	for k = 0, 3 do
		for _, off in { -1, 1 } do
			local a = k * math.pi / 2 + math.pi / 4 + off * 0.32
			local pos = center + Vector3.new(math.cos(a), 0, math.sin(a)) * 50
			pen(model, CFrame.lookAt(pos, Vector3.new(center.X, pos.Y, center.Z)), 14, 10)
		end
	end

	-- ring of voxel trees at the edge
	local rng = Random.new(Config.WorldSeed)
	for k = 0, 23 do
		local a = k / 24 * math.pi * 2 + rng:NextNumber(-0.06, 0.06)
		if math.abs(math.sin(a * 2)) > 0.25 then -- leave the 4 path exits open
			local r = hub.r - 4 + rng:NextNumber(-3, 3)
			local x, z = hub.x + math.cos(a) * r, hub.z + math.sin(a) * r
			local tree = NodeFactory.Build(rng:NextNumber() < 0.7 and "Tree" or "PineTree", Vector3.new(x, h, z), rng)
			for _, attr in { "NodeType", "HP", "MaxHP" } do
				tree:SetAttribute(attr, nil)
			end
			tree.Parent = model
		end
	end

	local sl = Instance.new("SpawnLocation")
	sl.Anchored = true
	sl.Transparency = 1
	sl.CanCollide = false
	sl.Size = Vector3.new(6, 1, 6)
	sl.Position = center + Vector3.new(0, 3, 12)
	sl.Neutral = true
	sl.Duration = 0
	sl.Parent = model

	model.Parent = parent

	-- slowly spin the crystal
	task.spawn(function()
		local t = 0
		while crystal.Parent do
			t += task.wait(0.05)
			crystal.CFrame = CFrame.new(center + Vector3.new(0, 21 + math.sin(t * 1.5) * 0.6, 0)) * CFrame.Angles(math.rad(45), t * 0.8, math.rad(45))
		end
	end)

	return model, stations, center
end

return Hub
