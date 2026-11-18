import { Navigate, Outlet } from 'react-router-dom';
import { Role } from '../api/types';
import { Loader } from '../components/ui';
import { HOME, useAuth } from './AuthContext';

export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={HOME[user.role]} replace />;
  return <Outlet />;
}
