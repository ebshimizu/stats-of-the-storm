var teamRankingMatchFilter = {};
// uh i'm actually not familiar with my own code
// pretty sure teams keys off of the matches so hero filter is probably
// not going to be used
var teamRankingHeroFilter = {};
var teamRankingGeneralTemplate;
var teamRankingMatchTemplate;
var teamRankingCCTemplate;
var teamRankingStructureTemplate;

function initTeamRankingPage() {
  teamRankingGeneralTemplate = getHandlebars('team-ranking', '#team-ranking-row-template');
  teamRankingMatchTemplate = getHandlebars('team-ranking', '#team-ranking-match-row-template');
  teamRankingCCTemplate = getHandlebars('team-ranking', '#team-ranking-cc-row-template');
  teamRankingStructureTemplate = getHandlebars('team-ranking', '#team-ranking-structure-row-template');

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template'));
  filterWidget.attr('widget-name', 'team-ranking-filter');
  filterWidget.find('.filter-widget-team').addClass('is-hidden');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  bindFilterButton(filterWidget, updateTeamRankingFilter);
  bindFilterResetButton(filterWidget, resetTeamRankingsFilter);
  bindOtherSearchButton(filterWidget, $('#team-ranking-alt-search-button'), updateTeamRankingFilter);

  $('#team-ranking-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="team-ranking-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  $('#team-ranking-body table').tablesort();
  $('#team-ranking-body table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#team-ranking-body .buttons .button').click(toggleTeamRankingSection);

  $('#player-ranking-body table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  $('#team-ranking-body .top.attached.menu .item').click(function() {
    toggleTeamRankingMode(this);
  });

  $('#team-ranking-file-menu').dropdown({
    onChange: handleTeamRankingAction
  });

  $('#team-progress-bar').progress({
    text: {
      active  : 'Loaded {value} of {total} teams',
      success : 'All Teams Loaded'
    }
  });

  $('#team-ranking-print-sections .ui.dropdown').dropdown();
}

function resetTeamRankingPage() {
  resetTeamRankingsFilter();
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
  $('#team-ranking-body table').floatThead('reflow');
}

function toggleTeamRankingMode(elem) {
  $('#team-ranking-body .top.attached.menu .item').removeClass('active');
  $(elem).addClass('active');
  updateTeamRanking();
}

function getAllTeamData(filter, callback, usingTeamRanking = false) {
  DB.getAllTeams(function(err, teams) {
    // do nothing, there are no teams
    if (teams.length === 0)
      return;

    if (usingTeamRanking) {
      disableWidget('team-ranking-filter');
      $('#team-ranking-alt-search-button').addClass('disabled');
      $('#team-progress-bar').transition('scale');
      $('#team-progress-bar').progress('reset');
      $('#team-progress-bar').progress('set total', teams.length);
    }
    for (let t in teams) {
      let team = teams[t];
      // ok for all the teams in order, we'll need to get a bunch of data
      // this may or may not include all the hero data but we'll see.
      // turns out past me included total stats for teams?
      let query = Object.assign({}, filter);
      let players = team.players;

      if (!('$or' in query)) {
        query.$or = [];
      }

      let t0queries = [];
      let t1queries = [];
      if (team.players.length <= 5) {
        // all players need to be in a team somewhere
        for (const i in players) {
          t0queries.push({ 'teams.0.ids': players[i] });
          t1queries.push({ 'teams.1.ids': players[i] });
        }
      }
      else {
        // basically we need a match 5 of the players and then we're ok
        for (let i = 0; i < 5; i++) {
          const t0key = 'teams.0.ids.' + i;
          const t1key = 'teams.1.ids.' + i;

          let t0arg = { };
          t0arg[t0key] = { $in: players };
          let t1arg = {};
          t1arg[t1key] = { $in: players };

          t0queries.push(t0arg);
          t1queries.push(t1arg);
        }
      }

      query.$or.push({ $and: t0queries });
      query.$or.push({ $and: t1queries });

      // execute
      if (query.collection) {
        DB.getMatches(query, function(err, docs) { callback(err, docs, team); }, { collectionOverride: true });
      }
      else {
        DB.getMatches(query, function(err, docs) { callback(err, docs, team); });
      }
    }
  });
}

function updateTeamRanking() {
  $('#team-ranking-body tbody').html('');

  // this is going to be... some shenanigans
  // first get the list of all the teams in the database
  getAllTeamData(teamRankingMatchFilter, updateTeamRankingData, true);
}

