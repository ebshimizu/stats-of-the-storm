/* jshint esversion: 6, maxerr: 1000, node: true */
// this is the main database connector used by the app
// storage model is a persistent NeDB

// libraries
const Parser = require('../parser/parser.js');

// databases are loaded from the specified folder when the database object is created
var Datastore = require('nedb');

class Database {
  constructor(databasePath) {
    this._path = databasePath;

    // open the databases
    this._db = {};
    this._db.matches = new Datastore({ filename: this._path + '/matches.db', autoload: true });
    this._db.heroData = new Datastore({ filename: this._path + '/hero.db', autoload: true });
    this._db.players = new Datastore({ filename: this._path + '/players.db', autoload: true });
    this._db.settings = new Datastore({ filename: this._path + '/settings.db', autoload: true });
  }

  addReplayToDatabase(file, opts = {}) {
    var data = Parser.processReplay(file, opts);

    if (data.status === Parser.ReplayStatus.OK) {
      // insert match, upsert is used just in case duplicates exist
      this.insertReplay(data.match, data.players);
    }
  }

  insertReplay(match, players) {
    var self = this;

    this._db.matches.update({ 'map' : match.map, 'date' : match.date, 'loopLength' : match.loopLength }, match, {upsert: true}, function (err, numReplaced, newDoc) {
      if (!newDoc) {
        console.log("Duplicate match found, skipping player update");
      }
      else {
        console.log("Inserted new match " + newDoc._id);

        // update and insert players
        for (var i in players) {
          players[i].matchID = newDoc._id;
          self._db.heroData.insert(players[i]);

          // log unique players in the player database
          var playerDbEntry = {};
          playerDbEntry._id = players[i].ToonHandle;
          playerDbEntry.name = players[i].name;
          playerDbEntry.uuid = players[i].uuid;
          playerDbEntry.region = players[i].region;
          playerDbEntry.realm = players[i].realm;

          var updateEntry = { $set: playerDbEntry, $inc: { matches: 1}};

          self._db.players.update({ _id: playerDbEntry._id }, updateEntry, {upsert: true}, function(err, numReplaced, upsert) {
            if (err)
              console.log(err);
          });
        }
      }
    });
  }

  checkDuplicate(file, callback) {
    let data = Parser.parse(file, [Parser.ReplayDataType.header, Parser.ReplayDataType.details]);
    let search = {};
    search.type = data.header[0].m_type;
    search.loopLength = data.header[0].m_elapsedGameLoops;
    search.map = data.details[0].m_title;
    search.rawDate = data.details[0].m_timeUTC;

    this._db.matches.find(search, function(err, docs) {
      callback(docs.length > 0);
    });
  }

  // counts the given matches
  countMatches(query, callback) {
    this._db.matches.count(query, callback);
  }

  // retrieves a match from the database using the given query
  getMatches(query, callback, opts = {}) {
    if ('sort' in opts) {
      let cursor;
      if ('projection' in opts)
        cursor = this._db.matches.find(query, opts.projection);
      else
        cursor = this._db.matches.find(query);
      
      cursor.sort(opts.sort).exec(callback);
    }
    else {
      if ('projection' in opts) {
        this._db.matches.find(query, opts.projection, callback);
      }
      else {
        this._db.matches.find(query, callback);
      }
    }
  }

  // retrieves matches by id
  getMatchesByID(ids, callback, opts = {}) {
    let query = {$or: []};
    for (let i in ids) {
      query.$or.push({_id: ids[i]});
    }

    this.getMatches(query, callback, opts);
  }

  getHeroDataForID(matchID, callback) {
    let query = {matchID: matchID};
    this._db.heroData.find(query, callback);
  }

  // returns all hero data entries for the given player id
  getHeroDataForPlayer(playerID, callback) {
    let query = {ToonHandle: playerID};
    this._db.heroData.find(query, callback);
  }

  getPlayers(query, callback, opts = {}) {
    if ('sort' in opts) {
      let cursor;
      if ('projection' in opts)
        cursor = this._db.players.find(query, opts.projection);
      else
        cursor = this._db.players.find(query);
      
      cursor.sort(opts.sort).exec(callback);
    }
    else {
      if ('projection' in opts) {
        this._db.players.find(query, opts.projection, callback);
      }
      else {
        this._db.players.find(query, callback);
      }
    }
  }

