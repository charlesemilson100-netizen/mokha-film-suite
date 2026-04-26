# Property Test: Character Reference Validity

## Overview

This property-based test validates **Property 15** from the Story Blueprint Engine design document:

> **Property 15: Character Reference Validity**
> 
> For any script document, all character names referenced in dialogue blocks SHALL correspond to characters defined in the Story_Blueprint or added by the user in the Pro Script Builder.

**Validates: Requirement 9.2**

## What This Test Does

This test ensures that the character reference validation system correctly identifies when dialogue blocks reference characters that are not defined in the Story Blueprint. It uses property-based testing to generate hundreds of random scripts with various character configurations and verifies that:

1. **Valid scripts pass validation** - Scripts where all dialogue character names match defined characters are correctly identified as valid
2. **Invalid scripts fail validation** - Scripts with undefined character references are correctly flagged
3. **Case-insensitive matching works** - Character names are matched case-insensitively (e.g., "JOHN", "John", "john" all match)
4. **Both formats are supported** - The validator works with both the new `elements` array format and the legacy `dialogueBlocks` format

## Test Structure

### Unit Tests

The test includes three focused unit tests:

1. **Valid Script Test** - Verifies that a script with all characters properly defined passes validation
2. **Invalid Script Test** - Verifies that a script with an undefined character is correctly flagged
3. **Case-Insensitive Test** - Verifies that character name matching is case-insensitive

### Property-Based Tests

The property-based test generates random test cases with:

- **1-8 characters** with unique names
- **1-5 scenes** per script
- **1-5 shots** per scene
- **0-5 elements** per shot (mix of action and dialogue)
- **0-3 dialogue blocks** per shot (legacy format)

For each generated script, the test verifies that the validator correctly identifies whether all character references are valid.

## Running the Tests

### Node.js (Command Line)

```bash
node tests/character-reference-validity.test.js
```

This will run:
- 3 unit tests
- 100 property-based test cases (configurable)

### Browser (HTML)

Open `tests/character-reference-validity.test.html` in a web browser.

The HTML version provides:
- Interactive test controls
- Visual progress tracking
- Detailed test results
- Debug mode for single test case inspection

## Test Implementation Details

### Data Structures

The test validates scripts with the following structure:

```javascript
{
  id: "script-123",
  blueprintId: "blueprint-456",
  title: "Test Script",
  author: "Test Author",
  scenes: [
    {
      id: "scene-1",
      label: "Inciting Incident",
      shots: [
        {
          id: "shot-1",
          sceneHeading: "INT. COFFEE SHOP - DAY",
          elements: [
            {
              id: "elem-1",
              type: "dialogue",
              characterName: "JOHN",
              parenthetical: "nervously",
              dialogue: "Hello, Sarah."
            }
          ],
          dialogueBlocks: [
            {
              id: "db-1",
              characterName: "SARAH",
              parenthetical: "smiling",
              dialogue: "Hi, John!",
              source: "user-written"
            }
          ]
        }
      ]
    }
  ]
}
```

### Validation Logic

The `CharacterReferenceValidator` performs the following checks:

1. **Collect defined characters** - Extract all character names from the blueprint (case-insensitive)
2. **Scan dialogue blocks** - Check both `elements` array and `dialogueBlocks` array
3. **Validate references** - Ensure each character name in dialogue exists in the defined characters set
4. **Report invalid references** - Return detailed information about any undefined character references

### Generator Strategy

The test uses `fast-check` arbitraries to generate:

- **Character names** - Mix of common names and random uppercase strings
- **Character objects** - Complete character definitions with all required fields
- **Dialogue elements** - Mix of valid (defined) and potentially invalid (random) character names
- **Script structures** - Complete scripts with nested scenes, shots, and dialogue

The generator ensures:
- Unique character names within each blueprint
- At least one character is always defined
- Both valid and invalid character references are generated to test both paths

## Expected Behavior

### Valid Scripts

Scripts where all dialogue character names match defined characters should:
- Return `{ valid: true, invalidReferences: [], definedCharacters: [...] }`
- Pass validation without errors

### Invalid Scripts

Scripts with undefined character references should:
- Return `{ valid: false, invalidReferences: [...], definedCharacters: [...] }`
- Include detailed location information for each invalid reference
- Specify the exact character name that is undefined

### Case Sensitivity

Character name matching should be case-insensitive:
- Blueprint defines "John"
- Script uses "JOHN", "john", or "John"
- All variations should be considered valid

## Integration with Pro Script Builder

This validation is used in the Pro Script Builder to:

1. **Real-time validation** - Flag undefined character references as the user types
2. **Export validation** - Prevent export of scripts with invalid character references
3. **Prompt conversion** - Ensure all characters are defined before converting to prompts
4. **Character suggestions** - Suggest defined characters when adding dialogue

## Test Coverage

This test validates:

- ✅ Valid character references are accepted
- ✅ Invalid character references are rejected
- ✅ Case-insensitive matching works correctly
- ✅ Both new and legacy dialogue formats are supported
- ✅ Multiple characters per script are handled
- ✅ Multiple scenes and shots are handled
- ✅ Empty scripts (no dialogue) are handled
- ✅ Scripts with no defined characters are handled

## Dependencies

- **fast-check** (v3.15.0+) - Property-based testing framework
- **Node.js** (v14+) - For command-line execution

## Related Files

- `tests/character-reference-validity.test.js` - Node.js test implementation
- `tests/character-reference-validity.test.html` - Browser-based test interface
- `.kiro/specs/story-blueprint-engine/design.md` - Property 15 definition
- `.kiro/specs/story-blueprint-engine/requirements.md` - Requirement 9.2 definition

## Future Enhancements

Potential improvements to this test:

1. **Character relationship validation** - Verify that character relationships reference valid characters
2. **Character arc validation** - Ensure character arcs reference defined characters
3. **Typo detection** - Suggest similar character names when an undefined name is used
4. **Auto-correction** - Automatically add undefined characters to the blueprint
5. **Performance testing** - Test validation performance with large scripts (100+ scenes)
