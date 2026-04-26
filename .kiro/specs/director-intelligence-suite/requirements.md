# Requirements Document

## Introduction

The Director Intelligence Suite is a set of four interconnected features for MOKHA FILM Suite (an Electron + React single-file app) that elevate the filmmaking workflow with AI-assisted direction, shot critique, cinematic sequence suggestions, and keyboard-first power-user controls.

The suite is designed around a **Dual-Brain architecture**:
- **Fast Brain** — Always-on, zero-latency, rule-based intelligence backed by a curated cinematic knowledge base and template engine. Covers ~80% of use cases instantly with no model loading.
- **Deep Brain** — Optional WebLLM-powered mode the user activates in settings. Uses a lightweight model (SmolLM2-360M or Qwen2.5-0.5B) for open-ended creative requests. Replaces the existing Phi-3 (3.8B) model which is too slow for interactive use.

The four features are:
1. **MOKHA Director Brain** — Persistent AI director chat panel with full project context awareness.
2. **Shot Critique Engine** — Per-shot director's notes panel with rule-based and AI-powered critique.
3. **Shot Sequence Intelligence** — Deterministic next-shot suggestion based on cinematic grammar rules.
4. **Keyboard-First Power Mode** — Full keyboard shortcut system with command palette and visual cheat sheet.

---

## Glossary

- **Director_Brain**: The persistent AI director chat panel component that reads full project state and responds to director-style queries.
- **Fast_Brain**: The always-on, zero-latency rule-based intelligence layer. No model loading required.
- **Deep_Brain**: The optional WebLLM-powered intelligence layer, activated by the user in settings.
- **Shot_Critique_Engine**: The component that analyzes an assembled shot prompt and returns director's notes.
- **Sequence_Intelligence**: The component that suggests the next logical shot based on cinematic grammar rules.
- **Ghost_Card**: A visual placeholder card rendered after the last shot in the filmstrip, showing a suggested next shot.
- **Suggestion_Chip**: A compact inline UI element displaying a next-shot suggestion label.
- **Keyboard_Power_Mode**: The full keyboard shortcut system including command palette and cheat sheet overlay.
- **Command_Palette**: The searchable overlay (Cmd+K / Ctrl+K) listing all available app actions.
- **Cheat_Sheet**: The full-screen keyboard shortcut reference overlay triggered by the `?` key.
- **Cinematic_Grammar**: The set of established shot sequencing conventions used in professional filmmaking (e.g., EWS → WS → MS → CU → ECU for push-in).
- **Project_State**: The complete in-memory state of the current project including all scenes, shots, characters, locations, and voice settings.
- **Shot_Prompt**: The fully assembled text prompt for a single shot, including subject, action, location, lighting, lens, and style fields.
- **Continuity_Lock**: The existing feature that flags continuity conflicts between shots.
- **Director_Style**: The existing per-shot director style preset (e.g., Kubrick, Nolan, Villeneuve).
- **WebLLM**: The `@mlc-ai/web-llm` library already loaded in the app via `window.webllm`.
- **Mode_Toggle**: The settings UI control that switches between Fast Brain and Deep Brain modes.
- **Brain_Status_Indicator**: The persistent header UI element showing the current active brain mode and model loading state.

---

## Requirements

---

### Requirement 1: Dual-Brain Architecture Foundation

**User Story:** As a filmmaker, I want the app's AI features to respond instantly by default, so that my creative flow is never interrupted by model loading times.

#### Acceptance Criteria

1. THE Fast_Brain SHALL be active at all times without requiring any model download or initialization step.
2. THE Fast_Brain SHALL respond to supported query types within 100ms of receiving input.
3. WHEN the user enables Deep Brain mode in settings, THE Deep_Brain SHALL initialize the WebLLM engine using either the SmolLM2-360M or Qwen2.5-0.5B model.
4. WHEN Deep Brain initialization begins, THE Brain_Status_Indicator SHALL display a loading progress percentage until the model is ready.
5. WHEN Deep Brain initialization completes, THE Brain_Status_Indicator SHALL display "DEEP MODE" with a cyan active indicator.
6. WHILE Fast Brain mode is active, THE Brain_Status_Indicator SHALL display "FAST MODE" with a gold active indicator.
7. IF the WebLLM engine fails to initialize, THEN THE Deep_Brain SHALL display an error message and THE Fast_Brain SHALL remain active as the fallback.
8. THE Mode_Toggle SHALL persist the user's brain mode preference to localStorage so that the selected mode is restored on next app launch.
9. THE Deep_Brain SHALL NOT use the Phi-3 (3.8B) model as it exceeds acceptable response latency for interactive use.
10. WHERE Deep Brain mode is active, THE Director_Brain SHALL route open-ended creative queries to the Deep_Brain and rule-based queries to the Fast_Brain.

