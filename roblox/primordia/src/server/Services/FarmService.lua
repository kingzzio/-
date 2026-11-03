-- "Get rich peacefully": crops, sprinklers, auto-harvesters, market carts, bees.
--
--   Farm Plot  → plant a seed (your ★ favourite seed first, else the best you own).
--   Sprinkler  → crops within 16 studs grow 1.5x faster.
--   Harvester  → every 30s harvests + replants ripe plots near it into its hopper.
--   Market Cart→ every 60s sells nearby harvester hoppers to the GLOBAL SHOP at 85%.
--   Apiary     → makes Honey + Wax (for Honeycomb walls). Sunbloom crops nearby double it.
--   Crops keep growing in real time while you're offline.
--   After Doomsday, enemies can steal ripe crops and rob market carts.

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Crops = require(Shared.Crops)
local Buildables = require(Shared.Buildables)
local Remotes = require(Shared.Remotes)
local Config = require(Shared.Config)

local FarmService = {}
local S

local SEED_PRIORITY = { "SunbloomSeed", "PumpkinSeed", "BeetSeed", "BerrySeed", "WheatSeed" }

local function friendly(player: Player, rec): boolean
	local fac = player:GetAttribute("Faction")
	return rec.o == player.UserId or (fac ~= nil and fac == rec.f)
end

local function growthMult(model: Model): number
	local pos = model.PrimaryPart.Position
	if #S.BuildService:InRadius(pos, Buildables.Get("Sprinkler").radius, "Sprinkler") > 0 then
		return 1.5
	end
	return 1
end

local function progress(rec, model: Model): number
	local d = rec.d
	if not d or not d.c then
		return 0
	end
	local crop = Crops[d.c]
	return math.clamp((os.time() - d.p) * growthMult(model) / crop.grow, 0, 1)
end

-- Each plot shows a 4x3 grid of plants that physically grow, then fruit when ripe.
local FRUIT = {
	Wheat = { shape = "ear", color = Color3.fromRGB(240, 205, 90) },
	Berry = { shape = "bush", color = Color3.fromRGB(95, 60, 185) },
	Beet = { shape = "root", color = Color3.fromRGB(165, 30, 75) },
	Pumpkin = { shape = "gourd", color = Color3.fromRGB(245, 140, 35) },
	Sunbloom = { shape = "flower", color = Color3.fromRGB(255, 220, 60) },
}

local function cropPart(parent, size, cf, color, material, shape)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material
	if shape then
		p.Shape = shape
	end
	p.Parent = parent
	return p
end

