var heroCollectionSummaryRowTemplate;
var heroCollectionPickRowTemplate;

// by default this screen containrs games played in official modes with bans
var heroCollectionHeroDataFilter;
var heroCollectionMapDataFilter;
var heroCollectionHeroMatchThresh = 0;
var currentHeroCollectionHero = '';
var heroDataWinCache;

var heroCollectionTables = {
  maps: null,
  winsWith: null,
  winsAgainst: null,
  awards: null,
  players: null,
};

function initHeroCollectionPage(tags) {
  // by default this screen containrs games played in official modes with bans
  heroCollectionHeroDataFilter = {
    mode: {
      $in: [
        ReplayTypes.GameMode.UnrankedDraft,
        ReplayTypes.GameMode.HeroLeague,
        ReplayTypes.GameMode.TeamLeague,
        ReplayTypes.GameMode.Custom,
      ],
    },
  };
  heroCollectionMapDataFilter = {
    mode: {
      $in: [
        ReplayTypes.GameMode.UnrankedDraft,
        ReplayTypes.GameMode.HeroLeague,
        ReplayTypes.GameMode.TeamLeague,
        ReplayTypes.GameMode.Custom,
      ],
    },
  };

  heroCollectionTables.maps = new Table('#hero-collection-detail-map-summary table', TableDefs.MapFormat);
  heroCollectionTables.awards = new Table('#hero-collection-award-summary table', TableDefs.AwardFormat);
  heroCollectionTables.winsWith = new Table(
    '#hero-collection-detail-with-summary table',
    TableDefs.HeroDetailCompareFormat,
  );
  heroCollectionTables.winsAgainst = new Table(
    '#hero-collection-detail-against-summary table',
    TableDefs.HeroDetailCompareFormat,
  );
  heroCollectionTables.players = new Table('#hero-collection-top-players table', TableDefs.HeroDetailPlayerFormat);

  heroCollectionSummaryRowTemplate = getHandlebars('hero-collection', '#hero-collection-hero-summary-row-template');
  heroCollectionPickRowTemplate = getHandlebars('hero-collection', '#hero-collection-hero-pick-row-template');

  $('#hero-collection-summary table').tablesort();
  $('#hero-collection-picks table').tablesort();
  $('#hero-collection-comps table').tablesort();
  $('#hero-collection-detail-hero-talent .talent-build table').tablesort();
  $('#hero-collection-detail-hero-talent .talent-build table').on('tablesort:complete', function (event, tablesort) {
    $('#hero-collection-detail-hero-talent .talent-build img').popup();
  });
  $('#hero-collection-body .table-wrapper table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true,
  });

  $('#hero-collection-summary table th.stat').data('sortBy', function (th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });
  $('#hero-collection-picks table th.stat').data('sortBy', function (th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  $('#hero-collection-submenu .item').tab();
  $('#hero-collection-submenu .item').click(function () {
    $('#hero-collection-body .table-wrapper table').floatThead('reflow');
  });
  $('#hero-collection-detail-hero-talent .item').click(function () {
    $('#hero-collection-body .table-wrapper table').floatThead('reflow');
  });

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template'));
  filterWidget.attr('widget-name', 'hero-collection-filter');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget, tags);

  $('#hero-collection-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="hero-collection-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false,
  });

  // initialize the filter
  for (let m in heroCollectionHeroDataFilter.mode.$in) {
    filterWidget.find('.filter-widget-mode').dropdown('set selected', heroCollectionHeroDataFilter.mode.$in[m]);
  }
  bindFilterButton(filterWidget, updateCollectionFilter);
  bindFilterResetButton(filterWidget, resetCollectionFilter);
  bindOtherSearchButton(filterWidget, $('#hero-collection-alt-search-button'), updateCollectionFilter);

  $('#hero-collection-hero-select-menu').dropdown({
    onChange: loadHeroCollectionData,
  });
  addHeroMenuOptions($('#hero-collection-hero-select-menu'));
  $('#hero-collection-hero-select-menu').dropdown('refresh');

  $('#hero-collection-body .six.ui.buttons .button').click(function () {
    toggleHeroCollectionType('#hero-collection-body', $(this), '#hero-collection-body');
  });

  $('#hero-collection-detail-hero-talent .menu .item').tab();

  loadOverallHeroCollectionData();

  // hero threshold
  $('#hero-collection-hero-thresh input').popup({
    on: 'focus',
  });
  $('#hero-collection-hero-thresh input').val(0);
  $('#hero-collection-hero-thresh input').blur(loadOverallHeroCollectionData);

  // comparison dropdowns
  $('#hero-collection-detail-with-summary .cache-collections.dropdown').dropdown({
    fullTextSearch: true,
    onChange: function (value, text, $elem) {
      updateHeroCollectionVsStats(value, $elem, 'with', $('#hero-collection-detail-with-summary'));
    },
  });

  $('#hero-collection-detail-against-summary .cache-collections.dropdown').dropdown({
    fullTextSearch: true,
    onChange: function (value, text, $elem) {
      updateHeroCollectionVsStats(value, $elem, 'against', $('#hero-collection-detail-against-summary'));
    },
  });

  $('#hero-collection-file-menu').dropdown({
    action: 'hide',
    onChange: handleHeroStatsFileAction,
  });

  $('#hero-collection-print-sections .ui.dropdown').dropdown();
}

