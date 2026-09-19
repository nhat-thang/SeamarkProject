import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ role, children }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <p style={{ padding: 24 }}>Đang tải...</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <p style={{ padding: 24 }}>Không tìm thấy hồ sơ người dùng.</p>;
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === "admin" ? "/admin" : "/student"} replace />;
  }

  return children;
}
