-- GLOBAL SHOP: wooden market stall look. Live cross-server prices with trend
-- arrows (red = market flooded, green = scarce), Sell 1 / Sell All, and Buy.

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local New = Theme.New
local C = Theme.Colors

local ShopUI = {}

local gui = Theme.Screen("Shop", 11)
local root = New("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.52),
	Size = UDim2.new(0, 680, 0.74, 0),
	BackgroundColor3 = C.Wood,
	Visible = false,
	Parent = gui,
}, {
	Theme.Corner(8),
	New("UIStroke", { Color = C.WoodDark, Thickness = 6 }),
	New("UISizeConstraint", { MaxSize = Vector2.new(680, 580) }),
	-- plank stripes
	New("UIGradient", {
		Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(125, 160, 70)),
			ColorSequenceKeypoint.new(0.5, Color3.fromRGB(105, 140, 58)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(125, 160, 70)),
		}),
	}),
})

local sign = New("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 12), Size = UDim2.fromOffset(300, 46), BackgroundColor3 = C.WoodDark, Parent = root }, {
	Theme.Corner(4),
	New("UIStroke", { Color = Color3.fromRGB(160, 200, 100), Thickness = 2 }),
})
Theme.Label("GLOBAL SHOP", { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontPixel, TextSize = 30, TextColor3 = Color3.fromRGB(220, 250, 180), Parent = sign })
local boostLabel = Theme.Label("", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 62), Size = UDim2.fromOffset(400, 18), TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = C.Gold, TextSize = 14, Parent = root })
Theme.Button("X", C.Red, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 10), Size = UDim2.fromOffset(40, 40), Parent = root }).MouseButton1Click:Connect(function()
	State.OpenPanel(nil)
end)

local function column(title: string, x: number)
	Theme.Label(title, { Position = UDim2.new(x, 14, 0, 84), Size = UDim2.new(0.5, -28, 0, 22), Font = Theme.FontHeavy, TextSize = 20, TextColor3 = Color3.fromRGB(250, 255, 230), Parent = root })
	return New("ScrollingFrame", {
		Position = UDim2.new(x, 12, 0, 110),
		Size = UDim2.new(0.5, -24, 1, -122),
		BackgroundColor3 = Color3.fromRGB(70, 95, 40),
		BackgroundTransparency = 0.35,
		BorderSizePixel = 0,
		ScrollBarThickness = 6,
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		CanvasSize = UDim2.new(),
		Parent = root,
	}, { Theme.Corner(8), Theme.Padding(6), New("UIListLayout", { Padding = UDim.new(0, 6) }) })
end
local sellList = column("SELL  (live prices, all servers)", 0)
local buyList = column("BUY", 0.5)

local function row(parent, def, text: string, sub: string, subColor: Color3)
	local r = New("Frame", { Size = UDim2.new(1, -4, 0, 50), BackgroundColor3 = Color3.fromRGB(240, 235, 210), Parent = parent }, { Theme.Corner(8) })
	New("Frame", { Position = UDim2.fromOffset(8, 9), Size = UDim2.fromOffset(32, 32), BackgroundColor3 = def.color, Parent = r }, { Theme.Corner(6) })
	Theme.Label(text, { Position = UDim2.fromOffset(48, 5), Size = UDim2.new(1, -170, 0, 20), TextColor3 = Color3.fromRGB(50, 50, 40), TextSize = 14, TextTruncate = Enum.TextTruncate.AtEnd, Parent = r })
	Theme.Label(sub, { Position = UDim2.fromOffset(48, 25), Size = UDim2.new(1, -170, 0, 18), TextColor3 = subColor, TextSize = 12, Parent = r })
	return r
end

local function render(data)
	if not data then
		return
	end
	boostLabel.Text = data.boost and data.boost > 1 and ("✨ " .. data.boost .. "x PRICES RIGHT NOW ✨") or "Prices fall when everyone sells the same thing — and recover over time"
	for _, list in { sellList, buyList } do
		for _, c in list:GetChildren() do
			if c:IsA("Frame") then
				c:Destroy()
			end
		end
	end
	for _, e in data.sell do
		local have = State.inventory[e.id] or 0
		if have > 0 then
			local def = Items.Get(e.id)
			local pct = math.floor((e.trend - 1) * 100 + 0.5)
			local arrow = pct < -2 and ("▼ " .. pct .. "%") or (pct > 2 and ("▲ +" .. pct .. "%") or "● stable")
			local col = pct < -2 and Color3.fromRGB(200, 50, 50) or Color3.fromRGB(40, 140, 50)
			local r = row(sellList, def, def.name .. "  ×" .. have, e.price .. "c each  " .. arrow, col)
			Theme.Button("1", C.Blue, { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -66, 0.5, 0), Size = UDim2.fromOffset(40, 34), Parent = r }).MouseButton1Click:Connect(function()
				Remotes.ShopSell:FireServer(e.id, 1)
			end)
			Theme.Button("All", Color3.fromRGB(40, 150, 60), { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -8, 0.5, 0), Size = UDim2.fromOffset(54, 34), Parent = r }).MouseButton1Click:Connect(function()
				Remotes.ShopSell:FireServer(e.id, have)
			end)
		end
	end
	if #sellList:GetChildren() <= 3 then
		Theme.Label("Nothing to sell yet — farm crops, mine gems, loot ruins.", { Size = UDim2.new(1, 0, 0, 40), TextWrapped = true, TextColor3 = Color3.fromRGB(230, 240, 210), Parent = sellList })
	end
	for _, e in data.buy do
		local def = Items.Get(e.id)
		local r = row(buyList, def, def.name, e.price .. " coins", Color3.fromRGB(120, 90, 20))
		Theme.Button("Buy", C.Gold, { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -66, 0.5, 0), Size = UDim2.fromOffset(52, 34), TextColor3 = Color3.new(0, 0, 0), Parent = r }).MouseButton1Click:Connect(function()
			Remotes.ShopBuy:FireServer(e.id, 1)
		end)
		Theme.Button("x10", Color3.fromRGB(200, 150, 30), { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -8, 0.5, 0), Size = UDim2.fromOffset(52, 34), TextColor3 = Color3.new(0, 0, 0), Parent = r }).MouseButton1Click:Connect(function()
			Remotes.ShopBuy:FireServer(e.id, 10)
		end)
	end
end

local lastData
function ShopUI.Init()
	Remotes.OpenShop.OnClientEvent:Connect(function(data)
		lastData = data
		if State.openPanel ~= "Shop" then
			State.OpenPanel("Shop")
		end
		render(data)
	end)
	State.On("openPanel", function(name)
		root.Visible = name == "Shop"
	end)
	State.On("inventory", function()
		if root.Visible then
			render(lastData)
		end
	end)
end

return ShopUI
