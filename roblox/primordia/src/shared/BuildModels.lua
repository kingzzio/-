-- Detailed low-poly models for every buildable (palisades, crenellated stone,
-- riveted iron, hex honeycomb, catapults on wheels, fenced farm plots…).
--
-- The "Main" part stays the hitbox/collider and is hidden when a model draws its
-- own detail. Parts named "Trim" are recoloured in the owner's faction colour
-- (the purple compound walls from the trailer become YOUR colour).

local BuildModels = {}

local M = Enum.Material
local C = Color3.fromRGB
local DEFAULT_TRIM = C(150, 70, 255)

local WOOD = C(150, 100, 60)
local WOOD_DARK = C(105, 70, 42)
local IRON = C(80, 82, 90)
local GOLD = C(255, 200, 60)

local function P(model: Model, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material?, opts: { [string]: any }?): BasePart
	local p: BasePart
	if opts and opts.class then
		p = Instance.new(opts.class) :: BasePart
	else
		p = Instance.new("Part")
	end
	p.Anchored = true
	p.CanCollide = opts ~= nil and opts.collide == true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or M.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if opts then
		if opts.shape and p:IsA("Part") then
			p.Shape = opts.shape
		end
		if opts.name then
			p.Name = opts.name
		end
		if opts.transparency then
			p.Transparency = opts.transparency
		end
	end
	p.Parent = model
	return p
end

local function jitter(c: Color3, amt: number): Color3
	local h, s, v = c:ToHSV()
	return Color3.fromHSV(h, s, math.clamp(v + (math.random() - 0.5) * amt, 0, 1))
end

local CYL_UP = CFrame.Angles(0, 0, math.pi / 2) -- turns a Cylinder (X-axis) upright
local CYL_Z = CFrame.Angles(0, math.pi / 2, 0) -- cylinder along Z

local B = {}

---------------------------------------------------------------------------
-- WALLS
---------------------------------------------------------------------------
B.ThatchWall = function(m, cf, sz)
	for i = 0, 5 do
		local x = -sz.X / 2 + 0.7 + i * 1.32
		P(m, Vector3.new(sz.Y, 1.5, 1.5), cf * CFrame.new(x, 0, 0) * CYL_UP, jitter(C(215, 190, 110), 0.12), M.Grass, { shape = Enum.PartType.Cylinder })
		P(m, Vector3.new(0.9, 0.9, 0.9), cf * CFrame.new(x, sz.Y / 2 + 0.2, 0) * CFrame.Angles(0, 0, math.rad(45)), C(200, 175, 95), M.Grass)
	end
	for _, y in { -2, 2 } do
		P(m, Vector3.new(sz.X + 0.2, 0.35, 1.7), cf * CFrame.new(0, y, 0), C(120, 90, 50), M.Fabric)
	end
	return true
end

