import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

const noopRedis = {
  set: async () => undefined,
  get: async () => null,
  del: async () => 0,
} as unknown as Redis;

let redis: Redis = noopRedis;

if (redisUrl) {
  // Reuse a single Redis connection across reloads in dev
  const globalForRedis = global as unknown as { redis?: Redis };

  try {
    redis =
      globalForRedis.redis ||
      new Redis(redisUrl as string, {
        // Avoid throwing MaxRetriesPerRequestError; fail fast when offline queue is disabled.
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 200, 1000),
      });

    if (process.env.NODE_ENV !== "production") {
      globalForRedis.redis = redis;
    }
  } catch (err) {
    // If instantiation fails (bad URL), fall back to noop to keep app running.
    redis = noopRedis;
  }
}

// Silence unhandled error event logs from ioredis when connection info is missing/invalid.
if (redis && typeof (redis as any).on === "function") {
  (redis as any).on("error", () => {
    /* swallow noisy redis connection errors in non-critical contexts */
  });
}

export default redis;
