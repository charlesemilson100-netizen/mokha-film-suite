# Story Output & Management System - Implementation Handoff

## Project Status: Ready for Implementation

This document provides complete context for implementing the Story Output & Management System in the MOKHA Film Suite Pro Script Builder.

---

## 📋 What's Been Completed

### ✅ Character Arc Mapper - Fully Functional
The Character Arc Mapper with professional nodal tree visualization is complete and working in `mokha-suite PRO Vqr.html`.

**Key Features Implemented:**
1. **Professional Nodal Tree Visualization**
   - Glass-style connectors (2.5x2.5px) positioned outside node borders
   - 8 color-coded relationship types per side (16 connectors per node)
   - Magnetic snap (50px range) for easy connection
   - Palma (S-curve) and Bezier line styles (switchable)
   - Glow effects on connected lines
   - Real-time visual feedback during dragging

2. **Relationship Logic & Compatibility**
   - Incompatibility rules prevent conflicting relationships
   - Example: Ally ↔️ Cannot coexist with Enemy, Rival, Neutral
   - Disabled options show lock icon with tooltip
   - Smart replacement of existing relationships

3. **Enhanced Toolbar**
   - Zoom In/Out (+/- keys)
   - Reset Zoom (0 key)
   - Auto Fit (F key)
   - Hand Tool (H key) for panning
   - Line Style Toggle (Palma/Bezier)
   - Auto-arrange Grid
   - Center View
   - All buttons visible with horizontal scroll

4. **Keyboard Shortcuts**
   - H = Toggle hand tool
   - +/- = Zoom in/out
   - 0 = Reset zoom
   - F = Auto fit
   - Ctrl/Cmd + Mouse Wheel = Zoom

5. **Context Menus**
   - Right-click node: Edit, Connect To, Delete
   - Click line: Change type, Delete relationship
   - Connect To submenu with relationship type selection
   - Only compatible types shown (incompatible locked)

6. **Character Features**
   - Color labels on nodes showing relationship types
   - Bidirectional relationships (A→B creates B→A reverse)
   - Character creation in nodal tree
   - Persistence to blueprint

### ✅ Requirements Document Created
Comprehensive requirements document at `.kiro/specs/story-output-management/requirements.md` with 20 detailed requirements.

---

## 🎯 Next Steps: Implementation

### Phase 1: Core Infrastructure (Priority 1)

**1.1 LocalStorage Manager**
```javascript
// Create LocalStorageManager utility
const LocalStorageManager = {
  STORAGE_KEY: 'mokha_story_projects',
  
  saveProject(project) {
    // Save project to localStorage
    // Generate unique ID if new
    // Update lastModified timestamp
  },
  
  loadProject(projectId) {
    // Load project from localStorage
    // Return project data
  },
  
  getAllProjects() {
    // Return array of all saved projects
  },
  
  deleteProject(projectId) {
    // Remove project from localStorage
  },
  
  getStorageUsage() {
    // Calculate localStorage usage
    // Return { used, available, percentage }
  }
};
```

**1.2 Project Data Structure**
```javascript
const StoryProject = {
  id: 'unique-id',
  title: 'Project Title',
  author: 'Author Name',
  createdAt: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  blueprint: { /* Story Blueprint data */ },
  script: { /* Script Document data */ },
  characterArcs: [ /* Character Arc data */ ],
  synopsis: {
    overview: 'Story overview...',
    characters: [ /* Character descriptions */ ],
    setting: 'Setting description...',
    theme: 'Theme and tone...'
  },
  metadata: {
    wordCount: 0,
    pageCount: 0,
    readingTime: 0,
    thumbnail: 'base64-image-string'
  }
};
```

**1.3 Save/Load UI Components**
- Add "Save Project" button to Pro Script Builder toolbar
- Add "Open Project" button to Pro Script Builder toolbar
- Create Project Library modal component
- Create Save Project dialog (for first-time save)

### Phase 2: Story Output Panel (Priority 2)

