// list of selected match ids
// note that this isn't the currently displayed match ids, that's a different one
const summaryProjection = {
  _id: 1,
  teams: 1,
  length: 1,
  map: 1,
  mode: 1,
  date: 1,
  winner: 1,
  version: 1,
  bans: 1,
  tags: 1,
};

const matchesPerPage = 20;

var currentPage;
var matchRowTemplate;
var enableTagEdit = true;
var requireHeroOnTeam = false;
var matchSearchQuery = {};
var matchTeamActiveIDs = null;

function initMatchesPage(tags) {
  // player menu init
  $('#match-search-players').dropdown({
    action: 'activate',
    fullTextSearch: true,
  });

  // templates
  matchRowTemplate = getHandlebars('matches', '#match-summary-row');

  // bindings
  $('#match-filter-popup-button').popup({
    popup: '#match-filter-popup',
    on: 'click',
  });
  $('#match-mode-select').dropdown({
    action: 'activate',
    fullTextSearch: true,
  });
  $('#match-search-players-mode').dropdown({
    action: 'activate',
  });
  $('#match-search-heroes-mode').dropdown();

  $('#match-search-players-win').dropdown();
  $('#match-search-team-win').dropdown();

  // again most of the things here don't actually need callbacks
  $('#match-search-heroes').dropdown({
    fullTextSearch: true,
  });
  addHeroMenuOptions($('#match-search-heroes'));
  $('#match-search-heroes').dropdown('refresh');

  $('#match-map-select').dropdown({
    fullTextSearch: true,
  });
  addMapMenuOptions($('#match-map-select'));
  $('#match-map-select').dropdown('refresh');

  $('#match-patch-select').dropdown({
    fullTextSearch: true,
  });
  addPatchMenuOptions($('#match-patch-select'), function () {
    $('#match-patch-select').dropdown('refresh');
  });

  $('#match-search-start-date').datepicker();
  $('#match-search-start-date').datepicker('setDate', new Date('1-1-2016'));

  $('#match-search-end-date').datepicker();
  $('#match-search-end-date').datepicker('setDate', new Date());

  // season menu tho that has some stuff
  initSeasonMenu();

  $('#match-search-clear-team').click(function () {
    $('#match-search-team').dropdown('restore defaults');
  });

  $('#match-search-team').dropdown({
    fullTextSearch: true,
  });

  $('#match-search-button').click(selectMatches);
  $('#match-search-reset-button').click(resetMatchFilters);

  $('#matches-collection').dropdown({
    action: 'hide',
    onChange: handleMatchesCollectionAction,
  });
  $('#matches-file-menu').dropdown({
    action: 'hide',
    onChange: handleMatchesFileAction,
  });

  $('#matches-tags').popup({
    inline: true,
    position: 'bottom left',
    on: 'click',
  });

  $('#matches-tags-popup .search.dropdown').dropdown({
    fullTextSearch: true,
    allowAdditions: true,
    onAdd: matchesAddTag,
    onRemove: matchesRemoveTag,
  });

  $('#match-search-tags').dropdown({
    fullTextSearch: true,
  });

  populateTagMenuWithValues($('#matches-tags-popup .search.dropdown'), tags);
  populateTagMenuWithValues($('#match-search-tags'), tags);

  $('#matches-collection-select').modal();

  $('#search-hero-on-team').checkbox({
    onChecked: function () {
      requireHeroOnTeam = true;
    },
    onUnchecked: function () {
      requireHeroOnTeam = false;
    },
  });

  // initial settings
  getMatchCount();

  currentPage = 0;
  selectAllMatches();
}

function resetMatchesPage() {
  currentPage = 0;
  resetMatchFilters();
  getMatchCount();
  selectMatches();
}

function showMatchesPage() {
  $('#matches-collection').removeClass('is-hidden');
  $('#matches-file-menu').removeClass('is-hidden');
  $('#matches-tags').removeClass('is-hidden');
}

function showMatchLoader() {
  $('#match-search-reset-button').addClass('disabled');
  $('#match-search-button').addClass('disabled');
  $('#match-page-table .match-loader').dimmer('show');
}

