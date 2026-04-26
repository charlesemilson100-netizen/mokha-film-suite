# Phase 5 Implementation Plan

## Overview

Phase 5 implements the final advanced features for the Story Output & Management System:

1. **Character Arc Summary** (Requirement 12)
2. **Project Thumbnails** (Requirement 14)
3. **Storage Quota Management** (Requirement 17)

---

## Phase 5 Requirements Analysis

### Requirement 12: Character Arc Summary in Output

**User Story**: As a screenwriter, I want to see a summary of each character's arc in the story output, so that I can verify character transformation and emotional consistency.

**Key Features**:
- Display character arc summary for each character with defined arc
- Show: character name, starting emotional state, ending emotional state, key turning points, visual arc diagram
- Display emotional beats as line graph or timeline
- Click turning point to navigate to scene
- Include in PDF exports as appendix
- Show "No arc defined" with button to define arc
- Export as standalone PDF or image

**Acceptance Criteria**: 7 criteria

**Complexity**: Medium (requires visual graph rendering)

**Dependencies**: 
- Character Arc Mapper (existing)
- StoryOutputPanel (existing)
- ExportModal (existing)

---

### Requirement 14: Project Thumbnail Generation

**User Story**: As a screenwriter, I want each saved project to have a visual thumbnail, so that I can quickly identify projects in the Project Library.

**Key Features**:
- Generate thumbnail on first save (200x150 pixels)
- Show scene heading and first few lines
- Use same formatting as StoryOutputPanel
- Hover to enlarge and show title/date
- Store as base64-encoded image
- Allow manual thumbnail update
- Show placeholder if script empty

**Acceptance Criteria**: 7 criteria

**Complexity**: Medium (requires canvas rendering)

**Dependencies**:
- LocalStorageManager (existing)
- ProjectLibrary (existing)
- StoryOutputPanel (existing)

---

### Requirement 17: LocalStorage Quota Management

**User Story**: As a screenwriter, I want to be notified when localStorage is running low, so that I can take action to free up space before losing the ability to save projects.

**Key Features**:
- Warning at 80% usage
- Persistent warning at 90% usage
- Error when full
- "Manage Storage" button
- Display project sizes in KB
- Bulk deletion support
- Confirmation message on export+delete

**Acceptance Criteria**: 7 criteria

**Complexity**: Low (mostly UI and existing functions)

**Dependencies**:
- LocalStorageManager (existing)
- ProjectLibrary (existing)

---

## Implementation Strategy

### Phase 5A: Storage Quota Management (Easiest)
- Implement first (lowest complexity)
- Enhances existing ProjectLibrary
- Improves user experience immediately
- ~150 lines of code

### Phase 5B: Project Thumbnails (Medium)
- Implement second
- Requires canvas rendering
- Enhances ProjectLibrary visually
- ~250 lines of code

### Phase 5C: Character Arc Summary (Most Complex)
- Implement last
- Requires graph visualization
- Integrates with existing Character Arc Mapper
- ~300 lines of code

---

## Implementation Order

1. **Storage Quota Management** (Phase 5A)
   - Add storage calculation functions
   - Add warning notifications
   - Add bulk deletion UI
   - Enhance ProjectLibrary with storage info

2. **Project Thumbnails** (Phase 5B)
   - Add thumbnail generation function
   - Add canvas rendering
   - Add thumbnail display in ProjectLibrary
   - Add thumbnail update functionality

3. **Character Arc Summary** (Phase 5C)
   - Add arc summary component
   - Add graph visualization
   - Add arc summary button to toolbar
   - Add PDF export integration

---

## Code Estimates

### Phase 5A: Storage Management
- Storage calculation: 50 lines
- Warning notifications: 80 lines
- Bulk deletion UI: 40 lines
- **Total**: ~150 lines

### Phase 5B: Thumbnails
- Thumbnail generation: 100 lines
- Canvas rendering: 80 lines
- Thumbnail display: 50 lines
- Update functionality: 20 lines
- **Total**: ~250 lines

### Phase 5C: Character Arc Summary
- Arc summary component: 150 lines
- Graph visualization: 100 lines
- Integration: 50 lines
- **Total**: ~300 lines

**Phase 5 Total**: ~700 lines

---

## Testing Strategy

### Phase 5A: Storage Management
- [ ] Warning appears at 80% usage
- [ ] Persistent warning at 90% usage
- [ ] Error when full
- [ ] Manage Storage button works
- [ ] Project sizes displayed correctly
- [ ] Bulk deletion works
- [ ] Confirmation message shows

### Phase 5B: Thumbnails
- [ ] Thumbnail generated on save
- [ ] Thumbnail displays in library
- [ ] Hover enlarges thumbnail
- [ ] Title/date shown on hover
- [ ] Manual update works
- [ ] Placeholder shows for empty script
- [ ] Thumbnail persists after reload

### Phase 5C: Character Arc Summary
- [ ] Arc summary displays for each character
- [ ] Shows emotional states
- [ ] Shows turning points
- [ ] Graph renders correctly
- [ ] Click turning point navigates to scene
- [ ] Included in PDF export
- [ ] Can export as PDF/image
- [ ] "No arc defined" shows with button

---

## Integration Points

### With Existing Features
- LocalStorageManager (storage calculations)
- ProjectLibrary (display, bulk deletion)
- StoryOutputPanel (thumbnail generation, arc summary)
- ExportModal (PDF export)
- Character Arc Mapper (arc data)

### Data Flow
```
Save Project
  ↓
Generate Thumbnail (canvas)
  ↓
Store as base64
  ↓
Display in ProjectLibrary

Storage Check
  ↓
Calculate usage
  ↓
Show warning if > 80%
  ↓
Show persistent if > 90%

Character Arc Summary
  ↓
Get arc data from Character Arc Mapper
  ↓
Render graph
  ↓
Display in modal
  ↓
Export as PDF/image
```

---

## Success Criteria

### Phase 5A: Storage Management
- ✅ Warnings display at correct thresholds
- ✅ Storage info accurate
- ✅ Bulk deletion works
- ✅ No breaking changes

### Phase 5B: Thumbnails
- ✅ Thumbnails generate correctly
- ✅ Display in library
- ✅ Persist after reload
- ✅ Manual update works

### Phase 5C: Character Arc Summary
- ✅ Arc summary displays
- ✅ Graph renders
- ✅ Navigation works
- ✅ PDF export works

---

## Timeline

- **Phase 5A**: 1-2 hours (storage management)
- **Phase 5B**: 2-3 hours (thumbnails)
- **Phase 5C**: 3-4 hours (character arc summary)
- **Total**: 6-9 hours

---

## Next Steps

1. Start with Phase 5A (Storage Management)
2. Test thoroughly
3. Move to Phase 5B (Thumbnails)
4. Test thoroughly
5. Move to Phase 5C (Character Arc Summary)
6. Final testing and documentation

---

## Files to Modify

- `mokha-suite PRO Vqr.html` - Main implementation

## Documentation to Create

- `.kiro/PHASE5_IMPLEMENTATION_GUIDE.md`
- `.kiro/PHASE5_IMPLEMENTATION_COMPLETE.md`
- `.kiro/PHASE5_SUMMARY.md`

---

## Notes

- All features use existing libraries (no new dependencies)
- All features follow existing code patterns
- All features are responsive and support dark mode
- All features integrate seamlessly with existing system
- All features are fully offline (no external APIs)

