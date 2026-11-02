-- Always-on HUD: the ∞ server card, the DOOMSDAY clock, vitals, coins, territory
-- banner, target health bar and key hints.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local New = Theme.New
local C = Theme.Colors

local HUD = {}
local player = Players.LocalPlayer
local gui = Theme.Screen("HUD", 5)
local ping = 0

---------------------------------------------------------------------------
-- SERVER CARD ("13,427 of ∞ people")
---------------------------------------------------------------------------
local leftColumn = New("Frame", {
	BackgroundTransparency = 1,
	Position = UDim2.fromOffset(16, 16),
	Size = UDim2.fromOffset(300, 700),
	Parent = gui,
}, { New("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }) })
HUD.LeftColumn = leftColumn

local thumbs = {}
local function headshot(img: ImageLabel, userId: number)
	task.spawn(function()
		if not thumbs[userId] then
			local ok, url = pcall(function()
				return Players:GetUserThumbnailAsync(userId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size100x100)
			end)
			thumbs[userId] = ok and url or ""
		end
		img.Image = thumbs[userId]
	end)
end

local CARD_W = 270
local COLLAPSED_H = 66
local EXPANDED_H = 336

local function buildServerCard()
	local card = Theme.Card({
		Name = "ServerCard",
		Size = UDim2.fromOffset(CARD_W, COLLAPSED_H),
		StrokeColor = C.Accent,
		ClipsDescendants = true,
		LayoutOrder = 1,
		Parent = leftColumn,
	})
	card.UIStroke.Thickness = 2.5
	local icon = New("Frame", { Size = UDim2.fromOffset(44, 44), Position = UDim2.fromOffset(12, 11), BackgroundColor3 = Color3.fromRGB(80, 170, 90), Parent = card }, {
		Theme.Corner(10),
		New("UIGradient", { Color = ColorSequence.new(Color3.fromRGB(90, 200, 255), Color3.fromRGB(110, 210, 90)), Rotation = 90 }),
	})
	Theme.Label("∞", { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontHeavy, TextSize = 30, Parent = icon })
	Theme.Label(Config.GameName, { Position = UDim2.fromOffset(66, 10), Size = UDim2.fromOffset(190, 22), TextSize = 18, Parent = card })
	local sub = Theme.Label("Servers", { Position = UDim2.fromOffset(66, 32), Size = UDim2.fromOffset(190, 20), TextSize = 13, TextColor3 = C.Muted, Parent = card })

	-- 3x2 avatar grid; last cell is the "+N" bubble (like a Roblox server list card)
	local grid = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(16, 74), Size = UDim2.fromOffset(CARD_W - 32, 134), Parent = card }, {
		New("UIGridLayout", { CellSize = UDim2.fromOffset(66, 62), CellPadding = UDim2.fromOffset(20, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	local countLabel = Theme.Label("", { Position = UDim2.fromOffset(16, 212), Size = UDim2.new(1, -32, 0, 22), TextSize = 17, Parent = card })
	local barBack = New("Frame", { Position = UDim2.fromOffset(16, 238), Size = UDim2.new(1, -32, 0, 6), BackgroundColor3 = C.CardLight, BorderSizePixel = 0, ClipsDescendants = true, Parent = card }, { Theme.Corner(3) })
	local barFill = New("Frame", { Size = UDim2.fromScale(0.35, 1), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, Parent = barBack }, { Theme.Corner(3) })
	Theme.Button("···", C.CardLight, { Position = UDim2.fromOffset(16, 252), Size = UDim2.fromOffset(40, 26), Parent = card })
	local pingPill = Theme.Button("--ms", C.CardLight, { Position = UDim2.fromOffset(62, 252), Size = UDim2.fromOffset(60, 26), TextSize = 13, Parent = card })
	local join = Theme.Button("Join", C.Blue, { Position = UDim2.fromOffset(16, 284), Size = UDim2.new(0.66, -20, 0, 34), Parent = card })
	local share = Theme.Button("Share", C.CardLight, { Position = UDim2.new(0.66, 2, 0, 284), Size = UDim2.new(0.34, -18, 0, 34), Parent = card })
	local idLabel = Theme.Label("ID: ", { Position = UDim2.fromOffset(16, 320), Size = UDim2.new(1, -32, 0, 14), TextSize = 11, TextColor3 = C.Muted, Parent = card })

	join.MouseButton1Click:Connect(function()
		State.OpenPanel("Map") -- pick an Echo on the map to hop into their shard
	end)
	share.MouseButton1Click:Connect(function()
		share.Text = Config.DiscordInvite
		task.delay(3, function()
			share.Text = "Share"
		end)
	end)

	local expanded = false
	local function setExpanded(on: boolean)
		expanded = on
		TweenService:Create(card, TweenInfo.new(0.25, Enum.EasingStyle.Quart), { Size = UDim2.fromOffset(CARD_W, on and EXPANDED_H or COLLAPSED_H) }):Play()
	end
	card.InputBegan:Connect(function(input)
		if (input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch) and input.Position.Y - card.AbsolutePosition.Y < COLLAPSED_H then
			setExpanded(not expanded)
		end
	end)
	UserInputService.InputBegan:Connect(function(input, gp)
		if not gp and input.KeyCode == Enum.KeyCode.Tab then
			setExpanded(not expanded)
		end
	end)

	local function refreshAvatars(total: number)
		for _, c in grid:GetChildren() do
			if c:IsA("GuiObject") then
				c:Destroy()
			end
		end
		local list = Players:GetPlayers()
		local shown = math.min(5, #list)
		for i = 1, shown do
			local img = New("ImageLabel", { BackgroundColor3 = Color3.fromRGB(230, 230, 235), LayoutOrder = i, Parent = grid }, { Theme.Corner(31) })
			headshot(img, list[i].UserId)
		end
		local others = total - shown
		if others > 0 then
			local more = New("Frame", { BackgroundColor3 = Color3.fromRGB(95, 98, 108), LayoutOrder = 99, Parent = grid }, { Theme.Corner(31) })
			Theme.Label("+" .. Theme.FormatNumber(others), { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, TextSize = others > 9999 and 12 or 16, Parent = more })
		end
	end

	-- "of ∞" bar never fills: it shimmers forever.
	RunService.RenderStepped:Connect(function()
		local t = (os.clock() * 0.3) % 1.4
		barFill.Position = UDim2.fromScale(t - 0.35, 0)
	end)

	local function refresh()
		local total = ReplicatedStorage:GetAttribute("GlobalPlayers") or #Players:GetPlayers()
		local shards = ReplicatedStorage:GetAttribute("ShardCount") or 1
		countLabel.Text = Theme.FormatNumber(total) .. " of ∞ people"
		sub.Text = Theme.FormatNumber(total) .. " online · " .. shards .. " shard" .. (shards == 1 and "" or "s")
		idLabel.Text = "ID: " .. tostring(ReplicatedStorage:GetAttribute("ShardId") or "?") .. "   ·   this shard " .. #Players:GetPlayers() .. "/" .. (ReplicatedStorage:GetAttribute("ShardMax") or "?")
		pingPill.Text = math.floor(ping) .. "ms"
		refreshAvatars(total)
	end
	ReplicatedStorage:GetAttributeChangedSignal("GlobalPlayers"):Connect(refresh)
	Players.PlayerAdded:Connect(refresh)
	Players.PlayerRemoving:Connect(refresh)
	task.spawn(function()
		while true do
			local t0 = os.clock()
			pcall(function()
				Remotes.Ping:InvokeServer()
			end)
			ping = (os.clock() - t0) * 1000
			refresh()
			task.wait(5)
		end
	end)
end

---------------------------------------------------------------------------
-- FACTION WIDGET (always-on member wall under the server card)
---------------------------------------------------------------------------
local function buildFactionWidget()
	local card = Theme.Card({
		Size = UDim2.fromOffset(CARD_W, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 0.2,
		Visible = false,
		LayoutOrder = 2,
		Parent = leftColumn,
	})
	Theme.Padding(10).Parent = card
	New("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = card })
	local header = New("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 28), LayoutOrder = 1, Parent = card })
	local badge = New("Frame", { Size = UDim2.fromOffset(28, 28), Parent = header }, { Theme.Corner(7) })
	local badgeTag = Theme.Label("", { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontHeavy, TextSize = 11, TextColor3 = Color3.new(0, 0, 0), Parent = badge })
	Theme.Label("FACTION", { Position = UDim2.fromOffset(36, 0), Size = UDim2.fromOffset(120, 28), Font = Theme.FontHeavy, TextSize = 18, Parent = header })
	local members = Theme.Label("", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 0), Size = UDim2.fromOffset(110, 28), TextXAlignment = Enum.TextXAlignment.Right, TextSize = 13, TextColor3 = C.Accent, Parent = header })
	local wall = New("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = 2, Parent = card }, {
		New("UIGridLayout", { CellSize = UDim2.fromOffset(44, 58), CellPadding = UDim2.fromOffset(6, 4), SortOrder = Enum.SortOrder.LayoutOrder }),
	})

	local function render(f)
		card.Visible = f ~= nil
		if not f then
			return
		end
		local col = Color3.fromHex(f.color)
		badge.BackgroundColor3 = col
		badgeTag.Text = f.tag
		local online = 0
		for _, m in f.members do
			if m.online then
				online += 1
			end
		end
		members.Text = #f.members .. " members · " .. online .. " on"
		for _, c in wall:GetChildren() do
			if c:IsA("GuiObject") then
				c:Destroy()
			end
		end
		for i, m in f.members do
			local cell = New("Frame", { BackgroundTransparency = 1, LayoutOrder = i, Parent = wall })
			local img = New("ImageLabel", {
				Size = UDim2.fromOffset(44, 44),
				BackgroundColor3 = Color3.fromRGB(230, 230, 235),
				ImageTransparency = m.online and 0 or 0.55,
				Parent = cell,
			}, { Theme.Corner(8), New("UIStroke", { Color = m.rank == "Chief" and C.Gold or col, Thickness = m.online and 2 or 0 }) })
			headshot(img, m.userId)
			Theme.Label(m.name, { Position = UDim2.fromOffset(-4, 45), Size = UDim2.fromOffset(52, 12), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 9, TextTruncate = Enum.TextTruncate.AtEnd, TextColor3 = m.online and C.Text or C.Muted, Parent = cell })
		end
	end
	State.On("faction", render)
	render(State.faction)
end

---------------------------------------------------------------------------
-- DOOMSDAY COUNTDOWN
---------------------------------------------------------------------------
local function buildDoomsday()
	local panel = New("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 12),
		Size = UDim2.fromOffset(330, 84),
		BackgroundColor3 = Color3.fromRGB(14, 14, 20),
		BackgroundTransparency = 0.1,
		Parent = gui,
	}, { Theme.Corner(2), New("UIStroke", { Color = Color3.fromRGB(70, 70, 88), Thickness = 4 }) })
	-- inner pixel frame
	New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(4, 4), Size = UDim2.new(1, -8, 1, -8), Parent = panel }, {
		Theme.Corner(1),
		New("UIStroke", { Color = Color3.fromRGB(150, 30, 40), Thickness = 2 }),
	})
	local title = Theme.Label("DOOMSDAY", { Size = UDim2.new(1, 0, 0, 34), Position = UDim2.fromOffset(0, 4), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontPixel, TextSize = 34, TextColor3 = C.Doom, Parent = panel })
	local sub = Theme.Label(Config.GameName .. " anarchy begins in", { Size = UDim2.new(1, 0, 0, 14), Position = UDim2.fromOffset(0, 38), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 11, TextColor3 = C.Muted, Parent = panel })
	local clock = Theme.Label("", { Size = UDim2.new(1, 0, 0, 26), Position = UDim2.fromOffset(0, 54), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontPixel, TextSize = 24, TextColor3 = Theme.Colors.Gold, Parent = panel })

	-- client clock is synced to server time to avoid local clock drift
	local offset = 0
	ReplicatedStorage:GetAttributeChangedSignal("ServerTime"):Connect(function()
		offset = (ReplicatedStorage:GetAttribute("ServerTime") or os.time()) - os.time()
	end)

	RunService.RenderStepped:Connect(function()
		local doom = ReplicatedStorage:GetAttribute("DoomsdayUTC") or Config.DoomsdayUTC
		local seasonEnd = ReplicatedStorage:GetAttribute("SeasonEndUTC") or (doom + 86400 * 45)
		local now = os.time() + offset + (tick() % 1)
		local phase = ReplicatedStorage:GetAttribute("Phase") or "GRACE"
		local target
		if phase == "GRACE" then
			title.Text = "DOOMSDAY"
			sub.Text = Config.GameName .. " anarchy begins in"
			target = doom
		elseif phase == "ANARCHY" then
			title.Text = "ANARCHY"
			sub.Text = "NO RULES · the world collapses in"
			target = seasonEnd - 86400
		else
			title.Text = "THE COLLAPSE"
			sub.Text = "season wipe in"
			target = seasonEnd
		end
		local left = math.max(0, target - now)
		local d = math.floor(left / 86400)
		local h = math.floor(left % 86400 / 3600)
		local m = math.floor(left % 3600 / 60)
		local s = left % 60
		clock.Text = string.format("%dd %02dh %02dm %05.2fs", d, h, m, s)
		local pulse = phase ~= "GRACE" or left < 86400
		title.TextTransparency = pulse and (0.15 + 0.15 * math.sin(os.clock() * 6)) or 0
	end)
end

---------------------------------------------------------------------------
-- VITALS / COINS / KEYS
---------------------------------------------------------------------------
local function bar(parent, y, color, labelText)
	local back = New("Frame", { Position = UDim2.fromOffset(12, y), Size = UDim2.new(1, -24, 0, 14), BackgroundColor3 = C.CardLight, BorderSizePixel = 0, Parent = parent }, { Theme.Corner(7) })
	local fill = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = color, BorderSizePixel = 0, Parent = back }, { Theme.Corner(7) })
	local label = Theme.Label(labelText, { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 11, Parent = back })
	label.ZIndex = 3
	return fill, label
end

local function buildVitals()
	local card = Theme.Card({ AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 16, 1, -16), Size = UDim2.fromOffset(250, 96), Parent = gui })
	local coinIcon = New("Frame", { Position = UDim2.fromOffset(12, 10), Size = UDim2.fromOffset(26, 26), BackgroundColor3 = C.Gold, Parent = card }, { Theme.Corner(13) })
	Theme.Label("$", { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontHeavy, TextColor3 = Color3.fromRGB(150, 95, 10), Parent = coinIcon })
	local coins = Theme.Label("0", { Position = UDim2.fromOffset(46, 8), Size = UDim2.fromOffset(190, 30), Font = Theme.FontHeavy, TextSize = 26, Parent = card })
	local hpFill, hpLabel = bar(card, 46, Color3.fromRGB(150, 255, 60), "")
	local foodFill, foodLabel = bar(card, 68, Color3.fromRGB(255, 160, 60), "")

	State.On("coins", function(v)
		coins.Text = Theme.FormatNumber(v)
	end)
	RunService.Heartbeat:Connect(function()
		local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if hum then
			local pct = math.clamp(hum.Health / hum.MaxHealth, 0, 1)
			hpFill.Size = UDim2.fromScale(pct, 1)
			hpLabel.Text = "❤ " .. math.floor(hum.Health)
		end
		local hunger = player:GetAttribute("Hunger") or 100
		foodFill.Size = UDim2.fromScale(hunger / 100, 1)
		foodLabel.Text = "🍖 " .. math.floor(hunger)
	end)

	Theme.Label("1-9 Tools · G Bag · C Craft · F Clan · M Map · B Build · Tab Server", {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -16, 1, -12),
		Size = UDim2.fromOffset(460, 18),
		TextXAlignment = Enum.TextXAlignment.Right,
		TextSize = 13,
		TextColor3 = C.Muted,
		TextStrokeTransparency = 0.6,
		Parent = gui,
	})
