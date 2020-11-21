var teamRankingMatchFilter = {};
// uh i'm actually not familiar with my own code
// pretty sure teams keys off of the matches so hero filter is probably
// not going to be used
var teamRankingHeroFilter = {};

var teamRankingTable;

function initTeamRankingPage(tags) {
  // populate headers
  for (let c of TableDefs.TeamRankingFormat.columns) {
    $('#team-ranking-general-table thead tr').append(`<th>${c.title}</th>`);
  }

  teamRankingTable = new Table('#team-ranking-general-table', TableDefs.TeamRankingFormat);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template'));
  filterWidget.attr('widget-name', 'team-ranking-filter');
  filterWidget.find('.filter-widget-team').addClass('is-hidden');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget, tags);

  bindFilterButton(filterWidget, updateTeamRankingFilter);
  bindFilterResetButton(filterWidget, resetTeamRankingsFilter);
  bindOtherSearchButton(filterWidget, $('#team-ranking-alt-search-button'), updateTeamRankingFilter);

  $('#team-ranking-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="team-ranking-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false,
  });

  $('#team-ranking-body .buttons .button').click(toggleTeamRankingSection);
  $('#team-ranking-body .top.attached.menu .item').click(function () {
    toggleTeamRankingMode(this);
  });

  $('#team-ranking-file-menu').dropdown({
    onChange: handleTeamRankingAction,
  });

  $('#team-progress-bar').progress({
    text: {
      active: 'Loaded {value} of {total} teams',
      success: 'All Teams Loaded',
    },
  });

  $('#team-ranking-print-sections .ui.dropdown').dropdown();
}

function resetTeamRankingPage() {
  teamRankingMatchFilter = {};
  teamRankingHeroFilter = {};

  // html reset
  $('#team-ranking-body tbody').html('');
}

function showTeamRankingSection() {
  $('#team-ranking-file-menu').removeClass('is-hidden');
}

function updateTeamRankingFilter(map, hero) {
  teamRankingMatchFilter = map;
  teamRankingHeroFilter = hero;

  $('#team-ranking-filter-button').addClass('green');
  updateTeamRanking();
}

function resetTeamRankingsFilter() {
  teamRankingMatchFilter = {};
  teamRankingHeroFilter = {};

  $('#team-ranking-filter-button').removeClass('green');
  updateTeamRanking();
}

function toggleTeamRankingSection() {
  let section = $(this).text();

  if ($(this).hasClass('violet')) {
    return;
  }

  $('#team-ranking-body .buttons .button').removeClass('violet');
  $('#team-ranking-body .section').addClass('is-hidden');
  $('#team-ranking-body .section[table-name="' + section + '"]').removeClass('is-hidden');
  $(this).addClass('violet');
}

function toggleTeamRankingMode(elem) {
  $('#team-ranking-body .top.attached.menu .item').removeClass('active');
  $(elem).addClass('active');
  updateTeamRanking();
}

function updateTeamRanking() {
  teamRankingTable.clear();

  // this is going to be... some shenanigans
  // first get the list of all the teams in the database
  disableWidget('team-ranking-filter');
  $('#team-ranking-alt-search-button').addClass('disabled');
  $('#team-progress-bar').transition('scale');
  $('#team-progress-bar').progress('reset');

  DB.reduceTeams(teamRankingMatchFilter, initTeamRankingData, updateTeamRankingData, finalizeTeamRankingData);
}

function initTeamRankingData(teams) {
  $('#team-progress-bar').progress('set total', teams.length);
}

function finalizeTeamRankingData() {
  setTimeout(() => {
    $('#team-progress-bar').transition('scale');
  }, 2000);
  enableWidget('team-ranking-filter');
  $('#team-ranking-alt-search-button').removeClass('disabled');
  teamRankingTable.draw();
}

function updateTeamRankingData(err, matches, team) {
  $('#team-progress-bar').progress('increment', 1);

  // skip teams with no data
  if (matches.length === 0) return;

  let mode = $('#team-ranking-body .top.attached.menu .active.item').attr('data-mode');

  // at this point we might have all the data we need?
  let teamStats = summarizeTeamData(team, matches, Heroes);
  teamStats.name = team.name;
  teamStats.id = team._id;
  teamStats.winPercent = teamStats.wins / teamStats.totalMatches;

  if (mode === 'averages' || mode === 'total') {
    teamStats.stats.total.totalKDA = teamStats.takedowns.total / teamStats.deaths.total;
  } else {
    teamStats.stats.total.totalKDA = teamStats.stats[mode].KDA;
  }
  teamStats.matchLength.val = teamStats.matchLength[mode];

  for (let t in teamStats.tierTimes) {
    teamStats.tierTimes[t].average = teamStats.tierTimes[t][mode];
  }

  for (let l in teamStats.endOfGameLevels) {
    teamStats.endOfGameLevels[l].average = teamStats.endOfGameLevels[l][mode];
  }

  teamStats.selectedStats = teamStats.stats[mode];
  teamStats.selectedStats.totalKDA = teamStats.stats.total.totalKDA;

  teamStats.selectedStats.Takedowns = teamStats.takedowns[mode];
  teamStats.selectedStats.Deaths = teamStats.deaths[mode];

  teamStats.structures.Fort.first /= Math.max(1, teamStats.structures.Fort.gamesWithFirst);
  teamStats.structures.Keep.first /= Math.max(1, teamStats.structures.Keep.gamesWithFirst);
  teamStats.structures.Fort.formatFirst = formatSeconds(teamStats.structures.Fort.first);
  teamStats.structures.Keep.formatFirst = formatSeconds(teamStats.structures.Keep.first);

  teamRankingTable.addRow(teamStats);

  //$('#team-ranking-body h3[team-id="' + team._id + '"]').click(function() {
  //  $('#team-set-team').dropdown('set text', team.name);
  //  $('#team-set-team').dropdown('set value', team._id);
  //  $('#teams-page-header .team-name').text(team.name);
  //  changeSection('teams', true);
  //})
}

function handleTeamRankingAction(value, text, $elem) {
  if (value === 'csv') {
    teamRankingTable.table.DataTable().button('0').trigger();
  } else if (value === 'excel') {
    teamRankingTable.table.DataTable().button('1').trigger();
  }
}
