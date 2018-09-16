var playerRankingsHeroFilter = {};
// this might not actually need to be used
var playerRankingsMapFilter = {};

var playerRankingTable;

function initPlayerRankingPage() {
  // need to add the headers
  for (let c of TableDefs.PlayerRankingStatFormat.columns) {
    $('#player-ranking-general-table thead tr').append(`<th>${c.title}</th>`);
  }

  playerRankingTable = new Table('#player-ranking-general-table', TableDefs.PlayerRankingStatFormat);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template'));
  filterWidget.attr('widget-name', 'player-ranking-filter');
  filterWidget.find('.filter-widget-hero').addClass('is-hidden');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  bindFilterButton(filterWidget, updatePlayerRankingsFilter);
  bindFilterResetButton(filterWidget, resetPlayerRankingsFilter);
  bindOtherSearchButton(filterWidget, $('#player-ranking-alt-search-button'), updatePlayerRankingsFilter);

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

  $('#player-ranking-match-thresh input').val(1);
  $('#player-ranking-match-thresh input').popup({
    on: 'focus'
  });

  $('#players-file-menu').dropdown({
    onChange: handlePlayerRankingAction
  });
}

function resetPlayerRankingPage() {
  resetPlayerRankingsFilter();
}

function playerRankingShowSection() {
  $('#players-file-menu').removeClass('is-hidden');
}

function showPlayerRankingLoader() {
  $('#player-ranking-body .dimmer').dimmer('show');
  disableWidget('player-ranking-filter');
}

function hidePlayerRankingLoader() {
  $('#player-ranking-body .dimmer').dimmer('hide');
  enableWidget('player-ranking-filter');
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

function togglePlayerRankingMode(elem) {
  $('#player-ranking-body .top.attached.menu .item').removeClass('active');
  $(elem).addClass('active');
  loadPlayerRankings();
}

function loadPlayerRankings() {
  showPlayerRankingLoader();
  // this can take a long time so we don't do this on load, the user must hit the search button
  DB.getAliasedPlayers(function(err, players) {
    DB.getHeroData(playerRankingsHeroFilter, function(err, docs) {
      let data = summarizePlayerData(docs, createPlayerAliasMap(players));
      let threshold = parseInt($('#player-ranking-match-thresh input').val());
      $('#player-ranking-body tbody').html('');

      let mode = $('#player-ranking-body .top.attached.menu .active.item').attr('data-mode');

      let tableData = [];
      for (let p in data) {
        let player = data[p];

        if (player.games < threshold)
          continue;

        let context = player[mode];
        context.id = p;
        context.name = player.name;
        context.winPercent = player.wins / player.games;

        if (mode === 'total' || mode === 'averages') {
          context.totalKDA = player.totalKDA;

          if (mode === 'total') {
            // context replacement for a few stats
            context.damageDonePerDeath = context.HeroDamage / Math.max(1, context.Deaths);
            context.damageTakenPerDeath = context.DamageTaken / Math.max(1, context.Deaths);
            context.healingDonePerDeath = (context.Healing + context.SelfHealing + context.ProtectionGivenToAllies) / Math.max(1, context.Deaths);
            context.DPM = context.HeroDamage / (player.totalTime / 60);
            context.HPM = (context.Healing + context.SelfHealing + context.ProtectionGivenToAllies) / (player.totalTime / 60);
            context.XPM = context.ExperienceContribution / (player.totalTime / 60);
          }
        }
        else {
          context.totalKDA = player[mode].KDA;
        }

        context.games = player.games
        context.votes = player.votes;

        context.totalAwards = player.totalAwards;
        context.awardPct = context.totalAwards / player.games;
        context.totalMVP = player.totalMVP ? player.totalMVP : 0;
        context.MVPPct = context.totalMVP / player.games;
        context.taunts = player.taunts;
        context.Pool = Object.keys(player.heroes).length;

        tableData.push(context);
      }

      playerRankingTable.setData(tableData);
      playerRankingTable.filterByMinGames(threshold);

      hidePlayerRankingLoader();
    });
  });
}

function handlePlayerRankingAction(value, text, $elem) {
  if (value === 'csv') {
    playerRankingTable.table.DataTable().button('0').trigger();
  }
  else if (value === 'excel') {
    playerRankingTable.table.DataTable().button('1').trigger();
  }
}
