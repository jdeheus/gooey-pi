# Base UI Conventions

Base UI is the preferred low-level accessible interaction foundation for renderer primitives where a suitable primitive exists.

Gooey Pi components should:

- expose product-level names and simple props;
- keep Tailwind and Gooey Pi tokens as the visual styling layer;
- preserve keyboard behavior, focus management, and semantic state from Base UI;
- avoid direct raw Base UI usage in feature surfaces once a Gooey Pi wrapper exists.

Initial PR 1 installs `@base-ui/react` so future wrappers can compose accessible overlay, menu, tooltip, select, dialog, field, and tab behavior without rebuilding interaction semantics.
