import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicRoute({ restricted = false }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (user && restricted) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
