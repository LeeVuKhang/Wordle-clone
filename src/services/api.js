/**
 * Axios API Client — Centralized typed HTTP client
 *
 * WBS Task 8.1
 * - withCredentials: true  → sends httpOnly cookies (access_token, refresh_token)
 * - X-Guest-ID header      → injected on every request when user is not authenticated
 * - Automatic token refresh on 401 (single-retry with refresh rotation)
 */

import axios from 'axios';
import { getGuestUuid } from './guestStorage.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,         // Required for httpOnly cookie auth
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// ─── Request interceptor — attach Guest-ID header ────────────────────────────
api.interceptors.request.use((config) => {
  const guestUuid = getGuestUuid();
  if (guestUuid) {
    config.headers['X-Guest-ID'] = guestUuid;
  }
  return config;
});

// ─── Response interceptor — transparent token refresh on 401 ─────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401s that aren't themselves the refresh call
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue callers while refresh is in-flight
        return new Promise((resolve) => {
          refreshSubscribers.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/auth/refresh');
        onTokenRefreshed();
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — user must re-authenticate
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  /** Exchange Google OAuth code for JWT tokens */
  googleLogin: (code, redirectUri) =>
    api.post('/api/auth/google', { code, redirectUri }),

  /** Rotate access token using refresh_token cookie */
  refresh: () => api.post('/api/auth/refresh'),

  /** Merge guest data into authenticated user */
  mergeGuest: (guestUuid) =>
    api.post('/api/auth/merge', { guestUuid }),

  /** Revoke tokens and clear cookies */
  logout: () => api.post('/api/auth/logout'),

  /** Get current user profile */
  getMe: () => api.get('/api/auth/me'),
};

// ─── Game API ─────────────────────────────────────────────────────────────────

export const gameApi = {
  /** Load today's daily game (returns Base64 word + progress) */
  getToday: () => api.get('/api/game/today'),

  /**
   * Sync guess state to the server (debounced by the caller).
   * @param {{ id: string, guesses: string[], status: 'PLAYING'|'WON'|'LOST' }} dto
   */
  sync: (dto) => api.post('/api/game/sync', dto),
};

// ─── Practice API ─────────────────────────────────────────────────────────────

export const practiceApi = {
  /** Start a new practice session */
  newSession: () => api.post('/api/practice/new'),

  /**
   * Submit a guess for a practice session (server-side comparison)
   * @param {{ practiceId: string, guess: string }} dto
   */
  guess: (dto) => api.post('/api/practice/guess', dto),
};
