import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, MapPin, Clock, Phone, Plus, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { restaurantService } from '@/services/restaurant.service';
import { branchService } from '@/services/branch.service';
import { menuService } from '@/services/menu.service';
import { RestaurantItem } from '@/types/restaurant';
import { BranchItem } from '@/types/branch';
import { MenuItem } from '@/types/menu';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/lib/utils';

export const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantItem | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  const { addItem } = useCart();

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const rest = await restaurantService.getRestaurantById(id);
        setRestaurant(rest);

        const branchRes = await branchService.getBranches({ restaurant_id: id });
        setBranches(branchRes.data);

        if (branchRes.data.length > 0) {
          const firstBranchId = branchRes.data[0].branch_id;
          setSelectedBranchId(firstBranchId);
          try {
            const menuRes = await menuService.getMenusByBranch(firstBranchId, { limit: 100 });
            const branchItems = (menuRes.data || []).filter(
              (m) => String(m.branch_id) === String(firstBranchId)
            );
            setMenus(branchItems);
          } catch (menuErr) {
            console.error('Error fetching initial branch menus', menuErr);
            setMenus([]);
          }
        }
      } catch (e) {
        console.error('Error fetching restaurant details', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  const handleBranchChange = async (bId: string) => {
    if (bId === selectedBranchId && menus.length > 0) return;
    setSelectedBranchId(bId);
    setMenus([]);
    try {
      const menuRes = await menuService.getMenusByBranch(bId, { limit: 100 });
      const branchItems = (menuRes.data || []).filter(
        (m) => String(m.branch_id) === String(bId)
      );
      setMenus(branchItems);
    } catch (e) {
      console.error('Error fetching branch menu', e);
      setMenus([]);
    }
  };

  const activeBranch = branches.find((b) => b.branch_id === selectedBranchId) || branches[0];

  const categories = ['All', ...Array.from(new Set(menus.map((m) => m.category || 'Mains')))];

  const filteredMenus =
    selectedCategory === 'All'
      ? menus
      : menus.filter((m) => (m.category || 'Mains') === selectedCategory);

  if (isLoading || !restaurant) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 space-y-12">
      {/* Hero Header */}
      <div className="relative h-[480px] w-full overflow-hidden">
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85'}
          alt={restaurant.restaurant_name}
          className="w-full h-full object-cover filter brightness-[0.4] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 flex flex-col justify-end pb-12 space-y-4">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portfolio</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-medium">
                {restaurant.cuisine}
              </span>
              <h1 className="font-serif text-4xl sm:text-6xl text-foreground font-normal">
                {restaurant.restaurant_name}
              </h1>
              <p className="text-sm text-muted/90 font-light leading-relaxed">
                {restaurant.description}
              </p>
            </div>

            {restaurant.rating && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/80 backdrop-blur-md border border-border self-start md:self-end">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-sm font-medium text-foreground">{restaurant.rating.toFixed(2)} / 5.0</span>
                <span className="text-xs text-muted">Heritage Rated</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Branch Selector Tabs */}
        {branches.length > 0 && (
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-luxury space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
                  Select Branch Location
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Menus and specialty provisions reflect seasonal sourcing per location.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {branches.map((b) => (
                <button
                  key={b.branch_id}
                  onClick={() => handleBranchChange(b.branch_id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedBranchId === b.branch_id
                      ? 'bg-primary/10 border-primary shadow-gold-glow'
                      : 'bg-surface-secondary border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-serif text-lg font-medium text-foreground">{b.branch_name}</h4>
                    {selectedBranchId === b.branch_id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted mt-1">{b.address}, {b.city}</p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" /> {b.opening_hours || '18:00 – 23:30'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" /> {b.phone}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
                Authentic Indian Specialties
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                Curated Branch Menu
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-primary text-background font-semibold'
                      : 'bg-surface text-muted hover:text-foreground border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMenus.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 shadow-luxury flex flex-col sm:flex-row gap-5"
              >
                {/* Food Image */}
                <div className="w-full sm:w-36 h-36 rounded-xl overflow-hidden shrink-0 relative bg-surface-secondary">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}
                    alt={item.menu_name}
                    className="w-full h-full object-cover"
                  />
                  {item.is_signature && (
                    <div className="absolute top-2 left-2 bg-primary text-background text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Signature
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-xl font-medium text-foreground leading-snug">
                        {item.menu_name}
                      </h4>
                      <span className="font-mono text-base font-medium text-primary shrink-0">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
                      {item.short_description || item.long_description}
                    </p>

                    {item.dietary_tags && item.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.dietary_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-secondary text-muted border border-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border/40">
                    <span className="text-[11px] text-success flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                      Available for Service
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => addItem(item, selectedBranchId)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Selection</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

