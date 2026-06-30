// api, cleanHostname, getSettings, saveSettings come from clean.js

const siteEl = document.getElementById("site");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clearBtn");
const faviconFallback = document.getElementById("faviconFallback");
const faviconWrap = document.getElementById("faviconWrap");
const lastCleanedEl = document.getElementById("lastCleaned");
const footerStatsEl = document.getElementById("footerStats");
const settingsBtn = document.getElementById("settingsBtn");
const includeSubdomainsToggle = document.getElementById("includeSubdomains");
const clearLocalStorageToggle = document.getElementById("clearLocalStorage");

let hostname = null;

function setStatus(type, html) {
  statusEl.className = `status visible ${type}`;
  statusEl.innerHTML = html;
}

async function getCurrentTab() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function updateLastCleanedInfo(host) {
  if (!host) return;
  try {
    const data = await api.storage.local.get(host);
    if (data && data[host]) {
      lastCleanedEl.textContent = `🕒 Last cleaned: ${data[host]}`;
    } else {
      lastCleanedEl.textContent = `🕒 Last cleaned: Never`;
    }
  } catch (_) {
    lastCleanedEl.textContent = "";
  }
}

async function updateFooterStats() {
  try {
    const stored = await api.storage.local.get("stats");
    const stats = stored.stats || { totalRuns: 0, totalCookies: 0 };
    if (stats.totalRuns > 0) {
      footerStatsEl.textContent = `${stats.totalCookies} cookies cleared across ${stats.totalRuns} run${stats.totalRuns !== 1 ? "s" : ""}`;
    } else {
      footerStatsEl.textContent = "";
    }
  } catch (_) {
    footerStatsEl.textContent = "";
  }
}

async function loadToggles() {
  const settings = await getSettings();
  includeSubdomainsToggle.checked = settings.includeSubdomains;
  clearLocalStorageToggle.checked = settings.clearLocalStorage;
}

async function persistToggle(key, value) {
  const settings = await getSettings();
  settings[key] = value;
  await saveSettings(settings);
}

async function initialize() {
  try {
    await loadToggles();
    await updateFooterStats();

    const tab = await getCurrentTab();

    if (!tab?.url) {
      siteEl.textContent = "Unavailable";
      siteEl.classList.add("unavailable");
      clearBtn.disabled = true;
      return;
    }

    const url = new URL(tab.url);

    if (!["http:", "https:"].includes(url.protocol)) {
      siteEl.textContent = "Unsupported page";
      siteEl.classList.add("unavailable");
      clearBtn.disabled = true;
      return;
    }

    hostname = url.hostname;
    siteEl.textContent = hostname;

    await updateLastCleanedInfo(hostname);

    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    img.onload = () => {
      faviconFallback.style.display = "none";
      faviconWrap.appendChild(img);
    };
    img.onerror = () => {};

  } catch (err) {
    siteEl.textContent = "Error";
    siteEl.classList.add("unavailable");
    clearBtn.disabled = true;
  }
}

async function clearSiteData() {
  if (!hostname) return;

  clearBtn.disabled = true;
  setStatus("working", `<span class="spinner"></span>Clearing data for ${hostname}…`);

  try {
    const { cookieCount } = await cleanHostname(hostname);

    setStatus("success", `✓ Cleared ${cookieCount} cookie${cookieCount !== 1 ? "s" : ""}`);
    await updateLastCleanedInfo(hostname);
    await updateFooterStats();

    const tab = await getCurrentTab();
    if (tab?.id) {
      setTimeout(() => api.tabs.reload(tab.id), 600);
    }

    setTimeout(() => window.close(), 1400);

  } catch (err) {
    setStatus("error", `✗ ${err.message || String(err)}`);
    clearBtn.disabled = false;
  }
}

clearBtn.addEventListener("click", clearSiteData);

includeSubdomainsToggle.addEventListener("change", () => {
  persistToggle("includeSubdomains", includeSubdomainsToggle.checked);
});

clearLocalStorageToggle.addEventListener("change", () => {
  persistToggle("clearLocalStorage", clearLocalStorageToggle.checked);
});

settingsBtn.addEventListener("click", () => {
  if (api.runtime.openOptionsPage) {
    api.runtime.openOptionsPage();
  } else {
    window.open(api.runtime.getURL("options.html"));
  }
});

initialize();
