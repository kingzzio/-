-- Visual language: dark rounded cards with neon-green accents (server card / faction
-- panel style), chunky outlined caption text, and a warm wooden look for the shop.

local Theme = {}

Theme.Colors = {
	Card = Color3.fromRGB(30, 33, 38),
	CardLight = Color3.fromRGB(44, 48, 55),
	Stroke = Color3.fromRGB(70, 75, 85),
	Accent = Color3.fromRGB(120, 255, 90), -- neon green
	Blue = Color3.fromRGB(45, 105, 255),
	Red = Color3.fromRGB(255, 60, 70),
	Gold = Color3.fromRGB(255, 200, 50),
	Text = Color3.fromRGB(240, 240, 245),
	Muted = Color3.fromRGB(160, 165, 175),
	Wood = Color3.fromRGB(110, 140, 60),
	WoodDark = Color3.fromRGB(70, 95, 40),
	Doom = Color3.fromRGB(255, 50, 60),
}

Theme.Font = Enum.Font.GothamBold
Theme.FontHeavy = Enum.Font.FredokaOne
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
	return New("UIStroke", { Color = color or Theme.Colors.Stroke, Thickness = thickness or 1.5, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

function Theme.Padding(px: number)
	local u = UDim.new(0, px)
	return New("UIPadding", { PaddingLeft = u, PaddingRight = u, PaddingTop = u, PaddingBottom = u })
end

function Theme.Card(props)
	props = props or {}
	local strokeColor = props.StrokeColor
	props.StrokeColor = nil
	props.BackgroundColor3 = props.BackgroundColor3 or Theme.Colors.Card
	props.BorderSizePixel = 0
	return New("Frame", props, { Theme.Corner(14), Theme.Stroke(strokeColor) })
end

function Theme.Label(text: string, props)
	props = props or {}
	props.Text = text
	props.BackgroundTransparency = 1
	props.Font = props.Font or Theme.Font
	props.TextColor3 = props.TextColor3 or Theme.Colors.Text
	props.TextSize = props.TextSize or 16
	props.TextXAlignment = props.TextXAlignment or Enum.TextXAlignment.Left
	return New("TextLabel", props)
end

function Theme.Button(text: string, color: Color3?, props)
	props = props or {}
	props.Text = text
	props.AutoButtonColor = true
	props.BackgroundColor3 = color or Theme.Colors.CardLight
	props.Font = props.Font or Theme.Font
	props.TextColor3 = props.TextColor3 or Color3.new(1, 1, 1)
	props.TextSize = props.TextSize or 16
	props.BorderSizePixel = 0
	return New("TextButton", props, { Theme.Corner(10) })
end

-- Big outlined "caption" text like a trailer subtitle.
function Theme.Caption(text: string, color: Color3?, size: number?)
	return New("TextLabel", {
		Text = text,
		BackgroundTransparency = 1,
		Font = Theme.FontHeavy,
		TextSize = size or 42,
		TextColor3 = color or Color3.new(1, 1, 1),
		TextStrokeTransparency = 1,
		Size = UDim2.new(1, 0, 0, (size or 42) + 10),
		AutomaticSize = Enum.AutomaticSize.X,
	}, {
		New("UIStroke", { Thickness = 4, Color = Color3.new(0, 0, 0), ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual }),
	})
end

function Theme.Screen(name: string, order: number?)
	local player = game:GetService("Players").LocalPlayer
	return New("ScreenGui", {
		Name = name,
		ResetOnSpawn = false,
		IgnoreGuiInset = true,
		DisplayOrder = order or 1,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = player:WaitForChild("PlayerGui"),
	})
end

function Theme.FormatNumber(n: number): string
	local s = tostring(math.floor(n))
	local out = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if out:sub(1, 1) == "," then
		out = out:sub(2)
	end
	return out
end

return Theme
