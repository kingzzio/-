-- Inventory (G) + Crafting (C) in the chunky simulator style: coloured tab bar,
-- rarity cards with rotating sunburst rays and 3D item models, big outlined
-- names, and a detail bar with green EQUIP / PLACE / CRAFT buttons.

local UserInputService = game:GetService("UserInputService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Recipes = require(Shared.Recipes)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local ItemIcon = require(script.Parent.ItemIcon)
local New = Theme.New
local C = Theme.Colors

local InventoryUI = {}
InventoryUI.OnPlace = nil :: ((string) -> ())?

local gui = Theme.Screen("Inventory", 10)
local win = Theme.Window({
	title = "Inventory",
	icon = "🎒",
	color = Color3.fromRGB(40, 150, 255),
	body = Color3.fromRGB(70, 175, 255),
	size = UDim2.new(0, 700, 0.78, 0),
	maxSize = Vector2.new(700, 600),
	parent = gui,
	onClose = function()
		State.OpenPanel(nil)
	end,
})
local root = win.content

-- coloured category tabs
local TABS = {
	{ "All", "ALL", Color3.fromRGB(255, 200, 40) },
	{ "Tools", "⛏", Color3.fromRGB(255, 140, 30) },
	{ "Armor", "🛡", Color3.fromRGB(150, 155, 175) },
	{ "Building", "🧱", Color3.fromRGB(210, 120, 70) },
	{ "Resources", "🪵", Color3.fromRGB(150, 105, 60) },
	{ "Farming", "🌾", Color3.fromRGB(120, 210, 60) },
	{ "Siege", "💣", Color3.fromRGB(235, 60, 60) },
	{ "Food", "🍞", Color3.fromRGB(255, 160, 90) },
	{ "Favorites", "★", Color3.fromRGB(255, 210, 40) },
	{ "Craft", "⚒ CRAFT", Color3.fromRGB(160, 70, 255) },
}
local tabsBar = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(14, 14), Size = UDim2.new(1, -28, 0, 44), Parent = root }, {
	New("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6), VerticalAlignment = Enum.VerticalAlignment.Center }),
})
local hint = Theme.Label("", { Position = UDim2.fromOffset(16, 62), Size = UDim2.new(1, -32, 0, 18), TextSize = 14, Parent = root })

local grid = New("ScrollingFrame", {
	Position = UDim2.fromOffset(14, 86),
	Size = UDim2.new(1, -28, 1, -190),
	BackgroundColor3 = Color3.fromRGB(20, 60, 120),
	BackgroundTransparency = 0.55,
	BorderSizePixel = 0,
	ScrollBarThickness = 8,
	ScrollBarImageColor3 = Color3.new(1, 1, 1),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	CanvasSize = UDim2.new(),
	Parent = root,
}, {
	Theme.Corner(12),
	Theme.Padding(10),
	New("UIGridLayout", { CellSize = UDim2.fromOffset(112, 128), CellPadding = UDim2.fromOffset(10, 12), SortOrder = Enum.SortOrder.LayoutOrder }),
})

-- detail bar
local detail = Theme.Card({
	AnchorPoint = Vector2.new(0, 1),
	Position = UDim2.new(0, 14, 1, -14),
	Size = UDim2.new(1, -28, 0, 84),
	BackgroundColor3 = Color3.fromRGB(30, 50, 100),
	Parent = root,
})
local dIcon = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(8, 6), Size = UDim2.fromOffset(72, 72), Parent = detail })
local dName = Theme.Label("", { Position = UDim2.fromOffset(88, 8), Size = UDim2.new(0.5, 0, 0, 30), Font = Theme.FontHeavy, TextSize = 26, Parent = detail })
local dInfo = Theme.Label("", { Position = UDim2.fromOffset(88, 42), Size = UDim2.new(0.5, 0, 0, 34), TextSize = 13, TextColor3 = C.Muted, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = detail })
local actions = New("Frame", { BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -12, 0.5, 0), Size = UDim2.fromOffset(300, 50), Parent = detail }, {
	New("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Right, VerticalAlignment = Enum.VerticalAlignment.Center, Padding = UDim.new(0, 8) }),
})

local currentTab = "All"
local selected: string? = nil
local tabButtons = {}

local function clear(frame: Instance)
	for _, c in frame:GetChildren() do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
end

