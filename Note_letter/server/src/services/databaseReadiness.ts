/**
 * Bounded and deduplicated readiness check. One public /api/ready request must
 * never spawn an unbounded number of parallel database authentication probes.
 * Errors intentionally become booleans so HTTP responses never leak DB details.
 */
export function createDatabaseReadiness(
    check: () => Promise<unknown>,
    options: { timeoutMs?: number; cacheMs?: number; clock?: () => number } = {}
): () => Promise<boolean> {
    const timeoutMs = options.timeoutMs ?? 2500;
    const cacheMs = options.cacheMs ?? 5000;
    const clock = options.clock ?? Date.now;

    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
        throw new RangeError('Readiness timeout must be between 1 and 60000 ms.');
    }
    if (!Number.isSafeInteger(cacheMs) || cacheMs < 0 || cacheMs > 60_000) {
        throw new RangeError('Readiness cache duration must be between 0 and 60000 ms.');
    }

    let cached: { ready: boolean; expiresAt: number } | null = null;
    let inFlight: Promise<boolean> | null = null;

    return function databaseIsReady(): Promise<boolean> {
        if (cached && clock() < cached.expiresAt) return Promise.resolve(cached.ready);
        if (inFlight) return inFlight;

        inFlight = new Promise<boolean>((resolve) => {
            let settled = false;
            const finish = (ready: boolean): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                cached = { ready, expiresAt: clock() + cacheMs };
                inFlight = null;
                resolve(ready);
            };

            const timeout = setTimeout(() => finish(false), timeoutMs);
            // Executing in a microtask also captures synchronous failures.
            void Promise.resolve().then(check).then(
                () => finish(true),
                () => finish(false),
            );
        });
        return inFlight;
    };
}
