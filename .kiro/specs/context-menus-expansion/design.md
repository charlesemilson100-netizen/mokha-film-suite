# Design Document: Context Menus Expansion

## Overview

This feature extends MOKHA FILM Suite PRO's existing right-click context menu from shot cards only to all major interactive surfaces: scene tabs, project entries, filmstrip frames, favorites items, shot history entries, Kanban status pills, color tag indicators, the prompt output area, MOKHA Agent chat messages, parameter fields, and the main workspace canvas.

The design is a minimal, additive extension of the existing pattern. The current system uses two state variables (`ctxMenu` and `ctxSubmenu`) and renders a single inline JSX block. We unify these into a single `ctxMenu` state with a `type` discriminator, introduce a `ContextMenuPortal` component that renders via `ReactDOM.createPortal`, and migrate the existing shot menu into the new system. No new external dependencies are introduced.

### Key Design Decisions

1. **Extend, don't replace**: The unified state shape `{ x, y, type, data }` is a superset of the existing `{ x, y, shotIndex }`. Migration is a one-line state change.
2. **Portal rendering**: All menus render into `document.body` via `ReactDOM.createPortal`, eliminating z-index and overflow constraints from parent stacking contexts (Requirement 14.2).
3. **Single submenu state**: `ctxSubmenu` is kept as a sibling state variable (string key) rather than nested into `ctxMenu`, preserving the existing hover pattern exactly.
4. **Type-dispatched rendering**: A single `ContextMenuPortal` component switches on `ctxMenu.type` to render the appropriate menu JSX, keeping all menu logic co-located and easy to audit.
5. **Disabled-item semantics**: Items that are inapplicable render with `opacity-30 cursor-not-allowed` and have their `onClick` suppressed — matching the existing shot menu pattern.

---

## Architecture

The system has three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Event Layer                                                │
│  onContextMenu handlers on each interactive surface         │
│  → call openCtxMenu(e, type, data)                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  State Layer                                                │
│  ctxMenu: { x, y, type, data } | null                       │
│  ctxSubmenu: string | null                                  │
│  Both live in the root App component (existing location)    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Render Layer                                               │
│  <ContextMenuPortal> — ReactDOM.createPortal to body        │
│  Switches on ctxMenu.type → renders correct menu JSX        │
│  Shared: MenuItem, Divider, SubMenu, MenuHeader components  │
└─────────────────────────────────────────────────────────────┘
```

### Lifecycle

```
right-click on surface
        │
        ▼
onContextMenu(e)
  e.preventDefault()          ← blocks native menu
  e.stopPropagation()
  openCtxMenu(e, type, data)  ← sets ctxMenu state
        │
        ▼
ContextMenuPortal renders
  positions menu (viewport clamp)
  traps focus on first item
        │
   ┌────┴────────────────────────────────┐
   │ user hovers submenu trigger         │
   │   → setCtxSubmenu(key)              │
   │   SubMenu panel appears to right    │
   └─────────────────────────────────────┘
        │
   ┌────┴────────────────────────────────┐
   │ user clicks item                    │
   │   → action()                        │
   │   → closeCtxMenu()                  │
   └─────────────────────────────────────┘
        │
   ┌────┴────────────────────────────────┐
   │ user clicks outside / presses Esc   │
   │   → closeCtxMenu()                  │
   └─────────────────────────────────────┘
```

---

## Components and Interfaces

### State Shape

```js
// Replaces: const [ctxMenu, setCtxMenu] = React.useState(null);
const [ctxMenu, setCtxMenu] = React.useState(null);
// Shape: null | { x: number, y: number, type: string, data: object }

// Unchanged:
const [ctxSubmenu, setCtxSubmenu] = React.useState(null);
// Shape: null | string  (e.g. 'move', 'send', 'director', 'color', 'status', 'sort', ...)
```

**`ctxMenu.type` values and their `data` payloads:**

| type | data fields |
|------|-------------|
| `'shot'` | `{ shotIndex: number }` |
| `'scene'` | `{ sceneId: string }` |
| `'project'` | `{ projectId: string }` |
| `'filmstrip'` | `{ shotIndex: number }` |
| `'favorite'` | `{ favoriteId: string, favoriteIndex: number }` |
| `'history'` | `{ shotId: string, revisionIndex: number }` |
| `'status-pill'` | `{ shotIndex: number }` |
| `'color-tag'` | `{ shotIndex: number }` |
| `'prompt-output'` | `{ sceneId: string }` |
| `'agent-message'` | `{ messageIndex: number, role: 'user' \| 'assistant' }` |
| `'parameter-field'` | `{ shotIndex: number, fieldKey: string, fieldValue: any }` |
| `'canvas'` | `{}` |

### Helper Functions

```js
// Opens a context menu — call from any onContextMenu handler
const openCtxMenu = (e, type, data) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, type, data });
    setCtxSubmenu(null);
};

