# Context Menus - Quick Test Reference

## 🎯 Quick Test Checklist (5-10 minutes)

### Setup
- [ ] Open `mokha-suite PRO Vqr.html`
- [ ] Create test project with 2+ scenes
- [ ] Add 3-5 shots to each scene
- [ ] Add some shots to favorites
- [ ] Edit a shot to create history

### Test Each Menu (1 minute each)

#### 1. Shot Card Menu
- [ ] Right-click shot → menu appears
- [ ] Click "Duplicate" → new shot created
- [ ] Click "Lock Shot" → shot locked
- [ ] Hover "Move to Scene" → submenu appears
- [ ] Click director in submenu → parameters change

#### 2. Scene Tab Menu
- [ ] Right-click scene tab → menu appears
- [ ] Click "Rename Scene" → name changes
- [ ] Click "Duplicate Scene" → new scene created
- [ ] First scene: "Move Left" disabled ✓
- [ ] Last scene: "Move Right" disabled ✓

#### 3. Project Tab Menu
- [ ] Right-click project → menu appears
- [ ] Click "Duplicate Project" → new project with " (Copy)"
- [ ] Active project: "Set Active" disabled ✓
- [ ] Only project: "Delete" disabled ✓

#### 4. Filmstrip Menu
- [ ] Right-click filmstrip frame → menu appears
- [ ] Click "Jump to Shot" → scrolls to shot
- [ ] Hover "Set Status" → submenu appears
- [ ] Locked shot: "Delete" disabled ✓

#### 5. Favorites Menu
- [ ] Right-click favorite → menu appears
- [ ] Click "Insert as New Shot" → shot created
- [ ] Click "Pin to Top" → moves to top
- [ ] First item: "Pin to Top" disabled ✓

#### 6. History Menu
- [ ] Right-click revision → menu appears
- [ ] Click "Restore This Version" → shot reverts
- [ ] Click "Duplicate as New Shot" → new shot created

#### 7. Status Pill Menu
- [ ] Right-click status → menu appears
- [ ] Click different status → status changes
- [ ] Hover "Set All in Scene" → submenu appears
- [ ] Locked shot: all items disabled ✓

#### 8. Color Tag Menu
- [ ] Right-click color tag → menu appears
- [ ] Click color → tag applied
- [ ] Hover "Tag All in Scene" → submenu appears
- [ ] No tag: "Remove Tag" disabled ✓

#### 9. Prompt Output Menu
- [ ] Right-click prompt text → menu appears
- [ ] Click "Copy Full Script" → toast shows
- [ ] Select text → "Copy Selected" enabled ✓
- [ ] No selection: "Copy Selected" disabled ✓

#### 10. Agent Message Menu
- [ ] Right-click agent message → menu appears
- [ ] Click "Copy Message" → toast shows
- [ ] Bot message: "Re-send" disabled ✓

#### 11. Canvas Menu
- [ ] Right-click empty space → menu appears
- [ ] Click "Add New Shot" → shot created
- [ ] Copy shot → "Paste Shot" enabled ✓
- [ ] No copy: "Paste Shot" disabled ✓

### Keyboard Navigation (1 minute)
- [ ] Right-click → menu appears
- [ ] ArrowDown → focus moves down
- [ ] ArrowUp → focus moves up
- [ ] ArrowRight on submenu → submenu opens
- [ ] Escape → menu closes

### Accessibility (1 minute)
- [ ] DevTools → Elements
- [ ] Inspect menu → `role="menu"` present ✓
- [ ] Inspect item → `role="menuitem"` present ✓
- [ ] Inspect disabled → `aria-disabled="true"` present ✓

### Edge Cases (1 minute)
- [ ] Right-click near right edge → menu stays in viewport ✓
- [ ] Right-click near bottom → menu stays in viewport ✓
- [ ] Click outside menu → menu closes ✓
- [ ] Press Escape → menu closes ✓

### Performance (1 minute)
- [ ] Create 50+ shots
- [ ] Right-click → menu appears instantly ✓
- [ ] DevTools Console → no errors ✓

---

## ✅ Pass Criteria

**All 11 menus working:** ✅
**All actions execute:** ✅
**Disabled items grayed out:** ✅
**Keyboard navigation works:** ✅
**ARIA attributes present:** ✅
**No viewport overflow:** ✅
**No console errors:** ✅

---

## 🐛 Issues Found

| Menu | Issue | Severity |
|------|-------|----------|
| | | |

---

## 📝 Notes

_______________________________________________________________________________

---

## ✅ Sign-Off

**Status:** ✅ PASS / ❌ FAIL

**Tested:** _______________
**Date:** _______________

