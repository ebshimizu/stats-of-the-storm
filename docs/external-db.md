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

Try it out! You can download this database of matches from Phase 1 Part 1 of the HGC, including
NA and EU regions, from [here](https://www.dropbox.com/s/57jx8c699nznij1/2018HGC_NA_EU.zip?dl=0).
Extract the directory and set your database path to the
extracted folder. Congrats! You're now a HGC stats wizard.

If you're looking for HGC KR and CN, sorry but I can't parse all of those replays yet!
I'm considering solutions to localized replays, so stay tuned.

[Back](https://ebshimizu.github.io/stats-of-the-storm/)