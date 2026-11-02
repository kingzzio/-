-- Player construction: placement rules, persistence, cross-shard sync, damage,
-- repair, honeycomb layering, traps, doors.
--
-- Persistence model (this is what makes ONE world shared by MANY servers):
--   * Each chunk's builds live in DataStore key "c_<cx>_<cz>" as { [buildId] = record }.
--   * Edits are queued as ops and merged with UpdateAsync, so two shards editing
--     the same chunk never overwrite each other.
--   * Every edit is also broadcast on MessagingService so shards that currently
--     have that chunk loaded see the change within ~1s.
--   * A region index (8x8 chunks per key) records which chunks contain builds so
--     we don't spend DataStore budget reading empty wilderness.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local MessagingService = game:GetService("MessagingService")
local HttpService = game:GetService("HttpService")
local Debris = game:GetService("Debris")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Items = require(Shared.Items)
local Buildables = require(Shared.Buildables)
local WorldGen = require(Shared.WorldGen)
local Remotes = require(Shared.Remotes)
local BuildModels = require(Shared.BuildModels)

local BuildService = {}
local S

local TOPIC = "PRIM_Build_v1"
local REGION = 8

local store, okStore
okStore = pcall(function()
	store = DataStoreService:GetDataStore("Primordia_Builds_v1")
end)

local buildsFolder: Folder
local chunkFolders: { [string]: Folder } = {}
local builds: { [string]: { model: Model, rec: any, key: string } } = {}
local pendingOps: { [string]: { any } } = {}
local regionCache: { [string]: { t: number, set: { [string]: boolean } } } = {}
local lastDamaged: { [string]: number } = {}
local spawnCallbacks = {}

local C = Color3.fromRGB

---------------------------------------------------------------------------
-- helpers
---------------------------------------------------------------------------
local function regionKeyOf(chunkKey: string): string
	local cx, cz = string.match(chunkKey, "^(-?%d+)_(-?%d+)$")
	return "r_" .. math.floor(tonumber(cx) / REGION) .. "_" .. math.floor(tonumber(cz) / REGION)
end

local function chunkKeyAt(pos: Vector3): string
	return WorldGen.ChunkKey(WorldGen.ChunkOf(pos))
end

local function publish(msg)
	msg.s = game.JobId
	task.spawn(function()
		pcall(function()
			MessagingService:PublishAsync(TOPIC, msg)
		end)
	end)
end

local function queueOp(key: string, op)
	pendingOps[key] = pendingOps[key] or {}
	table.insert(pendingOps[key], op)
end

function BuildService:OnSpawned(cb)
	table.insert(spawnCallbacks, cb)
end

function BuildService:Get(id: string)
	return builds[id]
end

function BuildService:All()
	return builds
end

---------------------------------------------------------------------------
-- visuals
---------------------------------------------------------------------------
local function addPart(model: Model, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material, collide: boolean?): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material
	p.CanCollide = collide ~= false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	return p
end

local function decorate(model: Model, kind: string, main: Part, rec)
	local size = main.Size
	BuildModels.Decorate(model, kind, main)
	if kind == "Totem" then
		local col = rec.c and Color3.fromHex(rec.c) or C(160, 70, 255)
		BuildModels.ApplyTrim(model, col)
		local light = Instance.new("PointLight")
		light.Color = col
		light.Range = 40
		light.Brightness = 2
		light.Parent = main
		local bb = Instance.new("BillboardGui")
		bb.Size = UDim2.fromOffset(200, 50)
		bb.StudsOffset = Vector3.new(0, size.Y / 2 + 5, 0)
		bb.MaxDistance = 400
		local t = Instance.new("TextLabel")
		t.BackgroundTransparency = 1
		t.Size = UDim2.fromScale(1, 1)
		t.Font = Enum.Font.FredokaOne
		t.TextScaled = true
		t.TextColor3 = col
		t.TextStrokeTransparency = 0
		t.Text = "[" .. (rec.tag or "???") .. "]"
		t.Parent = bb
		bb.Parent = main
	elseif rec.f then
		-- paint trims in the owner's faction colour (looked up off-thread)
		task.spawn(function()
			local info = S.FactionService:Info(rec.f)
			if info and info.color and model.Parent then
				BuildModels.ApplyTrim(model, Color3.fromHex(info.color))
			end
		end)
	end
	if kind == "Harvester" or kind == "MarketCart" or kind == "Beehive" then
		local bb = Instance.new("BillboardGui")
		bb.Name = "Status"
		bb.Size = UDim2.fromOffset(180, 40)
		bb.StudsOffset = Vector3.new(0, size.Y / 2 + 2.5, 0)
		bb.MaxDistance = 80
		local t = Instance.new("TextLabel")
		t.Name = "Label"
		t.BackgroundTransparency = 1
		t.Size = UDim2.fromScale(1, 1)
		t.Font = Enum.Font.GothamBold
		t.TextScaled = true
		t.TextColor3 = Color3.new(1, 1, 1)
		t.TextStrokeTransparency = 0.3
		t.Text = ""
		t.Parent = bb
		bb.Parent = main
	end
