/**
 * Performance Routes
 *
 * Internal admin-only endpoints for performance and cache reports.
 *
 * @see WBS Tasks 10.1, 10.3
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as perfController from './perf.controller.js';

const router = Router();

function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers['x-admin-key'];
    const key = Array.isArray(header) ? header[0] : header;

    if (!key || key !== process.env.PERF_ADMIN_KEY) {
        res.status(403).json({
            error: {
                code: 'FORBIDDEN',
                message: 'Invalid admin key',
            },
        });
        return;
    }

    next();
}

router.use(requireAdminKey);
router.get('/report', perfController.getPerformanceReportHandler);
router.get('/cache', perfController.getCacheReportHandler);

export default router;
