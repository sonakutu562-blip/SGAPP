import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckSquare, IndianRupee, HardHat } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardHome() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res.data);
      } catch {
        setSummary({
          reading_progress: 0,
          checklist_progress: 0,
          budget_used: 0,
          current_stage: "Not Started",
        });
      }
    };
    fetchSummary();
  }, [token]);

  const summaryCards = [
    {
      title: "Reading Progress",
      value: `${summary?.reading_progress ?? 0}%`,
      progress: summary?.reading_progress ?? 0,
      icon: BookOpen,
      color: "#1B3A6B",
      bgColor: "bg-blue-50",
    },
    {
      title: "Checklist Progress",
      value: `${summary?.checklist_progress ?? 0}%`,
      progress: summary?.checklist_progress ?? 0,
      icon: CheckSquare,
      color: "#10B981",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Budget Used",
      value: `${summary?.budget_used ?? 0}%`,
      progress: summary?.budget_used ?? 0,
      icon: IndianRupee,
      color: "#F59E0B",
      bgColor: "bg-amber-50",
    },
    {
      title: "Construction Stage",
      value: summary?.current_stage ?? "Not Started",
      icon: HardHat,
      color: "#E8500A",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8" data-testid="dashboard-home">
      {/* Welcome Section */}
      <div
        className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-[0_2px_8px_rgba(27,58,107,0.08)]"
        data-testid="welcome-section"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B]">
          Namaste, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Aapka Ghar, Aapka Sapna
        </p>
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        data-testid="summary-cards-grid"
      >
        {summaryCards.map((card) => (
          <Card
            key={card.title}
            className="border border-slate-100 shadow-[0_2px_8px_rgba(27,58,107,0.08)] hover:shadow-[0_8px_16px_rgba(27,58,107,0.12)] transition-shadow duration-200"
            data-testid={`summary-card-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {card.title}
                </CardTitle>
                <div
                  className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}
                >
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
              {card.progress !== undefined && (
                <div className="mt-3">
                  <Progress value={card.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
