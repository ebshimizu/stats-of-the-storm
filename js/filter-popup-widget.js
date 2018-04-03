var popupWidgetResetCallback = null;

function initPopup(elem) {
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
        elem.find('.filter-widget-start-date').datepicker('setDate', ReplayTypes.SeasonDates[text].start);
        elem.find('.filter-widget-end-date').datepicker('setDate', ReplayTypes.SeasonDates[text].end);
      }
      else {
        elem.find('.filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
        elem.find('.filter-widget-end-date').datepicker('setDate', new Date());
      }
    }
  });
  elem.find('.filter-widget-season .menu').html('');
  for (let s in ReplayTypes.SeasonDates) {
    elem.find('.filter-widget-season .menu').prepend('<div class="item">' + s + '</div>');
  }
  elem.find('.filter-widget-season .menu').prepend('<div class="item" data-value="0">None</div>');
  elem.find('.filter-widget-season').dropdown('refresh');

  // patch
  elem.find('.filter-widget-patch').dropdown({
    fullTextSearch: true
  });
  addPatchMenuOptions(elem.find('.filter-widget-patch'), function() {
    elem.find('.filter-widget-patch').dropdown('refresh');
  });

  // hero type
  elem.find('.filter-widget-hero-type').dropdown({
    fullTextSearch: true
  });
  
  // team
  elem.find('.filter-widget-team-menu').dropdown({
    fullTextSearch: true
  });

  elem.find('.filter-widget-team-win').dropdown();

  elem.find('.filter-widget-clear-team').click(function() {
    $('.filter-widget-team-menu').dropdown('restore defaults');
  })

  // tags
  elem.find('.filter-widget-tags').dropdown({
    fullTextSearch: true
  });

  populateTagMenu(elem.find('.filter-widget-tags'));

  // the buttons get rebound depending on the page
  elem.find('.filter-widget-reset').click(function() { resetFilterWidget(elem) });
}

// callback signature:
// function(mapQuery, heroQuery) {} where mapQuery is a NeDB query for match objects,
// and heroQuery is a NeDB query for heroData objects
function bindFilterButton(elem, callback) {
  elem.find('.filter-widget-search').off();

  elem.find('.filter-widget-search').click(function() {
    let queries = getPopupQuery(elem, function(queries) {
      callback(queries.map, queries.hero);
    });
  });
}

function bindFilterResetButton(elem, callback) {
  elem.find('.filter-widget-reset').off();

  elem.find('.filter-widget-reset').click(function() {
    resetFilterWidget(elem);
    callback();
  });
}

function resetFilterWidget(elem) {
  elem.find('.dropdown').dropdown('restore defaults');

  elem.find('.filter-widget-start-date').datepicker('setDate', new Date('1-1-2012'));
  elem.find('.filter-widget-end-date').datepicker('setDate', new Date()); 
}

