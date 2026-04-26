# Design Document: Director Intelligence Suite

## Overview

The Director Intelligence Suite adds four interconnected AI-powered features to MOKHA FILM Suite PRO — a single-file Electron + React 18 app (~17,000 lines, all logic in one `<script type="text/babel">` block). The suite is designed to integrate seamlessly into the existing architecture: no new npm dependencies, no new files, all components defined inside the existing Babel script block, all styling via existing Tailwind classes and the liquid glass (`.lg-*`) system.

The four features share a common **Dual-Brain Architecture** foundation:

- **Fast Brain** — Always-on, zero-latency, rule-based JS object. Handles ~80% of use cases with no model loading. Covers director style rewrites, continuity checks, emotional arc analysis, pacing, shot type distribution, lighting conflicts, character consistency, and more (20+ patterns).
- **Deep Brain** — Optional WebLLM wrapper, lazy-initialized only when the user enables Deep Mode in Settings. Uses SmolLM2-360M-Instruct-q4f16_1-MLC or Qwen2.5-0.5B-Instruct-q4f16_1-MLC (never Phi-3).
- **BrainRouter** — Decides which brain handles a query via pattern matching. Rule-matching queries always go to Fast Brain; unmatched open-ended queries go to Deep Brain when active.

The four features built on this foundation are:

1. **Director Brain Chat Panel** — Extends the existing MOKHA Agent lg-panel FAB with full project context awareness and the Dual-Brain routing layer.
2. **Shot Critique Engine** — Per-shot director's notes with inline badges on shot cards, driven by Fast Brain rules and optionally enriched by Deep Brain.
3. **Shot Sequence Intelligence** — Deterministic cinematic grammar lookup table that renders a Ghost Card after the last shot in the filmstrip.
4. **Keyboard-First Power Mode** — Global shortcut registry, extended Command Palette with recently-used section, and a full-screen Cheat Sheet overlay.

### Key Design Decisions

1. **Extend, don't replace the MOKHA Agent panel**: The existing `MokhaAgentPanel` component (lg-panel FAB, bottom-right) is extended with a new "Director Brain" tab and the Dual-Brain routing layer. The existing chat thread, lg-bubble-bot/user classes, and lg-chip quick actions are reused.
2. **Fast Brain as a plain JS object**: No class instantiation overhead. The rule base is a static array of pattern objects evaluated synchronously. Total memory footprint is well under 5MB.
3. **Deep Brain lazy initialization**: The WebLLM `MLCEngine` is created only once per session when the user confirms Deep Mode. It is stored in a React ref (`deepBrainEngineRef`) to avoid re-renders on engine state changes.
4. **Shot Critique as a useEffect side effect**: Critique analysis runs in a `useEffect` watching the `shots` array. It is debounced at 300ms to avoid thrashing on rapid edits. Results are stored in a separate `critiqueAnnotations` state map keyed by shot ID.
5. **Sequence Intelligence as a pure lookup**: No state, no side effects beyond rendering the Ghost Card. The lookup table is a plain JS object. The Ghost Card is rendered inline in the filmstrip JSX as a conditional element after the last shot.
6. **Keyboard shortcuts via a single global useEffect**: One `document.addEventListener('keydown', handler)` registered in a `useEffect` in the root App component. The handler reads a `shortcutRegistry` object and dispatches to action callbacks. Input focus suppression is handled by checking `document.activeElement.tagName`.
7. **Brain Status Indicator in the app header**: A small pill component rendered in the existing top header bar, between the existing auto-save indicator and the settings button. Uses gold for Fast Mode and cyan for Deep Mode, consistent with the cinematic theme.

---

## Architecture

### High-Level Component Hierarchy

```
App (root React component)
├── Header
│   ├── [existing controls]
│   └── BrainStatusIndicator          ← NEW: pill showing FAST/DEEP mode
├── [existing sidebar, scene tabs, filmstrip]
│   └── FilmstripView
│       ├── ShotCard (×N)
│       │   └── CritiqueBadge[]       ← NEW: inline annotation badges
│       └── GhostCard | SuggestionChip ← NEW: next-shot suggestion
├── MokhaAgentPanel (existing lg-panel FAB)
│   └── [extended with Director Brain tab + BrainRouter]
├── CommandPalette (existing, extended)  ← EXTENDED: AI actions + recently used
├── CheatSheetOverlay                 ← NEW: full-screen shortcut reference
└── [existing modals, toasts, etc.]
```

### Data Flow

