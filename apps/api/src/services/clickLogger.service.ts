import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import { prisma } from '../lib/prisma.js';

export interface LogClickDto {
  urlId: number;
  ip: string;
  userAgent: string;
  referrer: string | null;
}

export class ClickLoggerService {
  /**
   * Hashes an IP address using SHA-256
   */
  private hashIp(ip: string): string {
    if (!ip) return crypto.createHash('sha256').update('Unknown').digest('hex');
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  /**
   * Parses the user agent and returns Browser, OS, and Device Type
   */
  private parseUserAgent(userAgent: string): { browser: string; os: string; deviceType: string } {
    if (!userAgent) {
      return { browser: 'Unknown', os: 'Unknown', deviceType: 'Unknown' };
    }

    // Direct check for crawler/bots
    if (/bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent)) {
      return { browser: 'Bot', os: 'Unknown', deviceType: 'Bot' };
    }

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const type = parser.getDevice().type;

    let deviceType = 'Unknown';
    if (type === 'tablet') {
      deviceType = 'Tablet';
    } else if (type === 'mobile') {
      deviceType = 'Mobile';
    } else if (!type) {
      deviceType = 'Desktop';
    }

    return { browser, os, deviceType };
  }

  /**
   * Resolves the country code using geoip-lite
   */
  private resolveCountry(ip: string): string {
    if (!ip) return 'Unknown';
    try {
      const geo = geoip.lookup(ip);
      return geo ? geo.country : 'Unknown';
    } catch (error) {
      console.error('⚠️ GeoIP lookup error:', error);
      return 'Unknown';
    }
  }

  /**
   * Persists a visitor click to the database asynchronously
   */
  async logClick(dto: LogClickDto): Promise<void> {
    const ipHash = this.hashIp(dto.ip);
    const { browser, os, deviceType } = this.parseUserAgent(dto.userAgent);
    const countryCode = this.resolveCountry(dto.ip);

    await prisma.click.create({
      data: {
        urlId: dto.urlId,
        ipHash,
        browser,
        os,
        deviceType,
        countryCode,
        referrer: dto.referrer,
      },
    });
  }
}
