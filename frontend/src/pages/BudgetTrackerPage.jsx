import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  IndianRupee, Plus, Building2, Boxes, Factory, HardHat,
  Wrench, DoorOpen, Paintbrush, Wallet, TrendingDown, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_MAP = {
  building: Building2,
  bricks: Boxes,
  roof: Factory,
  worker: HardHat,
  tools: Wrench,
  door: DoorOpen,
  paint: Paintbrush,
  wallet: Wallet,
};

const formatINR = (amount) => {
  if (!amount && amount !== 0) return "\u20B90";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BudgetTrackerPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalInput, setTotalInput] = useState("");
  const [editingTotal, setEditingTotal] = useState(false);
  const [catBudgets, setCatBudgets] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expForm, setExpForm] = useState({
    category: "",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/budget`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
      setTotalInput(res.data.total_budget || "");
      const budgets = {};
      res.data.categories.forEach((c) => (budgets[c.key] = c.budgeted_amount || ""));
      setCatBudgets(budgets);
    } catch {
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const saveTotalBudget = async () => {
    const val = parseFloat(totalInput);
    if (isNaN(val) || val < 0) return;
    try {
      await axios.post(
        `${API}/budget/total`,
        { total_budget: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTotal(false);
      fetchBudget();
    } catch {
      toast.error("Failed to save budget");
    }
  };

  const saveCategoryBudget = async (catKey) => {
    const val = parseFloat(catBudgets[catKey]);
    if (isNaN(val) || val < 0) return;
    try {
      await axios.post(
        `${API}/budget/category`,
        { category: catKey, budgeted_amount: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBudget();
    } catch {
      toast.error("Failed to save category budget");
    }
  };

  const submitExpense = async () => {
    if (!expForm.category || !expForm.amount) {
      toast.error("Please select a category and enter an amount");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/budget/expense`, {
        category: expForm.category,
        amount: parseFloat(expForm.amount),
        note: expForm.note,
        date: expForm.date,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Expense added!");
      setDialogOpen(false);
      setExpForm({ category: "", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
      fetchBudget();
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const spentPct = data && data.total_budget > 0
    ? Math.min(Math.round((data.total_spent / data.total_budget) * 100), 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="budget-tracker-page">
      {/* ─── Summary Card ──────────────────────────────── */}
      <div className="bg-[#1B3A6B] rounded-xl p-6 md:p-8 text-white" data-testid="budget-summary-card">
        <div className="flex items-center gap-3 mb-5">
          <IndianRupee className="h-6 w-6 text-white/80" />
          <h2 className="text-lg md:text-xl font-bold">Budget Overview</h2>
        </div>

        {/* Total budget input */}
        {(!data?.total_budget || editingTotal) ? (
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 font-medium">
                &#8377;
              </span>
              <input
                type="number"
                placeholder="Enter your total budget"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveTotalBudget()}
                className="w-full pl-8 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#E8500A] text-sm"
                data-testid="total-budget-input"
              />
            </div>
            <Button
              onClick={saveTotalBudget}
              className="bg-[#E8500A] hover:bg-[#c94408] text-white px-6"
              data-testid="save-total-budget-button"
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="mb-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Total Budget</p>
                <p className="text-lg md:text-xl font-bold">{formatINR(data.total_budget)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Amount Spent</p>
                <p className="text-lg md:text-xl font-bold text-[#E8500A]">{formatINR(data.total_spent)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Remaining</p>
                <p className={`text-lg md:text-xl font-bold ${data.remaining < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {formatINR(data.remaining)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingTotal(true)}
              className="text-xs text-white/40 hover:text-white/70 underline mb-3 block"
              data-testid="edit-total-budget-button"
            >
              Edit total budget
            </button>
          </div>
        )}

        {/* Progress bar */}
        {data?.total_budget > 0 && (
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-xs text-white/60">{spentPct}% spent</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${spentPct}%`,
                  backgroundColor: spentPct > 90 ? "#EF4444" : "#E8500A",
                }}
                data-testid="budget-progress-fill"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Add Expense Button ────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#E8500A] hover:bg-[#c94408] text-white font-medium"
          data-testid="add-expense-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* ─── Category Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="category-cards-grid">
        {data?.categories?.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Wallet;
          const pct = cat.budgeted_amount > 0
            ? Math.min(Math.round((cat.spent_amount / cat.budgeted_amount) * 100), 100)
            : 0;
          const isOver = cat.spent_amount > cat.budgeted_amount && cat.budgeted_amount > 0;

          return (
            <Card
              key={cat.key}
              className="border border-slate-100 shadow-sm"
              data-testid={`category-card-${cat.key}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">{cat.name}</CardTitle>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOver ? "bg-red-50" : "bg-blue-50"}`}>
                    <Icon className="h-4 w-4" style={{ color: isOver ? "#EF4444" : "#1B3A6B" }} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Budgeted input */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Budgeted</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">&#8377;</span>
                    <input
                      type="number"
                      value={catBudgets[cat.key] ?? ""}
                      onChange={(e) => setCatBudgets((p) => ({ ...p, [cat.key]: e.target.value }))}
                      onBlur={() => saveCategoryBudget(cat.key)}
                      onKeyDown={(e) => e.key === "Enter" && saveCategoryBudget(cat.key)}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#1B3A6B]"
                      data-testid={`category-budget-input-${cat.key}`}
                    />
                  </div>
                </div>

                {/* Spent */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Spent</span>
                  <span className={`text-sm font-semibold ${isOver ? "text-red-600" : "text-[#1A1A1A]"}`}>
                    {formatINR(cat.spent_amount)}
                  </span>
                </div>

                {/* Mini progress */}
                {cat.budgeted_amount > 0 && (
                  <div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isOver ? "#EF4444" : "#10B981",
                        }}
                      />
                    </div>
                    <p className={`text-[10px] mt-1 font-medium flex items-center gap-1 ${isOver ? "text-red-600" : "text-emerald-600"}`}>
                      {isOver ? (
                        <><TrendingUp className="h-3 w-3" /> Over budget</>
                      ) : (
                        <><TrendingDown className="h-3 w-3" /> {pct}% used</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Expense History ───────────────────────────── */}
      {data?.recent_expenses?.length > 0 && (
        <Card className="border border-slate-100 shadow-sm" data-testid="expense-history">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1B3A6B]">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {data.recent_expenses.map((exp) => {
                const catInfo = data.categories.find((c) => c.key === exp.category);
                return (
                  <div key={exp.id} className="flex items-center justify-between py-3" data-testid={`expense-row-${exp.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{catInfo?.name ?? exp.category}</p>
                      {exp.note && <p className="text-xs text-slate-400 truncate">{exp.note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold text-[#E8500A]">{formatINR(exp.amount)}</p>
                      <p className="text-[10px] text-slate-400">{exp.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Add Expense Dialog ────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="add-expense-dialog">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A6B]">Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={expForm.category} onValueChange={(v) => setExpForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger data-testid="expense-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {data?.categories?.map((c) => (
                    <SelectItem key={c.key} value={c.key} data-testid={`expense-option-${c.key}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (&#8377;)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={expForm.amount}
                onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))}
                data-testid="expense-amount-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g. Bought 50 bags cement"
                value={expForm.note}
                onChange={(e) => setExpForm((p) => ({ ...p, note: e.target.value }))}
                data-testid="expense-note-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={expForm.date}
                onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))}
                data-testid="expense-date-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="expense-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={submitExpense}
              disabled={saving}
              className="bg-[#E8500A] hover:bg-[#c94408] text-white"
              data-testid="expense-save-button"
            >
              {saving ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
