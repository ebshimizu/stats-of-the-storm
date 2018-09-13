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

  // mostly for the min matches field in player for now
  filterByMinGames(threshold) {
    this.table.DataTable().rows(function(idx, data, node) {
      return data.games < threshold;
    }).remove().draw();
  }
}

function preprocessAwards(data) {
  let awardsData = [];
  for (let award in data.awards) {
    awardsData.push({
      key: award,
      games: data.games,
      wins: data.awards[award]
    });
  }

  return awardsData;
}

function playerVsWinPctData(row) {
  if (row.wins)
    return row.wins / row.games;
  else if (row.defeated)
    return row.defeated / row.games;

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

const PlayerVsTableFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'name',
      render: heroHeader
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Games',
      data: 'games'
    }
  ],
  order: [[2, 'desc'], [1, 'desc']],
  paging: false,
  searching: false,
  scrollY: STANDARD_SEGMENT_HEIGHT,
  info: false
};

const PlayerVsPlayerFormat = {
  columns: [
    {
      title: 'Player',
      data: 'name'
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Games',
      data: 'games'
    }
  ],
  order: [[2, 'desc'], [1, 'desc']],
  paging: true,
  pageLength: 50,
  searching: true,
  info: true,
  scrollY: STANDARD_SEGMENT_ALL
};

const SkinFormat = {
  columns: [
    {
      title: 'Skin ID',
      data: 'key',
      width: '50%'
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data),
      width: '25%'
    },
    {
      title: 'Games',
      data: 'games',
      width: '25%'
    }
  ],
  order: [[1, 'desc'], [2, 'desc']],
  paging: true,
  searching: true,
  info: true,
  scrollY: STANDARD_SEGMENT_ALL,
  pageLength: 50
};

const MapFormat = {
  columns: [
    {
      title: 'Map',
      data: 'key'
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Games',
      data: 'games'
    }
  ],
  order: [[1, 'desc'], [2, 'desc']],
  paging: false,
  info: false,
  scrollY: TALL_SEGMENT_HEIGHT,
  searching: false
};

const AwardFormat = {
  columns: [
    {
      title: 'Award',
      data: 'key',
      render: (data) => awardHeader(data)
    },
    {
      title: 'Award %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Games',
      data: 'wins'
    }
  ],
  order: [[1, 'desc'], [2, 'desc']],
  paging: false,
  info: false,
  scrollY: STANDARD_SEGMENT_HEIGHT,
  searching: false
};

const PlayerCompareToAvgFormat = {
  columns: [
    {
      title: 'Stat',
      data: 'statName',
      render: (data) => `<h3 class="ui inverted header">${data}</h3>`
    },
    {
      title: 'Player',
      data: 'pDataSort',
      render: (data, type, row) => row.pData
    },
    {
      title: 'Diff',
      data: 'pctDiff',
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Average',
      data: 'cmpDataSort',
      render: (data, type, row) => row.cmpData
    }
  ],
  order: [[0, 'asc']],
  paging: false,
  info: false,
  scrollY: STANDARD_SEGMENT_WITH_SEARCH,
  searching: true
};

const HeroSummaryFormat = {
  columns: [
    {
      title: 'Hero',
      data: 'key',
      render: heroHeader
    },
    {
      title: 'Win %',
      data: playerVsWinPctData,
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Games',
      data: 'games'
    },
    {
      title: 'KDA',
      data: 'stats.totalKDA',
      render: (data) => formatStat('KDA', data)
    },
    {
      title: 'Takedowns',
      data: 'stats.Takedowns'
    },
    {
      title: 'Kills',
      data: 'stats.SoloKill'
    },
    {
      title: 'Assists',
      data: 'stats.Assists'
    },
    {
      title: 'Deaths',
      data: 'stats.Deaths'
    },
    {
      title: 'MVP %',
      data: 'stats.MVPPct',
      render: (data) => formatStat('pct', data)
    },
    {
      title: 'Award %',
      data: 'stats.AwardPct',
      render: (data) => formatStat('pct', data)
    }
  ],
  order: [[1, 'desc'], [2, 'desc']],
  paging: false,
  info: false,
  scrollY: TALL_SEGMENT_HEIGHT,
  searching: false
}

function getHeroStatSafe(target, row) {
  if (target in row) {
    return row[target].toFixed(2);
  }

  return 0;
}

// this one's large, and also can be automated.
function playerDetailStatFormat() {
  let columns = [{
    title: 'Hero',
    data: 'key',
    render: (data) => heroHeader(data, '200px')
  },
  {
    title: 'Games',
    data: 'games'
  }];

  let allStats = DetailStatList;
  for (let m in PerMapStatList) {
    allStats = allStats.concat(PerMapStatList[m]);
  }

  for (let i in allStats) {
    columns.push({
      title: DetailStatString[allStats[i]],
      data: (row) => getHeroStatSafe(allStats[i], row),
      render: (data) => formatStat(allStats[i], data, true)
    });
  }

  return {
    columns,
    order: [[0, 'asc']],
    paging: false,
    info: false,
    scrollY: '60vh',
    scrollX: true,
    searching: false,
    fixedColumns: true,
    scrollCollapse: true,
    buttons: ['excel', 'pdf']
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
exports.preprocessAwards = preprocessAwards;