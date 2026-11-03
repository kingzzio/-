-- MEGA-WORLD: how "infinite players in one server" actually works.
--
-- A single Roblox server can only hold a limited number of players. PRIMORDIA gets
-- around that by making every server a *shard* of the SAME world:
--   1. Terrain, nodes and ruins come from one seed  → identical everywhere.
--   2. Builds, factions, claims and the market live in DataStores/MemoryStores
--      shared by all shards (see BuildService / FactionService / ShopService).
--   3. This service makes the other shards' players *visible*: each shard
--      broadcasts its players' positions and shows everyone else as "Echoes"
--      (ghost silhouettes + map markers). Walk up to an Echo and you can hop into
--      their shard to meet them for real.
--   4. The server card shows the live total across every shard: "13,427 of ∞".

local Players = game:GetService("Players")
local MemoryStoreService = game:GetService("MemoryStoreService")
local MessagingService = game:GetService("MessagingService")
local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)

local MegaServerService = {}
local S

local ECHO_TOPIC = "PRIM_Echo_v1"
local shards
local okMem = pcall(function()
	shards = MemoryStoreService:GetSortedMap("Primordia_Shards_v1")
end)

local echoes: { [number]: any } = {}
local shardCount = 1
local echoInterval = Config.EchoBaseInterval

local function shortId(): string
	local id = game.JobId
	if id == "" then
		return "studio"
	end
	return string.sub(id, 1, 4) .. "-" .. string.sub(id, -4)
end

local function heartbeat()
	local mine = #Players:GetPlayers()
	local total, count = mine, 1
	if okMem and shards and game.JobId ~= "" then
		pcall(function()
			shards:SetAsync(game.JobId, mine, Config.ShardHeartbeat * 3)
		end)
		total, count = 0, 0
		local lower = nil
		for _ = 1, 50 do
			local ok, page = pcall(function()
				return shards:GetRangeAsync(Enum.SortDirection.Ascending, 200, lower)
			end)
			if not ok or not page or #page == 0 then
				break
			end
			for _, e in page do
				total += tonumber(e.value) or 0
				count += 1
			end
			if #page < 200 then
				break
			end
			lower = { key = page[#page].key }
		end
		total = math.max(total, mine)
		count = math.max(count, 1)
	end
	shardCount = count
	-- scale broadcast rate with shard count so we stay inside MessagingService limits
	echoInterval = Config.EchoBaseInterval * math.max(1, count / 6)
	ReplicatedStorage:SetAttribute("GlobalPlayers", total)
	ReplicatedStorage:SetAttribute("ShardCount", count)
	ReplicatedStorage:SetAttribute("ShardId", shortId())
	ReplicatedStorage:SetAttribute("ShardPlayers", mine)
	ReplicatedStorage:SetAttribute("ShardMax", Players.MaxPlayers)
end

local function broadcastEchoes()
	if game.JobId == "" then
		return
	end
	local batch, size = {}, 0
	local function send()
		if #batch == 0 then
			return
		end
		local msg = { j = game.JobId, p = batch }
		batch, size = {}, 0
		pcall(function()
			MessagingService:PublishAsync(ECHO_TOPIC, msg)
		end)
	end
	for _, p in Players:GetPlayers() do
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		if root then
			local e = { p.UserId, p.DisplayName, math.floor(root.Position.X), math.floor(root.Position.Z), p:GetAttribute("FactionTag"), p:GetAttribute("FactionColor") }
			local len = #HttpService:JSONEncode(e)
			if size + len > 850 then
				send()
			end
			table.insert(batch, e)
			size += len
		end
	end
	send()
end

local function pushToClients()
	local now = os.clock()
	local ttl = echoInterval * 3 + 5
	for uid, e in echoes do
		if now - e.t > ttl or Players:GetPlayerByUserId(uid) then
			echoes[uid] = nil
		end
	end
	for _, p in Players:GetPlayers() do
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		if root then
			local list = {}
			for uid, e in echoes do
				local dx, dz = e.x - root.Position.X, e.z - root.Position.Z
				if dx * dx + dz * dz < 2500 * 2500 then
					table.insert(list, { id = uid, n = e.n, x = e.x, z = e.z, tag = e.tag, c = e.c, j = e.j })
				end
				if #list >= 60 then
					break
				end
			end
			Remotes.Echoes:FireClient(p, list)
		end
	end
end

function MegaServerService:Init(services)
	S = services
	Remotes.Ping.OnServerInvoke = function()
		return true
	end
	pcall(function()
		MessagingService:SubscribeAsync(ECHO_TOPIC, function(message)
			local m = message.Data
			if type(m) ~= "table" or m.j == game.JobId then
				return
			end
			for _, e in m.p or {} do
				echoes[e[1]] = { n = e[2], x = e[3], z = e[4], tag = e[5], c = e[6], j = m.j, t = os.clock() }
			end
		end)
	end)
	Remotes.JoinEcho.OnServerEvent:Connect(function(player, jobId)
		if typeof(jobId) ~= "string" then
			return
		end
		local known = false
		for _, e in echoes do
			if e.j == jobId then
				known = true
				break
			end
		end
		if not known then
			return
		end
		Remotes.Notify:FireClient(player, "Shard-hopping...", "info")
		S.DataService:Save(player, true)
		local ok, err = pcall(function()
			TeleportService:TeleportToPlaceInstance(game.PlaceId, jobId, player)
		end)
		if not ok then
			Remotes.Notify:FireClient(player, "That shard is full — try again soon", "error")
			warn(err)
		end
	end)
	heartbeat()
end

function MegaServerService:Start()
	task.spawn(function()
		while true do
			task.wait(Config.ShardHeartbeat)
			heartbeat()
		end
	end)
	task.spawn(function()
		while true do
			task.wait(2)
			pushToClients()
		end
	end)
	while true do
		task.wait(echoInterval)
		broadcastEchoes()
	end
end

return MegaServerService
