const TOKEN_KEY = 'csh_healthbank_jwt';

let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler;
}

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (res.status === 401 && onUnauthorizedCallback && !url.includes('/api/v1/auth/login') && !url.includes('/api/v1/auth/line-login')) {
    clearAuthToken();
    onUnauthorizedCallback();
  }

  return res;
}

