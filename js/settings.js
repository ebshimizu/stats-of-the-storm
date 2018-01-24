var settingsRowTemplate;
var replayQueue;

// used by the parser
var listedReplays;

function initSettingsPage() {
  // templates
  settingsRowTemplate = Handlebars.compile(getTemplate('settings', '#replay-row-template').find('tr')[0].outerHTML);
  let date = settings.get('lastReplayDate');
  if (!date)
    date = new Date(2012, 1, 1);

  // handlers
  $('#replay-file-list').stickyTableHeaders({scrollableArea: $('.settings-table-wrapper')})
  $('#settings-set-replay-folder button').click(setReplayFolder);
  ipcRenderer.on('replayParsed', function(event, data) {
    loadReplay(data);
  });
  $('#start-process-button').click(parseReplays);
  $('#stop-process-button').click(stopParse);
  $('#rescan-replays-button').click(startReplayScan);
  $('#replay-file-start').datepicker();
  $('#replay-file-start').datepicker('setDate', date);

  // initial settings
  let path = settings.get('dbPath');
  $('#settings-set-db-folder input').val(path);

  let replayPath = settings.get('replayPath');
  $('#settings-set-replay-folder input').val(replayPath);

  // load the directory
  startReplayScan();
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
    DB.insertReplay(data.match, data.players);
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