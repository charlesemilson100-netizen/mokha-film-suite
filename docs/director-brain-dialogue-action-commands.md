# Director Brain: Dialogue & Action Commands

## Overview

Extended Director Brain command mode to support screenplay editing with dialogue and action management. You can now use natural language commands to add, edit, and manage dialogue lines and action descriptions directly from the Director Brain panel.

---

## New Action Types

### 1. ADD_DIALOGUE
Adds a new dialogue line with character name to a shot.

**Payload:**
```javascript
{
  shotId: 'shot-id',
  character: 'Character Name',
  text: 'Dialogue text',
  emotion: 'Neutral' // or other emotions
}
```

### 2. ADD_ACTION
Adds action/description text to a shot's subject field.

**Payload:**
```javascript
{
  shotId: 'shot-id',
  actionText: 'Action description'
}
```

### 3. EDIT_DIALOGUE
Edits an existing dialogue line in a shot.

**Payload:**
```javascript
{
  shotId: 'shot-id',
  dialogueIndex: 0, // which dialogue line to edit
  character: 'Character Name', // optional, keeps existing if not provided
  text: 'Updated dialogue text'
}
```

### 4. EDIT_ACTION
Replaces the action/description text in a shot.

**Payload:**
```javascript
{
  shotId: 'shot-id',
  actionText: 'Updated action description'
}
```

### 5. DELETE_DIALOGUE
Removes a dialogue line from a shot.

**Payload:**
```javascript
{
  shotId: 'shot-id',
  dialogueIndex: 0 // which dialogue line to delete
}
```

---

## New Intent Categories

### command_dialogue
Patterns: `add dialogue`, `add dialog`, `add line`, `character says`, `dialogue for`, etc.

**Examples:**
- "add dialogue John says hello"
- "character: Sarah dialogue: I'm ready"
- "add line to shot 3"

### command_action
Patterns: `add action`, `add description`, `add scene description`, `describe action`, etc.

**Examples:**
- "add action: the door opens slowly"
- "add description to shot 2"
- "action: camera pans left"

### command_edit_dialogue
Patterns: `edit dialogue`, `change dialog`, `modify dialogue`, `rewrite dialogue`, etc.

**Examples:**
- "edit dialogue in shot 1 to say goodbye"
- "change John's line to hello world"
- "modify dialogue 1 in scene 2"

### command_edit_action
Patterns: `edit action`, `change description`, `modify action`, `update description`, etc.

**Examples:**
- "edit action in shot 3 to camera zooms in"
- "change description to fade to black"
- "update action: character walks away"

---

## Command Examples

### Adding Dialogue

**Command:** "add dialogue John says hello world"
```
Action Card:
├─ Type: ADD_DIALOGUE
├─ Label: Add dialogue: "John" in shot 1
├─ Rationale: Adding dialogue line for John: "hello world"
└─ Payload:
   ├─ character: "John"
   ├─ text: "hello world"
   └─ emotion: "Neutral"
```

**Command:** "character: Sarah dialogue: I'm ready in scene 1 shot 2"
```
Action Card:
├─ Type: ADD_DIALOGUE
├─ Label: Add dialogue: "Sarah" in shot 2
├─ Rationale: Adding dialogue line for Sarah: "I'm ready"
└─ Payload:
   ├─ character: "Sarah"
   ├─ text: "I'm ready"
   └─ emotion: "Neutral"
```

### Adding Action

**Command:** "add action the door opens slowly"
```
Action Card:
├─ Type: ADD_ACTION
├─ Label: Add action to shot 1
├─ Rationale: Adding action description: "the door opens slowly"
└─ Payload:
   └─ actionText: "the door opens slowly"
```

**Command:** "add description to shot 3 camera pans left"
```
Action Card:
├─ Type: ADD_ACTION
├─ Label: Add action to shot 3
├─ Rationale: Adding action description: "camera pans left"
└─ Payload:
   └─ actionText: "camera pans left"
```

### Editing Dialogue

**Command:** "edit dialogue in shot 1 John says goodbye"
```
Action Card:
├─ Type: EDIT_DIALOGUE
├─ Label: Edit dialogue in shot 1
├─ Rationale: Updating dialogue to: "goodbye"
└─ Payload:
   ├─ dialogueIndex: 0
   ├─ character: "John"
   ├─ text: "goodbye"
```

**Command:** "change Sarah's line to I'm not ready in scene 2"
```
Action Card:
├─ Type: EDIT_DIALOGUE
├─ Label: Edit dialogue in shot 1
├─ Rationale: Updating dialogue to: "I'm not ready"
└─ Payload:
   ├─ character: "Sarah"
   ├─ text: "I'm not ready"
```

### Editing Action

**Command:** "edit action in shot 2 to camera zooms in"
```
Action Card:
├─ Type: EDIT_ACTION
├─ Label: Edit action in shot 2
├─ Rationale: Updating action to: "camera zooms in"
└─ Payload:
   └─ actionText: "camera zooms in"
```

**Command:** "change description to fade to black"
```
Action Card:
├─ Type: EDIT_ACTION
├─ Label: Edit action in shot 1
├─ Rationale: Updating action to: "fade to black"
└─ Payload:
   └─ actionText: "fade to black"
```

---

## Query Parsing Logic

### Character Name Extraction
- Pattern: `([A-Z][a-z]+)(?:\s+says|\s*:)`
- Examples:
  - "John says hello" → character: "John"
  - "Sarah: I'm ready" → character: "Sarah"
  - "character: Emma dialogue: ..." → character: "Emma"

