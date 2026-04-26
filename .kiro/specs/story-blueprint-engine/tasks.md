# Implementation Plan: Story Blueprint Engine & Pro Script Builder

## Overview

This implementation plan transforms MOKHA FILM Suite's Story Engine into a professional scriptwriting platform. The system combines a 7-step configuration wizard that generates a Story Blueprint with a Final Draft-style Pro Script Builder supporting three writing modes (user-written, template-generated, AI-generated). All code lives in the single-file HTML architecture with no new npm dependencies.

The implementation is organized into 6 phases:
1. **Core Components** — ConfigurationWizard, Story Blueprint data model, basic ProScriptBuilder
2. **Writing Modes** — User-written, template-generated, AI-generated modes with mode switching
3. **Export & Conversion** — PDF/TXT export, prompt conversion to Director Brain
4. **Optional Features** — CharacterArcMapper with visual arc diagrams
5. **Integration** — Director Brain, Shot Critique, Agentic Mode integration
6. **Testing & Polish** — Unit tests, integration tests, property-based tests

---

## Phase 1: Core Components

### 1.1 Create Story Blueprint Data Model

- [x] 1.1 Implement Story Blueprint JSON schema and utilities
  - Create `StoryBlueprint` interface with all required fields (id, storyType, duration, style, narrativeStructure, dynamicParameters, storyIntent, characters, relationships, timestamps)
  - Implement `createBlueprint()` factory function to generate new blueprints with UUID
  - Implement `validateBlueprint()` function to verify all required fields are present and non-empty
  - Implement `updateBlueprint()` function for immutable updates
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 1.2 Write property test for Blueprint Completeness
  - **Property 1: Story Blueprint Completeness**
  - **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.5, 6.3, 7.4, 8.1**
  - Generate random wizard inputs, verify all required fields in output blueprint, verify no null/undefined values

- [x] 1.3 Implement Configuration Wizard component (Steps 1-4)
  - Create `ConfigurationWizard` React component with state management for current step and blueprint data
  - Implement Step 1: Story Type selection (Social Media, Short Film, Cinematic Film, Documentary, Commercial, Experimental)
  - Implement Step 2: Duration selection (2 min, 5 min, 10 min, 15 min, 30 min, 60 min)
  - Implement Step 3: Style selection (cinematic, documentary, comedy, drama, 3D anime, 2D animated, etc.)
  - Implement Step 4: Narrative Structure selection (protagonist journey, antagonist conflict, ensemble, real event storytelling, etc.)
  - Implement navigation (Next, Back buttons with validation)
  - Implement data persistence across step navigation
  - _Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.6, 4.1-4.6_

- [ ]* 1.4 Write unit tests for Configuration Wizard Steps 1-4
  - Test step validation (required fields, navigation)
  - Test data persistence across navigation
  - Test button enable/disable logic
  - _Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.6, 4.1-4.6_

- [x] 1.5 Implement Dynamic Parameters logic (Step 5)
  - Create `getDynamicParameters()` function that returns context-dependent parameters based on storyType, duration, style, narrativeStructure
  - Implement parameter sets for: Documentary (subject matter, interview format, archival footage, narrator presence), Commercial (product category, target audience, call-to-action, brand tone), Cinematic Film (genre, protagonist archetype, antagonist type, act structure)
  - Implement Step 5 UI with dynamic parameter fields
  - Implement validation for all required dynamic parameters
  - _Requirements: 5.1-5.7_

- [ ]* 1.6 Write property test for Dynamic Parameters Correctness
  - **Property 3: Dynamic Parameters Correctness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Generate random combinations of storyType, duration, style, narrativeStructure, verify correct parameter set is returned, verify all parameters stored in blueprint

- [x] 1.7 Implement Story Intent and Character Creation (Steps 6-7)
  - Implement Step 6: Story Intent text input with example statements
  - Implement Step 7: Optional character creation interface with fields (name, archetype, age, role, description)
  - Implement character relationship definition interface
  - Implement "Skip Character Creation" option
  - Implement blueprint generation and transition to ProScriptBuilder
  - _Requirements: 6.1-6.6, 7.1-7.8_

