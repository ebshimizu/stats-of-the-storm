var playerDetailID;
var playerDetailStats;
var playerDetailInfo;
var playerDetailHeroSummaryRowTemplate;
var playerDetailMapSummaryRowTemplate;
var allDetailStats;
var playerHeroDetailRowTemplate;
var playerAwardRowTemplate;
const playerHeroDetailRowTemplateContent = `<tr>
  <td data-sort-value="{{heroName}}">
    <h3 class="ui inverted header">
      <div class="content">{{heroName}}</div>
    </h3>
  </td>
  </td>
  {{#each stat}}
    <td class="center aligned" data-sort-value="{{avg}}" data-position="left center" data-variation="wide" data-html='<h4 class="ui image header"><img class="ui rounded image" src="assets/heroes-talents/images/heroes/{{../heroImg}}"><div class="content">{{../heroName}}<div class="ui sub header">{{name}}</div></div></h4>'>
      {{render}}
    </td>
  {{/each}}
 </tr>`;
var playerWinRateRowTemplate;
var heroWinRateRowTemplate;
var heroTalentRowTemplate;
var playerDetailFilter = {};

const IntervalMode = {
  Month: 'month',
  Week: 'week',
  Season: 'season',
  Patch: 'patch'
}
var playerProgressionInterval = IntervalMode.Month;

const tierToLevel = {
  "Tier 1 Choice" : 1,
  "Tier 2 Choice" : 4,
  "Tier 3 Choice" : 7,
  "Tier 4 Choice" : 10,
  "Tier 5 Choice" : 13,
  "Tier 6 Choice" : 16,
  "Tier 7 Choice" : 20
}

var progressionGraphSettings = {
  responsive: true,
  tooltips: {
    position: 'nearest',
    mode: 'index',
    intersect: false
  },
  legend: {
    labels: {
      fontColor: 'white'
    }
  },
  scales: {
    yAxes: [{
      ticks: {
        fontColor: '#FFFFFF',
        min: 0,
        max: 100
      },
      gridLines: {
        color: '#ababab'
      }
    }],
    xAxes: [{
      ticks: {
        fontColor: '#FFFFFF'
      },
      gridLines: {
        color: '#ababab'
      }
    }]
  }
};

var progressionWinGraphSettings = {
  responsive: true,
  tooltips: {
    position: 'nearest',
    mode: 'index',
    intersect: false
  },
  legend: {
    labels: {
      fontColor: 'white'
    }
  },
  scales: {
    yAxes: [{
      ticks: {
        fontColor: '#FFFFFF',
        min: 0,
        max: 100
      },
      position: 'left',
      gridLines: {
        color: '#ababab'
      },
      id: 'winPct'
    }, {
      position: 'right',
      ticks: {
        fontColor: '#FFFFFF',
        min: 0
      },
      gridLines: {
        drawOnChartArea: 'false'
      },
      id: 'games'
    }],
    xAxes: [{
      ticks: {
        fontColor: '#FFFFFF'
      },
      gridLines: {
        color: '#ababab'
      }
    }]
  }
};

var progressionKDAGraphSettings = {
  responsive: true,
  tooltips: {
    position: 'nearest',
    mode: 'index',
    intersect: false
  },
  legend: {
    labels: {
      fontColor: 'white'
    }
  },
  scales: {
    yAxes: [{
      ticks: {
        fontColor: '#FFFFFF',
        min: 0
      },
      gridLines: {
        color: '#ababab'
      }
    }],
    xAxes: [{
      ticks: {
        fontColor: '#FFFFFF'
      },
      gridLines: {
        color: '#ababab'
      }
    }]
  }
}
var progressionWinRateGraphData, progressionWinRateGraph;
var progressionKDAGraphData, progressionKDAGraph;
var progressionAwardsGraphData, progressionAwardsGraph;

