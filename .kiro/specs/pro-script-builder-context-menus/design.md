# Pro Script Builder Context Menus - Design

## Architecture

### Context Menu State Shape
```javascript
{
  x: number,           // Cursor X position
  y: number,           // Cursor Y position
  type: string,        // 'dialogue' | 'character' | 'scene-heading' | 'action-line'
  data: {
    // Type-specific data
    index?: number,    // Index in array
    sceneId?: string,  // Scene ID
    shotId?: string,   // Shot ID
    value?: string,    // Current value
    // ... other type-specific fields
  }
}
```

### Event Handlers

#### Dialogue Line Context Menu
```javascript
onContextMenu={(e) => {
  e.preventDefault();
  openCtxMenu(e, 'dialogue', {
    index: index,
    sceneId: activeScene.id,
    character: d.character,
    text: d.text,
    mood: d.mood,
    reaction: d.reaction,
    event: d.event,
    voiceStyle: d.voiceStyle
  });
}}
```

#### Character Name Context Menu
```javascript
onContextMenu={(e) => {
  e.preventDefault();
  openCtxMenu(e, 'character', {
    index: index,
    sceneId: activeScene.id,
    dialogueIndex: dialogueIndex,
    characterName: d.character
  });
}}
```

#### Scene Heading Context Menu
```javascript
onContextMenu={(e) => {
  e.preventDefault();
  openCtxMenu(e, 'scene-heading', {
    sceneId: scene.id,
    sceneName: scene.name,
    sceneIndex: sceneIndex
  });
}}
```

#### Action Line Context Menu
```javascript
onContextMenu={(e) => {
  e.preventDefault();
  openCtxMenu(e, 'action-line', {
    index: index,
    sceneId: activeScene.id,
    actionText: action.text
  });
}}
```

### Menu Rendering

#### Dialogue Menu
```
├─ Copy Dialogue Text
├─ Copy Full Dialogue
├─ Duplicate Dialogue
├─ Edit Dialogue
├─ Move Up (disabled if first)
├─ Move Down (disabled if last)
├─ Add to Favorites
├─ ─────────────────
├─ Apply to All Scenes (disabled if 1 scene)
├─ Change Mood ▶
│  ├─ Dramatic
│  ├─ Comedic
│  ├─ Neutral
│  └─ ...
├─ Change Voice Style ▶
│  ├─ [Voice options]
├─ ─────────────────
└─ Delete (red, danger)
```

#### Character Menu
```
├─ Copy Character Name
├─ Add to Character Library
├─ View Character Profile
├─ Rename Character
├─ Find All Instances
├─ Replace Character Name
├─ ─────────────────
├─ Set as Main Character
├─ Set as Supporting Character
├─ ─────────────────
└─ Delete Character (red, danger)
```

#### Scene Heading Menu
```
├─ Copy Scene Heading
├─ Duplicate Scene
├─ Add Scene Before
├─ Add Scene After
├─ Move Scene Up (disabled if first)
├─ Move Scene Down (disabled if last)
├─ Rename Scene
├─ ─────────────────
├─ Apply Director Style ▶
│  ├─ [Director presets]
├─ Export Scene as PDF
├─ ─────────────────
└─ Delete Scene (red, danger, disabled if 1 scene)
```

#### Action Line Menu
```
├─ Copy Action Text
├─ Duplicate Action
├─ Edit Action
├─ Move Up (disabled if first)
├─ Move Down (disabled if last)
├─ Add to Favorites
├─ ─────────────────
├─ Format Action ▶
│  ├─ Bold
│  ├─ Italic
│  └─ Underline
├─ Change Tone ▶
│  ├─ Dramatic
│  ├─ Comedic
│  ├─ Neutral
│  └─ ...
├─ ─────────────────
└─ Delete Action (red, danger)
```

### Action Functions

