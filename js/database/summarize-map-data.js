const { median } = require('../util/math');
const ReplayTypes = require('../../hots-parser/constants');

// mapData data
function summarizeMapData(docs) {
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
        draftGames: 0,
        firstFortWin: 0,
        firstKeepWin: 0,
      };
    }

    stats[map].games += 1;
    stats[map].total += match.length;
    stats[map].medianTmp.push(match.length);

    if (match.bans) stats[map].draftGames += 1;

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
    if (match.firstObjectiveWin === true) stats[map].firstObjectiveWins += 1;
    if (match.firstPickWin === true) stats[map].firstPickWin += 1;
    if (match.firstKeepWin === true) stats[map].firstKeepWin += 1;
    if (match.firstFortWin === true) stats[map].firstFortWin += 1;

    if (match.winner === 0) stats[map].blueWin += 1;
    else stats[map].redWin += 1;
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
    draftGames: 0,
    firstFortWin: 0,
    firstKeepWin: 0,
    nonToDTotal: 0, // necessary to adjust for first keep win stat (ToD has no keeps)
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
    aggregate.firstFortWin += stats[map].firstFortWin;

    if (map !== ReplayTypes.MapType.TowersOfDoom) {
      aggregate.nonToDTotal += stats[map].games;
      aggregate.firstKeepWin += stats[map].firstKeepWin;
    }
  }

  aggregate.median = median(aggregate.medianTmp);
  aggregate.average = aggregate.total / aggregate.games;

  return { stats, aggregate };
}

module.exports = summarizeMapData;
