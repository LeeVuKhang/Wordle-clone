import { describe, expect, it } from 'vitest';
import { compareWord, deriveKeyboardStatus, isValidGuess } from '../compareWord.js';

describe('compareWord', () => {
  it('marks all letters correct when guess matches target', () => {
    expect(compareWord('CRANE', 'CRANE')).toEqual([
      { letter: 'C', status: 'correct' },
      { letter: 'R', status: 'correct' },
      { letter: 'A', status: 'correct' },
      { letter: 'N', status: 'correct' },
      { letter: 'E', status: 'correct' },
    ]);
  });

  it('marks all letters absent when there are no matching letters', () => {
    expect(compareWord('CLUMP', 'ABIDE').map((cell) => cell.status)).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
  });

  it('marks mixed correct, present, and absent letters', () => {
    expect(compareWord('CRANE', 'TRACE')).toEqual([
      { letter: 'C', status: 'present' },
      { letter: 'R', status: 'correct' },
      { letter: 'A', status: 'correct' },
      { letter: 'N', status: 'absent' },
      { letter: 'E', status: 'correct' },
    ]);
  });

  it('handles a duplicate guess letter with one correct and one absent', () => {
    expect(compareWord('SPEED', 'ABIED')).toEqual([
      { letter: 'S', status: 'absent' },
      { letter: 'P', status: 'absent' },
      { letter: 'E', status: 'absent' },
      { letter: 'E', status: 'correct' },
      { letter: 'D', status: 'correct' },
    ]);
  });

  it('uses only one target occurrence for duplicate guess letters', () => {
    expect(compareWord('ARRAY', 'CRANE')).toEqual([
      { letter: 'A', status: 'present' },
      { letter: 'R', status: 'correct' },
      { letter: 'R', status: 'absent' },
      { letter: 'A', status: 'absent' },
      { letter: 'Y', status: 'absent' },
    ]);
  });

  it('handles duplicate target letters when correct positions consume matches first', () => {
    expect(compareWord('EERIE', 'EAGLE')).toEqual([
      { letter: 'E', status: 'correct' },
      { letter: 'E', status: 'absent' },
      { letter: 'R', status: 'absent' },
      { letter: 'I', status: 'absent' },
      { letter: 'E', status: 'correct' },
    ]);
  });

  it('is case insensitive', () => {
    expect(compareWord('crane', 'CrAnE').map((cell) => cell.status)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('returns five letter/status objects', () => {
    const result = compareWord('adieu', 'crane');

    expect(result).toHaveLength(5);
    expect(result.every((cell) => /^[A-Z]$/.test(cell.letter))).toBe(true);
    expect(result.every((cell) => ['correct', 'present', 'absent'].includes(cell.status))).toBe(true);
  });
});

describe('isValidGuess', () => {
  it('returns true for a word in the dictionary', () => {
    expect(isValidGuess('CRANE')).toBe(true);
  });

  it('returns false for a word outside the dictionary', () => {
    expect(isValidGuess('ZZZZZ')).toBe(false);
  });

  it('checks words case insensitively', () => {
    expect(isValidGuess('crane')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidGuess('')).toBe(false);
  });
});

describe('deriveKeyboardStatus', () => {
  it('returns an empty status object for no results', () => {
    expect(deriveKeyboardStatus([])).toEqual({});
  });

  it('sets all letters from a single guess', () => {
    const result = compareWord('CRANE', 'TRACE');

    expect(deriveKeyboardStatus([result])).toMatchObject({
      C: 'present',
      R: 'correct',
      A: 'correct',
      N: 'absent',
      E: 'correct',
    });
  });

  it('lets correct override present across guesses', () => {
    const status = deriveKeyboardStatus([
      [{ letter: 'A', status: 'present' }],
      [{ letter: 'A', status: 'correct' }],
    ]);

    expect(status.A).toBe('correct');
  });

  it('lets present override absent across guesses', () => {
    const status = deriveKeyboardStatus([
      [{ letter: 'E', status: 'absent' }],
      [{ letter: 'E', status: 'present' }],
    ]);

    expect(status.E).toBe('present');
  });

  it('never downgrades a correct letter', () => {
    const status = deriveKeyboardStatus([
      [{ letter: 'R', status: 'correct' }],
      [{ letter: 'R', status: 'absent' }],
      [{ letter: 'R', status: 'present' }],
    ]);

    expect(status.R).toBe('correct');
  });
});