#### Dialogue Actions
- `copyDialogueText(index)` - Copy just the dialogue text
- `copyFullDialogue(index)` - Copy character + dialogue + metadata
- `duplicateDialogue(index)` - Create copy below current
- `editDialogue(index)` - Open inline edit mode
- `moveDialogueUp(index)` - Swap with previous
- `moveDialogueDown(index)` - Swap with next
- `addDialogueToFavorites(index)` - Save to favorites library
- `applyDialogueToAllScenes(index)` - Add same dialogue to all scenes
- `deleteDialogue(index)` - Remove from list

#### Character Actions
- `copyCharacterName(characterName)` - Copy to clipboard
- `addCharacterToLibrary(characterName)` - Add to global character library
- `viewCharacterProfile(characterName)` - Open character details
- `renameCharacter(oldName, newName)` - Rename in all dialogues
- `findAllInstances(characterName)` - Highlight all occurrences
- `replaceCharacterName(oldName, newName)` - Replace in all scenes
- `deleteCharacter(characterName)` - Remove from all dialogues
- `setMainCharacter(characterName)` - Mark as protagonist
- `setSupportingCharacter(characterName)` - Mark as supporting

#### Scene Actions
- `copySceneHeading(sceneId)` - Copy heading to clipboard
- `duplicateScene(sceneId)` - Create copy with all content
- `addSceneBefore(sceneId)` - Insert new scene before
- `addSceneAfter(sceneId)` - Insert new scene after
- `moveSceneUp(sceneId)` - Swap with previous scene
- `moveSceneDown(sceneId)` - Swap with next scene
- `renameScene(sceneId, newName)` - Update scene name
- `deleteScene(sceneId)` - Remove scene (with confirmation)
- `exportSceneAsPDF(sceneId)` - Export to PDF
- `applyDirectorStyleToScene(sceneId, directorKey)` - Apply preset

#### Action Line Actions
- `copyActionText(index)` - Copy to clipboard
- `duplicateAction(index)` - Create copy below
- `editAction(index)` - Open inline edit
- `moveActionUp(index)` - Swap with previous
- `moveActionDown(index)` - Swap with next
- `addActionToFavorites(index)` - Save to favorites
- `formatAction(index, format)` - Apply formatting
- `changeActionTone(index, tone)` - Update tone
- `deleteAction(index)` - Remove from list

### Disabled Item Logic

**Dialogue Menu:**
- Move Up: `index === 0`
- Move Down: `index === dialogues.length - 1`
- Apply to All Scenes: `scenes.length <= 1`

**Character Menu:**
- Add to Library: `globalCharacters.some(c => c.name === characterName)`
- View Profile: `!globalCharacters.some(c => c.name === characterName)`

**Scene Menu:**
- Move Up: `sceneIndex === 0`
- Move Down: `sceneIndex === scenes.length - 1`
- Delete: `scenes.length <= 1`

**Action Menu:**
- Move Up: `index === 0`
- Move Down: `index === actions.length - 1`

### Keyboard Navigation

- **Arrow Up/Down**: Navigate menu items
- **Arrow Right**: Open submenu
- **Arrow Left**: Close submenu
- **Enter/Space**: Activate item
- **Escape**: Close menu
- **Tab**: Move to next item

### Accessibility

- `role="menu"` on container
- `role="menuitem"` on items
- `aria-disabled="true"` on disabled items
- `aria-label` for icon-only items
- Focus trap within menu
- Focus management on submenu open/close

## Implementation Strategy

1. Add new context menu types to `renderMenuForType` switch
2. Create action functions for each menu type
3. Add `onContextMenu` handlers to dialogue, character, scene, action elements
4. Implement disabled item logic
5. Add keyboard navigation support
6. Add undo/redo integration
7. Test all menus and actions
8. Verify accessibility

## File Changes

- `mokha-suite PRO Vqr.html`:
  - Add context menu event handlers to dialogue/character/scene/action elements
  - Add action functions for all menu types
  - Add disabled item logic
  - Update `renderMenuForType` to handle new menu types
  - Integrate with undo/redo system
