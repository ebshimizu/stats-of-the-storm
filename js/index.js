// Global application logic
// hopefully this doesn't get too big and page-specific actions can be kept within
// their respective javascript files

// helpers and constants
const { formatSeconds, formatStat, capitalize, formatDelta, escapeHtml } = require('./js/util/formatters');

const RegionString = {
  1: 'NA',
  2: 'EU',
  3: 'KR',
  5: 'CN',
  98: 'PTR/TR',
};

const RoleColor = {
  'Melee Assassin': '#f2711c',
  'Ranged Assassin': '#db2828',
  Tank: '#2185d0',
  Bruiser: '#6435c9',
  Healer: '#21ba45',
  Support: '#00b5ad',
};

const RoleColorClass = {
  'Melee Assassin': 'orange',
  'Ranged Assassin': 'red',
  Tank: 'blue',
  Bruiser: 'violet',
  Healer: 'green',
  Support: 'teal',
};

const DetailStatList = require('./js/game-data/detail-stat-list');
const PerMapStatList = require('./js/game-data/map-stats');
const DetailStatString = require('./js/game-data/detail-stat-string');

// modules
const dt = require('datatables.net')(window, $);
const dtse = require('datatables.net-se')(window, $);
const dtfc = require('datatables.net-fixedcolumns')(window, $);
const dtbt = require('datatables.net-buttons')(window, $);
const dtbtse = require('datatables.net-buttons-se')(window, $);
require('datatables.net-buttons/js/buttons.html5.js')(window, $); // HTML 5 file export
const path = require('path');
const settings = require('electron-settings');

const watch = require('node-watch');

const { shell, remote, ipcRenderer } = require('electron');
const { app, dialog, BrowserWindow } = remote;

const Handlebars = require('handlebars');
const fs = require('fs-extra');
const cp = require('child_process');

const HeroesDB = require('./js/database.js');
const Parser = require('./hots-parser/parser.js');
const HeroesTalents = require('./js/heroes-talents.js');

// load the heroes talents database
// i need to do this earlier, so uh, here we are.
console.log('Loading Heroes Talents database');
const Heroes = new HeroesTalents.HeroesTalents(
  path.join(__dirname, '/assets/heroes-talents'),
  path.join(__dirname, '/assets/data'),
);

const ReplayTypes = require('./hots-parser/constants.js');

const summarizeHeroData = require('./js/database/summarize-hero-data');
const summarizeMapData = require('./js/database/summarize-map-data');
const summarizeMatchData = require('./js/database/summarize-match-data');
const summarizePlayerData = require('./js/database/summarize-player-data');
const summarizeTalentData = require('./js/database/summarize-talent-data');
const summarizeTeamData = require('./js/database/summarize-team-data');
const summarizeTrendData = require('./js/database/summarize-trend-data');

const TableDefs = require('./js/util/table-defs');
const Table = TableDefs.Table;

const heroDataCSV = require('./js/exporters/hero-csv');
const heroDraftCSV = require('./js/exporters/hero-draft-csv');

const convertNeDB = require('./js/database/convertNeDB');
const migrateDatabase = require('./js/database/migrate');

Handlebars.registerHelper('formatSeconds', formatSeconds);
Handlebars.registerHelper('formatPct', (value) => formatStat('pct', value));
Handlebars.registerHelper('formatKDA', (value) => formatStat('KDA', value));
Handlebars.registerHelper('formatDelta', formatDelta);
Handlebars.registerHelper('heroImage', (name) => `assets/heroes-talents/images/heroes/${Heroes.heroIcon(name)}`);

// datepicker gloabl settings
$.fn.datepicker.setDefaults({
  autoHide: true,
});

var DB;
var dbVersions;
var sections = {};
var prevSections = [];

$(document).ready(initApp);
var bgWindow;

// update functions
ipcRenderer.on('updateReady', function (event, message) {
  // display a popup message to alert people
  let text = `An update has been downloaded and will be installed automatically
    when the application closes. If you can't wait, you can close and re-open the
    app to get the latest features.`;
  showMessage('Update Ready!', text, { class: 'positive', sticky: true });
});

