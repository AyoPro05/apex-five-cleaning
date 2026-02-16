/**
 * API CLIENT UTILITY
 * Centralized API configuration for production deployment
 */

// Get API URL from environment or use relative path (works with proxy)
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  // Logic: Use user token if it exists; otherwise, use admin token
  const token =
    localStorage.getItem("jwtToken") || localStorage.getItem("adminToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("adminToken");
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

export { API_URL };
