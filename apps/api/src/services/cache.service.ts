import { redis } from '../config/redis.js';

export class CacheService {
  /**
   * Retrieves a value from the cache by its key.
   */
  async get(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error(`⚠️ Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Stores a value in the cache with a Time-To-Live (TTL) in seconds.
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, value, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`⚠️ Redis SET error for key ${key}:`, error);
    }
  }

  /**
   * Deletes a cached entry by its key.
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`⚠️ Redis DEL error for key ${key}:`, error);
    }
  }
}
