-- Infinite world streaming. Terrain chunks are generated around every player (and
-- freed when nobody is near), then decorated with harvestable nodes and ruins.
-- Everything is deterministic from the world seed, so every shard builds the
-- exact same world.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local WorldGen = require(Shared.WorldGen)
local Nodes = require(Shared.Nodes)
local Remotes = require(Shared.Remotes)
local NodeFactory = require(script.Parent.Parent.World.NodeFactory)
local Structures = require(script.Parent.Parent.World.Structures)

local WorldService = {}
local S

local Terrain = workspace.Terrain
local worldFolder, nodesFolder, poiFolder

local loaded: { [string]: { cx: number, cz: number, nodes: Folder, poi: Folder? } } = {}
local depleted: { [string]: { [number]: number } } = {} -- chunk → node index → respawn time
local chestCooldowns: { [string]: { [number]: number } } = {} -- chestId → userId → time
local queue: { { cx: number, cz: number, d: number } } = {}
local queued: { [string]: boolean } = {}

WorldService._onChunkLoaded = {}
WorldService._onChunkUnloaded = {}

function WorldService:OnChunkLoaded(cb)
	table.insert(self._onChunkLoaded, cb)
end
function WorldService:OnChunkUnloaded(cb)
	table.insert(self._onChunkUnloaded, cb)
end
function WorldService:IsLoaded(key: string): boolean
	return loaded[key] ~= nil
end

function WorldService:SurfaceY(x: number, z: number): number
	local h = WorldGen.Sample(x, z)
	return h
end

---------------------------------------------------------------------------
-- Terrain
---------------------------------------------------------------------------
local function writeTerrain(cx: number, cz: number)
	local size, vox = Config.ChunkSize, Config.Voxel
	local n = size // vox
	local ny = Config.MaxHeight // vox
	local x0, z0 = cx * size, cz * size
	local mats, occs = table.create(n), table.create(n)
	for i = 1, n do
		mats[i], occs[i] = table.create(ny), table.create(ny)
		for j = 1, ny do
			mats[i][j], occs[i][j] = table.create(n), table.create(n)
		end
	end
	local sea = Config.SeaLevel
	for i = 1, n do
		local wx = x0 + (i - 0.5) * vox
		for k = 1, n do
			local wz = z0 + (k - 0.5) * vox
			local h, biomeKey, river = WorldGen.Sample(wx, wz)
			local biome = WorldGen.Biomes[biomeKey]
			local surface = river and Enum.Material.Mud or biome.surface
			for j = 1, ny do
				local y0 = (j - 1) * vox
				local yTop = y0 + vox
				local mat, occ = Enum.Material.Air, 0
				if j == 1 then
					mat, occ = Enum.Material.Basalt, 1
				elseif yTop <= h then
					occ = 1
					local depth = h - yTop
					mat = depth < vox and surface or (depth < 14 and biome.under or Enum.Material.Rock)
				elseif y0 < h then
					occ = math.clamp((h - y0) / vox, 0.05, 1)
					mat = surface
				elseif y0 < sea then
					mat, occ = Enum.Material.Water, 1
				end
				mats[i][j][k] = mat
				occs[i][j][k] = occ
			end
		end
	end
	local region = Region3.new(Vector3.new(x0, 0, z0), Vector3.new(x0 + size, ny * vox, z0 + size))
	Terrain:WriteVoxels(region, vox, mats, occs)
end

local function clearTerrain(cx: number, cz: number)
	local size = Config.ChunkSize
	local region = Region3.new(Vector3.new(cx * size, 0, cz * size), Vector3.new((cx + 1) * size, Config.MaxHeight, (cz + 1) * size))
	Terrain:FillRegion(region:ExpandToGrid(4), 4, Enum.Material.Air)
end

