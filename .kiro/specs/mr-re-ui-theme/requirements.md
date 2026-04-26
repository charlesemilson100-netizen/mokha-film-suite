# Requirements Document

## Introduction

This feature adds a third switchable UI theme called "Mr RE UI" to the existing theme switcher in `mokha-suite PRO Vqr.html`. The new theme applies the iOS 26 "Liquid Glass" aesthetic — animated gradient mesh background, frosted glass surfaces, and spring animations — to the main Shot Editor panel and the Story Engine UI (scene/shot list, timeline, storyboard panels). The theme is selectable alongside the existing "Standard UI" and "Cinematic Pro" options, and its selection is persisted to `localStorage`. When any other theme is active, all panels revert to their original appearance.

The Liquid Glass CSS design system (`lg-*` classes, CSS custom properties `--lg-c1` through `--lg-c4`, animated orbs, and spring keyframes) already exists in the file from the `story-engine-ui-redesign` spec. This feature reuses that system and extends it to new surfaces.

---

## Glossary

- **Theme_Switcher**: The `<select>` element rendered by the `UIStyleSelector` React component, bound to the `uiStyle` state variable, that lets the user choose between UI presentation styles.
- **uiStyle**: The React state variable (type `string`) that holds the active theme identifier. Current values: `'default'` (Standard UI), `'glass'` (Apple Glass), `'cinematic'` (Cinematic Pro). The new value is `'mr-re'`.
- **Mr_RE_UI**: The new theme identified by `uiStyle === 'mr-re'`. Applies the Liquid Glass aesthetic to the Shot Editor and Story Engine panels.
- **Shot_Editor**: The main editor view rendered when `currentView === 'editor'`. Comprises the three-column layout (Left Parameters panel, Middle Subject panel, Right Scene/Shot list panel) and the top toolbar.
- **Story_Engine_UI**: The modal and inline panels that render the Story Engine (scene list, shot list, timeline, storyboard panels), identified by `showStoryEngineModal` state and related sub-components.
- **Liquid_Glass**: The visual design system defined by the `lg-*` CSS classes already present in the file. Characterised by: 4-point animated gradient mesh (`lg-mesh` + `lg-orb-1..4`), frosted glass surfaces (`backdrop-filter: blur`), translucent backgrounds (`--lg-bg`), and spring open/close animations (`lg-panel-open-anim` / `lg-panel-close-anim`).
- **getPanelClass**: The JavaScript function in the main `App` component that returns a Tailwind class string for panel containers. It currently branches on `uiStyle === 'glass'`.
- **localStorage**: The browser's `localStorage` API. The existing key `'mokha_ui_style'` is already used to persist `uiStyle`.
- **lg-c1..lg-c4**: CSS custom properties defining the four gradient colours of the Liquid Glass palette (`#7c3aed`, `#0ea5e9`, `#06b6d4`, `#8b5cf6`).
- **Dark_Base_Layer**: A full-viewport semi-opaque dark overlay (`rgba(8, 8, 16, 0.72)`) applied as the page background when `uiStyle === 'mr-re'`, giving the entire app a deep dark foundation that makes the glass panels and gradient orbs pop.

---

## Requirements

### Requirement 1: Theme Switcher Option

**User Story:** As a filmmaker using MOKHA SUITE PRO, I want a "Mr RE UI" option in the theme switcher, so that I can activate the Liquid Glass aesthetic on the editor and story engine panels.

#### Acceptance Criteria

