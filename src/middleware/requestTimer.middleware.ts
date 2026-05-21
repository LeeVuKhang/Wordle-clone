/**
 * Request Timer Middleware
 *
 * Adds response timing headers and keeps in-memory endpoint latency metrics.
 *
 * @see WBS Task 10.1
 */

import { Request, Response, NextFunction } from 'express';

const MAX_SAMPLES = 1000;
const SLOW_REQUEST_MS = 200;

export interface EndpointMetrics {
    path: string;
    method: string;
    count: number;
    totalMs: number;
    minMs: number;
    maxMs: number;
    samples: number[];
}

export interface EndpointPerformanceReport {
    path: string;
    method: string;
    count: number;
    avgMs: number;
    minMs: number;
    maxMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
}

export interface PerformanceReport {
    generatedAt: string;
    endpoints: EndpointPerformanceReport[];
}

const endpointMetrics = new Map<string, EndpointMetrics>();

function normalizePath(req: Request): string {
    const path = (req.originalUrl || req.path).split('?')[0] || '/';
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function metricKey(method: string, path: string): string {
    return `${method.toUpperCase()} ${path}`;
}

function roundMs(value: number): number {
    return Number(value.toFixed(2));
}

function nextSamples(current: EndpointMetrics | undefined, durationMs: number, nextCount: number): number[] {
    if (!current) {
        return [durationMs];
    }

    if (current.samples.length < MAX_SAMPLES) {
        return [...current.samples, durationMs];
    }

    const replacementIndex = Math.floor(Math.random() * nextCount);
    if (replacementIndex >= MAX_SAMPLES) {
        return current.samples;
    }

    return current.samples.map((sample, index) => (
        index === replacementIndex ? durationMs : sample
    ));
}

function recordEndpointDuration(method: string, path: string, durationMs: number): void {
    const key = metricKey(method, path);
    const current = endpointMetrics.get(key);
    const nextCount = (current?.count ?? 0) + 1;

    endpointMetrics.set(key, {
        path,
        method,
        count: nextCount,
        totalMs: (current?.totalMs ?? 0) + durationMs,
        minMs: current ? Math.min(current.minMs, durationMs) : durationMs,
        maxMs: current ? Math.max(current.maxMs, durationMs) : durationMs,
        samples: nextSamples(current, durationMs, nextCount),
    });
}

function percentile(samples: number[], percentileValue: number): number {
    if (samples.length === 0) {
        return 0;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.min(
        sorted.length - 1,
        Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
    );

    return sorted[index];
}

function getCorrelationId(req: Request): string | null {
    const header = req.headers['x-correlation-id'];
    if (Array.isArray(header)) {
        return header[0] ?? null;
    }
    return header ?? null;
}

function logSlowRequest(req: Request, path: string, durationMs: number): void {
    if (durationMs <= SLOW_REQUEST_MS) {
        return;
    }

    console.warn(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Slow request detected',
        path,
        method: req.method,
        durationMs: roundMs(durationMs),
        correlationId: getCorrelationId(req),
    }));
}

/**
 * Return a latency report for all observed endpoints.
 */
export function getPerformanceReport(): PerformanceReport {
    const endpoints = [...endpointMetrics.values()]
        .map((metrics) => ({
            path: metrics.path,
            method: metrics.method,
            count: metrics.count,
            avgMs: roundMs(metrics.totalMs / metrics.count),
            minMs: roundMs(metrics.minMs),
            maxMs: roundMs(metrics.maxMs),
            p50Ms: roundMs(percentile(metrics.samples, 50)),
            p95Ms: roundMs(percentile(metrics.samples, 95)),
            p99Ms: roundMs(percentile(metrics.samples, 99)),
        }))
        .sort((a, b) => (
            a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
        ));

    return {
        generatedAt: new Date().toISOString(),
        endpoints,
    };
}

/**
 * Measure request duration and attach X-Response-Time in milliseconds.
 */
export function requestTimerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const start = process.hrtime.bigint();
    const path = normalizePath(req);
    const method = req.method.toUpperCase();
    let recorded = false;

    const finalizeResponse = (): void => {
        if (recorded) {
            return;
        }

        recorded = true;
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const roundedDuration = roundMs(durationMs);

        if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${roundedDuration}ms`);
        }

        recordEndpointDuration(method, path, durationMs);
        logSlowRequest(req, path, durationMs);
    };

    const originalWriteHead = res.writeHead;
    res.writeHead = function writeHeadWithTiming(
        this: Response,
        ...args: Parameters<Response['writeHead']>
    ): Response {
        finalizeResponse();
        return originalWriteHead.apply(this, args);
    } as Response['writeHead'];

    res.on('finish', finalizeResponse);
    next();
}
