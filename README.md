# Stats of the Storm

A flexible stat tracker for Heroes of the Storm.

Provides the ability to track individual stats, team stats in a league, and overall statistics
for a league.

This application is in the very early development stage.
Folders will be moved at will, breaking changes will probably be in every commit.

## Features
* Match Summary
  * All end-game statics shown in-client
  * Detailed end-game statistics only stored in replay
  * XP Contribution and Soak graphs
  * As detailed as possible timeline with takedowns, levels, level advantage, objectives, merc captures, and merc unit lifespan listed
  * Chat and Taunt log (including bsteps)
  * Team statistics including structures destroyed, merc captures, merc uptime, total damage/healing per team

* Individual Stats
  * Hero Win Rate, KDA, MVP, and Award stats
  * Talent win rates
  * [Planned] Build win rates
  * Win rate per map
  * Win rate with/against heroes
  * Win rate with/against commonly played friends/opponents
  * Award stats
  * Skin win rate stats
  * Taunt stats (including number of deaths/takedowns with a 10 second window of the taunt)
  * Detailed hidden statistics for each hero
  * Filter by mode, date, hero type, and map
  * Track individual win rate, KDA, and award rate over time

* Collection Statistics
  * Overall hero win/pick/ban/popularity rates
  * Overall map win rates
  * Player Stats List (warning: performance impact if using large database)
  * Teams
    * Assign two or more players to a team to track statistics for matches where those players are present
    * Teams can have an arbitrary number of players on them
    * Team statistics page including pick/ban stats
    * [Planned] Team rankings based on overall team statistics

* [Planned] League Tracking (Collections)
  * [Planned] Create Collections of matches to track statistics for a league
  * [Planned] All previously listed features are avaialble, and simply restricted to matches within a specific collection

* Other
  * Movable Database - Don't want to parse matches yourself? You can load someone else's database instead of your own.
  * [Planned] HotsAPI and HotsLogs uploader

## Setup
Development Requirements:
* Node
* Python 2 in your PATH
* Don't forget to initialize the submodules

```
npm install
```

## Third-Party Libraries
* [heroprotocol](https://github.com/Blizzard/heroprotocol)
* [NeDB](https://github.com/louischatriot/nedb)
* [Semantic UI](https://semantic-ui.com/)
* [datepicker](https://github.com/fengyuanchen/datepicker)
* [jquery.floatThead](https://github.com/mkoryak/floatThead)
* jquery
* electron