---

### Requirement 2: MOKHA Director Brain — Chat Panel

**User Story:** As a director, I want a persistent AI chat panel that knows my entire project, so that I can ask high-level creative questions and get contextually accurate answers without manually describing my project each time.

#### Acceptance Criteria

1. THE Director_Brain SHALL render as a persistent panel within the app UI, accessible without navigating away from the current scene or shot view.
2. WHEN the user opens the Director_Brain panel, THE Director_Brain SHALL automatically load the full Project_State including all scenes, shots, characters, locations, and active Director_Style presets.
3. THE Director_Brain SHALL accept free-text queries typed into a chat input field.
4. WHEN the user submits a query, THE Director_Brain SHALL include the full Project_State as context when generating a response.
5. WHEN a query matches a Fast_Brain rule pattern (e.g., shot rewrite in a named director style, continuity check, emotional gap analysis), THE Fast_Brain SHALL handle the response without invoking the WebLLM engine.
6. WHERE Deep Brain mode is active and the query does not match a Fast_Brain rule pattern, THE Deep_Brain SHALL generate the response using the loaded WebLLM model.
7. THE Director_Brain SHALL display each exchange as a chat thread with user messages and AI responses visually distinguished.
8. WHEN the user asks to rewrite a scene in a named director style (e.g., "rewrite scene 3 as a Kubrick cold open"), THE Fast_Brain SHALL apply the matching Director_Style template to the scene's shots and return the rewritten prompts.
9. WHEN the user asks what is emotionally missing from a sequence, THE Fast_Brain SHALL analyze the shot sequence against a curated emotional arc checklist and return specific gap annotations.
10. THE Director_Brain SHALL support a minimum of 20 Fast_Brain rule patterns covering: director style rewrites, continuity checks, emotional arc analysis, pacing analysis, shot type distribution, missing coverage suggestions, lighting conflict detection, and character consistency checks.
11. WHEN the Director_Brain panel is open, THE Director_Brain SHALL display a list of suggested example queries to guide new users.
12. THE Director_Brain chat history SHALL persist within the current session and be cleared when the user starts a new project.
13. WHEN the user references a specific scene or shot by number in a query (e.g., "scene 3", "shot 2"), THE Director_Brain SHALL resolve the reference against the current Project_State and include that entity's data in the response context.

---

### Requirement 3: MOKHA Director Brain — Settings Integration

**User Story:** As a power user, I want to control the AI brain mode from settings, so that I can choose between instant responses and deeper creative analysis based on my current needs.

#### Acceptance Criteria

1. THE Mode_Toggle SHALL appear in the app's existing Settings panel under an "AI Intelligence" section.
2. THE Mode_Toggle SHALL display two clearly labeled states: "FAST MODE" and "DEEP MODE".
3. WHEN the user switches from Fast Mode to Deep Mode, THE Director_Brain SHALL display a confirmation prompt explaining that a model download is required and showing the estimated model size.
4. WHEN the user confirms the Deep Mode switch, THE Deep_Brain SHALL begin downloading and initializing the selected WebLLM model.
5. THE Settings panel SHALL display the currently loaded model name and version when Deep Brain mode is active.
6. THE Settings panel SHALL allow the user to select between SmolLM2-360M and Qwen2.5-0.5B as the Deep Brain model.
7. WHEN the user switches from Deep Mode back to Fast Mode, THE Deep_Brain SHALL release the WebLLM engine resources and THE Fast_Brain SHALL become the sole active intelligence layer.

---

### Requirement 4: Shot Critique Engine — Rule-Based Critique

**User Story:** As a director, I want the app to automatically flag issues in my shot prompts, so that I can catch continuity errors, missing emotional anchors, and lighting conflicts before exporting.