ipcRenderer.on('updateNotify', function (event, message) {
  showMessage(message, 'Downloading Update...', { class: 'positive' });
});

ipcRenderer.on('updateStatus', function (event, message) {
  console.log(message);
});

function initApp() {
  showLoader();

  // this is somewhat temporary, once 2.0 launches and is out for a bit,
  // we can probably eventually remove this
  convertNeDB(settings.get('dbPath'), function () {
    // initial ui event bindings
    // this should happen first just in case someone needs to exit and
    // the script dies in a fire
    $('#app-maximize-button').click(function () {
      if (BrowserWindow.getFocusedWindow().isMaximized()) {
        BrowserWindow.getFocusedWindow().unmaximize();
      } else {
        BrowserWindow.getFocusedWindow().maximize();
      }
    });
    $('#app-minimize-button').click(function () {
      BrowserWindow.getFocusedWindow().minimize();
    });
    $('#app-quit-button').click(function () {
      app.quit();
    });
    $('.app-version-number').text(app.getVersion());

    // initialization for the entire app
    // we'll probably want to pop up a loading thing here while all the things
    // happen.
    // create background window
    setLoadMessage('Setting up Parser');
    createBGWindow();

    // load database
    setLoadMessage('Loading Database');
    loadDatabase();
  });
}

// there's a functional break here as the database gets its version checked async
function resumeInitApp() {
  // this needs the db to exist
  setLoadMessage('Initializing Handlers');
  initGlobalUIHandlers();

  setLoadMessage('Retrieving versions');
  DB.getVersions(function (versions) {
    dbVersions = versions;
    setLoadMessage('Retrieving tags');
    DB.getTags(function (tags) {
      // sections
      setLoadMessage('Loading Sections');
      loadSections(tags);
      $('.app-version-number').text(app.getVersion());

      // populate some menus
      setLoadMessage('Populating Menus');
      globalDBUpdate();

      $('.player-menu input.search').keyup(function (e) {
        if (e.which === 38 || e.which === 40 || e.which === 13) return;

        updatePlayerMenuOptions(this, $(this).val());
      });

      removeLoader();
    });
  });
}

function loadDatabase() {
  if (!settings.has('dbPath')) {
    settings.set('dbPath', app.getPath('userData'));
  }

  if (!fs.existsSync(settings.get('dbPath'))) {
    showMessage(
      'Reverted to Default DB Location',
      `Failed to load database at ${settings.get(
        'dbPath',
      )}. The Database location was reset. You may change the Database location in settings`,
      { sticky: true, class: 'negative' },
    );
    settings.set('dbPath', app.getPath('userData'));
  }

  if (settings.get('completeDownload') === true) {
    setLoadMessage('Completing Download and Extraction of Online DB');
    finishCopyZipContents();
    settings.set('completeDownload', false);
  }

  const dbPath = settings.get('dbPath');
  console.log('Database loading from ' + dbPath);
  DB = new HeroesDB.HeroesDatabase(dbPath);
  DB.load(loadDatabaseComplete, setLoadMessage);
}

function loadDatabaseComplete(err) {
  if (err) {
    showMessage(
      'Database Load Error, Some App Functions May Not Work',
      'Try restarting the app, and if the issue persists, please file a bug report with this message: "' + err + '"',
      { sticky: true, class: 'negative' },
    );
    console.log(err);
    // the app actually continues the load here, the message should be waiting at the end
  }

  // check database version
  migrateDatabase(DB, resumeInitApp);
}

