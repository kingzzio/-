-- Tiny client-side store: UI modules read values and subscribe to changes.

local State = {
	inventory = {},
	coins = 0,
	favorites = {},
	faction = nil,
	invites = {},
	factionColors = {},
	claims = {},
	echoes = {},
	openPanel = nil, -- name of the full-screen panel currently open
}

local signals: { [string]: BindableEvent } = {}

local function signal(key: string): BindableEvent
	if not signals[key] then
		signals[key] = Instance.new("BindableEvent")
	end
	return signals[key]
end

function State.Set(key: string, value)
	State[key] = value
	signal(key):Fire(value)
end

function State.On(key: string, fn: (any) -> ())
	return signal(key).Event:Connect(fn)
end

-- Only one big panel open at a time (inventory / shop / faction / map).
function State.OpenPanel(name: string?)
	if State.openPanel == name then
		name = nil
	end
	State.Set("openPanel", name)
end

return State