#### Acceptance Criteria

1. THE Shot_Critique_Engine SHALL analyze each Shot_Prompt and produce a set of director's notes.
2. THE Shot_Critique_Engine SHALL detect and flag the following rule-based issues using the Fast_Brain:
   a. Continuity conflicts (subject, costume, or location inconsistency between consecutive shots)
   b. Missing emotional anchor (no emotional tone or character reaction specified in the shot)
   c. Lighting conflicts (incompatible lighting setups between consecutive shots in the same scene)
   d. Missing coverage (a scene with no establishing shot or no close-up)
   e. Overuse of a single shot type within a scene (more than 3 consecutive shots of the same type)
3. WHEN a critique issue is detected, THE Shot_Critique_Engine SHALL display an inline annotation on the affected shot card with a severity level (Warning or Note).
4. THE Shot_Critique_Engine SHALL display a summary critique panel accessible per shot showing all detected issues for that shot.
5. WHEN the user resolves a flagged issue by editing the shot, THE Shot_Critique_Engine SHALL re-evaluate the shot and remove the resolved annotation within 500ms of the edit completing.
6. WHERE Deep Brain mode is active, THE Shot_Critique_Engine SHALL additionally generate nuanced creative notes for each shot using the Deep_Brain, covering aspects such as subtext, visual metaphor, and tonal consistency.
7. WHEN Deep Brain critique notes are generated, THE Shot_Critique_Engine SHALL visually distinguish them from Fast_Brain rule-based notes using a different label or color.
8. THE Shot_Critique_Engine SHALL NOT block the user from editing or exporting shots while critique analysis is running.
9. THE Shot_Critique_Engine SHALL provide a per-shot "Dismiss" action for each annotation so the user can suppress notes they have intentionally chosen to keep.
10. WHEN a shot is dismissed, THE Shot_Critique_Engine SHALL persist the dismissed state for that annotation within the current session.

---

### Requirement 5: Shot Critique Engine — Display and Interaction

**User Story:** As a director, I want critique notes to be visible inline without cluttering my workspace, so that I can review feedback in context without losing focus on the shot I'm editing.

#### Acceptance Criteria

1. THE Shot_Critique_Engine SHALL render critique annotations as compact inline badges on each shot card in the filmstrip.
2. WHEN the user hovers over or clicks a critique badge, THE Shot_Critique_Engine SHALL expand a tooltip or side panel showing the full note text and suggested fix.
3. THE Shot_Critique_Engine SHALL use gold-colored badges for Warning-level issues and cyan-colored badges for Note-level issues, consistent with the app's existing cinematic color theme.
4. THE Shot_Critique_Engine SHALL display a total critique count per scene in the scene header.
5. WHEN all critique issues for a shot are resolved or dismissed, THE Shot_Critique_Engine SHALL display a green "Clean" indicator on that shot card.
6. THE Shot_Critique_Engine SHALL support a "Run Full Critique" action that re-analyzes all shots in the current project and refreshes all annotations.

---

### Requirement 6: Shot Sequence Intelligence — Next-Shot Suggestion

**User Story:** As a filmmaker, I want the app to suggest the next logical shot after I add one, so that I can build cinematically coherent sequences faster without needing to recall grammar rules from memory.

#### Acceptance Criteria

1. THE Sequence_Intelligence SHALL operate exclusively using the Fast_Brain with a deterministic lookup table — no WebLLM model is required or used.
2. WHEN the user adds a shot to a scene, THE Sequence_Intelligence SHALL evaluate the current shot type and suggest the next logical shot type based on Cinematic_Grammar rules.
3. THE Sequence_Intelligence SHALL implement the following standard cinematic sequences as lookup rules:
   a. Push-in sequence: EWS → WS → MS → CU → ECU
   b. Pull-out sequence: ECU → CU → MS → WS → EWS
   c. Coverage sequence: WS → MS → CU (two-shot or single)
   d. Reaction sequence: CU (action) → CU (reaction) → MS (combined)
   e. Reveal sequence: CU (detail) → WS (context reveal)
