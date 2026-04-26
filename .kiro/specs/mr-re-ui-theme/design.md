# Design Document — Mr RE UI Theme

## Overview

This feature adds a fourth switchable UI theme, "Mr RE UI", to `mokha-suite PRO Vqr.html`. It extends the iOS 26 Liquid Glass design system — already implemented for the `LocalAssistant` chat widget — to two new surfaces: the main Shot Editor (three-column layout + toolbar) and the Story Engine modal. A deep dark base layer (`#080810` body + fixed `rgba(8,8,16,0.72)` overlay) is rendered behind all panels when the theme is active, making the glass surfaces and gradient orbs pop.

All changes are confined to `mokha-suite PRO Vqr.html`. No new CSS classes or custom properties are introduced; the feature reuses the existing `lg-*` system from the `story-engine-ui-redesign` spec. The implementation touches three areas:

1. **`UIStyleSelector`** — adds a fourth `<option value="mr-re">Mr RE UI</option>`
2. **`getPanelClass`** — adds a new branch for `uiStyle === 'mr-re'`
3. **App render tree** — conditionally applies `lg-*` classes and renders the mesh/base-layer elements when `uiStyle === 'mr-re'`

---

## Architecture

The feature is a **conditional presentation layer** change. No new components are introduced; existing elements receive different class strings and a few conditional child elements are inserted.

```
App (root div)
├── [NEW] DarkBaseLayer (fixed, z-index:-1, pointer-events:none) — only when uiStyle==='mr-re'
├── Sidebar
└── Main content area
    ├── Dashboard view
    └── Editor view (currentView === 'editor')
        ├── [NEW] lg-mesh (absolute, z-0, pointer-events:none) — only when uiStyle==='mr-re'
        │   ├── lg-orb lg-orb-1
        │   ├── lg-orb lg-orb-2
        │   ├── lg-orb lg-orb-3
        │   └── lg-orb lg-orb-4
        ├── <header> toolbar  ← gets lg-header class when mr-re
        └── Three-column layout
            ├── Left panel     ← getPanelClass() returns lg-panel when mr-re
            ├── Middle panel   ← getPanelClass() returns lg-panel when mr-re
            └── Right panels   ← getPanelClass() returns lg-panel when mr-re

StoryEngineModal (fixed inset-0 z-[60])
├── [NEW] lg-mesh — only when uiStyle==='mr-re'
│   └── lg-orb × 4
├── <header> bar  ← gets lg-header class when mr-re
└── Content panels
    └── Scene/shot cards  ← get lg-bubble-bot class when mr-re
```

### Key Architectural Decisions

1. **Reuse existing CSS system** — All `lg-*` classes and `--lg-c*` custom properties already exist. No new CSS is written; the feature is purely a matter of applying the right class strings conditionally in JSX.

2. **`getPanelClass` new branch** — The function gains a new first branch: `if (uiStyle === 'mr-re') return 'lg-panel ' + workspaceHoverClass`. This is inserted before the existing `glass` branch so it takes priority. The existing `glass`, `FILMMAKER`, `DESIGNER`, and default branches are preserved unchanged.

3. **Dark base layer as a fixed `<div>`** — Rather than mutating `document.body.style`, the dark base is a `position: fixed; inset: 0; z-index: -1; pointer-events: none` div rendered as the first child of the app root. This is idiomatic React and avoids side effects that could leak across theme switches.

4. **Mesh layer inside editor root** — The `lg-mesh` is inserted as the first child of the editor's flex container (the `<div className="flex-1 flex flex-col lg:flex-row gap-4 mt-4 ...">` wrapper). The editor root wrapper already has `overflow: hidden` in most cases; when `uiStyle === 'mr-re'` we additionally ensure `position: relative` is present on the outer editor container.

5. **Story Engine modal animation** — The modal already uses `animate-slide-up` on its inner container. When `uiStyle === 'mr-re'`, this class is replaced with `lg-panel-open-anim`. Close animation requires a `isSeClosing` boolean state (mirroring the pattern from `LocalAssistant`) that delays `onClose` by 220 ms while `lg-panel-close-anim` plays.

6. **`uiStyle` state and persistence** — The existing `useState` initializer already reads from `localStorage`. The existing `useEffect` already writes on every change. No new persistence logic is needed; the new `'mr-re'` value flows through the same mechanism automatically.

---

## Components and Interfaces

### 1. `UIStyleSelector` — New Option

```jsx
<option value="mr-re">Mr RE UI</option>
```

Inserted after the existing `<option value="cinematic">Cinematic Pro</option>`. No other changes to the component.

### 2. `getPanelClass` — New Branch

