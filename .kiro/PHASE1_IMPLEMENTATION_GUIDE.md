# Phase 1 Implementation Guide: LocalStorage Manager & Save/Load

## 📍 Exact Code Locations & Implementation Steps

This guide provides **exact line numbers**, **complete code snippets**, and **step-by-step instructions** for implementing Phase 1 of the Story Output & Management System.

---

## Step 1: Add LocalStorage Manager Utility

### Location: After line 22890 (before ProScriptBuilder component)

**Insert this complete LocalStorageManager utility:**

```javascript
// ── LocalStorage Manager Utility ────────────────────────────────────────────────
const LocalStorageManager = {
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
    }
};
```

---

## Step 2: Add Project State to ProScriptBuilder

### Location: Line 22896 (inside ProScriptBuilder component, after existing useState declarations)

**Add these new state variables after line 22930:**

```javascript
// ── Project Management State ────────────────────────────────────────────────
const [currentProject, setCurrentProject] = useState(null);
const [projectTitle, setProjectTitle] = useState('');
const [projectAuthor, setProjectAuthor] = useState('');
const [showSaveDialog, setShowSaveDialog] = useState(false);
const [showProjectLibrary, setShowProjectLibrary] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [saveMessage, setSaveMessage] = useState('');
```

---

## Step 3: Add Save Project Handler

### Location: After the existing handlers in ProScriptBuilder (around line 23100)

**Add these handler functions:**

```javascript
// ── Save/Load Handlers ────────────────────────────────────────────────
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
    
    const projectData = {
        id: currentProject?.id,
        title: projectTitle || 'Untitled Project',
        author: projectAuthor || 'Unknown',
        blueprint: blueprint,
        script: script,
        characterArcs: characterArcs,
        synopsis: {
            overview: '',
            characters: blueprintCharacters.map(c => ({
                name: c.name,
                description: c.description || ''
            })),
            setting: blueprint.setting || '',
            theme: blueprint.theme || ''
        },
        metadata: {
            wordCount: calculateWordCount(script),
            pageCount: calculatePageCount(script),
            readingTime: calculateReadingTime(script),
            thumbnail: ''
        }
    };
    
    const result = LocalStorageManager.saveProject(projectData);
    
    if (result.success) {
        setCurrentProject({ ...projectData, id: result.projectId });
        setSaveMessage('✓ Project saved successfully');
        setTimeout(() => setSaveMessage(''), 3000);
    } else {
        setSaveMessage(`✗ ${result.error}`);
        setTimeout(() => setSaveMessage(''), 5000);
    }
    
    setIsSaving(false);
    setShowSaveDialog(false);
};

const handleLoadProject = (projectId) => {
    const project = LocalStorageManager.loadProject(projectId);
    if (project) {
        setCurrentProject(project);
        setProjectTitle(project.title);
        setProjectAuthor(project.author);
        setScript(project.script);
        setCharacterArcs(project.characterArcs || []);
        setBlueprintCharacters(project.synopsis?.characters || []);
        setShowProjectLibrary(false);
        setSaveMessage('✓ Project loaded successfully');
        setTimeout(() => setSaveMessage(''), 3000);
    }
};

const handleDeleteProject = (projectId) => {
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
        const result = LocalStorageManager.deleteProject(projectId);
        if (result.success) {
            // Refresh library
            setShowProjectLibrary(false);
            setTimeout(() => setShowProjectLibrary(true), 100);
        }
    }
};

// Helper functions for statistics
const calculateWordCount = (script) => {
    let count = 0;
    script.scenes.forEach(scene => {
        scene.shots.forEach(shot => {
            if (shot.action) count += shot.action.split(/\s+/).length;
            if (shot.dialogue) count += shot.dialogue.split(/\s+/).length;
        });
    });
    return count;
};

const calculatePageCount = (script) => {
    // Rough estimate: 1 page = 55 lines, average 10 words per line
    const wordCount = calculateWordCount(script);
    return Math.ceil(wordCount / 550);
};

const calculateReadingTime = (script) => {
    // Average reading speed: 150 words per minute
    const wordCount = calculateWordCount(script);
    return Math.ceil(wordCount / 150);
};
```

