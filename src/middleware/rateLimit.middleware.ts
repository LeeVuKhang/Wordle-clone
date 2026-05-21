/**
 * Rate Limit Middleware — Redis-backed per-identity rate limiting
 *
 * Max 60 requests per minute per identity (userId or guestUuid).
 *
 * @see WBS Tasks 6C.2, 7.3
 */

import { Request, Response, NextFunction } from 'express';
import { redis, REDIS_KEYS, REDIS_TTL, RATE_LIMIT_MAX } from '../lib/redis.js';
import { recordError, recordHit } from '../lib/cacheMetrics.js';

export async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { userId, guestUuid } = res.locals;

    // Determine rate limit key
    const key = userId
        ? REDIS_KEYS.rateUser(userId)
        : guestUuid
            ? REDIS_KEYS.rateGuest(guestUuid)
            : null;

    if (!key) {
        // No identity — skip rate limiting (requireIdentity will catch this)
        next();
        return;
    }

    try {
        const current = await redis.incr(key);
        recordHit('rate_limit');

        // Set TTL on first request in window
        if (current === 1) {
            await redis.expire(key, REDIS_TTL.RATE_LIMIT);
        }

        if (current > RATE_LIMIT_MAX) {
            res.setHeader('Retry-After', '30');
            res.status(429).json({
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} requests per minute.`,
                },
            });
            return;
        }

        next();
    } catch {
        recordError('rate_limit');
        // If Redis is down, allow the request through
        next();
    }
}
