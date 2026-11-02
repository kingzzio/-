-- Voxel-style harvestable nodes: everything is built from chunky studded blocks
-- (cube-canopy trees, snowy pine tiers, red ember trees, blocky rocks, glowing
-- ore cubes with floating name tags). position = top of the ground block.

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Nodes = require(Shared.Nodes)
local Items = require(Shared.Items)

local NodeFactory = {}
local M = Enum.Material
local C = Color3.fromRGB

local function shade(c: Color3, amt: number): Color3
	local h, s, v = c:ToHSV()
	return Color3.fromHSV(h, s, math.clamp(v + amt, 0, 1))
end

-- one studded block, positioned by its bottom-centre
local function B(model: Model, size: Vector3, base: CFrame, offset: Vector3, color: Color3, material: Enum.Material?): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = size
	p.CFrame = base * CFrame.new(offset + Vector3.new(0, size.Y / 2, 0))
	p.Color = color
	p.Material = material or M.Plastic
	p.TopSurface = Enum.SurfaceType.Studs
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	if not model.PrimaryPart then
		model.PrimaryPart = p
	end
	return p
end

local function nameTag(model: Model, nodeType: string, height: number)
	local def = Nodes.List[nodeType]
	local drop = def.drops[1][1]
	local item = Items.Get(drop)
	if not item then
		return
	end
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset(150, 44)
	bb.StudsOffset = Vector3.new(0, height + 2, 0)
	bb.MaxDistance = 90
	bb.LightInfluence = 0
	local function line(text: string, color: Color3, y: number, h: number)
		local t = Instance.new("TextLabel")
		t.BackgroundTransparency = 1
		t.Position = UDim2.fromScale(0, y)
		t.Size = UDim2.fromScale(1, h)
		t.Font = Enum.Font.LuckiestGuy
		t.TextScaled = true
		t.TextColor3 = color
		t.Text = text
		local s = Instance.new("UIStroke")
		s.Thickness = 2
		s.Color = C(20, 15, 30)
		s.Parent = t
		t.Parent = bb
	end
	line(string.upper(item.name), Color3.new(1, 1, 1), 0, 0.58)
	line(string.upper(item.rarity), Items.Rarity[item.rarity] or Color3.new(1, 1, 1), 0.58, 0.42)
	bb.Parent = model.PrimaryPart
end

local BUILD = {}

-- Round voxel tree: trunk + 2 tiers of cube canopy in two greens.
BUILD.Tree = function(m, base, rng, def)
	local trunkH = rng:NextInteger(3, 5) * 2
	local bark = C(120, 82, 50)
	B(m, Vector3.new(2, trunkH, 2), base, Vector3.zero, bark)
	local leaf = rng:NextNumber() < 0.5 and C(92, 190, 70) or C(80, 172, 64)
	local s = rng:NextInteger(3, 4) * 2
	B(m, Vector3.new(s + 2, 4, s + 2), base, Vector3.new(0, trunkH, 0), leaf)
	B(m, Vector3.new(s, 3, s), base, Vector3.new(0, trunkH + 4, 0), shade(leaf, 0.06))
	B(m, Vector3.new(s - 2, 2, s - 2), base, Vector3.new(0, trunkH + 7, 0), shade(leaf, 0.1))
	for _ = 1, 3 do
		local o = Vector3.new(rng:NextInteger(-1, 1) * (s / 2 + 1), trunkH + rng:NextInteger(0, 3), rng:NextInteger(-1, 1) * (s / 2 + 1))
		B(m, Vector3.new(2, 2, 2), base, o, shade(leaf, -0.06))
	end
end

