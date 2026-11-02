-- Simulator-style HUD furniture:
--   * left side menu of big chunky square buttons (Shop / Bag / Craft / Faction / Map)
--   * bottom hotbar with numbered slots + 3D tool icons (replaces Roblox's backpack bar)
--   * "NOW ENTERING" zone title that slams in when you walk into a new biome

local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local WorldGen = require(Shared.WorldGen)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local ItemIcon = require(script.Parent.ItemIcon)
local New = Theme.New
local C = Theme.Colors

local Menu = {}
local player = Players.LocalPlayer
local gui = Theme.Screen("Menu", 4)

---------------------------------------------------------------------------
-- SIDE MENU
---------------------------------------------------------------------------
local function sideMenu(actions)
	local col = New("Frame", {
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 14, 0.56, 0),
		Size = UDim2.fromOffset(170, 360),
		Parent = gui,
	}, { New("UIGridLayout", { CellSize = UDim2.fromOffset(78, 82), CellPadding = UDim2.fromOffset(10, 12), SortOrder = Enum.SortOrder.LayoutOrder }) })
	for i, a in actions do
		local b = New("TextButton", {
			Text = "",
			AutoButtonColor = false,
			BackgroundColor3 = a.color,
			BorderSizePixel = 0,
			ClipsDescendants = true,
			LayoutOrder = i,
			Parent = col,
		}, { Theme.Corner(14), Theme.Stroke(C.Outline, 3), Theme.Gloss(a.color, 0.35) })
		Theme.Studs(b, 22, 0.85, 20)
		New("TextLabel", {
			Text = a.icon,
			BackgroundTransparency = 1,
			Position = UDim2.fromOffset(0, 2),
			Size = UDim2.new(1, 0, 0, 50),
			TextScaled = true,
			Font = Theme.Font,
			ZIndex = 2,
			Parent = b,
		})
		Theme.Label(a.label, {
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -2),
			Size = UDim2.new(1, -4, 0, 24),
			TextXAlignment = Enum.TextXAlignment.Center,
			Font = Theme.FontHeavy,
			TextSize = 18,
			ZIndex = 2,
			Parent = b,
		})
		if a.key then
			Theme.Label(a.key, { Position = UDim2.fromOffset(5, 2), Size = UDim2.fromOffset(16, 16), TextSize = 12, ZIndex = 3, Parent = b })
		end
		Theme.Bounce(b)
		b.MouseButton1Click:Connect(a.fn)
	end
end

---------------------------------------------------------------------------
-- HOTBAR
---------------------------------------------------------------------------
local hotbar
local slots = {}

local function tools(): { Tool }
	local list = {}
	local backpack = player:FindFirstChildOfClass("Backpack")
	for _, container in { player.Character, backpack } do
		if container then
			for _, t in container:GetChildren() do
				if t:IsA("Tool") and t:GetAttribute("ItemId") then
					table.insert(list, t)
				end
			end
		end
	end
	table.sort(list, function(a, b)
		return a:GetAttribute("ItemId") < b:GetAttribute("ItemId")
	end)
	return list
end

local function equip(index: number)
	local list = tools()
	local tool = list[index]
	local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if not hum or not tool then
		return
	end
	if tool.Parent == player.Character then
		hum:UnequipTools()
	else
		hum:EquipTool(tool)
	end
end

