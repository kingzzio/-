-- The GLOBAL SHOP. One market shared by every shard: when anyone anywhere floods
-- wheat, the wheat price drops for everyone, then slowly recovers. Smart farmers
-- chase the crops nobody else is selling.

local MemoryStoreService = game:GetService("MemoryStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Items = require(Shared.Items)
local Remotes = require(Shared.Remotes)

local ShopService = {}
local S

local market
local okMem = pcall(function()
	market = MemoryStoreService:GetHashMap("Primordia_Market_v1")
end)
local localSupply: { [string]: { s: number, t: number } } = {}
local priceCache: { [string]: { s: number, t: number, at: number } } = {}

local function decayed(entry, now: number): number
	if not entry then
		return 0
	end
	return entry.s * 0.5 ^ ((now - entry.t) / Config.MarketHalfLife)
end

local function readSupply(id: string): number
	local now = os.time()
	local c = priceCache[id]
	if c and os.clock() - c.at < 15 then
		return decayed(c, now)
	end
	local entry
	if okMem and market then
		local ok, res = pcall(function()
			return market:GetAsync(id)
		end)
		entry = ok and res or nil
	else
		entry = localSupply[id]
	end
	priceCache[id] = { s = entry and entry.s or 0, t = entry and entry.t or now, at = os.clock() }
	return decayed(entry, now)
end

local function addSupply(id: string, qty: number)
	local now = os.time()
	local function bump(old)
		local s = decayed(old, now) + qty
		return { s = s, t = now }
	end
	if okMem and market then
		pcall(function()
			market:UpdateAsync(id, bump, 7 * 86400)
		end)
	else
		localSupply[id] = bump(localSupply[id])
	end
	priceCache[id] = nil
end

local function boost(): number
	return ReplicatedStorage:GetAttribute("MarketBoost") or 1
end

function ShopService:UnitPrice(id: string, extraSupply: number?): number
	local def = Items.Get(id)
	if not def or not def.price or def.price <= 0 then
		return 0
	end
	local s = readSupply(id) + (extraSupply or 0)
	local mult = math.max(Config.MarketFloor, 1 / (1 + s / Config.MarketElasticity))
	return def.price * mult * boost()
end

-- Sells n units straight into the market (used by Market Carts). Returns coins.
function ShopService:SellToMarket(id: string, n: number, rate: number?): number
	if n <= 0 then
		return 0
	end
	local coins = math.floor(self:UnitPrice(id, n / 2) * n * (rate or 1))
	addSupply(id, n)
	return coins
end

function ShopService:Prices()
	local list = {}
	for id, def in Items.List do
		if def.price and def.price > 0 and not def.tool and not def.build then
			local p = self:UnitPrice(id)
			table.insert(list, { id = id, price = math.floor(p * 10) / 10, base = def.price, trend = p / (def.price * boost()) })
		end
	end
	local buy = {}
	for id, def in Items.List do
		if def.buy then
			table.insert(buy, { id = id, price = def.buy })
		end
	end
	table.sort(list, function(a, b)
		return a.base > b.base
	end)
	table.sort(buy, function(a, b)
		return a.price < b.price
	end)
	return { sell = list, buy = buy, boost = boost() }
end

function ShopService:AttachPrompt(part: BasePart, label: string)
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Trade"
	prompt.ObjectText = label
	prompt.KeyboardKeyCode = Enum.KeyCode.T
	prompt.MaxActivationDistance = 12
	prompt.Parent = part
	prompt.Triggered:Connect(function(player)
		Remotes.OpenShop:FireClient(player, self:Prices())
	end)
end

function ShopService:Init(services)
	S = services

	Remotes.GetPrices.OnServerInvoke = function()
		return self:Prices()
	end

	Remotes.ShopSell.OnServerEvent:Connect(function(player, id, qty)
		qty = math.floor(tonumber(qty) or 0)
		local def = typeof(id) == "string" and Items.Get(id)
		if not def or qty <= 0 or not def.price or def.price <= 0 then
			return
		end
		qty = math.min(qty, S.InventoryService:Count(player, id))
		if qty <= 0 or not S.InventoryService:Take(player, { [id] = qty }) then
			return
		end
		local coins = self:SellToMarket(id, qty, 1)
		S.InventoryService:AddCoins(player, coins, "Sold " .. qty .. " " .. def.name)
		local profile = S.DataService:Get(player)
		if profile then
			profile.stats.sold += qty
		end
		Remotes.OpenShop:FireClient(player, self:Prices())
	end)

	Remotes.ShopBuy.OnServerEvent:Connect(function(player, id, qty)
		qty = math.clamp(math.floor(tonumber(qty) or 0), 1, 99)
		local def = typeof(id) == "string" and Items.Get(id)
		if not def or not def.buy then
			return
		end
		local profile = S.DataService:Get(player)
		local cost = def.buy * qty
		if not profile or profile.coins < cost then
			Remotes.Notify:FireClient(player, "Not enough coins", "error")
			return
		end
		S.InventoryService:AddCoins(player, -cost)
		S.InventoryService:Add(player, id, qty)
	end)

	-- Every Faction Totem doubles as a trading post.
	S.BuildService:OnSpawned(function(model, rec)
		if rec.t == "Totem" then
			self:AttachPrompt(model.PrimaryPart, "Trading Post")
		end
	end)
end

return ShopService
