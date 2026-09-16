export const API_URL = '/api';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let message = 'An error occurred';
    try {
      const err = await res.json();
      message = err.error || message;
    } catch (e) {}
    throw new Error(message);
  }
  
  // if content length is 0, don't parse JSON
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0') return null;
  
  try {
    return await res.json();
  } catch(e) {
    return null;
  }
}

export const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};
