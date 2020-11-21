const { app, BrowserWindow } = require('electron');
require('electron-reload')(__dirname);
require('./index');

function createWindow() {
  window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  window.loadURL('http://localhost:5000');
  window.maximize();
  //window.webContents.openDevTools()
  window.on('close', (event) => {
    window = null;
  });
}

app.on('ready', createWindow);
