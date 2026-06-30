const includeSubdomainsEl = document.getElementById("includeSubdomains");
const clearLocalStorageEl = document.getElementById("clearLocalStorage");
const clearCacheEl = document.getElementById("clearCache");
const autoCleanOnCloseEl = document.getElementById("autoCleanOnClose");
const showNotificationsEl = document.getElementById("showNotifications");
const resetStatsBtn = document.getElementById("resetStatsBtn");
const saveNote = document.getElementById("saveNote");
const statsEl = document.getElementById("stats");

function flashSaved() {
  saveNote.textContent = "✓ Saved";
  setTimeout(() => { saveNote.textContent = ""; }, 1200);
}

async function loadStats() {
  const stored = await api.storage.local.get("stats");
  const stats = stored.stats || { totalRuns: 0, totalCookies: 0 };
  statsEl.textContent = stats.totalRuns > 0
    ? `Lifetime: ${stats.totalCookies} cookies cleared across ${stats.totalRuns} run${stats.totalRuns !== 1 ? "s" : ""}`
    : "No cleanups recorded yet.";
}

async function load() {
  const settings = await getSettings();
  includeSubdomainsEl.checked = settings.includeSubdomains;
  clearLocalStorageEl.checked = settings.clearLocalStorage;
  clearCacheEl.checked = settings.clearCache;
  autoCleanOnCloseEl.checked = settings.autoCleanOnClose;
  showNotificationsEl.checked = settings.showNotifications;
  await loadStats();
}

async function persist() {
  const settings = {
    includeSubdomains: includeSubdomainsEl.checked,
    clearLocalStorage: clearLocalStorageEl.checked,
    clearCache: clearCacheEl.checked,
    autoCleanOnClose: autoCleanOnCloseEl.checked,
    showNotifications: showNotificationsEl.checked
  };
  await saveSettings(settings);
  flashSaved();
}

[includeSubdomainsEl, clearLocalStorageEl, clearCacheEl, autoCleanOnCloseEl, showNotificationsEl]
  .forEach((el) => el.addEventListener("change", persist));

resetStatsBtn.addEventListener("click", async () => {
  await api.storage.local.set({ stats: { totalRuns: 0, totalCookies: 0 } });
  await loadStats();
  flashSaved();
});

load();
