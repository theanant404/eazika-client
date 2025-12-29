import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

let redis: Redis;

if (!redisUrl) {
  // No-op client for local/dev when Redis isn't configured.
  redis = {
    set: async () => undefined,
    get: async () => null,
  } as unknown as Redis;
} else {
  // Reuse a single Redis connection across reloads in dev
  const globalForRedis = global as unknown as { redis?: Redis };

  redis =
    globalForRedis.redis ||
    new Redis(redisUrl as string, {
      maxRetriesPerRequest: 1,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
  }
}

// Silence unhandled error event logs from ioredis when connection info is missing/invalid.
if (redis && typeof (redis as any).on === "function") {
  (redis as any).on("error", () => {
    /* swallow noisy redis connection errors in non-critical contexts */
  });
}

export default redis;
