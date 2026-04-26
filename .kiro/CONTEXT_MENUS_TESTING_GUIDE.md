# Context Menus Expansion - Testing & Verification Guide

## Overview

This guide provides step-by-step instructions to test and verify all 11 context menu types in MOKHA FILM Suite PRO. The feature is fully implemented and ready for browser testing.

---

## Pre-Test Setup

### 1. Open the Application
- Open `mokha-suite PRO Vqr.html` in a modern browser (Chrome, Edge, Firefox, Safari)
- Create a test project with at least 2 scenes
- Add 3-5 shots to the first scene
- Add 2-3 shots to the second scene
- Add some shots to favorites
- Create some shot history by editing shots

### 2. Browser DevTools
- Open DevTools (F12 or Cmd+Option+I)
- Go to Console tab
- Watch for any errors during testing
- Note: No errors should appear when using context menus

---

## Test Cases

### TEST 1: Shot Card Context Menu ✅

**Location:** Right-click on any shot card in the main editor

**Expected Menu Items:**
- [ ] Edit Shot
- [ ] Duplicate
- [ ] Insert Above
- [ ] Insert Below
- [ ] Switch to Video/Image Mode
- [ ] Add/Remove from Favorites
- [ ] Move to Scene (submenu with other scenes)
- [ ] Send to Project (submenu with other projects)
- [ ] Apply Director Style (submenu with 12 directors)
- [ ] Color Tag (submenu with 6 colors + remove)
- [ ] Mutate Shot
- [ ] View History
- [ ] Lock/Unlock Shot
- [ ] Copy Prompt
- [ ] Send to MOKHA Agent
- [ ] Copy Shotified Prompt
- [ ] Copy Shot
- [ ] Delete Shot

**Test Steps:**
1. Right-click on a shot card
2. Verify menu appears at cursor position
3. Verify all items are visible
4. Click "Duplicate" → verify new shot appears below original
5. Click "Lock Shot" → verify shot shows locked badge
6. Click "Unlock Shot" → verify locked badge disappears
7. Click "Copy Prompt" → verify toast shows "Prompt copied ✓"
8. Hover over "Move to Scene" → verify submenu appears with other scenes
9. Click a scene in submenu → verify shot moves to that scene
10. Hover over "Apply Director Style" → verify submenu with directors
11. Click a director → verify shot parameters change
12. Click outside menu → verify menu closes
13. Press Escape → verify menu closes

**Disabled Item Tests:**
- [ ] Lock a shot, then right-click → "Delete Shot" should be disabled (grayed out)
- [ ] Lock a shot, then right-click → "Edit Shot" should be disabled
- [ ] Lock a shot, then right-click → "Duplicate" should be disabled

**Pass Criteria:** ✅ All items visible, all actions work, disabled items properly grayed out

---

### TEST 2: Scene Tab Context Menu ✅

**Location:** Right-click on a scene tab at the top

**Expected Menu Items:**
- [ ] Rename Scene
- [ ] Duplicate Scene
- [ ] Add Scene After
- [ ] Move Scene Left
- [ ] Move Scene Right
- [ ] Apply Director Style to All Shots (submenu)
- [ ] Copy All Prompts
- [ ] Export Scene as PDF
- [ ] Clear All Shots
- [ ] Delete Scene

**Test Steps:**
1. Right-click on a scene tab
2. Verify menu appears
3. Click "Rename Scene" → enter new name → verify tab name changes
4. Click "Duplicate Scene" → verify new scene appears with all shots
5. Click "Move Scene Left" → verify scene moves left in tab order
6. Click "Move Scene Right" → verify scene moves right in tab order
7. Hover over "Apply Director Style to All Shots" → verify submenu
8. Click a director → verify all shots in scene get that style
9. Click "Copy All Prompts" → verify toast shows success
10. Click "Clear All Shots" → confirm dialog → verify all shots removed
11. Click "Delete Scene" → verify scene is removed

**Boundary Tests:**
- [ ] Right-click first scene → "Move Scene Left" should be disabled
- [ ] Right-click last scene → "Move Scene Right" should be disabled
- [ ] Create scene with 0 shots → right-click → bulk actions should be disabled

**Pass Criteria:** ✅ All items work, boundary checks work, disabled items grayed out

