importScripts("clean.js");

const apiBg = typeof browser !== "undefined" ? browser : chrome;

function notify(title, message) {
  if (!apiBg.notifications) return;
  apiBg.notifications.create({
    type: "basic",
    iconUrl: "icon128.png",
    title,
    message
  });
}

// Keyboard shortcut: clear cookies for the active tab's site
apiBg.commands.onCommand.addListener(async (command) => {
  if (command !== "clear-current-site") return;

  const tabs = await apiBg.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.url) return;

  let hostname;
  try {
    hostname = new URL(tab.url).hostname;
  } catch (_) {
    return;
  }
  if (!hostname) return;

  const { cookieCount, settings } = await cleanHostname(hostname);

  if (tab.id) {
    apiBg.tabs.reload(tab.id);
  }

  if (settings.showNotifications) {
    notify(
      "Cookie Cleaner",
      `Cleared ${cookieCount} cookie${cookieCount !== 1 ? "s" : ""} for ${hostname}`
    );
  }
});

// Auto-clean a site's cookies when its last tab closes, if enabled
apiBg.tabs.onRemoved.addListener(async (closedTabId, removeInfo) => {
  const settings = await cleanGetSettingsSafe();
  if (!settings || !settings.autoCleanOnClose) return;

  // We can't read the closed tab's URL after the fact, so track recently active hosts.
  const stored = await apiBg.storage.local.get("recentTabHosts");
  const recentTabHosts = stored.recentTabHosts || {};
  const hostname = recentTabHosts[closedTabId];
  if (!hostname) return;

  delete recentTabHosts[closedTabId];
  await apiBg.storage.local.set({ recentTabHosts });

  // Only clean if no other open tab still uses this hostname
  const allTabs = await apiBg.tabs.query({});
  const stillOpen = allTabs.some((t) => {
    try {
      return new URL(t.url).hostname === hostname;
    } catch (_) {
      return false;
    }
  });
  if (stillOpen) return;

  const { cookieCount } = await cleanHostname(hostname);
  if (settings.showNotifications) {
    notify("Cookie Cleaner", `Auto-cleared ${cookieCount} cookie(s) for ${hostname}`);
  }
});

async function cleanGetSettingsSafe() {
  try {
    return await getSettings();
  } catch (_) {
    return null;
  }
}

// Track hostname per tab so onRemoved can look it up
apiBg.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url && !tab?.url) return;
  const url = changeInfo.url || tab.url;
  try {
    const hostname = new URL(url).hostname;
    if (!hostname) return;
    const stored = await apiBg.storage.local.get("recentTabHosts");
    const recentTabHosts = stored.recentTabHosts || {};
    recentTabHosts[tabId] = hostname;
    await apiBg.storage.local.set({ recentTabHosts });
  } catch (_) {
    // non-http(s) URL, ignore
  }
});
