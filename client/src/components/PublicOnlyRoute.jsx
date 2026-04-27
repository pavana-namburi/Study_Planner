import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLoading from "./AuthLoading";

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicOnlyRoute;