---

### TEST 3: Project Tab Context Menu ✅

**Location:** Right-click on a project entry in the project list

**Expected Menu Items:**
- [ ] Rename Project
- [ ] Duplicate Project
- [ ] Set Active Project
- [ ] Apply Director Style to Entire Project (submenu)
- [ ] Copy All Scene Prompts
- [ ] Toggle Chain Mode
- [ ] Delete Project

**Test Steps:**
1. Create a second project (if not already present)
2. Right-click on a project entry
3. Verify menu appears
4. Click "Rename Project" → enter new name → verify name changes
5. Click "Duplicate Project" → verify new project appears with " (Copy)" suffix
6. Click "Set Active Project" → verify project becomes active
7. Hover over "Apply Director Style to Entire Project" → verify submenu
8. Click a director → verify all shots in all scenes get that style
9. Click "Copy All Scene Prompts" → verify toast shows success
10. Click "Toggle Chain Mode" → verify chain mode toggles
11. Click "Delete Project" → confirm dialog → verify project is deleted

**Disabled Tests:**
- [ ] Right-click active project → "Set Active Project" should be disabled
- [ ] With only 1 project → "Delete Project" should be disabled

**Pass Criteria:** ✅ All items work, disabled items grayed out, duplication creates independent copy

---

### TEST 4: Filmstrip Frame Context Menu ✅

**Location:** Right-click on a shot thumbnail in the filmstrip (bottom of screen)

**Expected Menu Items:**
- [ ] Jump to Shot
- [ ] Duplicate Shot
- [ ] Copy Prompt
- [ ] Copy Shotified Prompt
- [ ] Set Status (submenu with 5 statuses)
- [ ] Color Tag (submenu with 6 colors)
- [ ] Lock/Unlock Shot
- [ ] Delete Shot

**Test Steps:**
1. Scroll to see filmstrip at bottom
2. Right-click on a shot thumbnail
3. Verify menu appears
4. Click "Jump to Shot" → verify main editor scrolls to that shot
5. Click "Duplicate Shot" → verify new shot appears in filmstrip
6. Click "Copy Prompt" → verify toast shows success
7. Hover over "Set Status" → verify submenu with 5 statuses
8. Click a status → verify shot status changes
9. Hover over "Color Tag" → verify submenu with 6 colors
10. Click a color → verify shot gets that color tag
11. Click "Lock Shot" → verify shot shows locked badge
12. Click "Delete Shot" → verify shot is removed from filmstrip

**Disabled Tests:**
- [ ] Lock a shot, then right-click filmstrip → "Delete Shot" should be disabled

**Pass Criteria:** ✅ All items work, filmstrip updates in real-time

---

### TEST 5: Favorites Item Context Menu ✅

**Location:** Right-click on an item in the Favorites panel (sidebar)

**Expected Menu Items:**
- [ ] Copy Prompt
- [ ] Insert as New Shot
- [ ] Insert into All Scenes
- [ ] Rename Favorite
- [ ] Pin to Top
- [ ] Remove from Favorites

**Test Steps:**
1. Add a shot to favorites (click star icon)
2. Open Favorites panel (sidebar)
3. Right-click on a favorite item
4. Verify menu appears
5. Click "Copy Prompt" → verify toast shows success
6. Click "Insert as New Shot" → verify new shot appears in active scene
7. Click "Rename Favorite" → enter new name → verify name changes
8. Click "Pin to Top" → verify item moves to top of list
9. Click "Remove from Favorites" → verify item is removed

**Disabled Tests:**
- [ ] Pin first item to top → "Pin to Top" should be disabled

**Pass Criteria:** ✅ All items work, favorites list updates correctly

---

### TEST 6: Shot History Entry Context Menu ✅

**Location:** Right-click on a revision entry in the Shot History panel

**Expected Menu Items:**
- [ ] Restore This Version
- [ ] Duplicate as New Shot
- [ ] Copy Prompt from This Version
- [ ] Delete This Revision

**Test Steps:**
1. Edit a shot multiple times to create history
2. Click "View History" on a shot
3. Right-click on a revision entry
4. Verify menu appears
5. Click "Restore This Version" → verify shot reverts to that version
6. Click "Duplicate as New Shot" → verify new shot created with that version's data
7. Click "Copy Prompt from This Version" → verify toast shows success
8. Click "Delete This Revision" → verify revision is removed from history

