var teamsHeroDataFilter = {};
var teamsMapDataFilter = {};

function initTeamsPage() {
  $('#team-set-team').dropdown({
    onChange: updateTeamData
  });
  populateTeamMenu($('#team-set-team'));
  $('#team-set-team').dropdown('refresh');

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'teams-filter');
  
  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  $('#team-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="teams-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  bindFilterButton(filterWidget, updateTeamsFilter);
  bindFilterResetButton(filterWidget, resetTeamsFilter);
}

function updateTeamsFilter(hero, map) {
  teamsHeroDataFilter = hero;
  teamsMapDataFilter = map;

  updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
}

function resetTeamsFilter() {
  teamsHeroDataFilter = {};
  teamsMapDataFilter = {};

  updateTeamData($('#team-set-team').dropdown('get value'), $('#team-set-team').dropdown('get text'));
}

function updateTeamData(value, text, $elem) {
  $('#teams-page-header .team-name').text(text);

  // ok so matches get a special version of where for ids and here's how it works:
  // - If the team is 5 people or less:
  //   the ids array needs to have all of the ids specified (this is normal AND)
  // - If the team is more than 5 people:
  //   exactly 5 of the people in the match need to be in the team array
  // all players must be on the same team
  DB.getTeam(value, function(err, team) {
    // get the match data
    let query = Object.assign({}, teamsMapDataFilter);

    // im sure this will 100% murder performace but eh
    let oldWhere = function() { return true; };
    if ('$where' in query) {
      oldWhere = query.$where;
    }
    let player = team.players;

    // this is a bit weird but we're gonna overwrite the where and use a special query
    // first, wrap the old callback if it exists (and it totally does becasue dates)
    if (team.players.length <= 5) {
      // need to match length of players array
      query.$where = function() {
        let t0 = this.teams[0].ids;
        let count = 0;
        for (let i in t0) {
          if (player.indexOf(t0[i]) >= 0)
            count += 1;
        }

        if (count === player.length)
          return oldWhere();
        
        count = 0;
        let t1 = this.teams[1].ids;
        for (let i in t1) {
          if (player.indexOf(t1[i]) >= 0)
            count += 1;
        }

        if (count === player.length)
          return oldWhere();
        
        return false;
      }
    }
    else {
      // basically we need a match 5 of the players and then we're ok 
      query.$where = function() {
        let t0 = this.teams[0].ids;
        let count = 0;
        for (let i in t0) {
          if (player.indexOf(t0[i]) >= 0)
            count += 1;
        }

        if (count === 5)
          return oldWhere();
        
        count = 0;
        let t1 = this.teams[1].ids;
        for (let i in t1) {
          if (player.indexOf(t1[i]) >= 0)
            count += 1;
        }

        if (count === 5)
          return oldWhere();
        
        return false;
      }
    }

    // execute
    DB.getMatches(query, function(err, matches) {
      // then get the hero data
      let matchIDs = [];
      for (let i in matches) {
        matchIDs.push(matches[i]._id);
      }

      // only want specific users
      let query2 = { ToonHandle: { $in: team.players } };

      DB.getHeroDataForMatches(matchIDs, query2, function(err, heroData) {
        // and now finally load the team data
        loadTeamData(team, matches, heroData);
      })
    });
  });
}

function loadTeamData(team, matches, heroData) {
  // compute hero stats
  let heroStats = DB.summarizeHeroData(heroData);
  let playerStats = DB.summarizePlayerData(heroData);
  let teamStats = DB.summarizeTeamData(team, matches, Heroes);
}