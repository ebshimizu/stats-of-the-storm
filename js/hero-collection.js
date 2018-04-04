var heroCollectionSummaryRowTemplate;
var heroCollectionPickRowTemplate;
var heroCollectionHeroWinRowTemplate;

// by default this screen containrs games played in official modes with bans
var heroCollectionHeroDataFilter;
var heroCollectionMapDataFilter;
var heroCollectionHeroMatchThresh = 0;
var heroDataWinCache;

function initHeroCollectionPage() {
  // by default this screen containrs games played in official modes with bans
  heroCollectionHeroDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }
  heroCollectionMapDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }  

  heroCollectionSummaryRowTemplate = Handlebars.compile(getTemplate('hero-collection', '#hero-collection-hero-summary-row-template').
    find('.hero-collection-hero-summary-row')[0].outerHTML);
  heroCollectionPickRowTemplate = Handlebars.compile(getTemplate('hero-collection', '#hero-collection-hero-pick-row-template').
    find('.hero-collection-hero-summary-row')[0].outerHTML);
  heroCollectionHeroWinRowTemplate = Handlebars.compile(getTemplate('hero-collection', '#hero-collection-detail-hero-win-row').
    find('tr')[0].outerHTML);

  $('#hero-collection-summary table').tablesort();
  $('#hero-collection-picks table').tablesort();
  $('#hero-collection-detail-map-summary table').tablesort();
  $('#hero-collection-detail-with-summary table').tablesort();
  $('#hero-collection-detail-against-summary table').tablesort();
  $('#hero-collection-award-summary table').tablesort();
  $('#hero-collection-comps table').tablesort();
  $('#hero-collection-detail-hero-talent .talent-build table').tablesort();
  $('#hero-collection-detail-hero-talent .talent-build table').on('tablesort:complete', function(event, tablesort) {
    $('#hero-collection-detail-hero-talent .talent-build img').popup();
  });
  $('#hero-collection-body table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#hero-collection-summary table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });
  $('#hero-collection-picks table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  $('#hero-collection-submenu .item').tab();
  $('#hero-collection-submenu .item').click(function() {
    $('#hero-collection-body table').floatThead('reflow');
  });
  $('#hero-collection-detail-hero-talent .item').click(function() {
    $('#hero-collection-body table').floatThead('reflow');
  });

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'hero-collection-filter');
  
  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  $('#hero-collection-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="hero-collection-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  // initialize the filter
  for (let m in heroCollectionHeroDataFilter.mode.$in) {
    filterWidget.find('.filter-widget-mode').dropdown('set selected', heroCollectionHeroDataFilter.mode.$in[m]);
  }
  bindFilterButton(filterWidget, updateCollectionFilter);
  bindFilterResetButton(filterWidget, resetCollectionFilter);

  $('#hero-collection-hero-select-menu').dropdown({
    onChange: loadHeroCollectionData
  });
  addHeroMenuOptions($('#hero-collection-hero-select-menu'));
  $('#hero-collection-hero-select-menu').dropdown('refresh');

  $('#hero-collection-body .five.ui.buttons .button').click(function() {
    toggleHeroCollectionType('#hero-collection-body', $(this), '#hero-collection-body');
  });

  $('#hero-collection-detail-hero-talent .menu .item').tab();

  loadOverallHeroCollectionData();

  // hero threshold
  $('#hero-collection-hero-thresh input').popup({
    on: 'focus'
  });
  $('#hero-collection-hero-thresh input').val(0);
  $('#hero-collection-hero-thresh input').blur(loadOverallHeroCollectionData);

  // comparison dropdowns
  $('#hero-collection-detail-with-summary .cache-collections.dropdown').dropdown({
    fullTextSearch: true,
    onChange: function(value, text, $elem) {
      updateHeroCollectionVsStats(value, $elem, 'with', $('#hero-collection-detail-with-summary'));
    }
  });

  $('#hero-collection-detail-against-summary .cache-collections.dropdown').dropdown({
    fullTextSearch: true,
    onChange: function(value, text, $elem) {
      updateHeroCollectionVsStats(value, $elem, 'against', $('#hero-collection-detail-against-summary'));
    }
  });

  $('#hero-collection-file-menu').dropdown({
    action: 'hide',
    onChange: handleHeroStatsFileAction
  });

  $('#hero-collection-print-sections .ui.dropdown').dropdown();
}

function heroCollectionShowSection() {
  $('#hero-collection-body table').floatThead('reflow');
  $('#hero-collection-file-menu').removeClass('is-hidden');
}

function resetHeroCollection() {
  resetCollectionFilter();
}

function updateCollectionFilter(map, hero) {
  heroCollectionHeroDataFilter = hero;
  heroCollectionMapDataFilter = map;

  loadOverallHeroCollectionData();
  loadHeroCollectionData($('#hero-collection-hero-select-menu').dropdown('get value'), null, null);
}

function resetCollectionFilter() {
  heroCollectionHeroDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }
  heroCollectionMapDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }

  let filterWidget = $('.filter-popup-widget[widget-name="hero-collection-filter"]');
  for (let m in heroCollectionHeroDataFilter.mode.$in) {
    filterWidget.find('.filter-widget-mode').dropdown('set selected', heroCollectionHeroDataFilter.mode.$in[m]);
  }

  updateCollectionFilter(heroCollectionMapDataFilter, heroCollectionHeroDataFilter);
}

