# Implementation Plan: Story Output & Management System

## Overview

This implementation plan breaks down the Story Output & Management System into discrete, sequenced coding tasks. The system adds project management, auto-save, real-time preview, and export capabilities to the existing Pro Script Builder. All code integrates into the existing React component structure within the `<script type="text/babel">` block of mokha-suite PRO Vqr.html.

The implementation follows a modular approach: LocalStorage_Manager handles persistence, Format_Converter handles exports, Story_Output_Panel provides the UI, and Auto_Save manages background saving. Each module is independent and testable.

## Tasks

- [x] 1. Set up project data structures and LocalStorage_Manager foundation
  - Create project data model interfaces and validation functions
  - Implement LocalStorage_Manager module with core methods: saveProject, loadAllProjects, loadProjectById
  - Add error handling for localStorage unavailability and quota exceeded
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

  - [ ]* 1.1 Write property test for project persistence round-trip
    - **Property 1: Project persistence round-trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.3**

  - [ ]* 1.2 Write property test for unique project IDs
    - **Property 2: Unique project IDs**
    - **Validates: Requirements 1.2**

  - [ ]* 1.3 Write property test for last modified timestamp updates
    - **Property 3: Last modified timestamp updates**
    - **Validates: Requirements 1.3**

- [x] 2. Implement project deletion and duplication
  - Implement LocalStorage_Manager.deleteProject() method
  - Implement LocalStorage_Manager.duplicateProject() method with " (Copy)" suffix
  - Add confirmation dialogs for destructive operations
  - _Requirements: 3.3, 3.4_

  - [ ]* 2.1 Write property test for deletion removes project completely
    - **Property 5: Deletion removes project completely**
    - **Validates: Requirements 3.3**

  - [ ]* 2.2 Write property test for duplicate creates independent copy
    - **Property 4: Duplicate creates independent copy**
    - **Validates: Requirements 3.4**

- [x] 3. Implement project import/export as JSON
  - Implement LocalStorage_Manager.importProjectFromJSON() with validation
  - Implement LocalStorage_Manager.exportProjectAsJSON() for file download
  - Add file picker UI for import operations
  - Handle invalid JSON with error messages
  - _Requirements: 13.2, 13.3, 13.4, 3.5_

  - [ ]* 3.1 Write property test for JSON import validation
    - **Property 17: JSON import validation**
    - **Validates: Requirements 13.2, 13.3, 13.4**

- [x] 4. Implement storage statistics and quota management
  - Implement LocalStorage_Manager.getStorageStats() method
  - Add storage usage calculation for each project
  - Implement quota warning system (80% and 90% thresholds)
  - Display storage usage in Project_Library UI
  - _Requirements: 3.6, 3.7, 17.1, 17.2_

  - [ ]* 4.1 Write property test for storage quota warning
    - **Property 19: Storage quota warning**
    - **Validates: Requirements 17.1, 17.2**

- [x] 5. Implement Auto_Save module
  - Create Auto_Save module with init, markDirty, triggerSave, enable, disable methods
  - Implement 30-second inactivity timer with debouncing
  - Add auto-save notification display ("Auto-saved at [time]")
  - Integrate with Pro Script Builder state changes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 5.1 Write property test for auto-save only saves when dirty
    - **Property 6: Auto-save only saves when dirty**
    - **Validates: Requirements 4.1, 4.7**

- [x] 6. Create Format_Converter module for export formats
  - Implement Format_Converter.toPlainText() for TXT export
  - Implement Format_Converter.toMarkdown() for Markdown export
  - Implement Format_Converter.toJSON() for project backup
  - Add proper screenplay formatting for each format
  - _Requirements: 9.2, 9.3, 9.4_

  - [ ]* 6.1 Write property test for export format correctness
    - **Property 11: Export format correctness**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 7. Implement AI prompt export with templates
  - Implement Format_Converter.toAIPrompt() with template support
  - Create default prompt templates (General, Dialogue, Scene Description, Storyboard)
  - Implement custom template storage and retrieval
  - Add prompt preview modal with copy/download options
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ]* 7.1 Write property test for AI prompt export includes all sections
    - **Property 10: AI prompt export includes all sections**
    - **Validates: Requirements 8.1, 8.2**

