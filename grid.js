(async () => {
  const GRID_ID = "tailwind-container-bound-grid";
  const CLEANUP_KEY = "__tailwindGridOverlayCleanup";
  const existingGrid = document.getElementById(GRID_ID);

  if (existingGrid) {
    if (typeof window[CLEANUP_KEY] === "function") {
      window[CLEANUP_KEY]();
    } else {
      existingGrid.remove();
    }
    return;
  }

  const config = {
    gap: "1.5rem",
    grid16: "rgba(239, 68, 68, 0.25)",
    grid4: "rgba(239, 68, 68, 0.05)",
    column: "rgba(59, 130, 246, 0.12)",
    border: "rgba(37, 99, 235, 0.6)",
  };

  const defaultSettings = {
    columns: 12,
    gap: 24,
    containerSelector: ".container",
    columnOpacity: 12,
    showColumns: true,
    showGrid16: true,
    showGrid4: true,
  };
  let settings = await chrome.storage.sync.get(defaultSettings);

  const wrapper = document.createElement("div");
  wrapper.id = GRID_ID;
  Object.assign(wrapper.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483647",
    pointerEvents: "none",
  });

  const pixelGrid = document.createElement("div");
  Object.assign(pixelGrid.style, {
    position: "absolute",
    inset: "0",
  });
  wrapper.appendChild(pixelGrid);

  const columns = document.createElement("div");
  Object.assign(columns.style, {
    position: "absolute",
    top: "0",
    bottom: "0",
    display: "grid",
    height: "100%",
  });

  function renderColumns() {
    columns.replaceChildren();
    const count = Math.min(24, Math.max(1, Number(settings.columns) || 12));
    columns.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
    columns.style.gap = `${Math.min(96, Math.max(0, Number(settings.gap) || 0))}px`;
    columns.style.display = settings.showColumns ? "grid" : "none";

    for (let index = 0; index < count; index += 1) {
      const column = document.createElement("div");
      Object.assign(column.style, {
        minWidth: "0",
        backgroundColor: `rgba(59, 130, 246, ${Number(settings.columnOpacity) / 100})`,
        borderLeft: `1px solid ${config.border}`,
        borderRight: `1px solid ${config.border}`,
        boxSizing: "border-box",
      });
      columns.appendChild(column);
    }
  }

  function renderPixelGrid() {
    const images = [];
    const sizes = [];
    if (settings.showGrid16) {
      images.push(
        `linear-gradient(to right, ${config.grid16} 1px, transparent 1px)`,
        `linear-gradient(to bottom, ${config.grid16} 1px, transparent 1px)`,
      );
      sizes.push("16px 16px", "16px 16px");
    }
    if (settings.showGrid4) {
      images.push(
        `linear-gradient(to right, ${config.grid4} 1px, transparent 1px)`,
        `linear-gradient(to bottom, ${config.grid4} 1px, transparent 1px)`,
      );
      sizes.push("4px 4px", "4px 4px");
    }
    pixelGrid.style.backgroundImage = images.join(",") || "none";
    pixelGrid.style.backgroundSize = sizes.join(",");
  }

  wrapper.appendChild(columns);
  (document.body || document.documentElement).appendChild(wrapper);

  let observedContainer = null;
  const resizeObserver = new ResizeObserver(updateColumns);

  function updateColumns() {
    let container = null;
    try {
      container = document.querySelector(
        settings.containerSelector || ".container",
      );
    } catch {
      container = document.querySelector(".container");
    }

    if (container !== observedContainer) {
      if (observedContainer) resizeObserver.unobserve(observedContainer);
      observedContainer = container;
      if (observedContainer) resizeObserver.observe(observedContainer);
    }

    if (container) {
      const bounds = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(styles.paddingRight) || 0;

      columns.style.left = `${bounds.left + paddingLeft}px`;
      columns.style.width = `${Math.max(0, bounds.width - paddingLeft - paddingRight)}px`;
      columns.style.padding = "0";
    } else {
      columns.style.left = "0";
      columns.style.width = "100%";
      columns.style.padding = "0 1rem";
      columns.style.boxSizing = "border-box";
    }
  }

  const mutationObserver = new MutationObserver((mutations) => {
    const pageChanged = mutations.some(
      ({ target }) => !wrapper.contains(target),
    );
    if (pageChanged) scheduleUpdate();
  });
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });

  let updateFrame = 0;
  function scheduleUpdate() {
    cancelAnimationFrame(updateFrame);
    updateFrame = requestAnimationFrame(updateColumns);
  }

  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("scroll", scheduleUpdate, true);
  const storageListener = (changes, areaName) => {
    if (areaName !== "sync") return;
    for (const key of Object.keys(defaultSettings)) {
      if (changes[key]) settings[key] = changes[key].newValue;
    }
    renderColumns();
    renderPixelGrid();
    scheduleUpdate();
  };
  chrome.storage.onChanged.addListener(storageListener);
  renderColumns();
  renderPixelGrid();
  updateColumns();

  window[CLEANUP_KEY] = () => {
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("scroll", scheduleUpdate, true);
    cancelAnimationFrame(updateFrame);
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    chrome.storage.onChanged.removeListener(storageListener);
    wrapper.remove();
    delete window[CLEANUP_KEY];
  };
})();
