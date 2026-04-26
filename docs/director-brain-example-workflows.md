# Director Brain: Example Workflows

## Workflow 1: Building a Complete Scene from Scratch

### Goal
Create a complete scene with dialogue and action using Director Brain commands.

### Steps

**Step 1: Create Scene**
```
Command: "add scene"
Result: New scene created at end of project
```

**Step 2: Add First Shot**
```
Command: "add shot"
Result: Shot 1 added to new scene
```

**Step 3: Add Establishing Action**
```
Command: "add action establishing wide shot of the office"
Result: Shot 1 now has description: "establishing wide shot of the office"
```

**Step 4: Add First Character Dialogue**
```
Command: "add dialogue John says good morning everyone"
Result: Dialogue added to shot 1
  - Character: John
  - Text: "good morning everyone"
```

**Step 5: Add Second Shot**
```
Command: "add shot"
Result: Shot 2 added to scene
```

**Step 6: Add Close-up Action**
```
Command: "add action close-up of Sarah's face"
Result: Shot 2 now has description: "close-up of Sarah's face"
```

**Step 7: Add Response Dialogue**
```
Command: "add dialogue Sarah says good morning John"
Result: Dialogue added to shot 2
  - Character: Sarah
  - Text: "good morning John"
```

**Step 8: Add Third Shot**
```
Command: "add shot"
Result: Shot 3 added to scene
```

**Step 9: Add Wide Shot Action**
```
Command: "add action wide shot of both characters at desks"
Result: Shot 3 now has description: "wide shot of both characters at desks"
```

**Step 10: Add Continuation Dialogue**
```
Command: "add dialogue John says did you finish the report"
Result: Dialogue added to shot 3
  - Character: John
  - Text: "did you finish the report"
```

### Result
Complete scene with 3 shots, action descriptions, and dialogue:
- Shot 1: Establishing wide shot + John's greeting
- Shot 2: Close-up + Sarah's response
- Shot 3: Wide shot + John's question

---

## Workflow 2: Refining Existing Shots with Dialogue

### Goal
Take existing shots and add dialogue and action refinements.

### Starting State
- Scene 1 has 2 shots
- Shot 1: Subject = "Character enters room"
- Shot 2: Subject = "Character looks around"

### Steps

**Step 1: Add Dialogue to Shot 1**
```
Command: "add dialogue Emma says I'm finally here"
Result: Dialogue added to shot 1
```

**Step 2: Add Dialogue to Shot 2**
```
Command: "add dialogue Emma says wow this place is amazing"
Result: Dialogue added to shot 2
```

**Step 3: Refine Shot 1 Action**
```
Command: "edit action in shot 1 to character enters room slowly looking around"
Result: Shot 1 subject updated
```

**Step 4: Refine Shot 2 Action**
```
Command: "edit action in shot 2 to camera pans across room revealing details"
Result: Shot 2 subject updated
```

**Step 5: Update Emma's First Line**
```
Command: "edit dialogue Emma says I can't believe I'm finally here"
Result: Shot 1 dialogue updated
```

**Step 6: Add More Dialogue to Shot 2**
```
Command: "add dialogue Emma says this is incredible"
Result: Second dialogue line added to shot 2
```

### Result
Refined shots with enhanced dialogue and action:
- Shot 1: "character enters room slowly looking around" + Emma's greeting
- Shot 2: "camera pans across room revealing details" + Emma's two reactions

---

## Workflow 3: Multi-Character Dialogue Scene

### Goal
Create a scene with multiple characters having a conversation.

### Steps

**Step 1: Create Scene and First Shot**
```
Command: "add scene"
Command: "add shot"
Result: Scene 2, Shot 1 created
```

**Step 2: Add Establishing Action**
```
Command: "add action coffee shop interior morning light"
Result: Shot 1 has action description
```

**Step 3: Add First Character's Line**
```
Command: "add dialogue Alex says I've been thinking about what you said"
Result: Shot 1 has Alex's dialogue
```

**Step 4: Add Second Shot for Response**
```
Command: "add shot"
Result: Shot 2 created
```

**Step 5: Add Close-up Action**
```
Command: "add action close-up of Jordan listening intently"
Result: Shot 2 has action
```

**Step 6: Add Second Character's Response**
```
Command: "add dialogue Jordan says and what conclusion did you reach"
Result: Shot 2 has Jordan's dialogue
```

**Step 7: Add Third Shot**
```
Command: "add shot"
Result: Shot 3 created
```

**Step 8: Add Two-Shot Action**
```
Command: "add action two-shot of both characters at table"
Result: Shot 3 has action
```

**Step 9: Add Alex's Follow-up**
```
Command: "add dialogue Alex says I think you were right"
Result: Shot 3 has Alex's dialogue
```

**Step 10: Add Jordan's Reaction**
```
Command: "add dialogue Jordan says I'm glad you see it that way"
Result: Second dialogue added to shot 3
```

