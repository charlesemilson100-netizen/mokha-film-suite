# Director Brain Quick Reference

## Command Categories

### Scene & Shot Management
| Command | Example | Action |
|---------|---------|--------|
| Add Scene | "add scene" | Creates new scene at end |
| Add Shot | "add shot" | Adds shot to last scene |
| Delete Scene | "delete scene 2" | Removes scene 2 |
| Delete Shot | "delete shot 3" | Removes shot 3 |
| Reorder Shot | "move shot 2 to position 1" | Reorders shots |
| Rewrite Shot | "rewrite shot 1 as Kubrick" | Applies director style |

### Dialogue Management
| Command | Example | Action |
|---------|---------|--------|
| Add Dialogue | "add dialogue John says hello" | Adds character dialogue |
| Edit Dialogue | "edit dialogue John says goodbye" | Updates dialogue line |
| Delete Dialogue | "delete dialogue 1 in shot 2" | Removes dialogue line |

### Action Management
| Command | Example | Action |
|---------|---------|--------|
| Add Action | "add action the door opens" | Adds scene description |
| Edit Action | "edit action to camera zooms in" | Updates description |

### Analysis & Suggestions
| Command | Example | Action |
|---------|---------|--------|
| Check Coverage | "check coverage" | Analyzes shot types |
| Check Continuity | "check continuity" | Finds inconsistencies |
| Analyze Pacing | "analyze pacing" | Reviews shot rhythm |
| Check Emotional Arc | "what emotional beats are missing" | Suggests emotional moments |

---

## Dialogue Command Syntax

### Basic Dialogue
```
add dialogue [CHARACTER] says [TEXT]
add dialogue John says hello world
add dialogue Sarah says I'm ready
```

### With Scene/Shot Specification
```
add dialogue [CHARACTER] says [TEXT] in scene [N] shot [M]
add dialogue John says hello in scene 1 shot 2
add dialogue Sarah says goodbye in shot 3
```

### Alternative Syntax
```
character: [CHARACTER] dialogue: [TEXT]
character: John dialogue: hello world

[CHARACTER]: [TEXT]
John: hello world
```

---

## Action Command Syntax

### Basic Action
```
add action [TEXT]
add action the door opens slowly
add action camera pans left
```

### With Scene/Shot Specification
```
add action [TEXT] in scene [N] shot [M]
add action the door opens in scene 1 shot 2
add action camera zooms in shot 3
```

### Alternative Syntax
```
add description [TEXT]
add scene description [TEXT]
describe action [TEXT]
```

---

## Edit Command Syntax

### Edit Dialogue
```
edit dialogue [CHARACTER] says [NEW TEXT]
edit dialogue John says goodbye
change [CHARACTER]'s line to [NEW TEXT]
change John's line to goodbye
```

### Edit Action
```
edit action [TEXT]
edit action to camera zooms in
change description to fade to black
update action [TEXT]
```

---

## Scene/Shot Positioning

### Position Keywords
- **after**: "add shot after shot 3" → position 3
- **before**: "add shot before shot 3" → position 2
- **at**: "add shot at position 2" → position 1 (0-indexed)
- **to**: "move shot 2 to position 1" → position 0

### Default Positions
- **Add Scene**: End of project
- **Add Shot**: End of active scene
- **Add Dialogue**: Last shot in scene
- **Add Action**: Last shot in scene

---

## Director Styles

Available styles for "rewrite shot X as [STYLE]":
- Kubrick
- Nolan
- Villeneuve
- Tarantino
- Lynch
- Scorsese
- Wong Kar-wai
- Blade Runner (Ridley Scott)

Example: "rewrite shot 1 as Villeneuve"

---

## Analysis Queries

### Coverage Analysis
- "check coverage"
- "am I overusing any shot types"
- "missing establishing shot"
- "need close-up coverage"

### Continuity Checking
- "check continuity"
- "lighting inconsistent"
- "eyeline match"
- "screen direction"

### Pacing Review
- "analyze pacing"
- "scene drags"
- "too fast"
- "rhythm issues"

### Emotional Arc
- "what emotional beats are missing"
- "feels flat"
- "no emotional resonance"
- "character arc"

