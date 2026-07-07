
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.js';
import { Sidebar } from '../components/Sidebar.js';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