### Result
Complete dialogue scene:
- Shot 1: Alex's opening line
- Shot 2: Jordan's response
- Shot 3: Alex's follow-up + Jordan's reaction

---

## Workflow 4: Applying Director Styles

### Goal
Create shots and apply different director styles for visual variety.

### Steps

**Step 1: Create Scene with Multiple Shots**
```
Command: "add scene"
Command: "add shot"
Command: "add shot"
Command: "add shot"
Result: Scene with 3 shots
```

**Step 2: Add Action to Each Shot**
```
Command: "add action establishing shot of mansion"
Command: "add action close-up of protagonist's face"
Command: "add action wide shot of ballroom"
Result: All shots have descriptions
```

**Step 3: Apply Kubrick Style to Shot 1**
```
Command: "rewrite shot 1 as Kubrick"
Result: Shot 1 gets Kubrick's visual grammar
  - Symmetrical framing
  - Precise lighting
  - Formal composition
```

**Step 4: Apply Lynch Style to Shot 2**
```
Command: "rewrite shot 2 as Lynch"
Result: Shot 2 gets Lynch's visual style
  - Surreal lighting
  - Unsettling mood
  - Intimate framing
```

**Step 5: Apply Villeneuve Style to Shot 3**
```
Command: "rewrite shot 3 as Villeneuve"
Result: Shot 3 gets Villeneuve's style
  - Epic scale
  - Environmental storytelling
  - Tension through composition
```

### Result
Scene with three shots, each with distinct directorial vision:
- Shot 1: Kubrick's precision and symmetry
- Shot 2: Lynch's surrealism and mood
- Shot 3: Villeneuve's epic scope

---

## Workflow 5: Analysis and Improvement

### Goal
Use Director Brain's analysis features to improve existing scenes.

### Starting State
- Scene 1 has 4 shots
- Shots have basic descriptions but no dialogue

### Steps

**Step 1: Check Coverage**
```
Command: "check coverage"
Result: Action card suggests adding establishing shot
  - Rationale: Scene has no wide shot for spatial context
```

**Step 2: Apply Coverage Suggestion**
```
Action: Click [Confirm] on coverage suggestion
Result: New establishing shot added at beginning
```

**Step 3: Analyze Pacing**
```
Command: "analyze pacing"
Result: Action card suggests reordering shots
  - Rationale: Current order feels slow
```

**Step 4: Apply Pacing Suggestion**
```
Action: Click [Confirm] on pacing suggestion
Result: Shots reordered for better rhythm
```

**Step 5: Check Continuity**
```
Command: "check continuity"
Result: Action card suggests unifying lighting
  - Rationale: Lighting inconsistent across shots
```

**Step 6: Apply Continuity Fix**
```
Action: Click [Confirm] on continuity suggestion
Result: Lighting unified across scene
```

**Step 7: Check Emotional Arc**
```
Command: "what emotional beats are missing"
Result: Action card suggests adding emotional close-up
  - Rationale: Scene lacks character vulnerability
```

**Step 8: Apply Emotional Suggestion**
```
Action: Click [Confirm] on emotional suggestion
Result: Close-up shot added for emotional beat
```

### Result
Scene improved through systematic analysis:
- ✓ Coverage complete (establishing shot added)
- ✓ Pacing optimized (shots reordered)
- ✓ Continuity fixed (lighting unified)
- ✓ Emotional arc enhanced (vulnerability shot added)

---

## Workflow 6: Rapid Prototyping a Scene

### Goal
Quickly create a rough scene structure, then refine it.

### Phase 1: Rapid Creation (5 minutes)

```
Command: "add scene"
Command: "add shot"
Command: "add action character enters"
Command: "add dialogue John says hello"

Command: "add shot"
Command: "add action character reacts"
Command: "add dialogue Sarah says hi"

Command: "add shot"
Command: "add action characters embrace"
Command: "add dialogue John says I missed you"
```

Result: Basic 3-shot scene with dialogue

### Phase 2: Analysis (2 minutes)

```
Command: "check coverage"
Command: "analyze pacing"
Command: "check continuity"
```

Result: Get suggestions for improvement

### Phase 3: Refinement (5 minutes)

```
Command: "edit action in shot 1 to character enters slowly"
Command: "edit dialogue John says it's been too long"
Command: "add action camera follows character"
Command: "edit action in shot 2 to close-up of Sarah's face"
Command: "edit dialogue Sarah says I know"
```

Result: Refined scene with better action and dialogue

### Total Time: ~12 minutes
From concept to refined scene with dialogue and action.

---

## Workflow 7: Building a Montage

### Goal
Create a montage sequence with multiple quick shots and minimal dialogue.

### Steps

**Step 1: Create Scene**
```
Command: "add scene"
Result: New scene for montage
```

