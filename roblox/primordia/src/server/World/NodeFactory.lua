-- Builds low-poly harvestable node models from plain Parts (no uploaded assets needed).

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Nodes = require(Shared.Nodes)

local NodeFactory = {}
local M = Enum.Material

local function part(model: Model, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material?, shape: Enum.PartType?): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or M.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if shape then
		p.Shape = shape
	end
	p.Parent = model
	if not model.PrimaryPart then
		model.PrimaryPart = p
	end
	return p
end

local function jitter(rng: Random, c: Color3, amt: number): Color3
	local h, s, v = c:ToHSV()
	return Color3.fromHSV(h, s, math.clamp(v + rng:NextNumber(-amt, amt), 0, 1))
end

local BUILDERS = {}

BUILDERS.Tree = function(m, base, rng, def)
	local h = rng:NextNumber(10, 16)
	part(m, Vector3.new(1.8, h, 1.8), base * CFrame.new(0, h / 2, 0), Color3.fromRGB(110, 75, 45), M.Wood)
	for i = 1, rng:NextInteger(2, 3) do
		local s = rng:NextNumber(6, 9)
		local cf = base * CFrame.new(rng:NextNumber(-2, 2), h + rng:NextNumber(-1.5, 2) + (i - 1) * 1.5, rng:NextNumber(-2, 2))
			* CFrame.Angles(0, rng:NextNumber(0, math.pi), rng:NextNumber(-0.2, 0.2))
		part(m, Vector3.new(s, s * 0.8, s), cf, jitter(rng, def.color, 0.08), M.Grass)
	end
end

BUILDERS.PineTree = function(m, base, rng, def)
	local h = rng:NextNumber(12, 18)
	part(m, Vector3.new(1.6, h, 1.6), base * CFrame.new(0, h / 2, 0), Color3.fromRGB(90, 60, 40), M.Wood)
	for i = 0, 3 do
		local s = 9 - i * 2
		part(m, Vector3.new(s, 2.4, s), base * CFrame.new(0, h * 0.45 + i * 2.8, 0) * CFrame.Angles(0, i * 0.4, 0), jitter(rng, def.color, 0.05), M.Grass)
	end
	part(m, Vector3.new(7, 0.6, 7), base * CFrame.new(0, h * 0.45 + 1.4, 0), Color3.fromRGB(240, 245, 255), M.Snow)
end

BUILDERS.PalmTree = function(m, base, rng, def)
	local h = rng:NextNumber(12, 16)
	local lean = CFrame.Angles(rng:NextNumber(-0.2, 0.2), 0, rng:NextNumber(-0.2, 0.2))
	part(m, Vector3.new(1.4, h, 1.4), base * lean * CFrame.new(0, h / 2, 0), Color3.fromRGB(150, 115, 70), M.Wood)
	for i = 1, 5 do
		local a = i * (math.pi * 2 / 5)
		part(m, Vector3.new(1.4, 0.3, 7), base * lean * CFrame.new(0, h, 0) * CFrame.Angles(0, a, 0) * CFrame.new(0, 0, -3) * CFrame.Angles(-0.35, 0, 0), def.color, M.Grass)
	end
end

BUILDERS.DeadTree = function(m, base, rng, def)
	local h = rng:NextNumber(8, 12)
	part(m, Vector3.new(1.4, h, 1.4), base * CFrame.new(0, h / 2, 0), def.color, M.Wood)
	for i = 1, 3 do
		part(m, Vector3.new(0.6, 4, 0.6), base * CFrame.new(0, h * (0.5 + i * 0.12), 0) * CFrame.Angles(0, i * 2.1, 0.9) * CFrame.new(0, 2, 0), def.color, M.Wood)
	end
end

