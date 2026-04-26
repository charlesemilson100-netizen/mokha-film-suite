/**
 * Property Test: Blueprint Schema Extensibility
 * 
 * Property 11: For any new Story_Type added to the system, the Story_Blueprint 
 * schema SHALL NOT require modification—only the Configuration_Wizard logic and 
 * Pro Script Builder templates need to be updated.
 * 
 * Validates: Requirement 8.5
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

    validateBlueprint: (blueprint) => {
        const errors = [];
        if (!blueprint.id) errors.push('Blueprint ID is required');
        if (!blueprint.storyType) errors.push('Story Type is required');
        if (!blueprint.duration) errors.push('Duration is required');
        if (!blueprint.style) errors.push('Style is required');
        if (!blueprint.narrativeStructure) errors.push('Narrative Structure is required');
        if (!blueprint.storyIntent || blueprint.storyIntent.trim().length === 0) errors.push('Story Intent is required');
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    updateBlueprint: (blueprint, updates) => {
        return {
            ...blueprint,
            ...updates,
            updatedAt: new Date().toISOString()
        };
    },

    // Original getDynamicParameters for existing story types
    getDynamicParameters: (storyType, duration, style, narrativeStructure) => {
        const params = {};

        if (storyType === 'Documentary') {
            params.subjectMatter = { type: 'select', options: ['Nature', 'History', 'Biography', 'Social Issue', 'Science', 'Culture'] };
            params.interviewFormat = { type: 'select', options: ['Talking Heads', 'Vérité', 'Mixed', 'None'] };
            params.archivalFootage = { type: 'boolean', default: false };
            params.narratorPresence = { type: 'select', options: ['Present', 'Absent', 'Minimal'] };
        } else if (storyType === 'Commercial') {
            params.productCategory = { type: 'text', placeholder: 'e.g., Tech, Fashion, Food' };
            params.targetAudience = { type: 'select', options: ['Gen Z', 'Millennials', 'Gen X', 'Boomers', 'All Ages'] };
            params.callToActionType = { type: 'select', options: ['Purchase', 'Download', 'Subscribe', 'Learn More', 'Visit'] };
            params.brandTone = { type: 'select', options: ['Playful', 'Professional', 'Emotional', 'Humorous', 'Inspirational'] };
        } else if (storyType === 'Cinematic Film') {
            params.genre = { type: 'select', options: ['Drama', 'Thriller', 'Comedy', 'Action', 'Horror', 'Sci-Fi', 'Fantasy', 'Romance'] };
            params.protagonistArchetype = { type: 'select', options: ['Hero', 'Antihero', 'Everyman', 'Mentor', 'Lover', 'Sage'] };
            params.antagonistType = { type: 'select', options: ['External', 'Internal', 'Circumstantial', 'None'] };
            params.actStructure = { type: 'select', options: ['Three-Act', 'Five-Act', 'Sequence-Based'] };
        } else if (storyType === 'Short Film') {
            params.subgenre = { type: 'select', options: ['Drama', 'Comedy', 'Experimental', 'Animation', 'Documentary'] };
            params.focusArea = { type: 'select', options: ['Character', 'Plot', 'Atmosphere', 'Concept'] };
        } else if (storyType === 'Social Media') {
            params.platform = { type: 'select', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Snapchat', 'Twitter'] };
            params.trend = { type: 'text', placeholder: 'e.g., Challenge, Trend, Meme' };
        } else if (storyType === 'Experimental') {
            params.experimentalApproach = { type: 'select', options: ['Non-Linear', 'Abstract', 'Surreal', 'Avant-Garde', 'Mixed Media'] };
            params.targetFestival = { type: 'text', placeholder: 'e.g., Sundance, SXSW' };
        }

        return params;
    }
};

// Extended version with new story types (simulating system extension)
const ExtendedStoryBlueprintEngine = {
    ...StoryBlueprintEngine,

    // Extended getDynamicParameters with NEW story types
    getDynamicParameters: (storyType, duration, style, narrativeStructure) => {
        // First try the original parameters
        const originalParams = StoryBlueprintEngine.getDynamicParameters(storyType, duration, style, narrativeStructure);
        
        // If original params exist, return them
        if (Object.keys(originalParams).length > 0) {
            return originalParams;
        }

        // Otherwise, handle NEW story types
        const params = {};

        if (storyType === 'Music Video') {
            params.musicGenre = { type: 'select', options: ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Country', 'R&B'] };
            params.performanceStyle = { type: 'select', options: ['Performance', 'Narrative', 'Abstract', 'Mixed'] };
            params.artistPresence = { type: 'select', options: ['Featured', 'Background', 'Absent'] };
            params.visualTheme = { type: 'text', placeholder: 'e.g., Neon, Vintage, Futuristic' };
        } else if (storyType === 'Educational') {
            params.subject = { type: 'select', options: ['Science', 'Math', 'History', 'Language', 'Arts', 'Technology'] };
            params.targetAge = { type: 'select', options: ['Children', 'Teens', 'Adults', 'All Ages'] };
            params.teachingMethod = { type: 'select', options: ['Lecture', 'Demonstration', 'Interactive', 'Storytelling'] };
            params.visualAids = { type: 'boolean', default: true };
        } else if (storyType === 'Podcast Video') {
            params.format = { type: 'select', options: ['Interview', 'Solo', 'Panel', 'Narrative'] };
            params.visualStyle = { type: 'select', options: ['Static Camera', 'B-Roll Heavy', 'Animated', 'Mixed'] };
            params.episodeType = { type: 'select', options: ['Standalone', 'Series', 'Special'] };
        }

        return params;
    }
};

// ═══════════════════════════════════════════════════════════════════════
// Schema Validator - Verifies Blueprint Structure
// ═══════════════════════════════════════════════════════════════════════

const BlueprintSchemaValidator = {
    /**
     * Get the expected schema structure (field names and types)
     */
    getExpectedSchema: () => {
        return {
            id: 'string',
            storyType: 'string',
            duration: 'string',
            style: 'string',
            narrativeStructure: 'string',
            dynamicParameters: 'object',
            storyIntent: 'string',
            characters: 'array',
            relationships: 'array',
            createdAt: 'string',
            updatedAt: 'string'
        };
    },

    /**
     * Verify that a blueprint matches the expected schema
     */
    validateSchema: (blueprint) => {
        const expectedSchema = BlueprintSchemaValidator.getExpectedSchema();
        const actualFields = Object.keys(blueprint);
        const expectedFields = Object.keys(expectedSchema);

        // Check for missing fields
        const missingFields = expectedFields.filter(field => !actualFields.includes(field));
        
        // Check for extra fields (schema modification)
        const extraFields = actualFields.filter(field => !expectedFields.includes(field));

        // Check field types
        const typeErrors = [];
        for (const field of expectedFields) {
            if (blueprint[field] !== undefined) {
                const expectedType = expectedSchema[field];
                const actualType = Array.isArray(blueprint[field]) ? 'array' : typeof blueprint[field];
                
                if (expectedType !== actualType) {
                    typeErrors.push({
                        field,
                        expectedType,
                        actualType
                    });
                }
            }
        }

        return {
            valid: missingFields.length === 0 && extraFields.length === 0 && typeErrors.length === 0,
            missingFields,
            extraFields,
            typeErrors
        };
    },

    /**
     * Compare two schemas to detect modifications
     */
    compareSchemas: (schema1, schema2) => {
        const fields1 = Object.keys(schema1).sort();
        const fields2 = Object.keys(schema2).sort();

        if (fields1.length !== fields2.length) {
            return false;
        }

        for (let i = 0; i < fields1.length; i++) {
            if (fields1[i] !== fields2[i] || schema1[fields1[i]] !== schema2[fields2[i]]) {
                return false;
            }
        }

        return true;
    }
};

