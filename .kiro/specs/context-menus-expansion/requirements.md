# Requirements Document

## Introduction

MOKHA FILM Suite PRO currently provides a right-click context menu only on shot cards. This feature expands right-click context menus to all major interactive UI surfaces in the application: scene tabs, project tabs/entries, filmstrip frames, favorites items, shot history entries, Kanban status pills, color tag indicators, the prompt output/script area, MOKHA Agent chat messages, parameter dropdowns/fields, and the main workspace canvas (empty space). Each context menu is tailored to the actions that are most relevant to that specific surface, giving power users fast, keyboard-free access to the full depth of the app without navigating away from their current focus.

---

## Glossary

- **Context_Menu_System**: The shared infrastructure (state, positioning, rendering, and dismissal logic) that powers all right-click menus across the application.
- **Scene_Tab_Menu**: The context menu that appears when the user right-clicks a scene tab.
- **Project_Tab_Menu**: The context menu that appears when the user right-clicks a project entry in the project list or project tab bar.
- **Filmstrip_Frame_Menu**: The context menu that appears when the user right-clicks a shot thumbnail in the filmstrip strip at the bottom of the workspace.
- **Favorites_Item_Menu**: The context menu that appears when the user right-clicks a saved item in the Favorites panel.
- **History_Entry_Menu**: The context menu that appears when the user right-clicks a revision entry in the Shot History panel.
- **Status_Pill_Menu**: The context menu that appears when the user right-clicks a Kanban status pill on a shot card.
- **Color_Tag_Menu**: The context menu that appears when the user right-clicks a color tag indicator on a shot card.
- **Prompt_Output_Menu**: The context menu that appears when the user right-clicks the compiled prompt/script output text area.
- **Agent_Message_Menu**: The context menu that appears when the user right-clicks a message bubble in the MOKHA Agent chat panel.
- **Parameter_Field_Menu**: The context menu that appears when the user right-clicks a parameter dropdown or input field in the shot form.
- **Canvas_Menu**: The context menu that appears when the user right-clicks empty space in the main shot-list workspace area.
- **Shot**: A single prompt card within a scene, containing subject, parameters, SFX, BGM, dialogues, mode, status, and color tag.
- **Scene**: A named container of shots within a project, represented as a tab.
- **Project**: The top-level container holding scenes, represented as a project entry or tab.
- **Filmstrip**: The horizontal strip of shot thumbnail frames at the bottom of the workspace.
- **Favorites**: The panel of saved/pinned prompt items accessible from the sidebar.
- **Shot_History**: The per-shot revision log storing up to 10 snapshots of a shot's state.
- **Kanban_Status**: One of five workflow states assigned to a shot: Planning, Ready, Rendering, Completed, Approved.
- **Color_Tag**: One of six color labels (red, amber, green, blue, purple, pink) that can be applied to a shot card.
- **Director_Style**: A preset parameter bundle named after a director (Kubrick, Nolan, Fincher, Tarantino, Lynch, Scorsese, Villeneuve, Spielberg).
- **Chain_Mode**: A mode that locks shared parameters across all shots in a scene.
- **MOKHA_Agent**: The AI chat assistant panel embedded in the application.
- **Command_Palette**: The keyboard-shortcut launcher overlay.
- **Prompt_Output**: The compiled, final prompt text generated from a shot's parameters.
- **Shotified_Prompt**: A compressed, platform-optimised version of the prompt output.

---

## Requirements

---

### Requirement 1: Unified Context Menu System

**User Story:** As a power user, I want a single, consistent right-click menu system across the entire app, so that I can rely on predictable behaviour and visual style no matter where I right-click.

#### Acceptance Criteria

