# PRIMORDIA ∞ — Game Design Document

> **One endless world. Every server. No rules after Doomsday.**

An original survival SMP for Roblox. The world is infinite and every server is a shard of the same world. Factions claim land and raid with siege machines, peaceful players get rich farming, and a season-wide **DOOMSDAY** clock counts down to full anarchy.

---

## 1. Everything from the reference video → how PRIMORDIA does it

Every line of the narration and every UI shown, mapped to a system (✅ = in the code in `src/`):

| Hint in the video | PRIMORDIA feature | Where |
|---|---|---|
| "Why is EVERYONE trying to play this game?" | Trailer-style **caption UI** (huge outlined words, green/red highlights) used for every big moment and the first-join walkthrough | ✅ `client/UI/Notifications.lua`, `Main.client.lua` |
| Red **down-arrow** markers over players/objects | Overhead name + faction tag + **green health bar** on every player; hover a node/wall for its HP bar | ✅ `CombatService.lua`, `HUD.lua` |
| "FIRST game to have **INFINITE terrain generation**" | Seeded noise world, streamed chunk-by-chunk around every player and freed when nobody is near. 9 biomes, rivers, mountains, oceans | ✅ `shared/WorldGen.lua`, `WorldService.lua` |
| Zoomed-out **world map** with rivers | Client-drawn **world map** (M): biomes, rivers, territory circles, other-shard players, events | ✅ `client/UI/MapUI.lua` |
| "bypassing Roblox's **200 player limit**" / server card **"200 of 200 people max · Full"** | Every server is a **shard of one shared world**. Server card shows **"13,427 of ∞ people"** with an endless shimmer bar, ping pill, Join/Share, shard ID | ✅ `MegaServerService.lua`, `HUD.lua` |
| "INFINITE amount of players into one MASSIVE server" | Players in other shards appear as **Echoes** (ghost silhouettes + map markers). Walk up to one, or click it on the map, to **hop into their shard** | ✅ `MegaServerService.lua`, `ActionController.lua`, `MapUI.lua` |
| Big orange / green **gem nodes** being mined | **Sunstone** (Desert/Ashlands) and **Emerald** (Peaks) crystal clusters that glow and need high-tier picks; plus Frostglass, Obsidian, Meteorite | ✅ `shared/Nodes.lua`, `World/NodeFactory.lua` |
| "create **factions**" + **FACTION · 10 members** avatar wall | Faction panel (F): avatar grid with ranks and online dots, treasury, totems, wars, invites, colour banner | ✅ `FactionService.lua`, `FactionUI.lua` |
| "**claim territory**" + purple walled compounds | **Faction Totems** claim a 112-stud radius, coloured in the faction's banner colour. Enemies can't build there. The totem is also your respawn point and a trading post | ✅ `FactionService.lua`, `BuildService.lua` |
| "use **siege machines** to **online raid**" + "Reload Catapult" prompt | **Catapult** (4 ammo types), **Ballista** (anti-machine), **Battering Ram** (push + smash). Reload prompt → Aim & Fire mode | ✅ `SiegeService.lua`, `ActionController.lua` |
| Big armies charging a castle | Mutual **war declarations** let factions siege each other before Doomsday. Raid alerts reach members in **any** shard | ✅ `FactionService.lua` |
| "get **RICH** peacefully" | A full peaceful economy: farming, bees, auto-harvesting, selling, never touching PvP | ✅ `FarmService.lua`, `ShopService.lua` |
| "explore **generated structures** for **loot**" (cave, snow ruins) | 8 ruin types, each tied to a biome with its own loot table (Sunken Tomb, Frozen Vault, Witch's Hut, Ember Forge, Sky Shrine…). Chests refill per player | ✅ `World/Structures.lua` |
| "build **automated farms**" (big crop fields) | Farm Plots + **Sprinklers** (1.5x growth) + **Auto-Harvesters** (harvest + replant) + **Market Carts** (auto-sell) | ✅ `FarmService.lua` |
| "sell crops to the **GLOBAL SHOP**" + **+250** coin pop | One market shared by every shard with **dynamic prices**: flood wheat and the wheat price crashes for everyone, then recovers. Big "+250" coin animation | ✅ `ShopService.lua`, `ShopUI.lua`, `Notifications.lua` |
| "**DOOMSDAY** is only **22 days** away" + timer `22d 13h 42m 17.15s` | Pixel-font **DOOMSDAY** clock with centiseconds, synced to server time. After it hits zero: ANARCHY, then THE COLLAPSE | ✅ `DoomsdayService.lua`, `HUD.lua` |
| "**stock up on materials**" + inventory with category tabs & counts & ★ | Inventory (G): All / Tools / Building / Resources / Farming / Siege / Food / ★ Favourites tabs, rarity borders, counts. Crafting tab (C) | ✅ `InventoryUI.lua` |
| "**honeycomb walls** to make an **UNRAIDABLE** base" | Two meanings, both built: **(a) Honeycomb Wall tier**, the strongest wall, self-healing, made from beeswax, so bees matter. **(b) Honeycombing layers**: every extra wall behind the one being hit cuts damage 12% (up to 48%) | ✅ `Buildables.lua`, `BuildService.lua` |
| "there will be **NO rules** once the SMP opens" | Before Doomsday (**Grace Season**) structure damage needs mutual war. After it, anyone can raid anyone, online or offline. Deaths drop a loot satchel | ✅ `DoomsdayService.lua`, `CombatService.lua` |
| "SMP: CLOSED → SMP: OPEN" sign | Phase badge on the Doomsday clock: DOOMSDAY → ANARCHY → THE COLLAPSE | ✅ `HUD.lua` |
| "anyone can **online raid your compound**" | Raid alerts ("Your base is under attack! @ x, z"), decoy chests, spike traps, tar pits, vault theft | ✅ `BuildService.lua`, `FactionService.lua` |
| "join our **Discord**" pill | `Config.DiscordInvite` is shown on the server card's Share button. Point it at your own server | ✅ `Config.lua`, `HUD.lua` |
| "before the **ENTIRE map** is controlled by other factions" | **MAP CONTROL** leaderboard: each faction's share of all claimed land, across every shard | ✅ `FactionService:Leaderboard`, `MapUI.lua` |

---

## 2. Core loops

**Minute-to-minute.** Punch trees and rocks, then craft stone tools and gather faster. Every hit drops a little; finishing a node pays the bonus roll.

**Session.** Pick a biome and push into ruins for loot. Build a base, plant crops and bring them to the Global Shop. Join a faction.

**Season (≈ 2 months).** Grace Season (build up) → **DOOMSDAY** (anarchy, meteor storm opening) → 45 days of open war → **THE COLLAPSE** (final 24h) → wipe, with permanent Legacy rewards.

## 3. The world

| Biome | Look | Signature resources | Ruin |
|---|---|---|---|
| Meadow | green rolling hills | trees, berries, reeds, wild bee nests | Ruined Watchtower, Abandoned Camp |
| Whisperwood (Forest) | dense canopy | wood, honey | Watchtower / Camp |
| Rotmire Swamp | mud, dead trees | clay, reeds (→ Acid flasks) | Witch's Hut |
| Sunscar Desert | sand, cacti | gold, **Sunstone** | Sunken Tomb |
| Ashlands | basalt + cracked lava | obsidian, iron, **Sunstone** | Ember Forge Ruins |
| Frostreach (Tundra) | snow, pines | iron, **Frostglass** | Frozen Vault |
| Skyteeth Peaks | snowy ridges | iron, gold, **Emerald** | Sky Shrine |
| Beach / Ocean | palms, shipwrecks | fiber, wood | Shipwreck |

Rivers carve through everything. Meteor showers drop **Starmetal**, the only path to the best pickaxe.

## 4. Building and defence

**Wall ladder:** Thatch (150) → Wood (450) → Stone (1,300) → Iron (3,200) → **Honeycomb (6,000, self-heals 2%/10s when not under fire)**.

**Rock-paper-scissors damage matrix:**

| Ammo → / Wall ↓ | Thatch | Wood | Stone | Iron | Honeycomb | Machines |
|---|---|---|---|---|---|---|
| Boulder (blunt) | 1.0 | 1.0 | **1.4** | 0.8 | 0.55 | 1.0 |
| Fire Pot | **3.0** | **2.0** | 0.2 | 0.1 | 0.6 | 1.5 |
| Swamp Acid | 0.5 | 0.7 | 0.8 | **2.4** | 0.7 | 1.0 |
| **Smoke Pot** | – | – | – | – | **3.2** (smoke calms the bees) | – |
| Ballista bolt | 0.6 | 0.8 | 0.3 | 0.3 | 0.3 | **2.2** |

So **no base is truly unraidable**. Honeycomb is strongest, but a raider with Smoke Pots (Frostglass + leaves, found in the Tundra) can crack it. Defenders answer with mixed layers and ballistas that snipe incoming catapults.

**Mind games:** Decoy Chests (look like treasure, explode on the looter, and alert you), Spike Traps, Tar Pits (slow), Watchtowers, Iron Gates, and a **Faction Vault** (raiders who destroy it steal 25% of the treasury).

**Repair rules:** hammer your own builds to repair, but not within 30s of taking damage, so you can't out-heal a siege. A full-HP build picked up with the hammer returns to your inventory.

## 5. The peaceful economy

1. **Farm Plot** → plant seeds (★ your favourite seed is planted first).
2. **Sprinkler** → crops nearby grow 1.5x faster. Crops grow in real time, even offline.
3. **Auto-Harvester** → every 30s harvests and replants ripe plots into a hopper.
4. **Market Cart** → every 60s sells the hopper to the Global Shop at 85% and banks the coins.
5. **Apiary** → Honey + Wax. **Sunbloom** crops nearby **double** output (pollination) → feeds Honeycomb walls.

**Global Shop:** price = base ÷ (1 + global supply ÷ 4,000), floor 20%. Supply halves every 30 minutes. Every shard shares the same supply, so diversified farmers win. Events: Golden Hour (2x), Wandering Trader (1.5x).

After Doomsday, enemies can **steal ripe crops** and **rob Market Carts**, so build the farm inside your walls.

## 6. Factions

- Create (250 coins, filtered name + 2–4 letter TAG + banner colour). Ranks: Chief / Officer / Member, max 12.
- Up to 6 Totems per faction. Each claims a 112-stud radius, is a respawn point and a Trading Post, and shows a glowing `[TAG]` banner.
- **War:** declaring is one-sided; **mutual** war unlocks raiding each other during Grace. Make Peace to undo.
- Treasury (deposit coins; at risk from vault raids).
- Raid alerts are delivered to members in **every shard** through MessagingService.
- **MAP CONTROL** leaderboard on the world map.

## 7. Combat and danger

- One "swing" action does everything: harvest with axe/pick, fight with weapons, repair with hammer.
- Grace Season PvP is only allowed in the wilderness (not inside claims), between warring factions, or during a **Blood Moon**. New spawns get 60s of protection.
- **Bounties:** a 3+ kill streak puts a coin bounty on your head (shown over your name); whoever kills you collects.
- **Anarchy deaths** drop a satchel with 30% of your resources.
- **Hunger** drains slowly; eat crops and cooked foods (Honey Bun, War Stew heal too).

## 8. World events (every 9–16 minutes)

Meteor Shower · Golden Hour · Supply Drop (4-second hold to open, so it has to be defended) · Blood Moon · Wandering Trader · **Doomsday Meteor Storm** at the moment anarchy starts. Day/night cycle: 20 minutes.

## 9. How "infinite players" works (and its honest limits)

Roblox servers have a hard player cap, and **nothing can put unlimited players in one server**. PRIMORDIA makes the cap invisible instead:

1. All shards generate the **same world** from one seed.
2. Builds, factions, claims and the market live in **shared DataStores / MemoryStores**. Edits are merged with `UpdateAsync` (no overwrites) and broadcast live with MessagingService.
3. Shards broadcast player positions so you see **Echoes** of players elsewhere, and can **hop** to their shard.
4. The server card shows the **global total**.

Limits to know: MessagingService and MemoryStore have per-minute quotas, so echo broadcast rates scale down as shard count grows. Echoes are visual, so you can't hit someone in another shard. Siege battles and fights happen inside a shard, and you hop shards to join friends. Natural nodes are per-shard (each shard has its own trees), but **player-made things are global**.

---

## 10. Extra ideas: roadmap beyond the current code

These go further than the video. They're ordered by how much they'd add.

### Season and meta
- **Legacy Hall:** after The Collapse, the top 3 factions by Map Control get a permanent statue in a lobby world, and members keep a cosmetic title ("Survivor of Season 1").
- **The Collapse, for real:** in the last 24h the world border shrinks toward a random point, biomes "rot" into Ashlands, and the final faction standing in the zone wins the season.
- **Pre-Doomsday "Siege Trials":** weekend arena where factions test siege builds against each other's bases with zero real damage (copies of bases).

### Raiding and defence
- **Offline Defence Contracts:** pay coins to NPC mercenaries that man your ballistas while you're offline. Raiders see them coming in.
- **Raid Replays:** each destroyed base saves a 60-second replay and posts it to a "Hall of Raids" board. Free content for players to clip.
- **Tunnels and sappers:** dig under walls with a Sapper Kit; counter it with Stone floors.
- **War Horns:** a craftable horn that pings every faction member in every shard to rally ("Hop to me" button).
- **Siege weather:** rain makes Fire Pots useless; drought doubles fire spread.

### Peaceful paths
- **Caravan trading:** haul a cart of goods between two distant Trading Posts for a big bonus, with the risk of being ambushed on the road.
- **Cartographer role:** the first player to visit a biome region names it on the global map for the season.
- **Crop genetics:** cross-pollinate Sunbloom with other crops for rare hybrid seeds (Starbloom, Frost Beet) worth 5–10x.
- **Bank of Primordia:** deposit coins at 1%/day interest, but the bank vault in the central city can be raided after Doomsday.

### World
- **Wildlife and tames:** boars, raptors, giant beetles. Tame a beetle as a pack mount that carries siege ammo.
- **Deep caves:** a second layer under the terrain with glowing mushrooms and ore that only exists underground.
- **Ancient Titans:** world bosses that walk across the map destroying whatever's in their path, including bases. Factions band together or lose everything.
- **Lighthouses:** capturable points that grant fast-travel between them for the owning faction.

### Social
- **Treaties with teeth:** Non-Aggression Pacts that, if broken, brand the breaking faction "OATHBREAKER" (red name) for 7 days.
- **Faction Banners editor:** pixel-paint a 16×16 banner shown on totems and capes.
- **Discord bridge:** raid alerts and Doomsday countdown posted to your Discord via a webhook proxy (Discord blocks Roblox's direct webhooks, so this needs a small relay server).

### Monetisation (fair, non-P2W)
- Cosmetic banner colours, totem skins, wall paint, emotes, Echo ghost trails.
- **Season Pass** with cosmetic rewards and bonus farm plots (capped, so it never decides raids).
- Private Shard (VIP server) still connects to the shared world.
