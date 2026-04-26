# Context Menus - Quick Test Guide (15 minutes)

## 🎬 Let's Test!

This guide will walk you through testing all 11 context menus in ~15 minutes.

---

## ⏱️ Timeline

- **Setup:** 2 minutes
- **Menu Tests:** 11 minutes (1 min per menu)
- **Summary:** 2 minutes
- **Total:** 15 minutes

---

## 🚀 STEP 1: Setup (2 minutes)

### 1.1 Open the App
```
1. Open mokha-suite PRO Vqr.html in your browser
2. Wait for it to fully load
3. Open DevTools (F12 or Cmd+Option+I)
4. Go to Console tab
```

### 1.2 Create Test Data
```
1. Create a new project (or use existing)
2. Create 2 scenes (Scene 1, Scene 2)
3. Add 3 shots to Scene 1
4. Add 2 shots to Scene 2
5. Add one shot to favorites (click star icon)
6. Edit a shot to create history
7. Lock one shot (click lock icon)
```

**✅ Setup Complete!**

---

## 🎯 STEP 2: Test Each Menu (11 minutes)

### Menu 1: Shot Card Menu (1 min)
**Location:** Right-click on any shot card

**Quick Test:**
```
1. Right-click on a shot card
   ✓ Menu appears at cursor
   ✓ All items visible
   
2. Click "Duplicate"
   ✓ New shot appears below original
   
3. Click "Lock Shot"
   ✓ Shot shows locked badge
   
4. Hover over "Move to Scene"
   ✓ Submenu appears with other scenes
   
5. Click outside to close menu
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 2: Scene Tab Menu (1 min)
**Location:** Right-click on a scene tab

**Quick Test:**
```
1. Right-click on a scene tab
   ✓ Menu appears
   
2. Click "Rename Scene"
   ✓ Prompt appears
   ✓ Enter new name
   ✓ Tab name changes
   
3. Right-click again
   ✓ Click "Duplicate Scene"
   ✓ New scene appears with all shots
   
4. Check boundary conditions:
   ✓ First scene: "Move Left" is grayed out
   ✓ Last scene: "Move Right" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 3: Project Tab Menu (1 min)
**Location:** Right-click on a project entry

**Quick Test:**
```
1. Right-click on a project entry
   ✓ Menu appears
   
2. Click "Duplicate Project"
   ✓ New project appears with " (Copy)" suffix
   
3. Check disabled items:
   ✓ Active project: "Set Active" is grayed out
   ✓ Only project: "Delete" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 4: Filmstrip Menu (1 min)
**Location:** Right-click on a shot thumbnail in filmstrip

**Quick Test:**
```
1. Scroll to see filmstrip at bottom
2. Right-click on a shot thumbnail
   ✓ Menu appears
   
3. Click "Jump to Shot"
   ✓ Main editor scrolls to that shot
   
4. Right-click again
   ✓ Hover over "Set Status"
   ✓ Submenu appears with 5 statuses
   
5. Check disabled items:
   ✓ Locked shot: "Delete" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 5: Favorites Menu (1 min)
**Location:** Right-click on a favorite item

**Quick Test:**
```
1. Open Favorites panel (sidebar)
2. Right-click on a favorite item
   ✓ Menu appears
   
3. Click "Insert as New Shot"
   ✓ New shot appears in active scene
   
4. Right-click again
   ✓ Click "Pin to Top"
   ✓ Item moves to top of list
   
5. Check disabled items:
   ✓ First item: "Pin to Top" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 6: History Menu (1 min)
**Location:** Right-click on a revision entry

**Quick Test:**
```
1. Click "View History" on a shot
2. Right-click on a revision entry
   ✓ Menu appears
   
3. Click "Restore This Version"
   ✓ Shot reverts to that version
   
4. Right-click again
   ✓ Click "Duplicate as New Shot"
   ✓ New shot created with that version's data
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 7: Status Pill Menu (1 min)
**Location:** Right-click on the status badge

