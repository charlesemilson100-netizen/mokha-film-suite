const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  loadFile: (filePath) => ipcRenderer.invoke('load-file', filePath),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // System info
  getPlatform: () => process.platform,
  getArch: () => process.arch,
  
  // Listeners
  onFileOpen: (callback) => ipcRenderer.on('file-open', callback),
  onAppUpdate: (callback) => ipcRenderer.on('app-update', callback)
});

// Disable navigation to external sites
window.addEventListener('will-navigate', (event) => {
  const url = new URL(event.url);
  if (url.origin !== 'http://localhost:3000' && !url.protocol.startsWith('file')) {
    event.preventDefault();
  }
});

// Handle any new window requests
window.addEventListener('new-window', (event) => {
  event.preventDefault();
});