function heroCollectionRedrawTables() {
  for (var t in heroCollectionTables) {
    heroCollectionTables[t].draw();
  }
}

function heroCollectionShowSection() {
  $('#hero-collection-body .table-wrapper table').floatThead('reflow');
  $('#hero-collection-file-menu').removeClass('is-hidden');
}

function resetHeroCollection() {
  resetCollectionFilter();
}

function showHeroCollectionLoader() {
  $('#hero-collection-body .dimmer').dimmer('show');
  $('#hero-collection-hero-select-menu').addClass('disabled');
  disableWidget('hero-collection-filter');
}

function hideHeroCollectionLoader() {
  $('#hero-collection-body .dimmer').dimmer('hide');
  $('#hero-collection-hero-select-menu').removeClass('disabled');
  enableWidget('hero-collection-filter');
}

function updateCollectionFilter(map, hero) {
  heroCollectionHeroDataFilter = hero;
  heroCollectionMapDataFilter = map;

  loadOverallHeroCollectionData();
  loadHeroCollectionData($('#hero-collection-hero-select-menu').dropdown('get value'), null, null, true);
}

function resetCollectionFilter() {
  heroCollectionHeroDataFilter = {
    mode: {
      $in: [
        ReplayTypes.GameMode.UnrankedDraft,
        ReplayTypes.GameMode.HeroLeague,
        ReplayTypes.GameMode.TeamLeague,
        ReplayTypes.GameMode.Custom,
      ],
    },
  };
  heroCollectionMapDataFilter = {
    mode: {
      $in: [
        ReplayTypes.GameMode.UnrankedDraft,
        ReplayTypes.GameMode.HeroLeague,
        ReplayTypes.GameMode.TeamLeague,
        ReplayTypes.GameMode.Custom,
      ],
    },
  };

  let filterWidget = $('.filter-popup-widget[widget-name="hero-collection-filter"]');
  for (let m in heroCollectionHeroDataFilter.mode.$in) {
    filterWidget.find('.filter-widget-mode').dropdown('set selected', heroCollectionHeroDataFilter.mode.$in[m]);
  }

  updateCollectionFilter(heroCollectionMapDataFilter, heroCollectionHeroDataFilter);
}

