-- PRIMORDIA ∞ client bootstrap.

local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)

local UI = script.Parent:WaitForChild("UI")
local Controllers = script.Parent:WaitForChild("Controllers")

local State = require(UI.State)
local Notifications = require(UI.Notifications)
local HUD = require(UI.HUD)
local InventoryUI = require(UI.InventoryUI)
local ShopUI = require(UI.ShopUI)
local FactionUI = require(UI.FactionUI)
local MapUI = require(UI.MapUI)
local BuildController = require(Controllers.BuildController)
local ActionController = require(Controllers.ActionController)

pcall(function()
	StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Health, false)
end)

Remotes.InventoryUpdate.OnClientEvent:Connect(function(inventory, coins, favorites)
	State.Set("favorites", favorites or {})
	State.Set("coins", coins or 0)
	State.Set("inventory", inventory or {})
end)

Notifications.Init()
HUD.Init()
InventoryUI.Init()
ShopUI.Init()
FactionUI.Init()
MapUI.Init()
BuildController.Init()
ActionController.Init(BuildController.IsActive)
InventoryUI.OnPlace = BuildController.Start

-- First-join walkthrough as trailer-style captions.
task.spawn(function()
	task.wait(3)
	local lines = {
		{ "WELCOME TO " .. Config.GameName, "big" },
		{ "An INFINITE world shared by EVERY server", "good" },
		{ "Punch trees & rocks · craft tools (C)", "info" },
		{ "Claim land with a Faction Totem (F)", "info" },
		{ "Get RICH peacefully — farms + the Global Shop", "event" },
		{ "…or build siege machines for DOOMSDAY", "doom" },
	}
	for _, l in lines do
		Notifications.Caption(l[1], l[2])
		task.wait(2.4)
	end
end)

print("[Primordia] client ready for", Players.LocalPlayer.Name)
