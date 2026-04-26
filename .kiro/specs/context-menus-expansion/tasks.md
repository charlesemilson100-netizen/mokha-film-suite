# Implementation Plan: Context Menus Expansion

## Overview

This implementation extends the existing right-click context menu system from shot cards only to all major interactive surfaces in MOKHA FILM Suite PRO. The approach is additive and minimal: we migrate the existing `ctxMenu` state shape from `{ x, y, shotIndex }` to `{ x, y, type, data }`, introduce a `ContextMenuPortal` component that renders via `ReactDOM.createPortal`, and add `onContextMenu` handlers to 11 new surfaces. All changes occur in the single file `mokha-suite PRO Vqr.html`.

## Tasks

- [x] 1. Set up unified context menu infrastructure
  - Migrate `ctxMenu` state shape from `{ x, y, shotIndex }` to `{ x, y, type, data }`
  - Add `openCtxMenu(e, type, data)` helper function
  - Add `closeCtxMenu()` helper function
  - Add `copiedShotRef = React.useRef(null)` for canvas paste action
  - Keep existing `ctxSubmenu` state unchanged
  - _Requirements: 1.1, 1.2, 1.7_

- [ ]* 1.1 Write property test for single menu invariant
  - **Property 1: At Most One Menu Open**
  - **Validates: Requirements 1.1**
  - Generate random sequences of `openCtxMenu` calls; assert `ctxMenu` always holds exactly the last-opened menu

- [x] 2. Create ContextMenuPortal component with viewport clamping
  - [x] 2.1 Implement ContextMenuPortal component skeleton
    - Create component that accepts `ctxMenu`, `ctxSubmenu`, `setCtxSubmenu`, `closeCtxMenu` props
    - Return `null` when `ctxMenu` is null
    - Use `ReactDOM.createPortal` to render into `document.body`
    - Add fixed positioning with z-index 99999
    - _Requirements: 1.4, 14.2_
  
  - [x] 2.2 Implement viewport position clamping logic
    - Add `estimateMenuHeight(type)` helper (~36px per item + 8px padding)
    - Compute `left = Math.min(ctxMenu.x, window.innerWidth - menuWidth - 8)`
    - Compute `top = Math.min(ctxMenu.y, window.innerHeight - menuHeight - 8)`
    - Apply clamped position to portal container
    - _Requirements: 1.4_
  
  - [ ]* 2.3 Write property test for viewport containment
    - **Property 3: Viewport Containment**
    - **Validates: Requirements 1.4**
    - Generate random (x, y) coordinates and menu types; assert rendered menu is fully within viewport bounds

- [x] 3. Create shared menu sub-components
  - [x] 3.1 Implement MenuItem component
    - Accept props: `icon`, `label`, `action`, `disabled`, `danger`, `badge`, `hasArrow`, `onMouseEnter`, `onMouseLeave`
    - Render with `role="menuitem"` and `aria-disabled` when disabled
    - Apply `opacity-30 cursor-not-allowed` styling when disabled
    - Suppress `onClick` when disabled
    - Call `action()` then `closeCtxMenu()` when clicked and enabled
    - _Requirements: 1.7, 1.9, 13.6_
  
  - [x] 3.2 Implement Divider, MenuHeader, and SubMenuWrapper components
    - `Divider`: horizontal border with theme-aware colors
    - `MenuHeader`: uppercase section label with muted text
    - `SubMenuWrapper`: flyout submenu container with hover state management
    - _Requirements: 1.5, 1.8_
  
  - [ ]* 3.3 Write property test for disabled items
    - **Property 4: Disabled Items Do Not Invoke Actions**
    - **Validates: Requirements 1.9**
    - Generate random disabled menu items; simulate click; assert action mock was never called

