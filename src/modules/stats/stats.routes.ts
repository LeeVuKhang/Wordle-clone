/**
 * Stats Routes
 *
 * @see WBS Tasks 9.4, 9.5
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as statsController from './stats.controller.js';

const statsRoutes = Router();
const leaderboardRoutes = Router();

statsRoutes.get('/me', requireAuth, statsController.getPlayerStatsHandler);

leaderboardRoutes.get('/', statsController.getLeaderboardHandler);

export { leaderboardRoutes };
export default statsRoutes;
