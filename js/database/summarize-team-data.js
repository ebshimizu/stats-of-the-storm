const { median } = require('../util/math');

function newHeroData() {
  return {
    first: 0,
    second: 0,
    wins: 0,
    bans: 0,
    games: 0,
    involved: 0,
    gamesAgainst: 0,
    defeated: 0,
    with: {},
    against: {},
    banAgainst: 0,
    picks: {
      round1: { count: 0, wins: 0 },
      round2: { count: 0, wins: 0 },
      round3: { count: 0, wins: 0 },
      preMid: { count: 0, wins: 0 },
      postMid: { count: 0, wins: 0 },
    },
  };
}

function recordFirstPickStats(data, picks, winner) {
  data.firstPicks += 1;

  data.heroes[picks[0]].picks.round1.count += 1;
  data.heroes[picks[1]].picks.round2.count += 1;
  data.heroes[picks[2]].picks.round2.count += 1;
  data.heroes[picks[3]].picks.round3.count += 1;
  data.heroes[picks[4]].picks.round3.count += 1;

  // pre/post mid ban stats
  data.heroes[picks[0]].picks.preMid.count += 1;
  data.heroes[picks[1]].picks.preMid.count += 1;
  data.heroes[picks[2]].picks.preMid.count += 1;
  data.heroes[picks[3]].picks.postMid.count += 1;
  data.heroes[picks[4]].picks.postMid.count += 1;

  if (winner) {
    data.firstPickWins += 1;

    data.heroes[picks[0]].picks.round1.wins += 1;
    data.heroes[picks[1]].picks.round2.wins += 1;
    data.heroes[picks[2]].picks.round2.wins += 1;
    data.heroes[picks[3]].picks.round3.wins += 1;
    data.heroes[picks[4]].picks.round3.wins += 1;

    // pre/post mid ban stats
    data.heroes[picks[0]].picks.preMid.wins += 1;
    data.heroes[picks[1]].picks.preMid.wins += 1;
    data.heroes[picks[2]].picks.preMid.wins += 1;
    data.heroes[picks[3]].picks.postMid.wins += 1;
    data.heroes[picks[4]].picks.postMid.wins += 1;
  }
}

function recordSecondPickStats(data, picks, winner) {
  data.heroes[picks[0]].picks.round1.count += 1;
  data.heroes[picks[1]].picks.round1.count += 1;
  data.heroes[picks[2]].picks.round2.count += 1;
  data.heroes[picks[3]].picks.round2.count += 1;
  data.heroes[picks[4]].picks.round3.count += 1;

  // pre/post mid ban stats
  data.heroes[picks[0]].picks.preMid.count += 1;
  data.heroes[picks[1]].picks.preMid.count += 1;
  data.heroes[picks[2]].picks.postMid.count += 1;
  data.heroes[picks[3]].picks.postMid.count += 1;
  data.heroes[picks[4]].picks.postMid.count += 1;

  if (winner) {
    data.heroes[picks[0]].picks.round1.wins += 1;
    data.heroes[picks[1]].picks.round1.wins += 1;
    data.heroes[picks[2]].picks.round2.wins += 1;
    data.heroes[picks[3]].picks.round2.wins += 1;
    data.heroes[picks[4]].picks.round3.wins += 1;

    // pre/post mid ban stats
    data.heroes[picks[0]].picks.preMid.wins += 1;
    data.heroes[picks[1]].picks.preMid.wins += 1;
    data.heroes[picks[2]].picks.postMid.wins += 1;
    data.heroes[picks[3]].picks.postMid.wins += 1;
    data.heroes[picks[4]].picks.postMid.wins += 1;
  }
}

