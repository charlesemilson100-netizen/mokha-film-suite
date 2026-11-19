// ─── End Director Intelligence Suite runtime objects ──────────────────────

        // ─── LocalStorage_Manager ──────────────────────────────────────────────────
        // Module for managing Story Projects in browser localStorage
        // Handles save, load, delete, duplicate, import/export operations
        
        export const LocalStorage_Manager = {
            // localStorage key for storing all projects
            STORAGE_KEY: 'mokha_projects',
            
            // Check if localStorage is available
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
            
            // Generate a UUID v4
            generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            
            // Validate project data structure
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
                
                // Validate synopsis structure
                if (!projectData.synopsis || typeof projectData.synopsis !== 'object') {
                    return { valid: false, error: 'Synopsis must be an object' };
                }
                
                // Validate metadata structure
                if (!projectData.metadata || typeof projectData.metadata !== 'object') {
                    return { valid: false, error: 'Metadata must be an object' };
                }
                
                return { valid: true };
            },
            
            // Get all projects from localStorage
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
            
            // Load a specific project by ID
            loadProjectById(projectId) {
                if (!projectId) {
                    console.error('Project ID is required');
                    return null;
                }
                
                const projects = this.loadAllProjects();
                const project = projects.find(p => p.id === projectId);
                return project || null;
            },
            
            // Save a new or existing project
            saveProject(projectData, isNewProject = false) {
                if (!this.isStorageAvailable()) {
                    throw new Error('localStorage is not available. Please check your browser settings.');
                }
                
                // Validate project data
                const validation = this.validateProjectData(projectData);
                if (!validation.valid) {
                    throw new Error(`Invalid project data: ${validation.error}`);
                }
                
                try {
                    const projects = this.loadAllProjects();
                    
                    if (isNewProject) {
                        // Generate new ID for new projects
                        projectData.id = this.generateUUID();
                        projectData.createdAt = Date.now();
                        projects.push(projectData);
                    } else {
                        // Update existing project
                        const index = projects.findIndex(p => p.id === projectData.id);
                        if (index !== -1) {
                            projects[index] = projectData;
                        } else {
                            // If project doesn't exist, treat as new
                            projectData.id = this.generateUUID();
                            projectData.createdAt = Date.now();
                            projects.push(projectData);
                        }
                    }
                    
                    // Update lastModified timestamp
                    projectData.lastModified = Date.now();
                    
                    // Check storage quota before saving
                    const serialized = JSON.stringify(projects);
                    const sizeInBytes = new Blob([serialized]).size;
                    
                    // Try to save
                    localStorage.setItem(this.STORAGE_KEY, serialized);
                    
                    return projectData;
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        throw new Error('Cannot save project. Storage is full. Please delete old projects or export them to free up space.');
                    }
                    throw new Error(`Error saving project: ${e.message}`);
                }
            },
            
            // Delete a project by ID
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
            
            // Duplicate a project
            duplicateProject(projectId) {
                if (!projectId) {
                    throw new Error('Project ID is required');
                }
                
                const originalProject = this.loadProjectById(projectId);
                if (!originalProject) {
                    throw new Error(`Project with ID ${projectId} not found`);
                }
                
                // Create a deep copy
                const duplicatedProject = JSON.parse(JSON.stringify(originalProject));
                
                // Generate new ID and update title
                duplicatedProject.id = this.generateUUID();
                duplicatedProject.title = `${originalProject.title} (Copy)`;
                duplicatedProject.createdAt = Date.now();
                duplicatedProject.lastModified = Date.now();
                
                // Save the duplicated project
                return this.saveProject(duplicatedProject, true);
            },
            
            // Import a project from JSON data
            importProjectFromJSON(jsonData) {
                if (!jsonData) {
                    throw new Error('JSON data is required');
                }
                
                let projectData;
                try {
                    if (typeof jsonData === 'string') {
                        projectData = JSON.parse(jsonData);
                    } else {
                        projectData = jsonData;
                    }
                } catch (e) {
                    throw new Error('Invalid project file. Please select a valid JSON export.');
                }
                
                // Validate the imported project
                const validation = this.validateProjectData(projectData);
                if (!validation.valid) {
                    throw new Error(`Invalid project structure: ${validation.error}`);
                }
                
                // Generate new ID to avoid conflicts
                projectData.id = this.generateUUID();
                
                // Check if a project with the same title exists
                const projects = this.loadAllProjects();
                const titleExists = projects.some(p => p.title === projectData.title);
                if (titleExists) {
                    projectData.title = `${projectData.title} (Imported)`;
                }
                
                projectData.createdAt = Date.now();
                projectData.lastModified = Date.now();
                
                // Save the imported project
                return this.saveProject(projectData, true);
            },
            
            // Export a project as JSON (returns JSON string for download)
            exportProjectAsJSON(projectId, autoDownload = false) {
                if (!projectId) {
                    throw new Error('Project ID is required');
                }
                
                const project = this.loadProjectById(projectId);
                if (!project) {
                    throw new Error(`Project with ID ${projectId} not found`);
                }
                
                const jsonString = JSON.stringify(project, null, 2);
                
                // Auto-download if requested
                if (autoDownload && typeof downloadFile === 'function') {
                    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                    downloadFile(jsonString, filename, 'application/json');
                }
                
                return jsonString;
            },
            
            // Get storage usage statistics
            getStorageStats() {
                if (!this.isStorageAvailable()) {
                    return {
                        totalProjects: 0,
                        totalUsedBytes: 0,
                        totalAvailableBytes: 0,
                        percentageUsed: 0,
                        projectSizes: []
                    };
                }
                
                try {
                    const projects = this.loadAllProjects();
                    const projectSizes = [];
                    let totalUsedBytes = 0;
                    
                    projects.forEach(project => {
                        const projectJSON = JSON.stringify(project);
                        const sizeBytes = new Blob([projectJSON]).size;
                        totalUsedBytes += sizeBytes;
                        projectSizes.push({
                            projectId: project.id,
                            title: project.title,
                            sizeBytes: sizeBytes,
                            sizeKB: Math.round(sizeBytes / 1024)
                        });
                    });
                    
                    // Estimate available storage (typically 5-10MB per domain)
                    // We'll use a conservative estimate of 5MB
                    const totalAvailableBytes = 5 * 1024 * 1024;
                    const percentageUsed = Math.round((totalUsedBytes / totalAvailableBytes) * 100);
                    
                    return {
                        totalProjects: projects.length,
                        totalUsedBytes: totalUsedBytes,
                        totalAvailableBytes: totalAvailableBytes,
                        percentageUsed: percentageUsed,
                        projectSizes: projectSizes
                    };
                } catch (e) {
                    console.error('Error calculating storage stats:', e);
                    return {
                        totalProjects: 0,
                        totalUsedBytes: 0,
                        totalAvailableBytes: 0,
                        percentageUsed: 0,
                        projectSizes: []
                    };
                }
            }
        };