-- Pine: stacked square tiers with snow caps (frosty biome look).
BUILD.PineTree = function(m, base, rng, def)
	local trunkH = 4
	B(m, Vector3.new(2, trunkH + 10, 2), base, Vector3.zero, C(96, 66, 44))
	local green = C(46, 118, 74)
	local y = trunkH
	for i, w in { 10, 8, 6, 4, 2 } do
		B(m, Vector3.new(w, 2.4, w), base * CFrame.Angles(0, (i % 2) * math.rad(45), 0), Vector3.new(0, y, 0), shade(green, i * 0.02))
		B(m, Vector3.new(w - 1, 0.6, w - 1), base * CFrame.Angles(0, (i % 2) * math.rad(45), 0), Vector3.new(0, y + 2.4, 0), C(246, 250, 255))
		y += 3
	end
end

-- Ember tree: dark trunk with blazing red/orange cube canopy (Ashlands).
BUILD.EmberTree = function(m, base, rng, def)
	local trunkH = rng:NextInteger(3, 5) * 2
	B(m, Vector3.new(2, trunkH, 2), base, Vector3.zero, C(50, 38, 36))
	local reds = { C(214, 52, 40), C(236, 92, 44), C(184, 36, 34) }
	for i = 1, 6 do
		local w = rng:NextInteger(2, 4) * 2
		B(m, Vector3.new(w, w * 0.7, w), base, Vector3.new(rng:NextInteger(-2, 2), trunkH + rng:NextInteger(0, 4), rng:NextInteger(-2, 2)), reds[(i % 3) + 1])
	end
	local ember = B(m, Vector3.new(1, 1, 1), base, Vector3.new(0, trunkH + 3, 0), C(255, 150, 60), M.Neon)
	local fire = Instance.new("ParticleEmitter")
	fire.Color = ColorSequence.new(C(255, 160, 60), C(255, 60, 30))
	fire.Size = NumberSequence.new(0.3, 0)
	fire.Rate = 5
	fire.Lifetime = NumberRange.new(2)
	fire.Speed = NumberRange.new(2)
	fire.SpreadAngle = Vector2.new(180, 180)
	fire.LightEmission = 1
	fire.Parent = ember
end

BUILD.PalmTree = function(m, base, rng, def)
	local trunk = C(176, 132, 86)
	for i = 0, 5 do
		B(m, Vector3.new(1.6, 2, 1.6), base, Vector3.new(i * 0.3, i * 2, 0), i % 2 == 0 and trunk or shade(trunk, -0.08))
	end
	local top = Vector3.new(1.8, 12, 0)
	B(m, Vector3.new(2, 1.4, 2), base, top, C(120, 90, 50))
	for k = 0, 3 do
		local a = k * math.pi / 2
		B(m, Vector3.new(6, 0.8, 2), base * CFrame.Angles(0, a, 0), (CFrame.Angles(0, -a, 0) * top) + Vector3.new(3.4, 0.8, 0), C(100, 186, 74))
	end
end

BUILD.DeadTree = function(m, base, rng, def)
	B(m, Vector3.new(1.6, 9, 1.6), base, Vector3.zero, def.color)
	B(m, Vector3.new(4, 1, 1), base, Vector3.new(1.5, 6, 0), def.color)
	B(m, Vector3.new(1, 1, 3.5), base, Vector3.new(0, 4, -1.2), def.color)
	B(m, Vector3.new(2, 1.4, 2), base, Vector3.new(2.6, 7, 0), C(80, 110, 60))
end

BUILD.Cactus = function(m, base, rng, def)
	local h = rng:NextInteger(3, 5) * 2
	B(m, Vector3.new(2, h, 2), base, Vector3.zero, def.color)
	B(m, Vector3.new(2, 1.2, 1.2), base, Vector3.new(1.6, h * 0.45, 0), def.color)
	B(m, Vector3.new(1.2, 3, 1.2), base, Vector3.new(2.2, h * 0.45 + 1.2, 0), def.color)
	B(m, Vector3.new(0.8, 0.8, 0.8), base, Vector3.new(0, h, 0), C(255, 120, 160))
end

