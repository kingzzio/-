-- PRIMORDIA ∞ server bootstrap. Loads every service, runs Init (wiring) then Start (loops).

local ServicesFolder = script.Parent:WaitForChild("Services")

local ORDER = {
	"DataService",
	"InventoryService",
	"DoomsdayService",
	"WorldService",
	"BuildService",
	"FactionService",
	"HarvestService",
	"CombatService",
	"SiegeService",
	"FarmService",
	"ShopService",
	"MegaServerService",
	"EventService",
}

local Services = {}
for _, name in ORDER do
	Services[name] = require(ServicesFolder:WaitForChild(name))
end

for _, name in ORDER do
	local s = Services[name]
	if s.Init then
		local ok, err = pcall(s.Init, s, Services)
		if not ok then
			warn("[Primordia] Init failed for", name, err)
		end
	end
end

for _, name in ORDER do
	local s = Services[name]
	if s.Start then
		task.spawn(function()
			local ok, err = pcall(s.Start, s)
			if not ok then
				warn("[Primordia] Start failed for", name, err)
			end
		end)
	end
end

print("[Primordia] world online — seed", require(game.ReplicatedStorage.Shared.Config).WorldSeed)
