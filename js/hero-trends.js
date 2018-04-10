var trendsHeroDataFilter;
var trendsMapDataFilter;
var trendsHeroMatchThreshold = 0;
var trendsOverallHeroRowTemplate;
var trendsHeroPickTemplate;
var trendsHeroBanTemplate;
var trendsDateLimits = {
  '1-start': new Date(),
  '1-end': new Date(),
  '2-start': new Date(),
  '2-end': new Date()
};

function initTrendsPage() {
  trendsHeroDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }
  trendsMapDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }

  trendsOverallHeroRowTemplate = Handlebars.compile(getTemplate('trends', '#trends-hero-summary-row-template').
    find('tr')[0].outerHTML);
  trendsHeroPickTemplate = Handlebars.compile(getTemplate('trends', '#trends-hero-pick-row-template').find('tr')[0].outerHTML);
  trendsHeroBanTemplate = Handlebars.compile(getTemplate('trends', '#trends-hero-pick-ban-template').find('tr')[0].outerHTML);

  //tables
  $('#hero-trends-body table').tablesort();
  $('#hero-trends-body table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });
  $('#hero-trends-body table th.stat').data('sortBy', function(th, td, tablesort) {
    return parseFloat(td.attr('data-sort-value'));
  });

  // filter
  let filterWidget = $(getTemplate('filter', '#filter-popup-widget-template').find('.filter-popup-widget')[0].outerHTML);
  filterWidget.attr('widget-name', 'hero-trends-filter');
  
  $('#filter-widget').append(filterWidget);
  initPopup(filterWidget);

  $('#hero-trends-filter-button').popup({
    popup: '.filter-popup-widget[widget-name="hero-trends-filter"]',
    on: 'click',
    variation: 'fluid',
    closable: false
  });

  // initialize the filter
  for (let m in trendsHeroDataFilter.mode.$in) {
    filterWidget.find('.filter-widget-mode').dropdown('set selected', trendsHeroDataFilter.mode.$in[m]);
  }
  bindFilterButton(filterWidget, updateTrendsFilter);
  bindFilterResetButton(filterWidget, resetTrendsFilter);

  // hide the dates, we don't use them here
  filterWidget.find('.date-input').addClass('is-hidden');

  // tooltips
  $('#hero-trends-page-header input').popup({
    on: 'focus'
  });
  
  // init values
  $('#hero-trends-hero-thresh input').val(trendsHeroMatchThreshold);

  $('#hero-trends-page-header .trends-date').datepicker();
  $('#hero-trends-page-header .trends-date').on('pick.datepicker', function(e) {
    trendsDateLimits[$(this).attr('name')] = e.date;
  });

  for (let d in trendsDateLimits) {
    $('.trends-date[name="' + d + '"]').datepicker('setDate', trendsDateLimits[d]);
  }

  // tabs and buttons
  $('#hero-trends-submenu .item').tab();
  $('#hero-trends-submenu .item').click(function() {
    $('#hero-trends-body table').floatThead('reflow');
  });

  $('#hero-trends-body .five.ui.buttons .button').click(function() {
    toggleHeroCollectionType('#hero-trends-body', $(this), '#hero-trends-body');
  });

  $('#trends-print-sections .ui.dropdown').dropdown('get value').split(',');
  $('#trends-file-menu').dropdown({
    onChange: handleTrendsAction
  });
}

function updateTrendsFilter(map, hero) {
  trendsHeroDataFilter = hero;
  trendsMapDataFilter = map;

  loadTrends();
}

function showTrendsSection() {
  $('#trends-file-menu').removeClass('is-hidden');
}

function resetTrendsFilter() {
  trendsHeroDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }
  trendsMapDataFilter = {
    mode: { $in: [ReplayTypes.GameMode.UnrankedDraft, ReplayTypes.GameMode.HeroLeague, ReplayTypes.GameMode.TeamLeague, ReplayTypes.GameMode.Custom]}
  }

  let filterWidget = $('.filter-popup-widget[widget-name="hero-trends-filter"]');
  for (let m in trendsHeroDataFilter.mode.$in) {
    filterWidget.find('.filter-widget-mode').dropdown('set selected', trendsHeroDataFilter.mode.$in[m]);
  }
}

