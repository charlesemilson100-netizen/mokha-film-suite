# Implementation Plan: Mr RE UI Theme

## Overview

Add a fourth switchable theme ("Mr RE UI") to `mokha-suite PRO Vqr.html` that applies the existing Liquid Glass (`lg-*`) CSS system to the Shot Editor and Story Engine UI, plus a deep dark base layer. All changes are confined to the single HTML file. The implementation touches four areas: the `UIStyleSelector` component, the `getPanelClass` function, the App render tree (dark base layer + editor mesh), and the `StoryEngineModal` component.

## Tasks

- [x] 1. Add "Mr RE UI" option to `UIStyleSelector` and harden `localStorage` access
  - Add `<option value="mr-re">Mr RE UI</option>` after the existing `"cinematic"` option in the `UIStyleSelector` component
  - Wrap the `useState` initializer that reads `localStorage.getItem('mokha_ui_style')` in a `try/catch` that returns `'default'` on error
  - Wrap the `useEffect` that writes `localStorage.setItem(...)` in a `try/catch` that silently ignores errors
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1, 7.2, 7.5_

- [x] 2. Extend `getPanelClass` with the `mr-re` branch
  - [x] 2.1 Add new `mr-re` branch to `getPanelClass`
    - Insert a new first branch: `if (uiStyle === 'mr-re')` that returns `'lg-panel '` plus the existing workspace-specific hover/transition classes (`FILMMAKER`, `DESIGNER`, default)
    - Ensure the new branch is inserted before the existing `glass` branch so it takes priority
    - Preserve all existing branches (`glass`, `FILMMAKER`, `DESIGNER`, default) unchanged
    - _Requirements: 3.1, 3.2, 3.4, 9.5_

  - [ ]* 2.2 Write property test for `getPanelClass` — Property 1
    - **Property 1: `getPanelClass` returns `lg-panel` for any workspace when `mr-re`**
    - For each workspace value in `['DEFAULT', 'FILMMAKER', 'DESIGNER']`, with `uiStyle='mr-re'`, assert the returned string contains `'lg-panel'`
    - Use `fc.constantFrom('DEFAULT', 'FILMMAKER', 'DESIGNER')` with `fast-check`
    - **Validates: Requirements 3.1**

  - [ ]* 2.3 Write property test for theme isolation — Property 2
    - **Property 2: No `lg-*` classes for non-`mr-re` themes**
    - For each `uiStyle` in `['default', 'glass', 'cinematic']`, render the app and assert no element has a class matching `/^lg-/` and no `DarkBaseLayer` is present
    - Use `fc.constantFrom('default', 'glass', 'cinematic')` with `fast-check`
    - **Validates: Requirements 1.3, 3.4, 5.5, 6.3, 9.1, 9.2, 9.3, 9.4, 10.3**

