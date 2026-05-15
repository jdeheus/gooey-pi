# Gooey Pi Unified Design Governance Skill

## Purpose

This document defines the unified Gooey Pi visual governance layer.

It exists to ensure that:
- primitives remain coherent
- reusable components remain aligned
- Storybook remains implementation-realistic
- renderer UI maintains consistent interaction philosophy
- AI-assisted generation remains restrained and production-grade
- visual entropy is controlled as the application scales

This document governs:
- design tokens
- reusable primitives
- reusable components
- Storybook artifacts
- implementation-oriented design explorations
- renderer interaction behavior
- application shell layouts
- accessibility behavior
- motion systems
- visual hierarchy
- density philosophy

This document should be treated as upstream of:
- Storybook implementations
- primitive implementations
- feature compositions
- renderer surfaces
- AI-generated UI explorations

---

# Core Design Philosophy

Gooey Pi should feel like:
- elite internal tooling
- refined developer infrastructure software
- highly intentional systems engineering
- operationally efficient software
- production-grade frontend engineering
- implementation-realistic UI

The system should prioritize:
- clarity
- composability
- maintainability
- accessibility
- operational density
- low visual noise
- restrained sophistication
- predictable interaction behavior

Avoid:
- decorative futurism
- fake AI SaaS aesthetics
- ornamental complexity
- visual chaos
- excessive visual effects
- trend-chasing aesthetics
- novelty-driven interaction design

The UI should feel:
- calm
- technical
- precise
- readable
- intentional
- systemically coherent

---

# Density Philosophy

The application is compact-first.

The renderer should:
- support power users
- support long sessions
- support dense information display
- avoid wasted space
- avoid visual overload

Layouts should:
- feel structured
- support scanning
- support rapid interaction
- emphasize hierarchy over decoration

Avoid:
- oversized cards
- giant whitespace regions
- decorative layout symmetry
- bloated spacing systems
- hyper-compressed cockpit interfaces

---

# Layout Philosophy

Preferred layout structures:
- split-panel layouts
- utility-first application shells
- persistent sidebars
- persistent debug surfaces
- compositional panel systems
- stacked operational regions

Preferred layout behaviors:
- predictable resizing
- compositional consistency
- stable alignment systems
- sticky utility surfaces where appropriate

Avoid:
- landing-page layouts
- marketing-oriented layouts
- giant dashboard tiles
- disconnected floating surfaces
- ornamental asymmetry

---

# Color Philosophy

Use:
- restrained neutral palettes
- controlled accent colors
- semantic status colors
- subtle interaction states
- consistent surface hierarchy

Preferred neutral direction:
- zinc
- slate
- stone
- neutral-gray systems

The renderer should:
- remain calm
- remain readable
- avoid oversaturation
- emphasize hierarchy over decoration

Avoid:
- rainbow palettes
- glowing interfaces
- uncontrolled gradients
- gaming aesthetics
- vaporwave aesthetics
- neon-heavy UI
- excessive chroma
- ornamental overlays

---

# Typography Philosophy

Typography should:
- support operational density
- support scanning
- remain highly readable
- support technical workflows
- support implementation realism

Preferred typography direction:
- modern sans-serif systems
- strong monospace pairing
- crisp numerical rendering
- readable compact hierarchy

Avoid:
- oversized marketing typography
- decorative type systems
- ultra-light body text
- low-contrast body text
- serif-heavy application UI

Typography hierarchy should communicate:
- structure
- state
- importance
- readability
- navigation clarity

---

# Materiality Philosophy

The system should prefer:
- restrained surfaces
- subtle elevation
- border-driven hierarchy
- controlled layering
- structured separation

Preferred:
- subtle borders
- subtle elevation
- layered panels
- negative-space grouping
- restrained depth systems

Avoid:
- glassmorphism
- neumorphism
- giant shadows
- decorative blur
- excessive translucency
- ornamental 3D effects
- floating disconnected cards

Shadows should:
- communicate hierarchy only
- remain subtle
- never dominate the interface

---

# Radius Philosophy

Radius usage should be:
- restrained
- systematic
- consistent
- implementation-realistic

Preferred:
- small-to-medium radii
- controlled softness
- consistent radius families

Avoid:
- giant pill-heavy interfaces
- bubble aesthetics
- inconsistent corner treatment

---

# Motion Philosophy

