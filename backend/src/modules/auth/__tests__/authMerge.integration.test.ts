import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { googleClientMock, prismaMock } from '../../../test/setup.js';
import { createTestApp } from '../../../test/testApp.js';

const app = createTestApp();
const USER_ID = 'user-1';
const GUEST_UUID = '11111111-1111-4111-8111-111111111111';
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function accessToken(userId = USER_ID): string {
    return jwt.sign(
        { sub: userId, email: `${userId}@example.com`, type: 'access' },
        SECRET,
        { expiresIn: '15m' },
    );
}

function refreshToken(userId = USER_ID): string {
    return jwt.sign(
        { sub: userId, email: `${userId}@example.com`, type: 'refresh' },
        SECRET,
        { expiresIn: '7d' },
    );
}

function guestGame(id: string, day: number) {
    return {
        id,
        guestUuid: GUEST_UUID,
        userId: null,
        gameDate: new Date(Date.UTC(2026, 4, day)),
    };
}

function setCookieHeader(res: request.Response): string {
    const value = res.headers['set-cookie'] as string | string[] | undefined;
    return Array.isArray(value) ? value.join(';') : value ?? '';
}

describe('Auth + Merge flow', () => {
    it('authenticates with Google, returns the user, and sets cookies', async () => {
        googleClientMock.getToken.mockResolvedValue({
            tokens: { id_token: 'google-id-token' },
        });
        googleClientMock.verifyIdToken.mockResolvedValue({
            getPayload: () => ({
                sub: 'google-user-1',
                email: 'player@example.com',
                name: 'Player One',
            }),
        });
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            id: USER_ID,
            email: 'player@example.com',
            username: 'Player One',
            currentStreak: 2,
            maxStreak: 4,
        });

        const res = await request(app)
            .post('/api/auth/google')
            .send({ code: 'valid-code', redirectUri: 'http://localhost:5173/auth/callback' });

        expect(res.status).toBe(200);
        expect(res.body.user).toEqual({
            id: USER_ID,
            email: 'player@example.com',
            username: 'Player One',
            currentStreak: 2,
            maxStreak: 4,
        });
        expect(res.body.accessToken).toEqual(expect.any(String));
        expect(setCookieHeader(res)).toContain('access_token=');
        expect(setCookieHeader(res)).toContain('refresh_token=');
    });

    it('returns 401 OAUTH_ERROR for an invalid Google code', async () => {
        googleClientMock.getToken.mockRejectedValue(new Error('invalid_grant'));

        const res = await request(app)
            .post('/api/auth/google')
            .send({ code: 'invalid-code', redirectUri: 'http://localhost:5173/auth/callback' });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('OAUTH_ERROR');
    });

    it('rotates tokens with a valid refresh cookie', async () => {
        const token = refreshToken();
        const hash = await bcrypt.hash(token, 10);
        prismaMock.user.findUnique.mockResolvedValue({
            id: USER_ID,
            email: 'user-1@example.com',
            refreshTokenHash: hash,
        });

        const res = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [`refresh_token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toEqual(expect.any(String));
        expect(setCookieHeader(res)).toContain('access_token=');
        expect(setCookieHeader(res)).toContain('refresh_token=');
    });

    it('rejects an expired or invalid refresh cookie with 401', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', ['refresh_token=not-a-jwt']);

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects merge requests without auth', async () => {
        const res = await request(app)
            .post('/api/auth/merge')
            .send({ guestUuid: GUEST_UUID });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('merges guest games for an authenticated user', async () => {
        prismaMock.dailyGame.findMany.mockImplementation((args: any) => {
            if (args.where?.guestUuid === GUEST_UUID) {
                return Promise.resolve([guestGame('guest-1', 21), guestGame('guest-2', 22)]);
            }
            if (args.where?.userId === USER_ID && args.where?.status === 'WON') {
                return Promise.resolve([{ gameDate: new Date('2026-05-22T00:00:00Z') }]);
            }
            if (args.where?.userId === USER_ID) {
                return Promise.resolve([]);
            }
            return Promise.resolve([]);
        });
        prismaMock.user.findUniqueOrThrow.mockResolvedValue({
            currentStreak: 1,
            maxStreak: 3,
        });

        const res = await request(app)
            .post('/api/auth/merge')
            .set('Cookie', [`access_token=${accessToken()}`])
            .send({ guestUuid: GUEST_UUID });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            merged: { gamesTransferred: 2, gamesSkipped: 0 },
            stats: { currentStreak: 1, maxStreak: 3 },
        });
        expect(prismaMock.dailyGame.update).toHaveBeenCalledTimes(2);
    });

    it('returns zero transferred games for a non-existent guest UUID', async () => {
        prismaMock.dailyGame.findMany.mockResolvedValue([]);
        prismaMock.user.findUniqueOrThrow.mockResolvedValue({
            currentStreak: 0,
            maxStreak: 0,
        });

        const res = await request(app)
            .post('/api/auth/merge')
            .set('Cookie', [`access_token=${accessToken()}`])
            .send({ guestUuid: '22222222-2222-4222-8222-222222222222' });

        expect(res.status).toBe(200);
        expect(res.body.merged).toEqual({ gamesTransferred: 0, gamesSkipped: 0 });
    });

    it('returns the current user profile with a valid access token', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: USER_ID,
            email: 'user-1@example.com',
            username: 'Player',
            currentStreak: 4,
            maxStreak: 9,
            createdAt: new Date('2026-01-01T00:00:00Z'),
        });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', [`access_token=${accessToken()}`]);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: USER_ID,
            email: 'user-1@example.com',
            username: 'Player',
            currentStreak: 4,
            maxStreak: 9,
        });
    });

    it('logs out by revoking the refresh token and clearing cookies', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', [`access_token=${accessToken()}`]);

        expect(res.status).toBe(200);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { refreshTokenHash: null },
        });
        expect(setCookieHeader(res)).toContain('access_token=');
        expect(setCookieHeader(res)).toContain('refresh_token=');
    });
});
