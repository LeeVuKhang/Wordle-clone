/**
 * Wordle Clone Express Server Entry Point
 *
 * Mounts all route modules, middleware pipeline, cron service, health probes,
 * and graceful shutdown handling.
 *
 * @see WBS Phase 6, Phase 7, Phase 10
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

// Infrastructure
import { connectDatabase, disconnectDatabase, prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { selectDailyWord } from './lib/cron.js';

// Middleware
import { identityMiddleware } from './middleware/auth.middleware.js';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware.js';
import { requestTimerMiddleware } from './middleware/requestTimer.middleware.js';
import { validateGuessInput } from './middleware/validation.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';

// Routes
import gameRoutes from './modules/game/game.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import statsRoutes, { leaderboardRoutes } from './modules/stats/stats.routes.js';
import perfRoutes from './modules/perf/perf.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
let isShuttingDown = false;

// ============================================================
// Security Hardening (Task 7.8)
// ============================================================

// Helmet - secure HTTP headers
app.use(helmet({
    // Allow cross-origin requests for API.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS - strict origins (Task 7.8)
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    // Add production domain(s) here.
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server).
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-ID', 'X-Correlation-ID', 'X-Admin-Key'],
    exposedHeaders: ['X-Response-Time'],
}));

// ============================================================
// Global Middleware (Chain of Responsibility)
// ============================================================

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(requestTimerMiddleware);
app.use(identityMiddleware);
app.use(rateLimitMiddleware);

// ============================================================
// Routes
// ============================================================

app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Wordle Clone API Server',
        version: '3.0.0',
        status: 'running',
    });
});

// Liveness probe - lightweight, no external dependencies.
app.get('/health/live', (_req: Request, res: Response) => {
    if (isShuttingDown) {
        return res.status(503).json({ status: 'shutting_down' });
    }

    res.json({
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Readiness probe - checks DB and Redis connectivity.
app.get('/health/ready', async (_req: Request, res: Response) => {
    if (isShuttingDown) {
        return res.status(503).json({ status: 'shutting_down' });
    }

    try {
        const [dbResult, redisResult] = await Promise.allSettled([
            prisma.$queryRawUnsafe('SELECT 1'),
            redis.ping(),
        ]);
        const dbOk = dbResult.status === 'fulfilled';
        const redisOk = redisResult.status === 'fulfilled';
        const timestamp = new Date().toISOString();

        if (dbOk && redisOk) {
            res.json({
                status: 'ready',
                db: 'connected',
                redis: 'connected',
                timestamp,
            });
            return;
        }

        res.status(503).json({
            status: 'degraded',
            db: dbOk ? 'connected' : 'disconnected',
            redis: redisOk ? 'connected' : 'disconnected',
            timestamp,
        });
    } catch {
        res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
    }
});

// Backward-compatible health alias.
app.get('/health', (_req: Request, res: Response) => {
    if (isShuttingDown) {
        return res.status(503).json({ status: 'shutting_down' });
    }

    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes (Phase 7)
app.use('/api/auth', authRoutes);

// Game routes (with input validation on sync)
app.use('/api/game/sync', validateGuessInput);
app.use('/api/game', gameRoutes);

// Stats, leaderboard, and internal performance routes
app.use('/api/stats', statsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/perf', perfRoutes);

// ============================================================
// Error Handler (must be last)
// ============================================================

app.use(errorMiddleware);

// ============================================================
// Server Startup
// ============================================================

async function bootstrap(): Promise<void> {
    // Connect to database (mitigates cold-start Risk R10).
    await connectDatabase();

    // Ensure today's word exists (health check Risk R1).
    try {
        await selectDailyWord();
    } catch (err) {
        console.warn('Daily word selection failed on startup:', err);
    }

    // Schedule daily word rotation at 00:00 UTC.
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily word rotation...');
        try {
            await selectDailyWord();
        } catch (err) {
            console.error('Cronjob failed:', err);
        }
    }, { timezone: 'UTC' });

    const server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });

    let shutdownStarted = false;

    const shutdown = async (signal: string): Promise<void> => {
        if (shutdownStarted) {
            return;
        }

        shutdownStarted = true;
        isShuttingDown = true;
        console.log(`Received ${signal}, starting graceful shutdown...`);

        await new Promise<void>((resolve) => {
            let resolved = false;
            const resolveOnce = (): void => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };

            const timeout = setTimeout(() => {
                console.warn('Shutdown timeout reached, forcing exit');
                resolveOnce();
            }, 10_000);

            server.close((err?: Error) => {
                clearTimeout(timeout);
                if (err) {
                    console.error('HTTP server close failed:', err);
                } else {
                    console.log('HTTP server closed');
                }
                resolveOnce();
            });
        });

        try {
            const { pool } = await import('./lib/prisma.js');
            await pool.end();
        } catch {
            // Best-effort pool cleanup.
        }

        try {
            await disconnectDatabase();
        } catch (err) {
            console.error('Database disconnect failed:', err);
        }

        console.log('Graceful shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', () => {
        void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
}

bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

export default app;
