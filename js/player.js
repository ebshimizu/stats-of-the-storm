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
    <td class="center aligned" data-sort-value="{{avg}}" data-position="top center" data-html='<h4 class="ui image header"><img class="ui rounded image" src="assets/heroes-talents/images/heroes/{{../heroImg}}"><div class="content">{{../heroName}}</div><div class="ui sub header">{{name}}</div></h4>'>
      {{avg}}
    </td>
  {{/each}}
 </tr>`;
 var playerWinRateRowTemplate;

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

  $('#player-hero-detail-stats table').tablesort();
  $('#player-hero-detail-stats table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseInt(td.text());
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
  })
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

    // then do the big query
    // depending on filters, this may get increasingly complicated
    DB.getHeroDataForPlayer(playerDetailInfo._id, processPlayerData);
  }
  else {
    console.log("no player found?");
  }
}

function processPlayerData(err, docs) {
  playerDetailStats = DB.summarizeHeroData(docs);

  // render to the proper spots
  renderPlayerSummary();
  renderPlayerHeroDetail();
}

function renderPlayerSummary() {
  $('#player-detail-hero-summary tbody').html('');
  $('#player-detail-map-summary tbody').html('');
  $('#player-detail-friend-summary tbody').html('');
  $('#player-detail-rival-summary tbody').html('');

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

    let context = playerDetailStats.withPlayer[d];
    context.winPercent = context.wins / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    $('#player-detail-friend-summary tbody').append(playerWinRateRowTemplate(context));
  }

  for (let d in playerDetailStats.againstPlayer) {
    // can't really be vs yourself huh
    let context = playerDetailStats.againstPlayer[d];
    context.winPercent = context.defeated / context.games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';

    $('#player-detail-rival-summary tbody').append(playerWinRateRowTemplate(context));

  }

  // individual stats
  $('.statistic[name="overallWin"] .value').text((playerDetailStats.wins / playerDetailStats.games * 100).toFixed(2) + '%');
  $('.statistic[name="overallGames"] .value').text(playerDetailStats.games);
  $('.statistic[name="overallTD"] .value').text(playerDetailStats.totalTD);
  $('.statistic[name="overallDeaths"] .value').text(playerDetailStats.totalDeaths);
  $('.statistic[name="overallKDA"] .value').text((playerDetailStats.totalTD / Math.max(playerDetailStats.totalDeaths, 1)).toFixed(2));
  $('.statistic[name="overallMVP"] .value').text((playerDetailStats.totalMVP / Math.max(playerDetailStats.games, 1) * 100).toFixed(1) + '%');
  $('.statistic[name="overallAward"] .value').text((playerDetailStats.totalAward / Math.max(playerDetailStats.games) * 100).toFixed(1) + '%');

  $('#player-detail-hero-summary table').floatThead('reflow');
  $('#player-detail-map-summary table').floatThead('reflow');
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