end

local function spawnRecord(key: string, rec)
	if builds[rec.id] then
		return builds[rec.id].model
	end
	local def = Buildables.Get(rec.t)
	if not def then
		return nil
	end
	local folder = chunkFolders[key]
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = key
		folder.Parent = buildsFolder
		chunkFolders[key] = folder
	end
	local model = Instance.new("Model")
	model.Name = rec.t
	local cf = CFrame.new(rec.x, rec.y, rec.z) * CFrame.Angles(0, math.rad(rec.r or 0), 0)
	local main = addPart(model, def.size, cf, def.color, def.material, def.collide)
	main.Name = "Main"
	model.PrimaryPart = main
	if def.glow then
		local l = Instance.new("PointLight")
		l.Color = def.glow
		l.Parent = main
	end
	decorate(model, rec.t, main, rec)
	model:SetAttribute("BuildId", rec.id)
	model:SetAttribute("Kind", rec.t)
	model:SetAttribute("Class", def.class)
	model:SetAttribute("BuildType", def.kind)
	model:SetAttribute("HP", rec.hp)
	model:SetAttribute("MaxHP", def.hp)
	model:SetAttribute("Owner", rec.o)
	model:SetAttribute("Faction", rec.f)
	model.Parent = folder
	builds[rec.id] = { model = model, rec = rec, key = key }
	for _, cb in spawnCallbacks do
		task.spawn(cb, model, rec)
	end
	return model
end

local function removeLocal(id: string, effect: boolean?)
	local b = builds[id]
	if not b then
		return
	end
	builds[id] = nil
	if effect and b.model.PrimaryPart then
		local boom = Instance.new("Explosion")
		boom.BlastPressure = 0
		boom.DestroyJointRadiusPercent = 0
		boom.BlastRadius = 1
		boom.Position = b.model.PrimaryPart.Position
		boom.Parent = workspace
		-- debris chunks, like the rubble in the trailer shot
		for _ = 1, 6 do
			local d = Instance.new("Part")
			d.Size = Vector3.new(1.2, 1.2, 1.2)
			local sample = b.model:FindFirstChildWhichIsA("BasePart", true)
			for _, part in b.model:GetChildren() do
				if part:IsA("BasePart") and part.Transparency < 1 then
					sample = part
					break
				end
			end
			d.Color = sample.Color
			d.Material = sample.Material
			d.CFrame = b.model.PrimaryPart.CFrame * CFrame.new(math.random(-3, 3), math.random(0, 3), math.random(-1, 1))
			d.AssemblyLinearVelocity = Vector3.new(math.random(-25, 25), math.random(15, 35), math.random(-25, 25))
			d.CanCollide = true
			d.Parent = workspace
			Debris:AddItem(d, 6)
		end
	end
	b.model:Destroy()
end

