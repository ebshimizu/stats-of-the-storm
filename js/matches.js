// list of selected match ids
// note that this isn't the currently displayed match ids, that's a different one
var selectedMatches;
const summaryProjection = {
  _id: 1,
  teams: 1,
  length: 1,
  map: 1,
  mode: 1,
  date: 1,
  winner: 1
};

// idk man it just kinda looks nice this way
const matchesPerPage = 7;

var displayedMatchIDs;
var currentPage;
var matchRowTemplate;

function initMatchesPage() {
  // player menu init
  let selectedPlayerID = settings.get('selectedPlayerID');
  $('#match-search-player').dropdown({
    action: 'activate',
    fullTextSearch: true
    // on change isn't actually necessary here. the search button handles all options
  });
  
  // templates
  matchRowTemplate = Handlebars.compile(getTemplate('matches', '#match-summary-row').find('td')[0].outerHTML);

  // bindings
  $('#match-player-search').dropdown();
  $('#match-mode-select').dropdown({
    action: 'activate',
    fullTextSearch: true
  });
  $('#match-search-players-mode').dropdown({
    action: 'activate'
  });
  $('#match-search-heroes-mode').dropdown();

  // again most of the things here don't actually need callbacks
  $('#match-search-heroes').dropdown({
    fullTextSearch: true
  });
  addHeroMenuOptions($('#match-search-heroes'));
  $('#match-search-heroes').dropdown('refresh');

  $('#match-search-start-date').datepicker();
  $('#match-search-start-date').datepicker('setDate', new Date('1-1-2012'));

  $('#match-search-end-date').datepicker();
  $('#match-search-end-date').datepicker('setDate', new Date());

  // season menu tho that has some stuff
  initSeasonMenu();

  $('#match-search-button').click(selectMatches);
  $('#match-search-reset-button').click(resetMatchFilters);

  // initial settings
  getMatchCount();

  currentPage = 0;
  selectAllMatches();
}

function getMatchCount() {
  DB.countMatches({}, function(err, count) {
    $('#matches-in-database-stat').text(count);
  })
}

function selectAllMatches() {
  // get just the necessary info in descending time order
  DB.getMatches({}, updateSelectedMatches, {projection: summaryProjection, sort: {'date' : -1 }});
}

function resetMatchFilters() {
  $('#match-mode-select').dropdown('restore defaults');
  $('#match-search-seasons').dropdown('restore defaults');
  $('#match-search-players').dropdown('restore defaults');
  $('#match-search-players-mode').dropdown('restore defaults');
  $('#match-search-heroes').dropdown('restore defaults');
  $('#match-search-heroes-mode').dropdown('restore defaults');

  $('#match-search-start-date').datepicker('setDate', new Date('1-1-2012'));
  $('#match-search-end-date').datepicker('setDate', new Date());
}

// using the current search settings, search for matches
function selectMatches() {
  // mode
  let modes = $('#match-mode-select').dropdown('get value').split(',');
  for (m in modes) {
    if (modes[m] !== "")
      modes[m] = parseInt(modes[m]);
  }

  // dates
  let start = $('#match-search-start-date').datepicker('getDate');
  let end = $('#match-search-end-date').datepicker('getDate');

  // players
  let players = $('#match-search-players').dropdown('get value').split(',');
  let playerMode = $('#match-search-players-mode').dropdown('get value');

  // heroes
  let heroes = $('#match-search-heroes').dropdown('get value').split(',');
  let heroMode = $('#match-search-heroes-mode').dropdown('get value');

  // construct the query
  let query = {};
  if (modes[0] !== "") {
    query.mode = { $in: modes };
  }

  // dates
  query.$where = function() {
    let d = new Date(this.date);
    return (start <= d && d <= end);
  }

  // heroes
  if (heroes[0] !== "") {
    if (heroMode === 'and') {
      if (!('$and' in query))
        query.$and = [];
      
      for (let h in heroes) {
        query.$and.push({ 'heroes' : heroes[h] });
      }
    }
    else {
      query.heroes = { $elemMatch: { $in: heroes } };
    }
  }

  // players
  if (players[0] !== "") {
    if (playerMode === 'and') {
      if (!('$and' in query))
        query.$and = [];
      
      for (let p in players) {
        query.$and.push({ 'playerIDs' : players[p] });
      }
    }
    else {
      query.players = { $elemMatch: { $in: players } };
    }
  }

  currentPage = 0;
  DB.getMatches(query, updateSelectedMatches, {projection: summaryProjection, sort: {'date' : -1}});
}

function updateSelectedMatches(err, docs) {
  selectedMatches = docs;
  $('#matches-selected').text(selectedMatches.length);
  showPage(currentPage);
}

