# PRIMORDIA ∞ (Roblox)

An original infinite-world survival SMP for Roblox: factions, territory, siege machines, automated farms, a cross-server Global Shop, and a **DOOMSDAY** countdown to anarchy.

The full design, including how every idea from the reference video maps to a feature, is in **[GAME_DESIGN.md](GAME_DESIGN.md)**.

## What's in here

```
default.project.json        Rojo project (maps src/ into Studio)
src/shared/                 → ReplicatedStorage.Shared
  Config.lua                all tuning knobs (seed, Doomsday date, prices, radii…)
  WorldGen.lua              deterministic infinite terrain + 9 biomes + rivers
  Items / Recipes / Buildables / Nodes / Crops
  Remotes.lua               every RemoteEvent/Function in one place
src/server/                 → ServerScriptService.Server
  Main.server.lua           boots all services
  World/NodeFactory.lua     trees, rocks, ore veins, gem crystals, meteorites…
  World/Structures.lua      8 biome ruins with loot tables
  Services/
    DataService             profiles + session lock (no duping across shards)
    InventoryService        items, crafting, tools, eating
    WorldService            chunk streaming, nodes, ruins, spawning
    BuildService            placement, persistence, cross-shard sync, damage, honeycombing, traps
    FactionService          factions, ranks, wars, treasury, totem claims, alerts, map control
    HarvestService          gathering
    CombatService           swing logic, health bars, hunger, bounties, death satchels
    SiegeService            catapult / ballista / ram
    FarmService             plots, sprinklers, harvesters, market carts, apiaries
    ShopService             global dynamic-price market
    DoomsdayService         Grace → Anarchy → Collapse rules
    MegaServerService       shard registry, global player count, Echoes, shard hopping
    EventService            meteors, golden hour, supply drops, blood moon, trader, day/night
src/client/                 → StarterPlayerScripts.Client
  Main.client.lua
  UI/ HUD (∞ server card, Doomsday clock, vitals), Inventory+Crafting, Global Shop,
      Faction panel, World Map, trailer-style Notifications
  Controllers/ BuildController (ghost placement), ActionController (swing, siege aim, echoes)
```

All visuals are built from Parts and UI in code, so you don't need to upload any assets to play it.

## Setup (about 10 minutes)

1. **Install Rojo**, either with [Rokit](https://github.com/rojo-rbx/rokit) (`rokit add rojo-rbx/rojo`) or the VS Code "Rojo" extension, then install the **Rojo plugin** in Roblox Studio.
2. In this folder run:
   ```bash
   rojo serve
   ```
3. Open a new **Baseplate** in Studio, **delete the Baseplate part** (the world generates its own terrain), and click **Connect** in the Rojo plugin.
4. **Game Settings → Security → turn on "Enable Studio Access to API Services"** (DataStores/MemoryStores). Without it the game still runs in memory-only mode, but nothing saves.
5. Press **Play**.

To publish: **File → Publish to Roblox**. Then in Game Settings set **Max Players** (50 is a good shard size). Cross-server features (Echoes, shard hopping, live build sync, global market, raid alerts) only work in a **published game with 2+ live servers**. In Studio each test session is its own world-shard.

### Testing tips
- Test Doomsday early: set `Config.DoomsdayUTC` to a time a minute from now.
- **Test → Clients and Servers → 2 players** lets you test factions, PvP and raiding locally.
- Quick resources: temporarily add items to the default inventory in `DataService.lua` (`defaultProfile`).

### Controls
| Key | Action |
|---|---|
| Click | Swing (gather / fight / repair with hammer) |
| G | Inventory |
| C | Crafting |
| B | Build mode (R rotate, Q cancel) |
| F | Faction |
| M | World map (click a ◆ echo to hop shards) |
| Tab | Expand the ∞ server card |
| E / R on prompts | Use machines, plots, chests, doors |

## Honest status

- This is a complete, wired-up first version, but it has **not been run in Roblox Studio yet** (this environment has no Studio). Expect a round of bug-fixing and balance tuning the first time you play it.
- "Infinite players" means **shared-world shards**: unlimited players in one world, spread across many Roblox servers. No Roblox game can put unlimited players in a single server. See GAME_DESIGN.md §9.
- Roblox requires text filtering for player-typed names. Faction names and tags already go through `TextService`.
