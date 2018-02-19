var settingsRowTemplate;
var replayQueue;
var collectionRowTemplate;

// used by the parser
var listedReplays;

function initSettingsPage() {
  // templates
  settingsRowTemplate = Handlebars.compile(getTemplate('settings', '#replay-row-template').find('tr')[0].outerHTML);
  collectionRowTemplate = Handlebars.compile(getTemplate('settings', '#collection-row-template').find('tr')[0].outerHTML);

  let date = settings.get('lastReplayDate');
  if (!date)
    date = new Date(2012, 1, 1);

  // handlers
  $('#settings-set-replay-folder button').click(setReplayFolder);
  ipcRenderer.on('replayParsed', function(event, data) {
    loadReplay(data);
  });
  $('#start-process-button').click(parseReplays);
  $('#stop-process-button').click(stopParse);
  $('#rescan-replays-button').click(startReplayScan);
  $('#replay-file-start').datepicker();
  $('#replay-file-start').datepicker('setDate', date);
  $('#delete-db-button').click(function() {
    $('#confirm-db-delete-modal').modal({
      closable: false,
      onDeny: function() {
        return true;
      },
      onApprove: function() {
        DB.deleteDB();
        loadDatabase();
        return true;
      }
    }).modal('show');
  });

  // initial settings
  let path = settings.get('dbPath');
  $('#settings-set-db-folder input').val(path);
  $('#settings-set-db-folder .button').click(setDBFolder);

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

  loadCollections();

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
      loadDatabase();
      loadCollections();
      resetAllSections();
      $('#settings-set-db-folder input').val(path);
    }
  });
}

function startReplayScan() {
  // lists the files in the folder
  console.log("Listing replay files...");
  let currentDate = $('#replay-file-start').datepicker('getDate');

  $('#replay-file-list tbody').html('');
  let path = settings.get('replayPath');
  fs.readdir(path, function(err, files) {
    if (err) {
      console.log(err);
      return;
    }

    // replays are expected to end in .StormReplay, if not
    // the person running this should stop doing that???
    let count = 0;
    let replays = [];
    for (let i = 0; i < files.length; i++) {
      // check if replay
      if (files[i].endsWith('.StormReplay')) {
        // add a thing
        let context = { filename: files[i] };
        context.status = "";
        let stats = fs.statSync(path + '/' + files[i]);
        context.date = new Date(stats.ctime);

        if (context.date >= currentDate) {
          context.id = i;
          context.path = path + '/' + files[i];
          replays.push(context);
          count += 1;
        }
      }
    }

    // sort by date
    replays.sort(function(a, b) {
      if (a.date === b.date)
        return 0;
      
      if (a.date < b.date)
        return -1;
      
      return 1;
    });

    for (let r in replays) {
      $('#replay-file-list').append(settingsRowTemplate(replays[r]));
      replays[r].processed = false;
    }
    listedReplays = replays;

    console.log('Found ' + count + ' replays ')
  });
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

  if (replayQueue.length > 0)
    parseReplaysAsync(replayQueue.shift());
}

function parseReplaysAsync(replay) {
  // attempts to spawn a child process, parse the replays in there,
  // then hand back to the main thread to actually insert into the database
  $('tr[replay-id="' + replay.id + '"] .replay-status').text('Processing...');
  DB.checkDuplicate(replay.path, function(result) {
    if (result === false) {
      bgWindow.webContents.send('parseReplay', replay.path, replay.idx, BrowserWindow.getAllWindows()[0].id);
    }
    else {
      console.log(replay.id + ' is a duplicate');
      listedReplays[replay.idx].duplicate = true;
      $('tr[replay-id="' + replay.id + '"] .replay-status').text('Duplicate').addClass('warning');
      listedReplays[replay.idx].processed = true;
      updateLastDate(listedReplays[replay.idx].date);

      if (replayQueue.length > 0) {
        parseReplaysAsync(replayQueue.shift());
      }
    }
  });
}

function loadReplay(data) {
  console.log('Replay ' + data.idx + ' returned with status ' + data.status);
  if (data.status === Parser.ReplayStatus.OK) {
    let collection = null;

    if ($('#settings-collection-import').dropdown('get value') !== '') {
      collection = $('#settings-collection-import').dropdown('get value');
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
}

function stopParse() {
  console.log("Parser will stop after next replay");
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