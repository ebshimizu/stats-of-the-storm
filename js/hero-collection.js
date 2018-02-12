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