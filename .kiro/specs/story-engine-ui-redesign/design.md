# Design Document — Story Engine UI Redesign (Liquid Glass)

## Overview

This document describes the technical design for the visual redesign of the `LocalAssistant` chat widget inside `mokha-suite PRO Vqr.html`. The redesign adopts Apple's iOS 26 "Liquid Glass" aesthetic: a 4-point animated gradient mesh background, frosted-glass surfaces on every layer, fluid spring animations, and a polished FAB. All changes are confined to a single `<style>` block and JSX className/structure edits within the existing file. No functional logic is touched.

The existing component is a React component rendered via Babel in-browser. It uses Tailwind CSS utility classes alongside a hand-written `<style>` block. The redesign adds a new CSS section (`/* === LIQUID GLASS === */`) and replaces the className strings on the relevant JSX elements.

---

## Architecture

The redesign is a pure **presentation layer** change. The component tree remains identical; only the visual styling of existing elements changes, plus one new child element (the gradient mesh layer) is inserted as the first child of the chat panel `<div>`.

```
LocalAssistant (fixed bottom-right wrapper)
├── ChatPanel (conditional, isOpen)
│   ├── [NEW] GradientMesh (absolute, z-0, pointer-events-none)
│   │   ├── Orb 1 (--lg-c1)
│   │   ├── Orb 2 (--lg-c2)
│   │   ├── Orb 3 (--lg-c3)
│   │   └── Orb 4 (--lg-c4)
│   ├── HeaderBar (z-10, glass layer)
│   │   ├── Title + Status
│   │   └── Tab buttons (challenge / stats / close)
│   ├── ContentArea (flex-1, overflow-y-auto)
│   │   ├── DailyChallenge panel (conditional)
│   │   ├── Stats panel (conditional)
│   │   └── Chat messages list
│   │       └── MessageBubble × N (glass style)
│   ├── QuickActionChips (horizontal scroll row)
│   │   └── Chip × N (glass pill)
│   └── InputBar (glass tray)
│       ├── TextInput
│       └── SendButton (gradient)
└── FAB (glass gradient button)
    └── Icon (Brain ↔ X, animated)
```

### Key Architectural Decisions

1. **Single CSS block addition** — All new rules live in one clearly delimited `/* === LIQUID GLASS === */` section appended to the existing `<style>` tag. This avoids touching any existing rule and makes the change easy to revert.

2. **CSS custom properties for colours** — Four properties (`--lg-c1` through `--lg-c4`) are defined on `.lg-panel` (the chat panel root). Dark/light variants are handled via `.dark .lg-panel` and `.lg-panel` (light default) overrides. No JavaScript colour logic is needed.

3. **Gradient mesh as a DOM layer** — The mesh is a `<div className="lg-mesh">` inserted as the first child of the panel. It uses `position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden`. Each orb is a `<div className="lg-orb lg-orb-N">`. This avoids canvas or SVG complexity and keeps the implementation in pure CSS.

4. **Animation pause on close** — When `isOpen` is false the mesh div is not rendered (it is inside the `{isOpen && (...)}` block), so no CPU is wasted on animations when the panel is closed. This satisfies Requirement 1.6 without needing `animation-play-state` toggling.

5. **Spring animation via CSS** — The open/close animation uses `@keyframes lg-panel-open` / `lg-panel-close` with `cubic-bezier(0.16, 1, 0.3, 1)` (spring) and `ease-in` respectively. The existing `animate-slide-up` class on the panel is replaced with `lg-panel-open-anim`. A closing animation is triggered by adding a `lg-closing` class via a short `useEffect` + `setTimeout` before setting `isOpen = false`.

6. **Backdrop-filter fallback** — A `@supports not (backdrop-filter: blur(1px))` block sets fully opaque fallback backgrounds for `.lg-panel`, `.lg-header`, `.lg-input-bar`, and `.lg-bubble-bot`.

---

## Components and Interfaces

### 1. CSS Custom Properties (Colour Tokens)

