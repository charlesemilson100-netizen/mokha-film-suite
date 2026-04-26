# Phase 2 Implementation Guide: Story Output Panel

## 📍 Overview

Phase 2 adds a real-time Story Output Panel that displays formatted screenplay text with character highlighting, statistics, and synopsis editing.

---

## Step 1: Add Story Output Panel Component

### Location: Before ProScriptBuilder return statement (around line 23600)

**Add this Story Output Panel component:**

```javascript
// ── Story Output Panel Component ────────────────────────────────────────────────
const StoryOutputPanel = ({ script, blueprint, characterArcs, synopsis, onSynopsisChange }) => {
    const [viewMode, setViewMode] = useState('screenplay'); // 'screenplay' or 'prose'
    const [showCharacterHighlight, setShowCharacterHighlight] = useState(true);
    const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
    const [editedSynopsis, setEditedSynopsis] = useState(synopsis);

    // Calculate statistics
    const calculateStats = () => {
        let wordCount = 0;
        let actionLines = 0;
        let dialogueLines = 0;

        script.scenes.forEach(scene => {
            scene.shots.forEach(shot => {
                if (shot.action) {
                    wordCount += shot.action.split(/\s+/).filter(w => w.length > 0).length;
                    actionLines += shot.action.split('\n').length;
                }
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

    // Format screenplay content
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

                if (shot.action) {
                    lines.push({
                        type: 'action',
                        text: shot.action,
                        sceneIdx,
                        shotIdx
                    });
                }

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

    // Highlight character names in text
    const highlightCharacters = (text, characters) => {
        if (!showCharacterHighlight || !characters || characters.length === 0) {
            return text;
        }

        let result = text;
        characters.forEach((char, idx) => {
            const regex = new RegExp(`\\b${char.name}\\b`, 'gi');
            const color = ['bg-red-200 dark:bg-red-900', 'bg-blue-200 dark:bg-blue-900', 'bg-green-200 dark:bg-green-900', 'bg-yellow-200 dark:bg-yellow-900', 'bg-purple-200 dark:bg-purple-900', 'bg-pink-200 dark:bg-pink-900', 'bg-indigo-200 dark:bg-indigo-900', 'bg-cyan-200 dark:bg-cyan-900'][idx % 8];
            result = result.replace(regex, `<span class="${color} px-1 rounded">${char.name}</span>`);
        });

        return result;
    };

    return (
        <div className="fixed inset-0 bg-panel-light dark:bg-panel-dark flex flex-col z-40 overflow-hidden">
            {/* Header */}
            <div className="border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Story Output</h2>
                <div className="flex gap-2">
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
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* Synopsis Section */}
                {isEditingSynopsis ? (
                    <div className="mb-8 p-4 border border-border-light dark:border-border-dark rounded-lg">
                        <h3 className="text-lg font-bold mb-4">Edit Synopsis</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Overview</label>
                                <textarea
                                    value={editedSynopsis.overview}
                                    onChange={(e) => setEditedSynopsis({ ...editedSynopsis, overview: e.target.value })}
                                    placeholder="Story overview..."
                                    className="w-full px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark h-24"
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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        onSynopsisChange(editedSynopsis);
                                        setIsEditingSynopsis(false);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primaryHover"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditingSynopsis(false)}
                                    className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-input-light dark:hover:bg-input-dark"
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
                    <div className="font-mono text-sm space-y-2">
                        {screenplayLines.map((line, idx) => {
                            if (line.type === 'heading') {
                                return (
                                    <div key={idx} className="font-bold text-center my-4">
                                        {line.text}
                                    </div>
                                );
                            } else if (line.type === 'action') {
                                return (
                                    <div key={idx} className="text-textMuted-light dark:text-textMuted-dark whitespace-pre-wrap">
                                        {line.text}
                                    </div>
                                );
                            } else if (line.type === 'character') {
                                return (
                                    <div key={idx} className="text-center font-bold my-2">
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
```

---

## Step 2: Add Preview Button to Toolbar

### Location: In ProScriptBuilder toolbar (around line 23700)

**Add this button after the Save/Open buttons:**

```javascript
<button 
    onClick={() => setShowStoryOutput(true)}
    title="Preview Story Output"
    className="flex-1 md:flex-none px-2 md:px-3 py-1 md:py-2 rounded-lg bg-input-light dark:bg-input-dark border border-border-light dark:border-border-dark hover:border-primary/50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold"
>
    <Icon name="Eye" size={14} />
    <span className="hidden md:inline">Preview</span>
</button>
```

