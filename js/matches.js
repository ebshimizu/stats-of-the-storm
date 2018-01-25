// list of selected match ids
// note that this isn't the currently displayed match ids, that's a different one
var selectedMatches;

var displayedMatchIDs;
var currentPage;

function initMatchesPage() {
  // bindings
  $('#match-player-search').dropdown();
  $('.match-details .ui.image').popup();

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
  // need: blueTeamLevel
  let pro = {};
  pro._id = 1;
  pro.teams = 1;
  pro.length = 1;
  pro.map = 1;
  pro.mode = 1;
  pro.date = 1;

  DB.getMatches({}, updateSelectedMatches, {projection: pro, sort: {'date' : -1 }});
}

function updateSelectedMatches(err, docs) {
  selectedMatches = docs;
  $('#matches-selected').text(selectedMatches.length);
}

function showPage(pageNum) {

}