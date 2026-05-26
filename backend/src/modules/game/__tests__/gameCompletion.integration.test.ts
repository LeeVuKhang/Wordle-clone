import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { prismaMock } from '../../../test/setup.js';
import { createTestApp } from '../../../test/testApp.js';

const app = createTestApp();
const GUEST_UUID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-1';
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function accessToken(userId = USER_ID): string {
    return jwt.sign(
        { sub: userId, email: `${userId}@example.com`, type: 'access' },
        SECRET,
        { expiresIn: '15m' },
    );
}

function game(overrides: Record<string, unknown> = {}) {
    return {
        id: 'game-1',
        userId: USER_ID,
        guestUuid: null,
        attempts: 0,
        status: 'PLAYING',
        guesses: [],
        ...overrides,
    };
}

describe('POST /api/game/sync completion flow', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-22T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates user streaks after syncing a WON game', async () => {
        prismaMock.dailyGame.findUnique.mockResolvedValueOnce(game());
        prismaMock.dailyGame.findMany.mockResolvedValueOnce([
            { gameDate: new Date('2026-05-22T00:00:00Z') },
        ]);

        const res = await request(app)
            .post('/api/game/sync')
            .set('Cookie', [`access_token=${accessToken()}`])
            .send({ id: 'game-1', guesses: ['CRANE'], status: 'WON' });

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: expect.objectContaining({ currentStreak: 1, maxStreak: 1 }),
        });
    });

    it('updates user streaks after syncing a LOST game', async () => {
        prismaMock.dailyGame.findUnique.mockResolvedValueOnce(game());
        prismaMock.dailyGame.findMany.mockResolvedValueOnce([]);

        const res = await request(app)
            .post('/api/game/sync')
            .set('Cookie', [`access_token=${accessToken()}`])
            .send({
                id: 'game-1',
                guesses: ['ADIEU', 'TRACE', 'SPEED', 'CIGAR', 'ARRAY', 'EERIE'],
                status: 'LOST',
            });

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { currentStreak: 0, maxStreak: 0 },
        });
    });

    it('does not recalculate streaks for duplicate WON syncs', async () => {
        prismaMock.dailyGame.findUnique.mockResolvedValueOnce(game({
            attempts: 1,
            status: 'WON',
            guesses: [{ guessWord: 'CRANE', attemptNumber: 1 }],
        }));

        const res = await request(app)
            .post('/api/game/sync')
            .set('Cookie', [`access_token=${accessToken()}`])
            .send({ id: 'game-1', guesses: ['CRANE'], status: 'WON' });

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(prismaMock.dailyGame.update).not.toHaveBeenCalled();
    });

    it('does not recalculate streaks for completed guest games', async () => {
        prismaMock.dailyGame.findUnique.mockResolvedValueOnce(game({
            userId: null,
            guestUuid: GUEST_UUID,
        }));

        const res = await request(app)
            .post('/api/game/sync')
            .set('X-Guest-ID', GUEST_UUID)
            .send({ id: 'game-1', guesses: ['CRANE'], status: 'WON' });

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(prismaMock.dailyGame.findMany).not.toHaveBeenCalled();
    });

    it('returns the completed state from GET /api/game/today after completion', async () => {
        prismaMock.dailyGame.findUnique
            .mockResolvedValueOnce(game({ userId: null, guestUuid: GUEST_UUID }))
            .mockResolvedValueOnce(game({
                userId: null,
                guestUuid: GUEST_UUID,
                attempts: 1,
                status: 'WON',
                guesses: [{ guessWord: 'CRANE', attemptNumber: 1 }],
            }));

        const syncRes = await request(app)
            .post('/api/game/sync')
            .set('X-Guest-ID', GUEST_UUID)
            .send({ id: 'game-1', guesses: ['CRANE'], status: 'WON' });
        const getRes = await request(app)
            .get('/api/game/today')
            .set('X-Guest-ID', GUEST_UUID);

        expect(syncRes.status).toBe(200);
        expect(getRes.status).toBe(200);
        expect(getRes.body).toMatchObject({
            id: 'game-1',
            guesses: ['CRANE'],
            attempts: 1,
            status: 'WON',
        });
    });
});
