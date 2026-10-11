// Only public configuration belongs here. Never add passwords or spreadsheet IDs.
export const CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbweYv7r-Lt20GfhMDdHZF9NUOskXOpdGyhF7obuV9Os56OkDvb_K13th-KLNVRNu7Se/exec', // Paste the deployed Apps Script URL ending in /exec.
  VERSION: '1.0.0',
  TIMEOUT_MS: 25000,
  TTL: { bootstrap: 60, dashboard: 90, list: 45, detail: 30, report: 60 },
});
