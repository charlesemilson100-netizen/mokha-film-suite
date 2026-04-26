# Requirements Document

## Introduction

This feature redesigns the visual UI/UX of the **Story Engine** — specifically the `LocalAssistant` chat interface (the floating chat panel and its FAB trigger button) inside `mokha-suite PRO Vqr.html`. The redesign adopts Apple's iOS 26 "Liquid Glass" design language: translucent frosted-glass panels, a 4-point animated gradient mesh background, fluid micro-animations, and a polished, premium feel — all implemented as pure CSS/JS within the single HTML file. No functional logic of the assistant is changed; only the visual layer is affected.

## Glossary

- **LocalAssistant**: The floating chat widget component rendered at the bottom-right of the screen, providing an offline AI assistant interface.
- **FAB**: Floating Action Button — the circular trigger button that opens/closes the chat panel.
- **Liquid_Glass**: Apple's iOS 26 design language characterised by translucent, blurred, multi-layered surfaces that refract and reflect the content behind them.
- **Gradient_Mesh**: An animated background layer composed of soft, blurred colour orbs or mesh nodes that drift slowly and randomly, creating a living, dynamic backdrop.
- **4-Point_Gradient**: A colour scheme defined by exactly four distinct colour stops, producing a rich, multi-hued gradient.
- **Chat_Panel**: The expanded 320 × 520 px floating window containing the header, message list, quick-action chips, and input bar.
- **Message_Bubble**: An individual chat message rendered inside the Chat_Panel.
- **Quick_Action_Chip**: A small tappable pill button in the horizontal scroll row above the input bar.
- **Header_Bar**: The top section of the Chat_Panel containing the assistant name, status line, and tab controls.
- **Input_Bar**: The bottom section of the Chat_Panel containing the text field and send button.
- **Backdrop_Filter**: A CSS property (`backdrop-filter: blur(...)`) that blurs the content rendered behind an element, producing the frosted-glass effect.
- **Orb**: A large, soft, radially-blurred circle of colour used as a component of the Gradient_Mesh.

---

## Requirements

### Requirement 1: Animated Gradient Mesh Background

**User Story:** As a user, I want the chat panel to display a living, animated colour background, so that the interface feels dynamic and visually premium rather than flat.

#### Acceptance Criteria

1. THE Chat_Panel SHALL render a Gradient_Mesh layer as its background, composed of at least 4 Orbs, each assigned one colour from the 4-Point_Gradient.
2. WHEN the Chat_Panel is open, THE Gradient_Mesh SHALL animate continuously, with each Orb drifting along a randomised path using CSS keyframe animations.
3. THE Gradient_Mesh SHALL loop infinitely with no visible seam or jump between animation cycles.
4. THE Gradient_Mesh animation SHALL use staggered durations between 8 s and 20 s per Orb so that the motion appears organic and non-repetitive.
5. THE Gradient_Mesh layer SHALL be positioned behind all UI content using `z-index` layering and SHALL NOT intercept pointer events.
6. WHEN the Chat_Panel is closed, THE Gradient_Mesh animation SHALL be paused or the layer removed from the DOM to conserve CPU resources.

---

### Requirement 2: 4-Point Gradient Colour Scheme

**User Story:** As a user, I want the interface to use a cohesive 4-colour gradient palette, so that the visual identity is rich and distinctive.

#### Acceptance Criteria

1. THE Chat_Panel SHALL define exactly 4 CSS custom properties (`--lg-c1`, `--lg-c2`, `--lg-c3`, `--lg-c4`) representing the four gradient colour stops.
2. THE 4-Point_Gradient SHALL be applied consistently to the Gradient_Mesh Orbs, the Header_Bar accent, and interactive highlights.
3. WHERE the application is in dark mode, THE Chat_Panel SHALL use a dark-tinted variant of the 4-Point_Gradient (colours shifted toward lower lightness values) to maintain legibility.
4. WHERE the application is in light mode, THE Chat_Panel SHALL use a lighter, more saturated variant of the 4-Point_Gradient.
5. THE 4-Point_Gradient colour stops SHALL be configurable via the four CSS custom properties without requiring changes to any other CSS rule.

