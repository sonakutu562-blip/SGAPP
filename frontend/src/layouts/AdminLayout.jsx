import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, CreditCard, FileText, LogOut, Menu, X
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", end: true },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Payments", icon: CreditCard, path: "/admin/payments" },
  { label: "Content Manager", icon: FileText, path: "/admin/content" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9]" data-testid="admin-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0F172A] text-white z-40" data-testid="admin-sidebar">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#E8500A] flex items-center justify-center">
              <span className="text-white font-bold text-xs">SGS</span>
            </div>
            <div>
              <h1 className="font-bold text-sm">Admin Panel</h1>
              <p className="text-[10px] text-white/40">Sundar Ghar Saathi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-[#E8500A]" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
              data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-white/80 truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/5 hover:text-white w-full transition-colors"
            data-testid="admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-[#0F172A] text-white flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} data-testid="admin-mobile-menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <span className="text-xs text-white/40">{user?.name}</span>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-[#0F172A] text-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="font-bold text-sm">Admin Panel</span>
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-white/60" /></button>
            </div>
            <nav className="py-4 px-3 space-y-1">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-white/10 text-[#E8500A]" : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-white/10">
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white w-full">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:ml-60 min-h-screen">
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
