export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // If endpoint is already absolute, use it. Otherwise prepend base.
  const url = endpoint.startsWith("http") 
    ? endpoint 
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {};
  // If body is present and not FormData, assume JSON
  if (options.body && typeof options.body === 'string') {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // CRITICAL: Send cookies with request
  };

  return fetch(url, config);
};
