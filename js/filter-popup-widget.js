var popupWidgetResetCallback = null;

function initPopup() {
  let elem = $('#filter-popup-widget');

  // modes
  elem.find('.filter-widget-mode').dropdown({
    action: 'activate',
    fullTextSearch: true
  });

  // maps
  elem.find('.filter-widget-map').dropdown({
    action: 'activate'
  });
  addMapMenuOptions(elem.find('.filter-widget-map'));
  elem.find('.filter-widget-map').dropdown('refresh');

  // dates
  elem.find('.filter-widget-start-date').datepicker();
  elem.find('.filter-widget-end-date').datepicker();
  elem.find('.filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
  elem.find('.filter-widget-end-date').datepicker('setDate', new Date());

  elem.find('.filter-widget-season').dropdown({
    onChange: function(value, text, $item) {
      if (value !== '0' && value !== '') {
        $('#filter-popup-widget .filter-widget-start-date').datepicker('setDate', ReplayTypes.SeasonDates[text].start);
        $('#filter-popup-widget .filter-widget-end-date').datepicker('setDate', ReplayTypes.SeasonDates[text].end);
      }
      else {
        $('#filter-popup-widget .filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
        $('#filter-popup-widget .filter-widget-end-date').datepicker('setDate', new Date());
      }
    }
  });
  elem.find('.filter-widget-season .menu').html('');
  for (let s in ReplayTypes.SeasonDates) {
    elem.find('.filter-widget-season .menu').prepend('<div class="item">' + s + '</div>');
  }
  elem.find('.filter-widget-season .menu').prepend('<div class="item" data-value="0">None</div>');
  elem.find('.filter-widget-season').dropdown('refresh');


  // hero type
  elem.find('.filter-widget-hero-type').dropdown();

  // the buttons get rebound depending on the page
  elem.find('.filter-widget-reset').click(resetFilterWidget);
}

// callback signature:
// function(mapQuery, heroQuery) {} where mapQuery is a NeDB query for match objects,
// and heroQuery is a NeDB query for heroData objects
function bindFilterButton(callback) {
  $('#filter-popup-widget').find('.filter-widget-search').off();

  $('#filter-popup-widget').find('.filter-widget-search').click(function() {
    let queries = getPopupQuery();
    callback(queries.map, queries.hero);
  });
}

function bindFilterResetButton(callback) {
  popupWidgetResetCallback = callback;
}

function resetFilterWidget() {
  $('#filter-popup-widget').find('.dropdown').dropdown('restore defaults');

  $('#filter-popup-widget .filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
  $('#filter-popup-widget .filter-widget-end-date').datepicker('setDate', new Date()); 

  if (popupWidgetResetCallback)
    popupWidgetResetCallback();
}

function getPopupQuery() {
  // mode
  let modes = $('#filter-popup-widget').find('.filter-widget-mode').dropdown('get value').split(',');
  for (m in modes) {
    if (modes[m] !== "")
      modes[m] = parseInt(modes[m]);
  }

  // dates
  let start = $('#filter-popup-widget').find('.filter-widget-start-date').datepicker('getDate');
  let end = $('#filter-popup-widget').find('.filter-widget-end-date').datepicker('getDate');

  // heroe type
  // TODO

  // maps
  let maps = $('#filter-popup-widget').find('.filter-widget-map').dropdown('get value').split(',');

  // construct the query
  let query = {};
  if (modes[0] !== "") {
    query.mode = { $in: modes };
  }

  if (maps[0] !== "") {
    query.map = { $in: maps };
  }

  // dates
  query.$where = function() {
    let d = new Date(this.date);
    return (start <= d && d <= end);
  }

  // right now the queries are identical
  return { map: query, hero: query };
}