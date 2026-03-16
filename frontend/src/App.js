import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import GuideListPage from "@/pages/GuideListPage";
import ChapterDetailPage from "@/pages/ChapterDetailPage";
import ChecklistsPage from "@/pages/ChecklistsPage";
import BudgetTrackerPage from "@/pages/BudgetTrackerPage";
import ProgressTrackerPage from "@/pages/ProgressTrackerPage";
import "@/App.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-64" data-testid="placeholder-page">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1B3A6B]">{title}</h2>
        <p className="text-sm text-slate-500 mt-2">Coming soon</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="guide" element={<GuideListPage />} />
            <Route path="guide/:chapterNumber" element={<ChapterDetailPage />} />
            <Route path="checklists" element={<ChecklistsPage />} />
            <Route path="budget" element={<BudgetTrackerPage />} />
            <Route path="progress" element={<ProgressTrackerPage />} />
            <Route path="library" element={<PlaceholderPage title="My Library" />} />
            <Route path="ai" element={<PlaceholderPage title="AI Assistant" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