**Pass Criteria:** ✅ All items work, history is properly managed

---

### TEST 7: Status Pill Context Menu ✅

**Location:** Right-click on the status badge (Planning, Ready, Rendering, etc.) on a shot card

**Expected Menu Items:**
- [ ] Planning
- [ ] Ready
- [ ] Rendering
- [ ] Completed
- [ ] Approved
- [ ] Set All in Scene (submenu)
- [ ] Set All in Project (submenu)

**Test Steps:**
1. Right-click on a status pill
2. Verify menu appears with 5 status options
3. Verify current status has checkmark
4. Click a different status → verify shot status changes
5. Hover over "Set All in Scene" → verify submenu
6. Click a status → verify all shots in scene get that status
7. Hover over "Set All in Project" → verify submenu
8. Click a status → verify all shots in project get that status

**Disabled Tests:**
- [ ] Lock a shot, then right-click status pill → all status items should be disabled

**Pass Criteria:** ✅ All items work, status updates propagate correctly

---

### TEST 8: Color Tag Context Menu ✅

**Location:** Right-click on the color tag indicator (colored dot or border) on a shot card

**Expected Menu Items:**
- [ ] 6 Color swatches (Red, Amber, Green, Blue, Purple, Pink)
- [ ] Remove Tag
- [ ] Tag All Shots in Scene (submenu)
- [ ] Clear All Tags in Scene

**Test Steps:**
1. Right-click on a color tag or the tag area
2. Verify menu appears with 6 colors
3. Verify current color has ring around it
4. Click a different color → verify shot gets that color
5. Click "Remove Tag" → verify color is removed
6. Hover over "Tag All Shots in Scene" → verify submenu
7. Click a color → verify all shots in scene get that color
8. Click "Clear All Tags in Scene" → verify all tags removed

**Disabled Tests:**
- [ ] Lock a shot, then right-click color tag → all tag items should be disabled
- [ ] Shot with no tag → "Remove Tag" should be disabled

**Pass Criteria:** ✅ All items work, colors apply correctly

---

### TEST 9: Prompt Output Context Menu ✅

**Location:** Right-click on the compiled prompt/script text area

**Expected Menu Items:**
- [ ] Copy Full Script
- [ ] Copy Selected Text
- [ ] Copy as Shotified
- [ ] Export as PDF
- [ ] Send to MOKHA Agent
- [ ] Regenerate with Director Style (submenu)
- [ ] Toggle Shotify Mode

**Test Steps:**
1. Right-click on the prompt output text area
2. Verify menu appears
3. Click "Copy Full Script" → verify toast shows success
4. Select some text in the prompt → right-click → "Copy Selected Text" should be enabled
5. Click "Copy Selected Text" → verify toast shows success
6. Click "Copy as Shotified" → verify toast shows success
7. Click "Export as PDF" → verify PDF export dialog appears
8. Click "Send to MOKHA Agent" → verify agent panel opens with text
9. Hover over "Regenerate with Director Style" → verify submenu
10. Click a director → verify prompt regenerates with that style
11. Click "Toggle Shotify Mode" → verify prompt format changes

**Disabled Tests:**
- [ ] No text selected → "Copy Selected Text" should be disabled

**Pass Criteria:** ✅ All items work, prompt operations function correctly

---

### TEST 10: Agent Message Context Menu ✅

**Location:** Right-click on a message bubble in the MOKHA Agent chat panel

**Expected Menu Items:**
- [ ] Copy Message
- [ ] Copy Selected Text
- [ ] Use as Shot Subject
- [ ] Insert as New Shot
- [ ] Re-send to Agent
- [ ] Delete Message
- [ ] Apply Suggestion (if applicable)

**Test Steps:**
1. Open MOKHA Agent panel
2. Send a message to the agent
3. Right-click on the agent's response
4. Verify menu appears
5. Click "Copy Message" → verify toast shows success
6. Select text in message → right-click → "Copy Selected Text" should be enabled
7. Click "Copy Selected Text" → verify toast shows success
8. Click "Use as Shot Subject" → verify shot subject field is populated
9. Click "Insert as New Shot" → verify new shot created with message text
10. Click "Delete Message" → verify message is removed from chat

