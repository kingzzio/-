-- FACTION panel (F): the member wall (avatars + names, "10 members"), treasury,
-- totems, wars, invites, and the create-a-faction form.

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local New = Theme.New
local C = Theme.Colors

local FactionUI = {}
local player = Players.LocalPlayer

local gui = Theme.Screen("Faction", 12)
local root = Theme.Card({
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.52),
	Size = UDim2.new(0, 560, 0.74, 0),
	BackgroundTransparency = 0.08,
	Visible = false,
	Parent = gui,
})
New("UISizeConstraint", { MaxSize = Vector2.new(560, 600), Parent = root })
Theme.Button("X", C.Red, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 10), Size = UDim2.fromOffset(36, 36), Parent = root }).MouseButton1Click:Connect(function()
	State.OpenPanel(nil)
end)
local body = New("ScrollingFrame", {
	Position = UDim2.fromOffset(14, 14),
	Size = UDim2.new(1, -28, 1, -28),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 5,
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	CanvasSize = UDim2.new(),
	Parent = root,
}, { New("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }) })

local thumbs = {}
local order = 0
local function nextOrder()
	order += 1
	return order
end

local function clear()
	order = 0
	for _, c in body:GetChildren() do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
end

local function section(title: string, height: number?)
	local f = New("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -10, 0, height or 0), AutomaticSize = height and Enum.AutomaticSize.None or Enum.AutomaticSize.Y, LayoutOrder = nextOrder(), Parent = body })
	if title ~= "" then
		Theme.Label(title, { Size = UDim2.new(1, 0, 0, 20), TextColor3 = C.Muted, TextSize = 13, Parent = f })
	end
	return f
end

local function textBox(placeholder: string, parent, y: number, width: number)
	return New("TextBox", {
		PlaceholderText = placeholder,
		Text = "",
		ClearTextOnFocus = false,
		Position = UDim2.fromOffset(0, y),
		Size = UDim2.fromOffset(width, 36),
		BackgroundColor3 = C.CardLight,
		TextColor3 = C.Text,
		PlaceholderColor3 = C.Muted,
		Font = Theme.Font,
		TextSize = 16,
		Parent = parent,
	}, { Theme.Corner(8), Theme.Padding(8) })
end

local function act(action: string, payload)
	Remotes.FactionAction:FireServer(action, payload)
end

---------------------------------------------------------------------------
local function renderNone()
	local header = section("", 60)
	Theme.Label("FACTION", { Size = UDim2.new(1, 0, 0, 34), Font = Theme.FontHeavy, TextSize = 30, Parent = header })
	Theme.Label("You're a lone wanderer. Factions claim land, share bases and raid together.", { Position = UDim2.fromOffset(0, 34), Size = UDim2.new(1, -40, 0, 20), TextSize = 13, TextColor3 = C.Muted, TextWrapped = true, Parent = header })

	if #State.invites > 0 then
		local inv = section("INVITES")
		local list = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, 22), Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, Parent = inv }, {
			New("UIListLayout", { Padding = UDim.new(0, 6) }),
		})
		for _, i in State.invites do
			Theme.Button("Join [" .. i.tag .. "]", C.Accent, { Size = UDim2.fromOffset(200, 38), TextColor3 = Color3.new(0, 0, 0), Parent = list }).MouseButton1Click:Connect(function()
				act("accept", i.id)
			end)
		end
	end

	local form = section("CREATE A FACTION — " .. Config.FactionCreateCost .. " coins", 230)
	local name = textBox("Faction name (3–22)", form, 24, 320)
	local tag = textBox("TAG", form, 70, 100)
	Theme.Label("Banner colour", { Position = UDim2.fromOffset(0, 116), Size = UDim2.fromOffset(200, 18), TextSize = 13, TextColor3 = C.Muted, Parent = form })
	local chosen = State.factionColors[1]
	local swatches = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, 138), Size = UDim2.fromOffset(400, 34), Parent = form }, {
		New("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8) }),
	})
	local swatchButtons = {}
	for _, hex in State.factionColors do
		local b = New("TextButton", { Text = "", Size = UDim2.fromOffset(32, 32), BackgroundColor3 = Color3.fromHex(hex), Parent = swatches }, { Theme.Corner(16), New("UIStroke", { Thickness = hex == chosen and 3 or 0, Color = Color3.new(1, 1, 1) }) })
		swatchButtons[hex] = b
		b.MouseButton1Click:Connect(function()
			chosen = hex
			for h, sb in swatchButtons do
				sb.UIStroke.Thickness = h == chosen and 3 or 0
			end
		end)
	end
	Theme.Button("Found Faction", C.Blue, { Position = UDim2.fromOffset(0, 184), Size = UDim2.fromOffset(200, 40), Parent = form }).MouseButton1Click:Connect(function()
		act("create", { name = name.Text, tag = tag.Text, color = chosen })
	end)
