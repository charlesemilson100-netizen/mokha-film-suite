# MOKHA FILM Suite - Auto-Update Setup Guide

## 🆓 100% FREE Auto-Update System

### What You'll Get:
- ✅ Automatic update checks on app startup
- ✅ In-app notification when updates available
- ✅ One-click download and install
- ✅ Hosted on GitHub (free, unlimited)
- ✅ Professional update system (used by VS Code, Slack, etc.)

---

## Step 1: Install electron-updater

```bash
npm install electron-updater --save
```

---

## Step 2: Update package.json

Add this to your `package.json`:

```json
{
  "name": "mokha-film-suite",
  "version": "2.11.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/mokha-film-suite.git"
  },
  "build": {
    "appId": "com.mokha.filmsuit",
    "productName": "MOKHA FILM Suite",
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR_USERNAME",
        "repo": "mokha-film-suite"
      }
    ]
  }
}
```

---

## Step 3: Update electron/main.js

Add auto-updater code:

```javascript
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let splashWindow;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  mainWindow.webContents.send('update-error', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('download-progress', progressObj);
});

// Check for updates when app is ready
app.on('ready', () => {
  createSplash();
  setTimeout(() => {
    createWindow();
  }, 100);
  
  // Check for updates (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000); // Wait 3 seconds after app starts
  }
});

// IPC handlers for update actions
ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});
```

---

## Step 4: Add Update UI to Your App

Add this notification component to your HTML:

```javascript
// Listen for update events from Electron
if (window.require) {
  const { ipcRenderer } = window.require('electron');
  
  // Update available
  ipcRenderer.on('update-available', (event, info) => {
    showUpdateNotification(info);
  });
  
  // Update downloaded
  ipcRenderer.on('update-downloaded', (event, info) => {
    showInstallNotification(info);
  });
  
  // Download progress
  ipcRenderer.on('download-progress', (event, progress) => {
    updateDownloadProgress(progress);
  });
}

function showUpdateNotification(info) {
  // Show toast notification
  const toast = document.createElement('div');
  toast.className = 'update-toast';
  toast.innerHTML = `
    <div class="update-content">
      <h3>🎉 Update Available!</h3>
      <p>Version ${info.version} is ready to download</p>
      <div class="update-actions">
        <button onclick="downloadUpdate()">Download Now</button>
        <button onclick="dismissUpdate()">Later</button>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
}

function downloadUpdate() {
  if (window.require) {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('download-update');
  }
}

function showInstallNotification(info) {
  const toast = document.createElement('div');
  toast.className = 'update-toast';
  toast.innerHTML = `
    <div class="update-content">
      <h3>✅ Update Downloaded!</h3>
      <p>Restart to install version ${info.version}</p>
      <div class="update-actions">
        <button onclick="installUpdate()">Restart Now</button>
        <button onclick="dismissUpdate()">Later</button>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
}

function installUpdate() {
  if (window.require) {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('install-update');
  }
}
```

---

## Step 5: Create GitHub Repository

1. Go to https://github.com
2. Click "New Repository"
3. Name it: `mokha-film-suite`
4. Make it Public (required for free releases)
5. Create repository

---

## Step 6: Generate GitHub Token

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Click "Generate new token (classic)"
3. Name it: "MOKHA Release Token"
4. Check: `repo` (all permissions)
5. Generate and SAVE the token

---

## Step 7: Set Environment Variable

**Windows:**
```bash
setx GH_TOKEN "your_github_token_here"
```

**Restart your terminal after this!**

---

## Step 8: Build and Publish

```bash
# Build and publish to GitHub
npm run build-win

# Then publish the release
npx electron-builder --win --publish always
```

This will:
1. Build your installer
2. Create a GitHub Release
3. Upload the installer
4. Users will get notified automatically!

---

## Step 9: Future Updates

When you want to release a new version:

1. Update version in `package.json`:
   ```json
   "version": "2.12.0"
   ```

2. Build and publish:
   ```bash
   npm run build-win
   npx electron-builder --win --publish always
   ```

3. Done! All users will get notified automatically.

---

## 💰 Cost Breakdown

| Service | Cost | What You Get |
|---------|------|--------------|
| GitHub Releases | FREE | Unlimited releases, unlimited downloads |
| electron-updater | FREE | Auto-update system |
| Bandwidth | FREE | Unlimited (GitHub CDN) |
| Storage | FREE | Unlimited releases |
| **TOTAL** | **$0/month** | Everything you need! |

---

## 🎯 Alternative: Manual Update Check

If you don't want GitHub, you can host a simple JSON file anywhere:

**version.json** (host on any free hosting):
```json
{
  "version": "2.12.0",
  "url": "https://yoursite.com/MOKHA-Setup-2.12.0.exe",
  "releaseNotes": "New features: AI Model Marketplace, Prompt Translator"
}
```

Then check it in your app:
```javascript
fetch('https://yoursite.com/version.json')
  .then(r => r.json())
  .then(data => {
    if (data.version > currentVersion) {
      showUpdateNotification(data);
    }
  });
```

---

## 📝 Summary

**Best Option:** GitHub Releases + electron-updater
- ✅ 100% FREE
- ✅ Professional
- ✅ Automatic
- ✅ Reliable
- ✅ Used by major apps

**Setup Time:** 30 minutes
**Monthly Cost:** $0

---

**Ready to set this up?** I can help you implement it step by step!
