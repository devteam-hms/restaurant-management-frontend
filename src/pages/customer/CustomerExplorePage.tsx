import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Plus, Check, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { restaurantService } from '@/services/restaurant.service';
import { branchService } from '@/services/branch.service';
import { menuService } from '@/services/menu.service';
import { RestaurantItem } from '@/types/restaurant';
import { BranchItem } from '@/types/branch';
import { MenuItem } from '@/types/menu';
import { useCart } from '@/context/CartContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/lib/utils';

export const CustomerExplorePage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  const { addItem, totalCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);
      try {
        const res = await restaurantService.getRestaurants();
        if (!isMounted) return;
        const restList = res.data || [];
        setRestaurants(restList);
        if (restList.length > 0) {
          const firstRest = restList[0];
          setSelectedRestaurant(firstRest);
          const bRes = await branchService.getBranches({ restaurant_id: firstRest.restaurant_id });
          if (!isMounted) return;
          const branchList = bRes.data || [];
          setBranches(branchList);
          if (branchList.length > 0) {
            const firstBranch = branchList[0].branch_id;
            setSelectedBranchId(firstBranch);
            try {
              const mRes = await menuService.getMenusByBranch(firstBranch, { limit: 100 });
              if (!isMounted) return;
              const branchItems = (mRes.data || []).filter(
                (m) => String(m.branch_id) === String(firstBranch) && (m.status === undefined || m.status === 1)
              );
              setMenus(branchItems);
            } catch (menuErr) {
              console.error('Error fetching initial branch menus', menuErr);
              if (isMounted) setMenus([]);
            }
          } else {
            setSelectedBranchId('');
            setMenus([]);
          }
        }
      } catch (e) {
        console.error('Error fetching explore data', e);
        if (isMounted) {
          setRestaurants([]);
          setBranches([]);
          setMenus([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectRestaurant = async (rest: RestaurantItem) => {
    if (selectedRestaurant?.restaurant_id === rest.restaurant_id) return;
    setSelectedRestaurant(rest);
    setIsLoadingMenus(true);
    setBranches([]);
    setSelectedBranchId('');
    setMenus([]);
    try {
      const bRes = await branchService.getBranches({ restaurant_id: rest.restaurant_id });
      const branchList = bRes.data || [];
      setBranches(branchList);
      if (branchList.length > 0) {
        const bId = branchList[0].branch_id;
        setSelectedBranchId(bId);
        try {
          const mRes = await menuService.getMenusByBranch(bId, { limit: 100 });
          const branchItems = (mRes.data || []).filter(
            (m) => String(m.branch_id) === String(bId) && (m.status === undefined || m.status === 1)
          );
          setMenus(branchItems);
        } catch (menuErr) {
          console.error('Error fetching menus for branch', menuErr);
          setMenus([]);
        }
      } else {
        setSelectedBranchId('');
        setMenus([]);
      }
    } catch (e) {
      console.error('Error fetching branch menu', e);
      setBranches([]);
      setSelectedBranchId('');
      setMenus([]);
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const handleSelectBranch = async (branchId: string) => {
    if (branchId === selectedBranchId && menus.length > 0) return;
    setSelectedBranchId(branchId);
    setIsLoadingMenus(true);
    setMenus([]);
    try {
      const mRes = await menuService.getMenusByBranch(branchId, { limit: 100 });
      const branchItems = (mRes.data || []).filter(
        (m) => String(m.branch_id) === String(branchId) && (m.status === undefined || m.status === 1)
      );
      setMenus(branchItems);
    } catch (e) {
      console.error('Error fetching menu items for branch', e);
      setMenus([]);
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const filteredMenus = menus.filter(
    (m) =>
      m.menu_name.toLowerCase().includes(search.toLowerCase()) ||
      m.short_description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
            Indian Fine Dining Discovery
          </span>
          <h1 className="font-serif text-4xl text-foreground font-normal">
            Browse Restaurants & Curated Menus
          </h1>
        </div>

        {totalCount > 0 && (
          <Button
            variant="primary"
            onClick={() => navigate('/customer/cart')}
            className="gap-2 self-start"
          >
            <span>Review Selection ({totalCount})</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Restaurant Selector Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {restaurants.map((r) => (
          <button
            key={r.restaurant_id}
            onClick={() => handleSelectRestaurant(r)}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedRestaurant?.restaurant_id === r.restaurant_id
                ? 'bg-primary text-background font-semibold shadow-gold-glow'
                : 'bg-surface text-muted hover:text-foreground border border-border'
            }`}
          >
            <span>{r.restaurant_name}</span>
            {r.rating && <span className="opacity-80">★ {r.rating.toFixed(1)}</span>}
          </button>
        ))}
      </div>

      {/* Branch Selector Bar */}
      {branches.length > 0 && (
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted font-medium">Branch Location:</span>
          {branches.map((b) => (
            <button
              key={b.branch_id}
              onClick={() => handleSelectBranch(b.branch_id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                selectedBranchId === b.branch_id
                  ? 'bg-primary/15 text-primary border border-primary/40 font-semibold'
                  : 'text-muted hover:text-foreground bg-surface-secondary border border-border/60'
              }`}
            >
              <span>{b.branch_name}</span>
              {selectedBranchId === b.branch_id && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Filter courses by name or ingredient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-muted" />}
        />
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading || isLoadingMenus ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-surface animate-pulse" />
          ))
        ) : menus.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-surface/40 p-8">
            <UtensilsCrossed className="w-10 h-10 text-muted/50 mx-auto" />
            <h3 className="font-serif text-lg text-foreground">No Menu Items For This Branch</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              This branch has not added or published any menu dishes yet. Please select a different branch or restaurant.
            </p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-surface/40 p-8">
            <Search className="w-10 h-10 text-muted/50 mx-auto" />
            <h3 className="font-serif text-lg text-foreground">No dishes match "{search}"</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Try searching with another keyword or ingredient name.
            </p>
          </div>
        ) : (
          filteredMenus.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden bg-surface-secondary">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'}
                  alt={item.menu_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                <div className="absolute top-3 right-3 font-mono text-sm font-semibold text-primary px-2.5 py-1 rounded bg-background/80 backdrop-blur-sm border border-primary/20">
                  {formatCurrency(item.price)}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-normal text-foreground">{item.menu_name}</h4>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {item.short_description || item.long_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    {item.category || 'Chef Specialty'}
                  </span>
                  <Button
                    variant="gold-outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => addItem(item, selectedBranchId)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

