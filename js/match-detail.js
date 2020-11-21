var matchDetailMatch;
var matchDetailPlayers;
var matchSummaryRowTemplate;
var matchDetailHeaderTemplate;
var matchDetailRowTemplate;
const matchDetailRowTemplateSrc =
  '<tr class="center aligned"><td>{{fieldName}}</td>{{#each stats}}<td>{{this}}</td>{{/each}}</tr>';
var matchTalentRowTitleTemplate;
var matchTalentRowCellTemplate;
var matchChatEntryTemplate;
var matchTauntEntryTemplate;
var overallXPGraph, overallXPGraphData;
var blueTeamXPGraph, blueTeamXPGraphData;
var redTeamXPGraph, redTeamXPGraphData;
var teamXPSoakGraph, teamXPSoakGraphData;
var matchDetailTimeline;
var teamOverallStatGraph, teamOverallStatGraphData;
var teamfightStatGraph, teamfightStatGraphData;
var teamCCGraph, teamCCGraphData;
var timePerTierGraphData, timePerTierGraph;
var heroUptimeGraphData, heroUptimeGraph;
var overallLevelGraphData, overallLevelGraph;
const xpBreakdownOpts = {
  maintainAspectRatio: false,
  responsive: true,
  tooltips: {
    position: 'nearest',
    mode: 'index',
    intersect: false,
    callbacks: {
      title: function (tooltipItem, data) {
        return formatSeconds(tooltipItem[0].xLabel);
      },
    },
  },
  legend: {
    labels: {
      fontColor: 'white',
    },
  },
  scales: {
    yAxes: [
      {
        stacked: true,
        ticks: {
          fontColor: '#FFFFFF',
        },
        gridLines: {
          color: '#ababab',
        },
      },
    ],
    xAxes: [
      {
        ticks: {
          fontColor: '#FFFFFF',
          callback: function (value, index, values) {
            return formatSeconds(value);
          },
          stepSize: 60,
        },
        type: 'linear',
        gridLines: {
          color: '#ababab',
        },
      },
    ],
  },
};
const xpSoakOpts = {
  maintainAspectRatio: false,
  responsive: true,
  tooltips: {
    position: 'nearest',
    mode: 'x',
    intersect: false,
    callbacks: {
      title: function (tooltipItem, data) {
        return formatSeconds(tooltipItem[0].xLabel);
      },
    },
  },
  legend: {
    labels: {
      fontColor: 'white',
    },
  },
  scales: {
    yAxes: [
      {
        stacked: false,
        ticks: {
          fontColor: '#FFFFFF',
        },
        gridLines: {
          color: '#ababab',
        },
      },
    ],
    xAxes: [
      {
        ticks: {
          fontColor: '#FFFFFF',
          callback: function (value, index, values) {
            return formatSeconds(value);
          },
          stepSize: 60,
        },
        type: 'linear',
        gridLines: {
          color: '#ababab',
        },
      },
    ],
  },
};

overallLevelGraphData = {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Blue Team',
        borderColor: '#2185d0',
        backgroundColor: '#2185d0',
        borderWidth: 4,
        steppedLine: true,
        fill: false,
        cubicInterpolationMode: 'monotone',
      },
      {
        label: 'Red Team',
        borderColor: '#db2828',
        backgroundColor: '#db2828',
        steppedLine: true,
        borderWidth: 4,
        fill: false,
        cubicInterpolationMode: 'monotone',
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      position: 'nearest',
      mode: 'nearest',
      intersect: false,
      callbacks: {
        title: function (tooltipItem, data) {
          return formatSeconds(tooltipItem[0].xLabel);
        },
      },
    },
    legend: {
      labels: {
        fontColor: 'white',
      },
    },
    scales: {
      yAxes: [
        {
          ticks: {
            fontColor: '#FFFFFF',
          },
          gridLines: {
            color: '#ababab',
          },
        },
      ],
      xAxes: [
        {
          ticks: {
            fontColor: '#FFFFFF',
            callback: function (value, index, values) {
              return formatSeconds(value);
            },
            stepSize: 60,
          },
          type: 'linear',
          gridLines: {
            color: '#ababab',
          },
        },
      ],
    },
  },
};

overallXPGraphData = {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Blue Team',
        borderColor: '#2185d0',
        backgroundColor: '#2185d0',
        borderWidth: 4,
        fill: false,
        cubicInterpolationMode: 'monotone',
      },
      {
        label: 'Red Team',
        borderColor: '#db2828',
        backgroundColor: '#db2828',
        borderWidth: 4,
        fill: false,
        cubicInterpolationMode: 'monotone',
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      position: 'nearest',
      mode: 'index',
      intersect: false,
      callbacks: {
        title: function (tooltipItem, data) {
          return formatSeconds(tooltipItem[0].xLabel);
        },
      },
    },
    legend: {
      labels: {
        fontColor: 'white',
      },
    },
    scales: {
      yAxes: [
        {
          ticks: {
            fontColor: '#FFFFFF',
          },
          gridLines: {
            color: '#ababab',
          },
        },
      ],
      xAxes: [
        {
          ticks: {
            fontColor: '#FFFFFF',
            callback: function (value, index, values) {
              return formatSeconds(value);
            },
            stepSize: 60,
          },
          type: 'linear',
          gridLines: {
            color: '#ababab',
          },
        },
      ],
    },
  },
};

var matchDetailTimelineGroups = new vis.DataSet({});
matchDetailTimelineGroups.add([
  {
    id: 1,
    content: 'Takedowns',
    classname: 'timeline-tds',
    visible: true,
  },
  {
    id: 2,
    content: 'Levels',
    classname: 'timeiine-levels',
    visible: true,
  },
  {
    id: 3,
    content: 'Level Advantage',
    classname: 'timeline-level-adv',
    visible: true,
  },
  {
    id: 4,
    content: 'Structures Destroyed',
    classname: 'timeline-structures',
    visible: true,
  },
  {
    id: 5,
    content: 'Objective',
    classname: 'timeline-objective',
    visible: true,
    nestedGroups: [],
  },
  {
    id: 6,
    content: 'Mercenary Captures',
    classname: 'timeline-mercs',
    visible: true,
  },
  {
    id: 7,
    content: 'Mercenary Units',
    classname: 'timeline-merc-units',
    visible: false,
  },
  {
    id: 11,
    content: 'Top Beacon',
    classname: 'braxis-top-beacon',
    visible: false,
  },
  {
    id: 12,
    content: 'Bottom Beacon',
    classname: 'braxis-bot-beacon',
    visible: false,
  },
  {
    id: 13,
    content: 'Moon Shrine',
    classname: 'dragon-moon-shrine',
    visible: false,
  },
  {
    id: 14,
    content: 'Sun Shrine',
    classname: 'dragon-sun-shrine',
    visible: false,
  },
  {
    id: 15,
    content: 'Payload Control',
    classname: 'hanamura-payload',
    visible: false,
  },
  {
    id: 16,
    content: 'Blue Heroes Alive',
    classname: 'blue-hero-uptime',
    visible: true,
  },
  {
    id: 17,
    content: 'Red Heroes Alive',
    classname: 'red-hero-uptime',
    visible: true,
  },
]);

function initMatchDetailPage() {
  $('#match-detail-submenu .item').tab();

  // templates
  matchSummaryRowTemplate = getHandlebars('match-detail', '#match-detail-summary-row-template');
  matchDetailHeaderTemplate = getHandlebars('match-detail', '#match-detail-detail-header');
  matchDetailRowTemplate = Handlebars.compile(matchDetailRowTemplateSrc);
  matchTalentRowTitleTemplate = getHandlebars('match-detail', '#match-detail-talents-row-title-template');
  matchTalentRowCellTemplate = getHandlebars('match-detail', '#match-detail-talents-row-cell-template');
  matchChatEntryTemplate = getHandlebars('match-detail', '#match-detail-chat-log-entry');
  matchTauntEntryTemplate = getHandlebars('match-detail', '#match-detail-taunt-entry');

  $('#match-detail-taunt-table').tablesort();
  $('#match-detail-taunt-table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true,
  });
  $('#player-hero-detail-stats table th.time-sort').data('sortBy', function (th, td, tablesort) {
    return parseInt(td.attr('data-sort-value'));
  });

  $('#match-detail-body a[data-tab="details"]').click(function () {
    $('#match-detail-details table').floatThead('reflow');
  });
  $('#match-detail-body a[data-tab="match-detail-log"]').click(function () {
    $('#match-detail-taunt-table').floatThead('reflow');
  });

  redTeamXPGraphData = {
    type: 'line',
    data: {},
    options: xpBreakdownOpts,
  };
  blueTeamXPGraphData = {
    type: 'line',
    data: {},
    options: xpBreakdownOpts,
  };
  teamXPSoakGraphData = {
    type: 'line',
    data: {},
    options: xpSoakOpts,
  };
  overallXPGraph = new Chart($('#match-detail-overall-xp'), overallXPGraphData);
  redTeamXPGraph = new Chart($('#match-detail-red-xpb'), redTeamXPGraphData);
  blueTeamXPGraph = new Chart($('#match-detail-blue-xpb'), blueTeamXPGraphData);
  teamXPSoakGraph = new Chart($('#match-detail-xp-soak'), teamXPSoakGraphData);
  overallLevelGraph = new Chart($('#match-detail-levels-xp'), overallLevelGraphData);

  initTeamStatGraphs();

  // init buttons
  for (let g of matchDetailTimelineGroups.getIds()) {
    if (matchDetailTimelineGroups.get(g).visible) {
      $('#match-detail-timeline-buttons .button[button-id="' + (g - 1) + '"]').addClass('violet');
    }
  }

  $('#match-detail-timeline-buttons .button').click(function () {
    toggleGroup(parseInt($(this).attr('button-id')));
  });

  $('#match-detail-teams').dropdown({
    action: 'hide',
    onChange: function (value, text, $elem) {
      matchDetailTeamAction(value);
    },
  });

  $('#match-detail-collection').dropdown({
    action: 'hide',
    onChange: matchDetailCollectionAction,
  });

  $('#match-detail-file-menu').dropdown({
    action: 'hide',
    onChange: matchDetailFileAction,
  });

  $('#match-detail-existing-team').modal();
  $('#match-detail-existing-team .team-menu').dropdown({
    fullTextSearch: true,
  });

  // xp graph tabs
  $('#match-detail-xp-graph-menu .item').tab();

  // tags
  $('#match-tags-popup .search.dropdown').dropdown({
    fullTextSearch: true,
    allowAdditions: true,
    onAdd: matchDetailAddTag,
    onRemove: matchDetailRemoveTag,
  });

  $('#match-tags').popup({
    inline: true,
    position: 'bottom left',
    on: 'click',
  });

  $('#match-detail-print-sections .dropdown.search').dropdown();

  $('#match-detail-fix-draft .dropdown.first-pick').dropdown();
  $('#match-detail-fix-draft .dropdown.pick-order').dropdown();
  addHeroMenuOptions($('#match-detail-fix-draft .dropdown.ban-order'));
  $('#match-detail-fix-draft .dropdown.ban-order')
    .find('.menu')
    .append('<div class="item" data-value="none">No Ban</div>');
  $('#match-detail-fix-draft .dropdown.ban-order').dropdown({
    direction: 'upward',
  });

  // DEBUG - LOAD SPECIFIC MATCH
  //loadMatchData("RtTPtP5mHaBoFJW2", function() { console.log("done loading"); });
}

function matchDetailsShowSection() {
  $('#match-detail-teams').removeClass('is-hidden');
  $('#match-detail-collection').removeClass('is-hidden');
  $('#match-detail-file-menu').removeClass('is-hidden');
  $('#match-tags').removeClass('is-hidden');
}