---

### Requirement 3: Liquid Glass Panel Surface

**User Story:** As a user, I want the chat panel surface to look like frosted glass, so that it feels layered and modern rather than opaque.

#### Acceptance Criteria

1. THE Chat_Panel SHALL apply `backdrop-filter: blur(24px)` (or equivalent vendor-prefixed form) to produce the frosted-glass effect.
2. THE Chat_Panel background SHALL use a semi-transparent fill (`rgba` or equivalent) with an opacity between 0.55 and 0.75 so that the Gradient_Mesh behind it remains partially visible.
3. THE Chat_Panel SHALL render a 1 px border using a semi-transparent white or light colour (`rgba(255,255,255,0.18)` or equivalent) to simulate a glass edge highlight.
4. THE Chat_Panel SHALL cast a multi-layer `box-shadow` that includes both a soft ambient shadow and a subtle inner highlight to reinforce the glass depth illusion.
5. IF the user's browser does not support `backdrop-filter`, THEN THE Chat_Panel SHALL fall back to a fully opaque dark or light panel background that maintains readability.

---

### Requirement 4: Liquid Glass Header Bar

**User Story:** As a user, I want the header bar to feel like a distinct glass layer above the panel body, so that the visual hierarchy is clear and premium.

#### Acceptance Criteria

1. THE Header_Bar SHALL use a separate semi-transparent background distinct from the Chat_Panel body, creating a visible layering effect.
2. THE Header_Bar SHALL display a subtle gradient overlay derived from the 4-Point_Gradient at reduced opacity (≤ 0.35) to tint the glass surface.
3. THE Header_Bar border-bottom SHALL use a semi-transparent white line to separate it from the message area without a hard opaque edge.
4. WHEN the user hovers over a tab button in the Header_Bar, THE button SHALL transition its background to a semi-transparent white highlight within 150 ms.
5. THE Header_Bar text and icons SHALL maintain a contrast ratio of at least 4.5:1 against the Header_Bar background in both dark and light modes.

---

### Requirement 5: Liquid Glass Message Bubbles

**User Story:** As a user, I want message bubbles to use the glass aesthetic, so that the conversation feels visually integrated with the overall design.

#### Acceptance Criteria

1. THE Message_Bubble for bot messages SHALL apply a semi-transparent background with `backdrop-filter: blur(8px)` and a 1 px semi-transparent border.
2. THE Message_Bubble for user messages SHALL use a gradient fill derived from the 4-Point_Gradient (using `--lg-c1` and `--lg-c2`) instead of a flat primary colour.
3. WHEN a new Message_Bubble is added to the chat, THE bubble SHALL animate in using a slide-up-and-fade-in transition of 300 ms duration.
4. THE Message_Bubble border-radius SHALL be 16 px on all corners except the origin corner (bottom-right for user, bottom-left for bot), which SHALL be 4 px, to indicate message direction.
5. THE Message_Bubble text SHALL maintain a minimum contrast ratio of 4.5:1 against its background in both dark and light modes.

---

### Requirement 6: Animated FAB (Floating Action Button)

**User Story:** As a user, I want the FAB trigger button to reflect the Liquid Glass aesthetic, so that it feels like a premium entry point to the assistant.

#### Acceptance Criteria

1. THE FAB SHALL apply a gradient fill using all 4 colours of the 4-Point_Gradient, cycling through them as a conic or linear gradient.
2. THE FAB SHALL display a continuous slow rotation or shimmer animation on its gradient fill when the Chat_Panel is closed, drawing subtle attention.
3. WHEN the user hovers over the FAB, THE FAB SHALL scale to 1.08 and increase its `box-shadow` spread within 200 ms using a CSS transition.
4. WHEN the user clicks the FAB to open the Chat_Panel, THE FAB icon SHALL transition from the Brain icon to the X icon with a 180-degree rotation animation of 250 ms.
5. THE FAB SHALL apply `backdrop-filter: blur(12px)` and a semi-transparent background to maintain the glass aesthetic.
6. IF a session shot count badge is displayed on the FAB, THEN THE badge SHALL use a glass-style pill with a semi-transparent background rather than a flat opaque colour.

