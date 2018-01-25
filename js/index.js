// Global application logic
// hopefully this doesn't get too big and page-specific actions can be kept within
// their respective javascript files

const HeroesDB = require('./js/database.js');
const settings = require('electron-settings');
const Parser = require('./parser/parser.js');
const app = require('electron').remote.app;
const dialog = require('electron').remote.dialog;
const Handlebars = require('handlebars');
const fs = require('fs');
const cp = require('child_process');
const BrowserWindow = require('electron').remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const path = require('path');
const ReplayTypes = require('./parser/constants.js');

var DB;
var sections = {};

$(document).ready(initApp);
var bgWindow;

function initApp() {
  // initialization for the entire app
  // we'll probably want to pop up a loading thing here while all the things
  // happen.
  // create background window
  createBGWindow();

  $('table').tablesort();

  // load database
  loadDatabase();

  // initial ui event bindings, section loading
  initGlobalUIHandlers();

  // sections
  loadSections();
}

function loadDatabase() {
  if (!settings.has('dbPath')) {
    settings.set('dbPath', app.getPath('userData'));
  }

  let path = settings.get('dbPath');
  DB = new HeroesDB.HeroesDatabase(path);

  console.log("Databse directory set to " + path);
}

function initGlobalUIHandlers() {
  // sidebar
  $('#main-menu').sidebar('setting', 'transition', 'overlay').
    sidebar('attach events', '#show-sidebar-button');

  $('#main-menu .item').each(function(idx, elem) {
    let sectionName = $(elem).attr('section-name');
    $(elem).click(function() {
      changeSection(sectionName);
      $('#main-menu').sidebar('hide');
    })
  });
}

function loadSections() {
  // settings
  $('#main-content').append(getTemplate('settings', '#settings-page'));
  initSettingsPage();

  $('#main-content').append(getTemplate('matches', '#matches-page'));
  initMatchesPage();

  // register sections
  sections.settings = {id: '#settings-page-content', title: 'Settings' };
  sections.matches = {id: '#matches-page-content', title: 'Matches'};

  // DEBUG: SHOWING SPECIFIC SECTION ON LOAD FOR TESTING
  showSection('matches');
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
  // this should only trigger for the visible section
  for (let s in sections)
    hideSection(s);

  showSection(to);
}

function showSection(name) {
  if ($(sections[name].id).hasClass('hidden'))
    $(sections[name].id).transition('fade right');

  setMenuTitle(sections[name].title);
}

function hideSection(name) {
  if ($(sections[name].id).hasClass('visible'))
    $(sections[name].id).transition('fade right');
}

function setMenuTitle(title) {
  $('#section-menu-name').text(title);
}

function sanitizeHeroName(name) {
  // remove all spaces, non-alphanum characters, convert to lower
  return name.replace(/[^\w\d]|_/g, "").toLowerCase();
}