function loadOverallHeroCollectionData() {
  heroCollectionHeroMatchThresh = parseInt($('#hero-collection-hero-thresh input').val());
  showHeroCollectionLoader();

  // the summary only loads the hero pick/win details which are easily extracted
  // from the match data
  // check the hero details section for all that extra stuff.
  DB.getMatches(heroCollectionMapDataFilter, function (err, docs) {
    let matchData = summarizeMatchData(docs, Heroes);
    let overallStats = matchData.data;

    $('#hero-collection-summary tbody').html('');
    $('#hero-collection-picks tbody').html('');
    let roleData = {};
    let totalCount = 0;
    let totalBan = 0;

    for (let h in overallStats) {
      if (h === 'totalMatches' || h === 'totalBans') continue;

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

      if (hero.involved < heroCollectionHeroMatchThresh) continue;

      let context = {};
      context.heroName = h;
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
      context.heroRole = Heroes.role(h).split(' ').join('-');

      $('#hero-collection-summary tbody').append(heroCollectionSummaryRowTemplate(context));

      let banContext = {};
      banContext.format = {};
      banContext.games = hero.games;
      banContext.heroName = h;
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
        banContext.picks[p].winPct = banContext.picks[p].wins / banContext.picks[p].count;
        banContext.picks[p].formatWinPct = formatStat('pct', banContext.picks[p].winPct);
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
      } else {
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
      let elem = '<tr><td><h3 class="ui image inverted header">';
      elem += '<img src="assets/heroes-talents/images/heroes/' + Heroes.heroIcon(hero) + '" class="ui rounded image">';
      elem += '<div class="content">' + hero + '</div></h3></td></tr>';

      if (!(hero in overallStats)) {
        $('#hero-collection-zero-participation tbody').append(elem);
        $('#hero-collection-zero-games tbody').append(elem);
        $('#hero-collection-zero-bans tbody').append(elem);
      } else {
        if (overallStats[hero].games === 0) $('#hero-collection-zero-games tbody').append(elem);
        if (overallStats[hero].bans.total === 0) $('#hero-collection-zero-bans tbody').append(elem);
      }
    }

    // comps
    for (let key in matchData.compositions) {
      let comp = matchData.compositions[key];
      let row =
        '<tr><td class="center aligned" data-sort-value="' + key + '">' + getCompositionElement(comp.roles) + '</td>';
      row +=
        '<td class="center aligned" data-sort-value="' +
        comp.wins / comp.games +
        '">' +
        formatStat('pct', comp.wins / comp.games) +
        '</td>';
      row +=
        '<td class="center aligned" data-sort-value="' +
        comp.games / (overallStats.totalMatches * 2) +
        '">' +
        formatStat('pct', comp.games / (overallStats.totalMatches * 2)) +
        '</td>';
      row += '<td class="center aligned" data-sort-value="' + comp.wins + '">' + comp.wins + '</td>';
      row +=
        '<td class="center aligned" data-sort-value="' +
        (comp.games - comp.wins) +
        '">' +
        (comp.games - comp.wins) +
        '</td>';
      row += '<td class="center aligned" data-sort-value="' + comp.games + '">' + comp.games + '</td></tr>';

      $('#hero-collection-comps tbody').append(row);
    }

    $('#hero-collection-pool table').floatThead('reflow');
    $('#hero-collection-comps table').floatThead('reflow');
    $('#hero-collection-page-content th').removeClass('sorted ascending descending');

    // visibility filter checks
    for (let cls in RoleColorClass) {
      const classname = cls.split(' ').join('-');
      if (!$(`#hero-collection-summary .ui.buttons .${classname}`).hasClass(RoleColorClass[cls])) {
        $('#hero-collection-body table').find(`.${classname}`).addClass('is-hidden');
      }
    }

    hideHeroCollectionLoader();
  });
}

function toggleHeroCollectionType(tableID, active, container) {
  let type = active.text();
  const classname = type.split(' ').join('-');
  let elem = $(container).find('.button.' + classname);
  elem.toggleClass(RoleColorClass[type]);
  $(tableID + ' table')
    .find('.' + classname)
    .toggleClass('is-hidden');
}

