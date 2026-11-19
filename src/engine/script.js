// ════════════════════════════════════════════════════════════════════════════════
        // STORY BLUEPRINT ENGINE & PRO SCRIPT BUILDER
        // ════════════════════════════════════════════════════════════════════════════════

        // ── Story Blueprint Data Model & Utilities ──────────────────────────────────────
        
        export const StoryBlueprintEngine = {
            // Create a new Story Blueprint with UUID
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

            // Validate that all required fields are present and non-empty
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

            // Update blueprint immutably
            updateBlueprint: (blueprint, updates) => {
                return {
                    ...blueprint,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
            },

            // Get dynamic parameters based on story type and other selections
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

// ── Character Arc Engine ────────────────────────────────────────────────

        export const CharacterArcEngine = {
            createCharacterArc: (characterId, characterName) => ({
                id: `arc-${Date.now()}`,
                characterId,
                characterName,
                startingEmotionalState: '',
                endingEmotionalState: '',
                arcType: 'growth', // growth, decline, flat, transformation
                keyTurningPoints: [],
                emotionalBeats: [], // { sceneId, emotion, intensity }
                relationships: [], // { targetCharacterId, type, description }
                createdAt: new Date().toISOString()
            }),

            validateArcConsistency: (arc) => {
                const errors = [];

                if (!arc.startingEmotionalState) {
                    errors.push('Starting emotional state is required');
                }
                if (!arc.endingEmotionalState) {
                    errors.push('Ending emotional state is required');
                }

                // Check for logical progression based on arc type
                if (arc.arcType === 'growth' && arc.emotionalBeats.length > 1) {
                    const intensities = arc.emotionalBeats.map(b => b.intensity || 0);
                    const isIncreasing = intensities.every((val, i, arr) => i === 0 || val >= arr[i - 1]);
                    if (!isIncreasing) {
                        errors.push('Growth arc should have increasing emotional intensity');
                    }
                }

                if (arc.arcType === 'decline' && arc.emotionalBeats.length > 1) {
                    const intensities = arc.emotionalBeats.map(b => b.intensity || 0);
                    const isDecreasing = intensities.every((val, i, arr) => i === 0 || val <= arr[i - 1]);
                    if (!isDecreasing) {
                        errors.push('Decline arc should have decreasing emotional intensity');
                    }
                }

                return {
                    valid: errors.length === 0,
                    errors
                };
            },

            updateArc: (arc, updates) => ({
                ...arc,
                ...updates
            })
        };

// ── LocalStorage Manager Utility ────────────────────────────────────────────────
        export const LocalStorageManager = {
            STORAGE_KEY: 'mokha_story_projects',
            
            // Generate unique ID
            generateId() {
                return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            },
            
            // Get all projects from localStorage
            getAllProjects() {
                try {
                    const data = localStorage.getItem(this.STORAGE_KEY);
                    return data ? JSON.parse(data) : [];
                } catch (error) {
                    console.error('Error loading projects:', error);
                    return [];
                }
            },
            
            // Save project to localStorage
            saveProject(project) {
                try {
                    const projects = this.getAllProjects();
                    const now = new Date().toISOString();
                    
                    // Check if project exists
                    const existingIndex = projects.findIndex(p => p.id === project.id);
                    
                    if (existingIndex >= 0) {
                        // Update existing project
                        projects[existingIndex] = {
                            ...project,
                            lastModified: now
                        };
                    } else {
                        // Add new project
                        const newProject = {
                            ...project,
                            id: project.id || this.generateId(),
                            createdAt: project.createdAt || now,
                            lastModified: now
                        };
                        projects.push(newProject);
                    }
                    
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
                    return { success: true, projectId: project.id || projects[projects.length - 1].id };
                } catch (error) {
                    console.error('Error saving project:', error);
                    if (error.name === 'QuotaExceededError') {
                        return { success: false, error: 'Storage quota exceeded. Please delete old projects.' };
                    }
                    return { success: false, error: 'Failed to save project.' };
                }
            },
            
            // Load specific project
            loadProject(projectId) {
                try {
                    const projects = this.getAllProjects();
                    return projects.find(p => p.id === projectId) || null;
                } catch (error) {
                    console.error('Error loading project:', error);
                    return null;
                }
            },
            
            // Delete project
            deleteProject(projectId) {
                try {
                    const projects = this.getAllProjects();
                    const filtered = projects.filter(p => p.id !== projectId);
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
                    return { success: true };
                } catch (error) {
                    console.error('Error deleting project:', error);
                    return { success: false, error: 'Failed to delete project.' };
                }
            },
            
            // Get storage usage
            getStorageUsage() {
                try {
                    const data = localStorage.getItem(this.STORAGE_KEY);
                    const used = data ? new Blob([data]).size : 0;
                    const available = 5 * 1024 * 1024; // 5MB typical limit
                    const percentage = (used / available) * 100;
                    
                    return {
                        used: Math.round(used / 1024), // KB
                        available: Math.round(available / 1024), // KB
                        percentage: Math.round(percentage)
                    };
                } catch (error) {
                    return { used: 0, available: 5120, percentage: 0 };
                }
            },
            
            // Export project as JSON file
            exportProjectJSON(project) {
                const json = JSON.stringify(project, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.title || 'untitled'}-backup.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            },
            
            // Import project from JSON file
            async importProjectJSON(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const project = JSON.parse(e.target.result);
                            // Validate project structure
                            if (!project.blueprint || !project.script) {
                                reject(new Error('Invalid project file structure'));
                                return;
                            }
                            // Generate new ID to avoid conflicts
                            project.id = this.generateId();
                            project.title = `${project.title} (Imported)`;
                            resolve(project);
                        } catch (error) {
                            reject(new Error('Failed to parse JSON file'));
                        }
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsText(file);
                });
            },

            // ── Thumbnail Generation ────────────────────────────────────────────────
            generateThumbnail(script, blueprint) {
                try {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 150;
                    const ctx = canvas.getContext('2d');

                    // Background
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(0, 0, 200, 150);

                    // Get first scene content
                    const firstScene = script.scenes && script.scenes[0];
                    let content = '';

                    if (firstScene && firstScene.shots && firstScene.shots[0]) {
                        const shot = firstScene.shots[0];
                        if (shot.sceneHeading) {
                            content += shot.sceneHeading + '\n\n';
                        }
                        // Handle both old format (action string) and new format (actions array)
                        if (shot.action) {
                            content += shot.action.substring(0, 100) + (shot.action.length > 100 ? '...' : '');
                        } else if (shot.actions && shot.actions.length > 0 && shot.actions[0].text) {
                            const firstAction = shot.actions[0].text;
                            content += firstAction.substring(0, 100) + (firstAction.length > 100 ? '...' : '');
                        }
                    }

                    // If no content, show placeholder
                    if (!content) {
                        ctx.fillStyle = '#666';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('No script yet', 100, 75);
                        ctx.font = '12px Arial';
                        ctx.fillText(blueprint?.storyType || 'Project', 100, 95);
                    } else {
                        // Draw text
                        ctx.fillStyle = '#f5f5f5';
                        ctx.font = 'bold 11px monospace';
                        ctx.textAlign = 'left';
                        
                        const lines = content.split('\n');
                        let y = 10;
                        
                        for (let i = 0; i < Math.min(lines.length, 8); i++) {
                            const line = lines[i].substring(0, 25);
                            ctx.fillText(line, 10, y);
                            y += 15;
                        }
                    }

                    // Convert to base64
                    return canvas.toDataURL('image/png');
                } catch (error) {
                    console.error('Error generating thumbnail:', error);
                    return null;
                }
            }
        };