**2.1 Story Output Panel Component**
```javascript
const StoryOutputPanel = ({ script, blueprint, characterArcs, synopsis }) => {
  const [viewMode, setViewMode] = useState('screenplay'); // 'screenplay' or 'prose'
  const [showCharacterHighlight, setShowCharacterHighlight] = useState(true);
  
  // Format script content
  const formattedContent = formatScriptContent(script, viewMode);
  
  return (
    <div className="story-output-panel">
      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => setViewMode('screenplay')}>Screenplay</button>
        <button onClick={() => setViewMode('prose')}>Prose</button>
        <button onClick={() => setShowCharacterHighlight(!showCharacterHighlight)}>
          Highlight Characters
        </button>
      </div>
      
      {/* Synopsis Section */}
      <SynopsisSection synopsis={synopsis} editable={true} />
      
      {/* Formatted Script Content */}
      <div className="formatted-content">
        {formattedContent}
      </div>
      
      {/* Statistics */}
      <div className="statistics">
        <span>Words: {calculateWordCount(script)}</span>
        <span>Pages: {calculatePageCount(script)}</span>
        <span>Reading Time: {calculateReadingTime(script)}</span>
      </div>
    </div>
  );
};
```

**2.2 Formatting Engine**
```javascript
const formatScriptContent = (script, viewMode) => {
  // Convert script to formatted HTML
  // Apply screenplay or prose formatting
  // Highlight character names
  // Add page breaks
  return formattedHTML;
};

const highlightCharacterNames = (text, characters) => {
  // Find and highlight character mentions
  // Use different colors for different characters
  return highlightedText;
};
```

**2.3 Synopsis Editor**
```javascript
const SynopsisSection = ({ synopsis, editable, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSynopsis, setEditedSynopsis] = useState(synopsis);
  
  return (
    <div className="synopsis-section">
      {isEditing ? (
        <SynopsisEditor 
          synopsis={editedSynopsis}
          onChange={setEditedSynopsis}
          onSave={() => {
            onSave(editedSynopsis);
            setIsEditing(false);
          }}
        />
      ) : (
        <SynopsisDisplay 
          synopsis={synopsis}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
```

### Phase 3: Export Features (Priority 3)

**3.1 Convert to AI Prompt**
```javascript
const convertToAIPrompt = (project, template = 'general') => {
  const templates = {
    general: `# ${project.title}

## Synopsis
${project.synopsis.overview}

## Characters
${project.synopsis.characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}

## Setting
${project.synopsis.setting}

## Theme
${project.synopsis.theme}

## Script
${formatScriptForPrompt(project.script)}

---
Instructions: This is a screenplay prompt for AI story generation. Please analyze the synopsis, characters, and script structure, then generate [specific request].`,
    
    dialogue: `Generate expanded dialogue for the following screenplay...`,
    storyboard: `Create detailed storyboard descriptions for the following scenes...`
  };
  
  return templates[template] || templates.general;
};
```

**3.2 Export Modal Component**
```javascript
const ExportModal = ({ project, onClose }) => {
  const [exportFormat, setExportFormat] = useState('prompt');
  const [promptTemplate, setPromptTemplate] = useState('general');
  
  const handleExport = () => {
    switch(exportFormat) {
      case 'prompt':
        const prompt = convertToAIPrompt(project, promptTemplate);
        copyToClipboard(prompt);
        break;
      case 'pdf':
        exportToPDF(project);
        break;
      case 'txt':
        exportToTXT(project);
        break;
      case 'json':
        exportToJSON(project);
        break;
    }
  };
  
  return (
    <div className="export-modal">
      {/* Export format selection */}
      {/* Template selection (for AI prompt) */}
      {/* Preview */}
      {/* Export buttons */}
    </div>
  );
};
```

**3.3 Format Converters**
```javascript
const exportToPDF = (project) => {
  // Use html2pdf library (already loaded)
  const element = document.createElement('div');
  element.innerHTML = formatForPDF(project);
  
  html2pdf()
    .from(element)
    .set({
      margin: 1,
      filename: `${project.title}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    })
    .save();
};

const exportToTXT = (project) => {
  const content = formatForTXT(project);
  const blob = new Blob([content], { type: 'text/plain' });
  downloadFile(blob, `${project.title}.txt`);
};

