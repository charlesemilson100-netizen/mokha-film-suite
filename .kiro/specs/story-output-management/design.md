# Design Document: Story Output & Management System

## Overview

The Story Output & Management System transforms the Pro Script Builder from a single-session scriptwriting tool into a comprehensive project management platform. It enables screenwriters to save multiple story projects to browser localStorage, load previously saved stories, view formatted story text in real-time, customize synopsis and character information, and export complete stories as AI-ready prompts.

The design is a modular, additive extension of the existing Pro Script Builder architecture. All features integrate seamlessly with the existing Story Blueprint Engine and Director Brain components through a unified localStorage persistence layer and a real-time Story Output Panel.

### Key Design Decisions

1. **localStorage-first architecture**: All project data persists in browser localStorage with no server dependency. Projects are stored as JSON objects with unique IDs.
2. **Modular component structure**: LocalStorage_Manager, Format_Converter, and Story_Output_Panel are independent modules that can be tested and extended separately.
3. **Real-time preview with debouncing**: The Story_Output_Panel updates automatically as the user edits, with 500ms debounce to prevent excessive re-renders.
4. **Dual export strategy**: Projects can be exported as JSON (for backup/transfer) or as formatted text (TXT, Markdown, PDF) for sharing and AI tools.
5. **Non-intrusive auto-save**: Auto-save runs silently in the background with a 30-second inactivity timer, displaying only a subtle notification.
6. **Responsive design**: The Story_Output_Panel adapts to desktop (side panel), tablet (modal), and mobile (full-screen modal) viewports.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Pro Script Builder (existing)                              │
│  - Scene/Shot editing interface                             │
│  - Story Blueprint integration                              │
│  - Character Arc Mapper                                     │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│LocalStorage  │  │Story_Output  │  │Format        │
│Manager       │  │Panel         │  │Converter     │
│              │  │              │  │              │
│- Save        │  │- Live        │  │- Export TXT  │
│- Load        │  │  preview     │  │- Export PDF  │
│- Delete      │  │- Synopsis    │  │- Export MD   │
│- Import      │  │- Character   │  │- Export JSON │
│- Auto-save   │  │  highlighting│  │- AI Prompt   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │Project       │
                  │Library UI    │
                  │              │
                  │- Browse      │
                  │- Search      │
                  │- Filter      │
                  │- Sort        │
                  └──────────────┘
