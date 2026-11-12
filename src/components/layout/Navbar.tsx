import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/common/Button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { totalCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Restaurants', path: '/explore' },
    { label: 'Philosophy', path: '/#philosophy' },
    { label: 'Experiences', path: '/#experiences' },
  ];

  const handlePortalRedirect = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const hasAdmin = user.roles.some((r) =>
      ['OWNER', 'MANAGER', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(r.toUpperCase())
    );
    if (hasAdmin) {
      navigate('/admin');
    } else {
      navigate('/customer');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border/80 shadow-luxury py-3'
          : 'bg-gradient-to-b from-background/90 to-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-sm font-bold text-primary font-serif tracking-wider flex items-center justify-center w-8 h-8 rounded-full border border-primary/40 group-hover:border-primary group-hover:shadow-gold-glow transition-all">
            RMS
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-2xl tracking-[0.2em] uppercase font-medium text-foreground group-hover:text-primary transition-colors">
              RMS
            </span>
            <span className="text-[9px] tracking-[0.25em] uppercase text-muted font-light -mt-1">
              Fine Indian Dining
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary' : 'text-foreground/80'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Icons & CTAs */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle Button */}
          <ThemeToggle size="sm" />

          {/* Cart Icon */}
          <Link
            to="/customer/cart"
            className="relative p-2 text-foreground/80 hover:text-primary transition-colors"
            aria-label="View Dining Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-background font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-gold-glow">
                {totalCount}
              </span>
            )}
          </Link>

          {/* User Auth or Portal Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/80 hover:border-primary/50 bg-surface transition-all text-xs text-foreground"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-primary/40"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate font-medium">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-surface border border-border shadow-luxury py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-border/60">
                      <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                      <div className="mt-1">
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {user.roles[0] || 'CUSTOMER'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handlePortalRedirect();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-surface-secondary flex items-center gap-2 transition-colors"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      Go to Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    Register
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="primary" size="sm">
                    Reserve a Table
                  </Button>
                </Link>
              </div>
          )}
            </div>

        {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle size="sm" />
            <Link to="/customer/cart" className="relative p-2 text-foreground/80" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-background font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-primary" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-surface/95 backdrop-blur-xl border-b border-border px-6 py-6 space-y-4"
            >
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm uppercase tracking-widest text-foreground/90 hover:text-primary py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-border flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handlePortalRedirect();
                      }}
                    >
                      Open Portal Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full text-danger"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                <div className="flex flex-col gap-2.5">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full">
                      Register Account
                    </Button>
                  </Link>
                </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </header>
  );
};