---------------------------------------------------------------------------
-- persistence
---------------------------------------------------------------------------
local function getRegionSet(regionKey: string): { [string]: boolean }
	local cached = regionCache[regionKey]
	if cached and os.clock() - cached.t < 300 then
		return cached.set
	end
	local set = {}
	if okStore and store then
		local ok, data = pcall(function()
			return store:GetAsync(regionKey)
		end)
		if ok and data then
			set = data
		end
	end
	regionCache[regionKey] = { t = os.clock(), set = set }
	return set
end

local function loadChunkBuilds(key: string)
	if not (okStore and store) then
		return
	end
	local set = getRegionSet(regionKeyOf(key))
	if not set[key] then
		return
	end
	local ok, data = pcall(function()
		return store:GetAsync("c_" .. key)
	end)
	if ok and data and S.WorldService:IsLoaded(key) then
		for _, rec in data do
			spawnRecord(key, rec)
		end
	end
end

local function flush()
	if not (okStore and store) then
		pendingOps = {}
		return
	end
	local ops = pendingOps
	pendingOps = {}
	for key, list in ops do
		local addedAny = false
		local ok = pcall(function()
			store:UpdateAsync("c_" .. key, function(old)
				old = old or {}
				for _, op in list do
					if op.op == "add" then
						old[op.rec.id] = op.rec
						addedAny = true
					elseif op.op == "del" then
						old[op.id] = nil
					elseif op.op == "hp" and old[op.id] then
						old[op.id].hp = op.hp
					elseif op.op == "data" and old[op.id] then
						old[op.id].d = op.d
					end
				end
				return old
			end)
		end)
		if not ok then
			-- requeue on failure
			pendingOps[key] = pendingOps[key] or {}
			for _, op in list do
				table.insert(pendingOps[key], op)
			end
		elseif addedAny then
			local rk = regionKeyOf(key)
			pcall(function()
				store:UpdateAsync(rk, function(old)
					old = old or {}
					old[key] = true
					return old
				end)
			end)
			if regionCache[rk] then
				regionCache[rk].set[key] = true
			end
		end
	end
end

-- Save mutable per-build data (crop timers, harvester storage, etc.)
function BuildService:SetData(id: string, data)
	local b = builds[id]
	if not b then
		return
	end
	b.rec.d = data
	queueOp(b.key, { op = "data", id = id, d = data })
end

---------------------------------------------------------------------------
-- placement
---------------------------------------------------------------------------
function BuildService:Place(player: Player, itemId: string, cf: CFrame): (boolean, string?)
	local item = Items.Get(itemId)
	local def = item and item.build and Buildables.Get(item.build)
	if not def then
		return false, "Can't place that"
	end
	if S.InventoryService:Count(player, itemId) < 1 then
		return false, "You don't have that"
	end
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not root or (root.Position - cf.Position).Magnitude > Config.BuildReach then
		return false, "Too far away"
	end
	-- snap to grid + 90° rotations
	local g = Config.Grid
	local pos = cf.Position
	pos = Vector3.new(math.round(pos.X / g) * g, math.round(pos.Y * 2) / 2, math.round(pos.Z / g) * g)
	local _, ry = cf:ToOrientation()
	local rot = (math.round(math.deg(ry) / 90) * 90) % 360
	local final = CFrame.new(pos) * CFrame.Angles(0, math.rad(rot), 0)

	-- overlap check against other builds
	local params = OverlapParams.new()
	params.FilterType = Enum.RaycastFilterType.Include
	params.FilterDescendantsInstances = { buildsFolder }
	if #workspace:GetPartBoundsInBox(final, def.size * 0.9, params) > 0 then
		return false, "Something is in the way"
	end

	if WorldGen.InHub(pos, 24) then
		return false, "The hub is a safe zone — build out in the wilds"
	end

	local faction = player:GetAttribute("Faction")
	local claim = S.FactionService:ClaimAt(pos)
	if claim and claim.faction ~= faction then
		local isSiege = def.kind == "siege"
		if not (isSiege and S.DoomsdayService:CanRaid(faction, claim.faction)) then
			return false, "Claimed by [" .. claim.tag .. "]"
		end
	end

	local rec = {
		id = string.sub(HttpService:GenerateGUID(false), 1, 13),
		t = item.build,
		x = pos.X,
		y = pos.Y,
		z = pos.Z,
		r = rot,
		hp = def.hp,
		o = player.UserId,
		f = faction,
	}

	if def.kind == "totem" then
		local ok, why = S.FactionService:CanPlaceTotem(player, pos)
		if not ok then
			return false, why
		end
		local info = S.FactionService:Info(faction)
		rec.tag = info and info.tag
		rec.c = info and info.color
	end

	if not S.InventoryService:Take(player, { [itemId] = 1 }) then
		return false, "You don't have that"
	end

	local key = chunkKeyAt(pos)
	spawnRecord(key, rec)
	queueOp(key, { op = "add", rec = rec })
	publish({ op = "add", k = key, rec = rec })
	if def.kind == "totem" then
		S.FactionService:TotemPlaced(faction, rec)
	end
	local profile = S.DataService:Get(player)
	if profile then
		profile.stats.built += 1
	end
	return true
