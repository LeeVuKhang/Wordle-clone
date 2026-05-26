import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../../../test/setup.js';

vi.mock('../../game/game.service.js', () => ({
    calculateStreaks: vi.fn(),
}));

import { calculateStreaks } from '../../game/game.service.js';
import { mergeGuestData } from '../auth.service.js';

const USER_ID = 'user-1';
const GUEST_UUID = '11111111-1111-4111-8111-111111111111';

function game(id: string, day: number) {
    return {
        id,
        guestUuid: GUEST_UUID,
        userId: null,
        gameDate: new Date(Date.UTC(2026, 4, day)),
    };
}

function userGame(day: number) {
    return { gameDate: new Date(Date.UTC(2026, 4, day)) };
}

describe('mergeGuestData', () => {
    beforeEach(() => {
        prismaMock.user.findUniqueOrThrow.mockResolvedValue({
            currentStreak: 2,
            maxStreak: 5,
        });
    });

    it('returns zero counts and still recalculates streaks when there are no guest games', async () => {
        prismaMock.dailyGame.findMany.mockResolvedValueOnce([]);

        const result = await mergeGuestData(USER_ID, GUEST_UUID);

        expect(calculateStreaks).toHaveBeenCalledWith(USER_ID);
        expect(result).toEqual({
            merged: { gamesTransferred: 0, gamesSkipped: 0 },
            stats: { currentStreak: 2, maxStreak: 5 },
        });
    });

    it('transfers all guest games when the user has no games', async () => {
        const guestGames = [game('guest-1', 20), game('guest-2', 21), game('guest-3', 22)];
        prismaMock.dailyGame.findMany
            .mockResolvedValueOnce(guestGames)
            .mockResolvedValueOnce([]);

        const result = await mergeGuestData(USER_ID, GUEST_UUID);

        expect(prismaMock.dailyGame.update).toHaveBeenCalledTimes(3);
        for (const guestGame of guestGames) {
            expect(prismaMock.dailyGame.update).toHaveBeenCalledWith({
                where: { id: guestGame.id },
                data: { userId: USER_ID, guestUuid: null },
            });
        }
        expect(prismaMock.dailyGame.delete).not.toHaveBeenCalled();
        expect(result.merged).toEqual({ gamesTransferred: 3, gamesSkipped: 0 });
    });

    it('skips a guest game when the user already has that date', async () => {
        prismaMock.dailyGame.findMany
            .mockResolvedValueOnce([game('guest-1', 20), game('guest-2', 21)])
            .mockResolvedValueOnce([userGame(20)]);

        const result = await mergeGuestData(USER_ID, GUEST_UUID);

        expect(prismaMock.dailyGame.delete).toHaveBeenCalledWith({ where: { id: 'guest-1' } });
        expect(prismaMock.dailyGame.update).toHaveBeenCalledWith({
            where: { id: 'guest-2' },
            data: { userId: USER_ID, guestUuid: null },
        });
        expect(result.merged).toEqual({ gamesTransferred: 1, gamesSkipped: 1 });
    });

    it('skips all guest games when all dates conflict', async () => {
        prismaMock.dailyGame.findMany
            .mockResolvedValueOnce([game('guest-1', 20), game('guest-2', 21)])
            .mockResolvedValueOnce([userGame(20), userGame(21)]);

        const result = await mergeGuestData(USER_ID, GUEST_UUID);

        expect(prismaMock.dailyGame.delete).toHaveBeenCalledTimes(2);
        expect(prismaMock.dailyGame.update).not.toHaveBeenCalled();
        expect(result.merged).toEqual({ gamesTransferred: 0, gamesSkipped: 2 });
    });

    it('handles mixed transferable and conflicting games', async () => {
        prismaMock.dailyGame.findMany
            .mockResolvedValueOnce([game('guest-1', 19), game('guest-2', 20), game('guest-3', 21)])
            .mockResolvedValueOnce([userGame(20)]);

        const result = await mergeGuestData(USER_ID, GUEST_UUID);

        expect(prismaMock.dailyGame.update).toHaveBeenCalledTimes(2);
        expect(prismaMock.dailyGame.delete).toHaveBeenCalledTimes(1);
        expect(result.merged).toEqual({ gamesTransferred: 2, gamesSkipped: 1 });
    });

    it('calls calculateStreaks after merging', async () => {
        prismaMock.dailyGame.findMany
            .mockResolvedValueOnce([game('guest-1', 22)])
            .mockResolvedValueOnce([]);

        await mergeGuestData(USER_ID, GUEST_UUID);

        expect(calculateStreaks).toHaveBeenCalledWith(USER_ID);
    });

    it('returns updated stats from the recalculated user', async () => {
        prismaMock.dailyGame.findMany
            .mockResolvedValueOnce([game('guest-1', 22)])
            .mockResolvedValueOnce([]);
        prismaMock.user.findUniqueOrThrow.mockResolvedValue({
            currentStreak: 4,
            maxStreak: 8,
        });

        const result = await mergeGuestData(USER_ID, GUEST_UUID);

        expect(result.stats).toEqual({ currentStreak: 4, maxStreak: 8 });
    });
});
