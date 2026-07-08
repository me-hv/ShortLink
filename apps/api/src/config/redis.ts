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

export let redis = new Redis(finalRedisUrl, {
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
    console.warn('⚠️ Local Redis connection failed. Falling back to in-memory ioredis-mock...');
    try {
      // Require mock client dynamically in development fallback
      const RedisMock = require('ioredis-mock');
      redis = new RedisMock();
      console.log('✅ Connected to in-memory mock Redis successfully (DX Fallback)');
    } catch (mockError) {
      console.error('❌ CRITICAL STARTUP ERROR: Redis connection failed and ioredis-mock could not be loaded.');
      console.error(mockError);
      process.exit(1);
    }
  }
}