// special version of summarize match data that only pulls stats from one of the teams
function summarizeTeamData(team, docs, HeroesTalents) {
  const data = {
    totalMatches: docs.length,
    wins: 0,
    totalBans: 0,
    firstPicks: 0,
    firstPickWins: 0,
    heroes: {},
    stats: {
      average: {},
      min: {},
      max: {},
      median: {},
      medianTmp: {},
      total: {},
    },
    maps: {},
    level10Games: 0,
    level20Games: 0,
    structures: {},
    takedowns: {
      average: 0,
      total: 0,
      min: 1e10,
      max: 0,
      medianTmp: [],
    },
    deaths: {
      average: 0,
      total: 0,
      min: 1e10,
      max: 0,
      medianTmp: [],
    },
    matchLength: {
      total: 0,
      min: 1e10,
      max: 0,
      medianTmp: [],
    },
    endOfGameLevels: {
      win: { total: 0, min: 1e10, max: 0, medianTmp: [] },
      loss: { total: 0, min: 1e10, max: 0, medianTmp: [] },
      combined: { total: 0, min: 1e10, max: 0, medianTmp: [] },
    },
    tierTimes: {
      T1: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T2: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T3: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T4: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T5: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
      T6: { total: 0, min: 1e10, max: 0, medianTmp: [], count: 0 },
    },
  };

  for (let match of docs) {
    let winner = match.winner;

    // determine what team we want
    let t;
    let count = 0;
    let required = team.players.length > 5 ? 5 : team.players.length;
    for (let i in match.teams[0].ids) {
      if (team.players.indexOf(match.teams[0].ids[i]) >= 0) count += 1;
    }

    if (count === required) t = 0;
    else {
      count = 0;
      for (let i in match.teams[1].ids) {
        if (team.players.indexOf(match.teams[1].ids[i]) >= 0) count += 1;
      }

      if (count === required) t = 1;
      else continue;
    }

    // level differential
    let levelDiff = match.teams[0].level - match.teams[1].level;

    // assumes 0 is current team. if not true invert
    levelDiff = t === 0 ? levelDiff : -levelDiff;

    data.endOfGameLevels.combined.total += levelDiff;
    data.endOfGameLevels.combined.min = Math.min(data.endOfGameLevels.combined.min, levelDiff);
    data.endOfGameLevels.combined.max = Math.max(data.endOfGameLevels.combined.max, levelDiff);
    data.endOfGameLevels.combined.medianTmp.push(levelDiff);

    if (!(match.map in data.maps)) {
      data.maps[match.map] = { games: 0, wins: 0 };
    }
    data.maps[match.map].games += 1;
    if (t === winner) {
      data.maps[match.map].wins += 1;
      data.wins += 1;

      data.endOfGameLevels.win.total += levelDiff;
      data.endOfGameLevels.win.min = Math.min(data.endOfGameLevels.win.min, levelDiff);
      data.endOfGameLevels.win.max = Math.max(data.endOfGameLevels.win.max, levelDiff);
      data.endOfGameLevels.win.medianTmp.push(levelDiff);
    } else {
      data.endOfGameLevels.loss.total += levelDiff;
      data.endOfGameLevels.loss.min = Math.min(data.endOfGameLevels.loss.min, levelDiff);
      data.endOfGameLevels.loss.max = Math.max(data.endOfGameLevels.loss.max, levelDiff);
      data.endOfGameLevels.loss.medianTmp.push(levelDiff);
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
        data.heroes[hero] = newHeroData();
      }

      data.heroes[hero].games += 1;
      data.heroes[hero].involved += 1;
      if (t === winner) {
        data.heroes[hero].wins += 1;
      }

      // with stats
      for (let h2 in teamHeroes) {
        let hero2 = teamHeroes[h2];

        if (hero2 === hero) continue;

        if (!(hero2 in data.heroes[hero].with)) {
          data.heroes[hero].with[hero2] = { name: hero2, games: 0, wins: 0 };
        }

        data.heroes[hero].with[hero2].games += 1;

        if (t === winner) {
          data.heroes[hero].with[hero2].wins += 1;
        }
      }
    }

    // pick order
    if ('picks' in match) {
      let picks = match.picks[t];
      let first = match.picks.first === t;

      if (picks.length === 5) {
        if (first) {
          recordFirstPickStats(data, picks, t === winner);
        } else {
          recordSecondPickStats(data, picks, t === winner);
        }
      }
    }

    let otherTeamHeroes = t === 0 ? match.teams[1].heroes : match.teams[0].heroes;
    for (let h in otherTeamHeroes) {
      let hero = otherTeamHeroes[h];
      if (!(hero in data.heroes)) {
        data.heroes[hero] = newHeroData();
      }
      data.heroes[hero].gamesAgainst += 1;
      if (t === winner) {
        data.heroes[hero].defeated += 1;
      }

      // against stats
      for (let teamHero in teamHeroes) {
        let th = teamHeroes[teamHero];

        if (!(hero in data.heroes[th].against)) {
          data.heroes[th].against[hero] = { name: hero, games: 0, wins: 0 };
        }

        data.heroes[th].against[hero].games += 1;

        if (t === winner) {
          data.heroes[th].against[hero].wins += 1;
        }
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
          data.heroes[hero] = newHeroData();
        }

        data.heroes[hero].involved += 1;
        data.heroes[hero].bans += 1;
        data.totalBans += 1;

        if (match.bans[t][b].order === 1) {
          data.heroes[hero].first += 1;
        } else if (match.bans[t][b].order === 2) {
          data.heroes[hero].second += 1;
        }
      }

      // bans against
      let otherTeamBans = t === 0 ? match.bans[1] : match.bans[0];
      for (let b in otherTeamBans) {
        if (otherTeamBans[b].hero === '') continue;

        let hero = HeroesTalents.heroNameFromAttr(otherTeamBans[b].hero);
        if (!(hero in data.heroes)) {
          data.heroes[hero] = newHeroData();
        }

        // that's it that's all the data we wanted out of this
        data.heroes[hero].banAgainst += 1;
      }
    } catch (e) {
      // usually thrown for quick match. if picks aren't being recorded, uncomment this.
      //console.log(e);
    }

    // stat aggregation
    for (let stat in match.teams[t].stats) {
      if (stat === 'uptime') continue;

      if (stat === 'structures') {
        for (let struct in match.teams[t].stats.structures) {
          if (!(struct in data.structures)) {
            data.structures[struct] = {
              destroyed: 0,
              first: 0,
              lost: 0,
              gamesWithFirst: 0,
            };
          }

          data.structures[struct].destroyed += match.teams[t].stats.structures[struct].destroyed;
          data.structures[struct].lost += match.teams[t].stats.structures[struct].lost;

          if (match.teams[t].stats.structures[struct].destroyed > 0) {
            data.structures[struct].first += match.teams[t].stats.structures[struct].first;
            data.structures[struct].gamesWithFirst += 1;
          }
        }
      } else if (stat === 'totals') {
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
      } else if (stat === 'uptimeHistogram') {
        // bif of extra work to format these to cleanly fit in app
        for (let i = 0; i <= 5; i++) {
          const statName = `pctWith${i}HeroesAlive`;
          let time = match.teams[t].stats[stat][i] / match.length;

          // if undefined, set to 0
          if (!time) time = 0;

          if (!(statName in data.stats.total)) {
            data.stats.total[statName] = 0;

            data.stats.min[statName] = time;
            data.stats.max[statName] = time;
            data.stats.medianTmp[statName] = [];
          }
          data.stats.total[statName] += time;
          data.stats.min[statName] = Math.min(data.stats.min[statName], time);
          data.stats.max[statName] = Math.max(data.stats.max[statName], time);
          data.stats.medianTmp[statName].push(time);
        }
      } else {
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
    let intervals = [
      [1, 4],
      [4, 7],
      [7, 10],
      [10, 13],
      [13, 16],
      [16, 20],
    ];
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
      } else if (interval[0] in levels && !(interval[1] in levels)) {
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
    if (stat === 'timeTo10') data.stats.average[stat] = data.stats.total[stat] / data.level10Games;
    else if (stat === 'timeTo20') data.stats.average[stat] = data.stats.total[stat] / data.level20Games;
    else data.stats.average[stat] = data.stats.total[stat] / data.totalMatches;

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

  data.endOfGameLevels.combined.median = median(data.endOfGameLevels.combined.medianTmp);
  data.endOfGameLevels.combined.average =
    data.endOfGameLevels.combined.total / data.endOfGameLevels.combined.medianTmp.length;

  data.endOfGameLevels.win.median = median(data.endOfGameLevels.win.medianTmp);
  data.endOfGameLevels.win.average = data.endOfGameLevels.win.total / data.endOfGameLevels.win.medianTmp.length;

  data.endOfGameLevels.loss.median = median(data.endOfGameLevels.loss.medianTmp);
  data.endOfGameLevels.loss.average = data.endOfGameLevels.loss.total / data.endOfGameLevels.loss.medianTmp.length;

  // hero count
  data.heroesPlayed = 0;
  for (let h in data.heroes) {
    if (data.heroes[h].games > 0) data.heroesPlayed += 1;
  }

  return data;
}

module.exports = summarizeTeamData;