function initGlobalUIHandlers() {
  // sidebar
  $('#main-menu').sidebar('setting', 'transition', 'overlay').sidebar('attach events', '#show-sidebar-button');

  $('#main-menu a.item').each(function (idx, elem) {
    let sectionName = $(elem).attr('section-name');
    $(elem).click(function () {
      changeSection(sectionName);
      $('#main-menu').sidebar('hide');
    });
  });

  $('#section-menu-back-button').click(function () {
    changeSection(prevSections.pop(), false, 'pop');
  });

  $('#collection-switch-menu').dropdown({
    action: 'activate',
    onChange: setAppCollection,
  });
  updateCollectionMenu();

  //open links externally by default
  $(document).on('click', 'a[href^="http"]', function (event) {
    event.preventDefault();
    shell.openExternal(this.href);
  });

  $(document).on('click', '.link-to-player', function (event) {
    showPlayerProfile($(this).attr('player-id'));
  });

  $(document).on('click', '.link-to-team', function (event) {
    $('#team-set-team').dropdown('set text', $(this).text());
    $('#team-set-team').dropdown('set value', $(this).attr('team-id'));
    $('#teams-page-header .team-name').text($(this).text());
    changeSection('teams', true);
  });
}

function loadSections(tags) {
  // settings
  $('#main-content').append(getTemplate('settings', '#settings-page'));
  initSettingsPage();

  $('#main-content').append(getTemplate('matches', '#matches-page'));
  initMatchesPage(tags);

  $('#main-content').append(getTemplate('match-detail', '#match-detail-page'));
  initMatchDetailPage();

  $('#main-content').append(getTemplate('player', '#player-page'));
  initPlayerPage(tags);

  $('#main-content').append(getTemplate('hero-collection', '#hero-collection-page'));
  initHeroCollectionPage(tags);

  $('#main-content').append(getTemplate('player-ranking', '#player-ranking-page'));
  initPlayerRankingPage(tags);

  $('#main-content').append(getTemplate('teams', '#teams-page'));
  initTeamsPage(tags);

  $('#main-content').append(getTemplate('team-ranking', '#team-ranking-page'));
  initTeamRankingPage(tags);

  $('#main-content').append(getTemplate('about', '#about-page'));

  $('#main-content').append(getTemplate('trends', '#hero-trends-page'));
  initTrendsPage(tags);

  $('#main-content').append(getTemplate('maps', '#maps-page'));
  initMapsPage(tags);

  // register sections
  sections.settings = {
    id: '#settings-page-content',
    title: 'App Settings',
    showBack: false,
    onShow: showSettingsPage,
  };
  sections.matches = {
    id: '#matches-page-content',
    title: 'Matches',
    showBack: false,
    reset: resetMatchesPage,
    onShow: showMatchesPage,
  };
  sections['match-detail'] = {
    id: '#match-detail-page-content',
    title: 'Match Details',
    showBack: true,
    onShow: matchDetailsShowSection,
  };
  sections.player = {
    id: '#player-page-content',
    title: 'Player Details',
    showBack: false,
    onShow: showPlayerPage,
    reset: resetPlayerPage,
  };
  sections['hero-collection'] = {
    id: '#hero-collection-page-content',
    title: 'Hero Statistics',
    showBack: false,
    reset: resetHeroCollection,
    onShow: heroCollectionShowSection,
  };
  sections['player-ranking'] = {
    id: '#player-ranking-page-content',
    title: 'Player Statistics',
    showBack: false,
    reset: resetPlayerRankingPage,
    onShow: playerRankingShowSection,
  };
  sections.teams = {
    id: '#teams-page-content',
    title: 'Teams',
    showBack: false,
    reset: resetTeamsPage,
    onShow: teamShowSection,
  };
  sections['team-ranking'] = {
    id: '#team-ranking-page-content',
    title: 'Team Statistics',
    reset: resetTeamRankingPage,
    onShow: showTeamRankingSection,
    showBack: false,
  };
  sections.about = { id: '#about-page-content', title: 'About', showBack: false };
  sections.trends = {
    id: '#hero-trends-page-content',
    title: 'Hero Trends',
    showBack: false,
    onShow: showTrendsSection,
  };
  sections.maps = { id: '#maps-page-content', title: 'Battlegrounds', showBack: false, onShow: onShowMapsPage };

  // Matches should be the default view of the app.
  // this can be changed for development to test specific pages of course.
  // this is the dev setting.
  //changeSection('hero-collection');

  $('#about-tab-menu .item').tab();

  // this is the release default
  changeSection('matches');
}

const getHandlebars = require('./js/util/handlebars');

// returns the template contained in an import
function getTemplate(name, selector) {
  const link = document.querySelector('link[name="' + name + '"]');
  return link.import.querySelector(selector).innerHTML;
}

