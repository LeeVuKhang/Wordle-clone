import { beforeEach, vi } from 'vitest';

type MockTree = Record<string, any>;

function resetMockTree(value: any): void {
    if (typeof value === 'function' && 'mockReset' in value) {
        value.mockReset();
        return;
    }

    if (!value || typeof value !== 'object') return;

    for (const child of Object.values(value)) {
        resetMockTree(child);
    }
}

const backendMocks = vi.hoisted(() => ({
    prismaMock: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findUniqueOrThrow: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        dailyGame: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        },
        dailyGuess: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        dailyWord: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
        $queryRawUnsafe: vi.fn(),
        $connect: vi.fn(),
        $disconnect: vi.fn(),
    },
    redisMock: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        ping: vi.fn(),
        incr: vi.fn(),
        expire: vi.fn(),
    },
    cacheMetricsMock: {
        recordHit: vi.fn(),
        recordMiss: vi.fn(),
        recordError: vi.fn(),
    },
    googleClientMock: {
        getToken: vi.fn(),
        verifyIdToken: vi.fn(),
    },
}));

export const prismaMock = backendMocks.prismaMock;
export const redisMock = backendMocks.redisMock;
export const cacheMetricsMock = backendMocks.cacheMetricsMock;
export const googleClientMock = backendMocks.googleClientMock;

vi.mock('../lib/prisma.js', () => ({
    prisma: backendMocks.prismaMock,
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn(),
    pool: { end: vi.fn() },
}));

vi.mock('../lib/redis.js', () => ({
    redis: backendMocks.redisMock,
    REDIS_KEYS: {
        DAILY_WORD: 'daily:word',
        DAILY_WORD_DATE: 'daily:word:date',
        LEADERBOARD_DATA: 'leaderboard:data',
        LEADERBOARD_REFRESH: 'leaderboard:refresh',
        rateGuest: (uuid: string) => `rate:guest:${uuid}`,
        rateUser: (id: string) => `rate:user:${id}`,
    },
    REDIS_TTL: {
        DAILY_WORD: 90000,
        LEADERBOARD_DATA: 600,
        LEADERBOARD_REFRESH: 300,
        RATE_LIMIT: 60,
    },
    RATE_LIMIT_MAX: 60,
}));

vi.mock('../lib/cacheMetrics.js', () => backendMocks.cacheMetricsMock);

vi.mock('google-auth-library', () => ({
    OAuth2Client: vi.fn(function OAuth2Client() {
        return backendMocks.googleClientMock;
    }),
}));

export function resetBackendMocks(): void {
    resetMockTree(prismaMock as MockTree);
    resetMockTree(redisMock as MockTree);
    resetMockTree(cacheMetricsMock as MockTree);
    resetMockTree(googleClientMock as MockTree);

    redisMock.get.mockResolvedValue({ id: 'daily-word-1', word: 'CRANE' });
    redisMock.set.mockResolvedValue('OK');
    redisMock.del.mockResolvedValue(1);
    redisMock.ping.mockResolvedValue('PONG');
    redisMock.incr.mockResolvedValue(1);
    redisMock.expire.mockResolvedValue(1);

    prismaMock.$transaction.mockImplementation(async (input: any) => {
        if (Array.isArray(input)) return Promise.all(input);
        if (typeof input === 'function') return input(prismaMock);
        return input;
    });
    prismaMock.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
}

beforeEach(() => {
    resetBackendMocks();
});