- [x] 4. Migrate existing shot context menu into portal system
  - [x] 4.1 Update existing shot card `onContextMenu` handler
    - Replace `setCtxMenu({ x: e.clientX, y: e.clientY, shotIndex: i })` with `openCtxMenu(e, 'shot', { shotIndex: i })`
    - _Requirements: 1.1_
  
  - [x] 4.2 Move existing shot menu JSX into ContextMenuPortal
    - Add `case 'shot':` branch in `renderMenuForType` switch
    - Copy existing shot menu JSX structure into the case block
    - Update data access from `ctxMenu.shotIndex` to `ctxMenu.data.shotIndex`
    - Verify all existing shot menu actions still work (duplicate, copy, lock, delete, move, send, director, color)
    - _Requirements: 1.5, 1.7_
  
  - [ ]* 4.3 Write property test for action dismissal
    - **Property 5: Action Dismisses Menu**
    - **Validates: Requirements 1.7**
    - Generate random enabled menu items with mock actions; simulate click; assert `ctxMenu === null` after invocation

- [x] 5. Implement Scene Tab Context Menu
  - [x] 5.1 Add onContextMenu handler to scene tabs
    - Attach handler to each scene tab element
    - Call `openCtxMenu(e, 'scene', { sceneId })`
    - _Requirements: 2.1_
  
  - [x] 5.2 Implement Scene_Tab_Menu rendering
    - Add `case 'scene':` branch in `renderMenuForType`
    - Render menu items: Rename Scene, Duplicate Scene, Add Scene After, Move Scene Left, Move Scene Right
    - Add "Apply Director Style to All Shots" submenu with 8 director presets
    - Add Copy All Prompts, Export Scene as PDF, Clear All Shots, Delete Scene
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_
  
  - [x] 5.3 Implement scene action functions
    - `duplicateScene(sceneId)`: deep copy scene and all shots, append to project
    - `moveSceneLeft(sceneId)`: swap scene with previous scene
    - `moveSceneRight(sceneId)`: swap scene with next scene
    - `applyDirectorToScene(sceneId, directorKey)`: apply director preset to all shots in scene
    - `copyAllScenePrompts(sceneId)`: concatenate all shot prompts, copy to clipboard
    - _Requirements: 2.3, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 5.4 Add disabled-item logic for scene menu
    - Disable "Move Scene Left" when scene is first in list
    - Disable "Move Scene Right" when scene is last in list
    - Disable "Delete Scene" when project has only one scene
    - Disable bulk actions (Copy All Prompts, Export, Clear, Apply Director) when scene has zero shots
    - _Requirements: 2.5, 2.6, 2.11, 2.12_
  
  - [ ]* 5.5 Write property test for scene boundary actions
    - **Property 6: Scene Boundary Actions Respect Position**
    - **Validates: Requirements 2.5, 2.6**
    - Generate scene lists of random length; assert Move Left disabled iff index === 0, Move Right disabled iff index === last
  
  - [ ]* 5.6 Write property test for empty scene disables bulk actions
    - **Property 7: Empty Scene Disables Bulk Actions**
    - **Validates: Requirements 2.12**
    - Generate scenes with 0 shots; assert all four bulk-action items are disabled

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Project Tab Context Menu
  - [x] 7.1 Add onContextMenu handler to project entries
    - Attach handler to project list items and project tabs
    - Call `openCtxMenu(e, 'project', { projectId })`
    - _Requirements: 3.1_
  
  - [x] 7.2 Implement Project_Tab_Menu rendering
    - Add `case 'project':` branch in `renderMenuForType`
    - Render menu items: Rename Project, Duplicate Project, Set Active Project
    - Add "Apply Director Style to Entire Project" submenu with 8 director presets
    - Add Copy All Scene Prompts, Export Project as PDF, Toggle Chain Mode, Delete Project
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  
  - [x] 7.3 Implement project action functions
    - `duplicateProject(projectId)`: deep copy project with all scenes and shots, append " (Copy)" to name
    - _Requirements: 3.3_
  
  - [x] 7.4 Add disabled-item logic for project menu
    - Disable "Set Active Project" when project is already active
    - Disable "Delete Project" when only one project exists
    - _Requirements: 3.4, 3.9_
  
  - [ ]* 7.5 Write property test for single project disables delete
    - **Property 10: Single Project Disables Delete**
    - **Validates: Requirements 3.9**
    - Generate project lists with exactly one project; assert "Delete Project" is disabled