function loadOverallHeroCollectionData() {
  heroCollectionHeroMatchThresh = parseInt($('#hero-collection-hero-thresh input').val());

  // the summary only loads the hero pick/win details which are easily extracted
  // from the match data
  // check the hero details section for all that extra stuff.
  DB.getMatches(heroCollectionMapDataFilter, function(err, docs) {
    let matchData = DB.summarizeMatchData(docs, Heroes);
    let overallStats = matchData.data;

    $('#hero-collection-summary tbody').html('');
    $('#hero-collection-picks tbody').html('');
    let roleData = {};
    let totalCount = 0;
    let totalBan = 0;

    for (let h in overallStats) {
      if (h === 'totalMatches' || h === 'totalBans')
        continue;

      let hero = overallStats[h];
      let role = Heroes.role(h);
      
      if (!(role in roleData)) {
        roleData[role] = { games: 0, bans: 0, wins: 0, count: 0 };
      }

      if (hero.games > 0) {
        roleData[role].count += 1;
        totalCount += 1;
      }

      if (hero.bans.total > 0) {
        roleData[role].bans += 1;
        totalBan += 1;
      }

      roleData[role].games += hero.games;
      roleData[role].wins += hero.wins;

      if (hero.involved < heroCollectionHeroMatchThresh)
        continue;

      let context = {};
      context.heroName = h;
      context.heroImg = Heroes.heroIcon(h);
      context.winPercent = hero.games === 0 ? 0 : hero.wins / hero.games;
      context.formatWinPercent = formatStat('pct', context.winPercent);
      context.banPercent = hero.bans.total / overallStats.totalMatches;
      context.formatBanPercent = formatStat('pct', context.banPercent);
      context.popPercent = hero.involved / overallStats.totalMatches;
      context.formatPopPercent = formatStat('pct', context.popPercent);
      context.games = hero.games;
      context.win = hero.wins;
      context.loss = hero.games - hero.wins;
      context.bans = hero.bans.total;
      context.heroRole = Heroes.role(h);

      $('#hero-collection-summary tbody').append(heroCollectionSummaryRowTemplate(context));

      let banContext = {};
      banContext.format = {};
      banContext.games = hero.games;
      banContext.heroName = h;
      banContext.heroImg = context.heroImg;
      banContext.heroRole = context.heroRole;
      banContext.winPercent = context.winPercent;
      banContext.format.winPercent = context.formatWinPercent;
      banContext.banPercent = context.banPercent;
      banContext.format.banPercent = context.formatBanPercent;
      banContext.bans = hero.bans;
      banContext.firstBanPercent = hero.bans.first / overallStats.totalMatches;
      banContext.format.firstBanPercent = formatStat('pct', banContext.firstBanPercent);
      banContext.secondBanPercent = hero.bans.second / overallStats.totalMatches;
      banContext.format.secondBanPercent = formatStat('pct', banContext.secondBanPercent);
      banContext.picks = hero.picks;

      for (let p in banContext.picks) {
        banContext.picks[p].pct = banContext.picks[p].count / overallStats.totalMatches;
        banContext.picks[p].formatPct = formatStat('pct', banContext.picks[p].pct);
      }

      $('#hero-collection-picks tbody').append(heroCollectionPickRowTemplate(banContext));
    }

    // roles
    for (let r of Heroes.roles) {
      let selector = $('#hero-collection-pool div[role="' + r + '"]');
  
      if (!(r in roleData)) {
        selector.find('div[name="pool"] .value').text('0 / ' + Heroes.heroRoleCount(r));
        selector.find('div[name="games"] .value').text('0');
        selector.find('div[name="ban"] .value').text('0');
      }
      else {
        selector.find('div[name="pool"] .value').text(roleData[r].count + ' / ' + Heroes.heroRoleCount(r));
        selector.find('div[name="games"] .value').text(roleData[r].games);
        selector.find('div[name="ban"] .value').text(roleData[r].bans + ' / ' + Heroes.heroRoleCount(r));
      }
    }

    $('#hero-collection-pool div[role="all"] div[name="pool"] .value').text(totalCount + ' / ' + Heroes.heroCount);
    $('#hero-collection-pool div[role="all"] div[name="ban"] .value').text(totalBan + ' / ' + Heroes.heroCount);

    $('#hero-collection-pool tbody').html('');
    $('#hero-collection-comps tbody').html('');

    // not played
    let names = Heroes.allHeroNames.sort();
    for (let hero of names) {
      let elem = '<tr><td><h3 class="ui image inverted header">'
      elem += '<img src="assets/heroes-talents/images/heroes/' + Heroes.heroIcon(hero) + '" class="ui rounded image">';
      elem += '<div class="content">' + hero + '</div></h3></td></tr>';

      if (!(hero in overallStats)) {
        $('#hero-collection-zero-participation tbody').append(elem);
        $('#hero-collection-zero-games tbody').append(elem);
        $('#hero-collection-zero-bans tbody').append(elem);
      }
      else {
        if (overallStats[hero].games === 0)
          $('#hero-collection-zero-games tbody').append(elem);
        if (overallStats[hero].bans.total === 0)
          $('#hero-collection-zero-bans tbody').append(elem);
      }
    }

    // comps
    for (let key in matchData.compositions) {
      let comp = matchData.compositions[key];
      let row = '<tr><td class="center aligned" data-sort-value="' + key + '">' + getCompositionElement(comp.roles) + '</td>';
      row += '<td class="center aligned" data-sort-value="' + (comp.wins / comp.games) + '">' + formatStat('pct', comp.wins / comp.games) + '</td>';
      row += '<td class="center aligned" data-sort-value="' + (comp.games / (overallStats.totalMatches * 2)) + '">' + formatStat('pct', comp.games / (overallStats.totalMatches * 2)) + '</td>';
      row += '<td class="center aligned" data-sort-value="' + comp.wins + '">' + comp.wins + '</td>';
      row += '<td class="center aligned" data-sort-value="' + (comp.games - comp.wins) + '">' + (comp.games - comp.wins) + '</td>';
      row += '<td class="center aligned" data-sort-value="' + comp.games + '">' + comp.games + '</td></tr>';

      $('#hero-collection-comps tbody').append(row);
    }

    $('#hero-collection-pool table').floatThead('reflow');
    $('#hero-collection-comps table').floatThead('reflow');
    $('#hero-collection-page-content th').removeClass('sorted ascending descending');
  })
}

