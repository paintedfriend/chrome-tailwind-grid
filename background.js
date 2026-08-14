const ENABLED_TABS_KEY = "gridEnabledTabIds";

async function getEnabledTabIds() {
  const stored = await chrome.storage.session.get(ENABLED_TABS_KEY);
  return Array.isArray(stored[ENABLED_TABS_KEY])
    ? stored[ENABLED_TABS_KEY]
    : [];
}

async function forgetTab(tabId) {
  const tabIds = await getEnabledTabIds();
  if (!tabIds.includes(tabId)) return;

  await chrome.storage.session.set({
    [ENABLED_TABS_KEY]: tabIds.filter((id) => id !== tabId),
  });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;

  const tabIds = await getEnabledTabIds();
  if (!tabIds.includes(tabId)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["grid.js"],
    });
  } catch (error) {
    console.warn("Grid Overlay: unable to restore the grid", error);
    await forgetTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener(forgetTab);
