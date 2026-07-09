import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import Redis from 'ioredis-mock';

// Mock ioredis with ioredis-mock in this test file
vi.mock('ioredis', () => {
  return {
    default: Redis,
  };
});

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/config/redis.js';
import { UrlService } from '../src/services/url.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ShortLink Phase 2 - Redis Caching & Rate Limiting', () => {
  beforeEach(async () => {
    await prisma.url.deleteMany();
    await redis.flushall();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('Redis URL Caching', () => {
    it('should query PostgreSQL on cache MISS, populate Redis, and HIT Redis on subsequent request', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });

      const { shortCode } = createResponse.body;
      const cacheKey = `url:${shortCode}`;

      const cachedBefore = await redis.get(cacheKey);
      expect(cachedBefore).toBeNull();

      // Spy on service method instead of getter proxy
      const querySpy = vi.spyOn(UrlService.prototype, 'getUrlByShortCode');

      const res1 = await request(app).get(`/${shortCode}`);
      expect(res1.status).toBe(302);
      expect(res1.header.location).toBe('https://example.com');
      expect(querySpy).toHaveBeenCalledTimes(1);

      const cachedAfter = await redis.get(cacheKey);
      expect(cachedAfter).toBe('https://example.com');
      const ttl = await redis.ttl(cacheKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(3600);

      querySpy.mockClear();

      const res2 = await request(app).get(`/${shortCode}`);
      expect(res2.status).toBe(302);
      expect(res2.header.location).toBe('https://example.com');
      expect(querySpy).toHaveBeenCalledTimes(0);

      querySpy.mockRestore();
    });

    it('should invalidate cache when a URL is modified or deactivated', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });
      const { shortCode } = createResponse.body;
      const cacheKey = `url:${shortCode}`;

      await request(app).get(`/${shortCode}`);
      const cachedVal1 = await redis.get(cacheKey);
      expect(cachedVal1).toBe('https://example.com');

      // Use raw query to retrieve record safely in tests
      const records = await prisma.$queryRawUnsafe<any[]>(
        'SELECT * FROM "Url" WHERE "shortCode" = $1 LIMIT 1',
        shortCode
      );
      const record = records[0];
      expect(record).toBeDefined();

      const { UrlService } = await import('../src/services/url.js');
      const urlService = new UrlService();
      
      await urlService.updateUrl(record!.id, { isActive: false });

      const cachedVal2 = await redis.get(cacheKey);
      expect(cachedVal2).toBeNull();
    });
  });

  describe('Sliding Window Rate Limiter', () => {
    it('should allow up to 100 requests per minute and return HTTP 429 for the 101st request', async () => {
      const ip = '192.168.1.50';
      
      for (let i = 0; i < 100; i++) {
        const response = await request(app)
          .post('/api/shorten')
          .set('X-Forwarded-For', ip)
          .send({ url: 'not-valid' });
        
        expect(response.status).toBe(400);
      }

      const blockedResponse = await request(app)
        .post('/api/shorten')
        .set('X-Forwarded-For', ip)
        .send({ url: 'https://example.com' });

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.status).toBe('fail');
      expect(blockedResponse.body.message).toContain('Too many requests');
    });
  });

  describe('Startup Environment Validation', () => {
    it('should exit with code 1 if a required variable is missing', () => {
      try {
        execSync('npx tsx src/config/env.ts', {
          env: {
            ...process.env,
            DATABASE_URL: '', // Clear DATABASE_URL to trigger failure
          },
          cwd: path.resolve(__dirname, '../'),
          stdio: 'pipe',
        });
        expect.fail('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
        const stderr = error.stderr.toString();
        expect(stderr).toContain('DATABASE_URL is required');
      }
    });
  });
});