- [x] 8. Implement Filmstrip Frame Context Menu
  - [x] 8.1 Add onContextMenu handler to filmstrip frames
    - Attach handler to each filmstrip thumbnail element
    - Call `openCtxMenu(e, 'filmstrip', { shotIndex })`
    - _Requirements: 4.1_
  
  - [x] 8.2 Implement Filmstrip_Frame_Menu rendering
    - Add `case 'filmstrip':` branch in `renderMenuForType`
    - Render menu items: Jump to Shot, Duplicate Shot, Copy Prompt, Copy Shotified Prompt
    - Add "Set Status" submenu with 5 Kanban status values
    - Add "Color Tag" submenu with 6 color swatches + Remove Tag
    - Add Lock/Unlock Shot, Delete Shot
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_
  
  - [x] 8.3 Add disabled-item logic for filmstrip menu
    - Disable "Delete Shot" when shot is locked
    - _Requirements: 4.9_
  
  - [ ]* 8.4 Write property test for filmstrip delete disabled when locked
    - **Property 9: Filmstrip Delete Disabled When Locked**
    - **Validates: Requirements 4.9**
    - Generate shots with `locked: true`; assert "Delete Shot" is disabled in Filmstrip_Frame_Menu

- [x] 9. Implement Favorites Item Context Menu
  - [x] 9.1 Add onContextMenu handler to favorites items
    - Attach handler to each favorite item element in Favorites panel
    - Call `openCtxMenu(e, 'favorite', { favoriteId, favoriteIndex })`
    - _Requirements: 5.1_
  
  - [x] 9.2 Implement Favorites_Item_Menu rendering
    - Add `case 'favorite':` branch in `renderMenuForType`
    - Render menu items: Copy Prompt, Insert as New Shot, Insert into All Scenes, Rename Favorite, Pin to Top, Remove from Favorites
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 9.3 Implement favorites action functions
    - `insertFavoriteAsShot(favoriteId)`: create new shot in active scene from favorite data
    - `insertFavoriteIntoAllScenes(favoriteId)`: append new shot to every scene in active project
    - `pinFavoriteToTop(favoriteIndex)`: move favorite to index 0
    - `renameFavorite(favoriteId)`: open inline rename input
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 10. Implement Shot History Entry Context Menu
  - [x] 10.1 Add onContextMenu handler to history entries
    - Attach handler to each revision entry in Shot History panel
    - Call `openCtxMenu(e, 'history', { shotId, revisionIndex })`
    - _Requirements: 6.1_
  
  - [x] 10.2 Implement History_Entry_Menu rendering
    - Add `case 'history':` branch in `renderMenuForType`
    - Render menu items: Restore This Version, Duplicate as New Shot, Copy Prompt from This Version, Delete This Revision
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 10.3 Implement history action functions
    - `restoreHistoryRevision(shotId, revisionIndex)`: replace current shot state with revision snapshot
    - `duplicateHistoryAsShot(shotId, revisionIndex)`: insert new shot from revision data
    - `deleteHistoryRevision(shotId, revisionIndex)`: remove revision entry from log
    - _Requirements: 6.2, 6.3, 6.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Kanban Status Pill Context Menu
  - [x] 12.1 Add onContextMenu handler to status pills
    - Attach handler to status pill elements on shot cards
    - Call `openCtxMenu(e, 'status-pill', { shotIndex })`
    - _Requirements: 7.1_
  
  - [x] 12.2 Implement Status_Pill_Menu rendering
    - Add `case 'status-pill':` branch in `renderMenuForType`
    - Render all 5 Kanban status values as selectable items with checkmark on current status
    - Add "Set Status for All Shots in Scene" submenu with 5 status values
    - Add "Set Status for All Shots in Project" submenu with 5 status values
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [x] 12.3 Implement status action functions
    - `setAllShotsStatus(scope, statusValue)`: apply status to all shots in scene or project
    - _Requirements: 7.4, 7.5_
  
  - [x] 12.4 Add disabled-item logic for status pill menu
    - Disable all status-change items when shot is locked
    - _Requirements: 7.6_
  
  - [ ]* 12.5 Write property test for locked shot disables status mutation
    - **Property 8: Locked Shot Disables Mutation Actions (Status)**
    - **Validates: Requirements 7.6**
    - Generate shots with `locked: true`; assert all mutation items in Status_Pill_Menu are disabled

