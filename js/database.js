/* jshint esversion: 6, maxerr: 1000, node: true */
// this is the main database connector used by the app
// storage model is a persistent LinvoDB with medeadown as the store

// libraries
const Parser = require('../hots-parser/parser.js');
const fs = require('fs-extra');

const summarizeHeroData = require('./database/summarize-hero-data');

// databases are loaded from the specified folder when the database object is created
//var Datastore = require('nedb');
const LinvoDB = require('linvodb3');
const medea = require('medea');
LinvoDB.defaults.store = { db: require('medeadown') };

const ImportType = {
  Matches: 1,
  Collections: 2,
  Teams: 3
};

// ok so you should never call raw db ops on the _db object unless you are debugging.
// the Database is able to restrict results to a specified collection, allowing multiple views
// of the same data. This is automatically handled by the database if you use the DB.query ops
// and not the _db objects
class Database {
  constructor(databasePath) {
    this._path = databasePath;
    LinvoDB.dbPath = this._path;
  }

  compactDB(store, callback) {
    let mdb = medea();
    mdb.open(this._path + '/' + store + '.ldb', function(err) {
      if (err) {
        console.log(err);
        callback();
        return;
      }
      
      mdb.compact(function(err) {
        if (err) {
          console.log(err);
        }

        mdb.close(callback);
      });
    });
  }

  close(callback) {
    var self = this;
    this._db.heroData.store.close(function () {
      self._db.matches.store.close(function () {
        self._db.players.store.close(function () {
          self._db.settings.store.close(function () {
            callback();
          });
        });
      });
    });
  }

  destroy(callback) {
    var self = this;
    medea.destroy(path.join(self._path, 'matches.ldb'), function() {
      medea.destroy(path.join(self._path, 'hero.ldb'), function() {
        medea.destroy(path.join(self._path, 'players.ldb'), function() {
          medea.destroy(path.join(self._path, 'settings.ldb'), function() {
            callback();
          });
        });
      });
    });
  }

