import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import Redis from 'ioredis-mock';

vi.mock('ioredis', () => {
  return {
    default: Redis,
  };
});

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/config/redis.js';

describe('URL Shortener API', () => {
  beforeEach(async () => {
    // Clear url database records to keep tests deterministic
    await prisma.url.deleteMany();
    await redis.flushall();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('POST /api/shorten', () => {
    it('should successfully shorten a valid URL and return shortCode/shortUrl', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://google.com' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('shortCode');
      expect(response.body).toHaveProperty('shortUrl');
      expect(typeof response.body.shortCode).toBe('string');
      expect(response.body.shortUrl).toContain(response.body.shortCode);
    });

    it('should reject invalid URLs with 400 validation error', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /:shortCode', () => {
    it('should redirect (302) to the original long URL if shortCode exists', async () => {
      // 1. Create a shortened URL
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://google.com' });

      const { shortCode } = createResponse.body;

      // 2. Perform GET redirect request
      const redirectResponse = await request(app)
        .get(`/${shortCode}`);

      expect(redirectResponse.status).toBe(302);
      expect(redirectResponse.header.location).toBe('https://google.com');
    });

    it('should return 404 if the shortCode does not exist', async () => {
      const response = await request(app)
        .get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('URL not found or inactive');
    });
  });

  describe('Custom Alias & Expiration Features', () => {
    it('should allow creating and redirecting via custom alias', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://github.com', alias: 'my-github' });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.shortCode).toBe('my-github');

      const redirectResponse = await request(app).get('/my-github');
      expect(redirectResponse.status).toBe(302);
      expect(redirectResponse.header.location).toBe('https://github.com');
    });

    it('should reject alias if it is already taken', async () => {
      await request(app)
        .post('/api/shorten')
        .send({ url: 'https://github.com', alias: 'my-github' });

      const duplicateResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://google.com', alias: 'my-github' });

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.message).toBe('Custom alias is already taken');
    });

    it('should reject reserved keywords', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://github.com', alias: 'health' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Alias contains a reserved keyword');
    });

    it('should return 410 Gone for expired links', async () => {
      // Create link with past expiration in the database
      const pastDate = new Date(Date.now() - 10000);
      const urlRecord = await prisma.url.create({
        data: {
          longUrl: 'https://expired.com',
          shortCode: 'expired-link',
          expiresAt: pastDate,
        },
      });

      const response = await request(app).get('/expired-link');
      expect(response.status).toBe(410);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('URL has expired');
    });
  });

  describe('QR Code Generation', () => {
    it('should return 200 PNG image for a valid shortCode', async () => {
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://yahoo.com', alias: 'yahoo-qr' });

      const qrResponse = await request(app).get('/api/qr/yahoo-qr');
      expect(qrResponse.status).toBe(200);
      expect(qrResponse.headers['content-type']).toBe('image/png');
    });
  });

  describe('GET /health Monitoring', () => {
    it('should return 200 healthy status response', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('UP');
      expect(response.body.redis).toBe('UP');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
