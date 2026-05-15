# Storybook Conventions

Storybook is a renderer-only verification surface for Gooey Pi primitives, app shell composition, and future feature surfaces.

## Locations

- Reusable primitive stories live beside the renderer component they document.
- App shell and product composition stories live under `src/renderer/components`.
- Stories must not import `src/main`, `src/preload`, Electron APIs, Node APIs, or live Pi SDK code.

## Required states

Reusable component stories should cover the states that apply to the component: default, hover-intent through visible variants, focus-visible, active, disabled, loading, empty, error, selected, expanded/collapsed, open/closed, and invalid.

## Mock data

Use static mock data for session state, project folders, messages, raw events, normalized events, errors, and diagnostics. Mock data should look like operational Gooey Pi data and avoid marketing copy or lorem ipsum.

## Styling and icons

Stories load the same Tailwind entrypoint as the app. Lucide icons are the default app icon source. Base UI-backed wrappers should describe the Base UI primitive or behavior being wrapped when applicable.