end

---------------------------------------------------------------------------
-- TERRITORY BANNER + PHASE RULES
---------------------------------------------------------------------------
local function buildTerritory()
	local banner = Theme.Label("", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 102),
		Size = UDim2.fromOffset(420, 24),
		TextXAlignment = Enum.TextXAlignment.Center,
		Font = Theme.FontHeavy,
		TextSize = 20,
		TextStrokeTransparency = 0.3,
		Parent = gui,
	})
	local last = nil
	task.spawn(function()
		while true do
			task.wait(0.5)
			local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
			if root then
				local found
				for _, c in State.claims do
					local dx, dz = c.x - root.Position.X, c.z - root.Position.Z
					if dx * dx + dz * dz <= Config.ClaimRadius * Config.ClaimRadius then
						found = c
						break
					end
				end
				local key = found and found.tag or "wild"
				if key ~= last then
					last = key
					if found then
						local mine = found.faction == player:GetAttribute("Faction")
						banner.Text = mine and ("🏠 [" .. found.tag .. "] HOME TERRITORY") or ("⚔ [" .. found.tag .. "] TERRITORY")
						banner.TextColor3 = Color3.fromHex(found.color)
					else
						banner.Text = "WILDERNESS"
						banner.TextColor3 = C.Muted
					end
					banner.TextTransparency = 0
					task.delay(4, function()
						if last == key then
							TweenService:Create(banner, TweenInfo.new(0.6), { TextTransparency = 0.6 }):Play()
						end
					end)
				end
			end
		end
	end)
