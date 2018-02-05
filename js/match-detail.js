var matchDetailMatch;
var matchDetailPlayers;
var matchSummaryRowTemplate;
var matchDetailHeaderTemplate;
var matchDetailRowTemplate;
const matchDetailRowTemplateSrc = '<tr class="center aligned"><td>{{fieldName}}</td>{{#each stats}}<td>{{this}}</td>{{/each}}</tr>';
var matchTalentRowTitleTemplate;
var matchTalentRowCellTemplate;
var matchChatEntryTemplate;
var matchTauntEntryTemplate;
var overallXPGraph, overallXPGraphData;
var blueTeamXPGraph, blueTeamXPGraphData;
var redTeamXPGraph, redTeamXPGraphData;
const xpBreakdownOpts = {
  responsive: true,
  tooltips: {
    position: 'nearest',
    mode: 'index',
    intersect: false
  },
  legend: {
    labels: {
      fontColor: 'white'
    }
  },
  scales: {
    yAxes: [{
      stacked: true,
      ticks: {
        fontColor: '#FFFFFF'
      }
    }],
    xAxes: [{
      ticks: {
        fontColor: '#FFFFFF'
      }
    }]
  }
}


function initMatchDetailPage() {
  $('#match-detail-submenu .item').tab();

  // templates
  matchSummaryRowTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-summary-row-template').find('tr')[0].outerHTML);
  matchDetailHeaderTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-detail-header').find('th')[0].outerHTML);
  matchDetailRowTemplate = Handlebars.compile(matchDetailRowTemplateSrc);
  matchTalentRowTitleTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-talents-row-title-template').find('tr')[0].outerHTML);
  matchTalentRowCellTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-talents-row-cell-template').find('td')[0].outerHTML);
  matchChatEntryTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-chat-log-entry').find('div.event')[0].outerHTML);
  matchTauntEntryTemplate = Handlebars.compile(getTemplate('match-detail', '#match-detail-taunt-entry').find('tr')[0].outerHTML);

  $('#match-detail-taunt-table').tablesort();
  $('#match-detail-taunt-table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });
  $('#player-hero-detail-stats table th.time-sort').data('sortBy', function(th, td, tablesort) {
    return parseInt(td.attr('data-sort-value'));
  });

  $('#match-detail-body a[data-tab="details"]').click(function() {
    $('#match-detail-details table').floatThead('reflow');
  });
  $('#match-detail-body a[data-tab="match-detail-log"]').click(function() {
    $('#match-detail-taunt-table').floatThead('reflow');
  });

  overallXPGraphData = {
    type: 'line',
    data: {
      datasets: [{
        label: 'Blue Team',
        borderColor: '#2185d0',
        backgroundColor: '#2185d0',
        fill: false,
        cubicInterpolationMode: 'monotone'
      }, {
        label: 'Red Team',
        borderColor: '#db2828',
        backgroundColor: '#db2828',
        fill: false,
        cubicInterpolationMode: 'monotone'
      }]
    },
    options: {
      responsive: true,
      tooltips: {
        position: 'nearest',
        mode: 'index',
        intersect: false
      },
      legend: {
        labels: {
          fontColor: 'white'
        }
      },
      scales: {
        yAxes: [{
          ticks: {
            fontColor: '#FFFFFF'
          }
        }],
        xAxes: [{
          ticks: {
            fontColor: '#FFFFFF'
          }
        }]
      }
    }
  }
  redTeamXPGraphData = {
    type: 'line',
    data: {},
    options: xpBreakdownOpts
  };
  blueTeamXPGraphData = {
    type: 'line',
    data: {},
    options: xpBreakdownOpts
  };
  overallXPGraph = new Chart($('#match-detail-overall-xp'), overallXPGraphData);
  redTeamXPGraph = new Chart($('#match-detail-red-xpb'), redTeamXPGraphData);
  blueTeamXPGraph = new Chart($('#match-detail-blue-xpb'), blueTeamXPGraphData);

  // DEBUG - LOAD SPECIFIC MATCH
  loadMatchData("GAvAZDuS5EqWvH3b", function() { console.log("done loading"); });
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
  graphXP();
  
  // load chat
  loadChat();

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

  // bans
  if (matchDetailMatch.mode !== ReplayTypes.GameMode.QuickMatch) {
    $('#match-detail-bans').removeClass('hidden');
    for (let t in matchDetailMatch.bans) {
      let bans = matchDetailMatch.bans[t];
      for (let b in bans) {
        let h = bans[b];
        let slot = t + '-' + h.order;
        let icon = Heroes.heroIcon(Heroes.heroNameFromAttr(h.hero));
        $('div[ban-slot="' + slot + '"] img').attr('src', 'assets/heroes-talents/images/heroes/' + icon);
      }
    }
  }
  else {
    $('#match-detail-bans').addClass('hidden');
  }
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
  context.hasAwardClass = "is-hidden"

  if (data.gameStats.awards.length > 0) {
    let award = Heroes.awardInfo(data.gameStats.awards[0]);
    context.awardImg = award.image;
    context.awardName = award.name;
    context.awardSub = award.subtitle;
    context.hasAwardClass = "";
  }

  $('#match-detail-summary table tbody').append(matchSummaryRowTemplate(context));
  $('#match-detail-summary table .image').popup();
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

function loadChat() {
  // loads the chat and the taunts really
  $('#match-detail-chat').html('');
  $('#match-detail-taunt-table tbody').html('');

  for (let m in matchDetailMatch.messages) {
    let msg = matchDetailMatch.messages[m];
    if ('text' in msg) {
      let context = { message: msg.text };
      context.time = formatSeconds(msg.time);
      
      if (msg.player in matchDetailPlayers) {
        context.playerName = matchDetailPlayers[msg.player].name;
        context.showImg = '';
        context.heroImg = Heroes.heroIcon(matchDetailPlayers[msg.player].hero);
      }
      else {
        context.showImg = 'is-hidden';
        context.playerName = msg.player;
      }

      $('#match-detail-chat').append(matchChatEntryTemplate(context));
    }
  }

  for (let p in matchDetailPlayers) {
    let player = matchDetailPlayers[p];

    for (let t in player.bsteps) {
      addTauntEntry('Bstep', player, player.bsteps[t]);
    }
    for (let t in player.dances) {
      addTauntEntry('Dance', player, player.dances[t]);
    }
    for (let t in player.sprays) {
      addTauntEntry('Spray', player, player.sprays[t]);
    }
    for (let t in player.taunts) {
      addTauntEntry('Taunt', player, player.taunts[t]);
    }
    for (let t in player.voiceLines) {
      addTauntEntry('Voice Line', player, player.voiceLines[t]);
    }
  }

  $('#match-detail-taunt-table').floatThead('reflow');
}

function addTauntEntry(type, player, data) {
  let context = {};
  context.name = data.name;
  context.kills = data.kills;
  context.deaths = data.deaths;
  context.type = type;
  context.name = player.name;
  context.loop = data.loop;

  if ('time' in data) {
    context.time = formatSeconds(data.time);
  }
  else {
    context.loop = data.start;
    context.time = formatSeconds(data.start / 16);
  }

  $('#match-detail-taunt-table tbody').append(matchTauntEntryTemplate(context));
}

function graphXP() {
  graphOverallXP();
}

// takes the total of all the xp values 
function graphOverallXP() {
  let team0XP = getTotalXPSet(0);
  let team1XP = getTotalXPSet(1);

  overallXPGraphData.data.datasets[0].data = team0XP.data;
  overallXPGraphData.data.datasets[1].data = team1XP.data;
  overallXPGraphData.data.labels = team0XP.labels;
  overallXPGraph.update();

  let team0xpb = getTeamXPBGraphData(0);
  let team1xpb = getTeamXPBGraphData(1);

  blueTeamXPGraphData.data.datasets = team0xpb.data;
  redTeamXPGraphData.data.datasets = team1xpb.data;
  blueTeamXPGraphData.data.labels = team0xpb.labels;
  redTeamXPGraphData.data.labels = team1xpb.labels;

  blueTeamXPGraph.update();
  redTeamXPGraph.update();
}

function getTotalXPSet(teamID) {
  let data = [0];
  let labels = [0];
  for (let xp in matchDetailMatch.XPBreakdown) {
    let x = matchDetailMatch.XPBreakdown[xp];

    if (x.team === teamID) {
      // we want the total here. 

      // game time is in seconds here, convert to minutes
      labels.push(formatSeconds(x.time));

      let y = x.breakdown.CreepXP + x.breakdown.HeroXP + x.breakdown.MinionXP + x.breakdown.StructureXP + x.breakdown.TrickleXP
      data.push(parseInt(y));
    }
  }

  return {data, labels};
}

function getTeamXPBGraphData(teamID) {
  // order of the categories:
  // - trickle
  // - structure
  // - creep
  // - minion
  // - hero
  let labels = [0];
  let data = [{
    label: 'Trickle XP',
    borderColor: '#264653',
    backgroundColor: '#264653',
    cubicInterpolationMode: 'monotone',
    data: [0]
  }, {
    label: 'Structure XP',
    borderColor: '#2A9D8F',
    backgroundColor: '#2A9D8F',
    cubicInterpolationMode: 'monotone',
    data: [0]
  }, {
    label: 'Creep XP',
    borderColor: '#E9C46A',
    backgroundColor: '#E9C46A',
    cubicInterpolationMode: 'monotone',
    data: [0]
  }, {
    label: 'Minion XP',
    borderColor: '#F4A261',
    backgroundColor: '#F4A261',
    cubicInterpolationMode: 'monotone',
    data: [0]
  }, {
    label: 'Hero XP',
    borderColor: '#E76F51',
    backgroundColor: '#E76F51',
    cubicInterpolationMode: 'monotone',
    data: [0]
  }];

  for (let xp in matchDetailMatch.XPBreakdown) {
    let x = matchDetailMatch.XPBreakdown[xp];

    if (x.team === teamID) {
      let runningTotal = x.breakdown.TrickleXP;
      data[0].data.push(x.breakdown.TrickleXP);
      runningTotal += x.breakdown.StructureXP;
      data[1].data.push(x.breakdown.StructureXP);
      runningTotal += x.breakdown.CreepXP;
      data[2].data.push(x.breakdown.CreepXP);
      runningTotal += x.breakdown.MinionXP;
      data[3].data.push(x.breakdown.MinionXP);
      runningTotal += x.breakdown.HeroXP;
      data[4].data.push(x.breakdown.HeroXP);
      labels.push(formatSeconds(x.time));
    }
  }

  return {data, labels};
}