-- One rarity card: coloured glossy body, rotating rays, 3D model, outlined name.
local function card(id: string, count: number?, order: number, onClick, dim: boolean?)
	local def = Items.Get(id)
	local col = Theme.RarityCard[def.rarity] or C.Blue
	local tile = New("TextButton", {
		Text = "",
		AutoButtonColor = false,
		BackgroundColor3 = col,
		BorderSizePixel = 0,
		ClipsDescendants = true,
		LayoutOrder = order,
		Parent = grid,
	}, {
		Theme.Corner(12),
		Theme.Stroke(selected == id and Color3.new(1, 1, 1) or C.Outline, selected == id and 4 or 3),
		Theme.Gloss(col, 0.3),
	})
	Theme.Sunburst(tile)
	local icon = ItemIcon.new(id, tile, UDim2.fromOffset(84, 78))
	icon.AnchorPoint = Vector2.new(0.5, 0.5)
	icon.Position = UDim2.fromScale(0.5, 0.44)
	icon.ZIndex = 2
	Theme.Label(def.name, {
		Position = UDim2.new(0, 4, 1, -30),
		Size = UDim2.new(1, -8, 0, 26),
		TextXAlignment = Enum.TextXAlignment.Center,
		TextScaled = true,
		TextSize = 15,
		ZIndex = 3,
		Parent = tile,
	})
	if count then
		Theme.Label("x" .. Theme.FormatNumber(count), { Position = UDim2.fromOffset(6, 4), Size = UDim2.fromOffset(70, 20), Font = Theme.FontHeavy, TextSize = 18, ZIndex = 3, Parent = tile })
	end
	if State.favorites[id] then
		Theme.Label("★", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -4, 0, 0), Size = UDim2.fromOffset(24, 24), TextColor3 = C.Gold, TextSize = 24, ZIndex = 3, Parent = tile })
	end
	if def.armor then
		for _, worn in State.armor do
			if worn == id then
				Theme.Pill("WORN", C.Accent, { Position = UDim2.fromOffset(6, 26), Size = UDim2.fromOffset(52, 20), ZIndex = 3, Parent = tile })
			end
		end
	end
	if dim then
		New("Frame", { BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, Size = UDim2.fromScale(1, 1), ZIndex = 4, Parent = tile }, { Theme.Corner(12) })
		Theme.Label("🔒", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -4, 0, 2), Size = UDim2.fromOffset(24, 24), TextSize = 20, ZIndex = 5, Parent = tile })
	end
	Theme.Bounce(tile)
	tile.MouseButton1Click:Connect(onClick)
	return tile
end

local function setDetailIcon(id: string)
	clear(dIcon)
	ItemIcon.new(id, dIcon)
end

local function costText(cost): string
	local parts = {}
	for id, n in cost do
		local have = State.inventory[id] or 0
		table.insert(parts, (have >= n and "✓ " or "✗ ") .. n .. " " .. (Items.Get(id) and Items.Get(id).name or id))
	end
	return table.concat(parts, "   ")
end

local render

local function showItemActions(id: string)
	local def = Items.Get(id)
	setDetailIcon(id)
	dName.Text = def.name
	dName.TextColor3 = Items.Rarity[def.rarity] or C.Text
	dInfo.Text = string.upper(def.rarity) .. " · " .. def.category .. (def.price and def.price > 0 and (" · sells ~" .. def.price .. "c") or "") .. (def.tool and (" · tier " .. def.tool.tier .. " " .. def.tool.kind) or "") .. (def.armor and (" · +" .. def.armor.hp .. " max HP") or "")
	if def.build then
		Theme.Button("PLACE", C.Blue, { Size = UDim2.fromOffset(100, 46), Font = Theme.FontHeavy, TextSize = 22, Parent = actions }).MouseButton1Click:Connect(function()
			State.OpenPanel(nil)
			if InventoryUI.OnPlace then
				InventoryUI.OnPlace(id)
			end
		end)
	end
	if def.armor then
		local worn = State.armor[def.armor.slot] == id
		Theme.Button(worn and "UNEQUIP" or "EQUIP", worn and C.Red or C.Accent, { Size = UDim2.fromOffset(110, 46), Font = Theme.FontHeavy, TextSize = 22, Parent = actions }).MouseButton1Click:Connect(function()
			Remotes.EquipArmor:FireServer(id)
		end)
	end
	if def.food or def.heal then
		Theme.Button("EAT", C.Accent, { Size = UDim2.fromOffset(80, 46), Font = Theme.FontHeavy, TextSize = 22, Parent = actions }).MouseButton1Click:Connect(function()
			Remotes.EatItem:FireServer(id)
		end)
	end
	Theme.Button(State.favorites[id] and "★" or "☆", C.Gold, { Size = UDim2.fromOffset(50, 46), TextSize = 26, Parent = actions }).MouseButton1Click:Connect(function()
		Remotes.ToggleFavorite:FireServer(id)
	end)
