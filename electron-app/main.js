const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 4317;
let serverProcess;
let mainWindow;

const logPath = path.join(app.getPath('userData'), 'sunucu-log.txt');
function logYaz(msg) {
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

function standaloneYolu() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'standalone', 'server.js')
    : path.join(__dirname, 'standalone', 'server.js');
}

function sunucuyuBaslat() {
  const yol = standaloneYolu();
  logYaz(`baslatiliyor: ${yol}, exists=${fs.existsSync(yol)}, execPath=${process.execPath}`);
  serverProcess = spawn(process.execPath, [yol], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProcess.stdout.on('data', (d) => logYaz(`[stdout] ${d.toString().trim()}`));
  serverProcess.stderr.on('data', (d) => logYaz(`[stderr] ${d.toString().trim()}`));
  serverProcess.on('error', (err) => logYaz(`[spawn-error] ${err.message}`));
  serverProcess.on('exit', (code, signal) => logYaz(`[exit] code=${code} signal=${signal}`));
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);
}

function renderereGonder(veri) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('guncelleme-durumu', veri);
  }
}

function guncellemeleriKontrolEt() {
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates().catch((err) => logYaz(`[guncelleme-hata] ${err.message}`));
}

autoUpdater.on('update-available', (bilgi) => {
  logYaz(`[guncelleme] bulundu: ${bilgi.version}`);
  renderereGonder({ tip: 'mevcut', versiyon: bilgi.version });
});

autoUpdater.on('download-progress', (ilerleme) => {
  renderereGonder({ tip: 'ilerleme', yuzde: Math.round(ilerleme.percent) });
});

autoUpdater.on('update-downloaded', (bilgi) => {
  logYaz(`[guncelleme] indirildi: ${bilgi.version}`);
  renderereGonder({ tip: 'hazir', versiyon: bilgi.version });
});

autoUpdater.on('error', (err) => {
  logYaz(`[guncelleme-hata] ${err.message}`);
  renderereGonder({ tip: 'hata', mesaj: err.message });
});

ipcMain.on('guncelleme-indir', () => autoUpdater.downloadUpdate());
ipcMain.on('guncelleme-kur', () => autoUpdater.quitAndInstall());

app.whenReady().then(() => {
  sunucuyuBaslat();
  sunucuHazirMi(() => {
    pencereyiAc();
    guncellemeleriKontrolEt();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
