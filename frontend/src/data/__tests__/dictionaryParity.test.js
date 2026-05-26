import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import validGuesses from '../validGuesses.json';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const FE_DATA = path.resolve(dirname, '..');
const BE_DATA = path.resolve(dirname, '../../../../Wordle-clone-be/src/data');

function readWordLines(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((word) => word.trim())
    .filter(Boolean);
}

describe('Dictionary parity', () => {
  const beValidWords = readWordLines(path.join(BE_DATA, 'words.txt'));
  const fePracticeWords = readWordLines(path.join(FE_DATA, 'practiceWords.txt'));
  const bePracticeWords = readWordLines(path.join(BE_DATA, 'wordle-dictionary.txt'));

  it('keeps FE validGuesses.json word count equal to BE words.txt line count', () => {
    expect(validGuesses).toHaveLength(beValidWords.length);
  });

  it('keeps every FE valid guess in the BE word list', () => {
    const beWords = new Set(beValidWords);
    const missingWords = validGuesses.filter((word) => !beWords.has(word));

    expect(missingWords).toEqual([]);
  });

  it('keeps FE practiceWords.txt equal to BE wordle-dictionary.txt', () => {
    expect(fePracticeWords).toEqual(bePracticeWords);
  });

  it('keeps all dictionary words 5 letters and alpha-only', () => {
    const allWords = [
      ...validGuesses,
      ...beValidWords,
      ...fePracticeWords,
      ...bePracticeWords,
    ];

    expect(allWords.every((word) => /^[A-Za-z]{5}$/.test(word))).toBe(true);
  });
});
