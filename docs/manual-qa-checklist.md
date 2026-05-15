# Manual QA Checklist

Run this checklist before marking the foundational workflow complete.

## Prerequisites

- Dependencies are installed with `corepack pnpm install`.
- Validation commands pass:
  - `corepack pnpm typecheck`
  - `corepack pnpm test`
  - `corepack pnpm build`
  - `corepack pnpm storybook:build`
- The app can be launched with `corepack pnpm dev`.
- A readable local project folder is available for testing.

## Launch And Startup

- Launch the Electron app.
- Confirm the renderer loads without a blank screen.
- Confirm the bridge badge reaches a ready or Storybook-safe state as appropriate.
- Confirm Pi runtime readiness is visible.
- Open the debug panel Diagnostics tab.
- Confirm startup diagnostics are present for Electron app, last project folder, and Pi runtime.
- Confirm an invalid restored folder is reported as a typed nonfatal error and does not crash the app.

## Project Folder

- Select a readable project folder.
- Confirm selected path, readability, writability, and Git state badges update.
- Select an invalid or unreadable path if available.
- Confirm the project folder error is user visible and appears in the debug Errors tab.
- Dismiss a nonfatal error and confirm it disappears from the user-facing surface while structured debug data remains available until cleared.

## Session Lifecycle

- Create an AgentSession from a valid folder.
- Confirm session status changes to ready.
- Confirm session creation failures are user visible when Pi runtime or folder state is invalid.
- Change project folder while idle and confirm the active session is disposed/reset.
- Attempt to change folder while a run is active.
- Confirm the change is blocked and a typed nonfatal error is shown.

## Prompt And Streaming

- Enter a multiline prompt in the composer.
- Submit with the Send button.
- Repeat with Cmd Enter.
- Confirm successful send clears the composer.
- Confirm failed submission does not clear the composer.
- Confirm user messages appear in the timeline.
- Confirm assistant streaming deltas appear when Pi emits them.
- Confirm run status is visible while active.

## Stop Control

- Start a run that streams long enough to stop.
- Confirm Stop run is enabled only while running or aborting.
- Click Stop run.
- Confirm status changes through aborting to stopped or a typed stop error.
- Confirm the assistant message is marked stopped when applicable.
- Confirm a new prompt can be submitted after stop completes.

## Debug Panel

- Confirm Raw, App, Diagnostics, and Errors tabs show count badges.
- Expand raw events and app events.
- Confirm JSON payloads are readable and height-bounded.
- Copy payload JSON from expanded debug rows.
- Clear the current Raw tab and confirm raw events are cleared.
- Clear the current App tab and confirm normalized app events are cleared.
- Clear the current Diagnostics tab and confirm diagnostic events are cleared.
- Clear the current Errors tab only when intentionally clearing active errors.

## Accessibility And Governance

- Navigate primary controls with keyboard only.
- Confirm focus-visible outlines are present.
- Confirm disabled and loading states are visually clear.
- Enable reduced motion at the OS level if practical and confirm no required interaction depends on animation.
- Confirm layout remains compact and readable at the minimum app size.
- Confirm the UI avoids prohibited visual drift: no decorative gradients, glowing chrome, giant floating cards, or ornamental motion.
- Confirm feature surfaces use shared primitives from `src/renderer/components/primitives.tsx`.
- Confirm Storybook stories render realistic mocked states and do not import Electron, Node, or Pi SDK APIs.

## Known Gaps

- Full live SDK success and failure coverage depends on available Pi runtime credentials and test scenarios.
- Automated visual regression coverage is not yet configured.
- Deep debug search/filtering is not included in the foundational pass.
