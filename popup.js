const api = typeof browser !== "undefined" ? browser : chrome;

const siteEl = document.getElementById("site");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clearBtn");
const faviconFallback = document.getElementById("faviconFallback");
const faviconWrap = document.getElementById("faviconWrap");
const lastCleanedEl = document.getElementById("lastCleaned");

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

async function initialize() {
  try {
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

async function clearCookiesForSite() {
  const cookies = await api.cookies.getAll({});
  let deleted = 0;

  for (const cookie of cookies) {
    const cookieDomain = cookie.domain.replace(/^\./, "");
    const matches = hostname === cookieDomain || hostname.endsWith("." + cookieDomain);

    if (!matches) continue;

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
    } catch (_) {}
  }

  return deleted;
}

async function saveCleanedTimestamp() {
  if (!hostname) return;
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const formattedDate = `${dateString}, ${timeString}`;
  
  await api.storage.local.set({ [hostname]: formattedDate });
}

async function clearSiteData() {
  clearBtn.disabled = true;
  setStatus("working", `<span class="spinner"></span>Clearing cookies for ${hostname}…`);

  try {
    const cookieCount = await clearCookiesForSite();

    await saveCleanedTimestamp();

    setStatus("success", `✓ Cleared ${cookieCount} cookie${cookieCount !== 1 ? "s" : ""}`);

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
initialize();
