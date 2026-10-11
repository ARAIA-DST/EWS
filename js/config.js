// Only public configuration belongs here. Never add passwords or spreadsheet IDs.
export const CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbxK9ERgP4p7i6Jr9Uir9gxVoHEm3U9tjZn3Z_LGSIAgeKFVf8w78ybaoWeIpiV2dPus/exec',
  VERSION: '3.0.1',
  TIMEOUT_MS: 25000,
  TTL: { bootstrap: 60, dashboard: 90, list: 45, detail: 30, report: 60 },
});