function createBGWindow() {
  let bgPath = 'file://' + path.join(__dirname, './background.html');
  bgWindow = new BrowserWindow({
    width: 400,
    height: 400,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
    },
  });
  bgWindow.loadURL(bgPath);
  //bgWindow.webContents.openDevTools();
}

function changeSection(to, overrideBack, action) {
  // if it's already being shown, do nothing
  if (!$(sections[to].id).hasClass('hidden')) return;

  // this should only trigger for the visible section
  // if the back button is visible, we should store a little history
  if (action !== 'pop' && (sections[to].showBack || overrideBack === true)) {
    prevSections.push($('.is-page.visible').attr('section-name'));
  }
  // uh wait yeah if this is length 0 then it already is [] ... ?
  else if (prevSections.length === 0) {
    // clear the history
    prevSections = [];
  }

  for (let s in sections) hideSection(s);

  // ok wait also hide the menu cause that changes from section to section
  $('#section-menu .section-submenu').addClass('is-hidden');

  showSection(to, overrideBack || prevSections.length > 0);
  if (sections[to].onShow) {
    sections[to].onShow();
  }
}

function showSection(name, overrideBack) {
  if ($(sections[name].id).hasClass('hidden')) $(sections[name].id).transition('fade right');

  setMenuTitle(sections[name].title, sections[name].showBack || overrideBack);
}

function hideSection(name) {
  if ($(sections[name].id).hasClass('visible')) $(sections[name].id).transition('fade right');
}

function setMenuTitle(title, showBackButton) {
  $('#section-menu-name').text(title);

  if (showBackButton) {
    $('#section-menu-back-button').addClass('show');
  } else {
    $('#section-menu-back-button').removeClass('show');
  }
}

// updates certain elements based on a new replay inserted into the database
function globalDBUpdate() {
  // patch update
  addPatchMenuOptions($('#filter-popup-widget .filter-widget-patch'), function () {
    $('#filter-popup-widget .filter-widget-patch').dropdown('refresh');
  });

  addPatchMenuOptions($('#match-patch-select'), function () {
    $('#match-patch-select').dropdown('refresh');
  });

  populateStatCollectionMenus();
}

// called on keydown for all player input fields
function updatePlayerMenuOptions(elem, value) {
  // ok so like search for the player i guess
  let q = new RegExp(value, 'i');
  const aliasFilter = { $or: [{ aliasedTo: '' }, { aliasedTo: { $exists: false } }] };
  const playerQuery = { $or: [{ name: { $regex: q } }, { nickname: { $regex: q } }] };
  const query = { $and: [aliasFilter, playerQuery] };

  DB.getPlayers(query, function (err, players) {
    let menu = $(elem).parent('.dropdown');
    menu.find('.menu .item').not('.active').remove();
    menu.find('.message').remove();

    // limit 10 for perf
    let max = settings.get('playerThreshold');
    let count = 0;
    for (let player of players) {
      if (count > max) break;

      let name = formatPlayerName(player);

      let item = '<div class="item" data-value="' + escapeHtml(player._id) + '">';
      //item += '<div class="ui horizontal label"><i class="file outline icon"></i>' + player.matches + '</div>';
      item +=
        '<div class="item" data-value="' +
        escapeHtml(player._id) +
        '">' +
        name +
        ' (' +
        RegionString[player.region] +
        ')</div>';

      menu.find('.menu').append(item);
      count += 1;
    }

    menu.dropdown('refresh');
  });
}

// given player object, formats player name accoriding to options
function formatPlayerName(player, opts = {}) {
  let name = player.name;

  if (!opts.noTag && player.tag) {
    name += '#' + player.tag;
  }

  return escapeHtml(name);
}

// given a user id, returns 'focus-player' class if the player id is, well, the focus player
function focusClass(id) {
  if (id === settings.get('selectedPlayerID')) return 'focus-player';

  return '';
}

