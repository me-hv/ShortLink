import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../types/errors.js';

export interface AnalyticsSummary {
  totalClicks: number;
  clicksOverTime: Array<{ date: string; clicks: number }>;
  topReferrers: Array<{ referrer: string | null; clicks: number }>;
  browserDistribution: Array<{ browser: string; clicks: number }>;
  operatingSystems: Array<{ os: string; clicks: number }>;
  deviceBreakdown: Array<{ deviceType: string; clicks: number }>;
  countryDistribution: Array<{ countryCode: string; clicks: number }>;
  firstClick: string | null;
  lastClick: string | null;
  recentClicks: Array<{
    id: number;
    clickedAt: Date;
    ipHash: string;
    browser: string;
    os: string;
    deviceType: string;
    countryCode: string;
    referrer: string | null;
  }>;
}

export interface UrlMetadata {
  originalUrl: string;
  shortCode: string | null;
  createdDate: string;
  totalClicks: number;
  expiration: null;
  status: 'active' | 'inactive';
}

export class AnalyticsService {
  /**
   * Retrieves aggregated click analytics for a given shortCode and period
   */
  async getAnalytics(shortCode: string, periodDays: number): Promise<AnalyticsSummary> {
    const urlRecord = await prisma.url.findFirst({
      where: { shortCode },
    });

    if (!urlRecord) {
      throw new NotFoundError('URL not found');
    }

    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const urlId = urlRecord.id;

    // Run database-side aggregations sequentially to respect database connection limits
    // 1. Total Click Count
    const totalClicks = await prisma.click.count({
      where: { urlId, clickedAt: { gte: startDate } },
    });

    // 2. Clicks Over Time (Grouped by Day)
    const clicksOverTimeRaw = await prisma.$queryRaw<Array<{ date: string; clicks: number }>>`
      SELECT TO_CHAR("clickedAt", 'YYYY-MM-DD') AS date, COUNT(*)::int AS clicks
      FROM "Click"
      WHERE "urlId" = ${urlId} AND "clickedAt" >= ${startDate}
      GROUP BY date
      ORDER BY date ASC
    `;

    // 3. Top Referrers
    const referrerGroups = await prisma.click.groupBy({
      by: ['referrer'],
      where: { urlId, clickedAt: { gte: startDate } },
      _count: { id: true },
    });

    // 4. Browser Distribution
    const browserGroups = await prisma.click.groupBy({
      by: ['browser'],
      where: { urlId, clickedAt: { gte: startDate } },
      _count: { id: true },
    });

    // 5. Operating Systems
    const osGroups = await prisma.click.groupBy({
      by: ['os'],
      where: { urlId, clickedAt: { gte: startDate } },
      _count: { id: true },
    });

    // 6. Device Breakdown
    const deviceGroups = await prisma.click.groupBy({
      by: ['deviceType'],
      where: { urlId, clickedAt: { gte: startDate } },
      _count: { id: true },
    });

    // 7. Country Distribution
    const countryGroups = await prisma.click.groupBy({
      by: ['countryCode'],
      where: { urlId, clickedAt: { gte: startDate } },
      _count: { id: true },
    });

    // 8. First and Last Click timestamps
    const boundaryClicks = await prisma.click.aggregate({
      where: { urlId, clickedAt: { gte: startDate } },
      _min: { clickedAt: true },
      _max: { clickedAt: true },
    });

    // 9. Recent Clicks (take 10)
    const recentClicks = await prisma.click.findMany({
      where: { urlId, clickedAt: { gte: startDate } },
      orderBy: { clickedAt: 'desc' },
      take: 10,
    });

    // Format top referrers
    const topReferrers = referrerGroups
      .map(r => ({ referrer: r.referrer, clicks: r._count.id }))
      .sort((a, b) => b.clicks - a.clicks);

    // Format browser distribution
    const browserDistribution = browserGroups
      .map(b => ({ browser: b.browser, clicks: b._count.id }))
      .sort((a, b) => b.clicks - a.clicks);

    // Format operating systems
    const operatingSystems = osGroups
      .map(o => ({ os: o.os, clicks: o._count.id }))
      .sort((a, b) => b.clicks - a.clicks);

    // Format device breakdown
    const deviceBreakdown = deviceGroups
      .map(d => ({ deviceType: d.deviceType, clicks: d._count.id }))
      .sort((a, b) => b.clicks - a.clicks);

    // Format country distribution
    const countryDistribution = countryGroups
      .map(c => ({ countryCode: c.countryCode, clicks: c._count.id }))
      .sort((a, b) => b.clicks - a.clicks);

    // Map Raw date formatting just in case database representation differs
    const clicksOverTime = clicksOverTimeRaw.map(item => ({
      date: item.date,
      clicks: Number(item.clicks),
    }));

    return {
      totalClicks,
      clicksOverTime,
      topReferrers,
      browserDistribution,
      operatingSystems,
      deviceBreakdown,
      countryDistribution,
      firstClick: boundaryClicks._min.clickedAt?.toISOString() || null,
      lastClick: boundaryClicks._max.clickedAt?.toISOString() || null,
      recentClicks,
    };
  }

  /**
   * Retrieves core metadata for a shortened URL
   */
  async getUrlMetadata(shortCode: string): Promise<UrlMetadata> {
    const urlRecord = await prisma.url.findFirst({
      where: { shortCode },
    });

    if (!urlRecord) {
      throw new NotFoundError('URL not found');
    }

    const totalClicks = await prisma.click.count({
      where: { urlId: urlRecord.id },
    });

    return {
      originalUrl: urlRecord.longUrl,
      shortCode: urlRecord.shortCode,
      createdDate: urlRecord.createdAt.toISOString(),
      totalClicks,
      expiration: null,
      status: urlRecord.isActive ? 'active' : 'inactive',
    };
  }
}