- [x] 13. Implement Color Tag Indicator Context Menu
  - [x] 13.1 Add onContextMenu handler to color tag indicators
    - Attach handler to color tag border/swatch elements on shot cards
    - Call `openCtxMenu(e, 'color-tag', { shotIndex })`
    - _Requirements: 8.1_
  
  - [x] 13.2 Implement Color_Tag_Menu rendering
    - Add `case 'color-tag':` branch in `renderMenuForType`
    - Render all 6 color swatches as selectable items with ring/checkmark on current tag
    - Add "Remove Tag" item (disabled when no tag applied)
    - Add "Tag All Shots in Scene" submenu with 6 color swatches
    - Add "Clear All Tags in Scene" item
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 13.3 Implement color tag action functions
    - `setAllShotsColorTag(scope, colorValue)`: apply color tag to all shots in scene
    - `clearAllColorTags(scope)`: remove color tags from all shots in scene
    - _Requirements: 8.5, 8.6_
  
  - [x] 13.4 Add disabled-item logic for color tag menu
    - Disable "Remove Tag" when no tag is applied
    - Disable all tag-change items when shot is locked
    - _Requirements: 8.4, 8.7_
  
  - [ ]* 13.5 Write property test for locked shot disables color tag mutation
    - **Property 8: Locked Shot Disables Mutation Actions (Color Tag)**
    - **Validates: Requirements 8.7**
    - Generate shots with `locked: true`; assert all mutation items in Color_Tag_Menu are disabled

- [x] 14. Implement Prompt Output Context Menu
  - [x] 14.1 Add onContextMenu handler to prompt output area
    - Attach handler to the compiled prompt/script text area element
    - Call `openCtxMenu(e, 'prompt-output', { sceneId })`
    - _Requirements: 9.1_
  
  - [x] 14.2 Implement Prompt_Output_Menu rendering
    - Add `case 'prompt-output':` branch in `renderMenuForType`
    - Render menu items: Copy Full Script, Copy Selected Text, Copy as Shotified, Export as PDF, Send to MOKHA Agent
    - Add "Regenerate with Director Style" submenu with 8 director presets
    - Add "Toggle Shotify Mode" item
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 14.3 Add disabled-item logic for prompt output menu
    - Disable "Copy Selected Text" when `window.getSelection().toString()` is empty
    - _Requirements: 9.3_
  
  - [ ]* 14.4 Write property test for copy selected text disabled when no selection
    - **Property 12: Copy Selected Text Disabled When No Selection (Prompt Output)**
    - **Validates: Requirements 9.3**
    - Generate Prompt_Output_Menu states when `window.getSelection().toString()` is empty; assert "Copy Selected Text" is disabled

- [x] 15. Implement MOKHA Agent Chat Message Context Menu
  - [x] 15.1 Add onContextMenu handler to agent message bubbles
    - Attach handler to each message bubble in MOKHA Agent chat panel
    - Call `openCtxMenu(e, 'agent-message', { messageIndex, role })`
    - _Requirements: 10.1_
  
  - [x] 15.2 Implement Agent_Message_Menu rendering
    - Add `case 'agent-message':` branch in `renderMenuForType`
    - Render menu items: Copy Message, Copy Selected Text, Use as Shot Subject, Insert as New Shot, Re-send to Agent, Delete Message, Apply Suggestion
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [x] 15.3 Add disabled-item logic for agent message menu
    - Disable "Copy Selected Text" when `window.getSelection().toString()` is empty
    - Disable "Re-send to Agent" when message role is 'assistant'
    - _Requirements: 10.3, 10.6_
  
  - [ ]* 15.4 Write property test for re-send disabled for bot messages
    - **Property 13: Re-send Disabled for Bot Messages**
    - **Validates: Requirements 10.6**
    - Generate agent messages with `role === 'assistant'`; assert "Re-send to Agent" is disabled

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement Parameter Field Context Menu
  - [x] 17.1 Add onContextMenu handler to parameter fields
    - Attach handler to each parameter dropdown and text input in shot form
    - Call `openCtxMenu(e, 'parameter-field', { shotIndex, fieldKey, fieldValue })`
    - _Requirements: 11.1_
  
  - [x] 17.2 Implement Parameter_Field_Menu rendering
    - Add `case 'parameter-field':` branch in `renderMenuForType`
    - Render menu items: Copy Value, Paste Value, Reset to Default, Apply to All Shots in Scene, Apply to All Shots in Project
    - Add "Sync via Chain Mode" item (when Chain Mode is active)
    - Add "Suggest Values" item with inline popover of preset values
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_
  
  - [x] 17.3 Implement parameter action functions
    - `applyParamToAllShots(scope, fieldKey, fieldValue)`: set parameter value on all shots in scene or project
    - _Requirements: 11.5, 11.6_
  
  - [x] 17.4 Add disabled-item logic for parameter field menu
    - Disable "Paste Value" when clipboard is empty or contains incompatible value
    - _Requirements: 11.3_

