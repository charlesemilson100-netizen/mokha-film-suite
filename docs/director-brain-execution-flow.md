# Director Brain Command Execution Flow

## Answer: Where Actions Execute

**Actions execute directly in the Pro Script Builder state**, not in a separate prompt editor. The Director Brain panel is a **control interface** that generates action cards, but when you confirm an action, it modifies the actual project data (scenes, shots) in the Pro Script Builder.

---

## Complete Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                       │
│    Director Brain Panel (Liquid Glass UI)                          │
│    User types: "add scene" or "delete shot 3"                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. INTENT PARSING                                                   │
│    IntentParser.parse(query, projectSnapshot)                      │
│    • Matches query against INTENT_PATTERNS                         │
│    • Returns: { category: 'command_add', rawQuery: '...' }        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. ACTION CARD GENERATION                                           │
│    AgenticResponseBuilder.buildActionCards(intent, snapshot, log)  │
│    • Parses scene/shot numbers from query                          │
│    • Extracts positions (after/before/at)                          │
│    • Generates action proposal object:                             │
│      {                                                              │
│        id: 'unique-id',                                            │
│        type: 'ADD_SCENE',                                          │
│        label: 'Add new scene at position 3',                       │
│        rationale: 'Creating a new scene...',                       │
│        targetSceneId: null,                                        │
│        targetShotId: null,                                         │
│        payload: { position: 2 },                                   │
│        status: 'pending'                                           │
│      }                                                              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. DISPLAY ACTION CARD                                              │
│    DirectorBrainPanel renders action card in chat                  │
│    • Shows label: "Add new scene at position 3"                    │
│    • Shows rationale: "Creating a new scene..."                    │
│    • Shows [Confirm] and [Reject] buttons                          │
│    • Status: 'pending' (yellow border)                             │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. USER CONFIRMS ACTION                                             │
│    User clicks [Confirm] button                                    │
│    handleConfirmAction(proposal, messageIndex) is called           │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. VALIDATION                                                       │
│    ExecutionEngine.validate(proposal, appActions)                  │
│    • Checks if scene/shot exists                                   │
│    • Validates position bounds                                     │
│    • Returns: { valid: true } or { valid: false, reason: '...' }  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. SAVE HISTORY (UNDO POINT)                                       │
│    appActions.saveToHistory()                                      │
│    • Saves current project state to history stack                  │
│    • Enables undo functionality                                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. EXECUTE ACTION                                                   │
│    ExecutionEngine.apply(proposal, appActions)                     │
│    • Calls appActions.updateActiveProjectScenes(updater)           │
│    • updater function modifies scenes array                        │
│    • Example for ADD_SCENE:                                        │
│      updateActiveProjectScenes(prev => [                           │
│        ...prev.slice(0, position),                                 │
│        newScene,                                                   │
│        ...prev.slice(position)                                     │
│      ])                                                             │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. UPDATE PRO SCRIPT BUILDER STATE                                 │
│    updateActiveProjectScenes() function                            │
│    • Calls setProjects() to update React state                     │
│    • Updates the active project's scenes array                     │
│    • Triggers React re-render of Pro Script Builder UI             │
│                                                                     │
│    setProjects(prev => prev.map(p => {                             │
│      if (p.id === activeProjectId)                                 │
│        return { ...p, scenes: updatedScenes };                     │
│      return p;                                                     │
│    }))                                                              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. UI UPDATE                                                       │
│     • Pro Script Builder re-renders with new scenes/shots          │
│     • Scene list updates (new scene appears)                       │
│     • Shot list updates (new/deleted/reordered shots appear)       │
│     • Action card status changes to 'applied' (green checkmark)    │
│     • Session log updated with applied action                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Director Brain Panel (UI Layer)
- **Location**: Liquid Glass floating panel
- **Purpose**: User interface for commands and action cards
- **File**: `mokha-suite PRO Vqr.html` (lines 9670-10200)
- **Does NOT execute actions** — only displays them

### 2. ExecutionEngine (Business Logic Layer)
- **Location**: Core engine module
- **Purpose**: Validates and applies actions to project state
- **File**: `mokha-suite PRO Vqr.html` (lines 2658-2980)
- **Methods**:
  - `validate()`: Checks if action is valid
  - `apply()`: Executes action by calling appActions