```css
/* Dark mode (default — file uses class="dark") */
.dark .lg-panel {
  --lg-c1: #7c3aed;   /* violet */
  --lg-c2: #0ea5e9;   /* sky blue */
  --lg-c3: #06b6d4;   /* cyan */
  --lg-c4: #8b5cf6;   /* purple */
  --lg-bg: rgba(15, 15, 25, 0.65);
  --lg-border: rgba(255, 255, 255, 0.12);
  --lg-header-bg: rgba(20, 20, 35, 0.55);
  --lg-input-bg: rgba(10, 10, 20, 0.60);
  --lg-bubble-bot-bg: rgba(255, 255, 255, 0.07);
  --lg-text: #f0f0ff;
  --lg-text-muted: rgba(200, 200, 220, 0.65);
}

/* Light mode */
.lg-panel {
  --lg-c1: #7c3aed;
  --lg-c2: #0ea5e9;
  --lg-c3: #06b6d4;
  --lg-c4: #8b5cf6;
  --lg-bg: rgba(240, 240, 255, 0.68);
  --lg-border: rgba(255, 255, 255, 0.55);
  --lg-header-bg: rgba(220, 220, 245, 0.60);
  --lg-input-bg: rgba(230, 230, 250, 0.65);
  --lg-bubble-bot-bg: rgba(255, 255, 255, 0.45);
  --lg-text: #1a1a2e;
  --lg-text-muted: rgba(60, 60, 90, 0.70);
}
```

### 2. Chat Panel (`.lg-panel`)

- `position: relative; overflow: hidden`
- `background: var(--lg-bg)`
- `-webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px)`
- `border: 1px solid var(--lg-border)`
- `box-shadow: 0 32px 64px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08) inset`
- `border-radius: 20px`
- Replaces existing Tailwind classes: `bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl`

### 3. Gradient Mesh (`.lg-mesh` + `.lg-orb`)

Each orb is an absolutely-positioned `<div>` with:
- `border-radius: 50%`
- `filter: blur(60px)`
- `opacity: 0.55`
- `position: absolute`
- Individual `width`, `height`, `background`, `animation` per orb

Orb keyframes (`@keyframes lg-drift-N`) move the orb along a randomised translate path using `transform: translate(x, y)` only (compositor-friendly). Four distinct keyframe sets with durations 10s, 14s, 18s, 12s and staggered `animation-delay` values.

### 4. Header Bar (`.lg-header`)

- `background: var(--lg-header-bg)`
- `-webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px)`
- `border-bottom: 1px solid var(--lg-border)`
- Gradient overlay via `::before` pseudo-element: `background: linear-gradient(135deg, var(--lg-c1), var(--lg-c2)); opacity: 0.20`
- Tab buttons: `transition: background 150ms ease`; hover state `background: rgba(255,255,255,0.15)`

### 5. Message Bubbles

**Bot bubble (`.lg-bubble-bot`)**:
- `background: var(--lg-bubble-bot-bg)`
- `-webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px)`
- `border: 1px solid var(--lg-border)`
- `border-radius: 16px 16px 16px 4px`

**User bubble (`.lg-bubble-user`)**:
- `background: linear-gradient(135deg, var(--lg-c1), var(--lg-c2))`
- `border-radius: 16px 16px 4px 16px`
- `color: #fff`

**Entry animation (`.lg-bubble-enter`)**:
- `@keyframes lg-bubble-in { from { opacity:0; transform: translateY(10px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }`
- `animation: lg-bubble-in 300ms cubic-bezier(0.16,1,0.3,1) forwards`
- Applied to every new bubble via a `className` that includes `lg-bubble-enter`

### 6. FAB (`.lg-fab`)

- `background: conic-gradient(from 0deg, var(--lg-c1), var(--lg-c2), var(--lg-c3), var(--lg-c4), var(--lg-c1))`
- `-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px)`
- `box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15) inset`
- Shimmer animation when closed: `@keyframes lg-fab-spin { to { --fab-angle: 360deg; } }` using `@property --fab-angle` (Houdini) with fallback `@keyframes lg-fab-shimmer` using `background-position` shift
- Hover: `transform: scale(1.08); transition: transform 200ms ease, box-shadow 200ms ease`
- Icon rotation on open: `transition: transform 250ms cubic-bezier(0.16,1,0.3,1)`; open state adds `rotate(180deg)`