end

function BuildService:Remove(id: string, effect: boolean?)
	local b = builds[id]
	if not b then
		return
	end
	local key, rec = b.key, b.rec
	removeLocal(id, effect)
	queueOp(key, { op = "del", id = id })
	publish({ op = "del", k = key, id = id, fx = effect })
	if rec.t == "Totem" then
		S.FactionService:TotemRemoved(rec.f, rec)
	end
end

---------------------------------------------------------------------------
-- damage / repair
---------------------------------------------------------------------------
local function honeycombBonus(model: Model, dir: Vector3?): number
	if not dir or dir.Magnitude < 0.01 then
		return 0
	end
	-- Count the extra wall layers standing behind this one along the attack direction.
	local main = model.PrimaryPart
	local layers = 0
	local origin = main.Position
	local unit = dir.Unit
	local ignore = { model }
	for _ = 1, 4 do
		local rp = RaycastParams.new()
		rp.FilterType = Enum.RaycastFilterType.Exclude
		rp.FilterDescendantsInstances = ignore
		local hit = workspace:Raycast(origin, unit * 12, rp)
		if not hit then
			break
		end
		local m = hit.Instance:FindFirstAncestorOfClass("Model")
		if not m or not m:GetAttribute("BuildId") or m:GetAttribute("BuildType") ~= "wall" then
			break
		end
		layers += 1
		table.insert(ignore, m)
		origin = hit.Position
	end
	return math.min(layers * Config.HoneycombLayerBonus, Config.HoneycombMaxBonus)
end

-- Returns damage actually dealt (0 if not allowed).
function BuildService:Damage(model: Model, base: number, dmgType: string, attacker: Player?, dir: Vector3?): number
	local id = model:GetAttribute("BuildId")
	local b = id and builds[id]
	if not b then
		return 0
	end
	local attackerFaction = attacker and attacker:GetAttribute("Faction")
	local ownerFaction = b.rec.f
	local isOwn = attacker and (b.rec.o == attacker.UserId or (attackerFaction and attackerFaction == ownerFaction))
	if isOwn then
		return 0
	end
	if not S.DoomsdayService:CanRaid(attackerFaction, ownerFaction) then
		if attacker then
			Remotes.Notify:FireClient(attacker, "Raiding unlocks at DOOMSDAY (or declare mutual war)", "error")
		end
		return 0
	end
	local def = Buildables.Get(b.rec.t)
	local mult = (Buildables.Matrix[dmgType] or Buildables.Matrix.blunt)[def.class] or 1
	local reduction = honeycombBonus(model, dir)
	local dmg = base * mult * (1 - reduction)
	b.rec.hp = math.max(0, b.rec.hp - dmg)
	model:SetAttribute("HP", b.rec.hp)
	lastDamaged[id] = os.clock()

	if b.rec.hp <= 0 then
		if attacker then
			local profile = S.DataService:Get(attacker)
			if profile then
				profile.stats.raided += 1
			end
		end
		S.FactionService:Alert(ownerFaction, b.rec.o, def and (b.rec.t .. " destroyed!") or "Structure destroyed", Vector3.new(b.rec.x, b.rec.y, b.rec.z))
		if b.rec.t == "Vault" and attackerFaction then
			S.FactionService:LootVault(ownerFaction, attackerFaction, attacker)
		end
		self:Remove(id, true)
	else
		-- throttle HP sync: persist + broadcast at 10% steps
		local bucket = math.floor(b.rec.hp / def.hp * 10)
		if bucket ~= b.lastBucket then
			b.lastBucket = bucket
			queueOp(b.key, { op = "hp", id = id, hp = b.rec.hp })
			publish({ op = "hp", k = b.key, id = id, hp = b.rec.hp })
			if bucket <= 5 then
				S.FactionService:Alert(ownerFaction, b.rec.o, "Your base is under attack!", Vector3.new(b.rec.x, b.rec.y, b.rec.z))
			end
		end
	end
	return dmg