function loadTrends() {
  // hero threshold
  trendsHeroMatchThreshold = $('#hero-trends-hero-thresh input').val();

  // update the queries
  let query1 = Object.assign({}, trendsMapDataFilter);
  query1.$where = function() {
    let d = new Date(this.date);
    return trendsDateLimits['1-start'] <= d && d < trendsDateLimits['1-end'];
  }

  let query2 = Object.assign({}, trendsMapDataFilter);
  query2.$where = function() {
    let d = new Date(this.date);
    return trendsDateLimits['2-start'] <= d && d < trendsDateLimits['2-end'];
  }

  DB.getMatches(query1, function(err, dp1) {
    DB.getMatches(query2, function(err, dp2) {
      $('#hero-trends-body tbody').html('');

      let stats = {};
      let p1stats = DB.summarizeMatchData(dp1, Heroes);
      let p2stats = DB.summarizeMatchData(dp2, Heroes);
      stats.period1 = p1stats.data;
      stats.period2 = p2stats.data;

      // should aggregate these since some heroes might not show up in both periods
      let aggr = {};
      for (let p in stats) {
        let data = stats[p];

        for (let h in data) {
          if (h === 'totalMatches' || h === 'totalBans')
            continue;

          if (!(h in aggr)) {
            aggr[h] = {}
          }
          let hero = data[h];

          // general win loss pop stats
          let win = {};
          win.heroName = h;
          win.heroImg = Heroes.heroIcon(h);
          win.winPercent = hero.games === 0 ? 0 : hero.wins / hero.games;
          win.formatWinPercent = formatStat('pct', win.winPercent);
          win.banPercent = hero.bans.total / data.totalMatches;
          win.formatBanPercent = formatStat('pct', win.banPercent);
          win.popPercent = hero.involved / data.totalMatches;
          win.formatPopPercent = formatStat('pct', win.popPercent);
          win.games = hero.games;
          win.win = hero.wins;
          win.loss = hero.games - hero.wins;
          win.bans = hero.bans.total;
          win.heroRole = Heroes.role(h);

          // picks and bans
          let draft = {};
          draft.format = {};
          draft.games = hero.games;
          draft.heroName = h;
          draft.heroImg = win.heroImg;
          draft.heroRole = win.heroRole;
          draft.winPercent = win.winPercent;
          draft.format.winPercent = win.formatWinPercent;
          draft.banPercent = win.banPercent;
          draft.format.banPercent = win.formatBanPercent;
          draft.bans = hero.bans;
          draft.firstBanPercent = hero.bans.first / data.totalMatches;
          draft.format.firstBanPercent = formatStat('pct', draft.firstBanPercent);
          draft.secondBanPercent = hero.bans.second / data.totalMatches;
          draft.format.secondBanPercent = formatStat('pct', draft.secondBanPercent);
          draft.picks = hero.picks;

          for (let p in draft.picks) {
            draft.picks[p].pct = draft.picks[p].count / data.totalMatches;
            draft.picks[p].formatPct = formatStat('pct', draft.picks[p].pct);
          }

          aggr[h][p] = { win, draft };
        }
      }

      // time to take deltas and render
      for (let h in aggr) {
        let context = {};
        context.heroName = h;
        context.heroImg = Heroes.heroIcon(h);
        context.heroRole = Heroes.role(h);

        context.period1 = aggr[h].period1;
        context.period2 = aggr[h].period2;

        // undef stuff is the worst
        if (stats.period1[h] === undefined)
          stats.period1[h] = { involved: 0 };
        if (stats.period2[h] === undefined)
          stats.period2[h] = { involved: 0 };

        if (stats.period1[h].involved + stats.period2[h].involved < trendsHeroMatchThreshold)
          continue;

        context.delta = {};
        context.deltaFmt = {};
        context.statSign = {};

        // note that percentage deltas are linear
        // wins
        if (context.period1 === undefined) {
          // initial period has no data
          context.delta.winPercent = context.period2.win.winPercent;
          context.delta.popPercent = context.period2.win.popPercent;
          context.delta.banPercent = context.period2.win.banPercent;
          // well i mean positive inf maybe isn't the best thing to put so 100%
          context.delta.win = 1;
          context.delta.loss = 1;
          context.delta.games = 1;
          context.delta.r1 = context.period2.draft.picks.round1.pct;
          context.delta.r2 = context.period2.draft.picks.round2.pct;
          context.delta.r3 = context.period2.draft.picks.round3.pct;
          context.delta.firstBanPercent = context.period2.draft.firstBanPercent;
          context.delta.secondBanPercent = context.period2.draft.secondBanPercent;

          context.period1 = {};
          context.period1.win = {
            formatWinPercent: '0%', winPercent: 0,
            formatBanPercent: '0%', banPercent: 0,
            formatPopPercent: '0%', popPercent: 0,
            games: 0
          };
          context.period1.draft = {
            picks: { round1: { pct: 0, formatPct: '0%' }, round2: { pct: 0, formatPct: '0%' }, round3: { pct: 0, formatPct: '0%' } },
            firstBanPercent: 0,
            secondBanPercent: 0
          };
        }
        else if (context.period2 === undefined) {
          // target period has no data
          context.delta.winPercent = -context.period1.win.winPercent;
          context.delta.popPercent = -context.period1.win.popPercent;
          context.delta.banPercent = -context.period1.win.banPercent;
          context.delta.win = -1;
          context.delta.loss = -1;
          context.delta.games = -1;
          context.delta.r1 = -context.period1.draft.picks.round1.pct;
          context.delta.r2 = -context.period1.draft.picks.round2.pct;
          context.delta.r3 = -context.period1.draft.picks.round3.pct;
          context.delta.firstBanPercent = -context.period1.draft.firstBanPercent;
          context.delta.secondBanPercent = -context.period1.draft.secondBanPercent;

          context.period2 = {};
          context.period2.win = {
            formatWinPercent: '0%', winPercent: 0,
            formatBanPercent: '0%', banPercent: 0,
            formatPopPercent: '0%', popPercent: 0,
            games: 0
          };
          context.period2.draft = {
            picks: { round1: { pct: 0, formatPct: '0%' }, round2: { pct: 0, formatPct: '0%' }, round3: { pct: 0, formatPct: '0%' } },
            firstBanPercent: 0,
            secondBanPercent: 0
          };
        }
        else {
          context.delta.winPercent = (context.period2.win.winPercent - context.period1.win.winPercent) / context.period1.win.winPercent;
          context.delta.popPercent = (context.period2.win.popPercent - context.period1.win.popPercent) / context.period1.win.popPercent;
          context.delta.banPercent = (context.period2.win.banPercent - context.period1.win.banPercent) / context.period1.win.banPercent;
          context.delta.win = (context.period2.win.win - context.period1.win.win) / context.period1.win.win;
          context.delta.loss = (context.period2.win.loss - context.period1.win.loss) / context.period1.win.loss;
          context.delta.games = (context.period2.win.games - context.period1.win.games) / context.period1.win.games;
          context.delta.r1 = (context.period2.draft.picks.round1.pct - context.period1.draft.picks.round1.pct) / context.period1.draft.picks.round1.pct; 
          context.delta.r2 = (context.period2.draft.picks.round2.pct - context.period1.draft.picks.round2.pct) / context.period1.draft.picks.round2.pct; 
          context.delta.r3 = (context.period2.draft.picks.round3.pct - context.period1.draft.picks.round3.pct) / context.period1.draft.picks.round3.pct; 
          context.delta.firstBanPercent = (context.period2.draft.firstBanPercent - context.period1.draft.firstBanPercent) / context.period1.draft.firstBanPercent;
          context.delta.secondBanPercent = (context.period2.draft.secondBanPercent - context.period1.draft.secondBanPercent) / context.period1.draft.secondBanPercent;
        }

        for (let stat in context.delta) {
          if (isNaN(context.delta[stat])) {
            context.deltaFmt[stat] = '0.0%';
            context.delta[stat] = '0';
          }
          else {
            context.deltaFmt[stat] = formatStat('pct', context.delta[stat]);
          }

          if (context.delta[stat] > 0) {
            context.deltaFmt[stat] = '+' + context.deltaFmt[stat];
            context.statSign[stat] = 'plus';
          }
          else if (context.delta[stat] < 0 ) {
            context.statSign[stat] = 'minus';
          }
        }

        $('#hero-trends-summary tbody').append(trendsOverallHeroRowTemplate(context));
        $('#hero-trends-picks tbody').append(trendsHeroPickTemplate(context));
        $('#hero-trends-bans tbody').append(trendsHeroBanTemplate(context));
      }

      // composition aggregation
      let comps = {};
      for (let c in p1stats.compositions) {
        let comp = p1stats.compositions[c];
        
        // nothing exists yet
        comps[c] = {
          p1Win: comp.wins / comp.games,
          p1Pop: comp.games / (p1stats.data.totalMatches * 2),
          p2Win: 0,
          p2Pop: 0,
          winDelta: -1,
          popDelta: -1,
          roles: comp.roles
        }
      }

      for (let c in p2stats.compositions) {
        let comp = p2stats.compositions[c];

        if (!(c in comps)) {
          comps[c] = {
            p1Win: 0,
            p1Pop: 0,
            roles: comp.roles
          }
        }

        comps[c].p2Win = comp.wins / comp.games;
        comps[c].p2Pop = comp.games / (p2stats.data.totalMatches * 2);

        comps[c].winDelta = (comps[c].p2Win - comps[c].p1Win) / comps[c].p1Win;
        comps[c].popDelta = (comps[c].p2Pop - comps[c].p1Pop) / comps[c].p1Pop;
      }

      for (let c in comps) {
        let comp = comps[c];
        let row = '<tr><td class="center aligned" data-sort-value="' + c + '">' + getCompositionElement(comp.roles) + '</td>';
        row += '<td class="center aligned" data-sort-value="' + comp.p1Win + '">' + formatStat('pct', comp.p1Win) + '</td>';
        row += '<td class="center aligned" data-sort-value="' + comp.p2Win + '">' + formatStat('pct', comp.p2Win) + '</td>';
        row += '<td class="center aligned ' + (comp.winDelta > 0 ? 'plus' : 'minus') + '" data-sort-value="' + comp.winDelta + '">' + (comp.winDelta > 0 ? '+' : '') + formatStat('pct', comp.winDelta) + '</td>';
        row += '<td class="center aligned" data-sort-value="' + comp.p1Pop + '">' + formatStat('pct', comp.p1Pop) + '</td>';
        row += '<td class="center aligned" data-sort-value="' + comp.p2Pop + '">' + formatStat('pct', comp.p2Pop) + '</td>';
        row += '<td class="center aligned ' + (comp.popDelta > 0 ? 'plus' : 'minus') + '" data-sort-value="' + comp.popDelta + '">' + (comp.popDelta > 0 ? '+' : '') + formatStat('pct', comp.popDelta) + '</td></tr>';
  
        $('#hero-trends-comps tbody').append(row);
      }

      $('#hero-trends-body table').floatThead('reflow');
      $('#hero-trends-body th').removeClass('sorted ascending descending');
    });
  });
}