---

## Step 4: Add Save Dialog Component

### Location: Before the return statement of ProScriptBuilder (around line 23500)

**Add this Save Dialog component:**

```javascript
// ── Save Project Dialog Component ────────────────────────────────────────────────
const SaveProjectDialog = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"
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
                        className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"
                    />
                </div>
                
                <div className="flex gap-2 pt-4">
                    <button
                        onClick={saveCurrentProject}
                        disabled={!projectTitle.trim() || isSaving}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Project'}
                    </button>
                    <button
                        onClick={() => setShowSaveDialog(false)}
                        className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
);
```

---

## Step 5: Add Project Library Component

### Location: After SaveProjectDialog component

**Add this Project Library component:**

```javascript
// ── Project Library Component ────────────────────────────────────────────────
const ProjectLibrary = () => {
    const [projects, setProjects] = useState(LocalStorageManager.getAllProjects());
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('lastModified'); // 'lastModified', 'title', 'createdAt'
    
    const storageInfo = LocalStorageManager.getStorageUsage();
    
    // Filter and sort projects
    const filteredProjects = projects
        .filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.author.toLowerCase().includes(searchQuery.toLowerCase())
        )
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
                alert('Project imported successfully!');
            }
        } catch (error) {
            alert(`Import failed: ${error.message}`);
        }
    };
    
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
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted-light dark:text-textMuted-dark" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full pl-10 pr-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark"
                        >
                            <option value="lastModified">Last Modified</option>
                            <option value="title">Title (A-Z)</option>
                            <option value="createdAt">Date Created</option>
                        </select>
                        <label className="px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover cursor-pointer">
                            <Icon name="Upload" size={16} className="inline mr-2" />
                            Import
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                    
                    {/* Storage info */}
                    <div className="mt-4 text-xs text-textMuted-light dark:text-textMuted-dark">
                        <span>{projects.length} projects</span>
                        <span className="mx-2">•</span>
                        <span>{storageInfo.used} KB / {storageInfo.available} KB used ({storageInfo.percentage}%)</span>
                        {storageInfo.percentage > 80 && (
                            <span className="ml-2 text-red-500 font-semibold">⚠ Storage running low</span>
                        )}
                    </div>
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
                                    className="border border-border-light dark:border-border-dark rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer"
                                    onClick={() => handleLoadProject(project.id)}
                                >
                                    {/* Thumbnail placeholder */}
                                    <div className="w-full h-32 bg-input-light dark:bg-input-dark rounded mb-3 flex items-center justify-center">
                                        <Icon name="Film" size={32} className="text-textMuted-light dark:text-textMuted-dark opacity-50" />
                                    </div>
                                    
                                    {/* Project info */}
                                    <h3 className="font-bold text-lg truncate mb-1">{project.title}</h3>
                                    <p className="text-sm text-textMuted-light dark:text-textMuted-dark truncate mb-2">
                                        by {project.author}
                                    </p>
                                    
                                    {/* Metadata */}
                                    <div className="flex items-center gap-3 text-xs text-textMuted-light dark:text-textMuted-dark mb-3">
                                        <span>{project.metadata?.pageCount || 0} pages</span>
                                        <span>•</span>
                                        <span>{project.metadata?.wordCount || 0} words</span>
                                    </div>
                                    
                                    <div className="text-xs text-textMuted-light dark:text-textMuted-dark">
                                        Modified: {new Date(project.lastModified).toLocaleDateString()}
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
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
        </div>
    );
};
```

---

## Step 6: Add Buttons to Toolbar

### Location: Find the ProScriptBuilder toolbar (around line 23600)

**Search for the existing toolbar buttons and add these new buttons:**

