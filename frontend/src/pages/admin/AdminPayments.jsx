import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FILTERS = ["all", "success", "failed", "today", "week", "month"];

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminPayments() {
  const { token } = useAuth();
  const [data, setData] = useState({ payments: [], total_revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchPayments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { filter },
      });
      setData(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [token, filter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const statusBadge = (s) => {
    if (s === "success" || s === "captured") return "bg-emerald-50 text-emerald-700";
    if (s === "failed") return "bg-red-50 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div data-testid="admin-payments">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Payments</h1>
        <Card className="border-0 shadow-sm px-4 py-2 flex items-center gap-2" data-testid="admin-total-revenue">
          <IndianRupee className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-slate-500">Total Revenue:</span>
          <span className="text-lg font-bold text-[#0F172A]">{formatINR(data.total_revenue)}</span>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4" data-testid="admin-payment-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-[#1B3A6B] text-white" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
            }`}
            data-testid={`admin-pay-filter-${f}`}
          >
            {f === "week" ? "This Week" : f === "month" ? "This Month" : f}
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="admin-payments-table">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 hidden md:table-cell">Razorpay ID</th>
                <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : data.payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No payments found</td></tr>
              ) : (
                data.payments.map((p, i) => (
                  <tr key={p.id || i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} data-testid={`payment-row-${i}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0F172A]">{p.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{p.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{(p.product_key || "—").replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{p.amount > 0 ? formatINR(p.amount) : "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400 font-mono">{p.razorpay_payment_id || "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusBadge(p.payment_status)}`}>
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
