var teamsHeroDataFilter = {};
var teamsMapDataFilter = {};
var teamHeroSummaryRowTemplate;
var teamBanSummaryRowTemplate;
var teamRosterRowTemplate;
var currentTeam;

function initTeamsPage() {
  $('#team-set-team').dropdown({
    onChange: updateTeamData
  });
  populateTeamMenu($('#team-set-team'));
  $('#team-set-team').dropdown('refresh');

  $('#team-add-player-menu').dropdown({
    action: 'activate',
    fullTextSearch: true
  });

  teamHeroSummaryRowTemplate = Handlebars.compile(getTemplate('teams', '#team-hero-summary-row').find('tr')[0].outerHTML);
  teamBanSummaryRowTemplate = Handlebars.compile(getTemplate('teams', '#team-hero-ban-row').find('tr')[0].outerHTML);
  teamRosterRowTemplate = Handlebars.compile(getTemplate('teams', '#team-roster-row').find('tr')[0].outerHTML);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'teams-filter');
  
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

  $('#team-edit-menu').dropdown({
    onChange: function(value, text, $elem) {
      handleTeamMenuCallback(value);
    }
  });

  $('#team-delete-user').modal({
    closable: false
  });
  $('#team-add-user').modal({
    closable: false
  });
  $('#team-add-player-button').click(addPlayerToTeam);
}

