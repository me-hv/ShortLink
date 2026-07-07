export interface UrlRecord {
  id: number;
  shortCode: string | null;
  longUrl: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ShortenResponse {
  shortCode: string;
  shortUrl: string;
}

export interface ClickCount {
  date: string;
  clicks: number;
}

export interface ReferrerCount {
  referrer: string | null;
  clicks: number;
}

export interface BrowserCount {
  browser: string;
  clicks: number;
}

export interface OsCount {
  os: string;
  clicks: number;
}

export interface DeviceCount {
  deviceType: string;
  clicks: number;
}

export interface CountryCount {
  countryCode: string;
  clicks: number;
}

export interface RecentClick {
  id: number;
  clickedAt: string;
  ipHash: string;
  browser: string;
  os: string;
  deviceType: string;
  countryCode: string;
  referrer: string | null;
}

export interface AnalyticsSummary {
  totalClicks: number;
  clicksOverTime: ClickCount[];
  topReferrers: ReferrerCount[];
  browserDistribution: BrowserCount[];
  operatingSystems: OsCount[];
  deviceBreakdown: DeviceCount[];
  countryDistribution: CountryCount[];
  firstClick: string | null;
  lastClick: string | null;
  recentClicks: RecentClick[];
}

export interface UrlMetadata {
  originalUrl: string;
  shortCode: string | null;
  createdDate: string;
  totalClicks: number;
  expiration: null;
  status: 'active' | 'inactive';
}