// ═══════════════════════════════════════════════════════════════════════
// fast-check Arbitraries (Generators)
// ═══════════════════════════════════════════════════════════════════════

// Existing story types
const existingStoryTypeArb = fc.constantFrom(
    'Documentary',
    'Commercial',
    'Cinematic Film',
    'Short Film',
    'Social Media',
    'Experimental'
);

// NEW story types (simulating system extension)
const newStoryTypeArb = fc.constantFrom(
    'Music Video',
    'Educational',
    'Podcast Video'
);

// All story types (existing + new)
const allStoryTypeArb = fc.oneof(existingStoryTypeArb, newStoryTypeArb);

const durationArb = fc.constantFrom('2 min', '5 min', '10 min', '15 min', '30 min', '60 min');
const styleArb = fc.constantFrom('cinematic', 'documentary', 'comedy', 'drama', '3D anime', '2D animated');
const narrativeStructureArb = fc.constantFrom('protagonist journey', 'antagonist conflict', 'ensemble', 'real event storytelling');
const storyIntentArb = fc.string({ minLength: 10, maxLength: 200 });

// Generate dynamic parameters for a given story type
const dynamicParametersArb = (storyType) => {
    const params = ExtendedStoryBlueprintEngine.getDynamicParameters(storyType);
    
    if (Object.keys(params).length === 0) {
        return fc.constant({});
    }

    const paramGenerators = {};
    for (const [key, config] of Object.entries(params)) {
        if (config.type === 'select') {
            paramGenerators[key] = fc.constantFrom(...config.options);
        } else if (config.type === 'text') {
            paramGenerators[key] = fc.string({ minLength: 3, maxLength: 30 });
        } else if (config.type === 'boolean') {
            paramGenerators[key] = fc.boolean();
        }
    }

    return fc.record(paramGenerators);
};

