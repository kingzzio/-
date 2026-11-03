-- Deterministic, infinite world generation. Pure math: the same (x, z) gives the
-- same height and biome on every server and every client, which is what lets
-- separate Roblox servers share ONE world, and the client draw the map without
-- asking the server.

local Config = require(script.Parent.Config)

local WorldGen = {}

local SEED_OFFSET = (Config.WorldSeed % 10007) * 0.0173 + 0.5

local function fbm(x: number, z: number, scale: number, octaves: number, salt: number): number
	local sum, amp, norm, f = 0, 1, 0, 1 / scale
	for i = 1, octaves do
		sum += math.noise(x * f, z * f, SEED_OFFSET + salt + i * 3.17) * amp
		norm += amp
		amp *= 0.5
		f *= 2
	end
	return sum / norm
end
WorldGen.fbm = fbm

local C = Color3.fromRGB
local M = Enum.Material

WorldGen.Biomes = {
	Ocean = { name = "Ocean", map = C(50, 120, 190), surface = M.Sand, under = M.Sand, density = 0, nodes = {} },
	Beach = { name = "Beach", map = C(230, 215, 150), surface = M.Sand, under = M.Sandstone, density = 3, nodes = { PalmTree = 3, Rock = 1, Reeds = 2 } },
	Meadow = { name = "Meadow", map = C(120, 200, 80), surface = M.Grass, under = M.Ground, density = 9, nodes = { Tree = 3, Rock = 2, BerryBush = 2, Reeds = 3, CopperVein = 1, BeeNest = 0.5, BoneHeap = 0.4 } },
	Forest = { name = "Whisperwood", map = C(55, 140, 60), surface = M.LeafyGrass, under = M.Ground, density = 15, nodes = { Tree = 9, Rock = 1.5, BerryBush = 2, BeeNest = 0.8, CopperVein = 1 } },
	Swamp = { name = "Rotmire Swamp", map = C(85, 110, 70), surface = M.Mud, under = M.Mud, density = 9, nodes = { DeadTree = 3, Reeds = 5, ClayDeposit = 3, BerryBush = 1 } },
	Desert = { name = "Sunscar Desert", map = C(235, 195, 110), surface = M.Sand, under = M.Sandstone, density = 5, nodes = { Cactus = 4, Rock = 2, GoldVein = 1, BoneHeap = 1, SunstoneCrystal = 0.35 } },
	Ashlands = { name = "Ashlands", map = C(70, 55, 60), surface = M.Basalt, under = M.CrackedLava, density = 7, nodes = { EmberTree = 3, ObsidianSpire = 2, Rock = 2, IronVein = 1.2, SunstoneCrystal = 0.7 } },
	Tundra = { name = "Frostreach", map = C(225, 235, 245), surface = M.Snow, under = M.Glacier, density = 8, nodes = { PineTree = 5, Rock = 2, IronVein = 1.3, FrostCrystal = 0.8 } },
	Peaks = { name = "Skyteeth Peaks", map = C(150, 150, 160), surface = M.Snow, under = M.Slate, density = 5, nodes = { Rock = 4, IronVein = 2, GoldVein = 1.2, EmeraldCrystal = 0.45 } },
}

function WorldGen.Climate(x: number, z: number): (number, number)
	local temp = math.clamp(fbm(x + 5000, z - 3000, 1400, 2, 11) * 2.4, -1, 1)
	local moist = math.clamp(fbm(x - 7000, z + 9000, 1100, 2, 23) * 2.4, -1, 1)
	return temp, moist
end

