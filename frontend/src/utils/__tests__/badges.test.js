import { describe, expect, it } from 'vitest';
import { computeBadges } from '../badges.js';

describe('computeBadges', () => {
  it('marks first-guess and streak badges as earned from stats', () => {
    const badges = computeBadges({
      gamesPlayed: 60,
      gamesWon: 54,
      winPercentage: 90,
      currentStreak: 12,
      maxStreak: 50,
      guessDistribution: { 1: 2 },
    });

    expect(badges.find((badge) => badge.id === 'wordle-in-1')).toMatchObject({
      isEarned: true,
      statusText: 'x2',
    });
    expect(badges.find((badge) => badge.id === '10-day-streak')?.isEarned).toBe(true);
    expect(badges.find((badge) => badge.id === '50-day-streak')?.isEarned).toBe(true);
    expect(badges.find((badge) => badge.id === '100-day-streak')?.isEarned).toBe(false);
  });

  it('reports progress for unearned badges', () => {
    const badges = computeBadges({
      gamesPlayed: 25,
      gamesWon: 5,
      winPercentage: 20,
      currentStreak: 7,
      maxStreak: 7,
      guessDistribution: { 1: 0 },
    });

    expect(badges.find((badge) => badge.id === '10-day-streak')).toMatchObject({
      isEarned: false,
      progress: 70,
      progressText: '7/10 days',
    });
    expect(badges.find((badge) => badge.id === 'dedicated-player')).toMatchObject({
      isEarned: false,
      progress: 25,
      progressText: '25/100 games',
    });
  });
});
