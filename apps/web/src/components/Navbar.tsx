import { Link } from 'react-router-dom';
import { Link2, Terminal, Bell } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#111827] border-b border-[#273449] px-6 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 text-[#F9FAFB] font-bold text-lg tracking-tight select-none">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Link2 className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold tracking-tight">ShortLink</span>
            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold rounded-md select-none">
              BETA
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Mock search/command bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0B1220] border border-[#273449] rounded-lg text-xs text-[#94A3B8] w-64 cursor-pointer hover:border-[#2563EB]/55 transition-colors">
          <Terminal className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Search or type command...</span>
          <kbd className="ml-auto px-1.5 py-0.5 bg-[#1A2332] border border-[#273449] rounded text-[10px] text-[#64748B]">⌘K</kbd>
        </div>

        {/* Notifications and help buttons */}
        <button className="p-2 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-[#1A2332] rounded-lg border border-transparent hover:border-[#273449]/50 transition-colors relative cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
        </button>

        {/* User avatar / profile trigger */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#273449]/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-[#273449] flex items-center justify-center text-xs font-semibold text-white cursor-pointer select-none">
            HV
          </div>
        </div>
      </div>
    </header>
  );
}
