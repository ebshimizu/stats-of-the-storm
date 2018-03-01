var playerRankingsHeroFilter = {};
// this might not actually need to be used
var playerRankingsMapFilter = {};
var playerRankingGeneralTemplate;
var playerRankingTeamfightTemplate;
var playerRankingMiscTemplate;


function initPlayerRankingPage() {
  // templates
  playerRankingGeneralTemplate = Handlebars.compile(getTemplate('player-ranking', '#player-ranking-row-template').find('tr')[0].outerHTML);
  playerRankingTeamfightTemplate = Handlebars.compile(getTemplate('player-ranking', '#player-ranking-teamfight-row-template').find('tr')[0].outerHTML);
  playerRankingMiscTemplate = Handlebars.compile(getTemplate('player-ranking', '#player-ranking-misc-row-template').find('tr')[0].outerHTML);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'player-ranking-filter');
  filterWidget.find('.filter-widget-hero').addClass('is-hidden');
  
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

  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="ui divider"></div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="Multiclass">Multiclass</div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="Specialist"><div class="ui avatar image"><img class="ui avatar image" src="./assets/images/role_specialist.png"></div>Specialist</div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="Support"><div class="ui avatar image"><img class="ui avatar image" src="./assets/images/role_support.png"></div>Support</div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="Warrior"><div class="ui avatar image"><img class="ui avatar image" src="./assets/images/role_warrior.png"></div>Warrior</div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="Assassin"><div class="ui avatar image"><img class="ui avatar image" src="./assets/images/role_assassin.png"></div>Assassin</div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="ui divider"></div>');
  $('#player-ranking-hero-filter-menu .menu').prepend('<div class="item" data-value="all">All Heroes</div>');
  $('#player-ranking-hero-filter-menu').dropdown('refresh');

  $('#player-ranking-general-table').tablesort();
  $('#player-ranking-general-table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-ranking-teamfight-table').tablesort();
  $('#player-ranking-teamfight-table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-ranking-misc-table').tablesort();
  $('#player-ranking-misc-table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#player-ranking-match-thresh input').val(settings.get('playerThreshold'));
  $('#player-ranking-match-thresh input').popup({
    on: 'focus'
  });

  $('#player-ranking-body .buttons .button').click(togglePlayerRankingSection);

  $('#player-ranking-body table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  $('#player-ranking-body .top.attached.menu .item').click(function() {
    togglePlayerRankingMode(this);
  });
}

function resetPlayerRankingPage() {
  resetPlayerRankingsFilter();
}

function updatePlayerRankingsFilter(map, hero) {
  playerRankingsHeroFilter = hero;
  playerRankingsMapFilter = map;
  $('#player-ranking-filter-button').addClass('green');
  updateHeroFilter($('#player-ranking-hero-filter-menu').dropdown('get value'), null, null);

  loadPlayerRankings();
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
  else if (value === "Assassin" || value === "Warrior" || value === "Support" || value === "Specialist" || value === "Multiclass") {
    let heroes = Heroes.heroRole({ role: value });
    playerRankingsHeroFilter.hero = { $in: heroes };
  }
  else {
    playerRankingsHeroFilter.hero = value;
  }

  // don't update until search happens since you can definitely accidentally query to much stuff
}

function togglePlayerRankingSection() {
  let section = $(this).text();
  
  if ($(this).hasClass('violet')) {
    return;
  }

  $('#player-ranking-body .buttons .button').removeClass('violet');
  $('#player-ranking-body .section').addClass('is-hidden');
  $('#player-ranking-body .section[table-name="' + section + '"]').removeClass('is-hidden');
  $(this).addClass('violet');
  $('#player-ranking-body table').floatThead('reflow');
}

function togglePlayerRankingMode(elem) {
  $('#player-ranking-body .top.attached.menu .item').removeClass('active');
  $(elem).addClass('active');
  loadPlayerRankings();
}

function loadPlayerRankings() {
  // this can take a long time so we don't do this on load, the user must hit the search button
  DB.getHeroData(playerRankingsHeroFilter, function(err, docs) {
    let data = DB.summarizePlayerData(docs);
    let threshold = parseInt($('#player-ranking-match-thresh input').val());
    $('#player-ranking-body tbody').html('');

    let mode = $('#player-ranking-body .top.attached.menu .active.item').attr('data-mode');

    for (let p in data) {
      let player = data[p];

      if (player.games < threshold)
        continue;

      let context = {value: player[mode]};
      context.name = player.name;
      context.value.winPercent = player.wins / player.games;
      context.formatWinPercent = (context.value.winPercent * 100).toFixed(2) + '%';

      if (mode === 'total' || mode === 'averages') {
        context.value.totalKDA = player.totalKDA;
        context.totalKDA = player.totalKDA;
      }
      else {
        context.value.totalKDA = player[mode].KDA;
        context.totalKda = context.value.totalKDA.toFixed(2);
      }
      
      context.value.games = player.games;
      context.games = player.games
      context.votes = player.votes;

      for (let v in context.value) {
        context[v] = formatStat(v, context.value[v], true);
      }

      context.totalAwards = player.totalAwards;
      context.value.awardPct = context.totalAwards / player.games;
      context.awardPct = (context.value.awardPct * 100).toFixed(2) + '%';
      context.value.MVPPct = player.totalMVP / player.games;
      context.MVPPct = (context.value.MVPPct * 100).toFixed(2) + '%';
      context.taunts = player.taunts;

      $('#player-ranking-general-table').append(playerRankingGeneralTemplate(context));
      $('#player-ranking-teamfight-table').append(playerRankingTeamfightTemplate(context));
      $('#player-ranking-misc-table').append(playerRankingMiscTemplate(context));
    }
  });
}