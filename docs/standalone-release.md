# Standalone Release Checklist

This checklist covers the first local unsigned macOS build of Gooey Pi.

## Scope

- Target: local unsigned macOS app.
- Signing, notarization, auto-updates, telemetry, and installer UX are out of scope.
- App icon and branding are approval-gated before a final release artifact is produced.

## Build Commands

Run the standard checks first:

```sh
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Create a local unsigned app bundle:

```sh
corepack pnpm run pack
```

Create local unsigned macOS app and zip artifacts:

```sh
corepack pnpm run dist:mac
```

Verify the generated artifacts:

```sh
corepack pnpm standalone:verify
```

## Manual Smoke Test

After packaging, launch the generated `.app` from `dist-electron` and confirm:

- The app opens without a main-process crash.
- Settings persist after quitting and reopening.
- Project selection and chat/session restore use app `userData`, not repo-local state.
- Pi runtime readiness is reported.
- A prompt can be submitted, streamed, stopped, and retried.
- Git status and change summaries load for a selected project.
- VS Code diff links open externally when Visual Studio Code is installed.

## Local Unsigned App Notes

macOS may warn that the app is unsigned. For local testing, open the app from Finder with the context menu if double-click launch is blocked.

Do not add signing, notarization, or a final icon without explicit approval.
