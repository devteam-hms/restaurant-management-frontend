import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Star, Sparkles, Utensils, Flame, Award, MapPin } from 'lucide-react';
import { restaurantService } from '@/services/restaurant.service';
import { RestaurantItem } from '@/types/restaurant';
import { Button } from '@/components/common/Button';

export const LandingPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRestaurants = async () => {
      try {
        const res = await restaurantService.getRestaurants({ page: 1, limit: 3 });
        if (isMounted) setRestaurants(res.data);
      } catch (e) {
        console.error('Failed to load restaurants', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-6">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85"
            alt="RMS Luxury Dining Room"
            className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.15] scale-105 transform animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-radial-vignette opacity-80" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-surface/60 backdrop-blur-md text-primary text-xs tracking-[0.25em] uppercase font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Fine Art of Indian Gastronomy</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
            className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-foreground leading-[1.08] tracking-tight"
          >
            Exceptional Dining. <br />
            <span className="italic font-light text-primary gold-text-glow">
              Extraordinary Experiences.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="text-base sm:text-xl text-muted font-light max-w-2xl mx-auto leading-relaxed"
          >
            Discover exceptional cuisine, explore curated menus, and experience dining beyond ordinary.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/explore">
              <Button size="lg" variant="primary" className="w-full sm:w-auto px-8 gap-3">
                <span>Explore Restaurants</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="gold-outline" className="w-full sm:w-auto px-8">
                Get Started
              </Button>
            </Link>
          </motion.div>

          {/* Awards & Heritage Accolade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="pt-12 flex items-center justify-center gap-8 text-xs text-muted/70 tracking-widest uppercase"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span>Culinary Excellence</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <span>Royal Dum & Tandoor</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" />
              <span>Authentic Spices</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PHILOSOPHY SECTION */}
      <section id="philosophy" className="py-24 sm:py-32 px-6 bg-surface relative">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="text-xs font-serif italic text-primary tracking-[0.2em] uppercase">
            Our Philosophy
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-normal text-foreground tracking-tight leading-tight">
            "Where Every Meal Becomes a Memory."
          </h2>
          <div className="w-16 h-px bg-primary/60 mx-auto my-6" />
          <p className="text-base sm:text-lg text-muted font-light max-w-3xl mx-auto leading-relaxed">
            Bringing restaurants and diners together through exceptional food, thoughtful service, and unforgettable experiences. From hand-ground regional spices to royal slow-cooked dum preparations, every dish is crafted to celebrate India’s rich culinary heritage.
          </p>
        </div>
      </section>

      {/* 3. RESTAURANT DISCOVERY SECTION */}
      <section className="py-24 sm:py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">
              Curated Portfolio
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-foreground">
              Discover Our Restaurants
            </h2>
            <p className="text-sm text-muted max-w-lg">
              Explore our celebrated dining destinations across Kolkata, New Delhi, Mumbai, and Bengaluru.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="md" className="gap-2 self-start">
              <span>View All Destinations</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Restaurant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-surface-secondary animate-pulse" />
            ))
          ) : (
            restaurants.map((restaurant, idx) => (
              <motion.div
                key={restaurant.restaurant_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="group rounded-2xl bg-surface border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-luxury hover:shadow-luxury-hover flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={restaurant.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                    alt={restaurant.restaurant_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
                  
                  {restaurant.rating && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/80 backdrop-blur-md border border-border text-xs text-primary font-medium">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span>{restaurant.rating.toFixed(2)}</span>
                    </div>
                  )}

                  {restaurant.cuisine && (
                    <div className="absolute bottom-4 left-4 text-xs uppercase tracking-widest text-primary/90 font-medium px-2.5 py-1 rounded bg-background/80 backdrop-blur-sm border border-primary/20">
                      {restaurant.cuisine}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-normal text-foreground group-hover:text-primary transition-colors">
                      {restaurant.restaurant_name}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed line-clamp-3">
                      {restaurant.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted truncate max-w-[60%]">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{restaurant.address || 'Kolkata & Pan-India'}</span>
                    </div>
                    <Link to={`/explore/${restaurant.restaurant_id}`}>
                      <Button variant="gold-outline" size="sm" className="gap-1.5">
                        <span>Explore Menu</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* 4. EXPERIENCES SECTION */}
      <section id="experiences" className="py-24 sm:py-32 px-6 bg-surface-secondary/50 border-y border-border">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">
              The RMS Standard
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-foreground">
              Bespoke Hospitality Experiences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl bg-surface border border-border/80 hover:border-primary/50 shadow-luxury space-y-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-foreground">Exceptional Dining</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Impeccable table service guided by master khansamas and hospitality captains, pairing royal dum biryanis, aromatic curries, and hand-stretched tandoori breads with heartfelt warmth.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl bg-surface border border-border/80 hover:border-primary/50 shadow-luxury space-y-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-foreground">Curated Menus</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Authentic regional ingredients procured with care: whole Malabar spices, cold-pressed mustard oil, fresh river Hilsa, and aged long-grain Dehradun basmati rice.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-2xl bg-surface border border-border/80 hover:border-primary/50 shadow-luxury space-y-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-foreground">Memorable Experiences</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Private dining halls, celebratory thalis, and customized banquets orchestrated seamlessly from our integrated restaurant management portal.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION RESERVATION BANNER */}
      <section className="py-24 px-6 relative text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-bold text-primary font-serif tracking-wider inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/40 mx-auto">
            RMS
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-normal text-foreground">
            Embark Upon a Culinary Voyage
          </h2>
          <p className="text-base text-muted font-light max-w-xl mx-auto">
            Reserve your table for an evening of sensory indulgence or sign in to access your private concierge.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/explore">
              <Button size="lg" variant="primary" className="px-10">
                Browse Menus
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-10">
                Portal Access
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
