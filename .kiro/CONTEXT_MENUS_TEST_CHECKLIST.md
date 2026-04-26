# Context Menus Testing - Live Checklist

## 🎯 Testing Session Started

**Date:** Today
**Tester:** You
**Browser:** [Your browser]
**Status:** 🟡 IN PROGRESS

---

## Phase 1: Setup (5 minutes)

### Application Setup
- [ ] Open `mokha-suite PRO Vqr.html`
- [ ] Wait for app to fully load
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Create test project with 2-3 scenes
- [ ] Add 3-5 shots to each scene
- [ ] Add some shots to favorites
- [ ] Edit a shot to create history
- [ ] Lock one shot

**Status:** ⏳ Waiting for setup completion

---

## Phase 2: Quick Menu Tests (15 minutes)

### Menu 1: Shot Card Menu ✅
**Location:** Right-click on any shot card

**Test:**
- [ ] Menu appears at cursor
- [ ] All items visible
- [ ] Click "Duplicate" → new shot appears
- [ ] Click "Lock Shot" → shot locked
- [ ] Hover "Move to Scene" → submenu appears
- [ ] Click director in submenu → parameters change

**Result:** ⏳ Pending

---

### Menu 2: Scene Tab Menu ✅
**Location:** Right-click on scene tab

**Test:**
- [ ] Menu appears
- [ ] Click "Rename Scene" → name changes
- [ ] Click "Duplicate Scene" → new scene created
- [ ] First scene: "Move Left" disabled
- [ ] Last scene: "Move Right" disabled

**Result:** ⏳ Pending

---

### Menu 3: Project Tab Menu ✅
**Location:** Right-click on project entry

**Test:**
- [ ] Menu appears
- [ ] Click "Duplicate Project" → new project with " (Copy)"
- [ ] Active project: "Set Active" disabled
- [ ] Only project: "Delete" disabled

**Result:** ⏳ Pending

---

### Menu 4: Filmstrip Menu ✅
**Location:** Right-click on filmstrip frame

**Test:**
- [ ] Menu appears
- [ ] Click "Jump to Shot" → scrolls to shot
- [ ] Hover "Set Status" → submenu appears
- [ ] Locked shot: "Delete" disabled

**Result:** ⏳ Pending

---

### Menu 5: Favorites Menu ✅
**Location:** Right-click on favorite item

**Test:**
- [ ] Menu appears
- [ ] Click "Insert as New Shot" → shot created
- [ ] Click "Pin to Top" → moves to top
- [ ] First item: "Pin to Top" disabled

**Result:** ⏳ Pending

---

### Menu 6: History Menu ✅
**Location:** Right-click on revision entry

**Test:**
- [ ] Menu appears
- [ ] Click "Restore This Version" → shot reverts
- [ ] Click "Duplicate as New Shot" → new shot created

**Result:** ⏳ Pending

---

### Menu 7: Status Pill Menu ✅
**Location:** Right-click on status badge

**Test:**
- [ ] Menu appears with 5 statuses
- [ ] Click different status → status changes
- [ ] Hover "Set All in Scene" → submenu appears
- [ ] Locked shot: all items disabled

**Result:** ⏳ Pending

---

### Menu 8: Color Tag Menu ✅
**Location:** Right-click on color tag

**Test:**
- [ ] Menu appears with 6 colors
- [ ] Click color → tag applied
- [ ] Hover "Tag All in Scene" → submenu appears
- [ ] No tag: "Remove Tag" disabled

**Result:** ⏳ Pending

---

### Menu 9: Prompt Output Menu ✅
**Location:** Right-click on prompt text

**Test:**
- [ ] Menu appears
- [ ] Click "Copy Full Script" → toast shows
- [ ] Select text → "Copy Selected" enabled
- [ ] No selection: "Copy Selected" disabled

**Result:** ⏳ Pending

---

### Menu 10: Agent Message Menu ✅
**Location:** Right-click on agent message

**Test:**
- [ ] Menu appears
- [ ] Click "Copy Message" → toast shows
- [ ] Bot message: "Re-send" disabled

**Result:** ⏳ Pending

