var playerDetailID;
var playerDetailStats;
var playerDetailInfo;
var playerDetailHeroSummaryRowTemplate;
var playerDetailMapSummaryRowTemplate;
var allDetailStats;
var playerHeroDetailRowTemplate;
var playerAwardRowTemplate;
var playerCompareRowTemplate;
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
  // this takes a bit too long at app load
  //$('#players-set-player').dropdown('set selected', selectedPlayerID);

  // templates
  playerDetailHeroSummaryRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-summary-row').find('tr')[0].outerHTML);
  playerDetailMapSummaryRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-map-summary-row').find('tr')[0].outerHTML);
  playerWinRateRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-player-win-row').find('tr')[0].outerHTML);
  heroWinRateRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-win-row').find('tr')[0].outerHTML);
  heroTalentRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-talent-row').find('tr')[0].outerHTML);
  playerAwardRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-award-row').find('tr')[0].outerHTML);
  playerCompareRowTemplate = Handlebars.compile(getTemplate('player', '#player-compare-table-row').find('tr')[0].outerHTML);
  playerHeroDetailRowTemplate = Handlebars.compile(playerHeroDetailRowTemplateContent);

  createDetailTableHeader();

  // plugins and callbacks
  $('#player-detail-hero-summary table').tablesort();

  $('#player-detail-hero-summary table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.text());
  });

  $('#player-detail-map-summary table').tablesort();
  $('#player-detail-friend-summary table').tablesort();
  $('#player-detail-rival-summary table').tablesort();
  $('#player-detail-with-summary table').tablesort();
  $('#player-detail-against-summary table').tablesort();
  $('#player-detail-hero-talent table').tablesort();
  $('#player-detail-skin-summary table').tablesort();
  $('#player-detail-award-summary table').tablesort();
  $('#player-hero-detail-stats table').tablesort();
  $('#player-compare-table table').tablesort();
  $('#player-hero-detail-stats table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
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

  $('#player-detail-hero-talent .menu .item').tab();
  $('#player-detail-hero-talent .menu .item').click(function() {
    $('#player-detail-body table').floatThead('reflow');
  });
  $('#player-detail-hero-talent .talent-build table').tablesort();
  $('#player-detail-hero-talent .talent-build table').on('tablesort:complete', function(event, tablesort) {
    $('#player-detail-hero-talent .talent-build img').popup();
  });

  // this apparently has to go after tablesort
  $('#player-detail-body table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  // filter popup
  let playerWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  playerWidget.attr('widget-name', 'player-filter');
  playerWidget.find('.filter-widget-team').addClass('is-hidden');
  
  $('#filter-widget').append(playerWidget);
  initPopup(playerWidget);

  bindFilterButton($('.filter-popup-widget[widget-name="player-filter"]'), updatePlayerFilter);
  bindFilterResetButton($('.filter-popup-widget[widget-name="player-filter"]'), resetPlayerFilter);

  $('#player-hero-detail-stats .menu .item').click(function() {
    togglePlayerDetailMode(this);
  });

  $('#player-export-menu').dropdown({
    action: 'hide',
    onChange: handlePlayerExportAction
  });

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

  // collection averages
  $('#player-compare-collection').dropdown({
    action: 'activate',
    onChange: updatePlayerCollectionCompare
  })
  populatePlayerCollectionMenu();
}

function populatePlayerCollectionMenu() {
  $('#player-compare-collection .menu').html('');
  $('#player-compare-collection .menu').append('<div class="item" data-value="all">All Matches</div>');
  $('#player-compare-collection .menu').append('<div class="ui divider"></div>');

  DB.getCollections(function(err, collections) {
    for (let c in collections) {
      let col = collections[c];
      $('#player-compare-collection .menu').append('<div class="item" data-value="' + col._id + '">' + col.name + '</div>');
    }

    $('#player-compare-collection').dropdown('refresh');
  });
}

function showPlayerPage() {
  $('#player-page-content table').floatThead('reflow');
  $('#player-export-menu').removeClass('is-hidden');
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
  $('#player-hero-detail-stats thead tr').append('<th>Games</th>');
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
    $('#player-page-header h1.header .content .player-name').text(playerDetailInfo.name);

    // check player teams
    DB.getPlayerTeams(playerDetailInfo._id, function(err, teams) {
      let teamNames = []
      for (let t in teams) {
        teamNames.push(teams[t].name);
      }

      $('#player-page-header h1.header .content .teams').text(teamNames.join(', '));
    });

    $('#player-hero-select-menu').dropdown('set text', 'All Heroes');
    $('#player-hero-select-menu').dropdown('set value', 'all');
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
  updatePlayerCollectionCompare($('#player-compare-collection').dropdown('get value'), null, null);
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
  updatePlayerCollectionCompare($('#player-compare-collection').dropdown('get value'), null, null);
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
  let talentData = DB.summarizeTalentData(docs);
  let data = talentData.talentStats[hero];

  container.find('tbody').html('');

  // picks
  for (let tier in data) {
    container.find('.talent-pick tbody').append('<tr class="level-header"><td colspan="4">Level ' + tierToLevel[tier] + '</td></tr>');
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
      context.formatPop = (data[tier][talent].games / total * 100).toFixed(2) + '%';
      context.formatWinPercent = (data[tier][talent].wins / context.games * 100).toFixed(2) + '%';

      container.find('.talent-pick tbody').append(heroTalentRowTemplate(context));
    }
  }

  let builds = talentData.buildStats[hero];
  let total = 0;
  // total games
  for (let b in builds)
    total += builds[b].games;

  // builds
  for (let b in builds) {
    let build = builds[b];
    let row = $('<tr></tr>');

    let keys = Object.keys(build.talents);
    for (let i = 0; i < 7; i++) {
      // this should theoretically be in order
      let context = {};
  
      if (i < keys.length) {
        context.img = Heroes.talentIcon(build.talents[keys[i]]);
        context.description = Heroes.talentDesc(build.talents[keys[i]]);
        context.name = Heroes.talentName(build.talents[keys[i]]);
        row.append(matchTalentRowCellTemplate(context));
      }
      else {
        row.append('<td></td>');
      }
    }

    let winPct = build.wins / build.games;
    let pop = build.games / total;
    row.append('<td data-sort-value="' + winPct + '">' + (winPct * 100).toFixed(2) + '%</td>');
    row.append('<td data-sort-value="' + build.games + '">' + build.games + '</td>');
    row.append('<td data-sort-value="' + pop + '">' + (pop * 100).toFixed(2) + '%</td>');

    container.find('.talent-build tbody').append(row);
  }

  $('.talent-build img').popup();
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
    if (playerDetailStats.withPlayer[d].games < settings.get('playerThreshold'))
      continue;

    let context = playerDetailStats.withPlayer[d];
    context.winPercent = context.wins / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    $('#player-detail-friend-summary tbody').append(playerWinRateRowTemplate(context));
  }

  for (let d in playerDetailStats.againstPlayer) {
    if (playerDetailStats.againstPlayer[d].games < settings.get('playerThreshold'))
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

  // active selected menu option
  let mode = $('#player-hero-detail-stats .menu .active.item').attr('data-mode');

  for (let h in playerDetailStats[mode]) {
    let statData = playerDetailStats[mode][h];
    let context = {};
    context.heroName = h;
    context.heroImg = Heroes.heroIcon(h);
    context.stat = [];

    context.stat.push({
      avg: playerDetailStats.heroes[h].games,
      name: 'Games',
      render: playerDetailStats.heroes[h].games
    });

    for (let s in allDetailStats) {
      if (allDetailStats[s] in statData) {
        context.stat.push({
          avg: statData[allDetailStats[s]].toFixed(2),
          name: DetailStatString[allDetailStats[s]],
          render: formatStat(allDetailStats[s], statData[allDetailStats[s]], true)
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

function togglePlayerDetailMode(elem) {
  $('#player-hero-detail-stats .menu .item').removeClass('active');
  $(elem).addClass('active');

  if (playerDetailStats)
    renderPlayerHeroDetail();
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

function handlePlayerExportAction(action, text, $elem) {
  if (action === 'player') {
    if (!playerDetailID)
      return;

    dialog.showSaveDialog({
      title: 'Export Player',
      filters: [{ name: 'JSON', extensions: ['.json'] }]
    }, function(filename) {
      if (filename) {
        exportPlayer(playerDetailID, filename);
      }
    });
  }
  else if (action === 'all-players') {
    dialog.showOpenDialog({
      title: 'Select Export Folder',
      properties: ["openDirectory", "createDirectory"]
    }, function(files) {
      if (files) {
        // pick the first, should only be 1 dir
        let path = files[0];
        DB.getPlayers({}, function(err, docs) {
          for (let i in docs) {
            exportPlayer(docs[i]._id, path + '/' + docs[i].name + '-' + docs[i]._id + '.json');
          }
        });
      }
    })
  }
}

function updatePlayerCollectionCompare(value, text, $elem) {
  if (playerDetailID === undefined)
    return;

  $('#player-compare-collection').addClass('loading disabled');

  let cid = value === 'all' ? null : value;

  DB.getCachedCollectionHeroStats(cid, function(cache) {
    $('#player-compare-table tbody').html('');
    let activeHero = $('#player-hero-select-menu').dropdown('get value');
    let cmpData;
    let pData;

    if (activeHero === 'all' || activeHero === '') {
      cmpData = DB.allAverageHeroData(cache.heroData);
      pData = DB.allAverageHeroData(playerDetailStats);
    }
    else {
      cmpData = cache.heroData.averages[activeHero];
      pData = playerDetailStats.averages[activeHero];
    }

    // special cases for
    // wins, kda, length
    let winCtx = {};
    let okdaCtx = {};
    let lengthCtx = {};
    winCtx.statName = 'Win %';
    okdaCtx.statName = 'Overall KDA';
    lengthCtx.statName = 'Match Length';

    if (activeHero === 'all' || activeHero === '') {
      winCtx.pDataSort = playerDetailStats.wins / playerDetailStats.games;
      winCtx.cmpDataSort = cache.heroData.wins / cache.heroData.games;
      okdaCtx.pDataSort = playerDetailStats.totalTD / Math.max(playerDetailStats.totalDeaths, 1);
      okdaCtx.cmpDataSort = cache.heroData.totalTD / Math.max(cache.heroData.totalDeaths, 1);
      lengthCtx.pDataSort = playerDetailStats.totalMatchLength / playerDetailStats.games;
      lengthCtx.cmpDataSort = cache.heroData.totalMatchLength / cache.heroData.games;
    }
    else {
      winCtx.pDataSort = playerDetailStats.heroes[activeHero].wins / playerDetailStats.heroes[activeHero].games;
      winCtx.cmpDataSort = cache.heroData.heroes[activeHero].wins / cache.heroData.heroes[activeHero].games;
      okdaCtx.pDataSort = playerDetailStats.total[activeHero].Takedowns / Math.max(playerDetailStats.total[activeHero].Deaths, 1);
      okdaCtx.cmpDataSort = cache.heroData.total[activeHero].Takedowns / Math.max(cache.heroData.total[activeHero].Deaths, 1);
      lengthCtx.pDataSort = playerDetailStats.heroes[activeHero].totalTime / playerDetailStats.heroes[activeHero].games;
      lengthCtx.cmpDataSort = cache.heroData.heroes[activeHero].totalTime / cache.heroData.heroes[activeHero].games;
    }

    winCtx.pData = (winCtx.pDataSort * 100).toFixed(2) + '%';
    winCtx.cmpData = (winCtx.cmpDataSort * 100).toFixed(2) + '%';
    winCtx.pctDiff = (winCtx.pDataSort - winCtx.cmpDataSort) / winCtx.cmpDataSort;
    winCtx.pctDiffFormat = (winCtx.pctDiff * 100).toFixed(2) + '%';

    okdaCtx.pData = okdaCtx.pDataSort.toFixed(2);
    okdaCtx.cmpData = okdaCtx.cmpDataSort.toFixed(2);
    okdaCtx.pctDiff = (okdaCtx.pDataSort - okdaCtx.cmpDataSort) / okdaCtx.cmpDataSort;
    okdaCtx.pctDiffFormat = (okdaCtx.pctDiff * 100).toFixed(2) + '%';

    lengthCtx.pData = formatSeconds(lengthCtx.pDataSort)
    lengthCtx.cmpData = formatSeconds(lengthCtx.cmpDataSort);
    lengthCtx.pctDiff = (lengthCtx.pDataSort - lengthCtx.cmpDataSort) / lengthCtx.cmpDataSort;
    lengthCtx.pctDiffFormat = (lengthCtx.pctDiff * 100).toFixed(2) + '%';

    $('#player-compare-table tbody').append(playerCompareRowTemplate(winCtx));
    $('#player-compare-table tbody').append(playerCompareRowTemplate(okdaCtx));
    $('#player-compare-table tbody').append(playerCompareRowTemplate(lengthCtx));

    let keys = Object.keys(pData).sort();
    for (let i in keys) {
      let d = keys[i];
      let context = {};
      context.statName = DetailStatString[d];

      if (cmpData[d] === 0)
        context.pctDiff = 0;
      else
        context.pctDiff = (pData[d] - cmpData[d]) / cmpData[d];

      context.pData = formatStat(d, pData[d], true);
      context.pDataSort = pData[d];
      context.pctDiffFormat = (context.pctDiff * 100).toFixed(2) + '%';
      context.cmpData = formatStat(d, cmpData[d], true);
      context.cmpDataSort = cmpData[d];

      $('#player-compare-table tbody').append(playerCompareRowTemplate(context));
    }

    $('#player-compare-collection').removeClass('loading disabled');
    $('#player-compare-table table').floatThead('reflow');
  });
}