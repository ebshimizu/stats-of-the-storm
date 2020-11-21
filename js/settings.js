const FormData = require('form-data');
const request = require('request');
const extractZip = require('extract-zip');

var settingsRowTemplate;
var replayQueue = [];
var collectionRowTemplate;
var collectionCacheRowTemplate;
var importDuplicates = false;
var localImportSet = {};
var usingImportSet = false;
var parserRunning = false;
var watcher;

// used by the parser
var listedReplays = [];

function initSettingsPage() {
  // templates
  settingsRowTemplate = getHandlebars('settings', '#replay-row-template');
  collectionRowTemplate = getHandlebars('settings', '#collection-row-template');
  collectionCacheRowTemplate = getHandlebars('settings', '#collection-cache-row-template');

  let date = settings.get('lastReplayDate');
  if (!date) {
    date = new Date(2012, 1, 1);
    settings.set('lastReplayDate', date);
  }

  let uploadToHotsAPI = settings.get('uploadToHotsAPI');
  if (!uploadToHotsAPI) {
    uploadToHotsAPI = false;
    settings.set('uploadToHotsAPI', uploadToHotsAPI);
  }

  let sendCopyToHotsLogs = settings.get('sendCopyToHotsLogs');
  if (!sendCopyToHotsLogs) {
    sendCopyToHotsLogs = false;
    settings.set('sendCopyToHotsLogs', sendCopyToHotsLogs);
  }

  let uploadOnly = settings.get('uploadOnly');
  if (!uploadOnly) {
    uploadOnly = false;
    settings.set('uploadOnly', uploadOnly);
  }

  $('#settings-hots-api-button').checkbox({
    onChecked: function () {
      settings.set('uploadToHotsAPI', true);
      $('#settings-hots-logs-button').checkbox('enable');
    },
    onUnchecked: function () {
      settings.set('uploadToHotsAPI', false);
      $('#settings-hots-logs-button').checkbox('disable');
    },
  });

  if (sendCopyToHotsLogs) {
    $('#settings-hots-logs-button').checkbox('set checked');
  }

  if (uploadOnly) {
    $('#settings-upload-only').checkbox('set checked');
  }

  if (uploadToHotsAPI) {
    $('#settings-hots-api-button').checkbox('check');
  } else {
    $('#settings-hots-api-button').checkbox('uncheck');
    $('#settings-hots-logs-button').checkbox('disable');
  }

  $('#settings-hots-logs-button').checkbox({
    onChecked: function () {
      settings.set('sendCopyToHotsLogs', true);
    },
    onUnchecked: function () {
      settings.set('sendCopyToHotsLogs', false);
    },
  });

  $('#settings-hots-logs-button').popup();

  $('#settings-force-duplicate').checkbox({
    onChecked: function () {
      importDuplicates = true;
    },
    onUnchecked: function () {
      importDuplicates = false;
    },
  });

  $('#settings-upload-only').checkbox({
    onChecked: function () {
      settings.set('uploadOnly', true);
    },
    onUnchecked: function () {
      settings.set('uploadOnly', false);
    },
  });

  // handlers
  $('#settings-set-replay-folder-button').click(setReplayFolder);
  ipcRenderer.on('replayParsed', function (event, data) {
    loadReplay(data);
  });
  $('#start-process-button').click(parseReplays);
  $('#stop-process-button').click(stopParse);
  $('#rescan-replays-button').click(startReplayScan);
  $('#replay-file-start').datepicker();
  $('#replay-file-start').on('hide.datepicker', function (e) {
    settings.set('lastReplayDate', e.date);
    startReplayScan();
  });
  $('#replay-file-start').datepicker('setDate', date);
  $('#settings-export-db-button').click(dumpDB);
  $('#delete-db-button').click(function () {
    $('#confirm-db-delete-modal')
      .modal({
        closable: false,
        onDeny: function () {
          return true;
        },
        onApprove: function () {
          DB.deleteDB(function () {
            app.relaunch();
            app.quit();
          });
          return true;
        },
      })
      .modal('show');
  });

  $('#confirm-db-reset-modal').modal();

  // initial settings
  let path = settings.get('dbPath');
  $('#settings-set-db-folder input').val(path);
  $('#settings-set-db-folder-button').click(setDBFolder);
  $('#settings-reset-db-folder-button').click(resetDBFolder);

  let replayPath = settings.get('replayPath');
  $('#settings-set-replay-folder input').val(replayPath);

  let selectedPlayerID = settings.get('selectedPlayerID');
  // add one thing to the player menu and like init it
  // it's basically temporary
  let initOpt = '<div class="item" data-value="' + selectedPlayerID + '">' + selectedPlayerID + '</div>';
  $('#settings-set-player .menu').append(initOpt);
  $('#settings-set-player').dropdown({
    action: 'activate',
    fullTextSearch: true,
    direction: 'downward',
    onChange: updateSelectedUser,
  });
  $('#settings-set-player').dropdown('set selected', selectedPlayerID);

  $('#settings-submenu .item').tab();
  $('#settings-submenu .item').click(function () {
    $('#settings-page-content table').floatThead('reflow');
  });
  $('#settings-new-collection-button').click(addNewCollection);

  $('#settings-page-content table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true,
  });

  $('#settings-reset-focus-player').click(function () {
    settings.set('selectedPlayerID', null);
    $('#settings-set-player').dropdown('restore defaults');
  });

  // player match threshold
  let threshold = settings.get('playerThreshold');
  if (threshold !== 0 && !threshold) {
    settings.set('playerThreshold', 5);
    threshold = 5;
  }

  $('#player-menu-thresh-input input').val(threshold);
  $('#player-menu-thresh-input button').click(setPlayerMenuThreshold);

  $('#show-app-dev-tools').click(function () {
    remote.getCurrentWindow().toggleDevTools();
  });

  $('#show-parser-dev-tools').click(function () {
    bgWindow.webContents.openDevTools();
  });

  loadCollections();
  loadCachedCollections();

  $('#settings-set-cache-import-folder').click(function () {
    browseForFolder($(this), 'Select Database Folder');
  });

  $('#settings-new-cache-modal input').popup({
    on: 'manual',
  });

  $('#settings-import-external-db').click(function () {
    $('#settings-set-cache-name').removeClass('error');
    $('#settings-set-cache-import-folder').removeClass('error');
    $('#settings-new-cache-modal input').popup('hide');

    $('#settings-new-cache-modal')
      .modal({
        closable: false,
        onDeny: function () {
          $('#settings-new-cache-modal input').popup('hide');
          return true;
        },
        onApprove: cacheExternalDB,
      })
      .modal('show');
  });

  // setting popup
  $('#settings-set-folder-options-button').popup({
    on: 'click',
    position: 'bottom right',
    popup: $('#settings-replay-folder-settings-popup'),
  });

  $('#settings-recursive-replay').checkbox({
    onChecked: function () {
      settings.set('recursiveReplaySearch', true);
    },
    onUnchecked: function () {
      settings.set('recursiveReplaySearch', false);
    },
  });

  // import sets
  $('#settings-use-import-set').checkbox({
    onChecked: () => setImportSetUse(true),
    onUnchecked: () => setImportSetUse(false),
  });

  if (settings.get('usingImportSet') === true) {
    $('#settings-use-import-set').checkbox('check');
  }

  $('#settings-add-import-set').click(addImportSetFolder);

  // load existing import set (if any)
  let importSet = settings.get('importSets');
  if (importSet) {
    if (path in importSet) {
      localImportSet = importSet[path];
      for (let dir in localImportSet) {
        insertImportSetRow(importSet[path][dir]);
      }
    }
  }

  if (settings.get('recursiveReplaySearch') === true) {
    $('#settings-recursive-replay').checkbox('set checked');
  }

  $('#settings-watch-dirs').checkbox({
    onChecked: startWatcher,
    onUnchecked: stopWatcher,
  });

  // watch directories
  let watchDirs = settings.get('watchDirs');
  if (watchDirs) {
    if (path in watchDirs) {
      if (watchDirs[path] === true) {
        $('#settings-watch-dirs').checkbox('check');
      }
    }
  } else if (replayPath) {
    // load the directory
    startReplayScan();
  }

  $('#compact-and-reload-button').click(compactAndReload);
  $('#settings-update-from-url-button').click(startUpdateFromUrl);

  // import db handles
  $('#settings-import-other-db-menu').dropdown();
  $('#settings-import-other-db-browse').click(selectDBToImport);

  $('#settings-import-db-button').click(importOtherDatabase);
}

