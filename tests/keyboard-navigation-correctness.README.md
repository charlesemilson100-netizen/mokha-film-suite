# Property Test: Keyboard Navigation Correctness

## Overview

This property-based test validates **Property 13** from the Story Blueprint Engine design document:

> **Property 13: Keyboard Navigation Correctness**
> 
> For any sequence of Tab/Enter key presses in the Pro Script Builder, the focus SHALL move to the next appropriate field in the correct order (Scene_Heading → Action_Line → Character_Name → Parenthetical → Dialogue).

**Validates: Requirement 9.6**

## Test Strategy

This test uses property-based testing (via fast-check) to generate random:

1. **Script structures** with varying numbers of scenes (1-5) and shots per scene (1-3)
2. **Key sequences** of varying lengths (5-50 keys) containing:
   - `Tab` - Move to next field
   - `Enter` - Move to next field (same as Tab in script editor)
   - `Shift+Tab` - Move to previous field

The test verifies that:

1. **Forward navigation** (Tab/Enter) moves focus to the next field in sequence
2. **Backward navigation** (Shift+Tab) moves focus to the previous field
3. **Field order** within each shot follows the expected pattern:
   - Scene Heading → Action Line → Character Name → Parenthetical → Dialogue
4. **Field type progression** is correct (no backward jumps within a shot)

## Expected Field Order

Within each shot, fields must appear in this order:

1. **Scene Heading** - Location and time (e.g., "INT. COFFEE SHOP - DAY")
2. **Action Line** - Narrative description of what happens
3. **Character Name** - Name of speaking character (uppercase)
4. **Parenthetical** - Actor direction (e.g., "(nervously)")
5. **Dialogue** - Spoken words

## Test Implementation

### ScriptEditor Class

The test implements a simplified `ScriptEditor` class that:

- Maintains a list of fields in order
- Tracks the currently focused field
- Provides methods for keyboard navigation:
  - `pressTab()` - Move forward
  - `pressEnter()` - Move forward (same as Tab)
  - `pressShiftTab()` - Move backward

### Property Test

The property test:

1. Generates a random script structure
2. Generates a random key sequence
3. Simulates the key presses
4. Verifies that navigation follows the expected order
5. Checks that field types progress correctly

### Verification Logic

For each navigation action:

- **Tab/Enter**: Verify field index increases by 1
- **Shift+Tab**: Verify field index decreases by 1
- **Field type order**: Verify types follow the expected sequence within each shot
- **Boundary conditions**: Handle navigation at start/end of field list

## Running the Test

### Browser

1. Open `tests/keyboard-navigation-correctness.test.html` in a web browser
2. Click "▶ Run Property Test" to run 100 test cases (default)
3. Adjust the number of test cases if desired
4. Click "🔍 Run Single Test (Debug)" to run a single test case with detailed output

### Command Line

```bash
# Open in default browser
start tests/keyboard-navigation-correctness.test.html

# Or use a specific browser
chrome tests/keyboard-navigation-correctness.test.html
firefox tests/keyboard-navigation-correctness.test.html
```

## Test Output

### Success

When all tests pass, you'll see:

- ✅ Property Test PASSED
- Total tests run
- Test coverage summary

### Failure

When a test fails, you'll see:

- ❌ Property Test FAILED
- Error message describing the failure
- Counterexample with:
  - Script structure that caused the failure
  - Key sequence that triggered the issue
  - Current and next field details

## Example Counterexample

If the test finds a bug, it might show:

```json
{
  "message": "Tab navigation incorrect: moved from index 2 to 4 (expected 3)",
  "scriptStructure": {
    "numScenes": 2,
    "shotsPerScene": 2
  },
  "keySequence": ["Tab", "Tab", "Tab", "Enter"],
  "currentField": {
    "type": "action",
    "sceneId": "scene-0",
    "shotId": "shot-0-0"
  },
  "nextField": {
    "type": "parenthetical",
    "sceneId": "scene-0",
    "shotId": "shot-0-0"
  }
}
```

This indicates that pressing Tab skipped the "characterName" field.

## Integration with Pro Script Builder

This test validates the keyboard navigation logic that should be implemented in the actual Pro Script Builder component. The expected behavior is:

1. When a user presses Tab or Enter in any field, focus moves to the next field
2. When a user presses Shift+Tab, focus moves to the previous field
3. Fields are ordered according to screenplay conventions
4. Navigation wraps across shots and scenes

## Test Coverage

The test covers:

- ✅ Forward navigation (Tab/Enter)
- ✅ Backward navigation (Shift+Tab)
- ✅ Field order verification
- ✅ Multiple scenes and shots
- ✅ Boundary conditions (start/end of field list)
- ✅ Field type progression within shots

## Dependencies

- **fast-check** v3.15.0 (loaded from CDN)
- Modern web browser with JavaScript support

## Related Tests

- `wizard-selection-persistence.test.html` - Tests wizard state persistence
- `blueprint-ui-alignment.test.html` - Tests blueprint-UI configuration alignment

## Notes

- This is a **property-based test**, not a unit test. It generates many random test cases to find edge cases.
- The test uses a simplified model of the ScriptEditor. The actual implementation may have additional complexity.
- The test assumes the field order is fixed. If the Pro Script Builder allows custom field ordering, this test would need to be updated.
