# Tasks: mokha-agent-engine

## Implementation Plan

All changes are confined to `mokha-suite PRO Vqr.html`. The work is organized into 5 phases: state scaffolding, core agent infrastructure, feature wiring, UI rendering, and memory/persistence.

---

- [x] 1. Add missing agent state to `LocalAssistant`
  - [x] 1.1 Add `agentActionLog` state (already declared — verify cap logic at 20 entries is in place)
  - [x] 1.2 Add `isRunningChain` state (already declared — verify it gates input disable)
  - [x] 1.3 Add `convContext` state (already declared — verify it is passed to `resolveContext` and updated after each dispatch)
  - [x] 1.4 Add `lastActionExplanation` state (already declared — wire to explain mode)

- [x] 2. Implement `buildSnapshot` and `restoreSnapshot` utility functions
  - [x] 2.1 Write `buildSnapshot(appActions, description)` — deep-clones scenes, projects, characters, locations, voices, activeSceneId, activeProjectId
  - [x] 2.2 Write `restoreSnapshot(snapshot, appActions)` — calls the appropriate setters to restore all cloned fields
  - [x] 2.3 Verify deep clone (no shared references) by checking that mutating the live state after snapshot does not affect the snapshot

- [x] 3. Implement `agentDispatch` — the unified single-step router
  - [x] 3.1 Add undo branch: detect "undo"/"undo that"/"undo last", call `restoreSnapshot` on last log entry, pop log entry
  - [x] 3.2 Add explain branch: detect "explain"/"what did you do"/"what just happened", format last 1–3 `agentActionLog` entries
  - [x] 3.3 Add analyze branch: detect "analyze"/"project report"/"check project", call `analyzeProject`, format report
  - [x] 3.4 Add full project generator branch: detect "generate project"/"build complete"/"create film with scenes", call `generateFullProject`, apply via `updateActiveProjectScenes`
  - [x] 3.5 Add scene rewriter branch: detect "rewrite shots"/"rewrite scene"/"all shots in X style", call `rewriteScene`
  - [x] 3.6 Add shot duplicator branch: detect "duplicate shot N"/"clone shot", extract index and variation, call `duplicateShotWithVariation`
  - [x] 3.7 Add cross-scene ops branch: detect "copy shots from"/"merge scene", call `crossSceneOp`
  - [x] 3.8 Add smart search branch: detect "find"/"search"/"show shots with", call `searchShots`, format results, update `convContext.lastSearchResults`
  - [x] 3.9 Add parameter edit branch: call `parseParamEdit`, apply `EDIT_SHOT_PARAM` or `EDIT_ALL_SHOTS_PARAM` to active scene shots
  - [x] 3.10 Add conditional logic branch: detect "if <condition>, [then] <action>", call `evalCondition`, recurse into `agentDispatch` on true
  - [x] 3.11 Add fuzzy director/mood branch: call `fuzzyFindDirector` / `fuzzyFindMood`, apply style, capture snapshot
  - [x] 3.12 Fall through to existing `CommandEngine.parse` / `CommandEngine.execute` for all other commands
  - [x] 3.13 Fall through to `AssistantEngine.ask` as final fallback
  - [x] 3.14 After every state-mutating branch, push entry to `agentActionLog` (cap at 20)
  - [x] 3.15 After every state-mutating branch, update `convContext` with newly created entity names/indices
  - [x] 3.16 Return `{ text, snapshot, contextUpdate, suggestion }` from every branch

- [x] 4. Implement `runChain` — sequential multi-step executor
  - [x] 4.1 Write `runChain(steps, appActions, convContext, callbacks)` with `setTimeout`-based staggering (300ms per step)
  - [x] 4.2 Pass cumulative `convContext` updates between steps so later steps can reference entities from earlier steps
  - [x] 4.3 Call `callbacks.onStepStart(i)`, `callbacks.onStepDone(i, result)`, `callbacks.onStepError(i, err)` at the correct points
  - [x] 4.4 Call `callbacks.onChainComplete(results, suggestion)` after all steps finish

- [x] 5. Implement `getProactiveSuggestion`
  - [x] 5.1 Write `getProactiveSuggestion(lastResult, appActions)` with suggestion logic for each action type (CREATE_PROJECT, CREATE_SCENE, generateFullProject, rewriteScene, searchShots, analyzeProject)
  - [x] 5.2 Return `null` for action types that have no natural next step

- [x] 6. Replace `handleSend` with the full agent dispatch loop
  - [x] 6.1 At the top of `handleSend`, call `resolveContext(rawInput, convContext)` to get the resolved input
  - [x] 6.2 Call `parseIntentChain(resolved)` — if multi-step, call `runChain`; if single-step, call `agentDispatch` directly
  - [x] 6.3 When `runChain` is used, set `isRunningChain = true` before and `false` after
  - [x] 6.4 After each `agentDispatch` result, call `setConvContext(prev => ({ ...prev, ...result.contextUpdate }))` to persist context
  - [x] 6.5 After each `agentDispatch` result, if `result.suggestion` is non-null, push a suggestion message (`isSuggestion: true`)
  - [x] 6.6 After director/mood application, call `saveAgentMemory` with updated director/mood/project fields
  - [x] 6.7 Remove the old flat dispatch pattern (director block, mood block, surprise me, steal shot, batch build, director's card, memory recall, combo, CommandEngine call, AssistantEngine fallback) — all now handled by `agentDispatch`

- [x] 7. Add Task Queue UI rendering
  - [x] 7.1 Add a `TaskQueueMessage` sub-component that renders a list of `TaskQueueItem` objects with ⏳/✅/❌ icons
  - [x] 7.2 In the messages list renderer, detect `msg.isTaskQueue === true` and render `TaskQueueMessage` instead of plain text
  - [x] 7.3 Task queue message updates in-place (use message index + `setMessages` splice) as steps complete

- [x] 8. Add Proactive Suggestion UI rendering
  - [x] 8.1 In the messages list renderer, detect `msg.isSuggestion === true` and render with a distinct "💡 Next:" style (e.g., amber/yellow border, italic text)
  - [x] 8.2 Suggestion messages include a clickable quick-action button that pre-fills the input with the suggested command

- [x] 9. Add Explain Mode UI rendering
  - [x] 9.1 In the messages list renderer, detect `msg.isExplain === true` and render with a distinct log-style layout (monospace font, timestamp prefix per entry)

- [x] 10. Wire cross-session memory saves
  - [x] 10.1 After `agentDispatch` applies a director style, call `saveAgentMemory({ lastDirector: style.label })`
  - [x] 10.2 After `agentDispatch` applies a mood, call `saveAgentMemory({ lastMood: moodKey })`
  - [x] 10.3 After `CommandEngine.execute` creates a project, call `saveAgentMemory({ lastProject: name })`
  - [x] 10.4 After `generateFullProject` creates a project, call `saveAgentMemory({ lastProject: desc })`

- [x] 11. Disable input during chain execution
  - [x] 11.1 The chat input `<input>` element gets `disabled={isRunningChain}` attribute
  - [x] 11.2 The submit button gets `disabled={isRunningChain}` attribute
  - [x] 11.3 A subtle "Agent running…" indicator is shown near the input while `isRunningChain` is true
