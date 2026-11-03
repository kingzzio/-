-- "Simulator" UI kit: chunky saturated windows with stud patterns, gradient header
-- bars, big white titles with thick black outlines, red square close buttons,
-- 3D buttons that bounce, sunburst cards and pill badges.

local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local Theme = {}

Theme.Colors = {
	Card = Color3.fromRGB(38, 42, 58),
	CardLight = Color3.fromRGB(64, 70, 92),
	Stroke = Color3.fromRGB(24, 22, 36),
	Accent = Color3.fromRGB(120, 230, 60), -- button green
	Blue = Color3.fromRGB(40, 150, 255),
	Red = Color3.fromRGB(235, 50, 60),
	Gold = Color3.fromRGB(255, 200, 40),
	Orange = Color3.fromRGB(255, 140, 30),
	Purple = Color3.fromRGB(160, 70, 255),
	Pink = Color3.fromRGB(255, 80, 170),
	Teal = Color3.fromRGB(40, 210, 190),
	Text = Color3.fromRGB(255, 255, 255),
	Muted = Color3.fromRGB(210, 215, 235),
	Wood = Color3.fromRGB(110, 190, 60),
	WoodDark = Color3.fromRGB(60, 120, 30),
	Doom = Color3.fromRGB(255, 50, 60),
	Outline = Color3.fromRGB(20, 18, 30),
}
local C = Theme.Colors

Theme.Font = Enum.Font.FredokaOne
Theme.FontHeavy = Enum.Font.LuckiestGuy
Theme.FontPixel = Enum.Font.Arcade

function Theme.New(className: string, props: { [string]: any }?, children: { Instance }?): any
	local inst = Instance.new(className)
	for k, v in props or {} do
		if k ~= "Parent" then
			inst[k] = v
		end
	end
	for _, c in children or {} do
		c.Parent = inst
	end
	if props and props.Parent then
		inst.Parent = props.Parent
	end
	return inst
end
local New = Theme.New

function Theme.Corner(r: number?)
	return New("UICorner", { CornerRadius = UDim.new(0, r or 12) })
end

function Theme.Stroke(color: Color3?, thickness: number?)
	return New("UIStroke", { Color = color or C.Outline, Thickness = thickness or 3, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

function Theme.Padding(px: number)
	local u = UDim.new(0, px)
	return New("UIPadding", { PaddingLeft = u, PaddingRight = u, PaddingTop = u, PaddingBottom = u })
end

local function lighten(c: Color3, amt: number): Color3
	return c:Lerp(Color3.new(1, 1, 1), amt)
end
local function darken(c: Color3, amt: number): Color3
	return c:Lerp(Color3.new(0, 0, 0), amt)
end
Theme.Lighten, Theme.Darken = lighten, darken

-- vertical light→colour gradient (the glossy toy look)
function Theme.Gloss(color: Color3, amt: number?)
	return New("UIGradient", {
		Color = ColorSequence.new(lighten(color, amt or 0.25), color),
		Rotation = 90,
	})
end

-- text outline used on every label
local function textStroke(thickness: number?)
	return New("UIStroke", { Color = C.Outline, Thickness = thickness or 2, ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual, LineJoinMode = Enum.LineJoinMode.Round })
end
Theme.TextStroke = textStroke

-- Embossed square "stud" pattern overlay (behind content, clipped by parent).
function Theme.Studs(parent: GuiObject, spacing: number?, transparency: number?, count: number?)
	spacing = spacing or 38
	local holder = New("Frame", {
		Name = "Studs",
		BackgroundTransparency = 1,
		Size = UDim2.fromScale(1, 1),
		ZIndex = 0,
		ClipsDescendants = true,
		Parent = parent,
	})
	New("UIGridLayout", {
		CellSize = UDim2.fromOffset(spacing * 0.5, spacing * 0.5),
		CellPadding = UDim2.fromOffset(spacing * 0.5, spacing * 0.5),
		Parent = holder,
	})
	New("UIPadding", { PaddingLeft = UDim.new(0, spacing * 0.25), PaddingTop = UDim.new(0, spacing * 0.25), Parent = holder })
	for _ = 1, count or 200 do
		New("Frame", { BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = transparency or 0.86, BorderSizePixel = 0, ZIndex = 0, Parent = holder }, {
			New("UICorner", { CornerRadius = UDim.new(0, 4) }),
			New("UIStroke", { Color = Color3.new(0, 0, 0), Transparency = 0.82, Thickness = 1.5 }),
		})
	end
	return holder
end

-- Rotating light rays behind an item (rarity cards).
local burstRoots = {}
function Theme.Sunburst(parent: GuiObject, color: Color3?)
	local root = New("Frame", {
		Name = "Sunburst",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.45),
		Size = UDim2.fromScale(1.6, 1.6),
		SizeConstraint = Enum.SizeConstraint.RelativeXX,
		ZIndex = 0,
		Parent = parent,
	})
	for i = 0, 7 do
		New("Frame", {
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.fromScale(0.5, 0.5),
			Size = UDim2.new(0.14, 0, 1, 0),
			Rotation = i * 22.5,
			BackgroundColor3 = color or Color3.new(1, 1, 1),
			BackgroundTransparency = 0.75,
			BorderSizePixel = 0,
			ZIndex = 0,
			Parent = root,
		}, {
			New("UIGradient", { Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.5, 0), NumberSequenceKeypoint.new(1, 1) }), Rotation = 90 }),
		})
	end
	table.insert(burstRoots, root)
	return root
