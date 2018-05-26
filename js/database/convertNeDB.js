module.exports = function(path, callback) {
  // basically first check if there are any existing 2.0 database files around
  // if so, skip. We can assume that if hero.ldb exists, we don't run the conversion
  // also check that an existing database is here, otherwise we init a new one
  if (!fs.existsSync(path + '/hero.ldb') && fs.existsSync(path + '/hero.db')) {
    // start the conversion process. We first actually prompt the user to explain what's happening.
    $('#main-app-loader').dimmer('hide');

    // bindings
    $('#linvo-new').click(() => exitDBConversion(callback));
    $('#linvo-convert').click(startDBConversion);

    $('#linvo-db-migrate').modal({
      closable: false
    }).modal('show');
  }
  else {
    callback();
  }
}

function exitDBConversion(callback) {
  $('#linvo-db-migrate').modal('hide');
  $('#main-app-loader').dimmer('show');
  callback();
}

function startDBConversion() {

}