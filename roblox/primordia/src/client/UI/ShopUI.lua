-- GLOBAL SHOP in the simulator style: yellow header, green studded body,
-- "- Sell -" / "- Buy -" sections of sunburst cards with a 3D item, the live
-- cross-server price and a green price button.

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local ItemIcon = require(script.Parent.ItemIcon)
local New = Theme.New
local C = Theme.Colors

local ShopUI = {}

local gui = Theme.Screen("Shop", 11)
local win = Theme.Window({
	title = "Shop",
	icon = "🛒",
	color = Color3.fromRGB(255, 196, 30),
	body = Color3.fromRGB(80, 190, 60),
	size = UDim2.new(0, 700, 0.8, 0),
	maxSize = Vector2.new(700, 620),
	parent = gui,
	onClose = function()
		State.OpenPanel(nil)
	end,
})
local root = win.content

local boost = Theme.Pill("", C.Pink, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 12), Size = UDim2.fromOffset(420, 28), Parent = root })

local list = New("ScrollingFrame", {
	Position = UDim2.fromOffset(14, 48),
	Size = UDim2.new(1, -28, 1, -60),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 8,
	ScrollBarImageColor3 = Color3.new(1, 1, 1),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	CanvasSize = UDim2.new(),
	Parent = root,
}, { New("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder, HorizontalAlignment = Enum.HorizontalAlignment.Center }) })

local CARD_COLORS = {
	Color3.fromRGB(255, 120, 40), Color3.fromRGB(110, 210, 60), Color3.fromRGB(60, 150, 255),
	Color3.fromRGB(175, 80, 255), Color3.fromRGB(255, 80, 150), Color3.fromRGB(40, 200, 190),
}

local order = 0
local function nextOrder()
	order += 1
	return order
end

local function gridSection(title: string)
	Theme.Section(title, { LayoutOrder = nextOrder(), Parent = list })
	return New("Frame", {
		BackgroundTransparency = 1,
		Size = UDim2.new(1, -8, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		LayoutOrder = nextOrder(),
		Parent = list,
	}, { New("UIGridLayout", { CellSize = UDim2.new(0.5, -8, 0, 150), CellPadding = UDim2.fromOffset(12, 12) }) })
end

local function shopCard(parent, i: number, def, title: string, sub: string, subColor: Color3?)
	local col = CARD_COLORS[(i - 1) % #CARD_COLORS + 1]
	local cardFrame = New("Frame", { BackgroundColor3 = col, BorderSizePixel = 0, ClipsDescendants = true, Parent = parent }, {
		Theme.Corner(12),
		Theme.Stroke(C.Outline, 3),
		Theme.Gloss(col, 0.3),
	})
	Theme.Studs(cardFrame, 30, 0.88, 60)
	Theme.Sunburst(cardFrame)
	Theme.Label(title, { Position = UDim2.fromOffset(10, 6), Size = UDim2.new(1, -20, 0, 30), Font = Theme.FontHeavy, TextSize = 24, TextXAlignment = Enum.TextXAlignment.Center, TextScaled = true, ZIndex = 3, Parent = cardFrame })
	local icon = ItemIcon.new(def.id, cardFrame, UDim2.fromOffset(92, 92))
	icon.Position = UDim2.fromOffset(10, 40)
	icon.ZIndex = 2
	local s = Theme.Label(sub, { Position = UDim2.new(0, 104, 0, 44), Size = UDim2.new(1, -112, 0, 40), TextSize = 15, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 3, Parent = cardFrame })
	if subColor then
		s.TextColor3 = subColor
	end
	return cardFrame
end

local function priceButton(parent, text: string, color: Color3, x: number, w: number)
	return Theme.Button(text, color, {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, x, 1, -12),
		Size = UDim2.fromOffset(w, 40),
		Font = Theme.FontHeavy,
		TextSize = 20,
		ZIndex = 4,
		Parent = parent,
	})
end

local function render(data)
	if not data then
		return
	end
	order = 0
	for _, c in list:GetChildren() do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
	boost.Text.Text = (data.boost and data.boost > 1) and ("✨ " .. data.boost .. "x PRICES RIGHT NOW ✨") or "Live prices · shared by every server"
	boost.BackgroundColor3 = (data.boost and data.boost > 1) and C.Pink or Color3.fromRGB(40, 120, 40)

	local sell = gridSection("Sell")
	local n = 0
	for _, e in data.sell do
		local have = State.inventory[e.id] or 0
		if have > 0 then
			n += 1
			local def = Items.Get(e.id)
			local pct = math.floor((e.trend - 1) * 100 + 0.5)
			local trend = pct < -2 and ("▼ " .. pct .. "%") or (pct > 2 and ("▲ +" .. pct .. "%") or "● stable")
			local trendColor = pct < -2 and Color3.fromRGB(255, 200, 200) or Color3.fromRGB(220, 255, 200)
			local cardFrame = shopCard(sell, n, def, def.name, "You have " .. Theme.FormatNumber(have) .. "\n" .. trend, trendColor)
			priceButton(cardFrame, "💰 " .. e.price, C.Accent, -76, 110).MouseButton1Click:Connect(function()
				Remotes.ShopSell:FireServer(e.id, 1)
			end)
			priceButton(cardFrame, "ALL", C.Gold, -12, 58).MouseButton1Click:Connect(function()
				Remotes.ShopSell:FireServer(e.id, have)
			end)
		end
	end
	if n == 0 then
		Theme.Label("Nothing to sell yet — farm crops, mine gems, loot ruins!", { Size = UDim2.new(1, 0, 0, 40), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 18, Parent = sell })
		sell:FindFirstChildOfClass("UIGridLayout").CellSize = UDim2.new(1, 0, 0, 40)
	end

	local buy = gridSection("Buy")
	for i, e in data.buy do
		local def = Items.Get(e.id)
		local cardFrame = shopCard(buy, i + 2, def, def.name, def.rarity .. " " .. def.category)
		priceButton(cardFrame, "💰 " .. e.price, C.Accent, -76, 110).MouseButton1Click:Connect(function()
			Remotes.ShopBuy:FireServer(e.id, 1)
		end)
		priceButton(cardFrame, "x10", C.Blue, -12, 58).MouseButton1Click:Connect(function()
			Remotes.ShopBuy:FireServer(e.id, 10)
		end)
	end
end

local lastData
function ShopUI.Open()
	task.spawn(function()
		local ok, data = pcall(function()
			return Remotes.GetPrices:InvokeServer()
		end)
		if ok and data then
			lastData = data
			if State.openPanel ~= "Shop" then
				State.OpenPanel("Shop")
			end
			render(data)
		end
	end)
end

function ShopUI.Init()
	Remotes.OpenShop.OnClientEvent:Connect(function(data)
		lastData = data
		if State.openPanel ~= "Shop" then
			State.OpenPanel("Shop")
		end
		render(data)
	end)
	State.On("openPanel", function(name)
		task.spawn(function()
			win:SetVisible(name == "Shop")
		end)
	end)
	State.On("inventory", function()
		if win:IsVisible() then
			render(lastData)
		end
	end)
end

return ShopUI
