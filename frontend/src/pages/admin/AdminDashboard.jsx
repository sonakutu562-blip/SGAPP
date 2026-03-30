import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Users, IndianRupee, UserPlus, TrendingUp } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;
  }

  const cards = [
    { label: "Total Customers", value: stats?.total_customers ?? 0, icon: Users, color: "bg-blue-500" },
    { label: "Total Revenue", value: formatINR(stats?.total_revenue ?? 0), icon: IndianRupee, color: "bg-emerald-500" },
    { label: "Today's Signups", value: stats?.today_signups ?? 0, icon: UserPlus, color: "bg-violet-500" },
    { label: "Today's Revenue", value: formatINR(stats?.today_revenue ?? 0), icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-xl font-bold text-[#0F172A] mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 border-0 shadow-sm" data-testid={`admin-stat-${c.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                <p className="text-2xl font-bold text-[#0F172A] mt-1">{c.value}</p>
              </div>
              <div className={`${c.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
