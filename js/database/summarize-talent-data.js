// this is intended to be used with only one hero but can be used with multiple (?)
// needs a heroes-talent instance
function summarizeTalentData(docs, Heroes) {
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
      let tid = Heroes.getRenamedTalent(match.talents[t]);
      key += tid;

      if (!(t in talentStats[match.hero])) {
        talentStats[match.hero][t] = {};
      }

      if (!(tid in talentStats[match.hero][t])) {
        talentStats[match.hero][t][tid] = { games: 0, wins: 0 };
      }

      talentStats[match.hero][t][tid].games += 1;

      if (match.win) {
        talentStats[match.hero][t][tid].wins += 1;
      }
    }

    if (!(key in buildStats[match.hero])) {
      buildStats[match.hero][key] = {
        games: 0,
        wins: 0,
        matches: [],
        talents: match.talents,
      };
    }
    buildStats[match.hero][key].games += 1;
    buildStats[match.hero][key].matches.push(match.matchID);

    if (match.win) {
      buildStats[match.hero][key].wins += 1;
    }
  }

  return { talentStats, buildStats };
}

module.exports = summarizeTalentData;
