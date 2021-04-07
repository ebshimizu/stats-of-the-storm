var teamsHeroDataFilter = {};
var teamsMapDataFilter = {};
var teamRosterRowTemplate;
var currentTeam;
var cmpTeamVal;
var teamPlayerStats, teamTeamStats, teamHeroStats;
var teamAvgData;
var teamAvgTracker;
var teamHeroMatchThresh = 0;

var teamTables = {
  heroSummary: null,
  bans: null,
  againstHero: null,
  compareVsAvg: null,
  maps: null,
  duosWith: null,
  duosAgainst: null,
  pickDetail: null,
};

function initTeamsPage(tags) {
  $('#team-set-team').dropdown({
    onChange: updateTeamData,
    fullTextSearch: true,
  });
  $('#team-set-team-compare').dropdown({
    onChange: updateCompareTeamData,
    fullTextSearch: true,
  });

  populateTeamMenu($('.team-menu'));

  $('#team-add-player-menu').dropdown({
    action: 'activate',
    fullTextSearch: true,
  });

  teamTables.maps = new Table('#team-map-summary table', TableDefs.MapFormat);
  teamTables.againstHero = new Table('#team-against-summary table', TableDefs.PlayerVsTableFormat);
  teamTables.heroSummary = new Table('#team-hero-summary-table table', TableDefs.TeamHeroSummaryFormat);
  teamTables.bans = new Table('#team-ban-summary table', TableDefs.TeamBanSummaryFormat);
  teamTables.compareVsAvg = new Table('#team-compare-table table', TableDefs.TeamCompareToAvgFormat);
  teamTables.duosWith = new Table('#team-duo-with', TableDefs.PlayerDuoWithFormat);
  teamTables.duosAgainst = new Table('#team-duo-against', TableDefs.PlayerDuoAgainstFormat);
  teamTables.pickDetail = new Table('#team-pick-detail table', TableDefs.TeamHeroPickDetailFormat);

  teamRosterRowTemplate = getHandlebars('teams', '#team-roster-row');
  teamCompareHeroPickRowTemplate = getHandlebars('teams', '#team-roster-hero-compare-row');

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template'));
  filterWidget.attr('widget-name', 'teams-filter');
  filterWidget.find('.filter-widget-team').addClass('is-hidden');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget, tags);

  $('#team-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="teams-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false,
  });

  bindFilterButton(filterWidget, updateTeamsFilter);
  bindFilterResetButton(filterWidget, resetTeamsFilter);
  bindOtherSearchButton(filterWidget, $('#team-alt-search-button'), updateTeamsFilter);

  $('#team-detail-body table.sortable').tablesort();
  $('#team-detail-body table.sortable').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true,
  });

  $('#team-detail-body th.stat').data('sortBy', function (th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  $('#team-duos-sub .item').tab();
  $('#team-duos-sub .item').click(function () {
    teamTables.duosWith.draw();
    teamTables.duosAgainst.draw();
  });

  $('#teams-submenu .item').tab();
  $('#teams-submenu .item').click(function () {
    $('#team-detail-body table.sortable').floatThead('reflow');
    redrawTeamTables();
  });

  $('#team-hero-summary .menu .item').tab();
  $('#team-hero-summary .item').click(function () {
    $('#team-detail-body table.sortable').floatThead('reflow');
    teamTables.heroSummary.draw();
    teamTables.bans.draw();
    teamTables.pickDetail.draw();
  });

  $('#teams-submenu .external-match-history').click(function () {
    showMatchHistory();
  });

  $('#team-edit-menu').dropdown({
    onChange: function (value, text, $elem) {
      handleTeamMenuCallback(value);
    },
  });

  $('#team-roster-stats .top.attached.menu .item').click(function () {
    toggleTeamRosterMode(this);
  });

  $('#team-confirm-action-user').modal({
    closable: false,
  });
  $('#team-add-user').modal({
    closable: false,
  });
  $('#team-text-input').modal({
    closable: false,
  });
  $('#team-add-player-button').click(addPlayerToTeam);

  // collection averages
  $('#team-compare-collection').dropdown({
    action: 'activate',
    onChange: updateTeamCollectionCompare,
  });
  populateTeamCollectionMenu();

  // threshold
  $('#teams-hero-thresh input').popup({
    on: 'focus',
  });
  $('#teams-hero-thresh input').val(0);
  $('#teams-hero-thresh input').blur(function () {
    updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
  });

  $('#team-file-menu').dropdown({
    onChange: handleTeamMenuCallback,
  });
  $('#team-print-sections .ui.dropdown').dropdown();
}

function populateTeamCollectionMenu() {
  $('#team-compare-collection .menu').html('');
  $('#team-compare-collection .menu').append('<div class="item" data-value="all">All Matches</div>');
  $('#team-compare-collection .menu').append('<div class="ui divider"></div>');

  DB.getCollections(function (err, collections) {
    for (let c in collections) {
      let col = collections[c];
      $('#team-compare-collection .menu').append(
        '<div class="item" data-value="' + escapeHtml(col._id) + '">' + escapeHtml(col.name) + '</div>',
      );
    }

    $('#team-compare-collection').dropdown('refresh');
  });
}

function redrawTeamTables() {
  for (let t in teamTables) {
    teamTables[t].draw();
  }
}

function resetTeamsPage() {
  resetTeamsFilter();
}

function teamShowSection() {
  // basically just expose the proper menu options here
  $('#team-edit-menu').removeClass('is-hidden');
  $('#team-file-menu').removeClass('is-hidden');
  redrawTeamTables();
}

function showTeamLoader() {
  $('#team-detail-dimmer').dimmer('show');
  $('#team-set-team').addClass('disabled');
  disableWidget('teams-filter');
}

function hideTeamLoader() {
  $('#team-detail-dimmer').dimmer('hide');
  $('#team-set-team').removeClass('disabled');
  enableWidget('teams-filter');
}

function updateTeamsFilter(hero, map) {
  teamsHeroDataFilter = hero;
  teamsMapDataFilter = map;
  $('#team-filter-button').addClass('green');

  updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'), null, true);
}

function resetTeamsFilter() {
  teamsHeroDataFilter = {};
  teamsMapDataFilter = {};
  $('#team-filter-button').removeClass('green');

  updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'), null, true);
}

function updateTeamData(value, text, $elem, force) {
  // lol that's the null team don't do this
  if (value === '') return;

  if (currentTeam && currentTeam._id === value && !force) return;

  showTeamLoader();
  $('#teams-page-header .team-name').text(text);

  DB.getTeamData(value, teamsMapDataFilter, loadTeamData);
}

function updateCompareTeamData(value, text, $elem, force) {
  if (value === '') return;

  if (currentTeam && currentTeam._id === value && !force) return;

  if (value === cmpTeamVal) return;

  cmpTeamVal = value;
  showTeamLoader();

  DB.getTeamData(value, teamsMapDataFilter, loadTeamComparisonStats);
}

function loadTeamData(team, matches, heroData) {
  currentTeam = team;
  teamHeroMatchThresh = parseInt($('#teams-hero-thresh input').val());

  // compute hero stats
  teamHeroStats = summarizeHeroData(heroData);
  teamPlayerStats = summarizePlayerData(heroData, createPlayerAliasMap(team.resolvedPlayers));
  teamTeamStats = summarizeTeamData(team, matches, Heroes);

  // i'm uh, kind of lazy
  let playerStats = teamPlayerStats;
  let teamStats = teamTeamStats;
  let heroStats = teamHeroStats;

  // also lifting a little bit from player.js
  // team with stats are uh, a little useless? like it's all in the picks stats...

  // clear comparison stuff
  $('#team-comparison-stats tbody').html('');

  // team stats de-duplicate but need some formatting
  let against = {};
  for (let h in teamStats.heroes) {
    let hero = teamStats.heroes[h];
    if (hero.gamesAgainst >= teamHeroMatchThresh && hero.gamesAgainst > 0) {
      against[h] = { name: h, games: hero.gamesAgainst, defeated: hero.defeated };
    }
  }

  teamTables.maps.setDataFromObject(teamStats.maps);
  teamTables.againstHero.setDataFromObject(against);

  let picked = 0;
  let heroSummaryData = [];
  for (let h in heroStats.heroes) {
    picked += 1;
    const hero = heroStats.heroes[h];

    hero.heroName = h;
    hero.totalMatches = teamStats.totalMatches;
    hero.picks = teamStats.heroes[h].picks;
    heroSummaryData.push(hero);
  }
  teamTables.heroSummary.setData(heroSummaryData);
  teamTables.heroSummary.filterByMinGames(teamHeroMatchThresh);

  teamTables.pickDetail.setData(heroSummaryData);
  teamTables.pickDetail.filterByMinGames(teamHeroMatchThresh);

  // picks and bans
  let heroBanData = [];
  $('#team-ban-summary tbody').html('');
  for (let h in teamStats.heroes) {
    const hero = teamStats.heroes[h];

    // filter out only when a hero was faced without draft involvement
    if (hero.bans === 0 && hero.banAgainst === 0) continue;

    hero.totalMatches = teamStats.totalMatches;
    hero.heroName = h;
    heroBanData.push(hero);
  }
  teamTables.bans.setData(heroBanData);
  teamTables.bans.filterByMinGames(teamHeroMatchThresh);

  teamTables.duosWith.setDataFromObject(teamStats.heroes);
  teamTables.duosAgainst.setDataFromObject(teamStats.heroes);

  // other stats
  try {
    $('#team-summary-stats .statistic[name="overallWin"] .value').text(
      formatStat('pct', teamStats.wins / teamStats.totalMatches),
    );
    $('#team-summary-stats .statistic[name="overallGames"] .value').text(formatStat('', teamStats.totalMatches, true));
    $('#team-summary-stats .statistic[name="overallTD"] .value').text(formatStat('', teamStats.takedowns.total, true));
    $('#team-summary-stats .statistic[name="overallDeaths"] .value').text(formatStat('', teamStats.deaths.total, true));
    $('#team-summary-stats .statistic[name="overallKDA"] .value').text(
      formatStat('KDA', teamStats.takedowns.total / Math.max(1, teamStats.deaths.total)),
    );
    $('#team-summary-stats .statistic[name="timeDead"] .value').text(
      formatSeconds(teamStats.stats.average.avgTimeSpentDead),
    );
    $('#team-summary-stats .statistic[name="pctTimeDead"] .value').text(
      formatStat('pct', teamStats.stats.average.timeDeadPct),
    );
    $('#team-summary-stats .statistic[name="heroesPlayed"] .value').text(picked);
    $('#team-summary-stats .statistic[name="heroesPct"] .value').text(formatStat('pct', picked / Heroes.heroCount));
    $('#team-summary-stats .statistic[name="avgLength"] .value').text(formatSeconds(teamStats.matchLength.average));
    $('#team-summary-stats .statistic[name="PPK"] .value').text(formatStat('KDA', teamStats.stats.average.PPK));

    let elem = $('#team-detail-stats');
    $('#team-detail-stats .statistic[name="team-time-to-10"] .value').text(
      formatSeconds(teamStats.stats.average.timeTo10),
    );
    $('#team-detail-stats .statistic[name="team-times-at-10"] .value').text(
      formatStat('', teamStats.level10Games, true),
    );
    $('#team-detail-stats .statistic[name="team-time-to-20"] .value').text(
      formatSeconds(teamStats.stats.average.timeTo20),
    );
    $('#team-detail-stats .statistic[name="team-times-at-20"] .value').text(
      formatStat('', teamStats.level20Games, true),
    );

    $('#team-detail-stats .statistic[name="merc-captures"] .value').text(
      formatStat('mercCaptures', teamStats.stats.average.mercCaptures, true),
    );
    $('#team-detail-stats .statistic[name="merc-uptime"] .value').text(
      formatSeconds(teamStats.stats.average.mercUptime),
    );
    $('#team-detail-stats .statistic[name="merc-uptime-percent"] .value').text(
      formatStat('pct', teamStats.stats.average.mercUptimePercent),
    );

    updateTeamStat(elem, 'team-passive-rate', formatStat('passiveXPRate', teamStats.stats.average.passiveXPRate, true));
    updateTeamStat(elem, 'team-passive-gain', formatStat('passiveXPDiff', teamStats.stats.average.passiveXPDiff, true));
    updateTeamStat(
      elem,
      'team-passive-total',
      formatStat('passiveXPGain', teamStats.stats.average.passiveXPGain, true),
    );

    updateTeamStat(elem, 'team-level-adv-time', formatSeconds(teamStats.stats.average.levelAdvTime));
    updateTeamStat(elem, 'team-level-adv-pct', formatStat('levelAdvPct', teamStats.stats.average.levelAdvPct, true));
    updateTeamStat(elem, 'team-avg-level-adv', formatStat('avgLevelAdv', teamStats.stats.average.avgLevelAdv, true));
    updateTeamStat(elem, 'team-avg-level-lead', formatStat('maxLevelAdv', teamStats.stats.average.maxLevelAdv, true));

    updateTeamStat(elem, 'T1', formatSeconds(teamStats.tierTimes.T1.average));
    updateTeamStat(elem, 'T2', formatSeconds(teamStats.tierTimes.T2.average));
    updateTeamStat(elem, 'T3', formatSeconds(teamStats.tierTimes.T3.average));
    updateTeamStat(elem, 'T4', formatSeconds(teamStats.tierTimes.T4.average));
    updateTeamStat(elem, 'T5', formatSeconds(teamStats.tierTimes.T5.average));
    updateTeamStat(elem, 'T6', formatSeconds(teamStats.tierTimes.T6.average));

    updateTeamStat(elem, 'avgLevelDiff', formatStat('', teamStats.endOfGameLevels.combined.average, true));
    updateTeamStat(elem, 'avgLevelDiffWin', formatStat('', teamStats.endOfGameLevels.win.average, true));
    updateTeamStat(elem, 'avgLevelDiffLoss', formatStat('', teamStats.endOfGameLevels.loss.average, true));

    elem = $('#team-structure-stats');
    updateTeamStat(elem, 'forts-destroyed', teamStats.structures.Fort.destroyed);
    updateTeamStat(elem, 'forts-lost', teamStats.structures.Fort.lost);
    updateTeamStat(
      elem,
      'first-fort',
      teamStats.structures.Fort.destroyed === 0
        ? '-'
        : formatSeconds(teamStats.structures.Fort.first / teamStats.structures.Fort.gamesWithFirst),
    );

    updateTeamStat(elem, 'keeps-destroyed', teamStats.structures.Keep.destroyed);
    updateTeamStat(elem, 'keeps-lost', teamStats.structures.Keep.lost);
    updateTeamStat(
      elem,
      'first-keep',
      teamStats.structures.Keep.destroyed === 0
        ? '-'
        : formatSeconds(teamStats.structures.Keep.first / teamStats.structures.Keep.gamesWithFirst),
    );

    updateTeamStat(
      elem,
      'wells-destroyed',
      teamStats.structures['Fort Well'].destroyed + teamStats.structures['Keep Well'].destroyed,
    );
    updateTeamStat(elem, 'wells-lost', teamStats.structures['Fort Well'].lost + teamStats.structures['Keep Well'].lost);

    let hideWellTime = teamStats.structures['Fort Well'].destroyed + teamStats.structures['Keep Well'].destroyed === 0;
    updateTeamStat(
      elem,
      'first-well',
      hideWellTime
        ? '--:--'
        : formatSeconds(
            Math.min(
              teamStats.structures['Fort Well'].first / teamStats.structures['Fort Well'].gamesWithFirst,
              teamStats.structures['Keep Well'].gamesWithFirst === 0
                ? 1e10
                : teamStats.structures['Keep Well'].first / teamStats.structures['Keep Well'].gamesWithFirst,
            ),
          ),
    );

    updateTeamStat(
      elem,
      'towers-destroyed',
      teamStats.structures['Fort Tower'].destroyed + teamStats.structures['Keep Tower'].destroyed,
    );
    updateTeamStat(
      elem,
      'towers-lost',
      teamStats.structures['Fort Tower'].lost + teamStats.structures['Keep Tower'].lost,
    );

    let hideTowerTime =
      teamStats.structures['Fort Tower'].destroyed + teamStats.structures['Keep Tower'].destroyed === 0;
    updateTeamStat(
      elem,
      'first-tower',
      hideTowerTime
        ? '--:--'
        : formatSeconds(
            Math.min(
              teamStats.structures['Fort Tower'].first / teamStats.structures['Fort Tower'].gamesWithFirst,
              teamStats.structures['Keep Tower'].gamesWithFirst === 0
                ? 1e10
                : teamStats.structures['Keep Tower'].first / teamStats.structures['Keep Tower'].gamesWithFirst,
            ),
          ),
    );

    elem = $('#team-damage-stats');
    updateTeamStat(elem, 'hero-damage', formatStat('', teamStats.stats.average.HeroDamage, true));
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

    updateTeamStat(elem, 'first-pick-pct', formatStat('pct', teamStats.firstPicks / teamStats.totalMatches));
    updateTeamStat(
      elem,
      'first-pick-win',
      formatStat('pct', teamStats.firstPicks === 0 ? 0 : teamStats.firstPickWins / teamStats.firstPicks),
    );
    updateTeamStat(elem, 'team-aces', formatStat('aces', teamStats.stats.total.aces, true));
    updateTeamStat(elem, 'team-wipes', formatStat('wipes', teamStats.stats.total.wipes, true));

    updateTeamStat(elem, 'team-time-hero-adv', formatSeconds(teamStats.stats.average.timeWithHeroAdv));
    updateTeamStat(elem, 'team-time-hero-advp', formatStat('pct', teamStats.stats.average.pctWithHeroAdv, true));
    updateTeamStat(
      elem,
      'team-heroes-alive',
      formatStat('avgHeroesAlive', teamStats.stats.average.avgHeroesAlive, true),
    );

    updateTeamStat(
      elem,
      'team-pct-0-hero',
      formatStat('pctWith0HeroesAlive', teamStats.stats.average.pctWith0HeroesAlive, true),
    );
    updateTeamStat(
      elem,
      'team-pct-1-hero',
      formatStat('pctWith1HeroesAlive', teamStats.stats.average.pctWith1HeroesAlive, true),
    );
    updateTeamStat(
      elem,
      'team-pct-2-hero',
      formatStat('pctWith2HeroesAlive', teamStats.stats.average.pctWith2HeroesAlive, true),
    );
    updateTeamStat(
      elem,
      'team-pct-3-hero',
      formatStat('pctWith3HeroesAlive', teamStats.stats.average.pctWith3HeroesAlive, true),
    );
    updateTeamStat(
      elem,
      'team-pct-4-hero',
      formatStat('pctWith4HeroesAlive', teamStats.stats.average.pctWith4HeroesAlive, true),
    );
    updateTeamStat(
      elem,
      'team-pct-5-hero',
      formatStat('pctWith5HeroesAlive', teamStats.stats.average.pctWith5HeroesAlive, true),
    );
  } catch (e) {
    // basically if a team has no people this will likely throw an exception.
    // instead of actually handling it, i'm just going to ignore it because a team with 0 people
    // is useless and you should just go to the roster and add people.
  }
  loadTeamRoster(playerStats);

  // average comparison
  updateTeamCollectionCompare($('#team-compare-collection').dropdown('get value'), null, null);

  $('#team-detail-body table.sortable').floatThead('reflow');
  $('#team-detail-body th').removeClass('sorted ascending descending');
  hideTeamLoader();
}

function loadTeamComparisonStats(team2, team2Matches, team2Data) {
  // team 1 stats are already loaded here
  let team2HeroStats = summarizeHeroData(team2Data);
  let team2PlayerStats = summarizePlayerData(team2Data, createPlayerAliasMap(team2.resolvedPlayers));
  let team2TeamStats = summarizeTeamData(team2, team2Matches, Heroes);

  // clear comparison stuff
  $('#team-comparison-stats tbody').html('');

  // replace names
  $('#team-compare-stats .team1').text(`[1] ${$('#teams-page-header .team-name').text()}`);
  $('#team-compare-stats .team2').text(`[2] ${team2.name}`);

  $('#team-compare-header').text(`VS [2] ${team2.name}`);

  // general stats
  // this is admittedly a long manual list of stats, which is honestly kind of unfortunate
  // but they pull data from a variety of places at the moment
  // ok we'll put this all into an object and format it later
  const team1CompareStats = getTeamCompareStats(teamTeamStats, teamHeroStats);
  const team2CompareStats = getTeamCompareStats(team2TeamStats, team2HeroStats);
  const statTable = $('#team-compare-stats tbody');
  for (let k in team1CompareStats) {
    const t1 = team1CompareStats[k];
    const t2 = team2CompareStats[k];

    statTable.append(`
      <tr>
        <td>${escapeHtml(t1.name)}</td>
        <td class="center aligned" data-sort-value="${escapeHtml(t1.val)}">${escapeHtml(t1.format)}</td>
        <td class="center aligned" data-sort-value="${escapeHtml(t2.val)}">${escapeHtml(t2.format)}</td>
      </tr>`);
  }

  // map stats
  // need to merge these things
  const team1Maps = Object.keys(teamTeamStats.maps);
  const team2Maps = Object.keys(team2TeamStats.maps);
  const teamMaps = team1Maps.concat(
    team2Maps.filter(function (item) {
      return team1Maps.indexOf(item) < 0;
    }),
  );

  const mapTable = $('#team-compare-map-stats tbody');
  for (let map of teamMaps) {
    const t1 = teamTeamStats.maps[map];
    const t2 = team2TeamStats.maps[map];

    const t1Win = t1 ? t1.winPct : 0;
    const t2Win = t2 ? t2.winPct : 0;
    const t1WinPct = t1 ? t1.wins / t1.games : 0;
    const t2WinPct = t2 ? t2.wins / t2.games : 0;

    const t1Format = t1 ? `${formatStat('pct', t1WinPct)} (${t1.wins} - ${t1.games - t1.wins})` : '';
    const t2Format = t2 ? `${formatStat('pct', t2WinPct)} (${t2.wins} - ${t2.games - t2.wins})` : '';

    mapTable.append(`
      <tr>
        <td>${map}</td>
        <td class="center aligned">${t1 ? t1.games : 0}</td>
        <td class="center aligned">${t2 ? t2.games : 0}</td>
        <td class="center aligned" data-sort-value="${t1Win}">${t1Format}</td>
        <td class="center aligned" data-sort-value="${t2Win}">${t2Format}</td>
      </tr>
    `);
  }

  // pick/ban stats
  const team1Heroes = Object.keys(teamTeamStats.heroes);
  const team2Heroes = Object.keys(team2TeamStats.heroes);
  const teamHeroes = team1Heroes.concat(
    team2Heroes.filter(function (item) {
      return team1Heroes.indexOf(item) < 0;
    }),
  );

  for (let hero of teamHeroes) {
    // team 1 data
    let context = {};
    const t1 = teamTeamStats.heroes[hero];
    const t2 = team2TeamStats.heroes[hero];

    if ((t1 && (t1.games > 0 || t1.bans > 0)) || (t2 && (t2.games > 0 || t2.bans > 0))) {
      if (t1) {
        context.team1 = getTeamHeroCompareStats(t1, teamTeamStats.totalMatches);
      }

      if (t2) {
        context.team2 = getTeamHeroCompareStats(t2, team2TeamStats.totalMatches);
      }

      context.heroName = hero;
      context.contested = checkContestedPick(context);

      $('#team-compare-picks tbody').append(teamCompareHeroPickRowTemplate(context));
    }
  }

  hideTeamLoader();
}

function checkContestedPick(context) {
  if (!context.team1 || !context.team2) {
    return '';
  }

  // current criteria:
  // - pick rate for one team > 25% + pick % within 10%
  // - one team pick % large, other team ban % large
  if (context.team1.pickPct > 0.25 || context.team2.pickPct > 0.25) {
    if (Math.abs(context.team1.pickPct - context.team2.pickPct) <= 0.1) {
      return 'contested';
    }
  }

  if (
    (context.team1.pickPct > 0.3 && context.team2.banPct > 0.3) ||
    (context.team2.pickPct > 0.3 && context.team1.banPct > 0.3)
  ) {
    return 'contested';
  }

  return '';
}

// returns formatted and sort data for the given team data block
function getTeamCompareStats(teamStats, heroStats) {
  let stats = {};

  const picked = Object.keys(heroStats.heroes).length;

  // all of this is kinda terrible because the stats are scattered everywhere
  const winPct = formatStat('pct', teamStats.wins / teamStats.totalMatches);
  stats.record = {
    name: 'Record',
    val: teamStats.wins / teamStats.totalMatches,
    format: `${winPct} (${teamStats.wins} - ${teamStats.totalMatches - teamStats.wins})`,
  };
  stats.overallTD = {
    name: 'Avg. TD',
    val: teamStats.takedowns.average,
    format: formatStat('', teamStats.takedowns.average, true),
  };
  stats.overallDeaths = {
    name: 'Avg. Deaths',
    val: teamStats.deaths.average,
    format: formatStat('', teamStats.deaths.average, true),
  };

  const KDA = teamStats.takedowns.total / Math.max(1, teamStats.deaths.total);
  stats.overallKDA = { name: 'KDA', val: KDA, format: formatStat('KDA', KDA) };
  stats.timeDead = {
    name: 'Avg. Time Dead',
    val: teamStats.stats.avgTimeSpentDead,
    format: formatSeconds(teamStats.stats.average.avgTimeSpentDead),
  };
  stats.timeDeadPct = {
    name: 'Avg. % Time Dead',
    val: teamStats.stats.average.timeDeadPct,
    format: formatStat('pct', teamStats.stats.average.timeDeadPct),
  };
  stats.heroPool = { name: 'Hero Pool', val: picked, format: picked };
  stats.avgLength = {
    name: 'Avg. Length',
    val: teamStats.matchLength.average,
    format: formatSeconds(teamStats.matchLength.average),
  };
  stats.ppk = {
    name: 'People Per Kill (PPK)',
    val: teamStats.stats.average.PPK,
    format: formatStat('KDA', teamStats.stats.average.PPK),
  };

  stats.tt10 = {
    name: 'Avg. Time to 10',
    val: teamStats.stats.average.timeTo10,
    format: formatSeconds(teamStats.stats.average.timeTo10),
  };
  stats.tt20 = {
    name: 'Avg. Time to 20',
    val: teamStats.stats.average.timeTo20,
    format: formatSeconds(teamStats.stats.average.timeTo20),
  };

  stats.passiveRate = {
    name: 'Passive XP/Second',
    val: teamStats.stats.average.passiveXPRate,
    format: formatStat('passiveXPRate', teamStats.stats.average.passiveXPRate, true),
  };
  stats.passiveGain = {
    name: 'Passive XP % Gain',
    val: teamStats.stats.average.passiveXPDiff,
    format: formatStat('passiveXPDiff', teamStats.stats.average.passiveXPDiff, true),
  };
  stats.passiveTotal = {
    name: 'Passive XP Gain',
    val: teamStats.stats.average.passiveXPRate,
    format: formatStat('passiveXPGain', teamStats.stats.average.passiveXPGain, true),
  };

  stats.levelAdvTime = {
    name: 'Avg. Time w/ Level Adv.',
    val: teamStats.stats.average.levelAdvTime,
    format: formatSeconds(teamStats.stats.average.levelAdvTime),
  };
  stats.levelAdvPct = {
    name: 'Avg. % of Game w/ Level Adv.',
    val: teamStats.stats.average.levelAdvPct,
    format: formatStat('pct', teamStats.stats.average.levelAdvPct, true),
  };
  stats.levelAdv = {
    name: 'Avg. Level Adv.',
    val: teamStats.stats.average.avgLevelAdv,
    format: formatStat('avgLevelAdv', teamStats.stats.average.avgLevelAdv, true),
  };
  stats.levelLead = {
    name: 'Avg. Max Level Lead',
    val: teamStats.stats.average.maxLevelAdv,
    format: formatSeconds('maxLevelAdv', teamStats.stats.average.maxLevelAdv, true),
  };

  stats.mercs = {
    name: 'Mercenary Captures',
    val: teamStats.stats.average.mercCaptures,
    format: formatStat('mercCaptures', teamStats.stats.average.mercCaptures, true),
  };
  stats.mercUptime = {
    name: 'Mercenary Uptime',
    val: teamStats.stats.average.mercUptime,
    format: formatSeconds(teamStats.stats.average.mercUptime),
  };
  stats.mercUptimePct = {
    name: 'Mercenary Uptime %',
    val: teamStats.stats.average.mercUptimePercent,
    format: formatStat('pct', teamStats.stats.average.mercUptimePercent),
  };

  stats.T1 = {
    name: 'Time at Level 1',
    val: teamStats.tierTimes.T1.average,
    format: formatSeconds(teamStats.tierTimes.T1.average),
  };
  stats.T2 = {
    name: 'Time at Level 4',
    val: teamStats.tierTimes.T2.average,
    format: formatSeconds(teamStats.tierTimes.T2.average),
  };
  stats.T3 = {
    name: 'Time at Level 7',
    val: teamStats.tierTimes.T3.average,
    format: formatSeconds(teamStats.tierTimes.T3.average),
  };
  stats.T4 = {
    name: 'Time at Level 10',
    val: teamStats.tierTimes.T4.average,
    format: formatSeconds(teamStats.tierTimes.T4.average),
  };
  stats.T5 = {
    name: 'Time at Level 13',
    val: teamStats.tierTimes.T5.average,
    format: formatSeconds(teamStats.tierTimes.T5.average),
  };
  stats.T6 = {
    name: 'Time at Level 16',
    val: teamStats.tierTimes.T6.average,
    format: formatSeconds(teamStats.tierTimes.T6.average),
  };

  stats.levelDiff = {
    name: 'Avg. Level Diff at End',
    val: teamStats.endOfGameLevels.combined.average,
    format: formatStat('', teamStats.endOfGameLevels.combined.average, true),
  };
  stats.levelDiffW = {
    name: 'Avg. Level Diff at End (win)',
    val: teamStats.endOfGameLevels.win.average,
    format: formatStat('', teamStats.endOfGameLevels.win.average, true),
  };
  stats.levelDiffL = {
    name: 'Avg. Level Diff at End (loss)',
    val: teamStats.endOfGameLevels.loss.average,
    format: formatStat('', teamStats.endOfGameLevels.loss.average, true),
  };

  stats.heroDamage = {
    name: 'Avg. Hero Damage',
    val: teamStats.stats.average.HeroDamage,
    format: formatStat('', teamStats.stats.average.HeroDamage, true),
  };
  stats.siegeDamage = {
    name: 'Avg. Siege Damage',
    val: teamStats.stats.average.SiegeDamage,
    format: formatStat('', teamStats.stats.average.SiegeDamage, true),
  };
  stats.creepDamage = {
    name: 'Avg. Creep Damage',
    val: teamStats.stats.average.CreepDamage,
    format: formatStat('', teamStats.stats.average.CreepDamage, true),
  };
  stats.minionDamage = {
    name: 'Avg. Minion Damage',
    val: teamStats.stats.average.MinionDamage,
    format: formatStat('', teamStats.stats.average.MinionDamage, true),
  };
  stats.healing = {
    name: 'Avg. Healing',
    val: teamStats.stats.average.Healing,
    format: formatStat('', teamStats.stats.average.Healing, true),
  };
  stats.selfHealing = {
    name: 'Avg. Self Healing',
    val: teamStats.stats.average.SelfHealing,
    format: formatStat('', teamStats.stats.average.SelfHealing, true),
  };
  stats.shields = {
    name: 'Avg. Shielding',
    val: teamStats.stats.average.ProtectionGivenToAllies,
    format: formatStat('', teamStats.stats.average.ProtectionGivenToAllies, true),
  };
  stats.damageTaken = {
    name: 'Avg. Damage Taken',
    val: teamStats.stats.average.DamageTaken,
    format: formatStat('', teamStats.stats.average.DamageTaken, true),
  };

  stats.tfHeroDamage = {
    name: 'Avg. Team Fight Hero Damage',
    val: teamStats.stats.average.TeamfightHeroDamage,
    format: formatStat('', teamStats.stats.average.TeamfightHeroDamage, true),
  };
  stats.tfDamageTaken = {
    name: 'Avg. Team Fight Damage Taken',
    val: teamStats.stats.average.TeamfightDamageTaken,
    format: formatStat('', teamStats.stats.average.TeamfightDamageTaken, true),
  };
  stats.tfHealing = {
    name: 'Avg. Team Fight Healing',
    val: teamStats.stats.average.TeamfightHealingDone,
    format: formatStat('', teamStats.stats.average.TeamfightHealingDone, true),
  };
  stats.cc = {
    name: 'Avg. CC Time',
    val: teamStats.stats.average.TimeCCdEnemyHeroes,
    format: formatSeconds(teamStats.stats.average.TimeCCdEnemyHeroes),
  };
  stats.root = {
    name: 'Avg. Root Time',
    val: teamStats.stats.average.TimeRootingEnemyHeroes,
    format: formatSeconds(teamStats.stats.average.TimeRootingEnemyHeroes),
  };
  stats.silence = {
    name: 'Avg. Silence Time',
    val: teamStats.stats.average.TimeSilencingEnemyHeroes,
    format: formatSeconds(teamStats.stats.average.TimeSilencingEnemyHeroes),
  };
  stats.stun = {
    name: 'Avg. Stun Time',
    val: teamStats.stats.average.TimeStunningEnemyHeroes,
    format: formatSeconds(teamStats.stats.average.TimeStunningEnemyHeroes),
  };

  stats.aces = {
    name: 'Aces',
    val: teamStats.stats.total.aces,
    format: formatStat('Aces', teamStats.stats.total.aces, true),
  };
  stats.wipes = {
    name: 'Wipes',
    val: teamStats.stats.total.wipes,
    format: formatStat('Wipes', teamStats.stats.total.wipes, true),
  };

  stats.timeWithHeroAdv = {
    name: 'Avg. Time w/ Hero Adv.',
    val: teamStats.stats.average.timeWithHeroAdv,
    format: formatSeconds(teamStats.stats.average.timeWithHeroAdv),
  };
  stats.pctWithHeroAdv = {
    name: 'Avg. % of Game w/ Hero Adv.',
    val: teamStats.stats.average.pctWithHeroAdv,
    format: formatStat('pctWithHeroAdv', teamStats.stats.average.pctWithHeroAdv, true),
  };
  stats.avgHeroesAlive = {
    name: 'Avg. Heroes Alive',
    val: teamStats.stats.average.avgHeroesAlive,
    format: formatStat('avgHeroesAlive', teamStats.stats.average.avgHeroesAlive, true),
  };

  stats.pct0Hero = {
    name: 'Avg. % 0 Heroes Alive',
    val: teamStats.stats.average.pctWith0HeroesAlive,
    format: formatStat('pctWith0HeroesAlive', teamStats.stats.average.pctWith0HeroesAlive, true),
  };
  stats.pct1Hero = {
    name: 'Avg. % 1 Hero Alive',
    val: teamStats.stats.average.pctWith1HeroesAlive,
    format: formatStat('pctWith1HeroesAlive', teamStats.stats.average.pctWith1HeroesAlive, true),
  };
  stats.pct2Hero = {
    name: 'Avg. % 2 Heroes Alive',
    val: teamStats.stats.average.pctWith2HeroesAlive,
    format: formatStat('pctWith2HeroesAlive', teamStats.stats.average.pctWith2HeroesAlive, true),
  };
  stats.pct3Hero = {
    name: 'Avg. % 3 Heroes Alive',
    val: teamStats.stats.average.pctWith3HeroesAlive,
    format: formatStat('pctWith3HeroesAlive', teamStats.stats.average.pctWith3HeroesAlive, true),
  };
  stats.pct4Hero = {
    name: 'Avg. % 4 Heroes Alive',
    val: teamStats.stats.average.pctWith4HeroesAlive,
    format: formatStat('pctWith4HeroesAlive', teamStats.stats.average.pctWith4HeroesAlive, true),
  };
  stats.pct5Hero = {
    name: 'Avg. % 5 Heroes Alive',
    val: teamStats.stats.average.pctWith5HeroesAlive,
    format: formatStat('pctWith5HeroesAlive', teamStats.stats.average.pctWith5HeroesAlive, true),
  };

  return stats;
}

function getTeamHeroCompareStats(t, totalMatches) {
  let team = {};
  team.pct = t.wins / t.games;
  team.record = `${formatStat('pct', team.pct)} (${t.wins} - ${t.games - t.wins})`;
  team.pickPct = t.games / totalMatches;
  team.formatPickPct = `${formatStat('pct', team.pickPct)} (${t.games}/${totalMatches})`;
  team.r1Pct = t.picks.round1.count / totalMatches;
  team.r2Pct = t.picks.round2.count / totalMatches;
  team.r3Pct = t.picks.round3.count / totalMatches;
  team.banPct = t.bans / totalMatches;
  team.formatBanPct = `${formatStat('pct', team.banPct)} (${t.bans} / ${totalMatches})`;
  team.b1Pct = t.first / totalMatches;
  team.b2Pct = t.second / totalMatches;

  return team;
}

function toggleTeamRosterMode(elem) {
  $('#team-roster-stats .top.attached.menu .item').removeClass('active');
  $(elem).addClass('active');
  loadTeamRoster(teamPlayerStats);
}

function loadTeamRoster(playerStats) {
  $('#team-roster-stats tbody').html('');
  let mode = $('#team-roster-stats .top.attached.menu .active.item').attr('data-mode');

  if (currentTeam === undefined) return;

  // only show non-aliased players
  for (let p in currentTeam.resolvedPlayers) {
    let id = currentTeam.resolvedPlayers[p]._id;

    if (id in playerStats) {
      let player = playerStats[id];

      let context = {};
      context.name = player.name;
      context.id = id;
      context.value = player[mode];
      context.value.totalKDA = player[mode].KDA;

      if (mode === 'total' || mode === 'averages') context.value.totalKDA = player.totalKDA;

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
        heroes.push({ hero: h, games: player.heroes[h] });
      }

      heroes.sort((a, b) => b.games - a.games);

      for (let i = 0; i < Math.min(heroes.length, 3); i++) {
        // max 3 heroes, min heroes.length
        const img = `<img src="assets/heroes-talents/images/heroes/${Heroes.heroIcon(heroes[i].hero)}">`;
        $('#team-roster-stats .top-three[player-id="' + id + '"] .images').append(img);
      }

      // nickname replacement
      DB.getPlayer(id, function (err, doc) {
        // replace the recently added row
        if (doc[0].nickname) {
          $('#team-roster-stats .player-name[playerID="' + id + '"]').text(doc[0].nickname);
        }
      });
    }
  }

  // second iteration so players with no games end up at end
  for (let p in currentTeam.resolvedPlayers) {
    let player = currentTeam.resolvedPlayers[p];
    let id = player._id;

    if ('aliasedTo' in player && player.aliasedTo !== '') {
      // player is an alias that was added to the team (either was aliased after add
      // or some internal thing happened) so skip
      continue;
    }

    if (!(id in playerStats)) {
      let context = {
        name: player.name,
        id: player._id,
      };

      if (player.nickname && player.nickname !== '') {
        context.name = player.nickname;
      }

      $('#team-roster-stats tbody').append(teamRosterRowTemplate(context));

      $('#team-roster-stats .dropdown.button[player-id="' + player._id + '"]').dropdown({
        onChange: function (value, text, $elem) {
          handleTeamPlayerCallback(value, $elem.attr('player-id'), $elem.attr('player-name'));
        },
      });
    }
  }

  $('#team-roster-stats .dropdown.button').dropdown({
    onChange: function (value, text, $elem) {
      handleTeamPlayerCallback(value, $elem.attr('player-id'), $elem.attr('player-name'));
    },
  });

  $('#team-roster-stats .player-name').click(function () {
    showPlayerProfile($(this).attr('playerID'));
  });
}

