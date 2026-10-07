// Only public configuration belongs here. Never add passwords or spreadsheet IDs.
export const CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbzkcq7EHF0GEDDSDJY7-IMS-vMEK4pXjVQhILv07ctm7xjQPwJ1evX6cikduZDZka-A/exec',
  VERSION: '1.0.0',
  TIMEOUT_MS: 25000,
  TTL: { bootstrap: 60, dashboard: 90, list: 45, detail: 30, report: 60 },
});