function initPlayerPage() {
  // player menu init
  let selectedPlayerID = settings.get('selectedPlayerID');
  let initOpt = '<div class="item" data-value="' + selectedPlayerID + '">' + selectedPlayerID + '</div>';
  $('#players-set-player .menu').append(initOpt);
  $('#players-set-player').dropdown({
    action: 'activate',
    fullTextSearch: true,
    onChange: updatePlayerDetailID
  });
  $('#players-set-player').dropdown('set selected', selectedPlayerID);

  // templates
  playerDetailHeroSummaryRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-summary-row').find('tr')[0].outerHTML);
  playerDetailMapSummaryRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-map-summary-row').find('tr')[0].outerHTML);
  playerWinRateRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-player-win-row').find('tr')[0].outerHTML);
  heroWinRateRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-win-row').find('tr')[0].outerHTML);
  heroTalentRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-talent-row').find('tr')[0].outerHTML);
  playerAwardRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-award-row').find('tr')[0].outerHTML);
  playerHeroDetailRowTemplate = Handlebars.compile(playerHeroDetailRowTemplateContent);

  createDetailTableHeader();

  // plugins and callbacks
  $('#player-detail-hero-summary table').tablesort();
  $('#player-detail-hero-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });
  $('#player-detail-hero-summary table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.text());
  });

  $('#player-detail-map-summary table').tablesort();
  $('#player-detail-map-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-friend-summary table').tablesort();
  $('#player-detail-friend-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-rival-summary table').tablesort();
  $('#player-detail-rival-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-with-summary table').tablesort();
  $('#player-detail-with-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-against-summary table').tablesort();
  $('#player-detail-against-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-hero-talent table').tablesort();
  $('#player-detail-hero-talent table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-skin-summary table').tablesort();
  $('#player-detail-skin-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-detail-award-summary table').tablesort();
  $('#player-detail-award-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-hero-detail-stats table').tablesort();
  $('#player-hero-detail-stats table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.text());
  });
  $('#player-hero-detail-stats table').on('tablesort:complete', function(event, tablesort) {
    $('#player-hero-detail-stats td').popup();
  });
  $('#player-hero-detail-stats table').floatThead({
    scrollContainer: function($table) {
      return $('#player-hero-detail-stats .table-wrapper-xy');
    },
    autoReflow: true
  });

  $('#player-detail-submenu .item').tab();
  $('#player-detail-submenu .item').click(function() {
    $('#player-detail-body table').floatThead('reflow');
  });

  $('#player-hero-select-menu').dropdown({
    action: 'activate',
    onChange: showHeroDetails
  });

  $('#players-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="player-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  $('#progression-interval-menu div.dropdown').dropdown({
    onChange: updateGraphInterval
  });

  // filter popup
  let playerWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  playerWidget.attr('widget-name', 'player-filter');
  playerWidget.find('.filter-widget-team').addClass('is-hidden');
  
  $('#filter-widget').append(playerWidget);
  initPopup(playerWidget);

  bindFilterButton($('.filter-popup-widget[widget-name="player-filter"]'), updatePlayerFilter);
  bindFilterResetButton($('.filter-popup-widget[widget-name="player-filter"]'), resetPlayerFilter);

  // graphs
  progressionWinRateGraphData = {
    type: 'line',
    data: {
      datasets: [{
        label: 'Win Rate',
        fill: false,
        borderColor: '#21ba45',
        backgroundColor: '#21ba45',
        cubicInterpolationMode: 'monotone',
        data: [],
        yAxisID: 'winPct'
      }, {
        label: 'Games Played',
        fill: false,
        borderColor: '#fbbd08',
        backgroundColor: '#fbbd08',
        cubicInterpolationMode: 'monotone',
        data: [],
        yAxisID: 'games'
      }]
    },
    options: progressionWinGraphSettings
  };
  progressionKDAGraphData = {
    type: 'line',
    data: {
      datasets: [{
        label: 'KDA',
        fill: 'false',
        borderColor: '#21ba45',
        backgroundColor: '#21ba45',
        cubicInterpolationMode: 'monotone',
        data: []
      }]
    },
    options: progressionKDAGraphSettings
  };
  progressionAwardsGraphData = {
    type: 'line',
    data:{
      datasets: [{
        label: 'Award Rate',
        fill: 'false',
        borderColor: '#21ba45',
        backgroundColor: '#21ba45',
        cubicInterpolationMode: 'monotone',
        data: []
      }, {
        label: 'MVP Rate',
        fill: 'false',
        borderColor: '#fbbd08',
        backgroundColor: '#fbbd08',
        cubicInterpolationMode: 'monotone',
        data: []
      }]
    },
    options: progressionGraphSettings
  };

  progressionWinRateGraphData.options.scales.yAxes[0].ticks.max = 100;
  progressionWinRateGraphData.options.scales.yAxes[0].ticks.min = 0;

  progressionKDAGraphData.options.scales.yAxes[0].ticks.min = 0;

  progressionAwardsGraphData.options.scales.yAxes[0].ticks.max = 100;
  progressionAwardsGraphData.options.scales.yAxes[0].ticks.min = 0;

  progressionWinRateGraph = new Chart($('#player-progression-win-rate'), progressionWinRateGraphData);
  progressionKDAGraph = new Chart($('#player-progression-kda'), progressionKDAGraphData);
  progressionAwardsGraph = new Chart($('#player-progression-awards'), progressionAwardsGraphData);
}

