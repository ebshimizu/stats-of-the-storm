// Global application logic
// hopefully this doesn't get too big and page-specific actions can be kept within
// their respective javascript files

$(document).ready(initApp)

function initApp() {
  // initialization for the entire app
  // we'll probably want to pop up a loading thing here while all the things
  // happen.

  // initial ui event bindings, section loading
  initGlobalUIHandlers();
}

function initGlobalUIHandlers() {
  // sidebar
  $('#main-menu').sidebar('setting', 'transition', 'overlay').sidebar('attach events', '#show-sidebar-button');
}