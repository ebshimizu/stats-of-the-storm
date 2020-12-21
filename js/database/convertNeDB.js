const Datastore = require('nedb');
const LinvoDB = require('linvodb3');
LinvoDB.defaults.store = { db: require('medeadown') };

module.exports = function (path, callback) {
  // basically first check if there are any existing 2.0 database files around
  // if so, skip. We can assume that if hero.ldb exists, we don't run the conversion
  // also check that an existing database is here, otherwise we init a new one
  if (!fs.existsSync(path + '/hero.ldb') && fs.existsSync(path + '/hero.db')) {
    // start the conversion process. We first actually prompt the user to explain what's happening.
    $('#main-app-loader').dimmer('hide');

    // bindings
    $('#linvo-convert').click(() => startDBConversion(path));

    $('#linvo-db-migrate')
      .modal({
        closable: false,
      })
      .modal('show');
  } else {
    callback();
  }
};

function startDBConversion(path) {
  $('#linvo-db-migrate-step1').addClass('is-hidden');
  $('#linvo-db-migrate-active').removeClass('is-hidden');
  $('#linvo-db-migrate .header').text('Converting Database');

  $('#linvo-db-migrate-progress').progress({
    text: {
      active: 'Copying {value} of {total} records',
      success: 'Conversion Complete',
    },
  });

  $('#linvo-db-migrate-active .status').text('[1/4] Processing settings');
  copyNeDBToLinvoDB('settings', path, updateProgress, convertError, function () {
    $('#linvo-db-migrate-active .status').text('[2/4] Processing players');

    copyNeDBToLinvoDB('players', path, updateProgress, convertError, function () {
      $('#linvo-db-migrate-active .status').text('[3/4] Processing matches');

      copyNeDBToLinvoDB('matches', path, updateProgress, convertError, function () {
        $('#linvo-db-migrate-active .status').text('[4/4] Processing hero data');

        copyNeDBToLinvoDB('hero', path, updateProgress, convertError, function () {
          $('#linvo-db-migrate-progress').addClass('is-hidden');
          $('#linvo-db-migrate-active .status').text(
            'Conversion Complete. Click "Relaunch" to reboot app and load new database',
          );
          $('#linvo-db-migrate-reboot').removeClass('is-hidden');
          $('#linvo-db-migrate-reboot').click(() => {
            app.relaunch();
            app.quit();
          });
        });
      });
    });
  });
}

function updateProgress(count) {
  $('#linvo-db-migrate-progress').progress('set progress', count);
}

// the real meat of the conversion. basically just dumps documents from
// nedb to linvoDB. Requires a bunch of memory, but just this once
let max = 0;

function copyNeDBToLinvoDB(store, path, progress, error, final) {
  const ndb = new Datastore({ filename: path + '/' + store + '.db' });
  ndb.loadDatabase(function (err) {
    if (err) {
      error(err);
    } else {
      const ldb = new LinvoDB(store, {}, { filename: path + '/' + store + '.ldb' });

      // get documents
      ndb.find({}, function (err, docs) {
        if (err) {
          error(err);
        } else {
          max = docs.length;
          $('#linvo-db-migrate-progress').progress('set total', max);
          if (docs.length === 0) {
            final();
          } else {
            copyRecord(ndb, ldb, docs.pop(), docs, progress, error, final);
          }
        }
      });
    }
    // run async conversion
  });
}

function copyRecord(ndb, ldb, current, remaining, progress, error, final) {
  console.log('copying ' + current._id);
  progress(max - remaining.length);

  ldb.insert(current, function (err, doc) {
    if (err) {
      error(err);
    } else if (remaining.length === 0) {
      final();
    } else {
      copyRecord(ndb, ldb, remaining.pop(), remaining, progress, error, final);
    }
  });
}

// this gets run when an error occurs
function convertError(err) {
  console.log(err);
  $('#linvo-db-migrate-progress').progress('set error');
  $('#linvo-db-migrate-active .status').text(`Error: ${err}. Please file a bug report.`);
}
