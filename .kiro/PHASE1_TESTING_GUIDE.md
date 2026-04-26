# Phase 1 Testing Guide

## Quick Start Testing

### Test 1: Save Your First Project
1. Open mokha-suite PRO Vqr.html
2. Go through the Story Blueprint wizard (7 steps)
3. Click "Pro Script Builder" to open the builder
4. Click the **Save** button (or press Ctrl+S)
5. Enter a project title (e.g., "My First Story")
6. Enter an author name (e.g., "Your Name")
7. Click "Save Project"
8. **Expected**: Green success message "✓ Project saved successfully"

### Test 2: Open Your Saved Project
1. Click the **Open** button (or press Ctrl+O)
2. **Expected**: Project Library modal opens showing your saved project
3. Click on your project card
4. **Expected**: 
   - Green success message "✓ Project loaded successfully"
   - Project Library closes
   - Script content is restored
   - Characters are available in dialogue dropdown
   - Character arcs are restored

### Test 3: Save Multiple Projects
1. Create a new story (go back to wizard, create different story)
2. Open Pro Script Builder
3. Save with different title (e.g., "My Second Story")
4. Click Open button
5. **Expected**: Both projects appear in library

### Test 4: Search and Sort
1. Click Open button
2. Type in search box (search by title or author)
3. **Expected**: Projects filter in real-time
4. Try different sort options:
   - "Last Modified" - Most recent first
   - "Title (A-Z)" - Alphabetical order
   - "Date Created" - By creation date
5. **Expected**: Projects reorder correctly

### Test 5: Export Project
1. Click Open button
2. Find a project
3. Click "Export" button on project card
4. **Expected**: JSON file downloads (e.g., "My First Story-backup.json")

### Test 6: Import Project
1. Click Open button
2. Click "Import" button
3. Select a previously exported JSON file
4. **Expected**: 
   - Success message "Project imported successfully!"
   - Project appears in library with "(Imported)" suffix

### Test 7: Delete Project
1. Click Open button
2. Find a project
3. Click trash icon on project card
4. **Expected**: Confirmation dialog appears
5. Click "OK" to confirm
6. **Expected**: Project removed from library

### Test 8: Storage Usage
1. Click Open button
2. Look at bottom of header
3. **Expected**: Shows "X projects" and "Y KB / Z KB used (P%)"
4. If usage > 80%: **Expected**: Warning message appears

### Test 9: Keyboard Shortcuts
1. In Pro Script Builder, press **Ctrl+S** (or **Cmd+S** on Mac)
2. **Expected**: Save dialog appears
3. Press **Escape** to close
4. Press **Ctrl+O** (or **Cmd+O** on Mac)
5. **Expected**: Project Library opens

### Test 10: Data Persistence
1. Save a project with some script content
2. Add a character in Step 7
3. Create a character arc
4. Save the project
5. Refresh the page (F5)
6. Open the project
7. **Expected**: All data is restored:
   - Script content
   - Characters
   - Character arcs
   - All metadata

---

## Advanced Testing

### Test 11: Large Project
1. Create a project with many scenes and shots
2. Add lots of dialogue and action
3. Save the project
4. **Expected**: Saves successfully (may take a moment)
5. Check storage usage
6. **Expected**: Shows increased KB usage

### Test 12: Special Characters
1. Save a project with title containing special characters (e.g., "My Story: Part 1 & 2")
2. **Expected**: Saves successfully
3. Open project library
4. **Expected**: Title displays correctly

### Test 13: Empty Project
1. Create a new story
2. Don't add any script content
3. Save the project
4. **Expected**: Saves successfully
5. Open project library
6. **Expected**: Shows "0 pages" and "0 words"

### Test 14: Duplicate Save
1. Save a project
2. Make some changes to the script
3. Click Save button again
4. **Expected**: 
   - No save dialog appears
   - Project updates (not duplicated)
   - Success message appears

### Test 15: Browser Storage Limit
1. Save many large projects until storage is nearly full
2. Try to save another project
3. **Expected**: 
   - If storage full: Error message "Storage quota exceeded"
   - If storage > 80%: Warning message appears

---

## Troubleshooting

### Issue: Save button doesn't work
- **Check**: Is the project title empty? (Title is required)
- **Check**: Is localStorage enabled in browser?
- **Check**: Is browser storage full?

### Issue: Project doesn't load
- **Check**: Is the project ID valid?
- **Check**: Has localStorage been cleared?
- **Check**: Is the browser in private/incognito mode? (localStorage may be disabled)

### Issue: Import fails
- **Check**: Is the JSON file valid? (Should be exported from this app)
- **Check**: Does the file contain `blueprint` and `script` properties?
- **Check**: Is the file corrupted?

### Issue: Storage warning appears
- **Solution**: Delete old projects or export them as JSON backups
- **Solution**: Clear browser cache and localStorage
- **Solution**: Use a different browser with more storage

---

## Browser DevTools Inspection

### Check localStorage
1. Open browser DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage"
4. Find "mokha_story_projects"
5. **Expected**: Shows JSON array of all saved projects

### Check Console
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Type: `localStorage.getItem('mokha_story_projects')`
4. **Expected**: Shows JSON array of projects

### Clear localStorage
1. Open browser DevTools (F12)
2. Go to "Application" tab
3. Right-click "Local Storage"
4. Click "Clear All"
5. **Expected**: All projects deleted

---

## Performance Testing

### Test: Save Speed
1. Create a project with 10+ scenes
2. Add lots of dialogue and action
3. Click Save
4. **Expected**: Saves within 1-2 seconds

### Test: Load Speed
1. Open project library
2. Click on a large project
3. **Expected**: Loads within 1-2 seconds

### Test: Search Speed
1. Have 10+ projects saved
2. Type in search box
3. **Expected**: Filters in real-time (no lag)

### Test: Sort Speed
1. Have 10+ projects saved
2. Click different sort options
3. **Expected**: Sorts instantly

---

## Success Indicators ✅

Phase 1 is working correctly when:
- ✅ Projects save and load successfully
- ✅ All data persists (script, characters, arcs)
- ✅ Search and sort work correctly
- ✅ Export/import works
- ✅ Delete works with confirmation
- ✅ Storage usage is displayed
- ✅ Keyboard shortcuts work
- ✅ Error messages are helpful
- ✅ No console errors
- ✅ Responsive on mobile

---

## Reporting Issues

If you find any issues:
1. Note the exact steps to reproduce
2. Check browser console for errors (F12)
3. Check localStorage contents (DevTools > Application > Local Storage)
4. Include browser name and version
5. Include any error messages

---

## Next Phase

Once Phase 1 testing is complete and all tests pass, proceed to:
**Phase 2: Story Output Panel** - Real-time formatted preview with character highlighting

