import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-45 w-full bg-white/80 dark:bg-[#0b0f19]/85 backdrop-blur border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between transition-colors">
      <Link to="/" className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xl tracking-tight">
        <Link2 className="w-6 h-6 stroke-[2.5]" />
        <span>ShortLink</span>
      </Link>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
        aria-label="Toggle Dark Mode"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
}
