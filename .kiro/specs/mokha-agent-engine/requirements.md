# Requirements: mokha-agent-engine

## Introduction

This document defines the functional requirements for completing the 16 agent-level capabilities inside the MOKHA FILM Prompt Builder's `LocalAssistant` component. The goal is to replace the existing flat `handleSend` dispatch pattern with a unified agent loop that wires all pre-scaffolded utility functions together and adds the missing UI state, rendering, and logic for a true agent experience — 100% offline, no API.

---

## Requirements

### Requirement 1: Intent Chaining with Live Task Queue

**User Story**: As a filmmaker, I want to type a single sentence like "create project Noir City, add 3 scenes, build tense shots in each" and have the agent execute all steps sequentially with a live progress checklist, so I can issue complex multi-step commands without repeating myself.

**Acceptance Criteria**:

1.1 When the user's input contains two or more steps separated by commas, "then", "and", "also", "after that", or semicolons, `parseIntentChain` splits them into an ordered array of step strings.

1.2 When a chain is detected, the agent renders a task queue in the chat showing each step as a pending item (⏳) before execution begins.

1.3 Each step executes sequentially via `agentDispatch`; the task queue item updates to done (✅) or error (❌) after each step completes.

1.4 The full reply for each completed step is appended to the chat as a separate message.

1.5 After the chain completes, a proactive suggestion is shown (Feature 12).

1.6 Single-step inputs bypass the chain runner and go directly to `agentDispatch`.

---

### Requirement 2: Fuzzy & Typo-Tolerant Matching

**User Story**: As a filmmaker, I want the agent to understand near-misses like "director kubrik" or "mood lonly" so typos don't break my workflow.

**Acceptance Criteria**:

2.1 `fuzzyMatch(str, target)` returns `true` when the Levenshtein distance between `str` and `target` is ≤ `max(2, floor(min(|str|, |target|) * 0.3))`.

2.2 `fuzzyFindDirector(q)` uses `fuzzyMatch` to find the closest director key in `DIRECTOR_STYLES`, tolerating up to 2-character typos.

2.3 `fuzzyFindMood(q)` uses `fuzzyMatch` to find the closest mood key in `MOOD_PRESETS`, tolerating up to 2-character typos.

2.4 When a fuzzy match is found, the agent applies the matched style/mood and confirms in the reply which name was matched (e.g., "Matched: Kubrick").

2.5 When no match is found (distance too large), the agent falls through to the next handler without error.

---

### Requirement 3: Pronoun & Context Resolution

**User Story**: As a filmmaker, I want to say "rename it to Opening" after creating a scene, and have the agent understand "it" refers to the last created scene, so I can work conversationally without repeating entity names.

**Acceptance Criteria**:

3.1 `resolveContext(raw, convContext)` replaces "it", "this", "that" in rename/delete/update commands with the last created scene or project name from `convContext`.

3.2 "the last one" and "the last shot" are replaced with "shot N" where N is `convContext.lastShotIndex + 1`.

3.3 "another shot like that", "same shot again", "duplicate that" are normalized to "duplicate last shot".

3.4 `convContext` is updated after every `agentDispatch` call that creates a new entity (project, scene, shot, character, location, voice).

3.5 `convContext` is passed cumulatively through all steps in a chain so later steps can reference entities created by earlier steps.

---

### Requirement 4: Conditional Logic

**User Story**: As a filmmaker, I want to say "if the scene has no shots, create 3" and have the agent evaluate the live app state before deciding whether to act, so I can write smart conditional commands.

**Acceptance Criteria**:

4.1 `agentDispatch` detects the pattern `if <condition>, [then] <action>` and calls `evalCondition(condition, appActions)` before executing the action.

4.2 `evalCondition` correctly evaluates: "no shots / empty scene", "has shots", "more than N shots", "less than N shots", "no characters", "no locations", "no projects".

4.3 When the condition is `true`, the action part is dispatched via `agentDispatch`.

4.4 When the condition is `false`, the agent replies "ℹ Condition not met: [condition]" and takes no action.

4.5 When the condition is unrecognized (`null`), the agent replies with a helpful error and example syntax.

---

### Requirement 5: Undo Last Action

**User Story**: As a filmmaker, I want to say "undo that" and have the agent reverse the last operation it performed, so I can experiment without fear of losing my work.

**Acceptance Criteria**:

5.1 Before every state-mutating `agentDispatch` call, `buildSnapshot(appActions, description)` captures a deep clone of `scenes`, `projects`, `globalCharacters`, `globalLocations`, `globalVoiceStyles`, `activeSceneId`, and `activeProjectId`.

5.2 The snapshot is pushed to `agentActionLog` (capped at 20 entries) along with a human-readable description.

5.3 When the user says "undo", "undo that", or "undo last", `restoreSnapshot` applies the most recent log entry back to app state via the appropriate setters.

5.4 After a successful undo, the log entry is removed and the agent replies "↩️ Undone: [description]".

5.5 When `agentActionLog` is empty, the agent replies "↩️ Nothing to undo — no actions recorded yet."

