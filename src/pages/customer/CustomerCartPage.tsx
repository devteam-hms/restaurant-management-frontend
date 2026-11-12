import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
import { orderService } from '@/services/order.service';
import { billService } from '@/services/bill.service';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { formatCurrency } from '@/lib/utils';

export const CustomerCartPage: React.FC = () => {
  const { items, branchId, updateQuantity, removeItem, clearCart, subtotal, estimatedTax, total } =
    useCart();
  const [tableNumber, setTableNumber] = useState('Table 4 — Heritage Hall');
  const [specialInstructions, setSpecialInstructions] = useState('');
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
      // 1. Dispatch order to backend Order API
      const newOrder = await orderService.createOrder({
        branch_id: branchId,
        items: items.map((i) => ({
          menu_id: i.menu.id,
          quantity: i.quantity,
        })),
        table_number: tableNumber,
        special_instructions: specialInstructions,
      });

      // 2. Automatically generate formal bill for this order via backend Bill API
      await billService.generateBill({
        order_id: newOrder.id,
        notes: specialInstructions,
      });

      clearCart();
      setOrderSuccessId(newOrder.id);
      success('Order Placed Successfully', `Order #${newOrder.id} dispatched to the kitchen.`);
    } catch (err: any) {
      toastError('Order Placement Failed', err.message || 'Unable to communicate with kitchen.');
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
                onClick={clearCart}
                className="text-xs text-danger hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            <div className="divide-y divide-border/40">
              {items.map((item) => (
                <div key={item.menu.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  <img
                    src={item.menu.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80'}
                    alt={item.menu.menu_name}
                    className="w-18 h-18 rounded-xl object-cover shrink-0 border border-border/80 bg-surface-secondary"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-lg font-medium text-foreground truncate">
                      {item.menu.menu_name}
                    </h4>
                    <p className="text-xs font-mono text-primary mt-0.5">
                      {formatCurrency(item.menu.price)} each
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2.5 bg-surface-secondary border border-border rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.menu.id, -1)}
                      className="p-1 text-muted hover:text-foreground transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-semibold px-1">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu.id, 1)}
                      className="p-1 text-muted hover:text-foreground transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(item.menu.price * item.quantity)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.menu.id)}
                    className="p-1.5 text-muted hover:text-danger rounded-md transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dining Table & Service Notes */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-luxury space-y-4">
            <h3 className="font-serif text-xl font-normal text-foreground">Dining Details & Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Table Number / Area"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. Table 4 or Private Dining Hall"
              />
              <Input
                label="Special Requests / Preferences"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Medium spice level, extra Kasundi, no coriander"
              />
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