function resetPlayerPage() {
  DB.getPlayer(playerDetailID, updatePlayerPage);
}

function closestWrapper($table) {
  return $table.closest('.table-wrapper');
}

function createDetailTableHeader() {
  allDetailStats = DetailStatList;
  for (let m in PerMapStatList) {
    allDetailStats = allDetailStats.concat(PerMapStatList[m]);
  }

  // add the headings n stuff
  $('#player-hero-detail-stats thead tr').append('<th style="width: 500px;">Hero</th>');
  for (let i in allDetailStats) {
    $('#player-hero-detail-stats thead tr').append('<th class="stat">' + DetailStatString[allDetailStats[i]] + '</th>');
  }
}

function preloadPlayerID(id) {
  $('#players-set-player').dropdown('set exactly', id);
}

function updatePlayerDetailID(value, text, $item) {
  // only do this if the player id actually changes
  if (playerDetailID === value)
    return;

  playerDetailID = value;

  // uh, redraw the entire page I guess
  DB.getPlayer(playerDetailID, updatePlayerPage);
}

// step 1: get the basic info, update some headers
function updatePlayerPage(err, doc) {
  if (doc.length === 1) {
    playerDetailInfo = doc[0];
    $('#player-page-header .header.player-name').text(playerDetailInfo.name);
    $('#player-hero-select-menu').dropdown('set text', 'All Heroes');
    updateHeroTitle($('#player-detail-summary-header'), 'all');

    // then do the big query
    // depending on filters, this may get increasingly complicated
    DB.getHeroDataForPlayerWithFilter(playerDetailInfo._id, playerDetailFilter, processPlayerData);
  }
  else {
    console.log("no player found?");
  }
}

// this is the initial call to creating the data
function processPlayerData(err, docs) {
  playerDetailStats = DB.summarizeHeroData(docs);

  // dropdown initialization
  $('#player-hero-select-menu .menu').html('<div class="item" data-value="all">All Heroes</div>');
  for (let h in playerDetailStats.heroes) {
    let elem = '<div class="item" data-value="' + h + '"><img class="ui avatar image" src="assets/heroes-talents/images/heroes/';
    elem += Heroes.heroIcon(h) + '">' + h + '</div>';
    $('#player-hero-select-menu .menu').append(elem);
  }
  $('#player-hero-select-menu').dropdown('refresh');

  // render to the proper spots
  renderAllHeroSummary();
  renderPlayerSummary();
  renderPlayerHeroDetail();
  renderProgression();
}