local function rockPile(m, base, rng, color)
	B(m, Vector3.new(5, 3, 4), base, Vector3.zero, color)
	B(m, Vector3.new(3, 2, 3), base, Vector3.new(rng:NextInteger(-1, 1), 3, 0), shade(color, 0.06))
	B(m, Vector3.new(2, 2, 2), base, Vector3.new(2.5, 0, 2), shade(color, -0.05))
end

BUILD.Rock = function(m, base, rng, def)
	rockPile(m, base, rng, C(140, 142, 150))
end

local function vein(m, base, rng, def)
	rockPile(m, base, rng, C(118, 120, 128))
	for _, o in { Vector3.new(-1.6, 1.2, -1.6), Vector3.new(1.4, 2.2, -1.2), Vector3.new(0.4, 4.2, 0.6), Vector3.new(1.8, 0.6, 1.6) } do
		B(m, Vector3.new(1.4, 1.4, 1.4), base, o, def.color, M.Plastic)
	end
end
BUILD.CopperVein = vein
BUILD.IronVein = vein
BUILD.GoldVein = vein

-- Glowing gem blocks: stacked neon cubes + light (the "COSMIC SHARD" look).
local function gem(m, base, rng, def)
	local big = def.big and 1.5 or 1
	B(m, Vector3.new(5, 1.4, 5) * Vector3.new(big, 1, big), base, Vector3.zero, C(70, 66, 82))
	for i = 1, 5 do
		local s = (rng:NextInteger(2, 4)) * big
		B(m, Vector3.new(s * 0.7, s, s * 0.7), base * CFrame.Angles(0, rng:NextNumber(0, 1.5), 0), Vector3.new(rng:NextInteger(-1, 1) * big, 1.4, rng:NextInteger(-1, 1) * big), shade(def.color, rng:NextNumber(-0.05, 0.08)), i == 1 and M.Neon or M.Glass)
	end
	local light = Instance.new("PointLight")
	light.Color = def.color
	light.Range = 18
	light.Brightness = 2
	light.Parent = m.PrimaryPart
	local sparkle = Instance.new("ParticleEmitter")
	sparkle.Color = ColorSequence.new(def.color)
	sparkle.LightEmission = 1
	sparkle.Size = NumberSequence.new(0.35, 0)
	sparkle.Rate = 4
	sparkle.Lifetime = NumberRange.new(1.5)
	sparkle.Speed = NumberRange.new(1.5)
	sparkle.SpreadAngle = Vector2.new(180, 180)
	sparkle.Parent = m.PrimaryPart
end
BUILD.FrostCrystal = gem
BUILD.EmeraldCrystal = gem
BUILD.SunstoneCrystal = gem
BUILD.ObsidianSpire = function(m, base, rng, def)
	for i = 1, 3 do
		local h = rng:NextInteger(3, 6) * 2
		B(m, Vector3.new(1.8, h, 1.8), base, Vector3.new((i - 2) * 1.6, 0, rng:NextInteger(-1, 1)), i == 2 and C(130, 60, 200) or def.color, i == 2 and M.Neon or M.Glass)
	end
end

BUILD.Meteorite = function(m, base, rng, def)
	B(m, Vector3.new(7, 5, 7), base, Vector3.zero, C(42, 34, 50))
	B(m, Vector3.new(5, 3, 5), base * CFrame.Angles(0, 0.6, 0), Vector3.new(0, 5, 0), C(56, 44, 66))
	for _, o in { Vector3.new(-3, 1, 0), Vector3.new(3, 2, 1), Vector3.new(0, 7.6, 0), Vector3.new(1, 3, -3) } do
		B(m, Vector3.new(1.6, 1.6, 1.6), base, o, def.color, M.Neon)
	end
	local light = Instance.new("PointLight")
	light.Color = def.color
	light.Range = 34
	light.Brightness = 3
	light.Parent = m.PrimaryPart
	local fire = Instance.new("Fire")
	fire.Color = def.color
	fire.SecondaryColor = Color3.new(1, 1, 1)
	fire.Size = 6
	fire.Parent = m.PrimaryPart
end