1. THE Theme_Switcher SHALL include a fourth `<option>` element with `value="mr-re"` and display text `"Mr RE UI"`, positioned after the existing three options.
2. WHEN the user selects "Mr RE UI" from the Theme_Switcher, THE Theme_Switcher SHALL set `uiStyle` to `'mr-re'`.
3. WHEN the user selects any option other than "Mr RE UI", THE Theme_Switcher SHALL set `uiStyle` to the corresponding existing value (`'default'`, `'glass'`, or `'cinematic'`), and all Mr_RE_UI-specific styles SHALL be absent from the DOM.
4. THE Theme_Switcher SHALL persist the selected `uiStyle` value to `localStorage` under the key `'mokha_ui_style'` on every change.
5. WHEN the application loads, THE Theme_Switcher SHALL restore the previously persisted `uiStyle` value from `localStorage`, defaulting to `'default'` if no value is stored.

---

### Requirement 2: Shot Editor — Animated Gradient Mesh Background

**User Story:** As a filmmaker, I want the Shot Editor panels to display an animated gradient mesh background when "Mr RE UI" is active, so that the workspace feels immersive and visually distinct.

#### Acceptance Criteria

1. WHEN `uiStyle === 'mr-re'`, THE Shot_Editor SHALL render a `lg-mesh` gradient mesh layer as the first child of the editor root `<div>`, containing four `lg-orb` elements (`lg-orb-1`, `lg-orb-2`, `lg-orb-3`, `lg-orb-4`).
2. WHEN `uiStyle === 'mr-re'`, THE Shot_Editor mesh layer SHALL be positioned `absolute`, cover the full editor area (`inset: 0`), have `z-index: 0`, and have `pointer-events: none` so it does not intercept user interactions.
3. WHEN `uiStyle !== 'mr-re'`, THE Shot_Editor SHALL NOT render the `lg-mesh` layer.
4. THE lg-orb-1 element SHALL animate continuously using the `lg-drift-1` keyframe (10 s duration). THE lg-orb-2 element SHALL animate using `lg-drift-2` (14 s). THE lg-orb-3 element SHALL animate using `lg-drift-3` (18 s). THE lg-orb-4 element SHALL animate using `lg-drift-4` (12 s).
5. WHILE `uiStyle === 'mr-re'`, THE Shot_Editor root `<div>` SHALL have `position: relative` and `overflow: hidden` to contain the mesh layer.

---

### Requirement 3: Shot Editor — Frosted Glass Panel Surfaces

**User Story:** As a filmmaker, I want the Shot Editor's parameter panels, subject panel, and scene/shot list panel to use frosted glass surfaces when "Mr RE UI" is active, so that the Liquid Glass aesthetic is consistent across the workspace.

#### Acceptance Criteria

1. WHEN `uiStyle === 'mr-re'`, THE getPanelClass function SHALL return class strings that include the `lg-panel` CSS class for all three Shot_Editor column panels (Left Parameters, Middle Subject, Right Scene/Shot list).
2. WHEN `uiStyle === 'mr-re'`, THE Shot_Editor panel surfaces SHALL apply `backdrop-filter: blur(24px)`, `background: var(--lg-bg)`, `border: 1px solid var(--lg-border)`, and `border-radius: 20px` via the `lg-panel` class.
3. WHEN `uiStyle === 'mr-re'`, THE Shot_Editor toolbar header bar SHALL apply the `lg-header` CSS class, giving it `background: var(--lg-header-bg)`, `backdrop-filter: blur(16px)`, and the `::before` gradient overlay.
4. WHEN `uiStyle !== 'mr-re'`, THE getPanelClass function SHALL return the same class strings it returned before this feature was introduced (no regression).
5. WHILE `uiStyle === 'mr-re'` and dark mode is active, THE Shot_Editor panels SHALL use the dark-mode `--lg-bg` token (`rgba(15, 15, 25, 0.65)`). WHILE `uiStyle === 'mr-re'` and light mode is active, THE Shot_Editor panels SHALL use the light-mode `--lg-bg` token (`rgba(240, 240, 255, 0.68)`).

---

### Requirement 4: Shot Editor — Spring Panel Transitions

**User Story:** As a filmmaker, I want the Shot Editor panels to animate open with a spring effect when "Mr RE UI" is active, so that the UI feels fluid and polished.