  compactAndReload(callback) {
    var self = this;
    this._db.heroData.store.close(function () {
      self._db.matches.store.close(function () {
        self._db.players.store.close(function () {
          self._db.settings.store.close(function () {
            delete self._db;
            self.compactDB('matches', function() {
              self.compactDB('hero', function() {
                self.compactDB('players', function() {
                  self.compactDB('settings', function() {
                    self._db = {};
                    self._db.matches = new LinvoDB('matches', {}, { filename: self._path + '/matches.ldb' });
                    self._db.heroData = new LinvoDB('heroData', {}, { filename: self._path + '/hero.ldb' });
                    self._db.players = new LinvoDB('players', {}, { filename: self._path + '/players.ldb' });
                    self._db.settings = new LinvoDB('settings', {}, { filename: self._path + '/settings.ldb' });
        
                    self._db.matches.ensureIndex({ fieldName: 'map' });
                    self._db.heroData.ensureIndex({ fieldName: 'hero' });
                    self._db.players.ensureIndex({ fieldName: 'hero' });
        
                    self._collection = null;
                    callback();
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  load(onComplete, progress) {
    // open the databases
    this._db = {};
    var self = this;
    progress('Opening Database');

    self._db.matches = new LinvoDB('matches', {}, { filename: self._path + '/matches.ldb' });
    self._db.heroData = new LinvoDB('heroData', {}, { filename: self._path + '/hero.ldb' });
    self._db.players = new LinvoDB('players', {}, { filename: self._path + '/players.ldb' });
    self._db.settings = new LinvoDB('settings', {}, { filename: self._path + '/settings.ldb' });

    self._db.matches.ensureIndex({ fieldName: 'map' });
    self._db.players.ensureIndex({ fieldName: 'hero' });

    self._collection = null;
    onComplete(null);
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
      self._db.matches.update({collection: collectionID}, { $pull: { collection: collectionID }}, {}, function(err) {
        self._db.heroData.update({collection: collectionID}, { $pull: { collection: collectionID }}, {multi: true}, onComplete);
      });
    });
  }

  // i don't think the next two need callbacks but if so i guess i'll have to add it
  addMatchToCollection(matchID, collectionID) {
    // this actually needs to modify two databases to ensure proper data aggregation
    this._db.matches.update({ _id: matchID }, { $addToSet: { collection: collectionID }}, {});
    this._db.heroData.update({ matchID: matchID }, { $addToSet: { collection: collectionID }}, { multi: true });
  }

  removeMatchFromCollection(matchID, collectionID) {
    this._db.matches.update({ _id: matchID }, { $pull: { collection: collectionID }}, {});
    this._db.heroData.update({ matchID: matchID }, { $pull: { collection: collectionID }}, { multi: true });
  }

  renameCollection(collectionID, name, onComplete) {
    this._db.settings.update({_id: collectionID}, { $set: {name: name}}, {}, onComplete);
  }

  setCollection(collectionID) {
    this._collection = collectionID;
  }

  getCollection() {
    return this._collection;
  }

  // this should have a GUI warning, this code sure won't stop you.
  deleteDB(callback) {
    var self = this;

    this._db.heroData.store.close(function () {
      self._db.matches.store.close(function () {
        self._db.players.store.close(function () {
          self._db.settings.store.close(function () {
            delete self._db;

            fs.emptyDirSync(self._path + '/matches.ldb');
            fs.emptyDirSync(self._path + '/hero.ldb');
            fs.emptyDirSync(self._path + '/players.ldb');
            fs.emptyDirSync(self._path + '/settings.ldb');

            //fs.removeSync(self._path + '/matches.ldb');
            //fs.removeSync(self._path + '/hero.ldb');
            //fs.removeSync(self._path + '/players.ldb');
            //fs.removeSync(self._path + '/settings.ldb');

            callback();
          })
        })
      })
    });
  }

  addReplayToDatabase(file, opts = {}) {
    var data = Parser.processReplay(file, opts);

    if (data.status === Parser.ReplayStatus.OK) {
      // insert match, upsert is used just in case duplicates exist
      this.insertReplay(data.match, data.players);
    }
  }

  insertReplay(match, players, collection, final) {
    var self = this;

    if (!collection) {
      match.collection = [];
    }
    else {
      match.collection = collection;
    }

    // temporary relaxation of match length param for duplicate detection
    this._db.matches.update({ 'map' : match.map, 'date' : match.date, 'type' : match.type }, match, {upsert: true}, function (err, numReplaced, newDoc) {
      if (!newDoc) {
        console.log("Duplicate match found, skipping player update");
      }
      else {
        // update and insert players
        let parr = [];
        for (var i in players) {
          players[i].matchID = newDoc._id;
          players[i].collection = newDoc.collection;
          parr.push(players[i]);
        }

        self._db.heroData.insert(parr, function(err, docs) {
          console.log("Inserted new match " + newDoc._id);

          for (var i in players) {
            // log unique players in the player database
            var playerDbEntry = {};
            playerDbEntry._id = players[i].ToonHandle;
            playerDbEntry.name = players[i].name;
            playerDbEntry.uuid = players[i].uuid;
            playerDbEntry.region = players[i].region;
            playerDbEntry.realm = players[i].realm;

            // in general this will ensure the most recent tag gets associated with each player
            playerDbEntry.tag = players[i].tag;

            var updateEntry = { $set: playerDbEntry, $inc: { matches: 1}};

            self._db.players.update({ _id: playerDbEntry._id }, updateEntry, {upsert: true}, function(err, numReplaced, upsert) {
              if (err)
                console.log(err);
            });
          }

          if (final) {
            final();
          }
        })
      }
    });
  }

  // deletes a match and the associated hero data.
  deleteReplay(matchID, callback) {
    var self = this;
    this._db.matches.find({ _id: matchID }, function(err, docs) {
      if (docs.length === 0) {
        callback();
        return;
      }

      let match = docs[0];

      for (let id of match.playerIDs) {
        self._db.players.update({ _id: id }, { $inc: { matches: -1 }}, { upsert: false });
      }

      self._db.matches.remove({ _id: matchID }, {}, function(err, numRemoved) {
        self._db.heroData.remove({ matchID: matchID }, { multi: true }, function(err, numRemoved) {
          callback();
        });
      });
    });
  }

  tagReplay(matchID, tag, callback) {
    this.tagReplays([matchID], tag, callback);
  }

  tagReplays(matchIDs, tag, callback) {
    var self = this;
    this._db.matches.update({ _id: { $in : matchIDs } }, { $addToSet: { tags: tag } }, { multi: true }, function() {
      self._db.heroData.update({ matchID: { $in: matchIDs } }, { $addToSet: { tags: tag } }, { multi: true }, callback);
    });
  }

  untagReplay(matchID, tag, callback) {
    this.untagReplays([matchID], tag, callback);
  }

  untagReplays(matchIDs, tag, callback) {
    var self = this;
    this._db.matches.update({_id: { $in: matchIDs } }, { $pull: { tags: tag } }, { multi: true }, function() {
      self._db.heroData.update({ matchID: { $in: matchIDs } }, { $pull: { tags: tag } }, { multi: true }, callback);
    })
  }

  getTags(callback) {
    var self = this;
    let query = {};
    this.preprocessQuery(query);
    this._db.matches.find(query, function(err, docs) {
      // create set, then return
      let tags = [];
      for (let doc of docs) {
        if ('tags' in doc) {
          let t = doc.tags;
          for (let tag of t) {
            if (tags.indexOf(tag) === -1)
              tags.push(tag);
          }
        }
      }

      callback(tags);
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
    var self = this;
    this._db.settings.findOne({_id: id}, function(err, team) {
      // teams need to resolve aliases as well, so the playeres array will consist
      // of all actually assigned IDs and aliased IDs
      // resolve all aliases for each player
      self.getPlayers({ _id: { $in: team.players }}, function(err, players1) {
        // so at this point the team could consist of aliased players (as in an aliased ID was added
        // to the team). We'll need to resolve this first, then run another get players query
        let resolvedIDs = [];
        for (let p of players1) {
          if ('aliasedTo' in p && p.aliaedTo !== '') {
            resolvedIDs.push(p.aliasedTo);
          }
          else {
            resolvedIDs.push(p._id);
          }
        }

        // run another query
        self.getPlayers({ _id: { $in: resolvedIDs } }, function(err, players) {
          // players now consists of all root players (no aliases)
          // combine player ids and aliases
          team.resolvedPlayers = players;
          let ids = [];
          for (let p of players) {
            ids.push(p._id);

            if ('aliases' in p) {
              for (var alias of p.aliases) {
                ids.push(alias);
              }
            }
          }

          team.players = ids;

          callback(err, team);
        })
      });
    });
  }

  // checks to see if all of the given players are on a team
  getTeamByPlayers(players, callback) {
    var self = this;
    // resolve aliases first
    this.getPlayers({ _id: { $in: players } }, function(err, docs) {
      let query = { $and: []};
      query.type = 'team';

      for (let p of docs) {
        if ('aliasedTo' in p && p.aliasedTo !== '') {
          // aliasing ambiguity, allow either or to be on the team
          query.$and.push({ $or: [{players: p.aliasedTo }, { players: p._id }] });
        }
        else {
          query.$and.push({ players: p._id });
        }
      }

      self._db.settings.find(query, callback);
    });
  }

  getPlayerTeams(id, callback) {
    this._db.settings.find({ type: 'team', players: id }, callback);
  }

  // callback format: function(teamObject, matchData, heroData)
  getTeamData(teamID, filter, callback) {
    DB.getTeam(teamID, function(err, team) {
      // get the match data
      let query = Object.assign({}, filter);
  
      let players = team.players;
  
      if (!('$or' in query)) {
        query.$or = [];
      }
  
      let t0queries = [];
      let t1queries = [];
      if (team.players.length <= 5) {
        // all players need to be in a team somewhere
        for (const i in players) {
          t0queries.push({ 'teams.0.ids': players[i] });
          t1queries.push({ 'teams.1.ids': players[i] });
        }
      }
      else {
        // basically we need a match 5 of the players and then we're ok 
        for (let i = 0; i < 5; i++) {
          const t0key = 'teams.0.ids.' + i;
          const t1key = 'teams.1.ids.' + i;
  
          let t0arg = { };
          t0arg[t0key] = { $in: players };
          let t1arg = {};
          t1arg[t1key] = { $in: players };
  
          t0queries.push(t0arg);
          t1queries.push(t1arg);
        }
      }
  
      query.$or.push({ $and: t0queries });
      query.$or.push({ $and: t1queries });
  
      // execute
      DB.getMatches(query, function(err, matches) {
        // then get the hero data
        let matchIDs = [];
        for (let i in matches) {
          matchIDs.push(matches[i]._id);
        }
  
        // only want specific users
        let query2 = {
          $and: [
            { ToonHandle: { $in: team.players } },
            { "with.ids.0": { $in: team.players } },
            { "with.ids.1": { $in: team.players } },
            { "with.ids.2": { $in: team.players } },
            { "with.ids.3": { $in: team.players } },
            { "with.ids.4": { $in: team.players } }
          ]
        };
  
        DB.getHeroDataForMatches(matchIDs, query2, function(err, heroData) {
          // and now finally load the team data
          callback(team, matches, heroData);
        });
      });
    });
  }

  // reduction function for iterating and processing each team
  reduceTeams(filter, init, reduce, final) {
    var self = this;

    this.getAllTeams(function(err, teams) {
      if (teams.length === 0) {
        final();
      }
      else {
        init(teams);
        self.processTeamReduce(teams.pop(), teams, filter, reduce, final);
      }
    });
  }

  processTeamReduce(currentTeam, remaining, filter, reduce, final) {
    if (!currentTeam) {
      final();
      return;
    }
    var self = this;
    self.getTeam(currentTeam._id, function(err, team) {
      let query = Object.assign({}, filter);
      let players = team.players;

      if (!('$or' in query)) {
        query.$or = [];
      }

      let t0queries = [];
      let t1queries = [];
      if (team.players.length <= 5) {
        // all players need to be in a team somewhere
        for (const i in players) {
          t0queries.push({ 'teams.0.ids': players[i] });
          t1queries.push({ 'teams.1.ids': players[i] });
        }
      }
      else {
        // basically we need a match 5 of the players and then we're ok
        for (let i = 0; i < 5; i++) {
          const t0key = 'teams.0.ids.' + i;
          const t1key = 'teams.1.ids.' + i;

          let t0arg = { };
          t0arg[t0key] = { $in: players };
          let t1arg = {};
          t1arg[t1key] = { $in: players };

          t0queries.push(t0arg);
          t1queries.push(t1arg);
        }
      }

      query.$or.push({ $and: t0queries });
      query.$or.push({ $and: t1queries });

      // execute
      let opts = {};
      if (query.collection) {
        opts.collectionOverride = true;
      }

      self.getMatches(query, function(err, docs) {
        reduce(err, docs, team);
        self.processTeamReduce(remaining.pop(), remaining, filter, reduce, final);
      }, opts);
    });
  }

  checkDuplicate(file, callback) {
    let header = Parser.getHeader(file);

    if (header.err) {
      callback(header.err);
      return;
    }

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

    // dates
    search.$and.push({ rawDate: { $gte: dateToWinTime(dateMin) } });
    search.$and.push({ rawDate: { $lte: dateToWinTime(dateMax) } });

    // this is the one raw call that is not preprocessed by collections for what should be somewhat obvious reasons
    this._db.matches.find(search, function(err, docs) {
      callback(docs.length > 0);
    });
  }

  // counts the given matches
  countMatches(query, callback) {
    this.preprocessQuery(query);

    let self = this;
    this.resolveMatchFilterAliases(query, function(newQuery) {
      self._db.matches.count(newQuery, callback);
    });
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

  aliasResolutionUpdater(field, p1, p2) {
    let id1 = {};
    id1[field] = p1;

    let o = { $or: [id1] };
    for (let id of p2) {
      let tmp = {};
      tmp[field] = id;
      o.$or.push(tmp);
    }

    return o;
  }

  // this one's pretty nasty.
  // if we have any players with aliases we'll need to do spot replacements.
  resolveMatchFilterAliases(query, next) {
    // gather players that are in the query.
    let ids = [];
    if (query.$and) {
      for (let qa of query.$and) {
        if (qa.winningPlayers) ids.push(qa.winningPlayers);
        if (qa.playerIDs) ids.push(qa.playerIDs);
        if (qa.$not && qa.$not.winningPlayers) ids.push(qa.$not.winningPlayers);
      }
    }

    if (query.$or) {
      for (let qo of query.$or) {
        if (qo.winningPlayers) ids.push(qo.winningPlayers);
        if (qo.playerIDs) ids.push(qo.playerIDs);
        if (qo.$not && qo.$not.winningPlayers) ids.push(qo.$not.winningPlayers);
      }
    }

    // resolve
    var self = this;
    this.getPlayers({ _id : { $in: ids }}, function(err, players) {
      for (let player of players) {
        if (player.aliases && player.aliases.length > 0) {
          // replace
          if (query.$and) {
            for (let i in query.$and) {
              if (query.$and[i].winningPlayers === player._id)
                query.$and[i] = self.aliasResolutionUpdater('winningPlayers', player._id, player.aliases);
              if (query.$and[i].playerIDs === player._id)
                query.$and[i] = self.aliasResolutionUpdater('playerIDs', player._id, player.aliases);
              if (query.$and[i].$not && qa.$not.winningPlayers === player._id)
                query.$and[i].$not = self.aliasResolutionUpdater('winningPlayers', player._id, player.aliases);
            }
          }

          if (query.$or) {
            for (let i in query.$or) {
              if (query.$or[i].winningPlayers === player._id)
                query.$or[i] = self.aliasResolutionUpdater('winningPlayers', player._id, player.aliases);
              if (query.$or[i].playerIDs === player._id)
                query.$or[i] = self.aliasResolutionUpdater('playerIDs', player._id, player.aliases);
              if (query.$or[i].$not && qa.$not.winningPlayers === player._id)
                query.$or[i].$not = self.aliasResolutionUpdater('winningPlayers', player._id, player.aliases);
            }
          }
        }
      }

      next(query);
    });
  }

  getMatchPage(query, pageNum, limit, projection, callback) {
    this.preprocessQuery(query);

    let skip = pageNum * limit;

    let self = this;
    this.resolveMatchFilterAliases(query, function(newQuery) {
      self._db.matches.find(newQuery, projection).skip(skip).limit(limit).sort({date: -1}).exec(callback);
    });
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

  updateMatchDraft(matchId, picks, bans, callback) {
    this._db.matches.update(
      { _id: matchId },
      {
        $set: {
          picks,
          bans
        }
      },
      {},
      callback);
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
  // if a player is aliasedTo a different player, we're gonna return the combined
  // hero data for all players aliasedTo the root player.
  getHeroDataForPlayer(playerID, callback) {
    this.getHeroDataForPlayerWithFilter(playerID, {}, callback);
  }

  // Aliases are a bit of a pain. We'll need to inspect the query and figure out if
  // it needs to be updated with aliases. If yes, then it proceeds with updating,
  // If not, it directly skips to the callback function
  // this function specifically looks at filters returned by the hero filter from the filter popup widget.
  resolveHeroFilterAliases(query, next) {
    // condition is if ToonHandle exists
    if (!query.ToonHandle) {
      next(query);
      return;
    }

    this.getAliasedPlayers(function(err, aliases) {
      // add aliases to the query (which is ToonHandle = {$in : [] }) or a single string
      let toAdd = [];

      query.ToonHandle = query.ToonHandle.$in ? query.ToonHandle : { $in: [query.ToonHandle] };
      for (let p of query.ToonHandle.$in) {
        // cycle through aliases
        for (let a of aliases) {
          // if the player that was aliased has its parent in the query, add the alias to the query.
          // interface only allows players that have 
          if (p === a.aliasedTo) {
            toAdd.push(a._id);
          }
        }
      }

      query.ToonHandle.$in = query.ToonHandle.$in.concat(toAdd);
      next(query);
    });
  }

  getHeroDataForPlayerWithFilter(playerID, filter, callback) {
    var self = this;

    this.getPlayer(playerID, function(err, player) {
      if (err) {
        callback(err, null);
        return;
      }

      const p = player[0];
      let query = Object.assign({}, filter);
      query.ToonHandle = playerID;

      if ('aliasedTo' in p && p.aliasedTo !== '') {
        // recurse
        self.getHeroDataForPlayerWIthFilter(p.aliasedTo, filter, callback); 
        return;
      }

      // if we have a root player
      if ('aliases' in p && p.aliases.length > 0) {
        let ids = p.aliases;
        ids.push(playerID);

        query.ToonHandle = { $in: ids };
      }
      
      self.preprocessQuery(query);
      self._db.heroData.find(query, callback);
    });
  }

  getHeroData(query, callback) {
    this.preprocessQuery(query);
    
    var self = this;
    this.resolveHeroFilterAliases(query, function(updatedQuery) {
      self._db.heroData.find(updatedQuery, callback);
    });
  }

  getHeroDataForMatches(ids, query, callback) {
    query.$or = [];
    for (let i in ids) {
      query.$or.push({ matchID : ids[i]});
    }

    this.preprocessQuery(query);
    this.getHeroData(query, callback);
  }

  getMatchesFromComplexQuery(matchQuery, heroQuery, callback) {
    // this one is fun.
    // first, filter matches based on match query
    // then, run the hero query but only look at entries with matching match id
    // finally, re-query for the now-filtered matches. callback returns both data sets.
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

  setPlayerNickname(id, name, callback) {
    this._db.players.update({ _id: id }, { $set : { nickname: name } }, {}, callback);
  }

  updatePlayerAliases(id, aliases, callback) {
    var self = this;

    // sanity check for self-aliases
    // will remove self aliases but proceed
    if (aliases.indexOf(id) >= 0) {
      aliases.splice(aliases.indexOf(id), 1);
    }

    // find the root player
    this._db.players.find({_id: id}, function(err, docs) {
      if (err) {
        console.log(err);
        callback(err);
        return;
      }

      if (docs.length === 0) {
        console.log(`no player with id ${id}`);
        callback(`no player with id ${id}`);
        return;
      }

      const player = docs[0];

      // you can't alias a player that has anything in the aliases field (circular refs)
      if (player.aliasedTo !== undefined && player.aliasedTo !== '') {
        callback('Player is already aliased to another player');
        return;
      }

      // un-alias current aliases
      self._db.players.update({ _id: { $in: player.aliases } }, { $set: { 'aliasedTo' : '' } }, { multi: true }, function(err) {
        if (err) {
          console.log(err);
          callback(err);
          return;
        }

        // update new aliases
        player.aliases = aliases;
        player.save(function(err) {
          if (err) {
            console.log(err);
            callback(err);
            return;
          }

          // update all of the aliased players
          self._db.players.update({ _id: { $in: aliases } }, { $set: { 'aliasedTo' : id } }, { multi: true }, function(err) {
            callback();
          });
        });
      });
    });
  }

  // returns a set of all players that are aliased to something else in the db
  getAliasedPlayers(callback) {
    const aliasFilter = { $and: [{aliasedTo: { $exists: true } }, { $not: { aliasedTo: '' } }] };
    this.getPlayers(aliasFilter, callback);
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

  // returns a list of versions in the database along with
  // a formatted string for each of them.
  getVersions(callback) {
    let query = {};
    this.preprocessQuery(query);
    this._db.matches.find(query, function(err, docs) {
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

            let hdata = summarizeHeroData(heroData);

            // don't save these
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
          let hdata = summarizeHeroData(heroData);

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
      let hdata = summarizeHeroData(heroData);

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

  importDB(otherPath, importTypes, progress, final) {
    const self = this;
    const otherDB = new Database(otherPath);
    progress('Loading other Database');
    otherDB.load(function() {
      // basically a straight copy with some settings determined by import types
      // import types:
      // - matches: copy matches & hero data
      // - collections: also copy collections if matches selected, just drop matches in if not.
      // - teams: imports teams (this will also insert players into the database)
      // we're gonna do this all sequentially just to keep things clean (so team data may be accessed even if not copying)
      
      // collections, if applicable
      progress('Getting Collections');
      otherDB.getCollections(function(err, otherCol) {
        if (err) {
          final(err);
          return;
        }

        let toInsert = otherCol;

        // insert
        if (importTypes.indexOf(ImportType.Collections) === -1) {
          toInsert = [];
        }
        self.importCollections(toInsert.pop(), toInsert, progress, function(err) {
          if (err) {
            final(err);
            return;
          }

          // teams (and players)
          progress('Getting Teams');
          otherDB._db.settings.find({ type: 'team' }, function(err, otherTeams) {
            if (err) {
              final(err);
              return;
            }

            otherDB._db.players.find({}, function(err, otherPlayers) {
              if (err) {
                final(err);
                return;
              }

              let toInsert = otherTeams;
              let playersToInsert = otherPlayers;

              if (importTypes.indexOf(ImportType.Teams) === -1) {
                toInsert = [];
                playersToInsert = [];
              }
              self.importTeams(toInsert.pop(), toInsert, progress, function(err) {
                if (err) {
                  final(err);
                  return;
                }

                self.importPlayers(playersToInsert.pop(), playersToInsert, progress, function(err) {
                  if (err) {
                    final(err);
                    return;
                  }

                  // matches are complicated a little, but if we're not importing them we can leave now
                  if (importTypes.indexOf(ImportType.Matches) === -1) {
                    final();
                    return;
                  }

                  // use the regular insert match function, but the data comes from the other database
                  progress('Getting Matches');
                  otherDB._db.matches.find({}, function(err, otherMatches) {
                    if (err) {
                      final(err);
                      return;
                    }
                    self.importMatches(otherDB, otherMatches.pop(), otherMatches, progress, importTypes.indexOf(ImportType.Collections) !== -1, final);
                  });
                });
              });
            });
          });
        });
      });
    }, () => { });
  }

  importTeams(team, remaining, progress, final) {
    if (!team) {
      final();
      return;
    }

    const self = this;
    progress(`Importing team ${team.name}. Remaining: ${remaining.length}`);

    delete team._id;
    this._db.settings.update({ type: 'team', name: team.name }, team, { upsert: true }, function(err, changed) {
      if (err) {
        console.log(err);
        final(err);
        return;
      }

      if (remaining.length === 0) {
        final();
      }
      else {
        self.importTeams(remaining.pop(), remaining, progress, final);
      }
    });
  }

  importCollections(collection, remaining, progress, final) {
    if (!collection) {
      final();
      return;
    }

    const self = this;
    progress(`Importing collection ${collection.name}. Remaining: ${remaining.length}`);

    delete collection._id;
    this._db.settings.update({ type: 'collection', name: collection.name }, collection, { upsert: true }, function(err, changed) {
      if (err) {
        console.log(err);
        final(err);
        return;
      }

      if (remaining.length === 0) {
        final();
      }
      else {
        self.importCollections(remaining.pop(), remaining, progress, final);
      }
    });
  }

  importPlayers(player, remaining, progress, final) {
    if (!player) {
      final();
      return;
    }

    const self = this;
    progress(`Importing player ${player._id}. Remaining: ${remaining.length}`);
    
    this._db.players.update({ _id: player._id }, player, { upsert: true }, function(err, changed) {
      if (err) {
        console.log(err);
        final(err);
        return;
      }

      if (remaining.length === 0) {
        final();
      }  
      else {
        self.importPlayers(remaining.pop(), remaining, progress, final);
      }
    });
  }

  importMatches(otherDB, match, remaining, progress, useCollection, final) {
    // this one is a bit different than the previous...
    if (!match) {
      final();
      return;
    }

    progress(`Importing match ${match._id}. Remaining: ${remaining.length}`);
    const self = this;
    // need to get the player entries
    otherDB.getHeroDataForID(match._id, function(err, docs) {
      if (err) {
        console.log(err);
        final(err);
        return;
      }

      delete match._id;
      let collection = useCollection ? match.collection : [];

      for (let i = 0; i < docs.length; i++) {
        delete docs[i]._id;
      }

      self.insertReplay(match, docs, collection, function() {
        if (remaining.length === 0) {
          final();
        }
        else {
          self.importMatches(otherDB, remaining.pop(), remaining, progress, useCollection, final);
        }
      });
    });
  }
}

function dateToWinTime(date) {
  let ms = date.getTime();
  return (ms + 11644473600000) * 10000 + 9999;
}

exports.HeroesDatabase = Database;
exports.ImportType = ImportType;