import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { createOrder } from '@/store/slices/orderSlice';

export const CustomerCartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, branchId, updateQuantity, removeItem, clearCart, subtotal, estimatedTax, total } =
    useCart();
  const [tableNumber] = useState('Table 01');
  const [specialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !branchId) {
      toastError('Cart is Empty', 'Please select at least one dish.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Dispatch order to backend Order API via Redux Toolkit Thunk
      const newOrder = await dispatch(
        createOrder({
          branch_id: branchId,
          items: items.map((i) => ({
            menu_id: i.menu.id,
            quantity: i.quantity,
          })),
          table_number: tableNumber,
          special_instructions: specialInstructions,
        })
      ).unwrap();

      clearCart();
      setOrderSuccessId(newOrder.id);
      success('Order Placed Successfully', `Order #${newOrder.id} dispatched to the kitchen.`);
    } catch (err: any) {
      toastError('Order Placement Failed', typeof err === 'string' ? err : err?.message || 'Unable to communicate with kitchen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccessId) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 text-success mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl text-foreground font-normal">Order Confirmed</h1>
          <p className="text-xs uppercase tracking-widest text-primary font-medium font-mono">
            Order Ref: {orderSuccessId}
          </p>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed mt-2">
            Your dining order has been transmitted directly to the executive kitchen.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/customer/orders')}>
            View in My Orders
          </Button>
          <Button variant="outline" onClick={() => navigate('/customer/bills')}>
            View Bill & Tax Breakdown
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-surface border border-border text-muted mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl text-foreground">Your Dining Cart is Empty</h2>
          <p className="text-xs text-muted leading-relaxed">
            Browse our curated menus to add biryanis, slow-cooked curries, and tandoori specialties to your order.
          </p>
        </div>
        <Link to="/customer/explore">
          <Button variant="primary" className="gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Explore Restaurants</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
          Review & Confirmation
        </span>
        <h1 className="font-serif text-4xl text-foreground font-normal">Your Order Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-luxury space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <span className="text-xs uppercase tracking-wider text-muted font-medium">
                {items.length} Item{items.length > 1 ? 's' : ''} Selected
              </span>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-danger hover:underline flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            <div className="divide-y divide-border/40">
              {items.map((item) => (
                <div key={item.menu.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  {/* Fixed-dimension Image Container */}
                  <div className="w-20 h-20 min-w-[80px] max-w-[80px] rounded-xl overflow-hidden shrink-0 border border-border/80 bg-surface-secondary">
                    <img
                      src={item.menu.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80'}
                      alt={item.menu.menu_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Description */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-serif text-lg font-medium text-foreground truncate">
                      {item.menu.menu_name}
                    </h4>
                    <p className="text-xs font-mono text-primary mt-0.5">
                      {formatCurrency(item.menu.price)} each
                    </p>
                  </div>

                  {/* Controls & Price - Guaranteed shrink-0 to prevent clipping */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-surface-secondary border border-border/80 rounded-lg px-2 py-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menu.id, -1)}
                        className="p-1 rounded text-muted hover:text-foreground hover:bg-surface transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs font-semibold px-2 min-w-[22px] text-center text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menu.id, 1)}
                        className="p-1 rounded text-muted hover:text-foreground hover:bg-surface transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total for this line item */}
                    <div className="text-right min-w-[75px] shrink-0">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatCurrency(item.menu.price * item.quantity)}
                      </span>
                    </div>

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.menu.id)}
                      className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors shrink-0"
                      aria-label="Remove item"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs">
              <Link
                to="/customer/explore"
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Dishes</span>
              </Link>
              <span className="text-muted text-[11px]">
                Dispatched directly to the kitchen upon placement
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary & Calculation */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-luxury space-y-5">
            <h3 className="font-serif text-2xl font-normal text-foreground">Order Summary</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>GST (CGST 2.5% + SGST 2.5%)</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(estimatedTax)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Table Service & Hospitality</span>
                <span className="text-success font-medium">Complimentary</span>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-base font-semibold">
                <span className="font-serif text-lg font-normal text-foreground">Total Amount</span>
                <span className="font-mono text-primary text-xl">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-secondary border border-border/80 text-[11px] text-muted flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Final bill amount and itemized GST breakdown are verified authoritatively by the backend Bill engine.
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full gap-2"
              isLoading={isSubmitting}
              onClick={handlePlaceOrder}
            >
              <span>Place Order with Kitchen</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
