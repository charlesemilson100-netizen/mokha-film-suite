# Requirements Document

## Introduction

Director Agentic Mode is an upgrade to the existing Director Brain tab in MOKHA FILM Suite. It transforms the current read-only chat interface into an interactive cinematic co-director that can diagnose issues, propose concrete actions as clickable cards, and execute those actions on the project when the user confirms them.

The feature is built on top of the existing Director Intelligence Suite (Fast Brain + Deep Brain architecture). It does not replace the Director Brain tab — it extends it with a **propose + confirm** execution model: the Director Brain suggests specific, named actions; the user approves with one click; the action is then applied to the live project state.

The Director Brain also becomes more opinionated and cinematically fluent, using professional vocabulary (cold opens, visual anchors, coverage gaps, pacing, act structure, etc.) and making pro-level recommendations rather than generic observations.

No new npm dependencies. All code goes in the existing single HTML file.

---

## Glossary

- **Director_Brain**: The existing AI director chat panel component, now upgraded with agentic capabilities.
- **Action_Card**: A structured UI element rendered inside a Director Brain response that proposes a specific, executable action on the project (e.g., "Add EWS before shot 1", "Rewrite shot 3 in Villeneuve style").
- **Action_Proposal**: A single proposed change to the project state, encapsulated in an Action_Card. Contains a type, target, parameters, and a human-readable label.
- **Agentic_Response**: A Director Brain response that contains one or more Action_Cards in addition to (or instead of) plain text.
- **Confirm_Model**: The interaction pattern where the Director Brain proposes actions and the user must explicitly approve each one before it is applied. No silent auto-execution.
- **Execution_Engine**: The module responsible for applying a confirmed Action_Proposal to the live project state.
- **Cinematic_Vocabulary**: The set of professional filmmaking terms the Director Brain uses in its analysis and proposals (cold open, visual anchor, coverage gap, act break, pacing beat, motivated cut, eyeline match, etc.).
- **Intent_Parser**: The module that interprets natural language user input and maps it to a structured diagnostic or action intent.
- **Diagnostic_Response**: A Director Brain response that analyzes the project cinematically and identifies specific issues, without necessarily proposing actions.
- **Action_Type**: The category of a proposed action. Supported types: `ADD_SHOT`, `REWRITE_SHOT`, `REORDER_SHOTS`, `DELETE_SHOT`, `APPLY_STYLE`, `SPLIT_SCENE`, `ADD_SCENE`, `SET_FIELD`, `APPLY_PRESET`.
- **Shot_Preset**: A complete shot recipe combining shot type, lens, lighting, mood, and an optional subject note into a single named template (e.g., "Golden Hour CU", "Noir Interrogation MS"). Distinct from Director_Style, which applies a director's aesthetic across fields.
- **Preset_Palette**: A browsable UI panel listing all available Shot_Presets, accessible from the Director Brain chat.
- **Idea_Card**: A structured UI element rendered inside a Director Brain response that proposes a creative direction or shot sequence concept with a cinematic rationale. Not directly executable — must be expanded into Action_Cards before any change is applied.
- **Ideas_Mode**: The Director Brain operating mode in which it generates creative inspiration (Idea_Cards) rather than or in addition to diagnostic Action_Cards.
- **Explore_Action**: The user action on an Idea_Card that expands the idea into one or more concrete Action_Cards for review and confirmation.
- **Action_Status**: The lifecycle state of an Action_Card: `pending` → `confirmed` → `applied` | `rejected`.
- **Fast_Brain**: The existing always-on rule-based intelligence layer (unchanged).
- **Deep_Brain**: The existing optional WebLLM-powered intelligence layer (unchanged).
- **Project_State**: The complete in-memory state of the current project including all scenes, shots, characters, locations, and Director_Style presets.
- **Shot_Card**: The existing UI element representing a single shot in the filmstrip.
- **Director_Style**: The existing per-shot director style preset (e.g., Kubrick, Nolan, Villeneuve).
- **Undo_Stack**: The existing undo/redo history mechanism in the app.

---

## Requirements

---

### Requirement 1: Natural Language Intent Understanding

**User Story:** As a director, I want to describe problems in plain cinematic language, so that the Director Brain understands what I mean without requiring me to use specific commands or syntax.

#### Acceptance Criteria

