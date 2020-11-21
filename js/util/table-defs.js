const Awards = require('../game-data/awards');
const ComputedStatsList = require('../game-data/computed-stats-list');

const STANDARD_SEGMENT_HEIGHT = 480;
const TALL_SEGMENT_HEIGHT = 560;
const STANDARD_SEGMENT_WITH_SEARCH = STANDARD_SEGMENT_HEIGHT - 50;
const STANDARD_SEGMENT_ALL = STANDARD_SEGMENT_HEIGHT - 100;

class Table {
  constructor(id, opts) {
    this.id = id;
    this.table = $(id);

    // immediately construct table
    this.table.DataTable(opts);
  }

  setData(data) {
    this.clear();
    this.table.DataTable().rows.add(data);
    this.draw();
  }

  // if the data is coming in as an object not an array
  setDataFromObject(data) {
    let dataArr = [];
    for (var key in data) {
      data[key].key = key;
      dataArr.push(data[key]);
    }

    this.setData(dataArr);
  }

  clear() {
    this.table.DataTable().clear();
  }

  draw() {
    this.table.DataTable().draw();
  }

  addRow(data) {
    this.table.DataTable().row.add(data);
  }

  // mostly for the min matches field in player for now
  filterByMinGames(threshold) {
    this.table
      .DataTable()
      .rows(function (idx, data, node) {
        return data.games < threshold;
      })
      .remove()
      .draw();
  }

  insertButtons() {
    this.table
      .DataTable()
      .buttons()
      .container()
      .appendTo($('div.eight.column:eq(0)', this.table.DataTable().table().container()));
  }
}

function preprocessAwards(data) {
  let awardsData = [];
  for (let award in data.awards) {
    awardsData.push({
      key: award,
      games: data.games,
      wins: data.awards[award],
    });
  }

  return awardsData;
}

function playerVsWinPctData(row) {
  if (row.wins) return row.wins / row.games;
  else if (row.defeated) return row.defeated / row.games;

  return 0;
}

function heroImage(name) {
  return `assets/heroes-talents/images/heroes/${Heroes.heroIcon(name)}`;
}

function heroHeader(heroName, minWidth) {
  let widthStyle = minWidth ? ` style="width: ${minWidth};"` : '';

  return `
    <h3 class="ui image inverted header"${widthStyle}>
      <img src="${heroImage(heroName)}" class="ui rounded image">
      <div class="content">
        ${heroName}
      </div>
    </h3>
  `;
}

function awardHeader(awardKey) {
  let awardData = Heroes.awardInfo(awardKey);
  return `
    <h3 class="ui image inverted header">
      <img src="assets/images/${awardData.image}" class="ui rounded small image">
      <div class="content">
        ${awardData.name}
        <div class="sub header">${awardData.subtitle}</div>
      </div>
    </h3>
  `;
}

function deltaPctRender(data) {
  let pct = `${data > 0 ? '+' : ''}${formatStat('pct', data)}`;
  return `<span class="${data === 0 ? '' : data > 0 ? 'plus' : 'minus'}">${pct}</span>`;
}

function combinedNumericPct(pct, count, type) {
  if (type === 'sort') {
    return pct;
  }

  return `${formatStat('pct', pct)} (${count})`;
}

const PlayerVsTableFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'name',
      render: heroHeader,
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
  ],
  order: [
    [2, 'desc'],
    [1, 'desc'],
  ],
  paging: false,
  searching: false,
  scrollY: STANDARD_SEGMENT_HEIGHT,
  info: false,
};

