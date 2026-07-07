import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalyticsQuery, useUrlMetadataQuery } from '../hooks/useApi.js';
import { StatisticCard } from '../components/StatisticCard.js';
import { ChartCard } from '../components/ChartCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorState } from '../components/ErrorState.js';
import { Button } from '../components/Button.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import {
  ArrowLeft,
  Calendar,
  MousePointerClick,
  Link2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e', '#f59e0b', '#10b981'];

export function Analytics() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const metadataQuery = useUrlMetadataQuery(shortCode || '');
  const analyticsQuery = useAnalyticsQuery(shortCode || '', period);

  const isLoading = metadataQuery.isLoading || analyticsQuery.isLoading;
  const isError = metadataQuery.isError || analyticsQuery.isError;

  const handleRetry = () => {
    metadataQuery.refetch();
    analyticsQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <LoadingSpinner />
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          Loading analytics telemetry...
        </p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = 'Failed to load link metrics. Please ensure the link short code is correct.';
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState message={errorMsg} retry={handleRetry} />
      </div>
    );
  }

  const metadata = metadataQuery.data;
  const analytics = analyticsQuery.data;

  if (!metadata || !analytics) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <EmptyState
          title="No data found"
          description="We couldn't retrieve any data for this link."
        />
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const periodOptions: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1 min-w-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 truncate tracking-tight">
              Link Analytics
            </h1>
            <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-semibold rounded-full border border-violet-100 dark:border-violet-900/40 shrink-0">
              {shortCode}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
            <Link2 className="w-4 h-4 text-slate-400" />
            <a
              href={metadata.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <span>{metadata.originalUrl}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl shrink-0 self-start md:self-auto">
          {periodOptions.map((opt) => (
            <Button
              key={opt}
              variant={period === opt ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt)}
              className={`px-3 py-1.5 h-auto text-xs ${
                period === opt
                  ? ''
                  : 'border-transparent text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/60'
              }`}
            >
              {opt === '7d' ? '7 Days' : opt === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticCard
          title="Total Clicks"
          value={analytics.totalClicks}
          icon={<MousePointerClick className="w-5 h-5" />}
          description="Telemetry clicks in selected period"
        />
        <StatisticCard
          title="Created Date"
          value={new Date(metadata.createdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          icon={<Calendar className="w-5 h-5" />}
          description="Short code creation date"
        />
        <StatisticCard
          title="First Click"
          value={analytics.firstClick ? new Date(analytics.firstClick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None'}
          icon={<Calendar className="w-5 h-5" />}
          description={formatDate(analytics.firstClick)}
        />
        <StatisticCard
          title="Last Click"
          value={analytics.lastClick ? new Date(analytics.lastClick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None'}
          icon={<Calendar className="w-5 h-5" />}
          description={formatDate(analytics.lastClick)}
        />
      </div>

      {analytics.totalClicks === 0 ? (
        <EmptyState
          title="No analytics recorded yet"
          description="Share your shortened link! Once visitors open the URL, their anonymized geolocation, device type, and referrer details will populate here in real time."
        />
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Clicks Over Time */}
            <div className="col-span-1 lg:col-span-2">
              <ChartCard title="Clicks Over Time" subtitle="Trend of redirects over the selected period">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.clicksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      }}
                      labelClassName="font-bold text-slate-800"
                    />
                    <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Top Referrers */}
            <ChartCard title="Top Referrers" subtitle="Where your visitors came from">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topReferrers.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="referrer"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val === null ? 'Direct / None' : val.replace(/https?:\/\/(www\.)?/, ''))}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Country Distribution */}
            <ChartCard title="Country Distribution" subtitle="Visitor locations by country code">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.countryDistribution.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
                  <XAxis dataKey="countryCode" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Browser Distribution */}
            <ChartCard title="Browsers" subtitle="Visits grouped by client browser">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.browserDistribution.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
                  <XAxis dataKey="browser" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Device Breakdown */}
            <ChartCard title="Device Breakdown" subtitle="Client hardware profile">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.deviceBreakdown}
                    dataKey="clicks"
                    nameKey="deviceType"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {analytics.deviceBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Recent Clicks Table */}
          <div className="bg-white dark:bg-[#121824] border border-slate-200/85 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Telemetry Streams</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Anonymized click logs captured by the redirection server</p>
            </div>
            <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">IP Hash</th>
                  <th className="py-3.5 px-4 font-semibold">Browser</th>
                  <th className="py-3.5 px-4 font-semibold">OS</th>
                  <th className="py-3.5 px-4 font-semibold">Country</th>
                  <th className="py-3.5 px-4 font-semibold">Device</th>
                  <th className="py-3.5 px-4 font-semibold">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {analytics.recentClicks.map((click) => (
                  <tr key={click.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-3 px-4 font-medium truncate max-w-[140px]" title={new Date(click.clickedAt).toString()}>
                      {formatDate(click.clickedAt)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400" title={click.ipHash}>
                      {click.ipHash.substring(0, 12)}...
                    </td>
                    <td className="py-3 px-4">{click.browser}</td>
                    <td className="py-3 px-4">{click.os}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded border border-slate-100 dark:border-slate-800/50 font-semibold text-xs">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {click.countryCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        click.deviceType === 'Mobile'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                          : click.deviceType === 'Tablet'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : click.deviceType === 'Bot'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {click.deviceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-400" title={click.referrer || ''}>
                      {click.referrer === null ? 'Direct / None' : click.referrer.replace(/https?:\/\/(www\.)?/, '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