-- Returns surfaceHeight, biomeKey, isRiver
function WorldGen.Sample(x: number, z: number): (number, string, boolean)
	local sea = Config.SeaLevel
	local continent = fbm(x, z, 1700, 3, 1) * 2.2
	local hills = fbm(x, z, 240, 4, 5) * 2
	local ridge = 1 - math.abs(fbm(x, z, 650, 4, 9) * 2.2)
	ridge = math.max(ridge, 0) ^ 2

	local h = sea + 8 + continent * 30 + hills * 9
	local mountainMask = math.clamp((continent - 0.1) * 2.2, 0, 1)
	h += ridge * 85 * mountainMask

	-- Rivers: thin bands where a low-frequency noise crosses zero.
	local r = math.abs(fbm(x, z, 950, 3, 41) * 2.2)
	local river = false
	if r < 0.04 and h < sea + 45 and h > sea - 2 then
		local t = r / 0.04
		local bed = sea - 6
		h = bed + (h - bed) * (t * t)
		river = t < 0.7
	end

	h = math.clamp(h, 6, Config.MaxHeight - 8)

	local temp, moist = WorldGen.Climate(x, z)
	local biome
	if h < sea - 1 then
		biome = "Ocean"
	elseif h < sea + 2.5 then
		biome = "Beach"
	elseif h > sea + 78 then
		biome = "Peaks"
	elseif temp < -0.32 then
		biome = "Tundra"
	elseif temp > 0.3 and moist < -0.05 then
		biome = (temp > 0.55 and moist < -0.25) and "Ashlands" or "Desert"
	elseif moist > 0.32 and h < sea + 14 then
		biome = "Swamp"
	elseif moist > 0.02 then
		biome = "Forest"
	else
		biome = "Meadow"
	end
	return h, biome, river
end

function WorldGen.ChunkKey(cx: number, cz: number): string
	return cx .. "_" .. cz
end

function WorldGen.ChunkOf(pos: Vector3): (number, number)
	return math.floor(pos.X / Config.ChunkSize), math.floor(pos.Z / Config.ChunkSize)
end

function WorldGen.ChunkSeed(cx: number, cz: number): number
	-- simple integer hash → stable per-chunk RNG seed
	local a = (cx * 73856093) % 4294967296
	local b = (cz * 19349663) % 4294967296
	local h = bit32.bxor(a, b, Config.WorldSeed % 4294967296)
	return h % 2147483647
end

---------------------------------------------------------------------------
-- VOXEL COLUMNS: the world is built from 4x4-stud studded blocks whose tops
-- step in 2-stud increments (the blocky "Lego" look).
---------------------------------------------------------------------------
WorldGen.Block = 4
WorldGen.Step = 2

-- Bright, toy-like palettes: two shades per biome, picked in patches.
WorldGen.Palette = {
	Ocean = { C(214, 196, 140), C(204, 186, 132) },
	Beach = { C(240, 222, 160), C(232, 212, 150) },
	Meadow = { C(112, 206, 82), C(98, 192, 74) },
	Forest = { C(76, 170, 64), C(66, 156, 58) },
	Swamp = { C(98, 128, 74), C(86, 114, 66) },
	Desert = { C(244, 206, 128), C(234, 194, 116) },
	Ashlands = { C(78, 68, 70), C(64, 56, 60) },
	Tundra = { C(244, 248, 252), C(230, 238, 246) },
	Peaks = { C(150, 152, 162), C(136, 138, 150) },
	River = { C(206, 190, 136), C(196, 180, 128) },
	Lava = { C(255, 120, 30), C(255, 90, 20) },
	Path = { C(226, 200, 146), C(216, 190, 136) },
}

local function frac(v: number): number
	return v - math.floor(v)
end
local function hash2(ix: number, iz: number): number
	return frac(math.sin(ix * 127.1 + iz * 311.7 + Config.WorldSeed * 0.013) * 43758.5453)
end
WorldGen.Hash = hash2

