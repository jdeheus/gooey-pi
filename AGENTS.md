# AGENTS.md

## Purpose

This file defines the persistent engineering standards, architectural expectations, UI philosophy, and implementation rules for the Gooey Pi repository.

These rules are intended to guide:
- AI coding agents
- human contributors
- automated implementation workflows
- renderer architecture decisions
- Storybook integration patterns
- reusable UI system development

AGENTS.md defines how the repository should be built.

Linear defines what must be delivered during a specific implementation phase.

---

# Architecture Governance

Persistent engineering standards and architectural rules live in AGENTS.md.

Execution sequencing, milestone gating, implementation checkpoints, ticket dependencies, and delivery-specific acceptance criteria live in Linear.

When architectural standards conflict with temporary implementation shortcuts, architectural standards take precedence unless explicitly overridden.

---

# Design Governance

All renderer UI generation, Storybook generation, primitive creation, reusable component creation, high-fidelity design exploration, and implementation-oriented UI planning must follow:

docs/gooey-pi-design-governance.md

This document defines the persistent Gooey Pi visual and interaction philosophy.

The governance document is considered authoritative for:
- visual restraint
- density philosophy
- spacing philosophy
- typography philosophy
- color philosophy
- motion philosophy
- primitive/component behavior
- Storybook aesthetics
- implementation-oriented realism
- interaction semantics
- anti-entropy rules
- prohibited aesthetic patterns

The governance document exists to ensure that:
- AI-generated UI remains systemically coherent
- reusable primitives remain visually aligned
- Storybook artifacts remain implementation-realistic
- feature-level UI does not drift stylistically
- exploratory design work remains grounded in Gooey Pi’s product identity

When generating UI, the system should optimize for:
- implementation realism
- operational clarity
- reusable composition
- restrained sophistication
- high signal-to-noise ratio
- accessibility
- long-term maintainability

not:
- trend-chasing
- decorative experimentation
- fake AI SaaS aesthetics
- excessive visual effects
- ornamental complexity

If a generated UI direction conflicts with the governance document:
1. surface the conflict
2. do not silently violate governance rules
3. prefer systemic consistency over novelty

The governance document should be treated as upstream of:
- Storybook implementations
- primitive implementations
- feature compositions
- renderer surfaces
- AI-generated UI explorations

---

# Repository Philosophy

The foundational implementation should prioritize:
- clarity
- composability
- maintainability
- deterministic state flow
- reusable UI primitives
- typed boundaries
- renderer safety
- incremental extensibility

The goal is not to prematurely build a massive enterprise platform.

The goal is to create strong enough foundations that future features compose cleanly without large-scale rewrites.

---

# Renderer UI Philosophy

The renderer should be composed from shared reusable primitives and design tokens rather than feature-specific inline UI implementations.

Reusable components should be implemented and validated in Storybook before broad feature integration.

Feature work should compose existing primitives whenever practical instead of introducing duplicate interaction or styling patterns.

The app should prefer:
- composition over duplication
- shared primitives over screen-specific implementations
- tokenized styling over hard-coded values
- predictable interaction patterns over one-off behaviors

---

# Base UI and Tailwind Philosophy

Base UI should be treated as the preferred low-level accessible interaction foundation for renderer primitives where a suitable Base UI primitive exists.

Tailwind CSS should be treated as the default renderer styling layer.

Avoid rebuilding accessibility and interaction behavior already provided by Base UI unless a documented justification exists.

Renderer UI should prefer shared Gooey Pi primitives built on top of Base UI and shared design tokens.

The system should generally follow this ownership model:

Base UI = low-level accessible interaction behavior
Tailwind + Gooey Pi tokens = visual styling system
Gooey Pi components = product semantics and reusable composition

---

# Foundational UI Architecture

The foundational renderer architecture should generally follow this layering:

Design Tokens
→ Base UI primitives
→ Shared Gooey Pi UI wrappers
→ Shared Surface Components
→ Feature Composition
→ App Screens

Preferred development flow:

Tokens
→ Base UI setup
→ Shared primitives
→ Storybook validation
→ App shell
→ Feature composition

Avoid:

Feature screens
→ Temporary inline UI
→ Shared abstraction later

---

# Design Tokens

All renderer UI should consume shared design tokens rather than hard-coded values.

Tokens should exist for:
- typography
- spacing
- color
- borders
- border radius
- elevation/shadows
- focus states
- status colors
- interaction states
- motion/timing

Hard-coded visual values should be avoided unless explicitly justified.

---

# Shared Primitive Requirements

Reusable primitives should exist before large-scale feature composition begins.

Foundational primitives include:
- Button
- IconButton
- Textarea
- Panel
- PanelHeader
- Badge
- StatusBadge
- Spinner
- Tabs
- EmptyState
- ErrorBanner
- InlineError
- CodeBlock
- JsonViewer
- CopyButton

Feature-specific components should not duplicate foundational primitive behavior.

---

# Storybook Requirements

Storybook is considered part of the renderer architecture.

Storybook should be used to:
- validate reusable components
- verify interaction states
- review visual consistency
- isolate renderer-safe UI behavior
- support future visual regression workflows

Stories should cover relevant states including:
- default
- hover
- focus-visible
- active
- disabled
- loading
- empty
- error
- selected
- expanded/collapsed
- open/closed
- invalid

Storybook stories should avoid live Electron or SDK dependencies.

Use mock data for:
- session state
- messages
- debug events
- errors
- project folders
- diagnostics

---

# Accessibility Expectations

Renderer UI should support:
- keyboard navigation
- visible focus states
- semantic interaction behavior
- readable contrast
- disabled-state clarity
- predictable interaction feedback

Focus-visible states should not be removed without explicit replacement.

---

# AI Agent Expectations

AI coding agents working in this repository should:
- reuse existing primitives whenever practical
- inspect Storybook before creating new reusable components
- follow existing interaction patterns
- preserve renderer/main-process boundaries
- avoid introducing duplicate visual systems
- avoid bypassing shared design tokens
- avoid introducing architectural drift

When introducing a new reusable primitive, agents should:
1. determine whether an equivalent primitive already exists
2. prefer Base UI-backed composition where appropriate
3. add Storybook coverage
4. cover meaningful states
5. ensure renderer safety
6. reuse design tokens
7. keep APIs intentionally simple

---

# Final Principle

The foundational implementation should optimize for:
- long-term composability
- architectural clarity
- predictable renderer behavior
- reusable UI systems
- maintainable feature growth

The system should remain intentionally lightweight while still enforcing strong foundational structure.
