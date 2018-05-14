const { median } = require("../util/math");
const DetailStatList = require("../game-data/detail-stat-list");
const PerMapStatList = require("../game-data/map-stats.js");

// get average stats by player (not by hero)
// otherwise this is basically summarizeHeroData but it doesn't track some stuff
function summarizePlayerData(docs) {
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
        totalAwards: 0,
        taunts: {
          bsteps: { count: 0, duration: 0, takedowns: 0, deaths: 0 },
          dances: { count: 0, takedowns: 0, deaths: 0 },
          sprays: { count: 0, takedowns: 0, deaths: 0 },
          taunts: { count: 0, takedowns: 0, deaths: 0 },
          voiceLines: { count: 0, takedowns: 0, deaths: 0 }
        },
        heroes: {},
        totalTime: 0,
        votes: 0,
        highestStreak: 0,
        min: { timeDeadPct: 100 },
        max: { timeDeadPct: 0 },
        total: { timeDeadPct: 0 },
        medianTmp: { timeDeadPct: [] }
      };
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
      if (!(statName in match.gameStats)) continue;

      if (!(statName in playerDetailStats[match.ToonHandle].stats)) {
        playerDetailStats[match.ToonHandle].stats[statName] = 0;
        playerDetailStats[match.ToonHandle].max[statName] =
          match.gameStats[statName];
        playerDetailStats[match.ToonHandle].min[statName] =
          match.gameStats[statName];
        playerDetailStats[match.ToonHandle].total[statName] = 0;
        playerDetailStats[match.ToonHandle].medianTmp[statName] = [];
      }

      playerDetailStats[match.ToonHandle].stats[statName] +=
        match.gameStats[statName];
      playerDetailStats[match.ToonHandle].total[statName] +=
        match.gameStats[statName];
      playerDetailStats[match.ToonHandle].medianTmp[statName].push(
        match.gameStats[statName]
      );

      if (
        match.gameStats[statName] >
        playerDetailStats[match.ToonHandle].max[statName]
      )
        playerDetailStats[match.ToonHandle].max[statName] =
          match.gameStats[statName];

      if (
        match.gameStats[statName] <
        playerDetailStats[match.ToonHandle].min[statName]
      )
        playerDetailStats[match.ToonHandle].min[statName] =
          match.gameStats[statName];
    }
    let tdp = match.gameStats.TimeSpentDead / match.length;
    playerDetailStats[match.ToonHandle].stats.timeDeadPct += tdp;
    playerDetailStats[match.ToonHandle].total.timeDeadPct += tdp; // ??
    playerDetailStats[match.ToonHandle].medianTmp.timeDeadPct.push(tdp);

    if (tdp > playerDetailStats[match.ToonHandle].max.timeDeadPct)
      playerDetailStats[match.ToonHandle].max.timeDeadPct = tdp;

    if (tdp < playerDetailStats[match.ToonHandle].min.timeDeadPct)
      playerDetailStats[match.ToonHandle].min.timeDeadPct = tdp;

    playerDetailStats[match.ToonHandle].highestStreak = Math.max(
      match.gameStats.HighestKillStreak,
      playerDetailStats[match.ToonHandle].highestStreak
    );

    // you only ever get 1 but just in case...
    // ALSO custom games don't get counted here since you can't get awards
    if (match.mode !== ReplayTypes.GameMode.Custom) {
      if ("awards" in match.gameStats) {
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

        if ("duration" in bm[j]) {
          playerDetailStats[match.ToonHandle].taunts[t].duration +=
            bm[j].duration;
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
      playerDetailStats[p].averages[s] =
        playerDetailStats[p].stats[s] / playerDetailStats[p].games;
      playerDetailStats[p].median[s] = median(
        playerDetailStats[p].medianTmp[s]
      );
    }
    playerDetailStats[p].totalKDA =
      playerDetailStats[p].stats.Takedowns /
      Math.max(playerDetailStats[p].stats.Deaths, 1);

    if ("EndOfMatchAwardMVPBoolean" in playerDetailStats[p].awards) {
      playerDetailStats[p].stats.MVPPct =
        playerDetailStats[p].awards.EndOfMatchAwardMVPBoolean /
        playerDetailStats[p].games;
      playerDetailStats[p].totalMVP +=
        playerDetailStats[p].awards.EndOfMatchAwardMVPBoolean;
    } else {
      playerDetailStats[p].stats.MVPPct = 0;
    }

    playerDetailStats[p].stats.AwardPct =
      playerDetailStats[p].totalAwards / playerDetailStats[p].games;
    playerDetailStats[p].totalAward += playerDetailStats[p].totalAwards;
    playerDetailStats[p].totalDeaths += playerDetailStats[p].stats.Deaths;
    playerDetailStats[p].totalTD += playerDetailStats[p].stats.Takedowns;
    playerDetailStats[p].totalMatchLength += playerDetailStats[p].totalTime;
    playerDetailStats[p].totalTimeDead +=
      playerDetailStats[p].stats.TimeSpentDead;
  }

  return playerDetailStats;
}

module.exports = summarizePlayerData;