function showSettingsPage() {
  $('#settings-page-content table').floatThead('reflow');
}

function setReplayFolder() {
  dialog.showOpenDialog(
    {
      defaultPath: settings.get('replayPath'),
      title: 'Select Replay Folder',
      properties: ['openDirectory', 'createDirectory'],
    },
    function (files) {
      if (files) {
        // pick the first, should only be 1 dir
        let path = files[0];
        settings.set('replayPath', path);
        $('#settings-set-replay-folder input').val(path);

        startReplayScan();
      }
    },
  );
}

// this just sets the text for an element
function browseForFolder(elem, title) {
  dialog.showOpenDialog(
    {
      defaultPath: settings.get('replayPath'),
      title: title,
      properties: ['openDirectory', 'createDirectory'],
    },
    function (files) {
      if (files) {
        // pick the first, should only be 1 dir
        let path = files[0];
        elem.find('input').val(path);
      }
    },
  );
}

function setDBFolder() {
  dialog.showOpenDialog(
    {
      defaultPath: settings.get('dbPath'),
      title: 'Set Database Folder',
      properties: ['openDirectory', 'createDirectory'],
    },
    function (files) {
      if (files) {
        // 1 dir
        let path = files[0];
        settings.set('dbPath', path);
        app.relaunch();
        app.quit();
      }
    },
  );
}

