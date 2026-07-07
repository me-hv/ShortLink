
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, HelpCircle } from 'lucide-react';

export function Sidebar() {
  const links = [
    { to: '/', label: 'Shortener', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, disabled: true },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] h-[calc(100vh-73px)] sticky top-[73px] p-6 hidden md:flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Navigation</p>
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            if (link.disabled) {
              return (
                <div
                  key={link.label}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 dark:text-slate-600 text-sm font-semibold cursor-not-allowed opacity-60"
                  title="Select a short link from the home page to view analytics"
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </div>
              );
            }
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer">
          <HelpCircle className="w-5 h-5" />
          <span>Documentation</span>
        </div>
      </div>
    </aside>
  );
}