function toggleHeroCollectionType(tableID, active, container) {
  let type = active.text();
  let hide = false;
  let elem = $(container).find('.button.' + type);

  if (type === "Assassin") {
    if (active.hasClass('red')) {
      hide = true;
      elem.removeClass('red');
    }
    else {
      elem.addClass('red');
    }
  }
  if (type === "Warrior") {
    if (active.hasClass('blue')) {
      hide = true;
      elem.removeClass('blue');
    }
    else {
      elem.addClass('blue');
    }
  }
  if (type === "Support") {
    if (active.hasClass('teal')) {
      hide = true;
      elem.removeClass('teal');
    }
    else {
      elem.addClass('teal');
    }
  }
  if (type === "Specialist") {
    if (active.hasClass('violet')) {
      hide = true;
      elem.removeClass('violet');
    }
    else {
      elem.addClass('violet');
    }
  }
  if (type === "Multiclass") {
    if (active.hasClass('purple')) {
      hide = true;
      elem.removeClass('purple');
    }
    else {
      elem.addClass('purple');
    }
  }

  if (hide) {
    $(tableID + ' table').find('.' + type).addClass('is-hidden');
  }
  else {
    $(tableID + ' table').find('.' + type).removeClass('is-hidden');
  }
}

// many of the functions here are borrowed from player.js
function loadHeroCollectionData(value, text, $elem) {
  heroCollectionHeroMatchThresh = parseInt($('#hero-collection-hero-thresh input').val());
  let query = Object.assign({}, heroCollectionHeroDataFilter);
  query.hero = value;
  DB.getHeroData(query, function(err, docs) {
    let stats = DB.summarizeHeroData(docs);
    heroDataWinCache = { with: stats.withHero, against: stats.againstHero };

    updateHeroTitle($('#hero-collection-hero-header'), value);

    // talents
    renderHeroTalentsTo(query.hero, $('#hero-collection-detail-hero-talent'), docs);

    // map stats
    renderMapStatsTo($('#hero-collection-detail-map-summary'), stats);

    // vs stats
    let val = $('#hero-collection-detail-with-summary .cache-collections').dropdown('get value');
    updateHeroCollectionVsStats(val, $('#hero-collection-detail-with-summary .cache-collections .item[data-value="' + val + '"]'), 'with', $('#hero-collection-detail-with-summary'));;
    
    val = $('#hero-collection-detail-against-summary .cache-collections').dropdown('get value');
    updateHeroCollectionVsStats(val, $('#hero-collection-detail-against-summary .cache-collections .item[data-value="' + val + '"]'), 'against', $('#hero-collection-detail-against-summary'));

    renderAwardsTo($('#hero-collection-award-summary'), stats);

    // these are annoying
    $('#hero-collection-detail-misc-summary .statistic[name="overallWin"] .value').text(formatStat('pct', stats.wins / stats.games));
    $('#hero-collection-detail-misc-summary .statistic[name="overallGames"] .value').text(stats.games);
    $('#hero-collection-detail-misc-summary .statistic[name="overallTD"] .value').text(formatStat('overallTD', stats.totalTD / stats.games), true);
    $('#hero-collection-detail-misc-summary .statistic[name="overallDeaths"] .value').text(formatStat('overallDeaths', stats.totalDeaths / stats.games), true);
    $('#hero-collection-detail-misc-summary .statistic[name="overallKDA"] .value').text(formatStat('KDA', stats.totalTD / Math.max(stats.totalDeaths, 1)));
    $('#hero-collection-detail-misc-summary .statistic[name="overallMVP"] .value').text(formatStat('pct', stats.totalMVP / Math.max(stats.games, 1)));
    $('#hero-collection-detail-misc-summary .statistic[name="overallAward"] .value').text(formatStat('pct', stats.totalAward / Math.max(stats.games)));

    $('#hero-collection-page-content table').floatThead('reflow');
    $('#hero-collection-page-content th').removeClass('sorted ascending descending');
  });
}