- [x] 3. Add Dark Base Layer and root background to App render tree
  - In the App root `<div>`, add a conditional `bg-[#080810]` class when `uiStyle === 'mr-re'` (replacing the existing `bg-base-light dark:bg-base-dark` for that branch)
  - Render a `DarkBaseLayer` `<div>` as the first child of the App root, only when `uiStyle === 'mr-re'`, with inline styles: `position: 'fixed'`, `inset: 0`, `zIndex: -1`, `background: 'rgba(8, 8, 16, 0.72)'`, `pointerEvents: 'none'`
  - When `uiStyle !== 'mr-re'`, the `DarkBaseLayer` div must not be present in the DOM
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4. Add gradient mesh layer and `lg-header` class to the Shot Editor
  - [x] 4.1 Add `lg-mesh` layer and editor container positioning
    - On the editor's three-column layout wrapper `<div>`, add `relative overflow-hidden` classes when `uiStyle === 'mr-re'`
    - Render a `lg-mesh` `<div>` as the first child of that wrapper, only when `uiStyle === 'mr-re'`, containing four children: `<div className="lg-orb lg-orb-1" />`, `lg-orb-2`, `lg-orb-3`, `lg-orb-4`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.2 Apply `lg-header` class to the Shot Editor toolbar
    - On the editor `<header>` element, conditionally apply `lg-header` when `uiStyle === 'mr-re'`, replacing the default border/background classes for that branch
    - _Requirements: 3.3_

  - [x] 4.3 Apply spring open animation to the editor container
    - Add a `useEffect` (or `onAnimationEnd` handler) that applies `lg-panel-open-anim` to the editor root container when `uiStyle === 'mr-re'` and `currentView` transitions to `'editor'`
    - Remove `lg-panel-open-anim` after the animation completes (`onAnimationEnd`) to prevent re-triggering on re-renders
    - When `uiStyle !== 'mr-re'`, do not apply any `lg-panel-open-anim` class
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Apply Liquid Glass surfaces to `StoryEngineModal`
  - [x] 6.1 Pass `uiStyle` prop to `StoryEngineModal` and add `isSeClosing` state
    - Pass `uiStyle` as a prop to `StoryEngineModal` from the App render call
    - Add `const [isSeClosing, setIsSeClosing] = React.useState(false);` inside `StoryEngineModal`
    - Replace the direct `onClose()` call with a `handleClose` wrapper: when `uiStyle === 'mr-re'`, set `isSeClosing(true)` and call `onClose()` after a 220 ms `setTimeout`; otherwise call `onClose()` directly
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Apply `lg-panel` and mesh layer to the modal inner panel
    - On the modal inner panel `<div>`, conditionally apply `lg-panel relative` plus `lg-panel-open-anim` or `lg-panel-close-anim` (based on `isSeClosing`) when `uiStyle === 'mr-re'`; otherwise keep the existing `bg-panel-light dark:bg-panel-dark ... animate-slide-up` classes
    - Render a `lg-mesh` `<div>` (with four `lg-orb` children) as the first child of the inner panel, only when `uiStyle === 'mr-re'`
    - On the modal outer container, apply `bg-[#080810]` when `uiStyle === 'mr-re'`, otherwise keep `bg-base-light dark:bg-base-dark`
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

  - [x] 6.3 Apply `lg-header` to the Story Engine modal header bar
    - On the modal header `<div>`, conditionally apply `lg-header` when `uiStyle === 'mr-re'`, replacing the default border/background classes for that branch
    - _Requirements: 5.3_

  - [x] 6.4 Apply `lg-bubble-bot` to scene and shot list cards
    - On every scene card and shot card rendered inside the Story Engine modal, conditionally apply `lg-bubble-bot` when `uiStyle === 'mr-re'`, replacing the default `bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl` classes
    - _Requirements: 5.4_

  - [ ]* 6.5 Write property test for scene/shot cards — Property 5
    - **Property 5: Every card receives `lg-bubble-bot` for any non-empty card list when `mr-re`**
    - Use `fc.array(fc.record({ id: fc.string(), title: fc.string() }), { minLength: 1, maxLength: 20 })` to generate card lists; render Story Engine with `uiStyle='mr-re'` and assert every card element has `lg-bubble-bot`
    - **Validates: Requirements 5.4**

- [x] 7. Verify theme reversion and `localStorage` round-trip
  - [x] 7.1 Verify reversion removes all `lg-*` classes
    - Manually trace through the JSX: confirm that every conditional `lg-*` class application is guarded by `uiStyle === 'mr-re'`, so switching to any other value removes all `lg-*` classes within one render cycle
    - Confirm the `DarkBaseLayer` div is not rendered when `uiStyle !== 'mr-re'`
    - _Requirements: 7.3, 7.4, 9.1, 9.2, 9.3_

  - [ ]* 7.2 Write property test for `localStorage` round-trip — Property 3
    - **Property 3: `localStorage` round-trip for any valid `uiStyle`**
    - For each value in `['default', 'glass', 'cinematic', 'mr-re']`: (a) set `uiStyle` and assert `localStorage.getItem('mokha_ui_style')` returns that value; (b) seed `localStorage` with that value and assert `uiStyle` initialises to it
    - Use `fc.constantFrom('default', 'glass', 'cinematic', 'mr-re')` with `fast-check`
    - **Validates: Requirements 1.4, 1.5, 7.1, 7.2**

  - [ ]* 7.3 Write property test for theme reversion — Property 4
    - **Property 4: Switching away from `mr-re` removes all `lg-*` classes within one render**
    - For each target value in `['default', 'glass', 'cinematic']`: start with `uiStyle='mr-re'`, switch to target, assert no element has a class matching `/^lg-/`
    - Use `fc.constantFrom('default', 'glass', 'cinematic')` with `fast-check`
    - **Validates: Requirements 7.3, 7.4**

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses JavaScript/JSX (React) — all code examples follow that language
- All `lg-*` CSS classes and custom properties already exist in the file; no new CSS is needed
- The `getPanelClass` new branch must be inserted before the existing `glass` branch
- Property tests use `fast-check` with minimum 100 iterations per property
- Each property test task references the property number from the design document's "Correctness Properties" section
