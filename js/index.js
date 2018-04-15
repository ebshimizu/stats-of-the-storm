// Global application logic
// hopefully this doesn't get too big and page-specific actions can be kept within
// their respective javascript files

const path = require('path');
const HeroesDB = require(path.join(__dirname, './js/database.js'));
const settings = require('electron-settings');
const Parser = require(path.join(__dirname, './parser/parser.js'));
const HeroesTalents = require(path.join(__dirname, './js/heroes-talents.js'));
const app = require('electron').remote.app;
const dialog = require('electron').remote.dialog;
const remote = require('electron').remote;
const shell = require('electron').shell;
const Handlebars = require('handlebars');
const fs = require('fs');
const cp = require('child_process');
const BrowserWindow = require('electron').remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const ReplayTypes = require(path.join(__dirname, 'parser/constants.js'));
const moment = require('moment');
const FormData = require('form-data');
const { is, fixPathForAsarUnpack } = require('electron-util');

const RegionString = {
  1: 'NA',
  2: 'EU',
  3: 'Asia',
  98: 'PTR/TR'
}

const DetailStatList = [
  'Takedowns',
  'SoloKill',
  'Assists',
  'Deaths',
  'KillParticipation', // special case
  'KDA',
  'HighestKillStreak',
  'VengeancesPerformed',
  'TimeSpentDead',
  'OutnumberedDeaths',
  'EscapesPerformed',
  'TeamfightEscapesPerformed',
  'HeroDamage',
  'TeamfightHeroDamage',
  'SiegeDamage',
  'StructureDamage',
  'MinionDamage',
  'SummonDamage',
  'CreepDamage',
  'Healing',
  'TeamfightHealingDone',
  'SelfHealing',
  'ProtectionGivenToAllies',
  'ClutchHealsPerformed',
  'DamageTaken',
  'TeamfightDamageTaken',
  'TimeCCdEnemyHeroes',
  'TimeRootingEnemyHeroes',
  'TimeSilencingEnemyHeroes',
  'TimeStunningEnemyHeroes',
  //'TimeOnPoint',
  'OnFireTimeOnFire',
  'ExperienceContribution',
  'MercCampCaptures',
  //'TownKills',
  'WatchTowerCaptures'
  //'Role'
];

const PerMapStatList = {
  "Towers of Doom" : ["AltarDamageDone"],
  "Battlefield of Eternity" : ["DamageDoneToImmortal"],
  "Dragon Shire" : ["DragonNumberOfDragonCaptures", "DragonShrinesCaptured"],
  "Blackheart's Bay" : ["BlackheartDoubloonsCollected", "BlackheartDoubloonsTurnedIn"],
  "Haunted Mines" : ["MinesSkullsCollected"],
  "Infernal Shrines" : ["DamageDoneToShrineMinions"],
  "Garden of Terror" : ["GardensPlantDamage", "GardensSeedsCollected"],
  "Tomb of the Spider Queen" : ["GemsTurnedIn"],
  "Warhead Junction" : ["NukeDamageDone"],
  "Cursed Hollow" : ["CurseDamageDone"],
  "Volskaya Foundry" : [],
  "Sky Temple" : ["TimeInTemple"],
  "Braxis Holdout" : ["DamageDoneToZerg"],
  "Hanamura" : []
};