// many of the functions here are borrowed from player.js
function loadHeroCollectionData(value, text, $elem, force) {
  if (value === currentHeroCollectionHero && !force) return;

  showHeroCollectionLoader();
  heroCollectionHeroMatchThresh = parseInt($('#hero-collection-hero-thresh input').val());
  let query = Object.assign({}, heroCollectionHeroDataFilter);

  query.hero = value;
  currentHeroCollectionHero = value;
  DB.getHeroData(query, function (err, docs) {
    let stats = summarizeHeroData(docs);
    heroDataWinCache = { with: stats.withHero, against: stats.againstHero };

    updateHeroTitle($('#hero-collection-hero-header'), value);

    // talents
    renderHeroTalentsTo(query.hero, $('#hero-collection-detail-hero-talent'), docs);

    // map stats
    heroCollectionTables.maps.setDataFromObject(stats.maps);

    // vs stats
    let val = $('#hero-collection-detail-with-summary .cache-collections').dropdown('get value');
    updateHeroCollectionVsStats(
      val,
      $('#hero-collection-detail-with-summary .cache-collections .item[data-value="' + val + '"]'),
      'with',
      $('#hero-collection-detail-with-summary'),
      heroCollectionTables.winsWith,
    );

    val = $('#hero-collection-detail-against-summary .cache-collections').dropdown('get value');
    updateHeroCollectionVsStats(
      val,
      $('#hero-collection-detail-against-summary .cache-collections .item[data-value="' + val + '"]'),
      'against',
      $('#hero-collection-detail-against-summary'),
      heroCollectionTables.winsAgainst,
    );

    heroCollectionTables.awards.setData(TableDefs.preprocessAwards(stats));

    // these are annoying
    $('#hero-collection-detail-misc-summary .statistic[name="overallWin"] .value').text(
      formatStat('pct', stats.wins / stats.games),
    );
    $('#hero-collection-detail-misc-summary .statistic[name="overallGames"] .value').text(stats.games);
    $('#hero-collection-detail-misc-summary .statistic[name="overallTD"] .value').text(
      formatStat('overallTD', stats.totalTD / stats.games),
      true,
    );
    $('#hero-collection-detail-misc-summary .statistic[name="overallDeaths"] .value').text(
      formatStat('overallDeaths', stats.totalDeaths / stats.games),
      true,
    );
    $('#hero-collection-detail-misc-summary .statistic[name="overallKDA"] .value').text(
      formatStat('KDA', stats.totalTD / Math.max(stats.totalDeaths, 1)),
    );
    $('#hero-collection-detail-misc-summary .statistic[name="overallMVP"] .value').text(
      formatStat('pct', stats.totalMVP / Math.max(stats.games, 1)),
    );
    $('#hero-collection-detail-misc-summary .statistic[name="overallAward"] .value').text(
      formatStat('pct', stats.totalAward / Math.max(stats.games)),
    );

    $('#hero-collection-page-content .table-wrapper table').floatThead('reflow');
    $('#hero-collection-page-content th').removeClass('sorted ascending descending');

    let playerData = summarizePlayerData(docs);
    heroCollectionTables.players.setDataFromObject(playerData);

    hideHeroCollectionLoader();
  });
}

function updateHeroCollectionVsStats(value, $elem, key, container, table) {
  if (heroDataWinCache === undefined) return;

  container.find('.dropdown.cache-collections').addClass('loading disabled');

  let cid = value === 'all' ? null : value;

  if ($elem.attr('data-type') === 'external')
    DB.getExternalCacheCollectionHeroStats(cid, function (cache) {
      renderHeroCollectionVsStatsTo(table, heroDataWinCache[key], heroCollectionHeroMatchThresh, cache);
      container.find('.dropdown.cache-collections').removeClass('loading disabled');
    });
  else
    DB.getCachedCollectionHeroStats(cid, function (cache) {
      renderHeroCollectionVsStatsTo(table, heroDataWinCache[key], heroCollectionHeroMatchThresh, cache);
      container.find('.dropdown.cache-collections').removeClass('loading disabled');
    });
}

function renderHeroCollectionVsStatsTo(table, stats, threshold, avg) {
  if (threshold === undefined) threshold = 0;

  let tableData = [];
  for (let h in stats) {
    let context = stats[h];

    if (h in avg.heroData.heroes) {
      context.avgWinPct = avg.heroData.heroes[h].wins / avg.heroData.heroes[h].games;
    } else {
      context.avgWinPct = 0;
    }

    tableData.push(context);
  }

  table.setData(tableData);
  table.filterByMinGames(threshold);
}

