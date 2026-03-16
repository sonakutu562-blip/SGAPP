import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, BookOpen, CheckSquare, IndianRupee,
  BarChart3, Library, MessageCircle, Settings, LogOut,
  Menu, X, Home, ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { label: "My Guide", icon: BookOpen, path: "/dashboard/guide" },
  { label: "Checklists", icon: CheckSquare, path: "/dashboard/checklists" },
  { label: "Budget Tracker", icon: IndianRupee, path: "/dashboard/budget" },
  { label: "Progress Tracker", icon: BarChart3, path: "/dashboard/progress" },
  { label: "My Library", icon: Library, path: "/dashboard/library" },
  { label: "AI Assistant", icon: MessageCircle, path: "/dashboard/ai" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const bottomNavItems = [
  { label: "Home", icon: Home, path: "/dashboard", end: true },
  { label: "Guide", icon: BookOpen, path: "/dashboard/guide" },
  { label: "Budget", icon: IndianRupee, path: "/dashboard/budget" },
  { label: "Progress", icon: BarChart3, path: "/dashboard/progress" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="dashboard-layout">
      {/* ─── Desktop Sidebar ──────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#1B3A6B] text-white z-40"
        data-testid="desktop-sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">SGS</span>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Sundar Ghar Saathi</h1>
              <p className="text-[10px] text-white/50 mt-0.5">Aapka Nirmaan Saathi</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto sidebar-scroll">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-white/15 text-[#E8500A]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
              data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white w-full transition-colors duration-200"
            data-testid="sidebar-logout-button"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ────────────────────────────────────── */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header
          className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 md:px-6 h-16 flex items-center justify-between"
          data-testid="top-navbar"
        >
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="mobile-menu-toggle"
            >
              <Menu className="h-5 w-5 text-[#1A1A1A]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1B3A6B] flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">SGS</span>
              </div>
              <span className="font-bold text-sm text-[#1B3A6B]">Sundar Ghar Saathi</span>
            </div>
          </div>

          {/* Desktop: empty left (sidebar covers logo) */}
          <div className="hidden md:block" />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 outline-none cursor-pointer hover:opacity-90 transition-opacity"
              data-testid="user-dropdown-trigger"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#1B3A6B] text-white text-xs font-bold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-[#1A1A1A]">
                {user?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/settings")}
                data-testid="dropdown-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
                data-testid="dropdown-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* ─── Mobile Sidebar Overlay ─────────────────────────────── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            data-testid="mobile-overlay"
          >
            <div
              className="w-72 h-full bg-[#1B3A6B] text-white animate-in slide-in-from-left duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SGS</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-sm">Sundar Ghar Saathi</h1>
                    <p className="text-[10px] text-white/50">Aapka Nirmaan Saathi</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-white/60 hover:text-white transition-colors"
                  data-testid="mobile-menu-close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="py-4 px-3 space-y-1">
                {sidebarItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/15 text-[#E8500A]"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`
                    }
                    data-testid={`mobile-sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white w-full transition-colors"
                  data-testid="mobile-logout-button"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Page Content ───────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ─────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around py-2 z-40 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] bottom-nav-safe"
        data-testid="bottom-navigation"
      >
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#E8500A]" : "text-slate-400"
              }`
            }
            data-testid={`bottom-nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-slate-400"
          data-testid="bottom-nav-menu"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
