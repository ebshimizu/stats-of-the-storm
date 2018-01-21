// Global application logic
// hopefully this doesn't get too big and page-specific actions can be kept within
// their respective javascript files

const HeroesDB = require('./js/database.js');
const settings = require('electron-settings');
const app = require('electron').remote.app;
const Handlebars = require('handlebars');

var DB;

$(document).ready(initApp)

function initApp() {
  // initialization for the entire app
  // we'll probably want to pop up a loading thing here while all the things
  // happen.

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
  $('#main-menu').sidebar('setting', 'transition', 'overlay').sidebar('attach events', '#show-sidebar-button');
}

function loadSections() {
  // settings
  $('#main-content').append(getTemplate('settings', '#settings-page'));
  initSettingsPage();
}

// returns the template contained in an import
function getTemplate(name, selector) {
  let link = document.querySelector('link[name="'+ name + '"]');
  let template = link.import.querySelector(selector);
  let clone = $(document.importNode(template.content, true));

  return clone;
}