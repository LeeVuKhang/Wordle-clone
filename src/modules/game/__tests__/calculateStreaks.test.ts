import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../../../test/setup.js';
import { calculateStreaks } from '../game.service.js';

const USER_ID = 'user-1';
const TODAY = new Date('2026-05-22T12:00:00Z');

function daysAgo(days: number): Date {
    return new Date(Date.UTC(2026, 4, 22 - days));
}

function mockWonGames(days: number[]): void {
    prismaMock.dailyGame.findMany.mockResolvedValue(
        days.map((day) => ({ gameDate: daysAgo(day) })),
    );
}

function expectStreakUpdate(currentStreak: number, maxStreak: number): void {
    expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: expect.objectContaining({
            currentStreak,
            maxStreak,
        }),
    });
}

describe('calculateStreaks', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(TODAY);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sets both streaks to zero when there are no won games', async () => {
        mockWonGames([]);

        await calculateStreaks(USER_ID);

        expect(prismaMock.dailyGame.findMany).toHaveBeenCalledWith({
            where: { userId: USER_ID, status: 'WON' },
            orderBy: { gameDate: 'desc' },
            select: { gameDate: true },
        });
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { currentStreak: 0, maxStreak: 0 },
        });
    });

    it('counts a single win today as a one-day current and max streak', async () => {
        mockWonGames([0]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(1, 1);
    });

    it('counts a single win yesterday as a one-day current and max streak', async () => {
        mockWonGames([1]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(1, 1);
    });

    it('does not count a win from two or more days ago as current', async () => {
        mockWonGames([2]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(0, 1);
    });

    it('counts 3 consecutive wins ending today', async () => {
        mockWonGames([0, 1, 2]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(3, 3);
    });

    it('counts 3 consecutive wins ending yesterday', async () => {
        mockWonGames([1, 2, 3]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(3, 3);
    });

    it('handles a gap between a 2-day current streak and a 3-day past streak', async () => {
        mockWonGames([0, 1, 4, 5, 6]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(2, 3);
    });

    it('keeps a past max streak when the current streak is shorter', async () => {
        mockWonGames([0, 3, 4, 5, 6]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(1, 4);
    });

    it('starts a new streak at one after a gap caused by a loss', async () => {
        mockWonGames([0, 2]);

        await calculateStreaks(USER_ID);

        expectStreakUpdate(1, 1);
    });
});