end

render = function()
	clear(grid)
	clear(actions)
	clear(dIcon)
	for name, b in tabButtons do
		local s = b:FindFirstChildOfClass("UIStroke")
		s.Color = name == currentTab and Color3.new(1, 1, 1) or C.Outline
		s.Thickness = name == currentTab and 3.5 or 2.5
	end
	if currentTab == "Craft" then
		hint.Text = "Recipes  ·  stations must be within " .. Recipes.StationRange .. " studs (the hub has them all)"
		for index, r in Recipes.List do
			local can = true
			for cid, n in r.cost do
				if (State.inventory[cid] or 0) < n then
					can = false
				end
			end
			card(r.out, r.n > 1 and r.n or nil, can and index or 1000 + index, function()
				selected = r.out
				render()
				setDetailIcon(r.out)
				dName.Text = Items.Get(r.out).name .. (r.n > 1 and (" x" .. r.n) or "")
				dName.TextColor3 = C.Text
				dInfo.Text = costText(r.cost) .. "\n" .. (r.station and ("@ " .. r.station) or "by hand")
				Theme.Button("CRAFT", can and C.Accent or C.CardLight, { Size = UDim2.fromOffset(120, 46), Font = Theme.FontHeavy, TextSize = 24, Parent = actions }).MouseButton1Click:Connect(function()
					Remotes.Craft:FireServer(index)
				end)
			end, not can)
		end
		return
	end
	hint.Text = "Click an item  ·  ★ favourite seeds get planted first"
	local ids = {}
	for id, n in State.inventory do
		local def = Items.Get(id)
		if def and n > 0 then
			if currentTab == "All" or def.category == currentTab or (currentTab == "Favorites" and State.favorites[id]) then
				table.insert(ids, id)
			end
		end
	end
	local order = { Mythic = 0, Legendary = 1, Epic = 2, Rare = 3, Uncommon = 4, Common = 5 }
	table.sort(ids, function(a, b)
		local fa, fb = State.favorites[a] and 1 or 0, State.favorites[b] and 1 or 0
		if fa ~= fb then
			return fa > fb
		end
		local ra, rb = order[Items.Get(a).rarity] or 9, order[Items.Get(b).rarity] or 9
		if ra ~= rb then
			return ra < rb
		end
		return Items.Get(a).name < Items.Get(b).name
	end)
	for i, id in ids do
		card(id, State.inventory[id], i, function()
			selected = id
			render()
		end)
	end
	if selected and State.inventory[selected] then
		showItemActions(selected)
	else
		dName.Text = #ids == 0 and "Empty!" or "Pick an item"
		dName.TextColor3 = C.Text
		dInfo.Text = #ids == 0 and "Punch trees and rocks to gather. Explore ruins for loot." or ""
	end
end

function InventoryUI.Open(tab: string?)
	if tab then
		currentTab = tab
	end
	win.title.Text = currentTab == "Craft" and "Crafting" or "Inventory"
	if State.openPanel ~= "Inventory" then
		State.OpenPanel("Inventory")
	else
		render()
	end
end

function InventoryUI.Init()
	for _, t in TABS do
		local name, label, color = t[1], t[2], t[3]
		local b = Theme.Button(label, color, {
			Size = UDim2.fromOffset(#label > 3 and 90 or 50, 42),
			Font = Theme.FontHeavy,
			TextSize = #label > 3 and 18 or 22,
			Parent = tabsBar,
		})
		b.MouseButton1Click:Connect(function()
			currentTab = name
			win.title.Text = name == "Craft" and "Crafting" or "Inventory"
			render()
		end)
		tabButtons[name] = b
	end
	State.On("openPanel", function(name)
		task.spawn(function()
			win:SetVisible(name == "Inventory")
		end)
		if name == "Inventory" then
			win.title.Text = currentTab == "Craft" and "Crafting" or "Inventory"
			render()
		end
	end)
	State.On("inventory", function()
		if win:IsVisible() then
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
				win.title.Text = "Inventory"
				InventoryUI.Open()
			end
		elseif input.KeyCode == Enum.KeyCode.C then
			if State.openPanel == "Inventory" and currentTab == "Craft" then
				State.OpenPanel(nil)
			else
				currentTab = "Craft"
				win.title.Text = "Crafting"
				InventoryUI.Open()
			end
		end
	end)
end

return InventoryUI