const PlayerVsPlayerFormat = {
  columns: [
    {
      title: 'Player',
      data: 'name',
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
  ],
  order: [
    [2, 'desc'],
    [1, 'desc'],
  ],
  paging: true,
  pageLength: 50,
  searching: true,
  info: true,
  scrollY: STANDARD_SEGMENT_ALL,
};

const SkinFormat = {
  columns: [
    {
      title: 'Skin ID',
      data: 'key',
      width: '50%',
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
      width: '25%',
    },
    {
      title: 'Games',
      data: 'games',
      width: '25%',
    },
  ],
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
  paging: true,
  searching: true,
  info: true,
  scrollY: STANDARD_SEGMENT_ALL,
  pageLength: 50,
};

const MapFormat = {
  columns: [
    {
      title: 'Map',
      data: 'key',
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
  ],
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
  paging: false,
  info: false,
  scrollY: TALL_SEGMENT_HEIGHT,
  searching: false,
};

const AwardFormat = {
  columns: [
    {
      title: 'Award',
      data: 'key',
      render: (data) => awardHeader(data),
    },
    {
      title: 'Award %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'wins',
    },
  ],
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
  paging: false,
  info: false,
  scrollY: STANDARD_SEGMENT_HEIGHT,
  searching: false,
};

const PlayerCompareToAvgFormat = {
  columns: [
    {
      title: 'Stat',
      data: 'statName',
      render: (data) => `<h3 class="ui inverted header">${data}</h3>`,
    },
    {
      title: 'Player',
      data: 'pDataSort',
      render: (data, type, row) => row.pData,
    },
    {
      title: 'Diff',
      data: 'pctDiff',
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Average',
      data: 'cmpDataSort',
      render: (data, type, row) => row.cmpData,
    },
  ],
  order: [[0, 'asc']],
  paging: false,
  info: false,
  scrollY: STANDARD_SEGMENT_WITH_SEARCH,
  searching: true,
};

const HeroSummaryFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'key',
      render: heroHeader,
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
    {
      title: 'KDA',
      data: 'stats.totalKDA',
      render: (data) => formatStat('KDA', data),
    },
    {
      title: 'Takedowns',
      data: 'stats.Takedowns',
    },
    {
      title: 'Kills',
      data: 'stats.SoloKill',
    },
    {
      title: 'Assists',
      data: 'stats.Assists',
    },
    {
      title: 'Deaths',
      data: 'stats.Deaths',
    },
    {
      title: 'MVP %',
      data: 'stats.MVPPct',
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Award %',
      data: 'stats.AwardPct',
      render: (data) => formatStat('pct', data),
    },
  ],
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
  paging: false,
  info: false,
  scrollY: TALL_SEGMENT_HEIGHT,
  searching: false,
};

function getHeroStatSafe(target, row) {
  if (target in row) {
    return row[target].toFixed(2);
  }

  return 0;
}

// this one's large, and also can be automated.
function playerDetailStatFormat() {
  let columns = [
    {
      title: 'Hero',
      data: 'key',
      render: (data) => heroHeader(data, '200px'),
    },
    {
      title: 'Games',
      data: 'games',
    },
  ];

  let allStats = DetailStatList;
  for (let m in PerMapStatList) {
    allStats = allStats.concat(PerMapStatList[m]);
  }

  for (let i in allStats) {
    columns.push({
      title: DetailStatString[allStats[i]],
      data: (row) => getHeroStatSafe(allStats[i], row),
      render: (data, type) => {
        if (type === 'display') return formatStat(allStats[i], data);

        return parseFloat(data);
      },
    });
  }

  return {
    columns,
    order: [[0, 'asc']],
    paging: false,
    info: false,
    scrollY: 'calc(100vh - 380px)',
    scrollX: true,
    searching: false,
    fixedColumns: true,
    scrollCollapse: true,
  };
}

function addnlPlayerStats() {
  const columns = [];

  for (let stat of ComputedStatsList) {
    columns.push({
      title: DetailStatString[stat],
      data: (row) => getHeroStatSafe(stat, row),
      render: (data, type) => {
        if (type === 'display') return formatStat(stat, data);

        return parseFloat(data);
      },
    });
  }

  return columns;
}