4. WHEN a next-shot suggestion is available, THE Sequence_Intelligence SHALL render a Ghost_Card immediately after the last shot in the filmstrip.
5. THE Ghost_Card SHALL display the suggested shot type label, a brief rationale (e.g., "Push-in: next logical step"), and an "Add This Shot" action button.
6. WHEN the user clicks "Add This Shot" on the Ghost_Card, THE Sequence_Intelligence SHALL create a new shot pre-populated with the suggested shot type and inherit the scene's active Director_Style and location.
7. WHEN the user ignores the Ghost_Card and adds a different shot type manually, THE Sequence_Intelligence SHALL dismiss the Ghost_Card and re-evaluate based on the newly added shot.
8. THE Sequence_Intelligence SHALL display a maximum of one Ghost_Card at a time per scene.
9. WHEN the current shot sequence does not match any known Cinematic_Grammar pattern, THE Sequence_Intelligence SHALL not display a Ghost_Card.
10. THE Ghost_Card SHALL be visually distinct from real shot cards using a dashed border and reduced opacity, consistent with the app's liquid glass UI system.

---

### Requirement 7: Shot Sequence Intelligence — Suggestion Chip Variant

**User Story:** As a filmmaker, I want a compact suggestion indicator when I'm working in a condensed view, so that sequence suggestions don't take up too much space in my workspace.

#### Acceptance Criteria

1. WHEN the filmstrip is in a condensed or list view mode, THE Sequence_Intelligence SHALL render a Suggestion_Chip instead of a Ghost_Card.
2. THE Suggestion_Chip SHALL display the suggested shot type abbreviation and a "+" action to add the shot.
3. WHEN the user clicks the Suggestion_Chip "+" action, THE Sequence_Intelligence SHALL create the suggested shot with the same pre-population behavior as the Ghost_Card "Add This Shot" action.

---

### Requirement 8: Keyboard-First Power Mode — Core Shortcuts

**User Story:** As a power user, I want to control every major app action from the keyboard, so that I can build shot sequences at the speed of thought without reaching for the mouse.

#### Acceptance Criteria

