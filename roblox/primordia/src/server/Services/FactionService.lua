-- Factions: create, invite, ranks, wars/treaties, treasury, territory (Totems),
-- home spawns, raid alerts that reach members in ANY shard, and the global
-- "map control" leaderboard.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local MemoryStoreService = game:GetService("MemoryStoreService")
local MessagingService = game:GetService("MessagingService")
local TextService = game:GetService("TextService")
local HttpService = game:GetService("HttpService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)

local FactionService = {}
local S

local store, claimsMap
local okStore = pcall(function()
	store = DataStoreService:GetDataStore("Primordia_Factions_v1")
end)
local okMem = pcall(function()
	claimsMap = MemoryStoreService:GetSortedMap("Primordia_Claims_v1")
end)

local ALERT_TOPIC = "PRIM_Alert_v1"
local FACTION_TOPIC = "PRIM_Faction_v1"
local CLAIM_TTL = 45 * 86400

local cache: { [string]: { data: any, t: number } } = {}
local memoryOnly: { [string]: any } = {} -- Studio fallback
local claims: { [string]: { x: number, z: number, faction: string, tag: string, color: string } } = {}
local invites: { [Player]: { [string]: string } } = {} -- player → factionId → tag
local alertThrottle: { [string]: number } = {}

local COLORS = { "#A046FF", "#FF4655", "#3CA0FF", "#46E678", "#FFB428", "#FF78C8", "#28E6E6", "#F0F0F0" }

---------------------------------------------------------------------------
-- storage
---------------------------------------------------------------------------
local function read(id: string)
	if not id then
		return nil
	end
	local c = cache[id]
	if c and os.clock() - c.t < 60 then
		return c.data
	end
	local data
	if okStore and store then
		local ok, res = pcall(function()
			return store:GetAsync("f_" .. id)
		end)
		data = ok and res or (c and c.data)
	else
		data = memoryOnly[id]
	end
	cache[id] = { data = data, t = os.clock() }
	return data
end

local function write(id: string, mutate: (any) -> any?)
	local result
	if okStore and store then
		pcall(function()
			result = store:UpdateAsync("f_" .. id, function(old)
				if not old then
					return nil
				end
				return mutate(old)
			end)
		end)
	else
		if memoryOnly[id] then
			result = mutate(memoryOnly[id])
			memoryOnly[id] = result
		end
	end
	if result then
		cache[id] = { data = result, t = os.clock() }
		pcall(function()
			MessagingService:PublishAsync(FACTION_TOPIC, { id = id, s = game.JobId })
		end)
	end
	return result
end

function FactionService:Info(id: string?)
	return id and read(id)
end

local function rankOf(data, userId: number): string?
	return data and data.members[tostring(userId)]
end

local function setPlayerAttrs(player: Player, data)
	player:SetAttribute("Faction", data and data.id or nil)
	player:SetAttribute("FactionTag", data and data.tag or nil)
	player:SetAttribute("FactionColor", data and data.color or nil)
end

function FactionService:Push(player: Player)
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	local payload = nil
	if data then
		local members = {}
		for uid, rank in data.members do
			local online = Players:GetPlayerByUserId(tonumber(uid)) ~= nil
			table.insert(members, { userId = tonumber(uid), name = data.names[uid] or "?", rank = rank, online = online })
		end
		table.sort(members, function(a, b)
			local order = { Chief = 1, Officer = 2, Member = 3 }
			return (order[a.rank] or 9) < (order[b.rank] or 9)
		end)
		local wars = {}
		for otherId in data.war or {} do
			local o = read(otherId)
			if o then
				table.insert(wars, { tag = o.tag, mutual = (o.war or {})[data.id] == true })
			end
		end
		local totems = 0
		for _ in data.totems or {} do
			totems += 1
		end
		payload = {
			id = data.id, name = data.name, tag = data.tag, color = data.color,
			members = members, treasury = data.treasury or 0, totems = totems,
			maxTotems = Config.MaxTotemsPerFaction, wars = wars,
			myRank = rankOf(data, player.UserId), maxMembers = Config.MaxFactionMembers,
		}
	end
	local inv = {}
	for fid, tag in invites[player] or {} do
		table.insert(inv, { id = fid, tag = tag })
	end
	Remotes.FactionUpdate:FireClient(player, payload, inv, COLORS)
end

local function pushFaction(id: string)
	for _, p in Players:GetPlayers() do
		if p:GetAttribute("Faction") == id then
			FactionService:Push(p)
		end
	end
end

---------------------------------------------------------------------------
-- territory
---------------------------------------------------------------------------
function FactionService:ClaimAt(pos: Vector3)
	local r2 = Config.ClaimRadius * Config.ClaimRadius
	for _, c in claims do
		local dx, dz = c.x - pos.X, c.z - pos.Z
		if dx * dx + dz * dz <= r2 then
			return c
		end
	end
	return nil
end

function FactionService:CanPlaceTotem(player: Player, pos: Vector3): (boolean, string?)
	local id = player:GetAttribute("Faction")
	if not id then
		return false, "Join or create a faction first (F)"
	end
	local data = read(id)
	local n = 0
	for _ in data.totems or {} do
		n += 1
	end
	if n >= Config.MaxTotemsPerFaction then
		return false, "Totem limit reached (" .. Config.MaxTotemsPerFaction .. ")"
	end
	local minD = Config.ClaimRadius * 2
	for _, c in claims do
		if c.faction ~= id then
			local dx, dz = c.x - pos.X, c.z - pos.Z
			if dx * dx + dz * dz < minD * minD then
				return false, "Too close to [" .. c.tag .. "] territory"
			end
		end
	end
	return true
end

local function publishClaim(totemId: string, c)
	claims[totemId] = c
	if okMem and claimsMap then
		task.spawn(function()
			pcall(function()
				claimsMap:SetAsync(totemId, c, CLAIM_TTL)
			end)
		end)
	end
	Remotes.Claims:FireAllClients(claims)
end

function FactionService:TotemPlaced(factionId: string, rec)
	local data = write(factionId, function(d)
		d.totems = d.totems or {}
		d.totems[rec.id] = { rec.x, rec.y, rec.z }
		if not d.home then
			d.home = rec.id
		end
		return d
	end)
	if data then
		publishClaim(rec.id, { x = rec.x, z = rec.z, faction = factionId, tag = data.tag, color = data.color })
		for _, p in Players:GetPlayers() do
			if p:GetAttribute("Faction") == factionId then
				Remotes.Notify:FireClient(p, "TERRITORY CLAIMED", "good")
			end
		end
		pushFaction(factionId)
	end
end

function FactionService:TotemRemoved(factionId: string?, rec)
	claims[rec.id] = nil
	if okMem and claimsMap then
		task.spawn(function()
			pcall(function()
				claimsMap:RemoveAsync(rec.id)
			end)
		end)
	end
	Remotes.Claims:FireAllClients(claims)
	if factionId then
		write(factionId, function(d)
			if d.totems then
				d.totems[rec.id] = nil
			end
			if d.home == rec.id then
				d.home = next(d.totems or {})
			end
			return d
		end)
		self:Alert(factionId, nil, "A TOTEM HAS FALLEN — territory lost!", Vector3.new(rec.x, rec.y, rec.z))
		pushFaction(factionId)
	end
end

function FactionService:HomeFor(player: Player): Vector3?
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	local t = data and data.home and data.totems and data.totems[data.home]
	if t then
		return Vector3.new(t[1], t[2], t[3])
	end
	return nil
end

local function refreshClaims()
	if not (okMem and claimsMap) then
		return
	end
	local fresh = {}
	local exclusiveLower = nil
	for _ = 1, 20 do -- up to 4000 totems
		local ok, page = pcall(function()
			return claimsMap:GetRangeAsync(Enum.SortDirection.Ascending, 200, exclusiveLower)
		end)
		if not ok or not page or #page == 0 then
			break
		end
		for _, entry in page do
			fresh[entry.key] = entry.value
		end
		if #page < 200 then
			break
		end
		exclusiveLower = { key = page[#page].key }
	end
	claims = fresh
	Remotes.Claims:FireAllClients(claims)
end

---------------------------------------------------------------------------
-- war / alerts / vault
---------------------------------------------------------------------------
function FactionService:MutualWar(a: string, b: string): boolean
	local da, db = read(a), read(b)
	return da ~= nil and db ~= nil and (da.war or {})[b] == true and (db.war or {})[a] == true
end

local function deliverAlert(m)
	for _, p in Players:GetPlayers() do
		if (m.f and p:GetAttribute("Faction") == m.f) or (m.o and p.UserId == m.o) then
			local where = m.x and (" @ " .. m.x .. ", " .. m.z) or ""
			Remotes.Notify:FireClient(p, m.t .. where, "alert")
		end
	end
end

function FactionService:Alert(factionId: string?, ownerUserId: number?, text: string, pos: Vector3?)
	local throttleKey = tostring(factionId or ownerUserId) .. text
	if alertThrottle[throttleKey] and os.clock() - alertThrottle[throttleKey] < 12 then
		return
	end
	alertThrottle[throttleKey] = os.clock()
	local msg = { f = factionId, o = ownerUserId, t = text, x = pos and math.floor(pos.X), z = pos and math.floor(pos.Z), s = game.JobId }
	deliverAlert(msg)
	task.spawn(function()
		pcall(function()
			MessagingService:PublishAsync(ALERT_TOPIC, msg)
		end)
	end)
end

function FactionService:LootVault(defender: string?, attacker: string, attackerPlayer: Player?)
	if not defender then
		return
	end
	local stolen = 0
	write(defender, function(d)
		stolen = math.floor((d.treasury or 0) * 0.25)
		d.treasury = (d.treasury or 0) - stolen
		return d
	end)
	if stolen > 0 then
		write(attacker, function(d)
			d.treasury = (d.treasury or 0) + stolen
			return d
		end)
		if attackerPlayer then
			Remotes.Notify:FireClient(attackerPlayer, "VAULT CRACKED: +" .. stolen .. " to treasury", "big")
		end
		pushFaction(attacker)
		pushFaction(defender)
	end
end

---------------------------------------------------------------------------
-- actions
---------------------------------------------------------------------------
local function filterText(text: string, userId: number): string?
	local ok, result = pcall(function()
		return TextService:FilterStringAsync(text, userId):GetNonChatStringForBroadcastAsync()
	end)
	if not ok or string.find(result, "#") then
		return nil
	end
	return result
end

local Actions = {}

function Actions.create(player: Player, payload)
	if player:GetAttribute("Faction") then
		return "Leave your faction first"
	end
	if type(payload) ~= "table" then
		return "Bad request"
	end
	local name = tostring(payload.name or ""):sub(1, 22)
	local tag = string.upper(tostring(payload.tag or "")):gsub("[^%w]", ""):sub(1, 4)
	local color = table.find(COLORS, payload.color) and payload.color or COLORS[1]
	if #name < 3 or #tag < 2 then
		return "Name needs 3+ letters, tag 2–4"
	end
	local cleanName, cleanTag = filterText(name, player.UserId), filterText(tag, player.UserId)
	if not cleanName or not cleanTag then
		return "That name isn't allowed"
	end
	local profile = S.DataService:Get(player)
	if not profile or profile.coins < Config.FactionCreateCost then
		return "Costs " .. Config.FactionCreateCost .. " coins"
	end
	local id = string.sub(HttpService:GenerateGUID(false), 1, 8)
	-- reserve the tag globally
	if okStore and store then
		local taken = false
		pcall(function()
			store:UpdateAsync("tag_" .. cleanTag, function(old)
				if old then
					taken = true
					return nil
				end
				return id
			end)
		end)
		if taken then
			return "Tag [" .. cleanTag .. "] is taken"
		end
	end
	local data = {
		id = id, name = cleanName, tag = cleanTag, color = color, owner = player.UserId,
		members = { [tostring(player.UserId)] = "Chief" }, names = { [tostring(player.UserId)] = player.Name },
		created = os.time(), totems = {}, treasury = 0, war = {},
	}
	if okStore and store then
		local ok = pcall(function()
			store:SetAsync("f_" .. id, data)
		end)
		if not ok then
			return "Couldn't save — try again"
		end
	else
		memoryOnly[id] = data
	end
	cache[id] = { data = data, t = os.clock() }
	S.InventoryService:AddCoins(player, -Config.FactionCreateCost)
	profile.faction = id
	setPlayerAttrs(player, data)
	Remotes.Notify:FireAllClients("[" .. cleanTag .. "] " .. cleanName .. " has risen", "good")
	return nil
end

function Actions.invite(player: Player, payload)
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	local rank = rankOf(data, player.UserId)
	if rank ~= "Chief" and rank ~= "Officer" then
		return "Only Chiefs and Officers can invite"
	end
	local target = Players:GetPlayerByUserId(tonumber(payload) or 0)
	if not target or target:GetAttribute("Faction") then
		return "They can't be invited"
	end
	invites[target] = invites[target] or {}
	invites[target][id] = data.tag
	Remotes.Notify:FireClient(target, "Invited to [" .. data.tag .. "] — press F", "good")
	FactionService:Push(target)
	return nil
end

function Actions.accept(player: Player, payload)
	local id = tostring(payload)
	if not (invites[player] and invites[player][id]) or player:GetAttribute("Faction") then
		return "No such invite"
	end
	local full = false
	local data = write(id, function(d)
		local n = 0
		for _ in d.members do
			n += 1
		end
		if n >= Config.MaxFactionMembers then
			full = true
			return nil
		end
		d.members[tostring(player.UserId)] = "Member"
		d.names[tostring(player.UserId)] = player.Name
		return d
	end)
	if full or not data then
		return "Faction is full"
	end
	invites[player] = nil
	S.DataService:Get(player).faction = id
	setPlayerAttrs(player, data)
	pushFaction(id)
	return nil
end

function Actions.leave(player: Player)
	local id = player:GetAttribute("Faction")
	if not id then
		return "You're not in a faction"
	end
	local uid = tostring(player.UserId)
	write(id, function(d)
		d.members[uid] = nil
		if d.owner == player.UserId then
			local heir
			for m, r in d.members do
				if r == "Officer" or not heir then
					heir = m
				end
			end
			if heir then
				d.owner = tonumber(heir)
				d.members[heir] = "Chief"
			end
		end
		return d
	end)
	S.DataService:Get(player).faction = nil
	setPlayerAttrs(player, nil)
	pushFaction(id)
	return nil
end

function Actions.kick(player: Player, payload)
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	local myRank = rankOf(data, player.UserId)
	local targetId = tostring(payload)
	local theirRank = rankOf(data, targetId)
	if not theirRank or myRank == "Member" or theirRank == "Chief" or (myRank == "Officer" and theirRank == "Officer") then
		return "Not allowed"
	end
	write(id, function(d)
		d.members[targetId] = nil
		return d
	end)
	local target = Players:GetPlayerByUserId(tonumber(targetId))
	if target then
		S.DataService:Get(target).faction = nil
		setPlayerAttrs(target, nil)
		Remotes.Notify:FireClient(target, "You were removed from [" .. data.tag .. "]", "error")
		FactionService:Push(target)
	end
	pushFaction(id)
	return nil
end

function Actions.promote(player: Player, payload)
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	if rankOf(data, player.UserId) ~= "Chief" then
		return "Only the Chief can promote"
	end
	local targetId = tostring(payload)
	write(id, function(d)
		if d.members[targetId] == "Member" then
			d.members[targetId] = "Officer"
		elseif d.members[targetId] == "Officer" then
			d.members[targetId] = "Member"
		end
		return d
	end)
	pushFaction(id)
	return nil
end

local function factionByTag(tag: string): string?
	tag = string.upper(tostring(tag))
	for _, c in claims do
		if c.tag == tag then
			return c.faction
		end
	end
	if okStore and store then
		local ok, id = pcall(function()
			return store:GetAsync("tag_" .. tag)
		end)
		if ok then
			return id
		end
	end
	for id, d in memoryOnly do
		if d.tag == tag then
			return id
		end
	end
	return nil
end

function Actions.war(player: Player, payload)
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	if rankOf(data, player.UserId) ~= "Chief" then
		return "Only the Chief can declare war"
	end
	local other = factionByTag(payload)
	if not other or other == id then
		return "No faction with that tag"
	end
	write(id, function(d)
		d.war = d.war or {}
		d.war[other] = true
		return d
	end)
	local o = read(other)
	Remotes.Notify:FireAllClients("[" .. data.tag .. "] DECLARED WAR ON [" .. (o and o.tag or "?") .. "]", "doom")
	FactionService:Alert(other, nil, "[" .. data.tag .. "] declared war on you. Declare back to make it mutual.", nil)
	pushFaction(id)
	return nil
end

function Actions.peace(player: Player, payload)
	local id = player:GetAttribute("Faction")
	local data = id and read(id)
	if rankOf(data, player.UserId) ~= "Chief" then
		return "Only the Chief can make peace"
	end
	local other = factionByTag(payload)
	if not other then
		return "No faction with that tag"
	end
	write(id, function(d)
		if d.war then
			d.war[other] = nil
		end
		return d
	end)
	pushFaction(id)
	return nil
end

function Actions.deposit(player: Player, payload)
	local id = player:GetAttribute("Faction")
	local amount = math.floor(tonumber(payload) or 0)
	local profile = S.DataService:Get(player)
	if not id or amount <= 0 or not profile or profile.coins < amount then
		return "Not enough coins"
	end
	S.InventoryService:AddCoins(player, -amount)
	write(id, function(d)
		d.treasury = (d.treasury or 0) + amount
		return d
	end)
	pushFaction(id)
	return nil
end

function Actions.refresh(player: Player)
	FactionService:Push(player)
	return nil
end

---------------------------------------------------------------------------
function FactionService:Init(services)
	S = services

	S.DataService:OnLoaded(function(player, profile)
		local data = profile.faction and read(profile.faction)
		if data and not data.members[tostring(player.UserId)] then
			profile.faction = nil -- kicked while offline
			data = nil
		end
		setPlayerAttrs(player, data)
		self:Push(player)
		Remotes.Claims:FireClient(player, claims)
	end)
	Players.PlayerRemoving:Connect(function(p)
		invites[p] = nil
	end)

	Remotes.FactionAction.OnServerEvent:Connect(function(player, action, payload)
		local fn = typeof(action) == "string" and Actions[action]
		if not fn then
			return
		end
		local err = fn(player, payload)
		if err then
			Remotes.Notify:FireClient(player, err, "error")
		end
		self:Push(player)
	end)

	pcall(function()
		MessagingService:SubscribeAsync(ALERT_TOPIC, function(message)
			local m = message.Data
			if type(m) == "table" and m.s ~= game.JobId then
				deliverAlert(m)
			end
		end)
		MessagingService:SubscribeAsync(FACTION_TOPIC, function(message)
			local m = message.Data
			if type(m) == "table" and m.s ~= game.JobId and m.id then
				cache[m.id] = nil
				for _, p in Players:GetPlayers() do
					if p:GetAttribute("Faction") == m.id then
						local data = read(m.id)
						if data and not data.members[tostring(p.UserId)] then
							S.DataService:Get(p).faction = nil
							setPlayerAttrs(p, nil)
						end
						self:Push(p)
					end
				end
			end
		end)
	end)
end

-- Global leaderboard: share of all claimed land per faction.
function FactionService:Leaderboard()
	local byTag, total = {}, 0
	for _, c in claims do
		byTag[c.tag] = byTag[c.tag] or { tag = c.tag, color = c.color, totems = 0 }
		byTag[c.tag].totems += 1
		total += 1
	end
	local list = {}
	for _, v in byTag do
		v.share = total > 0 and v.totems / total or 0
		table.insert(list, v)
	end
	table.sort(list, function(a, b)
		return a.totems > b.totems
	end)
	return list
end

function FactionService:Start()
	Remotes.GetLeaderboard.OnServerInvoke = function()
		return self:Leaderboard()
	end
	while true do
		refreshClaims()
		task.wait(30)
	end
end

return FactionService
