/**
 * CENTRAL API CLIENT (Axios)
 * Single source for all API calls. Uses VITE_API_URL for production.
 */

import axios from 'axios'

// API base URL: empty in dev (Vite proxy), set in production
const envApiUrl = String(import.meta.env.VITE_API_URL || '').trim()
const isBrowser = typeof window !== 'undefined'
const isLocalHost =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
// Optional safety fallback for production when VITE_API_URL is missing.
// Keep this empty unless you intentionally want a fixed fallback host.
const fallbackProdApiUrl = String(import.meta.env.VITE_API_URL_FALLBACK || '').trim()
export const API_URL = envApiUrl || (isBrowser && !isLocalHost ? fallbackProdApiUrl : '')

const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('jwtToken') ||
    sessionStorage.getItem('jwtToken') ||
    null
  )
}

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request: add auth token when present
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // If body is FormData, remove Content-Type so axios sets multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Response: clear tokens on 401, normalize error messages
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('jwtToken')
      sessionStorage.removeItem('jwtToken')
      localStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminToken')
      localStorage.removeItem('adminJwt')
      sessionStorage.removeItem('adminJwt')
      localStorage.removeItem('adminSession')
      sessionStorage.removeItem('adminSession')
    }
    // Use server message when available
    const msg = err.response?.data?.message || err.response?.data?.error || err.message
    err.message = msg || err.message
    return Promise.reject(err)
  }
)

/**
 * GET request
 * @param {string} endpoint - e.g. '/api/quotes'
 * @param {object} config - axios config (responseType: 'blob' for downloads)
 */
export const get = (endpoint, config = {}) =>
  apiClient.get(endpoint, config).then((res) => res.data)

/**
 * POST request
 * @param {string} endpoint
 * @param {object|FormData} data - JSON or FormData
 */
export const post = (endpoint, data, config = {}) =>
  apiClient.post(endpoint, data, config).then((res) => res.data)

/**
 * PATCH request
 */
export const patch = (endpoint, data, config = {}) =>
  apiClient.patch(endpoint, data, config).then((res) => res.data)

/**
 * DELETE request
 */
export const del = (endpoint, config = {}) =>
  apiClient.delete(endpoint, config).then((res) => res.data)

/**
 * GET and return blob (e.g. CSV download)
 */
export const getBlob = (endpoint, config = {}) =>
  apiClient.get(endpoint, { ...config, responseType: 'blob' }).then((res) => res.data)
