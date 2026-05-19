# Local Development

## Requirements

- Node.js with Corepack enabled.
- `pnpm` supplied through Corepack.
- macOS for the current Electron desktop workflow.

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

The Electron main process, preload script, and renderer are built separately by `electron-vite`. The renderer uses mocked data in Storybook and talks to Electron main through the preload API in the app.

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

## Local Standalone Packaging

Create an unsigned local macOS app bundle:

```sh
corepack pnpm run pack
```

Create unsigned local macOS app and zip artifacts:

```sh
corepack pnpm run dist:mac
```

Verify the generated standalone artifacts:

```sh
corepack pnpm standalone:verify
```

Generated artifacts are written to `dist-electron` and are ignored by Git. The first standalone target is local unsigned macOS only; signing, notarization, auto-updates, and final icon branding are handled separately.

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

Storybook now covers renderer surfaces and interaction states. Storybook coverage is required for visible renderer UI changes, but not for packaging-only changes.

## Architecture And Boundaries

Read these before changing foundational architecture:

- [AGENTS.md](../AGENTS.md)
- [SDK-first architecture ADR](adr/001-sdk-first-architecture.md)
- [Pi SDK integration notes](pi-sdk-integration.md)

The renderer communicates with Electron main through `window.gooeyPi`, defined by `src/shared/app-api.ts` and exposed from `src/preload/index.ts`.

Renderer code must not import Pi SDK modules, Electron main APIs, Node filesystem APIs, or process-management APIs directly.

## Startup Diagnostics

On launch, the main process runs lightweight startup diagnostics once. Diagnostics still exist in the main-process event stream, but no renderer interface currently displays them.

## Pi SDK Caveats

The Pi SDK is imported only from the Electron main process through `@earendil-works/pi-coding-agent`.

If the SDK cannot load:

- Startup diagnostics capture Pi runtime failure.
- The runtime snapshot enters `errored`.
- Session creation returns a typed recoverable app error through the preload contract.
