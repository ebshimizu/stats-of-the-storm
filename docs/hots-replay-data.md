# Heroes of the Storm Replay Data Reference
This document details the location and type of every useful piece of data in the Hereos of the
Storm replay files to the best of the my knowledge. Let me know if you find any errors. - Falindrith

## Common Elements
In this document, fields with `[]` at the end indicate that the element in question is an array,
and that any field named after the `[]` (`m_playerList[].m_toon` for instance) is assumed to
exist for all elements in the array.

### Containers
Most of the locations reference a container object first (`header` for instance). These are the objects
that are available from the parser. In whatever parser you choose to use, you should be able to
specify the extraction of these containers. This document assumes that you are using the [heroprotocol.js](https://github.com/nydus/heroprotocol)
parser.

### Game Loops to Game Time
Almost every event time in the game is stored in terms of game loops.
Game loops run 16 times per second and can be converted to seconds with `loops / 16`.
Note that this won't actually match the displayed elapsed game time due to the in-game clock having a negative time offset
of exactly 610 frames. So to get the actual in-game time of any event, use a function like:
```javascript
function loopsToGameSeconds(loops) {
    return (loops - 610) / 16;
}
```

### fixedData
Data stored in `m_fixedData` fields are fixed precision integers. Divide by 4096 to get the actual value.

### Reserved Tracker PlayerIDs
The events in `trackerevents` are usually associated with a PlayerID. These are typically the human
controlled players in the game, however the system reserves PlayerIDs 11 and 12 for internal use.
PlayerID 11 is the Blue Team's AI player, which manages minions, buildings, and any non-player controlled units
associated with the blue team. Likewise, PlayerID 12 is the Red Team's AI player.

Human players should never get assigned to these IDs. If your match has observers in them, they could have
IDs 13+, but will not conflict with the reserved IDs.

### Hey where are the Quest Stacks?
Not in the replay that's for sure. For whatever reason, the state of quests and quest completions
are not stored in the replay. Some units may have `Upgrade` Tracker events associated with them, but they
are very inconsistently used. So until Blizzard adds these events into the replay, the only way to reconstruct
quest stacks is to simluate the game based on the input events in GameEvents and track the results. 

## Match Basics

### Version
Location: `header.m_version`

Value: Object
```
{
    "m_baseBuild": [int],
    "m_minor": [int],
    "m_revision": [int],
    "m_flags": [int],
    "m_major": [int],
    "m_build": [int]
}
```

Reconstruct game version: `m_major.m_minor.m_revision`

### Match Length
Location: `header.m_elapsedGameLoops`

Value: The total time of the game in elapsed game loops. 

### Map
Location: `details.m_title`

Value: _Localized_ map name.

### Date
Location: `details.m_timeUTC`

Value: Date in _Windows File Time Format_. This is incredible for a number of reasons but the tl;dr
version is to convert this with the following javascript function:
```javascript
function winFileTimeToDate(filetime) {
  return new Date(filetime / 10000 - 11644473600000);
}
```

### Mode
Location: `initdata.m_syncLobbyState.m_gameDescription.m_gameOptions.m_ammId`

Value: An integer.
```json
{
  "50021": "Versus AI",
  "50041": "Practice",
  "50001": "Quick Match",
  "50031": "Brawl",
  "50051": "Unranked Draft",
  "50061": "Hero League",
  "50071": "Team League",
  "-1": "Custom"
}
```

## Players
Player data is scattered all over the replay file and there are a variety of different IDs used to reference
who did what when.

### Player IDs
There are multiple player IDs used by the replay file, and the often don't end up matching each other.

#### Toon
Location: `details.m_playerList[].m_toon`

Value: Object
```
{
    "m_id": [int],
    "m_realm": [typically the number 1],
    "m_region": [one of: 1 (NA), 2 (EU), 3 (Asia?), 98 (PTR or Tournament Realm)],
    "m_programId": "Hero"
}
```

To create a ToonHandle: `m_region + '-' + m_programId + '-' + m_realm + '-' + m_id`

The Toon object can be used to create the ToonHandle for a player.
ToonHandles are unique identifiers assigned per-player per-region. This means that the same player
will have a different toon ID on a different realm. ToonHandles should be your internal way to track players,
as it is immutable for each player. ToonHandles **cannot** be used to identify players
in the `trackerevents` or basically anywhere else in the replay file. You will need to use the Tracker ID or other ID
as detailed below.

#### Tracker PlayerID
Location: An event in `trackerevents` with event ID `10` (stat) and event name `PlayerInit`

When parsing the `trackerevents`, any event that references a `PlayerID` will be using
the values contained in the `PlayerInit` events. Relevant data for these events:

* ToonHandle: `event.m_stringData[1].m_value`
* Tracker PlayerID: `event.m_intData[0].m_value`
* Team: `event.m_intData[1].m_value` - IMPORTANT: This is not Zero-indexed. Team will be 1 (blue) or 2 (red)
* Controller: `event.m_stringData[0].m_value` - if value is "Computer," it's an AI

#### Working Set Slot ID
Location: `details.m_playerList[].m_workingSetSlotId`

Value: Int

This is, as far as I can tell, only relevant for determining pick order in `trackerevents`. Using
this ID anywhere else results in errors where players can't be mapped back to a proper ToonHandle.
See the Draft section for more details.

#### Lobby ID
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_userId`

Value: int

Used by `gameevents` and `messageevents` to determine actions and messages sent by players.
ToonHandle is accessible in this array with `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_toonHandle`.

### Name
Location: `details.m_playerList[].m_name`

Value: String

### Hero
Location: `details.m_playerList[].m_hero`

Value: _Localized_ hero name.

Note: For Lucio, it actually includes the accent over the u, so make sure your hero keys are set properly, otherwise you'll have issues identifying that one.

### Silence Penalty
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_hasSilencePenalty`

Value: bool

### Voice Silence Penalty
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_hasVoiceSilencePenalty`

Value: bool.

May not exist pre-build 62424.

### Cosmetics
Contained in the lobby state slots.

#### Skin
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_skin`

Value: String. Internal Skin ID.

#### Announcer
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_announcerPack`

Value: String. Internal Announcer ID.

#### Mount
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_mount`

Value: String. Internal Mount ID.

#### Spray
Location: `initdata.m_syncLobbyState.m_lobbyState.m_slots[].m_spray`

Value: bool

### Talents
See `EndOfGameTalentChoices` Tracker Event.

## Draft
Draft data is consistent from HotS 2.0 on, but somewhat unreliable pre-2.0

### Bans
Location: `attributeevents.scopes["16"]`

Value: Object containing a number of cryptic keys.

Relevant data:

* `attributeevents.scopes["16"]["4023"][0].value` - Blue Team Ban 1
* `attributeevents.scopes["16"]["4025"][0].value` - Blue Team Ban 2
* `attributeevents.scopes["16"]["4028"][0].value` - Red Team Ban 1
* `attributeevents.scopes["16"]["4030"][0].value` - Red Team Ban 2

Each of these objects returns a hero Attribute value (typically the first 4 letters of the hero's internal name, which doesn't
usually match up with the display name). Recommended to use heroes-talents to resolve these names.
Note that in attribute events, `scopes` is an object, but the numeric key is an array of size 1 with an object in it.

Alternate Location: Events in `trackerevents` with `_event` value `NNet.Replay.Tracker.SHeroBannedEvent`. This event
contains the hero banned in `event._m_hero` and the team that banned it in `event.m_controllingTeam`. Blue is 1, Red is 2.
`m_hero` contains the _internal_ name of the hero (e.g. `FaerieDragon` for `Brightwing`).

### Picks
Location: Events in `trackerevents` with `_event` value `NNet.Replay.Tracker.SHeroPickedEvent`

Value: Object.

Relevant data:

* `event.m_controllingPlayer` - This maps to the player's Working Set Slot ID. Using any other ID may result in incorrect pick data.
* `event.m_hero` - Internal hero name. If you mapped Working Set Slot ID to ToonHandle you can resolve this to displayed hero name easily.

### Atrribute Hero Name
Localized hero names and internal hero IDs are used in many places of the replay. To resolve issues with this,
use the attribute ID located in `attributeevents`.

Location: `attributeevents.scopes[{Player Tracker ID}]["4002"][0].value`

Use the heroes-talents repository data to resolve attribute id to hero name. 

### Hero Level
Location: `attributeevents.scopes[]["4008"][0].value`

Blizzard never updated this after HotS 2.0, so we're currently stuck at hero level 20.

### Other Attributes
See [barrett777/Heroes.ReplayParser](https://github.com/barrett777/Heroes.ReplayParser/blob/master/Heroes.ReplayParser/MPQFiles/ReplayAttributeEvents.cs#L313) for a list of more attribute values.

## Tracker Events
Tracker events are stored in the `trackerevents` array. This is a long array of individual event objects.
Each tracker object must have the following fields:
```
{
    "_event": [string],
    "_eventid": [int],
    "_gameloop": [int]
}
```
Events will have additional fields depending on the value of the `_eventid` field. The `_event` string
is a textual version of `_eventid` so it's probably faster to just use `_eventid` to case on events.
In this section, the event object will be referred to as `event`.

May of the maps have tracker events that detail who won the objective, however there are some notable exceptions.
Maps which either lack or have complex ways to detect objectives:

* Blackheart's Bay - Other parsers reference a `GhostShipCaptured` event, however I have not seen that
event in my own files. So right now I have no idea how to determine when a team turns in enough coins.
* Braxis Holdout - There is no tracker event for when a wave spawns, but there are ways to figure out
when it spawns, and how strong each side is. This is a complicaed method and is detailed in a [separate
section](#braxisWaveDetection).
* Warhead Junction - As far as I can tell, nuke spawn time isn't tracked. It's possible to track
when a nuke gets dropped and whether or not the cast gets interrupted though. See [this section](#warheadNukes)
for details.
* Volskaya Foundry - The control point score is not saved I think. You can detect when the Triglav spawns
and which team controls it though. See [this section](#volskayaTriglav) for details.
* Hanamura Version 1 - I couldn't find any objective data on this one, but since it's also not really
in the game anymore, I didn't look too hard at it.

**Tracker Event List**

Events of interest are linked to the corresponding section

| _eventID | Name | Notes |
| -- | ---- | ----- |
| 1 | [Unit Born](#tracker1) | |
| 2 | [Unit Died](#tracker2) | |
| 3 | [Unit Owner Change](#tracker3) | 
| 4 | Unit Type Change | |
| 5 | Upgrade | I think certain heroes get this event when a quest is complete? In my opinion this should be emitted every time part of a quest or the entire quest is completed but it is not. Blizz pls. |
| 6 | Unit Init | |
| 7 | Unit Done | |
| 8 | Unit Positions | The [heroeprotocol](https://github.com/Blizzard/heroprotocol) repository has additional info about this event. |
| 9 | Player Setup | This is different than the `Stat` `PlayerInit` event and is not used by my parser |
| 10 | [Stat](#tracker10) | The majority of interesting data is stored in these events |
| 11 | [Score](#tracker11) | |
| 12 | Unit Revived | |
| 13 | [Hero Banned](#tracker13) | |
| 14 | [Hero Picked](#tracker14) | |
| 15 | Hero Swapped | Indicates a swap. Not really necessary since `HeroPicked` has the right associated hero regardless of swaps |


### <a name="tracker1"></a> Unit Born (Nnet.Replay.Tracker.SUnitBornEvent), _eventid = 1
Shows up when a unit spawns. These events all have basically the same info.

Contents:

* Spawn Game Loop: `event._gameloop`
* Unit Type Name: `event.m_unitTypeName`
* Unit Tag Index: `event.m_unitTagIndex`
* Unit Recycle Tag: `event.m_unitTagRecycle` - The recycle tag and unit tag can be used to
uniquely identify a unit. Can use something as simple as `m_unitTagIndex-m_unitTagRecycle` to identify units.
These tags are the only things used to tell which units have died, so save them in this event
if you need them later.
* Upkeep Player ID: `event.m_upkeepPlayerId` - This is also a tracker ID. If this is `11`, then the unit
is a Blue Team unit. If this is `12`, it is a Red Team unit. If it's something else, it should correspond
to a player's tracker ID.
* X Position: `event.m_x`
* Y Position: `event.m_y`

#### Useful Unit Type Names
The following list is non-exhasutive, but it should contain most of the units of interest.

**General Units**

| Unit Type ID | Notes |
| ------------ | ----- |
| `FootmanMinion` | Melee Minion |
| `RangedMinion` | |
| `WizardMinion` | The one that drops a regen globe |
| `RegenGlobe` | |
| `RegenGlobeNeutral` | These are the purple ones. |
| `UnderworldSummonedBoss` | Haunted Mines golems. This is not the single boss in the shrines, it is the golems that spawn for each team. |
| `RavenLordTribute` | Cursed Hollow Tribute |
| `DragonShireShrineSun` | Sun Shrine. Can track which team controls. See [Beacon Control](#beacons). |
| `DragonShireShrineMoon` | Moon Shrine. Can track which team controls. See [Beacon Control](#beacons) |
| `VehiclePlantHorror` | Garden Terror |
| `VehicleDragon` | Dragon Knight |
| `SoulEater` | Webweaver |
| `VolskayaVehicle` | Triglav Protector |
| `NukeTargetMinimapIconUnit` | This appears to be the targeting circle that appears when a nuke is channeled. See [Warhead Junction](#warheadNukes) for details |
| `ZergHiveControlBeacon` | One of the Braxis control points. Can track which team controls. See [Beacon Control](#beacons). |
| `ZergPathDummy` | When the zerg wave spawns, this unit shows up in Unit Born events |
| `BossDuelLanerHeaven` | Heaven Immortal |
| `BossDuelLanerHell` | Hell Immortal |
| `WarheadSingle` | A standard warhead spawn |
| `WarheadDropped` | A warhead dropped by a player after they die. |
| `HealingPulsePickup` | The healing pulse item on some of the newer maps |
| `TurretPickup` | The turret item on some of the newer maps |

**Mercenaries**

Units listed here are the ones that spawn in lanes. There are different units for the
neutral unit types that spawn at camps. Save the tag IDs to match up with
death events to find out how long they were alive.

| Unit Type ID | Notes |
| ------------ | ----- |
| `TerranHellbat` | Hellbat Merc Camp |
| `TerranArchangelLaner` | Braxis boss |
| `TerranGoliath` | Goliath Merc Camp
| `SlimeBossLaner` | Warhead boss |
| `JungleGraveGolemLaner` | Cursed/Sky/Tomb boss |
| `MercLanerSiegeGiant` | Siege Camp |
| `MercGoblicSapperLaner` | Goblin Sapper |
| `MercSiegeTrooperLaner` | Bruiser Camp, on some of the maps |
| `MercSummonerLaner` | Summoning Camp |
| `MercSummonerLanerMinionDummy` | Summoning Camp summon, there are a lot of these |
| `MercLanerRangedOgre` | Bruiser Camp unit (i think?) |
| `MercLanerMeleeOgre` | Bruiser Camp unit |
| `MercLanerMeleeKnight` | Knight Camp Unit |
| `MercLanerRangedMage` | Knight Camp Mage Unit |

**Structures**

| Unit Type ID | Notes |
| ------------ | ----- |
| `TownTownHallL2` | Fort (L2) |
| `TownMoonwellL2` | Fort Well (L2) |
| `TownCannonTowerL2` | Fort Tower (L2) |
| `TownTownHallL3` | Keep (L3) |
| `TownMoonwellL3` | Keep Well (L3) |
| `TownCannonTowerL3` | Keep Tower (L3) |

**Braxis Units**

| Unit Type ID | Notes |
| ------------ | ----- |
| `ZergZergling` | Zergling | 
| `ZergBaneling` | Baneling |
| `ZergHydralisk` | Hydralisk |
| `ZergGuardian` | Guardian | 
| `ZergUltralisk` | Ultralisk |

#### Minion XP Tables
Just going to copy the minion XP arrays from the code.
Tomb of the Spider Queen apparently has a different XP table for everything except
catapults. Maxes out at 30 minutes.
Minions are assigned XP values at Unit Born time (not when they die, so you can't like stack
up minions and get bonus XP).

```javascript
const MinionXP = {
  FootmanMinion:  [70, 71, 72, 73, 74, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104, 106],
  WizardMinion:   [62, 64, 66, 67, 69, 71, 73, 75, 76, 78, 80, 82, 84, 85, 87, 89, 91, 93, 94, 96, 98, 100, 102, 103, 105, 107, 109, 111, 112, 114, 116],
  RangedMinion:   [60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120],
  CatapultMinion: [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37]
};

const TombMinionXP = {
  FootmanMinion: [55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76, 77 ,79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 92],
  WizardMinion:  [51, 53, 55, 56, 58, 60, 62, 64, 65, 67, 69, 71, 73, 74, 76, 78, 80, 82, 83, 85, 87, 89, 91, 92, 94, 96, 98, 100, 101, 103, 105],
  RangedMinion:  [51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111],
  CatapultMinion: [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37]
};
```

### <a name="tracker2"></a> Unit Died (NNet.Replay.Tracker.SUnitDiedEvent), _eventid = 2
Fired when a unit dies. This includes structures, which are just units that don't move.

Contents:

* Death Game Loop: `event._gameloop`
* Unit Tag Index: `event.m_unitTagIndex`
* Unit Recycle Tag: `event.m_unitTagRecycle` - The recycle tag and unit tag can be used to
uniquely identify a unit. Can use something as simple as `m_unitTagIndex-m_unitTagRecycle` to identify units.
The tags are the only things that show up in the death event, so I hope you saved them.
* Killer Tracker ID: `event.m_killerPlayerId` - Tracker ID for the person that killed the unit.
It could be `null`, which happens in Braxis under really specific circumstances.

### <a name="tracker3"></a> Unit Owner Change (NNet.Replay.Tracker.SUnitOwnerChangeEvent), _eventid = 3
Fired when a unit gets controlled by a different player. Typically, this is used with
vehicles (dragon knight, garden terror, protector, etc.).

Contents:

* Event Loop: `event._gameloop`
* Controlling Player: `even.m_controlPlayerId` - If this is 0, that means no player controls
the unit. Player 11 is blue team, player 12 is red team. Otherwise this is the Tracker Player ID.
* Unit Tag Index: `event.m_unitTagIndex`
* Unit Recycle Tag: `event.m_unitTagRecycle` - The recycle tag and unit tag can be used to
uniquely identify a unit. Can use something as simple as `m_unitTagIndex-m_unitTagRecycle` to identify units.
The tags are the only things that show up in the death event, so I hope you saved them.

This event can be used to determine who controls a vehicle (garden terror, dragon knight), or a beacon/shrine
on Braxis/Dragon Shire. See the [Beacon Control](#beacon) for additional details.

### <a name="tracker10"></a> Stat Events (NNet.Replay.Tracker.SStatGameEvent), _eventid 10
Stat events all have an additional `m_eventName` parameter which determines what data they contain.
A list of relevant game events follows. For all of these objects, `_eventid = 10`.

#### Player Init
Event Name: `PlayerInit`

Every player that controls a Hero in the game is initialized here. Observers do not show up.
The ID value referenced here is used in future Stat Events and can be assodicated with a ToonHandle
to uniquely identify players.

Contents: 

* Tracker PlayerID: `event.m_intData[0].m_value`
* ToonHandle: `event.m_intData[1].m_value`

#### Gates Open
Event Name: `GatesOpen`

This event marks match time 0:00. So far, every single match has started 610 loops after loading,
but if that value changes, use this event to determine which loop is at 0:00.

No relevant contents. Use `_gameloop` to access the match start loop.

#### End of Game Talent Choices
Event Name: `EndOfGameTalentChoices`

Contents:

* Tracker PlayerID: `event.m_intData[0].m_value`
* Level: `event.m_intData[1].m_value`
* Talents: Stored in `event.m_stringData[]` with `m_key = Tier [1/2/3/4/5/6/7] Choice`. That would be indicies `3-9`. Talent ID is in `m_value`.
Recommended to use heroes-talents to resolve the interal talent name.
* Win/Loss: `event.m_stringData[1].m_value` - `Win` if the player won, `Loss` if the player lost.
* Hero: `event.m_stringData[0].m_value` - Appears to be the internal hero name prefixed with `Hero`
* Map: `event.m_stringData[2].m_value` - Internal map name

#### Periodic XP Breakdown
Event Name: `PeriodicXPBreakdown`

Contents (XP values are in fixed data, divide by `4096` to get correct values):

* Minion XP: `event.m_fixedData[2].m_value`
* Creep XP: `event.m_fixedData[3].m_value`
* Structure XP: `event.m_fixedData[4].m_value`
* Hero XP: `event.m_fixedData[5].m_value`
* Trickle XP: `event.m_fixedData[6].m_value`
* Team: `event.m_intData[0].m_value` - 1 for blue, 2 for red
* Team Level: `event.m_intData[1].m_value` - Current team level

These events are found every minute in the replay file.

#### End of Game XP Breakdown
Event Name: `EndOfGameXPBreakdown`

Contents:

* Minion XP: `event.m_fixedData[0].m_value`
* Creep XP: `event.m_fixedData[1].m_value`
* Structure XP: `event.m_fixedData[2].m_value`
* Hero XP: `event.m_fixedData[3].m_value`
* Trickle XP: `event.m_fixedData[4].m_value`
* Tracker PlayerID: `event.m_intData[0].m_value`

For some reason this isn't attached to teams and instead is written per-player. As far as I can tell, this is the same for every player.

#### Player Death
Event Name: `PlayerDeath`

Contents:

* Killed Tracker Player ID: `event.m_intData[0].m_value` - The player that died is always at index 0.
* Killing Player Tracker IDs: `event.m_intData[1+].m_value` - This is a variable length array. The `m_key` value
for killing players is `KillingPlayer` if you want to make sure you have the right data.
* X Location: `event.m_fixedData[0].m_value` - Fixed data, divide by 4096
* Y Location: `event.m_fixedData[1].m_value` - Fixed data, divide by 4096

#### Regen Globe Picked Up
Event Name: `RegenGlobePickedUp`

Contents:

* Tracker PlayerID: `event.m_intData[0].m_value`

#### Level Up
Event Name: `LevelUp`

This is fired once per player. So every time a team levels, up, you'll get like 5 of these events.

Contents:

* Level: `event.m_intData[1].m_value`
* Tracker PlayerID: `event.m_intData[0].m_value`

#### Mercenary Camp Captured
Event Name: `JungleCampCapture`

Fired when a team captures any mercenary camp.

Contents:

* Team: `event.m_fixedData[0].m_value` - Team in **fixed integer** format. 1: blue, 2: red after resolving.
* Camp Type: `event.m_stringData[0].m_value` - Camp type. Usually not particularly useful (says stuff like `siege` or `bruiser`).

Special note for Towers of Doom: If the Camp Type is `Boss Camp` on that map, that's the boss that fires 4 shots
at the core.

#### End of Game Upvote
Event Name: `EndOfGameUpVotesCollected`

This keeps a running tally of the number of upvotes each player got.
You can use it to identify both who got the vote and who gave the vote.

Contents:

* Upvoted Tracker PlayerID: `event.m_intData[0].m_value`
* Voter Tracker PlayerID: `event.m_intData[1].m_value`
* Number of Current Votes: `event.m_intData[2].m_value`

#### Spray Used
Event Name: `LootSprayUsed`

Contents:

* ToonHandle: `event.m_stringData[1].m_value`
* Kind: `event.m_stringData[2].m_value` - Spray internal ID
* X Location: `event.m_fixedData[0].m_value`
* Y Location: `event.m_fixedData[1].m_value`

#### Voice Line Used
Event Name: `LootVoiceLineUsed`

Contents:

* ToonHandle: `event.m_stringData[1].m_value`
* Kind: `event.m_stringData[2].m_value` - Voice Line internal ID
* X Location: `event.m_fixedData[0].m_value`
* Y Location: `event.m_fixedData[1].m_value`

#### Sky Temple: Shot Fired
Event Name: `SkyTempleShotsFired`

The event name says shots but it's really just 1 as far as I can tell.

Contents: 

* Team: `event.m_intData[2].m_value` - 1: blue, 2: red
* Damage: `event.m_fixedData[0].m_value`

#### Sky Temple: Temple Captured
Event Name: `SkyTempleCaptured`

I don't actually use this one so I forget what's in it.

#### Towers of Doom: Altar Captured
Event Name: `Altar Captured`

Yes there is a space in the event name. Yes it is inconsistent with most of the
other event names. This is the event that indicates when a tower gets captured on
the Towers of Doom map.

Contents:

* Team: `event.m_intData[0].m_value` - 1: blue, 2: red
* Owned: `event.m_intData[1].m_value` - This is the number of forts controlled by the capturing team.
The amount of damage dealt is this value +1 as each team does at least 1 damage baseline.

#### Towers of Doom: Six Town Event Start
Event Name: `Six Town Event Start`

This event indicates that one team owns all six forts on the map.
This marks the beginning of such an event.
Note that the tracker does not track core shots fired during the six town event.

Contents:

* Team: `event.m_intData[0].m_value` - 1: blue, 2: red

#### Towers of Doom: Six Town Event End
Event Name: `Six Town Event End`

This is the matching event for Six Town Event Start.
It may sometimes not actually show up in the replay. This may occur due to
the game ending before the other team can recapture a fort.

Contents: 

* Team: `event.m_intData[0].m_value` - 1: blue, 2: red

#### Towers of Doom: Fort Captured
Event Name: `Town Captured`

Emitted when a team captures a fort.

Contents: 

* ownedBy: `event.m_intData[0].m_value` - Team AI player that now controls the building. Subtract by 10 to get team 1 (blue)
or team 2 (red) as normal.

#### Battlefield of Eternity: Immortal Defeated
Event Name: `Immortal Defeated`

This title is a bit misleading, as it indicates when the immortal fight completes,
rather than when the immortal summoned by a team dies.

Contents:

* winner: `event.m_intData[1].m_value` - Team ID. 1: blue, 2: red
* duration: `event.m_intData[2].m_value` - How long the immortals were up for
* power: `event.m_fixedData[0].m_value` - Amount of shielding the Immortal has on spawn

#### Cursed Hollow: Tribute Collected
Event Name: `TributeCollected`

Pretty self explanatory here. For some reason the team is stored as a fixed precision int,
so do the whole divide by 4096 to resolve.
I think location is also in here but I don't use it, so I forget if that's true.

Contents: 

* team: `event.m_fixedData[0].m_value` - Team in **fixed integer** format. 1: blue, 2: red after resolving.

#### Dragon Shire: Dragon Knight Activated
Event Name: `DragonKnightActivated`

It is possible to identify who controlled the Dragon Knight and the Garden Terror,
but it is not stored in the event. See the section about [determining vehicle control](#vehicles).

Contents: 

* Team: `event.m_fixedData[0].m_value` - Team in **fixed integer** format. 1: blue, 2: red after resolving.

#### Garden of Terror: Garden Terror Activated
Event Name: `GardenTerrorActivated`

It is possible to identify who controlled the Dragon Knight and the Garden Terror,
but it is not stored in the event. See the section about [determining vehicle control](#vehicles).

* Team: `event.m_fixedData[0].m_value` - Team in **fixed integer** format. 1: blue, 2: red after resolving.

#### Infernal Shrines: Shrine Captured
Event Name: `Infernal Shrine Captured`

Contents:

* Winning Team: `event.m_intData[1].m_value`, 1: blue, 2: red
* Winning Team Score: `event.m_intData[2].m_value`
* Losing Team Score: `event.m_intData[3].m_value`

#### Infernal Shrines: Punisher Defeated
Event Name: `Punisher Killed`

Contents:

* Punisher's Team: `event.m_intData[1].m_value` - 1: blue, 2: red
* Punisher Type: `event.m_stringData[0].m_value` - One of `Arcane`, `Frozen`, `Mortar` if I remember right.
* Duration: `event.m_intData[2].m_value` - How long the punisher was alive for in seconds.
* Siege Damage: `event.m_fixedData[0].m_value` - Siege damage done in fixed integer format. This is suspect, it seems too low all the time.
* Hero Damage: `event.m_fixedData[1].m_value` - Hero damage done in fixed integer format. This is also suspect.

#### Tomb of the Spider Queen: Webweaver Spawn
Event Name: `SpidersSpawned`

Contents: 

* Team: `event.m_fixedData[0].m_value` - Team in **fixed integer** format. 1: blue, 2: red after resolving.
* Score: `event.m_intData[1].m_value` - Number of gems required for the current spawn.

### <a name="tracker11"></a>Score (NNet.Replay.Tracker.SScoreResultEvent), _eventid = 11
This event contains the end of game stats (hero damage, xp contribution, etc.).

Contents:

* Score Array: `event.m_instanceList` - A long array containing objects for each individual score
component. Each score array object contains the following elements
  * Field Name: `event.m_instanceList[].m_name` - ID of the score element
  * Field Values: `event.m_instanceList[].m_values` - An array of value objects for each stat.
  Stats in this array are indexed by the Player Tracker ID (as in TrackerID 1 has stats at index 1).
  Obtain the value of the stat with `event.m_instanceList[].m_values[][0].m_value`. (The type of `m_values[]` is
  an array with one object in it, thus the extra `[0]` access).

#### Useful Score IDs
This is a non-exhaustive list. There are a lot of events that start with `Wins` that
I skip because it appears to be used mostly for daily quest tracking. They are not listed
in this table.

| Score ID | Formatted Name |  Notes |
| -------- | -------------- | ------ |
| `Takedowns` | Takedowns | `SoloKill` + `Assists` |
| `Deaths` | Deaths | |
| `TownKills` | Town Kills | Unclear what a 'Town Kill' is |
| `SoloKill` | Solo Kills | This is the value that shows up in the "Kills" column of the in-game stats. It is not a list of kills where no one else assisted. |
| `Assists` | Assists | |
| `MetaExperience` | Team Experience | Overall Team XP |
| `Level` | Level | |
| `TeamTakedowns` | Team Takedowns | Total Team Takedowns |
| `ExperienceContribution` | Experience Contribution | |
| `Healing` | Healing | Usually 0 unless it's displayed on the scoreboard. Blaze is an exception to this. |
| `SiegeDamage` | Seige Damage | |
| `StructureDamage` | Structure Damage | Damage specifically to structures |
| `MinionDamage` | Minion Damage | Damage to lane minions |
| `HeroDamage` | Hero Damage | |
| `MercCampCaptures` | Merc Camp Captures | |
| `WatchTowerCaptures` | Watch Tower Captures | The "eyes" |
| `SelfHealing` | Self Healing | This is a little weird because it doesn't count if you use a targeted healing ability (like Malf Q) on yourself. |
| `TimeSpentDead` | Time Spent Dead | In seconds |
| `TimeCCdEnemyHeroes` | CC Time | In seconds |
| `CreepDamage` | Creep Damage | Merc Camp / non-lane minion damage |
| `SummonDamage` | Summon Damage | I think this is damage done _to_ summoned units (like Anub's beetles) not damage done by summoned units |
| `Tier1Talent` | Level 1 Talent  | Tier 1 internal talent ID |
| `Tier2Talent` | Level 4 Talent  | Tier 2 internal talent ID |
| `Tier3Talent` | Level 7 Talent  | Tier 3 internal talent ID |  
| `Tier4Talent` | Heroic Talent   | Tier 4 internal talent ID |
| `Tier5Talent` | Level 13 Talent | Tier 5 internal talent ID |
| `Tier6Talent` | Level 16 Talent | Tier 6 internal talent ID |
| `Tier7Talent` | Storm Talent    | Tier 7 internal talent ID |
| `DamageTaken` | Damage Taken | This is non-zero only if Blizzard decided to classify the hero as a tank and store the stat. |
| `Role` | Role | Role Stat, doesn't seem to be used right now? |
| `KilledTreasureGoblin` | Killed Treasure Goblin | Remember the treasure goblin event |
| `GameScore` | Game Score | I actually forget what this is |
| `HighestKillStreak` | Highest Kill Streak | |
| `TeamLevel` | Team Level | This should be the same as Level |
| `ProtectionGivenToAllies` | Shielding | |
| `TimeSilencingEnemyHeroes` | Silence Time | In seconds |
| `TimeRootingEnemyHeroes` | Root Time | In seconds |
| `TimeStunningEnemyHeroes` | Stun Time | In seconds |
| `ClutchHealsPerformed` | Clutch Heals | |
| `EscapesPerformed` | Escapes Performed | Dunno how it defines this |
| `VengeancesPerformed` | Revenge Kills | |
| `TeamfightEscapesPerformed` | Team Fight Escapes | |
| `OutnumberedDeaths` | Deaths While Outnumbered | The "do you get ganked a lot and die" stat. |
| `TeamfightHealingDone` | Team Fight Healing | |
| `TeamfightDamageTaken` | Team Fight Damage Taken | The team fight version of this stat shows up for everyone |
| `TeamfightHeroDamage` | Team Fight Hero Damage Dealt | |
| `OnFireTimeOnFire` | Time On Fire | |
| `LunarNewYearSuccesfulArtifactTurnIns` | Lunar New Year Event Turn Ins | |
| `TimeOnPoint` | Time On Point | |
| `TimeInTemple` | Time In Temple | |
| `TimeOnPayload` | Time on Payload | |

#### Awards
The awards Booleans (the stats that end with `Boolean`) will be `true` if the player receieved the named
award. `false` otherwise. These are all false in Custom games.

| Score ID | Description |  In-game Award Name |
| -------- | -------------- | ------ |
| `EndOfMatchAwardMVPBoolean` | MVP | MVP |
| `EndOfMatchAwardHighestKillStreakBoolean` | Highest Kill Streak Award | Dominator |
| `EndOfMatchAwardMostVengeancesPerformedBoolean` | Revenge Kills Award | Avenger |
| `EndOfMatchAwardMostDaredevilEscapesBoolean` | Most Daredevil Escapes Award | Daredevil |
| `EndOfMatchAwardMostEscapesBoolean` | Escape Artist | Escape Artist |
| `EndOfMatchAwardMostXPContributionBoolean` | XP Contribution Award | Experienced |
| `EndOfMatchAwardMostHeroDamageDoneBoolean` | Most Hero Damage Award | Painbringer |
| `EndOfMatchAwardMostKillsBoolean` | Most Kills Award | Finisher |
| `EndOfMatchAwardHatTrickBoolean` | Hat Trick (first 3 kills of the match) | Hat Trick |
| `EndOfMatchAwardClutchHealerBoolean` | Clutch Healer | Clutch Healer |
| `EndOfMatchAwardMostProtectionBoolean` | Most Protection Award | Protector |
| `EndOfMatchAward0DeathsBoolean` | No Deaths Award | Sole Survivor |
| `EndOfMatchAwardMostSiegeDamageDoneBoolean` | Most Siege Damage Award | Siege Master |
| `EndOfMatchAwardMostDamageTakenBoolean` | Most Damage Taken Award | Bulwark |
| `EndOfMatchAward0OutnumberedDeathsBoolean` | No Deaths While Outnumbered Award | Team Player |
| `EndOfMatchAwardMostHealingBoolean` | Most Healing Award | Main Healer |
| `EndOfMatchAwardMostStunsBoolean` | Most Stuns Award | Stunner |
| `EndOfMatchAwardMostRootsBoolean` | Most Roots Award | Trapper |
| `EndOfMatchAwardMostSilencesBoolean` | Most Silences Award | Silencer |
| `EndOfMatchAwardMostMercCampsCapturedBoolean` | Most Merc Camps Award | Headhunter |
| `EndOfMatchAwardMapSpecificBoolean` | Objective Award, appears to be unused right now | Map Objective |
| `EndOfMatchAwardMostDragonShrinesCapturedBoolean` | Most Dragon Shrines Captured Award | Shriner |
| `EndOfMatchAwardMostCurseDamageDoneBoolean` | Most Curse Damage Done Award | Master of the Curse |
| `EndOfMatchAwardMostCoinsPaidBoolean` | Most Coins Paid Award | Moneybags |
| `EndOfMatchAwardMostImmortalDamageBoolean` | Most Immortal Damage Award | Immortal Slayer |
| `EndOfMatchAwardMostDamageDoneToZergBoolean` | Most Damage Done To Zerg Award | Zerg Crusher |
| `EndOfMatchAwardMostDamageToPlantsBoolean` | Most Damage Done To Plants Award | Garden Terror |
| `EndOfMatchAwardMostDamageToMinionsBoolean` | Most Damage Done To Shrine Minions (Infernal Shrines) | Guardian Slayer |
| `EndOfMatchAwardMostTimeInTempleBoolean` | Most Time In Temple Award | Temple Master |
| `EndOfMatchAwardMostGemsTurnedInBoolean` | Most Gems Turned In Award | Jeweler |
| `EndOfMatchAwardMostSkullsCollectedBoolean` | Most Skulls Collected Award | Skull Collector |
| `EndOfMatchAwardMostAltarDamageDone` | Most Altar Damage Done Award (Towers of Doom) | Cannoneer |
| `EndOfMatchAwardMostNukeDamageDoneBoolean` | Most Nuke Damage Done Award | Da Bomb |
| `EndOfMatchAwardMostTeamfightDamageTakenBoolean` | Most Team Fight Damage Taken Award | Guardian |
| `EndOfMatchAwardMostTeamfightHealingDoneBoolean` | Most Team Fight Healing Done Award | Combat Medic |
| `EndOfMatchAwardMostTeamfightHeroDamageDoneBoolean` | Most Team Fight Hero Damage Done Award | Scrapper |
| `EndOfMatchAwardGivenToNonwinner` | End of Match Award Given to Winner, internal | |
| `EndOfMatchAwardMostTimePushingBoolean` | Most Time Pushing Award | Pusher |
| `EndOfMatchAwardMostTimeOnPointBoolean` | Most Time on Point Award | Point Guard |

### <a name="tracker13"></a> Hero Banned (NNet.Replay.Tracker.SHeroBannedEvent), _eventID = 13
I don't actually use this event because it's easier to just pull from the `attributeevents` data,
as that's in a fixed location.
But it does exist. I forget the exact contents but the hero name is not in a useful format. It appears
to be the internal hero name, which unless you want to manually build that index, is not something that
is easily converted to an actual hero name.

### <a name="tracker14"></a> Hero Picked (NNet.Replay.Tracker.SHeroPickedEvent), _eventID = 14
Indicates that a player picked a hero. These events will be in draft order, so the first one
you see in the `trackerevents` is the first pick. I only use this event for pick order.

Contents:

* Controlling Player ID: `event.m_controllingPlayer` - Note that this is the one ID that is **NOT** the tracker ID!
This is the Working Set Slot ID as described in the players section.
* Hero Name: `event.m_hero` - The internal hero name, which is difficult to map back
to a hero without manually building up that table. I don't use this and instead retrieve hero attribute names
from the `attributeevents` data, and
map back to display hero name with the [heroes-talents](https://github.com/heroespatchnotes/heroes-talents) repository data.

## Message Events
These consist of pings and text messages sent through the game interface.
Team chat is recorded for your team (so no you can't see the other team's chat in the replay).
Party chat is not included if you were in a party.

Common Contents:
```
{
  _eventid: [int],
  _event: [string],
  _gameloop: [int],
  _userid: {
    m_userId: [int]
  }
}
```
All message events have the above contents. The user ID is the Lobby ID as described in the Players section.
`_eventid` will be one of the following and is used to identify what kind of message the event is. `_event` contains
a string representation of the event.

| `_eventid` | Name | Notes |
| ---------- | ---- | ----- |
| 0 | [Chat](#chat) | Chat message |
| 1 | [Ping](#ping) | Ping | 
| 2 | Loading Progress | You can use this to figure out who's loading the slowest I guess. |
| 3 | Server Ping | Not sure what this does really. |
| 4 | Reconnect Notify | Can use to determine who DC'd |
| 5 | [Player Announce](#playerAnnounce) | An announcement ping (health, mana, etc.) |

### <a name="chat"></a> Chat, _eventid = 0
A text message sent to an in-game channel.

Contents: 

* Message Contents: `m_string`
* Message Scope: `m_recipient` - Integer. Relevant values are 0 (All), 1 (Allies/Team), 4 (Observers)

### <a name="ping"></a> Ping, _eventid = 1
A map ping.

Contents:

* Location: `m_point` - contains fields `x` and `y` in what appears to be fixed integer format
* Message Scope: `m_recipient` - Integer. Relevant value are 0 (All), 1 (Allies/Team), 4 (Observers)

### <a name="playerAnnounce"></a> Player Announce, _eventid = 5
A player announcment (health, mana, etc.)

Contents:

* Type: `m_announcement` - Announcement type. An object containing the type and target of the announcement.
Not explored too much of this. Known values for this field are detailed in the table below.
* Link: `m_announceLink` - Not sure what this field is.
* Unit Tags?: `m_unitTag` and `m_otherUnitTag` - Appaear to also be in some sort of fixed integer format. Presumably
links up with the unit tag from the tracker events, but this is untested.

#### Announcement Types
Keys are string keys for an object.

| Key | Value | Notes |
| --- | ----- | ----- |
| `"None"` | | Not sure really what this does |
| `"Ability"` | ? | This indicates the cooldown of the selected ability. I think the contents are the ability ID, but haven't checked recently |
| `"Behavior"` | ? | Unknown |
| `"Vitals"` | Integer | 0 = Health, 2 = Mana, 1 = ??? |

## Game Events


## Special Cases for Map Objectives
Sometimes the tracker doesn't have the data, but other places do.

### <a name="braxisWaveDetection"></a>Braxis Holdout
This one's a doozy. 

### <a name="warheadNukes"></a> Warhead Junction

### <a name="volskayaTriglav"></a> Volskaya Foundry

### <a name="vehicles"></a> Determining Vehicle Control

### <a name="mines"></a> Haunted Mines Golem Spawns

### <a name="beacon"></a> Beacon Control (Dragon Shire, Braxis Holdout)