BUILD.ClayDeposit = function(m, base, rng, def)
	B(m, Vector3.new(6, 1.2, 5), base, Vector3.zero, def.color)
	B(m, Vector3.new(3, 1.2, 3), base, Vector3.new(1, 1.2, 0), shade(def.color, 0.06))
end

BUILD.Reeds = function(m, base, rng, def)
	for _ = 1, 5 do
		local h = rng:NextInteger(2, 4)
		local p = B(m, Vector3.new(0.6, h, 0.6), base, Vector3.new(rng:NextNumber(-1.4, 1.4), 0, rng:NextNumber(-1.4, 1.4)), shade(def.color, rng:NextNumber(-0.08, 0.05)))
		p.CanCollide = false
	end
end

BUILD.BerryBush = function(m, base, rng, def)
	B(m, Vector3.new(4, 3, 4), base, Vector3.zero, C(70, 150, 66))
	B(m, Vector3.new(2.6, 1.4, 2.6), base, Vector3.new(0, 3, 0), C(82, 166, 74))
	for _, o in { Vector3.new(-2, 1.5, 0), Vector3.new(2, 2, 1), Vector3.new(0, 2.4, -2), Vector3.new(1, 3.6, 0) } do
		local berry = B(m, Vector3.new(0.9, 0.9, 0.9), base, o, C(110, 60, 200))
		berry.CanCollide = false
	end
end

BUILD.BeeNest = function(m, base, rng, def)
	B(m, Vector3.new(2, 3, 2), base, Vector3.zero, C(110, 76, 48))
	B(m, Vector3.new(3.2, 1.2, 3.2), base, Vector3.new(0, 3, 0), def.color)
	B(m, Vector3.new(3.4, 0.6, 3.4), base, Vector3.new(0, 4.2, 0), C(70, 46, 24))
	B(m, Vector3.new(3.2, 1.2, 3.2), base, Vector3.new(0, 4.8, 0), def.color)
	local bees = Instance.new("ParticleEmitter")
	bees.Color = ColorSequence.new(C(255, 220, 40))
	bees.Size = NumberSequence.new(0.2)
	bees.Rate = 6
	bees.Lifetime = NumberRange.new(1.5)
	bees.Speed = NumberRange.new(1.5)
	bees.SpreadAngle = Vector2.new(180, 180)
	bees.Parent = m.PrimaryPart
end

BUILD.BoneHeap = function(m, base, rng, def)
	B(m, Vector3.new(4, 1, 1), base, Vector3.zero, def.color)
	B(m, Vector3.new(1, 1, 3.5), base * CFrame.Angles(0, 0.5, 0), Vector3.new(0, 1, 0), def.color)
	B(m, Vector3.new(1.8, 1.6, 1.8), base, Vector3.new(1.4, 0, 1.4), def.color)
	B(m, Vector3.new(0.5, 0.5, 0.2), base, Vector3.new(1.2, 0.8, 0.45), C(30, 30, 30))
end

local TAGGED = {
	CopperVein = true, IronVein = true, GoldVein = true, FrostCrystal = true, EmeraldCrystal = true,
	SunstoneCrystal = true, ObsidianSpire = true, Meteorite = true,
}

function NodeFactory.Build(nodeType: string, position: Vector3, rng: Random): Model
	local def = Nodes.List[nodeType]
	local m = Instance.new("Model")
	m.Name = nodeType
	local base = CFrame.new(position) * CFrame.Angles(0, rng:NextInteger(0, 3) * math.pi / 2, 0)
	local builder = BUILD[nodeType] or BUILD.Rock
	builder(m, base, rng, def)
	if TAGGED[nodeType] then
		local _, size = m:GetBoundingBox()
		nameTag(m, nodeType, size.Y)
	end
	m:SetAttribute("NodeType", nodeType)
	m:SetAttribute("HP", def.hp)
	m:SetAttribute("MaxHP", def.hp)
	return m
end

return NodeFactory
