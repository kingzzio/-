-- Custom interaction prompts (replaces Roblox's plain grey box): a chunky dark
-- card with a yellow key cap, big outlined action text, the object name, and a
-- green progress bar that fills while you hold. Tappable on mobile.

local ProximityPromptService = game:GetService("ProximityPromptService")
local TweenService = game:GetService("TweenService")
local Theme = require(script.Parent.Theme)
local New = Theme.New
local C = Theme.Colors

local Prompts = {}
local player = game:GetService("Players").LocalPlayer
local active: { [ProximityPrompt]: BillboardGui } = {}

local function keyText(prompt: ProximityPrompt, inputType): string
	if inputType == Enum.ProximityPromptInputType.Touch then
		return "TAP"
	elseif inputType == Enum.ProximityPromptInputType.Gamepad then
		return string.gsub(prompt.GamepadKeyCode.Name, "Button", "")
	end
	return prompt.KeyboardKeyCode.Name
end

local function build(prompt: ProximityPrompt, inputType)
	local bb = New("BillboardGui", {
		Name = "PrimordiaPrompt",
		AlwaysOnTop = true,
		Size = UDim2.fromOffset(250, 76),
		SizeOffset = Vector2.new(0, 0.6),
		StudsOffset = Vector3.new(0, 1.5, 0),
		LightInfluence = 0,
		ResetOnSpawn = false,
		Adornee = prompt.Parent,
		Parent = player:WaitForChild("PlayerGui"),
	})
	local card = New("TextButton", {
		Text = "",
		AutoButtonColor = false,
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(34, 30, 52),
		BorderSizePixel = 0,
		Parent = bb,
	}, { Theme.Corner(14), Theme.Stroke(C.Outline, 3), Theme.Gloss(Color3.fromRGB(34, 30, 52), 0.15) })
	local scale = New("UIScale", { Scale = 0.5, Parent = card })

	local key = New("Frame", {
		Position = UDim2.fromOffset(10, 10),
		Size = UDim2.fromOffset(56, 56),
		BackgroundColor3 = C.Gold,
		BorderSizePixel = 0,
		Parent = card,
	}, { Theme.Corner(10), Theme.Stroke(C.Outline, 3), Theme.Gloss(C.Gold, 0.35) })
	Theme.Label(keyText(prompt, inputType), {
		Size = UDim2.fromScale(1, 1),
		TextXAlignment = Enum.TextXAlignment.Center,
		Font = Theme.FontHeavy,
		TextSize = 28,
		TextScaled = #keyText(prompt, inputType) > 2,
		Parent = key,
	})
	Theme.Label(string.upper(prompt.ActionText), {
		Position = UDim2.fromOffset(76, 8),
		Size = UDim2.new(1, -86, 0, 34),
		Font = Theme.FontHeavy,
		TextSize = 28,
		TextScaled = true,
		Parent = card,
	})
	Theme.Label(prompt.ObjectText, {
		Position = UDim2.fromOffset(76, 42),
		Size = UDim2.new(1, -86, 0, 18),
		TextSize = 14,
		TextColor3 = C.Muted,
		TextTruncate = Enum.TextTruncate.AtEnd,
		Parent = card,
	})
	local barBack = New("Frame", {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 10, 1, -6),
		Size = UDim2.new(1, -20, 0, 6),
		BackgroundColor3 = Color3.fromRGB(20, 18, 30),
		BorderSizePixel = 0,
		Visible = prompt.HoldDuration > 0,
		Parent = card,
	}, { Theme.Corner(3) })
	local bar = New("Frame", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = C.Accent, BorderSizePixel = 0, Parent = barBack }, { Theme.Corner(3) })

	TweenService:Create(scale, TweenInfo.new(0.2, Enum.EasingStyle.Back), { Scale = 1 }):Play()

	local holdTween
	local conns = {}
	table.insert(conns, prompt.PromptButtonHoldBegan:Connect(function()
		bar.Size = UDim2.fromScale(0, 1)
		holdTween = TweenService:Create(bar, TweenInfo.new(prompt.HoldDuration, Enum.EasingStyle.Linear), { Size = UDim2.fromScale(1, 1) })
		holdTween:Play()
		TweenService:Create(scale, TweenInfo.new(0.1), { Scale = 0.94 }):Play()
	end))
	table.insert(conns, prompt.PromptButtonHoldEnded:Connect(function()
		if holdTween then
			holdTween:Cancel()
		end
		bar.Size = UDim2.fromScale(0, 1)
		TweenService:Create(scale, TweenInfo.new(0.1), { Scale = 1 }):Play()
	end))
	table.insert(conns, prompt.Triggered:Connect(function()
		TweenService:Create(scale, TweenInfo.new(0.08), { Scale = 1.12 }):Play()
		task.delay(0.1, function()
			TweenService:Create(scale, TweenInfo.new(0.15, Enum.EasingStyle.Back), { Scale = 1 }):Play()
		end)
	end))
	-- touch / click support
	table.insert(conns, card.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
			prompt:InputHoldBegin()
		end
	end))
	table.insert(conns, card.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
			prompt:InputHoldEnd()
		end
	end))
	active[prompt] = bb
	bb.Destroying:Connect(function()
		for _, c in conns do
			c:Disconnect()
		end
	end)
end

local function customise(inst: Instance)
	if inst:IsA("ProximityPrompt") then
		inst.Style = Enum.ProximityPromptStyle.Custom
	end
end

function Prompts.Init()
	for _, d in workspace:GetDescendants() do
		customise(d)
	end
	workspace.DescendantAdded:Connect(customise)
	ProximityPromptService.PromptShown:Connect(function(prompt, inputType)
		if prompt.Style == Enum.ProximityPromptStyle.Custom then
			build(prompt, inputType)
		end
	end)
	ProximityPromptService.PromptHidden:Connect(function(prompt)
		local bb = active[prompt]
		active[prompt] = nil
		if bb then
			bb:Destroy()
		end
	end)
end

return Prompts
