# Director Brain Command Mode Implementation

## Overview
Added command mode to Director Brain, enabling direct manipulation commands alongside the existing analysis mode.

## Implementation Details

### 1. Intent Patterns (lines 2031-2150)
Added 4 new command categories to `INTENT_PATTERNS`:

- **command_add**: Patterns for "add scene", "create scene", "new shot", "insert shot", etc.
- **command_delete**: Patterns for "delete scene", "remove shot", "cut shot", etc.
- **command_rewrite**: Patterns for "rewrite scene", "change shot", "modify shot", etc.
- **command_reorder**: Patterns for "reorder", "move scene", "swap shot", etc.

### 2. Action Types (lines 2016-2027)
Added `DELETE_SCENE` to `ACTION_TYPES` constant (handler already existed in ExecutionEngine).

### 3. Command Handlers in buildActionCards() (lines 3280-3520)
Implemented command mode logic for each category:

#### command_add
- Parses scene/shot numbers and positions from user query
- Supports: "add scene", "add shot", "add scene after scene 2", "add shot before shot 3"
- Generates ADD_SCENE or ADD_SHOT action cards with parsed positions
- Defaults: scenes added at end, shots added at end of first scene

#### command_delete
- Parses scene/shot numbers from user query
- Supports: "delete scene 2", "delete shot 3", "remove shot 1 in scene 2"
- Generates DELETE_SCENE or DELETE_SHOT action cards
- Validates target exists before creating proposal

#### command_rewrite
- Parses scene/shot numbers and director styles from user query
- Supports: "rewrite shot 4", "rewrite scene 1 as Kubrick", "change shot 2 in Villeneuve style"
- Generates REWRITE_SHOT or APPLY_STYLE action cards
- Extracts director style from DIRECTOR_STYLES if mentioned

#### command_reorder
- Parses scene/shot numbers and target positions from user query
- Supports: "move shot 3 to position 1", "reorder shot 2 after shot 5", "move shot 1 before shot 4"
- Generates REORDER_SHOTS action cards with fromIndex and toIndex
- Defaults to moving to end if no position specified

## Query Parsing Logic

### Position Extraction
- `after scene/shot N` → position N (0-indexed)
- `before scene/shot N` → position N-1
- `at position N` → position N-1 (converts 1-indexed to 0-indexed)
- Default: end of list

### Scene/Shot Number Extraction
- Regex: `/scene\s+(\d+)/i` and `/shot\s+(\d+)/i`
- Converts 1-indexed user input to 0-indexed array positions

### Director Style Extraction
- Checks if any key from `DIRECTOR_STYLES` appears in query (case-insensitive)
- Passes style to REWRITE_SHOT or APPLY_STYLE payload

## Example Commands

### Add Commands
- "add scene" → ADD_SCENE at end
- "add scene after scene 2" → ADD_SCENE at position 2
- "add shot" → ADD_SHOT at end of first scene
- "add shot before shot 3 in scene 1" → ADD_SHOT at position 2 in scene 1

### Delete Commands
- "delete scene 2" → DELETE_SCENE for scene 2
- "delete shot 3" → DELETE_SHOT for shot 3 in first scene
- "remove shot 1 in scene 2" → DELETE_SHOT for shot 1 in scene 2

### Rewrite Commands
- "rewrite shot 4" → REWRITE_SHOT for shot 4
- "rewrite scene 1 as Kubrick" → APPLY_STYLE with Kubrick style to all shots in scene 1
- "change shot 2 in Villeneuve style" → REWRITE_SHOT with Villeneuve style

### Reorder Commands
- "move shot 3 to position 1" → REORDER_SHOTS from index 2 to index 0
- "reorder shot 2 after shot 5" → REORDER_SHOTS from index 1 to index 5
- "move shot 1 before shot 4" → REORDER_SHOTS from index 0 to index 3

## Mode Coexistence

Both analysis mode and command mode work together:

- **Analysis queries** (e.g., "check continuity", "analyze pacing") → generate analytical action cards with AI-driven suggestions
- **Command queries** (e.g., "add scene", "delete shot 3") → generate direct manipulation action cards with parsed parameters
- Intent parser automatically routes to correct category based on query patterns
- No mode switching required — Director Brain intelligently detects intent

## Testing

To test command mode:
1. Open Director Brain panel
2. Try commands like:
   - "add scene"
   - "delete shot 2"
   - "rewrite shot 1 as Kubrick"
   - "move shot 3 to position 1"
3. Verify action cards appear with correct labels and payloads
4. Confirm/reject action cards to apply changes

## Files Modified
- `mokha-suite PRO Vqr.html`:
  - Lines 2016-2027: Added DELETE_SCENE to ACTION_TYPES
  - Lines 2031-2150: Added command intent patterns
  - Lines 3280-3520: Added command mode handlers in buildActionCards()