```js
const getPanelClass = () => {
    let base = "rounded-xl flex flex-col shrink-0 ";
    if (uiStyle === 'mr-re') {
        // Liquid Glass panel — workspace hover effects still apply
        base += "lg-panel ";
        if (workspace === 'FILMMAKER') return base + "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgb(var(--color-primary)/0.3)] hover:border-primary/60 ";
        if (workspace === 'DESIGNER') return base + "transition-all duration-300 hover:border-primary/30 ";
        return base + "hover-panel transition-all ";
    }
    if (uiStyle === 'glass') { /* ... existing ... */ }
    /* ... existing default ... */
};
```

The `lg-panel` class provides `backdrop-filter: blur(24px)`, `background: var(--lg-bg)`, `border: 1px solid var(--lg-border)`, `border-radius: 20px`, and `box-shadow`. Workspace-specific hover transitions are preserved.

### 3. App Root `<div>` — Dark Base Layer + Background

```jsx
<div
    className={`flex h-screen ... ${
        uiStyle === 'glass' ? 'bg-white/80 dark:bg-black/80' :
        uiStyle === 'mr-re' ? 'bg-[#080810]' :
        'bg-base-light dark:bg-base-dark'
    }`}
    style={uiStyle === 'glass' ? { /* existing bg image */ } : {}}
>
    {/* Dark Base Layer — only for mr-re */}
    {uiStyle === 'mr-re' && (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: -1,
                background: 'rgba(8, 8, 16, 0.72)',
                pointerEvents: 'none'
            }}
        />
    )}
    {/* ... rest of app ... */}
```

### 4. Editor View — Mesh Layer + Toolbar Class

The editor section (inside `currentView === 'editor'`) gains:

```jsx
{/* Editor outer wrapper — ensure relative positioning for mesh */}
<div className={`flex-1 flex flex-col h-full overflow-hidden p-4 ${uiStyle === 'mr-re' ? 'relative' : ''}`}>
    {/* ... */}
    {/* Toolbar header */}
    <header className={`... ${uiStyle === 'mr-re' ? 'lg-header' : 'border-b border-border-light dark:border-border-dark ...'}`}>
        {/* ... existing toolbar content ... */}
    </header>

    {/* Three-column layout */}
    <div className={`flex-1 flex flex-col lg:flex-row gap-4 mt-4 min-h-0 pb-4 ... ${uiStyle === 'mr-re' ? 'relative overflow-hidden' : ''}`}>
        {/* Gradient mesh — only for mr-re */}
        {uiStyle === 'mr-re' && (
            <div className="lg-mesh">
                <div className="lg-orb lg-orb-1" />
                <div className="lg-orb lg-orb-2" />
                <div className="lg-orb lg-orb-3" />
                <div className="lg-orb lg-orb-4" />
            </div>
        )}
        {/* ... existing three columns, panels use getPanelClass() ... */}
    </div>
</div>
```

The three column panels already call `getPanelClass()`, so they automatically receive `lg-panel` when `uiStyle === 'mr-re'`.

### 5. `StoryEngineModal` — Liquid Glass Surfaces

The modal receives `uiStyle` as a prop (passed from App alongside the existing props).

**Outer container** (currently `fixed inset-0 z-[60] flex bg-base-light dark:bg-base-dark`):
```jsx
<div className={`fixed inset-0 z-[60] flex ${uiStyle === 'mr-re' ? 'bg-[#080810]' : 'bg-base-light dark:bg-base-dark'}`}>
```

**Inner panel** (currently `bg-panel-light dark:bg-panel-dark ... animate-slide-up`):
```jsx
<div className={`w-full h-full flex flex-col overflow-hidden ${
    uiStyle === 'mr-re'
        ? `lg-panel relative ${isSeClosing ? 'lg-panel-close-anim' : 'lg-panel-open-anim'}`
        : 'bg-panel-light dark:bg-panel-dark border-0 shadow-none animate-slide-up'
}`}>
    {/* Mesh layer */}
    {uiStyle === 'mr-re' && (
        <div className="lg-mesh">
            <div className="lg-orb lg-orb-1" />
            <div className="lg-orb lg-orb-2" />
            <div className="lg-orb lg-orb-3" />
            <div className="lg-orb lg-orb-4" />
        </div>
    )}
    {/* Header bar */}
    <div className={`p-4 border-b shrink-0 flex items-center justify-between ${
        uiStyle === 'mr-re'
            ? 'lg-header'
            : 'border-border-light dark:border-border-dark bg-input-light dark:bg-input-dark/50'
    }`}>
        {/* ... existing header content ... */}
    </div>
    {/* ... rest of modal ... */}
```

**Scene/shot list cards** — wherever scene or shot cards are rendered, the container class becomes:
```jsx
className={`... ${uiStyle === 'mr-re' ? 'lg-bubble-bot' : 'bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl'}`}
```

