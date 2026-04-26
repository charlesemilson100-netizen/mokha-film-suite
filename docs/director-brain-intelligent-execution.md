# Director Brain: Intelligent Execution System

## Overview

Enhanced Director Brain with intelligent scene/shot resolution, automatic character management, and smart context awareness. The AI now understands project structure and automatically handles missing scenes, shots, and characters.

---

## Key Intelligence Features

### 1. Smart Scene/Shot Resolution
- **Auto-detects** scene and shot numbers from commands
- **Validates existence** of referenced scenes and shots
- **Auto-creates** missing scenes and shots when needed
- **Provides helpful errors** when references are invalid

### 2. Automatic Character Management
- **Detects character names** from dialogue commands
- **Checks character library** for existing characters
- **Auto-creates new characters** when not found
- **Saves to global character library** automatically

### 3. Context-Aware Execution
- **Understands project state** (scenes, shots, characters)
- **Makes intelligent defaults** (active scene, last shot)
- **Provides guided workflows** (create scene → create shot → add dialogue)
- **Handles edge cases** gracefully

---

## Enhanced Command Processing

### Dialogue Commands with Intelligence

**Command:** "add dialogue in scene 1 shot 1 jon says hello"

**AI Processing:**
1. ✅ **Parse scene number**: scene 1
2. ✅ **Validate scene exists**: Check if scene 1 exists
3. ✅ **Parse shot number**: shot 1  
4. ✅ **Validate shot exists**: Check if shot 1 exists in scene 1
5. ✅ **Extract character**: "jon"
6. ✅ **Check character library**: Look for "jon" in global characters
7. ✅ **Extract dialogue**: "hello"
8. ✅ **Generate action cards**:
   - Create character "Jon" (if not exists)
   - Add dialogue to scene 1, shot 1

**Smart Fallbacks:**
- If scene 1 doesn't exist → Create scene 1 first
- If shot 1 doesn't exist → Create shot 1 first  
- If character "Jon" doesn't exist → Create character automatically
- If no scenes exist → Create first scene

### Action Commands with Intelligence

**Command:** "add action in scene 2 shot 3 the door opens slowly"

**AI Processing:**
1. ✅ **Parse scene number**: scene 2
2. ✅ **Validate scene exists**: Check if scene 2 exists
3. ✅ **Parse shot number**: shot 3
4. ✅ **Validate shot exists**: Check if shot 3 exists in scene 2
5. ✅ **Extract action text**: "the door opens slowly"
6. ✅ **Generate action card**: Add action to scene 2, shot 3

**Smart Fallbacks:**
- If scene 2 doesn't exist → Error with helpful message
- If shot 3 doesn't exist → Create shot 3 in scene 2
- If no action text → Use default description

---

## New Command Categories

### Scene Management

#### Scene Naming
**Patterns:** `rename scene`, `change scene name`, `scene name`, `name scene`

**Examples:**
- "rename scene 1 to Opening Scene"
- "change scene name to Confrontation"
- "scene 2 name Kitchen Conversation"

#### Scene Headings
**Patterns:** `scene heading`, `set heading`, `int.`, `ext.`, `interior`, `exterior`

**Examples:**
- "scene heading INT. KITCHEN - DAY"
- "set heading EXT. PARK - NIGHT"
- "scene 1 heading interior office morning"

---

## Intelligent Error Handling

### Scene Not Found
```
Command: "add dialogue in scene 5 shot 1 mary says hello"
Scene 5 doesn't exist (project has 3 scenes)

Action Card Generated:
├─ Type: ERROR
├─ Label: Scene 5 not found
└─ Rationale: Scene 5 doesn't exist. Project has 3 scene(s). 
              Please specify a valid scene number.
```

### Shot Not Found (Auto-Create)
```
Command: "add dialogue in scene 1 shot 5 mary says hello"
Shot 5 doesn't exist in scene 1 (has 2 shots)

Action Card Generated:
├─ Type: ADD_SHOT
├─ Label: Create shot 5 in "Scene 1"
└─ Rationale: Shot 5 doesn't exist in "Scene 1". 
              Creating shot before adding dialogue.
```

