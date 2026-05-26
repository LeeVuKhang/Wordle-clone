/**
 * Word Comparison Engine — Client-side letter comparison (Daily Mode)
 *
 * WBS Task 8.4
 *
 * Pure function — 100% unit-testable, zero side effects.
 * Logic is identical to the server-side compareWord in practice.service.ts
 * (parity verified by CI task 11.11).
 *
 * Also exposes isValidGuess() for client-side dictionary check
 * using the bundled validGuesses JSON (must stay in sync with prisma/seed.ts).
 *
 * @param {string} guess   5-letter uppercase word
 * @param {string} target  5-letter uppercase word
 * @returns {{ letter: string, status: 'correct'|'present'|'absent' }[]}
 */

import VALID_GUESSES from '../data/validGuesses.json';

const VALID_SET = new Set(VALID_GUESSES.map((w) => w.toUpperCase()));

/**
 * Compare a guess against the target word.
 * Two-pass algorithm (correct first, then present) handles duplicate letters correctly.
 */
export function compareWord(guess, target) {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();

  /** @type {{ letter: string, status: 'correct'|'present'|'absent' }[]} */
  const result = Array(5).fill(null).map(() => ({ letter: '', status: 'absent' }));
  const targetChars = t.split('');
  const used = new Array(5).fill(false);

  // Pass 1: mark correct positions
  for (let i = 0; i < 5; i++) {
    result[i].letter = g[i];
    if (g[i] === targetChars[i]) {
      result[i].status = 'correct';
      used[i] = true;
    }
  }

  // Pass 2: mark present (wrong position)
  for (let i = 0; i < 5; i++) {
    if (result[i].status === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && g[i] === targetChars[j]) {
        result[i].status = 'present';
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

/**
 * Check if a word is in the valid-guess dictionary.
 * Client-side validation — avoids a network round-trip per guess.
 */
export function isValidGuess(word) {
  return VALID_SET.has(word.toUpperCase());
}

/**
 * Derive keyboard letter statuses from all submitted guess results.
 * Priority: correct > present > absent.
 *
 * @param {{ letter: string, status: string }[][]} guessResults
 * @returns {Record<string, 'correct'|'present'|'absent'>}
 */
export function deriveKeyboardStatus(guessResults) {
  const STATUS_PRIORITY = { correct: 3, present: 2, absent: 1 };
  const status = {};

  for (const result of guessResults) {
    for (const { letter, status: s } of result) {
      const current = status[letter];
      if (!current || STATUS_PRIORITY[s] > STATUS_PRIORITY[current]) {
        status[letter] = s;
      }
    }
  }

  return status;
}
