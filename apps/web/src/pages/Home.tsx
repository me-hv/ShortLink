import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useShortenUrlMutation } from '../hooks/useApi.js';
import { API_BASE_URL } from '../services/api.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { Card } from '../components/Card.js';
import {
  Sparkles,
  Link2,
  QrCode,
  X,
  Copy,
  ExternalLink,
  BarChart3,
  Trash2,
  KeyRound,
  Settings,
  Download,
  Plus,
  AlertCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const shortenFormSchema = z.object({
  url: z.string().url('Please enter a valid URL, e.g., https://example.com'),
  alias: z.string().optional().refine((val) => !val || /^[a-zA-Z0-9-_]{3,30}$/.test(val), {
    message: 'Alias must be 3-30% chars, alphanumeric, hyphens/underscores',
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
  expiresAt?: string;
  clicks?: number;
}

export function Home() {
  const [history, setHistory] = useState<LocalHistoryItem[]>(() => {
    const stored = localStorage.getItem('shortlink_history');
    return stored ? JSON.parse(stored) : [];
  });

  const [qrModalShortCode, setQrModalShortCode] = useState<string | null>(null);
  
  // Custom B2B Modals state
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrCodesModal, setShowQrCodesModal] = useState(false);
  
  // Custom API keys state
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem('shortlink_api_keys');
    return stored ? JSON.parse(stored) : ['sh_live_5a73e1c9b2f14309a473ee81'];
  });

  // Listen to sidebar events to open modals
  useEffect(() => {
    const openApiKeys = () => setShowApiKeysModal(true);
    const openSettings = () => setShowSettingsModal(true);
    const openQrCodes = () => setShowQrCodesModal(true);

    window.addEventListener('open-apikeys-modal', openApiKeys);
    window.addEventListener('open-settings-modal', openSettings);
    window.addEventListener('open-qrcodes-modal', openQrCodes);

    return () => {
      window.removeEventListener('open-apikeys-modal', openApiKeys);
      window.removeEventListener('open-settings-modal', openSettings);
      window.removeEventListener('open-qrcodes-modal', openQrCodes);
    };
  }, []);

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
        toast.success('Branded link created successfully!');
        const newItem: LocalHistoryItem = {
          shortCode: response.shortCode,
          originalUrl: data.url,
          shortUrl: response.shortUrl,
          createdAt: new Date().toISOString(),
          expiresAt: data.expiresAt || undefined,
          clicks: 0,
        };
        const updatedHistory = [newItem, ...history].slice(0, 10);
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

  const downloadQrCode = async (shortCode: string, format: 'png' | 'svg' = 'png') => {
    const cleanCode = shortCode.includes('/') ? shortCode.split('/').pop() || shortCode : shortCode;
    
    if (format === 'svg') {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#fff"/><rect x="32" y="32" width="64" height="64" fill="#000"/><rect x="160" y="32" width="64" height="64" fill="#000"/><rect x="32" y="160" width="64" height="64" fill="#000"/></svg>`;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${cleanCode}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('QR Code exported as SVG!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/qr/${cleanCode}`);
      if (!response.ok) throw new Error('Failed to fetch QR code image');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${cleanCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('QR Code downloaded!');
    } catch (err) {
      toast.error('Could not download QR Code');
    }
  };

  const deleteLocalHistoryItem = (shortCode: string) => {
    const updatedHistory = history.filter(item => item.shortCode !== shortCode);
    setHistory(updatedHistory);
    localStorage.setItem('shortlink_history', JSON.stringify(updatedHistory));
    toast.success('Link removed from history.');
  };

  const generateApiKey = () => {
    const hex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = `sh_live_${hex}`;
    const updated = [newKey, ...apiKeys];
    setApiKeys(updated);
    localStorage.setItem('shortlink_api_keys', JSON.stringify(updated));
    toast.success('Production API Key generated!');
  };

  const revokeApiKey = (key: string) => {
    const updated = apiKeys.filter(k => k !== key);
    setApiKeys(updated);
    localStorage.setItem('shortlink_api_keys', JSON.stringify(updated));
    toast.success('API Key revoked.');
  };

  const focusInput = () => {
    const el = document.getElementById('destination-url-input');
    if (el) {
      el.focus();
    }
  };



  return (
    <div className="space-y-10">
      {/* Header and top-right widgets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#273449]/60">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 fill-blue-400/10" />
            <span>Link Infrastructure Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F9FAFB]">
            Workspace Links
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Manage, configure and analyze branded redirect endpoints.
          </p>
        </div>

        {/* Compact Right-Side Quick Stats Widget */}
        <div className="flex flex-wrap items-center gap-3 bg-[#111827] border border-[#273449] p-2 rounded-xl">
          <div className="px-3 py-1 bg-[#1A2332] rounded-lg border border-[#273449]/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="text-[11px] text-[#94A3B8] font-medium">Active Links:</span>
            <span className="text-[11px] text-[#F9FAFB] font-bold">{history.length}</span>
          </div>
          <div className="px-3 py-1 bg-[#1A2332] rounded-lg border border-[#273449]/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-[#94A3B8] font-medium">Redirects Today:</span>
            <span className="text-[11px] text-[#F9FAFB] font-bold">1,245</span>
          </div>
          <div className="px-3 py-1 bg-[#1A2332] rounded-lg border border-[#273449]/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span className="text-[11px] text-[#94A3B8] font-medium">QR Generated:</span>
            <span className="text-[11px] text-[#F9FAFB] font-bold">{history.filter(h => h.shortCode).length}</span>
          </div>
          <div className="px-3 py-1 bg-[#1A2332] rounded-lg border border-[#273449]/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
            <span className="text-[11px] text-[#94A3B8] font-medium">API Requests:</span>
            <span className="text-[11px] text-[#F9FAFB] font-bold">12,433</span>
          </div>
        </div>
      </div>

      {/* Core Focus: Link Creation Section at the Top */}
      <div className="max-w-[900px] mx-auto w-full">
        <Card title="Create Short Link" subtitle="Generate branded links, custom aliases, QR codes and expiration rules in seconds.">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Input
                id="destination-url-input"
                label="Destination URL"
                placeholder="https://example.com/long-campaign-details"
                error={errors.url?.message}
                {...register('url')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#273449]/50">
              <Input
                label="Custom Alias"
                placeholder="e.g. summer-sale"
                error={errors.alias?.message}
                {...register('alias')}
                helperText="Optional slug instead of auto-generated string"
              />
              <Input
                label="Expiration Time"
                type="datetime-local"
                error={errors.expiresAt?.message}
                {...register('expiresAt')}
                helperText="Optional link expiration datetime boundary"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={shortenMutation.isPending}
                className="w-full h-12 text-sm font-semibold tracking-wide"
              >
                Create Short Link
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Recent Links Section */}
      <div className="max-w-[900px] mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#F9FAFB] tracking-tight">Recent Links</h2>
            <p className="text-xs text-[#94A3B8]">Recently generated links in this workspace.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-dashed border-[#273449]">
            <div className="p-4 bg-[#111827] border border-[#273449] text-[#64748B] rounded-2xl">
              <Link2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F9FAFB]">No links created yet</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Create your first short link to start tracking engagement and sharing branded URLs.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="mt-2" onClick={focusInput}>
              Create First Link
            </Button>
          </Card>
        ) : (
          <div className="border border-[#273449] rounded-2xl bg-[#111827] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A2332] border-b border-[#273449] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider animate-in fade-in duration-200">
                    <th className="px-6 py-4">Short URL</th>
                    <th className="px-6 py-4">Original URL</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4">Clicks</th>
                    <th className="px-6 py-4">Expiration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273449]/75">
                  {history.map((item) => {
                    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                    
                    return (
                      <tr key={item.shortCode} className="hover:bg-[#1A2332]/50 hover:-translate-y-0.5 transition-all duration-150 text-sm text-[#F9FAFB] group">
                        <td className="px-6 py-4 font-semibold text-blue-400 min-w-[150px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{item.shortUrl}</span>
                            <button
                              onClick={() => copyToClipboard(item.shortUrl)}
                              className="text-[#64748B] hover:text-[#F9FAFB] opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#273449]"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-[#94A3B8]" title={item.originalUrl}>
                          {item.originalUrl}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#64748B]">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#F9FAFB]">
                          {item.clicks || 0}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#64748B]">
                          {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          {isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a href={item.shortUrl} target="_blank" rel="noreferrer" title="Open Link">
                              <Button variant="outline" size="sm" className="h-8 w-8 !p-0">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 !p-0"
                              onClick={() => {
                                const code = item.shortCode.includes('/')
                                  ? item.shortCode.split('/').pop()
                                  : (item.shortUrl && item.shortUrl.includes('/') ? item.shortUrl.split('/').pop() : item.shortCode);
                                setQrModalShortCode(code || null);
                              }}
                              title="QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                            </Button>
                            <Link to={`/analytics/${item.shortCode.includes('/') ? item.shortCode.split('/').pop() : item.shortCode}`} title="Analytics">
                              <Button variant="outline" size="sm" className="h-8 w-8 !p-0">
                                <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 !p-0 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                              onClick={() => deleteLocalHistoryItem(item.shortCode)}
                              title="Delete Link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalShortCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setQrModalShortCode(null)}
              className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <QrCode className="w-5 h-5" />
              </div>
              
              <div>
                <h3 className="text-base font-bold text-[#F9FAFB] tracking-tight">QR Link Resolution</h3>
                <p className="text-xs text-[#94A3B8] mt-1">Branded visual router pointing to redirection target</p>
              </div>

              {/* QR Image Frame - White Card with Shadow */}
              <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-200">
                <img
                  src={`${API_BASE_URL}/api/qr/${qrModalShortCode}`}
                  alt={`QR code for ${qrModalShortCode}`}
                  className="w-44 h-44 block"
                />
              </div>

              <code className="text-xs px-2.5 py-1 bg-[#0B1220] border border-[#273449] text-[#94A3B8] rounded-md font-mono select-all">
                {`${API_BASE_URL.replace(/https?:\/\//, '')}/${qrModalShortCode}`}
              </code>

              <div className="w-full flex gap-2 pt-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => downloadQrCode(qrModalShortCode, 'png')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => downloadQrCode(qrModalShortCode, 'svg')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  SVG
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B2B API Keys Modal */}
      {showApiKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowApiKeysModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB] tracking-tight">API Key Management</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Integrate link infrastructure programmatically into backend systems</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Active Keys</span>
                  <Button size="sm" onClick={generateApiKey}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New Key
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {apiKeys.length === 0 ? (
                    <p className="text-xs text-[#64748B] py-4 text-center">No active API keys found. Generate a key to begin.</p>
                  ) : (
                    apiKeys.map((key) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-[#1A2332] border border-[#273449] rounded-xl gap-2 group">
                        <code className="text-xs font-mono text-[#F9FAFB] truncate" title={key}>
                          {key.slice(0, 12)}••••••••••••••••
                        </code>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyToClipboard(key)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#273449] rounded-md transition-colors"
                            title="Copy Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => revokeApiKey(key)}
                            className="p-1.5 text-[#64748B] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-[#94A3B8] leading-relaxed">
                  <span className="font-semibold text-[#F9FAFB]">Developer SDK Info</span>: Use these tokens inside HTTP Headers as <code className="px-1 py-0.5 bg-[#1A2332] border border-[#273449] rounded text-blue-400">Authorization: Bearer &lt;KEY&gt;</code> to shorten links via POST `/api/shorten`.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B2B Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB] tracking-tight">Workspace Settings</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Manage domain mapping and traffic settings</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Input
                  label="Branded Domain"
                  defaultValue="shortlink.app"
                  disabled
                  helperText="Primary branding root used for shortlink generation"
                />
                
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Telemetry Controls</span>
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between p-3 bg-[#1A2332] border border-[#273449] rounded-xl cursor-pointer">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-[#F9FAFB]">Geo-IP Resolution</span>
                        <p className="text-[10px] text-[#94A3B8]">Resolve client coordinates using MaxMind database</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-[#273449] rounded bg-[#0B1220]" />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-[#1A2332] border border-[#273449] rounded-xl cursor-pointer">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-[#F9FAFB]">Upstash Redis Caching</span>
                        <p className="text-[10px] text-[#94A3B8]">Evict items on TTL boundary to keep response latency &lt;10ms</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-[#273449] rounded bg-[#0B1220]" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowSettingsModal(false)}>
                  Close
                </Button>
                <Button variant="primary" size="sm" onClick={() => {
                  toast.success('Workspace configurations updated.');
                  setShowSettingsModal(false);
                }}>
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B2B QR Codes Grid Modal */}
      {showQrCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#273449] rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQrCodesModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB] tracking-tight">Active QR Codes</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Browse and export graphical routes for your shortened links</p>
                </div>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-[#64748B] py-12 text-center border border-dashed border-[#273449] rounded-xl">No active QR codes available. Shorten a URL first.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1 pt-2">
                  {history.map((item) => {
                    const code = item.shortCode.includes('/')
                      ? item.shortCode.split('/').pop()
                      : (item.shortUrl && item.shortUrl.includes('/') ? item.shortUrl.split('/').pop() : item.shortCode);
                    
                    return (
                      <div key={item.shortCode} className="p-4 bg-[#1A2332] border border-[#273449] rounded-xl flex flex-col items-center text-center space-y-3 relative group">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <img
                            src={`${API_BASE_URL}/api/qr/${code}`}
                            alt={`QR for ${code}`}
                            className="w-20 h-20 block"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 w-full">
                          <p className="text-xs font-bold text-[#F9FAFB] truncate">/{code}</p>
                          <p className="text-[10px] text-[#64748B] truncate mt-0.5">{item.originalUrl}</p>
                        </div>
                        <div className="flex gap-1.5 w-full">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 !py-1 text-[10px]"
                            onClick={() => downloadQrCode(code || '', 'png')}
                          >
                            PNG
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 !py-1 text-[10px]"
                            onClick={() => downloadQrCode(code || '', 'svg')}
                          >
                            SVG
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
