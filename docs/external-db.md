# Using External Databases
By default, Stats of the Storm creates a set of database files in the `/Users/[USERNAME]/%APPDATA%/Roaming/stats-of-the-storm` folder.
You can change the database location in the Settings panel.

![Database Loction]({{ "/images/external-db.png" | absolute_url }})

Four database files are needed by Stats of the Storm. Each folder should have:
* hero.db
* matches.db
* players.db
* settings.db

If you're missing one of these files, you should create a new database and re-import the files,
as Stats of the Storm is unable to recover missing data from a corrupted database.

If you select a folder that already has these four existing database files, Stats of the Storm will load
the data from that database instead of creating a new one in that folder.

Try it out! Below are some databases created for Stats of the Storm.

* [2018 HGC](https://www.dropbox.com/s/6oib7or3n6oknev/HGC_2018.zip?dl=0) - Includes all regions, regular season play games, and tournament games. Updated as replays become available.
* [NGS Season 3](https://www.dropbox.com/s/302ll6d7l4lqpti/NGS_Season3.zip?dl=0) - The Nexus Gaming Series is a NA community
league. Find out more at their website: [Nexus Gaming Series](https://nexusgamingseries.com).

Extract the directory and set your database path to the
folder that has all of the `.db` files in it. Congrats! You're now a stats wizard.

[Back](https://ebshimizu.github.io/stats-of-the-storm/)