---

### Menu 11: Canvas Menu ✅
**Location:** Right-click on empty space

**Test:**
- [ ] Menu appears
- [ ] Click "Add New Shot" → shot created
- [ ] Copy shot → "Paste Shot" enabled
- [ ] No copy: "Paste Shot" disabled

**Result:** ⏳ Pending

---

## Phase 3: Keyboard Navigation (5 minutes)

### Arrow Key Navigation
- [ ] Right-click → menu appears
- [ ] ArrowDown → focus moves down
- [ ] ArrowUp → focus moves up
- [ ] ArrowRight on submenu → submenu opens
- [ ] Escape → menu closes

**Result:** ⏳ Pending

---

### Enter/Space Activation
- [ ] Focus item with arrow keys
- [ ] Press Enter → action invokes
- [ ] Focus item with arrow keys
- [ ] Press Space → action invokes

**Result:** ⏳ Pending

---

## Phase 4: Accessibility (5 minutes)

### ARIA Attributes
- [ ] DevTools → Elements tab
- [ ] Right-click → open menu
- [ ] Inspect menu → `role="menu"` present
- [ ] Inspect item → `role="menuitem"` present
- [ ] Inspect disabled → `aria-disabled="true"` present

**Result:** ⏳ Pending

---

## Phase 5: Edge Cases (5 minutes)

### Viewport Clamping
- [ ] Right-click near right edge → menu stays in viewport
- [ ] Right-click near bottom → menu stays in viewport
- [ ] Right-click in corner → menu repositioned correctly

**Result:** ⏳ Pending

---

### Outside Click Dismissal
- [ ] Right-click → menu appears
- [ ] Click outside → menu closes
- [ ] No action triggered

**Result:** ⏳ Pending

---

### Performance
- [ ] Create 50+ shots
- [ ] Right-click → menu appears instantly
- [ ] DevTools Console → no errors

**Result:** ⏳ Pending

---

## Issues Found

| # | Menu | Issue | Severity | Status |
|---|------|-------|----------|--------|
| 1 | | | | ⏳ |
| 2 | | | | ⏳ |
| 3 | | | | ⏳ |

---

## Summary

### Menus Tested
- [ ] Shot Card Menu
- [ ] Scene Tab Menu
- [ ] Project Tab Menu
- [ ] Filmstrip Menu
- [ ] Favorites Menu
- [ ] History Menu
- [ ] Status Pill Menu
- [ ] Color Tag Menu
- [ ] Prompt Output Menu
- [ ] Agent Message Menu
- [ ] Canvas Menu

### Features Verified
- [ ] All menus appear correctly
- [ ] All actions execute
- [ ] Disabled items grayed out
- [ ] Keyboard navigation works
- [ ] ARIA attributes present
- [ ] No viewport overflow
- [ ] No console errors
- [ ] Good performance

---

## Final Result

**Overall Status:** ⏳ PENDING

**Pass/Fail:** ⏳ Waiting for testing

**Issues Found:** 0

**Tested By:** You

**Date:** Today

**Browser:** [Your browser]

**Notes:**
_______________________________________________________________________________

---

## Next Steps

After testing:
1. ✅ If all tests pass → Feature is production-ready
2. ❌ If issues found → Document and fix
3. 🔄 Re-test after fixes
4. ✅ Sign off when complete

---

**Ready to start testing? Follow these steps:**

1. **Setup Phase (5 min)**
   - Open the app
   - Create test data
   - Check off setup items

2. **Menu Tests (15 min)**
   - Test each menu one by one
   - Check off items as you go
   - Note any issues

3. **Keyboard Navigation (5 min)**
   - Test arrow keys
   - Test Enter/Space
   - Test Escape

4. **Accessibility (5 min)**
   - Open DevTools
   - Check ARIA attributes
   - Verify roles present

5. **Edge Cases (5 min)**
   - Test viewport clamping
   - Test outside click
   - Test performance

6. **Summary (2 min)**
   - Count issues found
   - Determine pass/fail
   - Sign off

**Total Time: ~40 minutes**

---

**Let me know when you're ready to start! 🚀**