---

### Requirement 7: Liquid Glass Input Bar

**User Story:** As a user, I want the input bar to feel like a frosted glass tray at the bottom of the panel, so that it is visually distinct and inviting to type in.

#### Acceptance Criteria

1. THE Input_Bar SHALL apply `backdrop-filter: blur(16px)` and a semi-transparent background to distinguish it from the message list above.
2. THE Input_Bar border-top SHALL use a semi-transparent white line consistent with the glass edge language used elsewhere in the Chat_Panel.
3. WHEN the text input field is focused, THE Input_Bar SHALL transition its background to a slightly higher opacity value within 200 ms to indicate active state.
4. THE send button inside the Input_Bar SHALL use a gradient fill from the 4-Point_Gradient and SHALL scale to 1.1 on hover within 150 ms.
5. WHEN the agent is running a chain (`isRunningChain` is true), THE Input_Bar SHALL display a subtle animated gradient shimmer across its surface to indicate processing state.

---

### Requirement 8: Quick Action Chips

**User Story:** As a user, I want the quick-action chips to use the glass aesthetic, so that they feel like tactile glass pills rather than flat buttons.

#### Acceptance Criteria

1. THE Quick_Action_Chip SHALL use a semi-transparent background with a 1 px semi-transparent border and `backdrop-filter: blur(8px)`.
2. WHEN the user hovers over a Quick_Action_Chip, THE chip SHALL transition its background to a higher opacity and apply a subtle gradient highlight within 150 ms.
3. WHEN the user taps or clicks a Quick_Action_Chip, THE chip SHALL briefly scale down to 0.95 and back to 1.0 within 100 ms to provide tactile feedback.
4. THE Quick_Action_Chip text SHALL use a colour derived from the 4-Point_Gradient to provide visual variety across chip categories.

---

### Requirement 9: Smooth Panel Open/Close Animation

**User Story:** As a user, I want the chat panel to open and close with a fluid, spring-like animation, so that the interaction feels polished and physical.

#### Acceptance Criteria

1. WHEN the Chat_Panel opens, THE panel SHALL animate from `opacity: 0; transform: scale(0.92) translateY(16px)` to `opacity: 1; transform: scale(1) translateY(0)` using a cubic-bezier spring curve `(0.16, 1, 0.3, 1)` over 380 ms.
2. WHEN the Chat_Panel closes, THE panel SHALL animate from `opacity: 1; transform: scale(1)` to `opacity: 0; transform: scale(0.92) translateY(16px)` over 220 ms using an ease-in curve.
3. THE Chat_Panel open animation SHALL include a simultaneous blur transition from `blur(8px)` to `blur(0px)` on the panel content to simulate a focus-pull effect.
4. THE Chat_Panel open/close animation SHALL not cause layout reflow on the rest of the page.

---

### Requirement 10: Single-File Implementation Constraint

**User Story:** As a developer, I want all visual changes confined to `mokha-suite PRO Vqr.html`, so that no new files or build steps are introduced.

#### Acceptance Criteria

1. THE Chat_Panel redesign SHALL be implemented entirely within `mokha-suite PRO Vqr.html` using inline `<style>` blocks and JSX className changes.
2. THE implementation SHALL NOT introduce any new external CSS files, JavaScript files, or CDN dependencies beyond those already present in the file.
3. THE implementation SHALL NOT modify any functional logic of the `LocalAssistant` component (state management, message handling, agent dispatch, KB queries).
4. THE implementation SHALL NOT break any existing Tailwind utility classes or CSS custom properties used by other components in the file.
5. WHEN the file is opened in a modern browser (Chrome 100+, Safari 16+, Firefox 103+), THE redesigned Chat_Panel SHALL render correctly without errors in the browser console.
