import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AuthRole } from '../contexts/AuthContext';

export function RoleGate({ allowedRoles }: { allowedRoles: AuthRole[] }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!allowedRoles.includes(role)) {
    if (role === 'STAFF') return <Navigate to="/seller/dashboard" replace />;
    if (role === 'PARTNER_OWNER') return <Navigate to="/owner/dashboard" replace />;
    if (role === 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
