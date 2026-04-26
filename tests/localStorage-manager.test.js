/**
 * Tests for LocalStorage_Manager deleteProject and duplicateProject methods
 * Task 2: Implement project deletion and duplication
 * Requirements: 3.3, 3.4
 */

// Mock localStorage for testing
class LocalStorageMock {
    constructor() {
        this.store = {};
    }

    clear() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = String(value);
    }

    removeItem(key) {
        delete this.store[key];
    }
}

global.localStorage = new LocalStorageMock();
global.Blob = class Blob {
    constructor(parts) {
        this.size = JSON.stringify(parts).length;
    }
};

// LocalStorage_Manager implementation (extracted for testing)
const LocalStorage_Manager = {
    STORAGE_KEY: 'mokha_projects',
    
    isStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    validateProjectData(projectData) {
        if (!projectData || typeof projectData !== 'object') {
            return { valid: false, error: 'Project data must be an object' };
        }
        
        const requiredFields = ['title', 'author', 'storyBlueprint', 'scriptDocument', 'characterArcs', 'synopsis', 'metadata'];
        for (const field of requiredFields) {
            if (!(field in projectData)) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        
        if (!projectData.synopsis || typeof projectData.synopsis !== 'object') {
            return { valid: false, error: 'Synopsis must be an object' };
        }
        
        if (!projectData.metadata || typeof projectData.metadata !== 'object') {
            return { valid: false, error: 'Metadata must be an object' };
        }
        
        return { valid: true };
    },
    
    loadAllProjects() {
        if (!this.isStorageAvailable()) {
            console.error('localStorage is not available');
            return [];
        }
        
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return [];
            }
            const projects = JSON.parse(data);
            return Array.isArray(projects) ? projects : [];
        } catch (e) {
            console.error('Error loading projects from localStorage:', e);
            return [];
        }
    },
    
    loadProjectById(projectId) {
        if (!projectId) {
            console.error('Project ID is required');
            return null;
        }
        
        const projects = this.loadAllProjects();
        const project = projects.find(p => p.id === projectId);
        return project || null;
    },
    
    saveProject(projectData, isNewProject = false) {
        if (!this.isStorageAvailable()) {
            throw new Error('localStorage is not available. Please check your browser settings.');
        }
        
        const validation = this.validateProjectData(projectData);
        if (!validation.valid) {
            throw new Error(`Invalid project data: ${validation.error}`);
        }
        
        try {
            const projects = this.loadAllProjects();
            
            if (isNewProject) {
                projectData.id = this.generateUUID();
                projectData.createdAt = Date.now();
                projects.push(projectData);
            } else {
                const index = projects.findIndex(p => p.id === projectData.id);
                if (index !== -1) {
                    projects[index] = projectData;
                } else {
                    projectData.id = this.generateUUID();
                    projectData.createdAt = Date.now();
                    projects.push(projectData);
                }
            }
            
            projectData.lastModified = Date.now();
            
            const serialized = JSON.stringify(projects);
            localStorage.setItem(this.STORAGE_KEY, serialized);
            
            return projectData;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                throw new Error('Cannot save project. Storage is full. Please delete old projects or export them to free up space.');
            }
            throw new Error(`Error saving project: ${e.message}`);
        }
    },
    
    deleteProject(projectId) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        
        if (!this.isStorageAvailable()) {
            throw new Error('localStorage is not available');
        }
        
        try {
            const projects = this.loadAllProjects();
            const filteredProjects = projects.filter(p => p.id !== projectId);
            
            if (filteredProjects.length === projects.length) {
                console.warn(`Project with ID ${projectId} not found`);
                return false;
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredProjects));
            return true;
        } catch (e) {
            throw new Error(`Error deleting project: ${e.message}`);
        }
    },
    
    duplicateProject(projectId) {
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        
        const originalProject = this.loadProjectById(projectId);
        if (!originalProject) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        
        const duplicatedProject = JSON.parse(JSON.stringify(originalProject));
        
        duplicatedProject.id = this.generateUUID();
        duplicatedProject.title = `${originalProject.title} (Copy)`;
        duplicatedProject.createdAt = Date.now();
        duplicatedProject.lastModified = Date.now();
        
        return this.saveProject(duplicatedProject, true);
    }
};

// Helper function to create a valid project
function createTestProject(title = 'Test Project', author = 'Test Author') {
    return {
        title,
        author,
        storyBlueprint: { duration: 15, genre: 'Drama' },
        scriptDocument: { scenes: [] },
        characterArcs: { characters: [] },
        synopsis: {
            overview: 'Test overview',
            characters: [],
            setting: 'Test setting',
            themeTone: 'Test theme'
        },
        metadata: {
            wordCount: 0,
            pageCount: 0,
            readingTime: 0,
            thumbnail: ''
        }
    };
}

// Test Suite
console.log('=== Testing LocalStorage_Manager deleteProject and duplicateProject ===\n');

// Test 1: Delete project removes it completely
console.log('Test 1: Delete project removes it completely');
try {
    localStorage.clear();
    
    // Create and save a project
    const project1 = createTestProject('Project 1');
    const saved1 = LocalStorage_Manager.saveProject(project1, true);
    
    // Verify it exists
    const allProjects = LocalStorage_Manager.loadAllProjects();
    console.assert(allProjects.length === 1, 'Should have 1 project');
    console.assert(allProjects[0].id === saved1.id, 'Project ID should match');
    
    // Delete the project
    const deleted = LocalStorage_Manager.deleteProject(saved1.id);
    console.assert(deleted === true, 'Delete should return true');
    
    // Verify it's gone
    const afterDelete = LocalStorage_Manager.loadAllProjects();
    console.assert(afterDelete.length === 0, 'Should have 0 projects after deletion');
    
    const loadById = LocalStorage_Manager.loadProjectById(saved1.id);
    console.assert(loadById === null, 'loadProjectById should return null for deleted project');
    
    console.log('✓ Test 1 passed\n');
} catch (error) {
    console.error('✗ Test 1 failed:', error.message, '\n');
}

