import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const ProtectedRoute = ({ children, adminOnly, amilOnly }) => {
  const { user, loading, isAdmin, isAmil } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/amil" replace />;
  if (amilOnly && !isAmil) return <Navigate to="/admin" replace />;

  return children;
};