// given a json object this function will insert the proper hero menu items into the
// structure. it will NOT initialize callbacks for the menu, that is up to the caller
function addHeroMenuOptions(menu) {
  let heroes = Heroes.allHeroNames;

  menu.find('.menu').html('');
  for (let i in heroes) {
    let val = heroes[i];
    let elem =
      '<div class="item" data-value="' +
      heroes[i] +
      '"><img class="ui avatar image" src="assets/heroes-talents/images/heroes/';
    elem += Heroes.heroIcon(heroes[i]) + '">' + heroes[i] + '</div>';
    menu.find('.menu').append(elem);
  }
}

function addMapMenuOptions(menu) {
  menu.find('.menu').html('');
  for (let m in ReplayTypes.MapType) {
    let map = ReplayTypes.MapType[m];
    menu.find('.menu').append('<div class="item" data-value="' + map + '">' + map + '</div>');
  }
}

function addPatchMenuOptions(elem, callback) {
  elem.find('.menu').html('');

  for (let v in dbVersions) {
    elem
      .find('.menu')
      .append('<div class="item" data-value="' + escapeHtml(v) + '">' + escapeHtml(dbVersions[v]) + '</div>');
  }

  callback();
}

function populateTeamMenu(elem) {
  DB.getAllTeams(function (err, docs) {
    elem.find('.menu').html('');

    let keys = [];
    for (let d in docs) {
      keys.push({ index: d, value: docs[d].name });
    }
    keys = keys.sort(function (a, b) {
      if (a.value < b.value) return -1;
      if (b.value < a.value) return 1;
      return 0;
    });

    for (let i of keys) {
      let d = i.index;
      elem
        .find('.menu')
        .append(
          '<div class="item" data-value="' + escapeHtml(docs[d]._id) + '">' + escapeHtml(docs[d].name) + '</div>',
        );
    }

    elem.dropdown('refresh');
  });
}

function updateCollectionMenu(callback) {
  // add the proper options n stuff
  DB.getCollections(function (err, collections) {
    // alpha sort
    collections.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }

      return 0;
    });

    $('#collection-switch-menu .menu').html('');

    // generic collection menus do not get the clear option
    $('.collection-menu .menu').html('');
    $('#collection-switch-menu .menu').append('<div class="item" data-value="none">All Matches</div>');

    if (collections.length > 0) $('#collection-switch-menu .menu').append('<div class="ui divider"></div>');

    for (let c in collections) {
      let collection = collections[c];

      let elem = '<div class="item" data-value="' + collection._id + '">' + collection.name + '</div>';
      $('#collection-switch-menu .menu').append(elem);
      $('.collection-menu .menu').append(elem);
    }

    // uhhhhh yeah special case (probably bad but i'm doing it anyway)
    $('#settings-collection-import .menu').prepend('<div class="item" data-value="">[No Collection]</div>');

    $('#collection-switch-menu').dropdown('refresh');
    $('.collection-menu').dropdown('refresh');

    if (callback) {
      callback();
    }
  });
}

function populateStatCollectionMenus() {
  $('.cache-collections .menu').html('');
  $('.cache-collections .menu').append('<div class="item" data-value="all">All Matches</div>');

  DB.getCollections(function (err, collections) {
    if (collections.length > 0) {
      $('.cache-collections .menu').append('<div class="ui divider"></div>');
    }

    for (let c in collections) {
      let col = collections[c];
      $('.cache-collections .menu').append('<div class="item" data-value="' + col._id + '">' + col.name + '</div>');
    }

    DB.getExternalCacheCollections(function (err, collections) {
      if (collections.length > 0) {
        $('.cache-collections .menu').append('<div class="ui divider"></div>');
      }

      for (let c in collections) {
        let col = collections[c];
        $('.cache-collections .menu').append(
          '<div class="item" data-value="' +
            col._id +
            '" data-type="external">' +
            col.dbName +
            ': ' +
            col.name +
            '</div>',
        );
      }

      $('.cache-collections').dropdown('refresh');
    });
  });
}

function populateTagMenuWithValues(menu, tags) {
  menu.find('.menu').html('');

  for (let tag of tags) {
    menu.find('.menu').append('<div class="item" data-value="' + tag + '">' + tag + '</div>');
  }

  menu.dropdown('refresh');
}