1. WHEN the user submits a query containing a cinematic problem description (e.g., "my opening feels flat", "act 2 has no tension", "the pacing drags after scene 3"), THE Intent_Parser SHALL map the input to a structured diagnostic intent with a category, scope, and severity.
2. THE Intent_Parser SHALL recognize the following intent categories: `pacing`, `tension`, `coverage`, `continuity`, `style`, `emotional_arc`, `structure`, `character_presence`.
3. WHEN the user references a scene or shot by position (e.g., "scene 2", "the third shot", "my opening"), THE Intent_Parser SHALL resolve the reference to the corresponding entity in the Project_State.
4. WHEN the user uses colloquial cinematic language (e.g., "cold open", "act break", "money shot", "coverage"), THE Intent_Parser SHALL recognize these terms and map them to the appropriate diagnostic category.
5. IF the Intent_Parser cannot confidently map the input to a known intent category, THEN THE Director_Brain SHALL respond with a clarifying question that uses cinematic vocabulary to guide the user toward a more specific query.
6. THE Intent_Parser SHALL operate exclusively using the Fast_Brain rule layer — no WebLLM model invocation is required for intent parsing.

---

### Requirement 2: Cinematic Diagnostic Responses

**User Story:** As a director, I want the Director Brain to diagnose my project's issues using professional cinematic vocabulary, so that the feedback feels like it comes from a real co-director rather than a generic AI assistant.

#### Acceptance Criteria

1. WHEN the Director_Brain generates a diagnostic response, THE Director_Brain SHALL use Cinematic_Vocabulary appropriate to the identified issue category (e.g., "coverage gap", "visual anchor missing", "cold open lacks a hook", "act 2 tension plateau").
2. THE Director_Brain SHALL structure diagnostic responses with: a one-sentence cinematic diagnosis, a brief explanation of why it matters narratively, and a list of specific issues found in the project.
3. WHEN diagnosing a pacing issue, THE Director_Brain SHALL reference specific scene and shot numbers where the pacing problem occurs, not just a general observation.
4. WHEN diagnosing a structural issue, THE Director_Brain SHALL reference act structure conventions (three-act, five-act, or sequence-based) and identify which act or sequence is affected.
5. WHEN diagnosing a coverage issue, THE Director_Brain SHALL identify the specific shots that are missing (e.g., "Scene 2 has no establishing shot", "Shot 4 has no reaction coverage").
6. THE Director_Brain SHALL NOT use generic phrases like "looks good", "seems fine", or "you might want to consider" — all responses SHALL be specific, opinionated, and reference concrete project data.
7. WHERE Deep Brain mode is active, THE Director_Brain SHALL augment Fast_Brain diagnostic responses with nuanced creative observations about subtext, visual metaphor, and tonal consistency.

---

### Requirement 3: Action Card Proposals

**User Story:** As a director, I want the Director Brain to propose specific, clickable actions I can approve, so that I can act on its recommendations with one click instead of manually implementing each suggestion.

#### Acceptance Criteria

1. WHEN the Director_Brain identifies a fixable issue in the project, THE Director_Brain SHALL render one or more Action_Cards within the response alongside the diagnostic text.
2. THE Action_Card SHALL display: a short action label (e.g., "Add EWS before shot 1"), the Action_Type, the target scene/shot, a one-line rationale, and Confirm and Reject buttons.
3. THE Director_Brain SHALL support the following Action_Types in Action_Cards:
   a. `ADD_SHOT` — add a new shot at a specified position with specified type and optional style
   b. `REWRITE_SHOT` — rewrite a shot's prompt fields in a specified Director_Style
   c. `REORDER_SHOTS` — move a shot to a different position within a scene
   d. `DELETE_SHOT` — remove a shot from a scene
   e. `APPLY_STYLE` — apply a Director_Style preset to one or more shots
   f. `SPLIT_SCENE` — split a scene at a specified shot index into two scenes
   g. `ADD_SCENE` — add a new scene at a specified position
   h. `SET_FIELD` — set a specific field (e.g., location, lighting, lens) on a shot
   i. `APPLY_PRESET` — apply a named Shot_Preset to one or more shots, setting all preset fields (shot type, lens, lighting, mood, and optional subject note) in a single operation
4. WHEN a single diagnostic response addresses multiple issues, THE Director_Brain SHALL render multiple Action_Cards, one per proposed fix, grouped by scene.
5. THE Action_Card SHALL be visually distinct from plain text responses, using the app's existing cinematic gold and cyan color theme with a bordered card treatment.
6. WHEN the Director_Brain has no executable action to propose (e.g., the query is purely informational), THE Director_Brain SHALL render a Diagnostic_Response with no Action_Cards.
7. THE Director_Brain SHALL NOT propose more than 5 Action_Cards in a single response to avoid overwhelming the user.