function showPage(pageNum) {
  // clear
  for (let i = 0; i < matchesPerPage; i++) {
    $('tr[slot="' + i + '"]').html('');
  }

  // check in range
  let maxPages = Math.ceil(selectedMatches.length / matchesPerPage);
  if (0 <= pageNum && pageNum < maxPages) {
    // so like pick the correct range and just render it
    let startIdx = pageNum * matchesPerPage;

    for (let i = 0; i < matchesPerPage; i++) {
      if (i + startIdx < selectedMatches.length) {
        renderToSlot(selectedMatches[i + startIdx], i);
      }
    }
    currentPage = pageNum;

    // update the pagination buttons
    $('#match-list-page-menu').html('');
    
    // determine what to show
    let show = Array.from(new Array(5), (x, i) => i - 2 + currentPage);
    // first, we always have the first page
    let elems = '<a class="icon item prev"><i class="left chevron icon"></i></a>';
    elems += '<a class="item" page="1">1</a>';

    if (show[0] >= 2)
      elems += '<a class="item disabled">...</a>';

    for (let i = 0; i < show.length; i++) {
      let pn = show[i];
      
      if (pn < 1 || pn >= maxPages - 1)
        continue;
      
      elems += '<a class="item" page="' + (pn + 1) + '">' + (pn + 1) + '</a>';
    }

    if (show[show.length - 1] < maxPages - 2)
      elems += '<a class="item disabled">...</a>';
    
    elems += '<a class="item" page="' + maxPages + '">' + maxPages + '</a>';
    elems += '<a class="icon item next"><i class="right chevron icon"></i></a>';
    $('#match-list-page-menu').html(elems);
    $('#match-list-page-menu .item[page="' + (currentPage + 1) + '"]').addClass('active');

    $('#match-list-page-menu .item').click(function() {
      if ($(this).hasClass('next'))
        showPage(currentPage + 1);
      else if ($(this).hasClass('prev'))
        showPage(currentPage - 1);
      else
        showPage(parseInt($(this).attr('page')) - 1);
    });

    $('#match-page-table .match-summary').click(function() {
      let id = $(this).attr('match-id');
      loadMatchData(id, function() { changeSection('match-detail'); });
    })
  }
  else {
    $('#match-list-page-menu').html('');
  }
}

function renderToSlot(gameData, slot) {
  let context = {};
  context.map = gameData.map;
  context.mode = ReplayTypes.GameModeStrings[gameData.mode];
  context.id = gameData._id;
  
  // if player id is defined, highlight if present, otherwise red/blue
  let focusId = settings.get('selectedPlayerID');
  if ((gameData.teams[0].ids.indexOf(focusId) > -1 && gameData.winner === 0) ||
      (gameData.teams[1].ids.indexOf(focusId) > -1 && gameData.winner === 1)) {
    context.winClass = "green";
    context.winText = "Victory";
  }
  else if (gameData.teams[0].ids.indexOf(focusId) > -1 || gameData.teams[1].ids.indexOf(focusId) > -1) {
    context.winClass = "red";
    context.winText = "Defeat";
  }
  else {
    if (gameData.winner === 0) {
      context.winClass = "blue";
      context.winText = "Blue Team Victory";
    }
    else {
      context.winClass = "red";
      context.winText = "Red Team Victory";
    }
  }
  
  context.date = new Date(gameData.date);
  context.date = context.date.toLocaleString('en-US');

  context.length = formatSeconds(gameData.length);
  context.takedowns = { blue: gameData.teams[0].takedowns, red: gameData.teams[1].takedowns };
  context.level = { blue: gameData.teams[0].level, red: gameData.teams[1].level };
  context.blueHeroes = [];
  context.redHeroes = [];

  let bd = gameData.teams[0];
  let rd = gameData.teams[1];
  for (let i = 0; i < gameData.teams[0].ids.length; i++) {
    context.blueHeroes.push({heroImg: Heroes.heroIcon(bd.heroes[i]), playerName: bd.names[i], playerID: bd.ids[i], isFocus: focusClass(bd.ids[i] )});
    context.redHeroes.push({heroImg: Heroes.heroIcon(rd.heroes[i]), playerName: rd.names[i], playerID: rd.ids[i], isFocus: focusClass(rd.ids[i]) });
  }

  $('#match-list tr[slot="' + slot + '"]').html(matchRowTemplate(context));
  $('tr[slot="' + slot + '"] .match-details .ui.image').popup();
}

function initSeasonMenu() {
  $('#match-search-seasons .menu').html('');
  for (let s in ReplayTypes.SeasonDates) {
    $('#match-search-seasons .menu').prepend('<div class="item">' + s + '</div>');
  }
  $('#match-search-seasons .menu').prepend('<div class="item" data-value="0">None</div>');

  $('#match-search-seasons').dropdown({
    onChange: function(value, text, $item) {
      if (value !== '0' && value !== '') {
        $('#match-search-start-date').datepicker('setDate', ReplayTypes.SeasonDates[text].start);
        $('#match-search-end-date').datepicker('setDate', ReplayTypes.SeasonDates[text].end);
      }
      else {
        $('#match-search-start-date').datepicker('setDate', new Date('1-1-2012'));
        $('#match-search-end-date').datepicker('setDate', new Date());
      }
    }
  })
}