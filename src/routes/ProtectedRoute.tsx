import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isTenantAdmin, isCustomerAuthorized } from '@/lib/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPortal?: 'customer' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPortal,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <span className="text-4xl text-primary font-serif animate-pulse mb-4">⚜</span>
        <p className="text-xs uppercase tracking-widest text-muted">Authenticating Session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPortal === 'admin') {
    if (!isTenantAdmin(user.roles)) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Restricted Area</h1>
          <p className="text-sm text-muted max-w-md mb-8 leading-relaxed">
            Your authenticated Keycloak account with role [
            <span className="text-primary font-medium">{user.roles.join(', ')}</span>] is not
            authorized to access the Tenant Admin Management portal.
          </p>
          <div className="flex gap-4">
            <Link to="/customer">
              <Button variant="primary">Go to Dining Portal</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Switch Account
              </Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  if (requiredPortal === 'customer') {
    if (!isCustomerAuthorized(user.roles)) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <h1 className="font-serif text-3xl text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted max-w-md mb-6">
            You do not have access to the customer portal.
          </p>
          <Link to="/login">
            <Button variant="primary">Return to Sign In</Button>
          </Link>
        </div>
      );
    }
  }

  return <>{children}</>;
};