- [ ]* 1.8 Write unit tests for Configuration Wizard Steps 5-7
  - Test dynamic parameter logic for each story type
  - Test character creation and relationship definition
  - Test blueprint generation with all fields populated
  - _Requirements: 5.1-5.7, 6.1-6.6, 7.1-7.8_

- [x] 1.9 Implement Pro Script Builder component (basic structure)
  - Create `ProScriptBuilder` React component with state management (script, writingMode, selectedSceneId, selectedShotId, pageCount, estimatedRuntime)
  - Implement `generateSceneStructure()` function that creates initial scene structure based on blueprint's narrativeStructure and duration
  - Implement scene structure for: protagonist journey (Inciting Incident, Rising Action, Midpoint, Climax, Resolution), antagonist conflict (Antagonist Introduction, Conflict Escalation, Confrontation, Resolution), ensemble (parallel storylines with intersection points)
  - Implement scene count logic: 2 min (1-2 scenes), 5 min (3-5 scenes), 10 min (5-8 scenes), 15 min (6-10 scenes), 30 min (8-12 scenes), 60 min (12-20 scenes)
  - Implement basic UI layout with scene list and editor area
  - _Requirements: 9.1, 10.1-10.7_

- [ ]* 1.10 Write property test for Script Structure Adaptation
  - **Property 6: Script Structure Adaptation**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  - Generate random blueprints with different narrativeStructures and durations, verify correct number of scenes, verify appropriate scene labels

- [x] 1.11 Implement ScriptEditor component (field-level editing)
  - Create `ScriptEditor` React component for editing individual script fields
  - Implement editable fields: Scene Heading, Action Line, Character Name, Parenthetical, Dialogue
  - Implement auto-formatting: Scene Heading (uppercase), Character Name (uppercase), Parenthetical (lowercase), Dialogue (preserve case)
  - Implement field change handler with formatting applied
  - Implement keyboard navigation (Tab/Enter moves to next field, Shift+Tab moves to previous field)
  - Implement keyboard shortcuts (Ctrl+H for Scene Heading, Ctrl+A for Action Line, Ctrl+D for Dialogue)
  - _Requirements: 9.2-9.8_

- [ ]* 1.12 Write property test for Scene Heading Auto-Formatting
  - **Property 4: Scene Heading Auto-Formatting**
  - **Validates: Requirement 9.3**
  - Generate random text inputs, verify uppercase conversion, verify screenplay format compliance

- [ ]* 1.13 Write property test for Dialogue Block Formatting
  - **Property 5: Dialogue Block Formatting**
  - **Validates: Requirement 9.5**
  - Generate random dialogue blocks, verify character name uppercase, verify parenthetical lowercase and centered, verify dialogue left-aligned

- [x] 1.14 Implement page count and runtime calculation
  - Implement `calculatePageCount()` function (1 page ≈ 55 lines of screenplay content)
  - Implement `calculateRuntime()` function (1 page ≈ 1 minute)
  - Implement live update on script content change (debounced 200ms)
  - Display page count and runtime in ProScriptBuilder UI
  - _Requirements: 9.7_

- [ ]* 1.15 Write property test for Page Count Accuracy
  - **Property 14: Page Count Accuracy**
  - **Validates: Requirement 9.7**
  - Generate random scripts with various content, verify calculated page count is within ±1 page of actual

- [ ] 1.16 Checkpoint - Ensure all Phase 1 tests pass
  - Ensure all unit tests and property tests pass
  - Verify ConfigurationWizard generates valid blueprints
  - Verify ProScriptBuilder displays correct scene structure
  - Verify ScriptEditor formatting works correctly
  - Ask the user if questions arise

---

## Phase 2: Writing Modes

### 2.1 Implement User-Written Mode (Primary)

