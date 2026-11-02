-- Single place that defines every RemoteEvent / RemoteFunction.
-- Server creates them; clients wait for them. Usage: Remotes.Notify:FireClient(...)

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local EVENTS = {
	"Notify", -- (text, style) big caption-style popup
	"CoinPopup", -- (amount, reason)
	"InventoryUpdate", -- (inventoryTable, coins, favorites)
	"Craft", -- (recipeIndex)
	"ToggleFavorite", -- (itemId)
	"EatItem", -- (itemId)
	"EquipArmor", -- (itemId) toggles
	"PlaceBuild", -- (itemId, cframe)
	"Swing", -- ()
	"FireSiege", -- (machineId, targetPosition)
	"SiegeAim", -- server → client: (machineId, kind, range)
	"OpenShop", -- server → client
	"ShopSell", -- (itemId, qty)
	"ShopBuy", -- (itemId, qty)
	"FactionAction", -- (action, payload)
	"FactionUpdate", -- server → client: (factionInfo | nil, invites)
	"Echoes", -- server → client: list of players in OTHER servers
	"JoinEcho", -- (jobId) hop into the shard where that echo lives
	"Claims", -- server → client: territory list for the map
	"WorldEvent", -- server → client: (eventName, data)
	"Stats", -- server → client: personal stats
	"OpenPanel", -- server → client: (panelName) e.g. from hub stalls
}

local FUNCTIONS = {
	"Ping",
	"GetPrices",
	"GetLeaderboard",
}

local folder: Folder
if RunService:IsServer() then
	folder = ReplicatedStorage:FindFirstChild("Remotes") :: Folder
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "Remotes"
		folder.Parent = ReplicatedStorage
	end
	for _, name in EVENTS do
		if not folder:FindFirstChild(name) then
			local r = Instance.new("RemoteEvent")
			r.Name = name
			r.Parent = folder
		end
	end
	for _, name in FUNCTIONS do
		if not folder:FindFirstChild(name) then
			local r = Instance.new("RemoteFunction")
			r.Name = name
			r.Parent = folder
		end
	end
else
	folder = ReplicatedStorage:WaitForChild("Remotes") :: Folder
end

return setmetatable({}, {
	__index = function(_, key)
		return folder:WaitForChild(key, 10)
	end,
}) :: any