**Disabled Tests:**
- [ ] Right-click on bot message → "Re-send to Agent" should be disabled
- [ ] No text selected → "Copy Selected Text" should be disabled

**Pass Criteria:** ✅ All items work, agent integration functions correctly

---

### TEST 11: Parameter Field Context Menu ✅

**Location:** Right-click on a parameter dropdown or input field in the shot form

**Expected Menu Items:**
- [ ] Copy Value
- [ ] Paste Value
- [ ] Reset to Default
- [ ] Apply to All Shots in Scene
- [ ] Apply to All Shots in Project
- [ ] Sync via Chain Mode (if Chain Mode active)
- [ ] Suggest Values

**Test Steps:**
1. Right-click on a parameter field (e.g., Shot Type, Lens, Lighting)
2. Verify menu appears
3. Click "Copy Value" → verify toast shows success
4. Click "Paste Value" → verify value is pasted to field
5. Click "Reset to Default" → verify field resets
6. Click "Apply to All Shots in Scene" → verify all shots in scene get that value
7. Click "Apply to All Shots in Project" → verify all shots in project get that value
8. Enable Chain Mode, then right-click → "Sync via Chain Mode" should appear
9. Click "Suggest Values" → verify popover with suggestions appears

**Disabled Tests:**
- [ ] Empty clipboard → "Paste Value" should be disabled

**Pass Criteria:** ✅ All items work, parameter operations function correctly

---

### TEST 12: Canvas Context Menu ✅

**Location:** Right-click on empty space in the main shot-list workspace area

**Expected Menu Items:**
- [ ] Add New Shot
- [ ] Paste Shot
- [ ] Add Scene
- [ ] Select All Shots
- [ ] Deselect All
- [ ] Sort Shots (submenu: By Status, By Color Tag, By Duration Asc/Desc)
- [ ] Analyze Scene Rhythm
- [ ] Detect Genre DNA
- [ ] Toggle Focus Mode
- [ ] Open Command Palette

**Test Steps:**
1. Right-click on empty space in the shot list area
2. Verify menu appears
3. Click "Add New Shot" → verify new blank shot appears
4. Copy a shot, then right-click → "Paste Shot" should be enabled
5. Click "Paste Shot" → verify shot is pasted
6. Click "Add Scene" → verify new scene is added
7. Click "Select All Shots" → verify all shots are selected
8. Click "Deselect All" → verify all shots are deselected
9. Hover over "Sort Shots" → verify submenu with sort options
10. Click "By Status" → verify shots are sorted by status
11. Click "Analyze Scene Rhythm" → verify rhythm analyzer opens
12. Click "Detect Genre DNA" → verify genre detector opens
13. Click "Toggle Focus Mode" → verify focus mode toggles
14. Click "Open Command Palette" → verify command palette opens

**Disabled Tests:**
- [ ] No shot copied → "Paste Shot" should be disabled
- [ ] No shots selected → "Deselect All" should be disabled

**Pass Criteria:** ✅ All items work, canvas operations function correctly

---

## Keyboard Navigation Tests

### TEST 13: Arrow Key Navigation ✅

**Test Steps:**
1. Right-click to open any menu
2. Press ArrowDown → verify focus moves to next item
3. Press ArrowUp → verify focus moves to previous item
4. Press ArrowRight on item with submenu → verify submenu opens
5. Press ArrowLeft → verify submenu closes
6. Press Escape → verify menu closes

**Pass Criteria:** ✅ All arrow keys work, focus management correct

---

### TEST 14: Enter/Space Activation ✅

**Test Steps:**
1. Right-click to open any menu
2. Press ArrowDown to focus an item
3. Press Enter → verify action is invoked
4. Right-click to open menu again
5. Press ArrowDown to focus an item
6. Press Space → verify action is invoked

**Pass Criteria:** ✅ Enter and Space activate items

---

### TEST 15: Escape Key Dismissal ✅

**Test Steps:**
1. Right-click to open any menu
2. Press Escape → verify menu closes
3. Right-click to open menu with submenu
4. Press ArrowRight to open submenu
5. Press Escape → verify submenu closes (menu stays open)
6. Press Escape again → verify menu closes