local function updateCropVisual(model: Model, rec)
	local main = model.PrimaryPart
	local crop = model:FindFirstChild("Crop")
	local d = rec.d
	if not d or not d.c then
		if crop then
			crop:Destroy()
		end
		model:SetAttribute("Ripe", false)
		return
	end
	local pct = progress(rec, model)
	local ripe = pct >= 1
	local stage = ripe and 4 or math.floor(pct * 4)
	if crop and crop:GetAttribute("Stage") == stage and crop:GetAttribute("Crop") == d.c then
		return
	end
	if crop then
		crop:Destroy()
	end
	crop = Instance.new("Model")
	crop.Name = "Crop"
	crop:SetAttribute("Stage", stage)
	crop:SetAttribute("Crop", d.c)
	crop.Parent = model
	local fruit = FRUIT[d.c] or FRUIT.Wheat
	local green = Color3.fromRGB(80, 165, 60)
	local top = main.CFrame * CFrame.new(0, main.Size.Y / 2, 0)
	local h = 0.4 + (stage / 4) * (fruit.shape == "ear" and 3.2 or 2.2)
	for i = 0, 3 do
		for j = -1, 1 do
			local base = top * CFrame.new(-2.7 + i * 1.8, 0, j * 2.6) * CFrame.Angles(0, (i * 3 + j) * 0.7, 0)
			if fruit.shape == "ear" then
				for k = -1, 1 do
					local stalk = cropPart(crop, Vector3.new(0.2, h, 0.2), base * CFrame.new(k * 0.35, h / 2, 0) * CFrame.Angles(0, 0, k * 0.12), ripe and Color3.fromRGB(205, 175, 80) or green, Enum.Material.Grass)
					if ripe then
						cropPart(crop, Vector3.new(0.35, 0.9, 0.35), stalk.CFrame * CFrame.new(0, h / 2 + 0.3, 0), fruit.color, Enum.Material.Grass)
					end
				end
			elseif fruit.shape == "bush" then
				local s = 0.6 + stage * 0.35
				cropPart(crop, Vector3.new(s, s, s), base * CFrame.new(0, s / 2, 0), Color3.fromRGB(50, 120, 55), Enum.Material.Grass, Enum.PartType.Ball)
				if ripe then
					for k = 0, 3 do
						cropPart(crop, Vector3.new(0.4, 0.4, 0.4), base * CFrame.Angles(0, k * 1.57, 0) * CFrame.new(s * 0.45, s * 0.6, 0), fruit.color, Enum.Material.SmoothPlastic, Enum.PartType.Ball)
					end
				end
			else
				for k = -1, 1, 2 do
					cropPart(crop, Vector3.new(0.15, 0.5 + stage * 0.3, 0.7), base * CFrame.new(k * 0.25, 0.4 + stage * 0.15, 0) * CFrame.Angles(0, 0, k * 0.5), green, Enum.Material.Grass)
				end
				if fruit.shape == "flower" then
					local stem = cropPart(crop, Vector3.new(0.18, h + 0.6, 0.18), base * CFrame.new(0, (h + 0.6) / 2, 0), green, Enum.Material.Grass)
					if ripe then
						cropPart(crop, Vector3.new(0.25, 1.4, 1.4), stem.CFrame * CFrame.new(0, (h + 0.6) / 2, 0) * CFrame.Angles(0, 0, math.pi / 2), fruit.color, Enum.Material.Neon, Enum.PartType.Cylinder)
					end
				elseif ripe then
					local size = fruit.shape == "gourd" and 1.5 or 0.8
					cropPart(crop, Vector3.new(size, size * 0.85, size), base * CFrame.new(0, size * 0.3, 0), fruit.color, Enum.Material.SmoothPlastic, Enum.PartType.Ball)
				end
			end
		end
	end
	if ripe then
		local sparkle = Instance.new("Sparkles")
		sparkle.SparkleColor = fruit.color
		sparkle.Parent = crop:FindFirstChildWhichIsA("BasePart")
	end
	model:SetAttribute("Ripe", ripe)
end

local function harvestPlot(model: Model, rec, give: (string, number) -> ())
	local d = rec.d
	local crop = Crops[d.c]
	local rng = Random.new()
	give(d.c, rng:NextInteger(crop.yield[1], crop.yield[2]))
	local seedId = d.c .. "Seed"
	local replanted = false
	if rng:NextNumber() <= crop.seedBack then
		replanted = true
	end
	if rng:NextNumber() <= 0.25 then
		give(seedId, 1) -- bonus seed
	end
	if replanted then
		rec.d = { c = d.c, p = os.time() }
	else
		rec.d = nil
	end
	S.BuildService:SetData(rec.id, rec.d)
	updateCropVisual(model, rec)
end

local function setLabel(model: Model, text: string)
	local bb = model.PrimaryPart and model.PrimaryPart:FindFirstChild("Status")
	if bb then
		bb.Label.Text = text
	end
end

local function storeText(store): string
	local parts = {}
	for id, n in store or {} do
		table.insert(parts, n .. " " .. (Items.Get(id) and Items.Get(id).name or id))
	end
	return #parts > 0 and table.concat(parts, " · ") or "empty"
end

