var playerDetailID;
var playerDetailStats;
var playerDetailInfo;
var playerDetailHeroSummaryRowTemplate;
var playerDetailMapSummaryRowTemplate;
var allDetailStats;
var playerHeroDetailRowTemplate;
const playerHeroDetailRowTemplateContent = `<tr>
  <td data-sort-value="{{heroName}}">
    <h3 class="ui inverted header">
      <div class="content">{{heroName}}</div>
    </h3>
  </td>
  </td>
  {{#each stat}}
    <td class="center aligned" data-sort-value="{{avg}}" data-position="top center" data-html='<h4 class="ui image header"><img class="ui rounded image" src="assets/heroes-talents/images/heroes/{{../heroImg}}"><div class="content">{{../heroName}}<div class="ui sub header">{{name}}</div></div></h4>'>
      {{avg}}
    </td>
  {{/each}}
 </tr>`;
var playerWinRateRowTemplate;
var heroWinRateRowTemplate;
var heroTalentRowTemplate;
const tierToLevel = {
  "Tier 1 Choice" : 1,
  "Tier 2 Choice" : 4,
  "Tier 3 Choice" : 7,
  "Tier 4 Choice" : 10,
  "Tier 5 Choice" : 13,
  "Tier 6 Choice" : 16,
  "Tier 7 Choice" : 20
}

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
  playerHeroDetailRowTemplate = Handlebars.compile(playerHeroDetailRowTemplateContent);

  createDetailTableHeader();

  // plugins and callbacks
  $('#player-detail-hero-summary table').tablesort();
  $('#player-detail-hero-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
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
  $('#player-detail-hero-submenu .item').tab();

  $('a[data-tab="player-summary"]').click(function() {
    $('#player-detail-map-summary table').floatThead('reflow');
    $('#player-detail-hero-summary table').floatThead('reflow');
    $('#player-detail-friend-summary table').floatThead('reflow');
    $('#player-detail-hero-talent table').floatThead('reflow');
  });

  $('a[data-tab="player-hero-detail"]').click(function() {
    $('#player-hero-detail-stats table').floatThead('reflow');
  })
  
  $('#player-hero-select-menu').dropdown({
    action: 'activate',
    onChange: showHeroDetails
  });
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
    updateHeroTitle('all');

    // then do the big query
    // depending on filters, this may get increasingly complicated
    DB.getHeroDataForPlayer(playerDetailInfo._id, processPlayerData);
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
}

function showHeroDetails(value, text, $selectedItem) {
  if (value === 'all') {
    DB.getHeroDataForPlayer(playerDetailInfo._id, function(err, docs) {
      playerDetailStats = DB.summarizeHeroData(docs);
      renderAllHeroSummary();
      renderPlayerSummary();
    });
  }
  else {
    let query = { ToonHandle: playerDetailInfo._id };
    query.hero = value;

    DB.getHeroData(query, function(err, docs) {
      playerDetailStats = DB.summarizeHeroData(docs);

      renderHeroTalents(value);
      renderPlayerSummary();
    });
  }

  updateHeroTitle(value);
}

function updateHeroTitle(value) {
  if (value === 'all') {
    $('#player-detail-summary-header h2').html('All Hero Summary');
  }
  else {
    let elem = '<img class="ui large rounded image" src="assets/heroes-talents/images/heroes/' + Heroes.heroIcon(value) + '">' + value + '</div>';
    $('#player-detail-summary-header h2').html(elem);
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
  
  // summarize talent data
  let data = DB.summarizeTalentData(playerDetailStats.rawDocs);
  data = data[hero];

  $('#player-detail-hero-talent tbody').html('');
  for (let tier in data) {
    $('#player-detail-hero-talent tbody').append('<tr class="level-header"><td colspan="3">Level ' + tierToLevel[tier] + '</td></tr>');
    for (let talent in data[tier]) {
      let context = {};
      context.icon = Heroes.talentIcon(talent);
      context.description = Heroes.talentDesc(talent);
      context.name = Heroes.talentName(talent);
      context.games = data[tier][talent].games;
      context.formatWinPercent = ((data[tier][talent].wins / context.games) * 100).toFixed(2) + '%';

      $('#player-detail-hero-talent tbody').append(heroTalentRowTemplate(context));
    }
  }
}

function renderPlayerSummary() {
  $('#player-detail-map-summary tbody').html('');
  $('#player-detail-friend-summary tbody').html('');
  $('#player-detail-rival-summary tbody').html('');
  $('#player-detail-with-summary tbody').html('');
  $('#player-detail-against-summary tbody').html('');


  for (let m in playerDetailStats.maps) {
    let context = playerDetailStats.maps[m];
    context.mapName = m;
    context.winPct = context.wins / context.games;
    context.formatWinPct = (context.winPct* 100).toFixed(2) + '%';

    $('#player-detail-map-summary tbody').append(playerDetailMapSummaryRowTemplate(context));
  }

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

  for (let h in playerDetailStats.withHero) {
    let context = playerDetailStats.withHero[h];
    context.winPercent = context.wins / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';
    context.heroImg = Heroes.heroIcon(context.name);

    $('#player-detail-with-summary tbody').append(heroWinRateRowTemplate(context));
  }

  for (let h in playerDetailStats.againstHero) {
    let context = playerDetailStats.againstHero[h];
    context.winPercent = context.defeated / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';
    context.heroImg = Heroes.heroIcon(context.name);

    $('#player-detail-against-summary tbody').append(heroWinRateRowTemplate(context));
  }

  // individual stats
  $('.statistic[name="overallWin"] .value').text((playerDetailStats.wins / playerDetailStats.games * 100).toFixed(2) + '%');
  $('.statistic[name="overallGames"] .value').text(playerDetailStats.games);
  $('.statistic[name="overallTD"] .value').text(playerDetailStats.totalTD);
  $('.statistic[name="overallDeaths"] .value').text(playerDetailStats.totalDeaths);
  $('.statistic[name="overallKDA"] .value').text((playerDetailStats.totalTD / Math.max(playerDetailStats.totalDeaths, 1)).toFixed(2));
  $('.statistic[name="overallMVP"] .value').text((playerDetailStats.totalMVP / Math.max(playerDetailStats.games, 1) * 100).toFixed(1) + '%');
  $('.statistic[name="overallAward"] .value').text((playerDetailStats.totalAward / Math.max(playerDetailStats.games) * 100).toFixed(1) + '%');

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
        context.stat.push({ avg: avgData[allDetailStats[s]].toFixed(2), name: DetailStatString[allDetailStats[s]] });
      }
      else {
        context.stat.push({avg: '', name: DetailStatString[allDetailStats[s]]});
      }
    }

    $('#player-hero-detail-stats tbody').append(playerHeroDetailRowTemplate(context));
  }

  $('#player-hero-detail-stats table').floatThead('reflow');
  $('#player-hero-detail-stats td').popup();
}