### Dialogue Text Extraction
- Pattern: `says\s+["']?([^"']+)["']?` or `:\s+["']?([^"']+)["']?`
- Examples:
  - "says hello world" → text: "hello world"
  - ": I'm ready" → text: "I'm ready"
  - 'says "goodbye"' → text: "goodbye"

### Action Text Extraction
- Pattern: `(?:action|description)\s*:?\s+["']?([^"']+)["']?`
- Examples:
  - "action: door opens" → text: "door opens"
  - "description camera pans" → text: "camera pans"
  - "add action the light fades" → text: "the light fades"

### Scene/Shot Number Extraction
- Pattern: `/scene\s+(\d+)/i` and `/shot\s+(\d+)/i`
- Defaults:
  - If no scene specified: uses first scene
  - If no shot specified: uses last shot in scene

---

## Execution Flow

```
User Command
    ↓
IntentParser detects category (command_dialogue, command_action, etc.)
    ↓
buildActionCards parses character, text, scene, shot numbers
    ↓
Creates action proposal with extracted parameters
    ↓
DirectorBrainPanel displays action card
    ↓
User clicks [Confirm]
    ↓
ExecutionEngine.validate() checks shot exists
    ↓
ExecutionEngine.apply() updates shot data:
    • ADD_DIALOGUE: appends to shot.dialogues array
    • ADD_ACTION: appends to shot.subject field
    • EDIT_DIALOGUE: updates dialogues[index]
    • EDIT_ACTION: replaces shot.subject
    • DELETE_DIALOGUE: removes from dialogues array
    ↓
Pro Script Builder re-renders with updated shot
    ↓
Action card shows green checkmark ✓
```

---

## Data Structure

### Shot with Dialogue
```javascript
{
  id: 'shot-1',
  subject: 'The door opens slowly',
  selections: { /* camera, lighting, etc */ },
  dialogues: [
    {
      character: 'John',
      text: 'Hello world',
      emotion: 'Neutral'
    },
    {
      character: 'Sarah',
      text: 'I\'m ready',
      emotion: 'Determined'
    }
  ],
  sfx: '',
  bgm: '',
  mode: 'video',
  status: 'Planning',
  tags: [],
  referenceImages: [],
  customPromptOverride: null
}
```

---

## Usage Scenarios

### Scenario 1: Building a Scene with Dialogue

1. **Add scene:** "add scene"
   - Creates new scene

2. **Add shot:** "add shot"
   - Adds shot to scene

3. **Add action:** "add action the character enters the room"
   - Sets shot description

4. **Add dialogue:** "add dialogue John says hello"
   - Adds first dialogue line

5. **Add more dialogue:** "add dialogue Sarah says hi there"
   - Adds second dialogue line

6. **Edit dialogue:** "edit dialogue John says goodbye"
   - Updates first dialogue line

### Scenario 2: Refining Existing Shots

1. **View current shot:** Shot 3 has action "camera pans left"

2. **Update action:** "edit action in shot 3 to camera zooms in"
   - Changes action to "camera zooms in"

3. **Add dialogue:** "add dialogue to shot 3 Emma says I see it"
   - Adds dialogue to shot 3

4. **Edit dialogue:** "change Emma's line to I understand"
   - Updates Emma's dialogue

### Scenario 3: Multi-Character Scene

1. **Add dialogue:** "add dialogue John says are you ready"
   - John's line added

2. **Add dialogue:** "add dialogue Sarah says I'm ready"
   - Sarah's line added

3. **Add dialogue:** "add dialogue John says let's go"
   - John's second line added

4. **Edit dialogue:** "edit dialogue 2 Sarah says absolutely ready"
   - Updates Sarah's line (dialogue index 1)

---

## Validation Rules

### ADD_DIALOGUE
- ✓ Shot must exist
- ✓ Character name required (defaults to "Character")
- ✓ Dialogue text required

### ADD_ACTION
- ✓ Shot must exist
- ✓ Action text required
- ✓ Appends to existing subject (doesn't replace)

### EDIT_DIALOGUE
- ✓ Shot must exist
- ✓ Dialogue index must be valid (0 to dialogues.length-1)
- ✓ Character or text must be provided

### EDIT_ACTION
- ✓ Shot must exist
- ✓ Action text required
- ✓ Replaces entire subject field

### DELETE_DIALOGUE
- ✓ Shot must exist
- ✓ Dialogue index must be valid

---

## Integration with Pro Script Builder

All dialogue and action changes are:
- ✅ Immediately visible in Pro Script Builder
- ✅ Persistent (saved to localStorage)
- ✅ Undoable (history saved before each action)
- ✅ Reflected in shot editor when opened
- ✅ Included in screenplay exports

---

## Future Enhancements

Potential additions:
- Emotion/tone detection for dialogue
- Character consistency checking
- Dialogue formatting (parentheticals, action beats)
- Multi-character conversation templates
- Dialogue history and versioning
- Character voice/accent notes
- Subtext and motivation tracking
- Screenplay format compliance

---

## Files Modified

- `mokha-suite PRO Vqr.html`:
  - Lines 2016-2030: Added 5 new action types to ACTION_TYPES
  - Lines 2031-2180: Added 5 new intent categories
  - Lines 3280-3750: Added 5 new command handlers in buildActionCards()
  - Lines 3008-3100: Added 5 new case handlers in ExecutionEngine.apply()
