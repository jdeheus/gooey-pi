# Known Limitations After Step 1

This document records known gaps after the foundational implementation. These items are not blockers for the Step 1 foundation, but they should guide follow-up planning.

## Confirmed Foundation

The current foundation supports:

- Electron main, preload, renderer, and shared TypeScript boundaries.
- Renderer-safe preload communication through `window.gooeyPi`.
- Native project folder selection and persisted folder restore.
- Typed project folder validation.
- Pi SDK import, runtime readiness diagnostics, AgentSession creation, prompt submission, event capture, and stop/dispose control from the main process.
- Raw Pi event capture and normalized app event translation.
- Chat timeline state derived from normalized events.
- User-visible typed errors and debug error inspection.
- Startup diagnostics for app, project restore, and Pi runtime readiness.
- Shared renderer primitives, tokenized styling, and Storybook mock coverage.

## Deferred Product Scope

These items are intentionally outside the Step 1 foundation:

- Multi-session management.
- Conversation history browsing across prior Pi session files.
- User-configurable model, provider, authentication, and runtime settings.
- Rich prompt templates or slash-command workflows.
- Advanced debug search across raw events, normalized events, diagnostics, and errors.
- Automated visual regression testing.
- CI-hosted Electron smoke tests.
- Production packaging, notarization, signing, and updater workflows.

## Operational Caveats

- Full live SDK behavior depends on the user's local Pi runtime state, credentials, and project folder permissions.
- SDK probes need normal local filesystem access because the Pi runtime writes under the user's runtime directory.
- Automated validation did not drive the native macOS folder dialog or click through the complete Electron UI workflow.
- The current app assumes one active AgentSession at a time.
- Stop behavior depends on the SDK accepting abort/dispose requests for the active run.
- Event normalization covers the event shapes observed during the foundational probes and should be expanded as new Pi SDK event shapes are encountered.

## UI And Storybook Caveats

- Storybook remains renderer-only and uses mock data by design; it does not validate live Electron or SDK behavior.
- Base UI is installed and available as the low-level accessible interaction foundation, but several current primitives are simple semantic wrappers because the Step 1 UI does not yet need richer overlay, menu, popover, or selection behavior.
- Visual QA is manual. No automated screenshot diff or accessibility audit is wired into the command gate yet.
- The debug panel has tab-level filtering and bounded payload display, but no cross-tab query language or saved filters.

## Recommended Follow-Up

Before broader feature expansion:

- Run the complete [manual QA checklist](manual-qa-checklist.md) in the packaged target environment.
- Add automated renderer interaction coverage for composer, debug tabs, error dismissal, and stop control.
- Add an Electron UI automation path that can cover folder selection without relying on manual native dialog interaction.
- Extend normalized event fixtures as more Pi SDK event variants are observed.
- Decide whether multi-session support belongs in the next major workflow milestone or should remain explicitly deferred.