#### Acceptance Criteria

1. WHEN `uiStyle === 'mr-re'` and the editor view becomes visible (i.e., `currentView` transitions to `'editor'`), THE Shot_Editor SHALL apply the `lg-panel-open-anim` CSS class to the editor root container, triggering the `lg-panel-open` keyframe (`opacity: 0 → 1`, `scale: 0.92 → 1`, `translateY: 16px → 0`, `filter: blur(8px) → blur(0)`, duration 380 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`).
2. WHEN `uiStyle !== 'mr-re'`, THE Shot_Editor SHALL NOT apply `lg-panel-open-anim` or any other Liquid Glass animation class.
3. IF the `lg-panel-open` keyframe animation completes and `uiStyle` is still `'mr-re'`, THEN THE Shot_Editor SHALL remove the `lg-panel-open-anim` class to avoid re-triggering on re-renders.

---

### Requirement 5: Story Engine UI — Frosted Glass Surfaces

**User Story:** As a filmmaker, I want the Story Engine panels (scene list, shot list, timeline, storyboard) to use the Liquid Glass aesthetic when "Mr RE UI" is active, so that the theme is consistent across the full application.

#### Acceptance Criteria

1. WHEN `uiStyle === 'mr-re'` and the Story Engine modal is open, THE Story_Engine_UI modal container SHALL apply the `lg-panel` CSS class, replacing its default `bg-panel-light dark:bg-panel-dark` background classes.
2. WHEN `uiStyle === 'mr-re'`, THE Story_Engine_UI modal SHALL render a `lg-mesh` gradient mesh layer as its first child, identical in structure to the Shot Editor mesh (four `lg-orb` elements, `position: absolute`, `inset: 0`, `z-index: 0`, `pointer-events: none`).
3. WHEN `uiStyle === 'mr-re'`, THE Story_Engine_UI header bar SHALL apply the `lg-header` CSS class.
4. WHEN `uiStyle === 'mr-re'`, THE Story_Engine_UI scene list cards and shot list cards SHALL apply `lg-bubble-bot` styling (frosted glass surface, `backdrop-filter: blur(8px)`, `border: 1px solid var(--lg-border)`).
5. WHEN `uiStyle !== 'mr-re'`, THE Story_Engine_UI SHALL render with its original class strings, with no Liquid Glass classes present.

---

### Requirement 6: Story Engine UI — Spring Modal Animation

**User Story:** As a filmmaker, I want the Story Engine modal to open and close with spring animations when "Mr RE UI" is active, so that the transition feels consistent with the Liquid Glass design language.

#### Acceptance Criteria

1. WHEN `uiStyle === 'mr-re'` and `showStoryEngineModal` transitions from `false` to `true`, THE Story_Engine_UI modal SHALL apply the `lg-panel-open-anim` class, triggering the spring open animation (380 ms, `cubic-bezier(0.16, 1, 0.3, 1)`).
2. WHEN `uiStyle === 'mr-re'` and the user closes the Story Engine modal, THE Story_Engine_UI modal SHALL apply the `lg-panel-close-anim` class for 220 ms before the modal is removed from the DOM.
3. WHEN `uiStyle !== 'mr-re'`, THE Story_Engine_UI modal SHALL use its existing open/close animation (or none), with no Liquid Glass animation classes applied.

---

### Requirement 7: Theme Persistence and Reversion

**User Story:** As a filmmaker, I want my theme choice to be remembered across sessions and to be able to switch back to any other theme cleanly, so that I have full control over the UI appearance.

#### Acceptance Criteria

1. THE Theme_Switcher SHALL write the current `uiStyle` value to `localStorage` key `'mokha_ui_style'` synchronously on every change via the existing `useEffect` hook.
2. WHEN the application initialises, THE Theme_Switcher SHALL read `localStorage` key `'mokha_ui_style'` and restore the saved value; IF the stored value is `'mr-re'`, THEN THE App SHALL activate the Mr_RE_UI theme immediately on mount.
3. WHEN `uiStyle` changes from `'mr-re'` to any other value, THE Shot_Editor SHALL remove all `lg-*` classes from its panels and mesh layer within one render cycle.
4. WHEN `uiStyle` changes from `'mr-re'` to any other value, THE Story_Engine_UI SHALL remove all `lg-*` classes from its modal and panels within one render cycle.
5. IF `localStorage` is unavailable (e.g., private browsing with storage blocked), THEN THE App SHALL default to `uiStyle === 'default'` without throwing an error.

---

### Requirement 8: Backdrop-Filter Fallback

**User Story:** As a filmmaker using a browser that does not support `backdrop-filter`, I want the "Mr RE UI" theme to still render legibly, so that the application remains usable regardless of browser capability.

#### Acceptance Criteria

1. IF the browser does not support `backdrop-filter: blur(1px)` (detected via the existing `@supports not (backdrop-filter: blur(1px))` block), THEN THE Shot_Editor panels in Mr_RE_UI mode SHALL render with fully opaque fallback backgrounds (`#111118` in dark mode, `#f0f0f8` in light mode).
2. IF the browser does not support `backdrop-filter`, THEN THE Story_Engine_UI panels in Mr_RE_UI mode SHALL render with the same fully opaque fallback backgrounds.
3. THE fallback rules SHALL be defined within the existing `@supports not (backdrop-filter: blur(1px))` CSS block already present in the file, extending it with selectors for the new surfaces.

---

### Requirement 10: Dark Base Layer

**User Story:** As a filmmaker, I want the entire app background to shift to a deep dark tone when "Mr RE UI" is active, so that the glass panels and gradient orbs stand out with maximum visual impact.

#### Acceptance Criteria

1. WHEN `uiStyle === 'mr-re'`, THE `<body>` element (or the app root `<div>`) SHALL apply a dark background colour of `#080810` (near-black with a slight blue tint) to create a deep dark canvas behind all panels.
2. WHEN `uiStyle === 'mr-re'`, THE app root SHALL additionally render a full-viewport fixed `Dark_Base_Layer` `<div>` with `background: rgba(8, 8, 16, 0.72)`, `position: fixed`, `inset: 0`, `z-index: -1`, and `pointer-events: none`, so the dark tone persists even if the body background is overridden by other styles.
3. WHEN `uiStyle !== 'mr-re'`, THE `Dark_Base_Layer` SHALL NOT be rendered and the body background SHALL revert to its original theme-driven value.
4. THE Dark_Base_Layer SHALL NOT intercept any pointer events or affect the layout of any other element.
5. THE dark background SHALL be visible through the translucent glass panels, reinforcing the depth illusion of the Liquid Glass aesthetic.

---

### Requirement 9: No Regression on Existing Themes

**User Story:** As a filmmaker using "Standard UI" or "Cinematic Pro", I want those themes to continue working exactly as before, so that the addition of "Mr RE UI" does not break my existing workflow.

#### Acceptance Criteria

1. WHEN `uiStyle === 'default'`, THE App SHALL render identically to its pre-feature state, with no `lg-*` classes on any Shot_Editor or Story_Engine_UI element.
2. WHEN `uiStyle === 'glass'`, THE App SHALL render identically to its pre-feature state (Apple Glass background image + `glass-panel` classes).
3. WHEN `uiStyle === 'cinematic'`, THE App SHALL render identically to its pre-feature state.
4. THE addition of the `'mr-re'` option to the Theme_Switcher `<select>` SHALL NOT alter the rendered output for any other `uiStyle` value.
5. THE `getPanelClass` function SHALL preserve all existing branch logic for `uiStyle === 'glass'`, `workspace === 'FILMMAKER'`, `workspace === 'DESIGNER'`, and the default case, adding only a new branch for `uiStyle === 'mr-re'`.