- [x] 2.1 Implement user-written mode as default
  - Set `writingMode: 'user-written'` as default in ProScriptBuilder
  - Implement blank script structure with empty editable fields
  - Ensure no auto-generation of content
  - Implement real-time formatting assistance
  - Allow add/delete/reorder scenes
  - _Requirements: 11.1-11.7_

- [ ]* 2.2 Write unit tests for user-written mode
  - Test blank script initialization
  - Test field editing and formatting
  - Test scene management (add, delete, reorder)
  - _Requirements: 11.1-11.7_

### 2.2 Implement Template-Generated Mode (Secondary)

- [x] 2.3 Create script template definitions
  - Define template structure for each combination of storyType, narrativeStructure, duration
  - Create placeholder entries: [SCENE HEADING], [ACTION], [CHARACTER NAME], [DIALOGUE]
  - Store templates as JSON data structure (no external files)
  - _Requirements: 12.1-12.7_

- [x] 2.4 Implement template generation UI
  - Implement "Generate from Template" button in ProScriptBuilder
  - Implement template selection dialog showing matching templates
  - Implement `generateFromTemplate()` function that populates script with placeholder entries
  - Display message: "This is a template scaffold. Customize it with your own content."
  - Allow scene management (add, delete, reorder) after template generation
  - _Requirements: 12.1-12.7_

- [ ]* 2.5 Write unit tests for template-generated mode
  - Test template selection and loading
  - Test placeholder insertion
  - Test placeholder replacement with user content
  - _Requirements: 12.1-12.7_

### 2.3 Implement AI-Generated Mode (Tertiary)

- [x] 2.6 Implement AI generation with LLM
  - Implement "Generate with AI" button in ProScriptBuilder
  - Implement confirmation dialog: "This will generate a full script draft using AI. You can edit it afterward."
  - Implement `generateWithAI()` function that sends blueprint + storyIntent to LLM
  - Implement LLM response parsing into Scene Heading, Action Line, Dialogue Block, Parenthetical fields
  - Implement error handling for LLM timeout/failure with retry option
  - Display message: "AI-generated draft loaded. Edit and refine as needed."
  - _Requirements: 13.1-13.8_

- [ ]* 2.7 Write unit tests for AI-generated mode
  - Test LLM request formatting
  - Test response parsing into script structure
  - Test error handling and retry logic
  - _Requirements: 13.1-13.8_

### 2.4 Implement Mode Switching

- [x] 2.8 Implement mode switching with content preservation
  - Implement `switchWritingMode()` function that preserves all user-entered content
  - Implement mode selector UI (radio buttons or tabs)
  - Implement state management to preserve script content across mode switches
  - Test switching between all mode combinations (user-written ↔ template-generated ↔ ai-generated)
  - _Requirements: 11.6, 12.5, 13.5_

- [ ]* 2.9 Write property test for Mode Switching Preservation
  - **Property 7: Mode Switching Preservation**
  - **Validates: Requirements 11.6, 12.5, 13.5**
  - Generate random script content, switch between modes multiple times, verify content preserved after each switch

- [x] 2.10 Checkpoint - Ensure all Phase 2 tests pass
  - Ensure all writing mode tests pass
  - Verify mode switching preserves content
  - Verify template generation works correctly
  - Verify AI generation parses LLM response correctly
  - Ask the user if questions arise

---

## Phase 3: Export & Conversion

### 3.1 Implement PDF Export

- [x] 3.1 Implement PDF export engine
  - Create `ExportEngine.exportPDF()` function
  - Implement title page generation (project name, author, date)
  - Implement screenplay formatting: Scene Heading (all caps, left margin 0.5"), Action (left margin 0.5"), Character Name (all caps, centered 3.7"), Parenthetical (centered 3.2", lowercase), Dialogue (left margin 2.5", right margin 2.5")
  - Implement page breaks after ~55 lines of content
  - Implement page numbers and headers
  - Implement table of contents for scripts > 10 pages
  - Use existing PDF library (no new dependencies)
  - _Requirements: 14.1-14.8_

