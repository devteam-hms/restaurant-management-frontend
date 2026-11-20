import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { LandingPage } from '@/pages/public/LandingPage';
import { RestaurantsExplorePage } from '@/pages/public/RestaurantsExplorePage';
import { RestaurantDetailPage } from '@/pages/public/RestaurantDetailPage';
import { RoleSelectionLoginPage } from '@/pages/auth/RoleSelectionLoginPage';
import { RegisterSelectionPage } from '@/pages/auth/RegisterSelectionPage';
import { CustomerRegisterPage } from '@/pages/auth/CustomerRegisterPage';
import { OwnerRegisterPage } from '@/pages/auth/OwnerRegisterPage';

// Customer Pages
import { CustomerOverviewPage } from '@/pages/customer/CustomerOverviewPage';
import { CustomerExplorePage } from '@/pages/customer/CustomerExplorePage';
import { CustomerCartPage } from '@/pages/customer/CustomerCartPage';
import { CustomerOrdersPage } from '@/pages/customer/CustomerOrdersPage';
import { CustomerBillsPage } from '@/pages/customer/CustomerBillsPage';
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminRestaurantsPage } from '@/pages/admin/AdminRestaurantsPage';
import { AdminBranchesPage } from '@/pages/admin/AdminBranchesPage';
import { AdminMenuPage } from '@/pages/admin/AdminMenuPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminBillsPage } from '@/pages/admin/AdminBillsPage';
import { AdminTaxPage } from '@/pages/admin/AdminTaxPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<RestaurantsExplorePage />} />
        <Route path="/explore/:id" element={<RestaurantDetailPage />} />
      </Route>

      {/* Standalone Auth */}
      <Route path="/login" element={<RoleSelectionLoginPage />} />
      <Route path="/register" element={<RegisterSelectionPage />} />
      <Route path="/register/customer" element={<CustomerRegisterPage />} />
      <Route path="/register/owner" element={<OwnerRegisterPage />} />

      {/* Customer Portal (Protected) */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute requiredPortal="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerOverviewPage />} />
        <Route path="explore" element={<CustomerExplorePage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="bills" element={<CustomerBillsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
      </Route>

      {/* Tenant Admin Portal (Protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredPortal="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="restaurants" element={<AdminRestaurantsPage />} />
        <Route path="branches" element={<AdminBranchesPage />} />
        <Route path="menus" element={<AdminMenuPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="bills" element={<AdminBillsPage />} />
        <Route path="taxes" element={<AdminTaxPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Wildcard / Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

