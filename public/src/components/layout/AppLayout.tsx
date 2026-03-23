import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { SearchIcon } from '@/components/icons/Icons';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={`transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}
      >
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2 w-72">
            <SearchIcon size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks, workers..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-semibold">AD</span>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
