// initial value, final value
function delta(v1, v2) {
  if (v1 === 0) return v2;
  if (v2 === 0) return -1 * v1;
  return (v2 - v1) / v1;
}

function deltaMax(v1, v2) {
  if (v1 === 0 && v2 === 0) return 0;
  if (v1 === 0) return 1;
  if (v2 === 0) return -1;
  return (v2 - v1) / v1;
}

function summarizeTrendData(p1stats, p2stats) {
  const stats = {
    period1: p1stats.data,
    period2: p2stats.data,
  };

  const hContext = [];

  // should aggregate these since some heroes might not show up in both periods
  const aggr = {};
  for (let period in stats) {
    const data = stats[period];

    for (let heroName in data) {
      if (heroName === 'totalMatches' || heroName === 'totalBans') continue;
      aggr[heroName] = aggr[heroName] || {};

      const hero = data[heroName];

      // general win loss pop stats
      const win = {
        heroName,
        winPercent: hero.games === 0 ? 0 : hero.wins / hero.games,
        banPercent: hero.bans.total / data.totalMatches,
        popPercent: hero.involved / data.totalMatches,
        games: hero.games,
        win: hero.wins,
        loss: hero.games - hero.wins,
        bans: hero.bans.total,
        heroRole: Heroes.role(heroName).split(' ').join('-'),
      };

      // picks and bans
      const draft = {
        format: {},
        games: hero.games,
        heroName,
        heroRole: win.heroRole,
        winPercent: win.winPercent,
        banPercent: win.banPercent,
        bans: hero.bans,
        firstBanPercent: hero.bans.first / data.totalMatches,
        secondBanPercent: hero.bans.second / data.totalMatches,
        picks: hero.picks,
      };

      for (let pick in draft.picks) {
        draft.picks[pick].pct = draft.picks[pick].count / data.totalMatches;
      }

      aggr[heroName][period] = { win, draft };
    }
  }

  for (let heroName in aggr) {
    // default values
    stats.period1[heroName] = stats.period1[heroName] || { involved: 0 };
    stats.period2[heroName] = stats.period2[heroName] || { involved: 0 };

    if (stats.period1[heroName].involved + stats.period2[heroName].involved < trendsHeroMatchThreshold) continue;

    const context = {
      heroName,
      heroRole: Heroes.role(heroName).split(' ').join('-'),
      period1: aggr[heroName].period1 || {
        win: {
          winPercent: 0,
          banPercent: 0,
          popPercent: 0,
          games: 0,
        },
        draft: {
          picks: {
            round1: {
              pct: 0,
            },
            round2: {
              pct: 0,
            },
            round3: {
              pct: 0,
            },
          },
          firstBanPercent: 0,
          secondBanPercent: 0,
        },
      },
      period2: aggr[heroName].period2 || {
        win: {
          winPercent: 0,
          banPercent: 0,
          popPercent: 0,
          games: 0,
        },
        draft: {
          picks: {
            round1: {
              pct: 0,
            },
            round2: {
              pct: 0,
            },
            round3: {
              pct: 0,
            },
          },
          firstBanPercent: 0,
          secondBanPercent: 0,
        },
      },
      delta: {},
      deltaFmt: {},
      statSign: {},
    };

    // note that percentage deltas are linear
    context.delta = {
      winPercent: delta(context.period1.win.winPercent, context.period2.win.winPercent),
      popPercent: delta(context.period1.win.popPercent, context.period2.win.popPercent),
      banPercent: delta(context.period1.win.banPercent, context.period2.win.banPercent),
      win: deltaMax(context.period1.win.win, context.period2.win.win),
      loss: deltaMax(context.period1.win.loss, context.period2.win.loss),
      games: deltaMax(context.period1.win.games, context.period2.win.games),
      r1: delta(context.period1.draft.picks.round1.pct, context.period2.draft.picks.round1.pct),
      r2: delta(context.period1.draft.picks.round2.pct, context.period2.draft.picks.round2.pct),
      r3: delta(context.period1.draft.picks.round3.pct, context.period2.draft.picks.round3.pct),
      firstBanPercent: delta(context.period1.draft.firstBanPercent, context.period2.draft.firstBanPercent),
      secondBanPercent: delta(context.period1.draft.secondBanPercent, context.period2.draft.secondBanPercent),
    };

    for (let stat in context.delta) {
      if (isNaN(context.delta[stat])) {
        context.deltaFmt[stat] = '0.0%';
        context.delta[stat] = '0';
      } else {
        context.deltaFmt[stat] = formatStat('pct', context.delta[stat]);
      }

      if (context.delta[stat] > 0) {
        context.deltaFmt[stat] = '+' + context.deltaFmt[stat];
        context.statSign[stat] = 'plus';
      } else if (context.delta[stat] < 0) {
        context.statSign[stat] = 'minus';
      }
    }

    hContext.push(context);
    // render code
  }

  // composition aggregation
  const comps = {};
  for (let c in p1stats.compositions) {
    const comp = p1stats.compositions[c];

    // nothing exists yet
    comps[c] = {
      p1Win: comp.wins / comp.games,
      p1Pop: comp.games / (p1stats.data.totalMatches * 2),
      p2Win: 0,
      p2Pop: 0,
      winDelta: -1,
      popDelta: -1,
      roles: comp.roles,
    };
  }

  for (let c in p2stats.compositions) {
    let comp = p2stats.compositions[c];

    if (!(c in comps)) {
      comps[c] = {
        p1Win: 0,
        p1Pop: 0,
        roles: comp.roles,
      };
    }

    comps[c].p2Win = comp.wins / comp.games;
    comps[c].p2Pop = comp.games / (p2stats.data.totalMatches * 2);

    comps[c].winDelta = deltaMax(comps[c].p1Win, comps[c].p2Win);
    comps[c].popDelta = deltaMax(comps[c].p1Pop, comps[c].p2Pop);
  }

  return { hContext, comps };
}

module.exports = summarizeTrendData;
