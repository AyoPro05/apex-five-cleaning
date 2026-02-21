/**
 * CENTRAL API CLIENT (Axios)
 * Single source for all API calls. Uses VITE_API_URL for production.
 */

import axios from 'axios'

// API base URL: empty in dev (Vite proxy), set in production
export const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Resolve upload/image URL - use /api/uploads so Vite proxy forwards correctly
 */
export function getImageUrl(imgPath) {
  if (!imgPath || typeof imgPath !== 'string') return imgPath
  if (imgPath.startsWith('http')) return imgPath
  // Use /api/uploads route so proxy forwards to backend (more reliable than /uploads)
  const normalized = imgPath.startsWith('/') ? imgPath : `/${imgPath}`
  if (normalized.startsWith('/uploads/')) {
    return normalized.replace(/^\/uploads/, '/api/uploads')
  }
  const base = API_URL.replace(/\/$/, '')
  return base ? `${base}${normalized}` : normalized
}

const getAuthToken = (url = '') => {
  if (typeof window === 'undefined') return null
  // Admin routes must use admin token only (customer JWT would be sent otherwise and backend rejects)
  const isAdminRequest = (url && String(url).includes('/api/admin')) || false
  if (isAdminRequest) {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || null
  }
  return localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') ||
    localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || null
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request: add auth token when present
apiClient.interceptors.request.use((config) => {
  const url = config.url || ''
  const fullUrl = config.baseURL ? `${config.baseURL}${url}` : url
  const token = getAuthToken(fullUrl)
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
 * GET and return blob (e.g. CSV download)
 */
export const getBlob = (endpoint, config = {}) =>
  apiClient.get(endpoint, { ...config, responseType: 'blob' }).then((res) => res.data)

export default apiClient