- [x] 8. Implement PDF export functionality
  - Integrate html2pdf library for PDF generation
  - Implement Format_Converter.toPDF() with title page, synopsis, script, and appendix
  - Add page breaks and page numbers
  - Implement fallback to TXT if PDF generation fails
  - _Requirements: 9.2, 9.7_

- [x] 9. Create Project_Library React component
  - Build Project_Library modal with project list display
  - Implement search functionality (title, author, synopsis)
  - Implement filter options (story type, duration, date range)
  - Implement sort options (last modified, title, creation date)
  - Add multi-select for bulk operations
  - _Requirements: 2.1, 2.2, 2.6, 2.7, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [x] 10. Implement context menu for project operations
  - Add right-click context menu to Project_Library items
  - Implement menu options: Open, Duplicate, Export as JSON, Delete
  - Add keyboard shortcuts for common operations
  - _Requirements: 3.1, 3.2_

- [x] 11. Implement project thumbnail generation
  - Create thumbnail generation function that renders first scene
  - Generate 200x150 pixel canvas-based thumbnails
  - Store thumbnails as base64 in project data
  - Add placeholder for empty scripts
  - Implement manual thumbnail update UI
  - _Requirements: 14.1, 14.2, 14.3, 14.6_

  - [ ]* 11.1 Write property test for thumbnail generation
    - **Property 18: Thumbnail generation**
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 12. Create Story_Output_Panel React component foundation
  - Build Story_Output_Panel component with tab navigation (Screenplay, Prose, Breakdown, Arcs)
  - Implement panel state management (viewMode, showSynopsis, highlightCharacters, etc.)
  - Add responsive layout (side panel on desktop, modal on mobile)
  - Integrate with Pro Script Builder state
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 16.1, 16.2, 16.3, 16.6, 16.7_

- [x] 13. Implement real-time screenplay formatting
  - Create FormattedScript sub-component with screenplay formatting logic
  - Implement scene heading formatting (all caps, bold)
  - Implement action line formatting (left-aligned, muted color)
  - Implement character name formatting (centered, all caps, distinct color)
  - Implement dialogue formatting (centered, regular text)
  - Add 500ms debounce for updates
  - _Requirements: 5.3, 5.4_

  - [ ]* 13.1 Write property test for story output reflects current state
    - **Property 7: Story output reflects current state**
    - **Validates: Requirements 5.2, 5.3**

- [x] 14. Implement character mention highlighting
  - Create character highlighting logic that identifies all character mentions
  - Implement color assignment (up to 8 distinct colors, cycling)
  - Add case-insensitive character name matching
  - Exclude character names in scene headings
  - Implement hover highlighting with pulsing animation
  - Add character highlighting toggle in panel settings
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 14.1 Write property test for character highlighting consistency
    - **Property 8: Character highlighting consistency**
    - **Validates: Requirements 6.1, 6.2, 6.4**

- [x] 15. Implement synopsis section and editing
  - Create SynopsisSection sub-component with editable fields
  - Implement fields: overview (500 char max), characters, setting, theme/tone
  - Add Markdown formatting support (bold, italic, bullet points)
  - Implement edit mode toggle
  - Persist synopsis changes to project data
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 15.1 Write property test for synopsis persistence
    - **Property 9: Synopsis persistence**
    - **Validates: Requirements 7.4**

- [x] 16. Implement word count, page count, and reading time statistics
  - Create statistics calculation functions
  - Implement word count (exclude headings and character names)
  - Implement page count (55 lines per page, weighted)
  - Implement reading time (150 wpm default, customizable)
  - Add real-time updates with 500ms debounce
  - Display progress bar relative to target duration
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [ ]* 16.1 Write property test for word count accuracy
    - **Property 13: Word count accuracy**
    - **Validates: Requirements 11.1, 11.2**

  - [ ]* 16.2 Write property test for page count calculation
    - **Property 14: Page count calculation**
    - **Validates: Requirements 11.3, 11.5**

  - [ ]* 16.3 Write property test for reading time calculation
    - **Property 15: Reading time calculation**
    - **Validates: Requirements 11.4, 15.1, 15.3**

- [x] 17. Implement scene breakdown view
  - Create SceneBreakdown sub-component
  - Display each scene with: number, heading, action count, dialogue count, duration
  - Implement visual timeline with duration bars
  - Add summary statistics (total scenes, runtime, average duration, longest/shortest)
  - Implement scene filtering (by character, location, time of day)
  - Add CSV export for breakdown data
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 17.1 Write property test for scene breakdown accuracy
    - **Property 12: Scene breakdown accuracy**
    - **Validates: Requirements 10.1, 10.2**

