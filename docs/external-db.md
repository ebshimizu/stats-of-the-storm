# Using External Databases
By default, Stats of the Storm creates a set of database files in the `/Users/[USERNAME]/%APPDATA%/Roaming/stats-of-the-storm` folder.
You can change the database location in the Settings panel.

![Database Loction]({{ "/images/external-db.png" | absolute_url }})

As of version 2.0, four database folders are needed by Stats of the Storm. Each folder should have:
* hero.ldb
* matches.ldb
* players.ldb
* settings.ldb

If you're missing one of these folders, you should create a new database and re-import the files,
as Stats of the Storm is unable to recover missing data from a corrupted database.

If you select a folder that already has these four existing database folders, Stats of the Storm will load
the data from that database instead of creating a new one in that folder.

Try it out! Below are some databases created for Stats of the Storm.

* [2018 HGC Phase 1](https://www.dropbox.com/s/6oib7or3n6oknev/HGC_2018.zip?dl=0) - Includes all regions, regular season play games, and tournament games. Updated as replays become available.
* [2018 HGC Phase 2](https://www.dropbox.com/s/9taqybb7m22dylg/HGC_2018_Phase2.zip?dl=0) - Includes all regions. Regular season games and tournaments from Phase 2 will be here. Might release a combined database at some point.
* [NGS Season 5](https://www.dropbox.com/s/4namw8915vl4mfi/NGS_s5.zip?dl=0) - The Nexus Gaming Series is a NA community
league. Find out more at their website: [Nexus Gaming Series](https://nexusgamingseries.com).
* [NGS Season 4](https://www.dropbox.com/s/1gyhc89lafrfzbl/NGS_s4.zip?dl=0)
* [NGS Season 3](https://www.dropbox.com/s/302ll6d7l4lqpti/NGS_Season3.zip?dl=0)

Extract the directory and set your database path to the
folder that has all of the `.ldb` folders in it. Congrats! You're now a stats wizard.

## Loading Comparison Databases
Stats of the Storm 0.5.0+ allows you to load data from external databases to compare your stats against
the stats in that database. This can be useful if you'd like to compare your stats vs the HGC player
stats database without having to load your stats into the HGC database.

To do this, load a database in the Settings page with the "Import" button under "External Comparison DB".
Select a database folder and set a name for the database. If successful, the imported database will show up
under "Cached Collections" in the settings page. From there you can update or delete the database. Note that if you'd
like to re-import the database after updating it, you should use the corresponding "Update" button.

Collections in the cached database will then show up as options in the Player Details > Compare To Collection Average panel.

[Back](https://ebshimizu.github.io/stats-of-the-storm/)