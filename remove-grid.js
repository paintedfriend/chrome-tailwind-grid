(() => {
  const GRID_ID = "tailwind-container-bound-grid";
  const CLEANUP_KEY = "__tailwindGridOverlayCleanup";

  if (typeof window[CLEANUP_KEY] === "function") {
    window[CLEANUP_KEY]();
  } else {
    document.getElementById(GRID_ID)?.remove();
  }
})();
