function heroDraftCSV(matchData, Heroes) {
  // pull specific values
  let outData = '';
  let fields = [
    'hero',
    'role',
    'wins',
    'games',
    'involved',
    'round 1',
    'round 2',
    'round 3',
    'bans',
    'ban 1',
    'ban 2',
    'round 1 wins',
    'round 2 wins',
    'round 3 wins',
    'totalGames',
  ];

  outData += fields.join(',');

  for (let h in matchData.data) {
    if (h === 'totalMatches' || h === 'totalBans') continue;

    let hero = matchData.data[h];

    let row = '';
    row += h;
    row += ',' + Heroes.role(h);
    row += ',' + hero.wins;
    row += ',' + hero.games;
    row += ',' + hero.involved;
    row += ',' + hero.picks.round1.count;
    row += ',' + hero.picks.round2.count;
    row += ',' + hero.picks.round3.count;
    row += ',' + hero.bans.total;
    row += ',' + hero.bans.first;
    row += ',' + hero.bans.second;
    row += ',' + hero.picks.round1.wins;
    row += ',' + hero.picks.round2.wins;
    row += ',' + hero.picks.round3.wins;
    row += ',' + matchData.data.totalMatches;

    outData += '\n' + row;
  }

  return outData;
}

module.exports = heroDraftCSV;
