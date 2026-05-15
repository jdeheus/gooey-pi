# Pi SDK Integration Notes

Gooey Pi uses the Pi SDK directly from the Electron main process through `@earendil-works/pi-coding-agent`.

## Dependency

- Package: `@earendil-works/pi-coding-agent`
- Version: `0.74.0`
- Module format: ESM

The earlier `@mariozechner/pi-coding-agent` package scope is deprecated. The current Pi package scope is `@earendil-works`, so new integration code should import from `@earendil-works/pi-coding-agent`.

## Boundary

Pi SDK imports are isolated to `src/main`.

Renderer code talks to the main process through the typed `window.gooeyPi` preload contract. Renderer code must not import Pi SDK modules, Electron main APIs, Node filesystem APIs, or runtime process-management APIs directly.

## Runtime Readiness

The SDK integration uses an in-process runtime readiness check. On Electron app launch the main process attempts to load the SDK with a bounded timeout. The renderer receives a typed runtime snapshot and can show nonfatal `starting`, `ready`, or `errored` states.

Session creation remains recoverable: if the SDK cannot load, if auth/model setup fails, or if the selected project folder is invalid, the main process returns a typed app error instead of throwing raw SDK or filesystem details through the renderer boundary.
