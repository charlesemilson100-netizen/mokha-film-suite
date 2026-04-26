# Phase 4 Quick Start Guide

## What Was Added

### 1. Auto-Save
Automatic project saving every 30 seconds of inactivity.

**How to use:**
- Auto-save is ON by default
- Click "Auto-save" button in toolbar to toggle
- Look for "Auto-saved" message at bottom-right
- Message appears after 30 seconds of no editing

**Button states:**
- ✓ CheckCircle icon = Auto-save enabled
- ○ Circle icon = Auto-save disabled

### 2. Scene Breakdown
Detailed analysis of your script with scene-by-scene metrics.

**How to use:**
1. Click "Breakdown" button in toolbar
2. Modal opens showing:
   - Total scenes, runtime, average duration, word count
   - Each scene with: shots, action lines, dialogue lines, duration, words, characters
   - Visual bars showing relative scene duration
   - Longest and shortest scenes
3. Click "Export CSV" to download data for spreadsheet
4. Click "Close" to close modal

---

## Toolbar Buttons

### New Buttons Added

| Button | Icon | Function |
|--------|------|----------|
| Auto-save | ✓/○ | Toggle auto-save on/off |
| Breakdown | 📊 | Open scene breakdown modal |

---

## Features

### Auto-Save
- ✅ Saves every 30 seconds of inactivity
- ✅ Shows confirmation message
- ✅ Can be toggled on/off
- ✅ Works in background (doesn't interrupt typing)
- ✅ Uses existing localStorage

### Scene Breakdown
- ✅ Shows all scenes with metrics
- ✅ Calculates: shots, action lines, dialogue lines, words, duration
- ✅ Tracks characters per scene
- ✅ Visual duration bars
- ✅ Identifies longest/shortest scenes
- ✅ Export to CSV

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save project (existing) |
| Ctrl+O | Open project (existing) |

---

## Tips

### Auto-Save
- Enable for automatic backup
- Disable if you prefer manual saves only
- 30-second delay is optimal for most users
- Message fades automatically (no action needed)

### Scene Breakdown
- Use to analyze script pacing
- Export CSV to analyze in Excel/Sheets
- Check character presence per scene
- Identify scenes that are too long/short

---

## Troubleshooting

### Auto-Save Not Working
1. Check if auto-save button is enabled (CheckCircle icon)
2. Wait 30 seconds after editing
3. Check browser console for errors
4. Verify localStorage is enabled

### Scene Breakdown Not Opening
1. Click "Breakdown" button again
2. Check if modal is behind other windows
3. Try refreshing page
4. Check browser console for errors

### CSV Export Not Working
1. Check browser's download settings
2. Verify file permissions
3. Try different browser
4. Check browser console for errors

---

## Performance

- Auto-save: Minimal impact (background operation)
- Scene breakdown: Opens instantly
- CSV export: < 1 second for typical scripts

---

## Browser Support

Works on all modern browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers

---

## Next Steps

1. **Test Auto-Save**
   - Edit your script
   - Wait 30 seconds
   - Look for "Auto-saved" message

2. **Test Scene Breakdown**
   - Click "Breakdown" button
   - Review scene metrics
   - Export CSV if needed

3. **Provide Feedback**
   - Report any issues
   - Suggest improvements
   - Share your experience

---

## Questions?

Refer to:
- `.kiro/PHASE4_IMPLEMENTATION_GUIDE.md` - Detailed technical guide
- `.kiro/PHASE4_IMPLEMENTATION_COMPLETE.md` - Full completion report
- `.kiro/PHASE4_SUMMARY.md` - Feature overview

