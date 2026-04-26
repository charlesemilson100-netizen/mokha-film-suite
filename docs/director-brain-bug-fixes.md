# Director Brain Bug Fixes

## Issues Resolved

### Issue 1: Intent Pattern Matching Order
**Problem**: Commands like "add dialogue" and "add action" were not being recognized correctly. They were falling back to the default guidance text instead of generating action cards.

**Root Cause**: The `INTENT_PATTERNS` array had the general `command_add` patterns (like "add shot", "add scene") before the specific dialogue and action patterns. Since the IntentParser stops at the first match, "add dialogue" was matching "add" from the general patterns instead of the specific dialogue patterns.

**Fix**: Reordered `INTENT_PATTERNS` to put specific patterns before general ones:
```javascript
// BEFORE (incorrect order):
command_add: ['add scene', 'add shot', ...]
command_dialogue: ['add dialogue', ...]
command_action: ['add action', ...]

// AFTER (correct order):
command_dialogue: ['add dialogue', ...]
command_action: ['add action', ...]
command_add: ['add scene', 'add shot', ...]
```

### Issue 2: Missing Validation Cases
**Problem**: ExecutionEngine was throwing "Unknown action type" errors for the new dialogue and action commands.

**Root Cause**: The `ExecutionEngine.validate()` method was missing validation cases for the new action types: `ADD_DIALOGUE`, `ADD_ACTION`, `EDIT_DIALOGUE`, `EDIT_ACTION`, `DELETE_DIALOGUE`.

**Fix**: Added validation cases for all new action types:
```javascript
case 'ADD_DIALOGUE': {
    if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
    if (!payload.character || !payload.text) return { valid: false, reason: 'ADD_DIALOGUE requires character and text.' };
    return { valid: true };
}
case 'ADD_ACTION': {
    if (!findShot(payload.shotId)) return { valid: false, reason: `Shot "${payload.shotId}" not found.` };
    if (!payload.actionText) return { valid: false, reason: 'ADD_ACTION requires actionText.' };
    return { valid: true };
}
// ... etc for all new action types
```

---

## Test Cases Now Working

### Dialogue Commands
✅ "add dialogue John says hello"
✅ "add dialogue in scene 6 shot 1 rer says hello broh"
✅ "character: Sarah dialogue: I'm ready"
✅ "edit dialogue John says goodbye"

### Action Commands
✅ "add action the door opens slowly"
✅ "add action in scene 6 shot 1"
✅ "edit action to camera zooms in"
✅ "add description camera pans left"

### Scene/Shot Commands (still working)
✅ "add scene"
✅ "add shot"
✅ "delete scene 2"
✅ "rewrite shot 1 as Kubrick"

---

## Pattern Matching Priority

The new pattern order ensures correct matching:

1. **Specific dialogue patterns** (`command_dialogue`)
   - "add dialogue", "character says", etc.

2. **Specific action patterns** (`command_action`)
   - "add action", "add description", etc.

3. **Specific edit patterns** (`command_edit_dialogue`, `command_edit_action`)
   - "edit dialogue", "edit action", etc.

4. **General add patterns** (`command_add`)
   - "add scene", "add shot", etc.

5. **Other command patterns** (`command_delete`, `command_rewrite`, etc.)

6. **Analysis patterns** (`pacing`, `coverage`, `continuity`, etc.)

---

## Validation Rules Added

### ADD_DIALOGUE
- ✓ Shot must exist
- ✓ Character name required
- ✓ Dialogue text required

### ADD_ACTION
- ✓ Shot must exist
- ✓ Action text required

### EDIT_DIALOGUE
- ✓ Shot must exist
- ✓ Dialogue index must be valid (within bounds)

### EDIT_ACTION
- ✓ Shot must exist
- ✓ Action text required

### DELETE_DIALOGUE
- ✓ Shot must exist
- ✓ Dialogue index must be valid (within bounds)

---

## Files Modified

### mokha-suite PRO Vqr.html

**Lines 2030-2180**: Reordered INTENT_PATTERNS
- Moved `command_dialogue` and `command_action` before `command_add`
- Removed duplicate pattern definitions
- Ensured specific patterns match before general ones

**Lines 2750-2820**: Added validation cases in ExecutionEngine.validate()
- Added validation for all 5 new action types
- Proper error messages for each validation failure
- Bounds checking for dialogue indices

---

## Testing Results

### Before Fix
```
Command: "add dialogue John says hello"
Result: "I understand you're asking about 'add dialogue'... Try asking me about director styles..."
Status: ❌ Not recognized as command
```

### After Fix
```
Command: "add dialogue John says hello"
Result: Action card generated
  - Type: ADD_DIALOGUE
  - Label: Add dialogue: "John" in shot 1
  - Payload: { character: "John", text: "hello", emotion: "Neutral" }
Status: ✅ Working correctly
```

### Before Fix
```
Command: "add action the door opens"
Action Card: Generated correctly
Execution: "Unknown action type 'ADD_ACTION'"
Status: ❌ Validation failed
```

### After Fix
```
Command: "add action the door opens"
Action Card: Generated correctly
Execution: Successfully applied to shot
Status: ✅ Working correctly
```

---

## Prevention Measures

### Pattern Order Guidelines
1. **Most specific patterns first**: Exact phrase matches
2. **Moderately specific patterns**: Partial phrase matches
3. **General patterns last**: Single word matches

### Validation Completeness
1. **Every new action type** must have validation case
2. **Required fields** must be checked
3. **Bounds checking** for array indices
4. **Existence checking** for referenced entities

### Testing Protocol
1. **Test pattern matching** for each new command category
2. **Test validation** for each new action type
3. **Test execution** end-to-end for each command
4. **Test error cases** (missing shots, invalid indices, etc.)

---

## Future Considerations

### Pattern Conflicts
- Monitor for new patterns that might conflict with existing ones
- Use more specific regex patterns when needed
- Consider pattern priority documentation

### Validation Consistency
- Ensure all action types have consistent validation patterns
- Standardize error message formats
- Add validation for optional fields when appropriate

### Performance
- Pattern matching is O(n) where n = number of patterns
- Consider optimization if pattern list grows significantly
- Current performance is acceptable for ~50 patterns

---

## Summary

Both issues have been resolved:

1. ✅ **Intent recognition fixed** - Dialogue and action commands now properly recognized
2. ✅ **Validation added** - All new action types properly validated
3. ✅ **End-to-end working** - Commands generate action cards and execute successfully
4. ✅ **Error handling** - Proper error messages for validation failures

The Director Brain now fully supports dialogue and action management commands as designed.