**Badge (`.lg-fab-badge`)**:
- `background: rgba(255,255,255,0.20)`
- `border: 1px solid rgba(255,255,255,0.35)`
- `backdrop-filter: blur(4px)`

### 7. Input Bar (`.lg-input-bar`)

- `background: var(--lg-input-bg)`
- `-webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px)`
- `border-top: 1px solid var(--lg-border)`
- Focus state (`.lg-input-bar:focus-within`): `background` shifts to slightly higher opacity via CSS variable override; `transition: background 200ms ease`
- Processing shimmer (`.lg-input-bar.lg-processing`): `@keyframes lg-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }` applied as `background: linear-gradient(90deg, transparent, rgba(var(--lg-c2-rgb),0.15), transparent); background-size: 200% 100%; animation: lg-shimmer 2s linear infinite`

**Send button (`.lg-send-btn`)**:
- `background: linear-gradient(135deg, var(--lg-c1), var(--lg-c3))`
- `transition: transform 150ms ease`
- Hover: `transform: scale(1.1)`

### 8. Quick Action Chips (`.lg-chip`)

- `background: rgba(255,255,255,0.08)`
- `border: 1px solid var(--lg-border)`
- `-webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px)`
- `color: var(--lg-c2)` (alternating per chip category via nth-child)
- Hover: `background: rgba(255,255,255,0.16); transition: background 150ms ease`
- Active: `transform: scale(0.95); transition: transform 100ms ease`

### 9. Panel Open/Close Animation

**Open** (`.lg-panel-open-anim`):
```css
@keyframes lg-panel-open {
  from { opacity: 0; transform: scale(0.92) translateY(16px); filter: blur(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0px); }
}
animation: lg-panel-open 380ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
```

**Close** (`.lg-panel-close-anim`):
```css
@keyframes lg-panel-close {
  from { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0px); }
  to   { opacity: 0; transform: scale(0.92) translateY(16px); filter: blur(4px); }
}
animation: lg-panel-close 220ms ease-in forwards;
```

The close animation requires a brief delay before unmounting. This is handled by a `isClosing` state boolean:
- `setIsClosing(true)` → after 220ms `setTimeout` → `setIsOpen(false); setIsClosing(false)`
- Panel renders when `isOpen || isClosing`; class is `lg-panel-open-anim` when `isOpen && !isClosing`, `lg-panel-close-anim` when `isClosing`

---

## Data Models

No new data models are introduced. The redesign adds two pieces of React state to `LocalAssistant`:

| State | Type | Purpose |
|---|---|---|
| `isClosing` | `boolean` | Tracks whether the close animation is in progress, preventing premature unmount |

All existing state (`isOpen`, `messages`, `input`, etc.) is unchanged.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Orb animation durations are in range and distinct

*For any* set of orb configuration objects produced by the orb-config data, each orb's animation duration is in the range [8s, 20s] and no two orbs share the same duration value.

**Validates: Requirements 1.4**

### Property 2: Panel background opacity is within the glass range

*For any* theme variant (dark or light), the alpha channel of the panel's `--lg-bg` CSS custom property value is in the range [0.55, 0.75].

**Validates: Requirements 3.2**

### Property 3: Message bubble entry animation is applied to every new bubble

*For any* message added to the messages array, the resulting rendered bubble element has the `lg-bubble-enter` class (and therefore the 300ms slide-up animation) applied.

**Validates: Requirements 5.3**

### Property 4: Message bubble origin corner has 4px radius

*For any* message bubble — user or bot — the origin corner (bottom-right for user, bottom-left for bot) has a border-radius of 4px, and all other corners have 16px.

**Validates: Requirements 5.4**

### Property 5: Text contrast ratio meets accessibility threshold

*For any* (foreground colour, background colour) pair used in the chat panel — header text, bubble text, chip text, input placeholder — the WCAG contrast ratio is ≥ 4.5:1.

