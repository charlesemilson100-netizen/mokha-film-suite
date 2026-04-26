# Pro Script Builder Context Menus - Implementation Tasks

## Overview
Add comprehensive right-click context menus to all Pro Script Builder elements (dialogue lines, character names, scene headings, action lines) for improved workflow efficiency.

## Tasks

- [x] 1. Add Dialogue Line Context Menu
  - [x] 1.1 Add onContextMenu handler to dialogue line container
  - [x] 1.2 Implement dialogue menu rendering in renderMenuForType
  - [x] 1.3 Implement dialogue action functions (copy, duplicate, move, delete, etc.)
  - [x] 1.4 Add disabled item logic for dialogue menu
  - [x] 1.5 Test dialogue menu functionality

- [x] 2. Add Character Name Context Menu
  - [x] 2.1 Add onContextMenu handler to character name field
  - [x] 2.2 Implement character menu rendering
  - [x] 2.3 Implement character action functions (copy, add to library, rename, etc.)
  - [x] 2.4 Add disabled item logic for character menu
  - [x] 2.5 Test character menu functionality

- [ ] 3. Add Scene Heading Context Menu
  - [x] 3.1 Add onContextMenu handler to scene heading
  - [x] 3.2 Implement scene menu rendering
  - [x] 3.3 Implement scene action functions (duplicate, move, delete, etc.)
  - [x] 3.4 Add disabled item logic for scene menu
  - [x] 3.5 Test scene menu functionality

- [ ] 4. Add Action Line Context Menu
  - [x] 4.1 Add onContextMenu handler to action line
  - [x] 4.2 Implement action menu rendering
  - [x] 4.3 Implement action action functions (copy, enhance, clear, etc.)
  - [x] 4.4 Add disabled item logic for action menu
  - [x] 4.5 Test action menu functionality

- [x] 5. Integrate Undo/Redo Support
  - [x] 5.1 Ensure all context menu actions support undo
  - [x] 5.2 Ensure all context menu actions support redo
  - [x] 5.3 Test undo/redo with context menu actions

- [x] 6. Add Keyboard Navigation
  - [x] 6.1 Implement arrow key navigation
  - [x] 6.2 Implement Enter/Space activation
  - [x] 6.3 Implement Escape to close
  - [x] 6.4 Test keyboard navigation

- [x] 7. Add Accessibility Features
  - [x] 7.1 Add ARIA roles and attributes
  - [x] 7.2 Add focus management
  - [x] 7.3 Test with screen reader

- [x] 8. Comprehensive Testing
  - [x] 8.1 Test all dialogue menu items
  - [x] 8.2 Test all character menu items
  - [x] 8.3 Test all scene menu items
  - [x] 8.4 Test all action menu items
  - [x] 8.5 Test disabled items
  - [x] 8.6 Test keyboard navigation
  - [x] 8.7 Test undo/redo
  - [x] 8.8 Test accessibility

## Implementation Notes

- Reuse existing context menu infrastructure from context-menus-expansion spec
- Use existing MenuItem, Divider, MenuHeader, SubMenuWrapper components
- Follow same patterns as existing context menus
- Ensure consistency with existing UI
- All changes in single file: mokha-suite PRO Vqr.html
