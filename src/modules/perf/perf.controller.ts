/**
 * Performance Controller
 *
 * Exposes internal request timing and cache metric reports.
 *
 * @see WBS Tasks 10.1, 10.3
 */

import { Request, Response, NextFunction } from 'express';
import { getCacheReport } from '../../lib/cacheMetrics.js';
import { getPerformanceReport } from '../../middleware/requestTimer.middleware.js';

/** GET /api/perf/report */
export function getPerformanceReportHandler(
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        res.json(getPerformanceReport());
    } catch (err) {
        next(err);
    }
}

/** GET /api/perf/cache */
export function getCacheReportHandler(
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        res.json(getCacheReport());
    } catch (err) {
        next(err);
    }
}