---

### Requirement 6: Full Project Generator

**User Story**: As a filmmaker, I want to say "build a complete horror film, 3 scenes, 4 shots each, Lynch style" and have the agent create the entire project structure in one command, so I can start from a full scaffold instantly.

**Acceptance Criteria**:

6.1 `generateFullProject(desc, appActions)` parses scene count, shots-per-scene, director style, and mood from the description string.

6.2 The generated project contains the correct number of scenes with the correct number of shots each.

6.3 Each shot's `selections` reflect the detected director style or mood preset (camera, lens, lighting, movement, filmStock, shotStyle).

6.4 Scene names default to "Act 1 — Setup / Act 2 — Confrontation / Act 3 — Resolution" for 3-scene projects, or "Scene N" otherwise.

6.5 The generated scenes replace the active project's scenes via `updateActiveProjectScenes`.

6.6 After generation, the agent replies with a summary: project name, scene count, shots per scene, detected style/mood.

6.7 A proactive suggestion to "analyze my project" is shown after generation.

---

### Requirement 7: Scene Rewriter

**User Story**: As a filmmaker, I want to say "rewrite all shots in Fincher style" and have the agent bulk-update every shot in the active scene to match that director's parameters, so I can rapidly change the visual language of a scene.

**Acceptance Criteria**:

7.1 `rewriteScene(desc, appActions)` detects a director or mood from the description using `fuzzyFindDirector` / `fuzzyFindMood`.

7.2 All shots in the active scene have their `selections` updated with the director's or mood's camera, lens, lighting, movement, shotStyle, and filmStock.

7.3 The agent replies with the count of shots updated and the style applied.

7.4 When no director or mood is detected, the agent returns an error message with example syntax.

7.5 A snapshot is captured before rewriting (enabling undo).

---

### Requirement 8: Shot Duplicator with Variation

**User Story**: As a filmmaker, I want to say "duplicate shot 2 with golden hour lighting" and have the agent clone that shot and apply the specified changes, so I can quickly create variations without manual copying.

**Acceptance Criteria**:

8.1 `duplicateShotWithVariation(shotIdx, variationDesc, appActions)` clones the shot at `shotIdx` in the active scene.

8.2 The variation description is parsed for shot type, lighting, action speed, movement, mood, and director overrides.

8.3 The cloned shot is inserted immediately after the original in the scene's shot array.

8.4 The agent replies confirming which shot was duplicated and what changes were applied.

8.5 When the shot index is out of range, the agent replies with an error and the valid range.

8.6 A snapshot is captured before duplication (enabling undo).

---

### Requirement 9: Cross-Scene Operations

**User Story**: As a filmmaker, I want to say "copy all shots from scene Act 1 to scene Act 2" or "merge scene Act 1 and Act 2", so I can reorganize my project structure without manual drag-and-drop.

**Acceptance Criteria**:

9.1 `crossSceneOp` detects "copy shots from [scene A] to [scene B]" and appends deep-cloned copies of scene A's shots to scene B.

9.2 `crossSceneOp` detects "merge [scene A] and [scene B]" and combines all shots into scene A, then removes scene B.

9.3 Scene names are matched case-insensitively and support partial matches.

9.4 When a referenced scene is not found, the agent replies with the error and suggests "list scenes".

9.5 A snapshot is captured before any cross-scene operation (enabling undo).

---

### Requirement 10: Smart Search

**User Story**: As a filmmaker, I want to say "find all shots with handheld camera" and get a list of matching shots across all scenes, so I can quickly audit my project's visual consistency.

**Acceptance Criteria**:

10.1 `searchShots(query, appActions)` searches all shots across all scenes in the active project.

10.2 Supported search terms include: handheld, golden hour, no lighting, no camera, slow motion, drone, close-up, wide, and any free-text value that matches any `selections` field.

10.3 Results are returned as `{ scene, shotNum, shot }` objects.

10.4 The agent formats results as a numbered list: "Scene Name — Shot N: [shot type] / [lighting]".

10.5 When no results are found, the agent replies "No shots found matching '[query]'."

10.6 `convContext.lastSearchResults` is updated with the results for follow-up commands.

---

### Requirement 11: Task Queue with Progress UI

**User Story**: As a filmmaker, I want to see a live checklist in the chat when the agent is executing a multi-step command, so I know what's happening and can track progress.

**Acceptance Criteria**:

11.1 When a chain is detected, a task queue message is rendered in the chat before execution starts, showing all steps as pending (⏳).

11.2 As each step completes, its status updates to ✅ (done) or ❌ (error) in the rendered task queue.

11.3 The task queue is rendered as a distinct message type (`isTaskQueue: true`) with a styled checklist layout.

11.4 While a chain is running, `isRunningChain` is `true` and the input is disabled to prevent concurrent submissions.

11.5 After the chain completes, `isRunningChain` is set back to `false` and the input is re-enabled.

---

### Requirement 12: Proactive Suggestions

