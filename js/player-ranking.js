var playerRankingsHeroFilter = {};
// this might not actually need to be used
var playerRankingsMapFilter = {};
var playerRankingGeneralTemplate;


function initPlayerRankingPage() {
  // templates
  playerRankingGeneralTemplate = Handlebars.compile(getTemplate('player-ranking', '#player-ranking-row-template').find('tr')[0].outerHTML);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'player-ranking-filter');
  
  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  bindFilterButton(filterWidget, updatePlayerRankingsFilter);
  bindFilterResetButton(filterWidget, resetPlayerRankingsFilter);

  $('#player-ranking-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="player-ranking-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  $('#player-ranking-hero-filter-menu').dropdown({
    onChange: updateHeroFilter
  });
  addHeroMenuOptions($('#player-ranking-hero-filter-menu'));
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="all">All Heroes</div>');
  $('#player-ranking-hero-filter-menu').dropdown('refresh');

  $('#player-ranking-general-table').tablesort();
  $('#player-ranking-general-table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-ranking-body table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.text());
  });
}

function updatePlayerRankingsFilter(map, hero) {
  playerRankingsHeroFilter = hero;
  playerRankingsMapFilter = map;
  $('#player-ranking-filter-button').addClass('green');
  updateHeroFilter($('#player-ranking-hero-filter-menu').dropdown('get value'), null, null);
}

function resetPlayerRankingsFilter() {
  playerRankingsHeroFilter = {};
  playerRankingsMapFilter = {};
  $('#player-ranking-filter-button').removeClass('green');

  updateHeroFilter($('#player-ranking-hero-filter-menu').dropdown('get value'), null, null);
}

function updateHeroFilter(value, text, $elem) {
  if (value === "" || value === 'all') {
    delete playerRankingsHeroFilter.hero;
  }
  else {
    playerRankingsHeroFilter.hero = value;
  }

  loadPlayerRankings();
}

function loadPlayerRankings() {
  // this can take a long time so we don't do this on load, the user must hit the search button
  DB.getHeroData(playerRankingsHeroFilter, function(err, docs) {
    let data = DB.summarizePlayerData(docs);
    $('#player-ranking-body tbody').html('');

    for (let p in data) {
      let player = data[p];

      let context = {value: player.averages};
      context.name = player.name;
      context.value.winPercent = player.wins / player.games;
      context.formatWinPercent = (context.value.winPercent * 100).toFixed(2) + '%';
      context.value.totalKDA = player.totalKDA;
      context.totalKDA = player.totalKDA;
      context.value.games = player.games;
      context.games = player.games

      for (let v in context.value) {
        context[v] = formatStat(v, context.value[v], true);
      }

      $('#player-ranking-general-table').append(playerRankingGeneralTemplate(context));
    }
  });
}