- [x] 18. Implement character arc summary view
  - Create CharacterArcSummary sub-component
  - Display character name, starting state, ending state, turning points
  - Implement visual arc diagram (line graph or timeline)
  - Add scene navigation on turning point click
  - Include arc summary in PDF exports as appendix
  - Add "Define Arc" button for characters without arcs
  - Implement standalone PDF/image export for arcs
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 18.1 Write property test for character arc display completeness
    - **Property 16: Character arc display completeness**
    - **Validates: Requirements 12.1, 12.2**

- [x] 19. Integrate toolbar buttons into Pro Script Builder
  - Add "Preview" button to open Story_Output_Panel
  - Add "Save Project" button to save current project
  - Add "Open Project" button to open Project_Library
  - Add "Export" button to access export options
  - Implement button state management (disabled when appropriate)
  - _Requirements: 16.1, 16.2, 16.5_

- [x] 20. Implement responsive design for mobile and tablet
  - Implement desktop layout (side panel, 300-400px wide)
  - Implement tablet layout (modal, 80% width)
  - Implement mobile layout (full-screen modal)
  - Add touch-friendly button sizes (44px minimum)
  - Implement swipe gestures for panel navigation
  - Test breakpoints: mobile (<768px), tablet (768-1023px), desktop (≥1024px)
  - _Requirements: 16.1, 16.2, 16.6_

- [x] 21. Checkpoint - Verify core functionality
  - Ensure all project save/load operations work correctly
  - Verify Story_Output_Panel displays formatted screenplay
  - Verify character highlighting works across all scenes
  - Verify statistics update in real-time
  - Verify auto-save triggers after 30 seconds of inactivity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Implement offline functionality verification
  - Verify all operations work without network access
  - Verify no external API calls are made
  - Verify localStorage operations work offline
  - Verify export operations work offline
  - Add offline status indicator
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [ ]* 22.1 Write property test for offline functionality
    - **Property 20: Offline functionality**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.7**

- [x] 23. Implement unsaved changes detection
  - Add unsaved changes indicator in Pro Script Builder
  - Implement confirmation dialog when opening new project with unsaved changes
  - Implement warning icon when auto-save is disabled
  - _Requirements: 2.5, 4.6_

- [x] 24. Integration testing - Project lifecycle
  - Test complete workflow: create → edit → save → close → load → verify
  - Test auto-save during editing
  - Test manual save overwriting auto-save
  - Test project duplication and independence
  - Test project deletion and confirmation
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 3.3, 3.4, 4.1_

- [x] 25. Integration testing - Export workflows
  - Test export to TXT with proper formatting
  - Test export to Markdown with proper formatting
  - Test export to JSON and re-import
  - Test export to PDF with title page and appendix
  - Test AI prompt export with different templates
  - Test custom template creation and persistence
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 26. Integration testing - Project Library
  - Test search by title, author, synopsis
  - Test filtering by story type, duration, date range
  - Test sorting by last modified, title, creation date
  - Test multi-select and bulk delete
  - Test context menu operations
  - Test storage usage display and warnings
  - _Requirements: 2.1, 2.2, 2.6, 2.7, 3.1, 3.2, 3.6, 3.7, 17.1, 17.2, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [x] 27. Integration testing - Story_Output_Panel
  - Test panel opens/closes without affecting Pro Script Builder
  - Test real-time updates as script is edited
  - Test tab navigation (Screenplay, Prose, Breakdown, Arcs)
  - Test character highlighting toggle
  - Test synopsis editing and persistence
  - Test statistics updates
  - Test responsive layout on different screen sizes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 16.1, 16.2, 16.3, 16.6, 16.7_

- [x] 28. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify passing
  - Run all property-based tests with minimum 100 iterations
  - Run all integration tests
  - Verify no console errors or warnings
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations per property
- All code integrates into existing React component structure in mokha-suite PRO Vqr.html
- localStorage operations are synchronous and non-blocking
- All export operations work completely offline
- Responsive design uses CSS media queries and React hooks for viewport detection
- Character highlighting uses a fixed palette of 8 colors, cycling for additional characters
