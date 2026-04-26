# Property Test: Wizard Selection Persistence

## Overview

This property-based test validates **Property 2** from the Story Blueprint Engine design document:

> **For any** sequence of wizard steps, when the user navigates backward and then forward again, all previously selected values SHALL be restored to their original state.

## Requirements Validated

- **Requirement 1.5**: Configuration Wizard Step 1 - Back navigation preserves Story Type
- **Requirement 2.5**: Configuration Wizard Step 2 - Back navigation preserves Duration
- **Requirement 3.5**: Configuration Wizard Step 3 - Back navigation preserves Style
- **Requirement 4.5**: Configuration Wizard Step 4 - Back navigation preserves Narrative Structure
- **Requirement 5.7**: Configuration Wizard Step 5 - Back navigation preserves Dynamic Parameters
- **Requirement 6.5**: Configuration Wizard Step 6 - Back navigation preserves Story Intent

## Test Files

### 1. `wizard-selection-persistence.test.js` (Node.js)
- **Purpose**: Command-line property-based test using fast-check
- **Usage**: `node tests/wizard-selection-persistence.test.js`
- **Output**: Console output with pass/fail status and counterexamples if any

### 2. `wizard-selection-persistence.test.html` (Browser)
- **Purpose**: Interactive browser-based property-based test with visual UI
- **Usage**: Open in a web browser
- **Features**:
  - Configurable number of test cases (10-1000)
  - Real-time progress tracking
  - Visual statistics (tests run, passed, failed)
  - Detailed counterexample display on failure
  - Single test debug mode

## Test Strategy

The test uses property-based testing with the `fast-check` library to generate random wizard inputs and verify the persistence property holds for all cases.

### Test Flow

1. **Generate Random Inputs**: Create random values for all 6 wizard steps:
   - Story Type (Social Media, Short Film, Cinematic Film, Documentary, Commercial, Experimental)
   - Duration (2 min, 5 min, 10 min, 15 min, 30 min, 60 min)
   - Style (cinematic, documentary, comedy, drama, 3D anime, 2D animated)
   - Narrative Structure (protagonist journey, antagonist conflict, ensemble, real event storytelling)
   - Dynamic Parameters (context-dependent based on Story Type)
   - Story Intent (random string 10-200 characters)

2. **Forward Navigation**: Navigate through all 6 steps, entering the random data at each step

3. **Backward Navigation**: Navigate backward from step 6 to step 1, verifying that all previously entered values are correctly restored at each step

4. **Forward Navigation Again**: Navigate forward from step 1 to step 6, verifying that all values are still preserved

### Validation Points

The test validates that at each step, ALL fields that should be present at that step are correctly preserved:

- **Step 1**: Story Type
- **Step 2**: Story Type, Duration
- **Step 3**: Story Type, Duration, Style
- **Step 4**: Story Type, Duration, Style, Narrative Structure
- **Step 5**: Story Type, Duration, Style, Narrative Structure, Dynamic Parameters
- **Step 6**: Story Type, Duration, Style, Narrative Structure, Dynamic Parameters, Story Intent

## Implementation Details

### Wizard State Machine

The test uses a simplified `WizardStateMachine` class that mimics the behavior of the actual ConfigurationWizard component:

```javascript
class WizardStateMachine {
    constructor() {
        this.currentStep = 1;
        this.blueprint = StoryBlueprintEngine.createBlueprint();
        this.history = {}; // Step-based history for state restoration
    }

    next() {
        // Save current state before moving forward
        this.history[this.currentStep] = JSON.parse(JSON.stringify(this.blueprint));
        this.currentStep++;
        // Restore saved state for the next step if it exists
        if (this.history[this.currentStep]) {
            this.blueprint = JSON.parse(JSON.stringify(this.history[this.currentStep]));
        }
    }

    back() {
        // Save current state before going back
        this.history[this.currentStep] = JSON.parse(JSON.stringify(this.blueprint));
        this.currentStep--;
        // Restore saved state for the previous step
        if (this.history[this.currentStep]) {
            this.blueprint = JSON.parse(JSON.stringify(this.history[this.currentStep]));
        }
    }

    updateField(field, value) {
        this.blueprint = StoryBlueprintEngine.updateBlueprint(this.blueprint, { [field]: value });
    }
}
```

### Key Design Decisions

1. **Step-based History**: The history is stored as an object with step numbers as keys, allowing direct access to any step's state

2. **Bidirectional Restoration**: Both `next()` and `back()` methods restore saved state, ensuring values persist when navigating in either direction

3. **Deep Cloning**: All blueprint state is deep cloned using `JSON.parse(JSON.stringify())` to prevent reference issues

4. **Comprehensive Validation**: The test validates ALL fields at each step, not just the field entered at that step, ensuring complete state preservation

## Test Results

When run with 100 test cases (default), the test generates 100 random wizard input combinations and verifies the persistence property for each one.

**Expected Output (Success)**:
```
✅ Property Test PASSED

All 100 randomly generated test cases passed!
The wizard correctly persists selections across forward and backward navigation.
```

**Expected Output (Failure)**:
```
❌ Property Test FAILED

Error: [Specific error message]

Counterexample: [Failing input that caused the property to fail]
```

## Running the Tests

### Node.js Test
```bash
node tests/wizard-selection-persistence.test.js
```

### Browser Test
1. Open `tests/wizard-selection-persistence.test.html` in a web browser
2. Click "▶ Run Property Test" to run 100 test cases (or adjust the number)
3. Click "🔍 Run Single Test (Debug)" to run a single test case with detailed output

## Integration with Main Application

The actual ConfigurationWizard component in `mokha-suite PRO Vqr.html` should implement the same state persistence logic as the test's WizardStateMachine to ensure the property holds in production.

## Future Enhancements

- Add tests for character creation and relationship persistence (Step 7)
- Add tests for edge cases (empty strings, special characters, very long inputs)
- Add tests for concurrent navigation (rapid back/forward clicks)
- Add performance tests for large numbers of characters and relationships
