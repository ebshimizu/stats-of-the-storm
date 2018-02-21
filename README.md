# Stats of the Storm

A flexible stat tracker for Heroes of the Storm.

Provides the ability to track individual stats, team stats in a league, and overall statistics
for a league.

## Installation
Stats of the Storm has only been tested and built for Windows 10 systems.
If you'd like to help get this to run on OS X and Linux, check out the Development section below.

Check out the [Releases Page](https://github.com/ebshimizu/hots-analysis/releases) to download the latest installer.

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
    * Overall Team statistics summary

* League Tracking (Collections)
  * Create Collections of matches to track statistics for a league
  * All previously listed features are avaialble, and simply restricted to matches within a specific collection

* Other
  * Movable Database - Don't want to parse matches yourself? You can load someone else's database instead of your own.
  * HotsAPI and HotsLogs uploader

## Development
Here's what you'll need to develop the app.

* Install node
* Install Python 2 (must be 2, and you should also put it in your path)
* Install [pyinstaller](http://www.pyinstaller.org/)
* Install electron globally: `npm install -g electron`
* Clone the repository and initialize the submodules
* Run `npm install`
* To package the parser, navigate to the `./parser/heroprotocol` folder and run `node ../package_parser.js`
* Launch the Electron application from the repository root by running `electron .`

### Why is PyInstaller Required?
Stats of the Storm doesn't assume that users have Python installed on their system. Additionally,
there are issues with running python files from the Electron ASAR archives, and it is easier
to package the parser as a single executable file.

## Third-Party Libraries
* [heroprotocol](https://github.com/Blizzard/heroprotocol)
* [heroes-talents](https://github.com/heroespatchnotes/heroes-talents)
* [NeDB](https://github.com/louischatriot/nedb)
* [Semantic UI](https://semantic-ui.com/)
* [datepicker](https://github.com/fengyuanchen/datepicker)
* [jquery.floatThead](https://github.com/mkoryak/floatThead)
* [jquery.tablesort](https://github.com/kylefox/jquery-tablesort)
* [jquery](https://jquery.com/)
* [electron](https://electronjs.org/)