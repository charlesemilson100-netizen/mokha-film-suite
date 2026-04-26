# MOKHA FILM Suite - Build Checklist

## Pre-Build Checklist

### Environment Setup
- [ ] Node.js installed (v14 or higher)
  - Verify: `node --version`
- [ ] npm installed
  - Verify: `npm --version`
- [ ] Git installed (optional)
  - Verify: `git --version`

### Project Setup
- [ ] Dependencies installed
  - Run: `npm install`
- [ ] Main app file copied
  - Run: `cp "mokha-suite PRO Vqr.html" mokha-suite-pro.html`
- [ ] File exists in project root
  - Check: `ls mokha-suite-pro.html`

### Icons (Optional but Recommended)
- [ ] `assets/` directory created
- [ ] `assets/icon.png` added (512x512)
- [ ] `assets/icon.ico` added (Windows)
- [ ] `assets/icon.icns` added (macOS)

### Configuration
- [ ] App name correct in `package.json`
- [ ] Version number correct
- [ ] App ID correct
- [ ] Window size appropriate

## Development Testing

### Before Building
- [ ] Run development mode: `npm run electron-dev`
- [ ] App loads successfully
- [ ] All features work
- [ ] No console errors
- [ ] localStorage works
- [ ] Context menus work (Phases 1-2)
- [ ] No memory leaks
- [ ] Performance acceptable

### Test Features
- [ ] Create new project
- [ ] Add scenes and shots
- [ ] Edit dialogue
- [ ] Right-click context menus
- [ ] Save/load functionality
- [ ] Export features
- [ ] All UI elements responsive

## Build Checklist

### Windows Build
- [ ] Run: `npm run build-win`
- [ ] Check `dist/` for installers
- [ ] Verify NSIS installer created
- [ ] Verify portable EXE created
- [ ] Test installer on Windows machine
- [ ] Test portable version
- [ ] Verify uninstaller works

### macOS Build
- [ ] Run: `npm run build-mac`
- [ ] Check `dist/` for installers
- [ ] Verify DMG created
- [ ] Verify ZIP created
- [ ] Test DMG on macOS machine
- [ ] Verify app signature (if applicable)

### Linux Build
- [ ] Run: `npm run build-linux`
- [ ] Check `dist/` for installers
- [ ] Verify AppImage created
- [ ] Verify DEB created
- [ ] Test AppImage on Linux
- [ ] Test DEB installation

### All Platforms
- [ ] Run: `npm run build-all`
- [ ] All installers created successfully
- [ ] No build errors
- [ ] File sizes reasonable
- [ ] All files in `dist/` directory

## Post-Build Testing

### Installer Testing
- [ ] Install on clean machine
- [ ] App launches successfully
- [ ] All features work
- [ ] Data persists
- [ ] Uninstall works cleanly
- [ ] No leftover files

### Functionality Testing
- [ ] Create new project
- [ ] Save project
- [ ] Load project
- [ ] Export functionality
- [ ] Context menus work
- [ ] Keyboard shortcuts work
- [ ] Dark/light theme works
- [ ] Multi-language support works

### Performance Testing
- [ ] App starts quickly
- [ ] No lag during use
- [ ] Memory usage reasonable
- [ ] CPU usage reasonable
- [ ] Smooth animations
- [ ] No crashes

## Distribution Checklist

### Before Distribution
- [ ] All tests passed
- [ ] No known bugs
- [ ] Documentation updated
- [ ] Version number incremented
- [ ] Release notes prepared
- [ ] Changelog updated

### Distribution
- [ ] Upload installers to server
- [ ] Create download page
- [ ] Add installation instructions
- [ ] Add system requirements
- [ ] Add troubleshooting guide
- [ ] Announce release

### Post-Distribution
- [ ] Monitor for issues
- [ ] Collect user feedback
- [ ] Track downloads
- [ ] Plan next release
- [ ] Document lessons learned

## Troubleshooting Checklist

### If Build Fails
- [ ] Check Node.js version: `node --version`
- [ ] Clear cache: `rm -rf node_modules && npm install`
- [ ] Check disk space
- [ ] Verify icons exist
- [ ] Check for typos in package.json
- [ ] Try building React only: `npm run react-build`

### If App Won't Start
- [ ] Check mokha-suite-pro.html exists
- [ ] Check console for errors
- [ ] Verify file permissions
- [ ] Try development mode: `npm run electron-dev`
- [ ] Check for missing dependencies

### If Installer Won't Install
- [ ] Check system requirements
- [ ] Verify installer integrity
- [ ] Try running as administrator (Windows)
- [ ] Check antivirus software
- [ ] Try portable version

## Version Control Checklist

### Before Commit
- [ ] All tests pass
- [ ] No console errors
- [ ] Code formatted properly
- [ ] Comments added where needed
- [ ] No debug code left

### Commit Message
- [ ] Clear description
- [ ] References issue number (if applicable)
- [ ] Mentions breaking changes (if any)

### Release
- [ ] Tag version: `git tag v2.0.0`
- [ ] Push to repository
- [ ] Create release notes
- [ ] Upload installers

## Final Verification

- [ ] All platforms build successfully
- [ ] All installers work
- [ ] All features tested
- [ ] Documentation complete
- [ ] Ready for distribution

---

## Quick Commands Reference

```bash
# Setup
npm install

# Development
npm run electron-dev

# Building
npm run build              # Current platform
npm run build-win          # Windows
npm run build-mac          # macOS
npm run build-linux        # Linux
npm run build-all          # All platforms

# Cleaning
rm -rf dist build node_modules
npm install
```

---

**Last Updated**: 2026-04-26
**Version**: 2.0.0
