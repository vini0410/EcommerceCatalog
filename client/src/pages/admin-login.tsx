import { AdminLoginModal } from "@/components/admin-login-modal";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AdminLoginPage() {
  const [showAdminModal, setShowAdminModal] = useState(true);
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      const authed = await checkAuth();
      if (authed) {
        navigate("/admin/dashboard");
      }
    };
    verifyAuth();
  }, [checkAuth, navigate]);

  return (
    <div className="py-24">
      <AdminLoginModal
        open={showAdminModal}
        onOpenChange={setShowAdminModal}
        onLoginSuccess={() => {
          navigate("/admin/dashboard");
        }}
      />
    </div>
  );
}