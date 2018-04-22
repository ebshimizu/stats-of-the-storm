# Parser
Stats of the Storm loads replay data using the [heroprotocol](https://github.com/Blizzard/heroprotocol)
library from Blizzard. Stats of the Storm makes use of a bundled version of the parsing script,
so having python on your computer to run the parser is not required.

In order to use the parser, you'll want to go to the settings menu, which can be accessed by
clicking on the three-line icon in the top left of the application. On the right, you'll see
this set of controls: 

![Parser Settings]({{ "/images/parser-settings.png" | absolute_url }})

To start parsing, first set the replay folder to your Heroes of the Storm
replay folder by clicking on the blue Set button. Then specify the date you'd
like to start parsing at, dismiss the date picker, and click start. Replays found
will show up on the left side of the screen. If you ever see a replay with a status
of `Error: Internal Exception`, please file a bug report and include the replay file
that caused the error!

Other settings:
* Database Folder - Set or reset the database location. You can load [external databases](external-db.md)
this way.
* Refresh - Clicking this button reloads and resets the status of the replay files found by the parser.
* Stop - Stops parsing. Parsing will stop after handling the match currently marked as "Processing"
* Import to Collection - Automatically place imported matches into the specified collection.
For more info about collections, see [this page](collections.md).
* Upload to HotsAPI/HotsLogs - Checking these boxes will also upload your replay files to HotsAPI and HotsLogs.
You can't just upload to HotsLogs though, so make sure the HotsAPI option is checked if it's not working.
* Delete Database - Deletes the currently loaded database. Use carefully.

You can also set a player ID to focus on with the My ID setting. This will highlight that player when
browsing through matches.

## Using Import Sets

Import sets allow you to pre-define which folders you would like to import and specify which collections the replays
in each folder should be added to. Import sets are stored __locally__ per database (so the settings don't get carried
over if you load someone else's database). To activate import sets, click on the gear menu on the right of
the replay folder option, and toggle the `Use Replay Set` setting.

[Back](https://ebshimizu.github.io/stats-of-the-storm/)