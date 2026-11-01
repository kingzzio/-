-- Inventory (G) with category tabs + ★ favourites, and a Crafting tab (C).
-- Click an item: Place it (buildables), Eat it (food), or ★ it.

local UserInputService = game:GetService("UserInputService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Recipes = require(Shared.Recipes)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local New = Theme.New
local C = Theme.Colors

local InventoryUI = {}
InventoryUI.OnPlace = nil :: ((string) -> ())?

local gui = Theme.Screen("Inventory", 10)
local root = Theme.Card({
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.52),
	Size = UDim2.new(0, 640, 0.72, 0),
	BackgroundColor3 = Color3.fromRGB(70, 150, 220),
	Visible = false,
	Parent = gui,
})
New("UISizeConstraint", { MaxSize = Vector2.new(640, 560), Parent = root })

local tabsBar = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(12, 10), Size = UDim2.new(1, -70, 0, 40), Parent = root }, {
	New("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }),
})
local close = Theme.Button("X", C.Red, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 10), Size = UDim2.fromOffset(40, 40), Parent = root })
close.MouseButton1Click:Connect(function()
	State.OpenPanel(nil)
end)
local hint = Theme.Label("Click to select", { Position = UDim2.fromOffset(14, 54), Size = UDim2.new(1, -28, 0, 18), TextSize = 13, Parent = root })

local grid = New("ScrollingFrame", {
	Position = UDim2.fromOffset(12, 76),
	Size = UDim2.new(1, -24, 1, -160),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 6,
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	CanvasSize = UDim2.new(),
	Parent = root,
}, { New("UIGridLayout", { CellSize = UDim2.fromOffset(92, 92), CellPadding = UDim2.fromOffset(8, 8) }) })

-- detail bar
local detail = Theme.Card({ AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 12, 1, -10), Size = UDim2.new(1, -24, 0, 66), Parent = root })
local dName = Theme.Label("", { Position = UDim2.fromOffset(12, 6), Size = UDim2.new(0.5, 0, 0, 24), Font = Theme.FontHeavy, TextSize = 20, Parent = detail })
local dInfo = Theme.Label("", { Position = UDim2.fromOffset(12, 32), Size = UDim2.new(0.55, 0, 0, 28), TextSize = 12, TextColor3 = C.Muted, TextWrapped = true, Parent = detail })
local actions = New("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -10, 0.5, 0), Size = UDim2.fromOffset(260, 44), Parent = detail }, {
	New("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Right, Padding = UDim.new(0, 6) }),
})

local TAB_ICONS = { All = "All", Tools = "⛏", Building = "🧱", Resources = "🪵", Farming = "🌾", Siege = "💣", Food = "🍞", Favorites = "★", Craft = "⚒ Craft" }
local currentTab = "All"
local selected: string? = nil
local tabButtons = {}

local function itemTile(id: string, count: number?, onClick)
	local def = Items.Get(id)
	local tile = New("TextButton", {
		Text = "",
		AutoButtonColor = true,
		BackgroundColor3 = Color3.fromRGB(235, 240, 245),
		BorderSizePixel = 0,
		Parent = grid,
	}, { Theme.Corner(10), New("UIStroke", { Color = Items.Rarity[def.rarity] or C.Stroke, Thickness = selected == id and 4 or 2 }) })
	-- simple 3D-ish block icon: the item's colour as a bevelled cube
	New("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.42), Size = UDim2.fromOffset(44, 44), BackgroundColor3 = def.color, Rotation = 0, Parent = tile }, {
		Theme.Corner(8),
		New("UIGradient", { Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromRGB(150, 150, 150)), Rotation = 60 }),
	})
	if count then
		Theme.Label(Theme.FormatNumber(count), { AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -6, 1, -4), Size = UDim2.fromOffset(60, 16), TextXAlignment = Enum.TextXAlignment.Right, TextSize = 13, TextColor3 = Color3.fromRGB(40, 40, 50), Parent = tile })
	end
	if State.favorites[id] then
		Theme.Label("★", { Position = UDim2.fromOffset(6, 2), Size = UDim2.fromOffset(20, 20), TextColor3 = C.Gold, TextSize = 18, Parent = tile })
	end
	Theme.Label(def.name, { Position = UDim2.new(0, 4, 1, -34), Size = UDim2.new(1, -8, 0, 14), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 10, TextColor3 = Color3.fromRGB(60, 60, 70), TextTruncate = Enum.TextTruncate.AtEnd, Parent = tile })
	tile.MouseButton1Click:Connect(onClick)
	return tile
end

local function clearGrid()
	for _, c in grid:GetChildren() do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
	for _, c in actions:GetChildren() do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
end

local function costText(cost): string
	local parts = {}
	for id, n in cost do
		local have = State.inventory[id] or 0
		table.insert(parts, (have >= n and "" or "✗") .. n .. " " .. (Items.Get(id) and Items.Get(id).name or id))
	end
	return table.concat(parts, ", ")
end

local render