### 3. appActions (State Management Layer)
- **Location**: Main app state management
- **Purpose**: Updates React state for Pro Script Builder
- **File**: `mokha-suite PRO Vqr.html` (lines 16348-16355)
- **Key function**: `updateActiveProjectScenes(scenesUpdater)`
  - Saves history (undo point)
  - Updates `projects` state
  - Triggers React re-render

### 4. Pro Script Builder (Data Layer)
- **Location**: Main application state
- **Purpose**: Stores all project data (scenes, shots, characters)
- **State structure**:
  ```javascript
  projects: [
    {
      id: 'project-1',
      name: 'My Film',
      scenes: [
        {
          id: 'scene-1',
          name: 'Scene 1 - Opening',
          shots: [
            { id: 'shot-1', subject: '...', selections: {...} },
            { id: 'shot-2', subject: '...', selections: {...} }
          ]
        }
      ]
    }
  ]
  ```

---

## Example: "add scene" Command Flow

```
User types: "add scene"
    ↓
IntentParser: category = 'command_add'
    ↓
buildActionCards: Creates ADD_SCENE proposal
    {
      type: 'ADD_SCENE',
      payload: { position: 3 },  // add at end
      label: 'Add new scene at position 4'
    }
    ↓
DirectorBrainPanel: Displays action card with [Confirm] button
    ↓
User clicks [Confirm]
    ↓
ExecutionEngine.validate: Checks position is valid (0-3) ✓
    ↓
appActions.saveToHistory: Saves undo point
    ↓
ExecutionEngine.apply: Calls updateActiveProjectScenes
    ↓
updateActiveProjectScenes: Updates projects state
    prev.scenes = [scene1, scene2, scene3]
    new.scenes = [scene1, scene2, scene3, newScene]
    ↓
React re-renders Pro Script Builder
    ↓
New scene appears in scene list!
Action card shows green checkmark ✓
```

---

## Important Notes

### 1. Direct State Modification
- Actions modify the **actual project data** in Pro Script Builder
- Changes are **immediate and persistent** (saved to localStorage)
- **Undo is available** via history stack (saveToHistory)

### 2. No Separate Editor
- There is **no separate prompt editor** for Director Brain
- Director Brain is a **control panel** that manipulates the main project
- Think of it as a **smart assistant** that edits your script for you

### 3. Action Card Workflow
- **Pending** (yellow): Action proposed, waiting for user confirmation
- **Applied** (green): Action executed, changes visible in Pro Script Builder
- **Rejected** (gray): Action dismissed, no changes made
- **Error** (red): Action failed validation or execution

### 4. Session Log
- Tracks all applied/rejected actions
- Prevents duplicate proposals
- Used for analysis and debugging

---

## Comparison: Director Brain vs Manual Editing

### Manual Editing (Traditional)
```
User → Pro Script Builder UI → Click "Add Scene" button → Scene added
```

### Director Brain (AI-Assisted)
```
User → Director Brain Panel → Type "add scene" → Confirm action card → Scene added
                                                                          ↓
                                                    (Same result as manual editing)
```

**Key Difference**: Director Brain provides an **AI-powered natural language interface** to the same underlying Pro Script Builder state management system.

---

## Testing the Flow

To verify the execution flow:

1. **Open Pro Script Builder** (Pro Mode)
2. **Note current scene count** (e.g., 3 scenes)
3. **Open Director Brain panel** (click Director Brain FAB)
4. **Type command**: "add scene"
5. **Observe action card** appears with "Add new scene at position 4"
6. **Click [Confirm]**
7. **Verify**:
   - Action card turns green with checkmark
   - Scene list in Pro Script Builder shows 4 scenes
   - New scene appears at the end
   - Undo button is enabled (history saved)

---

## Summary

**Where do actions execute?**
→ **In the Pro Script Builder state** (the main project data)

**What does Director Brain do?**
→ **Generates action proposals** and **executes them via ExecutionEngine**

**Is there a separate editor?**
→ **No** — Director Brain modifies the same project data you see in Pro Script Builder

**Can I undo actions?**
→ **Yes** — every action saves a history point before execution