```
User action / shot change
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  BrainRouter.route(query, projectSnapshot)                  │
│  ┌──────────────────────┐   ┌──────────────────────────┐   │
│  │  FastBrain           │   │  DeepBrain               │   │
│  │  .match(query)       │   │  .generate(query,        │   │
│  │  → rule patterns     │   │    context, engine)      │   │
│  │  → template engine   │   │  → window.webllm         │   │
│  │  sync, <100ms        │   │  async, lazy-init        │   │
│  └──────────────────────┘   └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Feature consumers                                          │
│  • DirectorBrainPanel  → chat thread response               │
│  • ShotCritiqueEngine  → critiqueAnnotations state map      │
│  • SequenceIntelligence → ghostCardSuggestion (pure lookup) │
│  • KeyboardPowerMode   → shortcutRegistry dispatch          │
└─────────────────────────────────────────────────────────────┘
```

### Brain Mode State Machine

```
         ┌─────────────────────────────────────────┐
         │              FAST MODE                  │
         │  brainMode = 'fast'                     │
         │  deepBrainEngineRef.current = null       │
         │  BrainStatusIndicator: gold "FAST ⚡"   │
         └──────────────┬──────────────────────────┘
                        │ user enables Deep Mode
                        │ + confirms download
                        ▼
         ┌─────────────────────────────────────────┐
         │           DEEP LOADING                  │
         │  brainMode = 'deep-loading'             │
         │  BrainStatusIndicator: "Loading X%"     │
         └──────────────┬──────────────────────────┘
                        │ engine ready
                        ▼
         ┌─────────────────────────────────────────┐
         │              DEEP MODE                  │
         │  brainMode = 'deep'                     │
         │  deepBrainEngineRef.current = MLCEngine │
         │  BrainStatusIndicator: cyan "DEEP 🧠"  │
         └──────────────┬──────────────────────────┘
                        │ user switches back
                        │ engine.unload()
                        ▼
                    FAST MODE
```

---
## Components and Interfaces

### 1. BrainStatusIndicator

A small pill rendered in the app header. Reads `brainMode` state from the root App component via props.

```jsx
// Placement: inside the existing header bar, right of AutoSaveIndicator
const BrainStatusIndicator = ({ brainMode, loadingProgress }) => {
    if (brainMode === 'deep-loading') return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10 text-[9px] font-black text-accent uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"/>
            {loadingProgress || 'Loading...'}
        </div>
    );
    if (brainMode === 'deep') return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10 text-[9px] font-black text-accent uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-accent"/>
            DEEP 🧠
        </div>
    );
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-[9px] font-black text-primary uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"/>
            FAST ⚡
        </div>
    );
};
```

### 2. FastBrain Module

A plain JS object (not a React component) defined at module scope inside the Babel script block. Initialized once, never re-created.

```js
const FastBrain = {
    // Rule pattern registry — 20+ entries
    patterns: FAST_BRAIN_PATTERNS, // see Data Models section

    // Match a query against all patterns, return first match or null
    match(query, projectSnapshot) {
        const q = query.toLowerCase().trim();
        for (const pattern of this.patterns) {
            if (pattern.test(q, projectSnapshot)) {
                return pattern.respond(q, projectSnapshot);
            }
        }
        return null;
    },

    // Template engine: apply a director style to a scene's shots
    applyDirectorStyle(scene, styleName) { /* ... */ },

    // Emotional arc analysis against checklist
    analyzeEmotionalArc(shots) { /* ... */ },

    // Continuity check between consecutive shots
    checkContinuity(shotA, shotB) { /* ... */ },

    // Lighting conflict detection
    checkLightingConflict(shotA, shotB) { /* ... */ },

    // Shot type distribution analysis
    analyzeShotDistribution(shots) { /* ... */ },

    // Critique a single shot prompt
    critiqueShot(shot, prevShot, allShots) { /* returns CritiqueAnnotation[] */ },
};
```

### 3. DeepBrain Module

A plain JS object wrapping `window.webllm`. The MLCEngine instance is stored externally in a React ref to avoid re-renders.

```js
const DeepBrain = {
    SUPPORTED_MODELS: [
        { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'SmolLM2 360M (Fast, ~200MB)' },
        { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 0.5B (Balanced, ~300MB)' },
    ],

    // Initialize the engine — called once per session
    async init(modelId, onProgress, engineRef) {
        if (!window.webllm) throw new Error('WebLLM not loaded');
        const engine = new window.webllm.MLCEngine();
        engine.setInitProgressCallback(p => onProgress(Math.round(p.progress * 100)));
        await engine.reload(modelId);
        engineRef.current = engine;
    },

    // Generate a response — engine must already be initialized
    async generate(prompt, engineRef, signal) {
        if (!engineRef.current) throw new Error('Deep Brain not initialized');
        const reply = await engineRef.current.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            stream: false,
        });
        return reply.choices[0].message.content;
    },

    // Release engine resources
    async unload(engineRef) {
        if (engineRef.current) {
            await engineRef.current.unload?.();
            engineRef.current = null;
        }
    },
};
```