function updateTeamRankingData(err, matches, team) {
  $('#team-progress-bar').progress('increment', 1);
  if ($('#team-progress-bar').progress('is complete')) {
    setTimeout(() => { $('#team-progress-bar').transition('scale'); }, 2000);
    enableWidget('team-ranking-filter');
    $('#team-ranking-alt-search-button').removeClass('disabled');
  }

  // skip teams with no data
  if (matches.length === 0)
    return;

  let mode = $('#team-ranking-body .top.attached.menu .active.item').attr('data-mode');

  // at this point we might have all the data we need?
  let teamStats = summarizeTeamData(team, matches, Heroes);
  teamStats.name = team.name;
  teamStats.id = team._id;
  teamStats.winPercent = teamStats.wins / teamStats.totalMatches;
  teamStats.formatWinPercent = formatStat('pct', teamStats.winPercent);

  if (mode === 'averages' || mode === 'total') {
    teamStats.stats.total.totalKDA = teamStats.takedowns.total / teamStats.deaths.total;
  }
  else {
    teamStats.stats.total.totalKDA = teamStats.stats[mode].KDA;
  }
  teamStats.totalKDA = formatStat('KDA', teamStats.stats.total.totalKDA);

  teamStats.matchLength.format = formatSeconds(teamStats.matchLength[mode]);
  teamStats.matchLength.val = teamStats.matchLength[mode];

  for (let s in teamStats.stats[mode]) {
    teamStats[s] = formatStat(s, teamStats.stats[mode][s], true);
  }

  for (let t in teamStats.tierTimes) {
    teamStats[t] = formatSeconds(teamStats.tierTimes[t][mode]);
    teamStats.tierTimes[t].average = teamStats.tierTimes[t][mode];
  }

  for (let l in teamStats.endOfGameLevels) {
    teamStats.endOfGameLevels[l].format = formatStat(l, teamStats.endOfGameLevels[l][mode], true);
    teamStats.endOfGameLevels[l].average = teamStats.endOfGameLevels[l][mode];
  }

  teamStats.average = teamStats.stats[mode];
  teamStats.stats.takedowns = teamStats.takedowns[mode];
  teamStats.stats.deaths = teamStats.deaths[mode];
  teamStats.takedowns = formatStat('', teamStats.stats.takedowns, true);
  teamStats.deaths = formatStat('', teamStats.stats.deaths, true);

  teamStats.structures.Fort.first /= Math.max(1, teamStats.structures.Fort.gamesWithFirst);
  teamStats.structures.Keep.first /= Math.max(1, teamStats.structures.Keep.gamesWithFirst);
  teamStats.structures.Fort.formatFirst = formatSeconds(teamStats.structures.Fort.first);
  teamStats.structures.Keep.formatFirst = formatSeconds(teamStats.structures.Keep.first);

  $('#team-ranking-general-table tbody').append(teamRankingGeneralTemplate(teamStats));
  $('#team-ranking-match-table tbody').append(teamRankingMatchTemplate(teamStats));
  $('#team-ranking-cc-table tbody').append(teamRankingCCTemplate(teamStats));
  $('#team-ranking-structure-table tbody').append(teamRankingStructureTemplate(teamStats));
  $('#team-ranking-body th').removeClass('sorted ascending descending');

  $('#team-ranking-body h3[team-id="' + team._id + '"]').click(function() {
    $('#team-set-team').dropdown('set text', team.name);
    $('#team-set-team').dropdown('set value', team._id);
    $('#teams-page-header .team-name').text(team.name);
    changeSection('teams', true);
  })
}

function layoutTeamRankingPrint(sections) {
  let sects = sections;
  if (!sects) {
    sects = ['general', 'match', 'team', 'struct'];
  }

  clearPrintLayout();
  addPrintHeader('Team Statistics');
  addPrintDate();

  for (let section of sects) {
    let sectionName = $('#team-ranking-body div[table-print="' + section + '"]').attr('table-name');
    addPrintPage(section);
    addPrintSubHeader(sectionName, section);
    copyFloatingTable($('#team-ranking-body div[table-print="' + section + '"] .floatThead-wrapper'), getPrintPage(section));
  }
}

function printTeamRanking(filename, sections) {
  layoutTeamRankingPrint(sections);
  renderAndPrint(filename, 'Legal', true);
}

function handleTeamRankingAction(value, text, $elem) {
  if (value === 'print') {
    dialog.showSaveDialog({
      title: 'Print Team Stats',
      filters: [{name: 'pdf', extensions: ['pdf']}]
    }, function(filename) {
      if (filename) {
        printTeamRanking(filename, null);
      }
    });
  }
  else if (value === 'print-sections') {
    $('#team-ranking-print-sections').modal({
      onApprove: function() {
        dialog.showSaveDialog({
          title: 'Print Player Stats',
          filters: [{name: 'pdf', extensions: ['pdf']}]
        }, function(filename) {
          if (filename) {
            let sections = $('#team-ranking-print-sections .ui.dropdown').dropdown('get value').split(',');
            printTeamRanking(filename, sections);
          }
        });
      },
      closable: false
    }).modal('show');
  }
}
