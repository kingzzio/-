-- Real 3D item icons (ViewportFrames), like the chunky block icons in the trailer's
-- inventory, but each item gets its own little model: logs, ingots, gems, tools,
-- helmets, wall segments, crops…

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)

local ItemIcon = {}
local M = Enum.Material
local C = Color3.fromRGB
local templates: { [string]: Model } = {}

local function P(m: Model, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material?, shape: Enum.PartType?)
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or M.SmoothPlastic
	if shape then
		p.Shape = shape
	end
	p.Parent = m
	return p
end

local GEMS = { Sunstone = true, Emerald = true, Frostglass = true, Obsidian = true, Starmetal = true }
local BARS = { CopperBar = true, IronBar = true, GoldBar = true, HoneycombPlate = true, Brick = true }
local ORES = { CopperOre = true, IronOre = true, GoldOre = true }

local function build(id: string): Model
	local def = Items.Get(id)
	local m = Instance.new("Model")
	local col = def.color
	if def.tool then
		P(m, Vector3.new(0.35, 3, 0.35), CFrame.Angles(0, 0, math.rad(35)), C(130, 90, 55), M.Wood)
		local headCf = CFrame.Angles(0, 0, math.rad(35)) * CFrame.new(0, 1.3, 0)
		local kind = def.tool.kind
		if kind == "axe" then
			P(m, Vector3.new(0.3, 0.9, 1.3), headCf * CFrame.new(0, 0, 0.5), col, M.Metal)
		elseif kind == "pick" then
			P(m, Vector3.new(0.3, 0.35, 2.4), headCf, col, M.Metal)
		elseif kind == "hammer" then
			P(m, Vector3.new(0.8, 0.8, 1.4), headCf, col, M.Metal)
		else
			P(m, Vector3.new(0.2, 2.6, 0.5), headCf * CFrame.new(0, 0.6, 0), col, def.tool.burn and M.Neon or M.Metal)
			P(m, Vector3.new(0.3, 0.2, 1.2), headCf * CFrame.new(0, -0.7, 0), C(90, 70, 40), M.Metal)
		end
	elseif def.armor then
		if def.armor.slot == "head" then
			P(m, Vector3.new(1.8, 1.6, 1.8), CFrame.new(), col, M.Metal)
			P(m, Vector3.new(1.9, 0.25, 1.9), CFrame.new(0, -0.5, 0), C(90, 90, 98), M.Metal)
			if def.armor.style == "horned" then
				for _, s in { -1, 1 } do
					P(m, Vector3.new(0.4, 1.2, 0.4), CFrame.new(s * 1.1, 0.7, 0) * CFrame.Angles(0, 0, s * math.rad(-50)), C(235, 225, 200))
				end
			elseif def.armor.style == "crown" then
				for k = 0, 4 do
					P(m, Vector3.new(0.35, 0.8, 0.35), CFrame.new(math.cos(k * 1.26) * 0.7, 1, math.sin(k * 1.26) * 0.7), col, M.Neon)
				end
			end
		else
			P(m, Vector3.new(2, 2, 1), CFrame.new(), col, M.Metal)
			for _, s in { -1, 1 } do
				P(m, Vector3.new(0.9, 0.5, 1.2), CFrame.new(s * 1.35, 0.85, 0), def.rarity == "Common" and col or C(255, 200, 60), M.Metal)
			end
		end
	elseif def.build then
		local kind = def.category == "Siege" and "siege" or "wall"
		if kind == "siege" then
			P(m, Vector3.new(2, 0.5, 3.2), CFrame.new(), col, M.Wood)
			P(m, Vector3.new(0.3, 0.3, 3), CFrame.new(0, 1, 0.3) * CFrame.Angles(math.rad(-30), 0, 0), C(110, 75, 45), M.Wood)
			for _, x in { -1.1, 1.1 } do
				for _, z in { -1, 1 } do
					P(m, Vector3.new(0.3, 1, 1), CFrame.new(x, -0.3, z), C(80, 55, 35), M.Wood, Enum.PartType.Cylinder)
				end
			end
		elseif id == "Totem" then
			P(m, Vector3.new(1, 3.2, 1), CFrame.new(), C(140, 95, 55), M.Wood)
			P(m, Vector3.new(0.8, 0.8, 0.8), CFrame.new(0, 2, 0) * CFrame.Angles(math.rad(45), math.rad(45), 0), col, M.Neon)
		else
			P(m, Vector3.new(2.6, 2.2, 0.6), CFrame.new(), col, def.color.R > 0.9 and M.Foil or M.SmoothPlastic)
			P(m, Vector3.new(2.7, 0.3, 0.7), CFrame.new(0, 1, 0), Color3.new(col.R * 0.7, col.G * 0.7, col.B * 0.7))
		end
	elseif def.seed then
		for k = 0, 2 do
			P(m, Vector3.new(0.6, 0.6, 0.6), CFrame.new(math.cos(k * 2.1) * 0.5, 0, math.sin(k * 2.1) * 0.5), col, M.SmoothPlastic, Enum.PartType.Ball)
		end
	elseif GEMS[id] then
		for k = 0, 2 do
			P(m, Vector3.new(0.8, 1.8 - k * 0.3, 0.8), CFrame.new(k * 0.5 - 0.5, 0, 0) * CFrame.Angles(0, k, math.rad(15 * (k - 1))), col, k == 0 and M.Neon or M.Glass)
		end
	elseif BARS[id] then
		P(m, Vector3.new(2.2, 0.6, 1), CFrame.new(0, -0.3, 0.4), col, M.Metal)
		P(m, Vector3.new(2.2, 0.6, 1), CFrame.new(0.2, 0.3, -0.2) * CFrame.Angles(0, 0.3, 0), col, M.Metal)
	elseif ORES[id] then
		P(m, Vector3.new(1.8, 1.5, 1.6), CFrame.Angles(0.3, 0.5, 0), C(110, 110, 115), M.Slate)
		for k = 0, 2 do
			P(m, Vector3.new(0.6, 0.6, 0.6), CFrame.new(math.cos(k * 2) * 0.7, 0.5, math.sin(k * 2) * 0.7), col, M.Metal)
		end
	elseif id == "Wood" or id == "Plank" then
		if id == "Wood" then
			P(m, Vector3.new(2.6, 1, 1), CFrame.new(0, -0.3, 0), col, M.Wood, Enum.PartType.Cylinder)
			P(m, Vector3.new(2.6, 1, 1), CFrame.new(0.2, 0.55, 0.2) * CFrame.Angles(0, 0.4, 0), col, M.Wood, Enum.PartType.Cylinder)
		else
			for k = 0, 2 do
				P(m, Vector3.new(2.6, 0.3, 0.8), CFrame.new(0, k * 0.35 - 0.35, 0) * CFrame.Angles(0, k * 0.25, 0), col, M.WoodPlanks)
			end
		end
	elseif def.category == "Food" or def.category == "Siege" or id == "Honey" or id == "Wax" then
		P(m, Vector3.new(1.8, 1.6, 1.8), CFrame.new(), col, id == "FirePot" and M.Neon or M.SmoothPlastic, Enum.PartType.Ball)
		P(m, Vector3.new(0.25, 0.5, 0.25), CFrame.new(0, 0.95, 0), C(70, 130, 50), M.Grass)
	else
		P(m, Vector3.new(1.8, 1.8, 1.8), CFrame.Angles(0.2, 0.6, 0), col, M.SmoothPlastic)
	end
	return m
end

function ItemIcon.new(id: string, parent: GuiObject?, size: UDim2?): ViewportFrame
	local vf = Instance.new("ViewportFrame")
	vf.BackgroundTransparency = 1
	vf.Size = size or UDim2.fromScale(1, 1)
	vf.Ambient = Color3.fromRGB(170, 170, 180)
	vf.LightColor = Color3.new(1, 1, 1)
	vf.LightDirection = Vector3.new(-1, -1.5, -0.6)
	if not Items.Get(id) then
		vf.Parent = parent
		return vf
	end
	if not templates[id] then
		templates[id] = build(id)
	end
	local model = templates[id]:Clone()
	model.Parent = vf
	local cam = Instance.new("Camera")
	cam.FieldOfView = 30
	local cf, extents = model:GetBoundingBox()
	local dist = extents.Magnitude * 1.9
	cam.CFrame = CFrame.lookAt(cf.Position + Vector3.new(0.75, 0.55, -1).Unit * dist, cf.Position)
	cam.Parent = vf
	vf.CurrentCamera = cam
	vf.Parent = parent
	return vf
end

return ItemIcon