---------------------------------------------------------------------------
-- Nodes
---------------------------------------------------------------------------
local function weightedPick(weights: { [string]: number }, rng: Random): string?
	local total = 0
	local keys = {}
	for k, w in weights do
		total += w
		table.insert(keys, k)
	end
	if total <= 0 then
		return nil
	end
	table.sort(keys) -- deterministic order across servers
	local r = rng:NextNumber() * total
	for _, k in keys do
		r -= weights[k]
		if r <= 0 then
			return k
		end
	end
	return keys[#keys]
end

local function spawnNode(key: string, folder: Folder, index: number, nodeType: string, pos: Vector3, rng: Random)
	local model = NodeFactory.Build(nodeType, pos, rng)
	model:SetAttribute("Chunk", key)
	model:SetAttribute("Index", index)
	model:SetAttribute("Origin", pos)
	model.Parent = folder
	return model
end

local function populate(cx: number, cz: number, key: string, folder: Folder)
	local rng = Random.new(WorldGen.ChunkSeed(cx, cz))
	local size = Config.ChunkSize
	local cxMid, czMid = (cx + 0.5) * size, (cz + 0.5) * size
	local _, centerBiome = WorldGen.Sample(cxMid, czMid)
	local count = WorldGen.Biomes[centerBiome].density
	count = math.max(0, count + rng:NextInteger(-2, 2))
	local dep = depleted[key]
	for index = 1, count do
		local x = cx * size + rng:NextNumber(2, size - 2)
		local z = cz * size + rng:NextNumber(2, size - 2)
		local h, biome, river = WorldGen.Sample(x, z)
		local nodeType = weightedPick(WorldGen.Biomes[biome].nodes, rng)
		local subSeed = rng:NextInteger(1, 1e9)
		if nodeType and not river and h > Config.SeaLevel + 0.5 then
			if not (dep and dep[index] and dep[index] > os.time()) then
				spawnNode(key, folder, index, nodeType, Vector3.new(x, h - 0.4, z), Random.new(subSeed))
			end
		end
	end
end

local function buildPOI(cx: number, cz: number, key: string): Folder?
	local rng = Random.new(WorldGen.ChunkSeed(cx, cz) + 99991)
	if rng:NextNumber() > Config.StructureChance then
		return nil
	end
	local size = Config.ChunkSize
	local x, z = (cx + 0.5) * size, (cz + 0.5) * size
	local h, biome = WorldGen.Sample(x, z)
	if h < Config.SeaLevel + 1 then
		return nil
	end
	local kind = Structures.PickKind(biome, rng)
	if not kind then
		return nil
	end
	-- flatten a pad under the ruin
	Terrain:FillBlock(CFrame.new(x, h - 3, z), Vector3.new(24, 6, 24), WorldGen.Biomes[biome].under)
	Terrain:FillBlock(CFrame.new(x, h + 6, z), Vector3.new(24, 12, 24), Enum.Material.Air)
	local folder = Instance.new("Folder")
	folder.Name = key
	local model = Structures.Build(kind, Vector3.new(x, h + 0.5, z), rng, key)
	model.Parent = folder
	folder.Parent = poiFolder

	local chest = model:FindFirstChild("Chest")
	local prompt = chest and chest:FindFirstChildOfClass("ProximityPrompt")
	if prompt then
		prompt.Triggered:Connect(function(player)
			WorldService:LootChest(player, key, kind)
		end)
	end
	return folder
end

function WorldService:LootChest(player: Player, chestId: string, kind: string)
	chestCooldowns[chestId] = chestCooldowns[chestId] or {}
	local last = chestCooldowns[chestId][player.UserId]
	if last and os.time() - last < Config.ChestCooldown then
		local mins = math.ceil((Config.ChestCooldown - (os.time() - last)) / 60)
		Remotes.Notify:FireClient(player, "Already looted — refills in " .. mins .. "m", "error")
		return
	end
	chestCooldowns[chestId][player.UserId] = os.time()
	local loot = Structures.RollLoot(kind, Random.new())
	local any = false
	for id, n in loot do
		S.InventoryService:Add(player, id, n)
		any = true
	end
	if not any then
		S.InventoryService:Add(player, "Plank", 3)
	end
	local profile = S.DataService:Get(player)
	if profile then
		profile.stats.chests += 1
	end
	Remotes.Notify:FireClient(player, "LOOT!", "big")
end

---------------------------------------------------------------------------
-- Chunk lifecycle
---------------------------------------------------------------------------
function WorldService:LoadChunk(cx: number, cz: number)
	local key = WorldGen.ChunkKey(cx, cz)
	if loaded[key] then
		return
	end
	writeTerrain(cx, cz)
	local nodes = Instance.new("Folder")
	nodes.Name = key
	nodes.Parent = nodesFolder
	populate(cx, cz, key, nodes)
	local poi = buildPOI(cx, cz, key)
	loaded[key] = { cx = cx, cz = cz, nodes = nodes, poi = poi }
	for _, cb in self._onChunkLoaded do
		task.spawn(cb, key, cx, cz)
	end
end

function WorldService:UnloadChunk(key: string)
	local c = loaded[key]
	if not c then
		return
	end
	for _, cb in self._onChunkUnloaded do
		pcall(cb, key, c.cx, c.cz)
	end
	c.nodes:Destroy()
	if c.poi then
		c.poi:Destroy()
	end
	clearTerrain(c.cx, c.cz)
	loaded[key] = nil
end

function WorldService:EnsureArea(pos: Vector3, radius: number)
	local ccx, ccz = WorldGen.ChunkOf(pos)
	for dx = -radius, radius do
		for dz = -radius, radius do
			self:LoadChunk(ccx + dx, ccz + dz)
		end
	end
end

local function focusPoints(): { Vector3 }
	local pts = {}
	for _, p in Players:GetPlayers() do
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		if root then
			table.insert(pts, root.Position)
		end
	end
	return pts
end

local function refreshWanted()
	local pts = focusPoints()
	local wanted = {}
	for _, pos in pts do
		local ccx, ccz = WorldGen.ChunkOf(pos)
		for dx = -Config.LoadRadius, Config.LoadRadius do
			for dz = -Config.LoadRadius, Config.LoadRadius do
				local cx, cz = ccx + dx, ccz + dz
				local key = WorldGen.ChunkKey(cx, cz)
				wanted[key] = true
				if not loaded[key] and not queued[key] then
					queued[key] = true
					table.insert(queue, { cx = cx, cz = cz, d = dx * dx + dz * dz })
				end
			end
		end
	end
	table.sort(queue, function(a, b)
		return a.d < b.d
	end)
	-- unload chunks nobody is near
	for key, c in loaded do
		if not wanted[key] then
			local far = true
			for _, pos in pts do
				local pcx, pcz = WorldGen.ChunkOf(pos)
				if math.max(math.abs(pcx - c.cx), math.abs(pcz - c.cz)) <= Config.UnloadRadius then
					far = false
					break
				end
			end
			if far then
				WorldService:UnloadChunk(key)
			end
		end
	end
end

---------------------------------------------------------------------------
-- Nodes: damage + respawn (called by HarvestService)
---------------------------------------------------------------------------
function WorldService:DepleteNode(model: Model)
	local key, index = model:GetAttribute("Chunk"), model:GetAttribute("Index")
	local nodeType = model:GetAttribute("NodeType")
	local origin = model:GetAttribute("Origin")
	local folder = model.Parent
	model:Destroy()
	if not key or not index then
		return -- event-spawned nodes (meteors) don't respawn
	end
	depleted[key] = depleted[key] or {}
	local respawnAt = os.time() + Config.NodeRespawnSeconds
	depleted[key][index] = respawnAt
	task.delay(Config.NodeRespawnSeconds, function()
		if loaded[key] and folder and folder.Parent and depleted[key] and depleted[key][index] == respawnAt then
			depleted[key][index] = nil
			spawnNode(key, folder, index, nodeType, origin, Random.new())
		end
	end)
end

function WorldService:SpawnEventNode(nodeType: string, pos: Vector3): Model
	local model = NodeFactory.Build(nodeType, pos, Random.new())
	model:SetAttribute("Event", true)
	model.Parent = nodesFolder
	return model
end

---------------------------------------------------------------------------
-- Spawning players
---------------------------------------------------------------------------
function WorldService:FindLand(near: Vector3?, scatter: number): Vector3
	local rng = Random.new()
	for _ = 1, 60 do
		local x = (near and near.X or 0) + rng:NextNumber(-scatter, scatter)
		local z = (near and near.Z or 0) + rng:NextNumber(-scatter, scatter)
		local h, biome = WorldGen.Sample(x, z)
		if biome ~= "Ocean" and biome ~= "Beach" and biome ~= "Peaks" and h > Config.SeaLevel + 2 then
			return Vector3.new(x, h, z)
		end
	end
	return Vector3.new(0, WorldGen.Sample(0, 0), 0)
end

function WorldService:SpawnPointFor(player: Player): Vector3
	local home = S.FactionService and S.FactionService:HomeFor(player)
	if home then
		return home + Vector3.new(6, 0, 6)
	end
	local profile = S.DataService:Get(player)
	if profile and profile.lastPos and not player:GetAttribute("Died") then
		local p = profile.lastPos
		return Vector3.new(p[1], WorldGen.Sample(p[1], p[3]), p[3])
	end
	return self:FindLand(nil, Config.SpawnScatter)
end

local function onCharacter(player: Player, char: Model)
	local root = char:WaitForChild("HumanoidRootPart", 10) :: BasePart
	if not root then
		return
	end
	S.DataService:WaitFor(player, 15)
	local spot = WorldService:SpawnPointFor(player)
	WorldService:EnsureArea(spot, 1)
	root.CFrame = CFrame.new(spot + Vector3.new(0, 6, 0))
	player:SetAttribute("Died", nil)
	-- 60s of fresh-spawn protection during Grace
	player:SetAttribute("Protected", true)
	task.delay(60, function()
		if player.Parent then
			player:SetAttribute("Protected", nil)
		end
	end)
	local hum = char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.Died:Connect(function()
			player:SetAttribute("Died", true)
		end)
	end
end

---------------------------------------------------------------------------
function WorldService:Init(services)
	S = services
	worldFolder = Instance.new("Folder")
	worldFolder.Name = "World"
	worldFolder.Parent = workspace
	nodesFolder = Instance.new("Folder")
	nodesFolder.Name = "Nodes"
	nodesFolder.Parent = worldFolder
	poiFolder = Instance.new("Folder")
	poiFolder.Name = "Ruins"
	poiFolder.Parent = worldFolder
	self.NodesFolder = nodesFolder
	self.WorldFolder = worldFolder

	Terrain.WaterColor = Color3.fromRGB(60, 170, 200)
	Terrain.WaterTransparency = 0.6
	Terrain.WaterWaveSize = 0.15
	Terrain:SetMaterialColor(Enum.Material.Grass, Color3.fromRGB(110, 190, 70))
	Terrain:SetMaterialColor(Enum.Material.LeafyGrass, Color3.fromRGB(70, 150, 60))

	-- a fallback SpawnLocation so Roblox never drops players into the void
	local spawnPos = self:FindLand(nil, 200)
	self:EnsureArea(spawnPos, 1)
	local sl = Instance.new("SpawnLocation")
	sl.Anchored = true
	sl.Transparency = 1
	sl.CanCollide = false
	sl.Size = Vector3.new(6, 1, 6)
	sl.Position = spawnPos + Vector3.new(0, 2, 0)
	sl.Parent = worldFolder

	Players.PlayerAdded:Connect(function(p)
		p.CharacterAdded:Connect(function(c)
			onCharacter(p, c)
		end)
	end)
	for _, p in Players:GetPlayers() do
		p.CharacterAdded:Connect(function(c)
			onCharacter(p, c)
		end)
	end
end

function WorldService:Start()
	task.spawn(function()
		while true do
			refreshWanted()
			task.wait(0.75)
		end
	end)
	while true do
		local done = 0
		while #queue > 0 and done < Config.ChunksPerStep do
			local job = table.remove(queue, 1)
			local key = WorldGen.ChunkKey(job.cx, job.cz)
			queued[key] = nil
			self:LoadChunk(job.cx, job.cz)
			done += 1
		end
		task.wait(Config.GenStepDelay)
	end
end

return WorldService