// ── Script Template Definitions ────────────────────────────────────────────

        export const SCRIPT_TEMPLATES = {
            'Protagonist Journey': {
                'Inciting Incident': [
                    { sceneHeading: '', action: '[Establish the protagonist and their ordinary world]', dialogueBlocks: [] },
                    { sceneHeading: '', action: '[The inciting incident disrupts their world]', dialogueBlocks: [] }
                ],
                'Rising Action': [
                    { sceneHeading: '', action: '[Protagonist responds to the challenge]', dialogueBlocks: [] },
                    { sceneHeading: '', action: '[Stakes escalate, obstacles mount]', dialogueBlocks: [] }
                ],
                'Midpoint': [
                    { sceneHeading: '', action: '[False victory or false defeat]', dialogueBlocks: [] }
                ],
                'Climax': [
                    { sceneHeading: '', action: '[Final confrontation with the central conflict]', dialogueBlocks: [] }
                ],
                'Resolution': [
                    { sceneHeading: '', action: '[New normal established, loose ends tied]', dialogueBlocks: [] }
                ]
            },
            'Antagonist Conflict': {
                'Antagonist Introduction': [
                    { sceneHeading: '', action: '[Introduce the antagonist and their goal]', dialogueBlocks: [] }
                ],
                'Conflict Escalation': [
                    { sceneHeading: '', action: '[Protagonist and antagonist clash]', dialogueBlocks: [] },
                    { sceneHeading: '', action: '[Conflict intensifies with each encounter]', dialogueBlocks: [] }
                ],
                'Confrontation': [
                    { sceneHeading: '', action: '[Direct confrontation between protagonist and antagonist]', dialogueBlocks: [] }
                ],
                'Resolution': [
                    { sceneHeading: '', action: '[Outcome of the conflict, new equilibrium]', dialogueBlocks: [] }
                ]
            },
            'Ensemble': {
                'Setup': [
                    { sceneHeading: '', action: '[Introduce multiple characters and their situations]', dialogueBlocks: [] }
                ],
                'Parallel Stories': [
                    { sceneHeading: '', action: '[Story A develops]', dialogueBlocks: [] },
                    { sceneHeading: '', action: '[Story B develops]', dialogueBlocks: [] }
                ],
                'Intersection': [
                    { sceneHeading: '', action: '[Stories begin to intersect and influence each other]', dialogueBlocks: [] }
                ],
                'Climax': [
                    { sceneHeading: '', action: '[All storylines converge at the climax]', dialogueBlocks: [] }
                ],
                'Resolution': [
                    { sceneHeading: '', action: '[Resolution for all characters]', dialogueBlocks: [] }
                ]
            },
            'Real Event Storytelling': {
                'Context': [
                    { sceneHeading: '', action: '[Establish the historical or real-world context]', dialogueBlocks: [] }
                ],
                'Event Build': [
                    { sceneHeading: '', action: '[Build toward the central event]', dialogueBlocks: [] }
                ],
                'Peak Moment': [
                    { sceneHeading: '', action: '[The central event unfolds]', dialogueBlocks: [] }
                ],
                'Aftermath': [
                    { sceneHeading: '', action: '[Immediate consequences of the event]', dialogueBlocks: [] }
                ],
                'Reflection': [
                    { sceneHeading: '', action: '[Reflection on the event and its significance]', dialogueBlocks: [] }
                ]
            },
            'Parallel Narratives': {
                'Story A Setup': [
                    { sceneHeading: '', action: '[Introduce first narrative thread]', dialogueBlocks: [] }
                ],
                'Story B Setup': [
                    { sceneHeading: '', action: '[Introduce second narrative thread]', dialogueBlocks: [] }
                ],
                'Convergence': [
                    { sceneHeading: '', action: '[Narratives begin to converge]', dialogueBlocks: [] }
                ],
                'Climax': [
                    { sceneHeading: '', action: '[Both narratives reach their climax]', dialogueBlocks: [] }
                ],
                'Resolution': [
                    { sceneHeading: '', action: '[Resolution of both narratives]', dialogueBlocks: [] }
                ]
            }
        };