function playerRankingStatFormat() {
  let base = playerDetailStatFormat();
  base.columns[0] = {
    title: 'Player',
    data: 'name',
    render: (data, type, row) =>
      `<h3 class="ui inverted header player-name link-to-player" player-id="${row.id}">${data}</h4>`,
  };

  const wins = {
    title: 'Win %',
    data: 'winPercent',
    render: (data) => formatStat('pct', data),
  };

  base.columns.splice(2, 0, wins);

  base.columns.push({
    title: 'Hero Pool',
    data: 'Pool',
  });

  // awards n stuff
  const awardsColumns = [
    {
      title: 'Votes',
      data: 'votes',
    },
    {
      title: 'Awards',
      data: 'totalAwards',
    },
    {
      title: 'Award %',
      data: 'awardPct',
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'MVP',
      data: 'totalMVP',
    },
    {
      title: 'MVP %',
      data: 'MVPPct',
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Bsteps',
      data: 'taunts.bsteps.count',
    },
    {
      title: 'Bstep TD',
      data: 'taunts.bsteps.takedowns',
    },
    {
      title: 'Bstep Deaths',
      data: 'taunts.bsteps.deaths',
    },
    {
      title: 'Taunts',
      data: 'taunts.taunts.count',
    },
    {
      title: 'Taunt TD',
      data: 'taunts.taunts.takedowns',
    },
    {
      title: 'Taunt Deaths',
      data: 'taunts.taunts.deaths',
    },
    {
      title: 'Sprays',
      data: 'taunts.sprays.count',
    },
    {
      title: 'Spray TD',
      data: 'taunts.sprays.takedowns',
    },
    {
      title: 'Spray Deaths',
      data: 'taunts.sprays.deaths',
    },
    {
      title: 'Dances',
      data: 'taunts.dances.count',
    },
    {
      title: 'Dance TD',
      data: 'taunts.dances.takedowns',
    },
    {
      title: 'Dance Deaths',
      data: 'taunts.dances.deaths',
    },
  ];

  base.columns = base.columns.concat(addnlPlayerStats(), awardsColumns);

  base.order = [[1, 'desc']];
  base.paging = true;
  base.info = true;
  base.searching = true;
  base.scrollCollapse = false;
  base.pageLength = 100;
  base.lengthMenu = [25, 50, 100, 250, 500];
  base.scrollY = 'calc(100vh - 370px)';
  base.buttons = ['csv', 'excel'];

  return base;
}

const TeamHeroSummaryFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'heroName',
      render: heroHeader,
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Pick %',
      data: (row) => row.games / row.totalMatches,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
    {
      title: 'TD',
      data: 'stats.Takedowns',
    },
    {
      title: 'D',
      data: 'stats.Deaths',
    },
    {
      title: 'K',
      data: 'stats.SoloKill',
    },
    {
      title: 'KDA',
      data: (row) => row.stats.Takedowns / Math.max(1, row.stats.Deaths),
      render: (data) => formatStat('KDA', data),
    },
    {
      title: 'Avg. % Dead',
      data: (row) => row.stats.timeDeadPct / row.games,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Pick Pre-Mid',
      data: (row) => row.picks.preMid.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.preMid.count, type),
    },
    {
      title: 'Pick Post-Mid',
      data: (row) => row.picks.postMid.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.postMid.count, type),
    },
  ],
  scrollY: STANDARD_SEGMENT_HEIGHT,
  paging: false,
  info: false,
  searching: false,
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
};

const TeamHeroPickDetailFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'heroName',
      render: heroHeader,
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Pick %',
      data: (row) => row.games / row.totalMatches,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
    {
      title: 'Pick Pre-Mid',
      data: (row) => row.picks.preMid.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.preMid.count, type),
    },
    {
      title: 'Pick Post-Mid',
      data: (row) => row.picks.postMid.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.postMid.count, type),
    },
    {
      title: 'Pick R1',
      data: (row) => row.picks.round1.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.round1.count, type),
    },
    {
      title: 'Pick R2',
      data: (row) => row.picks.round2.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.round2.count, type),
    },
    {
      title: 'Pick R3',
      data: (row) => row.picks.round3.count / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.picks.round3.count, type),
    },
  ],
  scrollY: STANDARD_SEGMENT_HEIGHT,
  paging: false,
  info: false,
  searching: false,
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
};

const TeamBanSummaryFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'heroName',
      render: heroHeader,
    },
    {
      title: 'Bans',
      data: (row) => row.bans / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.bans, type),
    },
    {
      title: '1st Ban',
      data: (row) => row.first / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.first, type),
    },
    {
      title: '2nd Ban',
      data: (row) => row.second / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.second, type),
    },
    {
      title: 'Ban Vs.',
      data: (row) => row.banAgainst / row.totalMatches,
      render: (data, type, row) => combinedNumericPct(data, row.banAgainst, type),
    },
  ],
  scrollY: STANDARD_SEGMENT_HEIGHT,
  paging: false,
  info: false,
  searching: false,
  order: [
    [1, 'desc'],
    [2, 'desc'],
  ],
};