function hideMatchLoader() {
  $('#match-page-table .match-loader').dimmer('hide');
  $('#match-search-reset-button').removeClass('disabled');
  $('#match-search-button').removeClass('disabled');
}

function getMatchCount() {
  DB.countMatches({}, function (err, count) {
    $('#matches-in-database-stat').text(count);
  });
}

function selectAllMatches() {
  // get just the necessary info in descending time order
  matchSearchQuery = {};
  currentPage = 0;
  showPage(currentPage);
}

function resetMatchFilters() {
  $('#match-mode-select').dropdown('restore defaults');
  $('#match-search-seasons').dropdown('restore defaults');
  $('#match-search-players').dropdown('restore defaults');
  $('#match-search-players-mode').dropdown('restore defaults');
  $('#match-search-heroes').dropdown('restore defaults');
  $('#match-search-heroes-mode').dropdown('restore defaults');
  $('#match-map-select').dropdown('restore defaults');
  $('#match-search-team').dropdown('restore defaults');
  $('#match-search-players-win').dropdown('restore defaults');
  $('#match-search-team-win').dropdown('restore defaults');
  $('#search-hero-on-team').checkbox('uncheck');

  $('#match-search-start-date').datepicker('setDate', new Date('1-1-2012'));
  $('#match-search-end-date').datepicker('setDate', new Date());
  selectMatches();
}

// using the current search settings, search for matches
function selectMatches() {
  matchTeamActiveIDs = null;

  // mode
  let modes = $('#match-mode-select').dropdown('get value').split(',');
  for (let m in modes) {
    if (modes[m] !== '') modes[m] = parseInt(modes[m]);
  }

  // dates
  let start = $('#match-search-start-date').datepicker('getDate');
  let end = $('#match-search-end-date').datepicker('getDate');

  // players
  let players = $('#match-search-players').dropdown('get value').split(',');
  let playerMode = $('#match-search-players-mode').dropdown('get value');
  let playerWin = $('#match-search-players-win').dropdown('get value');

  // heroes
  let heroes = $('#match-search-heroes').dropdown('get value').split(',');
  let heroMode = $('#match-search-heroes-mode').dropdown('get value');

  // maps
  let maps = $('#match-map-select').dropdown('get value').split(',');

  // patches
  let patches = $('#match-patch-select').dropdown('get value').split(',');

  // team
  let team = $('#match-search-team').dropdown('get value');
  let teamWin = $('#match-search-team-win').dropdown('get value');

  // tags
  let tags = $('#match-search-tags').dropdown('get value').split(',');

  for (let p in patches) {
    if (patches[p] !== '') patches[p] = parseInt(patches[p]);
  }

  // construct the query
  let query = {};
  if (modes[0] !== '') {
    query.mode = { $in: modes };
  }

  if (maps[0] !== '') {
    query.map = { $in: maps };
  }

  if (patches[0] !== '') {
    query['version.m_build'] = { $in: patches };
  }

  if (tags[0] !== '') {
    query.tags = { $in: tags };
  }

  // dates
  let incEnd = new Date(end);
  incEnd.setDate(end.getDate() + 1);
  query.$and = [{ rawDate: { $gte: dateToWinTime(start) } }, { rawDate: { $lte: dateToWinTime(incEnd) } }];

  // heroes
  if (heroes[0] !== '' && !requireHeroOnTeam) {
    if (heroMode === 'and') {
      if (!('$and' in query)) query.$and = [];

      for (let h in heroes) {
        query.$and.push({ heroes: heroes[h] });
      }
    } else {
      if (!('$or' in query)) query.$or = [];

      for (let h in heroes) {
        query.$or.push({ heroes: heroes[h] });
      }
    }
  }

  // players
  if (players[0] !== '') {
    if (playerMode === 'and') {
      if (!('$and' in query)) query.$and = [];

      for (let p in players) {
        if (playerWin === 'win') {
          query.$and.push({ winningPlayers: players[p] });
        } else {
          query.$and.push({ playerIDs: players[p] });
        }

        if (playerWin === 'loss') {
          query.$and.push({ $not: { winningPlayers: players[p] } });
        }
      }
    } else if (playerMode === 'or' || playerMode === '') {
      if (playerWin === 'win') {
        if (!('$or' in query)) query.$or = [];

        for (let p in players) {
          query.$or.push({ winningPlayers: players[p] });
        }
      } else if (playerWin === 'loss') {
        if (!('$or' in query)) query.$or = [];

        for (let p in players) {
          let q = { $and: [] };
          q.$and.push({ playerIDs: players[p] });
          q.$and.push({ $not: { winningPlayers: players[p] } });

          query.$or.push(q);
        }
      } else {
        if (!('$or' in query)) query.$or = [];

        for (let p in players) {
          query.$or.push({ playerIDs: players[p] });
        }
      }
    }
  }

  // ok teams suck
  if (team !== '') {
    // get the team, then run the query as normal
    DB.getTeam(team, function (err, team) {
      matchTeamActiveIDs = team.players;
      let players = team.players;

      if (!('$or' in query)) {
        query.$or = [];
      }

      let t0queries = [];
      let t1queries = [];
      if (team.players.length <= 5) {
        // all players need to be in a team somewhere
        for (const i in players) {
          t0queries.push({ 'teams.0.ids': players[i] });
          t1queries.push({ 'teams.1.ids': players[i] });
        }
      } else {
        // basically we need a match 5 of the players and then we're ok
        for (let i = 0; i < 5; i++) {
          const t0key = 'teams.0.ids.' + i;
          const t1key = 'teams.1.ids.' + i;

          let t0arg = {};
          t0arg[t0key] = { $in: players };
          let t1arg = {};
          t1arg[t1key] = { $in: players };

          t0queries.push(t0arg);
          t1queries.push(t1arg);
        }
      }

      if (teamWin === 'win') {
        t0queries.push({ winner: 0 });
        t1queries.push({ winner: 1 });
      } else if (teamWin === 'loss') {
        t0queries.push({ winner: 1 });
        t1queries.push({ winner: 0 });
      }

      if (requireHeroOnTeam) {
        let heroArgs0 = [];
        let heroArgs1 = [];
        for (let hero of heroes) {
          heroArgs0.push({ 'teams.0.heroes': hero });
          heroArgs1.push({ 'teams.1.heroes': hero });
        }
        t0queries.push({ $or: heroArgs0 });
        t1queries.push({ $or: heroArgs1 });
      }

      query.$or.push({ $and: t0queries });
      query.$or.push({ $and: t1queries });

      matchSearchQuery = query;
      currentPage = 0;
      showPage(currentPage);
    });
  } else {
    currentPage = 0;
    matchSearchQuery = query;
    showPage(currentPage);
  }
}