end

local function memberWall(f)
	local wall = section("", nil)
	local grid = New("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, Parent = wall }, {
		New("UIGridLayout", { CellSize = UDim2.fromOffset(92, 96), CellPadding = UDim2.fromOffset(8, 8) }),
	})
	local myRank = f.myRank
	for _, m in f.members do
		local cell = New("Frame", { BackgroundColor3 = C.CardLight, BackgroundTransparency = m.online and 0 or 0.5, Parent = grid }, { Theme.Corner(10) })
		local img = New("ImageLabel", { Position = UDim2.new(0.5, -28, 0, 6), Size = UDim2.fromOffset(56, 56), BackgroundColor3 = Color3.fromRGB(230, 230, 230), Parent = cell }, { Theme.Corner(8) })
		task.spawn(function()
			thumbs[m.userId] = thumbs[m.userId] or Players:GetUserThumbnailAsync(m.userId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size100x100)
			img.Image = thumbs[m.userId]
		end)
		Theme.Label(m.name, { Position = UDim2.fromOffset(2, 64), Size = UDim2.new(1, -4, 0, 14), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 11, TextTruncate = Enum.TextTruncate.AtEnd, Parent = cell })
		Theme.Label((m.online and "● " or "○ ") .. m.rank, { Position = UDim2.fromOffset(2, 79), Size = UDim2.new(1, -4, 0, 12), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 10, TextColor3 = m.online and C.Accent or C.Muted, Parent = cell })
		if m.userId ~= player.UserId and (myRank == "Chief" or (myRank == "Officer" and m.rank == "Member")) then
			local btn = New("TextButton", { Text = "", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = cell })
			btn.MouseButton1Click:Connect(function()
				-- quick actions popover
				local pop = Theme.Card({ Position = UDim2.fromOffset(0, 0), Size = UDim2.fromScale(1, 1), ZIndex = 5, Parent = cell })
				if myRank == "Chief" then
					Theme.Button(m.rank == "Officer" and "Demote" or "Promote", C.Blue, { Position = UDim2.fromOffset(6, 8), Size = UDim2.new(1, -12, 0, 34), TextSize = 12, ZIndex = 6, Parent = pop }).MouseButton1Click:Connect(function()
						act("promote", m.userId)
					end)
				end
				Theme.Button("Kick", C.Red, { Position = UDim2.fromOffset(6, 50), Size = UDim2.new(1, -12, 0, 34), TextSize = 12, ZIndex = 6, Parent = pop }).MouseButton1Click:Connect(function()
					act("kick", m.userId)
				end)
				task.delay(3, function()
					if pop.Parent then
						pop:Destroy()
					end
				end)
			end)
		end
	end
end

