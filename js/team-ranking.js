var teamRankingMatchFilter = {};
// uh i'm actually not familiar with my own code
// pretty sure teams keys off of the matches so hero filter is probably
// not going to be used
var teamRankingHeroFilter = {};
var teamRankingGeneralTemplate;
var teamRankingMatchTemplate;
var teamRankingCCTemplate;
var teamRankingStructureTemplate;

function initTeamRankingPage() {
  teamRankingGeneralTemplate = Handlebars.compile(getTemplate('team-ranking', '#team-ranking-row-template').find('tr')[0].outerHTML);
  teamRankingMatchTemplate = Handlebars.compile(getTemplate('team-ranking', '#team-ranking-match-row-template').find('tr')[0].outerHTML);
  teamRankingCCTemplate = Handlebars.compile(getTemplate('team-ranking', '#team-ranking-cc-row-template').find('tr')[0].outerHTML);
  teamRankingStructureTemplate = Handlebars.compile(getTemplate('team-ranking', '#team-ranking-structure-row-template').find('tr')[0].outerHTML);

  // filter popup
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'team-ranking-filter');

  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  bindFilterButton(filterWidget, updateTeamRankingFilter);
  bindFilterResetButton(filterWidget, resetTeamRankingsFilter);

  $('#team-ranking-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="team-ranking-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  $('#team-ranking-body table').tablesort();
  $('#team-ranking-body table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#team-ranking-body .buttons .button').click(toggleTeamRankingSection);

  $('#player-ranking-body table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });
}

function resetTeamRankingPage() {
  resetTeamRankingsFilter();
}

function updateTeamRankingFilter(map, hero) {
  teamRankingMatchFilter = map;
  teamRankingHeroFilter = hero;

  $('#team-ranking-filter-button').addClass('green');
  updateTeamRanking();
}

function resetTeamRankingsFilter() {
  teamRankingMatchFilter = {};
  teamRankingHeroFilter = {};

  $('#team-ranking-filter-button').removeClass('green');
  updateTeamRanking();
}

function toggleTeamRankingSection() {
  let section = $(this).text();
  
  if ($(this).hasClass('violet')) {
    return;
  }

  $('#team-ranking-body .buttons .button').removeClass('violet');
  $('#team-ranking-body .section').addClass('is-hidden');
  $('#team-ranking-body .section[table-name="' + section + '"]').removeClass('is-hidden');
  $(this).addClass('violet');
  $('#team-ranking-body table').floatThead('reflow');
}

function updateTeamRanking() {
  $('#team-ranking-body tbody').html('');

  // this is going to be... some shenanigans
  // first get the list of all the teams in the database
  DB.getAllTeams(function(err, teams) {
    for (let t in teams) {
      let team = teams[t];
      // ok for all the teams in order, we'll need to get a bunch of data
      // this may or may not include all the hero data but we'll see.
      // turns out past me included total stats for teams?
      let query = Object.assign({}, teamRankingMatchFilter);

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
          if (player.length === 0)
            return false;

          let boundWhere = oldWhere.bind(this);
          let t0 = this.teams[0].ids;
          let count = 0;
          for (let i in t0) {
            if (player.indexOf(t0[i]) >= 0)
              count += 1;
          }

          if (count === player.length)
            return boundWhere();
          
          count = 0;
          let t1 = this.teams[1].ids;
          for (let i in t1) {
            if (player.indexOf(t1[i]) >= 0)
              count += 1;
          }

          if (count === player.length)
            return boundWhere();
          
          return false;
        }
      }
      else {
        // basically we need a match 5 of the players and then we're ok 
        query.$where = function() {
          if (player.length === 0)
            return false;

          let boundWhere = oldWhere.bind(this);
          let t0 = this.teams[0].ids;
          let count = 0;
          for (let i in t0) {
            if (player.indexOf(t0[i]) >= 0)
              count += 1;
          }

          if (count === 5)
            return boundWhere();
          
          count = 0;
          let t1 = this.teams[1].ids;
          for (let i in t1) {
            if (player.indexOf(t1[i]) >= 0)
              count += 1;
          }

          if (count === 5)
            return boundWhere();
          
          return false;
        }
      }

      // execute
      DB.getMatches(query, function(err, matches) {
        // skip teams with no data
        if (matches.length === 0)
          return;

        // at this point we might have all the data we need?
        let teamStats = DB.summarizeTeamData(team, matches, Heroes);
        teamStats.name = team.name;
        teamStats.winPercent = teamStats.wins / teamStats.totalMatches;
        teamStats.formatWinPercent = (teamStats.winPercent * 100).toFixed(2) + '%';
        teamStats.stats.total.totalKDA = teamStats.takedowns / teamStats.deaths;
        teamStats.totalKDA = teamStats.stats.total.totalKDA.toFixed(2);
        teamStats.formatAverageLength = formatSeconds(teamStats.averageLength);

        for (let s in teamStats.stats.average) {
          teamStats[s] = formatStat(s, teamStats.stats.average[s], true);
        }

        teamStats.structures.Fort.formatFirst = formatSeconds(teamStats.structures.Fort.first);
        teamStats.structures.Keep.formatFirst = formatSeconds(teamStats.structures.Keep.first);

        $('#team-ranking-general-table tbody').append(teamRankingGeneralTemplate(teamStats));
        $('#team-ranking-match-table tbody').append(teamRankingMatchTemplate(teamStats));
        $('#team-ranking-cc-table tbody').append(teamRankingCCTemplate(teamStats));
        $('#team-ranking-structure-table tbody').append(teamRankingStructureTemplate(teamStats));
      });
    }
  });
}