---

## Step 3: Add State Variables

### Location: ProScriptBuilder state section (after project management state)

**Add these state variables:**

```javascript
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
```

---

## Step 4: Add Synopsis Update Handler

### Location: After save/load handlers

**Add this handler:**

```javascript
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
```

---

## Step 5: Render Story Output Panel

### Location: Before closing div of ProScriptBuilder return

**Add this modal render:**

```javascript
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
                />
                <button
                    onClick={() => setShowStoryOutput(false)}
                    className="absolute top-4 right-4 text-textMuted-light dark:text-textMuted-dark hover:text-textMain-light dark:hover:text-textMain-dark"
                >
                    <Icon name="X" size={24} />
                </button>
            </div>
        </div>
    </div>
)}
```

---

## Step 6: Update Project Save to Include Synopsis

### Location: In saveCurrentProject function

**Update the projectData object:**

```javascript
const projectData = {
    id: currentProject?.id,
    title: projectTitle || 'Untitled Project',
    author: projectAuthor || 'Unknown',
    blueprint: blueprint,
    script: script,
    characterArcs: characterArcs,
    synopsis: synopsis,  // ← Add this line
    metadata: {
        wordCount: calculateWordCount(script),
        pageCount: calculatePageCount(script),
        readingTime: calculateReadingTime(script),
        thumbnail: ''
    }
};
```

---

## Step 7: Update Project Load to Restore Synopsis

### Location: In handleLoadProject function

**Add this line after loading the project:**

```javascript
const handleLoadProject = (projectId) => {
    const project = LocalStorageManager.loadProject(projectId);
    if (project) {
        setCurrentProject(project);
        setProjectTitle(project.title);
        setProjectAuthor(project.author);
        setScript(project.script);
        setCharacterArcs(project.characterArcs || []);
        setBlueprintCharacters(project.synopsis?.characters || []);
        setSynopsis(project.synopsis || {  // ← Add this line
            overview: '',
            characters: [],
            setting: '',
            theme: ''
        });
        setShowProjectLibrary(false);
        setSaveMessage('✓ Project loaded successfully');
        setTimeout(() => setSaveMessage(''), 3000);
    }
};
```

---

## 🧪 Testing Checklist

After implementation, test these scenarios:

### Basic Preview
- [ ] Click "Preview" button → Story Output Panel opens
- [ ] Panel shows formatted screenplay
- [ ] Statistics display correctly (words, pages, reading time)
- [ ] Close button works

### View Modes
- [ ] Click "Screenplay" button → Shows screenplay format
- [ ] Click "Prose" button → Shows prose format
- [ ] Both formats display content correctly

### Character Highlighting
- [ ] Click "Highlight" button → Characters are highlighted
- [ ] Different characters have different colors
- [ ] Click again → Highlighting turns off

### Synopsis Editing
- [ ] Click "Edit" button → Edit form appears
- [ ] Edit overview, setting, theme
- [ ] Click "Save" → Changes persist
- [ ] Click "Cancel" → Changes discarded
- [ ] Edited synopsis displays in read mode

### Statistics
- [ ] Word count updates as script changes
- [ ] Page count calculates correctly
- [ ] Reading time estimates correctly
- [ ] Action/dialogue line counts display

### Data Persistence
- [ ] Save project with synopsis
- [ ] Load project → Synopsis is restored
- [ ] Edit synopsis → Changes persist on save

---

## 🎯 Success Criteria

Phase 2 is complete when:

1. ✅ Story Output Panel displays formatted screenplay
2. ✅ Screenplay and Prose view modes work
3. ✅ Character highlighting works with 8 colors
4. ✅ Statistics display correctly
5. ✅ Synopsis can be edited and saved
6. ✅ Synopsis persists on project save/load
7. ✅ Panel is responsive and full-screen
8. ✅ No console errors
9. ✅ Dark mode works correctly
10. ✅ All data updates in real-time

---

## 💡 Implementation Tips

1. **Test incrementally** - Test each feature before moving to next
2. **Check statistics** - Verify word/page counts are accurate
3. **Test highlighting** - Ensure all 8 colors cycle correctly
4. **Test persistence** - Save and load to verify synopsis persists
5. **Mobile testing** - Ensure panel works on small screens

---

**Ready to implement!** Follow each step in order.