- [ ]* 3.2 Write unit tests for PDF export
  - Test title page generation
  - Test screenplay formatting rules
  - Test page break logic
  - Test file naming and download
  - _Requirements: 14.1-14.8_

### 3.2 Implement TXT Export

- [x] 3.3 Implement TXT export engine
  - Create `ExportEngine.exportTXT()` function
  - Implement text-based screenplay formatting (all-caps Scene Heading, left-aligned Action, centered Dialogue)
  - Implement page breaks using text-based conventions (e.g., "---PAGE BREAK---")
  - Implement proper line spacing and indentation
  - _Requirements: 14.1-14.8_

- [ ]* 3.4 Write unit tests for TXT export
  - Test text-based formatting
  - Test page break insertion
  - Test file naming and download
  - _Requirements: 14.1-14.8_

### 3.3 Implement Export UI

- [x] 3.5 Implement export UI in ProScriptBuilder
  - Implement "Export" button in ProScriptBuilder
  - Implement export options dialog (PDF, TXT)
  - Implement export range selection (entire script or selected scenes)
  - Implement file download with project name
  - _Requirements: 14.1-14.8_

- [ ]* 3.6 Write property test for Export Format Fidelity
  - **Property 8: Export Format Fidelity**
  - **Validates: Requirement 14.2, 14.3, 14.5, 14.6**
  - Generate random scripts with various content, export to PDF and TXT, verify formatting matches on-screen display

### 3.4 Implement Prompt Conversion

- [x] 3.7 Implement script parsing for prompt conversion
  - Create `ScriptParser.parse()` function to parse screenplay text into structured format
  - Implement `detectElementType()` function to identify Scene Heading, Action, Character Name, Parenthetical, Dialogue
  - Implement `validate()` function to check screenplay structure
  - _Requirements: 15.1-15.8_

- [x] 3.8 Implement prompt generation from script
  - Create `PromptConverter.parseScript()` function to extract scenes and shots
  - Create `PromptConverter.generatePrompts()` function to generate shot-by-shot prompts
  - Implement prompt structure: sceneNumber, shotType (inferred from action), location, characters, action, dialogue, style, intent
  - Implement ambiguity detection (missing location/time, vague action, missing character name, missing establishing shot)
  - _Requirements: 15.1-15.8_

- [ ]* 3.9 Write unit tests for prompt conversion
  - Test script parsing
  - Test prompt generation with all required fields
  - Test ambiguity detection
  - _Requirements: 15.1-15.8_

### 3.5 Implement Prompt Conversion UI

- [x] 3.10 Implement prompt conversion UI in ProScriptBuilder
  - Implement "Convert to Prompts" button in ProScriptBuilder
  - Implement confirmation dialog: "This will convert your script into shot-by-shot prompts for the Director Brain."
  - Implement ambiguity flagging with user clarification dialog
  - Implement Director Brain panel opening with prompts pre-loaded
  - _Requirements: 15.1-15.8_

- [ ]* 3.11 Write property test for Prompt Conversion Completeness
  - **Property 9: Prompt Conversion Completeness**
  - **Validates: Requirement 15.4**
  - Generate random scripts, convert to prompts, verify all required fields present in each prompt

- [x] 3.12 Checkpoint - Ensure all Phase 3 tests pass
  - Ensure all export and conversion tests pass
  - Verify PDF export formatting is correct
  - Verify TXT export formatting is correct
  - Verify prompt conversion generates complete prompts
  - Ask the user if questions arise

---

## Phase 4: Optional Features

### 4.1 Implement Character Arc Mapper

- [x] 4.1 Implement Character Arc data model
  - Create `CharacterArcData` interface with fields: characterId, startingEmotionalState, endingEmotionalState, keyTurningPoints, emotionalBeats, arcType
  - Implement `createCharacterArc()` factory function
  - Implement `validateArcConsistency()` function to check for logical progression
  - _Requirements: 16.1-16.8_

- [ ]* 4.2 Write property test for Character Arc Consistency
  - **Property 10: Character Arc Consistency**
  - **Validates: Requirement 16.2, 16.3**
  - Generate random character arcs, verify emotional progression is logical, verify no contradictory transitions

