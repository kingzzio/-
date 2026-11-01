-- Everything a player can place in the world.
-- class drives the siege damage matrix (rock-paper-scissors between ammo and wall tier).

local Buildables = {}
local C = Color3.fromRGB
local M = Enum.Material

Buildables.List = {
	-- WALLS (tier ladder) ----------------------------------------------------
	ThatchWall = { kind = "wall", class = "Thatch", hp = 150, size = Vector3.new(8, 8, 1), color = C(205, 185, 105), material = M.Grass },
	WoodWall = { kind = "wall", class = "Wood", hp = 450, size = Vector3.new(8, 8, 1), color = C(150, 100, 60), material = M.WoodPlanks },
	StoneWall = { kind = "wall", class = "Stone", hp = 1300, size = Vector3.new(8, 8, 1.4), color = C(130, 130, 135), material = M.Cobblestone },
	MetalWall = { kind = "wall", class = "Metal", hp = 3200, size = Vector3.new(8, 8, 1.2), color = C(185, 185, 195), material = M.DiamondPlate },
	HoneycombWall = { kind = "wall", class = "Honeycomb", hp = 6000, size = Vector3.new(8, 8, 1.6), color = C(255, 175, 30), material = M.Foil, regen = 0.02 },
	WoodFloor = { kind = "floor", class = "Wood", hp = 400, size = Vector3.new(8, 1, 8), color = C(170, 120, 75), material = M.WoodPlanks },
	WoodDoor = { kind = "door", class = "Wood", hp = 350, size = Vector3.new(4, 8, 1), color = C(140, 90, 50), material = M.Wood },
	IronGate = { kind = "door", class = "Metal", hp = 2600, size = Vector3.new(8, 8, 1), color = C(170, 170, 180), material = M.CorrodedMetal },
	Watchtower = { kind = "wall", class = "Wood", hp = 900, size = Vector3.new(6, 20, 6), color = C(150, 100, 60), material = M.WoodPlanks },

	-- STATIONS ---------------------------------------------------------------
	Workbench = { kind = "station", class = "Wood", hp = 300, size = Vector3.new(6, 3, 3), color = C(160, 110, 70), material = M.Wood },
	Forge = { kind = "station", class = "Stone", hp = 900, size = Vector3.new(5, 5, 5), color = C(90, 90, 95), material = M.Slate, glow = C(255, 120, 30) },
	SiegeWorkshop = { kind = "station", class = "Wood", hp = 1200, size = Vector3.new(10, 6, 8), color = C(120, 80, 50), material = M.WoodPlanks },
	Vault = { kind = "station", class = "Metal", hp = 5000, size = Vector3.new(4, 4, 4), color = C(110, 110, 120), material = M.DiamondPlate },

	-- FACTION ----------------------------------------------------------------
	Totem = { kind = "totem", class = "Stone", hp = 8000, size = Vector3.new(3, 14, 3), color = C(160, 70, 255), material = M.Neon },

	-- TRAPS / MIND GAMES -------------------------------------------------------
	Spikes = { kind = "trap", class = "Wood", hp = 200, size = Vector3.new(8, 1.5, 8), color = C(120, 90, 60), material = M.Wood, damage = 18, collide = false },
	TarPit = { kind = "trap", class = "Stone", hp = 400, size = Vector3.new(8, 0.4, 8), color = C(25, 25, 25), material = M.Mud, slow = 6, collide = false },
	DecoyChest = { kind = "trap", class = "Wood", hp = 100, size = Vector3.new(4, 3, 3), color = C(170, 120, 60), material = M.Wood, decoy = true },

	-- FARMING ------------------------------------------------------------------
	FarmPlot = { kind = "farm", class = "Wood", hp = 200, size = Vector3.new(8, 1, 8), color = C(110, 75, 45), material = M.Ground },
	Sprinkler = { kind = "farm", class = "Metal", hp = 300, size = Vector3.new(1.5, 4, 1.5), color = C(90, 150, 220), material = M.Metal, radius = 16 },
	Harvester = { kind = "farm", class = "Metal", hp = 900, size = Vector3.new(5, 5, 5), color = C(200, 160, 60), material = M.Metal, radius = 26 },
	MarketCart = { kind = "farm", class = "Wood", hp = 500, size = Vector3.new(6, 4, 4), color = C(170, 110, 60), material = M.WoodPlanks, radius = 30 },
	Beehive = { kind = "farm", class = "Wood", hp = 400, size = Vector3.new(3, 4, 3), color = C(255, 200, 60), material = M.WoodPlanks, radius = 20 },
	Scarecrow = { kind = "farm", class = "Wood", hp = 150, size = Vector3.new(2, 7, 2), color = C(200, 170, 90), material = M.Fabric, radius = 18 },

	-- SIEGE MACHINES -----------------------------------------------------------
	Catapult = { kind = "siege", class = "Machine", hp = 900, size = Vector3.new(6, 6, 10), color = C(140, 90, 50), material = M.WoodPlanks, range = 260, reload = 6 },
	Ballista = { kind = "siege", class = "Machine", hp = 700, size = Vector3.new(5, 4, 8), color = C(140, 90, 50), material = M.WoodPlanks, range = 340, reload = 3 },
	Ram = { kind = "siege", class = "Machine", hp = 1500, size = Vector3.new(5, 5, 12), color = C(110, 75, 45), material = M.Wood, reload = 2.2, damage = 260 },
}

-- Ammo → damage profile.
Buildables.Ammo = {
	Boulder = { damage = 320, radius = 9, type = "blunt" },
	FirePot = { damage = 140, radius = 12, type = "fire", burn = 6 },
	AcidFlask = { damage = 200, radius = 8, type = "acid" },
	SmokePot = { damage = 220, radius = 14, type = "smoke" },
	BallistaBolt = { damage = 260, radius = 3, type = "pierce" },
	RamHit = { damage = 260, radius = 6, type = "blunt" },
	Melee = { damage = 1, radius = 0, type = "melee" },
}

-- Rock-paper-scissors: [damageType][class] multiplier.
Buildables.Matrix = {
	blunt = { Thatch = 1.0, Wood = 1.0, Stone = 1.4, Metal = 0.8, Honeycomb = 0.55, Machine = 1.0 },
	fire = { Thatch = 3.0, Wood = 2.0, Stone = 0.2, Metal = 0.1, Honeycomb = 0.6, Machine = 1.5 },
	acid = { Thatch = 0.5, Wood = 0.7, Stone = 0.8, Metal = 2.4, Honeycomb = 0.7, Machine = 1.0 },
	smoke = { Thatch = 0.05, Wood = 0.05, Stone = 0.05, Metal = 0.05, Honeycomb = 3.2, Machine = 0.05 },
	pierce = { Thatch = 0.6, Wood = 0.8, Stone = 0.3, Metal = 0.3, Honeycomb = 0.3, Machine = 2.2 },
	melee = { Thatch = 0.6, Wood = 0.25, Stone = 0.05, Metal = 0.02, Honeycomb = 0.02, Machine = 0.5 },
}

function Buildables.Get(id: string)
	return Buildables.List[id]
end

return Buildables
