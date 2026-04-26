# Context Menus Testing Instructions

## 🚀 How to Test the Context Menus Feature

The Context Menus Expansion feature is **100% implemented** and ready for testing. Follow these instructions to verify all functionality.

---

## Step 1: Prepare Your Test Environment

### Open the Application
```
1. Open mokha-suite PRO Vqr.html in your browser
2. Wait for the app to fully load
3. Open DevTools (F12 or Cmd+Option+I)
4. Go to Console tab to watch for errors
```

### Create Test Data
```
1. Create a new project (or use existing)
2. Create 2-3 scenes
3. Add 3-5 shots to each scene
4. Add some shots to favorites (click star icon)
5. Edit a shot multiple times to create history
6. Lock one shot (click lock icon)
7. Apply different colors to some shots
8. Set different statuses on shots
```

---

## Step 2: Choose Your Testing Approach

### Option A: Quick Test (5-10 minutes)
Use `.kiro/CONTEXT_MENUS_QUICK_TEST.md` for a rapid verification of all 11 menus.

**Best for:** Quick verification that everything works

### Option B: Comprehensive Test (30-45 minutes)
Use `.kiro/CONTEXT_MENUS_TESTING_GUIDE.md` for detailed testing of each menu with all edge cases.

**Best for:** Thorough verification and bug detection

### Option C: Manual Exploration (10-20 minutes)
Explore the menus yourself and test what interests you most.

**Best for:** Getting familiar with the feature

---

## Step 3: Run Your Tests

### Quick Test (Option A)
1. Open `.kiro/CONTEXT_MENUS_QUICK_TEST.md`
2. Go through each menu (1 minute each)
3. Check off items as you test
4. Note any issues found
5. Sign off at the bottom

### Comprehensive Test (Option B)
1. Open `.kiro/CONTEXT_MENUS_TESTING_GUIDE.md`
2. Follow TEST 1 through TEST 22
3. Check off each test step
4. Document any issues in the Issues table
5. Sign off at the bottom

### Manual Exploration (Option C)
1. Right-click on different UI elements
2. Try different actions
3. Test keyboard navigation (arrow keys, Enter, Escape)
4. Note anything that doesn't work as expected

---

## Step 4: What to Look For

### ✅ Things That Should Work

