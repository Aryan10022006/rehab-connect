import { getAuth } from 'firebase/auth';

// Set your backend API base URL here
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://rehab-connect-backend.onrender.com/i";

export function getApiUrl() {
  let url = API_BASE_URL;
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
}

export async function fetchClinics() {
  const url = `${getApiUrl()}/clinics`;
  console.debug('Fetching clinics from:', url);
  // Try to get token from Firebase auth
  let token = null;
  try {
    token = await getAuth().currentUser?.getIdToken();
  } catch {}
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch clinics');
  return response.json();
}

// Helper to always include token
export async function fetchWithAuth(url, options = {}) {
  let token = null;
  try {
    token = await getAuth().currentUser?.getIdToken();
  } catch {}
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, options);
}

// Add a debug wrapper for fetch
export async function debugFetch(url, options) {
  console.debug('API fetch:', url, options);
  return fetch(url, options);
}

// Example usage for other API calls:
// export async function someApiCall() {
//   const response = await fetch(`${getApiUrl()}/some-endpoint`);
//   ...
// } 