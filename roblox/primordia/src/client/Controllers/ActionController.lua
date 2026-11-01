-- Swinging tools / fists, siege aiming, and rendering Echoes (players from other
-- shards) as ghost silhouettes you can walk up to and hop to.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Config = require(Shared.Config)
local WorldGen = require(Shared.WorldGen)
local Remotes = require(Shared.Remotes)
local UI = script.Parent.Parent:WaitForChild("UI")
local Theme = require(UI.Theme)
local State = require(UI.State)

local ActionController = {}
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local isBuilding: () -> boolean = function()
	return false
end

---------------------------------------------------------------------------
-- swinging
---------------------------------------------------------------------------
local lastSwing = 0
local function swing()
	if os.clock() - lastSwing < Config.SwingCooldown then
		return
	end
	lastSwing = os.clock()
	Remotes.Swing:FireServer()
	-- tiny arm-swing feel: nudge the tool grip
	local char = player.Character
	local tool = char and char:FindFirstChildOfClass("Tool")
	if tool then
		local base = CFrame.new(0, -1, 0)
		tool.Grip = base * CFrame.Angles(math.rad(-70), 0, 0)
		task.delay(0.12, function()
			if tool.Parent then
				tool.Grip = base
			end
		end)
	end
end

local function hookTool(tool: Instance)
	if tool:IsA("Tool") and not tool:GetAttribute("Hooked") then
		tool:SetAttribute("Hooked", true)
		tool.Activated:Connect(swing)
	end
end

---------------------------------------------------------------------------
-- siege aiming
---------------------------------------------------------------------------
local aiming: { id: string, kind: string, range: number }? = nil
local aimMarker: Part? = nil
local aimGui = Theme.Screen("SiegeAim", 7)
local aimHint = Theme.Caption("", Theme.Colors.Doom, 30)
aimHint.AnchorPoint = Vector2.new(0.5, 1)
aimHint.Position = UDim2.new(0.5, 0, 1, -150)
aimHint.Visible = false
aimHint.Parent = aimGui

local function stopAim()
	aiming = nil
	aimHint.Visible = false
	if aimMarker then
		aimMarker:Destroy()
		aimMarker = nil
	end
end

local function startAim(id: string, kind: string, range: number)
	stopAim()
	aiming = { id = id, kind = kind, range = range }
	aimHint.Text = "AIM " .. string.upper(kind) .. " — click to fire, Q to cancel"
	aimHint.Visible = true
	local m = Instance.new("Part")
	m.Anchored = true
	m.CanCollide = false
	m.CanQuery = false
	m.Shape = Enum.PartType.Cylinder
	m.Size = Vector3.new(0.4, 16, 16)
	m.Material = Enum.Material.Neon
	m.Color = Theme.Colors.Doom
	m.Transparency = 0.4
	m.Parent = workspace
	aimMarker = m
end

local function aimPoint(): Vector3?
	local mpos = UserInputService:GetMouseLocation()
	local ray = camera:ViewportPointToRay(mpos.X, mpos.Y)
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { player.Character, aimMarker }
	local hit = workspace:Raycast(ray.Origin, ray.Direction * 1000, params)
	if hit then
		return hit.Position
	end
	-- beyond loaded terrain: project onto the generated heightmap
	local t = (Config.SeaLevel - ray.Origin.Y) / ray.Direction.Y
	if t > 0 then
		local p = ray.Origin + ray.Direction * t
		return Vector3.new(p.X, WorldGen.Sample(p.X, p.Z), p.Z)
	end
	return nil
end

---------------------------------------------------------------------------
-- echoes (other-shard players)
---------------------------------------------------------------------------
local echoFolder = Instance.new("Folder")
echoFolder.Name = "Echoes"
echoFolder.Parent = workspace
local ghosts: { [number]: { model: Model, target: Vector3, current: Vector3 } } = {}

