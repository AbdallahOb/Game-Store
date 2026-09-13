// Relative so the same build works behind nginx in Docker/production (which
// proxies /api to the backend) and via `ng serve --proxy-config proxy.conf.json`
// in local dev (see package.json's "start" script).
export const API_BASE_URL = '/api';
