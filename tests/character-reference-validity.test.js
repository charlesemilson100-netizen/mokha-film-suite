/**
 * Property Test: Character Reference Validity
 * 
 * Property 15: For any script document, all character names referenced in dialogue 
 * blocks SHALL correspond to characters defined in the Story_Blueprint or added by 
 * the user in the Pro Script Builder.
 * 
 * Validates: Requirement 9.2
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
    }
};

const ScriptEngine = {
    createScript: (blueprintId, data = {}) => {
        const id = `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
            id,
            blueprintId,
            title: data.title || 'Untitled Script',
            author: data.author || '',
            scenes: data.scenes || [],
            metadata: {
                pageCount: 0,
                estimatedRuntime: 0,
                wordCount: 0,
                lastModified: new Date().toISOString(),
                writingMode: 'user-written'
            }
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════
// Character Reference Validator
// ═══════════════════════════════════════════════════════════════════════

const CharacterReferenceValidator = {
    /**
     * Validates that all character names in dialogue blocks exist in the blueprint
     * @param {Object} script - The script document
     * @param {Object} blueprint - The story blueprint
     * @returns {Object} - { valid: boolean, invalidReferences: Array }
     */
    validate: (script, blueprint) => {
        const definedCharacters = new Set();
        
        // Collect all defined character names (case-insensitive)
        if (blueprint.characters && Array.isArray(blueprint.characters)) {
            blueprint.characters.forEach(char => {
                if (char.name) {
                    definedCharacters.add(char.name.toUpperCase());
                }
            });
        }
        
        const invalidReferences = [];
        
        // Check all dialogue blocks in the script
        if (script.scenes && Array.isArray(script.scenes)) {
            script.scenes.forEach((scene, sceneIndex) => {
                if (scene.shots && Array.isArray(scene.shots)) {
                    scene.shots.forEach((shot, shotIndex) => {
                        // Check new format (elements array)
                        if (shot.elements && Array.isArray(shot.elements)) {
                            shot.elements.forEach((element, elementIndex) => {
                                if (element.type === 'dialogue' && element.characterName) {
                                    const charNameUpper = element.characterName.toUpperCase();
                                    if (!definedCharacters.has(charNameUpper)) {
                                        invalidReferences.push({
                                            sceneIndex,
                                            shotIndex,
                                            elementIndex,
                                            characterName: element.characterName,
                                            location: `Scene ${sceneIndex + 1}, Shot ${shotIndex + 1}, Element ${elementIndex + 1}`
                                        });
                                    }
                                }
                            });
                        }
                        
                        // Check old format (dialogueBlocks array) for backward compatibility
                        if (shot.dialogueBlocks && Array.isArray(shot.dialogueBlocks)) {
                            shot.dialogueBlocks.forEach((db, dbIndex) => {
                                if (db.characterName) {
                                    const charNameUpper = db.characterName.toUpperCase();
                                    if (!definedCharacters.has(charNameUpper)) {
                                        invalidReferences.push({
                                            sceneIndex,
                                            shotIndex,
                                            dialogueBlockIndex: dbIndex,
                                            characterName: db.characterName,
                                            location: `Scene ${sceneIndex + 1}, Shot ${shotIndex + 1}, Dialogue ${dbIndex + 1}`
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
        
        return {
            valid: invalidReferences.length === 0,
            invalidReferences,
            definedCharacters: Array.from(definedCharacters)
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════
// fast-check Arbitraries (Generators)
// ═══════════════════════════════════════════════════════════════════════

// Generate character names
const characterNameArb = fc.oneof(
    fc.constantFrom('JOHN', 'SARAH', 'MIKE', 'EMMA', 'DAVID', 'LISA', 'ALEX', 'MARIA'),
    fc.string({ minLength: 3, maxLength: 15 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A'))
);

// Generate a character object
const characterArb = fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => `char-${s}`),
    name: characterNameArb,
    archetype: fc.constantFrom('Protagonist', 'Antagonist', 'Mentor', 'Love Interest', 'Sidekick'),
    age: fc.oneof(fc.integer({ min: 18, max: 80 }), fc.constant('')),
    role: fc.string({ minLength: 5, maxLength: 30 }),
    description: fc.string({ minLength: 10, maxLength: 100 })
});

// Generate a dialogue element (new format)
const dialogueElementArb = (characterNames) => {
    return fc.record({
        id: fc.string({ minLength: 5, maxLength: 10 }).map(s => `element-${s}`),
        type: fc.constant('dialogue'),
        characterName: fc.oneof(
            fc.constantFrom(...characterNames), // Valid character
            fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()) // Potentially invalid
        ),
        parenthetical: fc.oneof(fc.constant(''), fc.constantFrom('beat', 'whispers', 'shouting', 'nervously')),
        dialogue: fc.string({ minLength: 10, maxLength: 100 })
    });
};

// Generate an action element (new format)
const actionElementArb = fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => `element-${s}`),
    type: fc.constant('action'),
    text: fc.string({ minLength: 10, maxLength: 150 })
});

// Generate a dialogue block (old format for backward compatibility)
const dialogueBlockArb = (characterNames) => {
    return fc.record({
        id: fc.string({ minLength: 5, maxLength: 10 }).map(s => `dialogue-${s}`),
        characterName: fc.oneof(
            fc.constantFrom(...characterNames), // Valid character
            fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()) // Potentially invalid
        ),
        parenthetical: fc.oneof(fc.constant(''), fc.constantFrom('beat', 'whispers', 'shouting', 'nervously')),
        dialogue: fc.string({ minLength: 10, maxLength: 100 }),
        source: fc.constantFrom('user-written', 'template', 'ai-generated')
    });
};

// Generate a shot with both new and old formats
const shotArb = (characterNames) => {
    return fc.record({
        id: fc.string({ minLength: 5, maxLength: 10 }).map(s => `shot-${s}`),
        sceneHeading: fc.string({ minLength: 10, maxLength: 50 }).map(s => `INT. ${s.toUpperCase()} - DAY`),
        actions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 0, maxLength: 3 }),
        // New format: elements array
        elements: fc.array(
            fc.oneof(
                actionElementArb,
                dialogueElementArb(characterNames)
            ),
            { minLength: 0, maxLength: 5 }
        ),
        // Old format: dialogueBlocks array (for backward compatibility)
        dialogueBlocks: fc.array(dialogueBlockArb(characterNames), { minLength: 0, maxLength: 3 })
    });
};

// Generate a scene
const sceneArb = (characterNames) => {
    return fc.record({
        id: fc.string({ minLength: 5, maxLength: 10 }).map(s => `scene-${s}`),
        label: fc.constantFrom('Inciting Incident', 'Rising Action', 'Midpoint', 'Climax', 'Resolution'),
        shots: fc.array(shotArb(characterNames), { minLength: 1, maxLength: 5 })
    });
};

// Generate a complete story blueprint with characters
const blueprintWithCharactersArb = fc.array(characterArb, { minLength: 1, maxLength: 8 }).chain(characters => {
    // Ensure unique character names
    const uniqueChars = [];
    const seenNames = new Set();
    characters.forEach(char => {
        const upperName = char.name.toUpperCase();
        if (!seenNames.has(upperName)) {
            seenNames.add(upperName);
            uniqueChars.push(char);
        }
    });
    
    return fc.constant({
        blueprint: StoryBlueprintEngine.createBlueprint({
            storyType: 'Cinematic Film',
            duration: '30 min',
            style: 'cinematic',
            narrativeStructure: 'protagonist journey',
            storyIntent: 'Test story intent',
            characters: uniqueChars
        }),
        characterNames: uniqueChars.map(c => c.name)
    });
});

// Generate a script with scenes that reference characters
const scriptWithCharactersArb = blueprintWithCharactersArb.chain(({ blueprint, characterNames }) => {
    return fc.array(sceneArb(characterNames), { minLength: 1, maxLength: 5 }).map(scenes => {
        const script = ScriptEngine.createScript(blueprint.id, {
            title: 'Test Script',
            author: 'Test Author',
            scenes
        });
        return { blueprint, script };
    });
});

// ═══════════════════════════════════════════════════════════════════════
// Property Test Implementation
// ═══════════════════════════════════════════════════════════════════════

function testCharacterReferenceValidity({ blueprint, script }) {
    const result = CharacterReferenceValidator.validate(script, blueprint);
    
    // Collect all character names used in the script
    const usedCharacterNames = new Set();
    
    if (script.scenes && Array.isArray(script.scenes)) {
        script.scenes.forEach(scene => {
            if (scene.shots && Array.isArray(scene.shots)) {
                scene.shots.forEach(shot => {
                    // New format
                    if (shot.elements && Array.isArray(shot.elements)) {
                        shot.elements.forEach(element => {
                            if (element.type === 'dialogue' && element.characterName) {
                                usedCharacterNames.add(element.characterName.toUpperCase());
                            }
                        });
                    }
                    // Old format
                    if (shot.dialogueBlocks && Array.isArray(shot.dialogueBlocks)) {
                        shot.dialogueBlocks.forEach(db => {
                            if (db.characterName) {
                                usedCharacterNames.add(db.characterName.toUpperCase());
                            }
                        });
                    }
                });
            }
        });
    }
    
    // Get defined character names
    const definedCharacterNames = new Set(
        (blueprint.characters || []).map(c => c.name.toUpperCase())
    );
    
    // Check if all used characters are defined
    const allUsedCharactersDefined = Array.from(usedCharacterNames).every(name => 
        definedCharacterNames.has(name)
    );
    
    // The validation result should match our manual check
    if (allUsedCharactersDefined && !result.valid) {
        throw new Error(
            `Validator incorrectly reported invalid references.\n` +
            `Defined characters: ${Array.from(definedCharacterNames).join(', ')}\n` +
            `Used characters: ${Array.from(usedCharacterNames).join(', ')}\n` +
            `Invalid references reported: ${JSON.stringify(result.invalidReferences)}`
        );
    }
    
    if (!allUsedCharactersDefined && result.valid) {
        throw new Error(
            `Validator failed to detect invalid character references.\n` +
            `Defined characters: ${Array.from(definedCharacterNames).join(', ')}\n` +
            `Used characters: ${Array.from(usedCharacterNames).join(', ')}`
        );
    }
    
    // Verify that invalid references are correctly identified
    if (!result.valid) {
        result.invalidReferences.forEach(ref => {
            const refNameUpper = ref.characterName.toUpperCase();
            if (definedCharacterNames.has(refNameUpper)) {
                throw new Error(
                    `Validator incorrectly flagged '${ref.characterName}' as invalid at ${ref.location}.\n` +
                    `This character is defined in the blueprint.`
                );
            }
        });
    }
    
    return true;
}

// Test case: Valid script with all characters defined
function testValidScript() {
    const blueprint = StoryBlueprintEngine.createBlueprint({
        characters: [
            { id: 'char-1', name: 'JOHN', archetype: 'Protagonist', age: 30, role: 'Hero', description: 'Main character' },
            { id: 'char-2', name: 'SARAH', archetype: 'Love Interest', age: 28, role: 'Love Interest', description: 'Love interest' }
        ]
    });
    
    const script = ScriptEngine.createScript(blueprint.id, {
        scenes: [
            {
                id: 'scene-1',
                label: 'Inciting Incident',
                shots: [
                    {
                        id: 'shot-1',
                        sceneHeading: 'INT. COFFEE SHOP - DAY',
                        actions: [],
                        elements: [
                            { id: 'elem-1', type: 'dialogue', characterName: 'JOHN', parenthetical: '', dialogue: 'Hello, Sarah.' },
                            { id: 'elem-2', type: 'dialogue', characterName: 'SARAH', parenthetical: 'smiling', dialogue: 'Hi, John!' }
                        ],
                        dialogueBlocks: []
                    }
                ]
            }
        ]
    });
    
    const result = CharacterReferenceValidator.validate(script, blueprint);
    
    if (!result.valid) {
        throw new Error(`Valid script was incorrectly flagged as invalid: ${JSON.stringify(result.invalidReferences)}`);
    }
    
    return true;
}

// Test case: Invalid script with undefined character
function testInvalidScript() {
    const blueprint = StoryBlueprintEngine.createBlueprint({
        characters: [
            { id: 'char-1', name: 'JOHN', archetype: 'Protagonist', age: 30, role: 'Hero', description: 'Main character' }
        ]
    });
    
    const script = ScriptEngine.createScript(blueprint.id, {
        scenes: [
            {
                id: 'scene-1',
                label: 'Inciting Incident',
                shots: [
                    {
                        id: 'shot-1',
                        sceneHeading: 'INT. COFFEE SHOP - DAY',
                        actions: [],
                        elements: [
                            { id: 'elem-1', type: 'dialogue', characterName: 'JOHN', parenthetical: '', dialogue: 'Hello, Sarah.' },
                            { id: 'elem-2', type: 'dialogue', characterName: 'SARAH', parenthetical: 'smiling', dialogue: 'Hi, John!' } // SARAH not defined
                        ],
                        dialogueBlocks: []
                    }
                ]
            }
        ]
    });
    
    const result = CharacterReferenceValidator.validate(script, blueprint);
    
    if (result.valid) {
        throw new Error('Invalid script was incorrectly flagged as valid');
    }
    
    if (result.invalidReferences.length !== 1) {
        throw new Error(`Expected 1 invalid reference, found ${result.invalidReferences.length}`);
    }
    
    if (result.invalidReferences[0].characterName !== 'SARAH') {
        throw new Error(`Expected invalid character 'SARAH', found '${result.invalidReferences[0].characterName}'`);
    }
    
    return true;
}

// Test case: Case-insensitive matching
function testCaseInsensitiveMatching() {
    const blueprint = StoryBlueprintEngine.createBlueprint({
        characters: [
            { id: 'char-1', name: 'John', archetype: 'Protagonist', age: 30, role: 'Hero', description: 'Main character' }
        ]
    });
    
    const script = ScriptEngine.createScript(blueprint.id, {
        scenes: [
            {
                id: 'scene-1',
                label: 'Inciting Incident',
                shots: [
                    {
                        id: 'shot-1',
                        sceneHeading: 'INT. COFFEE SHOP - DAY',
                        actions: [],
                        elements: [
                            { id: 'elem-1', type: 'dialogue', characterName: 'JOHN', parenthetical: '', dialogue: 'Hello.' } // Uppercase
                        ],
                        dialogueBlocks: [
                            { id: 'db-1', characterName: 'john', parenthetical: '', dialogue: 'Hi.', source: 'user-written' } // Lowercase
                        ]
                    }
                ]
            }
        ]
    });
    
    const result = CharacterReferenceValidator.validate(script, blueprint);
    
    if (!result.valid) {
        throw new Error(`Case-insensitive matching failed: ${JSON.stringify(result.invalidReferences)}`);
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Test Execution
// ═══════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('Property Test: Character Reference Validity');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');
console.log('Property 15: For any script document, all character names referenced');
console.log('in dialogue blocks SHALL correspond to characters defined in the');
console.log('Story_Blueprint or added by the user in the Pro Script Builder.');
console.log('');
console.log('Validates: Requirement 9.2');
console.log('');

// Run unit tests first
console.log('Running unit tests...');
console.log('');

try {
    testValidScript();
    console.log('✅ Unit Test 1: Valid script with all characters defined - PASSED');
} catch (error) {
    console.log('❌ Unit Test 1: Valid script - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

try {
    testInvalidScript();
    console.log('✅ Unit Test 2: Invalid script with undefined character - PASSED');
} catch (error) {
    console.log('❌ Unit Test 2: Invalid script - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

try {
    testCaseInsensitiveMatching();
    console.log('✅ Unit Test 3: Case-insensitive character matching - PASSED');
} catch (error) {
    console.log('❌ Unit Test 3: Case-insensitive matching - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

console.log('');
console.log('Running property-based tests with fast-check...');
console.log('');

const property = fc.property(scriptWithCharactersArb, testCharacterReferenceValidity);

try {
    fc.assert(property, { numRuns: 100, verbose: true });
    console.log('');
    console.log('✅ Property Test PASSED');
    console.log('');
    console.log('All 100 randomly generated test cases passed!');
    console.log('Character reference validation works correctly for all generated scripts.');
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
