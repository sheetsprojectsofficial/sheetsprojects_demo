/**
 * Centralized API helper with automatic tenant header injection
 * All API calls should use this helper to ensure X-Tenant-Slug is included
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || null;

/**
 * Get tenant slug from various sources
 */
const getTenantSlug = () => {
  // Priority 1: Environment variable
  if (TENANT_SLUG) {
    return TENANT_SLUG;
  }

  // Priority 2: Query parameter (for testing)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tenant')) {
      return urlParams.get('tenant');
    }
  }

  return null;
};

/**
 * Fetch wrapper that automatically adds tenant header
 * @param {string} url - The URL to fetch (can be relative to API_BASE_URL or absolute)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiFetch = async (url, options = {}) => {
  const tenantSlug = getTenantSlug();

  // Build full URL if relative path provided
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  // Merge headers with tenant slug
  const headers = {
    ...options.headers,
  };

  // Always add tenant slug if available
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }

  return fetch(fullUrl, {
    ...options,
    headers
  });
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url, options = {}) => apiFetch(url, { ...options, method: 'GET' }),

  post: (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  }),

  put: (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  }),

  patch: (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data)
  }),

  delete: (url, options = {}) => apiFetch(url, { ...options, method: 'DELETE' }),

  // For form data uploads
  upload: (url, formData, options = {}) => apiFetch(url, {
    ...options,
    method: 'POST',
    body: formData
    // Don't set Content-Type - browser will set it with boundary for FormData
  })
};

/**
 * Get the API base URL
 */
export const getApiUrl = () => API_BASE_URL;

/**
 * Get current tenant slug
 */
export const getCurrentTenantSlug = () => getTenantSlug();

export default api;