const TeamCompareToAvgFormat = {
  columns: [
    {
      title: 'Stat',
      data: 'statName',
      render: (data) => `<h3 class="ui inverted header">${data}</h3>`,
    },
    {
      title: 'Team',
      data: 'pDataSort',
      render: (data, type, row) => row.pData,
    },
    {
      title: 'Diff',
      data: 'pctDiff',
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Average',
      data: 'cmpDataSort',
      render: (data, type, row) => row.cmpData,
    },
  ],
  order: [[0, 'asc']],
  paging: false,
  info: false,
  scrollY: STANDARD_SEGMENT_WITH_SEARCH,
  searching: true,
};

const HeroDetailCompareFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'name',
      render: heroHeader,
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
    {
      title: 'Win % Δ',
      data: (row) => playerVsWinPctData(row) - row.avgWinPct,
      render: deltaPctRender,
    },
  ],
  order: [
    [2, 'desc'],
    [1, 'desc'],
  ],
  paging: false,
  searching: false,
  scrollY: STANDARD_SEGMENT_HEIGHT,
  info: false,
};

const HeroDetailPlayerFormat = {
  columns: [
    {
      title: 'Player',
      data: 'name',
      render: (data, type, row) =>
        `<h3 class="ui inverted header player-name link-to-player" player-id="${row.key}">${data}</h3>`,
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'games',
    },
    {
      title: 'KDA',
      data: 'totalKDA',
      render: (data) => formatStat('KDA', data),
    },
    {
      title: 'TD',
      data: 'total.Takedowns',
    },
    {
      title: 'K',
      data: 'total.SoloKill',
    },
    {
      title: 'A',
      data: 'total.Assists',
    },
    {
      title: 'D',
      data: 'total.Deaths',
    },
    {
      title: 'Avg. Time Dead %',
      data: 'averages.timeDeadPct',
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Avg. DPM',
      data: 'averages.DPM',
      render: (data) => formatStat('DPM', data, true),
    },
    {
      title: 'Avg. HPM',
      data: 'averages.HPM',
      render: (data) => formatStat('HPM', data, true),
    },
    {
      title: 'Clutch Heals',
      data: 'total.ClutchHealsPerformed',
    },
  ],
  order: [
    [2, 'desc'],
    [1, 'desc'],
  ],
  paging: true,
  pageLength: 50,
  searching: true,
  info: true,
  scrollY: STANDARD_SEGMENT_ALL,
};