local function renderHotbar()
	for _, s in slots do
		s:Destroy()
	end
	slots = {}
	local list = tools()
	for i = 1, math.max(6, math.min(#list, 9)) do
		local tool = list[i]
		local equipped = tool and tool.Parent == player.Character
		local col = equipped and Color3.fromRGB(255, 210, 50) or Color3.fromRGB(70, 160, 255)
		local slot = New("TextButton", {
			Text = "",
			AutoButtonColor = false,
			BackgroundColor3 = col,
			BorderSizePixel = 0,
			LayoutOrder = i,
			Parent = hotbar,
		}, {
			Theme.Corner(10),
			Theme.Stroke(equipped and Color3.new(1, 1, 1) or C.Outline, equipped and 4 or 3),
			Theme.Gloss(col, 0.35),
		})
		Theme.Label(tostring(i), { Position = UDim2.fromOffset(5, 1), Size = UDim2.fromOffset(18, 18), Font = Theme.FontHeavy, TextSize = 18, ZIndex = 3, Parent = slot })
		if tool then
			local id = tool:GetAttribute("ItemId")
			local icon = ItemIcon.new(id, slot, UDim2.fromOffset(54, 50))
			icon.AnchorPoint = Vector2.new(0.5, 0)
			icon.Position = UDim2.new(0.5, 0, 0, 4)
			icon.ZIndex = 2
			Theme.Label(Items.Get(id).name, {
				AnchorPoint = Vector2.new(0.5, 1),
				Position = UDim2.new(0.5, 0, 1, -2),
				Size = UDim2.new(1, -4, 0, 14),
				TextXAlignment = Enum.TextXAlignment.Center,
				TextScaled = true,
				TextSize = 11,
				ZIndex = 3,
				Parent = slot,
			})
		else
			slot.BackgroundTransparency = 0.5
		end
		Theme.Bounce(slot)
		slot.MouseButton1Click:Connect(function()
			equip(i)
		end)
		table.insert(slots, slot)
	end
end

local function buildHotbar()
	pcall(function()
		StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false)
	end)
	hotbar = New("Frame", {
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -14),
		Size = UDim2.fromOffset(640, 76),
		Parent = gui,
	}, {
		New("UIGridLayout", { CellSize = UDim2.fromOffset(72, 72), CellPadding = UDim2.fromOffset(8, 0), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
	})

	local function watch(container: Instance?)
		if container then
			container.ChildAdded:Connect(function()
				task.defer(renderHotbar)
			end)
			container.ChildRemoved:Connect(function()
				task.defer(renderHotbar)
			end)
		end
	end
	local function onChar(char)
		watch(char)
		watch(player:WaitForChild("Backpack"))
		task.delay(0.5, renderHotbar)
	end
	player.CharacterAdded:Connect(onChar)
	if player.Character then
		onChar(player.Character)
	end
	local keys = {
		[Enum.KeyCode.One] = 1, [Enum.KeyCode.Two] = 2, [Enum.KeyCode.Three] = 3, [Enum.KeyCode.Four] = 4, [Enum.KeyCode.Five] = 5,
		[Enum.KeyCode.Six] = 6, [Enum.KeyCode.Seven] = 7, [Enum.KeyCode.Eight] = 8, [Enum.KeyCode.Nine] = 9,
	}
	UserInputService.InputBegan:Connect(function(input, gp)
		if not gp and keys[input.KeyCode] then
			equip(keys[input.KeyCode])
		end
	end)
end

---------------------------------------------------------------------------
-- ZONE TITLE
---------------------------------------------------------------------------
local ZONE_COLORS = {
	Meadow = Color3.fromRGB(150, 255, 90), Forest = Color3.fromRGB(90, 220, 90), Swamp = Color3.fromRGB(160, 200, 90),
	Desert = Color3.fromRGB(255, 210, 90), Ashlands = Color3.fromRGB(255, 110, 50), Tundra = Color3.fromRGB(170, 230, 255),
	Peaks = Color3.fromRGB(220, 225, 240), Beach = Color3.fromRGB(255, 230, 150), Ocean = Color3.fromRGB(90, 190, 255),
	Hub = Color3.fromRGB(255, 220, 60),
}

function Menu.ShowZone(name: string, color: Color3)
	local holder = New("Frame", {
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.3),
		Size = UDim2.fromOffset(900, 140),
		Parent = gui,
	})
	local scale = New("UIScale", { Scale = 2.2, Parent = holder })
	local small = Theme.Label("NOW ENTERING", {
		Size = UDim2.new(1, 0, 0, 34),
		TextXAlignment = Enum.TextXAlignment.Center,
		Font = Theme.FontHeavy,
		TextSize = 28,
		TextTransparency = 1,
		Parent = holder,
	})
	local big = Theme.Caption(string.upper(name), color, 78)
	big.AutomaticSize = Enum.AutomaticSize.None
	big.Size = UDim2.new(1, 0, 0, 96)
	big.Position = UDim2.fromOffset(0, 34)
	big.TextTransparency = 1
	big.Parent = holder
	TweenService:Create(scale, TweenInfo.new(0.35, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	TweenService:Create(small, TweenInfo.new(0.25), { TextTransparency = 0 }):Play()
	TweenService:Create(big, TweenInfo.new(0.25), { TextTransparency = 0 }):Play()
	task.delay(2.6, function()
		for _, l in { small, big } do
			TweenService:Create(l, TweenInfo.new(0.5), { TextTransparency = 1 }):Play()
			local s = l:FindFirstChildOfClass("UIStroke")
			if s then
				TweenService:Create(s, TweenInfo.new(0.5), { Transparency = 1 }):Play()
			end
		end
		TweenService:Create(holder, TweenInfo.new(0.5), { Position = UDim2.fromScale(0.5, 0.24) }):Play()
		task.wait(0.6)
		holder:Destroy()
	end)
end

local function zoneWatcher()
	local current = nil
	local candidate, since = nil, 0
	while true do
		task.wait(0.4)
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if root then
			local zone
			if WorldGen.InHub(root.Position, 0) then
				zone = "Hub"
			else
				local _, biome = WorldGen.Sample(root.Position.X, root.Position.Z)
				zone = biome
			end
			if zone ~= current then
				if zone ~= candidate then
					candidate, since = zone, os.clock()
				elseif os.clock() - since > 1.2 then
					current = zone
					local name = zone == "Hub" and "Spawn Plaza" or WorldGen.Biomes[zone].name
					Menu.ShowZone(name, ZONE_COLORS[zone] or Color3.new(1, 1, 1))
				end
			end
		end
	end
end

---------------------------------------------------------------------------
function Menu.Init(actions)
	sideMenu(actions)
	buildHotbar()
	task.spawn(zoneWatcher)
	State.On("inventory", function()
		task.defer(renderHotbar)
	end)
end

return Menu