function matchDetailTeamAction(action) {
  if (action === 'new-from-blue' || action === 'new-from-red') {
    // uh maybe it's bad practice (?) but i'm totally stealing existing modals
    $('#team-text-input .header').text('Create New Team');
    $('#team-text-input .input .label').text('Team Name');
    $('#team-text-input input').val('');

    $('#team-text-input')
      .modal({
        onApprove: function () {
          let name = $('#team-text-input input').val();
          let teamID = action === 'new-from-blue' ? 0 : 1;

          addNewTeamFromMatch(teamID, name);
        },
      })
      .modal('show');
  } else if (action === 'add-existing-blue' || action === 'add-existing-red') {
    $('#match-detail-existing-team')
      .modal({
        onApprove: function () {
          let team = $('#match-detail-existing-team .team-menu').dropdown('get value');
          let teamID = action === 'add-existing-blue' ? 0 : 1;
          for (let p in matchDetailMatch.teams[teamID].ids) {
            DB.addPlayerToTeam(team, matchDetailMatch.teams[teamID].ids[p]);
          }
        },
      })
      .modal('show');
  }
}

// retrieves the proper data and then renders to the page
function loadMatchData(id, doneLoadCallback) {
  // this is actually a series of callbacks...
  DB.getMatchesByID([id], function (err, doc) {
    if (doc === []) return;

    matchDetailMatch = doc[0];
    DB.getHeroDataForID(id, function (err, docs) {
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

  populateTagMenu($('#match-tags-popup .search.dropdown'), function () {
    // tags
    let tags = [];
    for (let d of docs) {
      if ('tags' in d) {
        for (let tag of d.tags) {
          if (tags.indexOf(tag) === -1) {
            tags.push(tag);
          }
        }
      }
    }
    $('#match-tags-popup .search.dropdown').dropdown('set exactly', matchDetailMatch.tags);
  });

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
  loadTimeline();

  // summary graphs
  loadTeamStats();

  // non-english hero name check
  for (let h of matchDetailMatch.heroes) {
    if (Heroes.role(h) === '') {
      showMessage(
        'Match Metadata Error',
        "A hero name in this match's metadata is invalid. This only affects the ability to search for a hero in this match on the Matches page. If the missing hero is newly released, the app should update within a few days with talent info and icons.",
        { class: 'negative', sticky: true },
      );
      break;
    }
  }

  $('#match-detail-details').scrollTop(0);
  doneLoadCallback();
  $('#match-detail-details table').floatThead('reflow');
  $('#match-detail-body th').removeClass('sorted ascending descending');
}

function updateBasicInfo() {
  $('#match-detail-map-name').text(matchDetailMatch.map);

  popuplateMatchDetailTeamNameplate(matchDetailMatch._id, 0, matchDetailMatch.teams[0].ids);
  popuplateMatchDetailTeamNameplate(matchDetailMatch._id, 1, matchDetailMatch.teams[1].ids);

  let winnerHeader = $('#match-detail-victor');
  if (matchDetailMatch.winner === 0) {
    winnerHeader.removeClass('red').addClass('blue').text('Blue Team Victory');
  } else {
    winnerHeader.removeClass('blue').addClass('red').text('Red Team Victory');
  }

  $('#match-detail-mode').text(ReplayTypes.GameModeStrings[matchDetailMatch.mode]);
  let d = new Date(matchDetailMatch.date);
  $('#match-detail-date').text(d.toLocaleString('en-US'));
  $('#match-detail-file').text(matchDetailMatch.filename);
  $('#match-detail-blue-level').text(matchDetailMatch.teams[0].level);
  $('#match-detail-red-level').text(matchDetailMatch.teams[1].level);
  $('#match-detail-blue-takedowns').text(matchDetailMatch.teams[0].takedowns);
  $('#match-detail-red-takedowns').text(matchDetailMatch.teams[1].takedowns);
  $('#match-detail-duration').text(formatSeconds(matchDetailMatch.length));

  updateDraft();
}

function updateDraft() {
  // bans
  if (matchDetailMatch.mode !== ReplayTypes.GameMode.QuickMatch) {
    $('#match-detail-draft').removeClass('hidden');

    // ok parser version 2 supports this so we'll go back and make 1 compatible
    let first = 0;
    if ('picks' in matchDetailMatch) first = matchDetailMatch.picks.first;
    else {
      showMessage(
        'Outdated Replay!',
        'Draft Picks have been added to version 0.2.0 but you will need to re-import your replays to see the pick order.',
        { class: 'negative', sticky: true },
      );
    }

    // check which draft version we're viewing
    if (settings.get('matchDetailDraftDisplay') === 'expanded') {
      $('#match-detail-draft .draft-display-compact').addClass('is-hidden');
      $('#match-detail-draft .draft-display-expanded').removeClass('is-hidden');
      $('#match-detail-draft .divider').removeClass('is-hidden');

      // fill in the blanks
      for (let t in matchDetailMatch.bans) {
        let bans = matchDetailMatch.bans[t];
        let team = t === '0' ? 'blue' : 'red';

        for (let b in bans) {
          let h = bans[b];
          let slot = `${team}-${h.order}`;

          if (bans.length > 2 && b === '1') {
            slot += 'a';
          }

          let icon = Heroes.heroIcon(Heroes.heroNameFromAttr(h.hero));
          $(`div[ban-slot="${slot}"] img`).attr('src', `assets/heroes-talents/images/heroes/${icon}`);
        }
      }

      if (
        'picks' in matchDetailMatch &&
        matchDetailMatch.picks[0].length === 5 &&
        matchDetailMatch.picks[1].length === 5
      ) {
        for (let t of [0, 1]) {
          let picks = matchDetailMatch.picks[t];
          let team = t === 0 ? 'blue' : 'red';

          for (let p = 0; p < picks.length; p++) {
            let h = picks[p];
            let slot = `${team}-${p + 1}`;

            let icon = Heroes.heroIcon(h);
            $(`div[pick-slot="${slot}"] img`).attr('src', `assets/heroes-talents/images/heroes/${icon}`);
          }
        }
      } else {
        $('div[pick-slot^="red"] img').attr('src', '');
        $('div[pick-slot^="blue"] img').attr('src', '');

        if ('picks' in matchDetailMatch) {
          showMessage(
            'Missing Draft Data',
            'This replay has corrupted draft data, or was not played in a draft mode (custom game). No draft data is available. You can add draft info using File > Modify Draft...',
          );
          $('#match-detail-draft').addClass('hidden');
        }
      }

      if (matchDetailMatch.bans[0].length <= 2 || matchDetailMatch.bans[1].length <= 2) {
        $('div[ban-slot="blue-1a"]').addClass('is-hidden');
        $('div[ban-slot="red-1a"]').addClass('is-hidden');
      } else {
        $('div[ban-slot="blue-1a"]').removeClass('is-hidden');
        $('div[ban-slot="red-1a"]').removeClass('is-hidden');
      }

      if (first === 0) {
        $('#match-detail-draft .blue-team-draft').removeClass('first second').addClass('first');
        $('#match-detail-draft .red-team-draft').removeClass('first second').addClass('second');
      } else {
        $('#match-detail-draft .blue-team-draft').removeClass('first second').addClass('second');
        $('#match-detail-draft .red-team-draft').removeClass('first second').addClass('first');
      }
    } else {
      $('#match-detail-draft .draft-display-compact').removeClass('is-hidden');
      $('#match-detail-draft .draft-display-expanded').addClass('is-hidden');
      $('#match-detail-draft .divider').addClass('is-hidden');

      for (let t in matchDetailMatch.bans) {
        let bans = matchDetailMatch.bans[t];
        for (let b in bans) {
          let h = bans[b];
          let slot = (parseInt(t) === first ? 'first' : 'second') + '-' + h.order;

          if (bans.length > 2 && b === '1') {
            slot += 'a';
          }

          let icon = Heroes.heroIcon(Heroes.heroNameFromAttr(h.hero));
          $('div[ban-slot="' + slot + '"] img').attr('src', 'assets/heroes-talents/images/heroes/' + icon);
        }
      }

      if (
        'picks' in matchDetailMatch &&
        matchDetailMatch.picks[0].length === 5 &&
        matchDetailMatch.picks[1].length === 5
      ) {
        for (let t in [0, 1]) {
          let picks = matchDetailMatch.picks[t];
          for (let p = 0; p < picks.length; p++) {
            let h = picks[p];
            let slot = (parseInt(t) === first ? 'first' : 'second') + '-' + (p + 1);
            let icon = Heroes.heroIcon(h);
            $('div[pick-slot="' + slot + '"] img').attr('src', 'assets/heroes-talents/images/heroes/' + icon);
          }
        }
      } else {
        $('div[pick-slot^="first"] img').attr('src', '');
        $('div[pick-slot^="second"] img').attr('src', '');

        if ('picks' in matchDetailMatch) {
          showMessage(
            'Missing Draft Data',
            'This replay has corrupted draft data, or was not played in a draft mode (custom game). No draft data is available.',
          );
          $('#match-detail-draft').addClass('hidden');
        }
      }

      let firstClass = first === 0 ? 'blue' : 'red';
      let secondClass = first === 0 ? 'red' : 'blue';

      $('div[pick-slot^="first"]').removeClass(secondClass).addClass(firstClass);
      $('div[pick-slot^="first"] .label').removeClass(secondClass).addClass(firstClass);
      $('div[pick-slot^="second"]').removeClass(firstClass).addClass(secondClass);
      $('div[pick-slot^="second"] .label').removeClass(firstClass).addClass(secondClass);
      $('div[ban-slot^="first"]').removeClass(secondClass).addClass(firstClass);
      $('div[ban-slot^="first"] .label').removeClass(secondClass).addClass(firstClass);
      $('div[ban-slot^="second"]').removeClass(firstClass).addClass(secondClass);
      $('div[ban-slot^="second"] .label').removeClass(firstClass).addClass(secondClass);

      if (matchDetailMatch.bans[0].length <= 2 || matchDetailMatch.bans[1].length <= 2) {
        $('div[ban-slot="first-1a"]').addClass('is-hidden');
        $('div[ban-slot="second-1a"]').addClass('is-hidden');
      } else {
        $('div[ban-slot="first-1a"]').removeClass('is-hidden');
        $('div[ban-slot="second-1a"]').removeClass('is-hidden');
      }
    }
  } else {
    $('#match-detail-draft').addClass('hidden');
  }
}

function popuplateMatchDetailTeamNameplate(matchID, teamID, players) {
  let elem = (teamID === 0 ? '.blue' : '.red') + '-team';
  elem = `.match-detail-team-names ${elem}`;
  $('#match-detail-summary').find(elem).text('');

  DB.getTeamByPlayers(players, function (err, docs) {
    if (docs.length > 0) {
      // take first team found, not room for all
      let team = docs[0];
      $('#match-detail-summary').find(elem).text(team.name);
      $('#match-detail-summary .match-detail-team-names').removeClass('is-hidden');
    } else {
      $('#match-detail-summary .match-detail-team-names').addClass('is-hidden');
    }
  });
}

function loadPlayers() {
  $('#match-detail-summary tbody').html('');
  $('#match-detail-details table').floatThead('destroy');
  $('#match-detail-details thead').html('<tr><th class="corner"></th></tr>');
  $('#match-detail-details tbody').html('');
  $('#match-detail-talents tbody').html('');

  for (let i in matchDetailMatch.teams[0].ids) {
    appendSummaryRow('blue', matchDetailMatch.teams[0].ids[i]);
    appendDetailHeader('blue', matchDetailMatch.teams[0].ids[i]);
    appendTalentRow('blue', matchDetailMatch.teams[0].ids[i]);
  }

  for (let i in matchDetailMatch.teams[1].ids) {
    appendSummaryRow('red', matchDetailMatch.teams[1].ids[i]);
    appendDetailHeader('red', matchDetailMatch.teams[1].ids[i]);
    appendTalentRow('red', matchDetailMatch.teams[1].ids[i]);
  }

  $('#match-detail-summary table').tablesort();
  $('#match-detail-talents .tiny.image').popup();

  // links to profiles
  $('#match-detail-page-content .player-name').click(function () {
    showPlayerProfile($(this).attr('playerID'));
  });
}

function appendSummaryRow(color, id) {
  let data = matchDetailPlayers[id];

  let context = {};
  context.teamColor = color;
  context.heroName = data.hero;
  context.playerID = id;
  context.playerName = data.name + (data.tag ? '#' + data.tag : '');
  context.kills = data.gameStats.SoloKill;
  context.gameStats = data.gameStats;
  context.hasAwardClass = 'is-hidden';
  context.format = {};

  for (let s in context.gameStats) {
    context.format[s] = formatStat(s, context.gameStats[s]);
  }

  if (data.gameStats.awards.length > 0) {
    let award = Heroes.awardInfo(data.gameStats.awards[0]);
    context.awardImg = award.image;
    context.awardName = award.name;
    context.awardSub = award.subtitle;
    context.hasAwardClass = '';
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

  $('#match-detail-details table thead tr').append(matchDetailHeaderTemplate(context));
}

function loadDetailedStats() {
  // full list is detail list + map specifics
  let list = DetailStatList.concat(PerMapStatList[matchDetailMatch.map]);

  for (let i in list) {
    appendDetailRow(list[i]);
  }

  $('#match-detail-details table').floatThead({
    scrollContainer: function ($table) {
      return $('#match-detail-details');
    },
    autoReflow: true,
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

    // forgot this isn't a default field
    if (field === 'timeDeadPct') {
      p.gameStats[field] = p.gameStats['TimeSpentDead'] / matchDetailMatch.length;
    }

    context.stats.push(formatStat(field, p.gameStats[field], true));
  }

  for (let i in matchDetailMatch.teams[1].ids) {
    let p = matchDetailPlayers[matchDetailMatch.teams[1].ids[i]];

    // forgot this isn't a default field
    if (field === 'timeDeadPct') {
      p.gameStats[field] = p.gameStats['TimeSpentDead'] / matchDetailMatch.length;
    }

    context.stats.push(formatStat(field, p.gameStats[field], true));
  }

  $('#match-detail-details table tbody').append(matchDetailRowTemplate(context));
}

function appendTalentRow(color, id) {
  let data = matchDetailPlayers[id];

  let titleContext = {};
  titleContext.teamColor = color;
  titleContext.playerID = id;
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
    } else {
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
        context.heroName = matchDetailPlayers[msg.player].hero;
        context.showImg = '';
      } else {
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
  } else {
    context.loop = data.start;
    context.time = formatSeconds(data.start / 16);
  }

  $('#match-detail-taunt-table tbody').append(matchTauntEntryTemplate(context));
}

// takes the total of all the xp values
function graphXP() {
  let team0XP = getTotalXPSet(0);
  let team1XP = getTotalXPSet(1);
  let graphXMax = team0XP[team0XP.length - 1].x;

  overallXPGraphData.data.datasets[0].data = team0XP;
  overallXPGraphData.data.datasets[1].data = team1XP;
  overallXPGraphData.options.scales.xAxes[0].ticks.max = graphXMax;
  overallXPGraph.update();

  let team0Levels = getLevelsXPSet(0);
  let team1Levels = getLevelsXPSet(1);
  overallLevelGraphData.data.datasets[0].data = team0Levels;
  overallLevelGraphData.data.datasets[1].data = team1Levels;
  overallLevelGraphData.options.scales.xAxes[0].ticks.max = graphXMax;
  overallLevelGraph.update();

  let team0xpb = getTeamXPBGraphData(0);
  let team1xpb = getTeamXPBGraphData(1);

  blueTeamXPGraphData.data.datasets = team0xpb;
  redTeamXPGraphData.data.datasets = team1xpb;
  blueTeamXPGraphData.options.scales.xAxes[0].ticks.max = graphXMax;
  redTeamXPGraphData.options.scales.xAxes[0].ticks.max = graphXMax;

  let maxXp = Math.max(team0XP[team0XP.length - 1].y, team1XP[team1XP.length - 1].y);
  maxXp = Math.ceil(maxXp / 10000) * 10000;
  blueTeamXPGraphData.options.scales.yAxes[0].ticks.max = maxXp;
  redTeamXPGraphData.options.scales.yAxes[0].ticks.max = maxXp;

  blueTeamXPGraph.update();
  redTeamXPGraph.update();

  teamXPSoakGraphData.data.datasets = getTeamXPSoakData();
  teamXPSoakGraphData.options.scales.xAxes[0].ticks.max = graphXMax;
  teamXPSoakGraph.update();
}

function getTotalXPSet(teamID) {
  let data = [{ x: 0, y: 0 }];
  for (let xp in matchDetailMatch.XPBreakdown) {
    let x = matchDetailMatch.XPBreakdown[xp];

    if (x.team === teamID) {
      // we want the total here.
      let y =
        x.breakdown.CreepXP +
        x.breakdown.HeroXP +
        x.breakdown.MinionXP +
        x.breakdown.StructureXP +
        x.breakdown.TrickleXP;
      data.push({ x: x.time, y: parseInt(y) });
    }
  }

  return data;
}

function getLevelsXPSet(teamID) {
  let data = [{ x: 0, y: 1 }];

  let levels = matchDetailMatch.levelTimes[teamID];
  for (let l in levels) {
    let level = levels[l];
    if (level.level === 1) continue;

    data.push({ x: level.time, y: level.level });
  }

  data.push({ x: matchDetailMatch.length, y: matchDetailMatch.teams[teamID].level });

  return data;
}

function getTeamXPBGraphData(teamID) {
  // order of the categories:
  // - trickle
  // - structure
  // - creep
  // - minion
  // - hero
  let data = [
    {
      label: 'Trickle XP',
      borderColor: '#264653',
      backgroundColor: '#264653',
      cubicInterpolationMode: 'monotone',
      data: [{ x: 0, y: 0 }],
    },
    {
      label: 'Structure XP',
      borderColor: '#2A9D8F',
      backgroundColor: '#2A9D8F',
      cubicInterpolationMode: 'monotone',
      data: [{ x: 0, y: 0 }],
    },
    {
      label: 'Creep XP',
      borderColor: '#E9C46A',
      backgroundColor: '#E9C46A',
      cubicInterpolationMode: 'monotone',
      data: [{ x: 0, y: 0 }],
    },
    {
      label: 'Minion XP',
      borderColor: '#F4A261',
      backgroundColor: '#F4A261',
      cubicInterpolationMode: 'monotone',
      data: [{ x: 0, y: 0 }],
    },
    {
      label: 'Hero XP',
      borderColor: '#E76F51',
      backgroundColor: '#E76F51',
      cubicInterpolationMode: 'monotone',
      data: [{ x: 0, y: 0 }],
    },
  ];

  for (let xp in matchDetailMatch.XPBreakdown) {
    let x = matchDetailMatch.XPBreakdown[xp];

    if (x.team === teamID) {
      data[0].data.push({ y: parseInt(x.breakdown.TrickleXP), x: x.time });
      data[1].data.push({ y: parseInt(x.breakdown.StructureXP), x: x.time });
      data[2].data.push({ y: parseInt(x.breakdown.CreepXP), x: x.time });
      data[3].data.push({ y: parseInt(x.breakdown.MinionXP), x: x.time });
      data[4].data.push({ y: parseInt(x.breakdown.HeroXP), x: x.time });
    }
  }

  return data;
}

function getTeamXPSoakData() {
  let labels = [0];
  let data = [
    {
      label: 'Maximum Possible Minion XP',
      fill: false,
      borderColor: '#E9C46A',
      backgroundColor: '#E9C46A',
      cubicInterpolationMode: 'monotone',
      steppedLine: true,
      data: [],
    },
    {
      label: 'Blue Team',
      fill: false,
      borderColor: '#2185d0',
      backgroundColor: '#2185d0',
      lineTension: 0,
      data: [{ x: 0, y: 0 }],
    },
    {
      label: 'Red Team',
      fill: false,
      borderColor: '#db2828',
      backgroundColor: '#db2828',
      lineTension: 0,
      data: [{ x: 0, y: 0 }],
    },
  ];

  let minionXP = [];
  for (let xp in matchDetailMatch.XPBreakdown) {
    let x = matchDetailMatch.XPBreakdown[xp];

    if (x.team === 0) {
      data[1].data.push({ x: x.time, y: x.breakdown.MinionXP });
      // theoretical minion xp processed later due to some complications
      minionXP.push(x);
    } else if (x.team === 1) {
      data[2].data.push({ x: x.time, y: x.breakdown.MinionXP });
    }
  }

  // scan and adjust minion xp data, is in order now
  for (let i = 0; i < minionXP.length; i++) {
    // not the final breakdown
    // need the diff
    if (i < minionXP.length - 1) {
      let prev = i === 0 ? 0 : minionXP[i - 1].theoreticalMinionXP;
      const delta = minionXP[i].theoreticalMinionXP - prev;
      data[0].data.push({ x: minionXP[i].time - 60, y: minionXP[i].theoreticalMinionXP - delta / 2 });
      data[0].data.push({ x: minionXP[i].time - 30, y: minionXP[i].theoreticalMinionXP });
    } else {
      data[0].data.push({ x: minionXP[i].time, y: minionXP[i].theoreticalMinionXP });
    }
  }

  return data;
}
function getTeamTimePerTier() {
  // huh a stub.
}

function loadTimeline() {
  matchDetailTimelineGroups.off('*');
  $('#match-detail-timeline-wrapper').html('');
  let items = [];

  // takedowns
  for (let t in matchDetailMatch.takedowns) {
    let td = matchDetailMatch.takedowns[t];
    let item = {};

    // the parser doesn't uh, actually store what team the person died is on but
    // it's not too bad to figure out
    if (matchDetailMatch.teams[0].ids.indexOf(td.victim.player) >= 0) {
      item.className = 'red';
    } else {
      item.className = 'blue';
    }

    item.start = td.time;
    item.content = generateTDTimeline(td);
    item.group = 1;
    items.push(item);
  }

  // levels
  let adv = [];
  for (let t in matchDetailMatch.levelTimes) {
    for (let lv in matchDetailMatch.levelTimes[t]) {
      let level = matchDetailMatch.levelTimes[t][lv];
      level.team = t;
      adv.push(level);

      if (level.level === 1) continue;

      let item = {};
      item.className = t === '0' ? 'blue' : 'red';
      item.start = level.time;
      item.content = 'Level ' + level.level;
      item.group = 2;
      items.push(item);
    }

    let keys = Object.keys(matchDetailMatch.levelTimes[t]);
    let last = keys[keys.length - 1];
    adv.push({
      team: t,
      time: matchDetailMatch.length,
      level: matchDetailMatch.levelTimes[t][last].level,
    });
  }

  // level advantage
  // calculate the intervals and the level diff at each interval
  adv.sort(function (a, b) {
    if (a.time === b.time) return 0;
    if (a.time < b.time) return -1;

    return 1;
  });
  let start = 0;
  let currentLevelDiff = 0;
  let blueLevel = 1;
  let redLevel = 1;
  for (let i = 0; i < adv.length; i++) {
    let event = adv[i];

    if (event.team === '0') {
      blueLevel = event.level;
    } else {
      redLevel = event.level;
    }

    let newLevelDiff = blueLevel - redLevel;
    if (newLevelDiff !== currentLevelDiff) {
      // end the previous group
      let item = {};
      item.start = start;
      item.end = event.time;

      if (currentLevelDiff === 0) {
        item.content = '0';
      } else if (currentLevelDiff < 0) {
        // negative means red > blue
        item.content = '+' + Math.abs(currentLevelDiff);
        item.className = 'red';
      } else {
        item.content = '+' + Math.abs(currentLevelDiff);
        item.className = 'blue';
      }

      item.className = item.className + ' level-adv plus' + Math.abs(currentLevelDiff);

      item.type = 'background';
      item.group = 3;
      items.push(item);
      start = event.time;
      currentLevelDiff = newLevelDiff;
    }
  }

  // final levels
  let lastItem = {};
  lastItem.start = start;
  lastItem.end = matchDetailMatch.length;
  let lastLevelDiff = blueLevel - redLevel;
  if (lastLevelDiff === 0) {
    lastItem.content = '0';
  } else if (lastLevelDiff < 0) {
    // negative means red > blue
    lastItem.content = '+' + Math.abs(lastLevelDiff);
    lastItem.className = 'red';
  } else {
    lastItem.content = '+' + Math.abs(lastLevelDiff);
    lastItem.className = 'blue';
  }
  lastItem.className = lastItem.className + ' level-adv plus' + Math.abs(lastLevelDiff);
  lastItem.type = 'background';
  lastItem.group = 3;
  items.push(lastItem);

  // structures
  for (let s in matchDetailMatch.structures) {
    let struct = matchDetailMatch.structures[s];

    if ('destroyed' in struct) {
      let item = {};
      item.start = struct.destroyed;
      item.content = struct.name;
      if (struct.team === 0) {
        item.className = 'red';
      } else {
        item.className = 'blue';
      }
      item.group = 4;
      items.push(item);
    }
  }

  // merc captures;
  for (let m in matchDetailMatch.mercs.captures) {
    let merc = matchDetailMatch.mercs.captures[m];
    let item = {};
    item.start = merc.time;
    item.content = merc.type;

    if (merc.team === 0) {
      item.className = 'blue';
    } else {
      item.className = 'red';
    }

    item.group = 6;
    items.push(item);
  }

  // merc units
  for (let m in matchDetailMatch.mercs.units) {
    let merc = matchDetailMatch.mercs.units[m];
    let item = {};
    item.start = merc.time;
    item.end = merc.time + merc.duration;
    item.content = ReplayTypes.MercUnitString[merc.type];
    item.type = 'range';

    if (merc.team === 0) {
      item.className = 'blue';
    } else {
      item.className = 'red';
    }
    item.className += ' merc-unit';

    item.group = 7;
    items.push(item);
  }

  // hero uptime
  // parser v7
  if (matchDetailMatch.teams[0].stats.uptime) {
    for (let t of [0, 1]) {
      const teamUptime = matchDetailMatch.teams[t].stats.uptime;
      const groupID = t === 0 ? 16 : 17;
      const teamClass = t === 0 ? 'blue' : 'red';

      for (let i = 0; i < teamUptime.length; i++) {
        const current = teamUptime[i];

        const item = {
          start: current.time,
          content: `${current.heroes}`,
          type: 'background',
          group: groupID,
          className: `${teamClass} hero-${current.heroes}`,
        };

        if (i + 1 < teamUptime.length) {
          item.end = teamUptime[i + 1].time;
        } else {
          item.end = matchDetailMatch.length;
        }

        items.push(item);
      }
    }
    matchDetailTimelineGroups.update({ id: 16, visible: true });
    matchDetailTimelineGroups.update({ id: 17, visible: true });
    matchDetailTimelineGroups.update({ id: 3, nestedGroups: [16, 17] });
  } else {
    matchDetailTimelineGroups.update({ id: 16, visible: false });
    matchDetailTimelineGroups.update({ id: 17, visible: false });
    matchDetailTimelineGroups.update({ id: 3, nestedGroups: null });
  }

  // group config
  matchDetailTimelineGroups.update({ id: 11, visible: false });
  matchDetailTimelineGroups.update({ id: 12, visible: false });
  matchDetailTimelineGroups.update({ id: 13, visible: false });
  matchDetailTimelineGroups.update({ id: 14, visible: false });
  matchDetailTimelineGroups.update({ id: 5, nestedGroups: null });

  // objectives...
  if (matchDetailMatch.map === ReplayTypes.MapType.ControlPoints) {
    getSkyTempleEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.TowersOfDoom) {
    getTowersEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.HauntedMines) {
    getMinesEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.BattlefieldOfEternity) {
    getBOEEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.CursedHollow) {
    getCursedEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.DragonShire) {
    getDragonEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.HauntedWoods) {
    getGardenEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.Shrines) {
    getShrinesEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.Crypts) {
    getTombEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.Volskaya) {
    getVolskayaEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType['Warhead Junction']) {
    getWarheadEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.BraxisHoldout) {
    getBraxisEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.AlteracPass) {
    getAlteracEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.Hanamura) {
    getHanamuraEvents(items);
  } else if (matchDetailMatch.map === ReplayTypes.MapType.BlackheartsBay) {
    getBhbEvents(items);
  }

  let opts = {};
  opts.min = 0;
  opts.max = matchDetailMatch.length + 10;
  opts.showMajorLabels = false;
  opts.maxHeight = '100%';
  opts.format = {
    minorLabels: function (date, scale, step) {
      if (date._d < new Date(0)) {
        return formatSeconds(-(1000 - date._d.getUTCMilliseconds()));
      }

      return formatSeconds(date._d.getUTCMilliseconds() + date._d.getUTCSeconds() * 1000);
    },
  };
  opts.onInitialDrawComplete = function () {
    $('.timeline-popup').popup();
  };

  matchDetailTimeline = new vis.Timeline(
    $('#match-detail-timeline-wrapper')[0],
    new vis.DataSet(items),
    matchDetailTimelineGroups,
    opts,
  );
  matchDetailTimeline.on('rangechanged', function (props) {
    $('.timeline-popup').popup();
  });
  matchDetailTimelineGroups.on('update', function () {
    matchDetailTimeline.redraw();
  });
}

function toggleGroup(idx) {
  let elem = $('#match-detail-timeline-buttons .button[button-id="' + idx + '"]');
  if (elem.hasClass('violet')) {
    elem.removeClass('violet');
    matchDetailTimelineGroups.update({ id: idx + 1, visible: false });
  } else {
    elem.addClass('violet');
    matchDetailTimelineGroups.update({ id: idx + 1, visible: true });
  }

  //matchDetailTimeline.setGroups(matchDetailTimelineGroups);
  matchDetailTimeline.redraw();
}

// not a template because i'm kind of lazy? I dunno
function generateTDTimeline(data) {
  let pop = "<h3 class='ui image header'>";
  pop +=
    "<img src='assets/heroes-talents/images/heroes/" +
    Heroes.heroIcon(data.victim.hero) +
    "' class='ui large circular image'>";
  pop += "<div class='content'>" + data.victim.hero + "<div class='sub header player-name'>Killed at ";
  pop += formatSeconds(data.time) + '</div></div></h3>';
  pop += "<h3 class='ui header second'>Killed By</h3>";
  pop += "<div class='ui mini circular images'>";

  for (let a in data.killers) {
    let k = data.killers[a];
    pop += "<img class='ui image' src='assets/heroes-talents/images/heroes/" + Heroes.heroIcon(k.hero) + "'>";
  }
  pop += '</div>';

  let text = '<div class="timeline-popup" data-html="' + pop + '">';
  text +=
    '<img src="assets/heroes-talents/images/heroes/' +
    Heroes.heroIcon(data.victim.hero) +
    '" class="ui circular avatar image">';
  text += data.victim.hero + '</div>';
  return text;
}

function getBraxisEvents(items) {
  for (let w in matchDetailMatch.objective.waves) {
    let wave = matchDetailMatch.objective.waves[w];
    let item0 = {};
    let item1 = {};

    if ('startTime' in wave) {
      item0.start = wave.startTime;
      item1.start = wave.startTime;
      item0.end = wave.endTime[0];
      item1.end = wave.endTime[1];

      item0.className = 'blue';
      item1.className = 'red';

      let t0 = formatStat('pct', wave.startScore[0]) + ' Zerg Wave';
      let t1 = formatStat('pct', wave.startScore[1]) + ' Zerg Wave';

      let pop0 = "<h3 class='ui header'>";
      pop0 +=
        "<div class='content'>" +
        t0 +
        "<div class='sub header'>Spawned at: " +
        formatSeconds(item0.start) +
        ', Duration: ' +
        formatSeconds(item0.end - item0.start);
      pop0 += '</div></div></h3>';

      let pop1 = "<h3 class='ui header'>";
      pop1 +=
        "<div class='content'>" +
        t1 +
        "<div class='sub header'>Spawned at: " +
        formatSeconds(item1.start) +
        ', Duration: ' +
        formatSeconds(item1.end - item1.start);
      pop1 += '</div></div></h3>';

      item0.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop0 + '">' + t0 + '</div>';
      item1.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop1 + '">' + t1 + '</div>';

      item0.group = 5;
      item1.group = 5;

      items.push(item0);
      items.push(item1);

      // spawns
      sitem = {};
      sitem.start = wave.initTime;
      sitem.content = 'Beacons Active';
      sitem.type = 'background';
      sitem.group = 5;
      sitem.end = wave.startTime;
      items.push(sitem);
    }
  }

  for (let i = 0; i < matchDetailMatch.objective.beacons.length; i++) {
    let beacon = matchDetailMatch.objective.beacons[i];

    // only care if team 0 or 1 has it
    if (beacon.team === 0 || beacon.team === 1) {
      let item = {};
      item.start = beacon.time;

      // find end by searching forward until next beacon of same type is found
      let endFound = false;
      for (let j = i + 1; j < matchDetailMatch.objective.beacons.length; j++) {
        let beacon2 = matchDetailMatch.objective.beacons[j];
        if (beacon2.side === beacon.side) {
          // parser only records changes so pick first encountered
          item.end = beacon2.time;
          endFound = true;
          break;
        }
      }

      // if not found game ended
      if (endFound === false) {
        item.end = matchDetailMatch.length;
      }

      item.group = beacon.side === 'top' ? 11 : 12;
      item.className = beacon.team === 0 ? 'blue plus2' : 'red plus2';
      item.type = 'background';
      item.content = '';
      items.push(item);
    }
  }

  // activate groups
  matchDetailTimelineGroups.update({ id: 5, nestedGroups: [11, 12] });
  matchDetailTimelineGroups.update({ id: 11, visible: true });
  matchDetailTimelineGroups.update({ id: 12, visible: true });
}

function getGardenEvents(items) {
  for (let t in matchDetailMatch.objective) {
    for (let i in matchDetailMatch.objective[t].events) {
      let terror = matchDetailMatch.objective[t].events[i];

      let item = {};
      item.start = terror.time;
      item.end = item.start + terror.duration;
      item.className = t === '0' ? 'blue' : 'red';
      item.group = 5;

      let hero = matchDetailMatch.teams[t].heroes[matchDetailMatch.teams[t].ids.indexOf(terror.player)];

      let pop = "<h3 class='ui image header'>";
      pop +=
        "<img src='assets/heroes-talents/images/heroes/" + Heroes.heroIcon(hero) + "' class='ui large circular image'>";
      pop +=
        "<div class='content'>Garden Terror<div class='sub header'>Spawned at: " +
        formatSeconds(item.start) +
        ', Duration: ' +
        formatSeconds(terror.duration);
      pop += '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">';
      item.content +=
        '<img src="assets/heroes-talents/images/heroes/' +
        Heroes.heroIcon(hero) +
        '" class="ui circular avatar image">Garden Terror';
      item.content += '</div>';
      items.push(item);
    }

    // new terror has just plain units
    for (let u in matchDetailMatch.objective[t].units) {
      let unit = matchDetailMatch.objective[t].units[u];

      let item = {};
      item.start = unit.time;
      item.end = unit.end ? unit.end : matchDetailMatch.length;
      item.className = t === '0' ? 'blue' : 'red';
      item.group = 5;

      let pop = "<h3 class='ui header'>";
      pop +=
        "<div class='content'>Garden Terror<div class='sub header'>Spawned at: " +
        formatSeconds(item.start) +
        ', Duration: ' +
        formatSeconds(item.end - item.start);
      pop += '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">Garden Terror</div>';
      items.push(item);
    }
  }
}

function getSkyTempleEvents(items) {
  for (let t in matchDetailMatch.objective) {
    for (let i in matchDetailMatch.objective[t].events) {
      // haha there are so many i bet people will probably turn it off
      let shot = matchDetailMatch.objective[t].events[i];

      let item = {};
      item.start = shot.time;
      item.className = t === '0' ? 'blue' : 'red';
      item.className += ' temple-shot';
      item.group = 5;

      let pop =
        "<h3 class='ui header'><div class='content'>Temple Shot Fired<div class='sub header'>" +
        formatSeconds(item.start);
      pop += ', Damage: ' + shot.damage + '</div></div></h3>';

      item.content =
        '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '"><i class="bullseye icon"></i></div>';
      items.push(item);
    }
  }
}

function getTowersEvents(items) {
  for (let t in ['0', '1']) {
    for (let i in matchDetailMatch.objective[t].events) {
      let altar = matchDetailMatch.objective[t].events[i];

      let item = {};
      item.start = altar.time;
      item.className = t === '0' ? 'blue' : 'red';
      item.group = 5;

      let pop =
        "<h3 class='ui header'><div class='content'>Altar Captured<div class='sub header'>" +
        altar.damage +
        ' Core Damage</div></div></h3>';
      item.content = '<div class="timeline-popup" data-html="' + pop + '">Altar Capture</div>';
      items.push(item);
    }
  }

  // six tower events
  let complete = true;
  let start = 0;
  let team = -1;
  for (let t in matchDetailMatch.objective.sixTowerEvents) {
    let event = matchDetailMatch.objective.sixTowerEvents[t];
    if (event.kind === 'capture') {
      complete = false;
      start = event.time;
      team = event.team;
    } else if (event.kind === 'end') {
      complete = true;
      let item = {};
      item.start = start;
      item.end = event.time;
      item.group = 5;
      item.type = 'background';
      item.className = event.team === 0 ? 'blue' : 'red';
      item.content = (event.team === 0 ? 'Blue' : 'Red') + ' Team All Forts';
      items.push(item);
    }
  }

  if (!complete) {
    let item = {};
    item.start = start;
    item.end = matchDetailMatch.length;
    item.group = 5;
    item.type = 'background';
    item.className = team === 0 ? 'blue' : 'red';
    item.className += ' plus2';
    item.content = 'All Forts';
    items.push(item);
  }
}

function getMinesEvents(items) {
  for (let t in [0, 1]) {
    for (let g in matchDetailMatch.objective[t]) {
      let golem = matchDetailMatch.objective[t][g];
      let item = {};
      item.start = golem.startTime;
      item.end = golem.endTime;
      item.group = 5;
      item.className = golem.team === 0 ? 'blue' : 'red';

      let pop =
        "<h3 class='ui header'><div class='content'>Grave Golem<div class='sub header'>Spawn: " +
        formatSeconds(golem.startTime);
      pop += ', Duration: ' + formatSeconds(golem.duration) + '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">Grave Golem</div>';
      items.push(item);
    }
  }
}

function getBOEEvents(items) {
  for (let i in matchDetailMatch.objective.results) {
    let immo = matchDetailMatch.objective.results[i];

    // two parts: immortal pushing and immortal fight
    let item = {};
    item.start = immo.time;
    item.end = immo.time + immo.immortalDuration;
    item.group = 5;
    item.className = immo.winner === 0 ? 'blue' : 'red';

    let pop = "<h3 class='ui header'><div class='content'>" + formatStat('', immo.power, true) + '% Immortal';
    pop +=
      "<div class='sub header'>Spawn: " +
      formatSeconds(item.start) +
      ', Duration: ' +
      formatSeconds(immo.immortalDuration);
    pop += '</div></div></h3>';

    item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">Immortal</div>';
    items.push(item);

    // bg
    let bitem = {};
    bitem.start = immo.time - immo.duration;
    bitem.end = immo.time;
    bitem.group = 5;
    bitem.content = 'Immortals Active';
    bitem.type = 'background';
    items.push(bitem);
  }
}

function getCursedEvents(items) {
  for (let t in [0, 1]) {
    for (let c in matchDetailMatch.objective[t].events) {
      let trib = matchDetailMatch.objective[t].events[c];

      let item = {};
      item.start = trib.time;
      item.group = 5;
      item.className = t === '0' ? 'blue' : 'red';
      item.content = 'Tribute Captured';
      items.push(item);
    }
  }
}

function getDragonEvents(items) {
  for (let t in [0, 1]) {
    for (let d in matchDetailMatch.objective[t].events) {
      let dragon = matchDetailMatch.objective[t].events[d];

      if (!('duration' in dragon)) dragon.duration = matchDetailMatch.length - dragon.time;

      let item = {};
      item.start = dragon.time;
      item.end = item.start + dragon.duration;
      item.className = t === '0' ? 'blue' : 'red';
      item.group = 5;

      let hero = matchDetailMatch.teams[t].heroes[matchDetailMatch.teams[t].ids.indexOf(dragon.player)];
      let pop = "<h3 class='ui image header'>";
      pop +=
        "<img src='assets/heroes-talents/images/heroes/" + Heroes.heroIcon(hero) + "' class='ui large circular image'>";
      pop +=
        "<div class='content'>Dragon Knight<div class='sub header'>Spawned at: " +
        formatSeconds(item.start) +
        ', Duration: ' +
        formatSeconds(dragon.duration);
      pop += '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">';
      item.content +=
        '<img src="assets/heroes-talents/images/heroes/' +
        Heroes.heroIcon(hero) +
        '" class="ui circular avatar image">Dragon Knight';
      item.content += '</div>';
      items.push(item);
    }
  }

  let moons = matchDetailMatch.objective.shrines.moon;
  let suns = matchDetailMatch.objective.shrines.sun;
  for (let i = 0; i < moons.length; i++) {
    let shrine = moons[i];
    if (shrine.team === -1) continue;

    let item = {};
    item.start = shrine.time;

    if (i + 1 >= moons.length) {
      item.end = matchDetailMatch.length;
    } else {
      item.end = moons[i + 1].time;
    }

    item.className = shrine.team === 0 ? 'blue plus2' : 'red plus2';
    item.group = 13;
    item.content = '';
    item.type = 'background';
    items.push(item);
  }

  for (let i = 0; i < suns.length; i++) {
    let shrine = suns[i];
    if (shrine.team === -1) continue;

    let item = {};
    item.start = shrine.time;

    if (i + 1 >= suns.length) {
      item.end = matchDetailMatch.length;
    } else {
      item.end = suns[i + 1].time;
    }

    item.className = shrine.team === 0 ? 'blue plus2' : 'red plus2';
    item.group = 14;
    item.content = '';
    item.type = 'background';
    items.push(item);
  }

  matchDetailTimelineGroups.update({ id: 5, nestedGroups: [13, 14] });
  matchDetailTimelineGroups.update({ id: 13, visible: true });
  matchDetailTimelineGroups.update({ id: 14, visible: true });
}

function getShrinesEvents(items) {
  for (let s in matchDetailMatch.objective.shrines) {
    // there are two types of events here
    // this one details when the shrine was won
    let shrine = matchDetailMatch.objective.shrines[s];
    let item = {};
    item.start = shrine.time;
    item.className = shrine.team === 0 ? 'blue' : 'red';
    item.group = 5;

    let pop = "<h3 class='ui header'><div class='content'>Shrine Cleared";
    pop += "<div class='sub header'>Blue: " + shrine.team0Score + ', Red: ' + shrine.team1Score;
    pop += '</div></div></h3>';

    item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">Shrine Cleared</div>';
    items.push(item);
  }

  // then the actual punisher stats
  for (let t in [0, 1]) {
    for (let p in matchDetailMatch.objective[t].events) {
      let punisher = matchDetailMatch.objective[t].events[p];

      let item = {};
      item.start = punisher.time - punisher.duration;
      item.end = punisher.time;
      item.className = t === '0' ? 'blue' : 'red';
      item.group = 5;

      let pop =
        "<h3 class='ui header'><div class='content'>" + punisher.type.substr(0, punisher.type.length - 6) + ' Punisher';
      pop +=
        "<div class='sub header'>Spawn: " +
        formatSeconds(item.start) +
        ', Duration: ' +
        formatSeconds(punisher.duration);
      pop += '</div></div></h3>';
      pop +=
        '<p>Siege Damage: ' +
        parseInt(punisher.siegeDamage) +
        '<br>Hero Damage: ' +
        parseInt(punisher.heroDamage) +
        '</p>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">';
      item.content += punisher.type.substr(0, punisher.type.length - 6) + ' Punisher</div>';
      items.push(item);
    }
  }
}

function getTombEvents(items) {
  for (let t in [0, 1]) {
    for (let s in matchDetailMatch.objective[t].events) {
      let spider = matchDetailMatch.objective[t].events[s];

      let item = {};
      item.start = spider.time;
      item.end = spider.end;
      item.group = 5;
      item.className = spider.team === 0 ? 'blue' : 'red';

      let pop = "<h3 class='ui header'><div class='content'>Webweavers";
      pop +=
        "<div class='sub header'>Spawn: " + formatSeconds(item.start) + ', Duration: ' + formatSeconds(spider.duration);
      pop += '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">Webweavers</div>';
      items.push(item);
    }
  }
}

function getVolskayaEvents(items) {
  for (let t in [0, 1]) {
    for (let p in matchDetailMatch.objective[t].events) {
      let tri = matchDetailMatch.objective[t].events[p];

      let item = {};
      item.start = tri.time;
      item.end = tri.time + tri.duration;
      item.group = 5;
      item.className = tri.team === 0 ? 'blue' : 'red';

      let pop = "<h3 class='ui header'><div class='content'>Triglav";
      pop +=
        "<div class='sub header'>Spawn: " + formatSeconds(item.start) + ', Duration: ' + formatSeconds(tri.duration);
      pop += '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">Triglav</div>';
      items.push(item);
    }
  }
}

function getWarheadEvents(items) {
  for (let t in [0, 1]) {
    for (let w in matchDetailMatch.objective[t].events) {
      let nuke = matchDetailMatch.objective[t].events[w];

      let item = {};
      item.start = nuke.time;
      item.group = 5;
      item.className = nuke.team === 0 ? 'blue' : 'red';

      let hero = matchDetailMatch.teams[t].heroes[matchDetailMatch.teams[t].ids.indexOf(nuke.player)];
      let pop = "<h3 class='ui image header'>";
      pop +=
        "<img src='assets/heroes-talents/images/heroes/" + Heroes.heroIcon(hero) + "' class='ui large circular image'>";
      pop += "<div class='content'>Nuke" + (nuke.success ? '' : ' Attempt') + "<div class='sub header'>";
      pop += 'x: ' + nuke.x + ', y: ' + nuke.y;
      pop += '</div></div></h3>';

      item.content = '<div class="timeline-popup" data-variation="wide" data-html="' + pop + '">';
      item.content +=
        '<img src="assets/heroes-talents/images/heroes/' +
        Heroes.heroIcon(hero) +
        '" class="ui circular avatar image">';
      item.content += 'Nuke' + (nuke.success ? '' : ' Attempt');
      item.content += '</div>';
      items.push(item);
    }
  }
}

function getAlteracEvents(items) {
  for (let t of [0, 1]) {
    for (let cavalry of matchDetailMatch.objective[t].events) {
      const pop = `
        <h3 class='ui header'>
          <div class='content'>Cavalry
            <div class='sub header'>Spawn: ${formatSeconds(cavalry.born)}, Duration: ${formatSeconds(
        cavalry.died - cavalry.born,
      )}</div>
          </div>
        </h3>
      `;

      const content = `<div class="timeline-popup" data-variation="wide" data-html="${pop}">Cavalry</div>`;

      const item = {
        start: cavalry.born,
        group: 5,
        className: t === 0 ? 'blue' : 'red',
        end: cavalry.died,
        content,
      };

      items.push(item);
    }
  }
}

function getBhbEvents(items) {
  for (const t of [0, 1]) {
    if (matchDetailMatch.objective[t]) {
      for (const event of matchDetailMatch.objective[t].events) {
        const pop = `
          <h3 class='ui header'>
            <div class='content'>Coins Turned In
              <div class='sub header'>Time: ${formatSeconds(event.time)}, Cost: ${event.teamScore}</div>
            </div>
          </h3>
        `;

        const content = `<div class="timeline-popup" data-variation="wide" data-html="${pop}">Turnin</div>`;

        const item = {
          start: event.time,
          group: 5,
          className: t === 0 ? 'blue' : 'red',
          content,
        };

        items.push(item);
      }
    }
  }
}

function getHanamuraEvents(items) {
  // first check if there even are any objectives
  if (matchDetailMatch.objective.events) {
    for (let payload of matchDetailMatch.objective.events) {
      // normal items for spawn. Need a neutral color though.
      let item = {};
      item.start = payload.born;
      item.group = 5;
      item.content = `Payload Spawned`;
      items.push(item);

      // winner, if applicable
      if (payload.died) {
        let endItem = {
          start: payload.died,
          className: payload.winner === 0 ? 'blue' : 'red',
          content: `Payload Delivered`,
          group: 5,
        };
        items.push(endItem);
      }

      // ok now the control timings
      for (let i = 0; i < payload.control.length; i++) {
        let current = payload.control[i];

        if (current.team === -1) continue;

        let endTime = payload.died ? payload.died : matchDetailMatch.length;

        if (i + 1 < payload.control.length) {
          let next = payload.control[i + 1];
          endTime = next.time;
        }

        let item = {
          group: 15,
          className: current.team === 0 ? 'blue plus2' : 'red plus2',
          type: 'background',
          content: '',
          start: current.time,
          end: endTime,
        };

        items.push(item);
      }
    }
  }

  matchDetailTimelineGroups.update({ id: 5, nestedGroups: [15] });
  matchDetailTimelineGroups.update({ id: 15, visible: true });
}

function initTeamStatGraphs() {
  // all the graphs are stacked so it's a little weird.
  teamOverallStatGraphData = {
    type: 'horizontalBar',
    data: {
      labels: [
        'Hero Damage',
        'Healing',
        'Self Healing',
        'Protection',
        'Damage Taken',
        'Siege Damage',
        'Minion Damage',
        'Creep Damage',
      ],
    },
    options: {
      tooltips: {
        intersect: true,
        mode: 'point',
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        labels: {
          fontColor: '#FFFFFF',
        },
      },
      scales: {
        xAxes: [
          {
            stacked: true,
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              color: '#ababab',
            },
          },
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  };

  timePerTierGraphData = {
    type: 'bar',
    data: {
      labels: ['Level 1', 'Level 4', 'Level 7', 'Level 10', 'Level 13', 'Level 16'],
    },
    options: {
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            return `${data.datasets[tooltipItem.datasetIndex].label}: ${formatSeconds(tooltipItem.yLabel)}`;
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        labels: {
          fontColor: '#FFFFFF',
        },
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              color: '#ababab',
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#FFFFFF',
              callback: function (value, index, values) {
                return formatSeconds(value);
              },
              stepSize: 60,
              min: 0,
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  };

  heroUptimeGraphData = {
    type: 'bar',
    data: {
      labels: ['0', '1', '2', '3', '4', '5'],
    },
    options: {
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            return `${data.datasets[tooltipItem.datasetIndex].label}: ${formatSeconds(tooltipItem.yLabel)}`;
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        labels: {
          fontColor: '#FFFFFF',
        },
      },
      scales: {
        xAxes: [
          {
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              color: '#ababab',
            },
            scaleLabel: {
              display: true,
              labelString: 'Heroes Alive',
              fontColor: '#FFFFFF',
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              fontColor: '#FFFFFF',
              callback: function (value, index, values) {
                return formatSeconds(value);
              },
              min: 0,
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  };

  teamfightStatGraphData = {
    type: 'horizontalBar',
    data: {
      labels: ['Hero Damage', 'Healing', 'Damage Taken'],
    },
    options: {
      tooltips: {
        intersect: true,
        mode: 'point',
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        labels: {
          fontColor: '#FFFFFF',
        },
      },
      scales: {
        xAxes: [
          {
            stacked: true,
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              color: '#ababab',
            },
          },
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  };

  teamCCGraphData = {
    type: 'horizontalBar',
    data: {
      labels: ['CC', 'Stuns', 'Roots', 'Silences', 'Time Dead'],
    },
    options: {
      tooltips: {
        intersect: true,
        mode: 'point',
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        labels: {
          fontColor: '#FFFFFF',
        },
      },
      scales: {
        xAxes: [
          {
            stacked: true,
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              color: '#ababab',
            },
          },
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              fontColor: '#FFFFFF',
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  };

  teamOverallStatGraph = new Chart($('#match-detail-team-numbers'), teamOverallStatGraphData);
  teamfightStatGraph = new Chart($('#match-detail-teamfight-numbers'), teamfightStatGraphData);
  teamCCGraph = new Chart($('#match-detail-team-cc'), teamCCGraphData);
  timePerTierGraph = new Chart($('#match-detail-time-per-tier'), timePerTierGraphData);
  heroUptimeGraph = new Chart($('#match-detail-hero-uptime'), heroUptimeGraphData);
}

function loadTeamStats() {
  drawTeamStatGraphs();
  updateTeamStats();
}

function drawTeamStatGraphs() {
  teamOverallStatGraphData.data.datasets = [];
  teamfightStatGraphData.data.datasets = [];
  teamCCGraphData.data.datasets = [];
  timePerTierGraphData.data.datasets = [];
  heroUptimeGraphData.data.datasets = [];

  // since it's stacked i can just kinda dump everything in the right plcae hopefully
  var blueCt = 0;
  var redCt = 0;
  let blueColors = ['#021F34', '#093A60', '#125080', '#25699E', '#4486B9'];
  let redColors = ['#230000', '#510000', '#8E0E0E', '#BE2323', '#EB4747'];
  for (let t in matchDetailMatch.teams) {
    for (let i in matchDetailMatch.teams[t].ids) {
      let p = matchDetailPlayers[matchDetailMatch.teams[t].ids[i]];
      let color;
      if (p.team === 0) {
        color = blueColors[blueCt];
        blueCt += 1;
      } else {
        color = redColors[redCt];
        redCt += 1;
      }

      let stack = p.team === 0 ? 'blue' : 'red';

      let teamStat = {
        label: p.hero,
        backgroundColor: color,
        stack,
        data: [
          p.gameStats.HeroDamage,
          p.gameStats.Healing,
          p.gameStats.SelfHealing,
          p.gameStats.ProtectionGivenToAllies,
          p.gameStats.DamageTaken,
          p.gameStats.SiegeDamage,
          p.gameStats.MinionDamage,
          p.gameStats.CreepDamage,
        ],
      };
      teamOverallStatGraphData.data.datasets.push(teamStat);

      let teamfightStat = {
        label: p.hero,
        backgroundColor: color,
        stack,
        data: [p.gameStats.TeamfightHeroDamage, p.gameStats.TeamfightHealingDone, p.gameStats.TeamfightDamageTaken],
      };
      teamfightStatGraphData.data.datasets.push(teamfightStat);

      let ccStat = {
        label: p.hero,
        backgroundColor: color,
        stack,
        data: [
          p.gameStats.TimeCCdEnemyHeroes,
          p.gameStats.TimeStunningEnemyHeroes,
          p.gameStats.TimeRootingEnemyHeroes,
          p.gameStats.TimeSilencingEnemyHeroes,
          p.gameStats.TimeSpentDead,
        ],
      };
      teamCCGraphData.data.datasets.push(ccStat);
    }
  }

  let intervals = [
    [1, 4],
    [4, 7],
    [7, 10],
    [10, 13],
    [13, 16],
    [16, 20],
  ];

  let team0Levels = matchDetailMatch.levelTimes[0];
  let team1Levels = matchDetailMatch.levelTimes[1];
  timePerTierGraphData.data.datasets.push({
    label: 'Blue Team',
    backgroundColor: '#2185d0',
    data: [],
  });
  timePerTierGraphData.data.datasets.push({
    label: 'Red Team',
    backgroundColor: '#db2828',
    data: [],
  });

  heroUptimeGraphData.data.datasets.push({
    label: 'Blue Team',
    backgroundColor: '#2185d0',
    data: [],
  });
  heroUptimeGraphData.data.datasets.push({
    label: 'Red Team',
    backgroundColor: '#db2828',
    data: [],
  });

  for (let i in intervals) {
    let interval = intervals[i];

    if (interval[1] in team0Levels) {
      timePerTierGraphData.data.datasets[0].data.push(team0Levels[interval[1]].time - team0Levels[interval[0]].time);
    } else if (interval[0] in team0Levels && !(interval[1] in team0Levels)) {
      // end of game
      timePerTierGraph.data.datasets[0].data.push(matchDetailMatch.length - team0Levels[interval[0]].time);
    } else {
      timePerTierGraphData.data.datasets[0].data.push(0);
    }

    if (interval[1] in team1Levels) {
      timePerTierGraphData.data.datasets[1].data.push(team1Levels[interval[1]].time - team1Levels[interval[0]].time);
    } else if (interval[0] in team1Levels && !(interval[1] in team1Levels)) {
      // end of game
      timePerTierGraph.data.datasets[1].data.push(matchDetailMatch.length - team1Levels[interval[0]].time);
    } else {
      timePerTierGraphData.data.datasets[1].data.push(0);
    }
  }

  // parser v7 data
  if (matchDetailMatch.teams[0].stats.uptimeHistogram) {
    for (let i = 0; i <= 5; i++) {
      heroUptimeGraphData.data.datasets[0].data.push(matchDetailMatch.teams[0].stats.uptimeHistogram[i]);
      heroUptimeGraphData.data.datasets[1].data.push(matchDetailMatch.teams[1].stats.uptimeHistogram[i]);
    }
  }

  teamOverallStatGraph.update();
  teamfightStatGraph.update();
  teamCCGraph.update();
  timePerTierGraph.update();
  heroUptimeGraph.update();
}

function updateTeamStats() {
  for (let t in [0, 1]) {
    let stats = matchDetailMatch.teams[t].stats;

    let elem = t === '0' ? $('#match-detail-blue-team-stats') : $('#match-detail-red-team-stats');

    // team stats
    renderV7TeamStats(elem, stats);

    updateTeamStat(elem, 'team-kda', formatStat('KDA', stats.KDA));
    updateTeamStat(elem, 'team-ppk', formatStat('KDA', stats.PPK));

    if ('timeTo10' in stats) {
      updateTeamStat(elem, 'team-time-to-10', formatSeconds(stats.timeTo10));
    } else {
      updateTeamStat(elem, 'team-time-to-10', '-');
    }

    if ('timeTo20' in stats) {
      updateTeamStat(elem, 'team-time-to-20', formatSeconds(stats.timeTo20));
    } else {
      updateTeamStat(elem, 'team-time-to-20', '-');
    }

    // mercs
    updateTeamStat(elem, 'merc-capture', stats.mercCaptures);
    updateTeamStat(elem, 'merc-uptime', formatSeconds(stats.mercUptime));
    updateTeamStat(elem, 'merc-uptime-pct', formatStat('pct', stats.mercUptimePercent));

    updateTeamStat(elem, 'forts-destroyed', stats.structures.Fort.destroyed ? stats.structures.Fort.destroyed : '0');
    updateTeamStat(elem, 'forts-lost', stats.structures.Fort.lost);
    updateTeamStat(
      elem,
      'first-fort',
      stats.structures.Fort.destroyed === 0 ? '-' : formatSeconds(stats.structures.Fort.first),
    );

    if (matchDetailMatch.map === ReplayTypes.MapType.TowersOfDoom) {
      updateTeamStat(elem, 'wells-destroyed', stats.structures['Fort Well'].destroyed);
      updateTeamStat(elem, 'wells-lost', stats.structures['Fort Well'].lost);

      let hideWellTime = stats.structures['Fort Well'].destroyed === 0;
      updateTeamStat(elem, 'first-well', hideWellTime ? '-' : formatSeconds(stats.structures['Fort Well'].first));

      updateTeamStat(elem, 'towers-destroyed', stats.structures['Fort Tower'].destroyed);
      updateTeamStat(elem, 'towers-lost', stats.structures['Fort Tower'].lost);

      let hideTowerTime = stats.structures['Fort Tower'].destroyed === 0;
      updateTeamStat(elem, 'first-tower', hideTowerTime ? '-' : formatSeconds(stats.structures['Fort Tower'].first));

      updateTeamStat(elem, 'keeps-destroyed', '0');
      updateTeamStat(elem, 'keeps-lost', 0);
      updateTeamStat(elem, 'first-keep', '-');
    } else {
      updateTeamStat(elem, 'keeps-destroyed', stats.structures.Keep.destroyed ? stats.structures.Keep.destroyed : '0');
      updateTeamStat(elem, 'keeps-lost', stats.structures.Keep.lost);
      updateTeamStat(
        elem,
        'first-keep',
        stats.structures.Keep.destroyed === 0 ? '-' : formatSeconds(stats.structures.Keep.first),
      );

      updateTeamStat(
        elem,
        'wells-destroyed',
        stats.structures['Fort Well'].destroyed + stats.structures['Keep Well'].destroyed,
      );
      updateTeamStat(elem, 'wells-lost', stats.structures['Fort Well'].lost + stats.structures['Keep Well'].lost);

      let hideWellTime = stats.structures['Fort Well'].destroyed + stats.structures['Keep Well'].destroyed === 0;
      updateTeamStat(
        elem,
        'first-well',
        hideWellTime
          ? '-'
          : formatSeconds(Math.min(stats.structures['Fort Well'].first, stats.structures['Keep Well'].first)),
      );

      updateTeamStat(
        elem,
        'towers-destroyed',
        stats.structures['Fort Tower'].destroyed + stats.structures['Keep Tower'].destroyed,
      );
      updateTeamStat(elem, 'towers-lost', stats.structures['Fort Tower'].lost + stats.structures['Keep Tower'].lost);

      let hideTowerTime = stats.structures['Fort Tower'].destroyed + stats.structures['Keep Tower'].destroyed === 0;
      updateTeamStat(
        elem,
        'first-tower',
        hideTowerTime
          ? '-'
          : formatSeconds(Math.min(stats.structures['Fort Tower'].first, stats.structures['Keep Tower'].first)),
      );
    }
  }
}

function renderV7TeamStats(elem, stats) {
  // check for a single key from the v7 parser output
  if ('aces' in stats) {
    updateTeamStat(elem, 'team-hero-wipes', stats.wipes);
    updateTeamStat(elem, 'team-hero-aces', stats.aces);
    updateTeamStat(elem, 'team-hero-alive', formatStat('avgHeroesAlive', stats.avgHeroesAlive, true));
    updateTeamStat(elem, 'team-hero-time-adv', formatStat('pct', stats.pctWithHeroAdv));
    updateTeamStat(elem, 'team-avg-level-adv', formatStat('avgLevelAdv', stats.avgLevelAdv, true));
    updateTeamStat(elem, 'team-max-level-adv', stats.maxLevelAdv);
    updateTeamStat(elem, 'team-time-level-adv', formatStat('pct', stats.levelAdvPct));
    updateTeamStat(elem, 'team-passive-xp-rate', formatStat('passiveXPRate', stats.passiveXPRate, true));
    updateTeamStat(elem, 'team-passive-xp-diff', formatStat('passiveXPDiff', stats.passiveXPDiff, true));
    updateTeamStat(elem, 'team-passive-xp-total', formatStat('passiveXPGain', stats.passiveXPGain, true));
  }
  // if not present, write empty
  else {
    updateTeamStat(elem, 'team-hero-wipes', '-');
    updateTeamStat(elem, 'team-hero-aces', '-');
    updateTeamStat(elem, 'team-hero-alive', '-');
    updateTeamStat(elem, 'team-hero-time-adv', '-');
    updateTeamStat(elem, 'team-avg-level-adv', '-');
    updateTeamStat(elem, 'team-max-level-adv', '-');
    updateTeamStat(elem, 'team-time-level-adv', '-');
    updateTeamStat(elem, 'team-passive-xp-rate', 20);
    updateTeamStat(elem, 'team-passive-xp-diff', 0);
    updateTeamStat(elem, 'team-passive-xp-total', 0);
  }
}

function updateTeamStat(container, name, value) {
  container.find('.statistic[name="' + name + '"] .value').text(value);
}

function addNewTeamFromMatch(teamID, name) {
  if (matchDetailMatch) {
    DB.addTeam(matchDetailMatch.teams[teamID].ids, name, () => {
      populateTeamMenu($('.team-menu'));
      $('#team-set-team').dropdown('refresh');
    });
  }
}

function matchDetailCollectionAction(value, text, $elem) {
  if (value === 'add') {
    $('#matches-collection-select .header').text('Add Current Match To Collection');
    $('#matches-collection-select p.text').text(
      'Add the current match to the spcified collection. Matches can be added to multiple collections.',
    );

    $('#matches-collection-select')
      .modal({
        onApprove: function () {
          let collectionID = $('#matches-collection-select .collection-menu').dropdown('get value');
          // adding to null collection is not allowed
          if (collectionID === '') return;

          DB.addMatchToCollection(matchDetailMatch._id, collectionID);

          if (collectionID === DB.getCollection()) resetAllSections();
        },
      })
      .modal('show');
  } else if (value === 'remove') {
    $('#matches-collection-select .header').text('Remove Current Match From Collection');
    $('#matches-collection-select p.text').text('Remove the current match from the spcified collection.');

    $('#matches-collection-select')
      .modal({
        onApprove: function () {
          let collectionID = $('#matches-collection-select .collection-menu').dropdown('get value');
          // adding to null collection is not allowed
          if (collectionID === '') return;

          DB.removeMatchFromCollection(matchDetailMatch._id, collectionID);

          if (collectionID === DB.getCollection()) resetAllSections();
        },
      })
      .modal('show');
  }
}

function matchDetailFileAction(value, text, $elem) {
  if (value === 'match') {
    dialog.showSaveDialog(
      {
        title: 'Export Match',
        filters: [{ name: 'JSON', extensions: ['.json'] }],
      },
      function (filename) {
        if (filename) {
          exportMatch(matchDetailMatch._id, filename);
        }
      },
    );
  } else if (value === 'delete') {
    $('#match-detail-confirm-delete-match')
      .modal({
        onApprove: function () {
          DB.deleteReplay(matchDetailMatch._id, function () {
            showMessage('Match Deleted', '');
            getMatchCount();
            selectMatches();
            changeSection('matches');
          });
        },
      })
      .modal('show');
  } else if (value === 'print-all') {
    dialog.showSaveDialog(
      {
        title: 'Print Match Report',
        filters: [{ name: 'pdf', extensions: ['pdf'] }],
      },
      function (filename) {
        if (filename) {
          printMatchDetail(filename, null);
        }
      },
    );
  } else if (value === 'print-sections') {
    $('#match-detail-print-sections')
      .modal({
        onApprove: function () {
          dialog.showSaveDialog(
            {
              title: 'Print Match Report',
              filters: [{ name: 'pdf', extensions: ['pdf'] }],
            },
            function (filename) {
              if (filename) {
                let sections = $('#match-detail-print-sections .ui.dropdown').dropdown('get value').split(',');
                printMatchDetail(filename, sections);
              }
            },
          );
        },
        closable: false,
      })
      .modal('show');
  } else if (value === 'standard') {
    settings.set('matchDetailDraftDisplay', 'standard');
    updateDraft();
  } else if (value === 'expanded') {
    settings.set('matchDetailDraftDisplay', 'expanded');
    updateDraft();
  } else if (value === 'change-draft') {
    showChangeDraftModal();
  }
}

function matchDetailAddTag(tagValue, tagText, $added) {
  DB.tagReplay(matchDetailMatch._id, tagValue, function () {
    console.log('added ' + tagValue + ' to ' + matchDetailMatch._id);

    let vals = $('#match-search-tags').dropdown('get value');
    populateTagMenu($('#match-search-tags'), function () {
      $('#match-search-tags').dropdown('set exactly', vals);
    });
    populateTagMenu($('.filter-widget-tags'));
  });
}

function matchDetailRemoveTag(tagValue, tagText, $removed) {
  DB.untagReplay(matchDetailMatch._id, tagValue, function () {
    console.log('removed ' + tagValue + ' from ' + matchDetailMatch._id);

    let vals = $('#match-search-tags').dropdown('get value');
    populateTagMenu($('#match-search-tags'), function () {
      $('#match-search-tags').dropdown('set exactly', vals);
    });
    populateTagMenu($('.filter-widget-tags'));
  });
}

function layoutMatchDetailPrint(sections) {
  let sects = sections;
  if (!sects) {
    sects = ['summary', 'talents', 'graphs', 'team-stats', 'details', 'xp', 'chat', 'taunts'];
  }

  clearPrintLayout();

  // header is always printed
  $('#print-window .contents').append($('#match-detail-page-header').clone());
  $('#print-window .contents').find('.statistic').addClass('mini');

  if (sects.indexOf('summary') !== -1) {
    addPrintPage('summary');
    copyFloatingTable($('#match-detail-summary'), $('#print-window .summary.page'));

    if (!$('#match-detail-draft').hasClass('is-hidden')) {
      addPrintSubHeader('Draft', 'summary');
      getPrintPage('summary').append($('#match-detail-draft').clone());
      getPrintPage('summary').find('.top.attached.label').remove();
    }
  }

  if (sects.indexOf('talents') !== -1) {
    addPrintPage('talents');
    addPrintSubHeader('Talents', 'talents');
    copyFloatingTable($('#match-detail-talents'), getPrintPage('talents'));
  }

  if (sects.indexOf('team-stats') !== -1) {
    addPrintPage('team-stats');
    addPrintSubHeader('Team Stats', 'team-stats');
    getPrintPage('team-stats').append('<div class="grid"></div>');
    getPrintPage('team-stats').find('.grid').append($('.print-team-stats').clone());
  }

  if (sects.indexOf('graphs') !== -1) {
    addPrintPage('graphs');
    addPrintSubHeader('Stats', 'graphs');

    getPrintPage('graphs').append($('#match-detail-team-numbers').clone());
    copyGraph(teamOverallStatGraphData, $('#print-window #match-detail-team-numbers'), { width: 1650, height: 650 });

    addPrintSubHeader('Teamfight Stats', 'graphs');
    getPrintPage('graphs').append($('#match-detail-teamfight-numbers').clone());
    copyGraph(teamfightStatGraphData, $('#print-window #match-detail-teamfight-numbers'), { width: 1650, height: 300 });

    addPrintSubHeader('CC Stats', 'graphs');
    getPrintPage('graphs').append($('#match-detail-team-cc').clone());
    copyGraph(teamCCGraphData, $('#print-window #match-detail-team-cc'), { width: 1650, height: 375 });
  }

  if (sects.indexOf('details') !== -1) {
    addPrintPage('details');
    addPrintSubHeader('Detailed Stats', 'details');
    copyFloatingTable($('.ui.tab[data-tab="details"] .floatThead-wrapper'), getPrintPage('details'));
  }

  if (sects.indexOf('xp') !== -1) {
    addPrintPage('xp');
    addPrintSubHeader('XP Graphs', 'xp');
    $('#print-window .contents .xp.page').append('<div class="ui two column grid xp-graphs"></div>');

    $('#print-window .xp-graphs').append(
      '<div class="column xp-vs-time"><h3 class="ui dividing header">XP vs Time</h3><canvas></div>',
    );
    copyGraph(overallXPGraphData, $('#print-window .xp-vs-time canvas'), { width: 700, height: 400 });

    $('#print-window .xp-graphs').append(
      '<div class="column levels-vs-time"><h3 class="ui dividing header">Levels vs Time</h3><canvas></div>',
    );
    copyGraph(overallLevelGraphData, $('#print-window .levels-vs-time canvas'), { width: 700, height: 400 });

    $('#print-window .xp-graphs').append(
      '<div class="column blue-xpb"><h3 class="ui dividing header">Blue Team XP Breakdown</h3><canvas></div>',
    );
    copyGraph(blueTeamXPGraphData, $('#print-window .blue-xpb canvas'), { width: 700, height: 400 });

    $('#print-window .xp-graphs').append(
      '<div class="column red-xpb"><h3 class="ui dividing header">Red Team XP Breakdown</h3><canvas></div>',
    );
    copyGraph(redTeamXPGraphData, $('#print-window .red-xpb canvas'), { width: 700, height: 400 });

    addPrintPage('xp2');
    $('#print-window .contents .xp2.page').append('<div class="ui two column grid xp-graphs2"></div>');
    $('#print-window .xp-graphs2').append(
      '<div class="column soak-xp"><h3 class="ui dividing header">XP Soak</h3><canvas></div>',
    );
    copyGraph(teamXPSoakGraphData, $('#print-window .soak-xp canvas'), { width: 700, height: 400 });

    $('#print-window .xp-graphs2').append(
      '<div class="column xp-time"><h3 class="ui dividing header">Time Per Tier</h3><canvas></div>',
    );
    copyGraph(timePerTierGraphData, $('#print-window .xp-time canvas'), { width: 700, height: 400 });
  }

  if (sects.indexOf('chat') !== -1) {
    addPrintPage('chat');
    addPrintSubHeader('Chat Log', 'chat');
    getPrintPage('chat').append('<div class="ui segment chat-log"></div>');
    $('#print-window .chat-log').append($('#match-detail-chat').clone());
  }

  if (sects.indexOf('taunts') !== -1) {
    addPrintPage('taunt');
    addPrintSubHeader('Taunt Log', 'taunt');
    copyFloatingTable($('#match-detail-chat-log .floatThead-wrapper'), getPrintPage('taunt'));
  }

  $('#print-window').removeClass('is-hidden');
}

function printMatchDetail(filename, sections) {
  layoutMatchDetailPrint(sections);
  renderAndPrint(filename, 'Letter', true);
}

function showChangeDraftModal() {
  // if game is qm we should disallow draft edits (it's not a draft queue)
  if (matchDetailMatch.mode === ReplayTypes.GameMode.QuickMatch) {
    showMessage(`Unable to Edit Draft`, 'Quick Match games are a non-draft queue. Draft data cannot be added.', {
      class: 'negative',
    });
    return;
  }

  // reset modal here
  resetDraftModal();

  $('#match-detail-fix-draft')
    .modal({
      onApprove: updateDraftModal,
      closable: false,
    })
    .modal('show');
}

function resetDraftModal() {
  // reset hero picks and bans to current data
  $('#match-detail-fix-draft .first-pick').dropdown('set exactly', matchDetailMatch.picks.first + 1);

  let bluePicks = matchDetailMatch.picks[ReplayTypes.TeamType.Blue];
  let redPicks = matchDetailMatch.picks[ReplayTypes.TeamType.Red];
  if (!matchDetailMatch.picks || matchDetailMatch.picks[0].length === 0 || matchDetailMatch.picks[1].length === 0) {
    bluePicks = matchDetailMatch.teams[ReplayTypes.TeamType.Blue].heroes;
    redPicks = matchDetailMatch.teams[ReplayTypes.TeamType.Red].heroes;
  }

  for (let i = 0; i < bluePicks.length; i++) {
    let elem = $(`#match-detail-fix-draft .blue-${i + 1} .pick-order.dropdown`);
    let elemImg = $(`#match-detail-fix-draft .blue-${i + 1} .draft-pick.image`);

    elem.dropdown('set exactly', i + 1);
    elemImg.attr('src', `assets/heroes-talents/images/heroes/${Heroes.heroIcon(bluePicks[i])}`);
    elemImg.attr('heroName', bluePicks[i]);
  }

  for (let i = 0; i < redPicks.length; i++) {
    let elem = $(`#match-detail-fix-draft .red-${i + 1} .pick-order.dropdown`);
    let elemImg = $(`#match-detail-fix-draft .red-${i + 1} .draft-pick.image`);

    elem.dropdown('set exactly', i + 1);
    elemImg.attr('src', `assets/heroes-talents/images/heroes/${Heroes.heroIcon(redPicks[i])}`);
    elemImg.attr('heroName', redPicks[i]);
  }

  // bans, if they exist. otherwise we just leave it blank/no-ban
  if (matchDetailMatch.bans) {
    for (let t of [ReplayTypes.TeamType.Blue, ReplayTypes.TeamType.Red]) {
      let bans = matchDetailMatch.bans[t];
      let team = t === ReplayTypes.TeamType.Blue ? 'blue' : 'red';

      for (let i = 0; i < bans.length; i++) {
        let elem = $(`#match-detail-fix-draft .${team}-${i + 1} .ban-order.dropdown`);
        if (bans[i].hero !== '') {
          elem.dropdown('set exactly', Heroes.heroNameFromAttr(bans[i].hero));
        } else {
          elem.dropdown('set exactly', 'none');
        }
      }
    }
  } else {
    $(`#match-detail-fix-draft ban-order.dropdown`).dropdown('set exactly', 'none');
  }
}

function updateDraftModal() {
  if (!validateDraftModal()) return false;

  // assuming that returned, collect the new draft data.
  // first pick
  if (!matchDetailMatch.picks) {
    matchDetailMatch.picks = { 0: [], 1: [], first: 0 };
  }

  matchDetailMatch.picks.first = parseInt($('#match-detail-fix-draft .first-pick').dropdown('get value')) - 1;

  // picks
  for (let i = 1; i < 6; i++) {
    let blueVal = $(`#match-detail-fix-draft .blue-${i} .pick-order.dropdown`).dropdown('get value');
    let redVal = $(`#match-detail-fix-draft .red-${i} .pick-order.dropdown`).dropdown('get value');
    let blueHero = $(`#match-detail-fix-draft .blue-${i} .draft-pick`).attr('heroName');
    let redHero = $(`#match-detail-fix-draft .red-${i} .draft-pick`).attr('heroName');

    matchDetailMatch.picks[ReplayTypes.TeamType.Blue][blueVal - 1] = blueHero;
    matchDetailMatch.picks[ReplayTypes.TeamType.Red][redVal - 1] = redHero;
  }

  // bans
  if (!matchDetailMatch.bans) {
    matchDetailMatch.bans = { 0: [], 1: [] };
    // lil annoying
    let banOrders = [1, 1, 2];
    for (let i = 0; i < 3; i++) {
      let order = banOrders[i];
      matchDetailMatch.bans[0].push({ absolute: i, order, hero: '' });
      matchDetailMatch.bans[1].push({ absolute: i, order, hero: '' });
    }
  }

  for (let i = 0; i < 3; i++) {
    let blueBan = $(`#match-detail-fix-draft .blue-${i + 1} .ban-order.dropdown`).dropdown('get value');
    let redBan = $(`#match-detail-fix-draft .red-${i + 1} .ban-order.dropdown`).dropdown('get value');

    if (i < matchDetailMatch.bans[ReplayTypes.TeamType.Blue].length) {
      if (blueBan !== 'none')
        matchDetailMatch.bans[ReplayTypes.TeamType.Blue][i].hero = Heroes._heroes[blueBan].attributeId;
      else matchDetailMatch.bans[ReplayTypes.TeamType.Blue][i].hero = '';

      if (redBan !== 'none')
        matchDetailMatch.bans[ReplayTypes.TeamType.Red][i].hero = Heroes._heroes[redBan].attributeId;
      else matchDetailMatch.bans[ReplayTypes.TeamType.Red][i].hero = '';
    }
  }

  // do a database update
  DB.updateMatchDraft(matchDetailMatch._id, matchDetailMatch.picks, matchDetailMatch.bans, () => {
    updateDraft();
    showMessage('Draft Updated', 'Draft on matches list will update when reloaded.', { class: 'positive' });
    $('#match-detail-fix-draft').modal('hide');
  });

  // this actually always returns false, but will close the modal on a successful update.
  return false;
}

function validateDraftModal() {
  // validates that the draft is in the right order n stuff
  // will highlight the bad parts
  let valid = true;
  $(`#match-detail-fix-draft .pick-order.dropdown`).removeClass('error');

  // check pick
  $('#match-detail-fix-draft .first-pick').removeClass('error');
  let pickVal = $('#match-detail-fix-draft .first-pick').dropdown('get value');

  if (pickVal !== '1' && pickVal !== '2') {
    $('#match-detail-fix-draft .first-pick').addClass('error');
    valid = false;
  }

  // check teams
  let bluePicks = {};
  let redPicks = {};
  for (let i = 1; i < 6; i++) {
    blueVal = $(`#match-detail-fix-draft .blue-${i} .pick-order.dropdown`).dropdown('get value');
    redVal = $(`#match-detail-fix-draft .red-${i} .pick-order.dropdown`).dropdown('get value');

    // duplicates are errors
    if (blueVal in bluePicks) {
      $(`#match-detail-fix-draft .blue-${i} .pick-order.dropdown`).addClass('error');
      $(`#match-detail-fix-draft .blue-${bluePicks[blueVal]} .pick-order.dropdown`).addClass('error');
      valid = false;
    }

    if (redVal in redPicks) {
      $(`#match-detail-fix-draft .red-${i} .pick-order.dropdown`).addClass('error');
      $(`#match-detail-fix-draft .red-${redPicks[redVal]} .pick-order.dropdown`).addClass('error');
      valid = false;
    }

    bluePicks[blueVal] = i;
    redPicks[redVal] = i;
  }

  return valid;
}
