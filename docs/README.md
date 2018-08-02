# Stats of the Storm
Stats of the Storm is a Heroes of the Storm replay parser that uses a local database to
create detailed [match summary](#matchDetails) reports, [player performance](#playerDetails) reports, and overall
[hero statistics](#collection) for your database. 

Stats of the Storm can also be used to create reports detailing [team performance](#teamDetails),
and organize matches into [collections](collections.md) to represent
different divisions in a league.

It also comes with a [HotsAPI](http://hotsapi.net/)/[HotsLogs](https://www.hotslogs.com/) uploader built in.

## Download
Stats of the Storm is available for Windows and macOS (experimental). You can download the latest build
from the [Releases](https://github.com/ebshimizu/stats-of-the-storm/releases) page.

Windowws users: Download the `stats-of-the-storm-setup-x.x.x.exe` file.

Mac users: Download either the `stats-of-the-storm-x.x.x.dmg` or `stats-of-the-storm-x.x.x-mac.zip`. 

### Setup
The first thing you'll want to do is set up the parser in the Settings menu, which you can reach by
opening the menu in the top left corner of the app. The application is unsigned, so you will need
to tell your respective OS to allow the installation of the app.

Once you install the program, you can start parsing your own matches, or explore
a database created by someone else. An example of this has been created for
Phase 1 of the 2018 HGC, and Season 4 of the [NGS](https://nexusgamingseries.com),
and instructions can be found [here](external-db.md).

The macOS build should be considered _experimental_ at this time. I am testing the app
on a VM, so it may behave differently on actual hardware. Please let me know what sort
of problems come up there.

Want to help develop? Found a bug? Check out the [project repository](https://github.com/ebshimizu/stats-of-the-storm/).

## Features
* [Match Database](#matchDB)
* [Match Details](#matchDetails)
* [Player Details](#playerDetails)
* [Team Details](#teamDetails)
* [Collection Stats](#collection)
* [Uploader](#uploader)
* [Export JSON and PDF Data](#exporter)

## How To
* [Parse Replays](parser.md)
* [Make a Team](teams.md)
* [Use Filters](filters.md)
* [Use Collections](collections.md)
* [Use Aliases](alias.md)
* [Load an External Database](external-db.md)
* [Do a Clean Uninstall](uninstall.md)

## Replay Reference
* [Replay File Format Reference](hots-replay-data.md)

## FAQ

**Why doesn't this do [x]?**
It's either on the [list](https://github.com/ebshimizu/stats-of-the-storm/projects/2) or I haven't thought about it.
If you want it to do [x], let me know, or try making a pull request.

**Why doesn't this just upload to HotsLogs?**
Honestly it was just eaiser to let HotsAPI do it because there's an option for it.

**It crashed help me?**
File a bug report on the [issues page](https://github.com/ebshimizu/stats-of-the-storm/issues) and I'll see what I can do. Include as much info
as you can, and check the Development Console (`Ctrl+Shift+I`) for errors.

**How can I help?**
Set up the development environment as detailed on the repository readme and then
take a look at the open [issues](https://github.com/ebshimizu/stats-of-the-storm/issues) and try fixing
or implementing one! When you're ready, submit a pull request and we'll get the feature in there.

**HotS updated, but the parser doesn't work?**
The parser in this app is tied to Blizzard's [heroprotocol](https://github.com/Blizzard/heroprotocol) library.
When this library updates, I will push an update for the app as soon as I can. It may take longer to update
if a new hero is added, as I then have to make sure the heroes-talents repository is also updated.

**Why don't I see all the players in the Player Details page?**
Personal databases have a lot of players that only show up once or twice. In order to keep the
app responsive, players with fewer than 5 matches in the database are automatically excluded from the Player
Details page. You can change this threshold in the Settings page with the Player Menu Threshold
option.

# Features

## <a name="matchDB"></a>Match Database
![Match DB]({{ "/images/matches.png" | absolute_url }})
Search for matches by mode, map, patch, season, hero presence,
player presence, or team.

## <a name="matchDetails"></a>Match Details
![Match Summary]({{ "/images/match-details-01.PNG" | absolute_url }})
Standard End of Match statistics, bans, award details, and talents.

![Full Draft]({{ "/images/match-details-10.png" | absolute_url }})
Full match draft, not just bans. Available for replays from HotS 2.0 or newer (v2.25.0).

![Stat Graphs]({{ "/images/match-details-02.png" | absolute_url }})
Interactive charts for overall team damage/healing, teamfight damage/healing, and CC time

![Team Stats]({{ "/images/match-details-03.png" | absolute_url }})
Combined team statistics for levels 10 and 20, mercenaries, and structures.

![Detailed Stats]({{ "/images/match-details-04.png" | absolute_url }})
Detailed stats table (including hidden replay statistics such as clutch heals and escapes)

### XP Graphs
![Team XP]({{ "/images/match-details-07.png" | absolute_url }})
Total Team XP

![Minion XP]({{ "/images/match-details-05.png" | absolute_url }})
Team minion soak versus theoretical maximum possible minion xp on the map

![Detailed Stats]({{ "/images/match-details-06.png" | absolute_url }})
XP contribution graph

### Full Match Timeline
![Match Timeline]({{ "/images/match-details-08.png" | absolute_url }})
Lists the times of major match events including team takedowns, levels,
level advantage, structures destroyed, objectives, mercenary captures,
and also how long each mercenary unit was active.

### Taunts and Chat
![Taunts and Chat]({{ "/images/match-details-09.png" | absolute_url }})
Team (and all if it's a custom game) chat, along with every spray,
dance, taunt, voice line, and of course, bstep, used in the match,
along with a count of takedowns or deaths that happened during the taunt.

## <a name="playerDetails"></a>Player Details
Stats of the Storm generates reports for each player found in the database.

![Player Details]({{ "/images/player-details-01.png" | absolute_url }})
Hero summary, map summary, and aggregate data for each player.

![Player Hero Details]({{ "/images/player-details-02.png" | absolute_url }})
Hero details and talent selection per-player.

![Player Hero Pool]({{ "/images/player-details-09.png" | absolute_url }})
Hero pool details for each player.

![Player Hero Builds]({{ "/images/player-details-07.png" | absolute_url }})
Talent builds overall and per-player.

![Player Comparison]({{ "/images/player-details-08.png" | absolute_url }})
Comparison with the average for a wide range of stats across the entire database, or
a specified collection.

![Hero Synergy]({{ "/images/player-details-03.png" | absolute_url }})
With and against hero win rates.

![Skins and Taunts]({{ "/images/player-details-04.png" | absolute_url }})
Win rate with each skin, and most importantly, number of taunt actions taken,
takedowns near taunt, and deaths near taunt. Also shows award stats.

![Player Hero Details]({{ "/images/player-details-05.png" | absolute_url }})
Detailed average stats table for all heroes played by a player. Includes
replay-only hidden statistics. View average, min, max, median, and total stats.

![Player Progression]({{ "/images/player-details-06.png" | absolute_url }})
Win rate, KDA, and award rate over time graphs. Available intervals include
month, week, patch, and season.

## <a name="teamDetails"></a>Team Details
In order to use teams, you first need to define who's on a team.
See [Team Building Instructions](teams.md) for more details.

The team hero summary, and team map summary provide the same info as
the player details.

![Team Stats]({{ "/images/team-details-01.png" | absolute_url }})
Team stats also include bans, win rate against hero, average time to levels 10 and 20,
average mercenary stats, total structure stats, and average team-wide damage stats.

![Team Draft Priority]({{ "/images/teams-03.png" | absolute_url }})
Team draft priority, including picks, and bans.

![Team vs Average Stats]({{ "/images/team-details-03.png" | absolute_url }})

Comparison of average team stats across the entire database, or a specified collection.

![Roster Stats]({{ "/images/team-details-02.png" | absolute_url }})
Average roster stats summary with link to the player's profile for more details.

## <a name="collection"></a>Collection Stats
Aggregated data over the entire database (or current collection).

![Overall Hero Stats]({{ "/images/collection-01.png" | absolute_url }})
Hero statistics including win, ban, and popularity rates. Filterable by
role. Can also view detailed average stats (across all players) in the
Hero Details tab.

![Overall Hero Draft Stats]({{ "/images/hero-stats-01.png" | absolute_url }})
Hero pick and ban rate stats for the entire collection.

![Overall Hero Composition Stats]({{ "/images/hero-stats-02.png" | absolute_url }})

Team composition statistics.

![Overall Hero Pool Stats]({{ "/images/hero-stats-03.png" | absolute_url }})

Overall hero pool stats. Can determine how many heroes never got picked/banned, never
played, or never banned.

![Overall Team Stats]({{ "/images/collection-02.png" | absolute_url }})
Rank teams by their average stats. Provides four categories to browse through.

![Overall Hero Trends]({{ "/images/trends-01.png" | absolute_url }})
See win, pick, and ban rates for each hero over two specified intervals.

![Overall Player Stats]({{ "/images/collection-03.png" | absolute_url }})
**IMPORTANT: If you are using large databases (more than 500 players)
you should set filters on your query before running, otherwise you will
be waiting for the app to respond for a long time.**

Displays overall individual player stats. Filterable by hero.

![Overall Player Stats]({{ "/images/maps-01.png" | absolute_url }})

Overall map and match statistics, including blue/red team advantage, first pick win stats,
and first objective win stats (where available).

## <a name="uploader"></a>Built-in HotsAPI Uploader

![Built In Uploader]({{ "/images/uploader.png" | absolute_url }})
Upload your matches to HotsAPI (and HotsLogs if you like) automatically
when you import a match. Stats of the Storm does not actively monitor your replay
folder at the moment, so you'll have to remember to upload them manually for now.

## <a name="exporter"></a>Exporting Data

The app allows data to be exported in JSON and PDF formats.

With JSON data, you can export match data, and
player data.

With PDFs, you can create printable reports for most parts of the application.
Note that PDF printing takes a snapshot of the current section, which means that you'll
have to make sure your tables are sorted in your desired order before using
the print function. The application will briefly change layout and color while printing,
and will return to normal when complete. If it does not return to normal, let me know.