- [x] 4.3 Implement Character Arc Mapper component
  - Create `CharacterArcMapper` React component
  - Implement character selection UI
  - Implement arc definition interface (starting state, ending state, key turning points)
  - Implement emotional beat assignment for each scene
  - Implement arc diagram rendering (visual representation of emotional journey)
  - _Requirements: 16.1-16.8_

- [ ]* 4.4 Write unit tests for Character Arc Mapper
  - Test arc creation and editing
  - Test emotional beat assignment
  - Test arc diagram rendering
  - Test consistency validation
  - _Requirements: 16.1-16.8_

- [x] 4.5 Integrate Character Arc Mapper into ProScriptBuilder
  - Implement "Character Arcs" button in ProScriptBuilder
  - Implement lazy loading of CharacterArcMapper component
  - Implement arc data persistence in Story Blueprint
  - Implement arc data access for Director Brain
  - _Requirements: 16.1-16.8_

- [x] 4.6 Checkpoint - Ensure all Phase 4 tests pass
  - Ensure all Character Arc Mapper tests pass
  - Verify arc consistency validation works
  - Verify arc diagram renders correctly
  - Ask the user if questions arise

---

## Phase 5: Integration

### 5.1 Integrate with Director Brain

- [x] 5.1 Implement Director Brain integration
  - Implement "Director Brain" button in ProScriptBuilder
  - Implement script pre-loading into Director Brain panel
  - Pass script content, Story Blueprint, and Character Arc data to Director Brain
  - Implement action card rendering for proposed changes (ADD_SCENE, ADD_SHOT, REWRITE_SHOT, DELETE_SHOT, REORDER_SHOTS, SET_FIELD, APPLY_STYLE)
  - Implement action confirmation and script update
  - _Requirements: 18.1-18.8_

- [ ]* 5.2 Write integration tests for Director Brain
  - Test script pre-loading
  - Test action card rendering
  - Test action confirmation and script update
  - Test undo/redo with Director Brain actions
  - _Requirements: 18.1-18.8_

### 5.2 Integrate with Shot Critique

- [x] 5.3 Implement Shot Critique integration
  - Implement shot selection in ProScriptBuilder
  - Implement "Critique Shot" button for selected shot
  - Extract shot data (scene heading, action, characters, dialogue) and pass to Shot Critique
  - Implement shot refinement and update back to script
  - _Requirements: 19.1-19.5_

- [ ]* 5.4 Write integration tests for Shot Critique
  - Test shot extraction and passing to Shot Critique
  - Test shot refinement and update back to script
  - _Requirements: 19.1-19.5_

### 5.3 Integrate with Agentic Mode

- [x] 5.5 Implement Agentic Mode integration
  - Ensure Director Brain action cards work with Agentic Mode
  - Implement action proposal rendering
  - Implement action confirmation and execution
  - Implement session log tracking for undo/redo
  - _Requirements: 18.4, 18.5_

- [ ]* 5.6 Write integration tests for Agentic Mode
  - Test action proposal rendering
  - Test action confirmation and execution
  - Test session log tracking
  - _Requirements: 18.4, 18.5_

### 5.4 Implement Pro Mode Entry Point

- [x] 5.7 Implement Pro Mode entry point alongside Story Engine
  - Modify main interface to display two entry points: "Story Engine" and "Pro Mode"
  - Implement Pro Mode button that opens ConfigurationWizard
  - Ensure Story Engine remains unchanged and accessible
  - Implement mode switching with state preservation
  - _Requirements: 17.1-17.8_

- [ ]* 5.8 Write integration tests for Pro Mode entry point
  - Test Pro Mode button opens ConfigurationWizard
  - Test Story Engine remains accessible
  - Test mode switching preserves work
  - _Requirements: 17.1-17.8_

- [x] 5.9 Checkpoint - Ensure all Phase 5 tests pass
  - Ensure all integration tests pass
  - Verify Director Brain integration works
  - Verify Shot Critique integration works
  - Verify Agentic Mode integration works
  - Verify Pro Mode entry point works
  - Ask the user if questions arise

