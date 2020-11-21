const { median } = require('../util/math');
const DetailStatList = require('../game-data/detail-stat-list');
const PerMapStatList = require('../game-data/map-stats.js');
const ReplayTypes = require('../../hots-parser/constants');

// this will go an process a set of heroData into a set of stats divided
// by hero, and by map
function summarizeHeroData(docs) {
  // collect data
  // hero averages
  let playerDetailStats = {};
  playerDetailStats.heroes = {};
  playerDetailStats.maps = {};
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
    sprays: { count: 0, takedowns: 0, deaths: 0 },
    taunts: { count: 0, takedowns: 0, deaths: 0 },
    voiceLines: { count: 0, takedowns: 0, deaths: 0 },
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
        stats: { timeDeadPct: 0 },
        awards: {},
        totalTime: 0,
        votes: 0,
        highestStreak: 0,
        with: {},
        against: {},
      };
      playerDetailStats.max[match.hero] = { timeDeadPct: 0 };
      playerDetailStats.min[match.hero] = { timeDeadPct: 100 };
      medianTemp[match.hero] = { timeDeadPct: [] };
    }

    playerDetailStats.heroes[match.hero].totalTime += match.length;
    playerDetailStats.games += 1;
    playerDetailStats.heroes[match.hero].games += 1;
    playerDetailStats.heroes[match.hero].votes += match.votes;

    if (!(match.map in playerDetailStats.maps)) playerDetailStats.maps[match.map] = { games: 0, wins: 0 };

    playerDetailStats.maps[match.map].games += 1;

    for (let s in statList) {
      let statName = statList[s];

      // older replays may have missing stats
      if (!(statName in match.gameStats)) continue;

      if (!(statName in playerDetailStats.heroes[match.hero].stats)) {
        playerDetailStats.heroes[match.hero].stats[statName] = 0;
        playerDetailStats.max[match.hero][statName] = match.gameStats[statName];
        playerDetailStats.min[match.hero][statName] = match.gameStats[statName];
        medianTemp[match.hero][statName] = [];
      }

      // booooo blackheart's
      if (statName === 'BlackheartDoubloonsCollected') {
        // sometimes the replay freaks out and returns a huge integer. Set that to 0 if it happens
        if (match.gameStats[statName] > 500) match.gameStats[statName] = 0;
      }

      // just... don't ask
      // sometimes the replay files really screw up
      if (match.gameStats[statName] > 4000000000) {
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
    let tdp = match.gameStats.TimeSpentDead / match.length;
    playerDetailStats.heroes[match.hero].stats.timeDeadPct += tdp;
    medianTemp[match.hero].timeDeadPct.push(tdp);

    if (tdp > playerDetailStats.max[match.hero].timeDeadPct) playerDetailStats.max[match.hero].timeDeadPct = tdp;

    if (tdp < playerDetailStats.min[match.hero].timeDeadPct) playerDetailStats.min[match.hero].timeDeadPct = tdp;

    //playerDetailStats.heroes[match.hero].stats.highestStreak = Math.max(match.gameStats.HighestKillStreak, playerDetailStats.heroes[match.hero].stats.highestStreak);
    playerDetailStats.highestStreak = Math.max(
      playerDetailStats.max[match.hero].HighestKillStreak,
      match.gameStats.HighestKillStreak,
    );

    // you only ever get 1 but just in case...
    // ALSO custom games don't get counted here since you can't get awards
    if (match.mode !== ReplayTypes.GameMode.Custom) {
      playerDetailStats.nonCustomGames += 1;
      if ('awards' in match.gameStats) {
        for (let a in match.gameStats.awards) {
          let awardName = match.gameStats.awards[a];
          if (!(awardName in playerDetailStats.heroes[match.hero].awards))
            playerDetailStats.heroes[match.hero].awards[awardName] = 0;

          if (!(awardName in playerDetailStats.awards)) playerDetailStats.awards[awardName] = 0;

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
          playerDetailStats.withPlayer[match.with.ids[j]] = {
            id: match.with.ids[j],
            name: match.with.names[j],
            games: 0,
            wins: 0,
          };
        }
        if (!(match.with.heroes[j] in playerDetailStats.withHero)) {
          playerDetailStats.withHero[match.with.heroes[j]] = { name: match.with.heroes[j], games: 0, wins: 0 };
        }

        playerDetailStats.withPlayer[match.with.ids[j]].games += 1;
        playerDetailStats.withHero[match.with.heroes[j]].games += 1;

        if (!(match.with.heroes[j] in playerDetailStats.heroes[match.hero].with)) {
          playerDetailStats.heroes[match.hero].with[match.with.heroes[j]] = { games: 0, wins: 0 };
        }

        playerDetailStats.heroes[match.hero].with[match.with.heroes[j]].games += 1;

        if (match.win) {
          playerDetailStats.withPlayer[match.with.ids[j]].wins += 1;
          playerDetailStats.withHero[match.with.heroes[j]].wins += 1;
          playerDetailStats.heroes[match.hero].with[match.with.heroes[j]].wins += 1;
        }
      }

      if (!(match.against.ids[j] in playerDetailStats.againstPlayer)) {
        playerDetailStats.againstPlayer[match.against.ids[j]] = {
          id: match.against.ids[j],
          name: match.against.names[j],
          games: 0,
          defeated: 0,
        };
      }
      if (!(match.against.heroes[j] in playerDetailStats.againstHero)) {
        playerDetailStats.againstHero[match.against.heroes[j]] = {
          name: match.against.heroes[j],
          games: 0,
          defeated: 0,
        };
      }

      if (!(match.against.heroes[j] in playerDetailStats.heroes[match.hero].against)) {
        playerDetailStats.heroes[match.hero].against[match.against.heroes[j]] = { games: 0, wins: 0 };
      }

      playerDetailStats.heroes[match.hero].against[match.against.heroes[j]].games += 1;

      playerDetailStats.againstPlayer[match.against.ids[j]].games += 1;
      playerDetailStats.againstHero[match.against.heroes[j]].games += 1;

      if (match.win) {
        playerDetailStats.againstPlayer[match.against.ids[j]].defeated += 1;
        playerDetailStats.againstHero[match.against.heroes[j]].defeated += 1;
        playerDetailStats.heroes[match.hero].against[match.against.heroes[j]].wins += 1;
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
    if (!(match.skin in playerDetailStats.skins)) playerDetailStats.skins[match.skin] = { games: 0, wins: 0 };

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
  playerDetailStats.avgPassiveXP = 0;
  playerDetailStats.avgLevelAdv = 0;
  playerDetailStats.avgHeroAdv = 0;
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
    playerDetailStats.heroes[h].stats.totalKDA =
      playerDetailStats.heroes[h].stats.Takedowns / Math.max(playerDetailStats.heroes[h].stats.Deaths, 1);

    if ('EndOfMatchAwardMVPBoolean' in playerDetailStats.heroes[h].awards) {
      playerDetailStats.heroes[h].stats.MVPPct =
        playerDetailStats.heroes[h].awards.EndOfMatchAwardMVPBoolean / playerDetailStats.heroes[h].games;
      playerDetailStats.totalMVP += playerDetailStats.heroes[h].awards.EndOfMatchAwardMVPBoolean;
    } else {
      playerDetailStats.heroes[h].stats.MVPPct = 0;
    }

    playerDetailStats.heroes[h].stats.AwardPct =
      playerDetailStats.heroes[h].totalAwards / playerDetailStats.heroes[h].games;
    playerDetailStats.totalAward += playerDetailStats.heroes[h].totalAwards;
    playerDetailStats.totalDeaths += playerDetailStats.heroes[h].stats.Deaths;
    playerDetailStats.totalTD += playerDetailStats.heroes[h].stats.Takedowns;
    playerDetailStats.totalTimeDead += playerDetailStats.heroes[h].stats.TimeSpentDead;
    playerDetailStats.totalMatchLength += playerDetailStats.heroes[h].totalTime;
    playerDetailStats.totalVotes += playerDetailStats.heroes[h].votes;
    playerDetailStats.avgTimeDeadPct += playerDetailStats.heroes[h].stats.timeDeadPct;
    playerDetailStats.avgPassiveXP += playerDetailStats.heroes[h].stats.passiveXPRate;
    playerDetailStats.avgLevelAdv += playerDetailStats.heroes[h].stats.levelAdvPct;
    playerDetailStats.avgHeroAdv += playerDetailStats.heroes[h].stats.pctWithHeroAdv;
  }
  playerDetailStats.avgTimeDeadPct /= playerDetailStats.games;
  playerDetailStats.avgPassiveXP /= playerDetailStats.games;
  playerDetailStats.avgLevelAdv /= playerDetailStats.games;
  playerDetailStats.avgHeroAdv /= playerDetailStats.games;

  return playerDetailStats;
}

module.exports = summarizeHeroData;
