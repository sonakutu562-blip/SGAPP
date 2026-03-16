import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GuideListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, [token]);

  const fetchChapters = async () => {
    try {
      const res = await axios.get(`${API}/guide/chapters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch {
      toast.error("Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = data
    ? Math.round((data.completed_count / data.total_chapters) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6" data-testid="guide-list-page">
      {/* ─── Progress Banner ──────────────────────────────── */}
      <div
        className="bg-[#1B3A6B] rounded-xl p-6 md:p-8 text-white"
        data-testid="guide-progress-banner"
      >
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-6 w-6 text-white/80" />
          <h2 className="text-lg md:text-xl font-bold">Your Reading Progress</h2>
        </div>
        <div className="flex items-end justify-between mb-3">
          <p className="text-sm text-white/70">
            {data?.completed_count ?? 0} of {data?.total_chapters ?? 22} chapters completed
          </p>
          <span className="text-2xl font-bold text-[#E8500A]">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: "#E8500A",
            }}
            data-testid="progress-bar-fill"
          />
        </div>
      </div>

      {/* ─── Chapter List ─────────────────────────────────── */}
      <div className="space-y-3" data-testid="chapter-list">
        {data?.chapters?.map((chapter) => (
          <ChapterCard
            key={chapter.chapter_number}
            chapter={chapter}
            onClick={() => navigate(`/dashboard/guide/${chapter.chapter_number}`)}
          />
        ))}
      </div>

      {/* ─── Floating PDF Download Button ─────────────────── */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30">
        <Button
          onClick={() => toast.info("PDF download coming soon!")}
          className="bg-[#E8500A] hover:bg-[#c94408] text-white shadow-lg hover:shadow-xl rounded-full px-5 h-12 font-medium transition-all duration-200"
          data-testid="download-pdf-button"
        >
          <Download className="h-5 w-5 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

function ChapterCard({ chapter, onClick }) {
  const isCompleted = chapter.status === "completed";
  const isReading = chapter.status === "reading";
  const isLocked = chapter.status === "locked";

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isReading
          ? "border-2 border-[#E8500A] shadow-[0_2px_12px_rgba(232,80,10,0.15)]"
          : "border border-slate-100 shadow-[0_2px_8px_rgba(27,58,107,0.06)]"
      }`}
      data-testid={`chapter-card-${chapter.chapter_number}`}
    >
      <div className="flex items-center gap-4 p-4 md:p-5">
        {/* Chapter number square */}
        <div
          className={`w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-sm md:text-base ${
            isCompleted ? "bg-[#E8500A]" : "bg-[#1B3A6B]"
          }`}
          data-testid={`chapter-number-${chapter.chapter_number}`}
        >
          {chapter.chapter_number}
        </div>

        {/* Title and description */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-sm md:text-base leading-tight ${
              isLocked ? "text-slate-400" : "text-[#1A1A1A]"
            }`}
          >
            {chapter.title}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5 truncate">
            {chapter.description}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          {isCompleted && (
            <div
              className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"
              data-testid={`chapter-status-completed-${chapter.chapter_number}`}
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
          )}
          {isReading && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#E8500A]/10 text-[#E8500A]"
              data-testid={`chapter-status-reading-${chapter.chapter_number}`}
            >
              Reading
            </span>
          )}
          {isLocked && (
            <div
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              data-testid={`chapter-status-locked-${chapter.chapter_number}`}
            >
              <Lock className="h-4 w-4 text-slate-300" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