1. THE Context_Menu_System SHALL render at most one context menu at a time; opening a new menu SHALL dismiss any currently open menu.
2. WHEN a context menu is open and the user clicks anywhere outside it, THE Context_Menu_System SHALL dismiss the menu without triggering any action.
3. WHEN a context menu is open and the user presses the Escape key, THE Context_Menu_System SHALL dismiss the menu without triggering any action.
4. THE Context_Menu_System SHALL position each menu so that it remains fully within the visible viewport, adjusting left/top coordinates when the menu would otherwise overflow the right or bottom edge.
5. THE Context_Menu_System SHALL apply the same visual style (panel background, border, shadow, border-radius, font size, hover states, dividers) as the existing shot context menu to all new menus.
6. THE Context_Menu_System SHALL prevent the browser's native context menu from appearing on any element that has a custom context menu registered.
7. WHEN a menu item triggers an action, THE Context_Menu_System SHALL dismiss the menu immediately after the action is invoked.
8. THE Context_Menu_System SHALL support flyout submenus (nested panels that appear to the right of a parent item on hover) using the same pattern as the existing shot menu's Move/Send/Director/Color submenus.
9. IF a menu item's action is not applicable in the current state (e.g., "Paste Shot" when clipboard is empty), THEN THE Context_Menu_System SHALL render that item in a visually disabled state and SHALL NOT invoke its action when clicked.

---

### Requirement 2: Scene Tab Context Menu

**User Story:** As a filmmaker, I want to right-click a scene tab to manage that scene without switching focus away from my current shot, so that I can stay in flow while organising my project structure.

#### Acceptance Criteria

1. WHEN the user right-clicks a scene tab, THE Scene_Tab_Menu SHALL appear with actions scoped to that specific scene.
2. THE Scene_Tab_Menu SHALL include a "Rename Scene" action that opens an inline rename input on the tab.
3. THE Scene_Tab_Menu SHALL include a "Duplicate Scene" action that creates a deep copy of the scene (including all its shots) and appends it to the project's scene list.
4. THE Scene_Tab_Menu SHALL include an "Add Scene After" action that inserts a new blank scene immediately after the right-clicked scene.
5. THE Scene_Tab_Menu SHALL include a "Move Scene Left" action that swaps the scene with the one to its left; THE Scene_Tab_Menu SHALL render this item disabled when the scene is already the first scene.
6. THE Scene_Tab_Menu SHALL include a "Move Scene Right" action that swaps the scene with the one to its right; THE Scene_Tab_Menu SHALL render this item disabled when the scene is already the last scene.
7. THE Scene_Tab_Menu SHALL include an "Apply Director Style to All Shots" flyout submenu listing all eight Director_Style presets; selecting a preset SHALL apply that style's parameter bundle to every shot in the scene.
8. THE Scene_Tab_Menu SHALL include a "Copy All Prompts" action that copies the concatenated Prompt_Output of all shots in the scene to the clipboard.
9. THE Scene_Tab_Menu SHALL include a "Export Scene as PDF" action that triggers the existing PDF export flow scoped to the right-clicked scene.
10. THE Scene_Tab_Menu SHALL include a "Clear All Shots" action that removes all shots from the scene after the user confirms via a toast-level confirmation prompt.
11. THE Scene_Tab_Menu SHALL include a "Delete Scene" action that removes the scene and all its shots; THE Scene_Tab_Menu SHALL render this item disabled when the project contains only one scene.
12. IF the scene contains zero shots, THEN THE Scene_Tab_Menu SHALL render "Copy All Prompts", "Export Scene as PDF", "Clear All Shots", and "Apply Director Style to All Shots" in a disabled state.

---

### Requirement 3: Project Tab / Entry Context Menu

**User Story:** As a filmmaker managing multiple productions, I want to right-click a project entry to perform project-level operations quickly, so that I can organise my workspace without opening a separate settings panel.

#### Acceptance Criteria