### 4. BrainRouter

```js
const BrainRouter = {
    // Route a query to the appropriate brain
    // Returns { source: 'fast'|'deep', response: string|Promise<string> }
    async route(query, projectSnapshot, brainMode, deepBrainEngineRef) {
        const fastResult = FastBrain.match(query, projectSnapshot);
        if (fastResult !== null) {
            return { source: 'fast', response: fastResult };
        }
        if (brainMode === 'deep' && deepBrainEngineRef.current) {
            const contextPrompt = buildContextPrompt(query, projectSnapshot);
            const response = await DeepBrain.generate(contextPrompt, deepBrainEngineRef);
            return { source: 'deep', response };
        }
        // Fast Brain fallback when no match and Deep Brain not active
        return { source: 'fast', response: FastBrain.getFallbackResponse(query) };
    },
};
```

### 5. DirectorBrainPanel

Extends the existing `MokhaAgentPanel` component. A new "Director" tab is added to the existing tab bar. The Director tab renders the Director Brain chat thread using the existing `lg-bubble-bot` / `lg-bubble-user` classes.

```jsx
// New tab added to existing MokhaAgentPanel tab bar:
// 'chat' | 'challenge' | 'stats' | 'director'  ← new

const DirectorBrainPanel = ({
    brainMode, deepBrainEngineRef, projectSnapshot,
    onBrainModeChange, loadingProgress,
}) => {
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [timeoutId, setTimeoutId] = React.useState(null);
    const messagesEndRef = React.useRef(null);

    const EXAMPLE_QUERIES = [
        'Rewrite scene 1 as a Kubrick cold open',
        'What emotional beats are missing from this sequence?',
        'Check continuity across all shots',
        'Analyze pacing — is it too slow?',
        'What shot types am I overusing?',
        'Suggest coverage for scene 2',
    ];

    const handleSubmit = async () => { /* BrainRouter.route(...) */ };

    return (
        <div className="flex flex-col h-full">
            {/* Onboarding tooltip (first open only) */}
            {/* Chat thread */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {messages.map((msg, i) => (
                    <div key={i} className={msg.role === 'user' ? 'lg-bubble-user lg-bubble-enter' : 'lg-bubble-bot lg-bubble-enter'}>
                        {msg.content}
                        {msg.source === 'deep' && <span className="text-[8px] text-accent ml-2">DEEP</span>}
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>
            {/* Example query chips (shown when no messages) */}
            {messages.length === 0 && (
                <div className="lg-chips-row flex-wrap gap-1">
                    {EXAMPLE_QUERIES.map(q => (
                        <button key={q} className="lg-chip text-[10px]" onClick={() => setInput(q)}>{q}</button>
                    ))}
                </div>
            )}
            {/* Input bar */}
            <div className="lg-input-bar flex items-center gap-2 p-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                    placeholder="Ask your director..." className="flex-1 bg-transparent text-sm outline-none"/>
                <button onClick={handleSubmit} disabled={isGenerating} className="text-primary hover:text-primaryHover">
                    <Icon name="Send" size={16}/>
                </button>
            </div>
        </div>
    );
};
```

### 6. ShotCritiqueEngine

Not a React component — a module-level object that exposes a `critiqueShot` function. Results are stored in the root App's `critiqueAnnotations` state.

```jsx
// In root App component:
const [critiqueAnnotations, setCritiqueAnnotations] = React.useState({});
// Shape: { [shotId: string]: CritiqueAnnotation[] }

const [dismissedAnnotations, setDismissedAnnotations] = React.useState({});
// Shape: { [annotationId: string]: true }

// Runs on shot changes (debounced 300ms)
useEffect(() => {
    const timer = setTimeout(() => {
        const newAnnotations = {};
        shots.forEach((shot, idx) => {
            const prevShot = shots[idx - 1] || null;
            const notes = FastBrain.critiqueShot(shot, prevShot, shots);
            if (notes.length > 0) newAnnotations[shot.id] = notes;
        });
        setCritiqueAnnotations(newAnnotations);
    }, 300);
    return () => clearTimeout(timer);
}, [shots]);
```

### 7. CritiqueBadge

Rendered inline on each ShotCard. Reads from `critiqueAnnotations[shot.id]`.

