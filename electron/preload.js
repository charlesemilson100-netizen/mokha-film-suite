const { contextBridge, ipcRenderer } = require('electron');

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
  onFileOpen: (callback) => ipcRenderer.on('file-open', (_event, ...args) => callback(...args)),
  onAppUpdate: (callback) => ipcRenderer.on('app-update', (_event, ...args) => callback(...args)),

  // Auto-updater
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, message) => callback(message)),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
});