1. WHEN the user right-clicks a project entry or project tab, THE Project_Tab_Menu SHALL appear with actions scoped to that specific project.
2. THE Project_Tab_Menu SHALL include a "Rename Project" action that opens an inline rename input on the project entry.
3. THE Project_Tab_Menu SHALL include a "Duplicate Project" action that creates a deep copy of the project (all scenes and shots) with a name suffix of " (Copy)".
4. THE Project_Tab_Menu SHALL include a "Set Active Project" action that switches the active project to the right-clicked one; THE Project_Tab_Menu SHALL render this item disabled when the project is already active.
5. THE Project_Tab_Menu SHALL include an "Apply Director Style to Entire Project" flyout submenu listing all eight Director_Style presets; selecting a preset SHALL apply that style's parameter bundle to every shot in every scene of the project.
6. THE Project_Tab_Menu SHALL include a "Copy All Scene Prompts" action that copies the concatenated Prompt_Output of all shots across all scenes to the clipboard.
7. THE Project_Tab_Menu SHALL include an "Export Project as PDF" action that triggers the existing PDF export flow scoped to the entire project.
8. THE Project_Tab_Menu SHALL include a "Toggle Chain Mode" action that enables or disables Chain_Mode for the project; the menu item label SHALL reflect the current state ("Enable Chain Mode" or "Disable Chain Mode").
9. THE Project_Tab_Menu SHALL include a "Delete Project" action that removes the project and all its data; THE Project_Tab_Menu SHALL render this item disabled when only one project exists.
10. WHEN the "Delete Project" action is invoked, THE Project_Tab_Menu SHALL require the user to confirm the deletion via a modal confirmation dialog before executing the deletion.

---

### Requirement 4: Filmstrip Frame Context Menu

**User Story:** As a filmmaker reviewing my shot sequence in the filmstrip, I want to right-click a filmstrip frame to perform shot actions without scrolling back to the shot card, so that I can manage shots directly from the visual overview.

#### Acceptance Criteria

1. WHEN the user right-clicks a filmstrip frame, THE Filmstrip_Frame_Menu SHALL appear with actions scoped to the shot represented by that frame.
2. THE Filmstrip_Frame_Menu SHALL include a "Jump to Shot" action that scrolls the main shot list to bring the corresponding shot card into view and sets it as the active editing target.
3. THE Filmstrip_Frame_Menu SHALL include a "Duplicate Shot" action that creates a copy of the shot and inserts it immediately after the original.
4. THE Filmstrip_Frame_Menu SHALL include a "Copy Prompt" action that copies the shot's Prompt_Output to the clipboard.
5. THE Filmstrip_Frame_Menu SHALL include a "Copy Shotified Prompt" action that copies the shot's Shotified_Prompt to the clipboard.
6. THE Filmstrip_Frame_Menu SHALL include a "Set Status" flyout submenu listing all five Kanban_Status values; selecting a status SHALL update the shot's status.
7. THE Filmstrip_Frame_Menu SHALL include a "Color Tag" flyout submenu with the six Color_Tag swatches plus a "Remove Tag" option.
8. THE Filmstrip_Frame_Menu SHALL include a "Lock / Unlock Shot" toggle action.
9. THE Filmstrip_Frame_Menu SHALL include a "Delete Shot" action that removes the shot; THE Filmstrip_Frame_Menu SHALL render this item disabled when the shot is locked.

---

### Requirement 5: Favorites Item Context Menu

**User Story:** As a filmmaker curating my saved prompts, I want to right-click a favorites item to manage it without opening a separate edit flow, so that I can quickly reuse, organise, or remove saved prompts.

#### Acceptance Criteria

1. WHEN the user right-clicks a favorites item in the Favorites panel, THE Favorites_Item_Menu SHALL appear with actions scoped to that item.
2. THE Favorites_Item_Menu SHALL include a "Copy Prompt" action that copies the item's saved prompt text to the clipboard.
3. THE Favorites_Item_Menu SHALL include an "Insert as New Shot" action that creates a new shot in the active scene pre-populated with the favorite item's subject and selections.
4. THE Favorites_Item_Menu SHALL include an "Insert into All Scenes" action that appends a new shot derived from the favorite item to every scene in the active project.
5. THE Favorites_Item_Menu SHALL include a "Rename Favorite" action that opens an inline rename input for the item's display label.
6. THE Favorites_Item_Menu SHALL include a "Pin to Top" action that moves the item to the first position in the favorites list.
7. THE Favorites_Item_Menu SHALL include a "Remove from Favorites" action that deletes the item from the favorites list.

---