function teamsShouldSwap(data) {
  if (!matchTeamActiveIDs) {
    return false;
  }

  // we need to swap if team 1 (red) is the active team
  for (let i = 0; i < data.teams[1].ids.length; i++) {
    // all ids need to match,
    if (matchTeamActiveIDs.indexOf(data.teams[1].ids[i]) === -1) {
      return false;
    }
  }

  // todo: fill this in with an actual function
  return true;
}

function showPage(pageNum) {
  showMatchLoader();
  DB.countMatches(matchSearchQuery, function (err, count) {
    $('#matches-selected').text(count);

    let maxPages = Math.ceil(count / matchesPerPage);
    if (pageNum >= 0 && pageNum < maxPages) {
      DB.getMatchPage(matchSearchQuery, pageNum, matchesPerPage, summaryProjection, function (err, selectedMatches) {
        // clear
        for (let i = 0; i < matchesPerPage; i++) {
          $('tr[slot="' + i + '"]').html('');
        }

        // so like pick the correct range and just render it
        for (let i = 0; i < selectedMatches.length; i++) {
          renderToSlot(selectedMatches[i], i, teamsShouldSwap(selectedMatches[i]));
        }
        currentPage = pageNum;

        // update the pagination buttons
        $('#match-list-page-menu').html('');

        // determine what to show
        let show = Array.from(new Array(5), (x, i) => i - 2 + currentPage);
        // first, we always have the first page
        let elems = '';
        if (currentPage > 0) elems += '<a class="icon item prev"><i class="left chevron icon"></i></a>';
        elems += '<a class="item" page="1">1</a>';

        if (show[0] >= 2) elems += '<a class="item disabled">...</a>';

        for (let i = 0; i < show.length; i++) {
          let pn = show[i];

          if (pn < 1 || pn >= maxPages - 1) continue;

          elems += '<a class="item" page="' + (pn + 1) + '">' + (pn + 1) + '</a>';
        }

        if (show[show.length - 1] < maxPages - 2) elems += '<a class="item disabled">...</a>';

        if (maxPages > 1) {
          elems += '<a class="item" page="' + maxPages + '">' + maxPages + '</a>';
        }

        if (currentPage < maxPages - 1) elems += '<a class="icon item next"><i class="right chevron icon"></i></a>';

        $('#match-list-page-menu').html(elems);
        $('#match-list-page-menu .item[page="' + (currentPage + 1) + '"]').addClass('active');

        $('#match-list-page-menu .item').click(function () {
          if ($(this).hasClass('disabled')) return;

          if ($(this).hasClass('next')) showPage(currentPage + 1);
          else if ($(this).hasClass('prev')) showPage(currentPage - 1);
          else showPage(parseInt($(this).attr('page')) - 1);
        });

        $('#match-page-table .match-summary').click(function () {
          let id = $(this).attr('match-id');
          // disable clicking on other matches
          showMatchLoader();
          loadMatchData(id, function () {
            changeSection('match-detail');
            hideMatchLoader();
          });
        });

        hideMatchLoader();
      });
    } else {
      for (let i = 0; i < matchesPerPage; i++) {
        $('tr[slot="' + i + '"]').html('');
      }
      if (count === 0) {
        $('#match-list-page-menu').html('');
      }

      hideMatchLoader();
    }
  });
}