end

---------------------------------------------------------------------------
-- TARGET HEALTH (hover a node / wall)
---------------------------------------------------------------------------
local function buildTarget()
	local card = Theme.Card({ AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 132), Size = UDim2.fromOffset(240, 40), Visible = false, Parent = gui })
	local name = Theme.Label("", { Position = UDim2.fromOffset(10, 2), Size = UDim2.new(1, -20, 0, 18), TextSize = 13, Parent = card })
	local back = New("Frame", { Position = UDim2.fromOffset(10, 22), Size = UDim2.new(1, -20, 0, 10), BackgroundColor3 = C.CardLight, BorderSizePixel = 0, Parent = card }, { Theme.Corner(5) })
	local fill = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Accent, BorderSizePixel = 0, Parent = back }, { Theme.Corner(5) })
	local mouse = player:GetMouse()
	RunService.RenderStepped:Connect(function()
		local t = mouse.Target
		local model = t and t:FindFirstAncestorOfClass("Model")
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if model and root and (model:GetAttribute("NodeType") or model:GetAttribute("BuildId")) and (t.Position - root.Position).Magnitude < 40 then
			local hp, max = model:GetAttribute("HP") or 0, model:GetAttribute("MaxHP") or 1
			card.Visible = true
			local owner = model:GetAttribute("Faction") and " · enemy" or ""
			if model:GetAttribute("Faction") and model:GetAttribute("Faction") == player:GetAttribute("Faction") then
				owner = " · yours"
			end
			name.Text = (model:GetAttribute("NodeType") or model:GetAttribute("Kind")) .. owner .. "   " .. math.floor(hp) .. "/" .. max
			fill.Size = UDim2.fromScale(math.clamp(hp / max, 0, 1), 1)
		else
			card.Visible = false
		end
	end)
end

function HUD.Init()
	buildServerCard()
	buildFactionWidget()
	buildDoomsday()
	buildVitals()
	buildTerritory()
	buildTarget()
end

return HUD
