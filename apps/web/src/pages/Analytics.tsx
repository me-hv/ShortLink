import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalyticsQuery, useUrlMetadataQuery } from '../hooks/useApi.js';
import { StatisticCard } from '../components/StatisticCard.js';
import { ChartCard } from '../components/ChartCard.js';
import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import {
  ArrowLeft,
  Calendar,
  MousePointerClick,
  Link2,
  ExternalLink,
  Globe,
  Activity,
  AlertCircle,
  Clock
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

const PIE_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#64748B'];

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
        <p className="text-xs text-[#94A3B8] animate-pulse">
          Resolving analytics telemetry logs...
        </p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = 'Failed to load link metrics. Please ensure the link short code is correct.';
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-dashed border-red-500/35 bg-[#1A2332] text-center p-8 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F9FAFB]">Analytics Loading Failed</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">{errorMsg}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Retry Fetching Logs
          </Button>
        </Card>
      </div>
    );
  }

  const metadata = metadataQuery.data;
  const analytics = analyticsQuery.data;

  if (!metadata || !analytics) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center p-8 space-y-4">
          <h3 className="text-base font-bold text-[#F9FAFB]">No records found</h3>
          <p className="text-xs text-[#94A3B8]">We couldn't retrieve any metadata for this shortcode.</p>
        </Card>
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
    <div className="space-y-10">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#273449]/60">
        <div className="space-y-2 min-w-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#94A3B8] hover:text-[#F9FAFB] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#F9FAFB] tracking-tight truncate">
              Link Analytics
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full">
              /{shortCode}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] truncate mt-1">
            <Link2 className="w-4 h-4 text-[#64748B]" />
            <a
              href={metadata.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1 hover:text-[#F9FAFB] transition-colors"
            >
              <span className="truncate">{metadata.originalUrl}</span>
              <ExternalLink className="w-3 h-3 text-[#64748B]" />
            </a>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-[#111827] border border-[#273449] p-1 rounded-lg shrink-0 self-start md:self-auto">
          {periodOptions.map((opt) => (
            <Button
              key={opt}
              variant={period === opt ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt)}
              className={`px-3 py-1.5 h-auto text-xs font-medium !rounded-md ${
                period === opt
                  ? ''
                  : 'border-transparent text-[#94A3B8] hover:bg-[#1A2332] hover:text-[#F9FAFB]'
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
          trend={{ value: 'Realtime', isPositive: true }}
          icon={<MousePointerClick className="w-5 h-5" />}
        />
        <StatisticCard
          title="Created Date"
          value={new Date(metadata.createdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatisticCard
          title="First Click"
          value={analytics.firstClick ? new Date(analytics.firstClick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None'}
          description={formatDate(analytics.firstClick)}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatisticCard
          title="Last Click"
          value={analytics.lastClick ? new Date(analytics.lastClick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None'}
          description={formatDate(analytics.lastClick)}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {analytics.totalClicks === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-dashed border-[#273449]">
          <div className="p-4 bg-[#111827] border border-[#273449] text-[#64748B] rounded-2xl">
            <Activity className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F9FAFB]">No click data recorded yet</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm">
              Share your shortened branded link to start tracking real-time telemetry, browsers, devices, and geo-IP origins.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Clicks Over Time */}
            <div className="col-span-1 lg:col-span-2">
              <ChartCard title="Clicks Over Time" subtitle="Trend of redirects over the selected period">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.clicksOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#273449" opacity={0.4} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#1A2332',
                        border: '1px solid #273449',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F9FAFB',
                      }}
                      labelClassName="font-bold text-[#F9FAFB] mb-1"
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 0, fill: '#2563eb' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Top Referrers */}
            <ChartCard title="Top Referrers" subtitle="Where your visitors originated from">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topReferrers.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#273449" opacity={0.4} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="referrer"
                    type="category"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val === null ? 'Direct / None' : val.replace(/https?:\/\/(www\.)?/, ''))}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1A2332',
                      border: '1px solid #273449',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Country Distribution */}
            <ChartCard title="Country Distribution" subtitle="Visitor locations resolved by geo-IP database">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.countryDistribution.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#273449" opacity={0.4} />
                  <XAxis dataKey="countryCode" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1A2332',
                      border: '1px solid #273449',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Browser Distribution */}
            <ChartCard title="Browsers" subtitle="Visits grouped by client browser headers">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.browserDistribution.slice(0, 5)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#273449" opacity={0.4} />
                  <XAxis dataKey="browser" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1A2332',
                      border: '1px solid #273449',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Device Breakdown */}
            <ChartCard title="Device Breakdown" subtitle="Visits resolved by hardware agent types">
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
                      background: '#1A2332',
                      border: '1px solid #273449',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Recent Clicks Table */}
          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#F9FAFB] tracking-tight">Recent Telemetry Streams</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Anonymized click logs captured by the redirection server</p>
            </div>
            
            <div className="overflow-x-auto border border-[#273449]/70 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#1A2332] border-b border-[#273449] text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">IP Hash</th>
                    <th className="py-3 px-4 font-semibold">Browser</th>
                    <th className="py-3 px-4 font-semibold">OS</th>
                    <th className="py-3 px-4 font-semibold">Country</th>
                    <th className="py-3 px-4 font-semibold">Device</th>
                    <th className="py-3 px-4 font-semibold">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273449]/50">
                  {analytics.recentClicks.map((click) => (
                    <tr key={click.id} className="hover:bg-[#1A2332]/40 transition-colors text-[#F9FAFB]">
                      <td className="py-3 px-4 font-medium text-xs truncate max-w-[130px]" title={new Date(click.clickedAt).toString()}>
                        {formatDate(click.clickedAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#64748B]" title={click.ipHash}>
                        {click.ipHash.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-xs text-[#94A3B8]">{click.browser}</td>
                      <td className="py-3 px-4 text-xs text-[#94A3B8]">{click.os}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#0B1220] text-[#94A3B8] rounded border border-[#273449]/60 font-semibold text-[10px]">
                          <Globe className="w-3 h-3 text-[#64748B]" />
                          {click.countryCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          click.deviceType === 'Mobile'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : click.deviceType === 'Tablet'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : click.deviceType === 'Bot'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {click.deviceType}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[180px] truncate text-xs text-[#64748B]" title={click.referrer || ''}>
                        {click.referrer === null ? 'Direct / None' : click.referrer.replace(/https?:\/\/(www\.)?/, '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
