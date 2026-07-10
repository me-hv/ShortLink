import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.js';
import { Sidebar } from '../components/Sidebar.js';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F9FAFB] flex flex-col antialiased selection:bg-blue-600/30 selection:text-white">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden min-h-[calc(100vh-68px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
