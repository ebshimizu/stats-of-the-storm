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
  // templates
  matchRowTemplate = Handlebars.compile(getTemplate('matches', '#match-summary-row').find('td')[0].outerHTML);

  // bindings
  $('#match-player-search').dropdown();

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

function updateSelectedMatches(err, docs) {
  selectedMatches = docs;
  $('#matches-selected').text(selectedMatches.length);
  showPage(currentPage);
}

function showPage(pageNum) {
  // check in range
  let maxPages = Math.ceil(selectedMatches.length / matchesPerPage);
  if (0 <= pageNum && pageNum < maxPages) {
    // so like pick the correct range and just render it
    let startIdx = pageNum * matchesPerPage;

    for (let i = 0; i < matchesPerPage; i++) {
      if (i + startIdx < selectedMatches.length) {
        renderToSlot(selectedMatches[i + startIdx], i);
      }
      else {
        $('tr[slot="' + i + '"]').html('');
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