// ── Script Parser ──────────────────────────────────────────────────────────

        export const ScriptParser = {
            // Parse screenplay text into structured format
            parse: (scriptText) => {
                const lines = scriptText.split('\n');
                const elements = [];

                lines.forEach((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return;

                    const element = ScriptParser.detectElementType(trimmed);
                    elements.push({
                        lineNumber: idx + 1,
                        text: trimmed,
                        type: element
                    });
                });

                return elements;
            },

            // Detect screenplay element type
            detectElementType: (line) => {
                if (!line) return 'blank';
                
                // Scene heading: all caps with INT/EXT and location/time
                if (/^(INT|EXT|INT\/EXT)\s/.test(line) && /^[A-Z\s\-\.]+$/.test(line)) {
                    return 'sceneHeading';
                }
                
                // Character name: all caps, short line
                if (/^[A-Z][A-Z\s]+$/.test(line) && line.length < 50) {
                    return 'characterName';
                }
                
                // Parenthetical: in parentheses
                if (/^\([^)]+\)$/.test(line)) {
                    return 'parenthetical';
                }
                
                // Dialogue: follows character name
                return 'dialogue';
            },

            // Validate screenplay structure
            validate: (elements) => {
                const errors = [];
                
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    
                    // Check for scene heading
                    if (element.type === 'sceneHeading') {
                        // Verify it has location and time
                        if (!element.text.includes('-')) {
                            errors.push(`Line ${element.lineNumber}: Scene heading missing time of day`);
                        }
                    }
                    
                    // Check for character name without dialogue
                    if (element.type === 'characterName') {
                        const nextElement = elements[i + 1];
                        if (!nextElement || (nextElement.type !== 'dialogue' && nextElement.type !== 'parenthetical')) {
                            errors.push(`Line ${element.lineNumber}: Character name "${element.text}" has no dialogue`);
                        }
                    }
                }
                
                return {
                    valid: errors.length === 0,
                    errors
                };
            }
        };

