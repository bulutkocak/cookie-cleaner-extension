// Shared cleaning logic, usable from popup.js and background.js
const api = typeof browser !== "undefined" ? browser : chrome;

function hostMatches(hostname, cookieDomain, includeSubdomains) {
  if (hostname === cookieDomain) return true;
  if (includeSubdomains) {
    return hostname.endsWith("." + cookieDomain) || cookieDomain.endsWith("." + hostname);
  }
  return false;
}

async function getSettings() {
  const defaults = {
    includeSubdomains: true,
    clearLocalStorage: false,
    clearCache: false,
    autoCleanOnClose: false,
    showNotifications: true
  };
  const stored = await api.storage.local.get("settings");
  return { ...defaults, ...(stored.settings || {}) };
}

async function saveSettings(settings) {
  await api.storage.local.set({ settings });
}

async function clearCookiesForHost(hostname, includeSubdomains) {
  const cookies = await api.cookies.getAll({});
  let deleted = 0;

  for (const cookie of cookies) {
    const cookieDomain = cookie.domain.replace(/^\./, "");
    if (!hostMatches(hostname, cookieDomain, includeSubdomains)) continue;

    try {
      const protocol = cookie.secure ? "https:" : "http:";
      const removeParams = {
        url: `${protocol}//${cookieDomain}${cookie.path}`,
        name: cookie.name
      };
      if (cookie.storeId !== undefined) {
        removeParams.storeId = cookie.storeId;
      }
      await api.cookies.remove(removeParams);
      deleted++;
    } catch (_) {
      // ignore individual cookie failures, keep going
    }
  }

  return deleted;
}

async function clearExtraDataForHost(hostname, settings) {
  // chrome.browsingData works on origins, not bare hostnames; cover both protocols.
  const origins = [`https://${hostname}`, `http://${hostname}`];
  const dataToRemove = {};

  if (settings.clearLocalStorage) {
    dataToRemove.localStorage = true;
    dataToRemove.indexedDB = true;
    dataToRemove.serviceWorkers = true;
  }
  if (settings.clearCache) {
    dataToRemove.cache = true;
  }

  if (Object.keys(dataToRemove).length === 0) return;
  if (!api.browsingData || !api.browsingData.remove) return;

  try {
    await api.browsingData.remove({ origins, since: 0 }, dataToRemove);
  } catch (_) {
    // origins-scoped browsingData isn't supported everywhere; fail silently
  }
}

async function saveCleanedTimestamp(hostname) {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString([], { month: "short", day: "numeric" });
  const formattedDate = `${dateString}, ${timeString}`;
  await api.storage.local.set({ [hostname]: formattedDate });
  return formattedDate;
}

async function incrementStats(cookieCount) {
  const stored = await api.storage.local.get("stats");
  const stats = stored.stats || { totalRuns: 0, totalCookies: 0 };
  stats.totalRuns += 1;
  stats.totalCookies += cookieCount;
  await api.storage.local.set({ stats });
  return stats;
}

async function cleanHostname(hostname) {
  const settings = await getSettings();
  const cookieCount = await clearCookiesForHost(hostname, settings.includeSubdomains);
  await clearExtraDataForHost(hostname, settings);
  await saveCleanedTimestamp(hostname);
  await incrementStats(cookieCount);
  return { cookieCount, settings };
}

if (typeof module !== "undefined") {
  module.exports = { cleanHostname, getSettings, saveSettings };
}