// handles individual player action stuff
function handleTeamPlayerCallback(action, id, name) {
  if (action === 'remove') {
    $('#team-confirm-action-user .header').text('Confirm Delete Player');
    $('#team-confirm-action-user .action').text('remove ' + name + ' from ' + currentTeam.name);

    $('#team-confirm-action-user')
      .modal({
        onApprove: function () {
          DB.removePlayerFromTeam(currentTeam._id, id, function () {
            updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
          });
        },
      })
      .modal('show');
  } else if (action === 'profile') {
    // load and then immediately switch to player profile
    showPlayerProfile(id);
  }
}

function addPlayerToTeam() {
  // brings up a modal to add players to the currently selected team
  if (currentTeam) {
    $('#team-add-user .team-name').text(currentTeam.name);

    $('#team-add-user')
      .modal({
        onApprove: function () {
          let id = $('#team-add-player-menu').dropdown('get value');
          DB.addPlayerToTeam(currentTeam._id, id, function () {
            updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
          });
        },
      })
      .modal('show');
  }
}

function handleTeamMenuCallback(action) {
  if (action === 'new') {
    $('#team-text-input .header').text('Create New Team');
    $('#team-text-input .input .label').text('Team Name');
    $('#team-text-input input').val('');

    $('#team-text-input')
      .modal({
        onApprove: function () {
          let name = $('#team-text-input input').val();
          DB.addTeam([], name, function () {
            populateTeamMenu($('.team-menu'));
            $('#team-set-team').dropdown('refresh');
          });
        },
      })
      .modal('show');
  } else if (action === 'rename') {
    if (currentTeam) {
      $('#team-text-input .header').text('Rename ' + currentTeam.name);
      $('#team-text-input .input .label').text('Team Name');
      $('#team-text-input input').val('');

      $('#team-text-input')
        .modal({
          onApprove: function () {
            let name = $('#team-text-input input').val();
            DB.changeTeamName(currentTeam._id, name, function () {
              populateTeamMenu($('.team-menu'));
              $('#team-set-team').dropdown('refresh');
              $('#teams-page-header .team-name').text(name);
              $('#team-set-team').dropdown('set text', name);
            });
          },
        })
        .modal('show');
    }
  } else if (action === 'delete') {
    $('#team-confirm-action-user .header').text('Delete ' + currentTeam.name);
    $('#team-confirm-action-user .action').text('delete the team ' + currentTeam.name);

    $('#team-confirm-action-user')
      .modal({
        onApprove: function () {
          DB.deleteTeam(currentTeam._id, function () {
            currentTeam = null;
            populateTeamMenu($('.team-menu'));
            $('#team-set-team').dropdown('refresh');
            $('#teams-page-header .team-name').text('');
            $('#team-set-team').dropdown('set text', '');
          });
        },
      })
      .modal('show');
  } else if (action === 'print-team') {
    dialog.showSaveDialog(
      {
        title: 'Print Team Report',
        filters: [{ name: 'pdf', extensions: ['pdf'] }],
      },
      function (filename) {
        if (filename) {
          printTeamDetail(filename, null);
        }
      },
    );
  } else if (action === 'print-sections') {
    $('#team-print-sections')
      .modal({
        onApprove: function () {
          dialog.showSaveDialog(
            {
              title: 'Print Team Report',
              filters: [{ name: 'pdf', extensions: ['pdf'] }],
            },
            function (filename) {
              if (filename) {
                let sections = $('#team-print-sections .ui.dropdown').dropdown('get value').split(',');
                printTeamDetail(filename, sections);
              }
            },
          );
        },
        closable: false,
      })
      .modal('show');
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
  if (!teamTeamStats) return;

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
    matchLength: 0,
  };
  teamAvgTracker = { target: 0, current: 0, actual: 0 };

  let query = {};
  if (collectionID) query.collection = collectionID;

  DB.reduceTeams(query, initProcessTeamAverages, processTeamAverages, displayTeamAverages);
}