  // gets a single player from the players table
  getPlayer(id, callback) {
    this.getPlayers({_id: id}, callback);
  }

  // this will go an process a set of heroData into a set of stats divided
  // by hero, and by map
  summarizeHeroData(docs) {
    // collect data
    // hero averages
    let playerDetailStats = {};
    playerDetailStats.heroes = {};
    playerDetailStats.maps = {};
    playerDetailStats.rawDocs = docs;
    playerDetailStats.games = 0;
    playerDetailStats.wins = 0;
    playerDetailStats.nonCustomGames = 0;

    for (let i = 0; i < docs.length; i++) {
      let match = docs[i];
      let statList = DetailStatList.concat(PerMapStatList[match.map]);

      // hero stuff
      if (!(match.hero in playerDetailStats.heroes)) {
        playerDetailStats.heroes[match.hero] = { games: 0, wins: 0, totalAwards: 0, stats: {}, awards: {} };
      }

      playerDetailStats.games += 1;
      playerDetailStats.heroes[match.hero].games += 1;

      if (!(match.map in playerDetailStats.maps))
        playerDetailStats.maps[match.map] = { games: 0, wins: 0 };

      playerDetailStats.maps[match.map].games += 1;

      for (let s in statList) {
        let statName = statList[s];
        if (!(statName in playerDetailStats.heroes[match.hero].stats))
          playerDetailStats.heroes[match.hero].stats[statName] = 0;
        
        playerDetailStats.heroes[match.hero].stats[statName] += match.gameStats[statName];
      }

      // you only ever get 1 but just in case...
      // ALSO custom games don't get counted here since you can't get awards
      if (match.mode !== ReplayTypes.GameMode.Custom) {
        playerDetailStats.nonCustomGames += 1;
        if ('awards' in match.gameStats) {
          for (let a in match.gameStats.awards) {
            let awardName = match.gameStats.awards[a];
            if (!(awardName in playerDetailStats.heroes[match.hero].awards))
              playerDetailStats.heroes[match.hero].awards[awardName] = 0;
            
            playerDetailStats.heroes[match.hero].awards[awardName] += 1;
            playerDetailStats.heroes[match.hero].totalAwards += 1;
          }
        }
      }

      if (match.win) {
        playerDetailStats.wins += 1;
        playerDetailStats.maps[match.map].wins += 1;
        playerDetailStats.heroes[match.hero].wins += 1;
      }
    }

    // averages
    playerDetailStats.averages = {};
    playerDetailStats.totalTD = 0;
    playerDetailStats.totalDeaths = 0;
    playerDetailStats.totalMVP = 0;
    playerDetailStats.totalAward = 0;

    for (let h in playerDetailStats.heroes) {
      playerDetailStats.averages[h] = {};
      for (let s in playerDetailStats.heroes[h].stats) {
        playerDetailStats.averages[h][s] = playerDetailStats.heroes[h].stats[s] / playerDetailStats.heroes[h].games;
      }
      playerDetailStats.heroes[h].stats.totalKDA = playerDetailStats.heroes[h].stats.Takedowns / Math.max(playerDetailStats.heroes[h].stats.Deaths, 1);

      if ('EndOfMatchAwardMVPBoolean' in playerDetailStats.heroes[h].awards) {
        playerDetailStats.heroes[h].stats.MVPPct = playerDetailStats.heroes[h].awards.EndOfMatchAwardMVPBoolean / playerDetailStats.heroes[h].games;
        playerDetailStats.totalMVP += 1;
      }
      else {
        playerDetailStats.heroes[h].stats.MVPPct = 0;
      }

      playerDetailStats.heroes[h].stats.AwardPct = playerDetailStats.heroes[h].totalAwards / playerDetailStats.heroes[h].games;
      playerDetailStats.totalAward += playerDetailStats.heroes[h].totalAwards;
      playerDetailStats.totalDeaths += playerDetailStats.heroes[h].stats.Deaths;
      playerDetailStats.totalTD += playerDetailStats.heroes[h].stats.Takedowns;
    }

    return playerDetailStats;
  }
}

exports.HeroesDatabase = Database;