// Only public configuration belongs here. Never add passwords or spreadsheet IDs.
export const CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbxt2In8UAKGU8b4Q9zQjrm-Te8QLrsSLAEqhE48MO7QQPSX_GLWLu1IK8F4R_qbUG-z/exec', // Paste the deployed Apps Script URL ending in /exec.
  VERSION: '3.0.0',
  TIMEOUT_MS: 25000,
  TTL: { bootstrap: 60, dashboard: 90, list: 45, detail: 30, report: 60 },
});