local function showItemActions(id: string)
	local def = Items.Get(id)
	dName.Text = def.name
	dName.TextColor3 = Items.Rarity[def.rarity] or C.Text
	dInfo.Text = def.rarity .. " · " .. def.category .. (def.price and def.price > 0 and (" · sells ~" .. def.price .. "c") or "") .. (def.tool and (" · tier " .. def.tool.tier .. " " .. def.tool.kind) or "")
	if def.build then
		Theme.Button("Place (B)", C.Blue, { Size = UDim2.fromOffset(100, 40), Parent = actions }).MouseButton1Click:Connect(function()
			State.OpenPanel(nil)
			if InventoryUI.OnPlace then
				InventoryUI.OnPlace(id)
			end
		end)
	end
	if def.food or def.heal then
		Theme.Button("Eat", C.Accent, { Size = UDim2.fromOffset(70, 40), TextColor3 = Color3.new(0, 0, 0), Parent = actions }).MouseButton1Click:Connect(function()
			Remotes.EatItem:FireServer(id)
		end)
	end
	Theme.Button(State.favorites[id] and "★" or "☆", C.CardLight, { Size = UDim2.fromOffset(44, 40), TextColor3 = C.Gold, TextSize = 22, Parent = actions }).MouseButton1Click:Connect(function()
		Remotes.ToggleFavorite:FireServer(id)
	end)
end

render = function()
	clearGrid()
	for name, b in tabButtons do
		b.BackgroundColor3 = name == currentTab and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(200, 225, 245)
	end
	if currentTab == "Craft" then
		hint.Text = "Recipes — stations must be within " .. Recipes.StationRange .. " studs"
		for index, r in Recipes.List do
			local can = true
			for cid, n in r.cost do
				if (State.inventory[cid] or 0) < n then
					can = false
				end
			end
			local tile = itemTile(r.out, r.n > 1 and r.n or nil, function()
				selected = r.out
				clearGrid()
				render()
				dName.Text = Items.Get(r.out).name .. (r.n > 1 and (" x" .. r.n) or "")
				dName.TextColor3 = C.Text
				dInfo.Text = costText(r.cost) .. (r.station and ("  @ " .. r.station) or "  (by hand)")
				Theme.Button("Craft", can and C.Accent or C.CardLight, { Size = UDim2.fromOffset(90, 40), TextColor3 = can and Color3.new(0, 0, 0) or C.Muted, Parent = actions }).MouseButton1Click:Connect(function()
					Remotes.Craft:FireServer(index)
				end)
			end)
			tile.BackgroundTransparency = can and 0 or 0.45
			if r.station then
				Theme.Label("@" .. r.station, { Position = UDim2.fromOffset(4, 2), Size = UDim2.new(1, -8, 0, 12), TextSize = 9, TextXAlignment = Enum.TextXAlignment.Right, TextColor3 = Color3.fromRGB(90, 90, 110), Parent = tile })
			end
		end
		return
	end
	hint.Text = "Click to select · ★ favourite seeds are planted first"
	local ids = {}
	for id, n in State.inventory do
		local def = Items.Get(id)
		if def and n > 0 then
			if currentTab == "All" or def.category == currentTab or (currentTab == "Favorites" and State.favorites[id]) then
				table.insert(ids, id)
			end
		end
	end
	table.sort(ids, function(a, b)
		local fa, fb = State.favorites[a] and 1 or 0, State.favorites[b] and 1 or 0
		if fa ~= fb then
			return fa > fb
		end
		return Items.Get(a).name < Items.Get(b).name
	end)
	for _, id in ids do
		itemTile(id, State.inventory[id], function()
			selected = id
			render()
		end)
	end
	if selected and State.inventory[selected] then
		showItemActions(selected)
	else
		dName.Text = #ids == 0 and "Empty" or ""
		dInfo.Text = #ids == 0 and "Hit trees and rocks to gather. Explore ruins for loot." or ""
	end
end

local function setTab(name: string)
	currentTab = name
	render()
end

function InventoryUI.Open(tab: string?)
	if tab then
		currentTab = tab
	end
	State.OpenPanel("Inventory")
end

function InventoryUI.Init()
	local tabs = table.clone(Items.Categories)
	table.insert(tabs, "Craft")
	for _, name in tabs do
		local b = Theme.Button(TAB_ICONS[name] or name, Color3.fromRGB(200, 225, 245), {
			Size = UDim2.fromOffset(name == "All" and 48 or (name == "Craft" and 78 or 44), 40),
			TextColor3 = Color3.fromRGB(40, 60, 90),
			TextSize = 18,
			Parent = tabsBar,
		})
		b.MouseButton1Click:Connect(function()
			setTab(name)
		end)
		tabButtons[name] = b
	end
	State.On("openPanel", function(name)
		root.Visible = name == "Inventory"
		if root.Visible then
			render()
		end
	end)
	State.On("inventory", function()
		if root.Visible then
			render()
		end
	end)
	UserInputService.InputBegan:Connect(function(input, gp)
		if gp then
			return
		end
		if input.KeyCode == Enum.KeyCode.G then
			if State.openPanel == "Inventory" and currentTab ~= "Craft" then
				State.OpenPanel(nil)
			else
				currentTab = currentTab == "Craft" and "All" or currentTab
				if State.openPanel ~= "Inventory" then
					State.OpenPanel("Inventory")
				else
					render()
				end
			end
		elseif input.KeyCode == Enum.KeyCode.C then
			if State.openPanel == "Inventory" and currentTab == "Craft" then
				State.OpenPanel(nil)
			else
				currentTab = "Craft"
				if State.openPanel ~= "Inventory" then
					State.OpenPanel("Inventory")
				else
					render()
				end
			end
		end
	end)
end

return InventoryUI
