import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  Receipt,
  Filter,
  Building2,
  GitBranch,
  Plus,
  Trash2,
  UtensilsCrossed,
  ShoppingBag,
  Info,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Lock,
  Store,
} from 'lucide-react';
import { branchService } from '@/services/branch.service';
import { restaurantService } from '@/services/restaurant.service';
import { menuService } from '@/services/menu.service';
import {
  OrderItemResponseModel,
  OrderStatus,
  PaymentStatus,
  VALID_STATUS_TRANSITIONS,
  PAYMENT_STATUS_OPTIONS,
} from '@/types/order';
import { BranchItem } from '@/types/branch';
import { RestaurantItem } from '@/types/restaurant';
import { MenuItem } from '@/types/menu';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { CustomSelect } from '@/components/common/CustomSelect';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchOrders,
  createOrder,
  updateOrder,
} from '@/store/slices/orderSlice';
import { generateBill } from '@/store/slices/billSlice';

const ORDER_PROGRESSION_FLOW: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
];

export const AdminOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: orders, isLoading } = useAppSelector((state) => state.orders);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(false);

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [allBranches, setAllBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals for existing orders
  const [selectedOrder, setSelectedOrder] = useState<OrderItemResponseModel | null>(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<OrderItemResponseModel | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('PAID');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // Create Order Modal State
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [createRestaurantId, setCreateRestaurantId] = useState<string>('');
  const [createBranches, setCreateBranches] = useState<BranchItem[]>([]);
  const [createBranchId, setCreateBranchId] = useState<string>('');
  const [availableMenus, setAvailableMenus] = useState<MenuItem[]>([]);
  const [loadingCreateBranches, setLoadingCreateBranches] = useState<boolean>(false);
  const [loadingMenus, setLoadingMenus] = useState<boolean>(false);

  // Draft items in create order modal
  const [draftItems, setDraftItems] = useState<
    Array<{ menu_id: string; menu_name: string; unit_price: number; quantity: number }>
  >([]);
  const [selectedMenuIdToAdd, setSelectedMenuIdToAdd] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [orderTableNumber, setOrderTableNumber] = useState<string>('Table 4');
  const [orderInstructions, setOrderInstructions] = useState<string>('');
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);

  const { success, error: toastError } = useToast();

  // Helper to resolve real branch name & city dynamically
  const getBranchInfo = (branchId: string): BranchItem | undefined => {
    return allBranches.find((b) => b.branch_id === branchId) || branches.find((b) => b.branch_id === branchId);
  };

  // 1. Fetch Restaurants & Master Branches on initial mount
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      setLoadingRestaurants(true);
      try {
        const [rRes, bRes] = await Promise.all([
          restaurantService.getRestaurants({ page: 1, limit: 100 }),
          branchService.getBranches({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;
        setRestaurants(rRes.data || []);
        setAllBranches(bRes.data || []);
      } catch (err: any) {
        toastError('Failed to load initial data', err.message);
      } finally {
        if (isMounted) setLoadingRestaurants(false);
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Branches when filter restaurant changes
  useEffect(() => {
    let isMounted = true;
    async function fetchBranchesForRestaurant() {
      setLoadingBranches(true);
      try {
        const res = await branchService.getBranches({
          restaurant_id: selectedRestaurantId || undefined,
          limit: 100,
        });
        if (!isMounted) return;
        setBranches(res.data || []);
        // Also keep allBranches populated
        if (res.data && res.data.length > 0) {
          setAllBranches((prev) => {
            const map = new Map<string, BranchItem>();
            prev.forEach((b) => map.set(b.branch_id, b));
            res.data.forEach((b) => map.set(b.branch_id, b));
            return Array.from(map.values());
          });
        }
        setSelectedBranchId('');
      } catch (err: any) {
        toastError('Failed to load branches', err.message);
        if (isMounted) setBranches([]);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }
    fetchBranchesForRestaurant();
    return () => {
      isMounted = false;
    };
  }, [selectedRestaurantId]);

  // 3. Fetch Orders for the selected branch with Live Sync Polling
  const loadOrders = (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    }
    dispatch(
      fetchOrders({
        branch_id: selectedBranchId || undefined,
        limit: 50,
      })
    )
      .unwrap()
      .catch((e: any) => {
        if (!silent) {
          toastError('Failed to load orders', typeof e === 'string' ? e : e?.message || 'Error');
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    loadOrders();
    // Live polling every 8s so new kitchen tickets update automatically
    const interval = setInterval(() => {
      loadOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  // 4. Create Order Modal: Load branches when createRestaurantId changes
  useEffect(() => {
    if (!createOrderModalOpen || !createRestaurantId) {
      setCreateBranches([]);
      setCreateBranchId('');
      setAvailableMenus([]);
      return;
    }
    let isMounted = true;
    async function loadBranchesForCreate() {
      setLoadingCreateBranches(true);
      try {
        const res = await branchService.getBranches({ restaurant_id: createRestaurantId });
        if (!isMounted) return;
        setCreateBranches(res.data);
        if (res.data.length > 0) {
          const bId =
            selectedBranchId && res.data.some((b) => b.branch_id === selectedBranchId)
              ? selectedBranchId
              : res.data[0].branch_id;
          setCreateBranchId(bId);
        } else {
          setCreateBranchId('');
          setAvailableMenus([]);
        }
      } catch (err: any) {
        toastError('Failed to load branches', err.message);
      } finally {
        if (isMounted) setLoadingCreateBranches(false);
      }
    }
    loadBranchesForCreate();
    return () => {
      isMounted = false;
    };
  }, [createOrderModalOpen, createRestaurantId]);

  // 5. Create Order Modal: Load available menu items when createBranchId changes
  useEffect(() => {
    if (!createOrderModalOpen || !createBranchId) {
      setAvailableMenus([]);
      setSelectedMenuIdToAdd('');
      return;
    }
    let isMounted = true;
    async function loadMenusForCreate() {
      setLoadingMenus(true);
      try {
        const res = await menuService.getMenusByBranch(createBranchId, { status: 1, limit: 100 });
        if (!isMounted) return;
        const activeOnly = res.data.filter((m) => m.status === 1);
        setAvailableMenus(activeOnly);
        if (activeOnly.length > 0) {
          setSelectedMenuIdToAdd(activeOnly[0].id);
        } else {
          setSelectedMenuIdToAdd('');
        }
      } catch (err: any) {
        toastError('Failed to load menu dishes', err.message);
      } finally {
        if (isMounted) setLoadingMenus(false);
      }
    }
    loadMenusForCreate();
    return () => {
      isMounted = false;
    };
  }, [createOrderModalOpen, createBranchId]);

  // Open Create Order Modal
  const openCreateOrderModal = () => {
    const initialRestId = selectedRestaurantId || (restaurants[0]?.restaurant_id || '');
    setCreateRestaurantId(initialRestId);
    setOrderTableNumber('Table 4');
    setOrderInstructions('');
    setDraftItems([]);
    setSelectedMenuIdToAdd('');
    setAddQuantity(1);
    setCreateOrderModalOpen(true);
  };

  // Add Item to Draft Order
  const handleAddDraftItem = () => {
    if (!selectedMenuIdToAdd || addQuantity < 1) return;
    const dish = availableMenus.find((m) => m.id === selectedMenuIdToAdd);
    if (!dish) return;

    setDraftItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.menu_id === selectedMenuIdToAdd);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += addQuantity;
        return copy;
      }
      return [
        ...prev,
        {
          menu_id: dish.id,
          menu_name: dish.menu_name,
          unit_price: dish.price,
          quantity: addQuantity,
        },
      ];
    });
    setAddQuantity(1);
  };

  // Update item quantity in draft
  const handleUpdateDraftQuantity = (menuId: string, newQty: number) => {
    if (newQty < 1) return;
    setDraftItems((prev) =>
      prev.map((i) => (i.menu_id === menuId ? { ...i, quantity: newQty } : i))
    );
  };

  // Remove item from draft
  const handleRemoveDraftItem = (menuId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.menu_id !== menuId));
  };

  // Estimated draft order total
  const draftEstimatedTotal = draftItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  // Submit Order Creation
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBranchId) {
      toastError('Validation Failed', 'Please select a branch.');
      return;
    }
    if (draftItems.length === 0) {
      toastError('Validation Failed', 'Please add at least one dish to the order.');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const newOrder = await dispatch(
        createOrder({
          branch_id: createBranchId,
          items: draftItems.map((item) => ({
            menu_id: item.menu_id,
            quantity: item.quantity,
          })),
          table_number: orderTableNumber.trim() || undefined,
          special_instructions: orderInstructions.trim() || undefined,
        })
      ).unwrap();

      success('Order Placed Successfully', `Order #${newOrder.id} dispatched to the kitchen.`);
      setCreateOrderModalOpen(false);
      setDraftItems([]);
      loadOrders();
    } catch (err: any) {
      toastError('Order Creation Failed', typeof err === 'string' ? err : err?.message || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Open Status Update Modal with sanitized defaults
  const handleOpenStatusModal = (order: OrderItemResponseModel) => {
    setStatusUpdateOrder(order);
    setNewStatus(order.order_status);
    setNewPaymentStatus(order.payment_status);
    setCancelReason(order.cancellation_reason || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateOrder) return;

    const currentStatus = statusUpdateOrder.order_status;
    const isTerminal = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';

    // 1. Validate controlled transitions strictly
    if (newStatus !== currentStatus) {
      if (isTerminal) {
        toastError(
          'Transition Rejected',
          `Order #${statusUpdateOrder.id} is in terminal status (${currentStatus}) and cannot be transitioned.`
        );
        return;
      }

      const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        toastError(
          'Invalid Status Transition',
          `Transition from ${currentStatus} to ${newStatus} is strictly rejected. Permitted next: ${allowedNext.join(', ') || 'None'}`
        );
        return;
      }
    }

    if (newStatus === 'CANCELLED' && statusUpdateOrder.order_status !== 'CANCELLED') {
      setConfirmCancelOpen(true);
      return;
    }
    await executeStatusUpdate();
  };

  const executeStatusUpdate = async () => {
    if (!statusUpdateOrder) return;
    setIsUpdating(true);
    try {
      const currentStatus = statusUpdateOrder.order_status;
      const currentPayment = statusUpdateOrder.payment_status;

      // Restricted Fields Protection:
      // _id, customer_id, tenant_id, restaurant_id, branch_id, and created_at
      // are NEVER sent or modified here. Only controlled operational fields are provided.
      const updatePayload: {
        order_status?: OrderStatus;
        payment_status?: PaymentStatus;
        cancellation_reason?: string;
      } = {};

      if (newStatus !== currentStatus) {
        updatePayload.order_status = newStatus;
        if (newStatus === 'CANCELLED') {
          updatePayload.cancellation_reason = cancelReason.trim() || 'Cancelled by staff/manager';
        }
      }

      if (newPaymentStatus !== currentPayment) {
        updatePayload.payment_status = newPaymentStatus;
      }

      if (Object.keys(updatePayload).length === 0) {
        setStatusUpdateOrder(null);
        setConfirmCancelOpen(false);
        setIsUpdating(false);
        return;
      }

      await dispatch(
        updateOrder({
          orderId: statusUpdateOrder.id,
          payload: updatePayload,
        })
      ).unwrap();
      success('Order Updated Successfully', `Order #${statusUpdateOrder.id} updated.`);
      setStatusUpdateOrder(null);
      setConfirmCancelOpen(false);
      loadOrders();
    } catch (e: any) {
      toastError('Update Failed', typeof e === 'string' ? e : e?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick single-step forward transition
  const handleQuickAdvanceStatus = async (order: OrderItemResponseModel, targetStatus: OrderStatus) => {
    try {
      const allowedNext = VALID_STATUS_TRANSITIONS[order.order_status] || [];
      if (!allowedNext.includes(targetStatus)) {
        toastError('Invalid Transition', `Cannot transition from ${order.order_status} to ${targetStatus}`);
        return;
      }

      await dispatch(
        updateOrder({
          orderId: order.id,
          payload: {
            order_status: targetStatus,
          },
        })
      ).unwrap();
      success('Order Status Advanced', `Order #${order.id} is now ${targetStatus}.`);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, order_status: targetStatus } : null));
      }
      loadOrders();
    } catch (err: any) {
      toastError('Status Advance Failed', typeof err === 'string' ? err : err?.message || 'Advance failed');
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    try {
      const b = await dispatch(generateBill({ order_id: orderId })).unwrap();
      success('Bill Generated', `Invoice #${b.bill_number} generated successfully.`);
    } catch (e: any) {
      toastError('Bill Generation Failed', typeof e === 'string' ? e : e?.message || 'Bill generation failed');
    }
  };

  const filteredOrders = orders.filter((o) => {
    // 1. Restaurant Filter: If a restaurant is selected, ensure order matches restaurant_id or branch under it
    if (selectedRestaurantId) {
      if (o.restaurant_id && o.restaurant_id !== selectedRestaurantId) {
        return false;
      }
      // If order.restaurant_id is missing, check against branch list of this restaurant
      if (!o.restaurant_id && branches.length > 0) {
        const belongsToRestaurantBranch = branches.some((b) => b.branch_id === o.branch_id);
        if (!belongsToRestaurantBranch) return false;
      }
    }

    // 2. Branch Filter: If a specific branch is selected, ensure order matches branch_id
    if (selectedBranchId && o.branch_id !== selectedBranchId) {
      return false;
    }

    // 3. Search Query Filter
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.branch_name && o.branch_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.items && o.items.some((i) => i.menu_name.toLowerCase().includes(searchQuery.toLowerCase())));

    // 4. Status Filter
    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Order Management"
        subtitle="Live kitchen tickets, table orders, and authorized dining"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateOrderModal}
            className="gap-1.5 shadow-gold-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Order</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Search by ID, guest, or dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-muted" />}
              />
            </div>

            {/* Restaurant Selector */}
            <div className="min-w-[200px]">
              <CustomSelect
                icon={<Building2 className="w-4 h-4" />}
                value={selectedRestaurantId}
                onChange={(val) => setSelectedRestaurantId(val)}
                disabled={loadingRestaurants}
                placeholder="All Restaurants"
                options={[
                  { value: '', label: 'All Restaurants' },
                  ...restaurants.map((r) => ({
                    value: r.restaurant_id,
                    label: r.restaurant_name,
                  })),
                ]}
              />
            </div>

            {/* Branch Selector */}
            <div className="min-w-[220px]">
              <CustomSelect
                icon={<GitBranch className="w-4 h-4" />}
                value={selectedBranchId}
                onChange={(val) => setSelectedBranchId(val)}
                disabled={loadingBranches}
                placeholder={selectedRestaurantId ? 'All Branches in Restaurant' : 'All Branches'}
                options={[
                  {
                    value: '',
                    label: selectedRestaurantId ? 'All Branches in Restaurant' : 'All Branches',
                  },
                  ...branches.map((b) => ({
                    value: b.branch_id,
                    label: b.branch_name,
                    sublabel: b.city,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-primary text-background font-semibold shadow-gold-glow'
                    : 'bg-surface-secondary text-muted hover:text-foreground border border-border'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/60 text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Order ID</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Branch Location</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Items</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Total Amount</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Kitchen Status</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Payment</th>
                  <th className="px-3.5 py-3 font-medium text-right whitespace-nowrap pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted text-xs">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted font-serif italic">
                      No authorized orders found matching your filters. Click "+ Create New Order" to dispatch an order.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const branchInfo = getBranchInfo(order.branch_id);
                    const branchDisplayName = branchInfo?.branch_name || order.branch_name || order.branch_id;

                    return (
                      <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-primary">{order.id}</span>
                            {order.table_number && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20 font-medium">
                                {order.table_number}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted mt-0.5">{formatDate(order.created_at)}</p>
                        </td>

                        {/* Real Branch Location */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div>
                            <span className="text-xs text-foreground font-medium flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[140px] xl:max-w-[180px]" title={branchDisplayName}>
                                {branchDisplayName}
                              </span>
                            </span>
                            {branchInfo?.city && (
                              <p className="text-[10px] text-muted mt-0.5 ml-5">{branchInfo.city}</p>
                            )}
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-3.5 py-2.5 max-w-[160px] xl:max-w-[220px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-[10px] text-muted font-medium border border-border shrink-0">
                              {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}
                            </span>
                            <span
                              className="text-xs text-foreground truncate"
                              title={order.items.map((i) => `${i.quantity}x ${i.menu_name}`).join(', ')}
                            >
                              {order.items.map((i) => `${i.quantity}x ${i.menu_name}`).join(', ')}
                            </span>
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(order.total_amount)}
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <OrderStatusBadge status={order.order_status} />
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <PaymentStatusBadge status={order.payment_status} />
                        </td>

                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 text-xs h-7 w-7"
                              onClick={() => setSelectedOrder(order)}
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {/* Quick Status Forward Progression */}
                            {(() => {
                              const nextSteps = VALID_STATUS_TRANSITIONS[order.order_status] || [];
                              const forwardStep = nextSteps.find((s) => s !== 'CANCELLED');
                              if (forwardStep) {
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="px-2 py-1 text-[11px] h-7 text-primary hover:bg-primary/10 border border-primary/20"
                                    onClick={() => handleQuickAdvanceStatus(order, forwardStep)}
                                    title={`Advance to ${forwardStep}`}
                                  >
                                    <span className="font-semibold flex items-center gap-1">
                                      <span>{forwardStep}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </span>
                                  </Button>
                                );
                              }
                              return null;
                            })()}

                            <Button
                              variant="gold-outline"
                              size="sm"
                              className="px-2.5 py-1 text-[11px] h-7"
                              onClick={() => handleOpenStatusModal(order)}
                              title="Update Status / Payment"
                            >
                              <span>Update</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5 text-xs h-7 w-7 text-muted hover:text-foreground"
                              onClick={() => handleGenerateBill(order.id)}
                              title="Generate / View Bill"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE NEW ORDER MODAL */}
      <Modal
        isOpen={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        title="Create New Dining Order"
        subtitle="Establish table order and dispatch items to kitchen brigade"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-5">
          {/* Informational Guidance Notice */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5 text-xs text-foreground/80">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>Orders are dispatched directly to the selected branch kitchen. Menu prices are validated securely via active branch menu records.</span>
            </div>
          </div>

          {/* Location Selection: Restaurant & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Restaurant
              </label>
              <select
                value={createRestaurantId}
                onChange={(e) => setCreateRestaurantId(e.target.value)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
                required
              >
                {restaurants.map((r) => (
                  <option key={r.restaurant_id} value={r.restaurant_id}>
                    {r.restaurant_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Branch Location
              </label>
              <select
                value={createBranchId}
                onChange={(e) => setCreateBranchId(e.target.value)}
                disabled={loadingCreateBranches || createBranches.length === 0}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
                required
              >
                {createBranches.length === 0 ? (
                  <option value="">No branches under this restaurant</option>
                ) : (
                  createBranches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name} ({b.city})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Table Number & Special Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Table / Salon Number"
              value={orderTableNumber}
              onChange={(e) => setOrderTableNumber(e.target.value)}
              placeholder="e.g. Table 4 / Terrace 02"
              required
            />
            <Input
              label="Special Kitchen / Dietary Instructions"
              value={orderInstructions}
              onChange={(e) => setOrderInstructions(e.target.value)}
              placeholder="e.g. Mild spice, allergy notice"
            />
          </div>

          {/* Add Dishes Selector Row */}
          <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-muted font-medium flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
              <span>Select Courses to Add</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <select
                  value={selectedMenuIdToAdd}
                  onChange={(e) => setSelectedMenuIdToAdd(e.target.value)}
                  disabled={loadingMenus || availableMenus.length === 0}
                  className="w-full bg-surface text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
                >
                  {loadingMenus ? (
                    <option value="">Loading available dishes...</option>
                  ) : availableMenus.length === 0 ? (
                    <option value="">No active menu dishes in this branch</option>
                  ) : (
                    availableMenus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.menu_name} — {formatCurrency(m.price)} ({m.category || 'Mains'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-surface text-foreground text-xs rounded-lg p-2.5 border border-border text-center focus:border-primary focus:outline-none"
                />
              </div>

              <Button
                type="button"
                variant="gold-outline"
                size="sm"
                onClick={handleAddDraftItem}
                disabled={!selectedMenuIdToAdd || availableMenus.length === 0}
                className="gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish</span>
              </Button>
            </div>
          </div>

          {/* Draft Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-muted font-medium">
                Order Items ({draftItems.length})
              </h4>
              {draftItems.length > 0 && (
                <span className="font-mono text-xs font-semibold text-primary">
                  Est. Subtotal: {formatCurrency(draftEstimatedTotal)}
                </span>
              )}
            </div>

            {draftItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted italic">
                No items added yet. Select a dish above and click "Add Dish" to build your order ticket.
              </div>
            ) : (
              <div className="divide-y divide-border/40 border border-border rounded-xl bg-surface overflow-hidden">
                {draftItems.map((item) => (
                  <div
                    key={item.menu_id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-surface-secondary/40 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{item.menu_name}</p>
                      <p className="text-[11px] font-mono text-muted">
                        {formatCurrency(item.unit_price)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-surface-secondary">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateDraftQuantity(item.menu_id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 font-mono font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateDraftQuantity(item.menu_id, item.quantity + 1)
                          }
                          className="px-2 py-1 text-muted hover:text-foreground transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-semibold text-foreground w-16 text-right">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(item.menu_id)}
                        className="text-danger/80 hover:text-danger p-1 transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div>
              {draftItems.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted">Total Payable: </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {formatCurrency(draftEstimatedTotal)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOrderModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isCreatingOrder}
                disabled={draftItems.length === 0 || !createBranchId}
                className="gap-2 shadow-gold-glow"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Dispatch Kitchen Order</span>
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.id}`}
          subtitle={`Placed on ${formatDate(selectedOrder.created_at)}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-surface-secondary border border-border text-xs">
              <div>
                <span className="text-muted block">Status:</span>
                <div className="mt-1">
                  <OrderStatusBadge status={selectedOrder.order_status} />
                </div>
              </div>
              <div>
                <span className="text-muted block">Payment:</span>
                <div className="mt-1">
                  <PaymentStatusBadge status={selectedOrder.payment_status} />
                </div>
              </div>
              <div>
                <span className="text-muted block">Location / Table:</span>
                <span className="font-medium text-foreground mt-1 block">
                  {(() => {
                    const b = getBranchInfo(selectedOrder.branch_id);
                    return b
                      ? `${b.branch_name}${b.city ? ` (${b.city})` : ''}`
                      : selectedOrder.branch_name || selectedOrder.branch_id;
                  })()}
                  {selectedOrder.table_number ? ` — ${selectedOrder.table_number}` : ''}
                </span>
              </div>
            </div>

            {/* Visual Controlled Lifecycle Progression Stepper */}
            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-wider text-muted font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Order Lifecycle Progression
                </span>
                <span className="text-[11px] font-mono text-muted">
                  Status: <strong className="text-foreground">{selectedOrder.order_status}</strong>
                </span>
              </div>

              {selectedOrder.order_status === 'CANCELLED' ? (
                <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-xs text-danger flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Order Cancelled</span>
                    <span>Reason: {selectedOrder.cancellation_reason || 'Cancelled by staff/management'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                  {ORDER_PROGRESSION_FLOW.map((step, idx) => {
                    const stepIdx = ORDER_PROGRESSION_FLOW.indexOf(selectedOrder.order_status);
                    const isPassed = stepIdx >= idx;
                    const isCurrent = selectedOrder.order_status === step;

                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center min-w-[62px] text-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-primary text-background ring-4 ring-primary/20 shadow-gold-glow scale-110'
                                : isPassed
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'bg-surface border border-border text-muted/60'
                            }`}
                          >
                            {isPassed && !isCurrent ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 uppercase font-medium tracking-wider ${
                              isCurrent ? 'text-primary font-bold' : isPassed ? 'text-foreground' : 'text-muted/60'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                        {idx < ORDER_PROGRESSION_FLOW.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 transition-all ${
                              stepIdx > idx ? 'bg-primary' : 'bg-border'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* Quick Next Transition Button */}
              {(() => {
                const nextOptions = VALID_STATUS_TRANSITIONS[selectedOrder.order_status] || [];
                const nextStep = nextOptions.find((s) => s !== 'CANCELLED');
                if (!nextStep) return null;

                return (
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted text-[11px]">Ready for kitchen advancement?</span>
                    <Button
                      variant="gold-outline"
                      size="sm"
                      onClick={() => handleQuickAdvanceStatus(selectedOrder, nextStep)}
                      className="gap-1.5 text-xs py-1"
                    >
                      <span>Advance to {nextStep}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-muted font-medium">Courses</h4>
              <div className="divide-y divide-border/40 border-y border-border/60">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{item.quantity}x</span>{' '}
                      <span className="text-foreground/90">{item.menu_name}</span>
                    </div>
                    <span className="font-mono font-medium text-primary">
                      {formatCurrency(item.subtotal || item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.special_instructions && (
              <div className="p-3.5 rounded-xl bg-surface-secondary text-xs text-muted">
                <strong className="text-foreground block mb-0.5">Special Dietary Instructions:</strong>
                {selectedOrder.special_instructions}
              </div>
            )}

            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Hospitality VAT</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedOrder.tax_amount || 0)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                <span className="text-foreground">Total</span>
                <span className="font-mono text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Restricted Fields Audit Protection Info */}
            <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border text-[11px] text-muted space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                <span>Restricted Audit & Security Governance</span>
              </div>
              <p>
                Immutable Fields: <span className="font-mono text-foreground font-medium">_id ({selectedOrder.id})</span>, <span className="font-mono text-foreground font-medium">customer_id ({selectedOrder.customer_id})</span>, <span className="font-mono text-foreground font-medium">tenant_id ({selectedOrder.tenant_id})</span>, <span className="font-mono text-foreground font-medium">restaurant_id ({selectedOrder.restaurant_id})</span>, <span className="font-mono text-foreground font-medium">branch_id ({selectedOrder.branch_id})</span>, and <span className="font-mono text-foreground font-medium">created_at</span> cannot be altered.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Controlled Update Status Modal */}
      {statusUpdateOrder && (() => {
        const currentStatus = statusUpdateOrder.order_status;
        const isTerminal = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';
        const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];

        return (
          <Modal
            isOpen={!!statusUpdateOrder}
            onClose={() => setStatusUpdateOrder(null)}
            title={`Update Order #${statusUpdateOrder.id}`}
            subtitle="Controlled lifecycle transitions and payment status synchronization"
            maxWidth="md"
          >
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              {/* Controlled Transition Info Banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-xs text-foreground/80">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-primary">Controlled Lifecycle Transition Rules</p>
                  <p className="text-[11px] text-muted">
                    Transitions strictly follow: <span className="font-mono text-foreground font-medium">PLACED → CONFIRMED → PREPARING → READY → COMPLETED</span> (or <span className="text-danger font-medium">CANCELLED</span>). Invalid or backwards transitions are rejected.
                  </p>
                </div>
              </div>

              {/* Terminal State Warning */}
              {isTerminal && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 flex items-start gap-2 text-xs text-warning">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Terminal Status Locked</span>
                    <span>This order is already <strong>{currentStatus}</strong>. Order status transitions are locked and cannot be altered. You may still update payment status below if necessary.</span>
                  </div>
                </div>
              )}

              {/* Kitchen Status Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-medium text-muted flex items-center justify-between">
                  <span>Kitchen Status</span>
                  {isTerminal && (
                    <span className="text-[10px] text-warning uppercase font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  disabled={isTerminal}
                  className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={currentStatus}>
                    {currentStatus} (Current Status)
                  </option>
                  {!isTerminal &&
                    allowedNext.map((st) => (
                      <option key={st} value={st}>
                        {st === 'CANCELLED' ? `❌ Cancel Order (${st})` : `➔ Advance to ${st}`}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-muted">
                  {isTerminal
                    ? 'Orders in terminal status cannot be transitioned backwards or modified.'
                    : `Permissible next transitions: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'None'}`}
                </p>
              </div>

              {/* Cancellation Reason (shown if CANCELLED is selected) */}
              {newStatus === 'CANCELLED' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs uppercase tracking-wider font-medium text-danger">
                    Cancellation Reason *
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Customer request, guest no-show, kitchen shortage"
                    className="w-full bg-surface-secondary text-foreground text-xs rounded-lg p-2.5 border border-danger/40 focus:border-danger focus:outline-none"
                    required={newStatus === 'CANCELLED'}
                  />
                </div>
              )}

              {/* Payment Status Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
                >
                  {PAYMENT_STATUS_OPTIONS.map((ps) => (
                    <option key={ps} value={ps}>
                      {ps}
                    </option>
                  ))}
                </select>
              </div>

              {/* Restricted Fields Notice */}
              <div className="rounded-lg bg-surface-secondary/60 p-2.5 border border-border/60 text-[11px] text-muted flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>
                  <strong>Restricted Audit Fields:</strong> Order ID, Customer ID, Tenant ID, Restaurant ID, Branch ID, and Creation Timestamp cannot be altered.
                </span>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setStatusUpdateOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isUpdating}>
                  Save Updates
                </Button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Confirm Order Cancellation */}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={executeStatusUpdate}
        title="Cancel Order"
        description={`Are you sure you want to cancel Order #${statusUpdateOrder?.id}? This will notify the kitchen brigade and stop table preparation.`}
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isUpdating}
      />
    </div>
  );
};