---

## Phase 6: Testing & Polish

### 6.1 Property-Based Tests

- [x] 6.1 Write property test for Wizard Selection Persistence
  - **Property 2: Wizard Selection Persistence**
  - **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.7, 6.5**
  - Generate random wizard inputs, navigate backward and forward, verify all values restored

- [x] 6.2 Write property test for Blueprint-UI Configuration Alignment
  - **Property 12: Blueprint-UI Configuration Alignment**
  - **Validates: Requirements 8.6, 9.1**
  - Load random blueprints into ProScriptBuilder, verify UI configuration matches blueprint

- [x] 6.3 Write property test for Keyboard Navigation Correctness
  - **Property 13: Keyboard Navigation Correctness**
  - **Validates: Requirement 9.6**
  - Generate random Tab/Enter key sequences, verify focus moves to correct fields in order

- [x] 6.4 Write property test for Character Reference Validity
  - **Property 15: Character Reference Validity**
  - **Validates: Requirement 9.2**
  - Generate random scripts with dialogue, verify all character names correspond to defined characters

- [x] 6.5 Write property test for Blueprint Schema Extensibility
  - **Property 11: Blueprint Schema Extensibility**
  - **Validates: Requirement 8.5**
  - Add new Story Type to system, verify schema doesn't require modification, verify only logic and templates updated

### 6.2 Integration Tests

- [x] 6.6 Write comprehensive integration tests
  - Test full workflow: ConfigurationWizard → ProScriptBuilder → Export
  - Test full workflow: ConfigurationWizard → ProScriptBuilder → Director Brain → Script Update
  - Test full workflow: ProScriptBuilder → Prompt Conversion → Director Brain
  - Test mode switching with all features enabled
  - _Requirements: 1.1-19.5_

### 6.3 Performance & Polish

- [x] 6.7 Implement lazy loading for optional features
  - Lazy load CharacterArcMapper component
  - Lazy load Director Brain panel
  - Lazy load Shot Critique panel
  - Measure performance impact
  - _Requirements: All_

- [x] 6.8 Implement debouncing for performance
  - Debounce auto-formatting (100ms)
  - Debounce page count calculation (200ms)
  - Debounce runtime estimation (200ms)
  - _Requirements: 9.3, 9.5, 9.7_

- [x] 6.9 Implement error handling and user feedback
  - Add error boundaries for component failures
  - Implement user-friendly error messages
  - Implement retry logic for LLM failures
  - Implement validation error messages
  - _Requirements: All_

- [x] 6.10 Implement undo/redo functionality
  - Implement `saveToHistory()` function for script changes
  - Implement Ctrl+Z (undo) and Ctrl+Y (redo) keyboard shortcuts
  - Implement undo/redo stack management
  - _Requirements: 9.8_

- [x] 6.11 Implement state persistence
  - Persist Story Blueprint to project state
  - Persist Script Document to project state
  - Persist Character Arc data to project state
  - Implement session recovery on page reload
  - _Requirements: 8.7, 17.6_

- [x] 6.12 Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation for all features
  - Implement screen reader support for script content
  - Test with accessibility tools
  - _Requirements: All_

- [x] 6.13 Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ensure all property-based tests pass
  - Verify no regressions in existing features (Director Brain, Shot Critique, Agentic Mode)
  - Verify performance is acceptable
  - Ask the user if questions arise

---

## Notes

- All code lives in `mokha-suite PRO Vqr.html` within `<script type="text/babel">` tags
- No new npm dependencies — use existing libraries only
- Follow existing state management patterns (useState, useContext)
- Follow existing component patterns (React functional components)
- Pure JS modules for business logic (PromptConverter, ExportEngine, ScriptParser, etc.)
- React components for UI (ConfigurationWizard, ProScriptBuilder, ScriptEditor, etc.)
- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Checkpoints ensure incremental validation and allow user feedback
