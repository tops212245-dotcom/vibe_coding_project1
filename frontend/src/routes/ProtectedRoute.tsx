import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role dashboard if forbidden
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      case 'PROVIDER':
        return <Navigate to="/provider" replace />;
      case 'TECHNICIAN':
        return <Navigate to="/technician" replace />;
      case 'CUSTOMER':
      default:
        return <Navigate to="/customer" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