function updateHeroCollectionVsStats(value, $elem, key, container) {
  if (heroDataWinCache === undefined)
    return;

  container.find('.dropdown.cache-collections').addClass('loading disabled');

  let cid = value === 'all' ? null : value;

  if ($elem.attr('data-type') === 'external')
    DB.getExternalCacheCollectionHeroStats(cid, function(cache) {
      renderHeroCollectionVsStatsTo(container, heroDataWinCache[key], heroCollectionHeroMatchThresh, cache);
      container.find('.dropdown.cache-collections').removeClass('loading disabled');
    });
  else
    DB.getCachedCollectionHeroStats(cid, function(cache) {
      renderHeroCollectionVsStatsTo(container, heroDataWinCache[key], heroCollectionHeroMatchThresh, cache);
      container.find('.dropdown.cache-collections').removeClass('loading disabled');
    });
}

function renderHeroCollectionVsStatsTo(container, stats, threshold, avg) {
  if (threshold === undefined)
    threshold = 0;

  container.find('tbody').html('');

  for (let h in stats) {
    let context = stats[h];

    if ('defeated' in context) {
      context.winPercent = context.defeated / context.games;
    }
    else {
      context.winPercent = context.wins / context.games;
    }
    context.formatWinPercent = formatStat('pct', context.winPercent);
    context.heroImg = Heroes.heroIcon(context.name);

    if (h in avg.heroData.heroes) {
      context.avgDelta = context.winPercent - (avg.heroData.heroes[h].wins / avg.heroData.heroes[h].games);
    }
    else {
      context.avgDelta = 0;
    }

    context.formatAvgDelta = (context.avgDelta > 0 ? '+' : '') + formatStat('pct', context.avgDelta);
    context.deltaClass = (context.avgDelta > 0) ? 'plus' : ((context.avgDelta < 0) ? 'minus' : '');

    if (context.games >= threshold)
      container.find('tbody').append(heroCollectionHeroWinRowTemplate(context));
  }
}