// populates the tag menu with available tags
function populateTagMenu(menu, callback) {
  DB.getTags(function (tags) {
    populateTagMenuWithValues(menu, tags);

    if (callback) callback();
  });
}

function setAppCollection(value, text, $elem) {
  if (value === 'none') {
    $('#collection-switch-menu .collection-name').text('None');
    DB.setCollection(null);
  } else {
    $('#collection-switch-menu .collection-name').text(text);
    DB.setCollection(value);
  }
  resetAllSections();
}

function resetAllSections() {
  // this should be called after a database reload
  // sections will register a reset function (if any) that will be called here
  updateCollectionMenu();
  populateTeamMenu($('.team-menu'));

  for (s in sections) {
    if (sections[s].reset) {
      sections[s].reset();
    }
  }
}

function setLoadMessage(msg) {
  $('.load-status').html(msg);
}

function showLoader() {
  $('#main-app-loader').dimmer({ closable: false }).dimmer('show');
}

function removeLoader() {
  $('#main-app-loader').dimmer('hide');
}

function showMessage(title, text, opts = {}) {
  let elem = '<div class="ui message transition hidden">';
  elem += '<div class="header">' + title + '</div>';
  elem += '<p>' + text + '</p>';
  elem += '</div>';

  elem = $(elem);

  if (opts.class) {
    elem.addClass(opts.class);
  }

  if (opts.sticky) {
    elem.prepend('<i class="close icon"></i>');
    elem.find('i').click(function () {
      $(this)
        .parent()
        .transition('fade left', 500, function () {
          elem.remove();
        });
    });
    $('#message-container').append(elem);
    elem.transition('fade left');
  } else {
    $('#message-container').append(elem);
    elem.transition({
      animation: 'fade left',
      onComplete: function () {
        setTimeout(function () {
          elem.transition({
            animation: 'fade left',
            onComplete: function () {
              elem.remove();
            },
          });
        }, 4000);
      },
    });
  }

  // should really dump to console too just in case rendering gets messed up
  console.log(title + ': ' + text);
}

function exportMatch(id, filename) {
  DB.getMatchesByID([id], function (err, docs) {
    let match = docs[0];
    DB.getHeroDataForID(id, function (err, docs) {
      let matchExport = {
        match: match,
        players: docs,
      };
      fs.writeFile(filename, JSON.stringify(matchExport, null, 2), function (err) {
        if (err) {
          showMessage('Export Error', err, { class: 'negative' });
        } else {
          showMessage('Export Complete', 'Match ' + id + ' saved to ' + filename);
        }
      });
    });
  });
}

function exportPlayer(id, filename) {
  DB.getHeroDataForPlayer(id, function (err, docs) {
    let data = summarizeHeroData(docs);
    fs.writeFile(filename, JSON.stringify(data, null, 2), function (err) {
      if (err) {
        showMessage('Export Error', err, { class: 'negative' });
      } else {
        showMessage('Export Complete', 'Player ' + id + ' saved to ' + filename);
      }
    });
  });
}

function showPlayerProfile(id) {
  preloadPlayerID(id);
  changeSection('player', true);
}

// given just a random bunch of players, creates the mapping between
// player ID and the alias target
function createPlayerAliasMap(playerDocs) {
  let key = {};
  for (let p of playerDocs) {
    if (p.aliasedTo && p.aliasedTo !== '') {
      key[p._id] = p.aliasedTo;
    }

    if ('aliases' in p) {
      for (let alias of p.aliases) {
        key[alias] = p._id;
      }
    }
  }
  return key;
}

function clearPrintLayout() {
  $('#print-window .contents').html('');
}

function addPrintPage(name) {
  $('#print-window .contents').append('<div class="new-page page ' + name + '"></div>');
}

function addPrintDate() {
  $('#print-window .contents').append('<p>Database path: ' + settings.get('dbPath') + '</p>');
  $('#print-window .contents').append('<p>Printed on ' + new Date().toLocaleString('en-US') + '</p>');
}

function getPrintPage(page) {
  return $('#print-window .contents .page.' + page);
}

