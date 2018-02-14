// Global application logic
// hopefully this doesn't get too big and page-specific actions can be kept within
// their respective javascript files

const HeroesDB = require('./js/database.js');
const settings = require('electron-settings');
const Parser = require('./parser/parser.js');
const HeroesTalents = require('./js/heroes-talents.js');
const app = require('electron').remote.app;
const dialog = require('electron').remote.dialog;
const Handlebars = require('handlebars');
const fs = require('fs');
const cp = require('child_process');
const BrowserWindow = require('electron').remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const path = require('path');
const ReplayTypes = require('./parser/constants.js');
const moment = require('moment');

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

function initApp() {
  $('.app-version-number').text(app.getVersion());

  // initialization for the entire app
  // we'll probably want to pop up a loading thing here while all the things
  // happen.
  // create background window
  createBGWindow();

  // load database
  loadDatabase();

  // initial ui event bindings, section loading
  initGlobalUIHandlers();

  // sections
  loadSections();

  // populate some menus
  globalDBUpdate();
}

function loadDatabase() {
  if (!settings.has('dbPath')) {
    settings.set('dbPath', app.getPath('userData'));
  }

  let path = settings.get('dbPath');
  DB = new HeroesDB.HeroesDatabase(path);

  console.log("Databse directory set to " + path);

  // load the heroes talents database
  Heroes = new HeroesTalents.HeroesTalents('./assets/heroes-talents');
}

function initGlobalUIHandlers() {
  // sidebar
  $('#main-menu').sidebar('setting', 'transition', 'uncover').
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

  // register sections
  sections.settings = {id: '#settings-page-content', title: 'App Settings', showBack: false };
  sections.matches = {id: '#matches-page-content', title: 'Matches', showBack: false };
  sections['match-detail'] = {id: '#match-detail-page-content', title: 'Match Details', showBack: true};
  sections.player = {id: '#player-page-content', title: 'Player Details', showBack: false};
  sections['hero-collection'] = {id: '#hero-collection-page-content', title: 'Heroe Statistics', showBack: false };
  sections['player-ranking'] = {id: '#player-ranking-page-content', title: 'Player Statistics', showBack: false };

  // DEBUG: SHOWING SPECIFIC SECTION ON LOAD FOR TESTING
  showSection('player-ranking');
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
}

function changeSection(to) {
  // if it's already being shown, do nothing
  if (!$(sections[to].id).hasClass('hidden'))
    return;

  // this should only trigger for the visible section
  // if the back button is visible, we should store a little history
  if (sections[to].showBack) {
    prevSections.push($('.is-page.visible').attr('section-name'));
  }
  else {
    // clear the history
    prevSections = [];
  }

  for (let s in sections)
    hideSection(s);

  showSection(to);
}

function showSection(name) {
  if ($(sections[name].id).hasClass('hidden'))
    $(sections[name].id).transition('fade right');

  setMenuTitle(sections[name].title, sections[name].showBack);
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
  else if (field.startsWith('Time') || field === 'OnFireTimeOnFire')
    return formatSeconds(val);

  if (allFixed) {
    return val.toFixed(2);
  }

  return val;
}

// updates certain elements based on a new replay inserted into the database
function globalDBUpdate() {
  // populate user selection dropdowns with new entries.
  DB.getPlayers({}, updatePlayerMenus, {sort: {'matches' : -1}});

  // patch update
  addPatchMenuOptions($('#filter-popup-widget .filter-widget-patch'), function() {
    $('#filter-popup-widget .filter-widget-patch').dropdown('refresh');
  });

  addPatchMenuOptions($('#match-patch-select'), function() {
    $('#match-patch-select').dropdown('refresh');
  })
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
      if (players[p].matches === 1)
        continue;

      let elem = '<div class="item" data-value="' + players[p]._id + '">';
      elem += '<div class="ui horizontal label"><i class="file outline icon"></i>' + players[p].matches + '</div>';
      elem += players[p].name + ' (' + players[p]._id + ')</div>';

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