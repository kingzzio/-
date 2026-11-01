-- Gathering from world nodes. Every hit pays out a little (so it always feels
-- rewarding); breaking the node pays the full bonus roll.

local Shared = game:GetService("ReplicatedStorage"):WaitForChild("Shared")
local Nodes = require(Shared.Nodes)
local Remotes = require(Shared.Remotes)

local HarvestService = {}
local S

function HarvestService:Hit(player: Player, model: Model, toolDef)
	local nodeType = model:GetAttribute("NodeType")
	local def = nodeType and Nodes.List[nodeType]
	if not def then
		return
	end
	local tool = toolDef and toolDef.tool
	local tier = (tool and (tool.kind == "pick" or tool.kind == "axe")) and tool.tier or 0
	if tier < def.minTier then
		Remotes.Notify:FireClient(player, "Needs a tier " .. def.minTier .. " " .. (def.tool == "pick" and "pickaxe" or "tool"), "error")
		return
	end
	local power = 5
	if tool and (tool.kind == def.tool or def.tool == "any") then
		power = tool.power
	elseif tool then
		power = math.max(5, tool.power * 0.35)
	end

	local hp = (model:GetAttribute("HP") or def.hp) - power
	model:SetAttribute("HP", hp)

	-- per-hit chip of the primary drop
	local primary = def.drops[1]
	local chip = math.max(1, math.floor(power / 14))
	S.InventoryService:Add(player, primary[1], chip, true)
	Remotes.Notify:FireClient(player, "+" .. chip .. " " .. primary[1], "chip")

	if def.stings then
		local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if hum then
			hum:TakeDamage(def.stings)
		end
	end

	-- visual shake
	local pp = model.PrimaryPart
	if pp then
		local cf = model:GetPivot()
		model:PivotTo(cf * CFrame.Angles(math.rad(math.random(-3, 3)), 0, math.rad(math.random(-3, 3))))
		task.delay(0.08, function()
			if model.Parent then
				model:PivotTo(cf)
			end
		end)
	end

	if hp <= 0 then
		local rng = Random.new()
		for _, d in def.drops do
			local chance = d[4] or 1
			if rng:NextNumber() <= chance then
				local n = rng:NextInteger(d[2], d[3])
				if n > 0 then
					S.InventoryService:Add(player, d[1], n)
				end
			end
		end
		local profile = S.DataService:Get(player)
		if profile then
			profile.stats.harvested += 1
		end
		S.WorldService:DepleteNode(model)
	end
end

function HarvestService:Init(services)
	S = services
end

return HarvestService
