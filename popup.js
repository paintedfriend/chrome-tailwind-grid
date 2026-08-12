const GRID_ID = "tailwind-container-bound-grid";
const toggleButton = document.getElementById("toggle");
const toggleLabel = toggleButton.querySelector(".toggle__label");
const statusText = document.getElementById("status");
const resetButton = document.getElementById("reset");

const DEFAULT_SETTINGS = {
  columns: 12,
  gap: 24,
  containerSelector: ".container",
  columnOpacity: 12,
  showColumns: true,
  showGrid16: true,
  showGrid4: true,
};

const settingInputs = Object.fromEntries(
  Object.keys(DEFAULT_SETTINGS).map((key) => [
    key,
    document.getElementById(key),
  ]),
);

let activeTabId = null;
let gridEnabled = false;

function render(enabled) {
  gridEnabled = enabled;
  toggleButton.classList.toggle("is-active", enabled);
  toggleButton.setAttribute("aria-pressed", String(enabled));
  toggleLabel.textContent = enabled ? "Disable grid" : "Enable grid";
  statusText.textContent = enabled ? "Grid is enabled on this page" : "";
  statusText.classList.remove("is-error");
}

function showError() {
  toggleButton.disabled = true;
  statusText.textContent = "The extension is unavailable on this page";
  statusText.classList.add("is-error");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function readGridState(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (id) => Boolean(document.getElementById(id)),
    args: [GRID_ID],
  });

  return Boolean(result?.result);
}

async function initialize() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    populateSettings(settings);

    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("Active tab is unavailable");

    activeTabId = tab.id;
    render(await readGridState(activeTabId));
  } catch (error) {
    console.warn("Grid Overlay:", error);
    showError();
  }
}

function populateSettings(settings) {
  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    const input = settingInputs[key];
    const value = settings[key] ?? defaultValue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = String(value);
  }
  document.getElementById("columnOpacityValue").textContent =
    `${settingInputs.columnOpacity.value}%`;
}

function readSetting(key, input) {
  if (input.type === "checkbox") return input.checked;
  if (input.type === "number" || input.type === "range")
    return Number(input.value);
  return input.value.trim() || DEFAULT_SETTINGS[key];
}

for (const [key, input] of Object.entries(settingInputs)) {
  input.addEventListener("input", async () => {
    if (key === "columnOpacity") {
      document.getElementById("columnOpacityValue").textContent =
        `${input.value}%`;
    }
    await chrome.storage.sync.set({ [key]: readSetting(key, input) });
  });
}

resetButton.addEventListener("click", async () => {
  await chrome.storage.sync.set(DEFAULT_SETTINGS);
  populateSettings(DEFAULT_SETTINGS);
  statusText.textContent = "Settings reset";
  statusText.classList.remove("is-error");
});

toggleButton.addEventListener("click", async () => {
  if (!activeTabId) return;

  toggleButton.disabled = true;
  statusText.textContent = "";

  try {
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ["grid.js"],
    });
    render(!gridEnabled);
  } catch (error) {
    console.warn("Grid Overlay:", error);
    showError();
  } finally {
    if (activeTabId && !statusText.classList.contains("is-error")) {
      toggleButton.disabled = false;
    }
  }
});

initialize();
