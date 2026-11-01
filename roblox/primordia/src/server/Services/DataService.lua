-- Player profiles: coins, inventory, faction, stats. DataStore-backed with a
-- light session lock so the same account in two shards can't dupe items.
-- Falls back to memory-only in Studio when API access is off.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)

local DataService = {}
DataService.Profiles = {} :: { [Player]: any }
DataService._loadedCallbacks = {}
DataService._leavingCallbacks = {}

local store
local okStore = pcall(function()
	store = DataStoreService:GetDataStore("Primordia_Players_v1")
end)
local LOCK_TTL = 90

local function defaultProfile()
	return {
		coins = Config.StartingCoins,
		inventory = { Hammer = 1, Fiber = 4, WheatSeed = 3 },
		favorites = {},
		faction = nil,
		hunger = 100,
		lastPos = nil,
		stats = { harvested = 0, built = 0, raided = 0, sold = 0, kills = 0, chests = 0, earned = 0 },
		joined = os.time(),
		tutorial = 1,
		lock = nil,
	}
end

local function reconcile(p)
	local d = defaultProfile()
	for k, v in d do
		if p[k] == nil then
			p[k] = v
		end
	end
	for k, v in d.stats do
		if p.stats[k] == nil then
			p.stats[k] = v
		end
	end
	return p
end

local function key(player: Player)
	return "u_" .. player.UserId
end

function DataService:OnLoaded(cb)
	table.insert(self._loadedCallbacks, cb)
	for plr, prof in self.Profiles do
		task.spawn(cb, plr, prof)
	end
end

function DataService:OnLeaving(cb)
	table.insert(self._leavingCallbacks, cb)
end

function DataService:Get(player: Player)
	return self.Profiles[player]
end

function DataService:WaitFor(player: Player, timeout: number?)
	local t = 0
	while not self.Profiles[player] and player.Parent and t < (timeout or 30) do
		t += task.wait(0.1)
	end
	return self.Profiles[player]
end

local function load(player: Player)
	local profile
	if okStore and store then
		for attempt = 1, 5 do
			local ok, result = pcall(function()
				return store:UpdateAsync(key(player), function(old)
					old = old or defaultProfile()
					-- Session lock: refuse if another live shard holds it.
					if old.lock and old.lock.job ~= game.JobId and os.time() - old.lock.t < LOCK_TTL then
						return nil
					end
					old.lock = { job = game.JobId, t = os.time() }
					return old
				end)
			end)
			if ok and result then
				profile = result
				break
			end
			task.wait(attempt * 1.5)
		end
		if not profile then
			player:Kick("Your profile is still open in another shard. Try again in a minute.")
			return
		end
	else
		profile = defaultProfile()
	end
	profile = reconcile(profile)
	DataService.Profiles[player] = profile
	for _, cb in DataService._loadedCallbacks do
		task.spawn(cb, player, profile)
	end
end

function DataService:Save(player: Player, release: boolean?)
	local profile = self.Profiles[player]
	if not profile or not (okStore and store) then
		return
	end
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if root then
		profile.lastPos = { root.Position.X, root.Position.Y, root.Position.Z }
	end
	pcall(function()
		store:UpdateAsync(key(player), function(old)
			if old and old.lock and old.lock.job ~= game.JobId and os.time() - old.lock.t < LOCK_TTL then
				return nil -- someone else owns it now; don't clobber
			end
			profile.lock = (not release) and { job = game.JobId, t = os.time() } or nil
			return profile
		end)
	end)
end

function DataService:Init()
	Players.PlayerAdded:Connect(load)
	for _, p in Players:GetPlayers() do
		task.spawn(load, p)
	end
	Players.PlayerRemoving:Connect(function(player)
		for _, cb in self._leavingCallbacks do
			pcall(cb, player, self.Profiles[player])
		end
		self:Save(player, true)
		self.Profiles[player] = nil
	end)
	game:BindToClose(function()
		for _, p in Players:GetPlayers() do
			task.spawn(function()
				self:Save(p, true)
			end)
		end
		task.wait(3)
	end)
end

function DataService:Start()
	while true do
		task.wait(60)
		for player in self.Profiles do
			task.spawn(function()
				self:Save(player, false)
			end)
		end
	end
end

return DataService