**Close animation state** — `StoryEngineModal` gains one new local state:
```js
const [isSeClosing, setIsSeClosing] = React.useState(false);
```

The `onClose` prop is wrapped:
```js
const handleClose = () => {
    if (uiStyle === 'mr-re') {
        setIsSeClosing(true);
        setTimeout(() => { setIsSeClosing(false); onClose(); }, 220);
    } else {
        onClose();
    }
};
```

---

## Data Models

No new data models. One new local state variable is added to `StoryEngineModal`:

| Component | State | Type | Purpose |
|---|---|---|---|
| `StoryEngineModal` | `isSeClosing` | `boolean` | Tracks whether the 220 ms close animation is in progress, preventing premature unmount |

The existing `uiStyle` state in `App` (type `string`, persisted to `localStorage` key `'mokha_ui_style'`) gains a new valid value: `'mr-re'`. No schema migration is needed; the `useState` initializer already handles unknown stored values by defaulting to `'default'` if the stored value is not one of the known options — though in practice `'mr-re'` will be stored and restored correctly.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: `getPanelClass` returns `lg-panel` for any workspace when `mr-re`

*For any* workspace value (`'DEFAULT'`, `'FILMMAKER'`, `'DESIGNER'`), when `uiStyle === 'mr-re'`, the string returned by `getPanelClass()` SHALL contain the substring `'lg-panel'`.

**Validates: Requirements 3.1**

### Property 2: Theme isolation — no `lg-*` classes for non-`mr-re` themes

*For any* `uiStyle` value in `{'default', 'glass', 'cinematic'}`, no element in the Shot Editor, Story Engine modal, or app root SHALL have a CSS class that begins with `lg-` (i.e., no `lg-panel`, `lg-mesh`, `lg-header`, `lg-bubble-bot`, `lg-panel-open-anim`, `lg-panel-close-anim`, etc.), and the `DarkBaseLayer` div SHALL NOT be present in the DOM.

**Validates: Requirements 1.3, 3.4, 5.5, 6.3, 9.1, 9.2, 9.3, 9.4, 10.3**

### Property 3: `localStorage` round-trip for any valid `uiStyle`

*For any* valid `uiStyle` value in `{'default', 'glass', 'cinematic', 'mr-re'}`, setting `uiStyle` to that value SHALL result in `localStorage.getItem('mokha_ui_style')` returning that same value; and initialising the app with that value pre-seeded in `localStorage` SHALL result in `uiStyle` state being initialised to that value.

**Validates: Requirements 1.4, 1.5, 7.1, 7.2**

### Property 4: Theme reversion removes all `lg-*` classes within one render

*For any* transition of `uiStyle` from `'mr-re'` to any value in `{'default', 'glass', 'cinematic'}`, after one React render cycle, no element in the Shot Editor or Story Engine modal SHALL retain any CSS class beginning with `lg-`.

**Validates: Requirements 7.3, 7.4**

### Property 5: Scene/shot cards receive `lg-bubble-bot` for any card set when `mr-re`

*For any* non-empty list of scene or shot cards rendered inside the Story Engine modal when `uiStyle === 'mr-re'`, every card element SHALL have the `lg-bubble-bot` CSS class applied.

**Validates: Requirements 5.4**

---

## Error Handling

### `localStorage` unavailable

The existing `useState` initializer uses `localStorage.getItem(...)` directly. If `localStorage` throws (e.g., private browsing with storage blocked), the initializer will throw and the component will fail to mount. The fix is to wrap the initializer in a try/catch:

```js
const [uiStyle, setUiStyle] = useState(() => {
    try { return localStorage.getItem('mokha_ui_style') || 'default'; }
    catch { return 'default'; }
});
```

The existing `useEffect` write should similarly be wrapped:
```js
useEffect(() => {
    try { localStorage.setItem('mokha_ui_style', uiStyle); } catch {}
}, [uiStyle]);
```

This satisfies Requirement 7.5.

### `backdrop-filter` not supported

The existing `@supports not (backdrop-filter: blur(1px))` block already provides opaque fallbacks for `.lg-panel`, `.lg-header`, `.lg-input-bar`, and `.lg-bubble-bot`. No new fallback rules are needed for the Shot Editor or Story Engine surfaces because they use the same classes. The fallback block already covers them.

### Rapid theme switching

If the user switches from `'mr-re'` to another theme while the Story Engine close animation is in progress (220 ms window), the `isSeClosing` state will be `true` but `uiStyle` will no longer be `'mr-re'`. The `handleClose` wrapper checks `uiStyle` at call time, so subsequent rapid switches will not re-trigger the animation. The `setTimeout` callback calls `onClose()` regardless, which is safe.

### `uiStyle === 'mr-re'` on unsupported browsers

