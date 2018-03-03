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
  'KDA' : 'KDA'
};

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

  let path = settings.get('dbPath');
  DB = new HeroesDB.HeroesDatabase(path);

  console.log("Databse directory set to " + path);

  // load the heroes talents database
  Heroes = new HeroesTalents.HeroesTalents(__dirname + '/assets/heroes-talents');

  // check database version
  DB.getDBVersion(checkDBVersion);
}

function checkDBVersion(dbVer) {
  console.log('Database and Parser version: ' + dbVer);

  if (dbVer !== Parser.VERSION) {
    // here's where database migrations go, if any
    console.log('Updating database from version ' + dbVer + ' to version ' + Parser.VERSION);
    if (dbVer === 1) {
      migrateVersion1ToVersion2();
      // migrate will call back to check DB version after updating the version
      return;
    }
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
    changeSection(prevSections.pop());
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

  // register sections
  sections.settings = {id: '#settings-page-content', title: 'App Settings', showBack: false, onShow: showSettingsPage };
  sections.matches = {id: '#matches-page-content', title: 'Matches', showBack: false, reset: resetMatchesPage, onShow: showMatchesPage };
  sections['match-detail'] = {id: '#match-detail-page-content', title: 'Match Details', showBack: true, onShow: matchDetailsShowSection };
  sections.player = {id: '#player-page-content', title: 'Player Details', showBack: false, onShow: showPlayerPage, reset: resetPlayerPage};
  sections['hero-collection'] = {id: '#hero-collection-page-content', title: 'Hero Statistics', showBack: false, reset: resetHeroCollection, onShow: heroCollectionShowSection };
  sections['player-ranking'] = {id: '#player-ranking-page-content', title: 'Player Statistics', showBack: false, reset: resetPlayerRankingPage };
  sections.teams = {id: '#teams-page-content', title: 'Teams', showBack: false, reset: resetTeamsPage, onShow: teamShowSection };
  sections['team-ranking'] = {id: '#team-ranking-page-content', title: 'Team Statistics', reset: resetTeamRankingPage, showBack: false };
  sections.about = { id: '#about-page-content', title: 'About', showBack: false };

  // Matches should be the default view of the app.
  // this can be changed for development to test specific pages of course.
  // this is the dev setting.
  changeSection('player');

  // this is the release default
  //changeSection('matches');
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

function changeSection(to, overrideBack) {
  // if it's already being shown, do nothing
  if (!$(sections[to].id).hasClass('hidden'))
    return;

  // this should only trigger for the visible section
  // if the back button is visible, we should store a little history
  if (sections[to].showBack || overrideBack === true) {
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
  if (field === 'KillParticipation')
    return (val * 100).toFixed(2) + '%';
  else if (field === 'KDA')
    return val.toFixed(2);
  else if (field.startsWith('Time') || field === 'OnFireTimeOnFire' || field === 'timeTo10' || field === 'timeTo20' || field === 'mercUptime')
    return formatSeconds(val);
  else if (field === 'timeDeadPct' || field === 'mercUptimePercent')
    return (val * 100).toFixed(2) + '%';

  if (allFixed) {
    return val.toFixed(2);
  }

  return val;
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
    
    for (let d in docs) {
      elem.find('.menu').append('<div class="item" data-value="' + docs[d]._id + '">' + docs[d].name + '</div>');
    }

    elem.dropdown('refresh');
  });
}

function updateCollectionMenu() {
  // add the proper options n stuff
  DB.getCollections(function(err, collections) {
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
  $('.load-status').text(msg);
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