BUILDERS.Cactus = function(m, base, rng, def)
	local h = rng:NextNumber(6, 10)
	part(m, Vector3.new(2, h, 2), base * CFrame.new(0, h / 2, 0), def.color, M.Grass)
	part(m, Vector3.new(1.4, 3, 1.4), base * CFrame.new(1.6, h * 0.6, 0), def.color, M.Grass)
	part(m, Vector3.new(1.4, 2.4, 1.4), base * CFrame.new(-1.6, h * 0.45, 0), def.color, M.Grass)
end

BUILDERS.Rock = function(m, base, rng, def)
	for i = 1, rng:NextInteger(1, 3) do
		local s = rng:NextNumber(3, 6)
		part(m, Vector3.new(s, s * 0.8, s * 1.1), base * CFrame.new(rng:NextNumber(-2, 2), s * 0.3, rng:NextNumber(-2, 2)) * CFrame.Angles(rng:NextNumber(0, 1), rng:NextNumber(0, 3), 0), jitter(rng, def.color, 0.06), M.Slate)
	end
end

local function vein(m, base, rng, def)
	BUILDERS.Rock(m, base, rng, { color = Color3.fromRGB(110, 110, 115) })
	for _ = 1, 4 do
		local s = rng:NextNumber(1, 1.8)
		part(m, Vector3.new(s, s, s), base * CFrame.new(rng:NextNumber(-2.2, 2.2), rng:NextNumber(1, 3.5), rng:NextNumber(-2.2, 2.2)) * CFrame.Angles(rng:NextNumber(0, 3), rng:NextNumber(0, 3), 0), def.color, M.Metal)
	end
end
BUILDERS.CopperVein = vein
BUILDERS.IronVein = vein
BUILDERS.GoldVein = vein

BUILDERS.ClayDeposit = function(m, base, rng, def)
	part(m, Vector3.new(7, 2, 6), base * CFrame.new(0, 0.6, 0) * CFrame.Angles(0, rng:NextNumber(0, 3), 0), def.color, M.Ground, Enum.PartType.Ball)
end

local function crystal(m, base, rng, def)
	local big = def.big and 1.8 or 1
	for i = 1, rng:NextInteger(3, 5) do
		local h = rng:NextNumber(3, 7) * big
		local w = rng:NextNumber(1.4, 2.6) * big
		part(m, Vector3.new(w, h, w), base * CFrame.new(rng:NextNumber(-1.5, 1.5) * big, h * 0.4, rng:NextNumber(-1.5, 1.5) * big) * CFrame.Angles(rng:NextNumber(-0.4, 0.4), rng:NextNumber(0, 3), rng:NextNumber(-0.4, 0.4)), jitter(rng, def.color, 0.08), i == 1 and M.Neon or M.Glass)
	end
	local light = Instance.new("PointLight")
	light.Color = def.color
	light.Range = 16
	light.Brightness = 1.5
	light.Parent = m.PrimaryPart
end
BUILDERS.FrostCrystal = crystal
BUILDERS.EmeraldCrystal = crystal
BUILDERS.SunstoneCrystal = crystal
BUILDERS.ObsidianSpire = function(m, base, rng, def)
	for _ = 1, 3 do
		local h = rng:NextNumber(6, 12)
		part(m, Vector3.new(1.6, h, 1.6), base * CFrame.new(rng:NextNumber(-2, 2), h / 2, rng:NextNumber(-2, 2)) * CFrame.Angles(rng:NextNumber(-0.3, 0.3), 0, rng:NextNumber(-0.3, 0.3)), def.color, M.Glass)
	end
end

BUILDERS.Meteorite = function(m, base, rng, def)
	part(m, Vector3.new(9, 9, 9), base * CFrame.new(0, 2, 0), Color3.fromRGB(40, 30, 45), M.Basalt, Enum.PartType.Ball)
	for _ = 1, 6 do
		part(m, Vector3.new(0.6, 3, 0.6), base * CFrame.new(0, 2, 0) * CFrame.Angles(rng:NextNumber(0, 6), rng:NextNumber(0, 6), 0) * CFrame.new(0, 4.3, 0), def.color, M.Neon)
	end
	local light = Instance.new("PointLight")
	light.Color = def.color
	light.Range = 30
	light.Brightness = 3
	light.Parent = m.PrimaryPart
	local fire = Instance.new("Fire")
	fire.Color = def.color
	fire.SecondaryColor = Color3.new(1, 1, 1)
	fire.Size = 6
	fire.Parent = m.PrimaryPart
