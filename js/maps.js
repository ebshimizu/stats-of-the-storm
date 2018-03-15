var mapsHeroDataFilter;
var mapsMapDataFilter;
var mapsMapRowTemplate;

function initMapsPage() {
  // templates
  mapsMapRowTemplate = Handlebars.compile(getTemplate('maps', '#map-table-row-template').find('tr')[0].outerHTML);
  
  // tables
  $('#maps-page-content table').tablesort();
  $('#maps-page-content table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });
  $('#maps-page-content table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'maps-filter');
  
  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  $('#maps-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="maps-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  bindFilterButton(filterWidget, updateMapsFilter);
  bindFilterResetButton(filterWidget, resetMapsFilter);

  loadMapStats();
}

function updateMapsFilter(map, hero) {
  mapsHeroDataFilter = hero;
  mapsMapDataFilter = map;

  loadMapStats();
}

function resetMapsFilter() {
  mapsHeroDataFilter = {};
  mapsMapDataFilter = {};

  loadMapStats();
}

function loadMapStats() {
  $('#map-individual-stats tbody').html('');

  DB.getMatches(mapsMapDataFilter, function(err, docs) {
    let mapData = DB.summarizeMapData(docs);

    // stats
    let statContainer = $('#map-overall-stats');
    updateTeamStat(statContainer, 'average', formatSeconds(mapData.aggregate.average));
    updateTeamStat(statContainer, 'median', formatSeconds(mapData.aggregate.median));
    updateTeamStat(statContainer, 'min', formatSeconds(mapData.aggregate.min));
    updateTeamStat(statContainer, 'max', formatSeconds(mapData.aggregate.max));
    updateTeamStat(statContainer, 'firstPickWin', (mapData.aggregate.firstPickWin / mapData.aggregate.draftGames * 100).toFixed(1) + '%');
    updateTeamStat(statContainer, 'firstObjectiveWins', (mapData.aggregate.firstObjectiveWins / mapData.aggregate.games * 100).toFixed(1) + '%');
    updateTeamStat(statContainer, 'blueWin', (mapData.aggregate.blueWin / mapData.aggregate.games * 100).toFixed(1) + '%');
    updateTeamStat(statContainer, 'redWin', (mapData.aggregate.redWin / mapData.aggregate.games * 100).toFixed(1) + '%');

    $('#map-overall-stats .statistic[name="min"]').attr('matchID', mapData.aggregate.minId);
    $('#map-overall-stats .statistic[name="max"]').attr('matchID', mapData.aggregate.maxId);

    // maps
    for (let map in mapData.stats) {
      let context = mapData.stats[map];

      context.firstPickWinPct = context.firstPickWin / context.draftGames;
      context.firstObjectiveWinsPct = context.firstObjectiveWins / context.games;
      context.blueWinPct = context.blueWin / context.games;
      context.redWinPct = context.redWin / context.games;
      context.map = map;

      context.format = {};
      context.format.average = formatSeconds(context.average);
      context.format.median = formatSeconds(context.median);
      context.format.min = formatSeconds(context.min);
      context.format.max = formatSeconds(context.max);
      context.format.firstPickWinPct = (context.firstPickWinPct * 100).toFixed(1) + '%';

      if (map === ReplayTypes.MapType.BlackheartsBay || map === ReplayTypes.MapType.HauntedMines)
        context.format.firstObjectiveWinsPct = 'No Data';
      else
        context.format.firstObjectiveWinsPct = (context.firstObjectiveWinsPct * 100).toFixed(1) + '%';

      context.format.blueWinPct = (context.blueWinPct * 100).toFixed(1) + '%';
      context.format.redWinPct = (context.redWinPct * 100).toFixed(1) + '%';

      $('#map-individual-stats tbody').append(mapsMapRowTemplate(context));
    }
    
    // link binding
    $('#maps-page-content .match-link').off();
    $('#maps-page-content .match-link').click(function() {
      loadMatchData($(this).attr('matchId'), function() {
        changeSection('match-detail');
      });
    });

    $('#maps-page-content table').floatThead('reflow');
  });
}