function renderToSlot(gameData, slot, swap) {
  let context = {};
  context.map = gameData.map;
  context.mapClass = gameData.map.replace(/[^A-Z0-9]/gi, '-');
  context.mode = ReplayTypes.GameModeStrings[gameData.mode];
  context.id = gameData._id;

  // swap will visually change the position of red and blue.
  // this will happen if a team was searched, and the selected team is on the other side
  if (swap === true) {
    gameData.teams = [gameData.teams[1], gameData.teams[0]];

    if (gameData.bans) {
      gameData.bans = [gameData.bans[1], gameData.bans[0]];
    }

    context.swap = 'swap';
  }

  // if player id is defined, highlight if present, otherwise red/blue
  let focusId = settings.get('selectedPlayerID');
  if (
    (gameData.teams[0].ids.indexOf(focusId) > -1 && gameData.winner === 0) ||
    (gameData.teams[1].ids.indexOf(focusId) > -1 && gameData.winner === 1)
  ) {
    context.winClass = 'green';
    context.winText = 'Victory';
  } else if (gameData.teams[0].ids.indexOf(focusId) > -1 || gameData.teams[1].ids.indexOf(focusId) > -1) {
    context.winClass = 'red';
    context.winText = 'Defeat';
  } else if (gameData.winner === 0) {
    context.winClass = 'blue';
    context.winText = 'Blue Team Victory';
  } else {
    context.winClass = 'red';
    context.winText = 'Red Team Victory';
  }

  if (!gameData.bans) {
    context.hideBans = 'is-hidden';
  } else {
    context.bban1Hero = Heroes.heroNameFromAttr(gameData.bans[0][0].hero);
    context.bban2Hero = Heroes.heroNameFromAttr(gameData.bans[0][1].hero);
    context.rban1Hero = Heroes.heroNameFromAttr(gameData.bans[1][0].hero);
    context.rban2Hero = Heroes.heroNameFromAttr(gameData.bans[1][1].hero);

    if (gameData.bans[0].length > 2 || gameData.bans[1].length > 2) {
      context.bban3Hero = Heroes.heroNameFromAttr(gameData.bans[0][2].hero);
      context.rban3Hero = Heroes.heroNameFromAttr(gameData.bans[1][2].hero);
    }

    context.bbanFirst = gameData.picks.first === 0;
    context.rbanFirst = gameData.picks.first === 1;
  }

  context.date = new Date(gameData.date);
  context.date =
    context.date.toLocaleString('en-US') +
    ' (' +
    gameData.version.m_major +
    '.' +
    gameData.version.m_minor +
    '.' +
    gameData.version.m_revision +
    ')';
  context.length = formatSeconds(gameData.length);
  context.takedowns = {
    blue: gameData.teams[0].takedowns,
    red: gameData.teams[1].takedowns,
  };
  context.level = {
    blue: gameData.teams[0].level,
    red: gameData.teams[1].level,
  };
  context.blueHeroes = [];
  context.redHeroes = [];

  let bd = gameData.teams[0];
  let rd = gameData.teams[1];
  for (let i = 0; i < gameData.teams[0].ids.length; i++) {
    context.blueHeroes.push({
      heroName: bd.heroes[i],
      playerName: bd.names[i],
      playerID: bd.ids[i],
      isFocus: focusClass(bd.ids[i]),
    });
    context.redHeroes.push({
      heroName: rd.heroes[i],
      playerName: rd.names[i],
      playerID: rd.ids[i],
      isFocus: focusClass(rd.ids[i]),
    });
  }

  $('#match-list tr[slot="' + slot + '"]').html(matchRowTemplate(context));
  $('tr[slot="' + slot + '"] .match-details .ui.image').popup();

  // team nameplates
  if (swap) {
    populateTeamNameplate(gameData._id, 0, gameData.teams[0].ids, gameData.winner === 1);
    populateTeamNameplate(gameData._id, 1, gameData.teams[1].ids, gameData.winner === 0);
  } else {
    populateTeamNameplate(gameData._id, 0, gameData.teams[0].ids, gameData.winner === 0);
    populateTeamNameplate(gameData._id, 1, gameData.teams[1].ids, gameData.winner === 1);
  }
}

