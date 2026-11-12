import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MapPin, Star, ArrowRight, Utensils } from 'lucide-react';
import { restaurantService } from '@/services/restaurant.service';
import { RestaurantItem } from '@/types/restaurant';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export const RestaurantsExplorePage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await restaurantService.getRestaurants({ page: 1, limit: 20 });
        setRestaurants(res.data);
      } catch (e) {
        console.error('Failed to load restaurants', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const cuisines = ['All', 'Bengali Cuisine & Biryani', 'North Indian & Mughlai', 'South Indian & Coastal', 'Royal Thali & Gujarati'];

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCuisine =
      selectedCuisine === 'All' ||
      (r.cuisine && r.cuisine.toLowerCase() === selectedCuisine.toLowerCase());

    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto space-y-12">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">
          Premier Culinary Destinations
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl text-foreground font-normal">
          Explore Our Restaurants
        </h1>
        <p className="text-sm text-muted font-light leading-relaxed">
          Step into worlds of exceptional Indian gastronomy. Select a destination to explore branch locations, reserve private dining halls, and peruse signature regional menus.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-surface border border-border shadow-luxury">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name, city, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted" />}
          />
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wide whitespace-nowrap transition-all ${
                selectedCuisine === c
                  ? 'bg-primary text-background font-semibold shadow-gold-glow'
                  : 'bg-surface-secondary text-muted hover:text-foreground border border-border'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Restaurant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-surface animate-pulse" />
          ))
        ) : filteredRestaurants.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted font-serif italic">
            No restaurants found matching your criteria.
          </div>
        ) : (
          filteredRestaurants.map((restaurant, idx) => (
            <motion.div
              key={restaurant.restaurant_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group rounded-2xl bg-surface border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-luxury hover:shadow-luxury-hover flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={restaurant.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                  alt={restaurant.restaurant_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                
                {restaurant.rating && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/80 backdrop-blur-md border border-border text-xs text-primary font-medium">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span>{restaurant.rating.toFixed(2)}</span>
                  </div>
                )}
                {restaurant.cuisine && (
                  <div className="absolute bottom-4 left-4 text-xs uppercase tracking-widest text-primary font-medium px-2.5 py-1 rounded bg-background/80 backdrop-blur-sm border border-primary/20">
                    {restaurant.cuisine}
                  </div>
                )}
              </div>

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
                  <div className="flex items-center gap-1.5 text-xs text-muted truncate max-w-[55%]">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                  <Link to={`/explore/${restaurant.restaurant_id}`}>
                    <Button variant="gold-outline" size="sm" className="gap-1.5">
                      <span>View Menus</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

