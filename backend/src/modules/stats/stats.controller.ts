/**
 * Stats Controller - HTTP handlers for statistics endpoints.
 *
 * @see WBS Tasks 9.4, 9.5
 */

import { Request, Response, NextFunction } from 'express';
import * as statsService from './stats.service.js';

/** GET /api/stats/me */
export async function getPlayerStatsHandler(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const result = await statsService.getPlayerStats(res.locals.userId as string);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

/** GET /api/leaderboard */
export async function getLeaderboardHandler(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const result = await statsService.getLeaderboard();
        res.json(result);
    } catch (err) {
        next(err);
    }
}
