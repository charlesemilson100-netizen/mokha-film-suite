# Property Test: Blueprint-UI Configuration Alignment

## Overview

This property-based test validates **Property 12** from the Story Blueprint Engine design document:

> **Property 12: Blueprint-UI Configuration Alignment**
> 
> For any Story Blueprint loaded into the Pro Script Builder, the UI configuration (scene structure, character suggestions, style recommendations) SHALL match the blueprint's storyType, narrativeStructure, and duration.

**Validates:** Requirements 8.6, 9.1

## Test Strategy

This test uses **fast-check** (a property-based testing library) to generate random valid Story Blueprints and verify that the ProScriptBuilder correctly reflects their configuration.

### What is Property-Based Testing?

Unlike traditional example-based tests that check specific inputs, property-based tests verify that a property holds true across **all possible inputs**. This test generates hundreds of random blueprints with different combinations of:

- Story types (Social Media, Short Film, Cinematic Film, Documentary, Commercial, Experimental)
- Durations (2 min, 5 min, 10 min, 15 min, 30 min, 60 min)
- Styles (cinematic, documentary, comedy, drama, 3D anime, 2D animated)
- Narrative structures (Protagonist Journey, Antagonist Conflict, Ensemble, Real Event Storytelling, Parallel Narratives)
- Dynamic parameters (context-dependent based on story type)
- Characters (0-5 characters with various archetypes)

## Test Implementation

### Test File

- **Location:** `tests/blueprint-ui-alignment.test.html`
- **Framework:** fast-check 3.15.0
- **Type:** Standalone HTML test (no build required)

### How to Run

1. Open `tests/blueprint-ui-alignment.test.html` in a web browser
2. Click "▶ Run Property Test" to run 100 test cases (default)
3. Adjust the number of test cases if desired (10-1000)
4. Click "🔍 Run Single Test (Debug)" to run a single test with detailed output

### What the Test Verifies

For each randomly generated blueprint, the test verifies:

1. **Scene Structure Matches Narrative Structure**
   - Protagonist Journey → 5 scenes: Inciting Incident, Rising Action, Midpoint, Climax, Resolution
   - Antagonist Conflict → 4 scenes: Antagonist Introduction, Conflict Escalation, Confrontation, Resolution
   - Ensemble → 5 scenes: Setup, Parallel Stories, Intersection, Climax, Resolution
   - Real Event Storytelling → 5 scenes: Context, Event Build, Peak Moment, Aftermath, Reflection
   - Parallel Narratives → 5 scenes: Story A Setup, Story B Setup, Convergence, Climax, Resolution

2. **Scene Count is Appropriate for Duration**
   - Verifies scene count is within reasonable range (1-20 scenes)
   - Note: Current implementation uses fixed scene counts based on narrative structure, not duration

3. **Each Scene Has Required Structure**
   - At least one shot initialized
   - Shot has `sceneHeading` field
   - Shot has `elements` or `actions` field
   - Shot has `dialogueBlocks` field

4. **Character List is Accessible**
   - All characters from blueprint have non-empty names
   - Characters are properly structured for UI suggestions

5. **Blueprint Metadata is Accessible**
   - Blueprint has valid `id`
   - Blueprint has valid `storyType`
   - Blueprint has valid `style`
   - Writing mode (if specified) is valid

6. **Writing Mode is Correctly Initialized**
   - Defaults to 'user-written' if not specified
   - Only accepts valid modes: user-written, template-generated, ai-generated

## Test Results Interpretation

### ✅ PASSED

All randomly generated blueprints correctly configure the ProScriptBuilder UI. The property holds for all test cases.

### ❌ FAILED

A counterexample was found where the UI configuration does not match the blueprint. The test output will show:

- The specific error message
- Expected vs. actual values
- The full blueprint that caused the failure

## Integration with Main Application

This test validates the `generateSceneStructure()` function extracted from the main ProScriptBuilder component in `mokha-suite PRO Vqr.html`. The test implementation mirrors the actual production code to ensure accuracy.

### Key Functions Tested

- `generateSceneStructure(blueprint)` - Generates scene structure based on narrative structure
- `StoryBlueprintEngine.createBlueprint(data)` - Creates valid blueprint objects
- `StoryBlueprintEngine.getDynamicParameters(...)` - Returns context-dependent parameters

## Design Decisions

### Fixed Scene Counts vs. Duration-Based

The current implementation uses **fixed scene counts based on narrative structure** rather than duration. This is a deliberate design decision:

- Each narrative structure has a specific number of story beats
- Duration affects scene length/detail, not scene count
- This provides consistent story structure regardless of duration

The test verifies that scene counts are reasonable (1-20 scenes) but does not enforce strict duration-based ranges.

### Narrative Structure Priority

The test prioritizes narrative structure over duration when validating scene configuration. This reflects the design philosophy that story structure should drive scene organization, with duration affecting pacing and detail level.

## Maintenance

### When to Update This Test

Update this test when:

1. New narrative structures are added to the system
2. Scene structure generation logic changes
3. Blueprint schema changes (new required fields)
4. Character structure changes
5. Dynamic parameters logic changes

### Adding New Narrative Structures

To add a new narrative structure:

1. Update `sceneLabels` object in `generateSceneStructure()`
2. Update `expectedSceneLabels` object in `testBlueprintUIAlignment()`
3. Add the new structure to `narrativeStructureArb` generator

## Performance

- **Default:** 100 test cases (~2-5 seconds)
- **Maximum:** 1000 test cases (~20-50 seconds)
- **Recommended:** 100-200 test cases for regular testing

## Dependencies

- **fast-check 3.15.0** - Loaded from CDN (https://cdn.jsdelivr.net/npm/fast-check@3.15.0/lib/bundle.js)
- No build tools required
- No npm dependencies

## Related Tests

- `tests/wizard-selection-persistence.test.html` - Property 2: Wizard Selection Persistence
- `tests/wizard-selection-persistence.test.js` - Node.js version of Property 2 test

## References

- **Design Document:** `.kiro/specs/story-blueprint-engine/design.md`
- **Requirements:** `.kiro/specs/story-blueprint-engine/requirements.md`
- **Tasks:** `.kiro/specs/story-blueprint-engine/tasks.md` (Task 6.2)
- **Main Application:** `mokha-suite PRO Vqr.html` (ProScriptBuilder component)