// ── Prompt Converter ────────────────────────────────────────────────────────

        export const PromptConverter = {
            // Parse script into scenes and shots
            parseScript: (script) => {
                const prompts = [];

                script.scenes.forEach((scene, sceneIdx) => {
                    scene.shots.forEach((shot, shotIdx) => {
                        // Extract actions and dialogue from unified elements or old structure
                        let actions = [];
                        let dialogues = [];
                        let characters = [];

                        // New unified elements structure
                        if (shot.elements && shot.elements.length > 0) {
                            shot.elements.forEach(element => {
                                if (element.type === 'action' && element.text) {
                                    actions.push(element.text);
                                } else if (element.type === 'dialogue') {
                                    if (element.characterName && !characters.includes(element.characterName)) {
                                        characters.push(element.characterName);
                                    }
                                    dialogues.push({
                                        characterName: element.characterName,
                                        parenthetical: element.parenthetical,
                                        dialogue: element.dialogue
                                    });
                                }
                            });
                        }
                        // Backward compatibility: old format
                        if (shot.action) {
                            actions.push(shot.action);
                        }
                        if (shot.actions && shot.actions.length > 0) {
                            shot.actions.forEach(action => {
                                if (action.text) actions.push(action.text);
                            });
                        }
                        if (shot.dialogueBlocks) {
                            shot.dialogueBlocks.forEach(db => {
                                if (db.characterName && !characters.includes(db.characterName)) {
                                    characters.push(db.characterName);
                                }
                                dialogues.push(db);
                            });
                        }

                        const prompt = {
                            sceneNumber: sceneIdx + 1,
                            sceneLabel: scene.label,
                            shotNumber: shotIdx + 1,
                            shotType: PromptConverter.inferShotType(actions.join(' ')),
                            location: PromptConverter.extractLocation(shot.sceneHeading),
                            timeOfDay: PromptConverter.extractTimeOfDay(shot.sceneHeading),
                            characters: characters,
                            actions: actions,
                            dialogue: dialogues,
                            style: 'cinematic',
                            intent: 'advance the story',
                            fullPrompt: PromptConverter.generateFullPrompt(shot.sceneHeading, actions, dialogues, characters)
                        };

                        // Check for ambiguities
                        const ambiguities = PromptConverter.detectAmbiguities(prompt);
                        if (ambiguities.length > 0) {
                            prompt.ambiguities = ambiguities;
                        }

                        prompts.push(prompt);
                    });
                });

                return prompts;
            },

            // Generate full AI prompt text
            generateFullPrompt: (sceneHeading, actions, dialogues, characters) => {
                let prompt = '';
                
                if (sceneHeading) {
                    prompt += `${sceneHeading}\n\n`;
                }
                
                if (actions.length > 0) {
                    prompt += actions.join(' ') + '\n\n';
                }
                
                if (dialogues.length > 0) {
                    dialogues.forEach(db => {
                        if (db.characterName) {
                            prompt += `${db.characterName}: `;
                        }
                        if (db.dialogue) {
                            prompt += `"${db.dialogue}"\n`;
                        }
                    });
                }
                
                return prompt.trim();
            },

            // Infer shot type from action
            inferShotType: (actionText) => {
                const action = actionText.toLowerCase();
                
                if (action.includes('wide') || action.includes('establishing')) return 'Wide Shot';
                if (action.includes('close') || action.includes('close-up')) return 'Close-up';
                if (action.includes('medium')) return 'Medium Shot';
                if (action.includes('over')) return 'Over-Shoulder';
                if (action.includes('pan') || action.includes('tracking')) return 'Tracking Shot';
                
                return 'Medium Shot';
            },

            // Extract location from scene heading
            extractLocation: (sceneHeading) => {
                if (!sceneHeading) return 'Unknown Location';
                
                // Remove INT/EXT prefix
                const withoutPrefix = sceneHeading.replace(/^(INT|EXT|INT\/EXT)\s/, '');
                
                // Extract location (everything before the dash)
                const parts = withoutPrefix.split('-');
                return parts[0].trim();
            },

            // Extract time of day from scene heading
            extractTimeOfDay: (sceneHeading) => {
                if (!sceneHeading) return 'Unknown Time';
                
                // Extract time (everything after the last dash)
                const parts = sceneHeading.split('-');
                return parts[parts.length - 1].trim();
            },

            // Detect ambiguities in prompt
            detectAmbiguities: (prompt) => {
                const ambiguities = [];
                
                if (!prompt.location || prompt.location === 'Unknown Location') {
                    ambiguities.push('Missing or vague location');
                }
                
                if (!prompt.timeOfDay || prompt.timeOfDay === 'Unknown Time') {
                    ambiguities.push('Missing time of day');
                }
                
                if (!prompt.actions || prompt.actions.length === 0) {
                    ambiguities.push('Missing action description');
                }
                
                if (prompt.characters.length === 0 && prompt.dialogue.length > 0) {
                    ambiguities.push('Dialogue without character names');
                }
                
                return ambiguities;
            }
        };

