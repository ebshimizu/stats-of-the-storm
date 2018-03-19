/* jshint esversion: 6, maxerr: 1000, node: true */
// this is the main database connector used by the app
// storage model is a persistent NeDB

// libraries
const Parser = require('../parser/parser.js');
const fs = require('fs');

// databases are loaded from the specified folder when the database object is created
var Datastore = require('nedb');

// ok so you should never call raw db ops on the _db object unless you are debugging.
// the Database is able to restrict results to a specified collection, allowing multiple views
// of the same data. This is automatically handled by the database if you use the DB.query ops
// and not the _db objects
class Database {
  constructor(databasePath) {
    this._path = databasePath;
  }

  load(onComplete, progress) {
    // open the databases
    this._db = {};
    var self = this;
    this._db.matches = new Datastore({ filename: this._path + '/matches.db' });
    this._db.heroData = new Datastore({ filename: this._path + '/hero.db' });
    this._db.players = new Datastore({ filename: this._path + '/players.db' });
    this._db.settings = new Datastore({ filename: this._path + '/settings.db' });

    this._db.matches.ensureIndex({ fieldName: 'map' });
    this._db.players.ensureIndex({ fieldName: 'hero' });

    this._collection = null;

    // actual load, tracking errors
    // apologies in advange for these next few lines
    progress('Loading Settings and Collections');
    this._db.settings.loadDatabase(function(err) {
      if (err)
        onComplete(err);
      else {
        progress('Loading Player Index');
        self._db.players.loadDatabase(function (err) {
          if (err)
            onComplete(err);
          else {
            progress('Loading Match Data');
            self._db.matches.loadDatabase(function(err) {
              if (err)
                onComplete(err);
              else {
                progress('Loading Player and Hero Data');
                self._db.heroData.loadDatabase(function(err) {
                  onComplete(err);
                });
              }
            });
          }
        });
      }
    });
  }

  getCollections(callback) {
    this._db.settings.find({type: 'collection'}, callback);
  }

  addCollection(name, onComplete) {
    this._db.settings.insert({
      type: 'collection',
      name: name
    }, onComplete);
  }
  
  deleteCollection(collectionID, onComplete) {
    var self = this;
    this._db.settings.remove({ _id: collectionID }, {}, function(err, removed) {
      self._db.matches.update({collection: collectionID}, { $pull: { collection: collectionID }}, function(err) {
        self._db.heroData.update({collection: collectionID}, { $pull: { collection: collectionID }}, {multi: true}, onComplete);
      });
    });
  }

  // i don't think the next two need callbacks but if so i guess i'll have to add it
  addMatchToCollection(matchID, collectionID) {
    // this actually needs to modify two databases to ensure proper data aggregation
    this._db.matches.update({ _id: matchID }, { $addToSet: { collection: collectionID }});
    this._db.heroData.update({ matchID: matchID }, { $addToSet: { collection: collectionID }}, { multi: true });
  }

  removeMatchFromCollection(matchID, collectionID) {
    this._db.matches.update({ _id: matchID }, { $pull: { collection: collectionID }});
    this._db.heroData.update({ matchID: matchID }, { $pull: { collection: collectionID }}, { multi: true });
  }

  renameCollection(collectionID, name, onComplete) {
    this._db.settings.update({_id: collectionID}, { $set: {name: name}}, onComplete);
  }

  setCollection(collectionID) {
    this._collection = collectionID;
  }

  getCollection() {
    return this._collection;
  }

  // this should have a GUI warning, this code sure won't stop you.
  deleteDB() {
    fs.unlinkSync(this._path + '/matches.db');
    fs.unlinkSync(this._path + '/hero.db');
    fs.unlinkSync(this._path + '/players.db');
    fs.unlinkSync(this._path + '/settings.db');

    delete this._db;
  }

  addReplayToDatabase(file, opts = {}) {
    var data = Parser.processReplay(file, opts);

    if (data.status === Parser.ReplayStatus.OK) {
      // insert match, upsert is used just in case duplicates exist
      this.insertReplay(data.match, data.players);
    }
  }