const DetailStatString = {
  'Takedowns' : 'Takedowns',
  'KillParticipation' : 'Kill Participation', // special case
  'Kills' : 'Kills',  // special case
  'HighestKillStreak' : 'Highest Kill Streak',
  'SoloKill' : 'Kills',
  'VengeancesPerformed' : 'Vengeances',
  'Assists' : 'Assists',
  'Deaths' : 'Deaths',
  'TimeSpentDead' : 'Time Dead',
  'OutnumberedDeaths' : 'Deaths While Outnumbered',
  'EscapesPerformed' : 'Escapes',
  'HeroDamage' : 'Hero Damage',
  'SiegeDamage' : 'Siege Damage',
  'StructureDamage' : 'Structure Damage',
  'MinionDamage' : 'Minion Damage',
  'SummonDamage' : 'Summon Damage',
  'CreepDamage' : 'Creep Damage',
  'Healing' : 'Healing',
  'SelfHealing' : 'Self Healing',
  'ProtectionGivenToAllies' : 'Allied Shields',
  'ClutchHealsPerformed' : 'Clutch Heals',
  'DamageTaken' : 'Damage Taken',
  'TeamfightDamageTaken' : 'Team Fight Damage Taken',
  'TeamfightEscapesPerformed' : 'Team Fight Escapes',
  'TeamfightHealingDone' : 'Team Fight Healing',
  'TeamfightHeroDamage' : 'Team Fight Hero Damage',
  'TimeCCdEnemyHeroes' : 'CC Time',
  'TimeRootingEnemyHeroes' : 'Root Time',
  'TimeSilencingEnemyHeroes' : 'Silence Time',
  'TimeStunningEnemyHeroes' : 'Stun Time',
  'TimeOnPoint' : 'Time on Point',
  'OnFireTimeOnFire' : 'Time on Fire',
  'ExperienceContribution' : 'XP Contribution',
  'MercCampCaptures' : 'Merc Camp Captures',
  'TownKills' : 'Town Kills',
  'WatchTowerCaptures' : 'Watch Tower Captures',
  'Role' : 'Role',
  'AltarDamageDone' : 'Altar Damage Done',
  'DamageDoneToImmortal' : 'Damage to Immortal',
  'DragonNumberOfDragonCaptures' : 'Dragon Knights Captured',
  'DragonShrinesCaptured' : 'Shrines Captured',
  'BlackheartDoubloonsCollected' : 'Dubloons Held At End',
  'BlackheartDoubloonsTurnedIn' : 'Dubloons Turned In',
  'MinesSkullsCollected' : 'Skulls Collected',
  'DamageDoneToShrineMinions' : 'Shrine Minion Damage',
  'GardensPlantDamage' : 'Plant Damage',
  'GardensSeedsCollected' : 'Seeds Collected',
  'GemsTurnedIn' : 'Gems Turned In',
  'NukeDamageDone' : 'Nuke Damage',
  'CurseDamageDone' : 'Curse Damage',
  'TimeInTemple' : 'Time On Temple',
  'DamageDoneToZerg' : 'Damage Done to Zerg',
  'KDA' : 'KDA',
  'timeDeadPct' : 'Time Dead %',
  'PPK' : 'People Per Kill',
  'mercCaptures' : 'Mercenary Captures',
  'mercUptime' : 'Mercenary Uptime',
  'mercUptimePercent' : 'Mercenary Uptime %',
  'timeTo10' : 'Time to Level 10',
  'timeTo20' : 'Time to Level 20',
  'avgTimeSpentDead' : 'Average Time Spent Dead',
  'T1' : 'Time at Level 1',
  'T2' : 'Time at Level 4',
  'T3' : 'Time at Level 7',
  'T4' : 'Time at Level 10',
  'T5' : 'Time at Level 13',
  'T6' : 'Time at Level 16'
};

const RoleColor = {
  'Assassin' : '#db2828',
  'Warrior' : '#2185d0',
  'Support' : '#00b5ad',
  'Specialist' : '#6435c9',
  'Multiclass' : '#a333c8'
}

const RoleColorClass = {
  'Assassin' : 'red',
  'Warrior' : 'blue',
  'Support' : 'teal',
  'Specialist' : 'violet',
  'Multiclass' : 'purple'
}

var DB;
var Heroes;
var sections = {};
var prevSections = [];

$(document).ready(initApp);
var bgWindow;

// update functions
ipcRenderer.on('updateReady', function(event, message) {
  // display a popup message to alert people
  let text = `An update has been downloaded and will be installed automatically
    when the application closes. If you can't wait, you can close and re-open the
    app to get the latest features.`
  showMessage('Update Ready!', text, { class: 'positive', sticky: true });
});

ipcRenderer.on('updateNotify', function(event, message) {
  showMessage(message, 'Downloading Update...', { class: 'positive' });
});

ipcRenderer.on('updateStatus', function(event, message) {
  console.log(message);
});

