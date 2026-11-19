import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { GlobalToaster } from '@/components/notifications/GlobalToaster';
import { AuthProvider } from '@/context/AuthContext';
import { TenantProvider } from '@/context/TenantContext';
import { CartProvider } from '@/context/CartContext';
import { AppRoutes } from '@/routes/AppRoutes';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <GlobalToaster />
          <ToastProvider>
            <AuthProvider>
              <TenantProvider>
                <CartProvider>
                  <ScrollToTop />
                  <AppRoutes />
                </CartProvider>
              </TenantProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