function getCompositionElement(roles) {
  let elem = '<div class="ui five column grid comp-grid">';
  
  for (let r of roles) {
    elem += '<div class="column">';
    elem += '<div class="ui mini image">';
    elem += '<div class="ui small ' + RoleColorClass[r] + ' ribbon label">' + r + '</div>';

    if (r === 'Multiclass') {
      elem += '<img src="assets/images/role_specialist.png">'
    }
    else {
      elem += '<img src="assets/images/role_' + r.toLowerCase() + '.png">';
    }
    elem += '</div></div>'
  }

  elem += '</div>';
  return elem;
}

function layoutHeroCollectionPrint(sections) {
  let sects = sections;
  if (!sects) {
    sects = ['general', 'draft', 'comps', 'pool'];
  }

  // prints basically just copy DOM elements into the print container
  // then show the print container, and then hide it
  clearPrintLayout();
  addPrintHeader('Hero Summary');
  addPrintDate();

  // copy the main table
  if (sects.indexOf('general') !== -1) {
    addPrintSubHeader('General Stats');
    copyFloatingTable($('#hero-collection-summary .floatThead-wrapper'));
  }

  // picks
  if (sects.indexOf('draft') !== -1) {
    addPrintSubHeader('Draft Stats');
    copyFloatingTable($('#hero-collection-picks .floatThead-wrapper'));
  }

  // compositions
  if (sects.indexOf('comps') !== -1) {
    addPrintSubHeader('Composition Stats');
    copyFloatingTable($('#hero-collection-comps .floatThead-wrapper'));
  }

  // hero pool is... more complicated
  if (sects.indexOf('pool') !== -1) {
    addPrintSubHeader('Hero Pool Stats');
    $('#print-window .contents').append('<div class="hero-pool ui segment"></div>');
    $('#print-window .contents .hero-pool.segment').append($('#hero-collection-pool .six.column.grid').clone());

    $('#print-window .contents').append('<div class="ui segment draft-tables"><div class="ui three column grid"></div></div>');
    $('#print-window .draft-tables .grid').append('<div class="ui column grid-cell-1"><h4 class="ui header">Zero Participation</div></div>');
    $('#print-window .draft-tables .grid').append('<div class="ui column grid-cell-2"><h4 class="ui header">Zero Games</div></div>');
    $('#print-window .draft-tables .grid').append('<div class="ui column grid-cell-3"><h4 class="ui header">Zero Bans</div></div>');
    copyFloatingTable($('#hero-collection-zero-participation .floatThead-wrapper'), $('#print-window .grid-cell-1'));
    copyFloatingTable($('#hero-collection-zero-games .floatThead-wrapper'), $('#print-window .grid-cell-2'));
    copyFloatingTable($('#hero-collection-zero-bans .floatThead-wrapper'), $('#print-window .grid-cell-3'));
  }

  $('#print-window').removeClass('is-hidden');
}