end
RunService.RenderStepped:Connect(function(dt)
	for i = #burstRoots, 1, -1 do
		local r = burstRoots[i]
		if r.Parent then
			r.Rotation = (r.Rotation + dt * 12) % 360
		else
			table.remove(burstRoots, i)
		end
	end
end)

-- Hover grow / press squish on any GuiButton.
function Theme.Bounce(button: GuiButton)
	local scale = button:FindFirstChildOfClass("UIScale") or New("UIScale", { Parent = button })
	local function to(v, t)
		TweenService:Create(scale, TweenInfo.new(t or 0.12, Enum.EasingStyle.Back), { Scale = v }):Play()
	end
	button.MouseEnter:Connect(function()
		to(1.06)
	end)
	button.MouseLeave:Connect(function()
		to(1)
	end)
	button.MouseButton1Down:Connect(function()
		to(0.92, 0.06)
	end)
	button.MouseButton1Up:Connect(function()
		to(1.06)
	end)
end

function Theme.Card(props)
	props = props or {}
	local strokeColor = props.StrokeColor
	props.StrokeColor = nil
	local bg = props.BackgroundColor3 or C.Card
	props.BackgroundColor3 = bg
	props.BorderSizePixel = 0
	local card = New("Frame", props, { Theme.Corner(14), Theme.Stroke(strokeColor or C.Outline, 3) })
	if (props.BackgroundTransparency or 0) < 0.5 then
		Theme.Gloss(bg, 0.12).Parent = card
	end
	return card
end

function Theme.Label(text: string, props)
	props = props or {}
	local noStroke = props.NoStroke
	props.NoStroke = nil
	props.Text = text
	props.BackgroundTransparency = 1
	props.Font = props.Font or Theme.Font
	props.TextColor3 = props.TextColor3 or C.Text
	props.TextSize = props.TextSize or 16
	props.TextXAlignment = props.TextXAlignment or Enum.TextXAlignment.Left
	local label = New("TextLabel", props)
	local col = label.TextColor3
	if not noStroke and (col.R + col.G + col.B) > 1.2 then
		textStroke(props.TextSize >= 24 and 3 or 1.6).Parent = label
	end
	return label
end

-- Chunky 3D button: glossy fill, dark outline, darker "lip" underneath, bounce.
function Theme.Button(text: string, color: Color3?, props)
	props = props or {}
	color = color or C.CardLight
	props.Text = text
	props.AutoButtonColor = false
	props.BackgroundColor3 = color
	props.Font = props.Font or Theme.Font
	props.TextColor3 = props.TextColor3 or Color3.new(1, 1, 1)
	props.TextSize = props.TextSize or 18
	props.BorderSizePixel = 0
	local b = New("TextButton", props, {
		Theme.Corner(10),
		Theme.Stroke(C.Outline, 2.5),
		Theme.Gloss(color, 0.3),
	})
	if (b.TextColor3.R + b.TextColor3.G + b.TextColor3.B) > 1.2 then
		textStroke(1.8).Parent = b
	end
	-- lip
	New("Frame", {
		Name = "Lip",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 1, -2),
		Size = UDim2.new(1, -8, 0, 6),
		BackgroundColor3 = darken(color, 0.4),
		BorderSizePixel = 0,
		ZIndex = b.ZIndex - 1,
		Parent = b,
	}, { Theme.Corner(10) })
	Theme.Bounce(b)
	return b