// callback for hero select menu
function showHeroDetails(value, text, $selectedItem) {
  if (value === 'all') {
    DB.getHeroDataForPlayerWithFilter(playerDetailInfo._id, playerDetailFilter, function(err, docs) {
      playerDetailStats = DB.summarizeHeroData(docs);
      renderAllHeroSummary();
      renderPlayerSummary();
      renderProgression();
    });
  }
  else {
    let query = Object.assign({}, playerDetailFilter);
    query.ToonHandle = playerDetailInfo._id;
    query.hero = value;

    DB.getHeroData(query, function(err, docs) {
      playerDetailStats = DB.summarizeHeroData(docs);

      renderHeroTalents(value);
      renderPlayerSummary();
      renderProgression();
    });
  }

  updateHeroTitle($('#player-detail-summary-header'), value);
}

function updateHeroTitle(container, value) {
  if (value === 'all') {
    container.find('h2').html('All Hero Summary');
  }
  else {
    let elem = '<img class="ui large rounded image" src="assets/heroes-talents/images/heroes/' + Heroes.heroIcon(value) + '">' + value + '</div>';
    container.find('h2').html(elem);
  }
}

function renderAllHeroSummary() {
  $('#player-detail-hero-summary tbody').html('');
  $('#player-detail-hero-summary table').floatThead('reflow');
  $('#player-detail-hero-summary').removeClass('is-hidden');
  $('#player-detail-hero-talent').addClass('is-hidden');

  for (let h in playerDetailStats.heroes) {
    let context = {};

    // some formatting needs to happen
    context.heroName = h;
    context.heroImg = Heroes.heroIcon(h);
    context.games = playerDetailStats.heroes[h].games;
    context.stats = playerDetailStats.heroes[h].stats;
    context.stats.formatMVPPct = (context.stats.MVPPct * 100).toFixed(2) + '%';
    context.stats.formatAwardPct = (context.stats.AwardPct * 100).toFixed(2) + '%';
    context.winPercent = playerDetailStats.heroes[h].wins / playerDetailStats.heroes[h].games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';
    context.stats.totalKDA = context.stats.totalKDA.toFixed(2);

    $('#player-detail-hero-summary tbody').append(playerDetailHeroSummaryRowTemplate(context));
  }
}

function renderHeroTalents(hero) {
  $('#player-detail-hero-summary').addClass('is-hidden');
  $('#player-detail-hero-talent').removeClass('is-hidden');

  renderHeroTalentsTo(hero, $('#player-detail-hero-talent'), playerDetailStats.rawDocs);
}

function renderHeroTalentsTo(hero, container, docs) {
  // summarize talent data
  let data = DB.summarizeTalentData(docs);
  data = data[hero];

  container.find('tbody').html('');
  for (let tier in data) {
    container.find('tbody').append('<tr class="level-header"><td colspan="4">Level ' + tierToLevel[tier] + '</td></tr>');
    let total = 0;
    for (let talent in data[tier]) {
      total += data[tier][talent].games;
    }

    for (let talent in data[tier]) {
      let context = {};
      context.icon = Heroes.talentIcon(talent);
      context.description = Heroes.talentDesc(talent);
      context.name = Heroes.talentName(talent);
      context.games = data[tier][talent].games;
      context.formatPop = ((data[tier][talent].games / total) * 100).toFixed(2) + '%';
      context.formatWinPercent = ((data[tier][talent].wins / context.games) * 100).toFixed(2) + '%';

      container.find('tbody').append(heroTalentRowTemplate(context));
    }
  }
}

