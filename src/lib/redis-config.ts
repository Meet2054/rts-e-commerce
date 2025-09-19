// src/lib/redis-config.ts
import { Redis } from '@upstash/redis'

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!restUrl || !restToken) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }

    redis = new Redis({
      url: restUrl,
      token: restToken,
    });

    console.log('✅ Upstash Redis client initialized');
  }

  return redis;
}

// Upstash Redis doesn't need explicit connection closing
export async function closeRedisConnection(): Promise<void> {
  // No-op for Upstash Redis as it's serverless
  console.log('ℹ️ Upstash Redis is serverless - no connection to close');
}

export default getRedisClient;