function layoutHeroCollectionDetailPrint() {
  clearPrintLayout();
  addPrintHeader('Overall Hero Details');
  addPrintDate();

  $('#print-window .contents').append($('#hero-collection-hero-header h2.header').clone());
  
  addPrintSubHeader('Overall Stats');
  $('#print-window .contents').append($('#hero-collection-detail-misc-summary .statistics').clone());
  $('#print-window').find('.statistics').removeClass('horizontal');

  addPrintSubHeader('Talents');
  copyFloatingTable($('#hero-collection-detail-hero-talent .talent-pick .floatThead-wrapper'));

  addPrintSubHeader('Builds');
  copyFloatingTable($('#hero-collection-detail-hero-talent .talent-build .floatThead-wrapper'));

  addPrintSubHeader('Maps');
  copyFloatingTable($('#hero-collection-detail-map-summary .floatThead-wrapper'));

  addPrintSubHeader('Win Rate With Hero');
  copyFloatingTable($('#hero-collection-detail-with-summary .floatThead-wrapper'));

  addPrintSubHeader('Win Rate Against Hero');
  copyFloatingTable($('#hero-collection-detail-against-summary .floatThead-wrapper'));

  addPrintSubHeader('Awards');
  copyFloatingTable($('#hero-collection-award-summary .floatThead-wrapper'));

  $('#print-window').removeClass('is-hidden');
}

function printHeroCollection(sections, filename) {
  layoutHeroCollectionPrint(sections);
  renderAndPrint(filename, 'Legal', true);
}

function printHeroCollectionHero(filename) {
  layoutHeroCollectionDetailPrint();
  renderAndPrint(filename);
}

function handleHeroStatsFileAction(value, text, $elem) {
  if (value === 'print-all') {
    dialog.showSaveDialog({
      title: 'Print Hero Stats',
      filters: [{name: 'pdf', extensions: ['pdf']}]
    }, function(filename) {
      if (filename) {
        printHeroCollection(null, filename);
      }
    });
  }
  else if (value === 'print-sections') {
    $('#hero-collection-print-sections').modal({
      onApprove: function() {
        dialog.showSaveDialog({
          title: 'Print Hero Stats',
          filters: [{name: 'pdf', extensions: ['pdf']}]
        }, function(filename) {
          if (filename) {
            let sections = $('#hero-collection-print-sections .ui.dropdown').dropdown('get value').split(',');
            printHeroCollection(sections, filename);
          }
        });
      },
      closable: false
    }).modal('show');
  }
  else if (value === 'print-hero') {
    dialog.showSaveDialog({
      title: 'Print Hero Stats',
      filters: [{name: 'pdf', extensions: ['pdf']}]
    }, function(filename) {
      if (filename) {
        printHeroCollectionHero(filename);
      }
    });
  }
}