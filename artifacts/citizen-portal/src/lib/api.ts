import { setBaseUrl, customFetch, getBaseUrl } from '@workspace/api-client-react';

/**
 * Centralized API configuration for Smart Citizen Portal frontend.
 *
 * Rules:
 * - In local development (DEV): automatically defaults to 'http://localhost:5000'
 *   without requiring manual code changes or environment configuration.
 * - In production: strictly uses import.meta.env.VITE_API_URL (with VITE_API_BASE_URL as fallback),
 *   never falling back to hardcoded localhost:5000.
 * - Normalizes trailing slashes so URL concatenation remains consistent.
 */
const configuredUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL
)?.trim();

export const API_BASE_URL: string = (
  import.meta.env.DEV
    ? (configuredUrl || 'http://localhost:5000')
    : (configuredUrl || '')
).replace(/\/+$/, '');

// Set the base URL on the API client package so all generated hooks (including useGetProfile for /api/auth/profile) use it
setBaseUrl(API_BASE_URL || null);

/**
 * Resolves a full API URL given a relative path (e.g., '/api/certificates/1/download').
 * Returns the fully qualified URL when API_BASE_URL is set, or the relative path otherwise.
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return normalizedPath;
  return `${API_BASE_URL}${normalizedPath}`;
}

export { customFetch, getBaseUrl, setBaseUrl };
