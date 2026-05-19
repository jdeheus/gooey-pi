# Gooey Pi

Gooey Pi is an Electron desktop app for running Pi/Codex-style coding sessions with a renderer-safe interface, durable local state, and runtime support for projects, chats, settings, Git status, approvals, and change review.

Persistent engineering standards live in [AGENTS.md](AGENTS.md).

## Development

- [Local development setup](docs/local-development.md)
- [Standalone release checklist](docs/standalone-release.md)
- [SDK-first architecture ADR](docs/adr/001-sdk-first-architecture.md)

## Local App Builds

The first standalone target is a local unsigned macOS app:

```sh
corepack pnpm run pack
corepack pnpm standalone:verify
```

Final icon branding, signing, notarization, installers, and auto-updates are intentionally outside the first local packaging pass.

## Architecture

- [Pi SDK integration notes](docs/pi-sdk-integration.md)