function initProcessTeamAverages(teams) {
  teamAvgTracker.target = teams.length;
  teamTables.compareVsAvg.clear();
}

function processTeamAverages(err, matches, team) {
  teamAvgTracker.current += 1;

  if (matches.length === 0) {
    return;
  }

  teamAvgTracker.actual += 1;
  let teamStats = summarizeTeamData(team, matches, Heroes);

  for (let s in teamStats.stats.total) {
    if (!(s in teamAvgData)) teamAvgData[s] = 0;

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
    if (!(t in teamAvgData)) teamAvgData[t] = 0;

    teamAvgData[t] += teamStats.tierTimes[t].average;
  }

  // not sure about structures really, that's kinda just a fun fact
}

function displayTeamAverages() {
  // divide everything by number of teams (except games I guess)
  for (let s in teamAvgData) {
    if (s === 'games') continue;

    teamAvgData[s] /= teamAvgTracker.actual;
  }

  let teamCmpTableData = [];
  for (let s in teamAvgData) {
    let context = {};

    // i kind of hate the sheer number of special cases that exist here
    if (s === 'games' || s === 'wins') {
      continue;
    } else if (s === 'takedowns') {
      context.statName = 'Takedowns';
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatStat(s, context.cmpDataSort, true);
      context.pDataSort = teamTeamStats.takedowns.average;
      context.pData = formatStat(s, context.pDataSort, true);
    } else if (s === 'deaths') {
      context.statName = 'Deaths';
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatStat(s, context.cmpDataSort, true);
      context.pDataSort = teamTeamStats.deaths.average;
      context.pData = formatStat(s, context.pDataSort, true);
    } else if (s === 'matchLength') {
      context.statName = 'Match Length';
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatSeconds(context.cmpDataSort);
      context.pDataSort = teamTeamStats.matchLength.average;
      context.pData = formatSeconds(context.pDataSort);
    } else if (s === 'T1' || s === 'T2' || s === 'T3' || s === 'T4' || s === 'T5' || s === 'T6') {
      context.statName = DetailStatString[s];
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatSeconds(context.cmpDataSort);
      context.pDataSort = teamTeamStats.tierTimes[s].average;
      context.pData = formatSeconds(context.pDataSort);
    } else {
      context.statName = DetailStatString[s];
      context.cmpDataSort = teamAvgData[s];
      context.cmpData = formatStat(s, context.cmpDataSort, true);
      context.pDataSort = teamTeamStats.stats.average[s];
      context.pData = formatStat(s, context.pDataSort, true);
    }

    if (context.cmpDataSort === 0) context.pctDiff = 0;
    else context.pctDiff = (context.pDataSort - context.cmpDataSort) / context.cmpDataSort;

    teamCmpTableData.push(context);
  }
  teamTables.compareVsAvg.setData(teamCmpTableData);

  $('#team-compare-collection').removeClass('loading disabled');
}