### No Scenes Exist (Auto-Create)
```
Command: "add dialogue john says hello"
No scenes exist in project

Action Card Generated:
├─ Type: ADD_SCENE
├─ Label: Create first scene
└─ Rationale: No scenes exist. Creating first scene before adding dialogue.
```

---

## Character Management Intelligence

### Automatic Character Creation

**Command:** "add dialogue Sarah says I'm ready"

**Character Processing:**
1. **Extract name**: "Sarah"
2. **Check library**: Search global characters for "Sarah"
3. **Not found**: Character doesn't exist
4. **Auto-create**: Generate CREATE_CHARACTER action card
5. **Add dialogue**: Generate ADD_DIALOGUE action card

**Action Cards Generated:**
```
Card 1: CREATE_CHARACTER
├─ Label: Create character "Sarah"
├─ Rationale: Character "Sarah" not found in Character Library. Creating new character.
└─ Payload:
   ├─ characterName: "Sarah"
   ├─ role: "Character"
   ├─ description: "Character created from dialogue: 'I'm ready'"

Card 2: ADD_DIALOGUE  
├─ Label: Add dialogue: "Sarah" in "Scene 1" shot 1
├─ Rationale: Adding dialogue line for Sarah: "I'm ready"
└─ Payload:
   ├─ character: "Sarah"
   ├─ text: "I'm ready"
   └─ emotion: "Neutral"
```

### Character Existence Check

**Command:** "add dialogue John says hello" (John already exists)

**Character Processing:**
1. **Extract name**: "John"
2. **Check library**: Found "John" in global characters
3. **Skip creation**: Character exists, no need to create
4. **Add dialogue**: Generate ADD_DIALOGUE action card only

---

## Smart Defaults and Context

### Scene Selection Priority
1. **Explicit scene number**: "scene 2" → Use scene 2
2. **Active scene**: Use currently selected scene
3. **First scene**: Use first scene in project
4. **Create scene**: If no scenes exist

### Shot Selection Priority  
1. **Explicit shot number**: "shot 3" → Use shot 3
2. **Last shot**: Use last shot in scene
3. **Create shot**: If no shots exist in scene

### Character Name Extraction
**Patterns Recognized:**
- "John says hello" → Character: "John"
- "character: Sarah dialogue: hi" → Character: "Sarah"  
- "character John says hello" → Character: "John"
- "add dialogue Mary says goodbye" → Character: "Mary"

---

## Enhanced Action Types

### New Action Types Added

#### CREATE_CHARACTER
**Purpose**: Automatically create characters from dialogue
**Payload:**
```javascript
{
  characterName: "John",
  role: "Character", 
  appearance: "",
  description: "Character created from dialogue: 'hello'"
}
```

#### RENAME_SCENE
**Purpose**: Change scene names intelligently
**Payload:**
```javascript
{
  sceneId: "scene-123",
  newName: "Opening Scene"
}
```

#### SET_SCENE_HEADING
**Purpose**: Set screenplay-style scene headings
**Payload:**
```javascript
{
  sceneId: "scene-123",
  heading: "INT. KITCHEN - DAY",
  intExt: "INT",
  location: "KITCHEN", 
  timeOfDay: "DAY"
}
```

---

## Execution Flow Examples

### Example 1: Complete Dialogue Workflow

**Command:** "add dialogue in scene 1 shot 1 Emma says I can't believe this"

**Execution Steps:**
1. **Parse command**: scene=1, shot=1, character="Emma", text="I can't believe this"
2. **Validate scene 1**: ✅ Exists
3. **Validate shot 1**: ✅ Exists  
4. **Check character "Emma"**: ❌ Not found in library
5. **Generate action cards**:
   - CREATE_CHARACTER for "Emma"
   - ADD_DIALOGUE for Emma's line
6. **User confirms both cards**
7. **Execute CREATE_CHARACTER**: Emma added to character library
8. **Execute ADD_DIALOGUE**: Dialogue added to scene 1, shot 1
9. **Result**: Emma is now in character library + dialogue appears in shot

### Example 2: Missing Shot Auto-Creation

**Command:** "add action in scene 1 shot 5 camera pans left"

**Execution Steps:**
1. **Parse command**: scene=1, shot=5, action="camera pans left"
2. **Validate scene 1**: ✅ Exists
3. **Validate shot 5**: ❌ Scene 1 only has 2 shots
4. **Generate action card**: ADD_SHOT to create shot 5
5. **User confirms card**
6. **Execute ADD_SHOT**: Shot 5 created with action "camera pans left"
7. **Result**: Scene 1 now has shot 5 with the action description