---------------------------------------------------------------------------
-- per-kind setup
---------------------------------------------------------------------------
local function setupPlot(model: Model, rec)
	local prompt = Instance.new("ProximityPrompt")
	prompt.ObjectText = "Farm Plot"
	prompt.MaxActivationDistance = 10
	prompt.Parent = model.PrimaryPart
	local function refresh()
		if not rec.d then
			prompt.ActionText = "Plant"
		elseif model:GetAttribute("Ripe") then
			prompt.ActionText = "Harvest " .. rec.d.c
		else
			prompt.ActionText = rec.d.c .. " " .. math.floor(progress(rec, model) * 100) .. "%"
		end
	end
	model:GetAttributeChangedSignal("Ripe"):Connect(refresh)
	prompt.PromptShown:Connect(refresh)

	prompt.Triggered:Connect(function(player)
		if not rec.d then
			if not friendly(player, rec) then
				return
			end
			local profile = S.DataService:Get(player)
			local choice
			for _, seed in SEED_PRIORITY do
				if profile.favorites[seed] and S.InventoryService:Count(player, seed) > 0 then
					choice = seed
					break
				end
			end
			if not choice then
				for _, seed in SEED_PRIORITY do
					if S.InventoryService:Count(player, seed) > 0 then
						choice = seed
						break
					end
				end
			end
			if not choice or not S.InventoryService:Take(player, { [choice] = 1 }) then
				Remotes.Notify:FireClient(player, "No seeds — buy some at the Global Shop", "error")
				return
			end
			rec.d = { c = Items.Get(choice).seed, p = os.time() }
			S.BuildService:SetData(rec.id, rec.d)
			updateCropVisual(model, rec)
		elseif model:GetAttribute("Ripe") then
			local thief = not friendly(player, rec)
			if thief and not S.DoomsdayService:CanRaid(player:GetAttribute("Faction"), rec.f) then
				Remotes.Notify:FireClient(player, "Not your crops (yet...)", "error")
				return
			end
			harvestPlot(model, rec, function(id, n)
				S.InventoryService:Add(player, id, n)
			end)
			if thief then
				S.FactionService:Alert(rec.f, rec.o, player.Name .. " is stealing your crops!", model.PrimaryPart.Position)
			end
		end
		refresh()
	end)
	updateCropVisual(model, rec)
end

local function setupCollector(model: Model, rec, label: string)
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Collect"
	prompt.ObjectText = label
	prompt.HoldDuration = 0.5
	prompt.Parent = model.PrimaryPart
	prompt.Triggered:Connect(function(player)
		local d = rec.d or {}
		local thief = not friendly(player, rec)
		if thief and not S.DoomsdayService:CanRaid(player:GetAttribute("Faction"), rec.f) then
			Remotes.Notify:FireClient(player, "Not yours", "error")
			return
		end
		local gotSomething = false
		for id, n in d.store or {} do
			S.InventoryService:Add(player, id, n)
			gotSomething = true
		end
		if (d.coins or 0) > 0 then
			S.InventoryService:AddCoins(player, d.coins, thief and "Robbed a market cart!" or "Market cart earnings")
			gotSomething = true
		end
		if thief and gotSomething then
			S.FactionService:Alert(rec.f, rec.o, player.Name .. " robbed your " .. label .. "!", model.PrimaryPart.Position)
		end
		rec.d = {}
		S.BuildService:SetData(rec.id, rec.d)
		setLabel(model, label .. ": empty")
	end)
	setLabel(model, label .. ": " .. storeText(rec.d and rec.d.store) .. ((rec.d and rec.d.coins) and (" · " .. rec.d.coins .. "c") or ""))
end

---------------------------------------------------------------------------
-- automation ticks
---------------------------------------------------------------------------
local function sameOwner(a, b): boolean
	return a.o == b.o or (a.f ~= nil and a.f == b.f)
end