**Pass Criteria:** ✅ Escape key works correctly

---

## Accessibility Tests

### TEST 16: ARIA Attributes ✅

**Test Steps:**
1. Open DevTools → Elements tab
2. Right-click to open any menu
3. Inspect the menu container → verify `role="menu"` attribute
4. Inspect menu items → verify `role="menuitem"` attribute
5. Inspect disabled items → verify `aria-disabled="true"` attribute

**Pass Criteria:** ✅ All ARIA attributes present

---

### TEST 17: Screen Reader Compatibility ✅

**Test Steps (if screen reader available):**
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Right-click to open menu
3. Verify screen reader announces "Menu"
4. Press ArrowDown → verify screen reader announces each item
5. Verify disabled items are announced as "disabled"

**Pass Criteria:** ✅ Screen reader announces menu and items correctly

---

## Edge Case Tests

### TEST 18: Viewport Clamping ✅

**Test Steps:**
1. Right-click near the right edge of the screen → verify menu doesn't overflow right
2. Right-click near the bottom edge → verify menu doesn't overflow bottom
3. Right-click in top-left corner → verify menu appears correctly
4. Right-click in bottom-right corner → verify menu is repositioned to stay in viewport

**Pass Criteria:** ✅ Menu always stays within viewport

---

### TEST 19: Outside Click Dismissal ✅

**Test Steps:**
1. Right-click to open menu
2. Click outside the menu → verify menu closes
3. Right-click to open menu
4. Click on another element → verify menu closes and no action is triggered

**Pass Criteria:** ✅ Outside click dismisses menu without side effects

---

### TEST 20: Submenu Hover ✅

**Test Steps:**
1. Right-click to open menu with submenu
2. Hover over item with arrow → verify submenu appears
3. Move mouse away from submenu → verify submenu closes
4. Hover over submenu item → verify submenu stays open
5. Click submenu item → verify action is invoked and menu closes

**Pass Criteria:** ✅ Submenu hover behavior works correctly

---

## Performance Tests

### TEST 21: No Lag with Many Shots ✅

**Test Steps:**
1. Create a scene with 50+ shots
2. Right-click on various shots → verify menu appears instantly
3. Open DevTools → Performance tab
4. Right-click multiple times → verify no performance degradation
5. Check Console → verify no errors

**Pass Criteria:** ✅ Menu appears instantly, no lag, no errors

---

### TEST 22: No Unrelated Re-renders ✅

**Test Steps:**
1. Open DevTools → React DevTools (if available)
2. Right-click to open menu
3. Verify only menu component re-renders
4. Verify shot list doesn't re-render
5. Verify other UI elements don't re-render

**Pass Criteria:** ✅ Only menu component re-renders

---

## Summary Checklist

### Core Functionality
- [ ] All 11 menu types appear correctly
- [ ] All menu items are visible and readable
- [ ] All actions execute correctly
- [ ] All disabled items are properly grayed out
- [ ] All submenus appear on hover
- [ ] All submenus close on mouse leave

### Keyboard Navigation
- [ ] Arrow keys navigate between items
- [ ] Enter/Space activate items
- [ ] Escape closes menu/submenu
- [ ] Focus trap works correctly

### Accessibility
- [ ] ARIA roles present (menu, menuitem)
- [ ] ARIA disabled attributes present
- [ ] Screen reader compatible (if tested)

### Edge Cases
- [ ] Viewport clamping works
- [ ] Outside click dismisses menu
- [ ] Submenu hover works
- [ ] No lag with many shots
- [ ] No unrelated re-renders

### Browser Compatibility
- [ ] Chrome/Edge: ✅
- [ ] Firefox: ✅
- [ ] Safari: ✅
- [ ] Mobile browsers: ✅

---

## Issues Found

**If you encounter any issues, document them here:**

| Issue | Menu Type | Steps to Reproduce | Expected | Actual | Severity |
|-------|-----------|-------------------|----------|--------|----------|
| | | | | | |

---

## Sign-Off

**Tested By:** _______________
**Date:** _______________
**Status:** ✅ PASS / ❌ FAIL

**Notes:**
_______________________________________________________________________________

