var mapsHeroDataFilter;
var mapsMapDataFilter;
var mapsMapRowTemplate;

function initMapsPage(tags) {
  // templates
  mapsMapRowTemplate = getHandlebars('maps', '#map-table-row-template');

  // tables
  $('#maps-page-content table').tablesort();
  $('#maps-page-content table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true,
  });
  $('#maps-page-content table th.stat').data('sortBy', function (th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template'));
  filterWidget.attr('widget-name', 'maps-filter');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget, tags);

  $('#maps-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="maps-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false,
  });

  $('#maps-file-menu').dropdown({
    onChange: handleMapsAction,
  });

  $('#map-overall-stats .statistic').popup();

  bindFilterButton(filterWidget, updateMapsFilter);
  bindFilterResetButton(filterWidget, resetMapsFilter);
  bindOtherSearchButton(filterWidget, $('#maps-alt-search-button'), updateMapsFilter);

  //loadMapStats();
}

function onShowMapsPage() {
  $('#maps-page-content table').floatThead('reflow');
  $('#maps-file-menu').removeClass('is-hidden');
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

  DB.getMatches(mapsMapDataFilter, function (err, docs) {
    let mapData = summarizeMapData(docs);

    // stats
    let statContainer = $('#map-overall-stats');
    updateTeamStat(statContainer, 'average', formatSeconds(mapData.aggregate.average));
    updateTeamStat(statContainer, 'median', formatSeconds(mapData.aggregate.median));
    updateTeamStat(statContainer, 'min', formatSeconds(mapData.aggregate.min));
    updateTeamStat(statContainer, 'max', formatSeconds(mapData.aggregate.max));
    updateTeamStat(
      statContainer,
      'firstPickWin',
      formatStat('pct', mapData.aggregate.firstPickWin / mapData.aggregate.draftGames),
    );
    updateTeamStat(
      statContainer,
      'firstObjectiveWins',
      formatStat('pct', mapData.aggregate.firstObjectiveWins / mapData.aggregate.games),
    );
    updateTeamStat(statContainer, 'blueWin', formatStat('pct', mapData.aggregate.blueWin / mapData.aggregate.games));
    updateTeamStat(statContainer, 'redWin', formatStat('pct', mapData.aggregate.redWin / mapData.aggregate.games));
    updateTeamStat(
      statContainer,
      'firstFortWin',
      formatStat('pct', mapData.aggregate.firstFortWin / mapData.aggregate.games),
    );
    updateTeamStat(
      statContainer,
      'firstKeepWin',
      formatStat('pct', mapData.aggregate.firstKeepWin / mapData.aggregate.nonToDTotal),
    );

    $('#map-overall-stats .statistic[name="min"]').attr('matchID', mapData.aggregate.minId);
    $('#map-overall-stats .statistic[name="max"]').attr('matchID', mapData.aggregate.maxId);

    // maps
    for (let map in mapData.stats) {
      let context = Object.assign({}, mapData.stats[map]);

      context.firstPickWinPct = context.firstPickWin / context.draftGames;
      if (map === ReplayTypes.MapType.HauntedMines) {
        context.firstObjectiveWinsPct = NaN;
      } else {
        context.firstObjectiveWinsPct = context.firstObjectiveWins / context.games;
      }
      context.firstFortWinPct = context.firstFortWin / context.games;
      context.firstKeepWinPct = context.firstKeepWin / context.games;

      context.blueWinPct = context.blueWin / context.games;
      context.redWinPct = context.redWin / context.games;
      context.map = map;

      $('#map-individual-stats tbody').append(mapsMapRowTemplate(context));
    }

    // link binding
    $('#maps-page-content .match-link').off();
    $('#maps-page-content .match-link').click(function () {
      loadMatchData($(this).attr('matchId'), function () {
        changeSection('match-detail');
      });
    });

    $('#maps-page-content table').floatThead('reflow');
    $('#maps-page-content th').removeClass('sorted ascending descending');
  });
}

// no sections it's like 1 page
function printMaps(filename) {
  clearPrintLayout();
  addPrintHeader('Battleground Statistics');
  addPrintDate();

  $('#print-window .contents').append($('#map-overall-stats').clone());
  $('#print-window').find('.statistics').removeClass('eight').addClass('tiny');
  $('#print-window').find('.top.attached.label').remove();

  addPrintSubHeader('Stats Per Map');
  copyFloatingTable($('#map-individual-stats .floatThead-wrapper'));

  renderAndPrint(filename, 'Letter', true);
}

function handleMapsAction(value, text, $elem) {
  if (value === 'print') {
    dialog.showSaveDialog(
      {
        title: 'Print Battleground Report',
        filters: [{ name: 'pdf', extensions: ['pdf'] }],
      },
      function (filename) {
        if (filename) {
          printMaps(filename);
        }
      },
    );
  }
}
