var playerDetailID;
var playerDetailStats;
var playerDetailInfo;
var playerDetailHeroSummaryRowTemplate;

function initPlayerPage() {
  // player menu init
  let selectedPlayerID = settings.get('selectedPlayerID');
  let initOpt = '<div class="item" data-value="' + selectedPlayerID + '">' + selectedPlayerID + '</div>';
  $('#players-set-player .menu').append(initOpt);
  $('#players-set-player').dropdown({
    action: 'activate',
    fullTextSearch: true,
    onChange: updatePlayerDetailID
  });
  $('#players-set-player').dropdown('set selected', selectedPlayerID);

  // templates
  playerDetailHeroSummaryRowTemplate = Handlebars.compile(getTemplate('player', '#player-detail-hero-summary-row').find('tr')[0].outerHTML);

  // plugins and callbacks
  $('#player-detail-hero-summary table').tablesort();
  $('#player-detail-hero-summary table').floatThead({
    scrollContainer: function($table) {
      return $('#player-detail-hero-summary .table-wrapper');
    },
    autoReflow: true
  });
}

function updatePlayerDetailID(value, text, $item) {
  // only do this if the player id actually changes
  if (playerDetailID === value)
    return;

  playerDetailID = value;

  // uh, redraw the entire page I guess
  DB.getPlayer(playerDetailID, updatePlayerPage);
}

// step 1: get the basic info, update some headers
function updatePlayerPage(err, doc) {
  if (doc.length === 1) {
    playerDetailInfo = doc[0];
    $('#player-page-header .header.player-name').text(playerDetailInfo.name);

    // then do the big query
    // depending on filters, this may get increasingly complicated
    DB.getHeroDataForPlayer(playerDetailInfo._id, processPlayerData);
  }
  else {
    console.log("no player found?");
  }
}

function processPlayerData(err, docs) {
  // collect data
  // hero averages
  playerDetailStats = {};
  playerDetailStats.heroes = {};
  playerDetailStats.maps = {};
  playerDetailStats.rawDocs = docs;
  playerDetailStats.games = 0;
  playerDetailStats.wins = 0;

  for (let i = 0; i < docs.length; i++) {
    let match = docs[i];
    let statList = DetailStatList.concat(PerMapStatList[match.map]);

    // hero stuff
    if (!(match.hero in playerDetailStats.heroes)) {
      playerDetailStats.heroes[match.hero] = { games: 0, wins: 0, totalAwards: 0, stats: {}, awards: {} };
    }

    playerDetailStats.games += 1;
    playerDetailStats.heroes[match.hero].games += 1;

    if (!(match.map in playerDetailStats.maps))
      playerDetailStats.maps[match.map] = { games: 0, wins: 0 };

    playerDetailStats.maps[match.map].games += 1;

    for (let s in statList) {
      let statName = statList[s];
      if (!(statName in playerDetailStats.heroes[match.hero].stats))
        playerDetailStats.heroes[match.hero].stats[statName] = 0;
      
      playerDetailStats.heroes[match.hero].stats[statName] += match.gameStats[statName];
    }

    // you only ever get 1 but just in case...
    // ALSO custom games don't get counted here since you can't get awards
    if (match.mode !== ReplayTypes.GameMode.Custom && 'awards' in match.gameStats) {
      for (let a in match.gameStats.awards) {
        let awardName = match.gameStats.awards[a];
        if (!(awardName in playerDetailStats.heroes[match.hero].awards))
          playerDetailStats.heroes[match.hero].awards[awardName] = 0;
        
        playerDetailStats.heroes[match.hero].awards[awardName] += 1;
        playerDetailStats.heroes[match.hero].totalAwards += 1;
      }
    }

    if (match.win) {
      playerDetailStats.wins += 1;
      playerDetailStats.maps[match.map].wins += 1;
      playerDetailStats.heroes[match.hero].wins += 1;
    }
  }

  // averages
  playerDetailStats.averages = {};
  for (let h in playerDetailStats.heroes) {
    playerDetailStats.averages[h] = {};
    for (let s in playerDetailStats.heroes[h].stats) {
      playerDetailStats.averages[h][s] = playerDetailStats.heroes[h].stats[s] / playerDetailStats.heroes[h].games;
    }
    playerDetailStats.heroes[h].stats.totalKDA = playerDetailStats.heroes[h].stats.Takedowns / Math.max(playerDetailStats.heroes[h].stats.Deaths, 1);

    if ('EndOfMatchAwardMVPBoolean' in playerDetailStats.heroes[h].awards) {
      playerDetailStats.heroes[h].stats.MVPPct = playerDetailStats.heroes[h].awards.EndOfMatchAwardMVPBoolean / playerDetailStats.heroes[h].games;
    }
    else {
      playerDetailStats.heroes[h].stats.MVPPct = 0;
    }

    playerDetailStats.heroes[h].stats.AwardPct = playerDetailStats.heroes[h].totalAwards / playerDetailStats.heroes[h].games;
  }

  // render to the proper spots
  renderPlayerSummary();
}

function renderPlayerSummary() {
  $('#player-detail-hero-summary tbody').html('');

  for (let h in playerDetailStats.heroes) {
    let context = {};

    // some formatting needs to happen
    context.heroName = h;
    context.heroImg = Heroes.heroIcon(h);
    context.games = playerDetailStats.heroes[h].games;
    context.stats = playerDetailStats.heroes[h].stats;
    context.stats.formatMVPPct = (context.stats.MVPPct * 100).toFixed(2) + '%';
    context.stats.formatAwardPct = (context.stats.AwardPct * 100).toFixed(2) + '%';
    context.winPercent = playerDetailStats.heroes[h].wins / playerDetailStats.heroes[h].games;
    context.formatWinPercent = (context.winPercent * 100).toFixed(2) + '%';
    context.stats.totalKDA = context.stats.totalKDA.toFixed(2);

    $('#player-detail-hero-summary tbody').append(playerDetailHeroSummaryRowTemplate(context));
  }

  $('#player-detail-hero-summary table').floatThead('reflow');
}