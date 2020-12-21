function newMatchHeroData() {
  return {
    wins: 0,
    bans: {
      first: 0,
      second: 0,
      total: 0,
    },
    games: 0,
    involved: 0,
    picks: {
      round1: { count: 0, wins: 0 },
      round2: { count: 0, wins: 0 },
      round3: { count: 0, wins: 0 },
      preMid: { count: 0, wins: 0 },
      postMid: { count: 0, wins: 0 },
    },
  };
}

// this returns an object containing hero name and various pick
// and win stats for the given collection of matches
// need a heroes talents instance to process the bans
// it also returns various team related stats
function summarizeMatchData(docs, HeroesTalents) {
  let data = {};
  data.totalMatches = docs.length;
  data.totalBans = 0;

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
          data[hero] = newMatchHeroData();
        }
        comp.push(HeroesTalents.role(hero));

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

        data[pickData[first][0]].picks.preMid.count += 1;
        data[pickData[first][1]].picks.preMid.count += 1;
        data[pickData[first][2]].picks.preMid.count += 1;
        data[pickData[first][3]].picks.postMid.count += 1;
        data[pickData[first][4]].picks.postMid.count += 1;

        data[pickData[second][0]].picks.preMid.count += 1;
        data[pickData[second][1]].picks.preMid.count += 1;
        data[pickData[second][2]].picks.postMid.count += 1;
        data[pickData[second][3]].picks.postMid.count += 1;
        data[pickData[second][4]].picks.postMid.count += 1;

        if (first === winner) {
          data[pickData[first][0]].picks.round1.wins += 1;
          data[pickData[first][1]].picks.round2.wins += 1;
          data[pickData[first][2]].picks.round2.wins += 1;
          data[pickData[first][3]].picks.round3.wins += 1;
          data[pickData[first][4]].picks.round3.wins += 1;

          data[pickData[first][0]].picks.preMid.wins += 1;
          data[pickData[first][1]].picks.preMid.wins += 1;
          data[pickData[first][2]].picks.preMid.wins += 1;
          data[pickData[first][3]].picks.postMid.wins += 1;
          data[pickData[first][4]].picks.postMid.wins += 1;
        } else {
          data[pickData[second][0]].picks.round1.wins += 1;
          data[pickData[second][1]].picks.round1.wins += 1;
          data[pickData[second][2]].picks.round2.wins += 1;
          data[pickData[second][3]].picks.round2.wins += 1;
          data[pickData[second][4]].picks.round3.wins += 1;

          data[pickData[second][0]].picks.preMid.wins += 1;
          data[pickData[second][1]].picks.preMid.wins += 1;
          data[pickData[second][2]].picks.postMid.wins += 1;
          data[pickData[second][3]].picks.postMid.wins += 1;
          data[pickData[second][4]].picks.postMid.wins += 1;
        }
      } else {
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
            data[hero] = newMatchHeroData();
          }

          if (match.bans[t][b].order === 1) {
            data[hero].bans.first += 1;
          } else if (match.bans[t][b].order === 2) {
            data[hero].bans.second += 1;
          }

          data[hero].involved += 1;
          data[hero].bans.total += 1;
          data.totalBans += 1;
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  return { data, compositions };
}

module.exports = summarizeMatchData;