// Closes the context menu and any open submenu
const closeCtxMenu = () => {
    setCtxMenu(null);
    setCtxSubmenu(null);
};
```

### ContextMenuPortal Component

```jsx
const ContextMenuPortal = ({
    ctxMenu, ctxSubmenu, setCtxSubmenu, closeCtxMenu,
    // all app state and action props needed by menus
    shots, scenes, projects, favorites, shotHistory,
    activeSceneId, activeProjectId,
    // ... action callbacks
}) => {
    if (!ctxMenu) return null;

    // Viewport clamping
    const menuWidth = 220;
    const menuHeight = estimateMenuHeight(ctxMenu.type); // ~40px per item
    const left = Math.min(ctxMenu.x, window.innerWidth - menuWidth - 8);
    const top  = Math.min(ctxMenu.y, window.innerHeight - menuHeight - 8);

    const menuContent = (
        <div
            className="fixed z-[99999] animate-fade-in"
            style={{ left, top }}
            onClick={e => e.stopPropagation()}
            role="menu"
            aria-label="Context menu"
        >
            {renderMenuForType(ctxMenu.type, ctxMenu.data)}
        </div>
    );

    return ReactDOM.createPortal(menuContent, document.body);
};
```

### Shared Sub-Components

These are defined inside `ContextMenuPortal` (or as module-level helpers) and reused across all menu types:

```jsx
// Menu item button
const MenuItem = ({ icon, label, action, disabled, danger, badge, hasArrow, onMouseEnter, onMouseLeave }) => { ... };

// Horizontal divider
const Divider = () => <div className="my-1 border-t border-border-light dark:border-border-dark" />;

// Section header label
const MenuHeader = ({ text }) => (
    <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark border-b border-border-light dark:border-border-dark mb-1">
        {text}
    </div>
);

// Flyout submenu wrapper
const SubMenuWrapper = ({ submenuKey, trigger, children }) => (
    <div className="relative"
        onMouseEnter={() => setCtxSubmenu(submenuKey)}
        onMouseLeave={() => setCtxSubmenu(null)}>
        {trigger}
        {ctxSubmenu === submenuKey && (
            <div className="absolute left-full top-0 ml-1 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl py-1.5 w-44 z-[100000]">
                {children}
            </div>
        )}
    </div>
);
```

### Menu Panel Wrapper

All menus share the same outer container styling:

```jsx
<div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl py-1.5 w-52 overflow-visible">
    {/* menu content */}
</div>
```

---

## Data Models

### Internal Shot Clipboard

A new ref (not state, to avoid re-renders) holds the last copied shot for the Canvas "Paste Shot" action:

```js
const copiedShotRef = React.useRef(null); // holds a deep copy of a shot object
```

### Viewport Position Clamping

Menu position is computed at render time:

```js
const clampMenuPosition = (x, y, menuWidth, menuHeight) => ({
    left: Math.min(x, window.innerWidth  - menuWidth  - 8),
    top:  Math.min(y, window.innerHeight - menuHeight - 8),
});
```

`menuHeight` is estimated per menu type based on item count (approximately 36px per item + 8px padding). This avoids a two-pass layout measurement while still keeping menus within the viewport for all realistic cases.

### Keyboard Navigation State

Focus management uses a `React.useRef` pointing to the menu container, with `querySelectorAll('[role="menuitem"]:not([disabled])')` to enumerate focusable items. No additional state is needed.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: At Most One Menu Open

*For any* sequence of right-click events on any combination of surfaces, at most one context menu shall be visible at any point in time. Opening a second menu while one is already open must result in exactly one menu being visible (the new one).

**Validates: Requirements 1.1**

---

### Property 2: Outside Click Dismisses Without Action

*For any* open context menu and any click event whose target is outside the menu panel, the menu shall be dismissed and no menu action shall have been invoked as a side effect of that click.

**Validates: Requirements 1.2**

---

### Property 3: Viewport Containment

*For any* right-click position (x, y) within the viewport and any menu type, the rendered menu panel shall be positioned such that its bounding rectangle is fully contained within the viewport (left ≥ 0, top ≥ 0, right ≤ window.innerWidth, bottom ≤ window.innerHeight).

**Validates: Requirements 1.4**

---

### Property 4: Disabled Items Do Not Invoke Actions

*For any* menu item rendered in a disabled state, clicking or pressing Enter on that item shall not invoke its associated action and shall not change any application state.

**Validates: Requirements 1.9**

---

### Property 5: Action Dismisses Menu

*For any* enabled menu item, invoking its action (click or keyboard Enter) shall result in the context menu being dismissed (ctxMenu === null) immediately after the action callback returns.

**Validates: Requirements 1.7**

---

### Property 6: Scene Boundary Actions Respect Position

*For any* scene at index 0 in the scene list, the "Move Scene Left" item in the Scene_Tab_Menu shall be in a disabled state. *For any* scene at the last index in the scene list, the "Move Scene Right" item shall be in a disabled state.

**Validates: Requirements 2.5, 2.6**

---

### Property 7: Empty Scene Disables Bulk Actions

*For any* scene containing zero shots, the Scene_Tab_Menu items "Copy All Prompts", "Export Scene as PDF", "Clear All Shots", and "Apply Director Style to All Shots" shall all be in a disabled state.

**Validates: Requirements 2.12**

---

### Property 8: Locked Shot Disables Mutation Actions

*For any* shot with `locked === true`, all menu items in the Status_Pill_Menu and Color_Tag_Menu that would mutate the shot's state shall be rendered in a disabled state.

**Validates: Requirements 7.6, 8.7**

---

### Property 9: Filmstrip Delete Disabled When Locked

*For any* filmstrip frame whose corresponding shot has `locked === true`, the "Delete Shot" item in the Filmstrip_Frame_Menu shall be in a disabled state.

**Validates: Requirements 4.9**

---

### Property 10: Single Project Disables Delete

*For any* project list containing exactly one project, the "Delete Project" item in the Project_Tab_Menu shall be in a disabled state.

**Validates: Requirements 3.9**

---

### Property 11: Single Scene Disables Delete

*For any* project containing exactly one scene, the "Delete Scene" item in the Scene_Tab_Menu shall be in a disabled state.

**Validates: Requirements 2.11**

---

### Property 12: Copy Selected Text Disabled When No Selection

*For any* Prompt_Output_Menu or Agent_Message_Menu rendered when `window.getSelection().toString()` is empty, the "Copy Selected Text" item shall be in a disabled state.

**Validates: Requirements 9.3, 10.3**

---

### Property 13: Re-send Disabled for Bot Messages

*For any* agent message with `role === 'assistant'`, the "Re-send to Agent" item in the Agent_Message_Menu shall be in a disabled state.

**Validates: Requirements 10.6**

---

## Error Handling

### Action Failures

All menu actions that can fail (clipboard writes, PDF export, state mutations) follow the existing toast pattern:

```js
// Success
addToast('Prompt copied ✓', 'success');

