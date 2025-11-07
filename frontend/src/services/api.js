const DEFAULT_BASE = '/backend/api.php';

function buildUrl(action, params = {}) {
  const base = process.env.REACT_APP_API_BASE_URL || DEFAULT_BASE;
  const url = new URL(base, window.location.origin);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

async function handleResponse(response) {
  const contentType = response.headers.get('Content-Type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = data && data.error ? data.error : 'خطای نامشخص رخ داد.';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function apiRequest(action, options = {}) {
  const { method = 'GET', data, token, params } = options;
  const url = buildUrl(action, params);
  const headers = new Headers();
  if (method !== 'GET') {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: method !== 'GET' && data ? JSON.stringify(data) : undefined,
  });

  return handleResponse(response);
}

export async function uploadAttachment({ token, entityType, entityId, file }) {
  const base = process.env.REACT_APP_UPLOAD_URL || '/backend/upload.php';
  const formData = new FormData();
  formData.append('entity_type', entityType);
  formData.append('entity_id', entityId);
  formData.append('file', file);

  const response = await fetch(base, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  return handleResponse(response);
}
