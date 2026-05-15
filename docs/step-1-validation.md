# Step 1 Validation

Date: 2026-05-15

Branch: `codex/step-1-completion`

## Command Gate

The foundational command gate passed:

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm storybook:build`

`storybook:build` completed with the existing Vite chunk-size warning only.

## Direct SDK Validation

The Pi SDK was validated from the Electron main-process dependency boundary:

- SDK import from `@earendil-works/pi-coding-agent` succeeded.
- AgentSession creation succeeded against the repository folder.
- AgentSession disposal succeeded.
- A bounded live prompt probe completed successfully.

The prompt probe sent:

```text
Respond with the single word OK.
```

The probe completed and observed 27 SDK events with these event types:

- `agent_start`
- `turn_start`
- `message_start`
- `message_end`
- `message_update`
- `turn_end`
- `agent_end`

Sandbox note: SDK session creation writes under the user's Pi runtime directory. A sandboxed direct probe failed with a filesystem permission error, while the same probe succeeded with normal local filesystem permissions. This matches the expected desktop runtime requirement and does not affect the renderer isolation model.

## Electron Smoke Test

The Electron development app was launched with:

```sh
npm run dev
```

The smoke run confirmed:

- Electron main build completed.
- Preload build completed.
- Renderer dev server started at `http://localhost:5173/`.
- Electron app startup reached the launch phase without observed main-process runtime errors.
- The smoke-test process was stopped after validation.

## Governance Review

The Step 1 implementation was reviewed against [AGENTS.md](../AGENTS.md) and [Gooey Pi design governance](gooey-pi-design-governance.md).

Confirmed foundations:

- Renderer communication stays behind the typed `window.gooeyPi` preload contract.
- Pi SDK imports stay out of renderer code.
- Shared app types cover project folder state, session status, errors, diagnostics, raw Pi events, normalized app events, and renderer store state.
- Renderer surfaces use shared primitives and tokenized styling.
- Storybook uses mocked Electron and Pi data only.
- The app shell remains compact, operational, and debug-oriented without decorative drift.
- Debug payloads are expandable, copyable, and bounded for readability.
- Visible errors, diagnostics, run status, and stop state are represented in the UI.

## Coverage Notes

This validation combines local command gates, direct SDK probes, and an Electron launch smoke test. The full native UI workflow still needs a human manual pass through folder selection, prompt submission, streaming review, stop behavior, relaunch restore, and debug inspection before relying on the app for production-like work.

Use [manual QA checklist](manual-qa-checklist.md) for that pass.