---

### Requirement 4: Propose + Confirm Execution Model

**User Story:** As a director, I want to review and approve each proposed action before it's applied, so that I stay in full creative control and nothing changes in my project without my explicit consent.

#### Acceptance Criteria

1. THE Confirm_Model SHALL require explicit user confirmation for every Action_Proposal before any change is made to the Project_State.
2. WHEN the user clicks the Confirm button on an Action_Card, THE Execution_Engine SHALL apply the Action_Proposal to the Project_State immediately.
3. WHEN the user clicks the Reject button on an Action_Card, THE Action_Card SHALL update its status to `rejected` and no change SHALL be made to the Project_State.
4. WHEN an Action_Proposal is confirmed and applied, THE Action_Card SHALL update its status to `applied` and display a brief confirmation message (e.g., "✓ Shot added to Scene 1").
5. THE Execution_Engine SHALL NEVER apply any change to the Project_State without a corresponding user confirmation event.
6. WHEN multiple Action_Cards are present in a response, THE user SHALL be able to confirm or reject each one independently.
7. WHEN an Action_Proposal is applied, THE Execution_Engine SHALL push the change onto the existing Undo_Stack so the user can undo it with Cmd+Z / Ctrl+Z.
8. IF an Action_Proposal cannot be applied due to a conflict in the current Project_State (e.g., the target shot no longer exists), THEN THE Execution_Engine SHALL display an inline error on the Action_Card and mark it as `rejected` without modifying the Project_State.

---

### Requirement 5: Action Execution Engine

**User Story:** As a director, I want confirmed actions to be applied correctly and immediately to my project, so that the Director Brain's suggestions have real, visible impact on my work.

#### Acceptance Criteria

1. WHEN an `ADD_SHOT` action is confirmed, THE Execution_Engine SHALL insert a new shot at the specified position in the specified scene, pre-populated with the specified shot type, Director_Style, and any other specified fields.
2. WHEN a `REWRITE_SHOT` action is confirmed, THE Execution_Engine SHALL apply the specified Director_Style template to the target shot's prompt fields (subject, action, location, lighting, lens, mood) using the existing Fast_Brain style application logic.
3. WHEN a `REORDER_SHOTS` action is confirmed, THE Execution_Engine SHALL move the target shot to the specified position within its scene, updating all shot indices accordingly.
4. WHEN a `DELETE_SHOT` action is confirmed, THE Execution_Engine SHALL remove the target shot from its scene.
5. WHEN an `APPLY_STYLE` action is confirmed, THE Execution_Engine SHALL apply the specified Director_Style to all specified shots using the existing Fast_Brain style application logic.
6. WHEN a `SPLIT_SCENE` action is confirmed, THE Execution_Engine SHALL create a new scene containing all shots from the split index onward, and update the original scene to contain only the shots before the split index.
7. WHEN an `ADD_SCENE` action is confirmed, THE Execution_Engine SHALL insert a new empty scene at the specified position.
8. WHEN a `SET_FIELD` action is confirmed, THE Execution_Engine SHALL update the specified field on the target shot to the specified value.
9. WHEN an `APPLY_PRESET` action is confirmed, THE Execution_Engine SHALL apply the named Shot_Preset to all specified shots, overwriting the shot type, lens, lighting, mood, and subject note fields with the preset values.
10. THE Execution_Engine SHALL update the React app state using the existing state management patterns (setState / dispatch) so that all UI components re-render correctly after an action is applied.

---

### Requirement 6: Opinionated Pro-Level Recommendations

**User Story:** As a professional filmmaker, I want the Director Brain to give me bold, specific, opinionated recommendations rather than hedged suggestions, so that it feels like a real creative collaborator with a point of view.

#### Acceptance Criteria

1. THE Director_Brain SHALL make specific, directional recommendations rather than presenting multiple equal options (e.g., "Add an EWS here — you need spatial context before this CU" rather than "You could consider adding a wider shot").
2. WHEN the Director_Brain proposes a style rewrite, THE Director_Brain SHALL name the specific Director_Style and explain the cinematic rationale (e.g., "Rewrite in Villeneuve style — the current shot lacks the environmental dread this scene needs").
3. THE Director_Brain SHALL reference specific cinematic techniques by name in its rationale (e.g., "motivated cut", "eyeline match", "rack focus", "Dutch angle", "cold open hook").
4. WHEN the Director_Brain detects a structural problem, THE Director_Brain SHALL name the specific narrative convention being violated (e.g., "Act 2 midpoint is missing a tension escalation — this is where the protagonist's plan should fail").
5. THE Director_Brain SHALL prioritize the most impactful issue in a response rather than listing every possible problem — it SHALL act as an editor, not an auditor.
6. WHERE Deep Brain mode is active, THE Director_Brain SHALL generate more nuanced and stylistically specific recommendations that go beyond rule-based patterns.

