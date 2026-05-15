# Local Development

## Requirements

- Node.js with Corepack enabled.
- `pnpm` supplied through Corepack.
- macOS for the current Electron desktop workflow.
- Access to a local project folder for AgentSession testing.

Enable Corepack if needed:

```sh
corepack enable
```

Install dependencies:

```sh
corepack pnpm install
```

## Run The App

Start the Electron development app:

```sh
corepack pnpm dev
```

The Electron main process, preload script, and renderer are built separately by `electron-vite`. The renderer dev server normally runs on `http://localhost:5173/`, but use the Electron window for real app testing because preload APIs are required.

## Validation Commands

Run these before opening or merging foundational PRs:

```sh
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm storybook:build
```

For Electron-facing changes, also run a smoke test with:

```sh
corepack pnpm dev
```

Confirm the main process, preload build, renderer dev server, and Electron app start without runtime errors.

## Storybook

Run Storybook:

```sh
corepack pnpm storybook
```

Build Storybook:

```sh
corepack pnpm storybook:build
```

Storybook is renderer-only. Stories must use mocked project, session, diagnostics, event, and error data. Do not import `src/main`, `src/preload`, Electron APIs, Node APIs, or Pi SDK modules in stories.

See [Storybook conventions](storybook-conventions.md).

## Architecture And Boundaries

Read these before changing foundational architecture or renderer UI:

- [AGENTS.md](../AGENTS.md)
- [Design governance](gooey-pi-design-governance.md)
- [SDK-first architecture ADR](adr/001-sdk-first-architecture.md)
- [Pi SDK integration notes](pi-sdk-integration.md)
- [Base UI conventions](base-ui-conventions.md)
- [Component inventory](component-inventory.md)

The renderer communicates with Electron main through `window.gooeyPi`, defined by `src/shared/app-api.ts` and exposed from `src/preload/index.ts`.

Renderer code must not import Pi SDK modules, Electron main APIs, Node filesystem APIs, or process-management APIs directly.

## Startup Diagnostics And Debug Usage

On launch, the main process runs lightweight startup diagnostics once. Diagnostics report:

- Electron app readiness.
- Last project folder restore state.
- Pi runtime readiness.

Diagnostics appear in the Debug panel Diagnostics tab. Recoverable app errors appear in both the user-facing error stack and the Debug panel Errors tab.

Use the debug panel to inspect:

- Raw Pi SDK events.
- Normalized app events.
- Startup diagnostics.
- Typed app errors.

Each debug tab has count badges. Expanded rows show bounded JSON payloads with copy controls. The clear button clears the current tab.

## Pi SDK Caveats

The Pi SDK is imported only from the Electron main process through `@earendil-works/pi-coding-agent`.

If the SDK cannot load:

- Startup diagnostics show Pi runtime failure.
- The runtime snapshot enters `errored`.
- Session creation returns a typed recoverable app error.
- The renderer should remain usable for project selection, debug inspection, and error review.

If a prompt or stop action fails, the composer preserves user input unless the send succeeds.

## Foundational QA

Use [manual QA checklist](manual-qa-checklist.md) before Step 1 completion work. It covers happy paths, failure paths, keyboard behavior, reduced motion, startup readiness, debug readability, shared primitive usage, and known gaps.