function renderPlayerSummary() {
  $('#player-detail-friend-summary tbody').html('');
  $('#player-detail-rival-summary tbody').html('');
  $('#player-detail-skin-summary tbody').html('');
  $('#player-detail-award-summary tbody').html('');

  renderMapStatsTo($('#player-detail-map-summary'), playerDetailStats);

  // friends / rivals / hero matchups
  for (let d in playerDetailStats.withPlayer) {
    if (d === playerDetailID)
      continue;

    // more than 1 game, filters out a lot of useless data
    if (playerDetailStats.withPlayer[d].games === 1)
      continue;

    let context = playerDetailStats.withPlayer[d];
    context.winPercent = context.wins / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    $('#player-detail-friend-summary tbody').append(playerWinRateRowTemplate(context));
  }

  for (let d in playerDetailStats.againstPlayer) {
    if (playerDetailStats.againstPlayer[d].games === 1)
      continue;

    // can't really be vs yourself huh
    let context = playerDetailStats.againstPlayer[d];
    context.winPercent = context.defeated / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    $('#player-detail-rival-summary tbody').append(playerWinRateRowTemplate(context));
  }

  renderHeroVsStatsTo($('#player-detail-with-summary'), playerDetailStats.withHero);
  renderHeroVsStatsTo($('#player-detail-against-summary'), playerDetailStats.againstHero);

  // skins
  for (let s in playerDetailStats.skins) {
    let context = {};
    context.name = s;

    if (context.name === "")
      context.name = "Default";
    
    context.games = playerDetailStats.skins[s].games;
    context.winPercent = playerDetailStats.skins[s].wins / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    $('#player-detail-skin-summary tbody').append(playerWinRateRowTemplate(context));
  }

  // awards
  renderAwardsTo($('#player-detail-award-summary'), playerDetailStats);

  // individual stats
  $('#player-detail-misc-summary .statistic[name="overallWin"] .value').text((playerDetailStats.wins / playerDetailStats.games * 100).toFixed(2) + '%');
  $('#player-detail-misc-summary .statistic[name="overallGames"] .value').text(playerDetailStats.games);
  $('#player-detail-misc-summary .statistic[name="overallTD"] .value').text(playerDetailStats.totalTD);
  $('#player-detail-misc-summary .statistic[name="overallDeaths"] .value').text(playerDetailStats.totalDeaths);
  $('#player-detail-misc-summary .statistic[name="overallKDA"] .value').text((playerDetailStats.totalTD / Math.max(playerDetailStats.totalDeaths, 1)).toFixed(2));
  $('#player-detail-misc-summary .statistic[name="overallMVP"] .value').text((playerDetailStats.totalMVP / Math.max(playerDetailStats.games, 1) * 100).toFixed(1) + '%');
  $('#player-detail-misc-summary .statistic[name="overallAward"] .value').text((playerDetailStats.totalAward / Math.max(playerDetailStats.games) * 100).toFixed(1) + '%');
  $('#player-detail-misc-summary .statistic[name="timeDead"] .value').text(formatSeconds(playerDetailStats.totalTimeDead / playerDetailStats.games));
  $('#player-detail-misc-summary .statistic[name="votes"] .value').text(playerDetailStats.totalVotes);
  $('#player-detail-misc-summary .statistic[name="pctTimeDead"] .value').text((playerDetailStats.avgTimeDeadPct * 100).toFixed(2) + '%');
  $('#player-detail-misc-summary .statistic[name="highestStreak"] .value').text(playerDetailStats.highestStreak);

  // taunts
  setTauntStats('bstep', playerDetailStats.taunts.bsteps);
  setTauntStats('taunt', playerDetailStats.taunts.taunts);
  setTauntStats('spray', playerDetailStats.taunts.sprays);
  setTauntStats('dance', playerDetailStats.taunts.dances);
  setTauntStats('voice', playerDetailStats.taunts.voiceLines);

  $('.statistic[name="soloKills"] .value').text(playerDetailStats.takedownHistogram[1]);
  $('.statistic[name="soloDeaths"] .value').text(playerDetailStats.deathHistogram[1]);

  $('#player-detail-hero-summary table').floatThead('reflow');
  $('#player-detail-map-summary table').floatThead('reflow');
}

// expects stats to be from DB.summarizeHeroData(docs).maps
function renderMapStatsTo(container, stats) {
  container.find('tbody').html('');

  for (let m in stats.maps) {
    let context = stats.maps[m];
    context.mapName = m;
    context.winPct = context.wins / context.games;
    context.formatWinPct = (context.winPct* 100).toFixed(2) + '%';

    container.find('tbody').append(playerDetailMapSummaryRowTemplate(context));
  }
}