// this unfortunately needs to be async due to teams
function getPopupQuery(elem, callback) {
  // mode
  let modes = elem.find('.filter-widget-mode').dropdown('get value').split(',');
  for (let m in modes) {
    if (modes[m] !== "")
      modes[m] = parseInt(modes[m]);
  }

  // dates
  let start = elem.find('.filter-widget-start-date').datepicker('getDate');
  let end = elem.find('.filter-widget-end-date').datepicker('getDate');

  // hero type
  let types = elem.find('.filter-widget-hero-type').dropdown('get value').split(',')
  for (let t in types) {
    if (types[t] !== "") {
      if (types[t].split(' ').length === 1) {
        if (types[t] === "melee" || types[t] === "ranged") {
          types[t] = { type: capitalize(types[t]) }
        }
        else {
          types[t] = { role: capitalize(types[t]) }
        }
      }
      else {
        let s = types[t].split(' ');
        types[t] = { type: capitalize(s[0]), role: capitalize(s[1])}
      }
    }
  }

  // maps
  let maps = elem.find('.filter-widget-map').dropdown('get value').split(',');

  // patches
  let patches = elem.find('.filter-widget-patch').dropdown('get value').split(',');

  // team
  let team = elem.find('.filter-widget-team-menu').dropdown('get value');
  let teamWin = elem.find('.filter-widget-team-win').dropdown('get value');

  // tags
  let tags = elem.find('.filter-widget-tags').dropdown('get value').split(',');

  for (let p in patches) {
    if (patches[p] !== "")
      patches[p] = parseInt(patches[p]);
  }

  // construct the query
  let query = {};
  if (modes[0] !== "") {
    query.mode = { $in: modes };
  }

  if (maps[0] !== "") {
    query.map = { $in: maps };
  }

  if (patches[0] !== "") {
    query['version.m_build'] = { $in: patches };
  }

  if (tags[0] !== "") {
    query.tags = { $in: tags };
  }

  // dates
  query.$where = function() {
    let d = new Date(this.date);
    return start <= d && d <= end;
  }

  // queries diverge here
  let map = Object.assign({}, query);
  let hero = Object.assign({}, query);

  // heroes
  if (types[0] !== "") {
    heroArr = []
    for (let t in types) {
      let heroes = Heroes.heroRole(types[t]);
      for (let h in heroes) {
        if (heroArr.indexOf(heroes[h]) === -1) {
          heroArr.push(heroes[h]);
        }
      }
    }

    hero.hero = { $in: heroArr };
    map.heroes = { $elemMatch: { $in: heroArr } };
  }

  if (team === '') {
    callback({ map, hero });
    return;
  }

  DB.getTeam(team, function(err, team) {
    let oldWhere = function() { return true; };
    let player = team.players;
    if ('$where' in map) {
      oldWhere = map.$where;
    }

    if (team.players.length <= 5) {
      // need to match length of players array
      map.$where = function() {
        if (player.length === 0)
          return false;

        let boundWhere = oldWhere.bind(this);
        let t0 = this.teams[0].ids;
        let count = 0;
        for (let i in t0) {
          if (player.indexOf(t0[i]) >= 0)
            count += 1;
        }

        if (count === player.length) {
          if (teamWin === 'win') {
            return this.winner === 0 && boundWhere();
          }
          else if (teamWin === 'loss') {
            return this.winner !== 0 && boundWhere();
          }

          return boundWhere();
        }
        
        count = 0;
        let t1 = this.teams[1].ids;
        for (let i in t1) {
          if (player.indexOf(t1[i]) >= 0)
            count += 1;
        }

        if (count === player.length) {
          if (teamWin === 'win') {
            return this.winner === 1 && boundWhere();
          }
          else if (teamWin === 'loss') {
            return this.winner !== 1 && boundWhere();
          }

          return boundWhere();
        }
        
        return false;
      }
    }
    else {
      // basically we need a match 5 of the players and then we're ok 
      map.$where = function() {
        if (player.length === 0)
          return false;

        let boundWhere = oldWhere.bind(this);
        let t0 = this.teams[0].ids;
        let count = 0;
        for (let i in t0) {
          if (player.indexOf(t0[i]) >= 0)
            count += 1;
        }

        if (count === 5) {
          if (teamWin === 'win') {
            return this.winner === 0 && boundWhere();
          }
          else if (teamWin === 'loss') {
            return this.winner !== 0 && boundWhere();
          }

          return boundWhere();
        }
        
        count = 0;
        let t1 = this.teams[1].ids;
        for (let i in t1) {
          if (player.indexOf(t1[i]) >= 0)
            count += 1;
        }

        if (count === 5) {
          if (teamWin === 'win') {
            return this.winner === 1 && boundWhere();
          }
          else if (teamWin === 'loss') {
            return this.winner !== 1 && boundWhere();
          }

          return boundWhere();
        }
        
        return false;
      }
    }

    // players for a team
    hero.ToonHandle = { $in: player };

    if (teamWin === 'win') {
      hero.win = true;
    }
    else if (teamWin === 'loss') {
      hero.win = false;
    }

    callback({map, hero});
  });
}