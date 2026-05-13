const API_BASE_URL = 'http://localhost:5001';

const parseResponse = async (response, responseType = 'json') => {
  if (responseType === 'blob') {
    return response.blob();
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export const apiRequest = async (path, options = {}, config = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseResponse(response, config.responseType);

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null
        ? data.message || data.error || 'Request failed.'
        : 'Request failed.';

    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

export const apiBaseUrl = API_BASE_URL;
