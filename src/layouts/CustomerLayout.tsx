import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CustomerSidebar } from '@/components/layout/CustomerSidebar';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const CustomerLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { totalCount } = useCart();

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CustomerSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full">
            <CustomerSidebar />
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
            <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-6 h-6 rounded-full border border-primary/40">RMS</span>
            <span className="font-serif text-lg tracking-widest uppercase">RMS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Link to="/customer/cart" className="relative p-2 text-foreground" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
              Guest Dining Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle size="sm" showLabel />
            <Link
              to="/customer/cart"
              className="relative p-2 text-foreground/80 hover:text-primary transition-colors flex items-center gap-2 text-xs font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCount > 0 && (
                <span className="bg-primary text-primary-foreground font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