function resetDBFolder() {
  $('#confirm-db-reset-modal')
    .modal({
      onApprove: function () {
        settings.set('dbPath', app.getPath('userData'));
        app.relaunch();
        app.quit();
      },
    })
    .modal('show');
}

function startReplayScan() {
  // lists the files in the folder
  console.log('Listing replay files...');
  let currentDate = $('#replay-file-start').datepicker('getDate');
  settings.set('lastReplayDate', currentDate);

  $('#replay-file-list tbody').html('');

  let replays = [];
  if (usingImportSet) {
    // import from each path, assign collections to each thing
    for (let dir in localImportSet) {
      replays = replays.concat(addReplaysToList(localImportSet[dir].path, localImportSet[dir].collections));
    }
  } else {
    let path = settings.get('replayPath');
    replays = addReplaysToList(path);
  }

  // sort by date
  replays.sort(function (a, b) {
    if (a.date === b.date) return 0;

    if (a.date < b.date) return -1;

    return 1;
  });

  let count = 0;
  for (let r in replays) {
    replays[r].id = count;
    $('#replay-file-list tbody').append(settingsRowTemplate(replays[r]));
    replays[r].processed = false;
    count += 1;
  }
  listedReplays = replays;

  console.log('Found ' + count + ' replays ');
}