function getCompositionElement(roles) {
  const template = getHandlebars('hero-collection', '#hero-composition');

  const context = {
    roles: roles.map((r) => ({
      name: r,
      colorClass: RoleColorClass[r],
      image: r === 'Multiclass' ? 'specialist' : r.toLowerCase(),
    })),
  };

  return template(context);
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
    addPrintPage('general');
    addPrintSubHeader('General Stats', 'general');
    copyFloatingTable($('#hero-collection-summary .floatThead-wrapper'), getPrintPage('general'));
  }

  // picks
  if (sects.indexOf('draft') !== -1) {
    addPrintPage('draft');
    addPrintSubHeader('Draft Stats', 'draft');
    copyFloatingTable($('#hero-collection-picks .floatThead-wrapper'), getPrintPage('draft'));
  }

  // compositions
  if (sects.indexOf('comps') !== -1) {
    addPrintPage('comps');
    addPrintSubHeader('Composition Stats', 'comps');
    copyFloatingTable($('#hero-collection-comps .floatThead-wrapper'), getPrintPage('comps'));
  }

  // hero pool is... more complicated
  if (sects.indexOf('pool') !== -1) {
    addPrintPage('pool');
    addPrintSubHeader('Hero Pool Stats', 'pool');
    getPrintPage('pool').append('<div class="hero-pool ui segment"></div>');
    getPrintPage('pool').find('.hero-pool.segment').append($('#hero-collection-pool .six.column.grid').clone());

    getPrintPage('pool').append('<div class="ui segment draft-tables"><div class="ui three column grid"></div></div>');
    $('#print-window .draft-tables .grid').append(
      '<div class="ui column grid-cell-1"><h4 class="ui header">Zero Participation</div></div>',
    );
    $('#print-window .draft-tables .grid').append(
      '<div class="ui column grid-cell-2"><h4 class="ui header">Zero Games</div></div>',
    );
    $('#print-window .draft-tables .grid').append(
      '<div class="ui column grid-cell-3"><h4 class="ui header">Zero Bans</div></div>',
    );
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

  addPrintPage('talents');
  addPrintSubHeader('Talents', 'talents');
  copyFloatingTable($('#hero-collection-detail-hero-talent .talent-pick .floatThead-wrapper'), getPrintPage('talents'));

  addPrintPage('builds');
  addPrintSubHeader('Builds', 'builds');
  copyFloatingTable($('#hero-collection-detail-hero-talent .talent-build .floatThead-wrapper'), getPrintPage('builds'));

  addPrintPage('maps');
  addPrintSubHeader('Maps', 'maps');
  copyFloatingTable($('#hero-collection-detail-map-summary'), getPrintPage('maps'));

  addPrintPage('with');
  addPrintSubHeader('Win Rate With Hero', 'with');
  copyFloatingTable($('#hero-collection-detail-with-summary .floatThead-wrapper'), getPrintPage('with'));

  addPrintPage('against');
  addPrintSubHeader('Win Rate Against Hero', 'against');
  copyFloatingTable($('#hero-collection-detail-against-summary .floatThead-wrapper'), getPrintPage('against'));

  addPrintPage('awards');
  addPrintSubHeader('Awards', 'awards');
  copyFloatingTable($('#hero-collection-award-summary'), getPrintPage('awards'));

  $('#print-window').removeClass('is-hidden');
}

function printHeroCollection(sections, filename) {
  layoutHeroCollectionPrint(sections);
  renderAndPrint(filename, 'Letter', true);
}

function printHeroCollectionHero(filename) {
  layoutHeroCollectionDetailPrint();
  renderAndPrint(filename);
}

