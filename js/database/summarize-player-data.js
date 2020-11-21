const { median } = require('../util/math');
const DetailStatList = require('../game-data/detail-stat-list');
const ComputedStatsList = require('../game-data/computed-stats-list');
const PerMapStatList = require('../game-data/map-stats.js');
const ReplayTypes = require('../../hots-parser/constants');

// get average stats by player (not by hero)
// otherwise this is basically summarizeHeroData but it doesn't track some stuff
// Aliases are resolved by the playerData key. If this isn't present, everything
// will be separate.
// this function also now computes a few extra stats (derived from data). They are:
// - DDRatio - Damage Dealt / Damage Taken
// - DPct - Damage Dealt / with.stats.totals.HeroDamage
// - DTPct - Damage Taken / with.stats.totals.DamageTaken
// - HPct - [Healing + shielding] / [with.stats.totals.DamageTaken]
// - CCPct - [sum All CC] / match length
function summarizePlayerData(docs, playerAliases = {}) {
  let playerDetailStats = {};

  for (let i = 0; i < docs.length; i++) {
    const match = docs[i];

    // concat a few extra computed properties
    const statList = DetailStatList.concat(PerMapStatList[match.map], ComputedStatsList);

    // alias resolution
    let playerID = match.ToonHandle;
    if (playerAliases[playerID]) {
      playerID = playerAliases[playerID];
    }

    // set up the player object
    if (!(playerID in playerDetailStats)) {
      playerDetailStats[playerID] = {
        games: 0,
        wins: 0,
        stats: {
          timeDeadPct: 0,
        },
        name: match.name,
        awards: {},
        totalAwards: 0,
        taunts: {
          bsteps: { count: 0, duration: 0, takedowns: 0, deaths: 0 },
          dances: { count: 0, takedowns: 0, deaths: 0 },
          sprays: { count: 0, takedowns: 0, deaths: 0 },
          taunts: { count: 0, takedowns: 0, deaths: 0 },
          voiceLines: { count: 0, takedowns: 0, deaths: 0 },
        },
        heroes: {},
        totalTime: 0,
        votes: 0,
        highestStreak: 0,
        min: { timeDeadPct: 100 },
        max: { timeDeadPct: 0 },
        total: { timeDeadPct: 0 },
        medianTmp: { timeDeadPct: [] },
      };
    }

    playerDetailStats[playerID].games += 1;
    playerDetailStats[playerID].totalTime += match.length;
    playerDetailStats[playerID].votes += match.votes;

    if (!(match.hero in playerDetailStats[playerID].heroes)) playerDetailStats[playerID].heroes[match.hero] = 0;
    playerDetailStats[playerID].heroes[match.hero] += 1;

    // preprocess stats
    match.gameStats.DDRatio =
      match.gameStats.HeroDamage / (match.gameStats.DamageTaken === 0 ? 1 : match.gameStats.DamageTaken);
    match.gameStats.DPct = match.gameStats.HeroDamage / match.with.stats.totals.HeroDamage;
    match.gameStats.DTPct = match.gameStats.DamageTaken / match.with.stats.totals.DamageTaken;
    match.gameStats.HPct =
      (match.gameStats.Healing + match.gameStats.ProtectionGivenToAllies) / match.with.stats.totals.DamageTaken;
    match.gameStats.SoftCCPct = match.gameStats.TimeCCdEnemyHeroes / match.length;
    match.gameStats.HardCCPct =
      (match.gameStats.TimeRootingEnemyHeroes +
        match.gameStats.TimeSilencingEnemyHeroes +
        match.gameStats.TimeStunningEnemyHeroes) /
      match.length;

    for (let s in statList) {
      let statName = statList[s];

      // older replays may be missing stats
      if (!(statName in match.gameStats)) continue;

      if (!(statName in playerDetailStats[playerID].stats)) {
        playerDetailStats[playerID].stats[statName] = 0;
        playerDetailStats[playerID].max[statName] = match.gameStats[statName];
        playerDetailStats[playerID].min[statName] = match.gameStats[statName];
        playerDetailStats[playerID].total[statName] = 0;
        playerDetailStats[playerID].medianTmp[statName] = [];
      }

      playerDetailStats[playerID].stats[statName] += match.gameStats[statName];
      playerDetailStats[playerID].total[statName] += match.gameStats[statName];
      playerDetailStats[playerID].medianTmp[statName].push(match.gameStats[statName]);

      if (match.gameStats[statName] > playerDetailStats[playerID].max[statName])
        playerDetailStats[playerID].max[statName] = match.gameStats[statName];

      if (match.gameStats[statName] < playerDetailStats[playerID].min[statName])
        playerDetailStats[playerID].min[statName] = match.gameStats[statName];
    }
    let tdp = match.gameStats.TimeSpentDead / match.length;
    playerDetailStats[playerID].stats.timeDeadPct += tdp;
    playerDetailStats[playerID].total.timeDeadPct += tdp; // ??
    playerDetailStats[playerID].medianTmp.timeDeadPct.push(tdp);

    if (tdp > playerDetailStats[playerID].max.timeDeadPct) playerDetailStats[playerID].max.timeDeadPct = tdp;

    if (tdp < playerDetailStats[playerID].min.timeDeadPct) playerDetailStats[playerID].min.timeDeadPct = tdp;

    playerDetailStats[playerID].highestStreak = Math.max(
      match.gameStats.HighestKillStreak,
      playerDetailStats[playerID].highestStreak,
    );

    // you only ever get 1 but just in case...
    // ALSO custom games don't get counted here since you can't get awards
    if (match.mode !== ReplayTypes.GameMode.Custom) {
      if ('awards' in match.gameStats) {
        for (let a in match.gameStats.awards) {
          let awardName = match.gameStats.awards[a];
          if (!(awardName in playerDetailStats[playerID].awards)) playerDetailStats[playerID].awards[awardName] = 0;

          playerDetailStats[playerID].awards[awardName] += 1;
          playerDetailStats[playerID].totalAwards += 1;
        }
      }
    }

    // taunts
    for (let t in playerDetailStats[playerID].taunts) {
      let bm = match[t];

      for (let j = 0; j < bm.length; j++) {
        playerDetailStats[playerID].taunts[t].count += 1;
        playerDetailStats[playerID].taunts[t].takedowns += bm[j].kills;
        playerDetailStats[playerID].taunts[t].deaths += bm[j].deaths;

        if ('duration' in bm[j]) {
          playerDetailStats[playerID].taunts[t].duration += bm[j].duration;
        }
      }
    }

    if (match.win) {
      playerDetailStats[playerID].wins += 1;
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
    playerDetailStats[p].totalKDA =
      playerDetailStats[p].stats.Takedowns / Math.max(playerDetailStats[p].stats.Deaths, 1);

    if ('EndOfMatchAwardMVPBoolean' in playerDetailStats[p].awards) {
      playerDetailStats[p].stats.MVPPct =
        playerDetailStats[p].awards.EndOfMatchAwardMVPBoolean / playerDetailStats[p].games;
      playerDetailStats[p].totalMVP += playerDetailStats[p].awards.EndOfMatchAwardMVPBoolean;
    } else {
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

module.exports = summarizePlayerData;