### Example 3: Scene Heading Setup

**Command:** "scene 1 heading INT. COFFEE SHOP - MORNING"

**Execution Steps:**
1. **Parse command**: scene=1, heading="INT. COFFEE SHOP - MORNING"
2. **Extract components**: intExt="INT", location="COFFEE SHOP", timeOfDay="MORNING"
3. **Validate scene 1**: ✅ Exists
4. **Generate action card**: SET_SCENE_HEADING
5. **User confirms card**
6. **Execute SET_SCENE_HEADING**: Scene 1 gets screenplay heading
7. **Result**: Scene 1 now has proper screenplay format heading

---

## Pattern Recognition Intelligence

### Multi-Pattern Character Detection
```javascript
// All these patterns extract "John" as character name:
"John says hello"           → Character: "John"
"character: John hello"     → Character: "John"  
"character John says hi"    → Character: "John"
"add dialogue John says"    → Character: "John"
```

### Multi-Pattern Action Detection
```javascript
// All these patterns extract action text:
"add action the door opens"           → Action: "the door opens"
"add description camera pans left"    → Action: "camera pans left"
"action: character walks away"        → Action: "character walks away"
```

### Scene Heading Component Extraction
```javascript
// Automatic component detection:
"INT. KITCHEN - DAY"     → intExt="INT", location="KITCHEN", timeOfDay="DAY"
"exterior park night"    → intExt="EXT", location="PARK", timeOfDay="NIGHT"  
"interior office morning" → intExt="INT", location="OFFICE", timeOfDay="MORNING"
```

---

## Error Prevention & Recovery

### Validation Before Execution
- ✅ Scene exists before adding shots/dialogue
- ✅ Shot exists before adding dialogue/action
- ✅ Character name is valid before creation
- ✅ Scene name is provided before renaming

### Graceful Degradation
- **Missing scene** → Create scene first
- **Missing shot** → Create shot first
- **Missing character** → Create character automatically
- **Invalid reference** → Show helpful error with suggestions

### User Guidance
- **Clear error messages** with project state context
- **Suggested alternatives** when references fail
- **Step-by-step workflows** for complex operations
- **Undo support** for all operations

---

## Integration with Pro Script Builder

All intelligent features integrate seamlessly:

- ✅ **Character library** automatically updated
- ✅ **Scene structure** maintained correctly  
- ✅ **Shot order** preserved during auto-creation
- ✅ **Undo/redo** works for all operations
- ✅ **Real-time updates** in Pro Script Builder UI
- ✅ **Persistence** to localStorage
- ✅ **Export compatibility** with all formats

---

## Performance Optimizations

### Smart Caching
- Character library cached for fast lookups
- Scene/shot validation cached per command
- Project structure cached during command processing

### Efficient Updates
- Minimal re-renders during multi-step operations
- Batch character creation with dialogue addition
- Optimized scene/shot creation workflows

### Memory Management
- Cleanup of temporary command state
- Efficient action card generation
- Minimal memory footprint for intelligence features

---

## Future Intelligence Enhancements

### Planned Features
- **Location management** (auto-create locations from scene headings)
- **Prop tracking** (detect and manage props from action descriptions)
- **Continuity checking** (validate character presence across scenes)
- **Timeline management** (track day/night progression)
- **Character arc analysis** (suggest character development)

### Advanced AI Features
- **Natural language understanding** for complex commands
- **Context prediction** (suggest next logical actions)
- **Workflow automation** (complete scene templates)
- **Style consistency** (maintain visual/narrative style)
- **Collaborative intelligence** (multi-user project coordination)

---

## Summary

The enhanced Director Brain now provides:

🧠 **Intelligence**: Understands project structure and context
🔧 **Automation**: Auto-creates missing scenes, shots, characters  
🎯 **Precision**: Validates references and provides helpful errors
🚀 **Efficiency**: Streamlined workflows with smart defaults
📚 **Learning**: Adapts to project patterns and user preferences

This makes screenplay development significantly faster and more intuitive, allowing writers to focus on creativity while the AI handles the structural details.