end

-- Hammer: repair own builds, or pick up a pristine one.
function BuildService:HammerHit(player: Player, model: Model)
	local id = model:GetAttribute("BuildId")
	local b = id and builds[id]
	if not b then
		return
	end
	local fac = player:GetAttribute("Faction")
	if not (b.rec.o == player.UserId or (fac and fac == b.rec.f)) then
		return
	end
	local def = Buildables.Get(b.rec.t)
	if b.rec.hp >= def.hp then
		if b.rec.o == player.UserId then
			local itemId
			for iid, it in Items.List do
				if it.build == b.rec.t then
					itemId = iid
					break
				end
			end
			self:Remove(id, false)
			if itemId then
				S.InventoryService:Add(player, itemId, 1)
			end
		end
		return
	end
	if lastDamaged[id] and os.clock() - lastDamaged[id] < 30 then
		Remotes.Notify:FireClient(player, "Can't repair while under attack", "error")
		return
	end
	b.rec.hp = math.min(def.hp, b.rec.hp + def.hp * 0.1)
	model:SetAttribute("HP", b.rec.hp)
	queueOp(b.key, { op = "hp", id = id, hp = b.rec.hp })
end

function BuildService:FindNearby(player: Player, kind: string, range: number): any
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not root then
		return nil
	end
	for _, st in S.WorldService.HubStations or {} do
		if st.kind == kind and (st.pos - root.Position).Magnitude <= range + 6 then
			return st -- hub stations work for everyone
		end
	end
	for _, b in builds do
		if b.rec.t == kind and b.model.PrimaryPart and (b.model.PrimaryPart.Position - root.Position).Magnitude <= range then
			return b.model
		end
	end
	return nil
end

function BuildService:InRadius(pos: Vector3, radius: number, kind: string?): { any }
	local out = {}
	for _, b in builds do
		if (not kind or b.rec.t == kind) and b.model.PrimaryPart and (b.model.PrimaryPart.Position - pos).Magnitude <= radius then
			table.insert(out, b)
		end
	end
	return out
end

---------------------------------------------------------------------------
-- behaviours attached on spawn: doors, traps, decoys
---------------------------------------------------------------------------
local function canUse(player: Player, rec): boolean
	local fac = player:GetAttribute("Faction")
	return rec.o == player.UserId or (fac ~= nil and fac == rec.f)
end

