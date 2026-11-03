-- Crops grown on Farm Plots. grow = seconds to fully grow (real time, keeps growing
-- while you are offline). yield = {min,max}. seedBack = chance to also return a seed.

local Crops = {
	Wheat = { grow = 180, yield = { 2, 4 }, seedBack = 0.9, color = Color3.fromRGB(230, 200, 110) },
	Berry = { grow = 300, yield = { 3, 5 }, seedBack = 0.8, color = Color3.fromRGB(80, 60, 170) },
	Beet = { grow = 420, yield = { 2, 4 }, seedBack = 0.75, color = Color3.fromRGB(150, 30, 70) },
	Pumpkin = { grow = 720, yield = { 1, 2 }, seedBack = 0.7, color = Color3.fromRGB(240, 140, 40) },
	Sunbloom = { grow = 1500, yield = { 1, 2 }, seedBack = 0.5, color = Color3.fromRGB(255, 220, 70), pollinator = true },
}

return Crops