### Requirement 6: Shot History Entry Context Menu

**User Story:** As a filmmaker reviewing shot revisions, I want to right-click a history entry to act on it directly, so that I can restore, compare, or branch from a specific version without extra clicks.

#### Acceptance Criteria

1. WHEN the user right-clicks a revision entry in the Shot_History panel, THE History_Entry_Menu SHALL appear with actions scoped to that revision.
2. THE History_Entry_Menu SHALL include a "Restore This Version" action that replaces the current shot state with the revision's snapshot.
3. THE History_Entry_Menu SHALL include a "Duplicate as New Shot" action that inserts a new shot in the active scene using the revision's snapshot data, leaving the current shot unchanged.
4. THE History_Entry_Menu SHALL include a "Copy Prompt from This Version" action that copies the Prompt_Output derived from the revision's snapshot to the clipboard.
5. THE History_Entry_Menu SHALL include a "Delete This Revision" action that removes only that entry from the shot's history log.

---

### Requirement 7: Kanban Status Pill Context Menu

**User Story:** As a filmmaker tracking production progress, I want to right-click a status pill to change a shot's workflow state instantly, so that I can update status without opening the full shot editor.

#### Acceptance Criteria

1. WHEN the user right-clicks a Kanban status pill on a shot card, THE Status_Pill_Menu SHALL appear with actions scoped to that shot's status.
2. THE Status_Pill_Menu SHALL list all five Kanban_Status values as selectable items; the currently active status SHALL be visually indicated (e.g., a checkmark or highlighted background).
3. WHEN the user selects a status from THE Status_Pill_Menu, THE Status_Pill_Menu SHALL update the shot's status to the selected value and dismiss the menu.
4. THE Status_Pill_Menu SHALL include a "Set Status for All Shots in Scene" flyout submenu listing all five Kanban_Status values; selecting a value SHALL apply that status to every shot in the active scene.
5. THE Status_Pill_Menu SHALL include a "Set Status for All Shots in Project" flyout submenu listing all five Kanban_Status values; selecting a value SHALL apply that status to every shot across all scenes in the active project.
6. IF the shot is locked, THEN THE Status_Pill_Menu SHALL render all status-change items in a disabled state and SHALL display a "Shot is locked" tooltip on hover.

---

### Requirement 8: Color Tag Indicator Context Menu

**User Story:** As a filmmaker using color tags to categorise shots visually, I want to right-click a color tag indicator to change or clear the tag instantly, so that I can re-categorise shots without opening the shot context menu.

#### Acceptance Criteria

1. WHEN the user right-clicks a color tag indicator (the colored left border or tag swatch) on a shot card, THE Color_Tag_Menu SHALL appear with actions scoped to that shot's color tag.
2. THE Color_Tag_Menu SHALL display all six Color_Tag swatches as selectable items; the currently applied tag SHALL be visually indicated with a ring or checkmark.
3. WHEN the user selects a color swatch, THE Color_Tag_Menu SHALL apply that color tag to the shot and dismiss the menu.
4. THE Color_Tag_Menu SHALL include a "Remove Tag" item that clears the shot's color tag; THE Color_Tag_Menu SHALL render this item disabled when no tag is currently applied.
5. THE Color_Tag_Menu SHALL include a "Tag All Shots in Scene" flyout submenu with the six color swatches; selecting a color SHALL apply that tag to every shot in the active scene.
6. THE Color_Tag_Menu SHALL include a "Clear All Tags in Scene" item that removes color tags from every shot in the active scene.
7. IF the shot is locked, THEN THE Color_Tag_Menu SHALL render all tag-change items in a disabled state.

---

### Requirement 9: Prompt Output / Script Area Context Menu

**User Story:** As a filmmaker working with the compiled prompt output, I want to right-click the script/prompt text area to access copy, export, and AI actions without leaving the output panel, so that I can act on the generated text immediately.

#### Acceptance Criteria