**Menu Appearance:**
- [ ] Menu appears at cursor position
- [ ] Menu stays within viewport (doesn't overflow)
- [ ] Menu has proper styling (dark/light theme)
- [ ] All menu items are visible and readable

**Menu Actions:**
- [ ] All menu items execute their actions
- [ ] Actions apply changes to the project
- [ ] Toast notifications appear for copy/success actions
- [ ] Dialogs appear for confirmation actions

**Disabled Items:**
- [ ] Disabled items are grayed out (opacity-30)
- [ ] Disabled items don't execute when clicked
- [ ] Disabled items show correct conditions (e.g., locked shots, single project)

**Submenus:**
- [ ] Submenus appear on hover
- [ ] Submenus close on mouse leave
- [ ] Submenus contain correct items
- [ ] Submenu items execute correctly

**Keyboard Navigation:**
- [ ] ArrowDown moves focus to next item
- [ ] ArrowUp moves focus to previous item
- [ ] ArrowRight opens submenu
- [ ] ArrowLeft closes submenu
- [ ] Enter/Space activate focused item
- [ ] Escape closes menu

**Accessibility:**
- [ ] DevTools shows `role="menu"` on menu container
- [ ] DevTools shows `role="menuitem"` on items
- [ ] DevTools shows `aria-disabled="true"` on disabled items

---

## Step 5: Report Issues

If you find any issues, document them:

```
Menu Type: [Shot/Scene/Project/Filmstrip/etc.]
Issue: [What doesn't work]
Steps to Reproduce: [How to trigger the issue]
Expected: [What should happen]
Actual: [What actually happens]
Severity: [Critical/High/Medium/Low]
```

---

## Step 6: Sign Off

When testing is complete, update the sign-off section:

```
Status: ✅ PASS (all tests passed) or ❌ FAIL (issues found)
Tested By: [Your name]
Date: [Today's date]
Browser: [Chrome/Firefox/Safari/Edge]
Notes: [Any additional notes]
```

---

## 📊 Expected Results

### All 11 Menus Should Work
1. ✅ Shot Card Menu
2. ✅ Scene Tab Menu
3. ✅ Project Tab Menu
4. ✅ Filmstrip Frame Menu
5. ✅ Favorites Item Menu
6. ✅ Shot History Menu
7. ✅ Status Pill Menu
8. ✅ Color Tag Menu
9. ✅ Prompt Output Menu
10. ✅ Agent Message Menu
11. ✅ Canvas Menu

### All Features Should Work
- ✅ Menu appears at cursor
- ✅ All actions execute
- ✅ Disabled items grayed out
- ✅ Submenus appear on hover
- ✅ Keyboard navigation works
- ✅ ARIA attributes present
- ✅ No viewport overflow
- ✅ No console errors

---

## 🎯 Success Criteria

**Testing is successful if:**
- [ ] All 11 menus appear correctly
- [ ] All menu items are visible
- [ ] All actions execute without errors
- [ ] Disabled items are properly grayed out
- [ ] Keyboard navigation works
- [ ] ARIA attributes are present
- [ ] No console errors appear
- [ ] No viewport overflow occurs
- [ ] Performance is acceptable (no lag)

---

## 📝 Testing Documents

| Document | Purpose | Time |
|----------|---------|------|
| `.kiro/CONTEXT_MENUS_QUICK_TEST.md` | Quick verification | 5-10 min |
| `.kiro/CONTEXT_MENUS_TESTING_GUIDE.md` | Comprehensive testing | 30-45 min |
| `.kiro/CONTEXT_MENUS_IMPLEMENTATION_STATUS.md` | Implementation details | Reference |
| `.kiro/CONTEXT_MENUS_EXPANSION_SPEC_SUMMARY.md` | Feature overview | Reference |

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Feature is production-ready
2. Move to next feature (Story Output Management or Pro Script Builder)
3. Consider running property-based tests (optional)

### If Issues Found ❌
1. Document all issues
2. Prioritize by severity
3. Fix issues in the code
4. Re-test affected menus
5. Repeat until all tests pass

---

## 💡 Tips for Testing

1. **Test in multiple browsers** - Chrome, Firefox, Safari, Edge
2. **Test on different screen sizes** - Desktop, tablet, mobile
3. **Test with keyboard only** - No mouse, just arrow keys and Enter
4. **Test with screen reader** - If available (NVDA, JAWS, VoiceOver)
5. **Test with many shots** - Create 50+ shots to test performance
6. **Test edge cases** - Locked shots, empty scenes, single project
7. **Watch the console** - Look for any JavaScript errors
8. **Check DevTools** - Verify ARIA attributes and no re-renders

---

## ❓ FAQ

**Q: What if a menu doesn't appear?**
A: Check the console for errors. Right-click on the correct element (shot card, scene tab, etc.). Verify the element is not disabled.

**Q: What if an action doesn't work?**
A: Check the console for errors. Verify the action is not disabled (grayed out). Try a different action to see if it's a general issue or specific to that action.

**Q: What if the menu overflows the viewport?**
A: This is a bug. Document it with the position where it occurred (e.g., "right edge", "bottom edge").

**Q: What if keyboard navigation doesn't work?**
A: Check that the menu is focused (click on it first). Try arrow keys, Enter, and Escape. Document which keys don't work.

**Q: What if ARIA attributes are missing?**
A: This is a bug. Document which attributes are missing (role="menu", role="menuitem", aria-disabled).

---

## 📞 Support

If you encounter issues or have questions:
1. Check the console for error messages
2. Review the testing guide for similar issues
3. Document the issue with steps to reproduce
4. Check if it's a known limitation

---

## ✅ Ready to Test?

1. Open `.kiro/CONTEXT_MENUS_QUICK_TEST.md` for quick testing
2. Or open `.kiro/CONTEXT_MENUS_TESTING_GUIDE.md` for comprehensive testing
3. Follow the instructions
4. Report any issues found
5. Sign off when complete

**Good luck! 🚀**

