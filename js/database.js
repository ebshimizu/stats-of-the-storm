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
          self._db.players.update({ _id: playerDbEntry._id }, playerDbEntry, {upsert: true}, function(err, numReplaced, upsert) {
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
}

exports.HeroesDatabase = Database;