const exportToJSON = (project) => {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `${project.title}.json`);
};
```

### Phase 4: Auto-Save & Advanced Features (Priority 4)

**4.1 Auto-Save System**
```javascript
const useAutoSave = (project, enabled = true) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    if (!enabled || !hasChanges) return;
    
    const timer = setTimeout(() => {
      LocalStorageManager.saveProject(project);
      setLastSaved(new Date());
      setHasChanges(false);
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, [project, enabled, hasChanges]);
  
  return { lastSaved, hasChanges };
};
```

**4.2 Scene Breakdown View**
```javascript
const SceneBreakdown = ({ script }) => {
  const scenes = script.scenes.map((scene, idx) => ({
    number: idx + 1,
    heading: scene.label,
    actionCount: scene.shots.filter(s => s.type === 'action').length,
    dialogueCount: scene.shots.filter(s => s.type === 'dialogue').length,
    duration: estimateSceneDuration(scene)
  }));
  
  return (
    <div className="scene-breakdown">
      {scenes.map(scene => (
        <div key={scene.number} className="scene-item">
          <div className="scene-header">
            Scene {scene.number}: {scene.heading}
          </div>
          <div className="scene-stats">
            <span>{scene.actionCount} actions</span>
            <span>{scene.dialogueCount} dialogues</span>
            <span>{scene.duration} min</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🗂️ File Structure

```
mokha-suite PRO Vqr.html
├── Existing Components (DO NOT MODIFY)
│   ├── ConfigurationWizard
│   ├── ProScriptBuilder
│   ├── CharacterArcMapper (COMPLETE)
│   └── ScriptEditor
│
└── New Components (TO BE ADDED)
    ├── LocalStorageManager (utility)
    ├── ProjectLibrary (modal)
    ├── StoryOutputPanel (side panel)
    ├── SynopsisEditor (component)
    ├── ExportModal (modal)
    ├── SceneBreakdown (component)
    └── FormatConverters (utilities)
```

---

## 🔧 Integration Points

### 1. Pro Script Builder Toolbar
Add these buttons to the existing toolbar:
```javascript
<button onClick={handleSaveProject}>
  <Icon name="Save" size={16} />
  Save Project
</button>

<button onClick={handleOpenProject}>
  <Icon name="FolderOpen" size={16} />
  Open Project
</button>

<button onClick={handleShowPreview}>
  <Icon name="Eye" size={16} />
  Preview
</button>

<button onClick={handleExport}>
  <Icon name="Download" size={16} />
  Export
</button>
```

### 2. State Management
The Pro Script Builder already has:
- `script` state (Script Document)
- `blueprint` state (Story Blueprint)
- Character arc data in `script.metadata.characterArcs`

Add:
- `currentProject` state (Story Project)
- `synopsis` state (Synopsis Section)
- `autoSaveEnabled` state (Auto-Save toggle)

### 3. Data Flow
```
User edits script
  ↓
Script state updates
  ↓
Story Output Panel re-renders (debounced 500ms)
  ↓
Auto-Save triggers after 30s inactivity
  ↓
Project saved to localStorage
```

---

## 📝 Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create LocalStorageManager utility
- [ ] Define StoryProject data structure
- [ ] Add Save Project button and dialog
- [ ] Add Open Project button and Project Library modal
- [ ] Implement save/load functionality
- [ ] Test localStorage operations

### Phase 2: Story Output Panel
- [ ] Create StoryOutputPanel component
- [ ] Implement screenplay formatting
- [ ] Implement prose formatting
- [ ] Add character name highlighting
- [ ] Create SynopsisSection component
- [ ] Add word/page/reading time statistics
- [ ] Test real-time updates

### Phase 3: Export Features
- [ ] Create ExportModal component
- [ ] Implement Convert to AI Prompt
- [ ] Add prompt template selection
- [ ] Implement PDF export
- [ ] Implement TXT export
- [ ] Implement JSON export
- [ ] Add copy to clipboard functionality
- [ ] Test all export formats

### Phase 4: Advanced Features
- [ ] Implement Auto-Save system
- [ ] Create SceneBreakdown component
- [ ] Add Character Arc Summary view
- [ ] Implement Project Thumbnail generation
- [ ] Add storage quota warnings
- [ ] Implement project search/filter
- [ ] Add project import from JSON
- [ ] Test complete workflow

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Seamless Integration** - Match existing Pro Script Builder styling
2. **Non-Intrusive** - Don't interrupt user's writing flow
3. **Professional** - Maintain cinema-grade aesthetic
4. **Responsive** - Work on all screen sizes
5. **Accessible** - Keyboard shortcuts and screen reader support

### Color Scheme (Already Defined)
- Primary: `rgb(234, 179, 8)` (Cinema Gold)
- Accent: `rgb(6, 182, 212)` (Cyan)
- Background Light: `#e5e5e5`
- Background Dark: `#111111`
- Panel Light: `#f5f5f5`
- Panel Dark: `#1a1a1a`

### Typography
- Monospace for script content: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`
- Sans-serif for UI: System default

---

## 🧪 Testing Strategy

### Manual Testing
1. **Save/Load Flow**
   - Create new project
   - Save with title and author
   - Close and reopen
   - Verify all data restored

2. **Story Output Panel**
   - Edit script
   - Verify live preview updates
   - Check character highlighting
   - Test screenplay vs prose modes

3. **Export Flow**
   - Export as AI prompt
   - Copy to clipboard
   - Download as TXT
   - Export as PDF
   - Export as JSON backup

4. **Auto-Save**
   - Make changes
   - Wait 30 seconds
   - Verify auto-save notification
   - Refresh page
   - Verify changes persisted

### Edge Cases
- [ ] localStorage full
- [ ] Very large projects (>1000 scenes)
- [ ] Special characters in titles
- [ ] Empty projects
- [ ] Corrupted localStorage data
- [ ] Browser without localStorage support

---

## 📚 Reference Documents

1. **Requirements**: `.kiro/specs/story-output-management/requirements.md`
2. **Main App**: `mokha-suite PRO Vqr.html`
3. **Story Blueprint Spec**: `.kiro/specs/story-blueprint-engine/`

---

## 🚀 Quick Start for New Conversation

**Copy this prompt to start implementation:**

```
I need to implement the Story Output & Management System for the MOKHA Film Suite Pro Script Builder.

Context:
- Main file: mokha-suite PRO Vqr.html
- Requirements: .kiro/specs/story-output-management/requirements.md
- Handoff doc: .kiro/HANDOFF_STORY_OUTPUT_SYSTEM.md

Please read the handoff document and start implementing Phase 1: Core Infrastructure (LocalStorage Manager, Save/Load functionality).

The Character Arc Mapper is complete and working - do not modify it. Add new features alongside existing components.

Start with:
1. LocalStorageManager utility
2. StoryProject data structure
3. Save Project button and dialog
4. Project Library modal
```

---

## ✅ Current State Summary

**Working Features:**
- ✅ Story Blueprint Engine (7-step wizard)
- ✅ Pro Script Builder (scene/shot editing)
- ✅ Character Arc Mapper (nodal tree visualization)
- ✅ Script formatting and auto-formatting
- ✅ Page count and runtime calculation
- ✅ PDF/TXT export (basic)

**Ready to Implement:**
- 🔄 Story Output & Management System (all features)

**File Status:**
- `mokha-suite PRO Vqr.html` - Main app (23,523 lines) - STABLE
- `.kiro/specs/story-output-management/requirements.md` - COMPLETE
- All other files - UNCHANGED

---

## 💡 Implementation Tips

1. **Start Small** - Implement save/load first, then build on it
2. **Test Frequently** - Test each feature before moving to next
3. **Use Existing Patterns** - Follow the coding style in the main file
4. **Preserve Existing Code** - Don't modify working features
5. **Add Comments** - Document new code for future maintenance

---

**Last Updated**: Current conversation
**Status**: Ready for implementation
**Next Action**: Start Phase 1 in new conversation
