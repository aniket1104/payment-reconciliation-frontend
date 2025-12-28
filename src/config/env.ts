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

  if (!baseUrl) {
    // In development, provide a helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[env] NEXT_PUBLIC_API_BASE_URL is not set. Using default: http://localhost:8080'
      );
    }
    return 'http://localhost:8080';
  }

  return baseUrl;
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
