var matchDetailMatch;
var matchDetailPlayers;
var matchSummaryRowTemplate;
var matchDetailHeaderTemplate;
var matchDetailRowTemplate;
const matchDetailRowTemplateSrc = '<tr class="center aligned"><td>{{fieldName}}</td>{{#each stats}}<td>{{this}}</td>{{/each}}</tr>';
var matchTalentRowTitleTemplate;
var matchTalentRowCellTemplate;

function initMatchDetailPage() {
  $('#match-detail-submenu .item').tab();

  // templates
  matchSummaryRowTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-summary-row-template').find('tr')[0].outerHTML);
  matchDetailHeaderTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-detail-header').find('th')[0].outerHTML);
  matchDetailRowTemplate = Handlebars.compile(matchDetailRowTemplateSrc);
  matchTalentRowTitleTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-talents-row-title-template').find('tr')[0].outerHTML);
  matchTalentRowCellTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-talents-row-cell-template').find('td')[0].outerHTML);

  // DEBUG - LOAD SPECIFIC MATCH
  //loadMatchData("95uraT3GIKqHfj5S", function() { console.log("done loading"); });
}

// retrieves the proper data and then renders to the page
function loadMatchData(id, doneLoadCallback) {
  // this is actually a series of callbacks...
  DB.getMatchesByID([id], function(err, doc) {
    if (doc === [])
      return;

    matchDetailMatch = doc[0];
    DB.getHeroDataForID(id, function(err, docs) {
      loadMatch(docs, doneLoadCallback);
    });
  });
}

function loadMatch(docs, doneLoadCallback) {
  // ok first process player arrays into reasonable structure
  matchDetailPlayers = {};

  for (let p in docs) {
    matchDetailPlayers[docs[p].ToonHandle] = docs[p];
  }

  // place basic info
  updateBasicInfo();

  // load summary / player data
  // load talents
  loadPlayers();

  // load details
  loadDetailedStats();

  // load xp
  
  // load chat

  // load timeline
  // this one might take a while

  $('#match-detail-details').scrollTop(0);
  doneLoadCallback();
  $('#match-detail-details table').floatThead('reflow');
}

function updateBasicInfo() {
  $('#match-detail-map-name').text(matchDetailMatch.map);

  let winnerHeader = $('#match-detail-victor');
  if (matchDetailMatch.winner === 0) {
    winnerHeader.removeClass('red').addClass('blue').text("Blue Team Victory");
  }
  else {
    winnerHeader.removeClass('blue').addClass('red').text("Red Team Victory");
  }

  $('#match-detail-mode').text(ReplayTypes.GameModeStrings[matchDetailMatch.mode]);
  let d = new Date(matchDetailMatch.date); 
  $('#match-detail-date').text(d.toLocaleString('en-US'));
  $('#match-detail-blue-level').text(matchDetailMatch.teams[0].level);
  $('#match-detail-red-level').text(matchDetailMatch.teams[1].level);
  $('#match-detail-blue-takedowns').text(matchDetailMatch.teams[0].takedowns);
  $('#match-detail-red-takedowns').text(matchDetailMatch.teams[1].takedowns);
  $('#match-detail-duration').text(formatSeconds(matchDetailMatch.length));
}

function loadPlayers() {
  $('#match-detail-summary tbody').html('');
  $('#match-detail-details table').floatThead('destroy');
  $('#match-detail-details thead').html('<tr><th class="corner"></th></tr>');
  $('#match-detail-details tbody').html('');
  $('#match-detail-talents tbody').html('');

  for (let i in matchDetailMatch.teams[0].ids) {
    appendSummaryRow("blue", matchDetailMatch.teams[0].ids[i]);
    appendDetailHeader("blue", matchDetailMatch.teams[0].ids[i]);
    appendTalentRow('blue', matchDetailMatch.teams[0].ids[i]);
  }

  for (let i in matchDetailMatch.teams[1].ids) {
    appendSummaryRow("red", matchDetailMatch.teams[1].ids[i]);
    appendDetailHeader('red', matchDetailMatch.teams[1].ids[i]);
    appendTalentRow('red', matchDetailMatch.teams[1].ids[i]);
  }

  $('#match-detail-summary table').tablesort();
  $('#match-detail-talents .tiny.image').popup();
}

function appendSummaryRow(color, id) {
  let data = matchDetailPlayers[id];

  let context = {};
  context.teamColor = color;
  context.heroName = data.hero;
  context.heroImg = Heroes.heroIcon(data.hero);
  context.playerID = id;
  context.playerName = data.name;
  context.kills = data.gameStats.SoloKill;
  context.gameStats = data.gameStats;

  $('#match-detail-summary table tbody').append(matchSummaryRowTemplate(context));
}

function appendDetailHeader(color, id) {
  let data = matchDetailPlayers[id];
  let context = {};
  context.heroName = data.hero;
  context.playerID = id;
  context.playerName = data.name;
  context.teamColor = color;
  context.heroImg = Heroes.heroIcon(data.hero);

  $('#match-detail-details table thead tr').append(matchDetailHeaderTemplate(context));
}

function loadDetailedStats() {
  // full list is detail list + map specifics
  let list = DetailStatList.concat(PerMapStatList[matchDetailMatch.map]);

  for (let i in list) {
    appendDetailRow(list[i]);
  }

  $('#match-detail-details table').floatThead({
    scrollContainer: function($table) {
      return $('#match-detail-details');
    },
    autoReflow: true
  });
  $('#match-detail-details table').floatThead('reflow');
}

function appendDetailRow(field) {
  // kinda sucks but have to iterate through the teams and stuff in order
  let context = {};
  context.fieldName = DetailStatString[field];
  context.stats = [];

  for (let i in matchDetailMatch.teams[0].ids) {
    let p = matchDetailPlayers[matchDetailMatch.teams[0].ids[i]];

    context.stats.push(formatStat(field, p.gameStats[field]));
  }

  for (let i in matchDetailMatch.teams[1].ids) {
    let p = matchDetailPlayers[matchDetailMatch.teams[1].ids[i]];

    context.stats.push(formatStat(field, p.gameStats[field]));
  }

  $('#match-detail-details table tbody').append(matchDetailRowTemplate(context));
}

function appendTalentRow(color, id) {
  let data = matchDetailPlayers[id];

  let titleContext = {};
  titleContext.teamColor = color;
  titleContext.playerID = id;
  titleContext.heroImg = Heroes.heroIcon(data.hero);
  titleContext.heroName = data.hero;
  titleContext.playerName = data.name;

  let row = $(matchTalentRowTitleTemplate(titleContext));

  let keys = Object.keys(data.talents);
  for (let i = 0; i < 7; i++) {
    // this should theoretically be in order
    let context = {};

    if (i < keys.length) {
      context.img = Heroes.talentIcon(data.talents[keys[i]]);
      context.description = Heroes.talentDesc(data.talents[keys[i]]);
      context.name = Heroes.talentName(data.talents[keys[i]]);
      row.append(matchTalentRowCellTemplate(context));
    }
    else {
      row.append('<td></td>');
    }
  }

  $('#match-detail-talents table tbody').append(row);
}