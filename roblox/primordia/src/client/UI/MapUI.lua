-- World map (M). Drawn entirely on the client from the shared world seed — no
-- server traffic. Shows biomes, rivers, faction territory, Echo players from
-- other shards (click to hop to their shard), event markers and the global
-- "MAP CONTROL" leaderboard.

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local WorldGen = require(Shared.WorldGen)
local Remotes = require(Shared.Remotes)
local Theme = require(script.Parent.Theme)
local State = require(script.Parent.State)
local New = Theme.New
local C = Theme.Colors

local MapUI = {}
local player = Players.LocalPlayer

local CELLS = 56
local ZOOMS = { 16, 32, 64, 128 }
local zoomIndex = 2
local markers: { { x: number, z: number, label: string, color: Color3, t: number } } = {}

local gui = Theme.Screen("Map", 13)
local win = Theme.Window({
	title = "World Map",
	icon = "🗺",
	color = Color3.fromRGB(40, 200, 190),
	body = Color3.fromRGB(40, 90, 150),
	size = UDim2.fromOffset(860, 640),
	maxSize = Vector2.new(860, 640),
	parent = gui,
	onClose = function()
		State.OpenPanel(nil)
	end,
})
local root = win.content
local mapFrame = New("Frame", {
	Position = UDim2.fromOffset(14, 14),
	Size = UDim2.new(0.7, -14, 1, -28),
	BackgroundColor3 = Color3.fromRGB(40, 110, 170),
	ClipsDescendants = true,
	Parent = root,
}, { Theme.Corner(12), New("UIAspectRatioConstraint", { AspectRatio = 1 }) })

