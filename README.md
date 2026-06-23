# 🍪 Cookie Cleaner

A simple browser extension to clear cookies for the current website.

## Features

- Clear all cookies for the active site with one click
- Shows current domain and favicon
- Displays when you last cleaned cookies
- Automatically reloads the page after cleaning

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
3. Click **Clear Cookies** to remove all cookies for that site
4. The page will reload automatically

## Permissions

- `cookies` - To delete cookies
- `tabs` - To get the current tab
- `storage` - To save last cleaned time

## License

MIT
