-- PRIMORDIA ∞ — global tuning knobs. Everything gameplay-wide lives here so
-- balancing never needs a code change.

local Config = {}

Config.GameName = "PRIMORDIA ∞"
Config.Tagline = "One endless world. Every server. No rules after Doomsday."
Config.DiscordInvite = "discord.gg/your-invite" -- set this to your own server

---------------------------------------------------------------------------
-- WORLD
---------------------------------------------------------------------------
Config.WorldSeed = 271828       -- same seed on every server = same world everywhere
Config.ChunkSize = 64           -- studs per chunk side (must be a multiple of Voxel)
Config.Voxel = 4                -- terrain voxel resolution
Config.MaxHeight = 192          -- top of generated terrain region
Config.SeaLevel = 32
Config.LoadRadius = 3           -- chunks generated around every player
Config.UnloadRadius = 5         -- chunks farther than this from everyone are freed
Config.ChunksPerStep = 1        -- generation budget per step
Config.GenStepDelay = 0.04
Config.SpawnScatter = 1600      -- new players spawn up to this far from origin
Config.NodeRespawnSeconds = 300
Config.StructureChance = 0.07   -- chance a chunk holds a lootable ruin
Config.ChestCooldown = 20 * 60  -- per-chest, per-player cooldown

---------------------------------------------------------------------------
-- DOOMSDAY (anarchy start). Before this: Grace Season. After: no rules.
---------------------------------------------------------------------------
Config.DoomsdayUTC = DateTime.fromUniversalTime(2026, 11, 23, 18, 0, 0).UnixTimestamp
Config.SeasonLengthDays = 45    -- the world wipes this long after Doomsday ("The Collapse")

---------------------------------------------------------------------------
-- MEGA-WORLD (cross-server shared world)
---------------------------------------------------------------------------
Config.ShardHeartbeat = 15      -- seconds between shard registry updates
Config.EchoBaseInterval = 3     -- seconds between position broadcasts (scaled by shard count)
Config.EchoRenderDistance = 450 -- studs: how close an echo must be to be drawn in 3D
Config.MaxPlayersPerShard = 50  -- actual Roblox server size; the world itself has no cap

---------------------------------------------------------------------------
-- BUILDING / FACTIONS
---------------------------------------------------------------------------
Config.Grid = 4
Config.BuildReach = 28
Config.ClaimRadius = 112        -- studs around a Totem
Config.MaxTotemsPerFaction = 6
Config.MaxFactionMembers = 12
Config.FactionCreateCost = 250
Config.HoneycombLayerBonus = 0.12 -- damage reduction per extra wall layer behind the hit wall
Config.HoneycombMaxBonus = 0.48

---------------------------------------------------------------------------
-- ECONOMY
---------------------------------------------------------------------------
Config.StartingCoins = 50
Config.MarketHalfLife = 30 * 60   -- seconds for flooded supply to halve
Config.MarketElasticity = 4000    -- units of supply that halve a price
Config.MarketFloor = 0.2          -- prices never fall below 20% of base
Config.AutoSellRate = 0.85        -- market carts sell at 85% of live price

---------------------------------------------------------------------------
-- COMBAT
---------------------------------------------------------------------------
Config.SwingCooldown = 0.45
Config.SwingRange = 10
Config.FistDamage = 6

return Config
