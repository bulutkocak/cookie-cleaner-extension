# Cookie Cleaner

A lightweight browser extension to clear cookies — and optionally other site data — for the current website.

## Preview

![Cookie Cleaner popup](https://raw.githubusercontent.com/bulutkocak/cookie-cleaner-extension/refs/heads/main/screenshots/example.png)

## Features

- Clear all cookies for the active site with one click
- Optionally include subdomains (e.g. clearing `example.com` also clears `mail.example.com`)
- Optionally clear localStorage, IndexedDB, service workers, and cache for the site
- Shows current domain and favicon
- Displays when you last cleaned cookies, per site
- Lifetime stats: total cookies cleared and number of runs
- Automatically reloads the page after cleaning
- Keyboard shortcut (`Ctrl+Shift+U` / `Cmd+Shift+U`) to clear the active tab's site without opening the popup
- Optional auto-clean: automatically clears a site's cookies when its last open tab is closed
- Optional system notifications for shortcut/auto-clean runs
- Dedicated settings page for all the above, plus a way to reset stats

## Installation

### Chrome / Edge / Brave
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the extension folder

### Firefox
1. Go to `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `manifest.json`

## Usage

1. Click the extension icon in your toolbar
2. The current website will be displayed
3. Toggle "Include subdomains" or "Also clear local/site storage" if needed
4. Click **Clear Cookies** to remove cookies (and any extra data) for that site
5. The page will reload automatically
6. The "Last cleaned" timestamp and lifetime stats update after each cleanup

Click the gear icon in the popup (or right-click the extension icon → Options) to open
**Settings**, where you can configure subdomain handling, cache/localStorage clearing,
auto-clean on tab close, and notifications.

## Permissions

- `cookies` — to delete cookies
- `tabs` — to get the current tab and reload it after cleaning
- `storage` — to save settings, last-cleaned times, and stats
- `browsingData` — to optionally clear localStorage, IndexedDB, service workers, and cache
- `notifications` — to optionally notify after shortcut/auto-clean runs

## License

MIT