-- The spawn HUB: a fixed, flattened meadow clearing every shard agrees on.
local function findHub()
	local sea = Config.SeaLevel
	for ring = 0, 40 do
		local r = ring * 96
		local steps = math.max(1, ring * 6)
		for k = 0, steps - 1 do
			local a = k / steps * math.pi * 2
			local x, z = math.cos(a) * r, math.sin(a) * r
			local h, biome = WorldGen.Sample(x, z)
			if (biome == "Meadow" or biome == "Forest") and h > sea + 6 and h < sea + 34 then
				local lo, hi = h, h
				for j = 0, 7 do
					local b = j / 8 * math.pi * 2
					local hh, bb = WorldGen.Sample(x + math.cos(b) * 90, z + math.sin(b) * 90)
					lo, hi = math.min(lo, hh), math.max(hi, hh)
					if bb == "Ocean" then
						hi = math.huge
					end
				end
				if hi - lo < 18 then
					return { x = math.floor(x / 4) * 4 + 2, z = math.floor(z / 4) * 4 + 2, h = math.floor(h / 2 + 0.5) * 2, r = 72 }
				end
			end
		end
	end
	return { x = 2, z = 2, h = sea + 10, r = 72 }
end
WorldGen.Hub = findHub()

-- Ruins: deterministic per chunk, flattened site. Returns nil or {x,z,h,biome,seed}.
local poiCache = {}
function WorldGen.POI(cx: number, cz: number)
	local key = cx .. "_" .. cz
	local cached = poiCache[key]
	if cached ~= nil then
		return cached or nil
	end
	local result = false
	local rng = Random.new(WorldGen.ChunkSeed(cx, cz) + 99991)
	if rng:NextNumber() <= Config.StructureChance then
		local size = Config.ChunkSize
		local x, z = (cx + 0.5) * size, (cz + 0.5) * size
		local hub = WorldGen.Hub
		local h, biome = WorldGen.Sample(x, z)
		if h > Config.SeaLevel + 1 and math.sqrt((x - hub.x) ^ 2 + (z - hub.z) ^ 2) > hub.r + 120 then
			result = { x = x, z = z, h = math.floor(h / 2 + 0.5) * 2, biome = biome, seed = rng:NextInteger(1, 1e9) }
		end
	end
	poiCache[key] = result
	return result or nil
end

-- Height/biome of the voxel column with integer indices (ix, iz).
function WorldGen.Column(ix: number, iz: number): (number, string, boolean)
	local B = WorldGen.Block
	local x, z = (ix + 0.5) * B, (iz + 0.5) * B
	local h, biome, river = WorldGen.Sample(x, z)
	local hub = WorldGen.Hub
	local d = math.sqrt((x - hub.x) ^ 2 + (z - hub.z) ^ 2)
	if d < hub.r then
		h, biome, river = hub.h, "Meadow", false
	elseif d < hub.r + 40 then
		local t = (d - hub.r) / 40
		h = hub.h + (h - hub.h) * t * t
		if biome == "Ocean" then
			biome = "Beach"
		end
	end
	local poi = WorldGen.POI(math.floor(x / Config.ChunkSize), math.floor(z / Config.ChunkSize))
	if poi and math.abs(x - poi.x) < 14 and math.abs(z - poi.z) < 14 then
		h, river = poi.h, false
	end
	h = math.floor(h / WorldGen.Step + 0.5) * WorldGen.Step
	return h, biome, river
end

-- Top surface Y at world position (what you stand on).
function WorldGen.Ground(x: number, z: number): number
	local B = WorldGen.Block
	local h = WorldGen.Column(math.floor(x / B), math.floor(z / B))
	return math.max(h, Config.SeaLevel - 40)
end

-- Colour key for a column (palette name + shade index).
function WorldGen.ColumnColor(ix: number, iz: number, h: number, biome: string, river: boolean): (string, number)
	local key = biome
	if river or (h < Config.SeaLevel and biome ~= "Ocean") then
		key = "River"
	elseif biome == "Peaks" and h > Config.SeaLevel + 100 then
		key = "Tundra"
	elseif biome == "Ashlands" and hash2(ix, iz) < 0.05 then
		key = "Lava"
	end
	local shade = (math.noise(ix * 0.18, iz * 0.18, SEED_OFFSET + 77) > 0) and 1 or 2
	return key, shade
end

function WorldGen.InHub(pos: Vector3, pad: number?): boolean
	local hub = WorldGen.Hub
	return math.sqrt((pos.X - hub.x) ^ 2 + (pos.Z - hub.z) ^ 2) < hub.r + (pad or 0)
end

return WorldGen
