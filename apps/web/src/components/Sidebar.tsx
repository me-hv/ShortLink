import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  QrCode,
  KeyRound,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  Layers,
  Sparkles,
  Command
} from 'lucide-react';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Retrieve first link from history to redirect to for general analytics
  const getAnalyticsLink = () => {
    try {
      const stored = localStorage.getItem('shortlink_history');
      if (stored) {
        const history = JSON.parse(stored);
        if (history.length > 0) {
          const firstItem = history[0];
          const code = firstItem.shortCode.includes('/')
            ? firstItem.shortCode.split('/').pop()
            : firstItem.shortCode;
          return `/analytics/${code}`;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return '#'; // Fallback if no history
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: getAnalyticsLink(), label: 'Analytics', icon: BarChart3, isDynamic: true },
    { to: '#qrcodes', label: 'QR Codes', icon: QrCode, action: 'qrcodes' },
    { to: '#apikeys', label: 'API Keys', icon: KeyRound, action: 'apikeys' },
    { to: '#settings', label: 'Settings', icon: Settings, action: 'settings' },
  ];

  const handleNavClick = (link: typeof navLinks[0], e: React.MouseEvent) => {
    if (link.to === '#') {
      e.preventDefault();
      alert('Please shorten a URL first to view analytics data.');
      return;
    }
    
    if (link.action) {
      e.preventDefault();
      // Dispatch custom events to open B2B modals in main Dashboard
      const eventName = `open-${link.action}-modal`;
      window.dispatchEvent(new CustomEvent(eventName));
    }
  };

  return (
    <aside
      className={`border-r border-[#273449] bg-[#111827] h-[calc(100vh-68px)] sticky top-[68px] flex flex-col justify-between transition-all duration-300 z-30 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Workspace Selector */}
        <div className={`p-4 flex items-center gap-3 border-b border-[#273449]/70 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-500/10">
            <Layers className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F9FAFB] truncate">Acme Workspace</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] text-[#94A3B8] font-medium tracking-wide uppercase">Production</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            
            // If the link is dynamic (Analytics), we render it specially
            const isNoLink = link.to === '#';
            
            return (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={(e) => handleNavClick(link, e)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                    isActive && !link.action && !isNoLink
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332]'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-[#1A2332] border border-[#273449] text-xs text-[#F9FAFB] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-55 pointer-events-none shadow-xl">
                    {link.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-[#273449]/50 my-2 mx-3"></div>

        {/* Usage meters section */}
        {!isCollapsed ? (
          <div className="px-4 py-3 space-y-4 flex-1 overflow-y-auto min-h-0 scrollbar-none">
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Infrastructure Usage</span>
                <Database className="w-3.5 h-3.5 text-[#64748B]" />
              </p>
              
              <div className="space-y-3">
                {/* Storage Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-[#94A3B8]">Storage</span>
                    <span className="text-[#F9FAFB]">4.2 GB / 10 GB</span>
                  </div>
                  <div className="h-1.5 bg-[#1A2332] rounded-full overflow-hidden border border-[#273449]/35">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                {/* API Request Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-[#94A3B8]">API Requests</span>
                    <span className="text-[#F9FAFB]">84.2K / 100K</span>
                  </div>
                  <div className="h-1.5 bg-[#1A2332] rounded-full overflow-hidden border border-[#273449]/35">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '84.2%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan indicator */}
            <div className="p-3 bg-[#1A2332]/60 border border-[#273449]/60 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/25 shrink-0" />
                  <span className="text-xs font-bold text-[#F9FAFB]">Pro Plan</span>
                </div>
                <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">Renews on August 1</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded-md shrink-0 uppercase tracking-wide">
                Active
              </span>
            </div>

            {/* Keyboard shortcuts helper */}
            <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
              <Command className="w-3 h-3" />
              <span>Press <kbd className="px-1 py-0.5 bg-[#1A2332] border border-[#273449] rounded text-[#94A3B8]">K</kbd> to search</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-[#64748B]">
            <div className="hover:text-[#94A3B8] cursor-help" title="Storage: 42%"><Database className="w-5 h-5" /></div>
            <div className="hover:text-[#94A3B8] cursor-help text-blue-500" title="API Requests: 84.2%"><Activity className="w-5 h-5" /></div>
            <div className="text-amber-500" title="Pro Plan Active"><Sparkles className="w-5 h-5" /></div>
          </div>
        )}
      </div>

      {/* Collapse Toggle and Docs Link */}
      <div className="p-3 border-t border-[#273449]/70 space-y-1">
        <a
          href="https://github.com/me-hv/ShortLink"
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332] group relative ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Documentation</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-[#1A2332] border border-[#273449] text-xs text-[#F9FAFB] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-55 pointer-events-none shadow-xl">
              Documentation
            </div>
          )}
        </a>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[#64748B] hover:text-[#F9FAFB] hover:bg-[#1A2332] transition-colors border border-transparent hover:border-[#273449]/50"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