```javascript
{/* Save/Load buttons - ADD THESE */}
<button
    onClick={handleSaveProject}
    title="Save Project (Ctrl+S)"
    className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-2 text-sm font-semibold"
>
    <Icon name="Save" size={16} />
    <span>Save</span>
</button>

<button
    onClick={() => setShowProjectLibrary(true)}
    title="Open Project (Ctrl+O)"
    className="px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-2 text-sm font-semibold"
>
    <Icon name="FolderOpen" size={16} />
    <span>Open</span>
</button>

{/* Save message indicator */}
{saveMessage && (
    <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
        saveMessage.startsWith('✓') ? 'text-green-500' : 'text-red-500'
    }`}>
        {saveMessage}
    </div>
)}
```

---

## Step 7: Add Keyboard Shortcuts

### Location: Add useEffect for keyboard shortcuts (around line 23200)

```javascript
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
}, [currentProject, projectTitle, projectAuthor]);
```

---

## Step 8: Render Modals

### Location: In the ProScriptBuilder return statement, before the closing div

**Add these modal renders:**

```javascript
{/* Save Project Dialog */}
{showSaveDialog && <SaveProjectDialog />}

{/* Project Library */}
{showProjectLibrary && <ProjectLibrary />}
```

---

## 🧪 Testing Checklist

After implementation, test these scenarios:

### Basic Save/Load
- [ ] Click "Save" button → Save dialog appears
- [ ] Enter title and author → Click "Save Project"
- [ ] See success message "✓ Project saved successfully"
- [ ] Click "Open" button → Project Library appears
- [ ] See saved project in library
- [ ] Click project card → Project loads successfully

### Keyboard Shortcuts
- [ ] Press Ctrl+S (Cmd+S on Mac) → Save dialog appears
- [ ] Press Ctrl+O (Cmd+O on Mac) → Project Library appears

### Project Management
- [ ] Save multiple projects → All appear in library
- [ ] Search for project by title → Filters correctly
- [ ] Sort by different criteria → Order changes
- [ ] Export project as JSON → File downloads
- [ ] Import JSON file → Project appears in library
- [ ] Delete project → Confirmation dialog → Project removed

### Edge Cases
- [ ] Try to save without title → Button disabled
- [ ] Save very large project → Check storage warning
- [ ] Fill storage to 80%+ → Warning message appears
- [ ] Refresh page after saving → Project persists
- [ ] Load project → All data restored (script, characters, arcs)

---

## 🎯 Success Criteria

Phase 1 is complete when:

1. ✅ LocalStorageManager utility is working
2. ✅ Save button saves projects to localStorage
3. ✅ Open button shows Project Library
4. ✅ Projects can be loaded and all data restores
5. ✅ Projects can be deleted
6. ✅ Projects can be exported/imported as JSON
7. ✅ Keyboard shortcuts work (Ctrl+S, Ctrl+O)
8. ✅ Storage usage is displayed
9. ✅ Search and sort work in Project Library
10. ✅ Save messages appear and disappear

---

## 📝 Implementation Order

Follow this exact order:

1. **Add LocalStorageManager** (Step 1) - Foundation
2. **Add state variables** (Step 2) - Data management
3. **Add handlers** (Step 3) - Business logic
4. **Add SaveProjectDialog** (Step 4) - UI for saving
5. **Add ProjectLibrary** (Step 5) - UI for loading
6. **Add toolbar buttons** (Step 6) - User access
7. **Add keyboard shortcuts** (Step 7) - Power user features
8. **Render modals** (Step 8) - Display UI
9. **Test everything** - Verify all features work

---

## 🚀 Next Steps After Phase 1

Once Phase 1 is complete and tested, proceed to:

**Phase 2: Story Output Panel**
- Real-time formatted preview
- Character highlighting
- Synopsis editor
- Word/page/reading time statistics

**Phase 3: Export Features**
- Convert to AI Prompt
- PDF export
- TXT export
- Multiple format support

---

## 💡 Tips

1. **Test incrementally** - Test each step before moving to the next
2. **Use browser DevTools** - Check localStorage in Application tab
3. **Console.log liberally** - Debug save/load operations
4. **Backup your work** - Save mokha-suite PRO Vqr.html before major changes
5. **Follow existing patterns** - Match the coding style in the file

---

**Ready to implement!** Start with Step 1 and work through each step in order.
