import { Request, Response } from 'express';
import { UrlService } from '../services/url.js';
import { CacheService } from '../services/cache.service.js';
import { ClickLoggerService } from '../services/clickLogger.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { z } from 'zod';
import QRCode from 'qrcode';
import { env } from '../config/env.js';

const shortenSchema = z.object({
  url: z.string().url('Invalid URL format'),
  alias: z.string().optional(),
  expiresAt: z.string().optional().nullable(),
});

const periodSchema = z.enum(['7d', '30d', '90d']).default('30d');

export class UrlController {
  private urlService: UrlService;
  private cacheService: CacheService;
  private clickLoggerService: ClickLoggerService;
  private analyticsService: AnalyticsService;

  constructor(
    urlService: UrlService,
    cacheService: CacheService = new CacheService(),
    clickLoggerService: ClickLoggerService = new ClickLoggerService(),
    analyticsService: AnalyticsService = new AnalyticsService()
  ) {
    this.urlService = urlService;
    this.cacheService = cacheService;
    this.clickLoggerService = clickLoggerService;
    this.analyticsService = analyticsService;
  }

  shorten = async (req: Request, res: Response): Promise<void> => {
    const { url, alias, expiresAt } = shortenSchema.parse(req.body);

    const record = await this.urlService.shortenUrl(url, alias || undefined, expiresAt || undefined);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const shortUrl = `${protocol}://${host}/${record.shortCode}`;

    res.status(201).json({
      shortCode: record.shortCode,
      shortUrl,
    });
  };

  redirect = async (req: Request, res: Response): Promise<void> => {
    const { shortCode } = req.params;

    // 1. Redis lookup
    const cachedUrl = await this.cacheService.get(`url:${shortCode}`);
    if (cachedUrl) {
      res.redirect(302, cachedUrl);

      // Async click logging
      this.logClickAsync(shortCode, req).catch(err => {
        console.error('⚠️ Async click logging error:', err);
      });
      return;
    }

    // 2. PostgreSQL query on cache miss (which validates active & expiration states, and sets cache)
    const record = await this.urlService.getUrlByShortCode(shortCode);

    res.redirect(302, record.longUrl);

    // Async click logging
    this.clickLoggerService.logClick({
      urlId: record.id,
      ip: req.ip || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || null,
    }).catch(err => {
      console.error('⚠️ Async click logging error:', err);
    });
  };

  qrCode = async (req: Request, res: Response): Promise<void> => {
    let shortCode = req.params.shortCode;
    console.log("QR Request:", shortCode);
    if (shortCode && shortCode.includes('/')) {
      shortCode = shortCode.split('/').pop() || shortCode;
    }

    // Ensure the url exists and is active (will throw 410 or 404 if inactive/expired)
    let longUrl = await this.cacheService.get(`url:${shortCode}`);
    if (!longUrl) {
      const record = await this.urlService.getUrlByShortCode(shortCode);
      longUrl = record.longUrl;
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const baseUrl = env.PUBLIC_WEB_URL || `${protocol}://${host}`;
    const redirectUrl = `${baseUrl}/${shortCode}`;

    const qrPngBuffer = await QRCode.toBuffer(redirectUrl, {
      type: 'png',
      width: 256,
      margin: 2,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="qr-${shortCode}.png"`);
    res.send(qrPngBuffer);
  };

  /**
   * Helper to resolve click logging parameters asynchronously on cache hit
   */
  private async logClickAsync(shortCode: string, req: Request): Promise<void> {
    let urlIdStr = await this.cacheService.get(`urlId:${shortCode}`);
    let urlId: number;

    if (urlIdStr) {
      urlId = parseInt(urlIdStr, 10);
    } else {
      const record = await this.urlService.getUrlByShortCode(shortCode);
      urlId = record.id;
      await this.cacheService.set(`urlId:${shortCode}`, urlId.toString(), 3600);
    }

    await this.clickLoggerService.logClick({
      urlId,
      ip: req.ip || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || null,
    });
  }

  getAnalytics = async (req: Request, res: Response): Promise<void> => {
    const { shortCode } = req.params;
    const period = periodSchema.parse(req.query.period);
    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const summary = await this.analyticsService.getAnalytics(shortCode, periodDays);
    res.status(200).json(summary);
  };

  getUrlMetadata = async (req: Request, res: Response): Promise<void> => {
    const { shortCode } = req.params;

    const metadata = await this.analyticsService.getUrlMetadata(shortCode);
    res.status(200).json(metadata);
  };
}
