/**
 * Prisma Client Singleton
 *
 * Uses @prisma/adapter-pg driver adapter (required by Prisma 6+).
 * Ensures a single PrismaClient instance is shared across the application.
 * Connection pooling is tuned for Neon's built-in pooler.
 *
 * @see WBS Tasks 5.7, 10.5
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || '';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: pg.Pool | undefined;
};

function createPool(): pg.Pool {
    const pool = new pg.Pool({
        connectionString,
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
        console.error('Unexpected idle client error:', err);
    });

    return pool;
}

export const pool =
    globalForPrisma.pool ??
    createPool();

function createPrismaClient(): PrismaClient {
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma =
    globalForPrisma.prisma ??
    createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
}

/**
 * Connect to the database on server startup.
 * Mitigates cold-start latency (Risk R10).
 */
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

/**
 * Disconnect from the database on server shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
    console.log('Database disconnected');
}
