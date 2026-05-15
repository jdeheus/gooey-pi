# AGENTS.md

## Purpose

This file defines the persistent engineering standards, architectural expectations, and implementation rules for the Gooey Pi repository.

These rules are intended to guide:
- AI coding agents
- human contributors
- automated implementation workflows
- renderer architecture decisions

AGENTS.md defines how the repository should be built.

Linear defines what must be delivered during a specific implementation phase.

---

# Architecture Governance

Persistent engineering standards and architectural rules live in AGENTS.md.

Execution sequencing, milestone gating, implementation checkpoints, ticket dependencies, and delivery-specific acceptance criteria live in Linear.

When architectural standards conflict with temporary implementation shortcuts, architectural standards take precedence unless explicitly overridden.

---

# Repository Philosophy

The foundational implementation should prioritize:
- clarity
- composability
- maintainability
- deterministic state flow
- typed boundaries
- renderer safety
- incremental extensibility

The goal is not to prematurely build a massive enterprise platform.

The goal is to create strong enough foundations that future features compose cleanly without large-scale rewrites.

---

# AI Agent Expectations

AI coding agents working in this repository should:
- preserve renderer/main-process boundaries
- avoid introducing architectural drift

The implemented interface layer has been intentionally removed. Do not reintroduce renderer screens, shared UI primitives, visual governance, or Storybook stories without a new approved interface direction.

---

# Final Principle

The foundational implementation should optimize for:
- long-term composability
- architectural clarity
- predictable renderer behavior
- maintainable feature growth

The system should remain intentionally lightweight while still enforcing strong foundational structure.
