-- Trailer-style captions, "+250" coin pops, raid alerts and harvest chips.

local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Items = require(Shared.Items)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local New = Theme.New

local Notifications = {}

local gui = Theme.Screen("Notifications", 50)

-- center caption stack
local captions = New("Frame", {
	BackgroundTransparency = 1,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0.56, 0),
	Size = UDim2.new(0.9, 0, 0.3, 0),
	Parent = gui,
}, { New("UIListLayout", { HorizontalAlignment = Enum.HorizontalAlignment.Center, Padding = UDim.new(0, 2) }) })

-- right-side alert feed
local feed = New("Frame", {
	BackgroundTransparency = 1,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -16, 0, 120),
	Size = UDim2.fromOffset(330, 400),
	Parent = gui,
}, { New("UIListLayout", { HorizontalAlignment = Enum.HorizontalAlignment.Right, Padding = UDim.new(0, 6) }) })

-- item chips near the crosshair
local chips = New("Frame", {
	BackgroundTransparency = 1,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 60, 0.5, -30),
	Size = UDim2.fromOffset(200, 140),
	Parent = gui,
}, { New("UIListLayout", { VerticalAlignment = Enum.VerticalAlignment.Bottom, Padding = UDim.new(0, 0) }) })

local STYLE = {
	big = { color = Theme.Colors.Accent, size = 54 },
	good = { color = Theme.Colors.Accent, size = 40 },
	doom = { color = Theme.Colors.Doom, size = 56 },
	event = { color = Theme.Colors.Gold, size = 42 },
	error = { color = Color3.fromRGB(255, 120, 120), size = 26 },
	info = { color = Color3.new(1, 1, 1), size = 28 },
}

function Notifications.Caption(text: string, style: string?)
	local s = STYLE[style or "info"] or STYLE.info
	local label = Theme.Caption(text, s.color, s.size)
	label.TextTransparency = 1
	label.Parent = captions
	local scale = New("UIScale", { Scale = 0.6, Parent = label })
	TweenService:Create(label, TweenInfo.new(0.15), { TextTransparency = 0 }):Play()
	TweenService:Create(scale, TweenInfo.new(0.25, Enum.EasingStyle.Back), { Scale = 1 }):Play()
	task.delay(style == "error" and 1.8 or 2.6, function()
		local t = TweenService:Create(label, TweenInfo.new(0.3), { TextTransparency = 1 })
		t:Play()
		t.Completed:Wait()
		label:Destroy()
	end)
	if #captions:GetChildren() > 4 then
		for _, c in captions:GetChildren() do
			if c:IsA("TextLabel") then
				c:Destroy()
				break
			end
		end
	end
end

function Notifications.Alert(text: string)
	local card = Theme.Card({
		Size = UDim2.fromOffset(320, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = Color3.fromRGB(60, 18, 22),
		StrokeColor = Theme.Colors.Red,
		Parent = feed,
	})
	Theme.Padding(10).Parent = card
	Theme.Label("⚠  " .. text, {
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		TextWrapped = true,
		TextColor3 = Color3.fromRGB(255, 200, 200),
		Parent = card,
	})
	Debris:AddItem(card, 8)
end

function Notifications.Chip(text: string, rarity: string?)
	local l = Theme.Label(text, {
		Size = UDim2.new(1, 0, 0, 22),
		Font = Theme.FontHeavy,
		TextSize = 20,
		TextColor3 = rarity and Items.Rarity[rarity] or Color3.new(1, 1, 1),
		TextStrokeTransparency = 0.2,
		Parent = chips,
	})
	TweenService:Create(l, TweenInfo.new(1.2), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
	Debris:AddItem(l, 1.3)
end

function Notifications.Coins(amount: number, reason: string)
	local holder = New("Frame", {
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, 0.4, 0),
		Size = UDim2.fromOffset(400, 90),
		Parent = gui,
	})
	local coin = New("Frame", {
		BackgroundColor3 = Theme.Colors.Gold,
		Size = UDim2.fromOffset(46, 46),
		Position = UDim2.new(0.5, -110, 0, 6),
		Parent = holder,
	}, { Theme.Corner(23), New("UIStroke", { Thickness = 3, Color = Color3.fromRGB(180, 120, 20) }) })
	Theme.Label("$", { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontHeavy, TextSize = 28, TextColor3 = Color3.fromRGB(150, 95, 10), Parent = coin })
	local amt = Theme.Caption("+" .. Theme.FormatNumber(amount), Theme.Colors.Accent, 50)
	amt.Position = UDim2.new(0.5, -55, 0, 0)
	amt.TextXAlignment = Enum.TextXAlignment.Left
	amt.Size = UDim2.fromOffset(220, 60)
	amt.AutomaticSize = Enum.AutomaticSize.None
	amt.Parent = holder
	local why = Theme.Label(reason, { Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0, 62), TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = Theme.Colors.Muted, Parent = holder })
	why.TextStrokeTransparency = 0.5
	TweenService:Create(holder, TweenInfo.new(1.6, Enum.EasingStyle.Quad), { Position = UDim2.new(0.5, 0, 0.3, 0) }):Play()
	task.delay(1.3, function()
		for _, d in holder:GetDescendants() do
			if d:IsA("TextLabel") then
				TweenService:Create(d, TweenInfo.new(0.3), { TextTransparency = 1 }):Play()
			elseif d:IsA("Frame") then
				TweenService:Create(d, TweenInfo.new(0.3), { BackgroundTransparency = 1 }):Play()
			end
		end
	end)
	Debris:AddItem(holder, 1.8)
end

function Notifications.Init()
	Remotes.Notify.OnClientEvent:Connect(function(text, style, rarity)
		if style == "chip" then
			Notifications.Chip(text)
		elseif style == "item" then
			Notifications.Chip(text, rarity)
		elseif style == "alert" then
			Notifications.Alert(text)
		else
			Notifications.Caption(text, style)
		end
	end)
	Remotes.CoinPopup.OnClientEvent:Connect(function(amount, reason)
		Notifications.Coins(amount, reason)
	end)
end

return Notifications
