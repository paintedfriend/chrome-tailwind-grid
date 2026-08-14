# Tailwind Grid Overlay

The popup toggles the following overlays on the current page:

- a 12-column grid with `gap: 1.5rem`;
- 4 px and 16 px baseline grids;
- columns aligned to the first `.container` element, accounting for its padding.

The popup lets you configure the column count, gap, container CSS selector,
column opacity, and grid visibility. Settings are synced through Chrome and
applied to an enabled overlay immediately.

The enabled state is kept per tab for the current browser session, so the grid
is restored automatically after reloading that tab.

## Installation

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `chrome-tailwind-grid` folder.

Chrome does not allow extensions to inject scripts into internal pages (`chrome://...`). The popup will indicate that the grid is unavailable on those pages.