// expects stats to be from DB.summarizeHeroData(docs).withHero / againstHero
function renderHeroVsStatsTo(container, stats) {
  container.find('tbody').html('');

  for (let h in stats) {
    let context = stats[h];

    if ('defeated' in context) {
      context.winPercent = context.defeated / context.games;
    }
    else {
      context.winPercent = context.wins / context.games;
    }
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';
    context.heroImg = Heroes.heroIcon(context.name);

    container.find('tbody').append(heroWinRateRowTemplate(context));
  }
}

function renderAwardsTo(container, stats) {
  container.find('tbody').html('');

  for (let a in stats.awards) {
    let context = Heroes.awardInfo(a);

    context.games = stats.awards[a];
    context.winPercent = context.games / stats.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    container.find('tbody').append(playerAwardRowTemplate(context));
  }
}

function setTauntStats(name, obj) {
  $('.statistic[name="' + name + '-total"] .value').text(obj.count);
  $('.statistic[name="' + name + '-tds"] .value').text(obj.takedowns);
  $('.statistic[name="' + name + '-deaths"] .value').text(obj.deaths);
}

function renderPlayerHeroDetail() {
  $('#player-hero-detail-stats tbody').html('');

  for (let h in playerDetailStats.averages) {
    let avgData = playerDetailStats.averages[h];
    let context = {};
    context.heroName = h;
    context.heroImg = Heroes.heroIcon(h);
    context.stat = [];

    for (let s in allDetailStats) {
      if (allDetailStats[s] in avgData) {
        context.stat.push({
          avg: avgData[allDetailStats[s]].toFixed(2),
          name: DetailStatString[allDetailStats[s]],
          render: formatStat(allDetailStats[s], avgData[allDetailStats[s]], true)
        });
      }
      else {
        context.stat.push({avg: '', name: DetailStatString[allDetailStats[s]], render: ''});
      }
    }

    $('#player-hero-detail-stats tbody').append(playerHeroDetailRowTemplate(context));
  }

  $('#player-hero-detail-stats table').floatThead('reflow');
  $('#player-hero-detail-stats td').popup();
}

function updatePlayerFilter(mapQ, heroQ) {
  playerDetailFilter = heroQ;
  $('#players-filter-button').addClass('green');

  // uh, redraw the entire page I guess
  DB.getPlayer(playerDetailID, updatePlayerPage);
}

function resetPlayerFilter() {
  playerDetailFilter = {};
  $('#players-filter-button').removeClass('green');
  DB.getPlayer(playerDetailID, updatePlayerPage);
}

function updateGraphInterval(value, text, $item) {
  playerProgressionInterval = value;
  renderProgression();
}

