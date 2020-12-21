const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

autoUpdater.on('checking-for-update', function () {
  win.webContents.send('updateStatus', 'Checking for Update...');
});
autoUpdater.on('update-available', function () {
  win.webContents.send('updateNotify', 'Update Available');
});
autoUpdater.on('update-downloaded', function (info) {
  win.webContents.send('updateReady', 'Restart to Install Update');
});

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1920,
    defaultHeight: 1080,
  });

  // Create the window using the state information
  win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    frame: false,
    backgroundColor: '#1b1c1d',
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
    },
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(win);

  // and load the index.html of the app.
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    }),
  );

  // Open the DevTools.
  // REMEMBER TO COMMENT THIS OUT FOR RELEASES
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;

    // attempt to close all windows when main closes so the app quits
    let allWindows = BrowserWindow.getAllWindows();
    for (let w in allWindows) {
      allWindows[w].close();
    }
  });

  autoUpdater.checkForUpdatesAndNotify();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
