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

# Interface Workflow

Coss UI is the approved renderer interface direction unless a newer approved interface direction replaces it.

Renderer interface work should be implemented as granular Linear issues. Each issue should add one narrow visible UI increment and matching Storybook coverage for the exact component, state, or interaction introduced.

Linear milestones are review containers, not automatic completion gates. A milestone is complete only after all included issues are implemented, Storybook coverage is present, verification passes, and Jon explicitly approves the milestone.

Storybook remains renderer-only. Stories must use mocked renderer data and must not import Electron main/preload code, Node APIs, or Pi SDK runtime modules.

---

# GitHub Workflow

After a Linear milestone is complete, approved by Jon, and verified, agents should attempt to push the completed work to GitHub.

If the push cannot be completed because of authentication, network access, branch state, or repository permissions, report the failure clearly with the command attempted and the reason it failed.

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
