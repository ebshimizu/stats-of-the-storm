var popupWidgetResetCallback = null;

function initPopup(elem, tags) {
  // modes
  elem.find('.filter-widget-mode').dropdown({
    action: 'activate',
    fullTextSearch: true,
  });

  // maps
  elem.find('.filter-widget-map').dropdown({
    action: 'activate',
  });
  addMapMenuOptions(elem.find('.filter-widget-map'));
  elem.find('.filter-widget-map').dropdown('refresh');

  // dates
  elem.find('.filter-widget-start-date').datepicker();
  elem.find('.filter-widget-end-date').datepicker();
  elem.find('.filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
  elem.find('.filter-widget-end-date').datepicker('setDate', new Date());

  elem.find('.filter-widget-season').dropdown({
    onChange: function (value, text, $item) {
      if (value !== '0' && value !== '') {
        elem.find('.filter-widget-start-date').datepicker('setDate', ReplayTypes.SeasonDates[text].start);
        elem.find('.filter-widget-end-date').datepicker('setDate', ReplayTypes.SeasonDates[text].end);
      } else {
        elem.find('.filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
        elem.find('.filter-widget-end-date').datepicker('setDate', new Date());
      }
    },
  });
  elem.find('.filter-widget-season .menu').html('');
  for (let s in ReplayTypes.SeasonDates) {
    elem.find('.filter-widget-season .menu').prepend('<div class="item">' + s + '</div>');
  }
  elem.find('.filter-widget-season .menu').prepend('<div class="item" data-value="0">None</div>');
  elem.find('.filter-widget-season').dropdown('refresh');

  // patch
  elem.find('.filter-widget-patch').dropdown({
    fullTextSearch: true,
  });
  addPatchMenuOptions(elem.find('.filter-widget-patch'), function () {
    elem.find('.filter-widget-patch').dropdown('refresh');
  });

  // hero type
  elem.find('.filter-widget-hero-type').dropdown({
    fullTextSearch: true,
  });

  // team
  elem.find('.filter-widget-team-menu').dropdown({
    fullTextSearch: true,
  });

  elem.find('.filter-widget-team-win').dropdown();

  elem.find('.filter-widget-clear-team').click(function () {
    $('.filter-widget-team-menu').dropdown('restore defaults');
  });

  // tags
  elem.find('.filter-widget-tags').dropdown({
    fullTextSearch: true,
  });

  //toggles
  elem.find('.filter-widget-hero-team').checkbox();

  elem.find('.filter-widget-search-players').dropdown();

  // populate hero menu
  addHeroMenuOptions(elem.find('.filter-widget-hero-search'));
  elem.find('.filter-widget-hero-search').dropdown({
    fullTextSearch: true,
  });

  populateTagMenuWithValues(elem.find('.filter-widget-tags'), tags);

  // the buttons get rebound depending on the page
  elem.find('.filter-widget-reset').click(function () {
    resetFilterWidget(elem);
  });
}

function disableWidget(name) {
  elem = $('div[widget-name="' + name + '"]');
  elem.find('.filter-widget-search').addClass('disabled');
  elem.find('.filter-widget-reset').addClass('disabled');
}

function enableWidget(name) {
  elem = $('div[widget-name="' + name + '"]');
  elem.find('.filter-widget-search').removeClass('disabled');
  elem.find('.filter-widget-reset').removeClass('disabled');
}

// callback signature:
// function(mapQuery, heroQuery) {} where mapQuery is a NeDB query for match objects,
// and heroQuery is a NeDB query for heroData objects
function bindFilterButton(elem, callback) {
  elem.find('.filter-widget-search').off();

  elem.find('.filter-widget-search').click(function () {
    getPopupQuery(elem, function (queries) {
      callback(queries.map, queries.hero);
    });
  });
}

// Executes the filter button callback for theis element on an arbitrary element
function bindOtherSearchButton(popup, elem, callback) {
  elem.click(function () {
    getPopupQuery(popup, function (queries) {
      callback(queries.map, queries.hero);
    });
  });
}

function bindFilterResetButton(elem, callback) {
  elem.find('.filter-widget-reset').off();

  elem.find('.filter-widget-reset').click(function () {
    resetFilterWidget(elem);
    callback();
  });
}

function resetFilterWidget(elem) {
  elem.find('.dropdown').dropdown('restore defaults');

  elem.find('.filter-widget-start-date').datepicker('setDate', new Date('1-1-2016'));
  elem.find('.filter-widget-end-date').datepicker('setDate', new Date());
}

// this unfortunately needs to be async due to teams
function getPopupQuery(elem, callback) {
  // mode
  let modes = elem.find('.filter-widget-mode').dropdown('get value').split(',');
  for (let m in modes) {
    if (modes[m] !== '') modes[m] = parseInt(modes[m]);
  }

  // dates
  let start = elem.find('.filter-widget-start-date').datepicker('getDate');
  let end = elem.find('.filter-widget-end-date').datepicker('getDate');

  // hero type
  let types = elem.find('.filter-widget-hero-type').dropdown('get value').split(',');
  for (let t in types) {
    if (types[t] !== '') {
      if (types[t].split(' ').length === 1) {
        if (types[t] === 'melee' || types[t] === 'ranged') {
          types[t] = { type: capitalize(types[t]) };
        } else {
          types[t] = { role: capitalize(types[t]) };
        }
      } else {
        let s = types[t].split(' ');
        types[t] = { type: capitalize(s[0]), role: capitalize(s[1]) };
      }
    }
  }
  let heroes = elem.find('.filter-widget-hero-search').dropdown('get value').split(',');

  // maps
  let maps = elem.find('.filter-widget-map').dropdown('get value').split(',');

  // patches
  let patches = elem.find('.filter-widget-patch').dropdown('get value').split(',');

  // team
  let team = elem.find('.filter-widget-team-menu').dropdown('get value');
  let teamWin = elem.find('.filter-widget-team-win').dropdown('get value');

  let players = elem.find('.filter-widget-search-players').dropdown('get value').split(',');

  // tags
  let tags = elem.find('.filter-widget-tags').dropdown('get value').split(',');

  // toggles;
  let widgetHeroOnTeam = elem.find('.filter-widget-hero-team').checkbox('is checked');

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

  // date  // dates
  let incEnd = new Date(end);
  incEnd.setDate(end.getDate() + 1);
  query.$and = [{ rawDate: { $gte: dateToWinTime(start) } }, { rawDate: { $lte: dateToWinTime(incEnd) } }];

  // queries diverge here
  let map = Object.assign({}, query);
  let hero = Object.assign({}, query);

  if (players[0] !== '') {
    if (!('$or' in map)) map.$or = [];

    for (let p in players) {
      map.$or.push({ playerIDs: players[p] });
    }

    hero.ToonHandle = { $in: players };
  }

  // heroes
  let heroArr = [];
  if (types[0] !== '') {
    if (!('$or' in map)) {
      map.$or = [];
    }

    for (let t in types) {
      let heroest = Heroes.heroRole(types[t]);
      for (let h in heroest) {
        if (heroArr.indexOf(heroest[h]) === -1) {
          heroArr.push(heroest[h]);
          map.$or.push({ heroes: heroest[h] });
        }
      }
    }

    hero.hero = { $in: heroArr };
  }

  if (heroes[0] !== '') {
    if (!('$or' in map)) {
      map.$or = [];
    }

    for (let h of heroes) {
      heroArr.push(h);
      map.$or.push({ heroes: h });
    }

    hero.hero = { $in: heroArr };
  }

  if (team === '') {
    callback({ map, hero });
    return;
  }

  DB.getTeam(team, function (err, team) {
    let players = team.players;

    if (!('$or' in map)) {
      map.$or = [];
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

    map.$or.push({ $and: t0queries });
    map.$or.push({ $and: t1queries });

    // players for a team
    hero.ToonHandle = { $in: players };

    if (teamWin === 'win') {
      hero.win = true;
    } else if (teamWin === 'loss') {
      hero.win = false;
    }

    callback({ map, hero });
  });
}
