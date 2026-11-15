import React, { useEffect, useState } from 'react';
import { DirectorBrainPanel } from '../director/DirectorBrainPanel';
import { CharacterArcMapper } from './CharacterArcMapper';
import { useConfirm } from '../ui/ConfirmDialog';
import { Icon } from '../ui/Icon';
import { useToast } from '../ui/ToastProvider';
import { FastBrain } from '../../engine/directorBrain';
import { ExportEngine, LocalStorageManager, PromptConverter, WritingModeManager } from '../../engine/script';
import { LocalStorage_Manager } from '../../engine/storage';

// ── Pro Script Builder Component ────────────────────────────────────────────────

        export const ProScriptBuilder = ({ blueprint, onSave, onClose }) => {
            // ── Toast Notifications ────────────────────────────────────────────────
            const addToast = useToast();

            const [script, setScript] = useState({
                id: `script-${Date.now()}`,
                blueprintId: blueprint.id,
                title: '',
                author: '',
                scenes: [],
                metadata: {
                    pageCount: 0,
                    estimatedRuntime: 0,
                    wordCount: 0,
                    lastModified: new Date().toISOString(),
                    writingMode: 'user-written',
                    characterArcs: [] // Add character arcs to metadata
                }
            });

            const [writingMode, setWritingMode] = useState('user-written');
            const [selectedSceneId, setSelectedSceneId] = useState(null);
            const [selectedShotId, setSelectedShotId] = useState(null);
            const [isGenerating, setIsGenerating] = useState(false);
            const [showModeOptions, setShowModeOptions] = useState(false);
            const [pendingMode, setPendingMode] = useState(null);
            const [history, setHistory] = useState([]);
            const [historyIndex, setHistoryIndex] = useState(-1);
            const [showCharacterArcMapper, setShowCharacterArcMapper] = useState(false);
            const [characterArcs, setCharacterArcs] = useState(script.metadata?.characterArcs || []);
            const [blueprintCharacters, setBlueprintCharacters] = useState(blueprint.characters || []);

            // ── Project Management State ────────────────────────────────────────────────
            const [currentProject, setCurrentProject] = useState(null);
            const [projectTitle, setProjectTitle] = useState('');
            const [projectAuthor, setProjectAuthor] = useState('');
            const [showSaveDialog, setShowSaveDialog] = useState(false);
            const [showProjectLibrary, setShowProjectLibrary] = useState(false);
            const [isSaving, setIsSaving] = useState(false);
            const [saveMessage, setSaveMessage] = useState('');

            // ── Story Output State ────────────────────────────────────────────────
            const [showStoryOutput, setShowStoryOutput] = useState(false);
            const [synopsis, setSynopsis] = useState({
                overview: '',
                characters: blueprintCharacters.map(c => ({
                    name: c.name,
                    description: c.description || ''
                })),
                setting: blueprint.setting || '',
                theme: blueprint.theme || ''
            });

            // ── Export State ────────────────────────────────────────────────
            const [showExportModal, setShowExportModal] = useState(false);

            // ── Auto-Save State ────────────────────────────────────────────────
            const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
            const [autoSaveTimer, setAutoSaveTimer] = useState(null);
            const [lastAutoSaveTime, setLastAutoSaveTime] = useState(null);
            const [autoSaveMessage, setAutoSaveMessage] = useState('');

            // ── Unsaved Changes State (Task 23) ────────────────────────────────────────────────
            const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
            const [lastSavedState, setLastSavedState] = useState(null);

            // ── Scene Breakdown State ────────────────────────────────────────────────
            const [showSceneBreakdown, setShowSceneBreakdown] = useState(false);

            // ── Character Arc Summary State ────────────────────────────────────────────────
            const [showCharacterArcs, setShowCharacterArcs] = useState(false);

            // ── Prompts Modal State ────────────────────────────────────────────────
            const [showPromptsModal, setShowPromptsModal] = useState(false);
            const [generatedPrompts, setGeneratedPrompts] = useState([]);

            // ── Director Brain Modal State ────────────────────────────────────────────────
            const [showDirectorBrain, setShowDirectorBrain] = useState(false);

            // ── Shot Critique Modal State ────────────────────────────────────────────────
            const [showShotCritique, setShowShotCritique] = useState(false);
            const [critiqueShot, setCritiqueShot] = useState(null);
            const [critiqueAnnotations, setCritiqueAnnotations] = useState([]);

            // ── Confirmation Dialog Hook ────────────────────────────────────────────────
            const { confirm, ConfirmUI } = useConfirm();

            // ── Auto-open Project Library if flag is set ────────────────────────────────────────────────
            useEffect(() => {
                if (blueprint._openProjectLibrary) {
                    // Open project library immediately
                    setShowProjectLibrary(true);
                }
            }, [blueprint._openProjectLibrary]);

            // Generate initial scene structure based on blueprint
            useEffect(() => {
                const sceneStructure = generateSceneStructure(blueprint);
                setScript(prev => ({
                    ...prev,
                    scenes: sceneStructure
                }));
            }, [blueprint]);

            const generateSceneStructure = (bp) => {
                const sceneLabels = {
                    'Protagonist Journey': ['Inciting Incident', 'Rising Action', 'Midpoint', 'Climax', 'Resolution'],
                    'Antagonist Conflict': ['Antagonist Introduction', 'Conflict Escalation', 'Confrontation', 'Resolution'],
                    'Ensemble': ['Setup', 'Parallel Stories', 'Intersection', 'Climax', 'Resolution'],
                    'Real Event Storytelling': ['Context', 'Event Build', 'Peak Moment', 'Aftermath', 'Reflection'],
                    'Parallel Narratives': ['Story A Setup', 'Story B Setup', 'Convergence', 'Climax', 'Resolution']
                };

                const labels = sceneLabels[bp.narrativeStructure] || ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4', 'Scene 5'];
                
                return labels.map((label, idx) => ({
                    id: `scene-${idx}`,
                    label,
                    description: '',
                    shots: [
                        {
                            id: `shot-${idx}-0`,
                            sceneHeading: '',
                            elements: [], // New unified structure: array of {type: 'action'|'dialogue', ...}
                            // Keep old structure for backward compatibility
                            actions: [],
                            dialogueBlocks: []
                        }
                    ]
                }));
            };

            const calculatePageCount = () => {
                let lineCount = 0;
                script.scenes.forEach(scene => {
                    scene.shots.forEach(shot => {
                        if (shot.sceneHeading) lineCount += 1;
                        
                        // New unified elements structure
                        if (shot.elements && shot.elements.length > 0) {
                            shot.elements.forEach(element => {
                                if (element.type === 'action' && element.text) {
                                    lineCount += Math.ceil(element.text.length / 60);
                                } else if (element.type === 'dialogue') {
                                    lineCount += 3; // character + parenthetical + dialogue
                                }
                            });
                        }
                        
                        // Backward compatibility: old format (action string)
                        if (shot.action) {
                            lineCount += Math.ceil(shot.action.length / 60);
                        }
                        // Backward compatibility: old format (actions array)
                        if (shot.actions && shot.actions.length > 0) {
                            shot.actions.forEach(action => {
                                if (action.text) lineCount += Math.ceil(action.text.length / 60);
                            });
                        }
                        // Backward compatibility: old format (dialogueBlocks)
                        if (shot.dialogueBlocks) {
                            shot.dialogueBlocks.forEach(db => {
                                lineCount += 3; // character + parenthetical + dialogue
                            });
                        }
                    });
                });
                return Math.ceil(lineCount / 55);
            };

            const calculateRuntime = () => {
                return calculatePageCount(); // 1 page ≈ 1 minute
            };

            const handleFieldChange = (sceneId, shotId, field, value) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene => 
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? { ...shot, [field]: value }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            pageCount: calculatePageCount(),
                            estimatedRuntime: calculateRuntime(),
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            const undo = () => {
                if (historyIndex > 0) {
                    setHistoryIndex(historyIndex - 1);
                    setScript(history[historyIndex - 1]);
                }
            };

            const redo = () => {
                if (historyIndex < history.length - 1) {
                    setHistoryIndex(historyIndex + 1);
                    setScript(history[historyIndex + 1]);
                }
            };

            // Keyboard shortcuts for undo/redo
            useEffect(() => {
                const handleKeyDown = (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                        e.preventDefault();
                        undo();
                    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                        e.preventDefault();
                        redo();
                    }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [historyIndex, history]);

            const addShot = (sceneId) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: [
                                        ...scene.shots,
                                        {
                                            id: `shot-${Date.now()}`,
                                            sceneHeading: '',
                                            actions: [], // Changed to array for multiple actions
                                            dialogueBlocks: []
                                        }
                                    ]
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Add new scene
            const addScene = () => {
                setScript(prev => {
                    const sceneNumber = prev.scenes.length + 1;
                    const newScene = {
                        id: `scene-${Date.now()}`,
                        label: `Scene ${sceneNumber}`,
                        description: '',
                        shots: [
                            {
                                id: `shot-${Date.now()}`,
                                sceneHeading: '',
                                actions: [],
                                dialogueBlocks: []
                            }
                        ]
                    };

                    const updated = {
                        ...prev,
                        scenes: [...prev.scenes, newScene],
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    // Auto-select the new scene
                    setSelectedSceneId(newScene.id);

                    return updated;
                });
            };

            // Rename scene
            const renameScene = (sceneId, newLabel, newDescription) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? { ...scene, label: newLabel, description: newDescription || scene.description }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Delete scene
            const deleteScene = (sceneId) => {
                if (script.scenes.length <= 1) return; // Keep at least one scene

                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.filter(scene => scene.id !== sceneId),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    // Select first scene if current was deleted
                    if (selectedSceneId === sceneId) {
                        setSelectedSceneId(updated.scenes[0]?.id || null);
                    }

                    return updated;
                });
            };

            // Add action to shot
            const addAction = (sceneId, shotId) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                actions: [...(shot.actions || []), { id: `action-${Date.now()}`, text: '' }]
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Update action text
            const updateAction = (sceneId, shotId, actionId, text) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                actions: shot.actions.map(action =>
                                                    action.id === actionId
                                                        ? { ...action, text }
                                                        : action
                                                )
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            pageCount: calculatePageCount(),
                            estimatedRuntime: calculateRuntime(),
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Delete action
            const deleteAction = (sceneId, shotId, actionId) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                actions: shot.actions.filter(action => action.id !== actionId)
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Reorder actions (drag and drop)
            const reorderActions = (sceneId, shotId, fromIndex, toIndex) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                actions: (() => {
                                                    const actions = [...shot.actions];
                                                    const [removed] = actions.splice(fromIndex, 1);
                                                    actions.splice(toIndex, 0, removed);
                                                    return actions;
                                                })()
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Drag and drop state
            const [draggedAction, setDraggedAction] = useState(null);

            // ── New Unified Element Management (Actions + Dialogue Interleaved) ────────────────────────────────────────────────

            // Add element (action or dialogue) to shot
            const addElement = (sceneId, shotId, type, afterIndex = -1) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                elements: (() => {
                                                    const elements = shot.elements || [];
                                                    const newElement = type === 'action'
                                                        ? { id: `element-${Date.now()}`, type: 'action', text: '' }
                                                        : { id: `element-${Date.now()}`, type: 'dialogue', characterName: '', parenthetical: '', dialogue: '' };
                                                    
                                                    if (afterIndex === -1) {
                                                        return [...elements, newElement];
                                                    } else {
                                                        const newElements = [...elements];
                                                        newElements.splice(afterIndex + 1, 0, newElement);
                                                        return newElements;
                                                    }
                                                })()
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Update element
            const updateElement = (sceneId, shotId, elementId, updates) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                elements: (shot.elements || []).map(element =>
                                                    element.id === elementId
                                                        ? { ...element, ...updates }
                                                        : element
                                                )
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            pageCount: calculatePageCount(),
                            estimatedRuntime: calculateRuntime(),
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Delete element
            const deleteElement = (sceneId, shotId, elementId) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                elements: (shot.elements || []).filter(element => element.id !== elementId)
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Reorder elements (drag and drop)
            const reorderElements = (sceneId, shotId, fromIndex, toIndex) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                elements: (() => {
                                                    const elements = [...(shot.elements || [])];
                                                    const [removed] = elements.splice(fromIndex, 1);
                                                    elements.splice(toIndex, 0, removed);
                                                    return elements;
                                                })()
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // Drag and drop state for elements
            const [draggedElement, setDraggedElement] = useState(null);

            const deleteShot = (sceneId, shotId) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.filter(shot => shot.id !== shotId)
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });
            };

            // ── Save/Load Handlers ────────────────────────────────────────────────
            const calculateWordCount = (scriptData) => {
                let count = 0;
                scriptData.scenes.forEach(scene => {
                    scene.shots.forEach(shot => {
                        // New unified elements structure
                        if (shot.elements && shot.elements.length > 0) {
                            shot.elements.forEach(element => {
                                if (element.type === 'action' && element.text) {
                                    count += element.text.split(/\s+/).filter(w => w.length > 0).length;
                                } else if (element.type === 'dialogue' && element.dialogue) {
                                    count += element.dialogue.split(/\s+/).filter(w => w.length > 0).length;
                                }
                            });
                        }
                        // Backward compatibility: old format (action string)
                        if (shot.action) {
                            count += shot.action.split(/\s+/).filter(w => w.length > 0).length;
                        }
                        // Backward compatibility: old format (actions array)
                        if (shot.actions && shot.actions.length > 0) {
                            shot.actions.forEach(action => {
                                if (action.text) count += action.text.split(/\s+/).filter(w => w.length > 0).length;
                            });
                        }
                        // Backward compatibility: old format (dialogueBlocks)
                        if (shot.dialogueBlocks) {
                            shot.dialogueBlocks.forEach(db => {
                                if (db.dialogue) count += db.dialogue.split(/\s+/).filter(w => w.length > 0).length;
                            });
                        }
                    });
                });
                return count;
            };

            const calculateReadingTime = (scriptData) => {
                // Average reading speed: 150 words per minute
                const wordCount = calculateWordCount(scriptData);
                return Math.ceil(wordCount / 150);
            };

            const handleSaveProject = () => {
                if (currentProject && currentProject.id) {
                    // Update existing project
                    saveCurrentProject();
                } else {
                    // First time save - show dialog
                    setShowSaveDialog(true);
                }
            };

            const saveCurrentProject = () => {
                setIsSaving(true);
                
                // Generate thumbnail
                const thumbnail = LocalStorageManager.generateThumbnail(script, blueprint);
                
                const projectData = {
                    id: currentProject?.id,
                    title: projectTitle || 'Untitled Project',
                    author: projectAuthor || 'Unknown',
                    blueprint: blueprint,
                    script: script,
                    characterArcs: characterArcs,
                    synopsis: synopsis,
                    metadata: {
                        wordCount: calculateWordCount(script),
                        pageCount: calculatePageCount(),
                        readingTime: calculateReadingTime(script),
                        thumbnail: thumbnail || ''
                    }
                };
                
                const result = LocalStorageManager.saveProject(projectData);
                
                if (result.success) {
                    setCurrentProject({ ...projectData, id: result.projectId });
                    setSaveMessage('✓ Project saved successfully');
                    setTimeout(() => setSaveMessage(''), 3000);
                    
                    // Task 23: Clear unsaved changes flag and update last saved state
                    setHasUnsavedChanges(false);
                    setLastSavedState(JSON.stringify({ script, projectTitle, projectAuthor, characterArcs, synopsis }));
                } else {
                    setSaveMessage(`✗ ${result.error}`);
                    setTimeout(() => setSaveMessage(''), 5000);
                }
                
                setIsSaving(false);
                setShowSaveDialog(false);
            };

            const handleLoadProject = async (projectId) => {
                // Task 23: Check for unsaved changes before loading
                if (hasUnsavedChanges) {
                    const confirmed = await confirm(
                        'You have unsaved changes. Save before opening another project?',
                        {
                            confirmLabel: 'Save & Open',
                            cancelLabel: 'Discard Changes',
                            neutralLabel: 'Cancel'
                        }
                    );
                    
                    if (confirmed === null) {
                        // User clicked Cancel - don't load
                        return;
                    } else if (confirmed === true) {
                        // User wants to save first
                        saveCurrentProject();
                        // Wait a bit for save to complete
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    // If confirmed === false, user wants to discard changes and continue
                }
                
                const project = LocalStorageManager.loadProject(projectId);
                if (project) {
                    setCurrentProject(project);
                    setProjectTitle(project.title);
                    setProjectAuthor(project.author);
                    setScript(project.script);
                    setCharacterArcs(project.characterArcs || []);
                    setBlueprintCharacters(project.synopsis?.characters || []);
                    setSynopsis(project.synopsis || {
                        overview: '',
                        characters: [],
                        setting: '',
                        theme: ''
                    });
                    
                    // Task 23: Reset unsaved changes state for new project
                    setHasUnsavedChanges(false);
                    setLastSavedState(JSON.stringify({ 
                        script: project.script, 
                        projectTitle: project.title, 
                        projectAuthor: project.author, 
                        characterArcs: project.characterArcs || [], 
                        synopsis: project.synopsis || {} 
                    }));
                    
                    setShowProjectLibrary(false);
                    setSaveMessage('✓ Project loaded successfully');
                    setTimeout(() => setSaveMessage(''), 3000);
                }
            };

            const handleDeleteProject = async (projectId) => {
                // Check if it's a Pro Builder project (proj_*) or Pro Library project (project-*)
                if (projectId.startsWith('proj_')) {
                    // Pro Builder project - delete from local state
                    const project = projects.find(p => p.id === projectId);
                    if (!project) return;
                    
                    const confirmed = await appConfirm(
                        `Delete '${project.name}'? All scenes and shots will be lost.`,
                        { confirmLabel: 'Delete Project' }
                    );
                    
                    if (confirmed) {
                        setProjects(prev => prev.filter(p => p.id !== projectId));
                        if (activeProjectId === projectId) {
                            setActiveProjectId(projects.find(p => p.id !== projectId)?.id || null);
                        }
                        setSaveMessage('✓ Project deleted successfully');
                        setTimeout(() => setSaveMessage(''), 3000);
                    }
                } else {
                    // Pro Library project - use LocalStorage_Manager
                    const project = LocalStorage_Manager.loadProjectById(projectId);
                    if (!project) return;
                    
                    const confirmed = await appConfirm(
                        `Delete '${project.title}'? This cannot be undone.`,
                        { confirmLabel: 'Delete Project' }
                    );
                    
                    if (confirmed) {
                        try {
                            const success = LocalStorage_Manager.deleteProject(projectId);
                            if (success) {
                                setShowProjectLibrary(false);
                                setTimeout(() => setShowProjectLibrary(true), 100);
                                setSaveMessage('✓ Project deleted successfully');
                                setTimeout(() => setSaveMessage(''), 3000);
                            }
                        } catch (error) {
                            console.error('Error deleting project:', error);
                            setSaveMessage(`✗ Failed to delete project: ${error.message}`);
                            setTimeout(() => setSaveMessage(''), 5000);
                        }
                    }
                }
            };

            const handleDuplicateProject = (projectId) => {
                // Check if it's a Pro Builder project (proj_*) or Pro Library project (project-*)
                if (projectId.startsWith('proj_')) {
                    // Pro Builder project - duplicate from local state
                    const project = projects.find(p => p.id === projectId);
                    if (!project) return;
                    
                    const copy = JSON.parse(JSON.stringify(project));
                    copy.id = `proj_${Date.now()}`;
                    copy.name = `${project.name} (Copy)`;
                    
                    setProjects(prev => [...prev, copy]);
                    setSaveMessage(`✓ Project duplicated: ${copy.name}`);
                    setTimeout(() => setSaveMessage(''), 3000);
                } else {
                    // Pro Library project - use LocalStorage_Manager
                    try {
                        const duplicatedProject = LocalStorage_Manager.duplicateProject(projectId);
                        
                        setShowProjectLibrary(false);
                        setTimeout(() => setShowProjectLibrary(true), 100);
                        
                        setSaveMessage(`✓ Project duplicated: ${duplicatedProject.title}`);
                        setTimeout(() => setSaveMessage(''), 3000);
                    } catch (error) {
                        console.error('Error duplicating project:', error);
                        setSaveMessage(`✗ Failed to duplicate project: ${error.message}`);
                        setTimeout(() => setSaveMessage(''), 5000);
                    }
                }
            };

            // ── Keyboard Shortcuts for Save/Load ────────────────────────────────────────────────
            useEffect(() => {
                const handleKeyDown = (e) => {
                    // Ctrl+S or Cmd+S - Save
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        handleSaveProject();
                    }
                    // Ctrl+O or Cmd+O - Open
                    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                        e.preventDefault();
                        setShowProjectLibrary(true);
                    }
                };
                
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [currentProject, projectTitle, projectAuthor, script, characterArcs, blueprintCharacters]);

            // ── Auto-Save Effect ────────────────────────────────────────────────
            useEffect(() => {
                if (!autoSaveEnabled || !currentProject) return;

                // Clear existing timer
                if (autoSaveTimer) clearTimeout(autoSaveTimer);

                // Set new timer for 30 seconds of inactivity
                const timer = setTimeout(() => {
                    if (currentProject && currentProject.id) {
                        const projectData = {
                            id: currentProject.id,
                            title: projectTitle || 'Untitled Project',
                            author: projectAuthor || 'Unknown',
                            blueprint: blueprint,
                            script: script,
                            characterArcs: characterArcs,
                            synopsis: synopsis,
                            metadata: {
                                wordCount: calculateWordCount(script),
                                pageCount: calculatePageCount(),
                                readingTime: calculateReadingTime(script),
                                thumbnail: ''
                            }
                        };

                        const result = LocalStorageManager.saveProject(projectData);
                        if (result.success) {
                            setLastAutoSaveTime(new Date());
                            setAutoSaveMessage('Auto-saved');
                            setTimeout(() => setAutoSaveMessage(''), 2000);
                            
                            // Task 23: Clear unsaved changes flag after auto-save
                            setHasUnsavedChanges(false);
                            setLastSavedState(JSON.stringify({ script, projectTitle, projectAuthor, characterArcs, synopsis }));
                        }
                    }
                }, 30000); // 30 seconds

                setAutoSaveTimer(timer);

                return () => {
                    if (timer) clearTimeout(timer);
                };
            }, [script, projectTitle, projectAuthor, characterArcs, synopsis, autoSaveEnabled, currentProject]);

            // ── Task 23: Unsaved Changes Detection Effect ────────────────────────────────────────────────
            useEffect(() => {
                if (!currentProject) return;
                
                const currentState = JSON.stringify({ script, projectTitle, projectAuthor, characterArcs, synopsis });
                
                // Check if state has changed from last saved state
                if (lastSavedState && currentState !== lastSavedState) {
                    setHasUnsavedChanges(true);
                } else if (!lastSavedState && currentProject.id) {
                    // First load - no changes yet
                    setLastSavedState(currentState);
                    setHasUnsavedChanges(false);
                }
            }, [script, projectTitle, projectAuthor, characterArcs, synopsis, currentProject, lastSavedState]);

            // ── Scene Breakdown Calculator ────────────────────────────────────────────────
            const calculateSceneBreakdown = () => {
                const breakdown = script.scenes.map((scene, idx) => {
                    let actionLineCount = 0;
                    let dialogueLineCount = 0;
                    let wordCount = 0;

                    scene.shots.forEach(shot => {
                        // New unified elements structure
                        if (shot.elements && shot.elements.length > 0) {
                            shot.elements.forEach(element => {
                                if (element.type === 'action' && element.text) {
                                    actionLineCount += Math.ceil(element.text.length / 60);
                                    wordCount += element.text.split(/\s+/).filter(w => w.length > 0).length;
                                } else if (element.type === 'dialogue') {
                                    dialogueLineCount += 1;
                                    if (element.dialogue) {
                                        wordCount += element.dialogue.split(/\s+/).filter(w => w.length > 0).length;
                                    }
                                }
                            });
                        }
                        // Backward compatibility: old format (action string)
                        if (shot.action) {
                            actionLineCount += Math.ceil(shot.action.length / 60);
                            wordCount += shot.action.split(/\s+/).filter(w => w.length > 0).length;
                        }
                        // Backward compatibility: old format (actions array)
                        if (shot.actions && shot.actions.length > 0) {
                            shot.actions.forEach(action => {
                                if (action.text) {
                                    actionLineCount += Math.ceil(action.text.length / 60);
                                    wordCount += action.text.split(/\s+/).filter(w => w.length > 0).length;
                                }
                            });
                        }
                        // Backward compatibility: old format (dialogueBlocks)
                        if (shot.dialogueBlocks) {
                            dialogueLineCount += shot.dialogueBlocks.length;
                            shot.dialogueBlocks.forEach(db => {
                                if (db.dialogue) {
                                    wordCount += db.dialogue.split(/\s+/).filter(w => w.length > 0).length;
                                }
                            });
                        }
                    });

                    const estimatedDuration = Math.ceil((actionLineCount + dialogueLineCount) / 55); // 1 page ≈ 1 minute

                    return {
                        sceneNumber: idx + 1,
                        label: scene.label,
                        shotCount: scene.shots.length,
                        actionLineCount,
                        dialogueLineCount,
                        wordCount,
                        estimatedDuration,
                        characters: extractCharactersFromScene(scene)
                    };
                });

                return breakdown;
            };

            const extractCharactersFromScene = (scene) => {
                const characters = new Set();
                scene.shots.forEach(shot => {
                    // New unified elements structure
                    if (shot.elements && shot.elements.length > 0) {
                        shot.elements.forEach(element => {
                            if (element.type === 'dialogue' && element.characterName) {
                                characters.add(element.characterName);
                            }
                        });
                    }
                    // Backward compatibility: old format (dialogueBlocks)
                    if (shot.dialogueBlocks) {
                        shot.dialogueBlocks.forEach(db => {
                            if (db.character) characters.add(db.character);
                            if (db.characterName) characters.add(db.characterName);
                        });
                    }
                });
                return Array.from(characters);
            };

            // ── Synopsis Handler ────────────────────────────────────────────────
            const handleSynopsisChange = (newSynopsis) => {
                setSynopsis(newSynopsis);
                // Update script metadata
                setScript(prev => ({
                    ...prev,
                    metadata: {
                        ...prev.metadata,
                        lastModified: new Date().toISOString()
                    }
                }));
            };

            const switchWritingMode = async (newMode) => {
                // If switching to same mode, do nothing
                if (newMode === writingMode) {
                    setShowModeOptions(false);
                    return;
                }

                // Preserve current script content
                const currentScenes = script.scenes;

                if (newMode === 'template-generated') {
                    setIsGenerating(true);
                    try {
                        // Generate template scaffold
                        const templateScenes = WritingModeManager.generateFromTemplate(blueprint);
                        
                        // Merge with existing content if any
                        const mergedScenes = templateScenes.map((templateScene, idx) => {
                            const existingScene = currentScenes[idx];
                            if (existingScene && existingScene.shots.some(s => s.sceneHeading || s.action)) {
                                // Keep existing content
                                return existingScene;
                            }
                            return templateScene;
                        });

                        setScript(prev => ({
                            ...prev,
                            scenes: mergedScenes,
                            metadata: {
                                ...prev.metadata,
                                writingMode: 'template-generated',
                                lastModified: new Date().toISOString()
                            }
                        }));
                        setWritingMode('template-generated');
                    } catch (error) {
                        console.error('Error generating template:', error);
                    } finally {
                        setIsGenerating(false);
                        setShowModeOptions(false);
                    }
                } else if (newMode === 'ai-generated') {
                    setIsGenerating(true);
                    try {
                        // Generate AI draft
                        const aiScenes = await WritingModeManager.generateWithAI(blueprint);
                        
                        // Merge with existing content if any
                        const mergedScenes = aiScenes.map((aiScene, idx) => {
                            const existingScene = currentScenes[idx];
                            if (existingScene && existingScene.shots.some(s => s.sceneHeading || s.action)) {
                                // Keep existing content
                                return existingScene;
                            }
                            return aiScene;
                        });

                        setScript(prev => ({
                            ...prev,
                            scenes: mergedScenes,
                            metadata: {
                                ...prev.metadata,
                                writingMode: 'ai-generated',
                                lastModified: new Date().toISOString()
                            }
                        }));
                        setWritingMode('ai-generated');
                    } catch (error) {
                        console.error('Error generating AI draft:', error);
                    } finally {
                        setIsGenerating(false);
                        setShowModeOptions(false);
                    }
                } else if (newMode === 'user-written') {
                    // Switching back to user-written mode preserves all content
                    setScript(prev => ({
                        ...prev,
                        metadata: {
                            ...prev.metadata,
                            writingMode: 'user-written',
                            lastModified: new Date().toISOString()
                        }
                    }));
                    setWritingMode('user-written');
                    setShowModeOptions(false);
                }
            };

            // ── Shot Critique Handler ────────────────────────────────────────────────
            const handleCritiqueShot = (sceneId, shotId) => {
                // Find the shot
                const scene = script.scenes.find(s => s.id === sceneId);
                if (!scene) return;
                
                const shot = scene.shots.find(s => s.id === shotId);
                if (!shot) return;

                // Extract shot data for critique
                const shotData = {
                    id: shot.id,
                    sceneHeading: shot.sceneHeading || '',
                    actions: [],
                    dialogues: [],
                    characters: []
                };

                // Extract actions and dialogues from unified elements structure
                if (shot.elements && shot.elements.length > 0) {
                    shot.elements.forEach(element => {
                        if (element.type === 'action' && element.text) {
                            shotData.actions.push(element.text);
                        } else if (element.type === 'dialogue') {
                            if (element.characterName) {
                                shotData.characters.push(element.characterName);
                            }
                            shotData.dialogues.push({
                                character: element.characterName || '',
                                parenthetical: element.parenthetical || '',
                                dialogue: element.dialogue || ''
                            });
                        }
                    });
                }

                // Backward compatibility: old format
                if (shot.actions && shot.actions.length > 0) {
                    shot.actions.forEach(action => {
                        if (action.text) shotData.actions.push(action.text);
                    });
                }
                if (shot.dialogueBlocks && shot.dialogueBlocks.length > 0) {
                    shot.dialogueBlocks.forEach(db => {
                        if (db.characterName) shotData.characters.push(db.characterName);
                        shotData.dialogues.push({
                            character: db.characterName || '',
                            parenthetical: db.parenthetical || '',
                            dialogue: db.dialogue || ''
                        });
                    });
                }

                // Get all shots in scene for context
                const allShots = scene.shots.map(s => ({
                    id: s.id,
                    subject: (s.elements || []).filter(e => e.type === 'action').map(e => e.text).join(' ') || 
                             (s.actions || []).map(a => a.text).join(' ') || '',
                    selections: {
                        shotType: inferShotType(s)
                    }
                }));

                const shotIndex = scene.shots.findIndex(s => s.id === shotId);
                const prevShot = shotIndex > 0 ? allShots[shotIndex - 1] : null;

                // Run critique using FastBrain
                const annotations = FastBrain.critiqueShot(allShots[shotIndex], prevShot, allShots);

                // Set critique data and show modal
                setCritiqueShot({ sceneId, shotId, shot: shotData });
                setCritiqueAnnotations(annotations);
                setShowShotCritique(true);
            };

            // Helper function to infer shot type from content
            const inferShotType = (shot) => {
                const actionText = (shot.elements || [])
                    .filter(e => e.type === 'action')
                    .map(e => e.text)
                    .join(' ')
                    .toLowerCase() || 
                    (shot.actions || []).map(a => a.text).join(' ').toLowerCase() || '';

                if (actionText.includes('wide') || actionText.includes('establishing')) return 'Wide Shot';
                if (actionText.includes('close') || actionText.includes('close-up')) return 'Close-Up';
                if (actionText.includes('medium')) return 'Medium Shot';
                if (actionText.includes('over the shoulder') || actionText.includes('ots')) return 'Over-the-Shoulder';
                return 'Medium Shot'; // Default
            };

            // ── Update Shot from Critique ────────────────────────────────────────────────
            const handleUpdateShotFromCritique = (sceneId, shotId, updates) => {
                setScript(prev => {
                    const updated = {
                        ...prev,
                        scenes: prev.scenes.map(scene =>
                            scene.id === sceneId
                                ? {
                                    ...scene,
                                    shots: scene.shots.map(shot =>
                                        shot.id === shotId
                                            ? {
                                                ...shot,
                                                sceneHeading: updates.sceneHeading || shot.sceneHeading,
                                                elements: updates.elements || shot.elements
                                            }
                                            : shot
                                    )
                                }
                                : scene
                        ),
                        metadata: {
                            ...prev.metadata,
                            pageCount: calculatePageCount(),
                            estimatedRuntime: calculateRuntime(),
                            lastModified: new Date().toISOString()
                        }
                    };

                    // Add to history
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(updated);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);

                    return updated;
                });

                // Close critique modal
                setShowShotCritique(false);
                addToast('✓ Shot updated from critique', 'success');
            };

            // ── Export Modal Component ────────────────────────────────────────────────
            const ExportModal = ({ project, onClose }) => {
                const [exportFormat, setExportFormat] = useState('prompt');
                const [promptTemplate, setPromptTemplate] = useState('general');
                const [showPreview, setShowPreview] = useState(false);

                const formatScriptForPrompt = (scriptData) => {
                    let output = '';
                    scriptData.scenes.forEach(scene => {
                        scene.shots.forEach(shot => {
                            if (shot.sceneHeading) output += `\n${shot.sceneHeading.toUpperCase()}\n`;
                            // Handle both old format (action string) and new format (actions array)
                            if (shot.action) {
                                output += `${shot.action}\n`;
                            } else if (shot.actions && shot.actions.length > 0) {
                                shot.actions.forEach(action => {
                                    if (action.text) output += `${action.text}\n`;
                                });
                            }
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach(db => {
                                    output += `\n${db.character.toUpperCase()}\n`;
                                    if (db.parenthetical) output += `(${db.parenthetical})\n`;
                                    output += `${db.dialogue}\n`;
                                });
                            }
                        });
                    });
                    return output;
                };

                const promptTemplates = {
                    general: `# ${project.title}

## Synopsis
${project.synopsis?.overview || 'No synopsis provided'}

## Characters
${project.synopsis?.characters?.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n') || 'No characters'}

## Setting
${project.synopsis?.setting || 'No setting provided'}

## Theme
${project.synopsis?.theme || 'No theme provided'}

## Script
${formatScriptForPrompt(project.script)}

---
Instructions: This is a screenplay prompt for AI story generation. Please analyze the synopsis, characters, and script structure, then generate [specific request].`,

                    dialogue: `# ${project.title} - Dialogue Expansion

## Current Script
${formatScriptForPrompt(project.script)}

---
Instructions: Please expand and enhance the dialogue in the above screenplay. Make conversations more natural, add subtext, and improve character voice consistency.`,

                    storyboard: `# ${project.title} - Storyboard Descriptions

## Script
${formatScriptForPrompt(project.script)}

---
Instructions: Create detailed storyboard descriptions for each scene in the above screenplay. Include camera angles, composition, lighting, and visual storytelling elements.`,

                    expansion: `# ${project.title} - Scene Expansion

## Current Script
${formatScriptForPrompt(project.script)}

---
Instructions: Expand the above screenplay by adding more scenes, deeper character development, and richer descriptions. Maintain the original story structure and tone.`
                };

                const formatForTXT = (proj) => {
                    let output = `${proj.title}\nby ${proj.author}\n\n`;
                    output += `${'='.repeat(60)}\n\n`;

                    if (proj.synopsis?.overview) {
                        output += `SYNOPSIS\n${'-'.repeat(60)}\n${proj.synopsis.overview}\n\n`;
                        if (proj.synopsis.setting) output += `Setting: ${proj.synopsis.setting}\n`;
                        if (proj.synopsis.theme) output += `Theme: ${proj.synopsis.theme}\n\n`;
                    }

                    output += `SCRIPT\n${'-'.repeat(60)}\n\n`;
                    proj.script.scenes.forEach(scene => {
                        scene.shots.forEach(shot => {
                            if (shot.sceneHeading) output += `${shot.sceneHeading.toUpperCase()}\n\n`;
                            // Handle both old format (action string) and new format (actions array)
                            if (shot.action) {
                                output += `${shot.action}\n\n`;
                            } else if (shot.actions && shot.actions.length > 0) {
                                shot.actions.forEach(action => {
                                    if (action.text) output += `${action.text}\n\n`;
                                });
                            }
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach(db => {
                                    output += `${db.character.toUpperCase()}\n`;
                                    if (db.parenthetical) output += `(${db.parenthetical})\n`;
                                    output += `${db.dialogue}\n\n`;
                                });
                            }
                        });
                    });

                    return output;
                };

                const formatForMarkdown = (proj) => {
                    let output = `# ${proj.title}\n\n`;
                    output += `**by ${proj.author}**\n\n`;

                    if (proj.synopsis?.overview) {
                        output += `## Synopsis\n\n${proj.synopsis.overview}\n\n`;
                        if (proj.synopsis.setting) output += `**Setting:** ${proj.synopsis.setting}\n\n`;
                        if (proj.synopsis.theme) output += `**Theme:** ${proj.synopsis.theme}\n\n`;
                    }

                    output += `## Script\n\n`;
                    proj.script.scenes.forEach(scene => {
                        scene.shots.forEach(shot => {
                            if (shot.sceneHeading) output += `### ${shot.sceneHeading}\n\n`;
                            // Handle both old format (action string) and new format (actions array)
                            if (shot.action) {
                                output += `${shot.action}\n\n`;
                            } else if (shot.actions && shot.actions.length > 0) {
                                shot.actions.forEach(action => {
                                    if (action.text) output += `${action.text}\n\n`;
                                });
                            }
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach(db => {
                                    output += `**${db.character}**\n`;
                                    if (db.parenthetical) output += `> *(${db.parenthetical})*\n`;
                                    output += `> ${db.dialogue}\n\n`;
                                });
                            }
                        });
                    });

                    return output;
                };

                const formatForPDF = (proj) => {
                    let html = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">`;
                    
                    html += `<div style="page-break-after: always; text-align: center; padding: 100px 0;">
                        <h1 style="font-size: 32px; margin-bottom: 20px;">${proj.title}</h1>
                        <p style="font-size: 18px; margin-bottom: 10px;">by ${proj.author}</p>
                    </div>`;

                    if (proj.synopsis?.overview) {
                        html += `<div style="page-break-after: always;">
                            <h2>Synopsis</h2>
                            <p>${proj.synopsis.overview}</p>
                            ${proj.synopsis.setting ? `<p><strong>Setting:</strong> ${proj.synopsis.setting}</p>` : ''}
                            ${proj.synopsis.theme ? `<p><strong>Theme:</strong> ${proj.synopsis.theme}</p>` : ''}
                        </div>`;
                    }

                    html += `<div><h2>Script</h2>`;
                    proj.script.scenes.forEach(scene => {
                        html += `<div style="page-break-inside: avoid;">`;
                        scene.shots.forEach(shot => {
                            if (shot.sceneHeading) {
                                html += `<p style="font-weight: bold; margin-top: 20px; margin-bottom: 10px;">${shot.sceneHeading.toUpperCase()}</p>`;
                            }
                            // Handle both old format (action string) and new format (actions array)
                            if (shot.action) {
                                html += `<p style="margin-bottom: 10px;">${shot.action.replace(/\n/g, '<br>')}</p>`;
                            } else if (shot.actions && shot.actions.length > 0) {
                                shot.actions.forEach(action => {
                                    if (action.text) {
                                        html += `<p style="margin-bottom: 10px;">${action.text.replace(/\n/g, '<br>')}</p>`;
                                    }
                                });
                            }
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach(db => {
                                    html += `<p style="text-align: center; font-weight: bold; margin-top: 10px;">${db.character.toUpperCase()}</p>`;
                                    if (db.parenthetical) {
                                        html += `<p style="text-align: center; font-style: italic; margin: 5px 0;">(${db.parenthetical})</p>`;
                                    }
                                    html += `<p style="text-align: center; margin-bottom: 10px;">${db.dialogue}</p>`;
                                });
                            }
                        });
                        html += `</div>`;
                    });
                    html += `</div></div>`;

                    return html;
                };

                const handleExport = () => {
                    let content = '';
                    let filename = '';
                    let mimeType = '';

                    switch (exportFormat) {
                        case 'prompt':
                            content = promptTemplates[promptTemplate];
                            filename = `${project.title}-prompt.txt`;
                            mimeType = 'text/plain';
                            break;
                        case 'txt':
                            content = formatForTXT(project);
                            filename = `${project.title}.txt`;
                            mimeType = 'text/plain';
                            break;
                        case 'markdown':
                            content = formatForMarkdown(project);
                            filename = `${project.title}.md`;
                            mimeType = 'text/markdown';
                            break;
                        case 'pdf':
                            const html = formatForPDF(project);
                            html2pdf()
                                .from(html)
                                .set({
                                    margin: 10,
                                    filename: `${project.title}.pdf`,
                                    html2canvas: { scale: 2 },
                                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                })
                                .save();
                            onClose();
                            return;
                        case 'json':
                            content = JSON.stringify(project, null, 2);
                            filename = `${project.title}-backup.json`;
                            mimeType = 'application/json';
                            break;
                        default:
                            return;
                    }

                    if (exportFormat === 'prompt') {
                        navigator.clipboard.writeText(content).then(() => {
                            addToast('Prompt copied to clipboard!', 'success', 3000);
                            onClose();
                        }).catch(() => {
                            const blob = new Blob([content], { type: mimeType });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            onClose();
                        });
                    } else {
                        const blob = new Blob([content], { type: mimeType });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        onClose();
                    }
                };

                const previewContent = exportFormat === 'prompt' ? promptTemplates[promptTemplate] : '';

                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border-light dark:border-border-dark">
                            <div className="p-6 border-b border-border-light dark:border-border-dark">
                                <h2 className="text-2xl font-bold">Export Project</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-3">Export Format</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'prompt', label: 'AI Prompt', desc: 'For AI story generation' },
                                            { id: 'txt', label: 'Text File', desc: 'Plain text screenplay' },
                                            { id: 'markdown', label: 'Markdown', desc: 'Markdown format' },
                                            { id: 'pdf', label: 'PDF', desc: 'Professional PDF' },
                                            { id: 'json', label: 'JSON', desc: 'Project backup' }
                                        ].map(fmt => (
                                            <button
                                                key={fmt.id}
                                                onClick={() => setExportFormat(fmt.id)}
                                                className={`p-3 rounded-lg border text-left transition-all ${
                                                    exportFormat === fmt.id
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="font-semibold text-sm">{fmt.label}</div>
                                                <div className="text-xs text-textMuted-light dark:text-textMuted-dark">{fmt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {exportFormat === 'prompt' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-3">Prompt Template</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'general', label: 'General', desc: 'Standard story generation' },
                                                { id: 'dialogue', label: 'Dialogue', desc: 'Expand dialogue' },
                                                { id: 'storyboard', label: 'Storyboard', desc: 'Visual descriptions' },
                                                { id: 'expansion', label: 'Expansion', desc: 'Expand scenes' }
                                            ].map(tpl => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => setPromptTemplate(tpl.id)}
                                                    className={`p-3 rounded-lg border text-left transition-all ${
                                                        promptTemplate === tpl.id
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-sm">{tpl.label}</div>
                                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark">{tpl.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {exportFormat === 'prompt' && (
                                    <div>
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="text-sm font-semibold text-primary hover:underline"
                                        >
                                            {showPreview ? '▼ Hide Preview' : '▶ Show Preview'}
                                        </button>
                                        {showPreview && (
                                            <div className="mt-3 p-4 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark max-h-64 overflow-y-auto">
                                                <pre className="text-xs whitespace-pre-wrap font-mono">{previewContent}</pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border-light dark:border-border-dark p-6 flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                >
                                    {exportFormat === 'prompt' ? 'Copy to Clipboard' : 'Download'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                );
            };

            // ── Scene Breakdown Component ────────────────────────────────────────────────
            const SceneBreakdownPanel = ({ script, blueprint }) => {
                const breakdown = calculateSceneBreakdown();
                const totalDuration = breakdown.reduce((sum, scene) => sum + scene.estimatedDuration, 0);
                const avgDuration = Math.round(totalDuration / breakdown.length);
                const longestScene = breakdown.reduce((max, scene) => scene.estimatedDuration > max.estimatedDuration ? scene : max);
                const shortestScene = breakdown.reduce((min, scene) => scene.estimatedDuration < min.estimatedDuration ? scene : min);

                return (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-panel-light dark:bg-panel-dark rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border-light dark:border-border-dark">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                                <h2 className="text-xl font-bold">Scene Breakdown</h2>
                                <button
                                    onClick={() => setShowSceneBreakdown(false)}
                                    className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                >
                                    <Icon name="X" size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="p-4 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        <div className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Total Scenes</div>
                                        <div className="text-2xl font-bold">{breakdown.length}</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        <div className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Total Runtime</div>
                                        <div className="text-2xl font-bold">{totalDuration} min</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        <div className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Avg Duration</div>
                                        <div className="text-2xl font-bold">{avgDuration} min</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                        <div className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Total Words</div>
                                        <div className="text-2xl font-bold">{breakdown.reduce((sum, s) => sum + s.wordCount, 0)}</div>
                                    </div>
                                </div>

                                {/* Scene List */}
                                <div className="space-y-3">
                                    {breakdown.map((scene, idx) => {
                                        const barWidth = (scene.estimatedDuration / longestScene.estimatedDuration) * 100;
                                        return (
                                            <div key={idx} className="p-4 rounded-lg border border-border-light dark:border-border-dark hover:border-primary/50 transition-all">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <div className="font-semibold">Scene {scene.sceneNumber}: {scene.label}</div>
                                                        <div className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1">
                                                            {scene.shotCount} shot{scene.shotCount !== 1 ? 's' : ''} • {scene.actionLineCount} action lines • {scene.dialogueLineCount} dialogue lines
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-primary">{scene.estimatedDuration} min</div>
                                                        <div className="text-xs text-textMuted-light dark:text-textMuted-dark">{scene.wordCount} words</div>
                                                    </div>
                                                </div>

                                                {/* Duration Bar */}
                                                <div className="w-full h-2 bg-input-light dark:bg-input-dark rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                                                        style={{ width: `${barWidth}%` }}
                                                    />
                                                </div>

                                                {/* Characters */}
                                                {scene.characters.length > 0 && (
                                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark">
                                                        Characters: {scene.characters.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Longest/Shortest Scenes */}
                                <div className="mt-8 p-4 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark">
                                    <div className="font-semibold mb-3">Scene Extremes</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Longest Scene</div>
                                            <div className="font-semibold">{longestScene.label}</div>
                                            <div className="text-sm text-textMuted-light dark:text-textMuted-dark">{longestScene.estimatedDuration} minutes</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Shortest Scene</div>
                                            <div className="font-semibold">{shortestScene.label}</div>
                                            <div className="text-sm text-textMuted-light dark:text-textMuted-dark">{shortestScene.estimatedDuration} minutes</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border-light dark:border-border-dark flex gap-2">
                                <button
                                    onClick={() => {
                                        // Export as CSV
                                        let csv = 'Scene,Label,Shots,Action Lines,Dialogue Lines,Duration (min),Word Count,Characters\n';
                                        breakdown.forEach(scene => {
                                            csv += `${scene.sceneNumber},"${scene.label}",${scene.shotCount},${scene.actionLineCount},${scene.dialogueLineCount},${scene.estimatedDuration},${scene.wordCount},"${scene.characters.join(', ')}"\n`;
                                        });
                                        const blob = new Blob([csv], { type: 'text/csv' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${blueprint.title || 'breakdown'}-scenes.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark font-semibold"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => setShowSceneBreakdown(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            };

            // ── Character Arc Summary Component ────────────────────────────────────────────────
            const CharacterArcSummaryPanel = ({ characterArcs, script, blueprint, onNavigateToScene }) => {
                const [selectedCharacterId, setSelectedCharacterId] = useState(null);

                const renderArcGraph = (arc) => {
                    if (!arc.emotionalBeats || arc.emotionalBeats.length === 0) return null;

                    const width = 300;
                    const height = 150;
                    const padding = 20;
                    const graphWidth = width - padding * 2;
                    const graphHeight = height - padding * 2;

                    // Calculate points
                    const maxScene = Math.max(...arc.emotionalBeats.map(b => b.scene));
                    const points = arc.emotionalBeats.map((beat, idx) => {
                        const x = padding + (beat.scene / maxScene) * graphWidth;
                        const y = height - padding - (beat.value / 10) * graphHeight;
                        return { x, y, ...beat };
                    });

                    // Create path
                    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                    return (
                        <svg width={width} height={height} className="border border-border-light dark:border-border-dark rounded">
                            {/* Grid lines */}
                            {[0, 2, 4, 6, 8, 10].map(val => (
                                <line
                                    key={`grid-${val}`}
                                    x1={padding}
                                    y1={height - padding - (val / 10) * graphHeight}
                                    x2={width - padding}
                                    y2={height - padding - (val / 10) * graphHeight}
                                    stroke="#333"
                                    strokeDasharray="2,2"
                                    opacity="0.3"
                                />
                            ))}

                            {/* Axes */}
                            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#666" strokeWidth="1" />
                            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#666" strokeWidth="1" />

                            {/* Line */}
                            <path d={pathData} stroke="rgb(var(--color-primary))" strokeWidth="2" fill="none" />

                            {/* Points */}
                            {points.map((p, i) => (
                                <circle
                                    key={`point-${i}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r="4"
                                    fill="rgb(var(--color-primary))"
                                    stroke="white"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Labels */}
                            <text x={padding - 10} y={height - padding + 15} fontSize="10" fill="#999">
                                Scenes
                            </text>
                            <text x={10} y={padding - 5} fontSize="10" fill="#999">
                                Emotion
                            </text>
                        </svg>
                    );
                };

                return (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-panel-light dark:bg-panel-dark rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border-light dark:border-border-dark">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                                <h2 className="text-xl font-bold">Character Arc Summary</h2>
                                <button
                                    onClick={() => setShowCharacterArcs(false)}
                                    className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                >
                                    <Icon name="X" size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                {characterArcs && characterArcs.length > 0 ? (
                                    characterArcs.map((arc, idx) => (
                                        <div key={idx} className="p-4 rounded-lg border border-border-light dark:border-border-dark">
                                            {/* Character Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold">{arc.characterName || `Character ${idx + 1}`}</h3>
                                                    <div className="text-sm text-textMuted-light dark:text-textMuted-dark mt-1">
                                                        {arc.startingState && <span>Start: <strong>{arc.startingState}</strong></span>}
                                                        {arc.startingState && arc.endingState && <span> → </span>}
                                                        {arc.endingState && <span>End: <strong>{arc.endingState}</strong></span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Arc Graph */}
                                            <div className="mb-4 flex justify-center">
                                                {renderArcGraph(arc)}
                                            </div>

                                            {/* Turning Points */}
                                            {arc.turningPoints && arc.turningPoints.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2">Key Turning Points</h4>
                                                    <div className="space-y-2">
                                                        {arc.turningPoints.map((tp, tpIdx) => (
                                                            <button
                                                                key={tpIdx}
                                                                onClick={() => {
                                                                    if (onNavigateToScene) {
                                                                        onNavigateToScene(tp.sceneNumber);
                                                                    }
                                                                }}
                                                                className="w-full text-left p-2 rounded border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark transition-all"
                                                            >
                                                                <div className="text-sm font-semibold">
                                                                    Scene {tp.sceneNumber}: {tp.sceneLabel}
                                                                </div>
                                                                <div className="text-xs text-textMuted-light dark:text-textMuted-dark">
                                                                    {tp.emotionalState && <span>Emotional State: {tp.emotionalState}</span>}
                                                                    {tp.description && <span> • {tp.description}</span>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-textMuted-light dark:text-textMuted-dark">
                                        <Icon name="Heart" size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-semibold">No Character Arcs Defined</p>
                                        <p className="text-sm mt-2">Use the Character Arc Mapper to define character transformations</p>
                                        <button
                                            onClick={() => {
                                                setShowCharacterArcs(false);
                                                setShowCharacterArcMapper(true);
                                            }}
                                            className="mt-4 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                        >
                                            Define Arcs
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border-light dark:border-border-dark flex gap-2">
                                <button
                                    onClick={() => setShowCharacterArcs(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            };

            // ── Story Output Panel Component ────────────────────────────────────────────────
            const StoryOutputPanel = ({ script, blueprint, characterArcs, synopsis, onSynopsisChange, onClose }) => {
                const [viewMode, setViewMode] = useState('screenplay');
                const [showCharacterHighlight, setShowCharacterHighlight] = useState(true);
                const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
                const [editedSynopsis, setEditedSynopsis] = useState(synopsis);
                const [hoveredCharacter, setHoveredCharacter] = useState(null);

                // Character highlight colors (8 distinct colors, cycling)
                const CHARACTER_COLORS = [
                    '#fbbf24',  // Amber
                    '#60a5fa',  // Blue
                    '#34d399',  // Emerald
                    '#f87171',  // Red
                    '#a78bfa',  // Violet
                    '#fb923c',  // Orange
                    '#4ade80',  // Green
                    '#06b6d4',  // Cyan
                ];

                // Extract all character names from dialogue blocks
                const getCharacterNames = () => {
                    const names = new Set();
                    script.scenes.forEach(scene => {
                        scene.shots.forEach(shot => {
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach(db => {
                                    if (db.character) {
                                        names.add(db.character.toUpperCase());
                                    }
                                });
                            }
                        });
                    });
                    return Array.from(names);
                };

                const characterNames = getCharacterNames();
                const characterColorMap = {};
                characterNames.forEach((name, idx) => {
                    characterColorMap[name] = CHARACTER_COLORS[idx % CHARACTER_COLORS.length];
                });

                // Highlight character mentions in text (case-insensitive, excluding scene headings)
                const highlightCharacterMentions = (text, isSceneHeading = false) => {
                    if (!showCharacterHighlight || isSceneHeading || !text) return text;

                    let highlightedText = text;
                    characterNames.forEach(name => {
                        const regex = new RegExp(`\\b${name}\\b`, 'gi');
                        const color = characterColorMap[name];
                        const isHovered = hoveredCharacter === name;
                        highlightedText = highlightedText.replace(regex, (match) => {
                            return `<span 
                                class="character-mention ${isHovered ? 'character-mention-hovered' : ''}" 
                                style="background-color: ${color}33; color: ${color}; padding: 2px 4px; border-radius: 3px; cursor: pointer; ${isHovered ? 'animation: pulse 1s infinite;' : ''}"
                                data-character="${name}"
                            >${match}</span>`;
                        });
                    });

                    return highlightedText;
                };

                const calculateStats = () => {
                    let wordCount = 0;
                    let actionLines = 0;
                    let dialogueLines = 0;

                    script.scenes.forEach(scene => {
                        scene.shots.forEach(shot => {
                            // New unified elements structure
                            if (shot.elements && shot.elements.length > 0) {
                                shot.elements.forEach(element => {
                                    if (element.type === 'action' && element.text) {
                                        wordCount += element.text.split(/\s+/).filter(w => w.length > 0).length;
                                        actionLines += element.text.split('\n').length;
                                    } else if (element.type === 'dialogue' && element.dialogue) {
                                        wordCount += element.dialogue.split(/\s+/).filter(w => w.length > 0).length;
                                        dialogueLines += element.dialogue.split('\n').length;
                                    }
                                });
                            }
                            // Backward compatibility: old format (action string)
                            if (shot.action) {
                                wordCount += shot.action.split(/\s+/).filter(w => w.length > 0).length;
                                actionLines += shot.action.split('\n').length;
                            }
                            // Backward compatibility: old format (actions array)
                            if (shot.actions && shot.actions.length > 0) {
                                shot.actions.forEach(action => {
                                    if (action.text) {
                                        wordCount += action.text.split(/\s+/).filter(w => w.length > 0).length;
                                        actionLines += action.text.split('\n').length;
                                    }
                                });
                            }
                            // Backward compatibility: old format (dialogueBlocks)
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach(db => {
                                    if (db.dialogue) {
                                        wordCount += db.dialogue.split(/\s+/).filter(w => w.length > 0).length;
                                        dialogueLines += db.dialogue.split('\n').length;
                                    }
                                });
                            }
                        });
                    });

                    const pageCount = Math.ceil((actionLines + dialogueLines) / 55);
                    const readingTime = Math.ceil(wordCount / 150);

                    return { wordCount, pageCount, readingTime, actionLines, dialogueLines };
                };

                const stats = calculateStats();

                const formatScreenplay = () => {
                    const lines = [];

                    script.scenes.forEach((scene, sceneIdx) => {
                        scene.shots.forEach((shot, shotIdx) => {
                            if (shot.sceneHeading) {
                                lines.push({
                                    type: 'heading',
                                    text: shot.sceneHeading.toUpperCase(),
                                    sceneIdx,
                                    shotIdx
                                });
                            }

                            // New unified elements structure
                            if (shot.elements && shot.elements.length > 0) {
                                shot.elements.forEach((element, elementIdx) => {
                                    if (element.type === 'action' && element.text) {
                                        lines.push({
                                            type: 'action',
                                            text: element.text,
                                            sceneIdx,
                                            shotIdx,
                                            elementIdx
                                        });
                                    } else if (element.type === 'dialogue') {
                                        if (element.characterName) {
                                            lines.push({
                                                type: 'character',
                                                text: element.characterName.toUpperCase(),
                                                sceneIdx,
                                                shotIdx,
                                                elementIdx
                                            });
                                        }
                                        if (element.parenthetical) {
                                            lines.push({
                                                type: 'parenthetical',
                                                text: `(${element.parenthetical})`,
                                                sceneIdx,
                                                shotIdx,
                                                elementIdx
                                            });
                                        }
                                        if (element.dialogue) {
                                            lines.push({
                                                type: 'dialogue',
                                                text: element.dialogue,
                                                character: element.characterName,
                                                sceneIdx,
                                                shotIdx,
                                                elementIdx
                                            });
                                        }
                                    }
                                });
                            }
                            
                            // Backward compatibility: old format (action string)
                            if (shot.action) {
                                lines.push({
                                    type: 'action',
                                    text: shot.action,
                                    sceneIdx,
                                    shotIdx
                                });
                            }
                            // Backward compatibility: old format (actions array)
                            if (shot.actions && shot.actions.length > 0) {
                                shot.actions.forEach((action, actionIdx) => {
                                    if (action.text) {
                                        lines.push({
                                            type: 'action',
                                            text: action.text,
                                            sceneIdx,
                                            shotIdx,
                                            actionIdx
                                        });
                                    }
                                });
                            }

                            // Backward compatibility: old format (dialogueBlocks)
                            if (shot.dialogueBlocks) {
                                shot.dialogueBlocks.forEach((db, dbIdx) => {
                                    lines.push({
                                        type: 'character',
                                        text: db.character.toUpperCase(),
                                        sceneIdx,
                                        shotIdx,
                                        dbIdx
                                    });

                                    if (db.parenthetical) {
                                        lines.push({
                                            type: 'parenthetical',
                                            text: `(${db.parenthetical})`,
                                            sceneIdx,
                                            shotIdx,
                                            dbIdx
                                        });
                                    }

                                    lines.push({
                                        type: 'dialogue',
                                        text: db.dialogue,
                                        character: db.character,
                                        sceneIdx,
                                        shotIdx,
                                        dbIdx
                                    });
                                });
                            }
                        });
                    });

                    return lines;
                };

                const screenplayLines = formatScreenplay();

                return (
                    <div className="fixed inset-0 bg-panel-light dark:bg-panel-dark flex flex-col z-40 overflow-hidden">
                        {/* Header */}
                        <div className="border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Story Output</h2>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setViewMode('screenplay')}
                                    className={`px-3 py-1 rounded text-sm font-semibold ${
                                        viewMode === 'screenplay'
                                            ? 'bg-primary text-black'
                                            : 'border border-border-light dark:border-border-dark'
                                    }`}
                                >
                                    Screenplay
                                </button>
                                <button
                                    onClick={() => setViewMode('prose')}
                                    className={`px-3 py-1 rounded text-sm font-semibold ${
                                        viewMode === 'prose'
                                            ? 'bg-primary text-black'
                                            : 'border border-border-light dark:border-border-dark'
                                    }`}
                                >
                                    Prose
                                </button>
                                <button
                                    onClick={() => setShowCharacterHighlight(!showCharacterHighlight)}
                                    className={`px-3 py-1 rounded text-sm font-semibold border ${
                                        showCharacterHighlight
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border-light dark:border-border-dark'
                                    }`}
                                >
                                    Highlight
                                </button>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="ml-2 p-2 rounded-lg hover:bg-input-light dark:hover:bg-input-dark text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark transition-colors"
                                        title="Close Story Output"
                                    >
                                        <Icon name="X" size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {/* Synopsis Section */}
                            {isEditingSynopsis ? (
                                <div className="mb-8 p-4 border border-border-light dark:border-border-dark rounded-lg relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Edit Synopsis</h3>
                                        <button
                                            onClick={() => setIsEditingSynopsis(false)}
                                            className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                            title="Close"
                                        >
                                            <Icon name="X" size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Overview</label>
                                            <textarea
                                                value={editedSynopsis.overview}
                                                onChange={(e) => setEditedSynopsis({ ...editedSynopsis, overview: e.target.value })}
                                                placeholder="Story overview..."
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark h-20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Setting</label>
                                            <input
                                                type="text"
                                                value={editedSynopsis.setting}
                                                onChange={(e) => setEditedSynopsis({ ...editedSynopsis, setting: e.target.value })}
                                                placeholder="Setting description..."
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Theme</label>
                                            <input
                                                type="text"
                                                value={editedSynopsis.theme}
                                                onChange={(e) => setEditedSynopsis({ ...editedSynopsis, theme: e.target.value })}
                                                placeholder="Theme and tone..."
                                                className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    onSynopsisChange(editedSynopsis);
                                                    setIsEditingSynopsis(false);
                                                }}
                                                className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setIsEditingSynopsis(false)}
                                                className="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 p-4 border border-border-light dark:border-border-dark rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold">Synopsis</h3>
                                        <button
                                            onClick={() => setIsEditingSynopsis(true)}
                                            className="px-3 py-1 rounded text-sm border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    {editedSynopsis.overview && (
                                        <p className="mb-3 text-textMuted-light dark:text-textMuted-dark">{editedSynopsis.overview}</p>
                                    )}
                                    {editedSynopsis.setting && (
                                        <p className="mb-2 text-sm"><strong>Setting:</strong> {editedSynopsis.setting}</p>
                                    )}
                                    {editedSynopsis.theme && (
                                        <p className="text-sm"><strong>Theme:</strong> {editedSynopsis.theme}</p>
                                    )}
                                    {!editedSynopsis.overview && !editedSynopsis.setting && !editedSynopsis.theme && (
                                        <p className="text-textMuted-light dark:text-textMuted-dark italic">No synopsis yet. Click Edit to add one.</p>
                                    )}
                                </div>
                            )}

                            {/* Screenplay Format */}
                            {viewMode === 'screenplay' && (
                                <div 
                                    className="font-mono text-sm space-y-2"
                                    onClick={(e) => {
                                        const target = e.target;
                                        if (target.classList.contains('character-mention')) {
                                            const characterName = target.getAttribute('data-character');
                                            setHoveredCharacter(characterName);
                                            setTimeout(() => setHoveredCharacter(null), 2000);
                                        }
                                    }}
                                    onMouseOver={(e) => {
                                        const target = e.target;
                                        if (target.classList.contains('character-mention')) {
                                            const characterName = target.getAttribute('data-character');
                                            setHoveredCharacter(characterName);
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        const target = e.target;
                                        if (target.classList.contains('character-mention')) {
                                            setHoveredCharacter(null);
                                        }
                                    }}
                                >
                                    {screenplayLines.map((line, idx) => {
                                        if (line.type === 'heading') {
                                            return (
                                                <div key={idx} className="font-bold text-center my-4">
                                                    {line.text}
                                                </div>
                                            );
                                        } else if (line.type === 'action') {
                                            const highlightedText = highlightCharacterMentions(line.text, false);
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="text-textMuted-light dark:text-textMuted-dark whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ __html: highlightedText }}
                                                />
                                            );
                                        } else if (line.type === 'character') {
                                            const color = characterColorMap[line.text];
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="text-center font-bold my-2"
                                                    style={{ color: showCharacterHighlight ? color : 'inherit' }}
                                                >
                                                    {line.text}
                                                </div>
                                            );
                                        } else if (line.type === 'parenthetical') {
                                            return (
                                                <div key={idx} className="text-center text-textMuted-light dark:text-textMuted-dark italic">
                                                    {line.text}
                                                </div>
                                            );
                                        } else if (line.type === 'dialogue') {
                                            return (
                                                <div key={idx} className="text-center max-w-md mx-auto whitespace-pre-wrap">
                                                    {line.text}
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            )}

                            {/* Prose Format */}
                            {viewMode === 'prose' && (
                                <div className="space-y-4 max-w-2xl">
                                    {screenplayLines.map((line, idx) => {
                                        if (line.type === 'heading') {
                                            return (
                                                <h3 key={idx} className="text-lg font-bold mt-6 mb-2">
                                                    {line.text}
                                                </h3>
                                            );
                                        } else if (line.type === 'action') {
                                            return (
                                                <p key={idx} className="text-justify">
                                                    {line.text}
                                                </p>
                                            );
                                        } else if (line.type === 'dialogue') {
                                            return (
                                                <p key={idx} className="italic pl-4 border-l-2 border-primary">
                                                    <strong>{line.character}:</strong> {line.text}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer with Statistics */}
                        <div className="border-t border-border-light dark:border-border-dark p-4 bg-input-light dark:bg-input-dark flex items-center justify-between text-sm">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-textMuted-light dark:text-textMuted-dark">Words:</span>
                                    <span className="ml-2 font-semibold">{stats.wordCount}</span>
                                </div>
                                <div>
                                    <span className="text-textMuted-light dark:text-textMuted-dark">Pages:</span>
                                    <span className="ml-2 font-semibold">{stats.pageCount}</span>
                                </div>
                                <div>
                                    <span className="text-textMuted-light dark:text-textMuted-dark">Reading Time:</span>
                                    <span className="ml-2 font-semibold">{stats.readingTime} min</span>
                                </div>
                            </div>
                            <div className="text-textMuted-light dark:text-textMuted-dark">
                                {stats.actionLines} action lines • {stats.dialogueLines} dialogue lines
                            </div>
                        </div>
                    </div>
                );
            };

            // ── Save Project Dialog Component ────────────────────────────────────────────────
            const SaveProjectDialog = React.useMemo(() => {
                if (!showSaveDialog) return null;
                
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
                        if (e.target === e.currentTarget) setShowSaveDialog(false);
                    }}>
                        <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl w-full max-w-md p-6 border border-border-light dark:border-border-dark">
                            <h2 className="text-2xl font-bold mb-4">Save Project</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Project Title *</label>
                                    <input
                                        type="text"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="Enter project title..."
                                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Author</label>
                                    <input
                                        type="text"
                                        value={projectAuthor}
                                        onChange={(e) => setProjectAuthor(e.target.value)}
                                        placeholder="Enter author name..."
                                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={saveCurrentProject}
                                        disabled={!projectTitle.trim() || isSaving}
                                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Project'}
                                    </button>
                                    <button
                                        onClick={() => setShowSaveDialog(false)}
                                        className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }, [showSaveDialog, projectTitle, projectAuthor, isSaving]);

            // ── Project Library Component ────────────────────────────────────────────────
            const ProjectLibrary = () => {
                const [projects, setProjects] = useState(LocalStorageManager.getAllProjects());
                const [searchQuery, setSearchQuery] = useState('');
                const [sortBy, setSortBy] = useState('lastModified');
                const [filterType, setFilterType] = useState('all');
                const [filterDuration, setFilterDuration] = useState('all');
                const [filterDateRange, setFilterDateRange] = useState('all');
                const [selectedProjects, setSelectedProjects] = useState(new Set());
                const [showStorageWarning, setShowStorageWarning] = useState(false);
                const [contextMenu, setContextMenu] = useState(null);
                
                const storageInfo = LocalStorageManager.getStorageUsage();
                
                // Get unique story types and durations from projects
                const storyTypes = [...new Set(projects.map(p => p.blueprint?.storyType).filter(Boolean))];
                const durations = [...new Set(projects.map(p => p.blueprint?.duration).filter(Boolean))].sort((a, b) => {
                    const aNum = parseInt(a);
                    const bNum = parseInt(b);
                    return aNum - bNum;
                });
                
                // Filter and sort projects
                const filteredProjects = projects
                    .filter(p => {
                        // Search filter (title, author, synopsis)
                        const searchLower = searchQuery.toLowerCase();
                        const matchesSearch = !searchQuery || 
                            p.title.toLowerCase().includes(searchLower) ||
                            (p.author && p.author.toLowerCase().includes(searchLower)) ||
                            (p.synopsis?.overview && p.synopsis.overview.toLowerCase().includes(searchLower));
                        
                        // Story type filter
                        const matchesType = filterType === 'all' || p.blueprint?.storyType === filterType;
                        
                        // Duration filter
                        const matchesDuration = filterDuration === 'all' || p.blueprint?.duration === filterDuration;
                        
                        // Date range filter
                        let matchesDate = true;
                        if (filterDateRange !== 'all') {
                            const projectDate = new Date(p.lastModified);
                            const now = new Date();
                            const daysDiff = Math.floor((now - projectDate) / (1000 * 60 * 60 * 24));
                            
                            switch(filterDateRange) {
                                case 'today':
                                    matchesDate = daysDiff === 0;
                                    break;
                                case 'week':
                                    matchesDate = daysDiff <= 7;
                                    break;
                                case 'month':
                                    matchesDate = daysDiff <= 30;
                                    break;
                                case 'year':
                                    matchesDate = daysDiff <= 365;
                                    break;
                            }
                        }
                        
                        return matchesSearch && matchesType && matchesDuration && matchesDate;
                    })
                    .sort((a, b) => {
                        if (sortBy === 'title') return a.title.localeCompare(b.title);
                        if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
                        return new Date(b.lastModified) - new Date(a.lastModified);
                    });
                
                const handleImport = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    try {
                        const project = await LocalStorageManager.importProjectJSON(file);
                        const result = LocalStorageManager.saveProject(project);
                        if (result.success) {
                            setProjects(LocalStorageManager.getAllProjects());
                            addToast('Project imported successfully!', 'success', 3000);
                        }
                    } catch (error) {
                        addToast(`Import failed: ${error.message}`, 'error', 4000);
                    }
                };

                // ── Storage Management Functions ────────────────────────────────────────────────
                const toggleProjectSelection = (projectId) => {
                    const newSelected = new Set(selectedProjects);
                    if (newSelected.has(projectId)) {
                        newSelected.delete(projectId);
                    } else {
                        newSelected.add(projectId);
                    }
                    setSelectedProjects(newSelected);
                };

                const selectAllProjects = () => {
                    if (selectedProjects.size === filteredProjects.length) {
                        setSelectedProjects(new Set());
                    } else {
                        setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
                    }
                };

                const bulkDeleteProjects = () => {
                    if (selectedProjects.size === 0) return;
                    
                    if (confirm(`Delete ${selectedProjects.size} project(s)? This cannot be undone.`)) {
                        selectedProjects.forEach(projectId => {
                            LocalStorageManager.deleteProject(projectId);
                        });
                        setProjects(LocalStorageManager.getAllProjects());
                        setSelectedProjects(new Set());
                    }
                };

                const getProjectSize = (project) => {
                    const projectJSON = JSON.stringify(project);
                    return Math.round(projectJSON.length / 1024); // Convert to KB
                };

                const calculateTotalSize = () => {
                    return projects.reduce((sum, p) => sum + getProjectSize(p), 0);
                };

                // ── Storage Warning Effect ────────────────────────────────────────────────
                useEffect(() => {
                    if (storageInfo.percentage >= 80) {
                        setShowStorageWarning(true);
                    }
                }, [storageInfo.percentage]);

                // ── Context Menu Handlers ────────────────────────────────────────────────
                const handleContextMenu = (e, project) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        project
                    });
                };

                const closeContextMenu = () => {
                    setContextMenu(null);
                };

                useEffect(() => {
                    const handleClick = () => closeContextMenu();
                    const handleEscape = (e) => {
                        if (e.key === 'Escape') closeContextMenu();
                    };
                    
                    if (contextMenu) {
                        window.addEventListener('click', handleClick);
                        window.addEventListener('keydown', handleEscape);
                        return () => {
                            window.removeEventListener('click', handleClick);
                            window.removeEventListener('keydown', handleEscape);
                        };
                    }
                }, [contextMenu]);

                // ── Keyboard Shortcuts ────────────────────────────────────────────────
                useEffect(() => {
                    const handleKeyDown = (e) => {
                        // Ctrl/Cmd + D: Duplicate selected project
                        if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedProjects.size === 1) {
                            e.preventDefault();
                            const projectId = Array.from(selectedProjects)[0];
                            handleDuplicateProject(projectId);
                        }
                        // Ctrl/Cmd + E: Export selected project
                        if ((e.ctrlKey || e.metaKey) && e.key === 'e' && selectedProjects.size === 1) {
                            e.preventDefault();
                            const projectId = Array.from(selectedProjects)[0];
                            const project = projects.find(p => p.id === projectId);
                            if (project) LocalStorageManager.exportProjectJSON(project);
                        }
                        // Delete: Delete selected projects
                        if (e.key === 'Delete' && selectedProjects.size > 0) {
                            e.preventDefault();
                            bulkDeleteProjects();
                        }
                        // Enter: Open selected project
                        if (e.key === 'Enter' && selectedProjects.size === 1) {
                            e.preventDefault();
                            const projectId = Array.from(selectedProjects)[0];
                            handleLoadProject(projectId);
                        }
                    };

                    window.addEventListener('keydown', handleKeyDown);
                    return () => window.removeEventListener('keydown', handleKeyDown);
                }, [selectedProjects, projects]);
                
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border-light dark:border-border-dark">
                            {/* Header */}
                            <div className="p-6 border-b border-border-light dark:border-border-dark">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold">Project Library</h2>
                                    <button
                                        onClick={() => setShowProjectLibrary(false)}
                                        className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                    >
                                        <Icon name="X" size={24} />
                                    </button>
                                </div>
                                
                                {/* Search and filters */}
                                <div className="space-y-3">
                                    {/* Search bar */}
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1 relative">
                                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted-light dark:text-textMuted-dark" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by title, author, or synopsis..."
                                                className="w-full pl-10 pr-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm"
                                            />
                                        </div>
                                        <label className="px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover cursor-pointer whitespace-nowrap text-sm">
                                            <Icon name="Upload" size={16} className="inline mr-2" />
                                            Import
                                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                        </label>
                                    </div>
                                    
                                    {/* Filter and sort controls */}
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm"
                                            title="Filter by story type"
                                        >
                                            <option value="all">All Types</option>
                                            {storyTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={filterDuration}
                                            onChange={(e) => setFilterDuration(e.target.value)}
                                            className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm"
                                            title="Filter by duration"
                                        >
                                            <option value="all">All Durations</option>
                                            {durations.map(duration => (
                                                <option key={duration} value={duration}>{duration}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={filterDateRange}
                                            onChange={(e) => setFilterDateRange(e.target.value)}
                                            className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm"
                                            title="Filter by date modified"
                                        >
                                            <option value="all">All Time</option>
                                            <option value="today">Today</option>
                                            <option value="week">Past Week</option>
                                            <option value="month">Past Month</option>
                                            <option value="year">Past Year</option>
                                        </select>
                                        
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm"
                                            title="Sort projects"
                                        >
                                            <option value="lastModified">Sort: Last Modified</option>
                                            <option value="title">Sort: Title (A-Z)</option>
                                            <option value="createdAt">Sort: Date Created</option>
                                        </select>
                                        
                                        {/* Clear filters button */}
                                        {(searchQuery || filterType !== 'all' || filterDuration !== 'all' || filterDateRange !== 'all') && (
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setFilterType('all');
                                                    setFilterDuration('all');
                                                    setFilterDateRange('all');
                                                }}
                                                className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:bg-red-500/10 hover:border-red-500/50 text-sm"
                                                title="Clear all filters"
                                            >
                                                <Icon name="X" size={14} className="inline mr-1" />
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Storage Warning */}
                                {storageInfo.percentage >= 90 && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500 text-sm">
                                        <div className="font-semibold mb-1">⚠ Storage Critical</div>
                                        <div>{storageInfo.used} MB / {storageInfo.available} MB used</div>
                                        <div className="text-xs mt-2">Delete projects or export as JSON to free up space</div>
                                    </div>
                                )}
                                {storageInfo.percentage >= 80 && storageInfo.percentage < 90 && (
                                    <div className="mt-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 text-sm">
                                        <div className="font-semibold mb-1">⚠ Storage Running Low</div>
                                        <div>{storageInfo.used} MB / {storageInfo.available} MB used</div>
                                        <div className="text-xs mt-2">Consider deleting old projects or exporting them as JSON backups</div>
                                    </div>
                                )}

                                {/* Storage info */}
                                <div className="mt-4 text-xs text-textMuted-light dark:text-textMuted-dark">
                                    <span>
                                        {filteredProjects.length === projects.length 
                                            ? `${projects.length} projects` 
                                            : `Showing ${filteredProjects.length} of ${projects.length} projects`}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span>{storageInfo.used} MB / {storageInfo.available} MB used ({storageInfo.percentage}%)</span>
                                </div>

                                {/* Bulk Selection Controls */}
                                {filteredProjects.length > 0 && (
                                    <div className="mt-4 flex gap-2 items-center">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                                                onChange={selectAllProjects}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm font-semibold">Select All</span>
                                        </label>
                                        {selectedProjects.size > 0 && (
                                            <>
                                                <span className="text-xs text-textMuted-light dark:text-textMuted-dark">
                                                    {selectedProjects.size} selected
                                                </span>
                                                <button
                                                    onClick={bulkDeleteProjects}
                                                    className="ml-auto px-3 py-1 rounded text-xs bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30"
                                                >
                                                    <Icon name="Trash2" size={12} className="inline mr-1" />
                                                    Delete Selected
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Project list */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {filteredProjects.length === 0 ? (
                                    <div className="text-center py-12 text-textMuted-light dark:text-textMuted-dark">
                                        <Icon name="FolderOpen" size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-semibold">No projects found</p>
                                        <p className="text-sm mt-2">
                                            {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProjects.map(project => (
                                            <div
                                                key={project.id}
                                                onContextMenu={(e) => handleContextMenu(e, project)}
                                                className={`border rounded-lg p-4 transition-all ${
                                                    selectedProjects.has(project.id)
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary/50'
                                                }`}
                                            >
                                                {/* Selection Checkbox */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProjects.has(project.id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                toggleProjectSelection(project.id);
                                                            }}
                                                            className="w-4 h-4 rounded"
                                                        />
                                                    </label>
                                                    <div
                                                        className="flex-1"
                                                    >
                                                        {/* Thumbnail */}
                                                        <div 
                                                            className="w-full h-32 bg-input-light dark:bg-input-dark rounded mb-3 flex items-center justify-center overflow-hidden group relative cursor-pointer"
                                                            onClick={() => handleLoadProject(project.id)}
                                                        >
                                                            {project.metadata?.thumbnail ? (
                                                                <>
                                                                    <img 
                                                                        src={project.metadata.thumbnail} 
                                                                        alt={project.title}
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <div className="text-center text-white text-xs">
                                                                            <div className="font-semibold">{project.title}</div>
                                                                            <div className="text-[10px] text-gray-300">{new Date(project.lastModified).toLocaleDateString()}</div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <Icon name="Film" size={32} className="text-textMuted-light dark:text-textMuted-dark opacity-50" />
                                                            )}
                                                            
                                                            {/* Upload Thumbnail Button (appears on hover) */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    document.getElementById(`thumbnail-upload-${project.id}`).click();
                                                                }}
                                                                className="absolute bottom-2 right-2 bg-primary hover:bg-primaryHover text-black px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-lg"
                                                                title="Upload custom thumbnail"
                                                            >
                                                                <Icon name="Upload" size={12} />
                                                                <span>Upload</span>
                                                            </button>
                                                            
                                                            {/* Hidden file input */}
                                                            <input
                                                                id={`thumbnail-upload-${project.id}`}
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    
                                                                    // Validate file size (max 500KB to avoid localStorage issues)
                                                                    if (file.size > 500 * 1024) {
                                                                        alert('Image too large! Please choose an image under 500KB.');
                                                                        return;
                                                                    }
                                                                    
                                                                    // Read and convert to base64
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        const img = new Image();
                                                                        img.onload = () => {
                                                                            // Resize image to 200x150 to save space
                                                                            const canvas = document.createElement('canvas');
                                                                            canvas.width = 200;
                                                                            canvas.height = 150;
                                                                            const ctx = canvas.getContext('2d');
                                                                            
                                                                            // Draw image with proper aspect ratio
                                                                            const aspectRatio = img.width / img.height;
                                                                            let drawWidth = 200;
                                                                            let drawHeight = 150;
                                                                            let offsetX = 0;
                                                                            let offsetY = 0;
                                                                            
                                                                            if (aspectRatio > 200/150) {
                                                                                drawHeight = 200 / aspectRatio;
                                                                                offsetY = (150 - drawHeight) / 2;
                                                                            } else {
                                                                                drawWidth = 150 * aspectRatio;
                                                                                offsetX = (200 - drawWidth) / 2;
                                                                            }
                                                                            
                                                                            // Fill background
                                                                            ctx.fillStyle = '#1a1a1a';
                                                                            ctx.fillRect(0, 0, 200, 150);
                                                                            
                                                                            // Draw image
                                                                            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                                                                            
                                                                            // Convert to base64
                                                                            const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
                                                                            
                                                                            // Update project with new thumbnail
                                                                            const updatedProject = {
                                                                                ...project,
                                                                                metadata: {
                                                                                    ...project.metadata,
                                                                                    thumbnail: thumbnailData
                                                                                }
                                                                            };
                                                                            
                                                                            // Save to localStorage
                                                                            const result = LocalStorageManager.saveProject(updatedProject);
                                                                            if (result.success) {
                                                                                // Refresh projects list
                                                                                setProjects(LocalStorageManager.getAllProjects());
                                                                                alert('✓ Thumbnail updated successfully!');
                                                                            } else {
                                                                                alert(`✗ Failed to update thumbnail: ${result.error}`);
                                                                            }
                                                                        };
                                                                        img.src = event.target.result;
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                    
                                                                    // Reset input
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                        </div>
                                                        
                                                        {/* Project info */}
                                                        <div onClick={() => handleLoadProject(project.id)} className="cursor-pointer">
                                                            <h3 className="font-bold text-lg truncate mb-1">{project.title}</h3>
                                                            <p className="text-sm text-textMuted-light dark:text-textMuted-dark truncate mb-2">
                                                                by {project.author}
                                                            </p>
                                                            
                                                            {/* Story type and duration badges */}
                                                            {(project.blueprint?.storyType || project.blueprint?.duration) && (
                                                                <div className="flex gap-2 mb-2 flex-wrap">
                                                                    {project.blueprint?.storyType && (
                                                                        <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary border border-primary/30">
                                                                            {project.blueprint.storyType}
                                                                        </span>
                                                                    )}
                                                                    {project.blueprint?.duration && (
                                                                        <span className="px-2 py-1 rounded text-xs bg-accent/20 text-accent border border-accent/30">
                                                                            {project.blueprint.duration}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Metadata */}
                                                            <div className="flex items-center gap-3 text-xs text-textMuted-light dark:text-textMuted-dark mb-3">
                                                                <span>{project.metadata?.pageCount || 0} pages</span>
                                                                <span>•</span>
                                                                <span>{project.metadata?.wordCount || 0} words</span>
                                                                <span>•</span>
                                                                <span>{getProjectSize(project)} KB</span>
                                                            </div>
                                                            
                                                            <div className="text-xs text-textMuted-light dark:text-textMuted-dark mb-3">
                                                                Modified: {new Date(project.lastModified).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Actions */}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDuplicateProject(project.id);
                                                        }}
                                                        className="flex-1 px-2 py-1 rounded text-xs border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
                                                        title="Duplicate project"
                                                    >
                                                        <Icon name="Copy" size={12} className="inline mr-1" />
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            LocalStorageManager.exportProjectJSON(project);
                                                        }}
                                                        className="flex-1 px-2 py-1 rounded text-xs border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
                                                    >
                                                        <Icon name="Download" size={12} className="inline mr-1" />
                                                        Export
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteProject(project.id);
                                                        }}
                                                        className="px-2 py-1 rounded text-xs border border-red-500 text-red-500 hover:bg-red-500/10"
                                                        title="Delete project"
                                                    >
                                                        <Icon name="Trash2" size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Context Menu */}
                        {contextMenu && (
                            <div 
                                className="fixed z-[100] bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg shadow-2xl py-1.5 w-48"
                                style={{
                                    left: Math.min(contextMenu.x, window.innerWidth - 200),
                                    top: Math.min(contextMenu.y, window.innerHeight - 200)
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => {
                                        handleLoadProject(contextMenu.project.id);
                                        closeContextMenu();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left"
                                >
                                    <Icon name="FolderOpen" size={13} className="text-textMuted-light dark:text-textMuted-dark" />
                                    <span>Open</span>
                                </button>
                                <button
                                    onClick={() => {
                                        handleDuplicateProject(contextMenu.project.id);
                                        closeContextMenu();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left"
                                >
                                    <Icon name="Copy" size={13} className="text-textMuted-light dark:text-textMuted-dark" />
                                    <span>Duplicate</span>
                                </button>
                                <button
                                    onClick={() => {
                                        LocalStorageManager.exportProjectJSON(contextMenu.project);
                                        closeContextMenu();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-textMain-light dark:text-textMain-dark hover:bg-input-light dark:hover:bg-input-dark transition-colors text-left"
                                >
                                    <Icon name="Download" size={13} className="text-textMuted-light dark:text-textMuted-dark" />
                                    <span>Export as JSON</span>
                                </button>
                                <div className="my-1 border-t border-border-light dark:border-border-dark" />
                                <button
                                    onClick={() => {
                                        handleDeleteProject(contextMenu.project.id);
                                        closeContextMenu();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                                >
                                    <Icon name="Trash2" size={13} className="text-red-500" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        )}
                    </div>
                );
            };

            return (
                <div className="fixed inset-0 bg-panel-light dark:bg-panel-dark flex flex-col z-50">
                    <div className="bg-panel-light dark:bg-panel-dark rounded-none shadow-none w-full h-full flex flex-col">
                        {/* Header */}
                        <div className="border-b border-border-light dark:border-border-dark p-3 md:p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                            <div className="flex-1">
                                <h2 className="text-xl md:text-2xl font-bold">Pro Script Builder</h2>
                                <p className="text-xs md:text-sm text-textMuted-light dark:text-textMuted-dark">{blueprint.storyType} • {blueprint.duration} • {blueprint.style}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2">
                                {writingMode === 'user-written' && (
                                    <>
                                        <button onClick={() => switchWritingMode('template-generated')} disabled={isGenerating}
                                            className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                                            Template
                                        </button>
                                        <button onClick={() => switchWritingMode('ai-generated')} disabled={isGenerating}
                                            className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                                            AI
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={handleSaveProject}
                                    title="Save Project (Ctrl+S)"
                                    className={`flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg border flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold transition-all ${
                                        hasUnsavedChanges
                                            ? 'bg-primary/20 text-primary border-primary/50 animate-pulse'
                                            : 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark hover:border-primary/50'
                                    }`}
                                >
                                    <Icon name="Save" size={14} />
                                    <span className="hidden md:inline">Save</span>
                                    {hasUnsavedChanges && <span className="text-[10px]">●</span>}
                                </button>
                                <button 
                                    onClick={() => setShowProjectLibrary(true)}
                                    title="Open Project (Ctrl+O)"
                                    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
                                >
                                    <Icon name="FolderOpen" size={14} />
                                    <span className="hidden md:inline">Open</span>
                                </button>
                                <button 
                                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                                    title={autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled - Unsaved changes will be lost!'}
                                    className={`flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg border flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold transition-all ${
                                        autoSaveEnabled
                                            ? 'bg-primary/20 text-primary border-primary/50'
                                            : 'bg-red-500/20 text-red-500 border-red-500/50'
                                    }`}
                                >
                                    <Icon name={autoSaveEnabled ? 'CheckCircle' : 'AlertTriangle'} size={14} />
                                    <span className="hidden md:inline">Auto-save</span>
                                    {!autoSaveEnabled && hasUnsavedChanges && <Icon name="AlertTriangle" size={12} className="text-red-500" />}
                                </button>
                                {saveMessage && (
                                    <div className={`px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm font-semibold ${
                                        saveMessage.startsWith('✓') ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {saveMessage}
                                    </div>
                                )}
                                <button 
                                    onClick={() => setShowStoryOutput(true)}
                                    title="Preview Story Output"
                                    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
                                >
                                    <Icon name="Eye" size={14} />
                                    <span className="hidden md:inline">Preview</span>
                                </button>
                                <button 
                                    onClick={() => setShowExportModal(true)}
                                    title="Export Project"
                                    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
                                >
                                    <Icon name="Download" size={14} />
                                    <span className="hidden md:inline">Export</span>
                                </button>
                                <button 
                                    onClick={() => setShowSceneBreakdown(true)}
                                    title="Scene Breakdown"
                                    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
                                >
                                    <Icon name="BarChart3" size={14} />
                                    <span className="hidden md:inline">Breakdown</span>
                                </button>
                                <button 
                                    onClick={() => setShowCharacterArcs(true)}
                                    title="Character Arc Summary"
                                    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
                                >
                                    <Icon name="TrendingUp" size={14} />
                                    <span className="hidden md:inline">Arcs</span>
                                </button>
                                <button onClick={() => {
                                    const prompts = PromptConverter.parseScript(script);
                                    setGeneratedPrompts(prompts);
                                    setShowPromptsModal(true);
                                }} className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 text-xs md:text-sm font-semibold">
                                    Prompts
                                </button>
                                <button onClick={() => setShowCharacterArcMapper(true)} className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-pink-500/20 text-pink-500 hover:bg-pink-500/30 text-xs md:text-sm font-semibold">
                                    Arcs
                                </button>
                                <button onClick={() => setShowDirectorBrain(true)} className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2" title="Open Director Brain">
                                    <Icon name="Brain" size={14} />
                                    <span className="hidden md:inline">Brain</span>
                                </button>
                                <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark">
                                    <Icon name="X" size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                            {/* Scene List */}
                            <div className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark overflow-y-auto p-3 md:p-4 space-y-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest">Scenes</div>
                                    <button 
                                        onClick={addScene}
                                        className="px-2 py-1 rounded bg-primary text-black text-xs font-semibold hover:bg-primaryHover"
                                        title="Add new scene"
                                    >
                                        <Icon name="Plus" size={14} className="inline mr-1" />
                                        Add
                                    </button>
                                </div>
                                {script.scenes.map((scene, idx) => (
                                    <div key={scene.id}>
                                        <button onClick={() => setSelectedSceneId(scene.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                                                selectedSceneId === scene.id
                                                    ? 'bg-primary/20 border border-primary'
                                                    : 'border border-border-light dark:border-border-dark hover:border-primary/50'
                                            }`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold truncate">{scene.label}</div>
                                                    {scene.description && (
                                                        <div className="text-xs text-textMuted-light dark:text-textMuted-dark truncate">{scene.description}</div>
                                                    )}
                                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark">{scene.shots.length} shot{scene.shots.length !== 1 ? 's' : ''}</div>
                                                </div>
                                                {script.scenes.length > 1 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete scene "${scene.label}"?`)) {
                                                                deleteScene(scene.id);
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete scene"
                                                    >
                                                        <Icon name="Trash2" size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                {selectedSceneId ? (
                                    <div>
                                        {/* Scene Info - Editable */}
                                        {(() => {
                                            const currentScene = script.scenes.find(s => s.id === selectedSceneId);
                                            return (
                                                <div className="mb-6 pb-4 border-b-2 border-primary/30">
                                                    <input 
                                                        type="text" 
                                                        value={currentScene?.label || ''}
                                                        onChange={(e) => renameScene(selectedSceneId, e.target.value, currentScene?.description)}
                                                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark font-bold text-lg mb-2"
                                                        placeholder="Scene Name"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={currentScene?.description || ''}
                                                        onChange={(e) => renameScene(selectedSceneId, currentScene?.label, e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm"
                                                        placeholder="Scene Description (optional)"
                                                    />
                                                </div>
                                            );
                                        })()}

                                        {script.scenes.find(s => s.id === selectedSceneId)?.shots.map((shot, idx) => (
                                            <div key={shot.id} className="mb-8 pb-8 border-b border-border-light dark:border-border-dark last:border-b-0">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-semibold">Shot {idx + 1}</h3>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleCritiqueShot(selectedSceneId, shot.id)} 
                                                            className="px-3 py-1 rounded-lg border border-accent/50 hover:bg-accent/10 text-accent text-sm font-semibold flex items-center gap-1"
                                                            title="Critique this shot"
                                                        >
                                                            <Icon name="Sparkles" size={14} />
                                                            Critique Shot
                                                        </button>
                                                        {script.scenes.find(s => s.id === selectedSceneId).shots.length > 1 && (
                                                            <button onClick={() => deleteShot(selectedSceneId, shot.id)} className="text-red-500 hover:text-red-600">
                                                                <Icon name="Trash2" size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Scene Heading */}
                                                <div className="mb-4">
                                                    <label className="block text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-2">Scene Heading</label>
                                                    <input type="text" placeholder="INT. COFFEE SHOP - DAY" value={shot.sceneHeading}
                                                        onChange={(e) => handleFieldChange(selectedSceneId, shot.id, 'sceneHeading', e.target.value.toUpperCase())}
                                                        className="w-full px-4 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark font-mono text-sm"
                                                    />
                                                </div>

                                                {/* Unified Elements (Actions + Dialogue Interleaved) */}
                                                <div className="mb-4">
                                                    <label className="block text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-2">
                                                        Script Elements
                                                        <span className="ml-2 text-textMuted-light dark:text-textMuted-dark font-normal text-[10px]">(Drag to reorder • Add action or dialogue anywhere)</span>
                                                    </label>
                                                    
                                                    {/* Render unified elements if they exist */}
                                                    {shot.elements && shot.elements.length > 0 ? (
                                                        shot.elements.map((element, elementIdx) => (
                                                            <div key={element.id}>
                                                                <div 
                                                                    draggable
                                                                    onDragStart={() => setDraggedElement({ sceneId: selectedSceneId, shotId: shot.id, index: elementIdx })}
                                                                    onDragOver={(e) => e.preventDefault()}
                                                                    onDrop={() => {
                                                                        if (draggedElement && draggedElement.shotId === shot.id) {
                                                                            reorderElements(selectedSceneId, shot.id, draggedElement.index, elementIdx);
                                                                            setDraggedElement(null);
                                                                        }
                                                                    }}
                                                                    className={`mb-3 p-3 rounded-lg border cursor-move group ${
                                                                        element.type === 'action' 
                                                                            ? 'bg-input-light dark:bg-input-dark border-border-light dark:border-border-dark hover:border-primary/50' 
                                                                            : 'bg-accent/5 border-accent/30 hover:border-accent/50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="flex-shrink-0 mt-2 text-textMuted-light dark:text-textMuted-dark">
                                                                            <Icon name="GripVertical" size={16} />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            {element.type === 'action' ? (
                                                                                // Action Element
                                                                                <>
                                                                                    <div className="text-[10px] font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Action</div>
                                                                                    <textarea 
                                                                                        placeholder="Describe what happens on screen..." 
                                                                                        value={element.text || ''}
                                                                                        onChange={(e) => updateElement(selectedSceneId, shot.id, element.id, { text: e.target.value })}
                                                                                        className="w-full px-3 py-2 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm h-20 resize-none"
                                                                                    />
                                                                                </>
                                                                            ) : (
                                                                                // Dialogue Element
                                                                                <>
                                                                                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Dialogue</div>
                                                                                    <select 
                                                                                        value={element.characterName || ''} 
                                                                                        onChange={(e) => updateElement(selectedSceneId, shot.id, element.id, { characterName: e.target.value })}
                                                                                        className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm font-bold mb-2"
                                                                                    >
                                                                                        <option value="">Select character...</option>
                                                                                        {blueprintCharacters.map((char, idx) => (
                                                                                            <option key={idx} value={char.name}>{char.name}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <input 
                                                                                        type="text" 
                                                                                        placeholder="(parenthetical)" 
                                                                                        value={element.parenthetical || ''}
                                                                                        onChange={(e) => updateElement(selectedSceneId, shot.id, element.id, { parenthetical: e.target.value.toLowerCase() })}
                                                                                        className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm mb-2"
                                                                                    />
                                                                                    <textarea 
                                                                                        placeholder="Dialogue text..." 
                                                                                        value={element.dialogue || ''}
                                                                                        onChange={(e) => updateElement(selectedSceneId, shot.id, element.id, { dialogue: e.target.value })}
                                                                                        className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm h-16 resize-none"
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => deleteElement(selectedSceneId, shot.id, element.id)}
                                                                            className="flex-shrink-0 mt-2 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            title="Delete element"
                                                                        >
                                                                            <Icon name="X" size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Add buttons after each element */}
                                                                <div className="flex gap-2 mb-3 ml-8">
                                                                    <button 
                                                                        onClick={() => addElement(selectedSceneId, shot.id, 'action', elementIdx)}
                                                                        className="text-xs text-primary hover:text-primaryHover font-semibold flex items-center gap-1"
                                                                        title="Add action after this"
                                                                    >
                                                                        <Icon name="Plus" size={12} />
                                                                        Action
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => addElement(selectedSceneId, shot.id, 'dialogue', elementIdx)}
                                                                        className="text-xs text-accent hover:text-accentHover font-semibold flex items-center gap-1"
                                                                        title="Add dialogue after this"
                                                                    >
                                                                        <Icon name="Plus" size={12} />
                                                                        Dialogue
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        // Backward compatibility: show old structure if elements don't exist
                                                        <>
                                                            {/* Old Actions */}
                                                            {shot.actions && shot.actions.length > 0 && shot.actions.map((action, actionIdx) => (
                                                                <div key={action.id} className="mb-3 p-3 bg-input-light dark:bg-input-dark rounded-lg border border-border-light dark:border-border-dark group">
                                                                    <div className="flex items-start gap-2">
                                                                        <textarea 
                                                                            placeholder="Action..." 
                                                                            value={action.text}
                                                                            onChange={(e) => updateAction(selectedSceneId, shot.id, action.id, e.target.value)}
                                                                            className="flex-1 px-3 py-2 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm h-20 resize-none"
                                                                        />
                                                                        <button
                                                                            onClick={() => deleteAction(selectedSceneId, shot.id, action.id)}
                                                                            className="flex-shrink-0 mt-2 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <Icon name="X" size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Old Dialogue Blocks */}
                                                            {shot.dialogueBlocks && shot.dialogueBlocks.map((db, dbIdx) => (
                                                                <div key={dbIdx} className="mb-3 p-3 bg-accent/5 rounded-lg border border-accent/30 group">
                                                                    <select value={db.characterName || ''} onChange={(e) => {
                                                                        const newDialogueBlocks = [...shot.dialogueBlocks];
                                                                        newDialogueBlocks[dbIdx].characterName = e.target.value;
                                                                        handleFieldChange(selectedSceneId, shot.id, 'dialogueBlocks', newDialogueBlocks);
                                                                    }}
                                                                        className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm font-bold mb-2">
                                                                        <option value="">Select character...</option>
                                                                        {blueprintCharacters.map((char, idx) => (
                                                                            <option key={idx} value={char.name}>{char.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <input type="text" placeholder="(parenthetical)" value={db.parenthetical}
                                                                        onChange={(e) => {
                                                                            const newDialogueBlocks = [...shot.dialogueBlocks];
                                                                            newDialogueBlocks[dbIdx].parenthetical = e.target.value.toLowerCase();
                                                                            handleFieldChange(selectedSceneId, shot.id, 'dialogueBlocks', newDialogueBlocks);
                                                                        }}
                                                                        className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm mb-2"
                                                                    />
                                                                    <textarea placeholder="Dialogue..." value={db.dialogue}
                                                                        onChange={(e) => {
                                                                            const newDialogueBlocks = [...shot.dialogueBlocks];
                                                                            newDialogueBlocks[dbIdx].dialogue = e.target.value;
                                                                            handleFieldChange(selectedSceneId, shot.id, 'dialogueBlocks', newDialogueBlocks);
                                                                        }}
                                                                        className="w-full px-2 py-1 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm h-16 resize-none"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                    
                                                    {/* Add first element buttons */}
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => addElement(selectedSceneId, shot.id, 'action')}
                                                            className="text-sm text-primary hover:text-primaryHover font-semibold flex items-center gap-1"
                                                        >
                                                            <Icon name="Plus" size={14} />
                                                            Add Action
                                                        </button>
                                                        <button 
                                                            onClick={() => addElement(selectedSceneId, shot.id, 'dialogue')}
                                                            className="text-sm text-accent hover:text-accentHover font-semibold flex items-center gap-1"
                                                        >
                                                            <Icon name="Plus" size={14} />
                                                            Add Dialogue
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addShot(selectedSceneId)} className="text-primary hover:text-primaryHover font-semibold">
                                            + Add Shot
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center text-textMuted-light dark:text-textMuted-dark py-12">
                                        Select a scene to start writing
                                    </div>
                                )}
                            </div>

                            {/* Metadata Sidebar */}
                            <div className="w-full md:w-48 lg:w-56 border-t md:border-t-0 md:border-l border-border-light dark:border-border-dark p-3 md:p-4 space-y-4 overflow-y-auto">
                                <div>
                                    <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-2">Page Count</div>
                                    <div className="text-3xl font-bold text-primary">{script.metadata.pageCount}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-2">Runtime</div>
                                    <div className="text-3xl font-bold text-accent">{script.metadata.estimatedRuntime} min</div>
                                </div>
                                <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                    <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-3">Writing Mode</div>
                                    <div className="relative">
                                        <button onClick={() => setShowModeOptions(!showModeOptions)} disabled={isGenerating}
                                            className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark text-sm font-semibold text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                            <span className="capitalize">{writingMode.replace('-', ' ')}</span>
                                            <Icon name={showModeOptions ? "ChevronUp" : "ChevronDown"} size={16} />
                                        </button>
                                        
                                        {showModeOptions && !isGenerating && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-40">
                                                <button onClick={() => switchWritingMode('user-written')}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/10 first:rounded-t-lg ${writingMode === 'user-written' ? 'bg-primary/20 font-semibold' : ''}`}>
                                                    User-Written
                                                </button>
                                                <button onClick={() => switchWritingMode('template-generated')}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/10 ${writingMode === 'template-generated' ? 'bg-primary/20 font-semibold' : ''}`}>
                                                    Template
                                                </button>
                                                <button onClick={() => switchWritingMode('ai-generated')}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/10 last:rounded-b-lg ${writingMode === 'ai-generated' ? 'bg-primary/20 font-semibold' : ''}`}>
                                                    AI-Generated
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {isGenerating && (
                                        <div className="mt-2 text-xs text-textMuted-light dark:text-textMuted-dark text-center">
                                            Generating...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border-light dark:border-border-dark p-3 md:p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3">
                            <div className="flex gap-1 md:gap-2 items-center">
                                <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"
                                    className="px-2 md:px-3 py-1 md:py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-primary/50">
                                    <Icon name="RotateCcw" size={14} />
                                </button>
                                <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)"
                                    className="px-2 md:px-3 py-1 md:py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-primary/50">
                                    <Icon name="RotateCw" size={14} />
                                </button>
                                <div className="text-xs text-textMuted-light dark:text-textMuted-dark px-2 py-1 rounded bg-input-light dark:bg-input-dark">
                                    {historyIndex + 1} / {history.length}
                                </div>
                            </div>
                            <div className="flex-1 hidden md:block" />
                            <div className="flex flex-wrap gap-1 md:gap-2">
                                <button onClick={() => ExportEngine.exportTXT(script, blueprint)} className="flex-1 md:flex-none px-2 md:px-4 py-1 md:py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark text-xs md:text-sm font-semibold">
                                    TXT
                                </button>
                                <button onClick={() => ExportEngine.exportPDF(script, blueprint)} className="flex-1 md:flex-none px-2 md:px-4 py-1 md:py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark text-xs md:text-sm font-semibold">
                                    PDF
                                </button>
                                <button onClick={onClose} className="flex-1 md:flex-none px-2 md:px-4 py-1 md:py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark text-xs md:text-sm font-semibold">
                                    Close
                                </button>
                                <button onClick={() => onSave(script)} className="flex-1 md:flex-none px-3 md:px-6 py-1 md:py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover text-xs md:text-sm">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Character Arc Mapper Modal */}
                    {showCharacterArcMapper && (
                        <CharacterArcMapper 
                            script={script}
                            blueprint={blueprint}
                            blueprintCharacters={blueprintCharacters}
                            initialArcs={characterArcs}
                            onClose={() => setShowCharacterArcMapper(false)}
                            onSave={(arcs, newCharacters) => {
                                // Save arcs to script metadata
                                setScript(prev => ({
                                    ...prev,
                                    metadata: {
                                        ...prev.metadata,
                                        characterArcs: arcs,
                                        lastModified: new Date().toISOString()
                                    }
                                }));
                                
                                // Save newly created characters to blueprint
                                if (newCharacters && newCharacters.length > blueprintCharacters.length) {
                                    const addedCharacters = newCharacters.slice(blueprintCharacters.length);
                                    setBlueprintCharacters([...blueprintCharacters, ...addedCharacters]);
                                }
                                
                                setCharacterArcs(arcs);
                                setShowCharacterArcMapper(false);
                            }}
                        />
                    )}

                    {/* Shot Critique Modal */}
                    {showShotCritique && critiqueShot && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-3xl bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Icon name="Sparkles" size={20} />
                                            Shot Critique
                                        </h2>
                                        <p className="text-sm text-textMuted-light dark:text-textMuted-dark">
                                            AI-powered analysis and suggestions for your shot
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowShotCritique(false)} 
                                        className="text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark"
                                    >
                                        <Icon name="X" size={24} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Shot Details */}
                                    <div className="bg-input-light dark:bg-input-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                                        <h3 className="font-bold text-sm uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark mb-3">Shot Details</h3>
                                        
                                        {critiqueShot.shot.sceneHeading && (
                                            <div className="mb-3">
                                                <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase mb-1">Scene Heading</div>
                                                <div className="font-mono text-sm">{critiqueShot.shot.sceneHeading}</div>
                                            </div>
                                        )}

                                        {critiqueShot.shot.actions.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase mb-1">Actions</div>
                                                {critiqueShot.shot.actions.map((action, idx) => (
                                                    <div key={idx} className="font-mono text-sm mb-1">{action}</div>
                                                ))}
                                            </div>
                                        )}

                                        {critiqueShot.shot.dialogues.length > 0 && (
                                            <div>
                                                <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase mb-1">Dialogue</div>
                                                {critiqueShot.shot.dialogues.map((dialogue, idx) => (
                                                    <div key={idx} className="mb-2">
                                                        <div className="font-mono text-sm font-bold">{dialogue.character}</div>
                                                        {dialogue.parenthetical && (
                                                            <div className="font-mono text-xs text-textMuted-light dark:text-textMuted-dark">{dialogue.parenthetical}</div>
                                                        )}
                                                        <div className="font-mono text-sm">{dialogue.dialogue}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {critiqueShot.shot.characters.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
                                                <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase mb-1">Characters</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {[...new Set(critiqueShot.shot.characters)].map((char, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                                                            {char}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Critique Annotations */}
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark mb-3">
                                            Critique & Suggestions
                                        </h3>
                                        
                                        {critiqueAnnotations.length === 0 ? (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                                                <Icon name="CheckCircle" size={32} className="mx-auto mb-2 text-green-500" />
                                                <div className="font-semibold text-green-600 dark:text-green-400">No issues found!</div>
                                                <div className="text-sm text-textMuted-light dark:text-textMuted-dark mt-1">
                                                    This shot looks good from a technical perspective.
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {critiqueAnnotations.map((annotation, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`rounded-lg p-4 border ${
                                                            annotation.severity === 'warning' 
                                                                ? 'bg-yellow-500/10 border-yellow-500/30' 
                                                                : 'bg-blue-500/10 border-blue-500/30'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`flex-shrink-0 ${
                                                                annotation.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                                                            }`}>
                                                                <Icon name={annotation.severity === 'warning' ? 'AlertTriangle' : 'Info'} size={20} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-semibold mb-1">{annotation.message}</div>
                                                                <div className="text-sm text-textMuted-light dark:text-textMuted-dark mb-2">
                                                                    {annotation.suggestion}
                                                                </div>
                                                                <div className="text-xs font-mono bg-panel-light dark:bg-panel-dark px-2 py-1 rounded inline-block">
                                                                    {annotation.code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border-light dark:border-border-dark p-4 flex justify-end gap-3">
                                    <button 
                                        onClick={() => setShowShotCritique(false)}
                                        className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-panel-light dark:hover:bg-panel-dark font-semibold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Project Dialog */}
                    {SaveProjectDialog}

                    {/* Confirmation Dialog */}
                    {ConfirmUI}

                    {/* Project Library */}
                    {showProjectLibrary && <ProjectLibrary />}

                    {/* Story Output Panel */}
                    {showStoryOutput && (
                        <div className="fixed inset-0 z-40">
                            <div className="absolute inset-0 bg-black/30" onClick={() => setShowStoryOutput(false)} />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="w-full h-full max-w-4xl bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl flex flex-col">
                                    <StoryOutputPanel
                                        script={script}
                                        blueprint={blueprint}
                                        characterArcs={characterArcs}
                                        synopsis={synopsis}
                                        onSynopsisChange={handleSynopsisChange}
                                        onClose={() => setShowStoryOutput(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Export Modal */}
                    {showExportModal && (
                        <ExportModal
                            project={{
                                title: projectTitle || 'Untitled',
                                author: projectAuthor || 'Unknown',
                                blueprint: blueprint,
                                script: script,
                                synopsis: synopsis,
                                characterArcs: characterArcs
                            }}
                            onClose={() => setShowExportModal(false)}
                        />
                    )}

                    {/* Scene Breakdown Modal */}
                    {showSceneBreakdown && (
                        <SceneBreakdownPanel
                            script={script}
                            blueprint={blueprint}
                        />
                    )}

                    {/* Character Arc Summary Modal */}
                    {showCharacterArcs && (
                        <CharacterArcSummaryPanel
                            characterArcs={characterArcs}
                            script={script}
                            blueprint={blueprint}
                            onNavigateToScene={(sceneNumber) => {
                                setSelectedSceneId(script.scenes[sceneNumber - 1]?.id);
                                setShowCharacterArcs(false);
                            }}
                        />
                    )}

                    {/* Prompts Modal */}
                    {showPromptsModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-6xl h-[90vh] bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl flex flex-col">
                                {/* Header */}
                                <div className="border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">AI Prompts</h2>
                                        <p className="text-sm text-textMuted-light dark:text-textMuted-dark">
                                            {generatedPrompts.length} shot{generatedPrompts.length !== 1 ? 's' : ''} ready for AI generation
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowPromptsModal(false)}
                                        className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                    >
                                        <Icon name="X" size={24} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {generatedPrompts.length === 0 ? (
                                        <div className="text-center py-12 text-textMuted-light dark:text-textMuted-dark">
                                            <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-semibold">No prompts generated</p>
                                            <p className="text-sm mt-2">Add scenes and shots to your script first</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {generatedPrompts.map((prompt, idx) => (
                                                <div key={idx} className="border border-border-light dark:border-border-dark rounded-lg p-4 bg-input-light dark:bg-input-dark">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-primary">
                                                                    Scene {prompt.sceneNumber} • Shot {prompt.shotNumber}
                                                                </span>
                                                                <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent font-semibold">
                                                                    {prompt.shotType}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-semibold">{prompt.sceneLabel}</div>
                                                            <div className="text-xs text-textMuted-light dark:text-textMuted-dark">
                                                                {prompt.location} • {prompt.timeOfDay}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(prompt.fullPrompt);
                                                                alert('Prompt copied to clipboard!');
                                                            }}
                                                            className="px-3 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold flex items-center gap-1"
                                                            title="Copy prompt"
                                                        >
                                                            <Icon name="Copy" size={14} />
                                                            Copy
                                                        </button>
                                                    </div>

                                                    {/* Characters */}
                                                    {prompt.characters.length > 0 && (
                                                        <div className="mb-3">
                                                            <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">Characters</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {prompt.characters.map((char, charIdx) => (
                                                                    <span key={charIdx} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                                                        {char}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Full Prompt */}
                                                    <div className="mb-3">
                                                        <div className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-1">AI Prompt</div>
                                                        <div className="p-3 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-sm whitespace-pre-wrap">
                                                            {prompt.fullPrompt}
                                                        </div>
                                                    </div>

                                                    {/* Ambiguities Warning */}
                                                    {prompt.ambiguities && prompt.ambiguities.length > 0 && (
                                                        <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
                                                            <div className="flex items-start gap-2">
                                                                <Icon name="AlertTriangle" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                                                <div>
                                                                    <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Ambiguities Detected</div>
                                                                    <ul className="text-xs text-red-500 space-y-0.5">
                                                                        {prompt.ambiguities.map((amb, ambIdx) => (
                                                                            <li key={ambIdx}>• {amb}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border-light dark:border-border-dark p-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            // Group prompts by scene
                                            const sceneMap = new Map();
                                            
                                            generatedPrompts.forEach((prompt, idx) => {
                                                const sceneKey = `scene-${prompt.sceneNumber}`;
                                                
                                                if (!sceneMap.has(sceneKey)) {
                                                    sceneMap.set(sceneKey, {
                                                        sceneNumber: prompt.sceneNumber,
                                                        sceneLabel: prompt.sceneLabel,
                                                        shots: []
                                                    });
                                                }
                                                
                                                // Create shot data
                                                const shotData = {
                                                    id: `shot-${Date.now()}-${idx}`,
                                                    subject: prompt.fullPrompt,
                                                    selections: {
                                                        shotType: prompt.shotType,
                                                        location: prompt.location,
                                                        timeOfDay: prompt.timeOfDay,
                                                        duration: '3',
                                                        transition: 'Cut',
                                                        aspectRatio: '--ar 16:9',
                                                        aperture: 'f/2.8'
                                                    },
                                                    dialogues: prompt.dialogue.map(d => ({
                                                        character: d.characterName,
                                                        text: d.dialogue,
                                                        voiceStyle: 'Neutral'
                                                    })),
                                                    mode: 'video',
                                                    status: 'Planning',
                                                    tags: [`Scene ${prompt.sceneNumber}`, prompt.sceneLabel],
                                                    referenceImages: [],
                                                    customPromptOverride: null,
                                                    sfx: '',
                                                    bgm: ''
                                                };
                                                
                                                sceneMap.get(sceneKey).shots.push(shotData);
                                            });
                                            
                                            // Convert scene map to scenes array
                                            const scenes = Array.from(sceneMap.values()).map((sceneData, idx) => ({
                                                id: Date.now() + idx,
                                                name: sceneData.sceneLabel || `Scene ${sceneData.sceneNumber}`,
                                                shots: sceneData.shots
                                            }));
                                            
                                            // Store in localStorage for main app to pick up
                                            localStorage.setItem('proScriptBuilder_importShots', JSON.stringify({
                                                scenes: scenes,
                                                projectTitle: projectTitle || 'Pro Script Import',
                                                timestamp: Date.now()
                                            }));
                                            
                                            const totalShots = scenes.reduce((sum, scene) => sum + scene.shots.length, 0);
                                            addToast(`✓ Ready to import! ${scenes.length} scene${scenes.length !== 1 ? 's' : ''} with ${totalShots} shot${totalShots !== 1 ? 's' : ''}. Close Pro Script Builder to auto-import.`, 'success', 6000);
                                            setShowPromptsModal(false);
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accentHover flex items-center justify-center gap-2"
                                        disabled={generatedPrompts.length === 0}
                                    >
                                        <Icon name="ArrowRight" size={16} />
                                        Send to Main Editor ({generatedPrompts.length} shots)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const allPrompts = generatedPrompts.map(p => p.fullPrompt).join('\n\n---\n\n');
                                            navigator.clipboard.writeText(allPrompts);
                                            addToast('✓ All prompts copied to clipboard!', 'success');
                                        }}
                                        className="px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover flex items-center justify-center gap-2"
                                        disabled={generatedPrompts.length === 0}
                                    >
                                        <Icon name="Copy" size={16} />
                                        Copy All
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Export as JSON
                                            const json = JSON.stringify(generatedPrompts, null, 2);
                                            const blob = new Blob([json], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${projectTitle || 'script'}-prompts.json`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark font-semibold flex items-center justify-center gap-2"
                                        disabled={generatedPrompts.length === 0}
                                    >
                                        <Icon name="Download" size={16} />
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => setShowPromptsModal(false)}
                                        className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark font-semibold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Auto-Save Message */}
                    {autoSaveMessage && (
                        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg bg-primary text-black font-semibold text-sm animate-fade-in">
                            {autoSaveMessage}
                        </div>
                    )}

                    {/* Director Brain Modal - Full Agentic Mode Integration */}
                    {showDirectorBrain && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-4xl h-[90vh] bg-panel-light dark:bg-panel-dark rounded-lg shadow-2xl flex flex-col">
                                {/* Header */}
                                <div className="border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/20">
                                            <Icon name="Brain" size={24} className="text-purple-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Director Brain</h2>
                                            <p className="text-sm text-textMuted-light dark:text-textMuted-dark">
                                                AI-powered screenplay analysis with Agentic Mode
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDirectorBrain(false)}
                                        className="text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                                    >
                                        <Icon name="X" size={24} />
                                    </button>
                                </div>

                                {/* Director Brain Panel with Agentic Mode */}
                                <div className="flex-1 overflow-hidden">
                                    <DirectorBrainPanel
                                        brainMode="agentic"
                                        deepBrainEngineRef={null}
                                        projectSnapshot={{
                                            scenes: script.scenes.map(scene => ({
                                                id: scene.id,
                                                name: scene.label,
                                                shots: scene.shots.map(shot => ({
                                                    id: shot.id,
                                                    subject: shot.sceneHeading || '',
                                                    selections: {
                                                        shotType: '',
                                                        shotStyle: '',
                                                        camera: '',
                                                        lens: '',
                                                        angle: '',
                                                        lighting: '',
                                                        movement: '',
                                                        actionSpeed: '',
                                                        duration: '3.0s',
                                                        transition: 'Hard Cut',
                                                        filmStock: '',
                                                        aspectRatio: '--ar 16:9'
                                                    },
                                                    // Include script-specific data for context
                                                    _scriptData: {
                                                        sceneHeading: shot.sceneHeading,
                                                        elements: shot.elements || [],
                                                        actions: shot.actions || [],
                                                        dialogueBlocks: shot.dialogueBlocks || []
                                                    }
                                                }))
                                            })),
                                            blueprint: blueprint,
                                            characterArcs: characterArcs
                                        }}
                                        onBrainModeChange={() => {}}
                                        appActions={{
                                            scenes: script.scenes,
                                            updateActiveProjectScenes: (updater) => {
                                                setScript(prev => {
                                                    const newScenes = typeof updater === 'function' ? updater(prev.scenes) : updater;
                                                    
                                                    // Update script with new scenes
                                                    const updated = {
                                                        ...prev,
                                                        scenes: newScenes,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            pageCount: calculatePageCount(),
                                                            estimatedRuntime: calculateRuntime(),
                                                            lastModified: new Date().toISOString()
                                                        }
                                                    };
                                                    
                                                    return updated;
                                                });
                                                setHasUnsavedChanges(true);
                                            },
                                            saveToHistory: () => {
                                                // Save current state to history for undo/redo
                                                const newHistory = history.slice(0, historyIndex + 1);
                                                newHistory.push(JSON.parse(JSON.stringify(script)));
                                                setHistory(newHistory);
                                                setHistoryIndex(newHistory.length - 1);
                                            },
                                            globalCharacters: blueprint?.characters || [],
                                            setGlobalCharacters: (updater) => {
                                                // Update characters in blueprint
                                                const newCharacters = typeof updater === 'function' ? updater(blueprint?.characters || []) : updater;
                                                setBlueprint(prev => ({
                                                    ...prev,
                                                    characters: newCharacters
                                                }));
                                            }
                                        }}
                                        selectedShotId={selectedShotId}
                                    />
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border-light dark:border-border-dark p-4 flex justify-end">
                                    <button
                                        onClick={() => setShowDirectorBrain(false)}
                                        className="px-6 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