---

### Requirement 7: Agentic Response Format

**User Story:** As a director, I want the Director Brain's responses to be structured and scannable, so that I can quickly understand the diagnosis and decide which actions to take.

#### Acceptance Criteria

1. THE Director_Brain SHALL structure every Agentic_Response with the following sections in order: diagnosis text, Action_Cards (if any), and a brief closing note on what to do next.
2. THE Director_Brain SHALL keep diagnosis text concise — no more than 4 sentences for the main diagnostic paragraph.
3. WHEN an Agentic_Response contains Action_Cards, THE Director_Brain SHALL render them in a visually grouped block below the diagnosis text, separated from the plain text by a visual divider.
4. THE Action_Card label SHALL be written in imperative form (e.g., "Add EWS before shot 1", "Rewrite shot 3 in Villeneuve style", "Split scene 2 at shot 5").
5. THE Director_Brain SHALL display the Action_Type as a small badge on each Action_Card (e.g., "ADD SHOT", "REWRITE", "REORDER").
6. WHEN an Action_Card's status changes to `applied` or `rejected`, THE Director_Brain SHALL update the card's visual state in-place without re-rendering the entire chat thread.

---

### Requirement 8: Session Continuity and Context Awareness

**User Story:** As a director, I want the Director Brain to remember what it has already proposed and applied in the current session, so that it doesn't repeat suggestions for issues that have already been addressed.

#### Acceptance Criteria

1. THE Director_Brain SHALL maintain a session-scoped log of all Action_Proposals and their statuses (pending, applied, rejected) within the current chat thread.
2. WHEN generating a new response, THE Director_Brain SHALL check the session log and SHALL NOT re-propose an action that has already been applied in the current session.
3. WHEN the user asks a follow-up question (e.g., "what else?", "anything in scene 3?"), THE Director_Brain SHALL use the session log to provide a response that builds on previous exchanges rather than starting fresh.
4. WHEN the user starts a new project or clears the chat, THE Director_Brain SHALL reset the session log.
5. THE Director_Brain SHALL reflect confirmed actions in its subsequent analysis — if the user confirmed an `ADD_SHOT` action, the next diagnostic response SHALL treat that shot as part of the project.

---

### Requirement 9: Integration with Existing Director Brain Tab

**User Story:** As a director, I want the agentic capabilities to feel like a natural extension of the existing Director Brain tab, so that the upgrade is seamless and doesn't break my existing workflow.

#### Acceptance Criteria

1. THE Director_Brain agentic mode SHALL be implemented within the existing Director Brain tab — no new tab or panel is added.
2. THE existing chat interface (message thread, input field, example query chips, Fast/Deep Brain toggle) SHALL remain fully functional after the upgrade.
3. WHEN the Director_Brain generates a plain text response (no executable actions), THE response SHALL render exactly as it does today using the existing `lg-bubble-bot` styling.
4. WHEN the Director_Brain generates an Agentic_Response, THE Action_Cards SHALL be rendered inline within the bot message bubble, below the diagnostic text.
5. THE existing `BrainRouter` routing logic (Fast Brain pattern matching → Deep Brain fallback) SHALL be preserved and extended, not replaced.
6. THE existing keyboard shortcut `Cmd+D` / `Ctrl+D` to open the Director Brain panel SHALL continue to work.
7. THE existing onboarding tooltip and example query chips SHALL be updated to reflect the new agentic capabilities.
8. WHEN the Director_Brain panel is opened, THE Director_Brain SHALL automatically scan the current scene and surface the single highest-priority issue as a proactive Agentic_Response, without requiring the user to submit a query.

---

### Requirement 10: Performance and Safety Constraints

**User Story:** As a filmmaker, I want the agentic features to be fast and safe, so that the Director Brain never slows down my workflow or makes unexpected changes to my project.

#### Acceptance Criteria

