# Pro Script Builder Context Menus - Requirements

## Overview
Add comprehensive right-click context menus to all major elements in the Pro Script Builder (dialogue lines, character names, scene headings, action lines) to provide quick access to common operations and improve workflow efficiency.

## Requirements

### 1. Dialogue Line Context Menu
**Requirement 1.1**: Right-click on any dialogue line to open context menu with:
- Copy Dialogue Text
- Copy Full Dialogue (with character, mood, reaction, event)
- Duplicate Dialogue Line
- Edit Dialogue
- Move Up (if not first)
- Move Down (if not last)
- Add to Favorites
- Delete Dialogue
- Apply to All Scenes (submenu)
- Change Mood (submenu with mood options)
- Change Voice Style (submenu with voice options)

**Requirement 1.2**: Disabled items when:
- "Move Up" disabled if dialogue is first in list
- "Move Down" disabled if dialogue is last in list
- "Apply to All Scenes" disabled if only one scene exists

### 2. Character Name Context Menu
**Requirement 2.1**: Right-click on character name field to open context menu with:
- Copy Character Name
- Add to Character Library
- View Character Profile
- Rename Character (inline edit)
- Find All Instances (highlights all occurrences)
- Replace Character Name (in all scenes)
- Delete Character (from all dialogues)
- Set as Main Character
- Set as Supporting Character

**Requirement 2.2**: Disabled items when:
- "Add to Character Library" disabled if character already in library
- "View Character Profile" disabled if character not in library

### 3. Scene Heading Context Menu
**Requirement 3.1**: Right-click on scene heading to open context menu with:
- Copy Scene Heading
- Duplicate Scene
- Add Scene Before
- Add Scene After
- Move Scene Up (if not first)
- Move Scene Down (if not last)
- Rename Scene
- Delete Scene (disabled if only one scene)
- Export Scene as PDF
- Apply Director Style (submenu with director presets)

**Requirement 3.2**: Disabled items when:
- "Move Scene Up" disabled if scene is first
- "Move Scene Down" disabled if scene is last
- "Delete Scene" disabled if only one scene exists

### 4. Action Line Context Menu
**Requirement 4.1**: Right-click on action line to open context menu with:
- Copy Action Text
- Duplicate Action Line
- Edit Action
- Move Up (if not first)
- Move Down (if not last)
- Add to Favorites
- Delete Action
- Format Action (submenu: Bold, Italic, Underline)
- Change Tone (submenu: Dramatic, Comedic, Neutral, etc.)

**Requirement 4.2**: Disabled items when:
- "Move Up" disabled if action is first
- "Move Down" disabled if action is last

### 5. General Context Menu Features
**Requirement 5.1**: All context menus should:
- Appear at cursor position
- Close on outside click
- Close on Escape key
- Support keyboard navigation (arrow keys, Enter)
- Show disabled items grayed out
- Display icons for visual clarity
- Support submenus with hover/arrow key navigation

**Requirement 5.2**: Context menu styling:
- Match existing UI theme (light/dark mode)
- Use consistent spacing and typography
- Show action icons
- Highlight dangerous actions (delete) in red
- Show keyboard shortcuts where applicable

### 6. Undo/Redo Support
**Requirement 6.1**: All context menu actions should:
- Support undo (Ctrl+Z)
- Support redo (Ctrl+Y)
- Update history stack
- Show unsaved changes indicator

### 7. Accessibility
**Requirement 7.1**: Context menus should:
- Have proper ARIA roles (menu, menuitem)
- Support keyboard-only navigation
- Have proper focus management
- Show aria-disabled for disabled items
- Have descriptive labels

## Correctness Properties

**Property 1: Single Menu Open**
- At most one context menu can be open at any time
- Opening a new menu closes the previous one

**Property 2: Disabled Items Don't Execute**
- Clicking disabled menu items does not trigger any action
- Disabled items cannot be activated via keyboard

**Property 3: Undo/Redo Consistency**
- All context menu actions can be undone
- Undo/redo maintains correct state

**Property 4: Keyboard Navigation**
- Arrow keys navigate menu items
- Enter/Space activates focused item
- Escape closes menu
- Tab moves to next menu item

**Property 5: Submenu Navigation**
- Right arrow opens submenu
- Left arrow closes submenu
- Hover opens submenu
- Focus management correct on submenu open/close

## Implementation Notes

- Use existing `openCtxMenu()` and `closeCtxMenu()` infrastructure from context menus expansion
- Reuse `MenuItem`, `Divider`, `MenuHeader`, `SubMenuWrapper` components
- Add new context menu types: 'dialogue', 'character', 'scene-heading', 'action-line'
- Integrate with existing undo/redo system
- Support drag-and-drop reordering alongside context menu operations