function layoutTeamDetailPrint(sections) {
  let sects = sections;
  if (!sects) {
    sects = ['stats', 'summary', 'draft', 'maps', 'against', 'roster', 'compare'];
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
    copyFloatingTable($('#team-map-summary'), getPrintPage('maps'));
  }

  if (sects.indexOf('summary') !== -1) {
    addPrintPage('summary');
    addPrintSubHeader('Hero Summary', 'summary');
    copyFloatingTable($('#team-hero-summary-table'), getPrintPage('summary'));
  }

  if (sects.indexOf('draft') !== -1) {
    addPrintPage('bans');
    addPrintSubHeader('Ban Priority', 'bans');
    copyFloatingTable($('#team-ban-summary'), getPrintPage('bans'));
    addPrintSubHeader('Pick Detail', 'bans');
    copyFloatingTable($('#team-pick-detail'), getPrintPage('bans'));
  }

  if (sects.indexOf('against') !== -1) {
    addPrintPage('against');
    addPrintSubHeader('Win Rate Against Hero', 'against');
    copyFloatingTable($('#team-against-summary'), getPrintPage('against'));
  }

  if (sects.indexOf('roster') !== -1) {
    addPrintPage('roster');
    addPrintSubHeader('Roster Summary', 'roster');
    copyFloatingTable($('#team-roster-stats .floatThead-wrapper'), getPrintPage('roster'));
  }

  if (sects.indexOf('compare') !== -1) {
    addPrintPage('compare');
    addPrintSubHeader(
      'Comparison to Collection Average: ' + $('#team-compare-collection').dropdown('get text'),
      'compare',
    );
    copyFloatingTable($('#team-compare-table'), getPrintPage('compare'));
  }
}

function printTeamDetail(filename, sections) {
  layoutTeamDetailPrint(sections);
  renderAndPrint(filename, 'Letter', true);
}