```

### Data Flow

1. **Save**: User clicks "Save Project" → LocalStorage_Manager validates data → stores to localStorage → displays confirmation
2. **Load**: User clicks "Open Project" → Project_Library displays all saved projects → user selects one → LocalStorage_Manager loads data → Pro Script Builder populates
3. **Preview**: User edits script → Story_Output_Panel debounces changes (500ms) → re-renders formatted output
4. **Export**: User clicks "Export" → Format_Converter generates file → downloads to user's device
5. **Auto-save**: User makes changes → Auto_Save timer starts → after 30s inactivity → LocalStorage_Manager saves silently

---

## Components and Interfaces

### LocalStorage_Manager (module-scope plain JS object)

```js
const LocalStorage_Manager = {
  // Save a new or existing project
  saveProject(projectData, isNewProject) { ... },

  // Load all projects from localStorage
  loadAllProjects() { ... },

  // Load a specific project by ID
  loadProjectById(projectId) { ... },

  // Delete a project by ID
  deleteProject(projectId) { ... },

  // Duplicate a project
  duplicateProject(projectId) { ... },

  // Import a project from JSON file
  importProjectFromJSON(jsonData) { ... },

  // Export a project as JSON
  exportProjectAsJSON(projectId) { ... },

  // Get storage usage statistics
  getStorageStats() { ... },

  // Check if localStorage is available
  isStorageAvailable() { ... },
};
```

**Project data structure:**
```js
{
  id: string,                    // UUID
  title: string,
  author: string,
  createdAt: number,             // Date.now()
  lastModified: number,          // Date.now()
  storyBlueprint: object,        // Story Blueprint data
  scriptDocument: object,        // Script/shots data
  characterArcs: object,         // Character arc data
  synopsis: {
    overview: string,            // ≤500 chars
    characters: Array,           // [{ name, description }]
    setting: string,
    themeTone: string,
  },
  metadata: {
    wordCount: number,
    pageCount: number,
    readingTime: number,         // seconds
    thumbnail: string,           // base64 image
  },
}
```

**localStorage key structure:**
```
mokha_projects: [
  { id: "...", title: "...", ... },
  { id: "...", title: "...", ... },
]
```

### Story_Output_Panel React Component

```jsx
const Story_Output_Panel = ({
  isOpen,
  onClose,
  projectData,
  onUpdateSynopsis,
  onExport,
  isDarkMode,
}) => { ... }
```

**Props:**
- `isOpen: boolean` — panel visibility
- `onClose: () => void` — close handler
- `projectData: ProjectData` — current project
- `onUpdateSynopsis: (synopsis) => void` — update synopsis
- `onExport: (format) => void` — export handler
- `isDarkMode: boolean` — theme preference

**Internal state:**
```js
const [viewMode, setViewMode] = useState('screenplay'); // 'screenplay' | 'prose'
const [showSynopsis, setShowSynopsis] = useState(true);
const [highlightCharacters, setHighlightCharacters] = useState(true);
const [selectedCharacter, setSelectedCharacter] = useState(null);
const [editingSynopsis, setEditingSynopsis] = useState(false);
```

**Sub-components:**
- `SynopsisSection` — editable synopsis fields
- `FormattedScript` — screenplay-formatted output with syntax highlighting
- `CharacterHighlighter` — character name highlighting logic
- `SceneBreakdown` — scene-by-scene analysis view
- `CharacterArcSummary` — character arc visualization
- `StatisticsPanel` — word count, page count, reading time

### Format_Converter (module-scope plain JS object)

```js
const Format_Converter = {
  // Convert to AI prompt format
  toAIPrompt(projectData, templateKey) { ... },

  // Convert to plain text
  toPlainText(projectData) { ... },

  // Convert to Markdown
  toMarkdown(projectData) { ... },

  // Convert to PDF (uses html2pdf)
  toPDF(projectData) { ... },

  // Convert to JSON (project backup)
  toJSON(projectData) { ... },

  // Get available prompt templates
  getPromptTemplates() { ... },

  // Save custom prompt template
  saveCustomTemplate(name, template) { ... },
};
```

**AI Prompt template structure:**
```js
{
  name: string,
  description: string,
  template: string,  // with placeholders: {title}, {synopsis}, {characters}, {script}
  instructions: string,
}
```

**Default templates:**
- "General Story Generation" — basic structure
- "Dialogue Expansion" — focus on dialogue
- "Scene Description" — focus on action/description
- "Storyboard Generation" — visual breakdown
- "Custom Template" — user-defined

### Project_Library React Component

```jsx
const Project_Library = ({
  isOpen,
  onClose,
  onSelectProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProject,
}) => { ... }
```

**Internal state:**
```js
const [projects, setProjects] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [filterType, setFilterType] = useState('all');
const [sortBy, setSortBy] = useState('lastModified');
const [selectedProjects, setSelectedProjects] = useState([]);
```

**Features:**
- Search by title, author, synopsis
- Filter by story type, duration bracket, date range
- Sort by last modified, title, creation date
- Multi-select for bulk operations
- Context menu (right-click) for individual project actions
- Storage usage display

### Auto_Save Module

```js
const Auto_Save = {
  // Initialize auto-save with interval
  init(saveCallback, intervalMs = 30000) { ... },

  // Mark that changes have been made
  markDirty() { ... },

  // Manually trigger save
  triggerSave() { ... },

  // Disable auto-save
  disable() { ... },

  // Enable auto-save
  enable() { ... },

  // Check if auto-save is enabled
  isEnabled() { ... },
};
```

**Behavior:**
- Starts a timer when `markDirty()` is called
- After 30 seconds of inactivity, calls `saveCallback()`
- Resets timer if `markDirty()` is called again
- Displays subtle "Auto-saved at [time]" notification
- Can be toggled in settings

---

## Data Models

### Story_Project (localStorage entry)

```js
{
  id: "uuid-string",
  title: "My Story",
  author: "John Doe",
  createdAt: 1704067200000,
  lastModified: 1704067200000,
  storyBlueprint: {
    // Story Blueprint Engine data
    duration: 15,
    genre: "Drama",
    // ... other blueprint fields
  },
  scriptDocument: {
    // Pro Script Builder scenes/shots
    scenes: [
      {
        id: "scene-1",
        heading: "INT. APARTMENT - DAY",
        shots: [
          {
            id: "shot-1",
            selections: {
              shotType: "Wide Shot (WS)",
              lens: "35mm",
              lighting: "Natural",
              // ... other selections
            },
          },
        ],
      },
    ],
  },
  characterArcs: {
    // Character Arc Mapper data
    characters: [
      {
        id: "char-1",
        name: "John",
        startingState: "Uncertain",
        endingState: "Confident",
        turningPoints: [
          { sceneId: "scene-2", description: "Meets mentor" },
        ],
      },
    ],
  },
  synopsis: {
    overview: "A story about...",
    characters: [
      { name: "John", description: "A young..." },
    ],
    setting: "Modern day New York",
    themeTone: "Hopeful, introspective",
  },
  metadata: {
    wordCount: 2500,
    pageCount: 12,
    readingTime: 750,  // seconds
    thumbnail: "data:image/png;base64,...",
  },
}
```

### Formatted Script Output

**Screenplay format:**
```
INT. APARTMENT - DAY

