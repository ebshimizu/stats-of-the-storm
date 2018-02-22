# Features
Stats of the Storm is a Heroes of the Storm replay parser that uses a local database to
create detailed match summary reports, player performance reports, and overall
hero statistics for your database. 

Stats of the Storm can also be used to create reports detailing team performance (with
a team defined as 2 or more players), and organize matches into collections to represent
different divisions in a league.

Check out what Stats of the Storm can do:
* [Match Details](#matchDetails)
* [Match Database](#matchDB)
* [Parsing Your Matches](#parser)

## Download
Stats of the Storm is a Windows-only application right now. You can download the latest build
from the [Releases](https://github.com/ebshimizu/stats-of-the-storm/releases) page.

Once you install the program, you can start parsing your own matches, or explore
a database created by someone else. An example of this has been created for
Phase 1 of the 2018 HGC, and instructions can be found [here](external-db.md).

Want to help develop? Found a bug? Check out the [project repository](https://github.com/ebshimizu/stats-of-the-storm/).

# <a name="matchDetails"></a>Match Details
![Match Summary]({{ "/images/match-details-01.PNG" | absolute_url }})
Standard End of Match statistics, bans, award details, and talents.

![Stat Graphs]({{ "/images/match-details-02.png" | absolute_url }})
Interactive charts for overall team damage/healing, teamfight damage/healing, and CC time

![Team Stats]({{ "/images/match-details-03.png" | absolute_url }})
Combined team statistics for levels 10 and 20, mercenaries, and structures.

![Detailed Stats]({{ "/images/match-details-04.png" | absolute_url }})
Detailed stats table (including hidden replay statistics such as clutch heals and escapes)

## XP Graphs
![Team XP]({{ "/images/match-details-07.png" | absolute_url }})
Total Team XP

![Minion XP]({{ "/images/match-details-05.png" | absolute_url }})
Team minion soak versus theoretical maximum possible minion xp on the map

![Detailed Stats]({{ "/images/match-details-06.png" | absolute_url }})
XP contribution graph

## Full Match Timeline
![Match Timeline]({{ "/images/match-details-08.png" | absolute_url }})
Lists the times of major match events including team takedowns, levels,
level advantage, structures destroyed, objectives, mercenary captures,
and also how long each mercenary unit was active.

## Taunts and Chat
![Taunts and Chat]({{ "/images/match-details-09.png" | absolute_url }})
Team (and all if it's a custom game) chat, along with every spray,
dance, taunt, voice line, and of course, bstep, used in the match,
along with a count of takedowns or deaths that happened during the taunt.
 
# <a name="matchDB"></a>Match Database
![Match DB]({{ "/images/matches.png" | absolute_url }})
Search for matches by mode, map, patch, season, hero presence,
player presence, or team.