local cellsFolder = New("Frame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = mapFrame })
local overlay = New("Frame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 3, Parent = mapFrame })
local cells = {}
for i = 0, CELLS - 1 do
	for j = 0, CELLS - 1 do
		local f = New("Frame", {
			BorderSizePixel = 0,
			Position = UDim2.fromScale(i / CELLS, j / CELLS),
			Size = UDim2.new(1 / CELLS, 1, 1 / CELLS, 1),
			Parent = cellsFolder,
		})
		cells[i * CELLS + j] = f
	end
end

-- side panel
local side = New("Frame", { BackgroundTransparency = 1, Position = UDim2.new(0.7, 10, 0, 14), Size = UDim2.new(0.3, -24, 1, -28), Parent = root })
Theme.Label("EXPLORE", { Size = UDim2.new(1, 0, 0, 28), Font = Theme.FontHeavy, TextSize = 26, Parent = side })
local coords = Theme.Label("", { Position = UDim2.fromOffset(0, 30), Size = UDim2.new(1, 0, 0, 18), TextSize = 12, TextColor3 = C.Muted, Parent = side })
local zoomLabel = Theme.Label("", { Position = UDim2.fromOffset(0, 50), Size = UDim2.new(1, 0, 0, 18), TextSize = 12, TextColor3 = C.Muted, Parent = side })
local zin = Theme.Button("+", C.CardLight, { Position = UDim2.fromOffset(0, 72), Size = UDim2.fromOffset(40, 32), Parent = side })
local zout = Theme.Button("−", C.CardLight, { Position = UDim2.fromOffset(46, 72), Size = UDim2.fromOffset(40, 32), Parent = side })

Theme.Label("MAP CONTROL", { Position = UDim2.fromOffset(0, 116), Size = UDim2.new(1, 0, 0, 20), Font = Theme.FontHeavy, TextSize = 18, TextColor3 = C.Doom, Parent = side })
Theme.Label("Share of all claimed land, every shard", { Position = UDim2.fromOffset(0, 136), Size = UDim2.new(1, 0, 0, 14), TextSize = 10, TextColor3 = C.Muted, Parent = side })
local board = New("Frame", { BackgroundTransparency = 1, Position = UDim2.fromOffset(0, 156), Size = UDim2.new(1, 0, 0, 200), Parent = side }, {
	New("UIListLayout", { Padding = UDim.new(0, 4) }),
})

Theme.Label("● you   ◆ echo (other shard — click to hop)   ○ territory   ✦ event", {
	AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 0), Size = UDim2.new(1, 0, 0, 60), TextWrapped = true, TextSize = 11, TextColor3 = C.Muted, TextYAlignment = Enum.TextYAlignment.Bottom, Parent = side,
})

local hopCard = Theme.Card({ Visible = false, Size = UDim2.fromOffset(200, 74), ZIndex = 10, Parent = mapFrame })
local hopName = Theme.Label("", { Position = UDim2.fromOffset(10, 6), Size = UDim2.new(1, -20, 0, 20), ZIndex = 11, Parent = hopCard })
local hopBtn = Theme.Button("Hop to their shard", C.Blue, { Position = UDim2.fromOffset(10, 32), Size = UDim2.new(1, -20, 0, 34), TextSize = 13, ZIndex = 11, Parent = hopCard })
local hopJob

hopBtn.MouseButton1Click:Connect(function()
	if hopJob then
		Remotes.JoinEcho:FireServer(hopJob)
		hopCard.Visible = false
	end
end)

local center = Vector3.zero

local function worldToUV(x: number, z: number): (number, number)
	local span = CELLS * ZOOMS[zoomIndex]
	return (x - center.X) / span + 0.5, (z - center.Z) / span + 0.5
end

local function drawTerrain()
	local scale = ZOOMS[zoomIndex]
	local sea = Config.SeaLevel
	for i = 0, CELLS - 1 do
		for j = 0, CELLS - 1 do
			local x = center.X + (i - CELLS / 2 + 0.5) * scale
			local z = center.Z + (j - CELLS / 2 + 0.5) * scale
			local h, biome, river = WorldGen.Sample(x, z)
			local col = WorldGen.Biomes[biome].map
			if river then
				col = Color3.fromRGB(70, 190, 230)
			elseif biome ~= "Ocean" then
				local shade = math.clamp(0.8 + (h - sea) / 220, 0.7, 1.15)
				col = Color3.new(math.min(col.R * shade, 1), math.min(col.G * shade, 1), math.min(col.B * shade, 1))
			else
				local depth = math.clamp((sea - h) / 30, 0, 1)
				col = col:Lerp(Color3.fromRGB(20, 60, 120), depth)
			end
			cells[i * CELLS + j].BackgroundColor3 = col
		end
	end
	zoomLabel.Text = "Zoom: " .. scale .. " studs / px  ·  " .. (CELLS * scale) .. " studs wide"
end

local function dot(u: number, v: number, size: number, color: Color3, text: string?, z: number?)
	if u < 0 or u > 1 or v < 0 or v > 1 then
		return nil
	end
	local d = New("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(u, v),
		Size = UDim2.fromOffset(size, size),
		BackgroundColor3 = color,
		ZIndex = z or 4,
		Parent = overlay,
	}, { Theme.Corner(size), New("UIStroke", { Color = Color3.new(0, 0, 0), Thickness = 1.5 }) })
	if text then
		local l = Theme.Label(text, { Position = UDim2.new(0.5, 0, 1, 2), AnchorPoint = Vector2.new(0.5, 0), Size = UDim2.fromOffset(140, 14), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 11, TextStrokeTransparency = 0.3, ZIndex = (z or 4) + 1, Parent = d })
		l.TextColor3 = Color3.new(1, 1, 1)
	end
	return d
end