function handleHeroStatsFileAction(value, text, $elem) {
  if (value === 'print-all') {
    dialog.showSaveDialog(
      {
        title: 'Print Hero Stats',
        filters: [{ name: 'pdf', extensions: ['pdf'] }],
      },
      function (filename) {
        if (filename) {
          printHeroCollection(null, filename);
        }
      },
    );
  } else if (value === 'print-sections') {
    $('#hero-collection-print-sections')
      .modal({
        onApprove: function () {
          dialog.showSaveDialog(
            {
              title: 'Print Hero Stats',
              filters: [{ name: 'pdf', extensions: ['pdf'] }],
            },
            function (filename) {
              if (filename) {
                let sections = $('#hero-collection-print-sections .ui.dropdown').dropdown('get value').split(',');
                printHeroCollection(sections, filename);
              }
            },
          );
        },
        closable: false,
      })
      .modal('show');
  } else if (value === 'print-hero') {
    dialog.showSaveDialog(
      {
        title: 'Print Hero Stats',
        filters: [{ name: 'pdf', extensions: ['pdf'] }],
      },
      function (filename) {
        if (filename) {
          printHeroCollectionHero(filename);
        }
      },
    );
  } else if (value === 'json-pick') {
    dialog.showSaveDialog(
      {
        title: 'Export Draft Data',
        filters: [{ name: 'json', extensions: ['json'] }],
      },
      function (filename) {
        if (filename) {
          exportHeroCollectionSummaryJSON(filename);
        }
      },
    );
  } else if (value === 'json-hero') {
    dialog.showSaveDialog(
      {
        title: 'Export Hero Data',
        filters: [{ name: 'json', extensions: ['json'] }],
      },
      function (filename) {
        if (filename) {
          exportHeroCollectionHeroJSON(filename);
        }
      },
    );
  } else if (value === 'csv-draft') {
    dialog.showSaveDialog(
      {
        title: 'Export Draft Data',
        filters: [{ name: 'csv', extensions: ['csv'] }],
      },
      function (filename) {
        if (filename) {
          exportHeroDraftCSV(filename);
        }
      },
    );
  } else if (value === 'csv-hero') {
    dialog.showSaveDialog(
      {
        title: 'Export Hero Data',
        filters: [{ name: 'csv', extensions: ['csv'] }],
      },
      function (filename) {
        if (filename) {
          exportHeroCollectionHeroCSV(filename);
        }
      },
    );
  }
}

function exportHeroCollectionSummaryJSON(filename) {
  DB.getMatches(heroCollectionMapDataFilter, function (err, docs) {
    let matchData = summarizeMatchData(docs, Heroes);
    fs.writeFile(filename, JSON.stringify(matchData, null, 2), function (err) {
      if (err) {
        showMessage('JSON Export Error', err, { class: 'negative' });
      } else {
        showMessage('JSON Export Complete', 'Exported to ' + filename);
      }
    });
  });
}

function exportHeroCollectionHeroJSON(filename) {
  let query = Object.assign({}, heroCollectionHeroDataFilter);
  query.hero = $('#hero-collection-hero-select-menu').dropdown('get value');
  DB.getHeroData(query, function (err, docs) {
    let stats = summarizeHeroData(docs);
    fs.writeFile(filename, JSON.stringify(stats, null, 2), function (err) {
      if (err) {
        showMessage('JSON Export Error', err, { class: 'negative' });
      } else {
        showMessage('JSON Export Complete', 'Exported to ' + filename);
      }
    });
  });
}

function exportHeroCollectionHeroCSV(filename) {
  let query = Object.assign({}, heroCollectionHeroDataFilter);
  query.hero = $('#hero-collection-hero-select-menu').dropdown('get value');
  DB.getHeroData(query, function (err, docs) {
    exportHeroDataAsCSV(docs, filename);
  });
}

function exportHeroDraftCSV(filename) {
  DB.getMatches(heroCollectionMapDataFilter, function (err, docs) {
    let matchData = summarizeMatchData(docs, Heroes);
    fs.writeFile(filename, heroDraftCSV(matchData, Heroes), function (err) {
      if (err) {
        showMessage('CSV Export Error', err, { class: 'negative' });
      } else {
        showMessage('CSV Export Complete', 'Exported to ' + filename);
      }
    });
  });
}