function teamShowSection() {
  // basically just expose the proper menu options here
  $('#team-edit-menu').removeClass('is-hidden');
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
  // compute hero stats
  let heroStats = DB.summarizeHeroData(heroData);
  let playerStats = DB.summarizePlayerData(heroData);
  let teamStats = DB.summarizeTeamData(team, matches, Heroes);

  // also lifting a little bit from player.js
  // team with stats are uh, a little useless? like it's all in the picks stats...

  // team stats de-duplicate but need some formatting
  let against = {};
  for (let h in teamStats.heroes) {
    let hero = teamStats.heroes[h];
    if (hero.gamesAgainst > 0) {
      against[h] = { name: h, games: hero.gamesAgainst, defeated: hero.defeated }
    }
  }

  renderMapStatsTo($('#team-map-summary'), teamStats)
  renderHeroVsStatsTo($('#team-against-summary'), against);

  $('#team-hero-summary tbody').html('');
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
    context.KDA = context.value.KDA.toFixed(2);

    context.value.TimeSpentDead = heroStats.averages[h].TimeSpentDead;
    context.TimeSpentDead = formatSeconds(context.value.TimeSpentDead);

    context.value.timeDeadPct = hero.stats.timeDeadPct / hero.games;
    context.timeDeadPct = (context.value.timeDeadPct * 100).toFixed(2) + '%';

    context.value.games = hero.games;
    context.value.winPercent = hero.wins / hero.games;
    context.value.pickPercent = hero.games / teamStats.totalMatches;

    context.games = hero.games;
    context.winPercent = (context.value.winPercent * 100).toFixed(2) + '%';
    context.pickPercent = (context.value.pickPercent * 100).toFixed(2) + '%';
    context.heroImg = Heroes.heroIcon(h);
    context.heroName = h;

    picked += 1;
    $('#team-hero-summary tbody').append(teamHeroSummaryRowTemplate(context));
  }

  // bans
  $('#team-ban-summary tbody').html('');
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

    context.banPercent = (context.value.banPercent * 100).toFixed(2) + '%';
    context.ban1Percent = (context.value.ban1Percent * 100).toFixed(2) + '%';
    context.ban2Percent = (context.value.ban2Percent * 100).toFixed(2) + '%';

    $('#team-ban-summary tbody').append(teamBanSummaryRowTemplate(context));
  }

  // other stats
  $('#team-summary-stats .statistic[name="overallWin"] .value').text((teamStats.wins / teamStats.totalMatches * 100).toFixed(2) + '%');
  $('#team-summary-stats .statistic[name="overallGames"] .value').text(teamStats.totalMatches);
  $('#team-summary-stats .statistic[name="overallTD"] .value').text(teamStats.takedowns);
  $('#team-summary-stats .statistic[name="overallDeaths"] .value').text(teamStats.deaths);
  $('#team-summary-stats .statistic[name="overallKDA"] .value').text((teamStats.takedowns / Math.max(1, teamStats.deaths)).toFixed(2));
  $('#team-summary-stats .statistic[name="timeDead"] .value').text(formatSeconds(teamStats.stats.average.avgTimeSpentDead));
  $('#team-summary-stats .statistic[name="pctTimeDead"] .value').text((teamStats.stats.average.timeDeadPct * 100).toFixed(2) + '%');
  $('#team-summary-stats .statistic[name="heroesPlayed"] .value').text(picked);
  $('#team-summary-stats .statistic[name="heroesPct"] .value').text((picked / Heroes.heroCount * 100).toFixed(2) + '%');
  $('#team-summary-stats .statistic[name="avgLength"] .value').text(formatSeconds(teamStats.avgLength));
  $('#team-summary-stats .statistic[name="PPK"] .value').text(teamStats.stats.average.PPK.toFixed(2));

  $('#team-detail-stats .statistic[name="team-time-to-10"] .value').text(formatSeconds(teamStats.stats.average.timeTo10));
  $('#team-detail-stats .statistic[name="team-times-at-10"] .value').text(teamStats.level10Games);
  $('#team-detail-stats .statistic[name="team-time-to-20"] .value').text(formatSeconds(teamStats.stats.average.timeTo20));
  $('#team-detail-stats .statistic[name="team-times-at-20"] .value').text(teamStats.level20Games);

  $('#team-detail-stats .statistic[name="merc-captures"] .value').text(teamStats.stats.average.mercCaptures.toFixed(2));
  $('#team-detail-stats .statistic[name="merc-uptime"] .value').text(formatSeconds(teamStats.stats.average.mercUptime));
  $('#team-detail-stats .statistic[name="merc-uptime-percent"] .value').text((teamStats.stats.average.mercUptimePercent * 100).toFixed(2) + '%');

  let elem = $('#team-detail-stats');
  updateTeamStat(elem, 'forts-destroyed', teamStats.structures.Fort.destroyed);
  updateTeamStat(elem, 'forts-lost', teamStats.structures.Fort.lost);
  updateTeamStat(elem, 'first-fort', teamStats.structures.Fort.destroyed === 0 ? 'N/A' : formatSeconds(teamStats.structures.Fort.first / teamStats.structures.Fort.gamesWithFirst));

  updateTeamStat(elem, 'keeps-destroyed', teamStats.structures.Keep.destroyed);
  updateTeamStat(elem, 'keeps-lost', teamStats.structures.Keep.lost);
  updateTeamStat(elem, 'first-keep', teamStats.structures.Keep.destroyed === 0 ? 'N/A' : formatSeconds(teamStats.structures.Keep.first / teamStats.structures.Keep.gamesWithFirst));

  updateTeamStat(elem, 'wells-destroyed', teamStats.structures['Fort Well'].destroyed + teamStats.structures['Keep Well'].destroyed);
  updateTeamStat(elem, 'wells-lost', teamStats.structures['Fort Well'].lost + teamStats.structures['Keep Well'].lost);

  let hideWellTime = (teamStats.structures['Fort Well'].destroyed + teamStats.structures['Keep Well'].destroyed) === 0
  updateTeamStat(elem, 'first-well', hideWellTime ? 'N/A' : formatSeconds(Math.min(teamStats.structures['Fort Well'].first / teamStats.structures['Fort Well'].gamesWithFirst, teamStats.structures['Keep Well'].first / teamStats.structures['Keep Well'].gamesWithFirst)));

  updateTeamStat(elem, 'towers-destroyed', teamStats.structures['Fort Tower'].destroyed + teamStats.structures['Keep Tower'].destroyed);
  updateTeamStat(elem, 'towers-lost', teamStats.structures['Fort Tower'].lost + teamStats.structures['Keep Tower'].lost);

  let hideTowerTime = (teamStats.structures['Fort Tower'].destroyed + teamStats.structures['Keep Tower'].destroyed) === 0;
  updateTeamStat(elem, 'first-tower', hideTowerTime ? 'N/A' : formatSeconds(Math.min(teamStats.structures['Fort Tower'].first / teamStats.structures['Fort Tower'].gamesWithFirst, teamStats.structures['Keep Tower'].first / teamStats.structures['Keep Tower'].gamesWithFirst)));

  elem = $('#team-damage-stats');
  updateTeamStat(elem, 'hero-damage', teamStats.stats.average.HeroDamage.toFixed(0));
  updateTeamStat(elem, 'siege-damage', teamStats.stats.average.SiegeDamage.toFixed(0));
  updateTeamStat(elem, 'creep-damage', teamStats.stats.average.CreepDamage.toFixed(0));
  updateTeamStat(elem, 'minion-damage', teamStats.stats.average.MinionDamage.toFixed(0));
  updateTeamStat(elem, 'healing', teamStats.stats.average.Healing.toFixed(0));
  updateTeamStat(elem, 'self-healing', teamStats.stats.average.SelfHealing.toFixed(0));
  updateTeamStat(elem, 'shields', teamStats.stats.average.ProtectionGivenToAllies.toFixed(0));
  updateTeamStat(elem, 'damage-taken', teamStats.stats.average.DamageTaken.toFixed(0));

  elem = $('#team-teamfight-stats');
  updateTeamStat(elem, 'hero-damage', teamStats.stats.average.TeamfightHeroDamage.toFixed(0));
  updateTeamStat(elem, 'damage-taken', teamStats.stats.average.TeamfightDamageTaken.toFixed(0));
  updateTeamStat(elem, 'healing', teamStats.stats.average.TeamfightHealingDone.toFixed(0));
  updateTeamStat(elem, 'cc', formatSeconds(teamStats.stats.average.TimeCCdEnemyHeroes));
  updateTeamStat(elem, 'root', formatSeconds(teamStats.stats.average.TimeRootingEnemyHeroes));
  updateTeamStat(elem, 'silence', formatSeconds(teamStats.stats.average.TimeSilencingEnemyHeroes));
  updateTeamStat(elem, 'stun', formatSeconds(teamStats.stats.average.TimeStunningEnemyHeroes));

  loadTeamRoster(playerStats);

  $('#team-detail-body table').floatThead('reflow');
}

function loadTeamRoster(playerStats) {
  $('#team-roster-stats tbody').html('');
  for (let p in currentTeam.players) {
    let id = currentTeam.players[p];

    if (id in playerStats) {
      let player = playerStats[id];

      let context = {};
      context.name = player.name;
      context.id = id;
      context.value = player.averages;
      context.value.totalKDA = player.totalKDA;

      for (let v in context.value) {
        context[v] = formatStat(v, context.value[v], true);
      }
      context.value.games = player.games;
      context.games = player.games;

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
        if (i > heroes.length)
          break;
        let img = '<img src="assets/heroes-talents/images/heroes/' + Heroes.heroIcon(heroes[i].hero) + '">';
        $('#team-roster-stats .top-three[player-id="' + id + '"] .images').append(img);
      }
    }
    else {
      DB.getPlayer(id, function(err, doc) {
        let context = {};
        context.name = doc[0].name;
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
}

// handles individual player action stuff
function handleTeamPlayerCallback(action, id, name) {
  if (action === 'remove') {
    $('#team-delete-user .player-delete-id').text(name);
    $('#team-delete-user .team-delete-id').text(currentTeam.name);

    $('#team-delete-user').modal({
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
    preloadPlayerID(id);
    changeSection('player', true);
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

}