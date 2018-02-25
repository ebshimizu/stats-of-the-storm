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

### Stat Events (NNet.Replay.Tracker.SStatGameEvent), _eventid 10
Stat events all have an additional `m_eventName` parameter which determines what data they contain.
A list of relevant game events follows. For all of these objects, `_eventid = 10`.

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