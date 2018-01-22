var settingsRowTemplate;

// used by the parser
var listedReplays;

function initSettingsPage() {
  // templates
  settingsRowTemplate = Handlebars.compile(getTemplate('settings', '#replay-row-template').find('tr')[0].outerHTML);

  // handlers
  $('#replay-file-list').stickyTableHeaders({scrollableArea: $('.settings-table-wrapper')})
  $('#settings-set-replay-folder button').click(setReplayFolder);

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
        context.id = i;
        replays.push(context);
        count += 1;
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
    }
    listedReplays = replays;

    console.log('Found ' + count + ' replays ')
  });
}

function parseReplays() {
  // takes the listed replays and parses them
  // or at least it'll attempt to
}