local function renderFaction(f)
	local col = Color3.fromHex(f.color)
	local header = section("", 64)
	local badge = New("Frame", { Size = UDim2.fromOffset(54, 54), BackgroundColor3 = col, Parent = header }, { Theme.Corner(12) })
	Theme.Label(f.tag, { Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Font = Theme.FontHeavy, TextSize = 18, TextColor3 = Color3.new(0, 0, 0), Parent = badge })
	Theme.Label("FACTION", { Position = UDim2.fromOffset(66, 0), Size = UDim2.fromOffset(200, 22), TextSize = 14, TextColor3 = C.Muted, Parent = header })
	Theme.Label(f.name, { Position = UDim2.fromOffset(66, 20), Size = UDim2.fromOffset(300, 30), Font = Theme.FontHeavy, TextSize = 26, TextColor3 = col, Parent = header })
	Theme.Label(#f.members .. " members", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -40, 0, 4), Size = UDim2.fromOffset(140, 20), TextXAlignment = Enum.TextXAlignment.Right, TextColor3 = C.Accent, Parent = header })

	memberWall(f)

	local stats = section("", 64)
	local function stat(x, label, value)
		local s = Theme.Card({ Position = UDim2.new(x, 0, 0, 0), Size = UDim2.new(0.32, 0, 0, 60), BackgroundColor3 = C.CardLight, Parent = stats })
		Theme.Label(label, { Position = UDim2.fromOffset(10, 6), Size = UDim2.new(1, -20, 0, 16), TextSize = 11, TextColor3 = C.Muted, Parent = s })
		Theme.Label(value, { Position = UDim2.fromOffset(10, 24), Size = UDim2.new(1, -20, 0, 28), Font = Theme.FontHeavy, TextSize = 22, Parent = s })
	end
	stat(0, "TREASURY", Theme.FormatNumber(f.treasury) .. "c")
	stat(0.34, "TOTEMS", f.totems .. " / " .. f.maxTotems)
	stat(0.68, "MEMBERS", #f.members .. " / " .. f.maxMembers)

	-- wars
	local wars = section("WARS  (mutual war = raid each other even before Doomsday)")
	local wtext = {}
	for _, w in f.wars do
		table.insert(wtext, "[" .. w.tag .. "]" .. (w.mutual and " ⚔ MUTUAL" or " (pending)"))
	end
	Theme.Label(#wtext > 0 and table.concat(wtext, "   ") or "At peace with everyone.", { Position = UDim2.fromOffset(0, 22), Size = UDim2.new(1, 0, 0, 20), TextSize = 14, Parent = wars })
	wars.Size = UDim2.new(1, -10, 0, 46)

	-- actions
	local controls = section("ACTIONS", 150)
	local tagBox = textBox("Enemy TAG", controls, 24, 120)
	Theme.Button("Declare War", C.Red, { Position = UDim2.fromOffset(130, 24), Size = UDim2.fromOffset(120, 36), TextSize = 14, Parent = controls }).MouseButton1Click:Connect(function()
		act("war", tagBox.Text)
	end)
	Theme.Button("Make Peace", C.CardLight, { Position = UDim2.fromOffset(258, 24), Size = UDim2.fromOffset(110, 36), TextSize = 14, Parent = controls }).MouseButton1Click:Connect(function()
		act("peace", tagBox.Text)
	end)
	local amt = textBox("Coins", controls, 68, 120)
	Theme.Button("Deposit", C.Gold, { Position = UDim2.fromOffset(130, 68), Size = UDim2.fromOffset(120, 36), TextColor3 = Color3.new(0, 0, 0), TextSize = 14, Parent = controls }).MouseButton1Click:Connect(function()
		act("deposit", tonumber(amt.Text))
	end)
	Theme.Button("Leave Faction", Color3.fromRGB(90, 40, 45), { Position = UDim2.fromOffset(0, 112), Size = UDim2.fromOffset(150, 34), TextSize = 13, Parent = controls }).MouseButton1Click:Connect(function()
		act("leave")
	end)

	-- invite nearby / in-shard players
	if f.myRank ~= "Member" then
		local inv = section("INVITE PLAYERS IN THIS SHARD")
		local list = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, 22), Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, Parent = inv }, {
			New("UIGridLayout", { CellSize = UDim2.fromOffset(160, 34), CellPadding = UDim2.fromOffset(6, 6) }),
		})
		for _, p in Players:GetPlayers() do
			if p ~= player and not p:GetAttribute("Faction") then
				Theme.Button("+ " .. p.DisplayName, C.CardLight, { TextSize = 13, Parent = list }).MouseButton1Click:Connect(function()
					act("invite", p.UserId)
				end)
			end
		end
	end
	Theme.Label("Tip: craft a Faction Totem (40 wood, 40 stone, 10 fiber) to claim " .. Config.ClaimRadius .. " studs of land. Your Totem is also your respawn point and a Trading Post.", {
		Size = UDim2.new(1, -10, 0, 40), TextWrapped = true, TextSize = 12, TextColor3 = C.Muted, LayoutOrder = nextOrder(), Parent = body,
	})
end

local function render()
	clear()
	if State.faction then
		renderFaction(State.faction)
	else
		renderNone()
	end
end

function FactionUI.Init()
	Remotes.FactionUpdate.OnClientEvent:Connect(function(info, invites, colors)
		State.Set("factionColors", colors or State.factionColors)
		State.Set("invites", invites or {})
		State.Set("faction", info)
		if root.Visible then
			render()
		end
	end)
	State.On("openPanel", function(name)
		root.Visible = name == "Faction"
		if root.Visible then
			act("refresh")
			render()
		end
	end)
	UserInputService.InputBegan:Connect(function(input, gp)
		if not gp and input.KeyCode == Enum.KeyCode.F then
			State.OpenPanel("Faction")
		end
	end)
end

return FactionUI
