
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login", { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminDashboard onLogout={handleLogout} />
  );
};

export default Admin;