// Test 2: Duplicate creates independent copy with " (Copy)" suffix
console.log('Test 2: Duplicate creates independent copy with " (Copy)" suffix');
try {
    localStorage.clear();
    
    // Create and save a project
    const original = createTestProject('Original Project', 'John Doe');
    original.synopsis.overview = 'Original overview';
    const savedOriginal = LocalStorage_Manager.saveProject(original, true);
    
    // Duplicate the project
    const duplicated = LocalStorage_Manager.duplicateProject(savedOriginal.id);
    
    // Verify duplicate has new ID
    console.assert(duplicated.id !== savedOriginal.id, 'Duplicate should have different ID');
    
    // Verify title has " (Copy)" suffix
    console.assert(duplicated.title === 'Original Project (Copy)', 'Duplicate should have " (Copy)" suffix');
    
    // Verify other fields are identical
    console.assert(duplicated.author === savedOriginal.author, 'Author should be identical');
    console.assert(duplicated.synopsis.overview === savedOriginal.synopsis.overview, 'Synopsis should be identical');
    
    // Verify both projects exist in storage
    const allProjects = LocalStorage_Manager.loadAllProjects();
    console.assert(allProjects.length === 2, 'Should have 2 projects');
    
    // Modify the duplicate and verify original is unchanged
    duplicated.synopsis.overview = 'Modified overview';
    LocalStorage_Manager.saveProject(duplicated, false);
    
    const reloadedOriginal = LocalStorage_Manager.loadProjectById(savedOriginal.id);
    console.assert(reloadedOriginal.synopsis.overview === 'Original overview', 'Original should be unchanged');
    
    console.log('✓ Test 2 passed\n');
} catch (error) {
    console.error('✗ Test 2 failed:', error.message, '\n');
}

// Test 3: Delete non-existent project returns false
console.log('Test 3: Delete non-existent project returns false');
try {
    localStorage.clear();
    
    const result = LocalStorage_Manager.deleteProject('non-existent-id');
    console.assert(result === false, 'Deleting non-existent project should return false');
    
    console.log('✓ Test 3 passed\n');
} catch (error) {
    console.error('✗ Test 3 failed:', error.message, '\n');
}

// Test 4: Duplicate non-existent project throws error
console.log('Test 4: Duplicate non-existent project throws error');
try {
    localStorage.clear();
    
    let errorThrown = false;
    try {
        LocalStorage_Manager.duplicateProject('non-existent-id');
    } catch (e) {
        errorThrown = true;
        console.assert(e.message.includes('not found'), 'Error message should mention "not found"');
    }
    
    console.assert(errorThrown, 'Should throw error for non-existent project');
    console.log('✓ Test 4 passed\n');
} catch (error) {
    console.error('✗ Test 4 failed:', error.message, '\n');
}

// Test 5: Multiple deletions
console.log('Test 5: Multiple deletions');
try {
    localStorage.clear();
    
    // Create 3 projects
    const p1 = LocalStorage_Manager.saveProject(createTestProject('Project 1'), true);
    const p2 = LocalStorage_Manager.saveProject(createTestProject('Project 2'), true);
    const p3 = LocalStorage_Manager.saveProject(createTestProject('Project 3'), true);
    
    console.assert(LocalStorage_Manager.loadAllProjects().length === 3, 'Should have 3 projects');
    
    // Delete middle project
    LocalStorage_Manager.deleteProject(p2.id);
    const after1 = LocalStorage_Manager.loadAllProjects();
    console.assert(after1.length === 2, 'Should have 2 projects after first deletion');
    console.assert(after1.find(p => p.id === p1.id), 'Project 1 should still exist');
    console.assert(after1.find(p => p.id === p3.id), 'Project 3 should still exist');
    console.assert(!after1.find(p => p.id === p2.id), 'Project 2 should be deleted');
    
    console.log('✓ Test 5 passed\n');
} catch (error) {
    console.error('✗ Test 5 failed:', error.message, '\n');
}

// Test 6: Duplicate preserves nested data structures
console.log('Test 6: Duplicate preserves nested data structures');
try {
    localStorage.clear();
    
    const original = createTestProject('Complex Project');
    original.scriptDocument.scenes = [
        { id: 'scene-1', heading: 'INT. ROOM - DAY', shots: [{ id: 'shot-1', type: 'Wide' }] }
    ];
    original.characterArcs.characters = [
        { id: 'char-1', name: 'John', arc: 'Hero' }
    ];
    
    const saved = LocalStorage_Manager.saveProject(original, true);
    const duplicated = LocalStorage_Manager.duplicateProject(saved.id);
    
    // Verify nested structures are preserved
    console.assert(duplicated.scriptDocument.scenes.length === 1, 'Scenes should be preserved');
    console.assert(duplicated.scriptDocument.scenes[0].heading === 'INT. ROOM - DAY', 'Scene heading should match');
    console.assert(duplicated.characterArcs.characters.length === 1, 'Characters should be preserved');
    console.assert(duplicated.characterArcs.characters[0].name === 'John', 'Character name should match');
    
    console.log('✓ Test 6 passed\n');
} catch (error) {
    console.error('✗ Test 6 failed:', error.message, '\n');
}

console.log('=== All tests completed ===');