**Step 2: Add Multiple Shots Quickly**
```
Command: "add shot"
Command: "add action character wakes up"
Command: "add shot"
Command: "add action character showers"
Command: "add shot"
Command: "add action character gets dressed"
Command: "add shot"
Command: "add action character eats breakfast"
Command: "add shot"
Command: "add action character leaves house"
```

Result: 5-shot montage with action descriptions

**Step 3: Add Minimal Dialogue**
```
Command: "add dialogue John says another day"
Command: "add dialogue John says same routine"
```

Result: Montage with character commentary

**Step 4: Apply Consistent Style**
```
Command: "rewrite shot 1 as Scorsese"
Command: "rewrite shot 2 as Scorsese"
Command: "rewrite shot 3 as Scorsese"
Command: "rewrite shot 4 as Scorsese"
Command: "rewrite shot 5 as Scorsese"
```

Result: Cohesive montage with consistent visual style

### Result
Complete montage sequence:
- 5 quick shots showing daily routine
- Minimal dialogue for pacing
- Consistent Scorsese-inspired visual style

---

## Workflow 8: Collaborative Scene Building

### Goal
Build a scene with multiple people contributing ideas.

### Person 1: Structure
```
Command: "add scene"
Command: "add shot"
Command: "add shot"
Command: "add shot"
Result: 3-shot structure created
```

### Person 2: Action
```
Command: "add action establishing shot of office"
Command: "add action close-up of protagonist"
Command: "add action wide shot of meeting"
Result: Action descriptions added
```

### Person 3: Dialogue
```
Command: "add dialogue Alex says we need to talk"
Command: "add dialogue Jordan says I know"
Command: "add dialogue Alex says about the project"
Result: Dialogue added
```

### Person 4: Refinement
```
Command: "edit action in shot 1 to morning light through windows"
Command: "edit dialogue Alex says we need to talk about the project"
Command: "add dialogue Jordan says I've been thinking about it"
Result: Scene refined
```

### Person 5: Analysis
```
Command: "check coverage"
Command: "analyze pacing"
Result: Suggestions for improvement
```

### Result
Collaborative scene built through distributed effort:
- Structure: 3 shots
- Action: Detailed descriptions
- Dialogue: Character interaction
- Refinement: Polish and detail
- Analysis: Quality assurance

---

## Tips for Effective Workflows

### Tip 1: Start with Structure
Create scenes and shots first, then add details:
```
1. Add scene
2. Add shots
3. Add action
4. Add dialogue
5. Refine and polish
```

### Tip 2: Use Analysis Early
Get suggestions before finalizing:
```
1. Create rough scene
2. Run analysis (coverage, pacing, continuity)
3. Apply suggestions
4. Refine based on feedback
```

### Tip 3: Batch Similar Commands
Group similar operations:
```
Add all shots first
Then add all actions
Then add all dialogue
Then refine
```

### Tip 4: Iterate Quickly
Make changes and see results immediately:
```
1. Add dialogue
2. Review in Pro Script Builder
3. Edit if needed
4. Move to next shot
```

### Tip 5: Use Director Styles Strategically
Apply styles for visual variety:
```
- Opening: Kubrick (formal, precise)
- Emotional beats: Lynch (surreal, intimate)
- Action: Villeneuve (epic, tense)
- Dialogue: Scorsese (dynamic, energetic)
```

---

## Common Workflow Patterns

### Pattern 1: Scene → Shots → Action → Dialogue
Most common workflow for building scenes from scratch.

### Pattern 2: Analysis → Suggestions → Apply → Refine
Systematic improvement of existing scenes.

### Pattern 3: Rapid Prototype → Analyze → Refine
Quick creation followed by quality improvement.

### Pattern 4: Structure → Style → Dialogue → Polish
Building with visual style in mind from the start.

### Pattern 5: Collaborative → Distributed → Integrated
Multiple people contributing different aspects.

---

## Performance Tips

- **Batch commands**: Group similar operations for efficiency
- **Use defaults**: Let system choose positions when possible
- **Undo liberally**: Don't hesitate to undo and try again
- **Save frequently**: Use Ctrl+S to save progress
- **Review often**: Check Pro Script Builder between commands
- **Analyze early**: Get suggestions before finalizing
- **Refine last**: Polish after structure is solid

---

## Troubleshooting Workflows

### Issue: Lost track of shot numbers
**Solution**: Use "list scenes" to see current structure

### Issue: Dialogue not appearing
**Solution**: Specify shot explicitly in command

### Issue: Action text too long
**Solution**: Break into multiple shots or use shorter descriptions

### Issue: Want to undo multiple changes
**Solution**: Use Ctrl+Z repeatedly or use Edit → Undo History

### Issue: Scene feels disconnected
**Solution**: Run "check continuity" and apply suggestions

### Issue: Pacing feels off
**Solution**: Run "analyze pacing" and apply reordering suggestions
