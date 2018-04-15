var settingsRowTemplate;
var replayQueue;
var collectionRowTemplate;
var collectionCacheRowTemplate;
var importDuplicates = false;
var localImportSet = {};
var usingImportSet = false;

// used by the parser
var listedReplays;

function initSettingsPage() {
  // templates
  settingsRowTemplate = Handlebars.compile(getTemplate('settings', '#replay-row-template').find('tr')[0].outerHTML);
  collectionRowTemplate = Handlebars.compile(getTemplate('settings', '#collection-row-template').find('tr')[0].outerHTML);
  collectionCacheRowTemplate = Handlebars.compile(getTemplate('settings', '#collection-cache-row-template').find('tr')[0].outerHTML);

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

  $('#settings-hots-api-button').checkbox({
    onChecked: function() {
      settings.set('uploadToHotsAPI', true);
      $('#settings-hots-logs-button').checkbox('enable');
    },
    onUnchecked: function() {
      settings.set('uploadToHotsAPI', false);
      $('#settings-hots-logs-button').checkbox('disable');
    }
  });

  if (sendCopyToHotsLogs) {
    $('#settings-hots-logs-button').checkbox('set checked');
  }

  if (uploadToHotsAPI) {
    $('#settings-hots-api-button').checkbox('check');
  }
  else {
    $('#settings-hots-api-button').checkbox('uncheck');
    $('#settings-hots-logs-button').checkbox('disable');
  }

  $('#settings-hots-logs-button').checkbox({
    onChecked : function() {
      settings.set('sendCopyToHotsLogs', true);
    },
    onUnchecked: function() {
      settings.set('sendCopyToHotsLogs', false);
    }
  });

  $('#settings-hots-logs-button').popup();

  $('#settings-force-duplicate').checkbox({
    onChecked: function() {
      importDuplicates = true;
    },
    onUnchecked: function() {
      importDuplicates = false;
    }
  });

  // handlers
  $('#settings-set-replay-folder-button').click(setReplayFolder);
  ipcRenderer.on('replayParsed', function(event, data) {
    loadReplay(data);
  });
  $('#start-process-button').click(parseReplays);
  $('#stop-process-button').click(stopParse);
  $('#rescan-replays-button').click(startReplayScan);
  $('#replay-file-start').datepicker();
  $('#replay-file-start').on('hide.datepicker', function(e) {
    settings.set('lastReplayDate', e.date);
    startReplayScan();
  });
  $('#replay-file-start').datepicker('setDate', date);
  $('#delete-db-button').click(function() {
    $('#confirm-db-delete-modal').modal({
      closable: false,
      onDeny: function() {
        return true;
      },
      onApprove: function() {
        DB.deleteDB();
        app.relaunch();
        app.quit();
        return true;
      }
    }).modal('show');
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
    onChange: updateSelectedUser
  });
  $('#settings-set-player').dropdown('set selected', selectedPlayerID);

  $('#settings-submenu .item').tab();
  $('#settings-submenu .item').click(function() {
    $('#settings-page-content table').floatThead('reflow');
  });
  $('#settings-new-collection-button').click(addNewCollection);

  $('#settings-page-content table').floatThead({
    scrollContainer: closestWrapper,
    autoReflow: true
  });

  $('#settings-reset-focus-player').click(function() {
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

  $('#show-app-dev-tools').click(function() {
    remote.getCurrentWindow().toggleDevTools();
  });

  $('#show-parser-dev-tools').click(function() {
    bgWindow.webContents.openDevTools();
  });

  loadCollections();
  loadCachedCollections();

  $('#settings-set-cache-import-folder').click(function() {
    browseForFolder($(this), 'Select Database Folder');
  });

  $('#settings-new-cache-modal input').popup({
    on: 'manual'
  });

  $('#settings-import-external-db').click(function() {
    $('#settings-set-cache-name').removeClass('error');
    $('#settings-set-cache-import-folder').removeClass('error');
    $('#settings-new-cache-modal input').popup('hide');

    $('#settings-new-cache-modal').modal({
      closable: false,
      onDeny: function() {
        $('#settings-new-cache-modal input').popup('hide');
        return true;
      },
      onApprove: cacheExternalDB
    }).modal('show');
  });

  // setting popup
  $('#settings-set-folder-options-button').popup({
    on: 'click',
    position: 'bottom right',
    popup: $('#settings-replay-folder-settings-popup')
  });

  $('#settings-recursive-replay').checkbox({
    onChecked: function() {
      settings.set('recursiveReplaySearch', true);
    },
    onUnchecked: function() {
      settings.set('recursiveReplaySearch', false);
    }
  });

  // import sets
  $('#settings-use-import-set').checkbox({
    onChecked: () => setImportSetUse(true),
    onUnchecked: () => setImportSetUse(false)
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

  if (replayPath) {
    // load the directory
    startReplayScan();
  }
}

function showSettingsPage() {
  $('#settings-page-content table').floatThead('reflow');
}

function setReplayFolder() {
  dialog.showOpenDialog({
    defaultPath: settings.get('replayPath'),
    title: 'Select Replay Folder',
    properties: ["openDirectory", "createDirectory"]
  }, function(files) {
    if (files) {
      // pick the first, should only be 1 dir
      let path = files[0];
      settings.set('replayPath', path);
      $('#settings-set-replay-folder input').val(path);

      startReplayScan();
    }
  });
}

// this just sets the text for an element
function browseForFolder(elem, title) {
  dialog.showOpenDialog({
    defaultPath: settings.get('replayPath'),
    title: title,
    properties: ["openDirectory", "createDirectory"]
  }, function(files) {
    if (files) {
      // pick the first, should only be 1 dir
      let path = files[0];
      elem.find('input').val(path);
    }
  });
}

function setDBFolder() {
  dialog.showOpenDialog({
    defaultPath: settings.get('dbPath'),
    title: 'Set Database Folder',
    properties: ['openDirectory', 'createDirectory']
  }, function(files) {
    if (files) {
      // 1 dir
      let path = files[0];
      settings.set('dbPath', path);
      app.relaunch();
      app.quit();
    }
  });
}

function resetDBFolder() {
  $('#confirm-db-reset-modal').modal({
    onApprove: function() {
      settings.set('dbPath', app.getPath('userData'));
      app.relaunch();
      app.quit();
    }
  }).modal('show');
}

function startReplayScan() {
  // lists the files in the folder
  console.log("Listing replay files...");
  let currentDate = $('#replay-file-start').datepicker('getDate');
  settings.set('lastReplayDate', currentDate);

  $('#replay-file-list tbody').html('');

  let replays = [];
  if (usingImportSet) {
    // import from each path, assign collections to each thing
    for (let dir in localImportSet) {
      replays = replays.concat(addReplaysToList(localImportSet[dir].path, localImportSet[dir].collections));
    }
  }
  else {
    let path = settings.get('replayPath');
    replays = addReplaysToList(path);
  }

  // sort by date
  replays.sort(function(a, b) {
    if (a.date === b.date)
      return 0;
    
    if (a.date < b.date)
      return -1;
    
    return 1;
  });

  let count = 0;
  for (let r in replays) {
    replays[r].id = count;
    $('#replay-file-list').append(settingsRowTemplate(replays[r]));
    replays[r].processed = false;
    count += 1;
  }
  listedReplays = replays;

  console.log('Found ' + count + ' replays ')
}

function addReplaysToList(path, collections) {
  try {
    let currentDate = $('#replay-file-start').datepicker('getDate');
    let files = fs.readdirSync(path);
    let replays = [];
    for (let file of files) {
      let stats = fs.statSync(path + '/' + file);
      if (file.endsWith('.StormReplay')) {
        let context = { filename: file };
        context.status = "";
        context.date = new Date(stats.birthtime);
        context.fdate = context.date.toLocaleString('en-us');
        context.folder = path.match(/([^\/\\]*)\/*$/)[1];

        // only used for import sets, safe to leave undefined otherwise
        context.collections = collections;

        if (context.date >= currentDate) {
          context.path = path + '/' + file;
          replays.push(context);
        }
      }
      else if (stats.isDirectory()) {
        replays = replays.concat(addReplaysToList(path + '/' + file));
      }
    }

    return replays;
  }
  catch (err) {
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
  let i = 0
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

  // upload maybe
  if (settings.get('uploadToHotsAPI') === true) {
    uploadReplayToHotsAPI(replay.id, replay.path);
  }

  DB.checkDuplicate(replay.path, function(result) {
    if (importDuplicates === true || result === false) {
      bgWindow.webContents.send('parseReplay', replay.path, replay.idx, BrowserWindow.getAllWindows()[0].id);
      return;
    }
    else if (result === 'map') {
      console.log(replay.id + ' unsupported map');
      listedReplays[replay.idx].duplicate = false;
      $('tr[replay-id="' + replay.id + '"] .replay-status').text('Unsupported Map').addClass('negative');
    }
    else if (result === true) {
      console.log(replay.id + ' is a duplicate');
      listedReplays[replay.idx].duplicate = true;
      $('tr[replay-id="' + replay.id + '"] .replay-status').text('Duplicate').addClass('warning');
    }
    else {
      console.log(replay.id + ' Parser error');

      // this message is specifically for when a protocol doesn't exist
      if (result.message === "Cannot read property 'decodeReplayHeader' of undefined") {
        $('tr[replay-id="' + replay.id + '"] .replay-status').text('Error: Missing Replay Protocol').addClass('negative');
      }
      else {
        $('tr[replay-id="' + replay.id + '"] .replay-status').text('Error: Internal Exception').addClass('negative');
      }
    }

    listedReplays[replay.idx].processed = true;
    updateLastDate(listedReplays[replay.idx].date);

    if (replayQueue.length > 0) {
      parseReplaysAsync(replayQueue.shift());
    }
    else {
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
    }
    else if (usingImportSet) {
      collection = listedReplays[data.idx].collections;
    }

    DB.insertReplay(data.match, data.players, collection);
    $('tr[replay-id="' + listedReplays[data.idx].id + '"] .replay-status').
      text('Success').
      addClass('positive');
  }
  else {
    $('tr[replay-id="' + listedReplays[data.idx].id + '"] .replay-status').
      text('Error: ' + Parser.StatusString[data.status]).
      addClass('negative');
  }

  listedReplays[data.idx].processed = true;
  updateLastDate(listedReplays[data.idx].date);

  // updates certain elements in the entire application (player search dropdowns for instance)
  // after a new replay is processed.
  globalDBUpdate();

  if (replayQueue.length > 0) {
    parseReplaysAsync(replayQueue.shift());
  }
  else {
    enableParsingUI();
  }
}

function uploadReplayToHotsAPI(id, path) {
  $('tr[replay-id="' + id + '"] .upload-status').text('Uploading...');
  let requestUrl = 'http://hotsapi.net/api/v1/replays?uploadToHotslogs=' + (settings.get('sendCopyToHotsLogs') === true ? 'true' : 'false')

  let form = new FormData();
  form.append('file', fs.createReadStream(path));
  form.append('uploadToHotslogs', settings.get('sendCopyToHotsLogs') === true ? 'true' : 'false');

  form.submit(requestUrl, function(err, res) {
    let body = '';
    res.on('readable', function() {
      body += res.read();
    });
    res.on('end', function() {
      let resp = JSON.parse(body);
      $('tr[replay-id="' + id + '"] .upload-status').text(resp.status);

      if (resp.status === 'Success') {
        $('tr[replay-id="' + id + '"] .upload-status').addClass('positive');
      }
      else {
        $('tr[replay-id="' + id + '"] .upload-status').addClass('warning');
      }
    });
  });
}

function stopParse() {
  console.log("Parser will stop after next replay");
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
  $('#team-text-input .header').text('Add New Collection')
  $('#team-text-input .input .label').text('Collection Name');
  $('#team-text-input input').val('');

  $('#team-text-input').modal({
    onApprove: function() {
      let name = $('#team-text-input input').val();
      DB.addCollection(name, function() {
        updateCollectionMenu();
        loadCollections();
      });
    }
  }).
  modal('show');
}

function loadCollections() {
  DB.getCollections(function(err, collections) {
    $('#collection-list tbody').html('');
    for (let c in collections) {
      $('#collection-list tbody').append(collectionRowTemplate(collections[c]));
    }

    // bindings
    $('#collection-list .button').click(function() {
      handleCollectionAction($(this).attr('collection-id'), $(this).attr('collection-name'), $(this).attr('action'));
    });
  });
}

function loadCachedCollections() {
  DB.getExternalCacheCollections(function(err, collections) {
    $('#collection-cache-list tbody').html('');
    let combined = {};
    for (let c of collections) {
      if (!(c.dbName in combined)) {
        combined[c.dbName] = { name: c.dbName, count: 0  };
      }

      combined[c.dbName].count += 1;
    }

    for (let c in combined) {
      $('#collection-cache-list tbody').append(collectionCacheRowTemplate(combined[c]));
    }

    // bind
    $('#collection-cache-list .button').click(function() {
      handleCacheAction($(this).attr('collection-name'), $(this).attr('action'));
    })
  })
}

function handleCollectionAction(id, name, action) {
  if (action === 'delete') {
    $('#team-confirm-action-user .header').text('Delete Collection ' + name);
    $('#team-confirm-action-user .action').text('delete ' + name);

    $('#team-confirm-action-user').modal({
      onApprove: function() {
        DB.deleteCollection(id, function() {
          updateCollectionMenu();
          loadCollections();
        });
      }
    }).
    modal('show');
  }
  else if (action === 'rename') {
    $('#team-text-input .header').text('Rename Collection ' + name)
    $('#team-text-input .input .label').text('Collection Name');
    $('#team-text-input input').val('');
    $('#team-text-input .actions .approve').text('Rename');
  
    $('#team-text-input').modal({
      onApprove: function() {
        let name = $('#team-text-input input').val();
        DB.renameCollection(id, name, function() {
          // uh changing back to defaults here
          $('#team-text-input .actions .approve').text('Add');
          updateCollectionMenu();
          loadCollections();
        });
      }
    }).
    modal('show');
  }
}

function setPlayerMenuThreshold() {
  settings.set('playerThreshold', parseInt($('#player-menu-thresh-input input').val()));
  showMessage('Player Threshold Updated', 'Menus have been updated', { class: 'positive' });
  runPlayerMenuUpdate();
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
  DB.cacheExternalDatabase(path, name, function() {
    showMessage('External Database Load Complete', name + ': ' + path, { class: 'positive' });
    $('#settings-import-external-db').removeClass('disabled');
    loadCachedCollections();
    populateStatCollectionMenus();
  });

  $('#settings-new-cache-modal input').popup('hide');
  return true;
}

function handleCacheAction(dbName, action) {
  if (action === 'delete') {
    $('#settings-confirm-cache-delete-modal').modal({
      onApprove: function() {
        DB.deleteExternalCache(dbName, function() {
          loadCachedCollections();
          populateStatCollectionMenus();
        });
      }
    }).
    modal('show');
  }
  else if (action === 'update') {
    dialog.showOpenDialog({
      defaultPath: settings.get('replayPath'),
      title: 'Select Database Location',
      properties: ["openDirectory", "createDirectory"]
    }, function(files) {
      if (files) {
        if (!fs.existsSync(files[0] + '/hero.db')) {
          showMessage('Unable to Update Cache', 'Selected folder ' + files[0] + ' has no valid database.');

          return;
        }

        // update is basically just delete then import
        DB.deleteExternalCache(dbName, function() {
          showMessage('Updating External Database ' + dbName, 'Reading from ' + files[0]);
          $('#settings-import-external-db').addClass('disabled');
          DB.cacheExternalDatabase(files[0], dbName, function() {
            showMessage('External Database Update Complete', dbName + ': ' + files[0], { class: 'positive' });
            $('#settings-import-external-db').removeClass('disabled');
            loadCachedCollections();
            populateStatCollectionMenus();
          })
        })
      }
    });
  }
}

function setImportSetUse(state) {
  usingImportSet = state;

  if (usingImportSet) {
    $('#settings-set-replay-folder input').val('[Using Import Set]');
    $('#settings-collection-import').addClass('disabled');
  }
  else {
    $('#settings-set-replay-folder input').val(settings.get('replayPath'));
    $('#settings-collection-import').removeClass('disabled');
  }

  settings.set('usingImportSet', state);
  startReplayScan();
}

function addImportSetFolder() {
  dialog.showOpenDialog({
    defaultPath: settings.get('replayPath'),
    title: 'Select Replay Folder',
    properties: ["openDirectory", "createDirectory"]
  }, function(files) {
    if (files) {
      // pick the first, should only be 1 dir
      let path = files[0];
      if (path in localImportSet) {
        showMessage('Failed to Add Folder to Import Set', 'Folder is already in the import set', { class: 'negative' })
      }
      else {
        localImportSet[path] = {
          path: path,
          collections: []
        }

        insertImportSetRow(localImportSet[path]);
      }
    }
  });
}

function insertImportSetRow(data) {
  let elem = '<tr path="' + data.path + '">'
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
    onChange: function(value, text, $elem) {
      localImportSet[path].collections = value.split(',');
      saveLocalImportSet();
    }
  });

  elem.find('.red.button').click(function() {
    deleteImportSetFolder(elem);
  });

  updateCollectionMenu(function() {
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
  }
  else {
    globalSet[dbPath] = localImportSet;
  }

  settings.set('importSets', globalSet);
}