1. WHEN the user right-clicks the Prompt_Output or script text area, THE Prompt_Output_Menu SHALL appear with actions relevant to the displayed text.
2. THE Prompt_Output_Menu SHALL include a "Copy Full Script" action that copies the entire visible script text to the clipboard.
3. THE Prompt_Output_Menu SHALL include a "Copy Selected Text" action that copies only the currently selected text to the clipboard; THE Prompt_Output_Menu SHALL render this item disabled when no text is selected.
4. THE Prompt_Output_Menu SHALL include a "Copy as Shotified" action that copies the Shotified_Prompt version of the active scene's output to the clipboard.
5. THE Prompt_Output_Menu SHALL include an "Export as PDF" action that triggers the existing PDF export flow for the active scene.
6. THE Prompt_Output_Menu SHALL include a "Send to MOKHA Agent" action that pastes the full script text into the MOKHA_Agent chat input and opens the agent panel.
7. THE Prompt_Output_Menu SHALL include a "Regenerate with Director Style" flyout submenu listing all eight Director_Style presets; selecting a preset SHALL apply that style to all shots in the active scene and refresh the output.
8. THE Prompt_Output_Menu SHALL include a "Toggle Shotify Mode" action that enables or disables Shotified_Prompt rendering for the output; the item label SHALL reflect the current state.

---

### Requirement 10: MOKHA Agent Chat Message Context Menu

**User Story:** As a filmmaker using the MOKHA Agent, I want to right-click a chat message to copy, reuse, or act on its content, so that I can extract value from AI responses without manually selecting and copying text.

#### Acceptance Criteria

1. WHEN the user right-clicks a message bubble in the MOKHA_Agent chat panel, THE Agent_Message_Menu SHALL appear with actions scoped to that message.
2. THE Agent_Message_Menu SHALL include a "Copy Message" action that copies the full text of the message to the clipboard.
3. THE Agent_Message_Menu SHALL include a "Copy Selected Text" action that copies only the currently selected text within the message; THE Agent_Message_Menu SHALL render this item disabled when no text is selected in the message.
4. THE Agent_Message_Menu SHALL include a "Use as Shot Subject" action that populates the shot subject input field with the message text and closes the agent panel.
5. THE Agent_Message_Menu SHALL include a "Insert as New Shot" action that creates a new shot in the active scene using the message text as the subject.
6. THE Agent_Message_Menu SHALL include a "Re-send to Agent" action that re-submits the message text as a new user message to the MOKHA_Agent; THE Agent_Message_Menu SHALL render this item disabled for bot (assistant) messages.
7. THE Agent_Message_Menu SHALL include a "Delete Message" action that removes the message from the chat history display.
8. WHEN the user right-clicks a bot message that contains a structured command result (e.g., a created shot or scene), THE Agent_Message_Menu SHALL include an "Apply Suggestion" action that executes the suggested action on the current project state.

---

### Requirement 11: Parameter Field Context Menu

**User Story:** As a filmmaker filling in shot parameters, I want to right-click a parameter dropdown or input field to access quick-fill, copy, and reset actions, so that I can populate parameters faster without manually navigating each field.

#### Acceptance Criteria

1. WHEN the user right-clicks a parameter dropdown or text input in the shot form, THE Parameter_Field_Menu SHALL appear with actions scoped to that specific parameter.
2. THE Parameter_Field_Menu SHALL include a "Copy Value" action that copies the current value of the field to the clipboard.
3. THE Parameter_Field_Menu SHALL include a "Paste Value" action that sets the field's value to the content of the clipboard if the clipboard content is a valid value for that field; THE Parameter_Field_Menu SHALL render this item disabled when the clipboard is empty or contains an incompatible value.
4. THE Parameter_Field_Menu SHALL include a "Reset to Default" action that clears the field and restores its default/placeholder value.
5. THE Parameter_Field_Menu SHALL include an "Apply to All Shots in Scene" action that sets the same value on the corresponding parameter field of every shot in the active scene.
6. THE Parameter_Field_Menu SHALL include an "Apply to All Shots in Project" action that sets the same value on the corresponding parameter field of every shot across all scenes in the active project.
7. WHERE Chain_Mode is active, THE Parameter_Field_Menu SHALL include a "Sync via Chain Mode" action that propagates the current field value to all shots through the Chain_Mode mechanism.
8. THE Parameter_Field_Menu SHALL include a "Suggest Values" action that opens a small inline popover listing contextually relevant preset values for that parameter (e.g., common aperture values for the aperture field, common lighting setups for the lighting field).

