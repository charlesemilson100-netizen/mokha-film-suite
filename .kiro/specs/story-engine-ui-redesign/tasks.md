# Implementation Plan: Story Engine UI Redesign (Liquid Glass)

## Overview

Implement the iOS 26 "Liquid Glass" visual redesign of the `LocalAssistant` chat widget inside `mokha-suite PRO Vqr.html`. All changes are confined to that single file: a new `/* === LIQUID GLASS === */` CSS section appended to the existing `<style>` block, JSX className replacements on the relevant elements, and two small state additions (`isClosing`) to the `LocalAssistant` component.

## Tasks

- [x] 1. Add Liquid Glass CSS custom properties and base panel styles
  - Append a clearly delimited `/* === LIQUID GLASS === */` section to the existing `<style>` block
  - Define the four colour tokens (`--lg-c1` through `--lg-c4`) and all surface tokens (`--lg-bg`, `--lg-border`, `--lg-header-bg`, `--lg-input-bg`, `--lg-bubble-bot-bg`, `--lg-text`, `--lg-text-muted`) on `.dark .lg-panel` (dark) and `.lg-panel` (light default)
  - Write `.lg-panel` rules: `position: relative; overflow: hidden; backdrop-filter: blur(24px); background: var(--lg-bg); border: 1px solid var(--lg-border); box-shadow: ...; border-radius: 20px`
  - Add `@supports not (backdrop-filter: blur(1px))` fallback block with fully opaque backgrounds for `.lg-panel`, `.lg-header`, `.lg-input-bar`, `.lg-bubble-bot`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Implement the animated gradient mesh
  - [x] 2.1 Write `.lg-mesh` and `.lg-orb` CSS rules
    - `.lg-mesh`: `position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden`
    - `.lg-orb`: `position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.55`
    - Write four `@keyframes lg-drift-N` sets (translate-only paths, durations 10s/14s/18s/12s, staggered delays) for orbs 1–4
    - Write per-orb size, colour, and animation rules (`.lg-orb-1` through `.lg-orb-4`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Insert the `GradientMesh` JSX element into the `LocalAssistant` render
    - Add `<div className="lg-mesh">` with four `<div className="lg-orb lg-orb-N">` children as the first child of the chat panel `<div>`
    - Ensure the mesh is inside the `{isOpen && (...)}` block so it is removed from the DOM when the panel is closed
    - _Requirements: 1.5, 1.6_

  - [ ]* 2.3 Write property test for orb animation durations (Property 1)
    - **Property 1: Orb animation durations are in range and distinct**
    - **Validates: Requirements 1.4**

- [x] 3. Apply glass surface styles to the Header Bar
  - Add `.lg-header` CSS: `background: var(--lg-header-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--lg-border)`
  - Add `.lg-header::before` gradient overlay: `background: linear-gradient(135deg, var(--lg-c1), var(--lg-c2)); opacity: 0.20; position: absolute; inset: 0; pointer-events: none`
  - Add tab button hover rule: `transition: background 150ms ease; hover: background rgba(255,255,255,0.15)`
  - Replace the existing Tailwind background/border classes on the header `<div>` in JSX with `lg-header`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Apply glass surface styles to the Chat Panel root and wire `lg-panel` class
  - Replace the existing Tailwind classes (`bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl`) on the chat panel root `<div>` with `lg-panel`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.1, 10.4_

  - [ ]* 4.1 Write property test for panel background opacity (Property 2)
    - **Property 2: Panel background opacity is within the glass range [0.55, 0.75]**
    - **Validates: Requirements 3.2**

- [x] 5. Implement panel open/close spring animation
  - Add `@keyframes lg-panel-open` and `@keyframes lg-panel-close` CSS rules (including simultaneous `filter: blur` transition)
  - Add `.lg-panel-open-anim` and `.lg-panel-close-anim` classes with the correct `animation` shorthand
  - Add `isClosing` boolean state to `LocalAssistant`
  - Replace FAB click handler: `setIsClosing(true)` → `setTimeout(() => { setIsOpen(false); setIsClosing(false); }, 220)` for close; direct `setIsOpen(true)` for open
  - Update panel render condition to `{(isOpen || isClosing) && (...)}` and apply `lg-panel-open-anim` / `lg-panel-close-anim` conditionally
  - Replace `animate-slide-up` class on the panel with the new animation class
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Implement Liquid Glass message bubbles
  - [x] 6.1 Add `.lg-bubble-bot`, `.lg-bubble-user`, and `.lg-bubble-enter` CSS rules
    - `.lg-bubble-bot`: `background: var(--lg-bubble-bot-bg); backdrop-filter: blur(8px); border: 1px solid var(--lg-border); border-radius: 16px 16px 16px 4px`
    - `.lg-bubble-user`: `background: linear-gradient(135deg, var(--lg-c1), var(--lg-c2)); border-radius: 16px 16px 4px 16px; color: #fff`
    - `@keyframes lg-bubble-in` and `.lg-bubble-enter`: 300ms slide-up-fade-in with spring cubic-bezier
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Replace bubble className strings in JSX
    - Apply `lg-bubble-bot lg-bubble-enter` to bot message `<div>` elements
    - Apply `lg-bubble-user lg-bubble-enter` to user message `<div>` elements
    - Remove conflicting Tailwind background/border/rounded classes from bubble elements
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.3 Write property test for bubble entry animation class (Property 3)
    - **Property 3: Message bubble entry animation is applied to every new bubble**
    - **Validates: Requirements 5.3**

  - [ ]* 6.4 Write property test for bubble origin corner radius (Property 4)
    - **Property 4: Message bubble origin corner has 4px radius, all others 16px**
    - **Validates: Requirements 5.4**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement the Liquid Glass FAB
  - Add `.lg-fab` CSS: `background: conic-gradient(from 0deg, var(--lg-c1), var(--lg-c2), var(--lg-c3), var(--lg-c4), var(--lg-c1)); backdrop-filter: blur(12px); box-shadow: ...; transition: transform 200ms ease, box-shadow 200ms ease`
  - Add `.lg-fab:hover` scale rule
  - Add `@property --fab-angle` Houdini declaration and `@keyframes lg-fab-spin` for gradient rotation; add `@keyframes lg-fab-shimmer` fallback using `background-position`
  - Add `.lg-fab-badge` glass pill styles
  - Add icon rotation rule: `.lg-fab-icon { transition: transform 250ms cubic-bezier(0.16,1,0.3,1) }` and `.lg-fab-icon.open { transform: rotate(180deg) }`
  - Replace existing FAB `<button>` className with `lg-fab`; apply `lg-fab-icon` + conditional `open` class to the icon wrapper
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 9. Implement the Liquid Glass Input Bar
  - Add `.lg-input-bar` CSS: `background: var(--lg-input-bg); backdrop-filter: blur(16px); border-top: 1px solid var(--lg-border)`
  - Add `.lg-input-bar:focus-within` rule with slightly higher opacity background transition (200ms)
  - Add `.lg-input-bar.lg-processing` shimmer animation rule (`@keyframes lg-shimmer`)
  - Add `.lg-send-btn` gradient fill and hover scale rule
  - Replace existing Input_Bar `<div>` className with `lg-input-bar`; conditionally add `lg-processing` when `isRunningChain` is true
  - Replace send button className with `lg-send-btn`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Implement Liquid Glass Quick Action Chips
  - Add `.lg-chip` CSS: `background: rgba(255,255,255,0.08); border: 1px solid var(--lg-border); backdrop-filter: blur(8px); color: var(--lg-c2); transition: background 150ms ease`
  - Add `.lg-chip:hover` rule with higher opacity background
  - Add `.lg-chip:active` rule with `transform: scale(0.95); transition: transform 100ms ease`
  - Replace existing chip `<button>` className with `lg-chip`
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Verify no regressions in existing styles
  - Confirm the new CSS section does not override any existing Tailwind utilities or `--color-primary` / `--color-accent` custom properties used by other components
  - Confirm the `rounded-xl`, `rounded-2xl`, `rounded-lg` overrides in the existing `<style>` block are not affected
  - Confirm all existing component classes outside `LocalAssistant` render without visual change
  - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 11.1 Write property test for text contrast ratios (Property 5)
    - **Property 5: All foreground/background colour pairs meet WCAG 4.5:1 contrast ratio**
    - **Validates: Requirements 4.5, 5.5**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All changes are confined to `mokha-suite PRO Vqr.html` — no new files are created
- The `/* === LIQUID GLASS === */` CSS section should be appended after all existing rules to avoid specificity conflicts
- Property tests use `fast-check` (loaded via CDN or inline) with the tag format: `// Feature: story-engine-ui-redesign, Property N: <property_text>`
- The `isClosing` state addition is the only new React state; all other component logic is untouched
