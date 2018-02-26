# Heroes of the Storm Complete Replay Data Reference
This document details the location and type of every useful piece of data in the Hereos of the Storm replay files to the best of the community's knowledge.

Note: exact access methods may be a slightly different than the js implementation right now as I am working off of my hacked
together python parsing script -Falindrith

## Common Elements
In this document, fields with `[]` at the end indicate that the element in question is an array,
and that any field named after the `[]` (`m_playerList[].m_toon` for instance) is assumed to
exist for all elements in the array.

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

## Match Basics

### Version
Location: `header.m_version`

Value: Object
```json
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

Value: Date in _Windows File Time Format_. This is incredible for a number of reasons but the tl;dr version is to convert this with the following function:
```javascript
function winFileTimeToDate(filetime) {
  return new Date(filetime / 10000 - 11644473600000);
}
```

### Mode
Location: `initdata[1].m_syncLobbyState.m_gameDescription.m_gameOptions.m_ammId`

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
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_userId`

Value: int

Used by `gameevents` and `messageevents` to determine actions and messages sent by players.
ToonHandle is accessible in this array with `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_toonHandle`.

### Name
Location: `details.m_playerList[].m_name`

Value: String

### Hero
Location: `details.m_playerList[].m_hero`

Value: _Localized_ hero name.

Note: For Lucio, it actually includes the accent over the u, so make sure your hero keys are set properly, otherwise you'll have issues identifying that one.

### Silence Penalty
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_hasSilencePenalty`

Value: bool

### Voice Silence Penalty
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_hasVoiceSilencePenalty`

Value: bool.

May not exist pre-build 62424.

### Cosmetics
Contained in the lobby state slots.

#### Skin
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_skin`

Value: String. Internal Skin ID.

#### Announcer
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_announcerPack`

Value: String. Internal Announcer ID.

#### Mount
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_mount`

Value: String. Internal Mount ID.

#### Spray
Location: `initdata[1].m_syncLobbyState.m_lobbyState.m_slots[].m_spray`

Value: bool

### Talents
See `EndOfGameTalentChoices` Tracker Event.

## Draft
Draft data is consistent from HotS 2.0 on, but somewhat unreliable pre-2.0

### Bans
Location: `attributeevents.scopes["16"]`

Value: Object containing a number of cryptic keys.

Relevant data:

* `attributeevents.scopes["16"]["4023"].value` - Blue Team Ban 1
* `attributeevents.scopes["16"]["4025"].value` - Blue Team Ban 2
* `attributeevents.scopes["16"]["4028"].value` - Red Team Ban 1
* `attributeevents.scopes["16"]["4030"].value` - Red Team Ban 2

Each of these objects returns a hero Attribute value (typically the first 4 letters of the hero's internal name, which doesn't
usually match up with the display name). Recommended to use heroes-talents to resolve these names.

Alternate Location: Events in `trackerevents` with `_event` value `NNet.Replay.Tracker.SHeroBannedEvent`. This event
contains the hero banned in `event._m_hero` and the team that banned it in `event.m_controllingTeam`. Blue is 1, Red is 2.
`m_hero` contains the _internal_ name of the hero (e.g. `FaerieDragon` for `Brightwing`).

### Picks
Location: Events in `trackerevents` with `_event` value `NNet.Replay.Tracker.SHeroPickedEvent`

Value: Object.

Relevant data:

* `event.m_controllingPlayer` - This maps to the player's Working Set Slot ID. Using any other ID may result in incorrect pick data.
* `event.m_hero` - Internal hero name. If you mapped Working Set Slot ID to ToonHandle you can resolve this to displayed hero name easily.

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

### Stat Events (NNet.Replay.Tracker.SStatGameEvent), _eventid 10
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


#### Level Up

#### Mercenary Camp Captured

#### End of Game Upvote

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

#### Garden of Terror: Garden Terror Activated

#### Infernal Shrines: Shrine Captured

#### Infernal shrines: Punisher Defeated

#### Tomb of the Spider Queen: Webweaver Spawn

### Unit Born, _eventid = 1

### Unit Died, _eventid = 2

## Special Cases for Map Objectives
Sometimes the tracker doesn't have the data, but other places do.

### <a name="braxisWaveDetection"></a>Braxis Holdout
This one's a doozy. 

### <a name="warheadNukes"></a> Warhead Junction

### <a name="volskayaTriglav"></a> Volskaya Foundry