John sits at his desk, staring at a blank screen.

                              JOHN
                    What should I write?

He stands and walks to the window.
```

**Prose format:**
```
In an apartment during the day, John sits at his desk, staring at a blank screen. He wonders what he should write. He stands and walks to the window.
```

### Character Highlight Colors

```js
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
```

### Storage Statistics

```js
{
  totalProjects: number,
  totalUsedBytes: number,
  totalAvailableBytes: number,
  percentageUsed: number,
  projectSizes: [
    { projectId: string, title: string, sizeBytes: number },
  ],
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project persistence round-trip

*For any* valid Story_Project object, saving it to localStorage and then loading it by ID SHALL return an object that is structurally identical to the original (all fields, nested objects, and arrays preserved).

**Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.3**

---

### Property 2: Unique project IDs

*For any* sequence of save operations, each newly saved project SHALL receive a unique ID that does not match any existing project ID in localStorage.

**Validates: Requirements 1.2**

---

### Property 3: Last modified timestamp updates

*For any* project that is saved, the `lastModified` timestamp SHALL be updated to a value greater than or equal to the current time (Date.now()).

**Validates: Requirements 1.3**

---

### Property 4: Duplicate creates independent copy

*For any* project that is duplicated, the resulting project SHALL have a unique ID, a title with " (Copy)" appended, and all other fields identical to the original. Modifying the duplicate SHALL NOT affect the original project.

**Validates: Requirements 3.4**

---

### Property 5: Deletion removes project completely

*For any* project that is deleted, subsequent calls to `loadAllProjects()` SHALL NOT include that project in the returned array, and `loadProjectById(deletedId)` SHALL return null.

**Validates: Requirements 3.3**

---

### Property 6: Auto-save only saves when dirty

*For any* 30-second interval where no changes are made to the project, the Auto_Save system SHALL NOT call the save callback. Conversely, after 30 seconds of inactivity following a change, the save callback SHALL be called exactly once.

**Validates: Requirements 4.1, 4.7**

---

### Property 7: Story output reflects current state

*For any* change to the Script Document (adding/editing/deleting a shot or scene), the Story_Output_Panel SHALL update to reflect that change within 500ms (debounce delay).

**Validates: Requirements 5.2, 5.3**

---

### Property 8: Character highlighting consistency

*For any* character name that appears in the script, all instances of that character name (case-insensitive) in action lines and dialogue SHALL be highlighted with the same color. Different characters SHALL use different colors (up to 8 distinct colors).

**Validates: Requirements 6.1, 6.2, 6.4**

---

### Property 9: Synopsis persistence

*For any* synopsis that is edited and saved, the next time the project is loaded, the synopsis fields SHALL contain the exact values that were saved (overview, characters, setting, theme/tone).

**Validates: Requirements 7.4**

---

### Property 10: AI prompt export includes all sections

*For any* project that is exported as an AI prompt, the resulting text SHALL contain all of the following sections in order: project title, synopsis, character list, and formatted script.

**Validates: Requirements 8.1, 8.2**

---

### Property 11: Export format correctness

*For any* project exported to TXT format, the resulting file SHALL contain valid screenplay formatting with scene headings in all caps, character names centered and in all caps, and dialogue properly formatted. *For any* project exported to Markdown, scene headings SHALL be H2 headers, action lines SHALL be paragraphs, and dialogue SHALL be blockquotes.

**Validates: Requirements 9.2, 9.3, 9.4**

---

### Property 12: Scene breakdown accuracy

*For any* scene in the script, the Scene_Breakdown view SHALL display the correct scene heading, action line count, dialogue line count, and estimated duration. The sum of all scene durations SHALL equal the total script duration.

**Validates: Requirements 10.1, 10.2**

---

### Property 13: Word count accuracy

*For any* script, the Word_Count statistic SHALL count all words in action lines and dialogue, excluding scene headings and character names. The count SHALL update automatically as the script is edited.

**Validates: Requirements 11.1, 11.2**

---

### Property 14: Page count calculation

*For any* script, the Page_Count SHALL be calculated based on approximately 55 lines per page, with scene headings, action lines, and dialogue weighted appropriately. The Page_Count SHALL update automatically as the script is edited.

**Validates: Requirements 11.3, 11.5**

---

### Property 15: Reading time calculation

*For any* script, the Reading_Time SHALL be calculated as (Word_Count / reading_speed_wpm) * 60 seconds. The default reading speed SHALL be 150 wpm. The Reading_Time SHALL update automatically as the script is edited.

**Validates: Requirements 11.4, 15.1, 15.3**

---

### Property 16: Character arc display completeness

*For any* character with a defined arc, the Character_Arc_Summary SHALL display the character name, starting state, ending state, all turning points with scene references, and a visual arc diagram.

**Validates: Requirements 12.1, 12.2**

---

### Property 17: JSON import validation

*For any* JSON file that is imported, if the file contains a valid Story_Project structure, the project SHALL be added to localStorage with a new unique ID. If the file is invalid or corrupted, an error message SHALL be displayed and no project SHALL be added.

**Validates: Requirements 13.2, 13.3, 13.4**

---

### Property 18: Thumbnail generation

*For any* project that is saved for the first time, a Project_Thumbnail SHALL be generated showing the first scene of the script. The thumbnail SHALL be a 200x150 pixel image with proper screenplay formatting applied.

**Validates: Requirements 14.1, 14.2, 14.3**

---

### Property 19: Storage quota warning

*For any* project state where localStorage usage exceeds 80% of available quota, a warning notification SHALL be displayed. When usage exceeds 90%, the warning SHALL become persistent and display exact usage statistics.

**Validates: Requirements 17.1, 17.2**

---

### Property 20: Offline functionality

*For any* operation (save, load, delete, export, preview), the system SHALL function completely offline without requiring any external API calls or network requests.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.7**

---

## Error Handling

### localStorage Errors

- **Storage full**: Display error message "Cannot save project. Storage is full. Please delete old projects or export them to free up space."
- **Storage unavailable**: Display error message "localStorage is not available. Please check your browser settings."
- **Quota exceeded**: Catch `QuotaExceededError` and suggest exporting projects as JSON backups

### Data Validation Errors

- **Invalid project structure**: When loading, validate all required fields exist. If missing, display error and skip project.
- **Corrupted JSON**: When importing, wrap in try-catch. If JSON.parse fails, display "Invalid project file" error.
- **Missing references**: If a project references a scene/shot that no longer exists, display warning but continue loading.

### Export Errors

- **PDF generation failure**: If html2pdf fails, fall back to TXT export and display "PDF export failed. Exporting as TXT instead."
- **File download failure**: If download fails, offer "Copy to Clipboard" as alternative.
- **Clipboard write failure**: Use fallback `document.execCommand('copy')` if `navigator.clipboard.writeText` fails.

### Auto-save Errors

- **Auto-save failure**: Log error silently, do not interrupt user. Retry on next interval.
- **Notification display**: If toast notification fails, silently skip (non-critical).

---

## Testing Strategy

### Unit Tests (example-based)

- `LocalStorage_Manager.saveProject()` — save new project, verify ID is unique and lastModified is updated
- `LocalStorage_Manager.loadProjectById()` — load existing project, verify all fields are preserved
- `LocalStorage_Manager.deleteProject()` — delete project, verify it's removed from localStorage
- `LocalStorage_Manager.duplicateProject()` — duplicate project, verify copy has new ID and " (Copy)" suffix
- `LocalStorage_Manager.getStorageStats()` — verify storage stats are calculated correctly
- `Format_Converter.toAIPrompt()` — verify output contains all required sections in correct order
- `Format_Converter.toMarkdown()` — verify scene headings are H2, dialogue is blockquotes
- `Auto_Save.markDirty()` and timer — verify save is called after 30s inactivity
- `Story_Output_Panel` character highlighting — verify same character uses same color across script
- `Scene_Breakdown` calculations — verify scene count, duration, and statistics are accurate

### Property-Based Tests

Property-based testing is appropriate for this feature because the core correctness properties (persistence round-trips, calculation accuracy, data structure invariants) hold universally across all inputs and the logic is pure.

**Library**: [fast-check](https://github.com/dubzzz/fast-check)

**Minimum iterations**: 100 per property test

**Tag format**: `// Feature: story-output-management, Property N: <property_text>`

**Property tests to implement:**

| Property | Test description |
|----------|-----------------|
| P1 | Generate random Story_Project objects; save to localStorage; load by ID; assert structure is identical |
| P2 | Generate random sequences of save operations; assert each project receives a unique ID |
| P3 | Generate random projects; save each; assert lastModified is >= current time |
| P4 | Generate random project; duplicate it; assert new ID, " (Copy)" suffix, other fields identical |
| P5 | Generate random project; save, delete, load all; assert deleted project not in list |
| P6 | Generate random change sequences; verify auto-save called exactly once after 30s inactivity |
| P7 | Generate random script edits; verify Story_Output_Panel updates within 500ms |
| P8 | Generate random scripts with character names; verify all instances highlighted with same color |
| P9 | Generate random synopsis data; save, load; assert fields are identical |
| P10 | Generate random projects; export as AI prompt; verify all sections present in order |
| P11 | Generate random scripts; export to TXT and Markdown; verify formatting is correct |
| P12 | Generate random scenes; verify Scene_Breakdown counts and durations are accurate |
| P13 | Generate random scripts; verify Word_Count excludes headings and character names |
| P14 | Generate random scripts; verify Page_Count calculation is consistent |
| P15 | Generate random scripts; verify Reading_Time = (Word_Count / 150) * 60 |
| P16 | Generate random characters with arcs; verify Character_Arc_Summary displays all fields |
| P17 | Generate random valid/invalid JSON; verify import validation works correctly |
| P18 | Generate random projects; verify thumbnail is generated and is 200x150 pixels |
| P19 | Generate random storage states; verify warning displays at 80% and 90% thresholds |
| P20 | Generate random operations; verify all work offline without network calls |

### Integration Tests

- Save project → Open Project Library → Select project → verify Pro Script Builder populates correctly
- Edit script → Story_Output_Panel updates → verify changes reflected in preview
- Click "Convert to Prompt" → verify modal displays formatted prompt → click "Copy" → verify clipboard contains prompt
- Click "Export as PDF" → verify PDF file downloads with correct formatting
- Right-click project in library → verify context menu appears with correct options
- Delete project → verify confirmation dialog → confirm → verify project removed from library
- Import JSON file → verify project added to library with new ID
- Auto-save enabled → make changes → wait 30s → verify project saved silently
- Storage usage > 80% → verify warning notification displays
- Offline mode → verify all operations work without network

### Accessibility Tests

- Story_Output_Panel keyboard navigation (Tab, Shift+Tab, Enter)
- Character highlighting provides sufficient color contrast (WCAG AA)
- Scene Breakdown table has proper headers and row labels
- Export modal has proper focus management
- Project Library search is keyboard accessible
- All buttons have proper aria-labels

---

## Integration with Pro Script Builder

### Toolbar Integration

The Pro Script Builder toolbar gains three new buttons:

1. **"Preview"** — Opens Story_Output_Panel as side panel (desktop) or modal (mobile)
2. **"Save Project"** — Saves current project to localStorage
3. **"Open Project"** — Opens Project_Library modal

### State Synchronization

- When Pro Script Builder state changes (scenes/shots edited), Story_Output_Panel updates automatically via props
- When user loads a project from Project_Library, Pro Script Builder state is populated from localStorage
- Auto-save monitors Pro Script Builder state changes and saves periodically

### Existing Feature Compatibility

- Story Blueprint Engine data is preserved in project save/load
- Character Arc Mapper data is preserved in project save/load
- Director Brain diagnostics continue to work with loaded projects
- All existing Pro Script Builder features remain unchanged

---

## localStorage Schema

**Key**: `mokha_projects`

**Value**: JSON array of Story_Project objects

**Size estimate**: ~250 KB per project (varies with script length)

**Quota**: Typically 5-10 MB per domain in modern browsers

**Backup strategy**: Users can export projects as JSON files for external backup

---

## Export Format Specifications

### AI Prompt Format

```
# [Project Title]

## Synopsis

[Overview text]

## Characters

- [Character Name]: [Description]
- [Character Name]: [Description]

## Setting

[Setting information]

## Theme & Tone

[Theme and tone description]

## Script

[Formatted screenplay]

---

**Instructions for AI:**
This is a screenplay prompt for AI story generation. Please analyze the synopsis, characters, and script structure, then [specific request].
```

### Markdown Format

```markdown
# [Project Title]

## Synopsis

[Overview text]

## Characters

- [Character Name]: [Description]

## Setting

[Setting information]

## Theme & Tone

[Theme and tone description]

## Script

### INT. APARTMENT - DAY

John sits at his desk, staring at a blank screen.

> JOHN
> What should I write?

He stands and walks to the window.
```

### PDF Format

- Title page with project title, author, creation date
- Synopsis page
- Character list page
- Script pages with proper screenplay formatting
- Page numbers and headers
- Character Arc Summary as appendix (if defined)

---

## Performance Considerations

### Real-Time Updates

- **Debounce delay**: 500ms for Story_Output_Panel updates to prevent excessive re-renders
- **Memoization**: Use React.memo for FormattedScript component to avoid unnecessary re-renders
- **Virtual scrolling**: For large scripts (>100 scenes), use react-window for efficient rendering
- **Lazy loading**: Load character highlighting only when enabled

### localStorage Operations

- **Batch saves**: Auto-save saves entire project in single operation
- **Async operations**: Export to PDF runs in Web Worker to avoid blocking UI
- **Compression**: Consider gzip compression for large projects (optional optimization)

### Memory Management

- **Thumbnail generation**: Generate thumbnail as canvas, convert to base64 (not full image)
- **Session log**: Keep session log in memory only (not persisted)
- **Cleanup**: Clear old undo history when project is loaded

---

## Responsive Design

### Desktop (≥1024px)

- Story_Output_Panel renders as fixed right sidebar (300-400px wide)
- Project_Library renders as modal (600px wide)
- All features accessible without scrolling

### Tablet (768px - 1023px)

- Story_Output_Panel renders as modal overlay (80% width)
- Project_Library renders as full-screen modal
- Touch-friendly button sizes (44px minimum)

### Mobile (<768px)

- Story_Output_Panel renders as full-screen modal
- Project_Library renders as full-screen modal
- Simplified toolbar with icon-only buttons
- Swipe gestures for panel navigation

### Breakpoints

```js
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};
```

---

## UI/UX Design Patterns

### Story_Output_Panel Layout

```
┌─────────────────────────────────┐
│ Preview | Breakdown | Arcs      │  ← Tab navigation
├─────────────────────────────────┤
│ [Edit Synopsis] [Export] [Close]│  ← Action buttons
├─────────────────────────────────┤
│                                 │
│  INT. APARTMENT - DAY           │  ← Formatted script
│                                 │
│  John sits at his desk...       │
│                                 │
│  [Character highlighting]       │
│                                 │
│  Word Count: 2,500              │  ← Statistics
│  Page Count: 12                 │
│  Reading Time: 12 min 30 sec    │
│                                 │
└─────────────────────────────────┘
```

### Project_Library Layout

```
┌──────────────────────────────────────┐
│ [Search] [Filter ▼] [Sort ▼]        │  ← Search & filter
├──────────────────────────────────────┤
│ ☐ Project 1 | Last modified: 2h ago │  ← Project list
│ ☐ Project 2 | Last modified: 1d ago │
│ ☐ Project 3 | Last modified: 1w ago │
├──────────────────────────────────────┤
│ [Import] [Delete Selected] [Close]   │  ← Bulk actions
└──────────────────────────────────────┘
```

### Character Highlighting

- Hover over character name → all instances pulse with animation
- Click character name → tooltip shows: archetype, dialogue count, scene count, arc summary
- Different colors for up to 8 characters (cycling if more)

### Auto-Save Notification

- Subtle toast in bottom-right corner
- Text: "Auto-saved at 2:45 PM"
- Fades out after 2 seconds
- Non-intrusive, does not interrupt editing

---

## Summary

The Story Output & Management System provides a comprehensive project management layer for the Pro Script Builder while maintaining full offline functionality and seamless integration with existing features. The modular architecture enables independent testing and future extensions, while the property-based testing approach ensures correctness across all input variations.
