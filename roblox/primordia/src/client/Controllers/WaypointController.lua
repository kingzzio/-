-- Big bobbing red 3D arrows (white outline) over things worth walking to:
-- nearby ruin chests, supply drops, fresh meteorites, the wandering trader and your
-- faction's home totem. Each arrow carries a short label and a distance.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UI = script.Parent.Parent:WaitForChild("UI")
local State = require(UI.State)

local WaypointController = {}
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local MAX_ARROWS = 8
local folder = Instance.new("Folder")
folder.Name = "Waypoints"
folder.Parent = workspace

local RED = Color3.fromRGB(235, 30, 35)
local arrows: { [any]: { model: Model, parts: { BasePart }, label: TextLabel, pos: Vector3, seen: boolean } } = {}

local function newArrow(text: string, color: Color3?)
	local m = Instance.new("Model")
	m.Name = "Arrow"
	local function part(class: string, size: Vector3): BasePart
		local p = Instance.new(class) :: BasePart
		p.Anchored = true
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.CastShadow = false
		p.Size = size
		p.Color = color or RED
		p.Material = Enum.Material.Neon
		p.Parent = m
		return p
	end
	local shaft = part("Part", Vector3.new(0.6, 2.6, 1.2))
	local w1 = part("WedgePart", Vector3.new(0.6, 1.9, 1.4))
	local w2 = part("WedgePart", Vector3.new(0.6, 1.9, 1.4))
	local hl = Instance.new("Highlight")
	hl.FillTransparency = 0.15
	hl.FillColor = color or RED
	hl.OutlineColor = Color3.new(1, 1, 1)
	hl.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
	hl.Parent = m
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset(160, 36)
	bb.StudsOffset = Vector3.new(0, 3.2, 0)
	bb.AlwaysOnTop = true
	bb.MaxDistance = 1200
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.TextColor3 = Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0
	label.Text = text
	label.Parent = bb
	bb.Parent = shaft
	m.Parent = folder
	return m, { shaft, w1, w2 }, label
end

local function placeArrow(parts: { BasePart }, pos: Vector3, t: number)
	local camPos = camera.CFrame.Position
	local flat = Vector3.new(camPos.X, pos.Y, camPos.Z)
	if (flat - pos).Magnitude < 0.1 then
		flat = pos + Vector3.new(0, 0, 1)
	end
	-- face the camera (yaw only) and bob up and down
	local root = CFrame.lookAt(pos + Vector3.new(0, math.sin(t * 3) * 0.7, 0), flat) * CFrame.Angles(0, math.pi / 2, 0)
	parts[1].CFrame = root * CFrame.new(0, 2.1, 0)
	local head = root * CFrame.Angles(math.pi, 0, 0)
	parts[2].CFrame = head * CFrame.new(0, 0, -0.7)
	parts[3].CFrame = head * CFrame.new(0, 0, 0.7) * CFrame.Angles(0, math.pi, 0)
end

local function gatherTargets(rootPos: Vector3)
	local list = {}
	local world = workspace:FindFirstChild("World")
	local function add(key, pos: Vector3, text: string, color: Color3?, maxDist: number)
		local d = (pos - rootPos).Magnitude
		if d <= maxDist and d > 12 then
			table.insert(list, { key = key, pos = pos, text = text, color = color, d = d })
		end
	end
	if world and world:FindFirstChild("Ruins") then
		for _, chest in world.Ruins:GetDescendants() do
			if chest.Name == "Chest" and chest:IsA("BasePart") then
				add(chest, chest.Position + Vector3.new(0, 9, 0), "LOOT", nil, 260)
			end
		end
	end
	if world and world:FindFirstChild("Nodes") then
		for _, n in world.Nodes:GetChildren() do
			if n:IsA("Model") and n:GetAttribute("Event") and n.PrimaryPart then
				add(n, n.PrimaryPart.Position + Vector3.new(0, 12, 0), "STARMETAL", Color3.fromRGB(170, 110, 255), 900)
			end
		end
	end
	for _, child in workspace:GetChildren() do
		if child:IsA("BasePart") and (child.Name == "SupplyDrop" or child.Name == "Wandering Trader") then
			add(child, child.Position + Vector3.new(0, 10, 0), child.Name == "SupplyDrop" and "SUPPLY DROP" or "TRADER", child.Name == "SupplyDrop" and nil or Color3.fromRGB(150, 80, 220), 1200)
		end
	end
	local myFaction = player:GetAttribute("Faction")
	if myFaction then
		for id, c in State.claims do
			if c.faction == myFaction then
				local y = rootPos.Y
				add("totem" .. id, Vector3.new(c.x, y + 30, c.z), "HOME", Color3.fromHex(c.color), 3000)
			end
		end
	end
	table.sort(list, function(a, b)
		return a.d < b.d
	end)
	return list
end

function WaypointController.Init()
	task.spawn(function()
		while true do
			local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
			for _, a in arrows do
				a.seen = false
			end
			if root then
				local targets = gatherTargets(root.Position)
				for i = 1, math.min(MAX_ARROWS, #targets) do
					local tg = targets[i]
					local a = arrows[tg.key]
					if not a then
						local m, parts, label = newArrow(tg.text, tg.color)
						a = { model = m, parts = parts, label = label, pos = tg.pos, seen = true }
						arrows[tg.key] = a
					end
					a.pos = tg.pos
					a.seen = true
					a.label.Text = tg.text .. "  " .. math.floor(tg.d) .. "m"
				end
			end
			for key, a in arrows do
				if not a.seen then
					a.model:Destroy()
					arrows[key] = nil
				end
			end
			task.wait(1)
		end
	end)
	RunService.RenderStepped:Connect(function()
		local t = os.clock()
		for _, a in arrows do
			placeArrow(a.parts, a.pos, t)
		end
	end)
end

return WaypointController