**Validates: Requirements 4.5, 5.5**

---

## Error Handling

### Backdrop-filter not supported

Detected via `@supports not (backdrop-filter: blur(1px))`. Fallback rules set fully opaque backgrounds:
- `.lg-panel`: `background: #111118` (dark) / `#f0f0f8` (light)
- `.lg-header`: `background: #1a1a28` (dark) / `#e0e0f0` (light)
- `.lg-input-bar`: `background: #0d0d1a` (dark) / `#e8e8f8` (light)
- `.lg-bubble-bot`: `background: #1e1e2e` (dark) / `#dcdcf0` (light)

### CSS custom property not resolved

If a `--lg-c*` variable fails to resolve (e.g., in a very old browser), all gradient usages fall back to the browser's default (transparent/initial). The panel remains functional; only the colour accent is lost. No JavaScript error is thrown.

### Close animation timing

If the user rapidly toggles the FAB (open → close → open before 220ms elapses), the `isClosing` flag is cleared and `isOpen` is set to true immediately, cancelling the close animation. This prevents a stuck invisible panel.

### Houdini `@property` not supported

The FAB shimmer animation uses `@property --fab-angle` for a smooth conic-gradient rotation. If `@property` is not supported (Firefox < 128), the fallback `lg-fab-shimmer` keyframe animation using `background-position` shift is used instead, providing a visually similar shimmer effect.

---

## Testing Strategy

This feature is a **pure CSS/JSX presentation layer change** with no new business logic, data transformations, or algorithms. Property-based testing is applicable only to the small set of deterministic functions involved (orb config generation, colour token validation, bubble class assignment). The primary testing approach is example-based and visual.

### Unit Tests

- **Orb config validation**: Verify each orb object has `duration` in [8, 20] and all durations are distinct.
- **Colour token range**: Verify `--lg-bg` alpha values are in [0.55, 0.75] for both dark and light themes.
- **Bubble class assignment**: Verify `lg-bubble-enter` is present on every newly rendered bubble element.
- **Border-radius correctness**: Verify user bubbles have `border-bottom-right-radius: 4px` and bot bubbles have `border-bottom-left-radius: 4px`.
- **Contrast ratio**: Verify all foreground/background colour pairs meet 4.5:1 WCAG AA using a contrast-ratio utility function.
- **Close animation timing**: Verify `isClosing` state is set on FAB click and cleared after 220ms.
- **Fallback detection**: Mock `CSS.supports` returning false; verify fallback opaque classes are applied.

### Property-Based Tests

Use a property-based testing library (e.g., `fast-check` for JavaScript) with minimum 100 iterations per property.

- **Property 1** — `fc.array(fc.record({ duration: fc.float({min:8, max:20}) }), {minLength:4, maxLength:4})`: assert all durations distinct and in range.
- **Property 2** — `fc.constantFrom('dark', 'light')`: for each theme, parse the `--lg-bg` rgba alpha and assert in [0.55, 0.75].
- **Property 3** — `fc.array(fc.record({ sender: fc.constantFrom('user','bot'), text: fc.string() }), {minLength:1})`: render messages, assert every bubble has `lg-bubble-enter`.
- **Property 4** — `fc.record({ sender: fc.constantFrom('user','bot'), text: fc.string() })`: render bubble, assert correct corner radii.
- **Property 5** — `fc.constantFrom(...colorPairs)`: for each defined colour pair, compute contrast ratio and assert ≥ 4.5.

Tag format: `// Feature: story-engine-ui-redesign, Property N: <property_text>`

### Integration / Visual Tests

- Open the file in Chrome 100+, Safari 16+, Firefox 103+ and verify:
  - No console errors on load
  - FAB renders with gradient and shimmer
  - Panel opens with spring animation
  - Panel closes with ease-in animation
  - Gradient mesh orbs are visible and drifting
  - All glass surfaces show blur effect
  - Dark/light mode toggle updates colour tokens correctly
- Verify no existing Tailwind classes or CSS custom properties (`--color-primary`, etc.) are broken by inspecting other components in the file.
