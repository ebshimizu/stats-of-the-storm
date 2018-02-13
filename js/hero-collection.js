var heroCollectionSummaryRowTemplate;

// by default this screen containrs games played in official modes with bans
var heroCollectionHeroDataFilter;
var heroCollectionMapDataFilter;

function initHeroCollectionPage() {
  // by default this screen containrs games played in official modes with bans
  heroCollectionHeroDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague ]}
  }
  heroCollectionMapDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague ]}
  }  

  heroCollectionSummaryRowTemplate = Handlebars.compile(getTemplate('hero-collection', '#hero-collection-hero-summary-row-template').
    find('.hero-collection-hero-summary-row')[0].outerHTML);

  $('#hero-collection-summary table').tablesort();
  $('#hero-collection-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });
  $('#hero-collection-detail-hero-talent table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#hero-collection-detail-map-summary table').tablesort();
  $('#hero-collection-detail-map-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#hero-collection-detail-with-summary table').tablesort();
  $('#hero-collection-detail-with-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#hero-collection-detail-against-summary table').tablesort();
  $('#hero-collection-detail-against-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#hero-collection-award-summary table').tablesort();
  $('#hero-collection-award-summary table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#hero-collection-summary table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.text());
  });

  $('#hero-collection-submenu .item').tab();
  $('#hero-collection-submenu .item').click(function() {
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

  $('#hero-collection-hero-select-menu').dropdown({
    onChange: loadHeroCollectionData
  });
  addHeroMenuOptions($('#hero-collection-hero-select-menu'));
  $('#hero-collection-hero-select-menu').dropdown('refresh');

  loadOverallHeroCollectionData();
}

function loadOverallHeroCollectionData() {
  // the summary only loads the hero pick/win details which are easily extracted
  // from the match data
  // check the hero details section for all that extra stuff.
  DB.getMatches(heroCollectionMapDataFilter, function(err, docs) {
    let overallStats = DB.summarizeMatchData(docs, Heroes);

    $('#hero-collection-summary tbody').html('');
    for (let h in overallStats) {
      if (h === 'totalMatches' || h === 'totalBans')
        continue;

      let hero = overallStats[h];
      let context = {};
      context.heroName = h;
      context.heroImg = Heroes.heroIcon(h);
      context.winPercent = hero.wins / hero.games;
      context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';
      context.banPercent = hero.bans / overallStats.totalMatches;
      context.formatBanPercent = (context.banPercent * 100).toFixed(2) + '%';
      context.popPercent = hero.involved / overallStats.totalMatches;
      context.formatPopPercent = (context.popPercent * 100).toFixed(2) + '%';
      context.games = hero.games;

      $('#hero-collection-summary tbody').append(heroCollectionSummaryRowTemplate(context));
    }
  })
}

// many of the functions here are borrowed from player.js
function loadHeroCollectionData(value, text, $elem) {
  let query = Object.assign({}, heroCollectionHeroDataFilter);
  query.hero = value;
  DB.getHeroData(query, function(err, docs) {
    let stats = DB.summarizeHeroData(docs);

    updateHeroTitle($('#hero-collection-hero-header'), value);

    // talents
    renderHeroTalentsTo(query.hero, $('#hero-collection-detail-hero-talent'), docs);

    // map stats
    renderMapStatsTo($('#hero-collection-detail-map-summary'), stats);

    renderHeroVsStatsTo($('#hero-collection-detail-with-summary'), stats.withHero);
    renderHeroVsStatsTo($('#hero-collection-detail-against-summary'), stats.againstHero);

    renderAwardsTo($('#hero-collection-award-summary'), stats);

    // these are annoying
    $('#hero-collection-detail-misc-summary .statistic[name="overallWin"] .value').text((stats.wins / stats.games * 100).toFixed(2) + '%');
    $('#hero-collection-detail-misc-summary .statistic[name="overallGames"] .value').text(stats.games);
    $('#hero-collection-detail-misc-summary .statistic[name="overallTD"] .value').text((stats.totalTD / stats.games).toFixed(2));
    $('#hero-collection-detail-misc-summary .statistic[name="overallDeaths"] .value').text((stats.totalDeaths / stats.games).toFixed(2));
    $('#hero-collection-detail-misc-summary .statistic[name="overallKDA"] .value').text((stats.totalTD / Math.max(stats.totalDeaths, 1)).toFixed(2));
    $('#hero-collection-detail-misc-summary .statistic[name="overallMVP"] .value').text((stats.totalMVP / Math.max(stats.games, 1) * 100).toFixed(1) + '%');
    $('#hero-collection-detail-misc-summary .statistic[name="overallAward"] .value').text((stats.totalAward / Math.max(stats.games) * 100).toFixed(1) + '%');
  });
}