Motion exists only to:
- clarify state changes
- reinforce interaction feedback
- support perceived responsiveness
- support hierarchy

Motion should be:
- subtle
- fast
- interruptible
- hardware accelerated
- implementation-realistic

Preferred:
- opacity transitions
- subtle transforms
- lightweight easing
- restrained timing

Avoid:
- cinematic motion
- bounce-heavy interactions
- decorative motion
- floating animations
- delight-for-delight’s-sake interactions

Reduced motion support is mandatory.

---

# Interaction Philosophy

Gooey Pi is keyboard-first.

Interfaces should:
- support rapid workflows
- minimize interaction friction
- expose state clearly
- support predictable interaction patterns
- remain understandable under load

All interactive surfaces should support:
- default states
- hover states
- focus-visible states
- disabled states
- loading states
- selected states
- invalid/error states
- open/closed states
- expanded/collapsed states

Avoid:
- hover-only discoverability
- invisible focus states
- modal-overload workflows
- ambiguous interaction affordances

---

# Accessibility Rules

Accessibility is mandatory.

All generated UI should support:
- semantic HTML
- keyboard navigation
- visible focus states
- screen-reader compatibility
- readable contrast
- reduced motion
- accessible hit targets

Avoid:
- inaccessible contrast
- hidden focus indicators
- motion-dependent comprehension
- inaccessible interaction targets

---

# Primitive Philosophy

Primitives should be:
- reusable
- predictable
- tokenized
- accessibility-aware
- implementation-oriented

Primitive systems should optimize for:
- composability
- consistency
- low entropy
- predictable anatomy
- state clarity

Avoid:
- one-off primitives
- decorative primitive variants
- novelty-driven primitive APIs
- unnecessary visual variation

---

# Component Philosophy

Components should:
- consume shared primitives
- consume shared tokens
- support Storybook extraction
- support design-tool iteration
- expose predictable APIs
- emphasize clarity over novelty

Component generation should optimize for:
- composability
- reuse
- maintainability
- accessibility
- implementation realism

Avoid:
- overdesigned variants
- decorative interaction patterns
- novelty-driven compositions
- random experimentation

---

# Storybook Philosophy

Storybook is:
- a verification surface
- a reusable inventory
- a design iteration surface
- an implementation review surface
- a systems reference

Stories should:
- use realistic content
- demonstrate meaningful interaction states
- support implementation extraction
- support future design-tool iteration
- remain implementation-oriented

Avoid:
- lorem ipsum sludge
- fake marketing examples
- decorative concept stories
- unrealistic showcase states

Storybook should feel:
- operational
- engineering-grade
- implementation-ready
- system-oriented

---

# Design Exploration Rules

Design explorations should:
- feel implementation-oriented
- feel production-realistic
- support React extraction
- support Storybook extraction
- support Tailwind token mapping
- support Base UI composition planning

Explorations should contain:
- realistic interaction states
- realistic density
- realistic hierarchy
- realistic spacing
- realistic content

Avoid:
- cinematic concept art
- abstract moodboards
- giant visual collages
- unrelated concept mixing
- speculative sci-fi UI

The artifact should feel like:
“A focused implementation-oriented systems exploration prepared for production React implementation.”

---

# Draft Lifecycle States

Generated assets should support lifecycle states.

## Draft
- exploratory
- AI-generated first pass
- safe for Storybook review
- safe for design-tool iteration

## In Review
- actively being refined
- not yet canonical

## Approved
- reusable source of truth
- canonical implementation reference

## Deprecated
- superseded or replaced

Draft artifacts should not automatically become system truth.

---

# Anti-Entropy Rules

The following are prohibited unless explicitly approved:
- fake AI SaaS aesthetics
- excessive gradients
- glassmorphism-heavy interfaces
- neon-heavy interfaces
- ornamental motion
- arbitrary spacing
- inconsistent radii
- duplicate primitives
- uncontrolled visual experimentation
- giant floating cards
- decorative complexity
- HUD-style dashboards

The renderer should feel:
- coherent
- disciplined
- production-ready
- technically sophisticated
- visually restrained

---

# Final Principle

Before generating any primitive, component, pattern, Storybook artifact, or renderer surface, ask:

“Does this feel like Gooey Pi?”

Not:

“Does this look flashy or visually impressive?”

The project optimizes for:
- long-term system coherence
- implementation realism
- operational clarity
- reusable infrastructure
- disciplined frontend engineering
