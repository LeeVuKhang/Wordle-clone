/**
 * Share text generator for completed Wordle grids.
 *
 * @see WBS Task 9.3
 */

const STATUS_EMOJI = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
};

function formatGameDate(gameDate) {
  if (!gameDate) return new Date().toISOString().slice(0, 10);
  if (gameDate instanceof Date) return gameDate.toISOString().slice(0, 10);
  return String(gameDate).slice(0, 10);
}

export function generateShareText(guessResults, attempts, gameStatus, mode, gameDate) {
  const safeAttempts = Number.isFinite(Number(attempts)) ? Number(attempts) : guessResults.length;
  const score = `${safeAttempts}/6`;
  const heading = mode === 'practice'
    ? `Wordle Clone Practice ${score}`
    : `Wordle Clone ${formatGameDate(gameDate)} ${score}`;

  const grid = guessResults
    .map((row) => row.map((cell) => STATUS_EMOJI[cell.status] || STATUS_EMOJI.absent).join(''))
    .join('\n');

  return `${heading}\n\n${grid}`;
}