**Quick Test:**
```
1. Right-click on a status pill (Planning, Ready, etc.)
   ✓ Menu appears with 5 statuses
   ✓ Current status has checkmark
   
2. Click a different status
   ✓ Shot status changes
   
3. Hover over "Set All in Scene"
   ✓ Submenu appears
   
4. Check disabled items:
   ✓ Locked shot: all items are grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 8: Color Tag Menu (1 min)
**Location:** Right-click on the color tag

**Quick Test:**
```
1. Right-click on a color tag
   ✓ Menu appears with 6 colors
   ✓ Current color has ring around it
   
2. Click a different color
   ✓ Shot gets that color tag
   
3. Hover over "Tag All in Scene"
   ✓ Submenu appears
   
4. Check disabled items:
   ✓ No tag: "Remove Tag" is grayed out
   ✓ Locked shot: all items are grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 9: Prompt Output Menu (1 min)
**Location:** Right-click on the prompt text area

**Quick Test:**
```
1. Right-click on the prompt output text
   ✓ Menu appears
   
2. Click "Copy Full Script"
   ✓ Toast shows "Prompt copied ✓"
   
3. Select some text in prompt
   ✓ Right-click
   ✓ "Copy Selected Text" is enabled
   
4. No text selected
   ✓ Right-click
   ✓ "Copy Selected Text" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 10: Agent Message Menu (1 min)
**Location:** Right-click on a message in MOKHA Agent

**Quick Test:**
```
1. Open MOKHA Agent panel
2. Send a message to the agent
3. Right-click on the agent's response
   ✓ Menu appears
   
4. Click "Copy Message"
   ✓ Toast shows success
   
5. Check disabled items:
   ✓ Bot message: "Re-send to Agent" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

### Menu 11: Canvas Menu (1 min)
**Location:** Right-click on empty space in the shot list

**Quick Test:**
```
1. Right-click on empty space in shot list
   ✓ Menu appears
   
2. Click "Add New Shot"
   ✓ New blank shot appears
   
3. Copy a shot, then right-click
   ✓ "Paste Shot" is enabled
   
4. No shot copied
   ✓ Right-click
   ✓ "Paste Shot" is grayed out
```

**Status:** ✅ PASS / ❌ FAIL

---

## 📊 STEP 3: Summary (2 minutes)

### Menus Tested
- [ ] Menu 1: Shot Card - ✅ PASS / ❌ FAIL
- [ ] Menu 2: Scene Tab - ✅ PASS / ❌ FAIL
- [ ] Menu 3: Project Tab - ✅ PASS / ❌ FAIL
- [ ] Menu 4: Filmstrip - ✅ PASS / ❌ FAIL
- [ ] Menu 5: Favorites - ✅ PASS / ❌ FAIL
- [ ] Menu 6: History - ✅ PASS / ❌ FAIL
- [ ] Menu 7: Status Pill - ✅ PASS / ❌ FAIL
- [ ] Menu 8: Color Tag - ✅ PASS / ❌ FAIL
- [ ] Menu 9: Prompt Output - ✅ PASS / ❌ FAIL
- [ ] Menu 10: Agent Message - ✅ PASS / ❌ FAIL
- [ ] Menu 11: Canvas - ✅ PASS / ❌ FAIL

### Overall Result
**Total Menus Tested:** 11
**Passed:** ___
**Failed:** ___

### Issues Found
```
Issue 1: [Describe any issues found]
Issue 2: [Describe any issues found]
Issue 3: [Describe any issues found]
```

### Console Errors
```
Check DevTools Console for any errors:
[List any errors found]
```

---

## ✅ Final Sign-Off

**Overall Status:** ✅ PASS / ❌ FAIL

**Tested By:** You

**Date:** Today

**Browser:** [Your browser]

**Notes:**
_______________________________________________________________________________

---

## 🎉 You're Done!

**If all tests passed:**
- ✅ Feature is working correctly
- ✅ All 11 menus functional
- ✅ Ready for production

**If issues found:**
- ❌ Document the issues
- ❌ We'll fix them
- ❌ Re-test after fixes

---

## 💡 Quick Tips

1. **Menu doesn't appear?** - Make sure you're right-clicking on the correct element
2. **Action doesn't work?** - Check if it's disabled (grayed out)
3. **Submenu doesn't appear?** - Hover over the item with the arrow
4. **Keyboard not working?** - Make sure the menu is focused
5. **Console errors?** - Note them and we'll investigate

---

**Ready? Start with STEP 1 above! 🚀**