local function attachBehaviour(model: Model, rec)
	local def = Buildables.Get(rec.t)
	local main = model.PrimaryPart
	if def.kind == "door" then
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Open"
		prompt.ObjectText = Items.List[rec.t] and Items.List[rec.t].name or rec.t
		prompt.Parent = main
		local open = false
		prompt.Triggered:Connect(function(player)
			if not canUse(player, rec) then
				Remotes.Notify:FireClient(player, "Locked", "error")
				return
			end
			open = not open
			for _, part in model:GetDescendants() do
				if part:IsA("BasePart") and part ~= main then
					part.Transparency = open and 0.75 or 0
				end
			end
			main.CanCollide = not open
			prompt.ActionText = open and "Close" or "Open"
		end)
	elseif rec.t == "Spikes" or rec.t == "TarPit" then
		local hitCd = {}
		main.Touched:Connect(function(hit)
			local char = hit:FindFirstAncestorOfClass("Model")
			local hum = char and char:FindFirstChildOfClass("Humanoid")
			local player = char and Players:GetPlayerFromCharacter(char)
			if not hum or not player or canUse(player, rec) then
				return
			end
			if hitCd[player] and os.clock() - hitCd[player] < 1 then
				return
			end
			hitCd[player] = os.clock()
			if def.damage then
				hum:TakeDamage(def.damage)
			end
			if def.slow then
				hum.WalkSpeed = def.slow
				task.delay(2.5, function()
					if hum.Parent then
						hum.WalkSpeed = 16
					end
				end)
			end
		end)
	elseif rec.t == "DecoyChest" then
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Loot"
		prompt.ObjectText = "Treasure Chest"
		prompt.HoldDuration = 1.2
		prompt.Parent = main
		prompt.Triggered:Connect(function(player)
			if canUse(player, rec) then
				Remotes.Notify:FireClient(player, "That's your decoy — enemies see a treasure chest", "info")
				return
			end
			local boom = Instance.new("Explosion")
			boom.BlastRadius = 10
			boom.BlastPressure = 200000
			boom.DestroyJointRadiusPercent = 0
			boom.Position = main.Position
			boom.Parent = workspace
			local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
			if hum then
				hum:TakeDamage(45)
			end
			Remotes.Notify:FireClient(player, "IT WAS A TRAP", "doom")
			S.FactionService:Alert(rec.f, rec.o, player.Name .. " fell for your Decoy Chest", main.Position)
			BuildService:Remove(rec.id, true)
		end)
	end
end

---------------------------------------------------------------------------
function BuildService:Init(services)
	S = services
	buildsFolder = Instance.new("Folder")
	buildsFolder.Name = "Builds"
	buildsFolder.Parent = workspace:WaitForChild("World")
	self.Folder = buildsFolder

	self:OnSpawned(attachBehaviour)

	S.WorldService:OnChunkLoaded(function(key)
		loadChunkBuilds(key)
	end)
	S.WorldService:OnChunkUnloaded(function(key)
		for id, b in builds do
			if b.key == key then
				builds[id] = nil
				b.model:Destroy()
			end
		end
		if chunkFolders[key] then
			chunkFolders[key]:Destroy()
			chunkFolders[key] = nil
		end
	end)

	Remotes.PlaceBuild.OnServerEvent:Connect(function(player, itemId, cf)
		if typeof(itemId) ~= "string" or typeof(cf) ~= "CFrame" then
			return
		end
		local ok, why = self:Place(player, itemId, cf)
		if not ok then
			Remotes.Notify:FireClient(player, why or "Can't build here", "error")
		end
	end)

	pcall(function()
		MessagingService:SubscribeAsync(TOPIC, function(message)
			local msg = message.Data
			if type(msg) ~= "table" or msg.s == game.JobId then
				return
			end
			if not S.WorldService:IsLoaded(msg.k) then
				return
			end
			if msg.op == "add" then
				spawnRecord(msg.k, msg.rec)
			elseif msg.op == "del" then
				removeLocal(msg.id, msg.fx)
			elseif msg.op == "hp" then
				local b = builds[msg.id]
				if b then
					b.rec.hp = msg.hp
					b.model:SetAttribute("HP", msg.hp)
				end
			end
		end)
	end)

	game:BindToClose(flush)
end

function BuildService:Start()
	task.spawn(function()
		while true do
			task.wait(20)
			flush()
		end
	end)
	-- Honeycomb walls slowly re-seal themselves when left alone.
	while true do
		task.wait(10)
		for id, b in builds do
			local def = Buildables.Get(b.rec.t)
			if def.regen and b.rec.hp < def.hp and (not lastDamaged[id] or os.clock() - lastDamaged[id] > 30) then
				b.rec.hp = math.min(def.hp, b.rec.hp + def.hp * def.regen)
				b.model:SetAttribute("HP", b.rec.hp)
			end
		end
	end
end

return BuildService