function populateTeamNameplate(matchID, teamID, players, won) {
  DB.getTeamByPlayers(players, function (err, docs) {
    if (docs.length > 0) {
      // take first team found, not room for all
      let team = docs[0];
      let elem = (teamID === 0 ? '.blue' : '.red') + '-team-nameplate';

      $('.match-summary[match-id="' + matchID + '"]')
        .find(elem)
        .text(team.name);

      if (won) {
        let header = $('.match-summary[match-id="' + matchID + '"]').find('h3.match-team-winner');

        if (header.text() !== 'Victory' && header.text() !== 'Defeat') {
          header.text(team.name + ' Victory');
        }
      }
    }
  });
}

function initSeasonMenu() {
  $('#match-search-seasons .menu').html('');
  for (let s in ReplayTypes.SeasonDates) {
    $('#match-search-seasons .menu').prepend('<div class="item">' + s + '</div>');
  }
  $('#match-search-seasons .menu').prepend('<div class="item" data-value="0">None</div>');

  $('#match-search-seasons').dropdown({
    onChange: function (value, text, $item) {
      if (value !== '0' && value !== '') {
        $('#match-search-start-date').datepicker('setDate', ReplayTypes.SeasonDates[text].start);
        $('#match-search-end-date').datepicker('setDate', ReplayTypes.SeasonDates[text].end);
      } else {
        $('#match-search-start-date').datepicker('setDate', new Date('1-1-2012'));
        $('#match-search-end-date').datepicker('setDate', new Date());
      }
    },
  });
}