// ── Export Engine ──────────────────────────────────────────────────────────

        export const ExportEngine = {
            // Export script to PDF
            exportPDF: (script, blueprint) => {
                // Use existing PDF library (jsPDF if available, or fallback to simple text export)
                const title = script.title || `${blueprint.storyType} Script`;
                const author = script.author || 'Unknown Author';
                const date = new Date().toLocaleDateString();

                // Create PDF content
                let pdfContent = `${title}\n`;
                pdfContent += `By ${author}\n`;
                pdfContent += `${date}\n\n`;
                pdfContent += '---\n\n';

                // Add scenes
                script.scenes.forEach((scene, sceneIdx) => {
                    pdfContent += `${scene.label}\n\n`;
                    
                    scene.shots.forEach((shot, shotIdx) => {
                        if (shot.sceneHeading) {
                            pdfContent += `${shot.sceneHeading}\n\n`;
                        }
                        // Handle both old format (action string) and new format (actions array)
                        if (shot.action) {
                            pdfContent += `${shot.action}\n\n`;
                        } else if (shot.actions && shot.actions.length > 0) {
                            shot.actions.forEach(action => {
                                if (action.text) pdfContent += `${action.text}\n\n`;
                            });
                        }
                        shot.dialogueBlocks.forEach(db => {
                            if (db.characterName) {
                                pdfContent += `${db.characterName}\n`;
                            }
                            if (db.parenthetical) {
                                pdfContent += `(${db.parenthetical})\n`;
                            }
                            if (db.dialogue) {
                                pdfContent += `${db.dialogue}\n\n`;
                            }
                        });
                    });

                    if (sceneIdx < script.scenes.length - 1) {
                        pdfContent += '---\n\n';
                    }
                });

                // Download as PDF (using text-based approach for now)
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent));
                element.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            },

            // Export script to TXT
            exportTXT: (script, blueprint) => {
                const title = script.title || `${blueprint.storyType} Script`;
                const author = script.author || 'Unknown Author';
                const date = new Date().toLocaleDateString();

                let txtContent = `${title}\n`;
                txtContent += `By ${author}\n`;
                txtContent += `${date}\n`;
                txtContent += `Page Count: ${script.metadata.pageCount}\n`;
                txtContent += `Estimated Runtime: ${script.metadata.estimatedRuntime} minutes\n\n`;
                txtContent += '='.repeat(80) + '\n\n';

                // Add scenes
                script.scenes.forEach((scene, sceneIdx) => {
                    txtContent += `SCENE ${sceneIdx + 1}: ${scene.label}\n`;
                    txtContent += '-'.repeat(80) + '\n\n';
                    
                    scene.shots.forEach((shot, shotIdx) => {
                        if (shot.sceneHeading) {
                            txtContent += `${shot.sceneHeading}\n\n`;
                        }
                        // Handle both old format (action string) and new format (actions array)
                        if (shot.action) {
                            txtContent += `${shot.action}\n\n`;
                        } else if (shot.actions && shot.actions.length > 0) {
                            shot.actions.forEach(action => {
                                if (action.text) txtContent += `${action.text}\n\n`;
                            });
                        }
                        shot.dialogueBlocks.forEach(db => {
                            if (db.characterName) {
                                txtContent += `${db.characterName}\n`;
                            }
                            if (db.parenthetical) {
                                txtContent += `(${db.parenthetical})\n`;
                            }
                            if (db.dialogue) {
                                txtContent += `${db.dialogue}\n\n`;
                            }
                        });
                    });

                    if (sceneIdx < script.scenes.length - 1) {
                        txtContent += '\n' + '='.repeat(80) + '\n\n';
                    }
                });

                // Download as TXT
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txtContent));
                element.setAttribute('download', `${title.replace(/\s+/g, '_')}.txt`);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            }
        };