local function harvesterTick()
	for _, b in S.BuildService:All() do
		if b.rec.t == "Harvester" and b.model.PrimaryPart then
			local rec = b.rec
			rec.d = rec.d or {}
			rec.d.store = rec.d.store or {}
			local total = 0
			for _, n in rec.d.store do
				total += n
			end
			local changed = false
			for _, plot in S.BuildService:InRadius(b.model.PrimaryPart.Position, Buildables.Get("Harvester").radius, "FarmPlot") do
				if total < 500 and plot.rec.d and sameOwner(plot.rec, rec) and progress(plot.rec, plot.model) >= 1 then
					harvestPlot(plot.model, plot.rec, function(id, n)
						rec.d.store[id] = (rec.d.store[id] or 0) + n
						total += n
					end)
					changed = true
				end
			end
			if changed then
				S.BuildService:SetData(rec.id, rec.d)
			end
			setLabel(b.model, "Hopper: " .. storeText(rec.d.store))
		end
	end
end

local function cartTick()
	for _, b in S.BuildService:All() do
		if b.rec.t == "MarketCart" and b.model.PrimaryPart then
			local rec = b.rec
			rec.d = rec.d or {}
			local earned = 0
			for _, h in S.BuildService:InRadius(b.model.PrimaryPart.Position, Buildables.Get("MarketCart").radius, "Harvester") do
				if sameOwner(h.rec, rec) and h.rec.d and h.rec.d.store then
					for id, n in h.rec.d.store do
						earned += S.ShopService:SellToMarket(id, n, Config.AutoSellRate)
					end
					h.rec.d.store = {}
					S.BuildService:SetData(h.rec.id, h.rec.d)
				end
			end
			if earned > 0 then
				rec.d.coins = (rec.d.coins or 0) + earned
				S.BuildService:SetData(rec.id, rec.d)
			end
			setLabel(b.model, "Market Cart: " .. (rec.d.coins or 0) .. " coins")
		end
	end
end

local function beeTick()
	for _, b in S.BuildService:All() do
		if b.rec.t == "Beehive" and b.model.PrimaryPart then
			local rec = b.rec
			rec.d = rec.d or {}
			rec.d.store = rec.d.store or {}
			local mult = 1
			for _, plot in S.BuildService:InRadius(b.model.PrimaryPart.Position, Buildables.Get("Beehive").radius, "FarmPlot") do
				if plot.rec.d and plot.rec.d.c and Crops[plot.rec.d.c].pollinator then
					mult = 2
					break
				end
			end
			if (rec.d.store.Honey or 0) < 60 then
				rec.d.store.Honey = (rec.d.store.Honey or 0) + 1 * mult
				rec.d.store.Wax = (rec.d.store.Wax or 0) + 1 * mult
				S.BuildService:SetData(rec.id, rec.d)
			end
			setLabel(b.model, "Apiary" .. (mult > 1 and " (pollinated!)" or "") .. ": " .. storeText(rec.d.store))
		end
	end
end

---------------------------------------------------------------------------
function FarmService:Init(services)
	S = services
	S.BuildService:OnSpawned(function(model, rec)
		if rec.t == "FarmPlot" then
			setupPlot(model, rec)
		elseif rec.t == "Harvester" then
			setupCollector(model, rec, "Hopper")
		elseif rec.t == "MarketCart" then
			setupCollector(model, rec, "Market Cart")
		elseif rec.t == "Beehive" then
			setupCollector(model, rec, "Apiary")
		end
	end)
end

function FarmService:Start()
	local tick = 0
	while true do
		task.wait(5)
		tick += 5
		for _, b in S.BuildService:All() do
			if b.rec.t == "FarmPlot" and b.model.Parent then
				updateCropVisual(b.model, b.rec)
			end
		end
		if tick % 30 == 0 then
			harvesterTick()
		end
		if tick % 60 == 0 then
			cartTick()
		end
		if tick % 120 == 0 then
			beeTick()
		end
	end
end

return FarmService
