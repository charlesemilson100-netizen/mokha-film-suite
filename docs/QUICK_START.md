# MOKHA FILM Suite - Quick Start Guide

## 🚀 Getting Started with Electron Installer

### Step 1: Prepare Your Environment

```bash
# Install Node.js from https://nodejs.org/ (v14 or higher)
# Verify installation
node --version
npm --version
```

### Step 2: Set Up the Project

```bash
# Clone or navigate to the project directory
cd mokha-film-suite

# Install all dependencies
npm install
```

### Step 3: Copy the Main App File

```bash
# Copy the main HTML file to the project root
cp "mokha-suite PRO Vqr.html" mokha-suite-pro.html
```

### Step 4: Add Icons (Optional but Recommended)

Create an `assets/` folder and add:
- `icon.png` (512x512 pixels)
- Convert to `icon.ico` (Windows) and `icon.icns` (macOS) using online tools

### Step 5: Run in Development

```bash
# Start development mode with hot reload
npm run electron-dev
```

The app will open in an Electron window with DevTools.

### Step 6: Build Installers

```bash
# Build for your current platform
npm run build

# Or build for specific platforms
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
npm run build-all    # All platforms
```

Installers will be created in the `dist/` directory.

## 📦 What You Get

### Windows
- **MOKHA FILM Suite Setup 2.0.0.exe** - Full installer with uninstaller
- **MOKHA FILM Suite 2.0.0.exe** - Portable version (no installation)

### macOS
- **MOKHA FILM Suite-2.0.0.dmg** - Drag-and-drop installer
- **MOKHA FILM Suite-2.0.0.zip** - ZIP archive

### Linux
- **mokha-film-suite-2.0.0.AppImage** - Universal Linux app
- **mokha-film-suite_2.0.0_amd64.deb** - Debian/Ubuntu package

## 🎯 Common Commands

```bash
# Development
npm run electron-dev      # Run with hot reload
npm run react-start       # React dev server only
npm run electron-start    # Electron only

# Building
npm run build             # Build for current platform
npm run build-all         # Build for all platforms
npm run dist              # Alias for build

# Cleaning
rm -rf dist build         # Clean build artifacts
rm -rf node_modules       # Clean dependencies
npm install               # Reinstall dependencies
```

## 🔧 Customization

### Change App Name

Edit `package.json`:
```json
{
  "name": "your-app-name",
  "build": {
    "productName": "Your App Name"
  }
}
```

### Change Window Size

Edit `electron/main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1920,      // Change width
  height: 1080,     // Change height
  minWidth: 1024,   // Minimum width
  minHeight: 768    // Minimum height
});
```

### Change App Version

Edit `package.json`:
```json
{
  "version": "2.0.0"  // Update version
}
```

## 🐛 Troubleshooting

### "Cannot find module 'electron'"
```bash
npm install electron --save-dev
```

### "mokha-suite-pro.html not found"
```bash
# Make sure the file is in the project root
cp "mokha-suite PRO Vqr.html" mokha-suite-pro.html
```

### App won't start
1. Check Node.js version: `node --version` (should be v14+)
2. Clear cache: `rm -rf node_modules && npm install`
3. Check for errors in console

### Build fails
1. Ensure icons are in `assets/` directory
2. Check disk space (builds can be large)
3. Try: `npm run react-build` first to test React build

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)

## 🎉 You're Ready!

Your MOKHA FILM Suite is now packaged as a professional desktop application!

### Next Steps:
1. Test the app thoroughly
2. Distribute installers to users
3. Collect feedback
4. Plan updates

---

**Need Help?** Check `ELECTRON_SETUP.md` for detailed instructions.
