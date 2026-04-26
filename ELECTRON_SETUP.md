# MOKHA FILM Suite - Electron Installer Setup

## Overview

This guide explains how to set up and build the Electron installer for MOKHA FILM Suite.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- React and React DOM
- Electron
- Electron Builder
- Concurrently (for running React and Electron together)
- Wait-on (for waiting for React dev server)

### 2. Project Structure

```
mokha-film-suite/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Security preload script
├── public/
│   └── index.html       # React HTML template
├── src/
│   ├── index.js         # React entry point
│   ├── App.js           # Main React component
│   └── App.css          # App styles
├── assets/
│   ├── icon.ico         # Windows icon
│   ├── icon.icns        # macOS icon
│   └── icon.png         # Linux icon
├── package.json         # Project configuration
└── mokha-suite-pro.html # Main app HTML (copy from workspace)
```

### 3. Copy the Main App File

Copy `mokha-suite PRO Vqr.html` from the workspace to the project root and rename it:

```bash
cp "mokha-suite PRO Vqr.html" mokha-suite-pro.html
```

### 4. Add Application Icons

Create an `assets/` directory and add icons:

- **Windows**: `assets/icon.ico` (256x256 or larger)
- **macOS**: `assets/icon.icns` (512x512)
- **Linux**: `assets/icon.png` (512x512)

You can use online tools to convert PNG to ICO/ICNS formats.

## Development

### Run in Development Mode

```bash
npm run electron-dev
```

This will:
1. Start the React development server on http://localhost:3000
2. Wait for the server to be ready
3. Launch Electron with DevTools open

### Hot Reload

Changes to React files will automatically reload in the Electron window.

## Building

### Build for Current Platform

```bash
npm run build
```

### Build for Specific Platforms

```bash
# Windows
npm run build-win

# macOS
npm run build-mac

# Linux
npm run build-linux

# All platforms
npm run build-all
```

### Output

Built installers will be in the `dist/` directory:

- **Windows**: 
  - `MOKHA FILM Suite Setup 2.0.0.exe` (NSIS installer)
  - `MOKHA FILM Suite 2.0.0.exe` (Portable)

- **macOS**: 
  - `MOKHA FILM Suite-2.0.0.dmg` (DMG installer)
  - `MOKHA FILM Suite-2.0.0.zip` (ZIP archive)

- **Linux**: 
  - `mokha-film-suite-2.0.0.AppImage` (AppImage)
  - `mokha-film-suite_2.0.0_amd64.deb` (Debian package)

## Configuration

### Customize in package.json

```json
{
  "build": {
    "appId": "com.mokha.filmsuit",
    "productName": "MOKHA FILM Suite",
    "version": "2.0.0"
  }
}
```

### Customize in electron/main.js

- Window size: `width: 1920, height: 1080`
- Minimum size: `minWidth: 1024, minHeight: 768`
- DevTools: Open in development mode

## Security Features

### Preload Script (electron/preload.js)

- Context isolation enabled
- Node integration disabled
- Sandbox enabled
- Safe API exposure via `window.electronAPI`

### Main Process (electron/main.js)

- Secure IPC handlers
- Navigation restrictions
- New window prevention
- Error handling

## Troubleshooting

### App won't start

1. Check that `mokha-suite-pro.html` exists in the project root
2. Verify Node.js is installed: `node --version`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Build fails

1. Ensure icons are in `assets/` directory
2. Check that all dependencies are installed
3. Try clearing the build cache: `rm -rf dist build`

### Electron won't open DevTools

- DevTools only open in development mode
- Run with `npm run electron-dev` instead of `npm run electron-start`

## Distribution

### Windows

Users can install via:
- NSIS installer (recommended for most users)
- Portable EXE (no installation required)

### macOS

Users can install via:
- DMG installer (drag and drop)
- ZIP archive (manual installation)

### Linux

Users can install via:
- AppImage (no installation required)
- Debian package (`sudo dpkg -i mokha-film-suite_2.0.0_amd64.deb`)

## Updates

To enable auto-updates in the future:

1. Set up an update server
2. Configure electron-updater in main.js
3. Implement update checking and installation

## Support

For issues or questions:
1. Check the Electron documentation: https://www.electronjs.org/docs
2. Review the electron-builder docs: https://www.electron.build/
3. Check the troubleshooting section above

## Next Steps

1. Add application icons to `assets/` directory
2. Run `npm install` to install dependencies
3. Run `npm run electron-dev` to test in development
4. Run `npm run build` to create installers
5. Distribute the installers from the `dist/` directory

---

**Version**: 2.0.0
**Last Updated**: 2026-04-26