// Failure
addToast('Failed to copy — please try again', 'error');
```

Menu dismissal happens before the async operation completes, so a failed clipboard write does not leave the menu open.

### Missing Data Guards

Each menu renderer begins with a data validity check:

```js
// Example: shot menu
const s = shots[data.shotIndex];
if (!s) return null; // shot was deleted between right-click and render
```

If the referenced entity no longer exists (e.g., a scene was deleted while its tab menu was open), the portal renders nothing rather than crashing.

### Clipboard API Fallback

All copy actions use the existing `fallbackCopy(text, callback)` utility, which handles both the modern `navigator.clipboard.writeText` API and the legacy `document.execCommand('copy')` fallback.

### Confirmation Flows

Two actions require confirmation before execution:

- **"Clear All Shots"** (Scene_Tab_Menu): Uses `addToast` with a confirm/cancel action pair rendered inline in the toast.
- **"Delete Project"** (Project_Tab_Menu): Uses a modal confirmation dialog (matching the existing modal pattern in the app) before executing deletion.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples and edge cases for the pure logic functions:

- `clampMenuPosition(x, y, w, h)` — boundary cases: position at (0,0), position at viewport edge, position beyond viewport edge
- `estimateMenuHeight(type)` — returns a positive number for every known menu type
- `openCtxMenu` — verify state shape is set correctly for each menu type
- `closeCtxMenu` — verify both `ctxMenu` and `ctxSubmenu` are set to null
- Disabled-item logic for each menu type (locked shots, single scene/project, empty scene, no selection)

### Property-Based Tests

Property-based testing is appropriate here because the core correctness properties (viewport clamping, disabled-item invariants, single-menu invariant) hold universally across all inputs and the logic is pure.

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (already available in the JS ecosystem; no new runtime dependency needed for tests).

**Minimum iterations**: 100 per property test.

**Tag format**: `// Feature: context-menus-expansion, Property N: <property_text>`

**Property tests to implement:**

| Property | Test description |
|----------|-----------------|
| P1 | Generate random sequences of `openCtxMenu` calls; assert `ctxMenu` always holds exactly the last-opened menu |
| P2 | Generate random menu states; simulate outside click; assert `ctxMenu === null` and no side-effect functions were called |
| P3 | Generate random (x, y) coordinates and menu types; assert `clampMenuPosition` output is always within `[0, viewportW - menuW]` × `[0, viewportH - menuH]` |
| P4 | Generate random disabled menu items; simulate click; assert action mock was never called |
| P5 | Generate random enabled menu items with mock actions; simulate click; assert `ctxMenu === null` after invocation |
| P6 | Generate scene lists of random length; assert Move Left disabled iff index === 0, Move Right disabled iff index === last |
| P7 | Generate scenes with 0 shots; assert all four bulk-action items are disabled |
| P8 | Generate shots with `locked: true`; assert all mutation items in Status_Pill_Menu and Color_Tag_Menu are disabled |

### Integration Tests

- Right-click on a shot card → correct menu type renders with correct shot data
- Right-click on a scene tab → correct menu type renders with correct scene data
- Escape key press → menu dismissed
- Arrow key navigation → focus moves between items
- Submenu hover → submenu panel appears; mouse leave → submenu closes

### Accessibility Tests

- `role="menu"` present on menu container
- `role="menuitem"` present on each interactive item
- `aria-disabled="true"` present on disabled items
- Focus trapped within menu on open
- Focus returns to triggering element on close (where feasible in a single-file app)
