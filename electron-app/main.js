const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 4317;
let serverProcess;
let mainWindow;

function standaloneYolu() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'standalone', 'server.js')
    : path.join(__dirname, 'standalone', 'server.js');
}

function sunucuyuBaslat() {
  serverProcess = spawn(process.execPath, [standaloneYolu()], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'ignore',
  });
}

function sunucuHazirMi(callback, deneme = 0) {
  const istek = http
    .get(`http://127.0.0.1:${PORT}/`, () => callback())
    .on('error', () => {
      if (deneme > 100) return;
      setTimeout(() => sunucuHazirMi(callback, deneme + 1), 300);
    });
  istek.setTimeout(2000, () => istek.destroy());
}

function pencereyiAc() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'icon.ico'),
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);
}

app.whenReady().then(() => {
  sunucuyuBaslat();
  sunucuHazirMi(pencereyiAc);
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
