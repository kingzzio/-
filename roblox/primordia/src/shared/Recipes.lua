-- Crafting recipes. station = nil means craftable anywhere (by hand).
-- The station must be a placed buildable within Recipes.StationRange studs.

local Recipes = {}
Recipes.StationRange = 22

Recipes.List = {
	-- by hand
	{ out = "StoneAxe", n = 1, cost = { Wood = 5, Stone = 4, Fiber = 2 } },
	{ out = "StonePick", n = 1, cost = { Wood = 5, Stone = 5, Fiber = 2 } },
	{ out = "Club", n = 1, cost = { Wood = 6 } },
	{ out = "Rope", n = 1, cost = { Fiber = 4 } },
	{ out = "ThatchWall", n = 1, cost = { Fiber = 6, Wood = 2 } },
	{ out = "Workbench", n = 1, cost = { Wood = 20, Stone = 6 } },
	{ out = "Totem", n = 1, cost = { Wood = 40, Stone = 40, Fiber = 10 } },
	{ out = "Bread", n = 1, cost = { Wheat = 3 } },

	-- workbench
	{ out = "Plank", n = 2, cost = { Wood = 3 }, station = "Workbench" },
	{ out = "WoodWall", n = 1, cost = { Plank = 4 }, station = "Workbench" },
	{ out = "WoodFloor", n = 1, cost = { Plank = 3 }, station = "Workbench" },
	{ out = "WoodDoor", n = 1, cost = { Plank = 4, Rope = 1 }, station = "Workbench" },
	{ out = "StoneWall", n = 1, cost = { Stone = 14, Clay = 2 }, station = "Workbench" },
	{ out = "Forge", n = 1, cost = { Stone = 30, Clay = 10 }, station = "Workbench" },
	{ out = "FarmPlot", n = 1, cost = { Plank = 2, Clay = 2 }, station = "Workbench" },
	{ out = "Scarecrow", n = 1, cost = { Plank = 2, Fiber = 6, Hide = 1 }, station = "Workbench" },
	{ out = "Beehive", n = 1, cost = { Plank = 8, Honey = 2 }, station = "Workbench" },
	{ out = "Spikes", n = 1, cost = { Wood = 10, Stone = 2 }, station = "Workbench" },
	{ out = "DecoyChest", n = 1, cost = { Plank = 6, GoldOre = 1 }, station = "Workbench" },
	{ out = "Watchtower", n = 1, cost = { Plank = 20, Rope = 4 }, station = "Workbench" },
	{ out = "HoneyBun", n = 1, cost = { Wheat = 2, Honey = 1 }, station = "Workbench" },
	{ out = "WarStew", n = 1, cost = { Beet = 2, Pumpkin = 1, Hide = 1 }, station = "Workbench" },

	-- forge
	{ out = "CopperBar", n = 1, cost = { CopperOre = 2, Wood = 1 }, station = "Forge" },
	{ out = "IronBar", n = 1, cost = { IronOre = 2, Wood = 2 }, station = "Forge" },
	{ out = "GoldBar", n = 1, cost = { GoldOre = 2, Wood = 2 }, station = "Forge" },
	{ out = "Brick", n = 2, cost = { Clay = 3 }, station = "Forge" },
	{ out = "CopperAxe", n = 1, cost = { CopperBar = 3, Plank = 2 }, station = "Forge" },
	{ out = "CopperPick", n = 1, cost = { CopperBar = 3, Plank = 2 }, station = "Forge" },
	{ out = "Spear", n = 1, cost = { CopperBar = 2, Plank = 3, Rope = 1 }, station = "Forge" },
	{ out = "IronPick", n = 1, cost = { IronBar = 4, Plank = 2 }, station = "Forge" },
	{ out = "IronSword", n = 1, cost = { IronBar = 5, Hide = 1 }, station = "Forge" },
	{ out = "GoldPick", n = 1, cost = { GoldBar = 4, IronBar = 2 }, station = "Forge" },
	{ out = "SunBlade", n = 1, cost = { Sunstone = 3, IronBar = 4, GoldBar = 1 }, station = "Forge" },
	{ out = "StarPick", n = 1, cost = { Starmetal = 4, GoldBar = 3, Emerald = 1 }, station = "Forge" },
	{ out = "MetalWall", n = 1, cost = { IronBar = 6, Plank = 2 }, station = "Forge" },
	{ out = "IronGate", n = 1, cost = { IronBar = 10 }, station = "Forge" },
	{ out = "Vault", n = 1, cost = { IronBar = 12, GoldBar = 2 }, station = "Forge" },
	{ out = "Sprinkler", n = 1, cost = { CopperBar = 3, Frostglass = 1 }, station = "Forge" },
	{ out = "Harvester", n = 1, cost = { IronBar = 6, CopperBar = 4, Plank = 6 }, station = "Forge" },
	{ out = "MarketCart", n = 1, cost = { Plank = 10, IronBar = 2, GoldBar = 1 }, station = "Forge" },
	{ out = "HoneycombPlate", n = 1, cost = { Wax = 6, Honey = 3, IronBar = 1 }, station = "Forge" },
	{ out = "HoneycombWall", n = 1, cost = { HoneycombPlate = 3, MetalWall = 1 }, station = "Forge" },
	{ out = "TarPit", n = 1, cost = { Obsidian = 1, Clay = 4 }, station = "Forge" },

	-- siege workshop
	{ out = "SiegeWorkshop", n = 1, cost = { Plank = 30, IronBar = 6, Rope = 8 }, station = "Forge" },
	{ out = "Catapult", n = 1, cost = { Plank = 25, Rope = 10, IronBar = 4 }, station = "SiegeWorkshop" },
	{ out = "Ballista", n = 1, cost = { Plank = 18, Rope = 8, IronBar = 6 }, station = "SiegeWorkshop" },
	{ out = "Ram", n = 1, cost = { Wood = 60, IronBar = 8, Hide = 4 }, station = "SiegeWorkshop" },
	{ out = "Boulder", n = 2, cost = { Stone = 10 }, station = "SiegeWorkshop" },
	{ out = "FirePot", n = 1, cost = { Clay = 2, Wax = 2, Fiber = 2 }, station = "SiegeWorkshop" },
	{ out = "AcidFlask", n = 1, cost = { Clay = 2, Berry = 4, Obsidian = 1 }, station = "SiegeWorkshop" },
	{ out = "SmokePot", n = 1, cost = { Clay = 2, Leaf = 10, Frostglass = 1 }, station = "SiegeWorkshop" },
	{ out = "BallistaBolt", n = 3, cost = { Plank = 2, IronBar = 1 }, station = "SiegeWorkshop" },
}

return Recipes