1. THE Keyboard_Power_Mode SHALL implement the following global keyboard shortcuts:
   a. `N` — Create a new shot in the active scene
   b. `D` — Duplicate the currently selected shot
   c. `L` — Toggle Continuity_Lock on the currently selected shot
   d. `S` — Run Shotify on the currently selected shot
   e. `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) — Open the Command_Palette
   f. `?` — Open the Cheat_Sheet overlay
   g. `Escape` — Close any open overlay, panel, or modal
   h. `Arrow Up` / `Arrow Down` — Navigate between shots in the active scene
   i. `Arrow Left` / `Arrow Right` — Navigate between scenes
   j. `Enter` — Open the editor for the currently selected shot
   k. `Cmd+Z` / `Ctrl+Z` — Undo the last action
   l. `Cmd+Shift+Z` / `Ctrl+Shift+Z` — Redo the last undone action
   m. `Cmd+D` / `Ctrl+D` — Open the Director_Brain panel
   n. `Cmd+E` / `Ctrl+E` — Export the current project
2. WHEN a keyboard shortcut is triggered, THE Keyboard_Power_Mode SHALL execute the corresponding action within 50ms.
3. WHEN a text input field, textarea, or contenteditable element has focus, THE Keyboard_Power_Mode SHALL suppress single-key shortcuts (N, D, L, S, ?) to prevent accidental triggering.
4. THE Keyboard_Power_Mode SHALL NOT suppress modifier-key shortcuts (Cmd/Ctrl combinations) when a text input has focus.
5. WHEN the user triggers a shortcut that requires a selected shot but no shot is selected, THE Keyboard_Power_Mode SHALL display a brief toast notification indicating that a shot must be selected first.

---

### Requirement 9: Keyboard-First Power Mode — Command Palette

**User Story:** As a power user, I want a searchable command palette, so that I can discover and trigger any app action without memorizing every shortcut.

#### Acceptance Criteria

1. THE Command_Palette SHALL open as a centered modal overlay when triggered by `Cmd+K` / `Ctrl+K`.
2. THE Command_Palette SHALL display a search input field that is focused automatically when the palette opens.
3. WHEN the user types in the Command_Palette search field, THE Command_Palette SHALL filter the action list in real time and display matching results within 50ms of each keystroke.
4. THE Command_Palette SHALL list all available app actions including: shot actions, scene actions, export actions, settings actions, AI actions, and navigation actions.
5. WHEN the user selects an action from the Command_Palette using the keyboard (Arrow keys + Enter) or mouse click, THE Command_Palette SHALL execute the action and close the palette.
6. THE Command_Palette SHALL display the keyboard shortcut for each listed action alongside the action name.
7. THE Command_Palette SHALL display a "recently used" section showing the last 5 actions the user executed via the palette.
8. WHEN the Command_Palette is open, pressing `Escape` SHALL close the palette without executing any action.
9. THE Command_Palette SHALL use the app's existing liquid glass UI styling with the cinematic gold and cyan color theme.

---

### Requirement 10: Keyboard-First Power Mode — Cheat Sheet Overlay

**User Story:** As a new power user, I want a visual keyboard shortcut reference I can pull up instantly, so that I can learn the shortcuts without leaving the app or consulting external documentation.

#### Acceptance Criteria

1. THE Cheat_Sheet SHALL open as a full-screen or large modal overlay when the user presses `?`.
2. THE Cheat_Sheet SHALL display all keyboard shortcuts organized into logical groups: Shot Actions, Scene Actions, Navigation, AI Features, and App Controls.
3. THE Cheat_Sheet SHALL render each shortcut as a key combination visual (e.g., styled `kbd` elements) alongside a plain-language description of the action.
4. WHEN the user presses `Escape` or `?` again while the Cheat_Sheet is open, THE Cheat_Sheet SHALL close.
5. THE Cheat_Sheet SHALL be read-only and SHALL NOT allow the user to rebind shortcuts from within the overlay.
6. THE Cheat_Sheet SHALL use the app's liquid glass UI system and cinematic color theme for visual consistency.
7. THE Cheat_Sheet SHALL be accessible via the Command_Palette as a listed action in addition to the `?` shortcut.

---

### Requirement 11: Performance and Resource Constraints

**User Story:** As a filmmaker, I want the app to remain responsive at all times, so that AI features never degrade the core shot-building experience.

#### Acceptance Criteria

1. THE Fast_Brain SHALL consume no more than 5MB of memory for its rule base and template engine.
2. WHEN Deep Brain mode is not active, THE Director_Brain SHALL consume zero GPU or WebLLM engine resources.
3. WHEN the Deep_Brain model is loading, THE app SHALL remain fully interactive and all non-AI features SHALL continue to function normally.
4. THE Shot_Critique_Engine Fast_Brain analysis SHALL complete for a single shot within 100ms.
5. THE Sequence_Intelligence lookup SHALL complete within 10ms of a shot being added.
6. THE Keyboard_Power_Mode shortcut handler SHALL add no more than 1ms of overhead to the app's event loop per keypress.
7. IF the Deep_Brain WebLLM inference takes longer than 30 seconds for a single response, THEN THE Director_Brain SHALL display a timeout message and allow the user to cancel the request.
8. THE Director_Brain SHALL NOT re-initialize the WebLLM engine on every query — the engine SHALL be initialized once per session when Deep Mode is activated and reused for all subsequent queries.

---

### Requirement 12: Accessibility and Discoverability

**User Story:** As a new user, I want AI features and keyboard shortcuts to be discoverable without reading documentation, so that I can start using advanced features immediately.

#### Acceptance Criteria

1. THE Director_Brain panel SHALL display an onboarding tooltip on first open explaining the Fast Brain / Deep Brain distinction.
2. THE Shot_Critique_Engine SHALL display a brief explainer the first time a critique annotation appears on a shot.
3. THE Sequence_Intelligence Ghost_Card SHALL include a one-line explanation of the cinematic grammar rule driving the suggestion.
4. THE Keyboard_Power_Mode SHALL display a dismissible banner on first app launch informing the user that keyboard shortcuts are available and that `?` opens the cheat sheet.
5. THE Cheat_Sheet SHALL be reachable from the app's main navigation or help menu in addition to the `?` shortcut.
6. WHEN the user first activates Deep Brain mode, THE Director_Brain SHALL display a one-time explainer describing the model being loaded, its capabilities, and its limitations compared to Fast Brain.
