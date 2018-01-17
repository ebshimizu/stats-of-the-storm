# hots-analysis

This application is in the very early development stage.
Folders will be moved at will, breaking changes will probably be in every commit.
## Why?
Why not? Also this parser extracts some additional data that current sites do not such as:
* A complete list of takedowns with involved players and locations
* All possible minion xp generated since the start of the game (can be used to determine amount of missed soak)
* Dragon Shire: Duration of Shrine Control and when control switched
* Haunted Mines: Amount of time golems were alive for
* Cursed Hollow: When tributes spawned (and where they spawned)
* B-step events and takedowns within a 10 second window
* Other taunt/spray/dance events and also takedowns within a 10 second window
* yes this parser basically detects BM

## Setup
External Requirements:
* Node
* Python 2 in your PATH
* Don't forget to initialize the submodules

```
npm install
```

## Third-Party Libraries
[heroprotocol](https://github.com/Blizzard/heroprotocol)

[NeDB](https://github.com/louischatriot/nedb)