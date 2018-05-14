var teamsHeroDataFilter = {};
var teamsMapDataFilter = {};
var teamHeroSummaryRowTemplate;
var teamBanSummaryRowTemplate;
var teamRosterRowTemplate;
var teamHeroPickRowTemplate;
var currentTeam;
var teamPlayerStats, teamTeamStats;
var teamAvgData;
var teamAvgTracker;
var teamHeroMatchThresh = 0;

function initTeamsPage() {
  $('#team-set-team').dropdown({
    onChange: updateTeamData,
    fullTextSearch: true
  });
  populateTeamMenu($('.team-menu'));

  $('#team-add-player-menu').dropdown({
    action: 'activate',
    fullTextSearch: true
  });

  teamHeroSummaryRowTemplate = Handlebars.compile(getTemplate('teams', '#team-hero-summary-row').find('tr')[0].outerHTML);
  teamBanSummaryRowTemplate = Handlebars.compile(getTemplate('teams', '#team-hero-ban-row').find('tr')[0].outerHTML);
  teamRosterRowTemplate = Handlebars.compile(getTemplate('teams', '#team-roster-row').find('tr')[0].outerHTML);
  teamHeroPickRowTemplate = Handlebars.compile(getTemplate('teams', '#team-hero-pick-row').find('tr')[0].outerHTML);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'teams-filter');
  filterWidget.find('.filter-widget-team').addClass('is-hidden');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  $('#team-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="teams-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  bindFilterButton(filterWidget, updateTeamsFilter);
  bindFilterResetButton(filterWidget, resetTeamsFilter);

  $('#team-detail-body table').tablesort();
  $('#team-detail-body table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#team-detail-body th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  $('#teams-submenu .item').tab();
  $('#teams-submenu .item').click(function() {
    $('#team-detail-body table').floatThead('reflow');
  });
  $('#team-hero-summary .item').click(function() {
    $('#team-detail-body table').floatThead('reflow');
  });

  $('#teams-submenu .external-match-history').click(function() {
    showMatchHistory();
  });

  $('#team-hero-summary .menu .item').tab();

  $('#team-edit-menu').dropdown({
    onChange: function(value, text, $elem) {
      handleTeamMenuCallback(value);
    }
  });

  $('#team-roster-stats .top.attached.menu .item').click(function() {
    toggleTeamRosterMode(this);
  });

  $('#team-confirm-action-user').modal({
    closable: false
  });
  $('#team-add-user').modal({
    closable: false
  });
  $('#team-text-input').modal({
    closable: false
  });
  $('#team-add-player-button').click(addPlayerToTeam);

  // collection averages
  $('#team-compare-collection').dropdown({
    action: 'activate',
    onChange: updateTeamCollectionCompare
  })
  populateTeamCollectionMenu();

  // threshold
  $('#teams-hero-thresh input').popup({
    on: 'focus'
  });
  $('#teams-hero-thresh input').val(0);
  $('#teams-hero-thresh input').blur(function() {
    updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
  });

  $('#team-file-menu').dropdown({
    onChange: handleTeamMenuCallback
  });
  $('#team-print-sections .ui.dropdown').dropdown();
}

function populateTeamCollectionMenu() {
  $('#team-compare-collection .menu').html('');
  $('#team-compare-collection .menu').append('<div class="item" data-value="all">All Matches</div>');
  $('#team-compare-collection .menu').append('<div class="ui divider"></div>');

  DB.getCollections(function(err, collections) {
    for (let c in collections) {
      let col = collections[c];
      $('#team-compare-collection .menu').append('<div class="item" data-value="' + col._id + '">' + col.name + '</div>');
    }

    $('#team-compare-collection').dropdown('refresh');
  });
}

function resetTeamsPage() {
  resetTeamsFilter();
}

function teamShowSection() {
  // basically just expose the proper menu options here
  $('#team-edit-menu').removeClass('is-hidden');
  $('#team-file-menu').removeClass('is-hidden');
}

function updateTeamsFilter(hero, map) {
  teamsHeroDataFilter = hero;
  teamsMapDataFilter = map;
  $('#team-filter-button').addClass('green');

  updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
}

function resetTeamsFilter() {
  teamsHeroDataFilter = {};
  teamsMapDataFilter = {};
  $('#team-filter-button').removeClass('green');

  updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
}

function updateTeamData(value, text, $elem) {
  // lol that's the null team don't do this
  if (value === '')
    return;

  $('#teams-page-header .team-name').text(text);

  // ok so matches get a special version of where for ids and here's how it works:
  // - If the team is 5 people or less:
  //   the ids array needs to have all of the ids specified (this is normal AND)
  // - If the team is more than 5 people:
  //   exactly 5 of the people in the match need to be in the team array
  // all players must be on the same team
  DB.getTeam(value, function(err, team) {
    // get the match data
    let query = Object.assign({}, teamsMapDataFilter);
    currentTeam = team;

    // im sure this will 100% murder performace but eh
    let oldWhere = function() { return true; };
    if ('$where' in query) {
      oldWhere = query.$where;
    }
    let player = team.players;

    // this is a bit weird but we're gonna overwrite the where and use a special query
    // first, wrap the old callback if it exists (and it totally does becasue dates)
    if (team.players.length <= 5) {
      // need to match length of players array
      query.$where = function() {
        if (player.length === 0)
          return false;

        let boundWhere = oldWhere.bind(this);
        let t0 = this.teams[0].ids;
        let count = 0;
        for (let i in t0) {
          if (player.indexOf(t0[i]) >= 0)
            count += 1;
        }

        if (count === player.length)
          return boundWhere();

        count = 0;
        let t1 = this.teams[1].ids;
        for (let i in t1) {
          if (player.indexOf(t1[i]) >= 0)
            count += 1;
        }

        if (count === player.length)
          return boundWhere();

        return false;
      }
    }
    else {
      // basically we need a match 5 of the players and then we're ok
      query.$where = function() {
        if (player.length === 0)
          return false;

        let boundWhere = oldWhere.bind(this);
        let t0 = this.teams[0].ids;
        let count = 0;
        for (let i in t0) {
          if (player.indexOf(t0[i]) >= 0)
            count += 1;
        }

        if (count === 5)
          return boundWhere();

        count = 0;
        let t1 = this.teams[1].ids;
        for (let i in t1) {
          if (player.indexOf(t1[i]) >= 0)
            count += 1;
        }

        if (count === 5)
          return boundWhere();

        return false;
      }
    }

    // execute
    DB.getMatches(query, function(err, matches) {
      // then get the hero data
      let matchIDs = [];
      for (let i in matches) {
        matchIDs.push(matches[i]._id);
      }

      // only want specific users
      let query2 = { ToonHandle: { $in: team.players } };

      DB.getHeroDataForMatches(matchIDs, query2, function(err, heroData) {
        // and now finally load the team data
        loadTeamData(team, matches, heroData);
      });
    });
  });
}

function loadTeamData(team, matches, heroData) {
  teamHeroMatchThresh = parseInt($('#teams-hero-thresh input').val());

  // compute hero stats
  let heroStats = summarizeHeroData(heroData);
  teamPlayerStats = summarizePlayerData(heroData);
  teamTeamStats = summarizeTeamData(team, matches, Heroes);

  // i'm uh, kind of lazy
  let playerStats = teamPlayerStats;
  let teamStats = teamTeamStats;

  // also lifting a little bit from player.js
  // team with stats are uh, a little useless? like it's all in the picks stats...

  // team stats de-duplicate but need some formatting
  let against = {};
  for (let h in teamStats.heroes) {
    let hero = teamStats.heroes[h];
    if (hero.gamesAgainst >= teamHeroMatchThresh && hero.gamesAgainst > 0) {
      against[h] = { name: h, games: hero.gamesAgainst, defeated: hero.defeated }
    }
  }

  renderMapStatsTo($('#team-map-summary'), teamStats)
  renderHeroVsStatsTo($('#team-against-summary'), against, teamHeroMatchThresh);

  $('#team-hero-summary-table tbody').html('');
  let picked = 0;
  for (let h in heroStats.heroes) {
    let hero = heroStats.heroes[h];
    let context = {};
    context.value = {};

    // for formatting reasons i'll do this manually
    context.value.Takedowns = hero.stats.Takedowns;
    context.Takedowns = hero.stats.Takedowns;

    context.value.Deaths = hero.stats.Deaths;
    context.Deaths = hero.stats.Deaths;

    context.value.KDA = hero.stats.Takedowns / Math.max(1, hero.stats.Deaths);
    context.KDA = formatStat('KDA', context.value.KDA);

    context.value.TimeSpentDead = heroStats.averages[h].TimeSpentDead;
    context.TimeSpentDead = formatSeconds(context.value.TimeSpentDead);

    context.value.timeDeadPct = hero.stats.timeDeadPct / hero.games;
    context.timeDeadPct = formatStat('pct', context.value.timeDeadPct);

    context.value.games = hero.games;
    context.value.winPercent = hero.wins / hero.games;
    context.value.pickPercent = hero.games / teamStats.totalMatches;

    context.games = hero.games;
    context.winPercent = formatStat('pct', context.value.winPercent);
    context.pickPercent = formatStat('pct', context.value.pickPercent);
    context.heroImg = Heroes.heroIcon(h);
    context.heroName = h;

    picked += 1;

    if (hero.games >= teamHeroMatchThresh)
      $('#team-hero-summary-table tbody').append(teamHeroSummaryRowTemplate(context));
  }

  // picks and bans
  $('#team-ban-summary tbody').html('');
  $('#team-draft-table tbody').html('');
  for (let h in teamStats.heroes) {
    let hero = teamStats.heroes[h];
    if (hero.bans === 0)
      continue;

    let context = {};
    context.value = {};

    context.heroName = h;
    context.heroImg = Heroes.heroIcon(h);
    context.value.banPercent = hero.bans / teamStats.totalMatches;
    context.bans = hero.bans;
    context.value.ban1Percent = hero.first / teamStats.totalMatches;
    context.ban1 = hero.first;
    context.value.ban2Percent = hero.second / teamStats.totalMatches;
    context.ban2 = hero.second;

    context.banPercent =  formatStat('pct', context.value.banPercent);
    context.ban1Percent = formatStat('pct', context.value.ban1Percent);
    context.ban2Percent = formatStat('pct', context.value.ban2Percent);

    if (hero.bans >= teamHeroMatchThresh)
      $('#team-ban-summary tbody').append(teamBanSummaryRowTemplate(context));
  }

  for (let h in teamStats.heroes) {
    let hero = teamStats.heroes[h];
    if (hero.games === 0)
      continue;

    let context = {};
    context.value = {};
    context.heroName = h;
    context.heroImg = Heroes.heroIcon(h);
    context.value.picks = hero.picks;
    context.value.winPercent = hero.wins / hero.games;
    context.winPercent = formatStat('pct', context.value.winPercent);
    context.value.games = hero.games;
    context.games = hero.games;
    for (let p in context.value.picks) {
      context[p + 'Percent'] = formatStat('pct', context.value.picks[p].count / teamStats.totalMatches);
    }

    if (hero.games >= teamHeroMatchThresh)
      $('#team-draft-table tbody').append(teamHeroPickRowTemplate(context));
  }

  // other stats
  try {
    $('#team-summary-stats .statistic[name="overallWin"] .value').text(formatStat('pct', teamStats.wins / teamStats.totalMatches));
    $('#team-summary-stats .statistic[name="overallGames"] .value').text(formatStat('', teamStats.totalMatches, true));
    $('#team-summary-stats .statistic[name="overallTD"] .value').text(formatStat('', teamStats.takedowns.total, true));
    $('#team-summary-stats .statistic[name="overallDeaths"] .value').text(formatStat('', teamStats.deaths.total, true));
    $('#team-summary-stats .statistic[name="overallKDA"] .value').text(formatStat('KDA', teamStats.takedowns.total / Math.max(1, teamStats.deaths.total)));
    $('#team-summary-stats .statistic[name="timeDead"] .value').text(formatSeconds(teamStats.stats.average.avgTimeSpentDead));
    $('#team-summary-stats .statistic[name="pctTimeDead"] .value').text(formatStat('pct', teamStats.stats.average.timeDeadPct));
    $('#team-summary-stats .statistic[name="heroesPlayed"] .value').text(picked);
    $('#team-summary-stats .statistic[name="heroesPct"] .value').text(formatStat('pct', picked / Heroes.heroCount));
    $('#team-summary-stats .statistic[name="avgLength"] .value').text(formatSeconds(teamStats.matchLength.average));
    $('#team-summary-stats .statistic[name="PPK"] .value').text(formatStat('KDA', teamStats.stats.average.PPK));

    let elem = $('#team-detail-stats');
    $('#team-detail-stats .statistic[name="team-time-to-10"] .value').text(formatSeconds(teamStats.stats.average.timeTo10));
    $('#team-detail-stats .statistic[name="team-times-at-10"] .value').text(formatStat('', teamStats.level10Games, true));
    $('#team-detail-stats .statistic[name="team-time-to-20"] .value').text(formatSeconds(teamStats.stats.average.timeTo20));
    $('#team-detail-stats .statistic[name="team-times-at-20"] .value').text(formatStat('', teamStats.level20Games, true));

    $('#team-detail-stats .statistic[name="merc-captures"] .value').text(formatStat('mercCaptures', teamStats.stats.average.mercCaptures, true));
    $('#team-detail-stats .statistic[name="merc-uptime"] .value').text(formatSeconds(teamStats.stats.average.mercUptime));
    $('#team-detail-stats .statistic[name="merc-uptime-percent"] .value').text(formatStat('pct', teamStats.stats.average.mercUptimePercent));

    updateTeamStat(elem, 'T1', formatSeconds(teamStats.tierTimes.T1.average));
    updateTeamStat(elem, 'T2', formatSeconds(teamStats.tierTimes.T2.average));
    updateTeamStat(elem, 'T3', formatSeconds(teamStats.tierTimes.T3.average));
    updateTeamStat(elem, 'T4', formatSeconds(teamStats.tierTimes.T4.average));
    updateTeamStat(elem, 'T5', formatSeconds(teamStats.tierTimes.T5.average));
    updateTeamStat(elem, 'T6', formatSeconds(teamStats.tierTimes.T6.average));

    elem = $('#team-structure-stats');
    updateTeamStat(elem, 'forts-destroyed', teamStats.structures.Fort.destroyed);
    updateTeamStat(elem, 'forts-lost', teamStats.structures.Fort.lost);
    updateTeamStat(elem, 'first-fort', teamStats.structures.Fort.destroyed === 0 ? 'N/A' : formatSeconds(teamStats.structures.Fort.first / teamStats.structures.Fort.gamesWithFirst));

    updateTeamStat(elem, 'keeps-destroyed', teamStats.structures.Keep.destroyed);
    updateTeamStat(elem, 'keeps-lost', teamStats.structures.Keep.lost);
    updateTeamStat(elem, 'first-keep', teamStats.structures.Keep.destroyed === 0 ? 'N/A' : formatSeconds(teamStats.structures.Keep.first / teamStats.structures.Keep.gamesWithFirst));

    updateTeamStat(elem, 'wells-destroyed', teamStats.structures['Fort Well'].destroyed + teamStats.structures['Keep Well'].destroyed);
    updateTeamStat(elem, 'wells-lost', teamStats.structures['Fort Well'].lost + teamStats.structures['Keep Well'].lost);

    let hideWellTime = teamStats.structures['Fort Well'].destroyed + teamStats.structures['Keep Well'].destroyed === 0
    updateTeamStat(elem, 'first-well', hideWellTime ? 'N/A' : formatSeconds(Math.min(teamStats.structures['Fort Well'].first / teamStats.structures['Fort Well'].gamesWithFirst, teamStats.structures['Keep Well'].first / teamStats.structures['Keep Well'].gamesWithFirst)));

    updateTeamStat(elem, 'towers-destroyed', teamStats.structures['Fort Tower'].destroyed + teamStats.structures['Keep Tower'].destroyed);
    updateTeamStat(elem, 'towers-lost', teamStats.structures['Fort Tower'].lost + teamStats.structures['Keep Tower'].lost);

    let hideTowerTime = (teamStats.structures['Fort Tower'].destroyed + teamStats.structures['Keep Tower'].destroyed) === 0;
    updateTeamStat(elem, 'first-tower', hideTowerTime ? 'N/A' : formatSeconds(Math.min(teamStats.structures['Fort Tower'].first / teamStats.structures['Fort Tower'].gamesWithFirst, teamStats.structures['Keep Tower'].first / teamStats.structures['Keep Tower'].gamesWithFirst)));

    elem = $('#team-damage-stats');
    updateTeamStat(elem, 'hero-damage',  formatStat('', teamStats.stats.average.HeroDamage, true));
    updateTeamStat(elem, 'siege-damage', formatStat('', teamStats.stats.average.SiegeDamage, true));
    updateTeamStat(elem, 'creep-damage', formatStat('', teamStats.stats.average.CreepDamage, true));
    updateTeamStat(elem, 'minion-damage', formatStat('', teamStats.stats.average.MinionDamage, true));
    updateTeamStat(elem, 'healing', formatStat('', teamStats.stats.average.Healing, true));
    updateTeamStat(elem, 'self-healing', formatStat('', teamStats.stats.average.SelfHealing, true));
    updateTeamStat(elem, 'shields', formatStat('', teamStats.stats.average.ProtectionGivenToAllies, true));
    updateTeamStat(elem, 'damage-taken', formatStat('', teamStats.stats.average.DamageTaken, true));

    updateTeamStat(elem, 'hero-damage-tf', formatStat('', teamStats.stats.average.TeamfightHeroDamage, true));
    updateTeamStat(elem, 'damage-taken-tf', formatStat('', teamStats.stats.average.TeamfightDamageTaken, true));
    updateTeamStat(elem, 'healing-tf', formatStat('', teamStats.stats.average.TeamfightHealingDone, true));
    updateTeamStat(elem, 'cc', formatSeconds(teamStats.stats.average.TimeCCdEnemyHeroes));
    updateTeamStat(elem, 'root', formatSeconds(teamStats.stats.average.TimeRootingEnemyHeroes));
    updateTeamStat(elem, 'silence', formatSeconds(teamStats.stats.average.TimeSilencingEnemyHeroes));
    updateTeamStat(elem, 'stun', formatSeconds(teamStats.stats.average.TimeStunningEnemyHeroes));
  }
  catch (e) {
    // basically if a team has no people this will likely throw an exception.
    // instead of actually handling it, i'm just going to ignore it because a team with 0 people
    // is useless and you should just go to the roster and add people.
  }
  loadTeamRoster(playerStats);

  // average comparison
  updateTeamCollectionCompare($('#team-compare-collection').dropdown('get value'), null, null);

  $('#team-detail-body table').floatThead('reflow');
  $('#team-detail-body th').removeClass('sorted ascending descending');
}

function toggleTeamRosterMode(elem) {
  $('#team-roster-stats .top.attached.menu .item').removeClass('active');
  $(elem).addClass('active');
  loadTeamRoster(teamPlayerStats);
}

function loadTeamRoster(playerStats) {
  $('#team-roster-stats tbody').html('');
  let mode = $('#team-roster-stats .top.attached.menu .active.item').attr('data-mode');

  if (currentTeam === undefined)
    return;

  for (let p in currentTeam.players) {
    let id = currentTeam.players[p];

    if (id in playerStats) {
      let player = playerStats[id];

      let context = {};
      context.name = player.name;
      context.id = id;
      context.value = player[mode];
      context.value.totalKDA = player[mode].KDA;

      if (mode === 'total' || mode === 'averages')
        context.value.totalKDA = player.totalKDA;

      for (let v in context.value) {
        context[v] = formatStat(v, context.value[v], true);
      }
      context.value.games = player.games;
      context.games = player.games;
      context.highestStreak = formatStat('', player[mode].HighestKillStreak, true);

      $('#team-roster-stats tbody').append(teamRosterRowTemplate(context));

      // fill in the most played heroes
      let heroes = [];
      for (let h in player.heroes) {
        heroes.push({hero: h, games: player.heroes[h]});
      }
      heroes.sort(function(a, b) {
        if (a.games < b.games)
          return 1;
        else if (a.games > b.games)
          return -1;

        return 0;
      });

      for (let i = 0; i < 3; i++) {
        if (i >= heroes.length)
          break;
        let img = '<img src="assets/heroes-talents/images/heroes/' + Heroes.heroIcon(heroes[i].hero) + '">';
        $('#team-roster-stats .top-three[player-id="' + id + '"] .images').append(img);
      }

      // nickname replacement
      DB.getPlayer(id, function(err, doc) {
        // replace the recently added row
        if (doc[0].nickname) {
          $('#team-roster-stats .player-name[playerID="' + id + '"]').text(doc[0].nickname);
        }
      });
    }
    else {
      DB.getPlayer(id, function(err, doc) {
        if (doc.length === 0)
          return;

        let context = {};

        if (doc[0].nickname && doc[0].nickname !== '') {
          context.name = doc[0].nickname;
        }
        else {
          context.name = doc[0].name;
        }
        context.id = doc[0]._id;
        $('#team-roster-stats tbody').append(teamRosterRowTemplate(context));

        $('#team-roster-stats .dropdown.button[player-id="' + doc[0]._id + '"]').dropdown({
          onChange: function(value, text, $elem) {
            handleTeamPlayerCallback(value, $elem.attr('player-id'), $elem.attr('player-name'));
          }
        });
      });
    }
  }

  $('#team-roster-stats .dropdown.button').dropdown({
    onChange: function(value, text, $elem) {
      handleTeamPlayerCallback(value, $elem.attr('player-id'), $elem.attr('player-name'));
    }
  });

  $('#team-roster-stats .player-name').click(function() {
    showPlayerProfile($(this).attr('playerID'));
  })
}

// handles individual player action stuff
function handleTeamPlayerCallback(action, id, name) {
  if (action === 'remove') {
    $('#team-confirm-action-user .header').text('Confirm Delete Player');
    $('#team-confirm-action-user .action').text('remove ' + name + ' from ' + currentTeam.name);

    $('#team-confirm-action-user').modal({
      onApprove: function() {
        DB.removePlayerFromTeam(currentTeam._id, id, function() {
          updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
        })
      }
    }).
    modal('show');
  }
  else if (action === 'profile') {
    // load and then immediately switch to player profile
    showPlayerProfile(id);
  }
}

function addPlayerToTeam() {
  // brings up a modal to add players to the currently selected team
  if (currentTeam) {
    $('#team-add-user .team-name').text(currentTeam.name);

    $('#team-add-user').modal({
      onApprove: function() {
        let id = $('#team-add-player-menu').dropdown('get value');
        DB.addPlayerToTeam(currentTeam._id, id, function() {
          updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
        });
      }
    }).
    modal('show');
  }
}

function handleTeamMenuCallback(action) {
  if (action === "new") {
    $('#team-text-input .header').text('Create New Team')
    $('#team-text-input .input .label').text('Team Name');
    $('#team-text-input input').val('');

    $('#team-text-input').modal({
      onApprove: function() {
        let name = $('#team-text-input input').val();
        DB.addTeam([], name, function() {
          populateTeamMenu($('.team-menu'));
          $('#team-set-team').dropdown('refresh');
        });
      }
    }).
    modal('show');
  }
  else if (action === "rename") {
    if (currentTeam) {
      $('#team-text-input .header').text('Rename ' + currentTeam.name);
      $('#team-text-input .input .label').text('Team Name');
      $('#team-text-input input').val('');

      $('#team-text-input').modal({
        onApprove: function() {
          let name = $('#team-text-input input').val();
          DB.changeTeamName(currentTeam._id, name, function() {
            populateTeamMenu($('.team-menu'));
            $('#team-set-team').dropdown('refresh');
            $('#teams-page-header .team-name').text(name);
            $('#team-set-team').dropdown('set text', name);
          });
        }
      }).
      modal('show');
    }
  }
  else if (action === "delete") {
    $('#team-confirm-action-user .header').text('Delete ' + currentTeam.name);
    $('#team-confirm-action-user .action').text('delete the team ' + currentTeam.name);

    $('#team-confirm-action-user').modal({
      onApprove: function() {
        DB.deleteTeam(currentTeam._id, function() {
          currentTeam = null;
          populateTeamMenu($('.team-menu'));
          $('#team-set-team').dropdown('refresh');
          $('#teams-page-header .team-name').text('');
          $('#team-set-team').dropdown('set text', '');
        })
      }
    }).
    modal('show');
  }
  else if (action === 'print-team') {
    dialog.showSaveDialog({
      title: 'Print Team Report',
      filters: [{name: 'pdf', extensions: ['pdf']}]
    }, function(filename) {
      if (filename) {
        printTeamDetail(filename, null);
      }
    });
  }
  else if (action === 'print-sections') {
    $('#team-print-sections').modal({
      onApprove: function() {
        dialog.showSaveDialog({
          title: 'Print Team Report',
          filters: [{name: 'pdf', extensions: ['pdf']}]
        }, function(filename) {
          if (filename) {
            let sections = $('#team-print-sections .ui.dropdown').dropdown('get value').split(',');
            printTeamDetail(filename, sections);
          }
        });
      },
      closable: false
    }).modal('show');
  }
}

function showMatchHistory() {
  if (currentTeam) {
    resetMatchFilters();
    $('#match-search-team').dropdown('set exactly', currentTeam._id);
    selectMatches();
    changeSection('matches', true);
  }
}

function updateTeamCollectionCompare(value, text, $elem) {
  if (!teamTeamStats)
    return;

  let cid = value === 'all' ? null : value;

  $('#team-compare-collection').addClass('loading disabled');
  loadTeamAverages(cid);
}

// this function is kinda terrible cause the teams come in async style
function loadTeamAverages(collectionID) {
  teamAvgData = {
    wins: 0,
    games: 0,
    takedowns: 0,
    deaths: 0,
    matchLength: 0
  };
  teamAvgTracker = { target: 0, current: 0, actual: 0};

  DB.getAllTeams(function(err, teams) {
    teamAvgTracker.target = teams.length;

    // kinda terrible double calls to this but eh
    // unfiltered
    let query = {};
    if (collectionID)
      query.collection = collectionID;

    getAllTeamData(query, processTeamAverages)
  });
}

function processTeamAverages(err, matches, team) {
  teamAvgTracker.current += 1;

  if (matches.length === 0) {
    if (teamAvgTracker.current === teamAvgTracker.target)
      displayTeamAverages();

    return;
  }

  teamAvgTracker.actual += 1;
  let teamStats = summarizeTeamData(team, matches, Heroes);

  for (let s in teamStats.stats.total) {
    if (!(s in teamAvgData))
      teamAvgData[s] = 0;

    teamAvgData[s] += teamStats.stats.average[s];
  }

  // specific stats
  teamAvgData.wins += teamStats.wins;
  teamAvgData.games += teamStats.totalMatches;
  teamAvgData.takedowns += teamStats.takedowns.average;
  teamAvgData.deaths += teamStats.deaths.average;
  teamAvgData.matchLength += teamStats.matchLength.average;

  // tiers
  for (let t in teamStats.tierTimes) {
    if (!(t in teamAvgData))
      teamAvgData[t] = 0;

    teamAvgData[t] += teamStats.tierTimes[t].average;
  }

  // not sure about structures really, that's kinda just a fun fact
  if (teamAvgTracker.current === teamAvgTracker.target)
    displayTeamAverages();
}

function displayTeamAverages() {
  // divide everything by number of teams (except games I guess)
  for (let s in teamAvgData) {
    if (s === 'games')
      continue;

    teamAvgData[s] /= teamAvgTracker.actual;
  }

  $('#team-compare-table tbody').html('');
  for (let s in teamAvgData) {
    let context = {};

    // i kind of hate the sheer number of special cases that exist here
    if (s === 'games' || s === 'wins') {
      continue;
    }
    else if (s === 'takedowns') {
      context.statName = 'Takedowns';
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatStat(s, context.cmpDataSort, true);
      context.pDataSort = teamTeamStats.takedowns.average;
      context.pData = formatStat(s, context.pDataSort, true);
    }
    else if (s === 'deaths') {
      context.statName = 'Deaths';
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatStat(s, context.cmpDataSort, true);
      context.pDataSort = teamTeamStats.deaths.average;
      context.pData = formatStat(s, context.pDataSort, true);
    }
    else if (s === 'matchLength') {
      context.statName = 'Match Length';
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatSeconds(context.cmpDataSort);
      context.pDataSort = teamTeamStats.matchLength.average;
      context.pData = formatSeconds(context.pDataSort);
    }
    else if (s === 'T1' || s === 'T2' || s === 'T3' || s === 'T4' || s === 'T5' || s === 'T6') {
      context.statName = DetailStatString[s];
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatSeconds(context.cmpDataSort);
      context.pDataSort = teamTeamStats.tierTimes[s].average;
      context.pData = formatSeconds(context.pDataSort);
    }
    else {
      context.statName = DetailStatString[s];
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatStat(s, context.cmpDataSort, true);
      context.pDataSort = teamTeamStats.stats.average[s];
      context.pData = formatStat(s, context.pDataSort, true);
    }

    if (context.cmpDataSort === 0)
      context.pctDiff = 0;
    else
      context.pctDiff = (context.pDataSort - context.cmpDataSort) / context.cmpDataSort;

    context.pctDiffFormat = formatStat('pct', context.pctDiff);

    $('#team-compare-table tbody').append(playerCompareRowTemplate(context));
  }

  $('#team-compare-collection').removeClass('loading disabled');
  $('#team-compare-table table').floatThead('reflow');
}

function layoutTeamDetailPrint(sections) {
  let sects = sections;
  if (!sects) {
    sects = ['stats', 'summary', 'draft', 'maps', 'against', 'roster', 'compare']
  }

  clearPrintLayout();

  addPrintHeader('Team Report: ' + $('#team-set-team').dropdown('get text'));
  addPrintDate();

  if (sects.indexOf('stats') !== -1) {
    addPrintPage('stats');
    addPrintSubHeader('Stats', 'stats');
    getPrintPage('stats').append($('#team-summary-stats .statistics').clone());
    getPrintPage('stats').find('.statistics').removeClass('horizontal');

    addPrintSubHeader('Macro Stats', 'stats');
    getPrintPage('stats').append($('#team-detail-stats').clone());
    getPrintPage('stats').find('.top.attached.label').remove();
    addPrintPage('rstats');

    addPrintSubHeader('Role Stats', 'rstats');
    getPrintPage('rstats').append($('#team-damage-stats').clone());
    getPrintPage('rstats').find('.top.attached.label').remove();
    addPrintPage('struct');

    addPrintSubHeader('Structure Stats', 'struct');
    getPrintPage('struct').append($('#team-structure-stats').clone());
    getPrintPage('struct').find('.top.attached.label').remove();
  }

  if (sects.indexOf('maps') !== -1) {
    addPrintPage('maps');
    addPrintSubHeader('Maps', 'maps');
    copyFloatingTable($('#team-map-summary .floatThead-wrapper'), getPrintPage('maps'));
  }

  if (sects.indexOf('summary') !== -1) {
    addPrintPage('summary');
    addPrintSubHeader('Hero Summary', 'summary');
    copyFloatingTable($('#team-hero-summary-table .floatThead-wrapper'), getPrintPage('summary'));
  }

  if (sects.indexOf('draft') !== -1) {
    addPrintPage('picks');
    addPrintSubHeader('Pick Priority', 'picks');
    copyFloatingTable($('#team-draft-table .floatThead-wrapper'), getPrintPage('picks'));

    addPrintPage('bans');
    addPrintSubHeader('Ban Priority', 'bans');
    copyFloatingTable($('#team-ban-summary .floatThead-wrapper'), getPrintPage('bans'));
  }

  if (sects.indexOf('against') !== -1) {
    addPrintPage('against');
    addPrintSubHeader('Win Rate Against Hero', 'against');
    copyFloatingTable($('#team-against-summary .floatThead-wrapper'), getPrintPage('against'));
  }

  if (sects.indexOf('roster') !== -1) {
    addPrintPage('roster');
    addPrintSubHeader('Roster Summary', 'roster');
    copyFloatingTable($('#team-roster-stats .floatThead-wrapper'), getPrintPage('roster'));
  }

  if (sects.indexOf('compare') !== -1) {
    addPrintPage('compare');
    addPrintSubHeader('Comparison to Collection Average: ' + $('#team-compare-collection').dropdown('get text'), 'compare');
    copyFloatingTable($('#team-compare-table .floatThead-wrapper'), getPrintPage('compare'));
  }
}

function printTeamDetail(filename, sections) {
  layoutTeamDetailPrint(sections);
  renderAndPrint(filename, 'Letter', true);
}