**User Story**: As a filmmaker, I want the agent to suggest the logical next step after each action, so I can stay in flow without having to think about what to do next.

**Acceptance Criteria**:

12.1 `getProactiveSuggestion(lastResult, appActions)` returns a context-aware suggestion string based on the last action type.

12.2 After `CREATE_PROJECT` → suggest "add a scene: 'add scene [name]'"

12.3 After `CREATE_SCENE` → suggest "add shots or rewrite in a director style"

12.4 After `generateFullProject` → suggest "analyze my project"

12.5 After `rewriteScene` → suggest "duplicate a shot with variation"

12.6 After `searchShots` with results → suggest "change [param] in those shots"

12.7 After `analyzeProject` with issues → suggest "rewrite scene to fix continuity"

12.8 Suggestions are rendered as a distinct message type (`isSuggestion: true`) with a "💡 Next:" prefix.

12.9 Suggestions are only shown when a non-null suggestion string is returned (not after every action).

---

### Requirement 13: Project Analyzer

**User Story**: As a filmmaker, I want to say "analyze my project" and get a full report of shots, missing parameters, continuity issues, and estimated duration, so I can identify problems before exporting.

**Acceptance Criteria**:

13.1 `analyzeProject(appActions)` scans all shots across all scenes in the active project.

13.2 The report includes: project name, scene count, total shot count, total estimated duration (sum of `duration` fields), completeness percentage.

13.3 Issues (blocking): shots with no lighting set.

13.4 Warnings (non-blocking): shots with no camera, no shot type; lighting continuity breaks between adjacent shots; style changes between adjacent shots.

13.5 Platform warnings: shots whose subject text contains words flagged in `PLATFORM_RESTRICTIONS`.

13.6 The report is formatted as a structured text block with sections for Issues, Warnings, and Platform Flags.

13.7 When the project has no issues or warnings, the agent replies with a "✅ All clear!" message.

---

### Requirement 14: Natural Language Parameter Editing

**User Story**: As a filmmaker, I want to say "change lighting in shot 3 to golden hour" or "set all shots duration to 4s" and have the agent apply the change directly, so I can edit shot parameters without opening the editor UI.

**Acceptance Criteria**:

14.1 `parseParamEdit` detects "change/set/update [param] in/of/for shot N to [value]" and returns an `EDIT_SHOT_PARAM` action.

14.2 `parseParamEdit` detects "set all shots to X seconds" / "set duration of all shots to Xs" and returns an `EDIT_ALL_SHOTS_PARAM` action.

14.3 `parseParamEdit` detects "add/set/apply [value] [param] to every/all shots" and returns an `EDIT_ALL_SHOTS_PARAM` action.

14.4 Parameter names are mapped: lighting, camera, lens, movement, angle, style→shotStyle, type→shotType, speed→actionSpeed, duration, transition, stock→filmStock.

14.5 Values are fuzzy-matched against the corresponding `OPTIONS` list to find the closest valid option.

14.6 `EDIT_SHOT_PARAM` updates only the specified shot; `EDIT_ALL_SHOTS_PARAM` updates all shots in the active scene.

14.7 A snapshot is captured before any parameter edit (enabling undo).

14.8 The agent confirms: "✓ Shot N [param] → [value]" or "✓ All N shots [param] → [value]".

---

### Requirement 15: Cross-Session Memory

**User Story**: As a filmmaker, I want the agent to remember my last project, director style, and mood from my previous session, so I get a personalized welcome-back greeting and can continue where I left off.

**Acceptance Criteria**:

15.1 `saveAgentMemory(data)` persists `lastProject`, `lastDirector`, `lastMood`, and `lastSeen` to `localStorage` under the key `mokha_agent_memory`.

15.2 `loadAgentMemory()` reads and parses the stored JSON, returning `{}` on any error.

15.3 On assistant open, if `crossSessionMemory.lastSeen` and `crossSessionMemory.lastProject` are both present, the greeting shows "Welcome back!" with the last project name, style, and mood.

15.4 `saveAgentMemory` is called after every director style or mood application, and after every project creation, updating the relevant fields.

15.5 `saveAgentMemory` is wrapped in try/catch and fails silently (no error shown to user).

---

### Requirement 16: Agent Explain Mode

**User Story**: As a filmmaker, I want to say "explain what you just did" and get a full log of the last few actions the agent performed, so I can understand what changed and why.

**Acceptance Criteria**:

16.1 Every `agentDispatch` call that mutates state pushes an entry to `agentActionLog`: `{ id, timestamp, description, snapshot, resultText, featureId }`.

16.2 `agentActionLog` is capped at 20 entries (oldest entries are dropped when the cap is reached).

16.3 When the user says "explain", "explain what you just did", "what did you do", or "what just happened", the agent formats the last 1–3 log entries as a readable action log.

16.4 The explain response includes: timestamp, action description, and the result text for each entry.

16.5 When `agentActionLog` is empty, the agent replies "No actions recorded yet in this session."

16.6 The explain response is rendered as a distinct message type (`isExplain: true`).
