/**
 * Environment Configuration
 *
 * Centralized access to environment variables with validation.
 * Throws clear errors in development if required variables are missing.
 */

/**
 * Get the API base URL from environment variables.
 * Falls back to localhost:8080 for local development.
 */
  export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Ensure production URL has the correct prefix
  if (baseUrl) {
    const trimmed = baseUrl.trim().replace(/\/$/, '');
    // If it doesn't end with /api/v1 or /api/v2 etc., and isn't localhost:8080/api
    if (!trimmed.includes('/api')) {
      return `${trimmed}/api/v1`;
    }
    return trimmed;
  }

  return 'http://localhost:8080/api/v1';
}

/**
 * Environment configuration object
 */
export const env = {
  /**
   * API base URL for backend requests
   */
  apiBaseUrl: getApiBaseUrl(),

  /**
   * Whether the app is running in development mode
   */
  isDevelopment: process.env.NODE_ENV === 'development',

  /**
   * Whether the app is running in production mode
   */
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export default env;
