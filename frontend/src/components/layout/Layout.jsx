import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen bg-gray-50 lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            style={{ color: "#374151" }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#111827" }}>
              <User className="h-4 w-4" style={{ color: "#9ca3af" }} />
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100"
              style={{ color: "#6b7280" }}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="app-main p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </>
  );
};
