import Redis from 'ioredis';
import { env } from './env.js';

let redisUrl = env.REDIS_URL;

if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
  redisUrl = `rediss://${redisUrl}`;
}

const urlObj = new URL(redisUrl);

if (!urlObj.password && env.REDIS_TOKEN) {
  urlObj.password = env.REDIS_TOKEN;
}

if (urlObj.password && !urlObj.username) {
  urlObj.username = 'default';
}

const finalRedisUrl = urlObj.toString();

export const redis = new Redis(finalRedisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 100, 1000);
  },
});

export async function validateRedisConnection(): Promise<void> {
  if (env.NODE_ENV === 'test') {
    return;
  }

  try {
    console.log('🔌 Connecting to Redis...');
    await redis.connect();
    const result = await redis.ping();
    if (result === 'PONG') {
      console.log('✅ Connected to Redis (Upstash) successfully');
    } else {
      throw new Error(`Unexpected ping response: ${result}`);
    }
  } catch (error) {
    console.error('❌ CRITICAL STARTUP ERROR: Redis connection failed\n');
    console.error(error);
    console.error('\nPlease verify your REDIS_URL and REDIS_TOKEN configurations.\n');
    process.exit(1);
  }
}