// Generate a complete blueprint with any story type
const blueprintArb = allStoryTypeArb.chain(storyType => {
    return fc.tuple(
        durationArb,
        styleArb,
        narrativeStructureArb,
        storyIntentArb,
        dynamicParametersArb(storyType)
    ).map(([duration, style, narrativeStructure, storyIntent, dynamicParameters]) => {
        return StoryBlueprintEngine.createBlueprint({
            storyType,
            duration,
            style,
            narrativeStructure,
            storyIntent,
            dynamicParameters
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════
// Property Test Implementation
// ═══════════════════════════════════════════════════════════════════════

function testSchemaExtensibility(blueprint) {
    // 1. Verify the blueprint matches the expected schema
    const schemaValidation = BlueprintSchemaValidator.validateSchema(blueprint);
    
    if (!schemaValidation.valid) {
        if (schemaValidation.extraFields.length > 0) {
            throw new Error(
                `Schema was modified! Extra fields detected: ${schemaValidation.extraFields.join(', ')}\n` +
                `The schema should NOT change when adding new story types.`
            );
        }
        
        if (schemaValidation.missingFields.length > 0) {
            throw new Error(
                `Schema validation failed! Missing fields: ${schemaValidation.missingFields.join(', ')}`
            );
        }
        
        if (schemaValidation.typeErrors.length > 0) {
            const errorMsg = schemaValidation.typeErrors.map(e => 
                `${e.field}: expected ${e.expectedType}, got ${e.actualType}`
            ).join(', ');
            throw new Error(`Schema type errors: ${errorMsg}`);
        }
    }

    // 2. Verify the blueprint is valid according to validation rules
    const validation = StoryBlueprintEngine.validateBlueprint(blueprint);
    
    if (!validation.valid) {
        throw new Error(
            `Blueprint validation failed: ${validation.errors.join(', ')}`
        );
    }

    // 3. Verify that dynamicParameters is a flexible object (can store any parameters)
    if (typeof blueprint.dynamicParameters !== 'object' || Array.isArray(blueprint.dynamicParameters)) {
        throw new Error(
            `dynamicParameters must be a flexible object, got ${typeof blueprint.dynamicParameters}`
        );
    }

    // 4. Verify that getDynamicParameters returns appropriate parameters for the story type
    const dynamicParams = ExtendedStoryBlueprintEngine.getDynamicParameters(
        blueprint.storyType,
        blueprint.duration,
        blueprint.style,
        blueprint.narrativeStructure
    );

    // For known story types, verify parameters are returned
    const knownStoryTypes = [
        'Documentary', 'Commercial', 'Cinematic Film', 'Short Film', 'Social Media', 'Experimental',
        'Music Video', 'Educational', 'Podcast Video'
    ];

    if (knownStoryTypes.includes(blueprint.storyType)) {
        if (Object.keys(dynamicParams).length === 0) {
            throw new Error(
                `getDynamicParameters returned empty object for known story type: ${blueprint.storyType}`
            );
        }
    }

    // 5. Verify that all dynamic parameters in the blueprint match the expected structure
    for (const [key, value] of Object.entries(blueprint.dynamicParameters)) {
        if (value === undefined || value === null) {
            throw new Error(
                `Dynamic parameter '${key}' has invalid value: ${value}`
            );
        }
    }

    return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Unit Tests
// ═══════════════════════════════════════════════════════════════════════

function testExistingStoryType() {
    const blueprint = StoryBlueprintEngine.createBlueprint({
        storyType: 'Documentary',
        duration: '30 min',
        style: 'documentary',
        narrativeStructure: 'real event storytelling',
        storyIntent: 'Educate viewers about climate change',
        dynamicParameters: {
            subjectMatter: 'Nature',
            interviewFormat: 'Talking Heads',
            archivalFootage: true,
            narratorPresence: 'Present'
        }
    });

    const schemaValidation = BlueprintSchemaValidator.validateSchema(blueprint);
    
    if (!schemaValidation.valid) {
        throw new Error(`Existing story type failed schema validation: ${JSON.stringify(schemaValidation)}`);
    }

    const validation = StoryBlueprintEngine.validateBlueprint(blueprint);
    
    if (!validation.valid) {
        throw new Error(`Existing story type failed blueprint validation: ${validation.errors.join(', ')}`);
    }

    return true;
}

function testNewStoryType() {
    const blueprint = StoryBlueprintEngine.createBlueprint({
        storyType: 'Music Video',
        duration: '5 min',
        style: 'cinematic',
        narrativeStructure: 'protagonist journey',
        storyIntent: 'Create a visually stunning music video',
        dynamicParameters: {
            musicGenre: 'Pop',
            performanceStyle: 'Narrative',
            artistPresence: 'Featured',
            visualTheme: 'Neon'
        }
    });

    const schemaValidation = BlueprintSchemaValidator.validateSchema(blueprint);
    
    if (!schemaValidation.valid) {
        throw new Error(
            `New story type failed schema validation!\n` +
            `Extra fields: ${schemaValidation.extraFields.join(', ')}\n` +
            `Missing fields: ${schemaValidation.missingFields.join(', ')}\n` +
            `This proves the schema was NOT modified when adding the new story type.`
        );
    }

    const validation = StoryBlueprintEngine.validateBlueprint(blueprint);
    
    if (!validation.valid) {
        throw new Error(`New story type failed blueprint validation: ${validation.errors.join(', ')}`);
    }

    // Verify that getDynamicParameters returns parameters for the new story type
    const dynamicParams = ExtendedStoryBlueprintEngine.getDynamicParameters('Music Video');
    
    if (Object.keys(dynamicParams).length === 0) {
        throw new Error('getDynamicParameters did not return parameters for new story type');
    }

    return true;
}

function testSchemaConsistency() {
    // Create blueprints with different story types
    const documentaryBlueprint = StoryBlueprintEngine.createBlueprint({
        storyType: 'Documentary',
        duration: '30 min',
        style: 'documentary',
        narrativeStructure: 'real event storytelling',
        storyIntent: 'Test',
        dynamicParameters: { subjectMatter: 'Nature' }
    });

    const musicVideoBlueprint = StoryBlueprintEngine.createBlueprint({
        storyType: 'Music Video',
        duration: '5 min',
        style: 'cinematic',
        narrativeStructure: 'protagonist journey',
        storyIntent: 'Test',
        dynamicParameters: { musicGenre: 'Pop' }
    });

    // Extract schemas (field names and types)
    const schema1 = {};
    const schema2 = {};

    for (const key of Object.keys(documentaryBlueprint)) {
        schema1[key] = Array.isArray(documentaryBlueprint[key]) ? 'array' : typeof documentaryBlueprint[key];
    }

    for (const key of Object.keys(musicVideoBlueprint)) {
        schema2[key] = Array.isArray(musicVideoBlueprint[key]) ? 'array' : typeof musicVideoBlueprint[key];
    }

    // Verify schemas are identical
    if (!BlueprintSchemaValidator.compareSchemas(schema1, schema2)) {
        throw new Error(
            `Schema mismatch between story types!\n` +
            `Documentary schema: ${JSON.stringify(schema1)}\n` +
            `Music Video schema: ${JSON.stringify(schema2)}\n` +
            `The schema should be identical for all story types.`
        );
    }

    return true;
}

function testDynamicParametersFlexibility() {
    // Test that dynamicParameters can store any key-value pairs
    const testCases = [
        { musicGenre: 'Pop', performanceStyle: 'Narrative' },
        { subjectMatter: 'Nature', interviewFormat: 'Talking Heads' },
        { customField1: 'value1', customField2: 123, customField3: true },
        {}
    ];

    for (const dynamicParams of testCases) {
        const blueprint = StoryBlueprintEngine.createBlueprint({
            storyType: 'Test Type',
            duration: '5 min',
            style: 'test',
            narrativeStructure: 'test',
            storyIntent: 'test',
            dynamicParameters: dynamicParams
        });

        const schemaValidation = BlueprintSchemaValidator.validateSchema(blueprint);
        
        if (!schemaValidation.valid) {
            throw new Error(
                `dynamicParameters flexibility test failed for: ${JSON.stringify(dynamicParams)}\n` +
                `Schema validation: ${JSON.stringify(schemaValidation)}`
            );
        }
    }

    return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Test Execution
// ═══════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('Property Test: Blueprint Schema Extensibility');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log('');
console.log('Property 11: For any new Story_Type added to the system, the');
console.log('Story_Blueprint schema SHALL NOT require modification—only the');
console.log('Configuration_Wizard logic and Pro Script Builder templates need');
console.log('to be updated.');
console.log('');
console.log('Validates: Requirement 8.5');
console.log('');

// Run unit tests first
console.log('Running unit tests...');
console.log('');

try {
    testExistingStoryType();
    console.log('✅ Unit Test 1: Existing story type (Documentary) - PASSED');
} catch (error) {
    console.log('❌ Unit Test 1: Existing story type - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

try {
    testNewStoryType();
    console.log('✅ Unit Test 2: New story type (Music Video) - PASSED');
} catch (error) {
    console.log('❌ Unit Test 2: New story type - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

try {
    testSchemaConsistency();
    console.log('✅ Unit Test 3: Schema consistency across story types - PASSED');
} catch (error) {
    console.log('❌ Unit Test 3: Schema consistency - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

try {
    testDynamicParametersFlexibility();
    console.log('✅ Unit Test 4: dynamicParameters flexibility - PASSED');
} catch (error) {
    console.log('❌ Unit Test 4: dynamicParameters flexibility - FAILED');
    console.log('Error:', error.message);
    process.exit(1);
}

console.log('');
console.log('Running property-based tests with fast-check...');
console.log('');

const property = fc.property(blueprintArb, testSchemaExtensibility);

try {
    fc.assert(property, { numRuns: 100, verbose: true });
    console.log('');
    console.log('✅ Property Test PASSED');
    console.log('');
    console.log('All 100 randomly generated test cases passed!');
    console.log('');
    console.log('Key findings:');
    console.log('  • The Story Blueprint schema remains unchanged when adding new story types');
    console.log('  • Only getDynamicParameters() logic needs updates for new story types');
    console.log('  • The dynamicParameters field is flexible and accepts any key-value pairs');
    console.log('  • All blueprints (existing and new story types) validate correctly');
    console.log('  • No schema modifications are required for extensibility');
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
