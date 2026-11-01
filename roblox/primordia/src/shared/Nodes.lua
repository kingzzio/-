-- Harvestable world nodes. tool = which tool kind is efficient; minTier = minimum
-- tool tier needed to get drops at all. drops = { {item, min, max, chance?} }.

local Nodes = {}
local C = Color3.fromRGB

Nodes.List = {
	Tree = { hp = 60, tool = "axe", minTier = 0, drops = { { "Wood", 3, 5 }, { "Leaf", 0, 3 } }, color = C(80, 150, 60) },
	PineTree = { hp = 70, tool = "axe", minTier = 0, drops = { { "Wood", 4, 6 }, { "Leaf", 0, 2 } }, color = C(40, 110, 70) },
	PalmTree = { hp = 50, tool = "axe", minTier = 0, drops = { { "Wood", 2, 4 }, { "Fiber", 1, 3 } }, color = C(110, 170, 70) },
	DeadTree = { hp = 40, tool = "axe", minTier = 0, drops = { { "Wood", 2, 3 }, { "Hide", 0, 1, 0.2 } }, color = C(90, 80, 70) },
	Cactus = { hp = 30, tool = "axe", minTier = 0, drops = { { "Fiber", 2, 4 }, { "Berry", 0, 1, 0.3 } }, color = C(70, 150, 70) },
	Rock = { hp = 80, tool = "pick", minTier = 0, drops = { { "Stone", 3, 6 }, { "Clay", 0, 1, 0.25 } }, color = C(125, 125, 130) },
	ClayDeposit = { hp = 50, tool = "pick", minTier = 0, drops = { { "Clay", 3, 5 } }, color = C(185, 120, 90) },
	Reeds = { hp = 10, tool = "any", minTier = 0, drops = { { "Fiber", 2, 4 }, { "WheatSeed", 0, 1, 0.35 } }, color = C(190, 200, 110) },
	BerryBush = { hp = 15, tool = "any", minTier = 0, drops = { { "Berry", 2, 4 }, { "BerrySeed", 0, 1, 0.4 } }, color = C(60, 120, 60) },
	BoneHeap = { hp = 25, tool = "any", minTier = 0, drops = { { "Hide", 1, 2 }, { "Club", 0, 1, 0.05 } }, color = C(225, 215, 195) },
	BeeNest = { hp = 35, tool = "any", minTier = 0, drops = { { "Honey", 1, 3 }, { "Wax", 1, 2 } }, color = C(255, 200, 60), stings = 8 },
	CopperVein = { hp = 120, tool = "pick", minTier = 1, drops = { { "CopperOre", 2, 4 }, { "Stone", 1, 2 } }, color = C(210, 120, 70) },
	IronVein = { hp = 180, tool = "pick", minTier = 2, drops = { { "IronOre", 2, 4 }, { "Stone", 1, 3 } }, color = C(175, 165, 155) },
	GoldVein = { hp = 240, tool = "pick", minTier = 3, drops = { { "GoldOre", 1, 3 } }, color = C(250, 205, 60) },
	FrostCrystal = { hp = 200, tool = "pick", minTier = 2, drops = { { "Frostglass", 1, 3 } }, color = C(150, 220, 255) },
	ObsidianSpire = { hp = 260, tool = "pick", minTier = 3, drops = { { "Obsidian", 1, 3 } }, color = C(45, 30, 60) },
	EmeraldCrystal = { hp = 380, tool = "pick", minTier = 3, drops = { { "Emerald", 1, 2 } }, color = C(60, 230, 120), big = true },
	SunstoneCrystal = { hp = 420, tool = "pick", minTier = 4, drops = { { "Sunstone", 1, 3 } }, color = C(255, 130, 40), big = true },
	Meteorite = { hp = 600, tool = "pick", minTier = 4, drops = { { "Starmetal", 2, 4 }, { "IronOre", 2, 5 } }, color = C(170, 120, 255), big = true },
}

return Nodes
