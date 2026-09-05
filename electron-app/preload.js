const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  guncellemeyiIndir: () => ipcRenderer.send('guncelleme-indir'),
  guncellemeyiKur: () => ipcRenderer.send('guncelleme-kur'),
  guncellemeDurumuDinle: (callback) => {
    const kanal = (_event, veri) => callback(veri);
    ipcRenderer.on('guncelleme-durumu', kanal);
    return () => ipcRenderer.removeListener('guncelleme-durumu', kanal);
  },
});
