/**
 * Guest Storage Service — localStorage schema for guest UUID + offline state fallback
 *
 * WBS Tasks 7.1, 7.2, R9 (offline sync fallback)
 * Key schema:
 *   guest_uuid          → string (UUIDv4)
 *   offline_game_state  → OfflineGameState JSON
 */

const STORAGE_KEYS = {
  GUEST_UUID: 'guest_uuid',
  OFFLINE_STATE: 'offline_game_state',
};

// ─── Guest UUID (Task 7.1, 7.2) ──────────────────────────────────────────────

/** Generate a UUID v4 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Get (or create on first visit) the guest UUID */
export function getGuestUuid() {
  let uuid = localStorage.getItem(STORAGE_KEYS.GUEST_UUID);
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem(STORAGE_KEYS.GUEST_UUID, uuid);
  }
  return uuid;
}

/** Clear the guest UUID after successful merge */
export function clearGuestUuid() {
  localStorage.removeItem(STORAGE_KEYS.GUEST_UUID);
}

// ─── Offline game state fallback (Risk R9) ───────────────────────────────────

/**
 * Save current guesses to localStorage as a safety net.
 * If the sync call fails, the state is restored on next page load.
 *
 * @param {string} gameId
 * @param {string[]} guesses   Array of 5-letter words already submitted
 * @param {'PLAYING'|'WON'|'LOST'} status
 * @param {string} gameDate    ISO date string (yyyy-mm-dd)
 */
export function saveOfflineState(gameId, guesses, status, gameDate) {
  const state = { gameId, guesses, status, gameDate, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.OFFLINE_STATE, JSON.stringify(state));
}

/** Read the persisted offline game state (returns null if not present) */
export function getOfflineState() {
  const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_STATE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Clear offline state once it has been fully synced to the server */
export function clearOfflineState() {
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_STATE);
}