end

BUILDERS.Reeds = function(m, base, rng, def)
	for _ = 1, 6 do
		local h = rng:NextNumber(3, 5)
		local p = part(m, Vector3.new(0.3, h, 0.3), base * CFrame.new(rng:NextNumber(-1.5, 1.5), h / 2, rng:NextNumber(-1.5, 1.5)) * CFrame.Angles(rng:NextNumber(-0.15, 0.15), 0, rng:NextNumber(-0.15, 0.15)), jitter(rng, def.color, 0.08), M.Grass)
		p.CanCollide = false
	end
end

BUILDERS.BerryBush = function(m, base, rng, def)
	part(m, Vector3.new(5, 4, 5), base * CFrame.new(0, 1.6, 0), def.color, M.Grass, Enum.PartType.Ball)
	for _ = 1, 7 do
		local p = part(m, Vector3.new(0.7, 0.7, 0.7), base * CFrame.new(rng:NextNumber(-2, 2), rng:NextNumber(1.5, 3.3), rng:NextNumber(-2, 2)), Color3.fromRGB(90, 60, 180), M.SmoothPlastic, Enum.PartType.Ball)
		p.CanCollide = false
	end
end

BUILDERS.BeeNest = function(m, base, rng, def)
	part(m, Vector3.new(2, 3, 2), base * CFrame.new(0, 1.5, 0), Color3.fromRGB(100, 70, 45), M.Wood)
	part(m, Vector3.new(3, 3.6, 3), base * CFrame.new(0, 4.6, 0), def.color, M.Sand, Enum.PartType.Ball)
	part(m, Vector3.new(3.1, 0.4, 3.1), base * CFrame.new(0, 4.2, 0), Color3.fromRGB(60, 40, 20), M.SmoothPlastic, Enum.PartType.Cylinder).CFrame = base * CFrame.new(0, 4.2, 0) * CFrame.Angles(0, 0, math.pi / 2)
	local p = Instance.new("ParticleEmitter")
	p.Color = ColorSequence.new(Color3.fromRGB(255, 220, 40))
	p.Size = NumberSequence.new(0.15)
	p.Rate = 6
	p.Lifetime = NumberRange.new(1.5)
	p.Speed = NumberRange.new(1.5)
	p.SpreadAngle = Vector2.new(180, 180)
	p.Parent = m.PrimaryPart
end

BUILDERS.BoneHeap = function(m, base, rng, def)
	for _ = 1, 6 do
		part(m, Vector3.new(0.5, 0.5, rng:NextNumber(2, 3.5)), base * CFrame.new(rng:NextNumber(-1.5, 1.5), 0.4, rng:NextNumber(-1.5, 1.5)) * CFrame.Angles(0, rng:NextNumber(0, 3), rng:NextNumber(-0.3, 0.3)), def.color, M.SmoothPlastic)
	end
	part(m, Vector3.new(1.6, 1.4, 1.8), base * CFrame.new(0, 1, 0), def.color, M.SmoothPlastic)
end

function NodeFactory.Build(nodeType: string, position: Vector3, rng: Random): Model
	local def = Nodes.List[nodeType]
	local m = Instance.new("Model")
	m.Name = nodeType
	local base = CFrame.new(position) * CFrame.Angles(0, rng:NextNumber(0, math.pi * 2), 0)
	local builder = BUILDERS[nodeType] or BUILDERS.Rock
	builder(m, base, rng, def)
	m:SetAttribute("NodeType", nodeType)
	m:SetAttribute("HP", def.hp)
	m:SetAttribute("MaxHP", def.hp)
	return m
end

return NodeFactory
