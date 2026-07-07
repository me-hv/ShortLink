import { Url } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { encodeBase62 } from '../utils/base62.js';
import { NotFoundError, BadRequestError, GoneError } from '../types/errors.js';
import { CacheService } from './cache.service.js';

export class UrlService {
  private cacheService: CacheService;

  constructor(cacheService: CacheService = new CacheService()) {
    this.cacheService = cacheService;
  }

  async shortenUrl(longUrl: string, customAlias?: string, expiresAt?: string | Date): Promise<Url> {
    let expiresDate: Date | null = null;
    if (expiresAt) {
      expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        throw new BadRequestError('Invalid expiration date format');
      }
      if (expiresDate <= new Date()) {
        throw new BadRequestError('Expiration date must be in the future');
      }
    }

    if (customAlias) {
      const alias = customAlias.trim();
      const reserved = ['api', 'qr', 'health', 'docs', 'analytics', 'urls', 'shorten'];
      if (reserved.includes(alias.toLowerCase())) {
        throw new BadRequestError('Alias contains a reserved keyword');
      }
      if (alias.length < 3 || alias.length > 30) {
        throw new BadRequestError('Alias must be between 3 and 30 characters');
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(alias)) {
        throw new BadRequestError('Alias can only contain letters, numbers, hyphens, and underscores');
      }

      // Check if alias is already in use
      const exists = await prisma.url.findUnique({
        where: { shortCode: alias },
      });
      if (exists) {
        throw new BadRequestError('Custom alias is already taken');
      }

      const urlRecord = await prisma.url.create({
        data: {
          longUrl,
          shortCode: alias,
          expiresAt: expiresDate,
        },
      });

      return urlRecord;
    }

    // Standard auto-generated Base62 flow
    const urlRecord = await prisma.url.create({
      data: {
        longUrl,
        shortCode: null,
        expiresAt: expiresDate,
      },
    });

    const shortCode = encodeBase62(urlRecord.id);

    const updatedRecord = await prisma.url.update({
      where: { id: urlRecord.id },
      data: { shortCode },
    });

    if (shortCode) {
      await this.cacheService.delete(`url:${shortCode}`);
      await this.cacheService.delete(`urlId:${shortCode}`);
    }

    return updatedRecord;
  }

  async getUrlByShortCode(shortCode: string): Promise<Url> {
    const records = await prisma.$queryRawUnsafe<Url[]>(
      'SELECT * FROM "Url" WHERE "shortCode" = $1 LIMIT 1',
      shortCode
    );
    const urlRecord = records[0];

    if (!urlRecord || !urlRecord.isActive) {
      throw new NotFoundError('URL not found or inactive');
    }

    if (urlRecord.expiresAt && new Date(urlRecord.expiresAt) < new Date()) {
      await this.cacheService.delete(`url:${shortCode}`);
      await this.cacheService.delete(`urlId:${shortCode}`);
      throw new GoneError('URL has expired');
    }

    // Compute TTL to match expiration exactly (up to maximum 1 hour cache limit)
    let ttl = 3600;
    if (urlRecord.expiresAt) {
      const remainingSecs = Math.floor((new Date(urlRecord.expiresAt).getTime() - Date.now()) / 1000);
      if (remainingSecs <= 0) {
        throw new GoneError('URL has expired');
      }
      ttl = Math.min(3600, remainingSecs);
    }

    await this.cacheService.set(`url:${shortCode}`, urlRecord.longUrl, ttl);
    await this.cacheService.set(`urlId:${shortCode}`, urlRecord.id.toString(), ttl);

    return urlRecord;
  }

  /**
   * Updates an existing URL record and invalidates its cache.
   */
  async updateUrl(id: number, data: Partial<Pick<Url, 'longUrl' | 'isActive'>>): Promise<Url> {
    const urlRecord = await prisma.url.findUnique({
      where: { id },
    });

    if (!urlRecord) {
      throw new NotFoundError('URL record not found');
    }

    const updatedRecord = await prisma.url.update({
      where: { id },
      data,
    });

    if (urlRecord.shortCode) {
      await this.cacheService.delete(`url:${urlRecord.shortCode}`);
      await this.cacheService.delete(`urlId:${urlRecord.shortCode}`);
    }

    return updatedRecord;
  }
}
