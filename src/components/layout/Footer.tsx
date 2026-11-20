import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border/80 text-foreground relative z-10">
      {/* Decorative Top Accent */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary font-serif tracking-wider flex items-center justify-center w-8 h-8 rounded-full border border-primary/40">
                RMS
              </span>
              <span className="font-serif text-2xl tracking-[0.2em] uppercase font-medium">
                RMS
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed font-light">
              India’s premier fine dining hospitality and restaurant management ecosystem. Celebrating rich regional culinary heritage, royal clay tandoors, and bespoke hospitality.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="#instagram"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#facebook"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Destinations & Locations */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg tracking-wider text-primary">Dining Destinations</h4>
            <ul className="space-y-2.5 text-xs text-muted">
              <li>
                <strong className="text-foreground font-medium block">The Bengal Table — Kolkata</strong>
                18 Park Street, Central Kolkata 700016
              </li>
              <li>
                <strong className="text-foreground font-medium block">Saffron & Spice — New Delhi</strong>
                Block C, Connaught Place, New Delhi 110001
              </li>
              <li>
                <strong className="text-foreground font-medium block">Royal Thali House — Mumbai</strong>
                Pali Naka, Bandra West, Mumbai 400050
              </li>
              <li>
                <strong className="text-foreground font-medium block">Dakshin Kitchen — Bengaluru</strong>
                100ft Road, Indiranagar, Bengaluru 560038
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg tracking-wider text-primary">Experiences</h4>
            <ul className="space-y-2.5 text-xs text-muted">
              <li>
                <Link to="/explore" className="hover:text-primary transition-colors">
                  Explore Curated Menus
                </Link>
              </li>
              <li>
                <Link to="/#philosophy" className="hover:text-primary transition-colors">
                  Our Culinary Philosophy
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Customer Dining Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Tenant Admin Management Portal
                </Link>
              </li>
              <li>
                <a href="#heritage" className="hover:text-primary transition-colors">
                  Royal Handi Dum Craftsmanship
                </a>
              </li>
            </ul>
          </div>

          {/* Inquiries & Concierge */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg tracking-wider text-primary">Guest Concierge</h4>
            <p className="text-xs text-muted leading-relaxed">
              For banquet bookings, private dining hall reservations, and corporate catering:
            </p>
            <div className="space-y-2 text-xs text-muted pt-1">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>concierge@rms.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+91 98301 23456</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Park Street, Kolkata & Pan-India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted/70">
          <p>© {new Date().getFullYear()} RMS Hospitality Group. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider">
            <a href="#privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#accessibility" className="hover:text-primary transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
