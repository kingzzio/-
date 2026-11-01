-- Procedurally generated ruins ("points of interest") with loot chests.
-- Every biome has its own ruin style + loot table, so exploring new biomes pays.

local Structures = {}
local M = Enum.Material
local C = Color3.fromRGB

-- loot = { {item, min, max, chance} }
Structures.Kinds = {
	Watchtower = {
		title = "Ruined Watchtower", biomes = { Meadow = true, Forest = true }, mat = M.WoodPlanks, color = C(130, 90, 55),
		loot = { { "Plank", 4, 10, 1 }, { "Rope", 2, 5, 0.8 }, { "CopperBar", 1, 3, 0.5 }, { "Spear", 1, 1, 0.12 }, { "PumpkinSeed", 1, 3, 0.4 } },
	},
	Camp = {
		title = "Abandoned Camp", biomes = { Meadow = true, Forest = true, Beach = true }, mat = M.Fabric, color = C(170, 140, 100),
		loot = { { "Bread", 1, 3, 0.9 }, { "Hide", 1, 4, 0.7 }, { "BerrySeed", 2, 4, 0.6 }, { "StoneAxe", 1, 1, 0.2 }, { "Boulder", 1, 3, 0.3 } },
	},
	Shipwreck = {
		title = "Shipwreck", biomes = { Beach = true }, mat = M.Wood, color = C(100, 70, 45),
		loot = { { "GoldBar", 1, 2, 0.6 }, { "Rope", 3, 8, 1 }, { "IronBar", 1, 3, 0.5 }, { "Emerald", 1, 1, 0.12 } },
	},
	Tomb = {
		title = "Sunken Tomb", biomes = { Desert = true }, mat = M.Sandstone, color = C(220, 190, 130),
		loot = { { "GoldOre", 2, 5, 1 }, { "GoldBar", 1, 2, 0.5 }, { "Sunstone", 1, 1, 0.25 }, { "SunbloomSeed", 1, 1, 0.2 } },
	},
	FrozenVault = {
		title = "Frozen Vault", biomes = { Tundra = true, Peaks = true }, mat = M.Ice, color = C(170, 220, 255),
		loot = { { "Frostglass", 1, 4, 1 }, { "IronBar", 2, 4, 0.7 }, { "SmokePot", 1, 1, 0.25 }, { "IronSword", 1, 1, 0.08 } },
	},
	WitchHut = {
		title = "Witch's Hut", biomes = { Swamp = true }, mat = M.Wood, color = C(70, 80, 60),
		loot = { { "AcidFlask", 1, 2, 0.6 }, { "Clay", 4, 8, 1 }, { "BeetSeed", 2, 4, 0.7 }, { "WarStew", 1, 1, 0.3 } },
	},
	EmberForge = {
		title = "Ember Forge Ruins", biomes = { Ashlands = true }, mat = M.Basalt, color = C(60, 45, 45),
		loot = { { "Obsidian", 2, 4, 1 }, { "IronBar", 2, 5, 0.8 }, { "FirePot", 1, 3, 0.6 }, { "SunBlade", 1, 1, 0.04 } },
	},
	SkyShrine = {
		title = "Sky Shrine", biomes = { Peaks = true }, mat = M.Marble, color = C(235, 235, 240),
		loot = { { "Emerald", 1, 2, 0.8 }, { "GoldBar", 1, 3, 0.8 }, { "Starmetal", 1, 1, 0.15 } },
	},
}

function Structures.PickKind(biome: string, rng: Random): string?
	local options = {}
	for k, v in Structures.Kinds do
		if v.biomes[biome] then
			table.insert(options, k)
		end
	end
	table.sort(options)
	if #options == 0 then
		return nil
	end
	return options[rng:NextInteger(1, #options)]
end

function Structures.RollLoot(kind: string, rng: Random): { [string]: number }
	local out = {}
	for _, entry in Structures.Kinds[kind].loot do
		if rng:NextNumber() <= entry[4] then
			out[entry[1]] = (out[entry[1]] or 0) + rng:NextInteger(entry[2], entry[3])
		end
	end
	return out
end

local function part(model, size, cf, color, material)
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material
	p.TopSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	return p
end

function Structures.Build(kind: string, origin: Vector3, rng: Random, chestId: string): Model
	local def = Structures.Kinds[kind]
	local m = Instance.new("Model")
	m.Name = def.title
	local base = CFrame.new(origin) * CFrame.Angles(0, rng:NextInteger(0, 3) * math.pi / 2, 0)

	-- cracked foundation
	part(m, Vector3.new(22, 1.5, 22), base * CFrame.new(0, -0.2, 0), def.color, def.mat)
	-- broken ring of walls and pillars
	for i = 0, 7 do
		local a = i * math.pi / 4
		if rng:NextNumber() > 0.25 then
			local h = rng:NextNumber(3, kind == "Watchtower" and 18 or 10)
			part(m, Vector3.new(2.5, h, 2.5), base * CFrame.Angles(0, a, 0) * CFrame.new(0, h / 2, -9.5), def.color, def.mat)
		end
		if i % 2 == 0 and rng:NextNumber() > 0.4 then
			local h = rng:NextNumber(2, 6)
			part(m, Vector3.new(7, h, 1.2), base * CFrame.Angles(0, a + math.pi / 8, 0) * CFrame.new(0, h / 2, -9.8) * CFrame.Angles(0, 0, rng:NextNumber(-0.1, 0.1)), def.color, def.mat)
		end
	end
	-- fallen roof slab
	part(m, Vector3.new(12, 1, 8), base * CFrame.new(rng:NextNumber(-4, 4), 1.2, rng:NextNumber(-4, 4)) * CFrame.Angles(rng:NextNumber(-0.3, 0.3), rng:NextNumber(0, 3), rng:NextNumber(-0.3, 0.3)), def.color, def.mat)

	-- the chest
	local chest = part(m, Vector3.new(4, 2.5, 2.6), base * CFrame.new(0, 1.8, 0), C(120, 80, 40), M.WoodPlanks)
	chest.Name = "Chest"
	local lid = part(m, Vector3.new(4.2, 0.8, 2.8), base * CFrame.new(0, 3.4, 0), C(200, 160, 50), M.Metal)
	lid.Name = "Lid"
	local glow = Instance.new("PointLight")
	glow.Color = C(255, 210, 90)
	glow.Range = 14
	glow.Parent = chest
	local sparkle = Instance.new("Sparkles")
	sparkle.SparkleColor = C(255, 220, 120)
	sparkle.Parent = lid

	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Loot"
	prompt.ObjectText = def.title
	prompt.HoldDuration = 1.2
	prompt.MaxActivationDistance = 10
	prompt.Parent = chest
	chest:SetAttribute("ChestId", chestId)
	chest:SetAttribute("Kind", kind)

	m.PrimaryPart = chest
	return m
end

return Structures