// this one sucks a lil, there's no list of team stats and they're all over the place.
const TeamRankingFormat = {
  columns: [
    {
      title: 'Team Name',
      data: 'name',
      width: '300px',
      render: (data, type, row) =>
        `<h3 class="ui inverted header player-name link-to-team" team-id="${row.id}">${data}</h3>`,
    },
    {
      title: 'Win %',
      data: (row) => row.wins / row.totalMatches,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'Games',
      data: 'totalMatches',
    },
    {
      title: 'First Pick %',
      data: (row) => row.firstPicks / row.totalMatches,
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'First Pick Win %',
      data: (row) => (row.firstPicks === 0 ? 0 : row.firstPickWins / row.firstPicks),
      render: (data) => formatStat('pct', data),
    },
    {
      title: 'KDA',
      data: 'selectedStats.totalKDA',
      render: (data) => formatStat('KDA', data),
    },
    {
      title: 'Takedowns',
      data: 'selectedStats.Takedowns',
      render: (data) => formatStat('Takedowns', data, true),
    },
    {
      title: 'Deaths',
      data: 'selectedStats.Deaths',
      render: (data) => formatStat('Deaths', data, true),
    },
    {
      title: 'Hero Pool',
      data: 'heroesPlayed',
    },
    {
      title: 'People Per Kill',
      data: 'selectedStats.PPK',
      render: (data) => formatStat('PPK', data),
    },
    {
      title: 'Time Spent Dead',
      data: 'selectedStats.TimeSpentDead',
      render: (data, type) => {
        if (type === 'display') return formatStat('TimeSpentDead', data);

        return parseFloat(data);
      },
    },
    {
      title: '% Time Dead',
      data: 'selectedStats.timeDeadPct',
      render: (data) => formatStat('timeDeadPct', data, true),
    },
    {
      title: 'Time w/ Level Adv.',
      data: 'selectedStats.levelAdvTime',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: '% of Game w/ Level Adv.',
      data: 'selectedStats.levelAdvPct',
      render: (data) => formatStat('pct', data, true),
    },
    {
      title: 'Avg. Level Adv.',
      data: 'selectedStats.avgLevelAdv',
      render: (data) => formatStat('avgLevelAdv', data, true),
    },
    {
      title: 'Avg. Heroes Alive',
      data: 'selectedStats.avgHeroesAlive',
      render: (data) => formatStat('avgHeroesAlive', data, true),
    },
    {
      title: 'Time w/ Hero Adv.',
      data: 'selectedStats.timeWithHeroAdv',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: '% of Game w/ Hero Adv.',
      data: 'selectedStats.pctWithHeroAdv',
      render: (data) => formatStat('pct', data, true),
    },
    {
      title: 'Aces',
      data: 'selectedStats.aces',
      render: (data) => formatStat('aces', data, true),
    },
    {
      title: 'Wipes',
      data: 'selectedStats.wipes',
      render: (data) => formatStat('wipes', data, true),
    },
    {
      title: 'Passive XP/s',
      data: 'selectedStats.passiveXPRate',
      render: (data) => formatStat('passiveXPRate', data, true),
    },
    {
      title: 'Passive XP % Gain',
      data: 'selectedStats.passiveXPDiff',
      render: (data) => formatStat('passiveXPDiff', data, true),
    },
    {
      title: 'Passive XP Gain',
      data: 'selectedStats.passiveXPGain',
      render: (data) => formatStat('passiveXPGain', data, true),
    },
    {
      title: 'Hero Damage',
      data: 'selectedStats.HeroDamage',
      render: (data) => formatStat('HeroDamage', data),
    },
    {
      title: 'Siege Damage',
      data: 'selectedStats.SiegeDamage',
      render: (data) => formatStat('SiegeDamage', data),
    },
    {
      title: 'Minion Damage',
      data: 'selectedStats.MinionDamage',
      render: (data) => formatStat('MinionDamage', data),
    },
    {
      title: 'Creep Damage',
      data: 'selectedStats.CreepDamage',
      render: (data) => formatStat('CreepDamage', data),
    },
    {
      title: 'Damage Taken',
      data: 'selectedStats.DamageTaken',
      render: (data) => formatStat('DamageTaken', data),
    },
    {
      title: 'Healing',
      data: 'selectedStats.Healing',
      render: (data) => formatStat('Healing', data),
    },
    {
      title: 'Self Healing',
      data: 'selectedStats.SelfHealing',
      render: (data) => formatStat('SelfHealing', data),
    },
    {
      title: 'Shielding',
      data: 'selectedStats.ProtectionGivenToAllies',
      render: (data) => formatStat('ProtectionGivenToAllies', data),
    },
    {
      title: 'Team Fight Hero Damage',
      data: 'selectedStats.TeamfightHeroDamage',
      render: (data) => formatStat('TeamfightHeroDamage', data),
    },
    {
      title: 'Team Fight Damage Taken',
      data: 'selectedStats.TeamfightDamageTaken',
      render: (data) => formatStat('TeamfightDamageTaken', data),
    },
    {
      title: 'Teamfight Healing',
      data: 'selectedStats.TeamfightHealingDone',
      render: (data) => formatStat('TeamfightHealingDone', data),
    },
    {
      title: 'CC Time',
      data: 'selectedStats.TimeCCdEnemyHeroes',
      render: (data, type) => {
        if (type === 'display') return formatStat('TimeCCdEnemyHeroes', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Root Time',
      data: 'selectedStats.TimeRootingEnemyHeroes',
      render: (data, type) => {
        if (type === 'display') return formatStat('TimeRootingEnemyHeroes', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Silence Time',
      data: 'selectedStats.TimeSilencingEnemyHeroes',
      render: (data, type) => {
        if (type === 'display') return formatStat('TimeSilencingEnemyHeroes', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Stun Time',
      data: 'selectedStats.TimeStunningEnemyHeroes',
      render: (data, type) => {
        if (type === 'display') return formatStat('TimeStunningEnemyHeroes', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Match Length',
      data: 'matchLength.val',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Time to Level 10',
      data: 'selectedStats.timeTo10',
      render: (data, type) => {
        if (type === 'display') return formatStat('timeTo10', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Games Reached Level 10',
      data: 'level10Games',
    },
    {
      title: 'Time to Level 20',
      data: 'selectedStats.timeTo20',
      render: (data, type) => {
        if (type === 'display') return formatStat('timeTo20', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Games Reached Level 20',
      data: 'level20Games',
    },
    {
      title: 'Time @ Level 1',
      data: 'tierTimes.T1.average',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Time @ Level 4',
      data: 'tierTimes.T2.average',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Time @ Level 7',
      data: 'tierTimes.T3.average',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Time @ Level 10',
      data: 'tierTimes.T4.average',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Time @ Level 13',
      data: 'tierTimes.T5.average',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Time @ Level 16',
      data: 'tierTimes.T6.average',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: '% of Game w/ 0 Heroes',
      data: 'selectedStats.pctWith0HeroesAlive',
      render: (data) => formatStat('pctWith0HeroesAlive', data),
    },
    {
      title: '% of Game w/ 1 Heroes',
      data: 'selectedStats.pctWith1HeroesAlive',
      render: (data) => formatStat('pctWith1HeroesAlive', data),
    },
    {
      title: '% of Game w/ 2 Heroes',
      data: 'selectedStats.pctWith2HeroesAlive',
      render: (data) => formatStat('pctWith2HeroesAlive', data),
    },
    {
      title: '% of Game w/ 3 Heroes',
      data: 'selectedStats.pctWith3HeroesAlive',
      render: (data) => formatStat('pctWith3HeroesAlive', data),
    },
    {
      title: '% of Game w/ 4 Heroes',
      data: 'selectedStats.pctWith4HeroesAlive',
      render: (data) => formatStat('pctWith4HeroesAlive', data),
    },
    {
      title: '% of Game w/ 5 Heroes',
      data: 'selectedStats.pctWith5HeroesAlive',
      render: (data) => formatStat('pctWith5HeroesAlive', data),
    },
    {
      title: 'Mercenary Captures',
      data: 'selectedStats.mercCaptures',
      render: (data) => formatStat('mercCaptures', data),
    },
    {
      title: 'Mercenary Uptime',
      data: 'selectedStats.mercUptime',
      render: (data, type) => {
        if (type === 'display') return formatStat('mercUptime', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Mercenary Uptime %',
      data: 'selectedStats.mercUptimePercent',
      render: (data) => formatStat('mercUptimePercent', data),
    },
    {
      title: 'Lv Δ',
      data: 'endOfGameLevels.combined.average',
      render: (data) => formatStat('', data, true),
    },
    {
      title: 'Win Lv Δ',
      data: 'endOfGameLevels.win.average',
      render: (data) => formatStat('', data, true),
    },
    {
      title: 'Loss Lv Δ',
      data: 'endOfGameLevels.loss.average',
      render: (data) => formatStat('', data, true),
    },
    {
      title: 'Max Level Adv.',
      data: 'selectedStats.maxLevelAdv',
      render: (data) => formatStat('maxLevelAdv', data),
    },
    {
      title: 'Forts Destroyed',
      data: 'structures.Fort.destroyed',
      render: (data) => formatStat('', data, true),
    },
    {
      title: 'Time to First Fort',
      data: 'structures.Fort.first',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Forts Lost',
      data: 'structures.Fort.lost',
      render: (data) => formatStat('', data, true),
    },
    {
      title: 'Keeps Destroyed',
      data: 'structures.Keep.destroyed',
      render: (data) => formatStat('', data, true),
    },
    {
      title: 'Time to First Keep',
      data: 'structures.Keep.first',
      render: (data, type) => {
        if (type === 'display') return formatStat('Time', data);

        return parseFloat(data);
      },
    },
    {
      title: 'Keeps Lost',
      data: 'structures.Keep.lost',
      render: (data) => formatStat('', data, true),
    },
  ],
  order: [[0, 'asc']],
  paging: true,
  info: true,
  searching: true,
  scrollCollapse: false,
  pageLength: 100,
  lengthMenu: [25, 50, 100, 250, 500],
  scrollY: 'calc(100vh - 430px)',
  scrollX: true,
  buttons: ['csv', 'excel'],
  fixedColumns: true,
};

function safeAwardAccess(key, data) {
  if (key in data.awards) return data.awards[key];

  return 0;
}

function awardsTrackerFormat() {
  // scrolling full height table that has the award stuff
  let columns = [
    {
      title: 'Hero',
      data: 'key',
      render: heroHeader,
    },
    {
      title: 'Total',
      data: 'totalAwards',
      render: (data) => `<span class="award">${data}</span>`,
    },
    {
      title: 'MVP',
      data: (row) => safeAwardAccess('EndOfMatchAwardMVPBoolean', row),
      render: (data) => `<span class="award">${data}</span>`,
    },
  ];

  // ok now the awards
  for (let awardKey in Awards) {
    if (awardKey === 'EndOfMatchAwardMVPBoolean') continue;

    columns.push({
      title: Awards[awardKey].name,
      data: (row) => safeAwardAccess(awardKey, row),
      render: (data) => `<span class="award">${data}</span>`,
    });
  }

  return {
    columns,
    order: [[0, 'asc']],
    paging: false,
    info: false,
    scrollY: 'calc(100vh - 380px)',
    scrollX: true,
    searching: false,
    fixedColumns: {
      leftColumns: 2,
    },
    scrollCollapse: true,
  };
}

function playerHeroDuoFormat(type) {
  let columns = [
    {
      title: 'Hero',
      data: 'key',
      render: heroHeader,
    },
  ];

  // aaaand now the heroes
  for (let hero of Heroes.allHeroNames) {
    columns.push({
      title: hero,
      className: 'duo-cell',
      data: (row) => {
        if (hero in row[type]) {
          return row[type][hero].wins / row[type][hero].games;
        }

        return 0;
      },
      render: (data, t, row) => {
        if (hero in row[type]) {
          // determine the class out of the five options based on win rate
          // fail (0-25), bad (25-35), poor (35-45), neutral (45-55), good (55-65), great (65-75), excellent (75+)
          let classname = 'fail';

          if (data > 0.25) classname = 'bad';
          if (data > 0.35) classname = 'poor';
          if (data > 0.45) classname = 'neutral';
          if (data > 0.55) classname = 'good';
          if (data > 0.65) classname = 'great';
          if (data > 0.75) classname = 'excellent';

          return `
            <div class="player-duo-cell">
              <div class="cell-text">${formatStat('pct', data)}<br />${row[type][hero].wins} - ${
            row[type][hero].games - row[type][hero].wins
          }</div>
            </div>
            <div class="duo-bg ${classname}"></div>
          `;
        }

        return '<div class="player-duo-cell empty"></div>';
      },
    });
  }

  return {
    columns,
    order: [[0, 'asc']],
    paging: false,
    info: false,
    scrollY: 'calc(100vh - 380px)',
    scrollX: true,
    searching: false,
    fixedColumns: true,
    scrollCollapse: true,
  };
}

exports.Table = Table;
exports.PlayerVsTableFormat = PlayerVsTableFormat;
exports.PlayerVsPlayerFormat = PlayerVsPlayerFormat;
exports.SkinFormat = SkinFormat;
exports.MapFormat = MapFormat;
exports.AwardFormat = AwardFormat;
exports.PlayerCompareToAvgFormat = PlayerCompareToAvgFormat;
exports.HeroSummaryFormat = HeroSummaryFormat;
exports.PlayerDetailStatFormat = playerDetailStatFormat();
exports.TeamHeroSummaryFormat = TeamHeroSummaryFormat;
exports.TeamBanSummaryFormat = TeamBanSummaryFormat;
exports.TeamCompareToAvgFormat = TeamCompareToAvgFormat;
exports.HeroDetailCompareFormat = HeroDetailCompareFormat;
exports.HeroDetailPlayerFormat = HeroDetailPlayerFormat;
exports.PlayerRankingStatFormat = playerRankingStatFormat();
exports.TeamRankingFormat = TeamRankingFormat;
exports.AwardsTrackerFormat = awardsTrackerFormat();
exports.preprocessAwards = preprocessAwards;
exports.PlayerDuoWithFormat = playerHeroDuoFormat('with');
exports.PlayerDuoAgainstFormat = playerHeroDuoFormat('against');
exports.TeamHeroPickDetailFormat = TeamHeroPickDetailFormat;