  insertReplay(match, players, collection) {
    var self = this;

    if (collection) {
      match.collection = [collection];
    }

    // temporary relaxation of match length param for duplicate detection
    this._db.matches.update({ 'map' : match.map, 'date' : match.date, 'type' : match.type }, match, {upsert: true}, function (err, numReplaced, newDoc) {
      if (!newDoc) {
        console.log("Duplicate match found, skipping player update");
      }
      else {
        console.log("Inserted new match " + newDoc._id);

        // update and insert players
        for (var i in players) {
          players[i].matchID = newDoc._id;

          if (collection) {
            players[i].collection = [collection];
          }

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

  // deletes a match and the associated hero data.
  deleteReplay(matchID, callback) {
    var self = this;
    this._db.matches.remove({ _id: matchID }, {}, function(err, numRemoved) {
      self._db.heroData.remove({ matchID: matchID }, { multi: true }, function(err, numRemoved) {
        callback();
      });
    });
  }

  // teams are stored in settings
  addTeam(players, name, callback) {
    this._db.settings.insert({ players, name, type: 'team' }, callback);
  }

  // need to query by id, teams are allowed to have the same name 
  deleteTeam(id, callback) {
    this._db.settings.remove({ _id: id }, callback);
  }

  changeTeamName(id, name, callback) {
    this._db.settings.update({ _id: id} , { $set : { name: name } }, {}, callback);
  }

  updateTeamPlayers(id, players, callback) {
    this._db.settings.update({ _id: id}, { players }, {}, callback);
  }

  addPlayerToTeam(id, player, callback) {
    this._db.settings.update({_id: id}, { $addToSet: { players: player }}, {}, callback);
  }

  removePlayerFromTeam(id, player, callback) {
    this._db.settings.update({_id:id}, { $pull: { players: player}}, {}, callback);
  }

  getAllTeams(callback) {
    this._db.settings.find({type: 'team'}, callback);
  }

  getTeam(id, callback) {
    this._db.settings.findOne({_id: id}, callback);
  }

  // checks to see if all of the given players are on a team
  getTeamByPlayers(players, callback) {
    let query = { $and: []};
    query.type = 'team';

    for (let p of players) {
      query.$and.push({ players: p });
    }

    this._db.settings.find(query, callback);
  }

  getPlayerTeams(id, callback) {
    this._db.settings.find({ type: 'team', players: id }, callback);
  }

  checkDuplicate(file, callback) {
    try {
      let header = Parser.getHeader(file);
      let search = {};

      // duplicate criteria:
      // same type
      search.type = header.type;

      //search.loopLength = data.header.m_elapsedGameLoops;
      
      // same map
      search.map = header.map;

      // same players
      // they should be in identical order but just in case
      search.$and = [];
      for (let p of header.playerIDs) {
        search.$and.push({ playerIDs: p });
      }

      // date within 1 minute
      let dateMin = new Date(header.date.getTime() - 60000);
      let dateMax = new Date(header.date.getTime() + 60000);
      search.$where = function() {
        let d = new Date(this.date);
        return dateMin <= d && d <= dateMax;
      }

      // this is the one raw call that is not preprocessed by collections for what should be somewhat obvious reasons
      this._db.matches.find(search, function(err, docs) {
        callback(docs.length > 0);
      });
    }
    catch (err) {
      callback('Internal Exception');
    }
  }

  // counts the given matches
  countMatches(query, callback) {
    this.preprocessQuery(query);
    this._db.matches.count(query, callback);
  }

  // collections basically add an additional requirement to all player and match related
  // queries.
  preprocessQuery(query) {
    if (this._collection) {
      query.collection = this._collection;
    }
  }

  // retrieves a match from the database using the given query
  getMatches(query, callback, opts = {}) {
    if (opts.collectionOverride !== true) {
      this.preprocessQuery(query);
    }

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

  // updates the entire match
  updateMatch(match, callback) {
    if (callback) {
      this._db.matches.update({ _id: match._id }, match, {}, callback);
    }
    else {
      this._db.matches.update({ _id: match._id }, match, {});
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

    this.preprocessQuery(query);
    this._db.heroData.find(query, callback);
  }

  // returns all hero data entries for the given player id
  getHeroDataForPlayer(playerID, callback) {
    let query = {ToonHandle: playerID};

    this.preprocessQuery(query);
    this._db.heroData.find(query, callback);
  }

  getHeroDataForPlayerWithFilter(playerID, filter, callback) {
    let query = Object.assign({}, filter);
    query.ToonHandle = playerID;

    this.preprocessQuery(query);
    this._db.heroData.find(query, callback);
  }

  getHeroData(query, callback) {
    this.preprocessQuery(query);
    this._db.heroData.find(query, callback);
  }

  getHeroDataForMatches(ids, query, callback) {
    query.$or = [];
    for (let i in ids) {
      query.$or.push({ matchID : ids[i]});
    }

    this.preprocessQuery(query);
    this.getHeroData(query, callback);
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
  // note that players are not part of the collection, so uh, i guess the UI should just not show
  // players with 0 things in the database?
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
    playerDetailStats.withPlayer = {};
    playerDetailStats.withHero = {};
    playerDetailStats.againstPlayer = {};
    playerDetailStats.againstHero = {};
    playerDetailStats.deathHistogram = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    playerDetailStats.takedownHistogram = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    playerDetailStats.skins = {};
    playerDetailStats.awards = {};
    playerDetailStats.highestStreak = 0;
    playerDetailStats.taunts = { 
      bsteps: { count: 0, duration: 0, takedowns: 0, deaths: 0 },
      dances: { count: 0, takedowns: 0, deaths: 0 },
      sprays: { count: 0, takedowns: 0, deaths: 0},
      taunts: { count: 0, takedowns: 0, deaths: 0},
      voiceLines: { count: 0, takedowns: 0, deaths: 0 }
    };

    playerDetailStats.averages = {};
    playerDetailStats.max = {};
    playerDetailStats.min = {};
    playerDetailStats.median = {};
    let medianTemp = {};

    for (let i = 0; i < docs.length; i++) {
      let match = docs[i];
      let statList = DetailStatList.concat(PerMapStatList[match.map]);

      // hero stuff
      if (!(match.hero in playerDetailStats.heroes)) {
        playerDetailStats.heroes[match.hero] = {
          games: 0,
          wins: 0,
          totalAwards: 0,
          stats: { timeDeadPct : 0 },
          awards: {},
          totalTime: 0,
          votes: 0,
          highestStreak: 0
        };
        playerDetailStats.max[match.hero] = { timeDeadPct: 0 };
        playerDetailStats.min[match.hero] = { timeDeadPct: 100 };
        medianTemp[match.hero] = { timeDeadPct: []};
      }

      playerDetailStats.heroes[match.hero].totalTime += match.length;
      playerDetailStats.games += 1;
      playerDetailStats.heroes[match.hero].games += 1;
      playerDetailStats.heroes[match.hero].votes += match.votes;

      if (!(match.map in playerDetailStats.maps))
        playerDetailStats.maps[match.map] = { games: 0, wins: 0 };

      playerDetailStats.maps[match.map].games += 1;

      for (let s in statList) {
        let statName = statList[s];

        // older replays may have missing stats
        if (!(statName in match.gameStats))
          continue;

        if (!(statName in playerDetailStats.heroes[match.hero].stats)) {
          playerDetailStats.heroes[match.hero].stats[statName] = 0;
          playerDetailStats.max[match.hero][statName] = match.gameStats[statName];
          playerDetailStats.min[match.hero][statName] = match.gameStats[statName];
          medianTemp[match.hero][statName] = [];
        }

        // booooo blackheart's
        if (statName === 'BlackheartDoubloonsCollected') {
          // sometimes the replay freaks out and returns a huge integer. Set that to 0 if it happens
          if (match.gameStats[statName] > 200)
            match.gameStats[statName] = 0;
        }
        
        playerDetailStats.heroes[match.hero].stats[statName] += match.gameStats[statName];
        medianTemp[match.hero][statName].push(match.gameStats[statName]);

        if (match.gameStats[statName] > playerDetailStats.max[match.hero][statName])
          playerDetailStats.max[match.hero][statName] = match.gameStats[statName];
        
        if (match.gameStats[statName] < playerDetailStats.min[match.hero][statName])
          playerDetailStats.min[match.hero][statName] = match.gameStats[statName];
      }

      // some extra stats that aren't in the list
      let tdp = match.gameStats.TimeSpentDead / match.length
      playerDetailStats.heroes[match.hero].stats.timeDeadPct += tdp;
      medianTemp[match.hero].timeDeadPct.push(tdp);

      if (tdp > playerDetailStats.max[match.hero].timeDeadPct)
        playerDetailStats.max[match.hero].timeDeadPct = tdp;
      
      if (tdp < playerDetailStats.min[match.hero].timeDeadPct)
        playerDetailStats.min[match.hero].timeDeadPct = tdp;

      //playerDetailStats.heroes[match.hero].stats.highestStreak = Math.max(match.gameStats.HighestKillStreak, playerDetailStats.heroes[match.hero].stats.highestStreak);
      playerDetailStats.highestStreak = Math.max(playerDetailStats.max[match.hero].HighestKillStreak, match.gameStats.HighestKillStreak);

      // you only ever get 1 but just in case...
      // ALSO custom games don't get counted here since you can't get awards
      if (match.mode !== ReplayTypes.GameMode.Custom) {
        playerDetailStats.nonCustomGames += 1;
        if ('awards' in match.gameStats) {
          for (let a in match.gameStats.awards) {
            let awardName = match.gameStats.awards[a];
            if (!(awardName in playerDetailStats.heroes[match.hero].awards))
              playerDetailStats.heroes[match.hero].awards[awardName] = 0;
            
            if (!(awardName in playerDetailStats.awards))
              playerDetailStats.awards[awardName] = 0;

            playerDetailStats.awards[awardName] += 1;
            playerDetailStats.heroes[match.hero].awards[awardName] += 1;
            playerDetailStats.heroes[match.hero].totalAwards += 1;
          }
        }
      }

      // with and against stats
      for (let j = 0; j < match.against.ids.length; j++) {
        if (match.with.ids[j] !== match.ToonHandle) {
          if (!(match.with.ids[j] in playerDetailStats.withPlayer)) {
            playerDetailStats.withPlayer[match.with.ids[j]] = { id: match.with.ids[j], name: match.with.names[j], games: 0, wins: 0 };
          }
          if (!(match.with.heroes[j] in playerDetailStats.withHero)) {
            playerDetailStats.withHero[match.with.heroes[j]] = { name: match.with.heroes[j], games: 0, wins: 0 };
          }

          playerDetailStats.withPlayer[match.with.ids[j]].games += 1;
          playerDetailStats.withHero[match.with.heroes[j]].games += 1;

          if (match.win) {
            playerDetailStats.withPlayer[match.with.ids[j]].wins += 1;
            playerDetailStats.withHero[match.with.heroes[j]].wins += 1;
          }
        }

        if (!(match.against.ids[j] in playerDetailStats.againstPlayer)) {
          playerDetailStats.againstPlayer[match.against.ids[j]] = { id: match.against.ids[j], name: match.against.names[j], games: 0, defeated: 0 };
        }
        if (!(match.against.heroes[j] in playerDetailStats.againstHero)) {
          playerDetailStats.againstHero[match.against.heroes[j]] = { name: match.against.heroes[j], games: 0, defeated: 0 };
        }

        playerDetailStats.againstPlayer[match.against.ids[j]].games += 1;
        playerDetailStats.againstHero[match.against.heroes[j]].games += 1;

        if (match.win) {
          playerDetailStats.againstPlayer[match.against.ids[j]].defeated += 1;
          playerDetailStats.againstHero[match.against.heroes[j]].defeated += 1;
        }
      }

      // taunts
      for (let t in playerDetailStats.taunts) {
        let bm = match[t];

        for (let j = 0; j < bm.length; j++) {
          playerDetailStats.taunts[t].count += 1;
          playerDetailStats.taunts[t].takedowns += bm[j].kills;
          playerDetailStats.taunts[t].deaths += bm[j].deaths;

          if ('duration' in bm[j]) {
            playerDetailStats.taunts[t].duration += bm[j].duration;
          }
        }
      }

      // takedowns
      for (let j = 0; j < match.takedowns.length; j++) {
        playerDetailStats.takedownHistogram[match.takedowns[j].killers.length] += 1;
      }

      for (let j = 0; j < match.deaths.length; j++) {
        playerDetailStats.deathHistogram[match.deaths[j].killers.length] += 1;
      }

      // skins
      if (!(match.skin in playerDetailStats.skins))
        playerDetailStats.skins[match.skin] = { games: 0, wins: 0};
      
      playerDetailStats.skins[match.skin].games += 1;

      if (match.win) {
        playerDetailStats.wins += 1;
        playerDetailStats.maps[match.map].wins += 1;
        playerDetailStats.heroes[match.hero].wins += 1;
        playerDetailStats.skins[match.skin].wins += 1;
      }
    }

    // averages
    playerDetailStats.totalTD = 0;
    playerDetailStats.totalDeaths = 0;
    playerDetailStats.totalMVP = 0;
    playerDetailStats.totalAward = 0;
    playerDetailStats.totalTimeDead = 0;
    playerDetailStats.totalMatchLength = 0;
    playerDetailStats.totalVotes = 0;
    playerDetailStats.avgTimeDeadPct = 0;
    playerDetailStats.total = {};

    for (let h in playerDetailStats.heroes) {
      playerDetailStats.averages[h] = {};
      playerDetailStats.total[h] = {};
      playerDetailStats.median[h] = {};

      for (let s in playerDetailStats.heroes[h].stats) {
        playerDetailStats.total[h][s] = playerDetailStats.heroes[h].stats[s];
        playerDetailStats.averages[h][s] = playerDetailStats.heroes[h].stats[s] / playerDetailStats.heroes[h].games;
        playerDetailStats.median[h][s] = median(medianTemp[h][s]);
      }
      playerDetailStats.heroes[h].stats.totalKDA = playerDetailStats.heroes[h].stats.Takedowns / Math.max(playerDetailStats.heroes[h].stats.Deaths, 1);

      if ('EndOfMatchAwardMVPBoolean' in playerDetailStats.heroes[h].awards) {
        playerDetailStats.heroes[h].stats.MVPPct = playerDetailStats.heroes[h].awards.EndOfMatchAwardMVPBoolean / playerDetailStats.heroes[h].games;
        playerDetailStats.totalMVP += playerDetailStats.heroes[h].awards.EndOfMatchAwardMVPBoolean;
      }
      else {
        playerDetailStats.heroes[h].stats.MVPPct = 0;
      }

      playerDetailStats.heroes[h].stats.AwardPct = playerDetailStats.heroes[h].totalAwards / playerDetailStats.heroes[h].games;
      playerDetailStats.totalAward += playerDetailStats.heroes[h].totalAwards;
      playerDetailStats.totalDeaths += playerDetailStats.heroes[h].stats.Deaths;
      playerDetailStats.totalTD += playerDetailStats.heroes[h].stats.Takedowns;
      playerDetailStats.totalTimeDead += playerDetailStats.heroes[h].stats.TimeSpentDead;
      playerDetailStats.totalMatchLength += playerDetailStats.heroes[h].totalTime;
      playerDetailStats.totalVotes += playerDetailStats.heroes[h].votes;
      playerDetailStats.avgTimeDeadPct += playerDetailStats.heroes[h].stats.timeDeadPct;
    }
    playerDetailStats.avgTimeDeadPct /= playerDetailStats.games;

    return playerDetailStats;
  }

  // hero data is separated by hero, if you need the total stuff, use this function
  // returns: all stats in the 'average' fields 
  allAverageHeroData(data) {
    let stats = {};
    for (let h in data.total) {
      for (let s in data.total[h]) {
        if (!(s in stats))
          stats[s] = 0;
        
        stats[s] += data.total[h][s];
      }
    }

    for (let s in stats) {
      stats[s] /= data.games;
    }

    return stats;
  }

  // this is intended to be used with only one hero but can be used with multiple (?)
  summarizeTalentData(docs) {
    let talentStats = {};
    let buildStats = {};

    for (let d in docs) {
      let match = docs[d];

      if (!(match.hero in talentStats)) {
        talentStats[match.hero] = {};
      }

      if (!(match.hero in buildStats)) {
        buildStats[match.hero] = {};
      }

      let key = '';
      for (let t in match.talents) {
        key += match.talents[t];

        if (!(t in talentStats[match.hero])) {
          talentStats[match.hero][t] = {};
        }

        if (!(match.talents[t] in talentStats[match.hero][t])) {
          talentStats[match.hero][t][match.talents[t]] = { games: 0, wins: 0};
        }

        talentStats[match.hero][t][match.talents[t]].games += 1;
        
        if (match.win) {
          talentStats[match.hero][t][match.talents[t]].wins += 1;
        }
      }

      if (!(key in buildStats[match.hero])) {
        buildStats[match.hero][key] = { games: 0, wins: 0, matches: [], talents: match.talents };
      }
      buildStats[match.hero][key].games += 1;
      buildStats[match.hero][key].matches.push(match.matchID);

      if (match.win) {
        buildStats[match.hero][key].wins += 1;
      }
    }

    return { talentStats, buildStats };
  }

  // get average stats by player (not by hero)
  // otherwise this is basically summarizeHeroData but it doesn't track some stuff 
  summarizePlayerData(docs) {
    let playerDetailStats = {};

    for (let i = 0; i < docs.length; i++) {
      let match = docs[i];
      let statList = DetailStatList.concat(PerMapStatList[match.map]);

      // set up the player object
      if (!(match.ToonHandle in playerDetailStats)) {
        playerDetailStats[match.ToonHandle] = {
          games: 0,
          wins: 0,
          stats: {
            timeDeadPct: 0
          },
          name: match.name,
          awards: {},
          totalAwards : 0,
          taunts: { 
            bsteps: { count: 0, duration: 0, takedowns: 0, deaths: 0 },
            dances: { count: 0, takedowns: 0, deaths: 0 },
            sprays: { count: 0, takedowns: 0, deaths: 0 },
            taunts: { count: 0, takedowns: 0, deaths: 0 },
            voiceLines: { count: 0, takedowns: 0, deaths: 0 }
          },
          heroes: { },
          totalTime: 0,
          votes: 0,
          highestStreak: 0,
          min: { timeDeadPct: 100 },
          max: { timeDeadPct: 0 },
          total: { timeDeadPct: 0 },
          medianTmp: { timeDeadPct: [] }
        }
      }

      playerDetailStats[match.ToonHandle].games += 1;
      playerDetailStats[match.ToonHandle].totalTime += match.length;
      playerDetailStats[match.ToonHandle].votes += match.votes;

      if (!(match.hero in playerDetailStats[match.ToonHandle].heroes))
        playerDetailStats[match.ToonHandle].heroes[match.hero] = 0;
      playerDetailStats[match.ToonHandle].heroes[match.hero] += 1;

      for (let s in statList) {
        let statName = statList[s];

        // older replays may be missing stats
        if (!(statName in match.gameStats))
          continue;

        if (!(statName in playerDetailStats[match.ToonHandle].stats)) {
          playerDetailStats[match.ToonHandle].stats[statName] = 0;
          playerDetailStats[match.ToonHandle].max[statName] = match.gameStats[statName];
          playerDetailStats[match.ToonHandle].min[statName] = match.gameStats[statName];
          playerDetailStats[match.ToonHandle].total[statName] = match.gameStats[statName];
          playerDetailStats[match.ToonHandle].medianTmp[statName] = [];
        }
        
        playerDetailStats[match.ToonHandle].stats[statName] += match.gameStats[statName];
        playerDetailStats[match.ToonHandle].total[statName] += match.gameStats[statName];
        playerDetailStats[match.ToonHandle].medianTmp[statName].push(match.gameStats[statName]);

        if (match.gameStats[statName] > playerDetailStats[match.ToonHandle].max[statName])
          playerDetailStats[match.ToonHandle].max[statName] = match.gameStats[statName];
        
        if (match.gameStats[statName] < playerDetailStats[match.ToonHandle].min[statName])
          playerDetailStats[match.ToonHandle].min[statName] = match.gameStats[statName];
      }
      let tdp = match.gameStats.TimeSpentDead / match.length;
      playerDetailStats[match.ToonHandle].stats.timeDeadPct += tdp;
      playerDetailStats[match.ToonHandle].total.timeDeadPct += tdp; // ??
      playerDetailStats[match.ToonHandle].medianTmp.timeDeadPct.push(tdp);

      if (tdp > playerDetailStats[match.ToonHandle].max.timeDeadPct)
        playerDetailStats[match.ToonHandle].max.timeDeadPct = tdp;

      if (tdp < playerDetailStats[match.ToonHandle].min.timeDeadPct)
        playerDetailStats[match.ToonHandle].min.timeDeadPct = tdp;

      playerDetailStats[match.ToonHandle].highestStreak = Math.max(match.gameStats.HighestKillStreak, playerDetailStats[match.ToonHandle].highestStreak);

      // you only ever get 1 but just in case...
      // ALSO custom games don't get counted here since you can't get awards
      if (match.mode !== ReplayTypes.GameMode.Custom) {
        if ('awards' in match.gameStats) {
          for (let a in match.gameStats.awards) {
            let awardName = match.gameStats.awards[a];
            if (!(awardName in playerDetailStats[match.ToonHandle].awards))
              playerDetailStats[match.ToonHandle].awards[awardName] = 0;

            playerDetailStats[match.ToonHandle].awards[awardName] += 1;
            playerDetailStats[match.ToonHandle].totalAwards += 1;
          }
        }
      }

      // taunts
      for (let t in playerDetailStats[match.ToonHandle].taunts) {
        let bm = match[t];

        for (let j = 0; j < bm.length; j++) {
          playerDetailStats[match.ToonHandle].taunts[t].count += 1;
          playerDetailStats[match.ToonHandle].taunts[t].takedowns += bm[j].kills;
          playerDetailStats[match.ToonHandle].taunts[t].deaths += bm[j].deaths;

          if ('duration' in bm[j]) {
            playerDetailStats[match.ToonHandle].taunts[t].duration += bm[j].duration;
          }
        }
      }

      if (match.win) {
        playerDetailStats[match.ToonHandle].wins += 1;
      }
    }

    // averages
    for (let p in playerDetailStats) {
      playerDetailStats[p].averages = {};
      playerDetailStats[p].median = {};
      playerDetailStats[p].totalTD = 0;
      playerDetailStats[p].totalDeaths = 0;
      playerDetailStats[p].totalMVP = 0;
      playerDetailStats[p].totalAward = 0;
      playerDetailStats[p].totalMatchLength = 0;
      playerDetailStats[p].totalTimeDead = 0;

      for (let s in playerDetailStats[p].stats) {
        playerDetailStats[p].averages[s] = playerDetailStats[p].stats[s] / playerDetailStats[p].games;
        playerDetailStats[p].median[s] = median(playerDetailStats[p].medianTmp[s]);
        
      }
      playerDetailStats[p].totalKDA = playerDetailStats[p].stats.Takedowns / Math.max(playerDetailStats[p].stats.Deaths, 1);

      if ('EndOfMatchAwardMVPBoolean' in playerDetailStats[p].awards) {
        playerDetailStats[p].stats.MVPPct = playerDetailStats[p].awards.EndOfMatchAwardMVPBoolean / playerDetailStats[p].games;
        playerDetailStats[p].totalMVP += playerDetailStats[p].awards.EndOfMatchAwardMVPBoolean;
      }
      else {
        playerDetailStats[p].stats.MVPPct = 0;
      }

      playerDetailStats[p].stats.AwardPct = playerDetailStats[p].totalAwards / playerDetailStats[p].games;
      playerDetailStats[p].totalAward += playerDetailStats[p].totalAwards;
      playerDetailStats[p].totalDeaths += playerDetailStats[p].stats.Deaths;
      playerDetailStats[p].totalTD += playerDetailStats[p].stats.Takedowns;
      playerDetailStats[p].totalMatchLength += playerDetailStats[p].totalTime;
      playerDetailStats[p].totalTimeDead += playerDetailStats[p].stats.TimeSpentDead;
    }

    return playerDetailStats;
  }

  // this returns an object containing hero name and various pick
  // and win stats for the given collection of matches
  // need a heroes talents instance to process the bans
  // it also returns various team related stats
  summarizeMatchData(docs, HeroesTalents) {
    let data = {};
    data.totalMatches = docs.length;
    data.totalBans = 0;
    let heroDataTemplate = {
      wins: 0,
      bans: {
        first: 0,
        second: 0,
        total: 0
      },
      games: 0,
      involved: 0,
      picks: {
        round1: { count: 0, wins: 0},
        round2: { count: 0, wins: 0},
        round3: { count: 0, wins: 0}
      }
    };

    // keyed by a sorted concatenated string of hero roles
    let compositions = {};

    for (let match of docs) {
      let winner = match.winner;

      for (let t in [0, 1]) {
        let teamHeroes = match.teams[t].heroes;
        let comp = [];

        for (let h in teamHeroes) {
          let hero = teamHeroes[h];

          if (!(hero in data)) {
            data[hero] = {
              wins: 0,
              bans: {
                first: 0,
                second: 0,
                total: 0
              },
              games: 0,
              involved: 0,
              picks: {
                round1: { count: 0, wins: 0},
                round2: { count: 0, wins: 0},
                round3: { count: 0, wins: 0}
              }
            };
          }
          comp.push(Heroes.role(hero));

          data[hero].games += 1;
          data[hero].involved += 1;
          if (parseInt(t) === winner) {
            data[hero].wins += 1;
          }
        }

        comp.sort();
        let key = comp.join('-');
        
        if (!(key in compositions)) {
          compositions[key] = { games: 0, wins: 0, roles: comp };
        }

        compositions[key].games += 1;
        compositions[key].wins += parseInt(t) === winner ? 1 : 0;
      }

      if ('picks' in match) {
        let pickData = match.picks;
        
        if (pickData[0].length === 5 && pickData[1].length === 5) {
          let first = pickData.first;
          let second = first === 0 ? 1 : 0;

          // explicitly recreate pick order
          data[pickData[first][0]].picks.round1.count += 1;
          data[pickData[first][1]].picks.round2.count += 1;
          data[pickData[first][2]].picks.round2.count += 1;
          data[pickData[first][3]].picks.round3.count += 1;
          data[pickData[first][4]].picks.round3.count += 1;

          data[pickData[second][0]].picks.round1.count += 1;
          data[pickData[second][1]].picks.round1.count += 1;
          data[pickData[second][2]].picks.round2.count += 1;
          data[pickData[second][3]].picks.round2.count += 1;
          data[pickData[second][4]].picks.round3.count += 1;

          if (first === winner) {
            data[pickData[first][0]].picks.round1.wins += 1;
            data[pickData[first][1]].picks.round2.wins += 1;
            data[pickData[first][2]].picks.round2.wins += 1;
            data[pickData[first][3]].picks.round3.wins += 1;
            data[pickData[first][4]].picks.round3.wins += 1;
          }
          else {
            data[pickData[second][0]].picks.round1.wins += 1;
            data[pickData[second][1]].picks.round1.wins += 1;
            data[pickData[second][2]].picks.round2.wins += 1;
            data[pickData[second][3]].picks.round2.wins += 1;
            data[pickData[second][4]].picks.round3.wins += 1;
          }
        }
        else {
          console.log('Match ' + match._id + ' missing full pick order, excluding from results');
        }
      }

      for (let t in match.bans) {
        for (let b in match.bans[t]) {
          try {
            // typically this means they didn't ban
            if (match.bans[t][b].hero === '') {
              continue;
            }

            let hero = HeroesTalents.heroNameFromAttr(match.bans[t][b].hero);

            if (!(hero in data)) {
              data[hero] = {
                wins: 0,
                bans: {
                  first: 0,
                  second: 0,
                  total: 0
                },
                games: 0,
                involved: 0,
                picks: {
                  round1: { count: 0, wins: 0},
                  round2: { count: 0, wins: 0},
                  round3: { count: 0, wins: 0}
                }
              };
            }

            if (match.bans[t][b].order === 1) {
              data[hero].bans.first += 1;
            }
            else if (match.bans[t][b].order === 2) {
              data[hero].bans.second += 1;
            }

            data[hero].involved += 1;
            data[hero].bans.total += 1;
            data.totalBans += 1;
          }
          catch (e) {
            console.log(e);
          }
        }
      }
    }

    return { data, compositions };
  }

  // special version of summarize match data that only pulls stats from one of the teams
  summarizeTeamData(team, docs, HeroesTalents) {
    let data = {};
    data.totalMatches = docs.length;
    data.wins = 0;
    data.totalBans = 0;
    data.heroes = {};
    data.stats = {
      average: {},
      min: {},
      max: {},
      median: {},
      medianTmp: {},
      total: {}
    };
    data.maps = {};
    data.level10Games = 0;
    data.level20Games = 0;
    data.structures = {};
    data.takedowns = {
      average: 0,
      total: 0,
      min: 1e10,
      max: 0,
      medianTmp: []
    };
    data.deaths = { 
      average: 0,
      total: 0,
      min: 1e10,
      max: 0,
      medianTmp: []
    }
    data.matchLength = {
      total: 0,
      min: 1e10,
      max: 0,
      medianTmp: []
    };
    data.tierTimes = {
      T1: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T2: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T3: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T4: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T5: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T6: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 }
    };
    for (let match of docs) {
      let winner = match.winner;

      // determine what team we want
      let t;
      let count = 0;
      let required = team.players.length > 5 ? 5 : team.players.length;
      for (let i in match.teams[0].ids) {
        if (team.players.indexOf(match.teams[0].ids[i]) >= 0)
          count += 1;
      }

      if (count === required)
        t = 0;
      else {
        count = 0;
        for (let i in match.teams[1].ids) {
          if (team.players.indexOf(match.teams[1].ids[i]) >= 0)
            count += 1;
        }

        if (count === required)
          t = 1;
        else
          continue;
      }

      if (!(match.map in data.maps)) {
        data.maps[match.map] = { games: 0, wins: 0 };
      }
      data.maps[match.map].games += 1;
      if (t === winner) {
        data.maps[match.map].wins += 1;
        data.wins += 1;
      }

      data.matchLength.total += match.length;
      data.matchLength.min = Math.min(data.matchLength.min, match.length);
      data.matchLength.max = Math.max(data.matchLength.max, match.length);
      data.matchLength.medianTmp.push(match.length);

      data.takedowns.total += match.teams[t].takedowns;
      data.takedowns.min = Math.min(match.teams[t].takedowns, data.takedowns.min);
      data.takedowns.max = Math.max(match.teams[t].takedowns, data.takedowns.max);
      data.takedowns.medianTmp.push(match.teams[t].takedowns);

      let deaths = t === 0 ? match.teams[1].takedowns : match.teams[0].takedowns;
      data.deaths.total += deaths;
      data.deaths.min = Math.min(deaths, data.deaths.min);
      data.deaths.max = Math.max(deaths, data.deaths.max);
      data.deaths.medianTmp.push(deaths);

      let teamHeroes = match.teams[t].heroes;

      for (let h in teamHeroes) {
        let hero = teamHeroes[h];

        if (!(hero in data.heroes)) {
          data.heroes[hero] = {
            first: 0,
            second: 0,
            wins: 0,
            bans: 0,
            games: 0,
            involved: 0,
            gamesAgainst: 0,
            defeated: 0,
            picks: {
              round1: { count: 0, wins: 0},
              round2: { count: 0, wins: 0},
              round3: { count: 0, wins: 0}
            }
          };
        }

        data.heroes[hero].games += 1;
        data.heroes[hero].involved += 1;
        if (t === winner) {
          data.heroes[hero].wins += 1;
        }
      }

      // pick order
      if ('picks' in match) {
        let picks = match.picks[t];
        let first = match.picks.first === t;

        if (picks.length === 5) {
          if (first) {
            data.heroes[picks[0]].picks.round1.count += 1;
            data.heroes[picks[1]].picks.round2.count += 1;
            data.heroes[picks[2]].picks.round2.count += 1;
            data.heroes[picks[3]].picks.round3.count += 1;
            data.heroes[picks[4]].picks.round3.count += 1;

            if (t === winner) {
              data.heroes[picks[0]].picks.round1.wins += 1;
              data.heroes[picks[1]].picks.round2.wins += 1;
              data.heroes[picks[2]].picks.round2.wins += 1;
              data.heroes[picks[3]].picks.round3.wins += 1;
              data.heroes[picks[4]].picks.round3.wins += 1;
            }
          }
          else {
            data.heroes[picks[0]].picks.round1.count += 1;
            data.heroes[picks[1]].picks.round1.count += 1;
            data.heroes[picks[2]].picks.round2.count += 1;
            data.heroes[picks[3]].picks.round2.count += 1;
            data.heroes[picks[4]].picks.round3.count += 1;

            if (t === winner) {
              data.heroes[picks[0]].picks.round1.wins += 1;
              data.heroes[picks[1]].picks.round1.wins += 1;
              data.heroes[picks[2]].picks.round2.wins += 1;
              data.heroes[picks[3]].picks.round2.wins += 1;
              data.heroes[picks[4]].picks.round3.wins += 1;
            }
          }
        }
      }

      let otherTeamHeroes = t === 0 ? match.teams[1].heroes : match.teams[0].heroes;
      for (let h in otherTeamHeroes) {
        let hero = otherTeamHeroes[h];
        if (!(hero in data.heroes)) {
          data.heroes[hero] = {
            first: 0,
            second: 0,
            wins: 0,
            bans: 0,
            games: 0,
            involved: 0,
            gamesAgainst: 0,
            defeated: 0,
            picks: {
              round1: { count: 0, wins: 0},
              round2: { count: 0, wins: 0},
              round3: { count: 0, wins: 0}
            }
          };
        }
        data.heroes[hero].gamesAgainst += 1;
        if (t === winner) {
          data.heroes[hero].defeated += 1;
        }
      }

      try {
        for (let b in match.bans[t]) {
          // typically this means they didn't ban
          if (match.bans[t][b].hero === '') {
            continue;
          }

          let hero = HeroesTalents.heroNameFromAttr(match.bans[t][b].hero);

          if (!(hero in data.heroes)) {
            data.heroes[hero] = {
              first: 0,
              second: 0,
              wins: 0,
              bans: 0,
              games: 0,
              involved: 0,
              gamesAgainst: 0,
              defeated: 0,
              picks: {
                round1: { count: 0, wins: 0},
                round2: { count: 0, wins: 0},
                round3: { count: 0, wins: 0}
              }
            };
          }

          data.heroes[hero].involved += 1;
          data.heroes[hero].bans += 1;
          data.totalBans += 1;

          if (match.bans[t][b].order === 1) {
            data.heroes[hero].first += 1;
          }
          else if (match.bans[t][b].order === 2) {
            data.heroes[hero].second += 1;
          }
        }
      }
      catch (e) {
        // usually thrown for quick match. if picks aren't being recorded, uncomment this.
        //console.log(e);
      }

      // stat aggregation
      for (let stat in match.teams[t].stats) {
        if (stat === 'structures') {
          for (let struct in match.teams[t].stats.structures) {
            if (!(struct in data.structures)) {
              data.structures[struct] = {
                destroyed: 0,
                first: 0,
                lost: 0,
                gamesWithFirst: 0
              }
            }

            data.structures[struct].destroyed += match.teams[t].stats.structures[struct].destroyed;
            data.structures[struct].lost += match.teams[t].stats.structures[struct].lost;

            if (match.teams[t].stats.structures[struct].destroyed > 0) {
              data.structures[struct].first += match.teams[t].stats.structures[struct].first;
              data.structures[struct].gamesWithFirst += 1;
            }
          }
        }
        else if (stat === 'totals') {
          for (let total in match.teams[t].stats.totals) {
            if (!(total in data.stats.total)) {
              data.stats.total[total] = 0;
              data.stats.min[total] = match.teams[t].stats.totals[total];
              data.stats.max[total] = match.teams[t].stats.totals[total];
              data.stats.medianTmp[total] = [];
            }

            data.stats.total[total] += match.teams[t].stats.totals[total];

            data.stats.min[total] = Math.min(data.stats.min[total], match.teams[t].stats.totals[total]);
            data.stats.max[total] = Math.max(data.stats.max[total], match.teams[t].stats.totals[total]);
            data.stats.medianTmp[total].push(match.teams[t].stats.totals[total]);
          }
        }
        else {
          if (!(stat in data.stats.total)) {
            data.stats.total[stat] = 0;

            data.stats.min[stat] = match.teams[t].stats[stat];
            data.stats.max[stat] = match.teams[t].stats[stat];
            data.stats.medianTmp[stat] = [];
          
          }
          data.stats.total[stat] += match.teams[t].stats[stat];
          data.stats.min[stat] = Math.min(data.stats.min[stat], match.teams[t].stats[stat]);
          data.stats.max[stat] = Math.max(data.stats.max[stat], match.teams[t].stats[stat]);
          data.stats.medianTmp[stat].push(match.teams[t].stats[stat]);
        }

        if (stat === 'timeTo10') {
          data.level10Games += 1;
        }
        
        if (stat === 'timeTo20') {
          data.level20Games += 1;
        }
      }

      // time per talent tier
      let intervals = [[1, 4], [4, 7], [7, 10], [10, 13], [13, 16], [16, 20]];
      let levels = match.levelTimes[t];
      for (let i = 0; i < intervals.length; i++) {
        let ikey = 'T' + (i + 1);
        let interval = intervals[i];
        let time;

        if (interval[1] in levels) {
          time = levels[interval[1]].time - levels[interval[0]].time;
          data.tierTimes[ikey].total += time;
          data.tierTimes[ikey].min = Math.min(time, data.tierTimes[ikey].min);
          data.tierTimes[ikey].max = Math.max(time, data.tierTimes[ikey].max);
          data.tierTimes[ikey].medianTmp.push(time);
          data.tierTimes[ikey].count += 1;
        }
        else if (interval[0] in levels && !(interval[1] in levels)) {
          // end of game
          time = match.length - levels[interval[0]].time;
          data.tierTimes[ikey].total += time;
          data.tierTimes[ikey].min = Math.min(time, data.tierTimes[ikey].min);
          data.tierTimes[ikey].max = Math.max(time, data.tierTimes[ikey].max);
          data.tierTimes[ikey].medianTmp.push(time);
          data.tierTimes[ikey].count += 1;
        }
      }
    }

    for (let stat in data.stats.total) {
      if (stat === 'timeTo10')
        data.stats.average[stat] = data.stats.total[stat] / data.level10Games;
      else if (stat === 'timeTo20')
        data.stats.average[stat] = data.stats.total[stat] / data.level20Games;
      else
        data.stats.average[stat] = data.stats.total[stat] / data.totalMatches;

      // median
      data.stats.median[stat] = median(data.stats.medianTmp[stat]);
    }
    data.matchLength.average = data.matchLength.total / data.totalMatches;
    data.matchLength.median = median(data.matchLength.medianTmp);

    for (let tier in data.tierTimes) {
      data.tierTimes[tier].average = data.tierTimes[tier].total / Math.max(data.tierTimes[tier].count, 1);

      // median
      data.tierTimes[tier].median = median(data.tierTimes[tier].medianTmp);
    }

    data.takedowns.median = median(data.takedowns.medianTmp);
    data.takedowns.average = data.takedowns.total / data.totalMatches;

    data.deaths.median = median(data.deaths.medianTmp);
    data.deaths.average = data.deaths.total / data.totalMatches;

    // hero count
    data.heroesPlayed = 0;
    for (let h in data.heroes) {
      if (data.heroes[h].games > 0)
        data.heroesPlayed += 1;
    }

    return data;
  }

  // mapData data
  summarizeMapData(docs) {
    let stats = {};

    for (let match of docs) {
      let map = match.map;

      if (!(map in stats)) {
        stats[map] = { 
          min: 1e10,
          minId: null,
          max: 0,
          maxId: null,
          total: 0,
          games: 0,
          firstObjectiveWins: 0,
          medianTmp: [],
          blueWin: 0,
          redWin: 0,
          firstPickWin: 0,
          draftGames: 0
        }
      }

      stats[map].games += 1;
      stats[map].total += match.length;
      stats[map].medianTmp.push(match.length);
      
      if (match.bans)
        stats[map].draftGames += 1;

      // min/max
      if (match.length < stats[map].min) {
        stats[map].min = match.length;
        stats[map].minId = match._id;
      }

      if (match.length > stats[map].max) {
        stats[map].max = match.length;
        stats[map].maxId = match._id;
      }

      // first objective win
      if (match.firstObjectiveWin === true)
        stats[map].firstObjectiveWins += 1;
      
      if (match.firstPickWin === true)
        stats[map].firstPickWin += 1;

      if (match.winner === 0)
        stats[map].blueWin += 1;
      else
        stats[map].redWin += 1;
    }

    let aggregate = {
      min: 1e10,
      minId: null,
      max: 0,
      maxId: null,
      total: 0,
      games: 0,
      firstObjectiveWins: 0,
      medianTmp: [],
      blueWin: 0,
      redWin: 0,
      firstPickWin: 0,
      draftGames: 0
    };

    for (let map in stats) {
      stats[map].average = stats[map].total / stats[map].games;
      stats[map].median = median(stats[map].medianTmp);
      
      if (stats[map].min < aggregate.min) {
        aggregate.min = stats[map].min;
        aggregate.minId = stats[map].minId;
      }

      if (stats[map].max > aggregate.max) {
        aggregate.max = stats[map].max;
        aggregate.maxId = stats[map].maxId;
      }

      aggregate.total += stats[map].total;
      aggregate.games += stats[map].games;
      aggregate.draftGames += stats[map].draftGames;
      aggregate.firstObjectiveWins += stats[map].firstObjectiveWins;
      aggregate.blueWin += stats[map].blueWin;
      aggregate.redWin += stats[map].redWin;
      aggregate.firstPickWin += stats[map].firstPickWin;
      aggregate.medianTmp = aggregate.medianTmp.concat(stats[map].medianTmp);
    }

    aggregate.median = median(aggregate.medianTmp);
    aggregate.average = aggregate.total / aggregate.games;

    return { stats, aggregate };
  }

  // returns a list of versions in the database along with
  // a formatted string for each of them.
  getVersions(callback) {
    let query = {};
    this.preprocessQuery(query);
    this._db.matches.find(query, {version: 1}, function(err, docs) {
      let versions = {}

      for (let doc of docs) {
        versions[doc.version.m_build] = doc.version.m_major + '.' + doc.version.m_minor + '.' + doc.version.m_revision + ' (build ' + doc.version.m_build + ')';
      }

      callback(versions);
    });
  }

  // the DB is versioned based on the parser's current version number.
  getDBVersion(callback) {
    var self = this;
    this._db.settings.findOne({type: 'version'}, function(err, ver) {
      if (!ver) {
        // non-existence of version is assumed to mean a new database
        // initialize with current version
        self._db.settings.insert({type: 'version', version: Parser.VERSION }, function(err, inserted) {
          callback(inserted.version);
        });
      }
      else {
        callback(ver.version);
      }
    });
  }

  // this may turn into upgrade functions eventually but for now we'll just do this
  setDBVersion(version, callback) {
    this._db.settings.update({type: 'version'}, { $set: {version: version} }, {}, function(err, updated) {
      // basically an on complete callback
      if (callback)
        callback();
    });
  }

  // given a collection ID, returnes the cached heroData summary for the collection.
  // If the cached item does not exist or is out of date, this function will create it,
  // cache it, then execute the specified callback
  // Cached data is over the entire database, and is not modifiable for now
  getCachedCollectionHeroStats(collectionID, callback) {
    // check for existence and consistency
    let query = {};
    if (collectionID) {
      query.collection = collectionID;
    }

    // get the data
    var self = this;
    this._db.heroData.count(query, function(err, heroDataCount) {
      let cid = collectionID ? collectionID : 'all';

      self._db.settings.find({ type: 'cache', collectionID: cid }, function(err, docs) {
        if (docs.length === 0 || docs[0].docLength !== heroDataCount) {
          // no docs exist or data is out of date, recompute
          self._db.heroData.find(query, function(err, heroData) {
            console.log('recaching for collection ' + cid);

            let hdata = self.summarizeHeroData(heroData);
            
            // don't save these
            delete hdata.rawDocs;
            let cache = {};

            // NeDB doesn't allow fields with '.' in it which is a problem for E.T.C. and others, so i will
            // just live with the knowledge that I wrote this line and will have to live with my sins
            cache.heroData = JSON.stringify(hdata);
            cache.docLength = heroDataCount;
            cache.type = 'cache';
            cache.collectionID = cid;

            self._db.settings.update({ type: 'cache', collectionID: cid }, cache, { upsert: true }, function(err, num, up) {
              cache.heroData = JSON.parse(cache.heroData);
              callback(cache);
            });
          });
        }
        else {
          let cache = docs[0];
          cache.heroData = JSON.parse(cache.heroData);

          callback(cache);
        }
      });
    });
  }

  getExternalCacheCollections(callback) {
    this._db.settings.find({ type: 'externalCache' }, callback);
  }

  getExternalCacheCollectionHeroStats(collectionID, callback) {
    this._db.settings.find({ type: 'externalCache',  _id: collectionID }, function(err, docs) {
      if (docs.length > 0) {
        let cache = docs[0];
        cache.heroData = JSON.parse(cache.heroData);
        callback(cache);
      }
      else {
        callback();
      }
    });
  }

  // dumps summarized hero data for each collection in the other database.
  // requires a bit of memory...
  cacheExternalDatabase(path, name, callback) {
    // load
    let self = this;
    let tempDB = new Database(path);

    tempDB.load(function() {
      tempDB.getCollections(function(err, collections) {
        tempDB.getHeroData({}, function(err, heroData) {
          let hdata = tempDB.summarizeHeroData(heroData);

          delete hdata.rawDocs;
          let cache = {};
          cache.dbName = name;
          cache.name = name;
          cache.type = 'externalCache';
          cache.collectionID = 'all';
          cache.heroData = JSON.stringify(hdata);

          self._db.settings.update({ type: 'externalCache', dbName: cache.dbName, name: cache.name }, cache, { upsert: true }, function(err, num, up) {
            if (collections.length > 0) {
              self.processExternalCaches(collections.pop(), name, collections, tempDB, callback);
            }
            else {
              callback();
            }
          })
        });
      });
    }, function(log) { console.log(log) ; })
  }

  processExternalCaches(current, dbName, collections, tempDB, final) {
    let self = this;
    tempDB.getHeroData({collection: current._id}, function(err, heroData) {
      let hdata = tempDB.summarizeHeroData(heroData);

      delete hdata.rawDocs;
      let cache = {};
      cache.dbName = dbName;
      cache.name = current.name;
      cache.type = 'externalCache';
      cache.collectionID = current._id;
      cache.heroData = JSON.stringify(hdata);

      self._db.settings.update({ type: 'externalCache', dbName: cache.dbName, name: cache.name }, cache, { upsert: true }, function(err, num, up) {
        if (collections.length === 0) {
          final();
        }
        else {
          self.processExternalCaches(collections.pop(), dbName, collections, tempDB, final);
        }
      })
    })
  }

  // external cache stuff
  deleteExternalCache(dbName, callback) {
    this._db.settings.remove({ dbName: dbName, type: 'externalCache' }, { multi: true }, function(err, numRemoved) {
      if (err)
        console.log(err);

      if (callback)
        callback();
    });
  }
}

function median(arr) {
  let len = arr.length;
  arr.sort(function(a,b) { return a - b; });

  if (len % 2 === 0) {
    return (arr[len / 2 - 1] + arr[len / 2]) / 2;
  }

  return arr[(len - 1) / 2];
}

exports.HeroesDatabase = Database;