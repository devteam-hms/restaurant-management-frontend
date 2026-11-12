import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  UtensilsCrossed,
  Store,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BackgroundVideo } from '@/components/common/BackgroundVideo';
import { toast } from '@/utils/toast';

export const RoleSelectionLoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin' | null>(null);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const state = location.state as any;
    if (state?.role && (state.role === 'customer' || state.role === 'admin')) {
      setSelectedRole(state.role);
      if (state.prefillEmail) {
        setEmailOrUsername(state.prefillEmail);
        setPassword('');
      }
    }
  }, [location.state]);

  const handleSelectRole = (role: 'customer' | 'admin') => {
    setSelectedRole(role);
    setAuthError(null);
    // Autofill convenient demonstration credentials based on selected role
    if (role === 'customer') {
      setEmailOrUsername('aarav.sharma@gmail.com');
      setPassword('customer123');
    } else {
      setEmailOrUsername('owner@rms.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!emailOrUsername || !password) {
      setAuthError('Please provide your username/email and password.');
      toast.warning('Missing Credentials', 'Please enter both your identifier and password.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      await login(
        {
          email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
          username: !emailOrUsername.includes('@') ? emailOrUsername : undefined,
          password,
        },
        selectedRole
      );

      // Security check passed; redirect to appropriate portal
      const from = (location.state as any)?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        if (selectedRole === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/customer', { replace: true });
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col justify-center py-16 px-6 relative overflow-hidden transition-colors duration-300">
      {/* Full-Screen Cinematic Background Video with Theme Overlay */}
      <BackgroundVideo
        videoSrc="/videos/restaurant-ambience.mp4"
        posterSrc="/videos/restaurant-poster.jpg"
      />

      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle size="sm" showLabel />
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10 space-y-10">
        {/* Header / Brand */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="text-sm font-bold text-primary font-serif tracking-wider flex items-center justify-center w-8 h-8 rounded-full border border-primary/40">
              RMS
            </span>
            <span className="font-serif text-3xl tracking-[0.2em] uppercase font-medium text-foreground group-hover:text-primary transition-colors">
              RMS
            </span>
          </Link>

          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-normal text-foreground">
              Welcome to a Better Dining Experience
            </h1>
            <p className="text-sm text-muted font-light mt-2 max-w-lg mx-auto">
              Choose how you would like to continue.
            </p>
          </div>
        </div>

        {/* Main Selection or Form Display */}
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            /* DUAL ROLE CARDS SELECTION */
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* CARD 1: CUSTOMER LOGIN */}
                <motion.div
                  whileHover={{ y: -6, borderColor: 'rgba(212, 168, 83, 0.6)' }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleSelectRole('customer')}
                  className="group cursor-pointer rounded-2xl bg-surface/90 backdrop-blur-md border border-border p-8 shadow-luxury hover:shadow-luxury-hover flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  <div className="h-44 -mx-8 -mt-8 relative overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                      alt="Fine Dining Customer Experience"
                      className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-surface/80 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium">
                      Guest & Member
                    </span>
                    <h3 className="font-serif text-3xl font-normal text-foreground group-hover:text-primary transition-colors">
                      I'm a Customer
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Discover restaurants, explore menus, place orders, and enjoy exceptional dining experiences.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      Continue as Customer →
                    </span>
                  </div>
                </motion.div>

                {/* CARD 2: TENANT ADMIN LOGIN */}
                <motion.div
                  whileHover={{ y: -6, borderColor: 'rgba(212, 168, 83, 0.6)' }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleSelectRole('admin')}
                  className="group cursor-pointer rounded-2xl bg-surface/90 backdrop-blur-md border border-border p-8 shadow-luxury hover:shadow-luxury-hover flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  <div className="h-44 -mx-8 -mt-8 relative overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
                      alt="Enterprise Hospitality Management"
                      className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-surface/80 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary">
                      <Store className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium">
                      Executive Portal
                    </span>
                    <h3 className="font-serif text-3xl font-normal text-foreground group-hover:text-primary transition-colors">
                      I'm a Restaurant Owner
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Manage your restaurants, branches, menus, orders, billing, and business operations from one place.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      Continue as Tenant Admin →
                    </span>
                  </div>
                </motion.div>
            </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted">
          New to RMS?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
            Register as Customer or Restaurant Owner →
          </Link>
        </p>
      </div>
    </motion.div>
  ) : (
    /* AUTHENTICATION FORM FOR THE SELECTED ROLE */
    <motion.div
      key="auth-form"
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-md mx-auto w-full bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-8 shadow-luxury space-y-6"
    >
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <button
          type="button"
          onClick={() => setSelectedRole(null)}
          className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Role</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] text-primary uppercase tracking-wider font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {selectedRole === 'customer' ? 'Customer Sign In' : 'Tenant Admin Sign In'}
          </span>
        </div>
      </div>

      {/* Security Alert Header */}
      {authError && (
        <div className="p-4 rounded-xl bg-danger/15 border border-danger/30 text-danger flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold">Authorization / Security Error</p>
            <p className="mt-0.5 opacity-90">{authError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Username"
          type="text"
          placeholder="name@rms.com"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/40 bg-surface-secondary"
            />
            <span>Remember this session</span>
          </label>

          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('Password recovery is integrated with Keycloak Identity Provider.');
            }}
            className="text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Authenticating with Keycloak...' : 'Sign In with Keycloak'}
        </Button>
      </form>

      {/* Quick Credentials Helper Pill for Review */}
      <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border/80 text-[11px] text-muted space-y-1">
        <div className="flex items-center gap-1.5 text-primary font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Keycloak RBAC Demo Accounts:</span>
        </div>
        <div className="flex flex-col gap-1 text-[11px] font-mono pt-1 text-foreground/80">
          {selectedRole === 'admin' ? (
            <>
              <div>
                Owner:{' '}
                <span className="text-primary cursor-pointer hover:underline" onClick={() => { setEmailOrUsername('owner@rms.com'); setPassword('admin123'); }}>
                  owner@rms.com
                </span>{' '}
                / admin123
              </div>
              <div>
                Manager:{' '}
                <span className="text-primary cursor-pointer hover:underline" onClick={() => { setEmailOrUsername('manager@rms.com'); setPassword('admin123'); }}>
                  manager@rms.com
                </span>{' '}
                / admin123
              </div>
            </>
          ) : (
            <div>
              Customer:{' '}
              <span className="text-primary cursor-pointer hover:underline" onClick={() => { setEmailOrUsername('aarav.sharma@gmail.com'); setPassword('customer123'); }}>
                aarav.sharma@gmail.com
              </span>{' '}
              / customer123
            </div>
          )}
        </div>
      </div>

      {/* Registration Option */}
      <div className="text-center text-xs text-muted pt-2 border-t border-border/60">
        {selectedRole === 'admin' ? (
          <>
            Need to onboard a new restaurant?{' '}
            <Link to="/register/owner" className="text-primary hover:underline font-medium">
              Register Your Restaurant →
            </Link>
          </>
        ) : (
          <>
            New to RMS dining?{' '}
            <Link to="/register/customer" className="text-primary hover:underline font-medium">
              Register as Customer →
            </Link>
          </>
        )}
      </div>
    </motion.div>
  )
}
        </AnimatePresence >
      </div >
    </div >
  );
};