If `backdrop-filter` is not supported, the `@supports` fallback sets opaque backgrounds. The gradient mesh orbs and dark base layer still render (they do not depend on `backdrop-filter`), so the theme remains visually coherent — just without the frosted glass blur effect.

---

## Testing Strategy

This feature is a **conditional presentation layer change** — it applies existing CSS classes to existing DOM elements based on a state variable. The primary testing approach is example-based (asserting class presence/absence) with property-based tests for the universal invariants.

### PBT Applicability Assessment

PBT is applicable to this feature for the following reasons:
- `getPanelClass` is a pure function whose output depends on `uiStyle` and `workspace` — both enumerable inputs
- The theme isolation invariant (no `lg-*` classes for non-`mr-re` themes) is a universal property across all non-`mr-re` values
- The `localStorage` round-trip is a classic round-trip property
- The reversion property (switching away from `mr-re` clears all `lg-*` classes) is a universal property across all target values

**Property-based testing library**: `fast-check` (JavaScript)

### Unit Tests (Example-Based)

- **Option presence**: Assert `UIStyleSelector` renders an `<option value="mr-re">Mr RE UI</option>`.
- **Mesh structure**: When `uiStyle='mr-re'`, assert `lg-mesh` div with exactly 4 children (`lg-orb-1` through `lg-orb-4`) is present in the editor.
- **Mesh absence**: When `uiStyle='default'`, assert no `lg-mesh` in editor.
- **Toolbar class**: When `uiStyle='mr-re'`, assert editor toolbar `<header>` has `lg-header` class.
- **Dark base layer**: When `uiStyle='mr-re'`, assert `DarkBaseLayer` div is present with `position:fixed`, `inset:0`, `zIndex:-1`, `pointerEvents:none`, `background:rgba(8,8,16,0.72)`.
- **Root background**: When `uiStyle='mr-re'`, assert app root has `bg-[#080810]` class.
- **Open animation**: When `uiStyle='mr-re'` and `currentView` transitions to `'editor'`, assert `lg-panel-open-anim` is applied to the editor container.
- **Animation cleanup**: After `onAnimationEnd` fires on the editor container, assert `lg-panel-open-anim` is removed.
- **Modal open animation**: When `uiStyle='mr-re'` and `showStoryEngineModal` becomes `true`, assert `lg-panel-open-anim` on modal inner panel.
- **Modal close animation**: When `uiStyle='mr-re'` and close is triggered, assert `lg-panel-close-anim` is applied; after 220 ms assert modal is unmounted.
- **localStorage unavailable**: Mock `localStorage` to throw; assert `uiStyle` defaults to `'default'` and no error propagates.
- **Fallback backgrounds**: Mock `CSS.supports` to return `false`; assert `lg-panel` elements have opaque background colours.

### Property-Based Tests

Use `fast-check` with minimum 100 iterations per property. Tag format: `// Feature: mr-re-ui-theme, Property N: <property_text>`

- **Property 1** — `fc.constantFrom('DEFAULT', 'FILMMAKER', 'DESIGNER')`: for each workspace, with `uiStyle='mr-re'`, assert `getPanelClass()` contains `'lg-panel'`.
- **Property 2** — `fc.constantFrom('default', 'glass', 'cinematic')`: for each non-`mr-re` uiStyle, render the app, assert no element has a class matching `/^lg-/` and no `DarkBaseLayer` is present.
- **Property 3** — `fc.constantFrom('default', 'glass', 'cinematic', 'mr-re')`: for each value, (a) set `uiStyle` and assert `localStorage` contains that value; (b) seed `localStorage` with that value and assert `uiStyle` initialises to it.
- **Property 4** — `fc.constantFrom('default', 'glass', 'cinematic')`: start with `uiStyle='mr-re'`, switch to each target value, assert no `lg-*` classes remain after one render.
- **Property 5** — `fc.array(fc.record({ id: fc.string(), title: fc.string() }), { minLength: 1, maxLength: 20 })`: render Story Engine with `uiStyle='mr-re'` and a generated list of cards, assert every card has `lg-bubble-bot` class.

### Integration / Visual Tests

- Open in Chrome 100+, Safari 16+, Firefox 103+:
  - Switch to "Mr RE UI" — verify deep dark background, glass panels, animated orbs in editor
  - Open Story Engine modal — verify glass surface, mesh orbs, spring open animation
  - Close Story Engine modal — verify spring close animation before unmount
  - Switch back to "Standard UI" — verify all `lg-*` classes are gone, original appearance restored
  - Reload page — verify "Mr RE UI" is restored from `localStorage`
  - Verify no console errors on any theme switch
  - Verify `LocalAssistant` chat widget is unaffected by theme switch (its `lg-panel` is always active)
