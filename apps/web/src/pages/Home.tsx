import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useShortenUrlMutation } from '../hooks/useApi.js';
import { API_BASE_URL } from '../services/api.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { Card } from '../components/Card.js';
import { Copy, ExternalLink, BarChart3, Clock, Sparkles, QrCode, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const shortenFormSchema = z.object({
  url: z.string().url('Please enter a valid URL, e.g., https://example.com'),
  alias: z.string().optional().refine((val) => !val || /^[a-zA-Z0-9-_]{3,30}$/.test(val), {
    message: 'Alias must be 3-30 characters, alphanumeric, hyphens or underscores only',
  }),
  expiresAt: z.string().optional().refine((val) => {
    if (!val) return true;
    return new Date(val) > new Date();
  }, {
    message: 'Expiration date must be in the future',
  }),
});

type ShortenFormData = z.infer<typeof shortenFormSchema>;

interface LocalHistoryItem {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
}

export function Home() {
  const [history, setHistory] = useState<LocalHistoryItem[]>(() => {
    const stored = localStorage.getItem('shortlink_history');
    return stored ? JSON.parse(stored) : [];
  });

  const [qrModalShortCode, setQrModalShortCode] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ShortenFormData>({
    resolver: zodResolver(shortenFormSchema),
  });

  const shortenMutation = useShortenUrlMutation();

  const onSubmit = (data: ShortenFormData) => {
    const payload = {
      url: data.url,
      alias: data.alias || undefined,
      expiresAt: data.expiresAt || undefined,
    };

    shortenMutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success('URL shortened successfully!');
        const newItem: LocalHistoryItem = {
          shortCode: response.shortCode,
          originalUrl: data.url,
          shortUrl: response.shortUrl,
          createdAt: new Date().toISOString(),
        };
        const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
        setHistory(updatedHistory);
        localStorage.setItem('shortlink_history', JSON.stringify(updatedHistory));
        reset();
      },
      onError: (error: any) => {
        const errorMsg = error.response?.data?.message || 'Failed to shorten URL';
        toast.error(errorMsg);
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadQrCode = async (shortCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qr/${shortCode}`);
      if (!response.ok) throw new Error('Failed to fetch QR code image');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${shortCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('QR Code downloaded!');
    } catch (err) {
      toast.error('Could not download QR Code');
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-semibold rounded-full border border-violet-100 dark:border-violet-900/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ShortLink Analytics Engine v1.0</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Shorten links, <span className="text-violet-600 dark:text-violet-400">track reach.</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          ShortLink is a production-grade URL shortener providing real-time telemetry, geo-resolution, and sliding window rate protection.
        </p>
      </div>

      {/* Shortener Card */}
      <Card className="max-w-2xl mx-auto p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <Input
                placeholder="Paste your long URL here..."
                error={errors.url?.message}
                {...register('url')}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              loading={shortenMutation.isPending}
              className="w-full md:w-auto h-[46px] shrink-0"
            >
              Shorten URL
            </Button>
          </div>

          {/* Optional Form Section (Custom Alias and Expiration) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Custom Alias
              </label>
              <Input
                placeholder="e.g. my-campaign"
                error={errors.alias?.message}
                {...register('alias')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Expiration Date
              </label>
              <Input
                type="datetime-local"
                error={errors.expiresAt?.message}
                {...register('expiresAt')}
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Recently Generated Links */}
      {history.length > 0 && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-lg">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2>Recent Links</h2>
          </div>
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.shortCode}
                className="bg-white dark:bg-[#121824] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {item.shortUrl}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md">
                    {item.originalUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(item.shortUrl)}
                    title="Copy short URL"
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy
                  </Button>
                  <a href={item.shortUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" title="Open short URL">
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Open
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQrModalShortCode(item.shortCode)}
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4 mr-1.5 text-indigo-500" />
                    QR
                  </Button>
                  <Link to={`/analytics/${item.shortCode}`}>
                    <Button variant="secondary" size="sm" title="View Detailed Analytics">
                      <BarChart3 className="w-4 h-4 mr-1.5 text-violet-500" />
                      Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Preview Modal */}
      {qrModalShortCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setQrModalShortCode(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-2xl">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">QR Code Link Resolution</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Scan to redirect to target URL</p>
              </div>

              {/* QR Image */}
              <div className="p-4 bg-white rounded-2xl border border-slate-150 shadow-inner">
                <img
                  src={`${API_BASE_URL}/api/qr/${qrModalShortCode}`}
                  alt={`QR code for ${qrModalShortCode}`}
                  className="w-48 h-48 block"
                />
              </div>

              <div className="w-full flex gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => downloadQrCode(qrModalShortCode)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setQrModalShortCode(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
