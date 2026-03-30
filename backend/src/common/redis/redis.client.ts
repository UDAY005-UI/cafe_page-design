import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_PUBLIC_URL;

if (!redisUrl) {
  throw new Error('REDIS_PUBLIC_URL is not set');
}

export const redisClient = new IORedis(redisUrl, {
  // ─── BullMQ requirement ───────────────────────────────────────────────────
  maxRetriesPerRequest: null,

  // ─── Keep-alive: prevents load-balancers / proxies killing idle sockets ──
  keepAlive: 10_000, // send TCP keepalive every 10 s

  // ─── Auto-reconnect with exponential back-off (max 10 s) ─────────────────
  retryStrategy(times: number): number {
    const delay = Math.min(times * 200, 10_000);
    console.warn(
      `[Redis] Reconnecting… attempt ${times}, next try in ${delay} ms`,
    );
    return delay;
  },

  // ─── Re-subscribe / re-run commands after reconnect ──────────────────────
  enableReadyCheck: true,
  lazyConnect: false,
});

// ─── Lifecycle logging ────────────────────────────────────────────────────────
redisClient.on('connect', () => console.log('[Redis] Connected'));
redisClient.on('ready', () => console.log('[Redis] Ready'));
redisClient.on('reconnecting', () => console.warn('[Redis] Reconnecting…'));
redisClient.on('error', (err: Error) =>
  console.error('[Redis] Error:', err.message),
);
redisClient.on('close', () => console.warn('[Redis] Connection closed'));
redisClient.on('end', () =>
  console.error('[Redis] Connection ended — no more retries'),
);
