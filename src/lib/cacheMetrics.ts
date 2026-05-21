/**
 * Cache Metrics
 *
 * Tracks in-memory hit, miss, and error counters for Redis-backed features.
 *
 * @see WBS Task 10.3
 */

export type CacheCategory =
    | 'daily_word'
    | 'leaderboard_data'
    | 'leaderboard_sentinel'
    | 'rate_limit';

export interface CacheMetrics {
    hits: number;
    misses: number;
    errors: number;
    lastAccess: string | null;
}

type CacheReport = Record<CacheCategory, CacheMetrics & { hitRate: number }>;

const CACHE_CATEGORIES: CacheCategory[] = [
    'daily_word',
    'leaderboard_data',
    'leaderboard_sentinel',
    'rate_limit',
];

const emptyMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    lastAccess: null,
};

const metrics = new Map<CacheCategory, CacheMetrics>();

function getMetrics(category: CacheCategory): CacheMetrics {
    return metrics.get(category) ?? emptyMetrics;
}

function updateMetrics(
    category: CacheCategory,
    update: Partial<Pick<CacheMetrics, 'hits' | 'misses' | 'errors'>>
): void {
    const current = getMetrics(category);
    metrics.set(category, {
        hits: current.hits + (update.hits ?? 0),
        misses: current.misses + (update.misses ?? 0),
        errors: current.errors + (update.errors ?? 0),
        lastAccess: new Date().toISOString(),
    });
}

/** Record a successful cache hit. */
export function recordHit(category: CacheCategory): void {
    updateMetrics(category, { hits: 1 });
}

/** Record a cache miss. */
export function recordMiss(category: CacheCategory): void {
    updateMetrics(category, { misses: 1 });
}

/** Record a cache access error. */
export function recordError(category: CacheCategory): void {
    updateMetrics(category, { errors: 1 });
}

/**
 * Return cache counters for all tracked categories.
 */
export function getCacheReport(): CacheReport {
    return CACHE_CATEGORIES.reduce<CacheReport>((report, category) => {
        const current = getMetrics(category);
        const totalLookups = current.hits + current.misses;
        const hitRate = totalLookups === 0
            ? 0
            : Number(((current.hits / totalLookups) * 100).toFixed(2));

        return {
            ...report,
            [category]: {
                ...current,
                hitRate,
            },
        };
    }, {} as CacheReport);
}