### Structure
- "check structure"
- "three act structure"
- "midpoint"
- "act break"

---

## Action Card Workflow

1. **Type Command** in Director Brain input
2. **Review Action Card** that appears
   - Shows what will happen
   - Explains the rationale
3. **Click [Confirm]** to apply
   - Changes appear in Pro Script Builder
   - Card shows green checkmark
4. **Click [Reject]** to dismiss
   - No changes made
   - Card shows gray X
5. **Undo** if needed
   - Use Ctrl+Z or Edit menu
   - Reverts to previous state

---

## Pro Tips

### Tip 1: Batch Dialogue
Add multiple dialogue lines in sequence:
```
"add dialogue John says hello"
"add dialogue Sarah says hi there"
"add dialogue John says how are you"
```

### Tip 2: Scene Building
Build complete scenes with one command sequence:
```
"add scene"
"add shot"
"add action the door opens"
"add dialogue John says come in"
"add dialogue Sarah says thanks"
```

### Tip 3: Director Styles
Apply cinematic styles to shots:
```
"rewrite shot 1 as Villeneuve"
"rewrite shot 2 as Lynch"
"rewrite shot 3 as Kubrick"
```

### Tip 4: Refinement
Edit and refine as you go:
```
"add dialogue John says hello"
"edit dialogue John says goodbye"
"add action camera zooms in"
"edit action to camera pans left"
```

### Tip 5: Analysis First
Get suggestions before making changes:
```
"check coverage"
"analyze pacing"
"check continuity"
```
Then apply suggested action cards.

---

## Common Patterns

### Pattern 1: Opening Scene
```
add scene
add shot
add action establishing wide shot of the city
add dialogue John says another day another dollar
```

### Pattern 2: Dialogue Exchange
```
add dialogue John says are you ready
add dialogue Sarah says I'm ready
add dialogue John says let's go
```

### Pattern 3: Action Sequence
```
add shot
add action character runs through door
add shot
add action camera follows with dolly
add shot
add action wide shot of explosion
```

### Pattern 4: Emotional Beat
```
add shot
add action close-up of character's face
add dialogue John says I'm sorry
add action camera pulls back slowly
```

---

## Troubleshooting

### Issue: "Shot not found"
- **Cause**: Shot number doesn't exist
- **Fix**: Check scene/shot numbers with "list scenes"

### Issue: "Scene not found"
- **Cause**: Scene number doesn't exist
- **Fix**: Add scene first with "add scene"

### Issue: Dialogue not appearing
- **Cause**: Shot might not have been selected
- **Fix**: Specify shot explicitly: "add dialogue John says hello in shot 2"

### Issue: Action text truncated
- **Cause**: Text too long
- **Fix**: Use shorter descriptions or edit after creation

### Issue: Character name not recognized
- **Cause**: Name format incorrect
- **Fix**: Use format "John says" or "character: John dialogue: text"

---

## Keyboard Shortcuts

- **Ctrl+Z**: Undo last action
- **Ctrl+Y**: Redo
- **Enter**: Submit command (in input field)
- **Escape**: Close Director Brain panel

---

## Limits & Constraints

- **Max scenes**: 35 per project
- **Max shots per scene**: Unlimited
- **Max dialogues per shot**: Unlimited
- **Max action text length**: ~1000 characters
- **Max dialogue text length**: ~500 characters
- **Character name length**: 1-50 characters

---

## Integration Points

Director Brain commands integrate with:
- ✅ Pro Script Builder (main editor)
- ✅ Shot editor (when opened)
- ✅ Screenplay exports
- ✅ History/Undo system
- ✅ localStorage persistence
- ✅ Character tracking
- ✅ Mood/tone analysis

---

## Next Steps

1. **Try basic commands**: "add scene", "add shot"
2. **Add dialogue**: "add dialogue John says hello"
3. **Add action**: "add action the door opens"
4. **Get suggestions**: "check coverage", "analyze pacing"
5. **Apply suggestions**: Click [Confirm] on action cards
6. **Refine**: Edit and adjust as needed
7. **Export**: Generate screenplay with all changes
