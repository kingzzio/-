-- Living world events that pull players together (and into fights).
--   Meteor Shower   – Starmetal meteorites crash near players.
--   Golden Hour     – Global Shop pays 2x for 5 minutes.
--   Supply Drop     – a rare crate parachutes in; coordinates announced to everyone.
--   Blood Moon      – night falls red; PvP allowed everywhere (even in Grace).
--   Wandering Trader– a pop-up shop appears near a random player.
-- Plus a day/night cycle.

local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Shared = ReplicatedStorage:WaitForChild("Shared")
local WorldGen = require(Shared.WorldGen)
local Remotes = require(Shared.Remotes)

local EventService = {}
local S

local DAY_LENGTH = 20 * 60 -- seconds per full day

local function randomPlayerPos(): Vector3?
	local list = {}
	for _, p in Players:GetPlayers() do
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		if root then
			table.insert(list, root.Position)
		end
	end
	if #list == 0 then
		return nil
	end
	return list[math.random(1, #list)]
end

local function groundNear(center: Vector3, minR: number, maxR: number): Vector3
	local a = math.random() * math.pi * 2
	local r = minR + math.random() * (maxR - minR)
	local x, z = center.X + math.cos(a) * r, center.Z + math.sin(a) * r
	return Vector3.new(x, WorldGen.Sample(x, z), z)
end

local function compass(from: Vector3, to: Vector3): string
	local d = to - from
	local ang = math.deg(math.atan2(d.X, -d.Z)) % 360
	local dirs = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" }
	return dirs[(math.floor((ang + 22.5) / 45) % 8) + 1]
end

local function fallingStreak(target: Vector3, color: Color3, onLand: () -> ())
	local start = target + Vector3.new(math.random(-120, 120), 400, math.random(-120, 120))
	local rock = Instance.new("Part")
	rock.Shape = Enum.PartType.Ball
	rock.Size = Vector3.new(6, 6, 6)
	rock.Anchored = true
	rock.CanCollide = false
	rock.Material = Enum.Material.Neon
	rock.Color = color
	rock.Position = start
	rock.Parent = workspace
	local fire = Instance.new("Fire")
	fire.Size = 15
	fire.Color = color
	fire.Parent = rock
	local t0 = os.clock()
	local conn
	conn = RunService.Heartbeat:Connect(function()
		local t = math.min(1, (os.clock() - t0) / 3)
		rock.Position = start:Lerp(target, t * t)
		if t >= 1 then
			conn:Disconnect()
			rock:Destroy()
			local boom = Instance.new("Explosion")
			boom.BlastPressure = 0
			boom.DestroyJointRadiusPercent = 0
			boom.BlastRadius = 14
			boom.Position = target
			boom.Parent = workspace
			workspace.Terrain:FillBall(target, 9, Enum.Material.Air)
			onLand()
		end
	end)
end

local Events = {}

function Events.MeteorShower(count: number?)
	local center = randomPlayerPos()
	if not center then
		return
	end
	local n = count or math.random(3, 6)
	local first
	for i = 1, n do
		local pos = groundNear(center, 120, 420)
		first = first or pos
		task.delay(i * 1.5, function()
			fallingStreak(pos, Color3.fromRGB(170, 120, 255), function()
				S.WorldService:SpawnEventNode("Meteorite", pos + Vector3.new(0, 1, 0))
			end)
		end)
	end
	for _, p in Players:GetPlayers() do
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		local dir = root and (" — look " .. compass(root.Position, first)) or ""
		Remotes.Notify:FireClient(p, "METEOR SHOWER" .. dir, "event")
	end
	Remotes.WorldEvent:FireAllClients("MeteorShower", { x = first.X, z = first.Z })
end

function Events.DoomsdayMeteors()
	for _ = 1, 3 do
		Events.MeteorShower(8)
		task.wait(10)
	end
end

function Events.GoldenHour()
	ReplicatedStorage:SetAttribute("MarketBoost", 2)
	Remotes.Notify:FireAllClients("GOLDEN HOUR — Global Shop pays 2x!", "event")
	Remotes.WorldEvent:FireAllClients("GoldenHour", { seconds = 300 })
	task.delay(300, function()
		ReplicatedStorage:SetAttribute("MarketBoost", 1)
		Remotes.Notify:FireAllClients("Golden Hour has ended", "info")
	end)
end

function Events.SupplyDrop()
	local center = randomPlayerPos()
	if not center then
		return
	end
	local pos = groundNear(center, 200, 500)
	local crate = Instance.new("Part")
	crate.Name = "SupplyDrop"
	crate.Size = Vector3.new(5, 5, 5)
	crate.Color = Color3.fromRGB(220, 60, 60)
	crate.Material = Enum.Material.DiamondPlate
	crate.Anchored = true
	crate.Position = pos + Vector3.new(0, 300, 0)
	crate.Parent = workspace
	local smoke = Instance.new("Smoke")
	smoke.Color = Color3.fromRGB(255, 60, 60)
	smoke.Size = 6
	smoke.RiseVelocity = 12
	smoke.Parent = crate
	local beam = Instance.new("PointLight")
	beam.Color = Color3.fromRGB(255, 60, 60)
	beam.Range = 40
	beam.Brightness = 3
	beam.Parent = crate
	Remotes.Notify:FireAllClients("SUPPLY DROP at " .. math.floor(pos.X) .. ", " .. math.floor(pos.Z), "event")
	Remotes.WorldEvent:FireAllClients("SupplyDrop", { x = pos.X, z = pos.Z })
	task.spawn(function()
		for i = 1, 60 do
			crate.Position = pos + Vector3.new(0, 300 * (1 - i / 60) + 2.5, 0)
			task.wait(0.25)
		end
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Open"
		prompt.ObjectText = "Supply Drop"
		prompt.HoldDuration = 4 -- long hold = you must defend it
		prompt.Parent = crate
		prompt.Triggered:Connect(function(player)
			if not crate.Parent then
				return
			end
			crate:Destroy()
			local pool = { { "IronBar", 4, 8 }, { "GoldBar", 2, 4 }, { "Sunstone", 1, 2 }, { "Emerald", 1, 2 }, { "FirePot", 2, 4 }, { "Boulder", 4, 8 }, { "HoneycombPlate", 1, 3 }, { "Starmetal", 1, 1 } }
			for _ = 1, 4 do
				local e = pool[math.random(1, #pool)]
				S.InventoryService:Add(player, e[1], math.random(e[2], e[3]))
			end
			Remotes.Notify:FireAllClients(player.DisplayName .. " claimed the Supply Drop", "info")
		end)
		task.delay(600, function()
			if crate.Parent then
				crate:Destroy()
			end
		end)
	end)
end

function Events.BloodMoon()
	ReplicatedStorage:SetAttribute("BloodMoon", true)
	local cc = Instance.new("ColorCorrectionEffect")
	cc.Name = "BloodMoon"
	cc.TintColor = Color3.fromRGB(255, 150, 150)
	cc.Saturation = 0.2
	cc.Parent = Lighting
	Lighting.ClockTime = 0
	Remotes.Notify:FireAllClients("BLOOD MOON — PvP everywhere", "doom")
	Remotes.WorldEvent:FireAllClients("BloodMoon", { seconds = 240 })
	task.delay(240, function()
		ReplicatedStorage:SetAttribute("BloodMoon", nil)
		cc:Destroy()
		Remotes.Notify:FireAllClients("The Blood Moon fades", "info")
	end)
end

function Events.WanderingTrader()
	local center = randomPlayerPos()
	if not center then
		return
	end
	local pos = groundNear(center, 40, 120)
	local p = Instance.new("Part")
	p.Name = "Wandering Trader"
	p.Size = Vector3.new(6, 6, 6)
	p.Anchored = true
	p.Color = Color3.fromRGB(110, 60, 160)
	p.Material = Enum.Material.Fabric
	p.Position = pos + Vector3.new(0, 3, 0)
	p.Parent = workspace
	S.ShopService:AttachPrompt(p, "Wandering Trader")
	ReplicatedStorage:SetAttribute("MarketBoost", 1.5)
	Remotes.Notify:FireAllClients("A Wandering Trader arrived (1.5x prices)", "event")
	task.delay(240, function()
		p:Destroy()
		if ReplicatedStorage:GetAttribute("MarketBoost") == 1.5 then
			ReplicatedStorage:SetAttribute("MarketBoost", 1)
		end
	end)
end

function EventService:Trigger(name: string, ...)
	local fn = Events[name]
	if fn then
		task.spawn(fn, ...)
	end
end

function EventService:Init(services)
	S = services
	ReplicatedStorage:SetAttribute("MarketBoost", 1)
end

function EventService:Start()
	task.spawn(function()
		while true do
			local dt = task.wait(1)
			if not ReplicatedStorage:GetAttribute("BloodMoon") then
				Lighting.ClockTime = (Lighting.ClockTime + dt * 24 / DAY_LENGTH) % 24
			end
		end
	end)
	local rotation = { "MeteorShower", "GoldenHour", "SupplyDrop", "WanderingTrader", "MeteorShower", "BloodMoon", "SupplyDrop" }
	local i = 0
	while true do
		task.wait(math.random(9 * 60, 16 * 60))
		i = i % #rotation + 1
		self:Trigger(rotation[i])
	end
end

return EventService
