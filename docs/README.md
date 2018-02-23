# Stats of the Storm
Stats of the Storm is a Heroes of the Storm replay parser that uses a local database to
create detailed [match summary](#matchDetails) reports, [player performance](#playerDetails) reports, and overall
[hero statistics](#collection) for your database. 

Stats of the Storm can also be used to create reports detailing [team performance](#teamDetails),
and organize matches into [collections](collections.md) to represent
different divisions in a league.

It also comes with a [HotsAPI](http://hotsapi.net/)/[HotsLogs](https://www.hotslogs.com/) uploader built in.

**Important Note**: Right now the parser only supports replays made using an English version of
Heroes of the Storm. I hope to address this in a future update.

## Features
* [Match Database](#matchDB)
* [Match Details](#matchDetails)
* [Player Details](#playerDetails)
* [Team Details](#teamDetails)
* [Collection Stats](#collection)
* [Uploader](#uploader)

## How To
* [Parse Replays](parser.md)
* [Make a Team](teams.md)
* [Load an External Database](external-db.md)
* [Use Filters](filters.md)
* [Use Collections](collections.md)
* [Do a Clean Uninstall](uninstall.md)

## Download
Stats of the Storm is a Windows-only application right now. You can download the latest build
from the [Releases](https://github.com/ebshimizu/stats-of-the-storm/releases) page.
The first thing you'll want to do is set up the parser in the Settings menu, which you can reach by
opening the menu in the top left corner of the app.

Once you install the program, you can start parsing your own matches, or explore
a database created by someone else. An example of this has been created for
Phase 1 of the 2018 HGC, and instructions can be found [here](external-db.md).

Want to help develop? Found a bug? Check out the [project repository](https://github.com/ebshimizu/stats-of-the-storm/).

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

**Why doesn't this run on OS X?**
Theoretically there is no problem and it already runs on OS X.
However, I can't build an installer for OS X because I don't have a Mac to run this on.
The other (and probably larger problem) is that the parser I use must be packaged
with [PyInstaller](http://www.pyinstaller.org/) using OS X every time the heroprotocol library updates.
If you would like to maintain this, let me know.

**Why doesn't this work with non-English Replays?**
The parser looks for a map that it recognizes and then parses. Since the map names are not in English,
they don't match any keys that the parser looks for. Additionally, hero names will be in their
localized versions, so the data won't match up there either. I hope to add localization support
in a future update.

# Features

## <a name="matchDB"></a>Match Database
![Match DB]({{ "/images/matches.png" | absolute_url }})
Search for matches by mode, map, patch, season, hero presence,
player presence, or team.

## <a name="matchDetails"></a>Match Details
![Match Summary]({{ "/images/match-details-01.PNG" | absolute_url }})
Standard End of Match statistics, bans, award details, and talents.

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
Hero details and talent selection per-player. Builds are coming soon!

![Hero Synergy]({{ "/images/player-details-03.png" | absolute_url }})
With and against hero win rates.

![Skins and Taunts]({{ "/images/player-details-04.png" | absolute_url }})
Win rate with each skin, and most importantly, number of taunt actions taken,
takedowns near taunt, and deaths near taunt. Also shows award stats.

![Player Hero Details]({{ "/images/player-details-05.png" | absolute_url }})
Detailed average stats table for all heroes played by a player. Includes
replay-only hidden statistics.

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

![Roster Stats]({{ "/images/team-details-02.png" | absolute_url }})
Average roster stats summary with link to the player's profile for more details.

## <a name="collection"></a>Collection Stats
Aggregated data over the entire database (or current collection).

![Overall Hero Stats]({{ "/images/collection-01.png" | absolute_url }})
Hero statistics including win, ban, and popularity rates. Filterable by
role. Can also view detailed average stats (across all players) in the
Hero Details tab.

![Overall Team Stats]({{ "/images/collection-02.png" | absolute_url }})
Rank teams by their average stats. Provides four categories to browse through.

![Overall Player Stats]({{ "/images/collection-03.png" | absolute_url }})
**IMPORTANT: If you are using large databases (more than 500 players)
you should set filters on your query before running, otherwise you will
be waiting for the app to respond for a long time.**

Displays overall individual player stats. Filterable by hero.

## <a name="uploader"></a>Built-in HotsAPI Upload

![Built In Uploader]({{ "/images/uploader.png" | absolute_url }})
Upload your matches to HotsAPI (and HotsLogs if you like) automatically
when you import a match. Stats of the Storm does not actively monitor your replay
folder at the moment, so you'll have to remember to upload them manually for now.