function addPrintHeader(title, page) {
  let t = '<h1 class="ui dividing header new-page">' + title + '</h1>';

  if (!page) {
    $('#print-window .contents').append(t);
  } else {
    $('#print-window .contents')
      .find('.page.' + page)
      .append(t);
  }
}

function addPrintSubHeader(title, page) {
  let t = '<h2 class="ui dividing header new-page">' + title + '</h2>';

  if (!page) {
    $('#print-window .contents').append(t);
  } else {
    $('#print-window .contents')
      .find('.page.' + page)
      .append(t);
  }
}

function copyFloatingTable(src, dest) {
  // float thead pulls the headers out, we'll put them back in and copy to the specified destination element
  let table = src.clone();
  let headers = table.find('.floatThead-table thead').detach();
  table.find('.floatThead-container').remove();

  if (headers.length > 0) {
    table.find('thead').remove();
    table.find('table.table').prepend(headers);
  }

  // printing classes
  table.find('table').addClass('compact').removeClass('fixed');
  table.find('table').attr('style', '');

  // shrink image headers
  table.find('h3.image.header').replaceWith(function () {
    return '<h4 class="ui image header">' + $(this).html() + '</h4>';
  });

  // remove wrapper
  if (dest) {
    dest.append(table.find('table'));
  } else {
    $('#print-window .contents').append(table.find('table'));
  }
}

function copyGraph(srcData, dest, opts = {}) {
  dest.removeClass('.chartjs-render-monitor');
  dest.attr('style', '');

  if (opts.width) {
    dest.attr('width', opts.width);
  }

  if (opts.height) {
    dest.attr('height', opts.height);
  }

  // hey lets deep copy objects by straight up serializing them and then
  // deserializing the string ??????????
  let data = {};
  data.type = srcData.type;
  data.options = JSON.parse(JSON.stringify(srcData.options));
  data.options.legend.labels.fontColor = 'black';
  data.options.responsive = false;
  data.options.animation.duration = 0;

  if (data.options.scales) {
    data.options.scales.yAxes[0].ticks.fontColor = '#000';
    data.options.scales.yAxes[0].ticks.major.fontColor = '#000';
    data.options.scales.yAxes[0].ticks.minor.fontColor = '#000';
    data.options.scales.xAxes[0].ticks.fontColor = '#000';
    data.options.scales.xAxes[0].ticks.major.fontColor = '#000';
    data.options.scales.xAxes[0].ticks.minor.fontColor = '#000';
  }

  data.data = srcData.data;

  let tmpChart = new Chart(dest, data);
}

function renderAndPrint(filename, size = 'Letter', landscape = false) {
  $('#print-window').removeClass('is-hidden');

  // remove all inverted classes
  $('#print-window .ui').removeClass('inverted');

  // let's be honest i am really bad at browser windows
  let windows = BrowserWindow.getAllWindows();
  let win = null;
  for (let window of windows) {
    if (window.getTitle() === 'Stats of the Storm') {
      win = window;
    }
  }

  win.webContents.printToPDF({ landscape: landscape, pageSize: size }, function (error, data) {
    if (error) {
      showMessage('Print Error', error, { class: 'negative' });
    } else {
      try {
        fs.writeFileSync(filename, data);
        showMessage('Print Success', 'Printed to ' + filename, { class: 'positive' });
      } catch (err) {
        $('#print-window').addClass('is-hidden');
        showMessage('Print Error', err, { class: 'negative' });
      }
    }

    $('#print-window').addClass('is-hidden');
    $('#print-window .contents').html('');
  });
}

// takes a bunch of hero data json docs and converts them into rows
function exportHeroDataAsCSV(docs, file) {
  // assert docs > 0
  if (docs.length === 0) return;

  fs.writeFile(file, heroDataCSV(docs), function (err) {
    if (err) {
      showMessage('CSV Export Error', err, { class: 'negative' });
    } else {
      showMessage('CSV Export Complete', 'Exported to ' + file);
    }
  });
}

function dateToWinTime(date) {
  let ms = date.getTime();
  return (ms + 11644473600000) * 10000 + 9999;
}
