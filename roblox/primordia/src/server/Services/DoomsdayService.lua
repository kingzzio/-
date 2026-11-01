-- The season clock.
--   GRACE    : before Doomsday. Build, farm, explore. Structure damage only between
--              factions that have BOTH declared war on each other.
--   ANARCHY  : after Doomsday. No rules — any base can be raided, online or offline.
--   COLLAPSE : final 24h of the season. The world starts eating itself (see EventService).
-- The phase is mirrored onto ReplicatedStorage attributes so every client can render
-- the countdown without remotes.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config)
local Remotes = require(Shared.Remotes)

local DoomsdayService = {}
local S

local SEASON_END = Config.DoomsdayUTC + Config.SeasonLengthDays * 86400

function DoomsdayService:Phase(): string
	local now = os.time()
	if now < Config.DoomsdayUTC then
		return "GRACE"
	elseif now < SEASON_END - 86400 then
		return "ANARCHY"
	else
		return "COLLAPSE"
	end
end

function DoomsdayService:IsAnarchy(): boolean
	return self:Phase() ~= "GRACE"
end

-- Can attacker's faction damage structures owned by defender's faction?
function DoomsdayService:CanRaid(attackerFaction: string?, defenderFaction: string?): boolean
	if self:IsAnarchy() then
		return true
	end
	if attackerFaction and defenderFaction and attackerFaction ~= defenderFaction then
		return S.FactionService:MutualWar(attackerFaction, defenderFaction)
	end
	return false
end

function DoomsdayService:PvPAllowed(a: Player, b: Player): boolean
	local fa, fb = a:GetAttribute("Faction"), b:GetAttribute("Faction")
	if fa and fa == fb then
		return false -- no friendly fire, ever
	end
	if self:IsAnarchy() or ReplicatedStorage:GetAttribute("BloodMoon") then
		return true
	end
	if (a:GetAttribute("Protected") or b:GetAttribute("Protected")) then
		return false -- fresh-spawn protection
	end
	-- Grace: PvP only in the wilds (outside any claim) or between warring factions.
	local root = b.Character and b.Character:FindFirstChild("HumanoidRootPart")
	if root and S.FactionService:ClaimAt(root.Position) then
		return fa ~= nil and fb ~= nil and S.FactionService:MutualWar(fa, fb)
	end
	return true
end

function DoomsdayService:Init(services)
	S = services
	ReplicatedStorage:SetAttribute("DoomsdayUTC", Config.DoomsdayUTC)
	ReplicatedStorage:SetAttribute("SeasonEndUTC", SEASON_END)
	ReplicatedStorage:SetAttribute("Phase", self:Phase())
end

function DoomsdayService:Start()
	local last = self:Phase()
	while true do
		task.wait(1)
		local phase = self:Phase()
		ReplicatedStorage:SetAttribute("ServerTime", os.time())
		if phase ~= last then
			last = phase
			ReplicatedStorage:SetAttribute("Phase", phase)
			if phase == "ANARCHY" then
				Remotes.Notify:FireAllClients("DOOMSDAY HAS BEGUN", "doom")
				Remotes.Notify:FireAllClients("THERE ARE NO RULES", "doom")
				S.EventService:Trigger("DoomsdayMeteors")
			elseif phase == "COLLAPSE" then
				Remotes.Notify:FireAllClients("THE COLLAPSE — 24 HOURS LEFT", "doom")
			end
		end
	end
end

return DoomsdayService