function initApp() {
  showLoader();

  // initial ui event bindings
  // this should happen first just in case someone needs to exit and
  // the script dies in a fire
  $('#app-maximize-button').click(function() {
    if (BrowserWindow.getFocusedWindow().isMaximized()) {
      BrowserWindow.getFocusedWindow().unmaximize();
    }
    else {
      BrowserWindow.getFocusedWindow().maximize();
    }
  });
  $('#app-minimize-button').click(function() {
    BrowserWindow.getFocusedWindow().minimize();
  });
  $('#app-quit-button').click(function() {
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
}

// there's a functional break here as the database gets its version checked async
function resumeInitApp() {
  // this needs the db to exist
  setLoadMessage('Initializing Handlers');
  initGlobalUIHandlers();

  // sections
  setLoadMessage('Loading Sections');
  loadSections();
  $('.app-version-number').text(app.getVersion());

  // populate some menus
  setLoadMessage('Populating Menus');
  globalDBUpdate();

  removeLoader();
}

function loadDatabase() {
  if (!settings.has('dbPath')) {
    settings.set('dbPath', app.getPath('userData'));
  }

  console.log('Loading Heroes Talents database');
  // load the heroes talents database
  Heroes = new HeroesTalents.HeroesTalents(__dirname + '/assets/heroes-talents', __dirname + '/assets/data');

  let path = settings.get('dbPath');
  console.log("Database loading from " + path);
  DB = new HeroesDB.HeroesDatabase(path);
  DB.load(loadDatabaseComplete, setLoadMessage);
}

function loadDatabaseComplete(err) {
  if (err) {
    showMessage('Database Load Error, Some App Functions May Not Work', 'Try restarting the app, and if the issue persists, please file a bug report with this message: "' + err + '"', { 'sticky' : true, 'class' : 'negative' })
    console.log(err);
    // the app actually continues the load here, the message should be waiting at the end
  }

  // check database version
  DB.getDBVersion(checkDBVersion);
}

function checkDBVersion(dbVer) {
  console.log('Database and Parser version: ' + dbVer);

  if (dbVer < Parser.VERSION) {
    // here's where database migrations go, if any
    console.log('Updating database from version ' + dbVer + ' to version ' + Parser.VERSION);
    if (dbVer === 1) {
      migrateVersion1ToVersion2();
      // migrate will call back to check DB version after updating the version
      return;
    }
    else if (dbVer === 2) {
      migrateVersion2ToVersion3();
      return;
    }
  }
  else if (dbVer > Parser.VERSION) {
    showMessage('Warning: Loading Newer Database in Older App', 'The app should function normally, however the database is newer than the app, and some unexpected errors may occur.', { sticky: true });
  }

  setLoadMessage('Database and Parser Version ' + dbVer);
  resumeInitApp();
}

function initGlobalUIHandlers() {
  // sidebar
  $('#main-menu').sidebar('setting', 'transition', 'overlay').
    sidebar('attach events', '#show-sidebar-button');

  $('#main-menu a.item').each(function(idx, elem) {
    let sectionName = $(elem).attr('section-name');
    $(elem).click(function() {
      changeSection(sectionName);
      $('#main-menu').sidebar('hide');
    })
  });

  $('#section-menu-back-button').click(function() {
    changeSection(prevSections.pop(), false, 'pop');
  });

  $('#collection-switch-menu').dropdown({
    action: 'activate',
    onChange: setAppCollection
  });
  updateCollectionMenu();

  //open links externally by default
  $(document).on('click', 'a[href^="http"]', function(event) {
      event.preventDefault();
      shell.openExternal(this.href);
  });
}

function loadSections() {
  // settings
  $('#main-content').append(getTemplate('settings', '#settings-page'));
  initSettingsPage();

  $('#main-content').append(getTemplate('matches', '#matches-page'));
  initMatchesPage();

  $('#main-content').append(getTemplate('match-detail', '#match-detail-page'));
  initMatchDetailPage();

  $('#main-content').append(getTemplate('player', '#player-page'));
  initPlayerPage();

  $('#main-content').append(getTemplate('hero-collection', '#hero-collection-page'));
  initHeroCollectionPage();

  $('#main-content').append(getTemplate('player-ranking', '#player-ranking-page'));
  initPlayerRankingPage();

  $('#main-content').append(getTemplate('teams', '#teams-page'));
  initTeamsPage();

  $('#main-content').append(getTemplate('team-ranking', '#team-ranking-page'))
  initTeamRankingPage();

  $('#main-content').append(getTemplate('about', '#about-page'));

  $('#main-content').append(getTemplate('trends', '#hero-trends-page'));
  initTrendsPage();

  $('#main-content').append(getTemplate('maps', '#maps-page'));
  initMapsPage();

  // register sections
  sections.settings = {id: '#settings-page-content', title: 'App Settings', showBack: false, onShow: showSettingsPage };
  sections.matches = {id: '#matches-page-content', title: 'Matches', showBack: false, reset: resetMatchesPage, onShow: showMatchesPage };
  sections['match-detail'] = {id: '#match-detail-page-content', title: 'Match Details', showBack: true, onShow: matchDetailsShowSection };
  sections.player = {id: '#player-page-content', title: 'Player Details', showBack: false, onShow: showPlayerPage, reset: resetPlayerPage};
  sections['hero-collection'] = {id: '#hero-collection-page-content', title: 'Hero Statistics', showBack: false, reset: resetHeroCollection, onShow: heroCollectionShowSection };
  sections['player-ranking'] = {id: '#player-ranking-page-content', title: 'Player Statistics', showBack: false, reset: resetPlayerRankingPage, onShow: playerRankingShowSection };
  sections.teams = {id: '#teams-page-content', title: 'Teams', showBack: false, reset: resetTeamsPage, onShow: teamShowSection };
  sections['team-ranking'] = {id: '#team-ranking-page-content', title: 'Team Statistics', reset: resetTeamRankingPage, onShow: showTeamRankingSection, showBack: false };
  sections.about = { id: '#about-page-content', title: 'About', showBack: false };
  sections.trends = { id: '#hero-trends-page-content', title: 'Hero Trends', showBack: false, onShow: showTrendsSection };
  sections.maps = { id: '#maps-page-content', title: 'Battlegrounds', showBack: false, onShow: onShowMapsPage };

  // Matches should be the default view of the app.
  // this can be changed for development to test specific pages of course.
  // this is the dev setting.
  //changeSection('hero-collection');

  // this is the release default
  changeSection('matches');
}

// returns the template contained in an import
function getTemplate(name, selector) {
  let link = document.querySelector('link[name="'+ name + '"]');
  let template = link.import.querySelector(selector);
  let clone = $(document.importNode(template.content, true));

  return clone;
}

function createBGWindow() {
  let bgPath = 'file://' + path.join(__dirname, './background.html');
  bgWindow = new BrowserWindow({width: 400, hegith: 400, show: false});
  bgWindow.loadURL(bgPath);
  //bgWindow.webContents.openDevTools();
}

function changeSection(to, overrideBack, action) {
  // if it's already being shown, do nothing
  if (!$(sections[to].id).hasClass('hidden'))
    return;

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

  for (let s in sections)
    hideSection(s);

  // ok wait also hide the menu cause that changes from section to section
  $('#section-menu .section-submenu').addClass('is-hidden');

  showSection(to, overrideBack || prevSections.length > 0);
  if (sections[to].onShow) {
    sections[to].onShow();
  }
}

function showSection(name, overrideBack) {
  if ($(sections[name].id).hasClass('hidden'))
    $(sections[name].id).transition('fade right');

  setMenuTitle(sections[name].title, sections[name].showBack || overrideBack);
}

function hideSection(name) {
  if ($(sections[name].id).hasClass('visible'))
    $(sections[name].id).transition('fade right');
}

function setMenuTitle(title, showBackButton) {
  $('#section-menu-name').text(title);

  if (showBackButton) {
    $('#section-menu-back-button').addClass('show');
  }
  else {
    $('#section-menu-back-button').removeClass('show');
  }
}

// formats to mm:ss
function formatSeconds(val) {
  let invert = false;
  if (val < 0)
    invert = true;
  let fval = Math.abs(val);

  let duration = new Date(fval * 1000);
  let seconds = duration.getUTCSeconds();
  let minutes = duration.getUTCMinutes();

  return (invert ? '-' : '') + (minutes < 1 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function formatStat(field, val, allFixed = false) {
  if (val === undefined)
    return 0;

  if (field === 'KillParticipation' || field === 'timeDeadPct' || field === 'mercUptimePercent' || field === 'pct')
    return (val * 100).toLocaleString(undefined, { maximumFractionDigits: 1}) + '%';
  else if (field === 'KDA')
    return val.toLocaleString(undefined, { maximumFractionDigits: 1});
  else if (field.startsWith('Time') || field === 'OnFireTimeOnFire' || field === 'timeTo10' ||
    field === 'timeTo20' || field === 'mercUptime' || field === 'avgTimeSpentDead')
    return formatSeconds(val);

  if (allFixed) {
    return val.toLocaleString(undefined, { maximumFractionDigits: 1});
  }

  return val.toLocaleString();
}

// updates certain elements based on a new replay inserted into the database
function globalDBUpdate() {
  runPlayerMenuUpdate();

  // patch update
  addPatchMenuOptions($('#filter-popup-widget .filter-widget-patch'), function() {
    $('#filter-popup-widget .filter-widget-patch').dropdown('refresh');
  });

  addPatchMenuOptions($('#match-patch-select'), function() {
    $('#match-patch-select').dropdown('refresh');
  });

  populateStatCollectionMenus();
}

function runPlayerMenuUpdate() {
  // populate user selection dropdowns with new entries.
  DB.getPlayers({}, updatePlayerMenus, {sort: {'matches' : -1}});
}

function updatePlayerMenus(err, players) {
  // everything with a .player-menu class will do this update
  $('.player-menu').each(function(idx, elem) {
    // save selected
    let selected = $(elem).dropdown('get value');

    // replace things
    let opts = $(elem).find('.menu');
    opts.html('');

    for (let p in players) {
      // in non-collection mode players with less than 1 game are hidden
      if (DB.getCollection() === null && players[p].matches < settings.get('playerThreshold'))
        continue;

      let elem = '<div class="item" data-value="' + players[p]._id + '">';
      elem += '<div class="ui horizontal label"><i class="file outline icon"></i>' + players[p].matches + '</div>';
      elem += players[p].name + ' (' + RegionString[players[p].region] + ')</div>';

      opts.append(elem);
    }

    $(elem).dropdown('refresh');
    $(elem).dropdown('set selected', selected);
  });

  getMatchCount();
}

// given a user id, returns 'focus-player' class if the player id is, well, the focus player
function focusClass(id) {
  if (id === settings.get('selectedPlayerID'))
    return 'focus-player';

  return '';
}

// given a json object this function will insert the proper hero menu items into the
// structure. it will NOT initialize callbacks for the menu, that is up to the caller
function addHeroMenuOptions(menu) {
  let heroes = Heroes.allHeroNames;

  menu.find('.menu').html('');
  for (let i in heroes) {
    let elem = '<div class="item" data-value="' + heroes[i] + '"><img class="ui avatar image" src="assets/heroes-talents/images/heroes/';
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

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function addPatchMenuOptions(elem, callback) {
  DB.getVersions(function(versions) {
    elem.find('.menu').html('');

    for (let v in versions) {
      elem.find('.menu').append('<div class="item" data-value="' + v + '">' + versions[v] + '</div>');
    }

    callback();
  });
}

function populateTeamMenu(elem) {
  DB.getAllTeams(function(err, docs) {
    elem.find('.menu').html('');

    let keys = [];
    for (let d in docs) {
      keys.push({ index: d, value: docs[d].name });
    }
    keys = keys.sort(function(a, b) {
      if (a.value < b.value)
        return -1;
      if (b.value < a.value)
        return 1;
      return 0;
    });

    for (let i of keys) {
      let d = i.index;
      elem.find('.menu').append('<div class="item" data-value="' + docs[d]._id + '">' + docs[d].name + '</div>');
    }

    elem.dropdown('refresh');
  });
}

function updateCollectionMenu(callback) {
  // add the proper options n stuff
  DB.getCollections(function(err, collections) {
    // alpha sort
    collections.sort(function(a, b) {
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

    if (collections.length > 0)
      $('#collection-switch-menu .menu').append('<div class="ui divider"></div>');
    
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

  DB.getCollections(function(err, collections) {
    if (collections.length > 0) {
      $('.cache-collections .menu').append('<div class="ui divider"></div>');
    }

    for (let c in collections) {
      let col = collections[c];
      $('.cache-collections .menu').append('<div class="item" data-value="' + col._id + '">' + col.name + '</div>');
    }

    DB.getExternalCacheCollections(function(err, collections) {
      if (collections.length > 0) {
        $('.cache-collections .menu').append('<div class="ui divider"></div>')
      }

      for (let c in collections) {
        let col = collections[c];
        $('.cache-collections .menu').append('<div class="item" data-value="' + col._id + '" data-type="external">' + col.dbName + ': ' + col.name + '</div>');
      }

      $('.cache-collections').dropdown('refresh');
    });
  });
}

// populates the tag menu with available tags
function populateTagMenu(menu, callback) {
  DB.getTags(function(tags) {
    menu.find('.menu').html('');

    for (let tag of tags) {
      menu.find('.menu').append('<div class="item" data-value="' + tag + '">' + tag + '</div>');
    }

    menu.dropdown('refresh');

    if (callback)
      callback();
  });
}

function setAppCollection(value, text, $elem) {
  if (value === 'none') {
    $('#collection-switch-menu .collection-name').text('None');
    DB.setCollection(null);
  }
  else {
    $('#collection-switch-menu .collection-name').text(text);
    DB.setCollection(value);
  }
  resetAllSections();
}

function resetAllSections() {
  // this should be called after a database reload
  // sections will register a reset function (if any) that will be called here
  DB.getPlayers({}, updatePlayerMenus, {sort: {'matches' : -1}});
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
  $('#main-app-loader').dimmer('show');
}

function removeLoader() {
  $('#main-app-loader').dimmer('hide');
}

function showMessage(title, text, opts = {}) {
  let elem = '<div class="ui message transition hidden">'
  elem += '<div class="header">' + title + '</div>';
  elem += '<p>' + text + '</p>';
  elem += '</div>';

  elem = $(elem);

  if (opts.class) {
    elem.addClass(opts.class);
  }

  if (opts.sticky) {
    elem.prepend('<i class="close icon"></i>');
    elem.find('i').click(function() {
      $(this).parent().transition('fade left', 500, function() {
        elem.remove();
      });
    });
    $('#message-container').append(elem);
    elem.transition('fade left');
  }
  else {
    $('#message-container').append(elem);
    elem.transition({
      animation: 'fade left',
      onComplete: function () {
        setTimeout(function () {
          elem.transition({
            animation: 'fade left',
            onComplete: function () {
              elem.remove();
            }
          });
        }, 4000)
      }
    });
  }

  // should really dump to console too just in case rendering gets messed up
  console.log(title + ': ' + text);
}

function exportMatch(id, filename) {
  DB.getMatchesByID([id], function(err, docs) {
    let match = docs[0];
    DB.getHeroDataForID(id, function(err, docs) {
      let matchExport = {
        match: match,
        players: docs
      };
      fs.writeFile(filename, JSON.stringify(matchExport, null, 2), function(err) {
        if (err) {
          showMessage('Export Error', err, { class: 'negative' });
        }
        else {
          showMessage('Export Complete', 'Match ' + id + ' saved to ' + filename);
        }
      });
    })
  })
}

function exportPlayer(id, filename) {
  DB.getHeroDataForPlayer(id, function(err, docs) {
    let data = DB.summarizeHeroData(docs);
    fs.writeFile(filename, JSON.stringify(data, null, 2), function(err) {
      if (err) {
        showMessage('Export Error', err, { class: 'negative' });
      }
      else {
        showMessage('Export Complete', 'Player ' + id + ' saved to ' + filename);
      }
    });
  });
}

function showPlayerProfile(id) {
  preloadPlayerID(id);
  changeSection('player', true);
}

// DATABASE MIGRATIONS
function migrateVersion1ToVersion2() {
  let text = `The parser has been updated to version 2, which means that you will need to
  re-import your matches to use the latest features. You can force the database to re-import duplicate
  matches by using the Import Duplicates option, or you can delete the database and just re-import everything.
  Note that importing duplicates will reset their membership in collections, so if you use that feature,
  remember to set the Import to Collection option accordingly.`
  showMessage('Parser Updated to Version 2', text, { sticky: true });
  DB.setDBVersion(2, checkDBVersion(2));
}

function migrateVersion2ToVersion3() {
  // this one we actually do work.
  setLoadMessage('Updating DB Version 2 to Version 3');
  DB.getMatches({}, function(err, docs) {
    if (docs.length > 0)
      updateMatchToVersion3(docs.pop(), docs);
    else
      finishVersion2To3Migration();
  })
}

function updateMatchToVersion3(match, remaining) {
  try {
    console.log('updating match ' + match._id);
    setLoadMessage('Updating DB Version 2 to Version 3<br>' + remaining.length + ' matches left');

    if (match.picks) {
      match.firstPickWin = match.picks.first === match.winner;
    }
    else {
      match.firstPickWin = false;
    }

    match.firstObjective = Parser.getFirstObjectiveTeam(match);
    match.firstObjectiveWin = match.winner === match.firstObjective;

    // update length!
    // the offset from the end of the xp breakdown to the actual end of the match is 114 frames
    // this may vary a little bit, but it should bring things in line with the current parser.
    // users can of course re-import the matches if they desire.
    let lastXP = match.XPBreakdown[match.XPBreakdown.length - 1];
    match.loopLength = lastXP.loop - 114;
    match.length = Parser.loopsToSeconds(match.loopLength - match.loopGameStart);

    // update
    DB.updateMatch(match, function() {
      if (remaining.length === 0) {
        finishVersion2To3Migration();
      }
      else {
        updateMatchToVersion3(remaining.pop(), remaining);
      }
    });
  }
  catch (err) {
    console.log(err);
    console.log('Failed to update match ' + match._id + ' please file bug report');

    if (remaining.length === 0) {
      finishVersion2To3Migration();
    }
    else {
      updateMatchToVersion3(remaining.pop(), remaining);
    } 
  }
}

function finishVersion2To3Migration() {
  setLoadMessage('Version 3 Upgrade Complete');
  showMessage(
    'Parser Updated to Version 3',
    'Match length corrected to estimate from last XP Breakdown. Additional database fields added. You do not need to re-import your matches. However, if you feel that the match lengths are still incorrect, you may want to re-create (not re-import) the entire database.',
    { sticky: true, class: 'positive' }
  );
  DB.setDBVersion(3, checkDBVersion(3));
}

function clearPrintLayout() {
  $('#print-window .contents').html('');
}

function addPrintPage(name) {
  $('#print-window .contents').append('<div class="new-page page ' + name + '"></div>');
}

function addPrintDate() {
  $('#print-window .contents').append('<p>Database path: ' + settings.get('dbPath') + '</p>');
  $('#print-window .contents').append('<p>Printed on ' + (new Date()).toLocaleString('en-US') + '</p>');
}

function getPrintPage(page) {
  return $('#print-window .contents .page.' + page);
}

function addPrintHeader(title, page) {
  let t = '<h1 class="ui dividing header new-page">' + title + '</h1>';

  if (!page) {
    $('#print-window .contents').append(t)
  }
  else {
    $('#print-window .contents').find('.page.' + page).append(t)
  }
}

function addPrintSubHeader(title, page) {
  let t = '<h2 class="ui dividing header new-page">' + title + '</h2>';

  if (!page) {
    $('#print-window .contents').append(t);
  }
  else {
    $('#print-window .contents').find('.page.' + page).append(t);
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
  table.find('h3.image.header').replaceWith(function() {
    return '<h4 class="ui image header">' + $(this).html() + '</h4>';
  })

  // remove wrapper
  if (dest) {
    dest.append(table.find('table'));
  }
  else {
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
  let data = {}
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

  win.webContents.printToPDF({ landscape: landscape, pageSize: size }, function(error, data) {
    if (error) {
      showMessage('Print Error', error, { class: 'negative' });
    }
    else {
      try {
        fs.writeFileSync(filename, data);
        showMessage('Print Success', 'Printed to ' + filename, { class: 'positive' });
      }
      catch (err) {
        $('#print-window').addClass('is-hidden');
        showMessage('Print Error', err, { class: 'negative' });
      }
    }

    $('#print-window').addClass('is-hidden');
    $('#print-window .contents').html('');
  });
}