```jsx
const CritiqueBadge = ({ annotation, onDismiss }) => {
    const [expanded, setExpanded] = React.useState(false);
    const colorCls = annotation.severity === 'warning'
        ? 'bg-primary/20 border-primary/40 text-primary'
        : 'bg-accent/20 border-accent/40 text-accent';
    return (
        <div className="relative">
            <button onClick={() => setExpanded(p => !p)}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${colorCls} uppercase tracking-wide`}>
                {annotation.severity === 'warning' ? '⚠' : '💡'} {annotation.code}
            </button>
            {expanded && (
                <div className="absolute bottom-full left-0 mb-1 w-56 p-2.5 rounded-xl bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark shadow-2xl z-50 text-[10px]">
                    <p className="text-textMain-light dark:text-textMain-dark mb-1">{annotation.message}</p>
                    {annotation.suggestion && <p className="text-textMuted-light dark:text-textMuted-dark italic">{annotation.suggestion}</p>}
                    <button onClick={() => onDismiss(annotation.id)} className="mt-1.5 text-[9px] text-textMuted-light dark:text-textMuted-dark hover:text-primary">Dismiss</button>
                </div>
            )}
        </div>
    );
};
```

### 8. GhostCard

Rendered after the last shot in the filmstrip when a suggestion is available.

```jsx
const GhostCard = ({ suggestion, onAccept, onDismiss }) => (
    <div className="filmstrip-frame w-32 h-44 flex-shrink-0 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl opacity-50 hover:opacity-80 transition-opacity flex flex-col items-center justify-center gap-2 p-2 cursor-pointer"
        onClick={onAccept}>
        <div className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest text-center">
            {suggestion.shotType}
        </div>
        <div className="text-[8px] text-textMuted-light dark:text-textMuted-dark text-center italic">
            {suggestion.rationale}
        </div>
        <button className="text-[9px] px-2 py-0.5 rounded bg-primary/20 border border-primary/40 text-primary font-bold hover:bg-primary/30 transition-colors">
            + Add This Shot
        </button>
    </div>
);
```

### 9. SuggestionChip

Compact variant for condensed/list view.

```jsx
const SuggestionChip = ({ suggestion, onAccept }) => (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-dashed border-border-light dark:border-border-dark opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase">
            {suggestion.abbreviation}
        </span>
        <button onClick={onAccept} className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black flex items-center justify-center hover:bg-primary/40">
            +
        </button>
    </div>
);
```

### 10. CheatSheetOverlay

Full-screen liquid glass overlay triggered by `?` key.

```jsx
const CheatSheetOverlay = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape' || e.key === '?') onClose(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] lg-panel flex items-center justify-center p-8" onClick={onClose}>
            <div className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl p-6 animate-palette-in"
                onClick={e => e.stopPropagation()}>
                <div className="lg-header px-4 py-3 -mx-6 -mt-6 mb-4 rounded-t-2xl flex items-center justify-between">
                    <span className="text-sm font-black text-textMain-light dark:text-textMain-dark uppercase tracking-widest">⌨ Keyboard Shortcuts</span>
                    <button onClick={onClose} className="text-textMuted-light dark:text-textMuted-dark hover:text-primary"><Icon name="X" size={16}/></button>
                </div>
                {SHORTCUT_GROUPS.map(group => (
                    <div key={group.label} className="mb-5">
                        <div className="text-[9px] font-black text-textMuted-light dark:text-textMuted-dark uppercase tracking-widest mb-2">{group.label}</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {group.shortcuts.map(s => (
                                <div key={s.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-input-light dark:bg-input-dark">
                                    <span className="text-xs text-textMain-light dark:text-textMain-dark">{s.description}</span>
                                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark font-mono text-primary">{s.display}</kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
};
```

---
## Data Models

### FastBrain Rule Pattern Structure

Each pattern is an object with a `test` predicate and a `respond` function. The full registry (`FAST_BRAIN_PATTERNS`) is a static array defined at module scope.

```js
// Type definition (JSDoc)
/**
 * @typedef {Object} FastBrainPattern
 * @property {string} id          - Unique pattern identifier
 * @property {string} category    - 'style'|'continuity'|'emotional'|'pacing'|'coverage'|'lighting'|'character'|'distribution'|'general'
 * @property {string} description - Human-readable description of what this pattern handles
 * @property {function(string, ProjectSnapshot): boolean} test - Returns true if this pattern handles the query
 * @property {function(string, ProjectSnapshot): string}  respond - Returns the Fast Brain response string
 */

const FAST_BRAIN_PATTERNS = [
    // ── Director Style Rewrites (5 patterns) ──────────────────────────────
    {
        id: 'style_kubrick',
        category: 'style',
        description: 'Rewrite scene in Kubrick style',
        test: (q) => /kubrick/.test(q) && /rewrite|apply|style/.test(q),
        respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'kubrick'),
    },
    {
        id: 'style_nolan',
        category: 'style',
        description: 'Rewrite scene in Nolan style',
        test: (q) => /nolan/.test(q) && /rewrite|apply|style/.test(q),
        respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'nolan'),
    },
    {
        id: 'style_villeneuve',
        category: 'style',
        description: 'Rewrite scene in Villeneuve style',
        test: (q) => /villeneuve/.test(q) && /rewrite|apply|style/.test(q),
        respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'villeneuve'),
    },
    {
        id: 'style_tarantino',
        category: 'style',
        description: 'Rewrite scene in Tarantino style',
        test: (q) => /tarantino/.test(q) && /rewrite|apply|style/.test(q),
        respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'tarantino'),
    },
    {
        id: 'style_scorsese',
        category: 'style',
        description: 'Rewrite scene in Scorsese style',
        test: (q) => /scorsese/.test(q) && /rewrite|apply|style/.test(q),
        respond: (q, snap) => FastBrain.applyDirectorStyle(resolveScene(q, snap), 'scorsese'),
    },
    // ── Continuity Checks (3 patterns) ────────────────────────────────────
    {
        id: 'continuity_check',
        category: 'continuity',
        description: 'Check continuity across all shots',
        test: (q) => /continuity|consistent|match/.test(q),
        respond: (q, snap) => FastBrain.runContinuityReport(snap),
    },
    {
        id: 'continuity_costume',
        category: 'continuity',
        description: 'Check costume/wardrobe continuity',
        test: (q) => /costume|wardrobe|outfit|clothing/.test(q),
        respond: (q, snap) => FastBrain.checkCostumeConsistency(snap),
    },
    {
        id: 'continuity_location',
        category: 'continuity',
        description: 'Check location continuity',
        test: (q) => /location|setting|place|where/.test(q) && /continuity|consistent|match/.test(q),
        respond: (q, snap) => FastBrain.checkLocationConsistency(snap),
    },
    // ── Emotional Arc (2 patterns) ─────────────────────────────────────────
    {
        id: 'emotional_missing',
        category: 'emotional',
        description: 'Identify missing emotional beats',
        test: (q) => /emotion|feeling|missing|gap|arc/.test(q),
        respond: (q, snap) => FastBrain.analyzeEmotionalArc(snap.activeScene.shots),
    },
    {
        id: 'emotional_tension',
        category: 'emotional',
        description: 'Analyze tension build in sequence',
        test: (q) => /tension|build|escalat|climax/.test(q),
        respond: (q, snap) => FastBrain.analyzeTensionArc(snap.activeScene.shots),
    },
    // ── Pacing (2 patterns) ───────────────────────────────────────────────
    {
        id: 'pacing_analysis',
        category: 'pacing',
        description: 'Analyze overall pacing',
        test: (q) => /pac(e|ing)|slow|fast|rhythm|tempo/.test(q),
        respond: (q, snap) => FastBrain.analyzePacing(snap.activeScene.shots),
    },
    {
        id: 'pacing_cuts',
        category: 'pacing',
        description: 'Analyze cut frequency',
        test: (q) => /cut|edit|transition|frequency/.test(q) && /pac(e|ing)|too many|too few/.test(q),
        respond: (q, snap) => FastBrain.analyzeCutFrequency(snap.activeScene.shots),
    },
    // ── Shot Type Distribution (2 patterns) ──────────────────────────────
    {
        id: 'distribution_overuse',
        category: 'distribution',
        description: 'Detect overused shot types',
        test: (q) => /overus|too many|repeat|variety|distribution/.test(q),
        respond: (q, snap) => FastBrain.analyzeShotDistribution(snap.activeScene.shots),
    },
    {
        id: 'distribution_coverage',
        category: 'coverage',
        description: 'Check for missing coverage shots',
        test: (q) => /coverage|cover|establish|close.?up|missing shot/.test(q),
        respond: (q, snap) => FastBrain.checkCoverage(snap.activeScene.shots),
    },
    // ── Lighting (2 patterns) ─────────────────────────────────────────────
    {
        id: 'lighting_conflict',
        category: 'lighting',
        description: 'Detect lighting conflicts between shots',
        test: (q) => /light(ing)?|conflict|inconsist/.test(q),
        respond: (q, snap) => FastBrain.checkLightingConflicts(snap.activeScene.shots),
    },
    {
        id: 'lighting_suggest',
        category: 'lighting',
        description: 'Suggest lighting for a shot',
        test: (q) => /suggest.*light|what.*light|light.*suggest/.test(q),
        respond: (q, snap) => FastBrain.suggestLighting(q, snap),
    },
    // ── Character Consistency (2 patterns) ───────────────────────────────
    {
        id: 'character_consistency',
        category: 'character',
        description: 'Check character consistency across shots',
        test: (q) => /character|actor|person|subject/.test(q) && /consistent|same|match|continuity/.test(q),
        respond: (q, snap) => FastBrain.checkCharacterConsistency(snap),
    },
    {
        id: 'character_missing',
        category: 'character',
        description: 'Identify missing character reactions',
        test: (q) => /reaction|response|character.*missing|missing.*character/.test(q),
        respond: (q, snap) => FastBrain.findMissingReactions(snap.activeScene.shots),
    },
    // ── General / Project-level (4 patterns) ─────────────────────────────
    {
        id: 'project_summary',
        category: 'general',
        description: 'Summarize the current project',
        test: (q) => /summar|overview|what.*project|describe.*project/.test(q),
        respond: (q, snap) => FastBrain.summarizeProject(snap),
    },
    {
        id: 'scene_summary',
        category: 'general',
        description: 'Summarize a specific scene',
        test: (q) => /summar.*scene|scene.*summar|what.*scene|describe.*scene/.test(q),
        respond: (q, snap) => FastBrain.summarizeScene(resolveScene(q, snap)),
    },
    {
        id: 'shot_count',
        category: 'general',
        description: 'Report shot counts and statistics',
        test: (q) => /how many|count|total|number of/.test(q) && /shot|scene/.test(q),
        respond: (q, snap) => FastBrain.reportStats(snap),
    },
    {
        id: 'export_help',
        category: 'general',
        description: 'Help with export options',
        test: (q) => /export|download|save|pdf|json/.test(q),
        respond: () => FastBrain.getExportHelp(),
    },
];
```

### Cinematic Grammar Lookup Table

```js
/**
 * @typedef {Object} GrammarTransition
 * @property {string} nextShotType   - Suggested next shot type abbreviation
 * @property {string} fullName       - Full shot type name
 * @property {string} rationale      - One-line explanation shown in Ghost Card
 * @property {string} sequence       - Which named sequence this belongs to
 */

/**
 * @typedef {Object.<string, GrammarTransition>} CinematicGrammarTable
 * Key: current shot type abbreviation
 */

const CINEMATIC_GRAMMAR = {
    // Push-in sequence: EWS → WS → MS → CU → ECU
    'EWS': { nextShotType: 'WS',  fullName: 'Wide Shot',           rationale: 'Push-in: establish then approach',    sequence: 'push-in' },
    'WS':  { nextShotType: 'MS',  fullName: 'Medium Shot',         rationale: 'Push-in: move closer to subject',     sequence: 'push-in' },
    'MS':  { nextShotType: 'CU',  fullName: 'Close-Up',            rationale: 'Push-in: isolate subject emotion',    sequence: 'push-in' },
    'CU':  { nextShotType: 'ECU', fullName: 'Extreme Close-Up',    rationale: 'Push-in: maximum intimacy/tension',   sequence: 'push-in' },

    // Pull-out sequence: ECU → CU → MS → WS → EWS
    'ECU': { nextShotType: 'CU',  fullName: 'Close-Up',            rationale: 'Pull-out: reveal context gradually',  sequence: 'pull-out' },
    // CU → MS already covered above (push-in takes priority; pull-out is reverse)
    // MS → WS
    // WS → EWS

    // Coverage sequence: WS → MS → CU (two-shot or single)
    // (WS → MS already covered; MS → CU already covered)

    // Reaction sequence: CU (action) → CU (reaction) → MS (combined)
    'CU_REACTION': { nextShotType: 'MS', fullName: 'Medium Shot (combined)', rationale: 'Reaction: show combined response', sequence: 'reaction' },

    // Reveal sequence: CU (detail) → WS (context reveal)
    'CU_DETAIL': { nextShotType: 'WS', fullName: 'Wide Shot (reveal)', rationale: 'Reveal: expand from detail to context', sequence: 'reveal' },

    // OTS (Over-the-Shoulder) → CU is a common coverage move
    'OTS': { nextShotType: 'CU',  fullName: 'Close-Up',            rationale: 'Coverage: push to single after OTS',  sequence: 'coverage' },

    // Two-Shot → OTS is standard dialogue coverage
    'TWO': { nextShotType: 'OTS', fullName: 'Over-the-Shoulder',   rationale: 'Coverage: break two-shot into singles', sequence: 'coverage' },

    // POV → Reaction is a classic Kuleshov edit
    'POV': { nextShotType: 'CU',  fullName: 'Close-Up (reaction)', rationale: 'Kuleshov: show reaction to POV',      sequence: 'reaction' },

    // Insert → MS is a standard return from insert
    'INSERT': { nextShotType: 'MS', fullName: 'Medium Shot',       rationale: 'Return: re-establish after insert',   sequence: 'coverage' },
};

// Abbreviation map for Suggestion Chip display
const SHOT_TYPE_ABBREVIATIONS = {
    'Extreme Wide Shot (EWS)': 'EWS',
    'Wide Shot (WS)': 'WS',
    'Medium Shot (MS)': 'MS',
    'Close-Up (CU)': 'CU',
    'Extreme Close-Up (ECU)': 'ECU',
    'Over-the-Shoulder (OTS)': 'OTS',
    'Two-Shot': 'TWO',
    'Point of View (POV)': 'POV',
    'Insert': 'INSERT',
};
```

### Keyboard Shortcut Registry Structure

```js
/**
 * @typedef {Object} ShortcutEntry
 * @property {string}   id          - Unique shortcut identifier
 * @property {string}   key         - Key string (e.g. 'n', 'd', 'k')
 * @property {boolean}  meta        - Requires Cmd/Ctrl modifier
 * @property {boolean}  shift       - Requires Shift modifier
 * @property {boolean}  suppressInInput - Whether to suppress when input has focus
 * @property {string}   description - Human-readable description
 * @property {string}   group       - Display group for Cheat Sheet
 * @property {string}   display     - Display string for Cheat Sheet (e.g. 'N', '⌘K')
 * @property {function} action      - Callback to execute
 */

const SHORTCUT_REGISTRY = [
    // Shot Actions
    { id: 'new_shot',       key: 'n',         meta: false, shift: false, suppressInInput: true,  description: 'New shot in active scene',          group: 'Shot Actions',  display: 'N' },
    { id: 'duplicate_shot', key: 'd',         meta: false, shift: false, suppressInInput: true,  description: 'Duplicate selected shot',           group: 'Shot Actions',  display: 'D' },
    { id: 'lock_shot',      key: 'l',         meta: false, shift: false, suppressInInput: true,  description: 'Toggle Continuity Lock',            group: 'Shot Actions',  display: 'L' },
    { id: 'shotify',        key: 's',         meta: false, shift: false, suppressInInput: true,  description: 'Run Shotify on selected shot',      group: 'Shot Actions',  display: 'S' },
    { id: 'edit_shot',      key: 'Enter',     meta: false, shift: false, suppressInInput: false, description: 'Open editor for selected shot',     group: 'Shot Actions',  display: '↵' },
    { id: 'undo',           key: 'z',         meta: true,  shift: false, suppressInInput: false, description: 'Undo last action',                  group: 'Shot Actions',  display: '⌘Z' },
    { id: 'redo',           key: 'z',         meta: true,  shift: true,  suppressInInput: false, description: 'Redo last undone action',           group: 'Shot Actions',  display: '⌘⇧Z' },
    { id: 'duplicate_meta', key: 'd',         meta: true,  shift: false, suppressInInput: false, description: 'Duplicate selected shot',           group: 'Shot Actions',  display: '⌘D' },
    // Navigation
    { id: 'nav_up',         key: 'ArrowUp',   meta: false, shift: false, suppressInInput: false, description: 'Previous shot',                     group: 'Navigation',    display: '↑' },
    { id: 'nav_down',       key: 'ArrowDown', meta: false, shift: false, suppressInInput: false, description: 'Next shot',                         group: 'Navigation',    display: '↓' },
    { id: 'nav_left',       key: 'ArrowLeft', meta: false, shift: false, suppressInInput: false, description: 'Previous scene',                    group: 'Navigation',    display: '←' },
    { id: 'nav_right',      key: 'ArrowRight',meta: false, shift: false, suppressInInput: false, description: 'Next scene',                        group: 'Navigation',    display: '→' },
    // AI Features
    { id: 'director_brain', key: 'd',         meta: true,  shift: false, suppressInInput: false, description: 'Open Director Brain panel',         group: 'AI Features',   display: '⌘D' },
    // App Controls
    { id: 'command_palette',key: 'k',         meta: true,  shift: false, suppressInInput: false, description: 'Open Command Palette',              group: 'App Controls',  display: '⌘K' },
    { id: 'cheat_sheet',    key: '?',         meta: false, shift: false, suppressInInput: true,  description: 'Open keyboard shortcut cheat sheet',group: 'App Controls',  display: '?' },
    { id: 'escape',         key: 'Escape',    meta: false, shift: false, suppressInInput: false, description: 'Close overlay / panel / modal',     group: 'App Controls',  display: 'Esc' },
    { id: 'export',         key: 'e',         meta: true,  shift: false, suppressInInput: false, description: 'Export current project',            group: 'App Controls',  display: '⌘E' },
];

// Cheat Sheet groups (for display order)
const SHORTCUT_GROUPS = [
    { label: 'Shot Actions',  shortcuts: SHORTCUT_REGISTRY.filter(s => s.group === 'Shot Actions') },
    { label: 'Navigation',    shortcuts: SHORTCUT_REGISTRY.filter(s => s.group === 'Navigation') },
    { label: 'AI Features',   shortcuts: SHORTCUT_REGISTRY.filter(s => s.group === 'AI Features') },
    { label: 'App Controls',  shortcuts: SHORTCUT_REGISTRY.filter(s => s.group === 'App Controls') },
];
```

### CritiqueAnnotation State Shape

```js
/**
 * @typedef {Object} CritiqueAnnotation
 * @property {string}  id         - Unique annotation ID: `${shotId}_${code}_${index}`
 * @property {string}  shotId     - ID of the shot this annotation belongs to
 * @property {string}  code       - Short code: 'CONT', 'EMO', 'LIGHT', 'COV', 'OVERUSE', 'DEEP'
 * @property {string}  severity   - 'warning' | 'note'
 * @property {string}  message    - Full annotation text
 * @property {string}  [suggestion] - Optional suggested fix
 * @property {string}  source     - 'fast' | 'deep'
 */

// Root App state:
// critiqueAnnotations: { [shotId: string]: CritiqueAnnotation[] }
// dismissedAnnotations: { [annotationId: string]: true }

// Derived: visible annotations for a shot
const getVisibleAnnotations = (shotId, critiqueAnnotations, dismissedAnnotations) =>
    (critiqueAnnotations[shotId] || []).filter(a => !dismissedAnnotations[a.id]);
```

### ProjectSnapshot Shape

The snapshot passed to BrainRouter and FastBrain on every query:

```js
/**
 * @typedef {Object} ProjectSnapshot
 * @property {Object}   activeProject   - Full active project object
 * @property {Object[]} scenes          - All scenes in the active project
 * @property {Object}   activeScene     - Currently active scene
 * @property {Object[]} shots           - Shots in the active scene
 * @property {Object[]} globalCharacters
 * @property {Object[]} globalLocations
 * @property {string}   activeDirectorStyle
 */

const buildProjectSnapshot = (appState) => ({
    activeProject: appState.activeProject,
    scenes: appState.scenes,
    activeScene: appState.activeScene,
    shots: appState.shots,
    globalCharacters: appState.globalCharacters,
    globalLocations: appState.globalLocations,
    activeDirectorStyle: appState.activeDirectorStyle,
});
```

### New Root App State Variables

```js
// Brain mode
const [brainMode, setBrainMode] = React.useState(
    () => localStorage.getItem('mokha_brain_mode') || 'fast'
); // 'fast' | 'deep-loading' | 'deep'

const [deepBrainLoadingProgress, setDeepBrainLoadingProgress] = React.useState(null); // null | '42%'
const deepBrainEngineRef = React.useRef(null); // MLCEngine instance or null
const deepBrainTimeoutRef = React.useRef(null); // timeout handle for 30s limit

// Critique
const [critiqueAnnotations, setCritiqueAnnotations] = React.useState({}); // { shotId: CritiqueAnnotation[] }
const [dismissedAnnotations, setDismissedAnnotations] = React.useState({}); // { annotationId: true }

// Sequence Intelligence
const [ghostCardSuggestion, setGhostCardSuggestion] = React.useState(null); // GrammarTransition | null

// Keyboard Power Mode
const [showCheatSheet, setShowCheatSheet] = React.useState(false);
const [paletteRecentlyUsed, setPaletteRecentlyUsed] = React.useState(
    () => JSON.parse(localStorage.getItem('mokha_palette_recent') || '[]')
); // string[] — last 5 command IDs

// Director Brain panel open state (extends existing agent panel)
const [directorBrainOpen, setDirectorBrainOpen] = React.useState(false);
const [directorBrainMessages, setDirectorBrainMessages] = React.useState([]); // cleared on new project
```

---