function layoutTrendsPrint(sections) {
  let sects = sections;
  if (!sects) {
    sects = ['hero-trends-summary', 'hero-trends-picks', 'hero-trends-bans', 'hero-trends-comps'];
  }

  clearPrintLayout();
  addPrintHeader('Hero Trends');
  addPrintDate();
  $('#print-window .contents').append('<p>[1] From: ' + trendsDateLimits['1-start'] + ' To: ' + trendsDateLimits['1-end']);
  $('#print-window .contents').append('<p>[2] From: ' + trendsDateLimits['2-start'] + ' To: ' + trendsDateLimits['2-end']);

  for (let section of sects) {
    let sectionName = $('#' + section).attr('title');
    addPrintPage(section);
    addPrintSubHeader(sectionName, section);
    copyFloatingTable($('#' + section), getPrintPage(section));
  }

  $('#print-window').find('.plus').removeClass('plus').addClass('positive');
  $('#print-window').find('.minus').removeClass('minus').addClass('negative');
}

function printTrends(filename, section) {
  layoutTrendsPrint(section);
  renderAndPrint(filename, 'Letter', true);
}

function handleTrendsAction(value, text, $elem) {
  if (value === 'print') {
    dialog.showSaveDialog({
      title: 'Print Trends Report',
      filters: [{name: 'pdf', extensions: ['pdf']}]
    }, function(filename) {
      if (filename) {
        printTrends(filename, null);
      }
    });
  }
  else if (value === 'print-sections') {
    $('#trends-print-sections').modal({
      onApprove: function() {
        dialog.showSaveDialog({
          title: 'Print Trends Report',
          filters: [{name: 'pdf', extensions: ['pdf']}]
        }, function(filename) {
          if (filename) {
            let sections = $('#trends-print-sections .ui.dropdown').dropdown('get value').split(',');
            printTrends(filename, sections);
          }
        });
      },
      closable: false
    }).modal('show');
  }
}