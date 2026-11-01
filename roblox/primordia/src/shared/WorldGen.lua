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
	Ashlands = { name = "Ashlands", map = C(70, 55, 60), surface = M.Basalt, under = M.CrackedLava, density = 6, nodes = { ObsidianSpire = 2.5, Rock = 3, IronVein = 1.2, SunstoneCrystal = 0.7 } },
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

return WorldGen
