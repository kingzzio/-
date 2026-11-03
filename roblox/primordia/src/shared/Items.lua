-- Every item in the game. Categories map 1:1 to the inventory tabs.
-- price = base global-shop sell value (coins). buy = shop purchase price (nil = not sold).
-- tool = { kind = "axe"|"pick"|"weapon"|"hammer", tier = n, power = damage per swing }

local Items = {}

Items.Categories = { "All", "Tools", "Armor", "Building", "Resources", "Farming", "Siege", "Food", "Favorites" }

Items.Rarity = {
	Common = Color3.fromRGB(200, 200, 200),
	Uncommon = Color3.fromRGB(110, 230, 110),
	Rare = Color3.fromRGB(80, 160, 255),
	Epic = Color3.fromRGB(190, 90, 255),
	Legendary = Color3.fromRGB(255, 170, 40),
	Mythic = Color3.fromRGB(255, 70, 90),
}

local C = Color3.fromRGB

Items.List = {
	-- RESOURCES ------------------------------------------------------------
	Wood = { name = "Wood", category = "Resources", price = 1, rarity = "Common", color = C(150, 100, 60) },
	Leaf = { name = "Leaves", category = "Resources", price = 0, rarity = "Common", color = C(80, 160, 60) },
	Fiber = { name = "Plant Fiber", category = "Resources", price = 1, rarity = "Common", color = C(190, 200, 110) },
	Stone = { name = "Stone", category = "Resources", price = 1, rarity = "Common", color = C(130, 130, 135) },
	Clay = { name = "Clay", category = "Resources", price = 2, rarity = "Common", color = C(185, 120, 90) },
	Hide = { name = "Hide", category = "Resources", price = 3, rarity = "Common", color = C(140, 95, 60) },
	CopperOre = { name = "Copper Ore", category = "Resources", price = 4, rarity = "Uncommon", color = C(210, 120, 70) },
	IronOre = { name = "Iron Ore", category = "Resources", price = 7, rarity = "Uncommon", color = C(170, 160, 150) },
	GoldOre = { name = "Gold Ore", category = "Resources", price = 15, rarity = "Rare", color = C(250, 205, 60) },
	Frostglass = { name = "Frostglass", category = "Resources", price = 22, rarity = "Rare", color = C(150, 220, 255) },
	Obsidian = { name = "Obsidian", category = "Resources", price = 18, rarity = "Rare", color = C(45, 30, 60) },
	Emerald = { name = "Emerald", category = "Resources", price = 45, rarity = "Epic", color = C(60, 230, 120) },
	Sunstone = { name = "Sunstone", category = "Resources", price = 60, rarity = "Epic", color = C(255, 130, 40) },
	Starmetal = { name = "Starmetal", category = "Resources", price = 140, rarity = "Legendary", color = C(170, 120, 255) },
	Honey = { name = "Honey", category = "Resources", price = 6, rarity = "Uncommon", color = C(255, 190, 40) },
	Wax = { name = "Beeswax", category = "Resources", price = 5, rarity = "Uncommon", color = C(250, 230, 150) },
	-- refined
	Plank = { name = "Plank", category = "Resources", price = 3, rarity = "Common", color = C(190, 140, 90) },
	Rope = { name = "Rope", category = "Resources", price = 3, rarity = "Common", color = C(200, 180, 120) },
	Brick = { name = "Brick", category = "Resources", price = 5, rarity = "Common", color = C(170, 80, 60) },
	CopperBar = { name = "Copper Bar", category = "Resources", price = 10, rarity = "Uncommon", color = C(225, 135, 80) },
	IronBar = { name = "Iron Bar", category = "Resources", price = 18, rarity = "Uncommon", color = C(200, 200, 205) },
	GoldBar = { name = "Gold Bar", category = "Resources", price = 38, rarity = "Rare", color = C(255, 215, 70) },
	HoneycombPlate = { name = "Honeycomb Plate", category = "Resources", price = 40, rarity = "Epic", color = C(255, 175, 30) },

	-- TOOLS ----------------------------------------------------------------
	StoneAxe = { name = "Stone Axe", category = "Tools", price = 4, rarity = "Common", color = C(140, 140, 140), tool = { kind = "axe", tier = 1, power = 12 } },
	StonePick = { name = "Stone Pickaxe", category = "Tools", price = 4, rarity = "Common", color = C(140, 140, 140), tool = { kind = "pick", tier = 1, power = 12 } },
	CopperAxe = { name = "Copper Axe", category = "Tools", price = 20, rarity = "Uncommon", color = C(225, 135, 80), tool = { kind = "axe", tier = 2, power = 20 } },
	CopperPick = { name = "Copper Pickaxe", category = "Tools", price = 20, rarity = "Uncommon", color = C(225, 135, 80), tool = { kind = "pick", tier = 2, power = 20 } },
	IronPick = { name = "Iron Pickaxe", category = "Tools", price = 45, rarity = "Rare", color = C(200, 200, 205), tool = { kind = "pick", tier = 3, power = 30 } },
	GoldPick = { name = "Gilded Pickaxe", category = "Tools", price = 90, rarity = "Epic", color = C(255, 215, 70), tool = { kind = "pick", tier = 4, power = 42 } },
	StarPick = { name = "Starbreaker", category = "Tools", price = 400, rarity = "Legendary", color = C(170, 120, 255), tool = { kind = "pick", tier = 5, power = 70 } },
	Club = { name = "Bone Club", category = "Tools", price = 3, rarity = "Common", color = C(220, 210, 190), tool = { kind = "weapon", tier = 1, power = 14 } },
	Spear = { name = "Copper Spear", category = "Tools", price = 25, rarity = "Uncommon", color = C(225, 135, 80), tool = { kind = "weapon", tier = 2, power = 22 } },
	IronSword = { name = "Iron Sword", category = "Tools", price = 55, rarity = "Rare", color = C(200, 200, 205), tool = { kind = "weapon", tier = 3, power = 30 } },
	SunBlade = { name = "Sunstone Blade", category = "Tools", price = 220, rarity = "Epic", color = C(255, 130, 40), tool = { kind = "weapon", tier = 4, power = 40, burn = true } },
	Hammer = { name = "Builder's Hammer", category = "Tools", price = 6, rarity = "Common", color = C(160, 110, 70), buy = 15, tool = { kind = "hammer", tier = 1, power = 0 } },

	-- ARMOR (equip from the inventory; adds max health + shows on your character) --
	HideHood = { name = "Hide Hood", category = "Armor", price = 6, rarity = "Common", color = C(140, 95, 60), armor = { slot = "head", hp = 15, style = "hood" } },
	HideTunic = { name = "Hide Tunic", category = "Armor", price = 10, rarity = "Common", color = C(140, 95, 60), armor = { slot = "body", hp = 25, style = "tunic" } },
	IronHelm = { name = "Iron Helm", category = "Armor", price = 40, rarity = "Uncommon", color = C(190, 192, 200), armor = { slot = "head", hp = 35, style = "helm" } },
	HornedHelm = { name = "Horned War Helm", category = "Armor", price = 70, rarity = "Rare", color = C(120, 80, 50), armor = { slot = "head", hp = 45, style = "horned" } },
	IronPlate = { name = "Iron Warplate", category = "Armor", price = 75, rarity = "Rare", color = C(190, 192, 200), armor = { slot = "body", hp = 60, style = "plate" } },
	GoldenHelm = { name = "Golden Guard Helm", category = "Armor", price = 120, rarity = "Epic", color = C(255, 200, 60), armor = { slot = "head", hp = 55, style = "golden" } },
	WarlordPlate = { name = "Warlord Plate", category = "Armor", price = 160, rarity = "Epic", color = C(200, 40, 45), armor = { slot = "body", hp = 80, style = "warlord" } },
	HiveArmor = { name = "Hive Armor", category = "Armor", price = 200, rarity = "Epic", color = C(255, 175, 30), armor = { slot = "body", hp = 95, style = "hive" } },
	SunstoneCrown = { name = "Sunstone Crown", category = "Armor", price = 380, rarity = "Legendary", color = C(255, 130, 40), armor = { slot = "head", hp = 75, style = "crown" } },

	-- BUILDING (placeables; see Buildables.lua for stats) --------------------
	ThatchWall = { name = "Thatch Wall", category = "Building", price = 2, rarity = "Common", color = C(200, 180, 100), build = "ThatchWall" },
	WoodWall = { name = "Wood Wall", category = "Building", price = 6, rarity = "Common", color = C(150, 100, 60), build = "WoodWall" },
	StoneWall = { name = "Stone Wall", category = "Building", price = 14, rarity = "Uncommon", color = C(130, 130, 135), build = "StoneWall" },
	MetalWall = { name = "Iron Wall", category = "Building", price = 40, rarity = "Rare", color = C(190, 190, 200), build = "MetalWall" },
	HoneycombWall = { name = "Honeycomb Wall", category = "Building", price = 90, rarity = "Epic", color = C(255, 175, 30), build = "HoneycombWall" },
	WoodFloor = { name = "Wood Floor", category = "Building", price = 5, rarity = "Common", color = C(170, 120, 75), build = "WoodFloor" },
	WoodDoor = { name = "Wood Door", category = "Building", price = 8, rarity = "Common", color = C(140, 90, 50), build = "WoodDoor" },
	IronGate = { name = "Iron Gate", category = "Building", price = 50, rarity = "Rare", color = C(170, 170, 180), build = "IronGate" },
	Totem = { name = "Faction Totem", category = "Building", price = 0, rarity = "Epic", color = C(160, 70, 255), build = "Totem" },
	Workbench = { name = "Workbench", category = "Building", price = 8, rarity = "Common", color = C(160, 110, 70), build = "Workbench" },
	Forge = { name = "Forge", category = "Building", price = 20, rarity = "Uncommon", color = C(90, 90, 95), build = "Forge" },
	SiegeWorkshop = { name = "Siege Workshop", category = "Building", price = 60, rarity = "Rare", color = C(120, 80, 50), build = "SiegeWorkshop" },
	Vault = { name = "Faction Vault", category = "Building", price = 30, rarity = "Rare", color = C(110, 110, 120), build = "Vault" },
	Spikes = { name = "Spike Trap", category = "Building", price = 6, rarity = "Common", color = C(120, 90, 60), build = "Spikes" },
	TarPit = { name = "Tar Pit", category = "Building", price = 10, rarity = "Uncommon", color = C(30, 30, 30), build = "TarPit" },
	DecoyChest = { name = "Decoy Chest", category = "Building", price = 12, rarity = "Uncommon", color = C(170, 120, 60), build = "DecoyChest" },
	Watchtower = { name = "Watchtower", category = "Building", price = 25, rarity = "Uncommon", color = C(150, 100, 60), build = "Watchtower" },

	-- FARMING ----------------------------------------------------------------
	FarmPlot = { name = "Farm Plot", category = "Farming", price = 3, rarity = "Common", color = C(110, 75, 45), build = "FarmPlot", buy = 12 },
	Sprinkler = { name = "Sprinkler", category = "Farming", price = 15, rarity = "Uncommon", color = C(90, 150, 220), build = "Sprinkler" },
	Harvester = { name = "Auto-Harvester", category = "Farming", price = 60, rarity = "Rare", color = C(200, 160, 60), build = "Harvester" },
	MarketCart = { name = "Market Cart", category = "Farming", price = 50, rarity = "Rare", color = C(170, 110, 60), build = "MarketCart" },
	Beehive = { name = "Apiary", category = "Farming", price = 30, rarity = "Uncommon", color = C(255, 200, 60), build = "Beehive" },
	Scarecrow = { name = "Scarecrow", category = "Farming", price = 8, rarity = "Common", color = C(200, 170, 90), build = "Scarecrow" },
	WheatSeed = { name = "Wheat Seeds", category = "Farming", price = 0, rarity = "Common", color = C(220, 200, 120), buy = 2, seed = "Wheat" },
	BerrySeed = { name = "Berry Seeds", category = "Farming", price = 0, rarity = "Common", color = C(80, 60, 160), buy = 4, seed = "Berry" },
	BeetSeed = { name = "Beet Seeds", category = "Farming", price = 0, rarity = "Common", color = C(150, 40, 80), buy = 6, seed = "Beet" },
	PumpkinSeed = { name = "Pumpkin Seeds", category = "Farming", price = 0, rarity = "Uncommon", color = C(240, 140, 40), buy = 12, seed = "Pumpkin" },
	SunbloomSeed = { name = "Sunbloom Seeds", category = "Farming", price = 0, rarity = "Rare", color = C(255, 210, 60), buy = 40, seed = "Sunbloom" },
	Wheat = { name = "Wheat", category = "Food", price = 3, rarity = "Common", color = C(230, 200, 110) },
	Berry = { name = "Duskberries", category = "Food", price = 5, rarity = "Common", color = C(80, 60, 170), food = 10 },
	Beet = { name = "Blood Beet", category = "Food", price = 9, rarity = "Uncommon", color = C(150, 30, 70), food = 14 },
	Pumpkin = { name = "Pumpkin", category = "Food", price = 18, rarity = "Uncommon", color = C(240, 140, 40), food = 20 },
	Sunbloom = { name = "Sunbloom", category = "Food", price = 45, rarity = "Rare", color = C(255, 220, 70) },

	-- FOOD -------------------------------------------------------------------
	Bread = { name = "Bread", category = "Food", price = 10, rarity = "Common", color = C(210, 160, 90), food = 30 },
	HoneyBun = { name = "Honey Bun", category = "Food", price = 22, rarity = "Uncommon", color = C(255, 190, 60), food = 45, heal = 25 },
	WarStew = { name = "War Stew", category = "Food", price = 30, rarity = "Rare", color = C(160, 60, 40), food = 50, heal = 40 },

	-- SIEGE ------------------------------------------------------------------
	Boulder = { name = "Boulder", category = "Siege", price = 2, rarity = "Common", color = C(120, 120, 120), ammo = "Catapult", buy = 8 },
	FirePot = { name = "Fire Pot", category = "Siege", price = 12, rarity = "Uncommon", color = C(255, 90, 30), ammo = "Catapult" },
	AcidFlask = { name = "Swamp Acid", category = "Siege", price = 20, rarity = "Rare", color = C(120, 255, 60), ammo = "Catapult" },
	SmokePot = { name = "Smoke Pot", category = "Siege", price = 25, rarity = "Rare", color = C(200, 200, 200), ammo = "Catapult" },
	BallistaBolt = { name = "Ballista Bolt", category = "Siege", price = 6, rarity = "Uncommon", color = C(170, 170, 180), ammo = "Ballista" },
	Catapult = { name = "Catapult", category = "Siege", price = 80, rarity = "Rare", color = C(140, 90, 50), build = "Catapult" },
	Ballista = { name = "Ballista", category = "Siege", price = 70, rarity = "Rare", color = C(140, 90, 50), build = "Ballista" },
	Ram = { name = "Battering Ram", category = "Siege", price = 60, rarity = "Rare", color = C(110, 75, 45), build = "Ram" },
}

for id, def in Items.List do
	def.id = id
end

function Items.Get(id: string)
	return Items.List[id]
end

return Items