function renderProgression() {
  // collect a few stats along the specified interval
  let data = {};
  for (let d in playerDetailStats.rawDocs) {
    let doc = playerDetailStats.rawDocs[d];

    // ok where are we putting this
    let hash;
    if (playerProgressionInterval === IntervalMode.Patch) {
      hash = hashInterval(doc.version, playerProgressionInterval);
    }
    else {
      hash = hashInterval(new Date(doc.date), playerProgressionInterval);
    }

    if (!(hash[0] in data)) {
      // initialize the data
      data[hash[0]] = {
        kills: 0,
        takedowns: 0,
        deaths: 0,
        wins: 0,
        award: 0,
        mvp: 0,
        games: 0,
        sort: hash[1],
        label: hash[0]
      }
    }

    // stats
    data[hash[0]].takedowns += doc.gameStats.Takedowns;
    data[hash[0]].deaths += doc.gameStats.Deaths;
    data[hash[0]].wins += doc.win ? 1 : 0;
    data[hash[0]].award += doc.gameStats.awards.length;
    data[hash[0]].mvp += doc.gameStats.awards.indexOf('EndOfMatchAwardMVPBoolean') >= 0 ? 1 : 0;
    data[hash[0]].games += 1;
  }

  // stick objects in array then sort
  let dataArr = [];
  for (let d in data) {
    dataArr.push(data[d]);
  }

  if (playerProgressionInterval === IntervalMode.Week) {
    dataArr.sort(function(a, b) {
      let ad = a.label.split('-');
      let bd = b.label.split('-');

      if (parseInt(ad[0]) < parseInt(bd[0]))
        return -1;
      else if (parseInt(ad[0]) > parseInt(bd[0]))
        return 1;
      
      if (parseInt(ad[1]) < parseInt(bd[1]))
        return -1;
      else if (parseInt(ad[1]) > parseInt(bd[1]))
        return 1;
      
      return 0;
    });
  }
  else {
    dataArr.sort(function(a, b) {
      if (a.sort < b.sort)
        return -1;
      else if (a.sort > b.sort)
        return 1;

      return 0;
    })  
  }

  // update data arrays
  let labels = [];
  progressionWinRateGraphData.data.datasets[0].data = [];
  progressionWinRateGraphData.data.datasets[1].data = [];
  progressionKDAGraphData.data.datasets[0].data = [];
  progressionAwardsGraphData.data.datasets[0].data = [];
  progressionAwardsGraphData.data.datasets[1].data = [];
  for (let i = 0; i < dataArr.length; i++) {
    let stat = dataArr[i];

    if (playerProgressionInterval === IntervalMode.Month) {
      let m = moment(stat.sort);
      labels.push(m.format('YYYY MMM'));
    }
    else if (playerProgressionInterval === IntervalMode.Week) {
      let spl = stat.label.split('-');
      labels.push(spl[0] + ' Week ' + spl[1]);
    }
    else {
      labels.push(stat.label);
    }
    progressionWinRateGraphData.data.datasets[0].data.push((stat.wins / stat.games * 100).toFixed(2));
    progressionWinRateGraphData.data.datasets[1].data.push(stat.games);
    progressionKDAGraphData.data.datasets[0].data.push((stat.takedowns / Math.max(stat.deaths, 1)).toFixed(2));
    progressionAwardsGraphData.data.datasets[0].data.push((stat.award / stat.games * 100).toFixed(2));
    progressionAwardsGraphData.data.datasets[1].data.push((stat.mvp / stat.games * 100).toFixed(2));
  }

  progressionWinRateGraphData.data.labels = labels;
  progressionKDAGraphData.data.labels = labels;
  progressionAwardsGraphData.data.labels = labels;

  progressionWinRateGraph.update();
  progressionKDAGraph.update();
  progressionAwardsGraph.update();
}

// gonna need a bunch of helpers
// returns an identifier and a sort value
function hashInterval(date, mode) {
  if (mode === IntervalMode.Month) {
    let ident = date.getFullYear() + '-' + (date.getUTCMonth() + 1);
    return [ident, new Date(ident + '-1')];
  }
  else if (mode === IntervalMode.Week) {
    let mdate = moment(date)
    let ident = date.getFullYear() + '-' + mdate.week();
    
    return [ident, mdate];
  }
  else if (mode === IntervalMode.Season) {
    for (let s in ReplayTypes.SeasonDates) {
      let season = ReplayTypes.SeasonDates[s];
      if (season.start <= date && date < season.end) {
        return [s, season.id];
      }
    }

    // if we didn't return, uh, the season isn't in the db yet so make one up
    return ['Future Season', Object.keys(ReplayTypes.SeasonDates).length];
  }
  else if (mode === IntervalMode.Patch) {
    // in this case date is not a date but instead a version object.
    let versionString = date.m_major + '.' + date.m_minor + '.' + date.m_revision + ' (build ' + date.m_build + ')';
    return [versionString, date.m_build];
  }
  
  //listen if you call this with an invalid mode i hope it crashes
  return [null, null];
}