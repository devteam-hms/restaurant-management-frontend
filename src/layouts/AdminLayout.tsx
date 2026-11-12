import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full">
            <AdminSidebar />
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 text-foreground z-20"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-20">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl text-primary font-serif">⚜</span>
            <span className="font-serif text-lg tracking-widest uppercase">Admin Portal</span>
          </div>
          <ThemeToggle size="sm" />
        </header>

        <main className="flex-1 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

