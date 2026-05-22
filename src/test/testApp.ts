import express from 'express';
import cookieParser from 'cookie-parser';
import { identityMiddleware } from '../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware.js';
import { validateGuessInput } from '../middleware/validation.middleware.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import authRoutes from '../modules/auth/auth.routes.js';
import gameRoutes from '../modules/game/game.routes.js';

export function createTestApp() {
    const app = express();

    app.use(express.json({ limit: '10kb' }));
    app.use(cookieParser());
    app.use(identityMiddleware);
    app.use(rateLimitMiddleware);

    app.use('/api/auth', authRoutes);
    app.use('/api/game/sync', validateGuessInput);
    app.use('/api/game', gameRoutes);

    app.use(errorMiddleware);

    return app;
}