-- Palisade: sharpened logs + back braces (the trailer's wooden fort walls).
B.WoodWall = function(m, cf, sz)
	local n = 6
	local w = sz.X / n
	for i = 0, n - 1 do
		local x = -sz.X / 2 + w / 2 + i * w
		local h = sz.Y - 1 + (i % 2) * 0.4
		P(m, Vector3.new(h, w * 0.98, w * 0.98), cf * CFrame.new(x, -sz.Y / 2 + h / 2, 0) * CYL_UP, jitter(WOOD, 0.1), M.Wood, { shape = Enum.PartType.Cylinder })
		P(m, Vector3.new(w * 0.7, w * 0.7, w * 0.7), cf * CFrame.new(x, -sz.Y / 2 + h + 0.15, 0) * CFrame.Angles(0, 0, math.rad(45)), C(180, 135, 90), M.Wood)
	end
	for _, y in { -1.8, 1.6 } do
		P(m, Vector3.new(sz.X, 0.7, 0.5), cf * CFrame.new(0, y, sz.Z / 2 + 0.45), WOOD_DARK, M.WoodPlanks)
	end
	P(m, Vector3.new(sz.X * 0.25, 0.4, 0.15), cf * CFrame.new(0, 2.6, -sz.Z / 2 - 0.45), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	return true
end

-- Stone: offset brick courses, crenellations (merlons) and a faction trim band.
B.StoneWall = function(m, cf, sz)
	local rows = 5
	local rh = (sz.Y - 1.4) / rows
	for r = 0, rows - 1 do
		local y = -sz.Y / 2 + rh / 2 + r * rh
		local x = -sz.X / 2
		local remaining = sz.X
		local bw = (r % 2 == 1) and 1 or 2
		while remaining > 0.01 do
			bw = math.min(bw, remaining)
			P(m, Vector3.new(bw - 0.08, rh - 0.08, sz.Z), cf * CFrame.new(x + bw / 2, y, 0), jitter(C(140, 140, 148), 0.1), M.Cobblestone)
			x += bw
			remaining -= bw
			bw = 2
		end
	end
	P(m, Vector3.new(sz.X + 0.1, 0.45, sz.Z + 0.1), cf * CFrame.new(0, sz.Y / 2 - 1.4 - 0.2, 0), DEFAULT_TRIM, M.SmoothPlastic, { name = "Trim" })
	for _, x in { -3, 0, 3 } do
		P(m, Vector3.new(1.7, 1.4, sz.Z + 0.1), cf * CFrame.new(x, sz.Y / 2 - 0.7, 0), C(150, 150, 158), M.Cobblestone)
	end
	return true
end

-- Iron: riveted plates, top spikes, faction stripe.
B.MetalWall = function(m, cf, sz)
	for _, y in { -sz.Y / 4, sz.Y / 4 } do
		P(m, Vector3.new(sz.X - 0.2, sz.Y / 2 - 0.15, sz.Z), cf * CFrame.new(0, y, 0), C(160, 162, 172), M.DiamondPlate)
	end
	for _, x in { -sz.X / 2 + 0.25, sz.X / 2 - 0.25 } do
		P(m, Vector3.new(0.5, sz.Y, sz.Z + 0.2), cf * CFrame.new(x, 0, 0), IRON, M.Metal)
	end
	P(m, Vector3.new(sz.X, 0.6, sz.Z + 0.2), cf * CFrame.new(0, 0, 0), DEFAULT_TRIM, M.Metal, { name = "Trim" })
	for i = -1, 1 do
		for _, y in { -3, 3 } do
			for _, z in { -1, 1 } do
				P(m, Vector3.new(0.35, 0.35, 0.35), cf * CFrame.new(i * 2.8, y, z * (sz.Z / 2 + 0.05)), C(60, 60, 66), M.Metal, { shape = Enum.PartType.Ball })
			end
		end
	end
	for i = 0, 4 do
		P(m, Vector3.new(0.45, 1.2, 0.45), cf * CFrame.new(-3.2 + i * 1.6, sz.Y / 2 + 0.6, 0) * CFrame.Angles(0, math.rad(45), 0), IRON, M.Metal)
	end
	return true
end

-- Honeycomb: real hexagon cells (3 rotated slabs each) over a dark comb backing.
B.HoneycombWall = function(m, cf, sz)
	P(m, Vector3.new(sz.X, sz.Y, sz.Z * 0.55), cf, C(150, 85, 15), M.SmoothPlastic)
	local s = 1.45
	local colStep, rowStep = 1.5 * s, math.sqrt(3) * s
	local col = 0
	local x = -sz.X / 2 + s
	while x <= sz.X / 2 - s * 0.7 do
		local yOff = (col % 2 == 1) and rowStep / 2 or 0
		local y = -sz.Y / 2 + rowStep / 2 + yOff
		while y <= sz.Y / 2 - rowStep / 2 + 0.01 do
			local c = jitter(C(255, 180, 35), 0.12)
			for k = 0, 2 do
				P(m, Vector3.new(s * 0.88, math.sqrt(3) * s * 0.88, sz.Z), cf * CFrame.new(x, y, 0) * CFrame.Angles(0, 0, math.rad(60 * k)), c, M.Foil)
			end
			y += rowStep
		end
		x += colStep
		col += 1
	end
	P(m, Vector3.new(sz.X + 0.1, 0.4, sz.Z + 0.1), cf * CFrame.new(0, sz.Y / 2 - 0.2, 0), DEFAULT_TRIM, M.SmoothPlastic, { name = "Trim" })
	return true
end

B.WoodFloor = function(m, cf, sz)
	local n = 4
	for i = 0, n - 1 do
		P(m, Vector3.new(sz.X, sz.Y, sz.Z / n - 0.12), cf * CFrame.new(0, 0, -sz.Z / 2 + (i + 0.5) * sz.Z / n), jitter(C(175, 125, 78), 0.1), M.WoodPlanks)
	end
	return true
end

B.WoodDoor = function(m, cf, sz)
	for _, x in { -0.98, 0.98 } do
		P(m, Vector3.new(1.94, sz.Y, sz.Z), cf * CFrame.new(x, 0, 0), jitter(C(140, 92, 52), 0.08), M.WoodPlanks)
	end
	for _, y in { -2.6, 2.6 } do
		P(m, Vector3.new(sz.X + 0.1, 0.45, sz.Z + 0.15), cf * CFrame.new(0, y, 0), IRON, M.Metal)
	end
	P(m, Vector3.new(0.5, 0.5, 0.5), cf * CFrame.new(1.4, 0, -sz.Z / 2 - 0.2), GOLD, M.Metal, { shape = Enum.PartType.Ball })
	return true
end

B.IronGate = function(m, cf, sz)
	P(m, Vector3.new(sz.X, 0.8, sz.Z + 0.3), cf * CFrame.new(0, sz.Y / 2 - 0.4, 0), DEFAULT_TRIM, M.Metal, { name = "Trim" })
	for i = 0, 7 do
		P(m, Vector3.new(0.45, sz.Y - 0.8, 0.45), cf * CFrame.new(-sz.X / 2 + 0.5 + i * 1, -0.4, 0), C(120, 122, 130), M.CorrodedMetal)
		P(m, Vector3.new(0.4, 0.8, 0.4), cf * CFrame.new(-sz.X / 2 + 0.5 + i * 1, -sz.Y / 2 - 0.2, 0) * CFrame.Angles(0, math.rad(45), 0), IRON, M.Metal)
	end
	for _, y in { -2, 1.2 } do
		P(m, Vector3.new(sz.X, 0.45, 0.55), cf * CFrame.new(0, y, 0), C(110, 112, 120), M.CorrodedMetal)
	end
	return true
end

B.Watchtower = function(m, cf, sz, main)
	main.CanCollide = false
	local h = sz.Y
	for _, x in { -2.5, 2.5 } do
		for _, z in { -2.5, 2.5 } do
			P(m, Vector3.new(h, 1.1, 1.1), cf * CFrame.new(x, 0, z) * CYL_UP, jitter(WOOD, 0.08), M.Wood, { shape = Enum.PartType.Cylinder, collide = true })
		end
	end
	for _, y in { -h / 4, h / 8 } do
		for _, side in { -2.5, 2.5 } do
			P(m, Vector3.new(0.4, 7, 0.4), cf * CFrame.new(0, y, side) * CFrame.Angles(0, 0, math.rad(45)), WOOD_DARK, M.Wood)
			P(m, Vector3.new(0.4, 7, 0.4), cf * CFrame.new(side, y, 0) * CFrame.Angles(math.rad(45), 0, 0), WOOD_DARK, M.Wood)
		end
	end
	P(m, Vector3.new(10, 1, 10), cf * CFrame.new(0, h / 2, 0), C(170, 120, 75), M.WoodPlanks, { collide = true })
	for i = -2, 2 do
		for _, side in { -1, 1 } do
			P(m, Vector3.new(1.2, 2, 0.5), cf * CFrame.new(i * 2, h / 2 + 1.5, side * 4.75), WOOD, M.WoodPlanks, { collide = true })
			P(m, Vector3.new(0.5, 2, 1.2), cf * CFrame.new(side * 4.75, h / 2 + 1.5, i * 2), WOOD, M.WoodPlanks, { collide = true })
		end
	end
	for _, x in { -4.5, 4.5 } do
		for _, z in { -4.5, 4.5 } do
			P(m, Vector3.new(0.5, 6, 0.5), cf * CFrame.new(x, h / 2 + 3.5, z), WOOD_DARK, M.Wood)
		end
	end
	P(m, Vector3.new(11, 0.6, 11), cf * CFrame.new(0, h / 2 + 6.6, 0), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	P(m, Vector3.new(7, 0.6, 7), cf * CFrame.new(0, h / 2 + 7.2, 0) * CFrame.Angles(0, math.rad(45), 0), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	-- climbable ladder
	P(m, Vector3.new(2, h, 2), cf * CFrame.new(0, 0, 4), WOOD, M.Wood, { class = "TrussPart", collide = true })
	return true
end

---------------------------------------------------------------------------
-- STATIONS
---------------------------------------------------------------------------
B.Workbench = function(m, cf, sz)
	P(m, Vector3.new(sz.X, 0.6, sz.Z), cf * CFrame.new(0, sz.Y / 2 - 0.3, 0), C(170, 120, 75), M.WoodPlanks)
	for _, x in { -2.6, 2.6 } do
		for _, z in { -1.1, 1.1 } do
			P(m, Vector3.new(0.5, sz.Y - 0.6, 0.5), cf * CFrame.new(x, -0.3, z), WOOD_DARK, M.Wood)
		end
	end
	P(m, Vector3.new(0.3, 0.3, 1.6), cf * CFrame.new(-1, sz.Y / 2 + 0.15, 0), WOOD_DARK, M.Wood)
	P(m, Vector3.new(0.7, 0.5, 0.5), cf * CFrame.new(-1, sz.Y / 2 + 0.25, -0.7), IRON, M.Metal)
	P(m, Vector3.new(1.8, 0.1, 0.8), cf * CFrame.new(1.2, sz.Y / 2 + 0.05, 0), C(200, 200, 205), M.Metal)
	P(m, Vector3.new(1.2, 0.4, 1.2), cf * CFrame.new(2.1, sz.Y / 2 + 0.2, 0.6), C(220, 200, 160), M.Wood)
	return true
end

B.Forge = function(m, cf, sz)
	P(m, sz, cf, C(95, 95, 100), M.Cobblestone)
	P(m, Vector3.new(2.6, 2, 0.3), cf * CFrame.new(0, -0.6, -sz.Z / 2 - 0.05), C(15, 10, 10), M.SmoothPlastic)
	local glow = P(m, Vector3.new(2.2, 1.2, 0.2), cf * CFrame.new(0, -0.9, -sz.Z / 2 - 0.1), C(255, 120, 30), M.Neon)
	local f = Instance.new("Fire")
	f.Heat = 6
	f.Size = 3
	f.Parent = glow
	P(m, Vector3.new(1.6, 4, 1.6), cf * CFrame.new(1.2, sz.Y / 2 + 2, 1.2), C(80, 80, 85), M.Brick)
	local smoke = Instance.new("Smoke")
	smoke.Opacity = 0.15
	smoke.RiseVelocity = 4
	smoke.Size = 2
	smoke.Parent = P(m, Vector3.new(1, 0.2, 1), cf * CFrame.new(1.2, sz.Y / 2 + 4.1, 1.2), C(30, 30, 30), M.SmoothPlastic)
	P(m, Vector3.new(1.6, 1, 1), cf * CFrame.new(-3.4, -sz.Y / 2 + 1.2, 0), IRON, M.Metal) -- anvil
	return true
end

B.SiegeWorkshop = function(m, cf, sz)
	for _, x in { -4.6, 4.6 } do
		for _, z in { -3.6, 3.6 } do
			P(m, Vector3.new(0.7, sz.Y, 0.7), cf * CFrame.new(x, 0, z), WOOD_DARK, M.Wood)
		end
	end
	P(m, Vector3.new(sz.X + 1, 0.5, sz.Z / 2 + 1.4), cf * CFrame.new(0, sz.Y / 2 + 0.9, -sz.Z / 4 - 0.3) * CFrame.Angles(math.rad(18), 0, 0), C(120, 70, 45), M.WoodPlanks)
	P(m, Vector3.new(sz.X + 1, 0.5, sz.Z / 2 + 1.4), cf * CFrame.new(0, sz.Y / 2 + 0.9, sz.Z / 4 + 0.3) * CFrame.Angles(math.rad(-18), 0, 0), C(120, 70, 45), M.WoodPlanks)
	P(m, Vector3.new(sz.X, 0.4, sz.Z), cf * CFrame.new(0, -sz.Y / 2 + 0.2, 0), C(150, 110, 70), M.WoodPlanks)
	for i = 0, 2 do
		P(m, Vector3.new(6, 1, 1), cf * CFrame.new(-1.5, -sz.Y / 2 + 0.9 + i * 0.95, 2.4 - (i % 2) * 0.3) * CYL_Z * CFrame.Angles(0, math.pi / 2, 0), jitter(WOOD, 0.1), M.Wood, { shape = Enum.PartType.Cylinder })
	end
	P(m, Vector3.new(1.2, 4, 1.2), cf * CFrame.new(3, -sz.Y / 2 + 2, -2), C(90, 60, 40), M.Wood)
	P(m, Vector3.new(3, 0.3, 3), cf * CFrame.new(0, sz.Y / 2 - 0.4, 0), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	return true
end

B.Vault = function(m, cf, sz)
	P(m, sz, cf, C(105, 108, 118), M.DiamondPlate)
	P(m, Vector3.new(0.3, 2.4, 2.4), cf * CFrame.new(0, 0, -sz.Z / 2 - 0.1) * CFrame.Angles(0, math.pi / 2, 0), C(70, 72, 80), M.Metal, { shape = Enum.PartType.Cylinder })
	for k = 0, 2 do
		P(m, Vector3.new(2, 0.2, 0.2), cf * CFrame.new(0, 0, -sz.Z / 2 - 0.3) * CFrame.Angles(0, 0, math.rad(60 * k)), GOLD, M.Metal)
	end
	for _, y in { -sz.Y / 2 + 0.1, sz.Y / 2 - 0.1 } do
		P(m, Vector3.new(sz.X + 0.15, 0.25, sz.Z + 0.15), cf * CFrame.new(0, y, 0), GOLD, M.Metal)
	end
	return true
end

---------------------------------------------------------------------------
-- FACTION TOTEM — carved stack, wings in banner colour, glowing crystal.
---------------------------------------------------------------------------
B.Totem = function(m, cf, sz)
	local base = -sz.Y / 2
	P(m, Vector3.new(6, 1.2, 6), cf * CFrame.new(0, base + 0.6, 0), C(100, 100, 108), M.Slate)
	P(m, Vector3.new(4.4, 0.8, 4.4), cf * CFrame.new(0, base + 1.6, 0) * CFrame.Angles(0, math.rad(45), 0), C(120, 120, 128), M.Slate)
	local y = base + 2
	for i = 0, 2 do
		local col = i % 2 == 0 and C(140, 95, 55) or C(110, 110, 118)
		local block = P(m, Vector3.new(3, 3, 3), cf * CFrame.new(0, y + 1.5, 0), col, i % 2 == 0 and M.Wood or M.Slate)
		-- carved face
		for _, ex in { -0.7, 0.7 } do
			P(m, Vector3.new(0.6, 0.5, 0.15), block.CFrame * CFrame.new(ex, 0.5, -1.55), C(20, 20, 20), M.SmoothPlastic)
		end
		P(m, Vector3.new(1.6, 0.35, 0.15), block.CFrame * CFrame.new(0, -0.6, -1.55), C(20, 20, 20), M.SmoothPlastic)
		y += 3
	end
	for _, side in { -1, 1 } do
		P(m, Vector3.new(3.2, 1.2, 0.5), cf * CFrame.new(side * 2.6, y - 1.5, 0) * CFrame.Angles(0, 0, side * math.rad(25)), DEFAULT_TRIM, M.SmoothPlastic, { name = "Trim" })
		P(m, Vector3.new(2.2, 0.9, 0.4), cf * CFrame.new(side * 3.9, y - 0.4, 0) * CFrame.Angles(0, 0, side * math.rad(50)), DEFAULT_TRIM, M.SmoothPlastic, { name = "Trim" })
	end
	P(m, Vector3.new(1.8, 1.8, 1.8), cf * CFrame.new(0, y + 1.4, 0) * CFrame.Angles(math.rad(45), math.rad(45), 0), DEFAULT_TRIM, M.Neon, { name = "Trim" })
	P(m, Vector3.new(3.4, 5, 0.25), cf * CFrame.new(0, base + 6.5, -1.7), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	return true
end

---------------------------------------------------------------------------
-- TRAPS
---------------------------------------------------------------------------
B.Spikes = function(m, cf, sz)
	P(m, Vector3.new(sz.X, 0.3, sz.Z), cf * CFrame.new(0, -sz.Y / 2 + 0.15, 0), C(120, 90, 55), M.WoodPlanks)
	for i = -1, 1 do
		for j = -1, 1 do
			local stake = cf * CFrame.new(i * 2.6, 0.6, j * 2.6) * CFrame.Angles(math.rad(math.random(-15, 15)), 0, math.rad(math.random(-15, 15)))
			P(m, Vector3.new(0.45, 2.4, 0.45), stake, C(170, 130, 85), M.Wood)
			P(m, Vector3.new(0.35, 0.35, 0.35), stake * CFrame.new(0, 1.25, 0) * CFrame.Angles(math.rad(45), 0, math.rad(45)), C(220, 220, 225), M.Metal)
		end
	end
	return true
end

B.TarPit = function(m, cf, sz, main)
	main.Transparency = 0
	main.Material = M.Glass
	main.Color = C(18, 16, 14)
	for _ = 1, 5 do
		P(m, Vector3.new(0.8, 0.8, 0.8), cf * CFrame.new(math.random(-30, 30) / 10, 0.2, math.random(-30, 30) / 10), C(35, 30, 25), M.Glass, { shape = Enum.PartType.Ball })
	end
	return false
end

-- Looks exactly like a real ruin chest.
B.DecoyChest = function(m, cf, sz)
	P(m, Vector3.new(4, 2.2, 2.6), cf * CFrame.new(0, -0.4, 0), C(120, 80, 40), M.WoodPlanks)
	local lid = P(m, Vector3.new(4.2, 0.8, 2.8), cf * CFrame.new(0, 1.1, 0), C(200, 160, 50), M.Metal)
	local s = Instance.new("Sparkles")
	s.SparkleColor = C(255, 220, 120)
	s.Parent = lid
	local l = Instance.new("PointLight")
	l.Color = C(255, 210, 90)
	l.Range = 14
	l.Parent = lid
	return true
end

---------------------------------------------------------------------------
-- FARMING
---------------------------------------------------------------------------
B.FarmPlot = function(m, cf, sz, main)
	main.Transparency = 0
	main.Material = M.Ground
	main.Color = C(95, 62, 38)
	for i = -1, 1 do
		P(m, Vector3.new(sz.X - 0.6, 0.25, 0.9), cf * CFrame.new(0, sz.Y / 2 + 0.1, i * 2.6), C(80, 52, 32), M.Ground)
	end
	local hx, hz = sz.X / 2, sz.Z / 2
	for _, x in { -hx, hx } do
		for _, z in { -hz, hz } do
			P(m, Vector3.new(0.45, 2, 0.45), cf * CFrame.new(x, 1, z), WOOD_DARK, M.Wood)
		end
	end
	for _, z in { -hz, hz } do
		P(m, Vector3.new(sz.X, 0.25, 0.2), cf * CFrame.new(0, 1.4, z), WOOD, M.Wood)
	end
	for _, x in { -hx, hx } do
		P(m, Vector3.new(0.2, 0.25, sz.Z), cf * CFrame.new(x, 1.4, 0), WOOD, M.Wood)
	end
	return false
end

B.Sprinkler = function(m, cf, sz)
	P(m, Vector3.new(sz.Y, 0.5, 0.5), cf * CYL_UP, C(110, 112, 120), M.Metal, { shape = Enum.PartType.Cylinder })
	P(m, Vector3.new(0.4, 1.8, 1.8), cf * CFrame.new(0, sz.Y / 2, 0) * CYL_UP, C(80, 150, 230), M.Metal, { shape = Enum.PartType.Cylinder })
	local head = P(m, Vector3.new(0.5, 0.5, 0.5), cf * CFrame.new(0, sz.Y / 2 + 0.4, 0), C(200, 220, 255), M.Glass, { name = "Head" })
	local pe = Instance.new("ParticleEmitter")
	pe.Color = ColorSequence.new(C(120, 190, 255))
	pe.Size = NumberSequence.new(0.25)
	pe.Transparency = NumberSequence.new(0.3)
	pe.Rate = 30
	pe.Speed = NumberRange.new(12)
	pe.SpreadAngle = Vector2.new(70, 180)
	pe.Acceleration = Vector3.new(0, -30, 0)
	pe.Lifetime = NumberRange.new(0.8)
	pe.Parent = head
	return true
end

B.Harvester = function(m, cf, sz)
	P(m, Vector3.new(sz.X, sz.Y * 0.5, sz.Z), cf * CFrame.new(0, -sz.Y / 4, 0), C(200, 160, 60), M.Metal)
	P(m, Vector3.new(sz.X + 0.6, 1.6, 1.6), cf * CFrame.new(0, -sz.Y / 2 + 0.9, -sz.Z / 2 - 0.6), C(160, 40, 40), M.Metal, { shape = Enum.PartType.Cylinder })
	for k = 0, 3 do
		P(m, Vector3.new(sz.X + 0.4, 0.2, 2.4), cf * CFrame.new(0, -sz.Y / 2 + 0.9, -sz.Z / 2 - 0.6) * CFrame.Angles(math.rad(45 * k), 0, 0), C(220, 220, 225), M.Metal)
	end
	P(m, Vector3.new(sz.X - 0.6, sz.Y * 0.5, sz.Z - 0.6), cf * CFrame.new(0, sz.Y / 4, 0.3), C(130, 90, 50), M.WoodPlanks)
	P(m, Vector3.new(0.8, 2.4, 0.8), cf * CFrame.new(1.6, sz.Y / 2 + 1, 1.6), IRON, M.Metal)
	for _, x in { -sz.X / 2 - 0.2, sz.X / 2 + 0.2 } do
		P(m, Vector3.new(0.6, 2, 2), cf * CFrame.new(x, -sz.Y / 2 + 1, 1.2), C(40, 40, 40), M.Rubber, { shape = Enum.PartType.Cylinder })
	end
	return true
end

B.MarketCart = function(m, cf, sz)
	P(m, Vector3.new(sz.X, 0.6, sz.Z), cf * CFrame.new(0, -0.6, 0), C(160, 105, 60), M.WoodPlanks)
	for _, z in { -sz.Z / 2, sz.Z / 2 } do
		P(m, Vector3.new(sz.X, 1.2, 0.3), cf * CFrame.new(0, 0.3, z), WOOD, M.WoodPlanks)
	end
	for _, x in { -1.6, 1.6 } do
		for _, z in { -sz.Z / 2 - 0.3, sz.Z / 2 + 0.3 } do
			P(m, Vector3.new(0.4, 2.4, 2.4), cf * CFrame.new(x, -1.3, z) * CFrame.Angles(0, math.pi / 2, 0), WOOD_DARK, M.Wood, { shape = Enum.PartType.Cylinder })
		end
	end
	for i = 0, 2 do
		P(m, Vector3.new(1.4, 1.1, 1.4), cf * CFrame.new(-1.8 + i * 1.6, 0.6, 0), jitter(C(190, 150, 90), 0.15), M.WoodPlanks)
	end
	P(m, Vector3.new(1, 1, 1), cf * CFrame.new(-1.8, 1.6, 0), C(240, 140, 40), M.SmoothPlastic, { shape = Enum.PartType.Ball })
	P(m, Vector3.new(0.9, 0.9, 0.9), cf * CFrame.new(-0.2, 1.5, 0), C(90, 60, 170), M.SmoothPlastic, { shape = Enum.PartType.Ball })
	for _, x in { -sz.X / 2 + 0.2, sz.X / 2 - 0.2 } do
		for _, z in { -sz.Z / 2 + 0.2, sz.Z / 2 - 0.2 } do
			P(m, Vector3.new(0.25, 3.4, 0.25), cf * CFrame.new(x, 1.9, z), WOOD_DARK, M.Wood)
		end
	end
	for i = 0, 5 do
		P(m, Vector3.new(sz.X / 6, 0.25, sz.Z + 0.8), cf * CFrame.new(-sz.X / 2 + sz.X / 12 + i * sz.X / 6, 3.7, 0) * CFrame.Angles(0, 0, 0), i % 2 == 0 and C(70, 170, 80) or C(245, 245, 235), M.Fabric)
	end
	P(m, Vector3.new(3, 0.3, 0.3), cf * CFrame.new(sz.X / 2 + 1.5, -0.6, 0.8), WOOD_DARK, M.Wood)
	P(m, Vector3.new(3, 0.3, 0.3), cf * CFrame.new(sz.X / 2 + 1.5, -0.6, -0.8), WOOD_DARK, M.Wood)
	return true
end

B.Beehive = function(m, cf, sz)
	for i = 0, 2 do
		local y = -sz.Y / 2 + 0.65 + i * 1.3
		P(m, Vector3.new(sz.X, 1.2, sz.Z), cf * CFrame.new(0, y, 0), i % 2 == 0 and C(255, 205, 70) or C(245, 235, 200), M.WoodPlanks)
		P(m, Vector3.new(1.4, 0.25, 0.1), cf * CFrame.new(0, y - 0.3, -sz.Z / 2 - 0.02), C(40, 25, 10), M.SmoothPlastic)
	end
	P(m, Vector3.new(sz.X + 0.6, 0.3, sz.Z + 0.6), cf * CFrame.new(0, sz.Y / 2 + 0.15, 0), C(140, 95, 55), M.WoodPlanks)
	local pe = Instance.new("ParticleEmitter")
	pe.Color = ColorSequence.new(C(255, 220, 40))
	pe.Size = NumberSequence.new(0.18)
	pe.Rate = 10
	pe.Speed = NumberRange.new(2)
	pe.SpreadAngle = Vector2.new(180, 180)
	pe.Lifetime = NumberRange.new(2)
	pe.Parent = m:FindFirstChildWhichIsA("BasePart")
	return true
end

B.Scarecrow = function(m, cf, sz)
	P(m, Vector3.new(0.5, sz.Y, 0.5), cf, WOOD_DARK, M.Wood)
	P(m, Vector3.new(4, 0.4, 0.4), cf * CFrame.new(0, 1.3, 0), WOOD_DARK, M.Wood)
	P(m, Vector3.new(2, 2.4, 1), cf * CFrame.new(0, 0.9, 0), C(170, 60, 50), M.Fabric)
	P(m, Vector3.new(1.4, 1.4, 1.4), cf * CFrame.new(0, sz.Y / 2 + 0.2, 0), C(225, 200, 140), M.Fabric, { shape = Enum.PartType.Ball })
	P(m, Vector3.new(0.2, 2.6, 2.6), cf * CFrame.new(0, sz.Y / 2 + 0.75, 0) * CYL_UP, C(215, 185, 100), M.Grass, { shape = Enum.PartType.Cylinder })
	P(m, Vector3.new(0.8, 1.2, 1.2), cf * CFrame.new(0, sz.Y / 2 + 1.2, 0) * CYL_UP, C(205, 175, 95), M.Grass, { shape = Enum.PartType.Cylinder })
	return true
end

---------------------------------------------------------------------------
-- SIEGE MACHINES
---------------------------------------------------------------------------
local function wheels(m, cf, xs, zs, y, d)
	for _, x in xs do
		for _, z in zs do
			P(m, Vector3.new(0.6, d, d), cf * CFrame.new(x, y, z), WOOD_DARK, M.Wood, { shape = Enum.PartType.Cylinder })
			P(m, Vector3.new(0.7, d * 0.3, d * 0.3), cf * CFrame.new(x, y, z), IRON, M.Metal, { shape = Enum.PartType.Cylinder })
		end
	end
end

B.Catapult = function(m, cf, sz)
	local by = -sz.Y / 2 + 1.6
	for _, x in { -2.2, 2.2 } do
		P(m, Vector3.new(0.8, 0.8, sz.Z), cf * CFrame.new(x, by, 0), WOOD, M.Wood)
	end
	for _, z in { -sz.Z / 2 + 0.6, 0, sz.Z / 2 - 0.6 } do
		P(m, Vector3.new(4.4, 0.6, 0.6), cf * CFrame.new(0, by, z), WOOD_DARK, M.Wood)
	end
	wheels(m, cf, { -2.9, 2.9 }, { -sz.Z / 2 + 1.3, sz.Z / 2 - 1.3 }, by - 0.3, 2.6)
	for _, x in { -1.8, 1.8 } do
		P(m, Vector3.new(0.5, 4.6, 0.5), cf * CFrame.new(x, by + 2.2, -0.9) * CFrame.Angles(math.rad(-20), 0, 0), WOOD, M.Wood)
		P(m, Vector3.new(0.5, 4.6, 0.5), cf * CFrame.new(x, by + 2.2, 0.9) * CFrame.Angles(math.rad(20), 0, 0), WOOD, M.Wood)
	end
	P(m, Vector3.new(4.2, 0.5, 0.5), cf * CFrame.new(0, by + 4.2, 0), IRON, M.Metal, { shape = Enum.PartType.Cylinder })
	local arm = P(m, Vector3.new(0.6, 0.6, 9), cf * CFrame.new(0, by + 4.6, 0.8) * CFrame.Angles(math.rad(-28), 0, 0), C(125, 85, 50), M.Wood, { name = "Arm" })
	P(m, Vector3.new(1.8, 0.8, 1.8), arm.CFrame * CFrame.new(0, 0.4, -4.3), WOOD_DARK, M.WoodPlanks, { name = "Bucket" })
	P(m, Vector3.new(2.2, 2.2, 2.2), arm.CFrame * CFrame.new(0, -1.2, 4.1), C(90, 90, 95), M.Slate)
	P(m, Vector3.new(2.6, 0.3, 1.4), cf * CFrame.new(0, by + 0.5, sz.Z / 2 - 0.7), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	return true
end

B.Ballista = function(m, cf, sz)
	local by = -sz.Y / 2
	P(m, Vector3.new(3.4, 0.8, 3.4), cf * CFrame.new(0, by + 0.4, 0), WOOD_DARK, M.WoodPlanks)
	P(m, Vector3.new(1, 2.2, 1), cf * CFrame.new(0, by + 1.9, 0), WOOD, M.Wood)
	local stock = P(m, Vector3.new(0.7, 0.5, sz.Z), cf * CFrame.new(0, by + 3.2, 0), WOOD, M.Wood)
	for _, side in { -1, 1 } do
		P(m, Vector3.new(4, 0.4, 0.4), stock.CFrame * CFrame.new(side * 1.9, 0.1, -sz.Z / 2 + 1.2) * CFrame.Angles(0, side * math.rad(-20), 0), WOOD_DARK, M.Wood)
	end
	P(m, Vector3.new(7, 0.08, 0.08), stock.CFrame * CFrame.new(0, 0.1, -sz.Z / 2 + 2.5), C(230, 220, 190), M.Fabric)
	P(m, Vector3.new(0.25, 0.25, sz.Z - 1), stock.CFrame * CFrame.new(0, 0.4, -0.5), C(170, 170, 180), M.Metal)
	P(m, Vector3.new(0.4, 0.4, 0.8), stock.CFrame * CFrame.new(0, 0.4, -sz.Z / 2), C(200, 200, 210), M.Metal)
	P(m, Vector3.new(1.4, 0.3, 1.4), cf * CFrame.new(0, by + 0.85, 0), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	return true
end

B.Ram = function(m, cf, sz)
	local by = -sz.Y / 2 + 1.2
	for _, x in { -2, 2 } do
		P(m, Vector3.new(0.7, 0.7, sz.Z - 1), cf * CFrame.new(x, by, 0), WOOD, M.Wood)
	end
	wheels(m, cf, { -2.6, 2.6 }, { -sz.Z / 2 + 2, sz.Z / 2 - 2 }, by - 0.2, 2.2)
	for _, side in { -1, 1 } do
		P(m, Vector3.new(0.4, 4.4, sz.Z - 2), cf * CFrame.new(side * 1.5, by + 2.6, 0.5) * CFrame.Angles(0, 0, side * math.rad(-32)), C(130, 90, 55), M.WoodPlanks)
	end
	P(m, Vector3.new(sz.Z + 1, 1.5, 1.5), cf * CFrame.new(0, by + 1.3, -0.5) * CYL_Z, jitter(WOOD, 0.05), M.Wood, { shape = Enum.PartType.Cylinder })
	P(m, Vector3.new(1.4, 1.9, 1.9), cf * CFrame.new(0, by + 1.3, -sz.Z / 2 - 0.9) * CYL_Z, IRON, M.Metal, { shape = Enum.PartType.Cylinder })
	P(m, Vector3.new(1, 1, 1), cf * CFrame.new(0, by + 1.3, -sz.Z / 2 - 1.8), C(110, 110, 118), M.Metal, { shape = Enum.PartType.Ball })
	for _, z in { -2.5, 2.5 } do
		P(m, Vector3.new(0.15, 1.6, 0.15), cf * CFrame.new(0, by + 2.6, z), IRON, M.Metal)
	end
	P(m, Vector3.new(0.3, 2.2, sz.Z - 3), cf * CFrame.new(0, by + 3.9, 0.5), DEFAULT_TRIM, M.Fabric, { name = "Trim" })
	return true
end

---------------------------------------------------------------------------

-- Returns true if the plain Main box should be hidden.
function BuildModels.Decorate(model: Model, kind: string, main: BasePart): boolean
	local builder = B[kind]
	if not builder then
		return false
	end
	local hide = builder(model, main.CFrame, main.Size, main)
	if hide then
		main.Transparency = 1
	end
	return hide
end

function BuildModels.ApplyTrim(model: Model, color: Color3)
	for _, p in model:GetDescendants() do
		if p:IsA("BasePart") and p.Name == "Trim" then
			p.Color = color
		end
	end
end

return BuildModels
