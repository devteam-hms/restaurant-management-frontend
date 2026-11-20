import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UtensilsCrossed, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BackgroundVideo } from '@/components/common/BackgroundVideo';

export const RegisterSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-foreground flex flex-col justify-center py-16 px-6 relative overflow-hidden transition-colors duration-300">
      {/* Full-Screen Cinematic Background Video with Theme-Aware Overlay */}
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
            <span className="text-sm font-bold text-primary font-serif tracking-wider flex items-center justify-center w-8 h-8 rounded-full border border-primary/40 group-hover:border-primary group-hover:shadow-gold-glow transition-all">
              RMS
            </span>
            <span className="font-serif text-3xl tracking-[0.2em] uppercase font-medium text-foreground group-hover:text-primary transition-colors">
              RMS
            </span>
          </Link>

          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-normal text-foreground">
              Create Your RMS Account
            </h1>
            <p className="text-sm text-muted font-light mt-2 max-w-lg mx-auto">
              Select your registration type to embark on a refined hospitality experience.
            </p>
          </div>
        </div>

        {/* Dual Role Cards Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* CARD 1: CUSTOMER REGISTRATION */}
          <motion.div
            whileHover={{ y: -6, borderColor: 'rgba(212, 168, 83, 0.6)' }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate('/register/customer')}
            className="group cursor-pointer rounded-2xl bg-surface/90 backdrop-blur-md border border-border p-8 shadow-luxury hover:shadow-luxury-hover flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="h-44 -mx-8 -mt-8 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                alt="Fine Dining Customer Registration"
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
                Customer Registration
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Join RMS and enjoy a seamless restaurant ordering experience.
              </p>
            </div>

            <div className="pt-4 border-t border-border/60">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Register as Customer <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>

          {/* CARD 2: RESTAURANT OWNER REGISTRATION */}
          <motion.div
            whileHover={{ y: -6, borderColor: 'rgba(212, 168, 83, 0.6)' }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate('/register/owner')}
            className="group cursor-pointer rounded-2xl bg-surface/90 backdrop-blur-md border border-border p-8 shadow-luxury hover:shadow-luxury-hover flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="h-44 -mx-8 -mt-8 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
                alt="Restaurant Business Management"
                className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-surface/80 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary">
                <Store className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium">
                Enterprise Hospitality
              </span>
              <h3 className="font-serif text-3xl font-normal text-foreground group-hover:text-primary transition-colors">
                Restaurant Owner Registration
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Manage your restaurants, branches, staff, menus, and orders with RMS.
              </p>
            </div>

            <div className="pt-4 border-t border-border/60">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Register Your Restaurant <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>
        </div>

        {/* Navigation & Help Links */}
        <div className="text-center pt-2 space-y-2">
          <p className="text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              Sign In to Your Account →
            </Link>
          </p>
          <div className="text-[11px] text-muted/70">
            <span>Powered by RMS Multi-Tenant Platform & Keycloak Enterprise RBAC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

