import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { Search, Gift, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FILTERS = ["all", "paid", "free", "today"];
const ALL_PRODUCTS = [
  { key: "main_guide", name: "Construction Guide" },
  { key: "cost_calculator", name: "Cost Calculator" },
  { key: "vaastu_guide", name: "Vaastu Guide" },
  { key: "maintenance_guide", name: "Maintenance Guide" },
  { key: "luxury_decor_guide", name: "Luxury Decor Guide" },
  { key: "tiles_guide", name: "Tiles Guide" },
];

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminCustomers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [grantOpen, setGrantOpen] = useState(null);
  const [granting, setGranting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, filter },
      });
      setCustomers(res.data.customers);
    } catch { toast.error("Failed to load customers"); }
    finally { setLoading(false); }
  }, [token, search, filter]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const handleGrant = async (userId, productKey) => {
    setGranting(true);
    try {
      await axios.post(`${API}/admin/grant-access`,
        { user_id: userId, product_key: productKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Access granted!");
      setGrantOpen(null);
      fetchCustomers();
    } catch { toast.error("Failed to grant access"); }
    finally { setGranting(false); }
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return ""; }
  };

  return (
    <div data-testid="admin-customers">
      <h1 className="text-xl font-bold text-[#0F172A] mb-4">Customers</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            data-testid="admin-customer-search"
          />
        </div>
        <div className="flex gap-1.5" data-testid="admin-customer-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-[#1B3A6B] text-white" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
              }`}
              data-testid={`admin-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="admin-customers-table">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 font-medium">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No customers found</td></tr>
              ) : (
                customers.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} data-testid={`customer-row-${c.id}`}>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500">{c.phone || "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      {c.products.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.products.map((pk) => (
                            <span key={pk} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                              {pk.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{c.total_paid > 0 ? formatINR(c.total_paid) : "Free"}</td>
                    <td className="px-4 py-3 relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => setGrantOpen(grantOpen === c.id ? null : c.id)}
                        data-testid={`grant-btn-${c.id}`}
                      >
                        <Gift className="h-3 w-3" />
                        Grant
                      </Button>
                      {grantOpen === c.id && (
                        <div className="absolute right-4 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-48" data-testid={`grant-dropdown-${c.id}`}>
                          {ALL_PRODUCTS.map((p) => {
                            const owned = c.products.includes(p.key);
                            return (
                              <button
                                key={p.key}
                                disabled={owned || granting}
                                onClick={() => handleGrant(c.id, p.key)}
                                className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left transition-colors ${
                                  owned ? "text-slate-300 cursor-default" : "text-slate-700 hover:bg-slate-50"
                                }`}
                                data-testid={`grant-product-${p.key}`}
                              >
                                {p.name}
                                {owned && <Check className="h-3 w-3 text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
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