end

function Theme.Pill(text: string, color: Color3, props)
	props = props or {}
	props.BackgroundColor3 = color
	props.BorderSizePixel = 0
	props.Size = props.Size or UDim2.fromOffset(150, 26)
	local pill = New("Frame", props, { Theme.Corner(13), Theme.Stroke(C.Outline, 2), Theme.Gloss(color, 0.25) })
	Theme.Label(text, { Name = "Text", Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 13, Parent = pill })
	return pill
end

-- Big outlined "caption" text.
function Theme.Caption(text: string, color: Color3?, size: number?)
	return New("TextLabel", {
		Text = text,
		BackgroundTransparency = 1,
		Font = Theme.FontHeavy,
		TextSize = size or 42,
		TextColor3 = color or Color3.new(1, 1, 1),
		Size = UDim2.new(1, 0, 0, (size or 42) + 10),
		AutomaticSize = Enum.AutomaticSize.X,
	}, {
		New("UIStroke", { Thickness = math.max(3, (size or 42) / 10), Color = C.Outline, ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual, LineJoinMode = Enum.LineJoinMode.Round }),
	})
end

-- Every screen is laid out on a virtual 1500x860 canvas and scaled to fit the
-- real viewport, so nothing overlaps on small windows (or Studio's viewport).
local REF = Vector2.new(1500, 860)
local scaledRoots = {}
local function fitScale(): number
	local vp = workspace.CurrentCamera and workspace.CurrentCamera.ViewportSize or REF
	return math.clamp(math.min(vp.X / REF.X, vp.Y / REF.Y), 0.4, 1.3)
end
local function refreshScales()
	local sc = fitScale()
	for _, r in scaledRoots do
		r.frame.Size = UDim2.fromScale(1 / sc, 1 / sc)
		r.scale.Scale = sc
	end
end
task.defer(function()
	local cam = workspace.CurrentCamera
	if cam then
		cam:GetPropertyChangedSignal("ViewportSize"):Connect(refreshScales)
	end
	refreshScales()
end)
Theme.UIScale = fitScale

function Theme.Screen(name: string, order: number?)
	local player = game:GetService("Players").LocalPlayer
	local screen = New("ScreenGui", {
		Name = name,
		ResetOnSpawn = false,
		IgnoreGuiInset = true,
		DisplayOrder = order or 1,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = player:WaitForChild("PlayerGui"),
	})
	local frame = New("Frame", { Name = "Root", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = screen })
	local scale = New("UIScale", { Parent = frame })
	table.insert(scaledRoots, { frame = frame, scale = scale })
	local sc = fitScale()
	frame.Size = UDim2.fromScale(1 / sc, 1 / sc)
	scale.Scale = sc
	return frame
end

--[[ Theme.Window: the standard pop-up.
  opts = { title, icon, color (header), body (body colour), size (UDim2), parent (ScreenGui), onClose }
  returns { root, content, header, SetVisible(self, bool), IsVisible(self) }
]]
function Theme.Window(opts)
	local body = opts.body or Color3.fromRGB(70, 160, 70)
	local root = New("Frame", {
		Name = (opts.title or "Window") .. "Window",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.53),
		Size = opts.size or UDim2.fromOffset(680, 540),
		BackgroundColor3 = body,
		BorderSizePixel = 0,
		Visible = false,
		Parent = opts.parent,
	}, {
		Theme.Corner(16),
		Theme.Stroke(C.Outline, 4),
		Theme.Gloss(body, 0.18),
		New("UISizeConstraint", { MaxSize = (opts.maxSize or Vector2.new(720, 600)) }),
	})
	local scale = New("UIScale", { Parent = root })
	local studHolder = New("Frame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ClipsDescendants = true, Parent = root }, { Theme.Corner(16) })
	Theme.Studs(studHolder, 44, 0.9, 200)

	local headerColor = opts.color or C.Gold
	local header = New("Frame", {
		Name = "Header",
		Position = UDim2.fromOffset(-8, -14),
		Size = UDim2.new(1, 16, 0, 66),
		BackgroundColor3 = headerColor,
		BorderSizePixel = 0,
		ZIndex = 5,
		Parent = root,
	}, {
		Theme.Corner(12),
		Theme.Stroke(C.Outline, 4),
		New("UIGradient", { Color = ColorSequence.new(lighten(headerColor, 0.35), headerColor), Rotation = 90 }),
	})
	local headerStuds = New("Frame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ClipsDescendants = true, ZIndex = 5, Parent = header }, { Theme.Corner(12) })
	Theme.Studs(headerStuds, 34, 0.82, 64)
	New("TextLabel", {
		Text = opts.icon or "",
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(12, 4),
		Size = UDim2.fromOffset(58, 58),
		TextScaled = true,
		Font = Theme.Font,
		ZIndex = 6,
		Parent = header,
	})
	local title = Theme.Label(opts.title or "", {
		Position = UDim2.fromOffset(opts.icon and 76 or 18, 6),
		Size = UDim2.new(1, -150, 0, 54),
		Font = Theme.FontHeavy,
		TextSize = 40,
		ZIndex = 6,
		Parent = header,
	})
	title.UIStroke.Thickness = 3.5

	local close = New("TextButton", {
		Name = "Close",
		Text = "X",
		Font = Theme.FontHeavy,
		TextSize = 30,
		TextColor3 = Color3.new(1, 1, 1),
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(50, 50),
		BackgroundColor3 = C.Red,
		AutoButtonColor = false,
		ZIndex = 7,
		Parent = header,
	}, {
		Theme.Corner(8),
		Theme.Stroke(C.Outline, 3),
		Theme.Gloss(C.Red, 0.3),
		textStroke(2.5),
	})
	Theme.Bounce(close)

	local content = New("Frame", {
		Name = "Content",
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(0, 56),
		Size = UDim2.new(1, 0, 1, -56),
		ZIndex = 2,
		Parent = root,
	})

	local win = { root = root, content = content, header = header, title = title, close = close }
	function win:SetVisible(on: boolean)
		if on == root.Visible then
			return
		end
		if on then
			root.Visible = true
			scale.Scale = 0.6
			TweenService:Create(scale, TweenInfo.new(0.28, Enum.EasingStyle.Back), { Scale = 1 }):Play()
		else
			local t = TweenService:Create(scale, TweenInfo.new(0.12), { Scale = 0.7 })
			t:Play()
			t.Completed:Wait()
			root.Visible = false
		end
	end
	function win:IsVisible(): boolean
		return root.Visible
	end
	close.MouseButton1Click:Connect(function()
		if opts.onClose then
			opts.onClose()
		end
	end)
	return win
end

-- "- Products -" style section heading.
function Theme.Section(text: string, props)
	props = props or {}
	props.Font = Theme.FontHeavy
	props.TextSize = props.TextSize or 26
	props.TextXAlignment = Enum.TextXAlignment.Center
	props.Size = props.Size or UDim2.new(1, 0, 0, 34)
	return Theme.Label("- " .. text .. " -", props)
end

function Theme.FormatNumber(n: number): string
	n = math.floor(n)
	local suffixes = { { 1e12, "T" }, { 1e9, "B" }, { 1e6, "M" }, { 1e4, "K" } }
	for _, s in suffixes do
		if math.abs(n) >= s[1] then
			local v = n / (s[1] == 1e4 and 1e3 or s[1])
			return string.format(v >= 100 and "%.0f%s" or "%.1f%s", v, s[1] == 1e4 and "K" or s[2])
		end
	end
	local str = tostring(n)
	local out = str:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if out:sub(1, 1) == "," then
		out = out:sub(2)
	end
	return out
end

-- Rarity → card colour (for sunburst cards).
Theme.RarityCard = {
	Common = Color3.fromRGB(130, 200, 255),
	Uncommon = Color3.fromRGB(110, 220, 80),
	Rare = Color3.fromRGB(50, 140, 255),
	Epic = Color3.fromRGB(170, 70, 255),
	Legendary = Color3.fromRGB(255, 190, 30),
	Mythic = Color3.fromRGB(255, 60, 90),
}

return Theme