// ── Writing Mode Manager ────────────────────────────────────────────────────

        export const WritingModeManager = {
            // Generate template scaffold
            generateFromTemplate: (blueprint) => {
                const templates = SCRIPT_TEMPLATES[blueprint.narrativeStructure] || SCRIPT_TEMPLATES['Protagonist Journey'];
                const scenes = Object.entries(templates).map(([label, shots], idx) => ({
                    id: `scene-${idx}`,
                    label,
                    shots: shots.map((shot, shotIdx) => ({
                        id: `shot-${idx}-${shotIdx}`,
                        sceneHeading: shot.sceneHeading,
                        action: shot.action,
                        dialogueBlocks: shot.dialogueBlocks
                    }))
                }));
                return scenes;
            },

            // Generate AI script draft
            generateWithAI: async (blueprint) => {
                // Build prompt for LLM
                const prompt = `Write a ${blueprint.duration} ${blueprint.storyType} script in ${blueprint.style} style.
Story Intent: ${blueprint.storyIntent}
Narrative Structure: ${blueprint.narrativeStructure}

Format the response as a screenplay with the following structure:
- Scene headings in ALL CAPS (e.g., INT. COFFEE SHOP - DAY)
- Action lines describing what happens
- Character names in ALL CAPS
- Dialogue in normal case
- Parentheticals in (lowercase)

Generate a complete script with proper screenplay formatting.`;

                try {
                    // Check if LLM is available (placeholder for actual LLM integration)
                    // For now, generate from template as fallback
                    const scenes = WritingModeManager.generateFromTemplate(blueprint);
                    
                    // In production, this would call the actual LLM
                    // const response = await callLLM(prompt);
                    // return WritingModeManager.parseAIResponse(response, blueprint);
                    
                    return scenes;
                } catch (error) {
                    console.error('Error generating AI draft:', error);
                    // Fallback to template
                    return WritingModeManager.generateFromTemplate(blueprint);
                }
            },

            // Parse LLM response into script structure
            parseAIResponse: (response, blueprint) => {
                // Parse screenplay text into structured format
                // This is a simplified parser - production version would be more robust
                const lines = response.split('\n').filter(line => line.trim());
                const scenes = [];
                let currentScene = null;
                let currentShot = null;

                lines.forEach(line => {
                    const trimmed = line.trim();
                    
                    // Detect scene heading (all caps with location and time)
                    if (/^[A-Z\s\-\.]+\s(INT|EXT|INT\/EXT)\s/.test(trimmed)) {
                        if (currentShot && currentScene) {
                            currentScene.shots.push(currentShot);
                        }
                        if (currentScene) {
                            scenes.push(currentScene);
                        }
                        currentScene = {
                            id: `scene-${scenes.length}`,
                            label: trimmed.substring(0, 30),
                            shots: []
                        };
                        currentShot = {
                            id: `shot-${scenes.length}-0`,
                            sceneHeading: trimmed,
                            action: '',
                            dialogueBlocks: []
                        };
                    } 
                    // Detect character name (all caps, not a scene heading)
                    else if (/^[A-Z][A-Z\s]+$/.test(trimmed) && trimmed.length < 50 && currentShot) {
                        currentShot.dialogueBlocks.push({
                            characterName: trimmed,
                            parenthetical: '',
                            dialogue: ''
                        });
                    }
                    // Detect parenthetical (in parentheses)
                    else if (/^\([^)]+\)$/.test(trimmed) && currentShot && currentShot.dialogueBlocks.length > 0) {
                        const lastDb = currentShot.dialogueBlocks[currentShot.dialogueBlocks.length - 1];
                        lastDb.parenthetical = trimmed.slice(1, -1).toLowerCase();
                    }
                    // Dialogue or action
                    else if (trimmed && currentShot) {
                        if (currentShot.dialogueBlocks.length > 0 && !currentShot.dialogueBlocks[currentShot.dialogueBlocks.length - 1].dialogue) {
                            currentShot.dialogueBlocks[currentShot.dialogueBlocks.length - 1].dialogue = trimmed;
                        } else {
                            currentShot.action += (currentShot.action ? '\n' : '') + trimmed;
                        }
                    }
                });

                // Add final shot and scene
                if (currentShot && currentScene) {
                    currentScene.shots.push(currentShot);
                }
                if (currentScene) {
                    scenes.push(currentScene);
                }

                return scenes.length > 0 ? scenes : WritingModeManager.generateFromTemplate(blueprint);
            }
        };