---

### Requirement 12: Main Workspace Canvas Context Menu

**User Story:** As a filmmaker working in the main shot-list area, I want to right-click empty canvas space to access workspace-level and scene-level actions, so that I can perform common operations without reaching for toolbar buttons.

#### Acceptance Criteria

1. WHEN the user right-clicks empty space in the main shot-list workspace area (not on a shot card, tab, or other interactive element), THE Canvas_Menu SHALL appear with workspace-level and scene-level actions.
2. THE Canvas_Menu SHALL include an "Add New Shot" action that appends a blank shot to the active scene.
3. THE Canvas_Menu SHALL include a "Paste Shot" action that inserts a previously copied shot at the end of the active scene; THE Canvas_Menu SHALL render this item disabled when no shot has been copied to the internal clipboard.
4. THE Canvas_Menu SHALL include an "Add Scene" action that appends a new blank scene to the active project.
5. THE Canvas_Menu SHALL include a "Select All Shots" action that adds all shots in the active scene to the multi-selection set.
6. THE Canvas_Menu SHALL include a "Deselect All" action that clears the current multi-selection; THE Canvas_Menu SHALL render this item disabled when no shots are selected.
7. THE Canvas_Menu SHALL include a "Sort Shots" flyout submenu with options: "By Status", "By Color Tag", "By Duration (Asc)", "By Duration (Desc)"; selecting an option SHALL reorder the shots in the active scene accordingly.
8. THE Canvas_Menu SHALL include a "Analyze Scene Rhythm" action that opens the Shot Rhythm Analyzer panel for the active scene.
9. THE Canvas_Menu SHALL include a "Detect Genre DNA" action that opens the Genre DNA Detector panel.
10. THE Canvas_Menu SHALL include a "Toggle Focus Mode" action that enables or disables the existing focus mode overlay.
11. THE Canvas_Menu SHALL include a "Open Command Palette" action that opens the Command_Palette overlay.

---

### Requirement 13: Accessibility and Keyboard Navigation

**User Story:** As a user who relies on keyboard navigation, I want context menus to be keyboard-accessible, so that I can use all right-click features without a mouse.

#### Acceptance Criteria

1. WHEN a context menu is open, THE Context_Menu_System SHALL trap focus within the menu and set focus on the first non-disabled menu item.
2. WHILE a context menu is open, THE Context_Menu_System SHALL allow the user to navigate between menu items using the ArrowUp and ArrowDown keys.
3. WHEN the user presses Enter or Space on a focused menu item, THE Context_Menu_System SHALL invoke that item's action.
4. WHEN the user presses ArrowRight on a menu item that has a flyout submenu, THE Context_Menu_System SHALL open the submenu and move focus to its first item.
5. WHEN the user presses ArrowLeft or Escape while a flyout submenu is open, THE Context_Menu_System SHALL close the submenu and return focus to the parent menu item.
6. THE Context_Menu_System SHALL assign role="menu" to each menu container and role="menuitem" to each interactive item to support screen reader navigation.

---

### Requirement 14: Performance and Rendering

**User Story:** As a user working with large projects, I want context menus to appear instantly and not degrade app performance, so that the right-click workflow feels snappy even with many shots and scenes loaded.

#### Acceptance Criteria

1. WHEN the user triggers a context menu, THE Context_Menu_System SHALL render the menu within 50 milliseconds of the right-click event.
2. THE Context_Menu_System SHALL render context menus using React portals (or equivalent) so that menu z-index and overflow are not constrained by parent element stacking contexts.
3. THE Context_Menu_System SHALL not re-render unrelated UI components when a context menu opens or closes.
4. WHILE the Performance Quality Mode is set to "Low", THE Context_Menu_System SHALL suppress entry animations on context menus and render them without transition effects.
