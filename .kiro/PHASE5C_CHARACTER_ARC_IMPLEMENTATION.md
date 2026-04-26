# Phase 5C: Character Arc Summary - Implementation Guide

## Overview

Phase 5C implements the Character Arc Summary feature, allowing screenwriters to visualize and verify character transformation throughout their story.

---

## Requirement 12 Analysis

**User Story**: As a screenwriter, I want to see a summary of each character's arc in the story output, so that I can verify character transformation and emotional consistency.

**Key Requirements**:
1. Display character arc summary for each character with defined arc
2. Show: character name, starting emotional state, ending emotional state, key turning points, visual arc diagram
3. Display emotional beats as line graph or timeline
4. Click turning point to navigate to scene
5. Include in PDF exports as appendix
6. Show "No arc defined" with button to define arc
7. Export as standalone PDF or image

---

## Implementation Strategy

### Phase 5C-1: Character Arc Summary Component
- Create CharacterArcSummaryPanel component
- Display character information
- Show emotional states
- List turning points
- Visual timeline

### Phase 5C-2: Arc Visualization
- Create simple line graph using SVG
- Plot emotional beats across scenes
- Show turning points as markers
- Color-coded visualization

### Phase 5C-3: Integration
- Add "Character Arcs" button to toolbar
- Integrate with existing Character Arc Mapper
- Add to Story Output Panel
- Add to PDF export

### Phase 5C-4: Navigation & Export
- Click turning point to navigate to scene
- Export as PDF
- Export as image (PNG)

---

## Data Structure

### Character Arc Data
```javascript
{
  characterId: "char-1",
  characterName: "John",
  startingState: "Cynical",
  endingState: "Hopeful",
  turningPoints: [
    {
      sceneNumber: 2,
      sceneLabel: "Inciting Incident",
      emotionalState: "Conflicted",
      description: "Meets the mentor"
    },
    {
      sceneNumber: 4,
      sceneLabel: "Climax",
      emotionalState: "Determined",
      description: "Makes the final choice"
    }
  ],
  emotionalBeats: [
    { scene: 1, value: 2 },  // 1-10 scale
    { scene: 2, value: 4 },
    { scene: 3, value: 6 },
    { scene: 4, value: 8 },
    { scene: 5, value: 10 }
  ]
}
```

---

## Component Structure

### CharacterArcSummaryPanel
```
CharacterArcSummaryPanel
├── Header (title, close button)
├── Character List
│   └── Character Card
│       ├── Character Info
│       ├── Emotional States
│       ├── Arc Graph (SVG)
│       ├── Turning Points List
│       └── Actions (Export, Define Arc)
└── Footer (Export All, Close)
```

---

## SVG Graph Implementation

### Simple Line Graph
- X-axis: Scene numbers
- Y-axis: Emotional intensity (1-10)
- Line: Character's emotional journey
- Markers: Turning points
- Colors: Different for each character

### Graph Dimensions
- Width: 300px
- Height: 150px
- Padding: 20px
- Responsive scaling

---

## Integration Points

### With Existing Features
- Character Arc Mapper (get arc data)
- Story Output Panel (display location)
- Pro Script Builder (navigation)
- Export Modal (PDF export)

### Data Flow
```
Character Arc Mapper
  ↓
Character Arc Data
  ↓
CharacterArcSummaryPanel
  ↓
Display + Visualization
  ↓
Export/Navigate
```

---

## Implementation Steps

1. **Create CharacterArcSummaryPanel component**
   - Display character information
   - Show emotional states
   - List turning points

2. **Add SVG graph visualization**
   - Plot emotional beats
   - Show turning points
   - Color-coded lines

3. **Add toolbar button**
   - "Character Arcs" button
   - Opens summary panel

4. **Add navigation**
   - Click turning point to navigate to scene
   - Highlight scene in Pro Script Builder

5. **Add export**
   - Export as PDF
   - Export as image

6. **Integrate with PDF export**
   - Add as appendix page
   - Include all character arcs

---

## Testing Strategy

### Component Testing
- [ ] Panel opens/closes correctly
- [ ] Displays all characters with arcs
- [ ] Shows "No arc defined" for others
- [ ] Emotional states display correctly
- [ ] Turning points list correctly

### Graph Testing
- [ ] SVG renders correctly
- [ ] Line plots correctly
- [ ] Markers show turning points
- [ ] Colors are distinct
- [ ] Responsive scaling works

### Navigation Testing
- [ ] Click turning point navigates to scene
- [ ] Scene highlights in Pro Script Builder
- [ ] Correct scene selected

### Export Testing
- [ ] Export as PDF works
- [ ] Export as image works
- [ ] PDF includes all arcs
- [ ] Image quality acceptable

---

## Success Criteria

1. ✅ Character arc summary displays
2. ✅ Shows emotional states
3. ✅ Shows turning points
4. ✅ Graph renders correctly
5. ✅ Navigation works
6. ✅ Export works
7. ✅ PDF integration works
8. ✅ No breaking changes

---

## Estimated Lines of Code

- CharacterArcSummaryPanel: 200 lines
- SVG graph visualization: 100 lines
- Integration: 50 lines
- **Total**: ~350 lines

---

## Timeline

- Component creation: 1-2 hours
- Graph visualization: 1-2 hours
- Integration: 30 minutes
- Testing: 1 hour
- **Total**: 3-5 hours