local function makeGhost(e): Model
	local m = Instance.new("Model")
	m.Name = "Echo_" .. e.n
	local col = e.c and Color3.fromHex(e.c) or Color3.fromRGB(170, 190, 255)
	local function p(size, offset)
		local part = Instance.new("Part")
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.Size = size
		part.Material = Enum.Material.ForceField
		part.Color = col
		part:SetAttribute("Offset", offset)
		part.Parent = m
		return part
	end
	local torso = p(Vector3.new(2, 2, 1), Vector3.new(0, 3, 0))
	p(Vector3.new(1.2, 1.2, 1.2), Vector3.new(0, 4.6, 0))
	p(Vector3.new(1, 2, 1), Vector3.new(-1.5, 3, 0))
	p(Vector3.new(1, 2, 1), Vector3.new(1.5, 3, 0))
	p(Vector3.new(1, 2, 1), Vector3.new(-0.5, 1, 0))
	p(Vector3.new(1, 2, 1), Vector3.new(0.5, 1, 0))
	m.PrimaryPart = torso
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset(200, 40)
	bb.StudsOffset = Vector3.new(0, 3.5, 0)
	bb.MaxDistance = Config.EchoRenderDistance
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.Size = UDim2.fromScale(1, 1)
	t.Font = Enum.Font.GothamBold
	t.TextScaled = true
	t.TextColor3 = col
	t.TextStrokeTransparency = 0.4
	t.Text = "◆ " .. (e.tag and ("[" .. e.tag .. "] ") or "") .. e.n .. "\n(other shard)"
	t.Parent = bb
	bb.Parent = torso
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Hop to their shard"
	prompt.ObjectText = e.n
	prompt.HoldDuration = 1
	prompt.MaxActivationDistance = 14
	prompt.RequiresLineOfSight = false
	prompt.Parent = torso
	prompt.Triggered:Connect(function()
		Remotes.JoinEcho:FireServer(e.j)
	end)
	m.Parent = echoFolder
	return m
end

local function placeGhost(model: Model, pos: Vector3)
	for _, part in model:GetChildren() do
		if part:IsA("BasePart") then
			part.CFrame = CFrame.new(pos + part:GetAttribute("Offset"))
		end
	end
end

local function updateEchoes(list)
	State.Set("echoes", list)
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	local seen = {}
	for _, e in list do
		local y = WorldGen.Sample(e.x, e.z)
		local pos = Vector3.new(e.x, y, e.z)
		local near = root and (pos - root.Position).Magnitude < Config.EchoRenderDistance
		if near then
			seen[e.id] = true
			local g = ghosts[e.id]
			if not g then
				g = { model = makeGhost(e), target = pos, current = pos }
				ghosts[e.id] = g
				placeGhost(g.model, pos)
			end
			g.target = pos
		end
	end
	for id, g in ghosts do
		if not seen[id] then
			g.model:Destroy()
			ghosts[id] = nil
		end
	end
end

---------------------------------------------------------------------------
function ActionController.Init(buildActive: () -> boolean)
	isBuilding = buildActive

	local function onChar(char: Model)
		char.ChildAdded:Connect(hookTool)
		for _, c in char:GetChildren() do
			hookTool(c)
		end
	end
	player.CharacterAdded:Connect(onChar)
	if player.Character then
		onChar(player.Character)
	end

	UserInputService.InputBegan:Connect(function(input, gp)
		if gp then
			return
		end
		if aiming then
			if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
				local p = aimPoint()
				if p then
					Remotes.FireSiege:FireServer(aiming.id, p)
				end
				stopAim()
			elseif input.KeyCode == Enum.KeyCode.Q or input.KeyCode == Enum.KeyCode.Escape then
				stopAim()
			end
			return
		end
		-- bare-handed punch (tools fire through Activated)
		if input.UserInputType == Enum.UserInputType.MouseButton1 and not isBuilding() and State.openPanel == nil then
			local char = player.Character
			if char and not char:FindFirstChildOfClass("Tool") then
				swing()
			end
		end
	end)

	Remotes.SiegeAim.OnClientEvent:Connect(startAim)
	Remotes.Echoes.OnClientEvent:Connect(updateEchoes)
	Remotes.Claims.OnClientEvent:Connect(function(claims)
		State.Set("claims", claims or {})
	end)

	RunService.RenderStepped:Connect(function(dt)
		if aiming and aimMarker then
			local p = aimPoint()
			local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
			if p and root then
				local inRange = ((p - root.Position) * Vector3.new(1, 0, 1)).Magnitude <= aiming.range + 18
				aimMarker.Color = inRange and Theme.Colors.Doom or Color3.fromRGB(120, 120, 120)
				aimMarker.CFrame = CFrame.new(p) * CFrame.Angles(0, 0, math.pi / 2)
			end
		end
		-- glide echo ghosts toward their last known spot
		for _, g in ghosts do
			g.current = g.current:Lerp(g.target, math.min(1, dt * 2))
			placeGhost(g.model, g.current)
		end
	end)
end

return ActionController
