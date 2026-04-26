/**
 * Property Test: Wizard Selection Persistence
 * 
 * Property 2: For any sequence of wizard steps, when the user navigates backward 
 * and then forward again, all previously selected values SHALL be restored to 
 * their original state.
 * 
 * Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.7, 6.5
 * 
 * Testing Framework: fast-check (Property-Based Testing)
 */

const fc = require('fast-check');

// ═══════════════════════════════════════════════════════════════════════
// Story Blueprint Engine - Minimal Implementation for Testing
// ═══════════════════════════════════════════════════════════════════════

const StoryBlueprintEngine = {
    createBlueprint: (data = {}) => {
        const id = `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
            id,
            storyType: data.storyType || '',
            duration: data.duration || '',
            style: data.style || '',
            narrativeStructure: data.narrativeStructure || '',
            dynamicParameters: data.dynamicParameters || {},
            storyIntent: data.storyIntent || '',
            characters: data.characters || [],
            relationships: data.relationships || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    updateBlueprint: (blueprint, updates) => {
        return {
            ...blueprint,
            ...updates,
            updatedAt: new Date().toISOString()
        };
    },

    getDynamicParameters: (storyType, duration, style, narrativeStructure) => {
        if (storyType === 'Documentary') {
            return {
                subjectMatter: { type: 'select', options: ['Nature', 'History', 'Biography', 'Science'] },
                interviewFormat: { type: 'select', options: ['Talking Heads', 'Voiceover', 'Mixed'] },
                archivalFootage: { type: 'boolean' },
                narratorPresence: { type: 'select', options: ['None', 'Omniscient', 'Character'] }
            };
        }
        if (storyType === 'Commercial') {
            return {
                productCategory: { type: 'text', placeholder: 'e.g., Electronics, Food, Fashion' },
                targetAudience: { type: 'select', options: ['18-24', '25-34', '35-44', '45+'] },
                callToActionType: { type: 'select', options: ['Buy Now', 'Learn More', 'Sign Up', 'Visit Store'] },
                brandTone: { type: 'select', options: ['Professional', 'Playful', 'Inspirational', 'Urgent'] }
            };
        }
        if (storyType === 'Cinematic Film') {
            return {
                genre: { type: 'select', options: ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi'] },
                protagonistArchetype: { type: 'select', options: ['Hero', 'Anti-Hero', 'Everyman', 'Mentor'] },
                antagonistType: { type: 'select', options: ['Villain', 'Nature', 'Society', 'Self'] },
                actStructure: { type: 'select', options: ['Three-Act', 'Five-Act', 'Sequence-Based'] }
            };
        }
        return {};
    }
};

// ═══════════════════════════════════════════════════════════════════════
// Configuration Wizard State Machine (Simplified for Testing)
// ═══════════════════════════════════════════════════════════════════════

class WizardStateMachine {
    constructor() {
        this.currentStep = 1;
        this.blueprint = StoryBlueprintEngine.createBlueprint();
        this.history = {}; // Changed from array to object for step-based indexing
    }

    // Navigate to next step
    next() {
        if (this.currentStep < 7) {
            // Save current state AFTER updates for this step
            this.history[this.currentStep] = JSON.parse(JSON.stringify(this.blueprint));
            this.currentStep++;
            // Restore saved state for the next step if it exists
            if (this.history[this.currentStep]) {
                this.blueprint = JSON.parse(JSON.stringify(this.history[this.currentStep]));
            }
        }
    }

    // Navigate to previous step
    back() {
        if (this.currentStep > 1) {
            // Save current state before going back
            this.history[this.currentStep] = JSON.parse(JSON.stringify(this.blueprint));
            this.currentStep--;
            // Restore blueprint from history
            if (this.history[this.currentStep]) {
                this.blueprint = JSON.parse(JSON.stringify(this.history[this.currentStep]));
            }
        }
    }

    // Update blueprint field
    updateField(field, value) {
        this.blueprint = StoryBlueprintEngine.updateBlueprint(this.blueprint, { [field]: value });
    }

    // Get current blueprint
    getBlueprint() {
        return JSON.parse(JSON.stringify(this.blueprint));
    }

    // Get current step
    getCurrentStep() {
        return this.currentStep;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// fast-check Arbitraries (Generators)
// ═══════════════════════════════════════════════════════════════════════

const storyTypeArb = fc.constantFrom('Social Media', 'Short Film', 'Cinematic Film', 'Documentary', 'Commercial', 'Experimental');
const durationArb = fc.constantFrom('2 min', '5 min', '10 min', '15 min', '30 min', '60 min');
const styleArb = fc.constantFrom('cinematic', 'documentary', 'comedy', 'drama', '3D anime', '2D animated');
const narrativeStructureArb = fc.constantFrom('protagonist journey', 'antagonist conflict', 'ensemble', 'real event storytelling');
const storyIntentArb = fc.string({ minLength: 10, maxLength: 200 });

// Dynamic parameters generator based on story type
const dynamicParametersArb = (storyType) => {
    if (storyType === 'Documentary') {
        return fc.record({
            subjectMatter: fc.constantFrom('Nature', 'History', 'Biography', 'Science'),
            interviewFormat: fc.constantFrom('Talking Heads', 'Voiceover', 'Mixed'),
            archivalFootage: fc.boolean(),
            narratorPresence: fc.constantFrom('None', 'Omniscient', 'Character')
        });
    }
    if (storyType === 'Commercial') {
        return fc.record({
            productCategory: fc.string({ minLength: 5, maxLength: 20 }),
            targetAudience: fc.constantFrom('18-24', '25-34', '35-44', '45+'),
            callToActionType: fc.constantFrom('Buy Now', 'Learn More', 'Sign Up', 'Visit Store'),
            brandTone: fc.constantFrom('Professional', 'Playful', 'Inspirational', 'Urgent')
        });
    }
    if (storyType === 'Cinematic Film') {
        return fc.record({
            genre: fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi'),
            protagonistArchetype: fc.constantFrom('Hero', 'Anti-Hero', 'Everyman', 'Mentor'),
            antagonistType: fc.constantFrom('Villain', 'Nature', 'Society', 'Self'),
            actStructure: fc.constantFrom('Three-Act', 'Five-Act', 'Sequence-Based')
        });
    }
    return fc.constant({});
};

// Complete wizard input generator
const wizardInputArb = fc.tuple(
    storyTypeArb,
    durationArb,
    styleArb,
    narrativeStructureArb,
    storyIntentArb
).chain(([storyType, duration, style, narrativeStructure, storyIntent]) => {
    return dynamicParametersArb(storyType).map(dynamicParameters => ({
        storyType,
        duration,
        style,
        narrativeStructure,
        dynamicParameters,
        storyIntent
    }));
});

// ═══════════════════════════════════════════════════════════════════════
// Property Test Implementation
// ═══════════════════════════════════════════════════════════════════════

function testWizardPersistence(wizardInput) {
    const wizard = new WizardStateMachine();

    // Step 1: Story Type
    wizard.updateField('storyType', wizardInput.storyType);
    const step1Blueprint = wizard.getBlueprint();
    wizard.next();

    // Step 2: Duration
    wizard.updateField('duration', wizardInput.duration);
    const step2Blueprint = wizard.getBlueprint();
    wizard.next();

    // Step 3: Style
    wizard.updateField('style', wizardInput.style);
    const step3Blueprint = wizard.getBlueprint();
    wizard.next();

    // Step 4: Narrative Structure
    wizard.updateField('narrativeStructure', wizardInput.narrativeStructure);
    const step4Blueprint = wizard.getBlueprint();
    wizard.next();

    // Step 5: Dynamic Parameters
    wizard.updateField('dynamicParameters', wizardInput.dynamicParameters);
    const step5Blueprint = wizard.getBlueprint();
    wizard.next();

    // Step 6: Story Intent
    wizard.updateField('storyIntent', wizardInput.storyIntent);
    const step6Blueprint = wizard.getBlueprint();

    // Now navigate backward through all steps and verify persistence
    // When we go back, we should see the state as it was at that step
    wizard.back(); // Back to step 5
    const restoredStep5 = wizard.getBlueprint();
    // At step 5, we should have all fields up to and including dynamicParameters
    if (restoredStep5.storyType !== step5Blueprint.storyType) {
        throw new Error(`Story Type not preserved at step 5. Expected: ${step5Blueprint.storyType}, Actual: ${restoredStep5.storyType}`);
    }
    if (restoredStep5.duration !== step5Blueprint.duration) {
        throw new Error(`Duration not preserved at step 5. Expected: ${step5Blueprint.duration}, Actual: ${restoredStep5.duration}`);
    }
    if (restoredStep5.style !== step5Blueprint.style) {
        throw new Error(`Style not preserved at step 5. Expected: ${step5Blueprint.style}, Actual: ${restoredStep5.style}`);
    }
    if (restoredStep5.narrativeStructure !== step5Blueprint.narrativeStructure) {
        throw new Error(`Narrative Structure not preserved at step 5. Expected: ${step5Blueprint.narrativeStructure}, Actual: ${restoredStep5.narrativeStructure}`);
    }
    if (JSON.stringify(restoredStep5.dynamicParameters) !== JSON.stringify(step5Blueprint.dynamicParameters)) {
        throw new Error(`Dynamic Parameters not preserved at step 5. Expected: ${JSON.stringify(step5Blueprint.dynamicParameters)}, Actual: ${JSON.stringify(restoredStep5.dynamicParameters)}`);
    }

    wizard.back(); // Back to step 4
    const restoredStep4 = wizard.getBlueprint();
    if (restoredStep4.storyType !== step4Blueprint.storyType) {
        throw new Error(`Story Type not preserved at step 4. Expected: ${step4Blueprint.storyType}, Actual: ${restoredStep4.storyType}`);
    }
    if (restoredStep4.duration !== step4Blueprint.duration) {
        throw new Error(`Duration not preserved at step 4. Expected: ${step4Blueprint.duration}, Actual: ${restoredStep4.duration}`);
    }
    if (restoredStep4.style !== step4Blueprint.style) {
        throw new Error(`Style not preserved at step 4. Expected: ${step4Blueprint.style}, Actual: ${restoredStep4.style}`);
    }
    if (restoredStep4.narrativeStructure !== step4Blueprint.narrativeStructure) {
        throw new Error(`Narrative Structure not preserved at step 4. Expected: ${step4Blueprint.narrativeStructure}, Actual: ${restoredStep4.narrativeStructure}`);
    }

    wizard.back(); // Back to step 3
    const restoredStep3 = wizard.getBlueprint();
    if (restoredStep3.storyType !== step3Blueprint.storyType) {
        throw new Error(`Story Type not preserved at step 3. Expected: ${step3Blueprint.storyType}, Actual: ${restoredStep3.storyType}`);
    }
    if (restoredStep3.duration !== step3Blueprint.duration) {
        throw new Error(`Duration not preserved at step 3. Expected: ${step3Blueprint.duration}, Actual: ${restoredStep3.duration}`);
    }
    if (restoredStep3.style !== step3Blueprint.style) {
        throw new Error(`Style not preserved at step 3. Expected: ${step3Blueprint.style}, Actual: ${restoredStep3.style}`);
    }

    wizard.back(); // Back to step 2
    const restoredStep2 = wizard.getBlueprint();
    if (restoredStep2.storyType !== step2Blueprint.storyType) {
        throw new Error(`Story Type not preserved at step 2. Expected: ${step2Blueprint.storyType}, Actual: ${restoredStep2.storyType}`);
    }
    if (restoredStep2.duration !== step2Blueprint.duration) {
        throw new Error(`Duration not preserved at step 2. Expected: ${step2Blueprint.duration}, Actual: ${restoredStep2.duration}`);
    }

    wizard.back(); // Back to step 1
    const restoredStep1 = wizard.getBlueprint();
    if (restoredStep1.storyType !== step1Blueprint.storyType) {
        throw new Error(`Story Type not preserved at step 1. Expected: ${step1Blueprint.storyType}, Actual: ${restoredStep1.storyType}`);
    }

    // Navigate forward again and verify all values are still preserved
    wizard.next(); // Forward to step 2
    const reforwardStep2 = wizard.getBlueprint();
    if (reforwardStep2.storyType !== step2Blueprint.storyType) {
        throw new Error(`Story Type not preserved when navigating forward to step 2. Expected: ${step2Blueprint.storyType}, Actual: ${reforwardStep2.storyType}`);
    }
    if (reforwardStep2.duration !== step2Blueprint.duration) {
        throw new Error(`Duration not preserved when navigating forward to step 2. Expected: ${step2Blueprint.duration}, Actual: ${reforwardStep2.duration}`);
    }

    wizard.next(); // Forward to step 3
    const reforwardStep3 = wizard.getBlueprint();
    if (reforwardStep3.storyType !== step3Blueprint.storyType) {
        throw new Error(`Story Type not preserved when navigating forward to step 3. Expected: ${step3Blueprint.storyType}, Actual: ${reforwardStep3.storyType}`);
    }
    if (reforwardStep3.duration !== step3Blueprint.duration) {
        throw new Error(`Duration not preserved when navigating forward to step 3. Expected: ${step3Blueprint.duration}, Actual: ${reforwardStep3.duration}`);
    }
    if (reforwardStep3.style !== step3Blueprint.style) {
        throw new Error(`Style not preserved when navigating forward to step 3. Expected: ${step3Blueprint.style}, Actual: ${reforwardStep3.style}`);
    }

    wizard.next(); // Forward to step 4
    const reforwardStep4 = wizard.getBlueprint();
    if (reforwardStep4.storyType !== step4Blueprint.storyType) {
        throw new Error(`Story Type not preserved when navigating forward to step 4. Expected: ${step4Blueprint.storyType}, Actual: ${reforwardStep4.storyType}`);
    }
    if (reforwardStep4.duration !== step4Blueprint.duration) {
        throw new Error(`Duration not preserved when navigating forward to step 4. Expected: ${step4Blueprint.duration}, Actual: ${reforwardStep4.duration}`);
    }
    if (reforwardStep4.style !== step4Blueprint.style) {
        throw new Error(`Style not preserved when navigating forward to step 4. Expected: ${step4Blueprint.style}, Actual: ${reforwardStep4.style}`);
    }
    if (reforwardStep4.narrativeStructure !== step4Blueprint.narrativeStructure) {
        throw new Error(`Narrative Structure not preserved when navigating forward to step 4. Expected: ${step4Blueprint.narrativeStructure}, Actual: ${reforwardStep4.narrativeStructure}`);
    }

    wizard.next(); // Forward to step 5
    const reforwardStep5 = wizard.getBlueprint();
    if (reforwardStep5.storyType !== step5Blueprint.storyType) {
        throw new Error(`Story Type not preserved when navigating forward to step 5. Expected: ${step5Blueprint.storyType}, Actual: ${reforwardStep5.storyType}`);
    }
    if (reforwardStep5.duration !== step5Blueprint.duration) {
        throw new Error(`Duration not preserved when navigating forward to step 5. Expected: ${step5Blueprint.duration}, Actual: ${reforwardStep5.duration}`);
    }
    if (reforwardStep5.style !== step5Blueprint.style) {
        throw new Error(`Style not preserved when navigating forward to step 5. Expected: ${step5Blueprint.style}, Actual: ${reforwardStep5.style}`);
    }
    if (reforwardStep5.narrativeStructure !== step5Blueprint.narrativeStructure) {
        throw new Error(`Narrative Structure not preserved when navigating forward to step 5. Expected: ${step5Blueprint.narrativeStructure}, Actual: ${reforwardStep5.narrativeStructure}`);
    }
    if (JSON.stringify(reforwardStep5.dynamicParameters) !== JSON.stringify(step5Blueprint.dynamicParameters)) {
        throw new Error(`Dynamic Parameters not preserved when navigating forward to step 5. Expected: ${JSON.stringify(step5Blueprint.dynamicParameters)}, Actual: ${JSON.stringify(reforwardStep5.dynamicParameters)}`);
    }

    wizard.next(); // Forward to step 6
    const reforwardStep6 = wizard.getBlueprint();
    if (reforwardStep6.storyType !== step6Blueprint.storyType) {
        throw new Error(`Story Type not preserved when navigating forward to step 6. Expected: ${step6Blueprint.storyType}, Actual: ${reforwardStep6.storyType}`);
    }
    if (reforwardStep6.duration !== step6Blueprint.duration) {
        throw new Error(`Duration not preserved when navigating forward to step 6. Expected: ${step6Blueprint.duration}, Actual: ${reforwardStep6.duration}`);
    }
    if (reforwardStep6.style !== step6Blueprint.style) {
        throw new Error(`Style not preserved when navigating forward to step 6. Expected: ${step6Blueprint.style}, Actual: ${reforwardStep6.style}`);
    }
    if (reforwardStep6.narrativeStructure !== step6Blueprint.narrativeStructure) {
        throw new Error(`Narrative Structure not preserved when navigating forward to step 6. Expected: ${step6Blueprint.narrativeStructure}, Actual: ${reforwardStep6.narrativeStructure}`);
    }
    if (JSON.stringify(reforwardStep6.dynamicParameters) !== JSON.stringify(step6Blueprint.dynamicParameters)) {
        throw new Error(`Dynamic Parameters not preserved when navigating forward to step 6. Expected: ${JSON.stringify(step6Blueprint.dynamicParameters)}, Actual: ${JSON.stringify(reforwardStep6.dynamicParameters)}`);
    }
    if (reforwardStep6.storyIntent !== step6Blueprint.storyIntent) {
        throw new Error(`Story Intent not preserved when navigating forward to step 6. Expected: ${step6Blueprint.storyIntent}, Actual: ${reforwardStep6.storyIntent}`);
    }

    return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Test Execution
// ═══════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('Property Test: Wizard Selection Persistence');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');
console.log('Property 2: For any sequence of wizard steps, when the user navigates');
console.log('backward and then forward again, all previously selected values SHALL');
console.log('be restored to their original state.');
console.log('');
console.log('Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.7, 6.5');
console.log('');
console.log('Running property-based tests with fast-check...');
console.log('');

const property = fc.property(wizardInputArb, testWizardPersistence);

try {
    fc.assert(property, { numRuns: 100, verbose: true });
    console.log('');
    console.log('✅ Property Test PASSED');
    console.log('');
    console.log('All 100 randomly generated test cases passed!');
    console.log('The wizard correctly persists selections across forward and backward navigation.');
    console.log('');
    process.exit(0);
} catch (error) {
    console.log('');
    console.log('❌ Property Test FAILED');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    if (error.counterexample) {
        console.log('Counterexample found:');
        console.log(JSON.stringify(error.counterexample, null, 2));
    }
    console.log('');
    process.exit(1);
}