- [x] 18. Implement Main Workspace Canvas Context Menu
  - [x] 18.1 Add onContextMenu handler to canvas empty space
    - Attach handler to main shot-list workspace area (not on shot cards or other interactive elements)
    - Call `openCtxMenu(e, 'canvas', {})`
    - _Requirements: 12.1_
  
  - [x] 18.2 Implement Canvas_Menu rendering
    - Add `case 'canvas':` branch in `renderMenuForType`
    - Render menu items: Add New Shot, Paste Shot, Add Scene, Select All Shots, Deselect All
    - Add "Sort Shots" submenu with options: By Status, By Color Tag, By Duration (Asc), By Duration (Desc)
    - Add Analyze Scene Rhythm, Detect Genre DNA, Toggle Focus Mode, Open Command Palette
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11_
  
  - [x] 18.3 Implement canvas action functions
    - `sortShots(sortKey)`: reorder shots in active scene by status, color tag, or duration
    - _Requirements: 12.7_
  
  - [x] 18.4 Add disabled-item logic for canvas menu
    - Disable "Paste Shot" when `copiedShotRef.current` is null
    - Disable "Deselect All" when no shots are selected
    - _Requirements: 12.3, 12.6_

- [x] 19. Add global event listeners for menu dismissal
  - [x] 19.1 Implement outside-click dismissal
    - Add `useEffect` hook that attaches `click` listener to `document`
    - Check if click target is outside menu panel; if so, call `closeCtxMenu()`
    - _Requirements: 1.2_
  
  - [x] 19.2 Implement Escape key dismissal
    - Add `useEffect` hook that attaches `keydown` listener to `document`
    - Check if key is 'Escape'; if so, call `closeCtxMenu()`
    - _Requirements: 1.3_
  
  - [ ]* 19.3 Write property test for outside click dismisses without action
    - **Property 2: Outside Click Dismisses Without Action**
    - **Validates: Requirements 1.2**
    - Generate random menu states; simulate outside click; assert `ctxMenu === null` and no side-effect functions were called

- [x] 20. Implement keyboard navigation for context menus
  - [x] 20.1 Add focus trap on menu open
    - Set focus on first non-disabled menu item when menu opens
    - _Requirements: 13.1_
  
  - [x] 20.2 Implement arrow key navigation
    - Add `keydown` listener for ArrowUp/ArrowDown to move focus between items
    - Add `keydown` listener for ArrowRight to open submenu and focus first item
    - Add `keydown` listener for ArrowLeft/Escape to close submenu and return focus to parent
    - _Requirements: 13.2, 13.4, 13.5_
  
  - [x] 20.3 Implement Enter/Space activation
    - Add `keydown` listener for Enter/Space to invoke focused item's action
    - _Requirements: 13.3_

- [x] 21. Add ARIA attributes for accessibility
  - Add `role="menu"` to menu container
  - Add `role="menuitem"` to each interactive item
  - Add `aria-disabled="true"` to disabled items
  - _Requirements: 13.6_

- [x] 22. Optimize rendering performance
  - Ensure ContextMenuPortal does not trigger re-renders of unrelated components
  - Suppress entry animations when Performance Quality Mode is "Low"
  - _Requirements: 14.1, 14.3, 14.4_

- [x] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- All changes occur in the single file `mokha-suite PRO Vqr.html`
- The existing `ctxMenu` and `ctxSubmenu` state variables are reused with minimal migration
- Property tests use fast-check library with minimum 100 iterations per property
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