function addReplaysToList(path, collections) {
  try {
    let currentDate = $('#replay-file-start').datepicker('getDate');
    let files = fs.readdirSync(path);
    let replays = [];
    for (let file of files) {
      let stats = fs.statSync(path + '/' + file);

      let lcstr = file.toLowerCase();
      if (lcstr.endsWith('.stormreplay')) {
        if (new Date(stats.mtime) < currentDate) {
          continue;
        }

        let context = { filename: file };
        context.status = '';
        context.date = new Date(stats.birthtime);
        context.fdate = context.date.toLocaleString('en-us');
        context.folder = path.match(/([^/\\]*)\/*$/)[1];

        // only used for import sets, safe to leave undefined otherwise
        context.collections = collections;

        context.path = path + '/' + file;
        replays.push(context);
      } else if (stats.isDirectory()) {
        replays = replays.concat(addReplaysToList(path + '/' + file, collections));
      }
    }

    return replays;
  } catch (err) {
    console.log(err);
    return [];
  }
}

function parseReplays() {
  // takes the listed replays and parses them
  // or at least it'll attempt to
  // gonna go like this
  // - add each replay to a queue, assign ids
  // - determine if duplicate
  // - throw processing over to the background window which will then process the replay
  // - the main thread will then take the replay data, insert it into the database (if valid)
  //   and then, if there are still things in the queue, repeat
  replayQueue = [];
  let i = 0;
  for (let r in listedReplays) {
    let q = listedReplays[r];
    if (!q.processed) {
      q.idx = i;
      replayQueue.push(q);
    }
    i += 1;
  }

  if (replayQueue.length > 0) {
    // ui status
    disableParsingUI();
    parseReplaysAsync(replayQueue.shift());
  }
}

function disableParsingUI() {
  parserRunning = true;
  $('#start-process-button').addClass('loading disabled');
  $('#rescan-replays-button').addClass('disabled');
  $('#settings-hots-api-button').checkbox('disable');
  $('#settings-hots-logs-button').checkbox('disable');
  $('#settings-replay-file-start').addClass('disabled');
  $('#settings-collection-import').addClass('disabled');
  $('#settings-set-db-folder .button').addClass('disabled');
  $('#settings-set-replay-folder .button').addClass('disabled');
  $('#delete-db-button').addClass('disabled');
  $('#settings-import-set .ui.dropdown').addClass('disabled');
  $('#settings-import-set .button').addClass('disabled');
}

function enableParsingUI() {
  globalDBUpdate();
  parserRunning = false;

  $('#start-process-button').removeClass('loading disabled');
  $('#rescan-replays-button').removeClass('disabled');
  $('#settings-hots-api-button').checkbox('enable');
  $('#settings-hots-logs-button').checkbox('enable');
  $('#settings-replay-file-start').removeClass('disabled');

  if (!usingImportSet) {
    $('#settings-collection-import').removeClass('disabled');
  }

  $('#settings-set-db-folder .button').removeClass('disabled');
  $('#settings-set-replay-folder .button').removeClass('disabled');
  $('#delete-db-button').removeClass('disabled');
  $('#settings-import-set .ui.dropdown').removeClass('disabled');
  $('#settings-import-set .button').removeClass('disabled');
}

function parseReplaysAsync(replay) {
  // attempts to spawn a child process, parse the replays in there,
  // then hand back to the main thread to actually insert into the database
  $('tr[replay-id="' + replay.id + '"] .replay-status').text('Processing...');

  DB.checkDuplicate(replay.path, function (result) {
    if (settings.get('uploadOnly') && settings.get('uploadToHotsAPI')) {
      $('tr[replay-id="' + replay.id + '"] .replay-status').text('Upload Only');
      uploadReplayToHotsAPI(replay.id, replay.path);
    } else if (importDuplicates === true || result === false) {
      // upload maybe
      if (settings.get('uploadToHotsAPI') === true) {
        uploadReplayToHotsAPI(replay.id, replay.path);
      }

      bgWindow.webContents.send('parseReplay', replay.path, replay.idx, BrowserWindow.getAllWindows()[0].id);
      return;
    } else if (result === 'map') {
      console.log(replay.id + ' unsupported map');
      listedReplays[replay.idx].duplicate = false;
      $('tr[replay-id="' + replay.id + '"] .replay-status')
        .text('Unsupported Map')
        .addClass('negative');
    } else if (result === true) {
      console.log(replay.id + ' is a duplicate');
      listedReplays[replay.idx].duplicate = true;
      $('tr[replay-id="' + replay.id + '"] .replay-status')
        .text('Duplicate')
        .addClass('warning');
    } else {
      console.log(replay.id + ' Parser error');

      // this message is specifically for when a protocol doesn't exist
      if (result.message === "Cannot read property 'decodeReplayHeader' of undefined") {
        $('tr[replay-id="' + replay.id + '"] .replay-status')
          .text('Error: Missing Replay Protocol')
          .addClass('negative');
      } else {
        $('tr[replay-id="' + replay.id + '"] .replay-status')
          .text('Error: Internal Exception')
          .addClass('negative');
      }
    }

    listedReplays[replay.idx].processed = true;
    updateLastDate(listedReplays[replay.idx].date);

    if (replayQueue.length > 0) {
      parseReplaysAsync(replayQueue.shift());
    } else {
      enableParsingUI();
    }
  });
}

function loadReplay(data) {
  console.log('Replay ' + data.idx + ' returned with status ' + data.status);
  if (data.status === Parser.ReplayStatus.OK) {
    let collection = null;

    if (!usingImportSet && $('#settings-collection-import').dropdown('get value') !== '') {
      collection = [$('#settings-collection-import').dropdown('get value')];
    } else if (usingImportSet) {
      collection = listedReplays[data.idx].collections;
    }

    DB.insertReplay(data.match, data.players, collection, function () {
      $('tr[replay-id="' + listedReplays[data.idx].id + '"] .replay-status')
        .text('Success')
        .addClass('positive');
    });
  } else {
    $('tr[replay-id="' + listedReplays[data.idx].id + '"] .replay-status')
      .text('Error: ' + Parser.StatusString[data.status])
      .addClass('negative');
  }

  listedReplays[data.idx].processed = true;
  updateLastDate(listedReplays[data.idx].date);

  // updates certain elements in the entire application (player search dropdowns for instance)
  // after a new replay is processed.
  //globalDBUpdate();
  getMatchCount();

  if (replayQueue.length > 0) {
    parseReplaysAsync(replayQueue.shift());
  } else {
    enableParsingUI();
  }
}

function uploadReplayToHotsAPI(id, path) {
  $('tr[replay-id="' + id + '"] .upload-status').text('Uploading...');
  let requestUrl =
    'http://hotsapi.net/api/v1/replays?uploadToHotslogs=' +
    (settings.get('sendCopyToHotsLogs') === true ? 'true' : 'false');

  let form = new FormData();
  form.append('file', fs.createReadStream(path));
  form.append('uploadToHotslogs', settings.get('sendCopyToHotsLogs') === true ? 'true' : 'false');

  form.submit(requestUrl, function (err, res) {
    let body = '';
    res.on('readable', function () {
      body += res.read();
    });
    res.on('end', function () {
      let resp = JSON.parse(body);
      $('tr[replay-id="' + id + '"] .upload-status').text(resp.status);

      if (resp.status === 'Success') {
        $('tr[replay-id="' + id + '"] .upload-status').addClass('positive');
      } else {
        $('tr[replay-id="' + id + '"] .upload-status').addClass('warning');
      }
    });
  });
}

function stopParse() {
  console.log('Parser will stop after next replay');
  enableParsingUI();
  replayQueue = [];
}

function updateLastDate(date) {
  settings.set('lastReplayDate', date);
  $('#replay-file-start').datepicker('setDate', date);
}

function updateSelectedUser(value, text, $item) {
  settings.set('selectedPlayerID', value);
}

function addNewCollection() {
  // again i'm shamelessly copying things from other parts of the codebase
  $('#team-text-input .header').text('Add New Collection');
  $('#team-text-input .input .label').text('Collection Name');
  $('#team-text-input input').val('');

  $('#team-text-input')
    .modal({
      onApprove: function () {
        let name = $('#team-text-input input').val();
        DB.addCollection(name, function () {
          updateCollectionMenu();
          loadCollections();
        });
      },
    })
    .modal('show');
}

function loadCollections() {
  DB.getCollections(function (err, collections) {
    $('#collection-list tbody').html('');
    for (let c in collections) {
      $('#collection-list tbody').append(collectionRowTemplate(collections[c]));
    }

    // bindings
    $('#collection-list .button').click(function () {
      handleCollectionAction($(this).attr('collection-id'), $(this).attr('collection-name'), $(this).attr('action'));
    });
  });
}

function loadCachedCollections() {
  DB.getExternalCacheCollections(function (err, collections) {
    $('#collection-cache-list tbody').html('');
    let combined = {};
    for (let c of collections) {
      if (!(c.dbName in combined)) {
        combined[c.dbName] = { name: c.dbName, count: 0 };
      }

      combined[c.dbName].count += 1;
    }

    for (let c in combined) {
      $('#collection-cache-list tbody').append(collectionCacheRowTemplate(combined[c]));
    }

    // bind
    $('#collection-cache-list .button').click(function () {
      handleCacheAction($(this).attr('collection-name'), $(this).attr('action'));
    });
  });
}

function handleCollectionAction(id, name, action) {
  if (action === 'delete') {
    $('#team-confirm-action-user .header').text('Delete Collection ' + name);
    $('#team-confirm-action-user .action').text('delete ' + name);

    $('#team-confirm-action-user')
      .modal({
        onApprove: function () {
          DB.deleteCollection(id, function () {
            updateCollectionMenu();
            loadCollections();
          });
        },
      })
      .modal('show');
  } else if (action === 'rename') {
    $('#team-text-input .header').text('Rename Collection ' + name);
    $('#team-text-input .input .label').text('Collection Name');
    $('#team-text-input input').val('');
    $('#team-text-input .actions .approve').text('Rename');

    $('#team-text-input')
      .modal({
        onApprove: function () {
          let name = $('#team-text-input input').val();
          DB.renameCollection(id, name, function () {
            // uh changing back to defaults here
            $('#team-text-input .actions .approve').text('Add');
            updateCollectionMenu();
            loadCollections();
          });
        },
      })
      .modal('show');
  }
}

function setPlayerMenuThreshold() {
  settings.set('playerThreshold', parseInt($('#player-menu-thresh-input input').val()));
  showMessage(
    'Player Menu Result Limit Updated',
    'Menus will now show ' + settings.get('playerThreshold') + ' players maximum when searching.',
    { class: 'positive' },
  );
}

function cacheExternalDB() {
  let path = $('#settings-set-cache-import-folder input').val();
  let name = $('#settings-set-cache-name input').val();

  // little jank but the view is sync'd with the model...
  if (name === '' || $('td[collection-name="' + name + '"]').length > 0) {
    $('#settings-set-cache-name').addClass('error');
    $('#settings-set-cache-name input').popup('show');
    return false;
  }

  if (!fs.existsSync(path + '/hero.db')) {
    $('#settings-set-cache-import-folder').addClass('error');
    $('#settings-set-cache-import-folder input').popup('show');
    return false;
  }

  showMessage('Caching External Database ' + name, 'Reading from ' + path);
  $('#settings-import-external-db').addClass('disabled');
  DB.cacheExternalDatabase(path, name, function () {
    showMessage('External Database Load Complete', name + ': ' + path, {
      class: 'positive',
    });
    $('#settings-import-external-db').removeClass('disabled');
    loadCachedCollections();
    populateStatCollectionMenus();
  });

  $('#settings-new-cache-modal input').popup('hide');
  return true;
}

function handleCacheAction(dbName, action) {
  if (action === 'delete') {
    $('#settings-confirm-cache-delete-modal')
      .modal({
        onApprove: function () {
          DB.deleteExternalCache(dbName, function () {
            loadCachedCollections();
            populateStatCollectionMenus();
          });
        },
      })
      .modal('show');
  } else if (action === 'update') {
    dialog.showOpenDialog(
      {
        defaultPath: settings.get('replayPath'),
        title: 'Select Database Location',
        properties: ['openDirectory', 'createDirectory'],
      },
      function (files) {
        if (files) {
          if (!fs.existsSync(files[0] + '/hero.db')) {
            showMessage('Unable to Update Cache', 'Selected folder ' + files[0] + ' has no valid database.');

            return;
          }

          // update is basically just delete then import
          DB.deleteExternalCache(dbName, function () {
            showMessage('Updating External Database ' + dbName, 'Reading from ' + files[0]);
            $('#settings-import-external-db').addClass('disabled');
            DB.cacheExternalDatabase(files[0], dbName, function () {
              showMessage('External Database Update Complete', dbName + ': ' + files[0], { class: 'positive' });
              $('#settings-import-external-db').removeClass('disabled');
              loadCachedCollections();
              populateStatCollectionMenus();
            });
          });
        }
      },
    );
  }
}

function setImportSetUse(state) {
  usingImportSet = state;

  if (usingImportSet) {
    $('#settings-set-replay-folder input').val('[Using Import Set]');
    $('#settings-collection-import').addClass('disabled');
  } else {
    $('#settings-set-replay-folder input').val(settings.get('replayPath'));
    $('#settings-collection-import').removeClass('disabled');
  }

  settings.set('usingImportSet', state);
  startReplayScan();
}

function addImportSetFolder() {
  dialog.showOpenDialog(
    {
      defaultPath: settings.get('replayPath'),
      title: 'Select Replay Folder',
      properties: ['openDirectory', 'createDirectory'],
    },
    function (files) {
      if (files) {
        // pick the first, should only be 1 dir
        let path = files[0];
        if (path in localImportSet) {
          showMessage('Failed to Add Folder to Import Set', 'Folder is already in the import set', {
            class: 'negative',
          });
        } else {
          localImportSet[path] = {
            path: path,
            collections: [],
          };

          insertImportSetRow(localImportSet[path]);
        }
      }
    },
  );
}

function insertImportSetRow(data) {
  let elem = '<tr path="' + data.path + '">';
  elem += '<td>' + data.path + '</td>';

  // collection menu
  elem += '<td><div path="' + data.path + '" class="ui fluid search multiple selection dropdown collection-menu">';
  elem += '<i class="dropdown icon"></i><span class="text">[No Collection]</span><div class="menu"></div></div></td>';

  // actions
  elem += '<td><div path="' + data.path + '" class="ui red button">Delete</div></td>';
  elem += '</tr>';

  elem = $(elem);
  $('#settings-import-set tbody').append(elem);

  // bindings
  let path = data.path;
  elem.find('.collection-menu.dropdown').dropdown({
    onChange: function (value, text, $elem) {
      localImportSet[path].collections = value.split(',');
      saveLocalImportSet();
    },
  });

  elem.find('.red.button').click(function () {
    deleteImportSetFolder(elem);
  });

  updateCollectionMenu(function () {
    elem.find('.dropdown').dropdown('set exactly', data.collections);
  });

  saveLocalImportSet();
}

function deleteImportSetFolder(elem) {
  let path = $(elem).attr('path');
  delete localImportSet[path];
  elem.remove();
  saveLocalImportSet();
}

function saveLocalImportSet() {
  let globalSet = settings.get('importSets');
  let dbPath = settings.get('dbPath');

  if (!globalSet) {
    globalSet = { dbPath: localImportSet };
  } else {
    globalSet[dbPath] = localImportSet;
  }

  settings.set('importSets', globalSet);
}

function startWatcher() {
  let watchDirs = settings.get('watchDirs');
  let dbPath = settings.get('dbPath');
  let recursive = settings.get('recursiveReplaySearch');
  showMessage('Started watching replay folder', 'New files will be automatically imported');

  if (!watchDirs) {
    watchDirs = {};
  }

  watchDirs[dbPath] = true;
  settings.set('watchDirs', watchDirs);

  if (watcher) watcher.close();

  if (usingImportSet) {
    // get all the import set paths
    let dirs = [];
    let importSet = settings.get('importSets')[dbPath];
    for (let dir in importSet) {
      dirs.push(importSet[dir].path);
    }

    watcher = watch(dirs, { recursive, filter: /\.stormreplay$/i, delay: 1000 }, liveAddReplay);
  } else {
    // just the one
    watcher = watch(settings.get('replayPath'), { recursive, filter: /\.stormreplay$/i, delay: 1000 }, liveAddReplay);
  }
}

function stopWatcher() {
  let watchDirs = settings.get('watchDirs');
  let dbPath = settings.get('dbPath');
  showMessage('Stopped watching replay folder', 'New files will not be automatically imported');

  if (!watchDirs) {
    watchDirs = {};
  }

  watchDirs[dbPath] = false;
  settings.set('watchDirs', watchDirs);

  if (watcher) {
    watcher.close();
  }
}

function liveAddReplay(evt, name) {
  if (evt === 'update') {
    // filtered out non-stormreplay files
    let stats = fs.statSync(name);

    let prefix = name.match(/(.*)[/\\]/)[1] || '';

    let context = {};
    context.status = '';
    context.date = new Date(stats.birthtime);
    context.fdate = context.date.toLocaleString('en-us');
    context.folder = prefix.match(/([^/\\]*)\/*$/)[1];
    context.filename = name.match(/([^/\\]*)\/*$/)[1];

    // only used for import sets, safe to leave undefined otherwise
    if (usingImportSet) {
      context.collections = localImportSet[prefix].collections;
    }

    context.path = name;

    context.id = listedReplays.length;
    $('#replay-file-list').append(settingsRowTemplate(context));
    context.processed = false;
    listedReplays.push(context);

    context.idx = context.id;
    replayQueue.push(context);

    if (!parserRunning) {
      disableParsingUI();
      parseReplaysAsync(replayQueue.shift());
    }
  }
}

function compactAndReload() {
  $('#settings-compact-and-reload')
    .modal({
      closable: false,
      onDeny: function () {
        return true;
      },
      onApprove: function () {
        setTimeout(() => {
          showLoader();
          setLoadMessage('Compacting Database');
          DB.compactAndReload(() => {
            app.relaunch();
            app.quit();
          });
        }, 1500);
        return true;
      },
    })
    .modal('show');
}

function startUpdateFromUrl() {
  $('#settings-update-from-url .actions').removeClass('is-hidden');
  $('#settings-update-from-url .update-status').addClass('is-hidden');

  let lastURL = settings.get('updateURL');
  let path = settings.get('dbPath');
  if (lastURL && path in lastURL) {
    $('#settings-update-from-url input').val(lastURL[path]);
  }

  $('#settings-update-from-url')
    .modal({
      closable: false,
      onDeny: function () {
        return true;
      },
      onApprove: function () {
        $('#settings-update-from-url .actions').addClass('is-hidden');
        let url = $('#settings-update-from-url input').val();
        updateUpdateURL(url);
        downloadZipFromUrl(url, extractZipFromUrl);
        initDownloadProgress();

        // don't actually dismiss
        return false;
      },
    })
    .modal('show');
}

function initDownloadProgress() {
  $('#settings-update-from-url .update-status').removeClass('is-hidden');

  $('#settings-update-from-url .update-status .progress').progress();
  setDownloadProgress(0, 'Downloading File...');
}

function setDownloadProgress(val, label) {
  $('#settings-update-from-url .update-status .progress').progress('set progress', val);
  $('#settings-update-from-url .update-status .progress').progress('set label', label);
}

function updateUpdateURL(url) {
  let urls = settings.get('updateURL');
  let path = settings.get('dbPath');

  if (!urls) {
    urls = {};
  }
  urls[path] = url;

  settings.set('updateURL', urls);
}

// part of the set of functions that'll auto-update a database
function downloadZipFromUrl(url, next) {
  let fileLoc = path.join(app.getPath('userData'), 'downloadedFile.zip');

  request
    .get(url)
    .on('response', function (response) {
      console.log(response.statusCode);
    })
    .on('error', function (err) {
      console.log(err);
    })
    .pipe(fs.createWriteStream(fileLoc))
    .on('finish', next);
}

function extractZipFromUrl() {
  setDownloadProgress(33, 'Checking Downloaded File...');

  // check that it exists
  let fileLoc = path.join(app.getPath('userData'), 'downloadedFile.zip');
  let extractLoc = path.join(app.getPath('userData'), 'download-tmp');
  if (fs.statSync(fileLoc)) {
    // attempt extraction
    // ensure download-tmp is empty
    fs.emptyDir(extractLoc, function (err) {
      if (!err) {
        setDownloadProgress(33, 'Extracting Downloaded File...');
        extractZip(fileLoc, { dir: extractLoc }, function (err) {
          if (!err) {
            console.log('extracted file');
            copyZipContents();
          } else {
            setDownloadProgress(100, 'Failed to Extract. Restarting.');
            cleanUpDownload();
          }
        });
      } else {
        setDownloadProgress(100, 'Downloaded file not found. Restarting.');
        cleanUpDownload();
      }
    });
  }
}

function copyZipContents() {
  setDownloadProgress(100, 'Rebooting to Complete Operation');
  console.log('proceeding to copy');

  DB.close(function () {
    DB.destroy(function () {
      // reboot now and continue later
      settings.set('completeDownload', true);
      setTimeout(() => {
        app.relaunch();
        app.quit();
      }, 1000);
    });
  });
}

function finishCopyZipContents() {
  $('#settings-update-from-url .actions').addClass('is-hidden');
  $('#settings-update-from-url')
    .modal({
      closable: false,
    })
    .modal('show');

  // expected files
  for (let db of ['matches.ldb', 'hero.ldb', 'players.ldb', 'settings.ldb']) {
    try {
      fs.statSync(path.join(app.getPath('userData'), 'download-tmp', db));
    } catch (e) {
      showMessage(`External DB download failed`, `Missing expected files. Database may be in inconsistent state`, {
        class: 'negative',
        sticky: true,
      });
      let fileLoc = path.join(app.getPath('userData'), 'downloadedFile.zip');
      fs.removeSync(fileLoc);

      let extractLoc = path.join(app.getPath('userData'), 'download-tmp');
      fs.removeSync(extractLoc);
      return;
    }
  }

  let idx = 0;
  for (let db of ['matches.ldb', 'hero.ldb', 'players.ldb', 'settings.ldb']) {
    setDownloadProgress(66 + (33 / 4) * idx, `Copying ${db}`);

    let res = tryCopyDatabaseFolder(db);

    if (!res) {
      console.log('Copy error, aborting');
      showMessage(`External DB copy failed`, `Error copying ${db}. Database may be in inconsistent state.`, {
        class: 'negative',
        sticky: true,
      });
      return;
    }

    idx += 1;
  }

  console.log('cleaining up download files');

  // delete downloadFile
  let fileLoc = path.join(app.getPath('userData'), 'downloadedFile.zip');
  fs.removeSync(fileLoc);

  let extractLoc = path.join(app.getPath('userData'), 'download-tmp');
  fs.removeSync(extractLoc);

  showMessage(`External DB Downloaded`, `Successfully updated database.`, {
    class: 'positive',
    sticky: true,
  });
}

function tryCopyDatabaseFolder(dbFolder) {
  let folderLoc = path.join(app.getPath('userData'), 'download-tmp', dbFolder);
  let folderDest = path.join(settings.get('dbPath'), dbFolder);
  try {
    fs.statSync(folderLoc);
    console.log(`Copying ${dbFolder}`);

    // i don't think we have to copy hint files
    fs.emptyDirSync(folderDest);
    fs.copySync(folderLoc, folderDest);
    return true;
  } catch (e) {
    return false;
  }
}

function cleanUpDownload() {
  console.log('cleaining up download files');

  // delete downloadFile
  let fileLoc = path.join(app.getPath('userData'), 'downloadedFile.zip');
  fs.removeSync(fileLoc);

  let extractLoc = path.join(app.getPath('userData'), 'download-tmp');
  fs.removeSync(extractLoc);

  setTimeout(() => {
    app.relaunch();
    app.quit();
  }, 2000);
}

function selectDBToImport() {
  dialog.showOpenDialog(
    {
      title: 'Select Database to Import',
      properties: ['openDirectory'],
    },
    function (files) {
      if (files) {
        // pick the first, should only be 1 dir
        let path = files[0];
        $('#settings-import-other-db-path').val(path);
      }
    },
  );
}

function importOtherDatabase() {
  $('#settings-import-other-db-menu').dropdown('set exactly', ['1', '2', '3']);
  $('#settings-import-other-db .message').addClass('is-hidden');

  $('#settings-import-other-db')
    .modal({
      closable: false,
      onApprove: function () {
        // collect data
        let path = $('#settings-import-other-db-path').val();
        let importData = $('#settings-import-other-db-menu').dropdown('get value').split(',');
        for (let i = 0; i < importData.length; i++) {
          importData[i] = parseInt(importData[i]);
        }

        $('#settings-import-other-db .message').removeClass('is-hidden');
        $('#settings-import-other-db .form .field').addClass('disabled');

        // run the thing
        DB.importDB(
          path,
          importData,
          function (msg) {
            $('#settings-import-other-db-status').text(msg);
          },
          function (err) {
            // then reboot
            if (err) {
              $('#settings-import-other-db-status').text(`Error: ${err}. Please file a bug report and reboot the app.`);
            } else {
              $('#settings-import-other-db-status').text(`Cleaning up. App will restart shortly.`);
              setTimeout(() => {
                app.relaunch();
                app.quit();
              }, 5000);
            }
          },
        );

        return false;
      },
    })
    .modal('show');
}

function dumpDB() {
  dialog.showOpenDialog(
    {
      title: 'Select Export Location',
      properties: ['openDirectory'],
    },
    function (files) {
      showMessage(
        'Exporting Database',
        'This may take a little bit. A message will display here when the operation is complete.',
        { class: 'info' },
      );

      let path = files[0];

      DB.dump(path, function () {
        showMessage('Database Export Complete', `Exported 4 files to ${path}.`, { class: 'positive' });
      });
    },
  );
}
