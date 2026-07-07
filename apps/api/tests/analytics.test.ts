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

describe('ShortLink Phase 3 - Analytics Engine Integration Tests', () => {
  beforeEach(async () => {
    await prisma.click.deleteMany();
    await prisma.url.deleteMany();
    await redis.flushall();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('Async Click Logging & Parsing', () => {
    it('should redirect immediately and log analytics asynchronously', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });
      const { shortCode } = createResponse.body;

      const startTime = Date.now();
      const res = await request(app)
        .get(`/${shortCode}`)
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
        .set('Referer', 'https://t.co')
        .set('X-Forwarded-For', '8.8.8.8');
      
      const duration = Date.now() - startTime;

      expect(res.status).toBe(302);
      expect(res.header.location).toBe('https://example.com');
      // Redirect must be extremely fast (below 50ms is common on local app servers)
      expect(duration).toBeLessThan(100);

      // Give database writing some time to complete asynchronously
      await new Promise(resolve => setTimeout(resolve, 150));

      const clicks = await prisma.click.findMany();
      expect(clicks.length).toBe(1);

      const click = clicks[0];
      expect(['Safari', 'Mobile Safari']).toContain(click.browser);
      expect(click.os).toBe('iOS');
      expect(click.deviceType).toBe('Mobile');
      expect(click.referrer).toBe('https://t.co');
      
      // Hash validation: must be exactly a 64-char hex SHA-256 hash
      expect(click.ipHash).toMatch(/^[a-f0-9]{64}$/);
      expect(click.ipHash).not.toBe('8.8.8.8');

      // geoip-lite lookup check
      expect(['US', 'Unknown']).toContain(click.countryCode);
    });

    it('should parse bot user agents correctly', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });
      const { shortCode } = createResponse.body;

      await request(app)
        .get(`/${shortCode}`)
        .set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');

      await new Promise(resolve => setTimeout(resolve, 150));

      const clicks = await prisma.click.findMany();
      expect(clicks.length).toBe(1);
      expect(clicks[0].deviceType).toBe('Bot');
      expect(clicks[0].browser).toBe('Bot');
    });

    it('should fall back to Unknown when User-Agent is empty', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });
      const { shortCode } = createResponse.body;

      await request(app)
        .get(`/${shortCode}`)
        .set('User-Agent', '');

      await new Promise(resolve => setTimeout(resolve, 150));

      const clicks = await prisma.click.findMany();
      expect(clicks.length).toBe(1);
      expect(clicks[0].deviceType).toBe('Unknown');
      expect(clicks[0].browser).toBe('Unknown');
      expect(clicks[0].os).toBe('Unknown');
    });
  });

  describe('Analytics Queries & Period Aggregations', () => {
    it('should return aggregated analytics for the specified period', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });
      const { shortCode } = createResponse.body;

      const records = await prisma.$queryRawUnsafe<any[]>(
        'SELECT * FROM "Url" WHERE "shortCode" = $1 LIMIT 1',
        shortCode
      );
      const urlId = records[0].id;

      const now = new Date();
      const clickWithin7d = {
        urlId,
        clickedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ipHash: 'hash1',
        browser: 'Chrome',
        os: 'Windows',
        deviceType: 'Desktop',
        countryCode: 'US',
        referrer: 'https://github.com',
      };
      
      const clickWithin30d = {
        urlId,
        clickedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        ipHash: 'hash2',
        browser: 'Firefox',
        os: 'Mac OS',
        deviceType: 'Desktop',
        countryCode: 'CA',
        referrer: 'https://news.ycombinator.com',
      };

      const clickOlder = {
        urlId,
        clickedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        ipHash: 'hash3',
        browser: 'Safari',
        os: 'iOS',
        deviceType: 'Mobile',
        countryCode: 'GB',
        referrer: null,
      };

      await prisma.click.createMany({
        data: [clickWithin7d, clickWithin30d, clickOlder],
      });

      // 1. Period = 7d
      const res7d = await request(app).get(`/api/analytics/${shortCode}?period=7d`);
      expect(res7d.status).toBe(200);
      expect(res7d.body.totalClicks).toBe(1);
      expect(res7d.body.browserDistribution).toEqual([{ browser: 'Chrome', clicks: 1 }]);
      expect(res7d.body.operatingSystems).toEqual([{ os: 'Windows', clicks: 1 }]);
      expect(res7d.body.deviceBreakdown).toEqual([{ deviceType: 'Desktop', clicks: 1 }]);
      expect(res7d.body.countryDistribution).toEqual([{ countryCode: 'US', clicks: 1 }]);
      expect(res7d.body.topReferrers).toEqual([{ referrer: 'https://github.com', clicks: 1 }]);

      // 2. Period = 30d
      const res30d = await request(app).get(`/api/analytics/${shortCode}?period=30d`);
      expect(res30d.status).toBe(200);
      expect(res30d.body.totalClicks).toBe(2);

      // 3. Period = 90d
      const res90d = await request(app).get(`/api/analytics/${shortCode}?period=90d`);
      expect(res90d.status).toBe(200);
      expect(res90d.body.totalClicks).toBe(3);
    });

    it('should return 404 for analytics of nonexistent shortCode', async () => {
      const res = await request(app).get('/api/analytics/invalid');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('URL Metadata API', () => {
    it('should return correct metadata and total cumulative click count', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });
      const { shortCode } = createResponse.body;

      const records = await prisma.$queryRawUnsafe<any[]>(
        'SELECT * FROM "Url" WHERE "shortCode" = $1 LIMIT 1',
        shortCode
      );
      const urlId = records[0].id;

      await prisma.click.createMany({
        data: [
          { urlId, ipHash: 'h1', browser: 'Chrome', os: 'Windows', deviceType: 'Desktop', countryCode: 'US' },
          { urlId, ipHash: 'h2', browser: 'Safari', os: 'iOS', deviceType: 'Mobile', countryCode: 'US' }
        ]
      });

      const res = await request(app).get(`/api/urls/${shortCode}`);
      expect(res.status).toBe(200);
      expect(res.body.originalUrl).toBe('https://example.com');
      expect(res.body.shortCode).toBe(shortCode);
      expect(res.body.totalClicks).toBe(2);
      expect(res.body.expiration).toBeNull();
      expect(res.body.status).toBe('active');
    });

    it('should return 404 for metadata of nonexistent shortCode', async () => {
      const res = await request(app).get('/api/urls/invalid');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
    });
  });
});
