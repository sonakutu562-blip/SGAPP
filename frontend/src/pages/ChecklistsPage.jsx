import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChecklistsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchChecklists = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/checklists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      if (!Object.keys(expanded).length) {
        const ex = {};
        res.data.categories.forEach((c) => (ex[c.type] = true));
        setExpanded(ex);
      }
    } catch {
      toast.error("Failed to load checklists");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const handleToggle = async (checklistType, itemKey) => {
    setData((prev) => {
      if (!prev) return prev;
      const cats = prev.categories.map((cat) => {
        if (cat.type !== checklistType) return cat;
        const items = cat.items.map((i) =>
          i.key === itemKey ? { ...i, is_checked: !i.is_checked } : i
        );
        return { ...cat, items, checked_count: items.filter((i) => i.is_checked).length };
      });
      const totalChecked = cats.reduce((s, c) => s + c.checked_count, 0);
      return { ...prev, categories: cats, total_checked: totalChecked };
    });
    try {
      await axios.post(
        `${API}/checklists/toggle`,
        { checklist_type: checklistType, item_key: itemKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Failed to update");
      fetchChecklists();
    }
  };

  const progressPct = data ? Math.round((data.total_checked / data.total_items) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="checklists-page">
      {/* Progress Banner */}
      <div className="bg-[#1B3A6B] rounded-xl p-6 md:p-8 text-white" data-testid="checklist-progress-banner">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardCheck className="h-6 w-6 text-white/80" />
          <h2 className="text-lg md:text-xl font-bold">Construction Checklists</h2>
        </div>
        <div className="flex items-end justify-between mb-3">
          <p className="text-sm text-white/70">
            {data?.total_checked ?? 0} of {data?.total_items ?? 37} items completed
          </p>
          <span className="text-2xl font-bold text-[#E8500A]">{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: "#E8500A" }}
            data-testid="checklist-progress-fill"
          />
        </div>
      </div>

      {/* Categories */}
      {data?.categories?.map((cat) => (
        <Card
          key={cat.type}
          className="overflow-hidden border border-slate-100 shadow-sm"
          data-testid={`checklist-category-${cat.type}`}
        >
          <button
            onClick={() => setExpanded((p) => ({ ...p, [cat.type]: !p[cat.type] }))}
            className="w-full flex items-center justify-between bg-[#1B3A6B] px-5 py-4 text-white"
            data-testid={`checklist-header-${cat.type}`}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-sm md:text-base">{cat.title}</h3>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">
                {cat.checked_count}/{cat.total_items} done
              </span>
            </div>
            {expanded[cat.type] ? (
              <ChevronUp className="h-5 w-5 text-white/60" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white/60" />
            )}
          </button>

          {expanded[cat.type] && (
            <div className="divide-y divide-slate-100">
              {cat.items.map((item, idx) => (
                <label
                  key={item.key}
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                  data-testid={`checklist-item-${item.key}`}
                >
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={() => handleToggle(cat.type, item.key)}
                    className="h-5 w-5 rounded border-2 border-[#1B3A6B] data-[state=checked]:bg-[#E8500A] data-[state=checked]:border-[#E8500A]"
                    data-testid={`checkbox-${item.key}`}
                  />
                  <span
                    className={`text-sm flex-1 ${
                      item.is_checked ? "line-through text-slate-400" : "text-[#1A1A1A]"
                    }`}
                  >
                    {idx + 1}. {item.text}
                  </span>
                </label>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