// ═══════════════════════════════════════════════════════════════════════════
        // AUTO_SAVE MODULE
        // Handles automatic periodic saving with 30-second inactivity timer
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Helper function to download files
        export const downloadFile = (content, filename, mimeType = 'text/plain') => {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

export const Auto_Save = {
            _enabled: true,
            _isDirty: false,
            _timer: null,
            _saveCallback: null,
            _intervalMs: 30000, // 30 seconds
            _lastSaveTime: null,
            
            // Initialize auto-save with a save callback
            init(saveCallback, intervalMs = 30000) {
                this._saveCallback = saveCallback;
                this._intervalMs = intervalMs;
                this._enabled = true;
                this._isDirty = false;
                console.log('Auto_Save initialized with', intervalMs, 'ms interval');
            },
            
            // Mark that changes have been made
            markDirty() {
                if (!this._enabled) return;
                
                this._isDirty = true;
                
                // Clear existing timer
                if (this._timer) {
                    clearTimeout(this._timer);
                }
                
                // Start new timer
                this._timer = setTimeout(() => {
                    this.triggerSave();
                }, this._intervalMs);
            },
            
            // Manually trigger save
            triggerSave() {
                if (!this._isDirty || !this._saveCallback) {
                    return;
                }
                
                try {
                    this._saveCallback();
                    this._isDirty = false;
                    this._lastSaveTime = Date.now();
                    
                    // Display auto-save notification
                    this._showNotification();
                    
                    // Clear timer
                    if (this._timer) {
                        clearTimeout(this._timer);
                        this._timer = null;
                    }
                } catch (e) {
                    console.error('Auto-save failed:', e);
                    // Silently fail, don't interrupt user
                }
            },
            
            // Show auto-save notification
            _showNotification() {
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const notification = document.createElement('div');
                notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300';
                notification.textContent = `Auto-saved at ${time}`;
                document.body.appendChild(notification);
                
                // Fade out after 2 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 2000);
            },
            
            // Disable auto-save
            disable() {
                this._enabled = false;
                if (this._timer) {
                    clearTimeout(this._timer);
                    this._timer = null;
                }
            },
            
            // Enable auto-save
            enable() {
                this._enabled = true;
            },
            
            // Check if auto-save is enabled
            isEnabled() {
                return this._enabled;
            },
            
            // Get last save time
            getLastSaveTime() {
                return this._lastSaveTime;
            }
        };

// ── localStorage Quota Guard ────────────────────────────────────────
        export const checkStorageQuota = () => {
            try {
                let total = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        total += (localStorage[key].length + key.length) * 2; // UTF-16
                    }
                }
                const usedMB = (total / 1024 / 1024).toFixed(2);
                const limitMB = 5;
                return { usedMB: parseFloat(usedMB), limitMB, pct: Math.round((usedMB / limitMB) * 100) };
            } catch(e) { return { usedMB: 0, limitMB: 5, pct: 0 }; }
        };