local function drawOverlay()
	for _, c in overlay:GetChildren() do
		c:Destroy()
	end
	local span = CELLS * ZOOMS[zoomIndex]
	local px = mapFrame.AbsoluteSize.X
	-- territory circles
	for _, c in State.claims do
		local u, v = worldToUV(c.x, c.z)
		local r = Config.ClaimRadius / span * px * 2
		local circle = dot(u, v, math.max(r, 6), Color3.fromHex(c.color), "[" .. c.tag .. "]", 3)
		if circle then
			circle.BackgroundTransparency = 0.55
			circle.UIStroke.Color = Color3.fromHex(c.color)
			circle.UIStroke.Thickness = 2
		end
	end
	-- events
	for i = #markers, 1, -1 do
		local m = markers[i]
		if os.clock() - m.t > 300 then
			table.remove(markers, i)
		else
			local u, v = worldToUV(m.x, m.z)
			dot(u, v, 14, m.color, "✦ " .. m.label, 6)
		end
	end
	-- echoes (players in other shards)
	for _, e in State.echoes do
		local u, v = worldToUV(e.x, e.z)
		local col = e.c and Color3.fromHex(e.c) or Color3.fromRGB(200, 200, 255)
		local d = dot(u, v, 9, col, nil, 7)
		if d then
			d.Rotation = 45
			local btn = New("TextButton", { Text = "", BackgroundTransparency = 1, Size = UDim2.fromScale(2, 2), Position = UDim2.fromScale(-0.5, -0.5), ZIndex = 8, Parent = d })
			btn.MouseButton1Click:Connect(function()
				hopName.Text = (e.tag and ("[" .. e.tag .. "] ") or "") .. e.n
				hopJob = e.j
				hopCard.Position = UDim2.new(u, 10, v, 10)
				hopCard.Visible = true
			end)
		end
	end
	-- local players + me
	for _, p in Players:GetPlayers() do
		local r = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		if r then
			local u, v = worldToUV(r.Position.X, r.Position.Z)
			local me = p == player
			dot(u, v, me and 14 or 9, me and C.Accent or Color3.new(1, 1, 1), me and "YOU" or p.DisplayName, me and 9 or 7)
		end
	end
end

local function refreshBoard()
	for _, c in board:GetChildren() do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
	local ok, list = pcall(function()
		return Remotes.GetLeaderboard:InvokeServer()
	end)
	if not ok or not list or #list == 0 then
		Theme.Label("No land claimed yet. Be first.", { Size = UDim2.new(1, 0, 0, 18), TextSize = 12, Parent = board })
		return
	end
	for i = 1, math.min(8, #list) do
		local e = list[i]
		local row = New("Frame", { Size = UDim2.new(1, 0, 0, 20), BackgroundTransparency = 1, Parent = board })
		local barW = math.max(0.04, e.share)
		New("Frame", { Size = UDim2.fromScale(barW, 1), BackgroundColor3 = Color3.fromHex(e.color), BackgroundTransparency = 0.3, Parent = row }, { Theme.Corner(4) })
		Theme.Label(i .. ". [" .. e.tag .. "]  " .. math.floor(e.share * 100) .. "%", { Position = UDim2.fromOffset(6, 0), Size = UDim2.fromScale(1, 1), TextSize = 12, Parent = row })
	end
end

local function recenter()
	local r = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	center = r and r.Position or Vector3.zero
	coords.Text = string.format("You: %d, %d", math.floor(center.X), math.floor(center.Z))
end

local function fullRedraw()
	recenter()
	drawTerrain()
	drawOverlay()
end

function MapUI.Init()
	zin.MouseButton1Click:Connect(function()
		zoomIndex = math.max(1, zoomIndex - 1)
		fullRedraw()
	end)
	zout.MouseButton1Click:Connect(function()
		zoomIndex = math.min(#ZOOMS, zoomIndex + 1)
		fullRedraw()
	end)
	State.On("openPanel", function(name)
		task.spawn(function()
			win:SetVisible(name == "Map")
		end)
		hopCard.Visible = false
		if name == "Map" then
			fullRedraw()
			task.spawn(refreshBoard)
		end
	end)
	State.On("echoes", function()
		if win:IsVisible() then
			drawOverlay()
		end
	end)
	Remotes.WorldEvent.OnClientEvent:Connect(function(name, data)
		if data and data.x then
			table.insert(markers, { x = data.x, z = data.z, label = name, color = C.Gold, t = os.clock() })
		end
	end)
	UserInputService.InputBegan:Connect(function(input, gp)
		if not gp and input.KeyCode == Enum.KeyCode.M then
			State.OpenPanel("Map")
		end
	end)
end

return MapUI