function handleMatchesCollectionAction(action, text, $elem) {
  if (action === 'add-current') {
    $('#matches-collection-select .header').text('Add Matches to Collection');
    $('#matches-collection-select p.text').text(
      'All all of the currently selected matches to the spcified collection. Matches can be added to multiple collections.',
    );

    $('#matches-collection-select')
      .modal({
        onApprove: function () {
          let collectionID = $('#matches-collection-select .collection-menu').dropdown('get value');
          // adding to null collection is not allowed
          if (collectionID === '') return;

          DB.getMatches(matchSearchQuery, function (err, selectedMatches) {
            for (let i in selectedMatches) {
              DB.addMatchToCollection(selectedMatches[i]._id, collectionID);
            }
            if (collectionID === DB.getCollection()) {
              resetAllSections();
            }
          });
        },
      })
      .modal('show');
  }
  if (action === 'remove-current') {
    if (DB.getCollection() !== null) {
      $('#matches-collection-select .header').text('Remove Matches to Collection');
      $('#matches-collection-select p.text').text(
        'Removes all of the currently selected matches from the spcified collection.',
      );
      $('#matches-collection-select .collection-menu').dropdown('set exactly', DB.getCollection());

      $('#matches-collection-select')
        .modal({
          onApprove: function () {
            let collectionID = $('#matches-collection-select .collection-menu').dropdown('get value');
            // removing from null collection also not allowed (and also impossible)
            if (collectionID === '') return;

            DB.getMatches(matchSearchQuery, function (err, selectedMatches) {
              for (let i in selectedMatches) {
                DB.removeMatchFromCollection(selectedMatches[i]._id, collectionID);
              }

              if (collectionID === DB.getCollection()) resetAllSections();
            });
          },
        })
        .modal('show');
    }
  }
}

function handleMatchesFileAction(action, text, $elem) {
  if (action === 'match') {
    dialog.showOpenDialog(
      {
        title: 'Select Export Folder',
        properties: ['openDirectory', 'createDirectory'],
      },
      function (files) {
        if (files) {
          // pick the first, should only be 1 dir
          let path = files[0];
          DB.getMatches(matchSearchQuery, function (err, selectedMatches) {
            for (let i in selectedMatches) {
              exportMatch(selectedMatches[i]._id, path + '/' + selectedMatches[i]._id + '.json');
            }
          });
        }
      },
    );
  } else if (action === 'delete') {
    $('#matches-confirm-delete-matches')
      .modal({
        onApprove: function () {
          DB.getMatches(matchSearchQuery, function (err, selectedMatches) {
            if (selectedMatches.length === 0) {
              showMessage('No Matches Selected', 'No matches deleted because no matches are selected', {});
            } else {
              let toDelete = [];
              for (let m of selectedMatches) {
                toDelete.push(m._id);
              }

              showMessage('Deleting ' + toDelete.length + ' Matches', '', '');
              handleDeleteMatches(toDelete.pop(), toDelete);
            }
          });
        },
      })
      .modal('show');
  }
}

function handleDeleteMatches(current, remaining) {
  DB.deleteReplay(current, function () {
    if (remaining.length > 0) {
      handleDeleteMatches(remaining.pop(), remaining);
    } else {
      showMessage('Matches Deleted', '', {});
      getMatchCount();
      selectMatches();
    }
  });
}

function matchesAddTag(tagValue, tagText, $added) {
  if (!enableTagEdit) return;

  DB.getMatches(matchSearchQuery, function (err, selectedMatches) {
    let ids = [];
    for (let m of selectedMatches) {
      ids.push(m._id);
    }

    DB.tagReplays(ids, tagValue, function () {
      console.log('added ' + tagValue + ' to ' + ids.join(','));

      let vals = $('#match-search-tags').dropdown('get value');
      populateTagMenu($('#match-search-tags'), function () {
        $('#match-search-tags').dropdown('set exactly', vals);
      });
      populateTagMenu($('.filter-widget-tags'));
    });
  });
}

function matchesRemoveTag(tagValue, tagText, $removed) {
  if (!enableTagEdit) return;

  DB.getMatches(matchSearchQuery, function (err, selectedMatches) {
    let ids = [];
    for (let m of selectedMatches) {
      ids.push(m._id);
    }

    DB.untagReplays(ids, tagValue, function () {
      console.log('removed ' + tagValue + ' from ' + ids.join(','));

      let vals = $('#match-search-tags').dropdown('get value');
      populateTagMenu($('#match-search-tags'), function () {
        $('#match-search-tags').dropdown('set exactly', vals);
      });
      populateTagMenu($('.filter-widget-tags'));
    });
  });
}
