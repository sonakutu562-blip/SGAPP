import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Check, Lock, BookOpen, Share2, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProgressTrackerPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch {
      toast.error("Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleSetStage = async (stageNum) => {
    setSetting(stageNum);
    try {
      await axios.post(
        `${API}/progress/set-stage`,
        { stage: stageNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProgress();
      if (stageNum === 10) {
        setShowCelebration(true);
      } else {
        toast.success(`Stage updated to Stage ${stageNum}`);
      }
    } catch {
      toast.error("Failed to update stage");
    } finally {
      setSetting(null);
    }
  };

  const currentInfo = data
    ? data.stages.find((s) => s.status === "current")
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }

  /* ─── Celebration Overlay ─────────────────────────── */
  if (showCelebration) {
    return (
      <div className="relative min-h-[70vh] flex items-center justify-center" data-testid="celebration-overlay">
        <ConfettiEffect />
        <div className="text-center z-10 px-6">
          <div className="w-20 h-20 rounded-full bg-[#E8500A]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1B3A6B] mb-3">
            Congratulations {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-lg text-[#E8500A] font-semibold mb-2">
            Your Sundar Ghar is Complete!
          </p>
          <p className="text-slate-500 mb-8">Aapka Sapna Poora Hua!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-[#E8500A] hover:bg-[#c94408] text-white h-12 px-8"
              onClick={() => toast.info("Share feature coming soon!")}
              data-testid="share-success-button"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share your success
            </Button>
            <Button
              variant="outline"
              className="border-[#1B3A6B] text-[#1B3A6B] h-12 px-8"
              onClick={() => setShowCelebration(false)}
              data-testid="back-to-progress-button"
            >
              Back to Progress
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="progress-tracker-page">
      {/* ─── Top Banner ───────────────────────────────── */}
      <div className="bg-[#1B3A6B] rounded-xl p-6 md:p-8 text-white" data-testid="progress-banner">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-white/80" />
          <h2 className="text-lg md:text-xl font-bold">Your Construction Journey</h2>
        </div>
        {currentInfo && (
          <p className="text-sm text-white/70 mb-1">Currently at</p>
        )}
        <p className="text-base md:text-lg font-semibold text-[#E8500A]">
          {currentInfo
            ? `Stage ${currentInfo.stage}: ${currentInfo.name}`
            : "Stage 1: Planning & Documentation"}
        </p>
        <div className="flex items-end justify-between mt-4 mb-2">
          <span className="text-xs text-white/60">
            {data?.completion_pct ?? 0}% overall completion
          </span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${data?.completion_pct ?? 0}%`, backgroundColor: "#E8500A" }}
            data-testid="progress-bar-fill"
          />
        </div>
      </div>

      {/* ─── Stage Timeline ───────────────────────────── */}
      <div className="relative" data-testid="stage-timeline">
        {data?.stages?.map((stage, idx) => {
          const isCompleted = stage.status === "completed";
          const isCurrent = stage.status === "current";
          const isLast = idx === data.stages.length - 1;

          return (
            <div key={stage.stage} className="flex gap-4 md:gap-6" data-testid={`stage-${stage.stage}`}>
              {/* Timeline column */}
              <div className="flex flex-col items-center flex-shrink-0 w-10 md:w-12">
                {/* Circle */}
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 relative ${
                    isCompleted
                      ? "bg-[#2ECC71] text-white"
                      : isCurrent
                      ? "bg-[#E8500A] text-white"
                      : "bg-[#95A5A6]/20 text-[#95A5A6] border-2 border-[#95A5A6]/30"
                  }`}
                  data-testid={`stage-circle-${stage.stage}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : isCurrent ? (
                    <>
                      {stage.stage}
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#E8500A] animate-ping opacity-75" />
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#E8500A]" />
                    </>
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] ${
                      isCompleted ? "bg-[#2ECC71]" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              {/* Stage card */}
              <Card
                className={`flex-1 mb-4 transition-all duration-200 ${
                  isCurrent
                    ? "border-2 border-[#E8500A] shadow-[0_4px_16px_rgba(232,80,10,0.15)]"
                    : "border border-slate-100 shadow-sm"
                }`}
                data-testid={`stage-card-${stage.stage}`}
              >
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-semibold text-sm md:text-base ${
                            isCompleted
                              ? "text-[#2ECC71]"
                              : isCurrent
                              ? "text-[#1A1A1A]"
                              : "text-slate-400"
                          }`}
                        >
                          Stage {stage.stage}: {stage.name}
                        </h3>
                        <StatusBadge status={stage.status} />
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 mt-1">
                        {stage.description}
                      </p>

                      {/* Related chapter link */}
                      <button
                        onClick={() => navigate(`/dashboard/guide/${stage.linked_chapter}`)}
                        className="inline-flex items-center gap-1 text-xs text-[#1B3A6B] underline mt-2 hover:text-[#E8500A] transition-colors"
                        data-testid={`read-chapter-link-${stage.stage}`}
                      >
                        <BookOpen className="h-3 w-3" />
                        Read related chapter
                      </button>
                    </div>
                  </div>

                  {/* Set as current button */}
                  {!isCurrent && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => handleSetStage(stage.stage)}
                        disabled={setting === stage.stage}
                        className={
                          isCompleted
                            ? "text-xs h-8 border-slate-300 text-slate-500 hover:bg-slate-50"
                            : "text-xs h-8 bg-[#1B3A6B] hover:bg-[#152e56] text-white"
                        }
                        data-testid={`set-stage-button-${stage.stage}`}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {setting === stage.stage ? "Updating..." : "Set as Current Stage"}
                      </Button>
                    </div>
                  )}

                  {/* Current stage indicator */}
                  {isCurrent && (
                    <div className="mt-3 pt-3 border-t border-[#E8500A]/20">
                      <span className="text-xs font-medium text-[#E8500A] flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        You are here
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Status Badge Component ──────────────────────── */
function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2ECC71]/10 text-[#2ECC71]"
        data-testid="badge-completed"
      >
        Completed
      </span>
    );
  }
  if (status === "current") {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8500A]/10 text-[#E8500A]"
        data-testid="badge-current"
      >
        Current
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-[#95A5A6]"
      data-testid="badge-upcoming"
    >
      Upcoming
    </span>
  );
}

/* ─── Confetti Effect ─────────────────────────────── */
function ConfettiEffect() {
  const colors = ["#E8500A", "#1B3A6B", "#2ECC71", "#F59E0B", "#EC4899", "#3B82F6"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 3}s`,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-bounce"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
