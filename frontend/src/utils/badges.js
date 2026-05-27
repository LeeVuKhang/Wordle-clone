function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampProgress(value, milestone) {
  if (milestone <= 0) return 0;
  return Math.max(0, Math.min(100, (value / milestone) * 100));
}

function pluralize(value, singular, plural = `${singular}s`) {
  return value === 1 ? singular : plural;
}

function gamesWonFromStats(stats) {
  const explicitGamesWon = toNumber(stats?.gamesWon);
  if (stats && Object.prototype.hasOwnProperty.call(stats, 'gamesWon')) {
    return explicitGamesWon;
  }

  const gamesPlayed = toNumber(stats?.gamesPlayed);
  const winPercentage = toNumber(stats?.winPercentage);
  return Math.round((gamesPlayed * winPercentage) / 100);
}

function milestoneBadge({
  id,
  name,
  description,
  icon,
  value,
  bestValue,
  milestone,
  unit,
  earnedText,
}) {
  const isEarned = bestValue >= milestone;
  const progressValue = Math.max(0, Math.min(value, milestone));

  return {
    id,
    name,
    description,
    icon,
    isEarned,
    progress: isEarned ? 100 : clampProgress(progressValue, milestone),
    progressText: `${progressValue}/${milestone} ${pluralize(milestone, unit)}`,
    statusText: isEarned ? earnedText : `${progressValue}/${milestone}`,
  };
}

export function computeBadges(stats) {
  const gamesPlayed = toNumber(stats?.gamesPlayed);
  const gamesWon = gamesWonFromStats(stats);
  const currentStreak = toNumber(stats?.currentStreak);
  const maxStreak = toNumber(stats?.maxStreak);
  const firstGuessWins = toNumber(stats?.guessDistribution?.['1']);

  const badges = [
    milestoneBadge({
      id: 'sea-of-greens',
      name: 'Sea of Greens',
      description: 'Win 10 daily puzzles to fill your board with green.',
      icon: '10',
      value: gamesWon,
      bestValue: gamesWon,
      milestone: 10,
      unit: 'win',
      earnedText: `${gamesWon} ${pluralize(gamesWon, 'win')}`,
    }),
    {
      id: 'wordle-in-1',
      name: 'Wordle In 1',
      description: 'Solve the daily puzzle on your first guess.',
      icon: '1',
      isEarned: firstGuessWins > 0,
      progress: firstGuessWins > 0 ? 100 : 0,
      progressText: `${firstGuessWins}/1 first-guess ${pluralize(firstGuessWins, 'win')}`,
      statusText: firstGuessWins > 0 ? `x${firstGuessWins}` : '0/1',
      count: firstGuessWins,
    },
  ];

  [10, 50, 100].forEach((milestone) => {
    badges.push(milestoneBadge({
      id: `${milestone}-day-streak`,
      name: `${milestone}-Day Streak`,
      description: `Build a ${milestone}-day daily winning streak.`,
      icon: String(milestone),
      value: currentStreak,
      bestValue: maxStreak,
      milestone,
      unit: 'day',
      earnedText: `Best ${maxStreak} ${pluralize(maxStreak, 'day')}`,
    }));
  });

  badges.push(milestoneBadge({
    id: 'dedicated-player',
    name: 'Dedicated Player',
    description: 'Play 100 daily puzzles.',
    icon: 'P',
    value: gamesPlayed,
    bestValue: gamesPlayed,
    milestone: 100,
    unit: 'game',
    earnedText: `${gamesPlayed} ${pluralize(gamesPlayed, 'game')}`,
  }));

  return badges;
}
