-- Ghost-preview placement. B = place last item, R = rotate, Click = place, Q/RMB = cancel.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local Items = require(Shared.Items)
local Buildables = require(Shared.Buildables)
local Remotes = require(Shared.Remotes)
local BuildModels = require(Shared.BuildModels)
local UI = script.Parent.Parent:WaitForChild("UI")
local Theme = require(UI.Theme)
local State = require(UI.State)

local BuildController = {}
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local ghost: Part? = nil -- invisible anchor; the preview model hangs off it
local ghostModel: Model? = nil
local ghostOffsets: { [BasePart]: CFrame } = {}
local currentItem: string? = nil
local lastItem: string? = nil
local rotation = 0
local valid = false
local conn: RBXScriptConnection? = nil

local gui = Theme.Screen("BuildHint", 6)
local hint = Theme.Label("", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -130),
	Size = UDim2.fromOffset(600, 26),
	TextXAlignment = Enum.TextXAlignment.Center,
	Font = Theme.FontHeavy,
	TextSize = 20,
	TextStrokeTransparency = 0.3,
	Visible = false,
	Parent = gui,
})

local function claimAt(pos: Vector3)
	local r2 = Config.ClaimRadius * Config.ClaimRadius
	for _, c in State.claims do
		local dx, dz = c.x - pos.X, c.z - pos.Z
		if dx * dx + dz * dz <= r2 then
			return c
		end
	end
	return nil
end

function BuildController.Stop()
	if conn then
		conn:Disconnect()
		conn = nil
	end
	if ghost then
		ghost:Destroy()
		ghost = nil
	end
	if ghostModel then
		ghostModel:Destroy()
		ghostModel = nil
	end
	ghostOffsets = {}
	currentItem = nil
	hint.Visible = false
end

function BuildController.Start(itemId: string)
	BuildController.Stop()
	local item = Items.Get(itemId)
	local def = item and item.build and Buildables.Get(item.build)
	if not def then
		return
	end
	if (State.inventory[itemId] or 0) <= 0 then
		return
	end
	currentItem = itemId
	lastItem = itemId
	local g = Instance.new("Part")
	g.Anchored = true
	g.CanCollide = false
	g.CanQuery = false
	g.CanTouch = false
	g.Size = def.size
	g.Material = Enum.Material.ForceField
	g.Transparency = 0.2
	g.Parent = workspace
	ghost = g
	-- full detailed preview of the real build
	local preview = Instance.new("Model")
	preview.Name = "BuildPreview"
	local main = g:Clone()
	main.Parent = preview
	main.CFrame = CFrame.new()
	BuildModels.Decorate(preview, item.build, main)
	for _, p in preview:GetDescendants() do
		if p:IsA("BasePart") then
			p.CanCollide = false
			p.CanQuery = false
			p.CanTouch = false
			p.Anchored = true
			p.CastShadow = false
			p.Material = Enum.Material.ForceField
			ghostOffsets[p] = p.CFrame
		elseif p:IsA("ParticleEmitter") or p:IsA("Fire") or p:IsA("Smoke") or p:IsA("Sparkles") or p:IsA("Light") then
			p:Destroy()
		end
	end
	if main.Transparency >= 1 then
		g.Transparency = 0.85
	end
	ghostOffsets[main] = nil
	main:Destroy()
	preview.Parent = workspace
	ghostModel = preview
	hint.Visible = true

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude

	conn = RunService.RenderStepped:Connect(function()
		local char = player.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		if not root or not ghost then
			return
		end
		params.FilterDescendantsInstances = { char, ghost, ghostModel }
		local mpos = UserInputService:GetMouseLocation()
		local ray = camera:ViewportPointToRay(mpos.X, mpos.Y)
		local hit = workspace:Raycast(ray.Origin, ray.Direction * 200, params)
		if not hit then
			return
		end
		local gsize = Config.Grid
		local p = hit.Position
		local pos = Vector3.new(math.round(p.X / gsize) * gsize, math.round((p.Y + def.size.Y / 2) * 2) / 2, math.round(p.Z / gsize) * gsize)
		ghost.CFrame = CFrame.new(pos) * CFrame.Angles(0, math.rad(rotation), 0)
		local dist = (pos - root.Position).Magnitude
		local claim = claimAt(pos)
		local blocked = claim and claim.faction ~= player:GetAttribute("Faction") and def.kind ~= "siege"
		valid = dist <= Config.BuildReach and not blocked
		local tint = valid and Color3.fromRGB(100, 255, 120) or Color3.fromRGB(255, 70, 70)
		ghost.Color = tint
		for p, offset in ghostOffsets do
			p.CFrame = ghost.CFrame * offset
			p.Color = tint
		end
		local why = dist > Config.BuildReach and "too far" or (blocked and ("claimed by [" .. claim.tag .. "]") or "")
		hint.Text = item.name .. " ×" .. (State.inventory[itemId] or 0) .. "   ·   Click place · R rotate · Q cancel" .. (why ~= "" and ("   ·   " .. why) or "")
		hint.TextColor3 = valid and Color3.new(1, 1, 1) or Color3.fromRGB(255, 140, 140)
	end)
end

function BuildController.IsActive(): boolean
	return currentItem ~= nil
end

function BuildController.Init()
	UserInputService.InputBegan:Connect(function(input, gp)
		if gp then
			return
		end
		if input.KeyCode == Enum.KeyCode.B then
			if currentItem then
				BuildController.Stop()
			elseif lastItem and (State.inventory[lastItem] or 0) > 0 then
				BuildController.Start(lastItem)
			else
				-- pick the first buildable we own
				for id, n in State.inventory do
					local it = Items.Get(id)
					if n > 0 and it and it.build then
						BuildController.Start(id)
						break
					end
				end
			end
		elseif not currentItem then
			return
		elseif input.KeyCode == Enum.KeyCode.R then
			rotation = (rotation + 90) % 360
		elseif input.KeyCode == Enum.KeyCode.Q or input.UserInputType == Enum.UserInputType.MouseButton2 then
			BuildController.Stop()
		elseif input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			if valid and ghost then
				Remotes.PlaceBuild:FireServer(currentItem, ghost.CFrame)
				task.wait(0.15)
				if currentItem and (State.inventory[currentItem] or 0) <= 0 then
					BuildController.Stop()
				end
			end
		end
	end)
	State.On("openPanel", function(name)
		if name then
			BuildController.Stop()
		end
	end)
end

return BuildController