1. THE Intent_Parser SHALL complete intent classification within 50ms of receiving user input.
2. THE Execution_Engine SHALL apply a confirmed action to the Project_State within 100ms of the user clicking Confirm.
3. THE Director_Brain SHALL generate Action_Card proposals using the Fast_Brain rule layer within 200ms for queries that match known patterns.
4. THE Execution_Engine SHALL validate every Action_Proposal against the current Project_State before applying it, and SHALL reject invalid proposals without modifying state.
5. THE Director_Brain SHALL NOT auto-execute any action — every state change MUST be preceded by an explicit user confirmation event.
6. WHEN the user confirms an action, THE Execution_Engine SHALL apply the change atomically — either the full action is applied or no change is made (no partial state mutations).
7. THE agentic features SHALL add no more than 2MB of additional JavaScript to the existing single-file app.

---

### Requirement 11: Quick Shot Presets

**User Story:** As a director, I want to apply a complete shot recipe in one click, so that I can instantly set shot type, lens, lighting, and mood together without configuring each field individually.

#### Acceptance Criteria

1. THE Director_Brain SHALL maintain a built-in library of named Shot_Presets, each defining: a preset name, shot type, lens, lighting, mood, and an optional subject note.
2. THE Director_Brain SHALL include at minimum the following Shot_Presets in the built-in library: "Golden Hour CU", "Noir Interrogation MS", "Handheld Chase WS", "Kubrick Symmetry WS".
3. WHEN the Director_Brain proposes applying a Shot_Preset, THE Director_Brain SHALL render an Action_Card with Action_Type `APPLY_PRESET`, displaying the preset name, a summary of all preset fields, and the target shot(s).
4. WHEN the user asks the Director_Brain to show shot presets (e.g., "show me shot presets for this scene", "what presets work here?"), THE Director_Brain SHALL open the Preset_Palette and surface the most contextually relevant presets for the current scene based on its genre, lighting, and mood fields.
5. THE Preset_Palette SHALL display all available Shot_Presets as browsable cards, each showing the preset name, shot type badge, and a one-line description of the cinematic effect.
6. WHEN the user selects a preset from the Preset_Palette, THE Director_Brain SHALL render an `APPLY_PRESET` Action_Card targeting the currently selected shot, following the standard Confirm_Model before any change is applied.
7. THE Shot_Preset library SHALL be distinct from the Director_Style presets — a Shot_Preset defines concrete field values, while a Director_Style applies a director's aesthetic transformation.
8. WHEN an `APPLY_PRESET` Action_Card is confirmed, THE Execution_Engine SHALL apply all preset fields atomically and push the change onto the Undo_Stack as a single undoable operation.

---

### Requirement 12: Ideas Mode

**User Story:** As a director, I want the Director Brain to generate creative inspiration and shot sequence concepts, so that I can explore cinematic possibilities beyond diagnosing problems.

#### Acceptance Criteria

1. WHEN the user submits a query expressing a desire for creative ideas (e.g., "give me ideas for this scene", "what would make this more cinematic?", "how could I open this differently?"), THE Director_Brain SHALL enter Ideas_Mode and generate one or more Idea_Cards rather than diagnostic Action_Cards.
2. WHEN the Director_Brain proactively identifies a creative opportunity in the current scene (distinct from a problem or error), THE Director_Brain SHALL generate an Idea_Card alongside or instead of a diagnostic response.
3. THE Idea_Card SHALL display: a concept title, a brief cinematic rationale (no more than 3 sentences), the shot sequence or creative direction being proposed, and two actions: "Explore" and "Dismiss".
4. THE Idea_Card SHALL be visually distinct from Action_Cards — using a different border treatment or color accent — to make clear that it is not directly executable.
5. WHEN the user clicks "Explore" on an Idea_Card, THE Director_Brain SHALL expand the idea into one or more concrete Action_Cards that the user can review and confirm individually using the standard Confirm_Model.
6. WHEN the user clicks "Dismiss" on an Idea_Card, THE Idea_Card SHALL be marked dismissed and no change SHALL be made to the Project_State.
7. THE Director_Brain SHALL NOT auto-execute any change from an Idea_Card — the Explore action only generates Action_Cards for review; execution still requires explicit user confirmation per Requirement 4.
8. THE Director_Brain SHALL NOT render more than 3 Idea_Cards in a single response to avoid overwhelming the user.
9. WHEN the Director_Brain generates both Idea_Cards and Action_Cards in the same response, THE Action_Cards SHALL be rendered first (diagnostic fixes), followed by Idea_Cards (creative opportunities), with a visual separator between the two groups.
10. THE Intent_Parser SHALL recognize Ideas_Mode intent as a distinct category from diagnostic intent, and SHALL route ideas queries to the Ideas_Mode response path rather than the standard diagnostic path.
