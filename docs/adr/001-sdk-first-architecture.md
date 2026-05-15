# ADR 001: SDK-First Pi Integration

## Status

Accepted for the foundational buildout.

## Context

Gooey Pi is an Electron application foundation with a renderer-safe preload boundary. The app needs to support future interface work that can create Pi AgentSessions, send prompts, stream events, stop active runs, surface diagnostics, and preserve a strict boundary between renderer code and Node/Electron/Pi SDK capabilities.

The foundational implementation uses:

- Electron main process for Pi SDK access and filesystem/project-folder work.
- Typed preload APIs exposed as `window.gooeyPi`.
- Shared types for snapshots, app events, and typed errors.
- Storybook retained as an empty interface workbench until the interface is rebuilt.
- Startup diagnostics that load the Pi SDK with a bounded timeout and report readiness through typed app events.

## Decision

Use the Pi SDK directly from the Electron main process through `@earendil-works/pi-coding-agent`.

The renderer must not import Pi SDK modules, Electron main APIs, Node filesystem APIs, or process-management APIs. All renderer-facing access goes through the typed preload contract in `src/shared/app-api.ts` and `src/preload/index.ts`.

The main process owns:

- Pi runtime readiness checks.
- AgentSession creation and disposal.
- Prompt submission.
- Stop/abort control.
- Raw Pi event capture.
- Translation into normalized app events.
- Typed recoverable errors.
- Startup diagnostics.

The future renderer interface will own UI state presentation and user-facing interaction surfaces. The implemented Step 1 interface has been removed so that work can be redesigned from the ground up.

## Alternatives Considered

### RPC Mode

RPC mode could isolate Pi runtime execution behind a separate process and provide a stronger fault boundary. It was not selected for the foundation because the current goal is a build-clean, inspectable, SDK-first workflow with direct typed control over session lifecycle, event translation, and stop behavior.

Revisit RPC if direct SDK usage introduces unavoidable process stability problems, if SDK startup becomes too heavy for the main process, or if future multi-session/runtime isolation requirements need a separate service boundary.

### Terminal Wrapper

A terminal wrapper could shell out to a CLI and parse stdout/stderr. It was not selected because it would weaken typed event handling, make stop behavior less deterministic, and push the renderer toward terminal-output parsing instead of structured app events.

Revisit terminal wrapping only for diagnostics or escape-hatch workflows where the SDK cannot expose equivalent structured behavior.

## Tradeoffs

Benefits:

- Strong typed boundaries from main to preload to renderer.
- Direct AgentSession lifecycle control.
- Structured raw and normalized event capture.
- Clear renderer isolation from Node and Pi SDK APIs.
- A future Storybook surface can mock renderer data because the main/preload boundary exposes plain typed state.
- Startup readiness is visible without blocking launch.

Costs:

- Main process now owns SDK startup failure handling.
- SDK import/runtime behavior can affect Electron launch diagnostics.
- Future process isolation may require a migration if SDK work becomes heavy.
- Direct SDK assumptions must be covered by manual QA until broader automation exists.

## Runtime Startup Decision

On app launch, the main process runs lightweight startup diagnostics once. The diagnostics attempt to load the Pi SDK through the runtime readiness layer with a bounded timeout. Success and failure are reported as typed diagnostic app events. SDK load failure is also surfaced as a typed app error.

Diagnostics do not block renderer launch. Session creation remains recoverable if the SDK is unavailable.

## Renderer Constraints

Renderer code must remain isolated from Pi SDK modules, Electron main APIs, Node filesystem APIs, and runtime process-management APIs. Future interface work should define its own visual governance before rebuilding shared primitives, Storybook stories, or app screens.

## Revisit Conditions

Revisit this ADR if:

- Pi SDK startup becomes slow or unstable in the main process.
- Multiple isolated Pi runtimes are required.
- Stop/abort control needs stronger process-level guarantees.
- The SDK exposes a preferred RPC runtime for GUI integrations.
- Security review requires moving Pi runtime execution out of Electron main.
