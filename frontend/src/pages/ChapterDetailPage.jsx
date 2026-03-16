import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, BookOpen } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChapterDetailPage() {
  const { chapterNumber } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchChapter();
  }, [chapterNumber, token]);

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/guide/chapters/${chapterNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChapter(res.data);
    } catch {
      toast.error("Failed to load chapter");
      navigate("/dashboard/guide");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await axios.post(
        `${API}/guide/chapters/${chapterNumber}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChapter((prev) => ({ ...prev, is_completed: true }));
      toast.success(`Chapter ${chapterNumber} completed!`);
    } catch {
      toast.error("Failed to mark as complete");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="chapter-detail-page">
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard/guide")}
        className="flex items-center gap-2 text-sm text-[#1B3A6B] font-medium hover:underline transition-colors"
        data-testid="back-to-guide-button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Guide
      </button>

      {/* Chapter header */}
      <div
        className="bg-[#1B3A6B] rounded-xl p-6 md:p-8 text-white"
        data-testid="chapter-header"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold text-sm">
            {chapter.chapter_number}
          </div>
          <span className="text-xs text-white/50 font-medium uppercase tracking-wider">
            Chapter {chapter.chapter_number} of 22
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{chapter.title}</h1>
        <p className="text-white/60 mt-2 text-sm">{chapter.description}</p>
      </div>

      {/* Chapter content */}
      <Card className="border border-slate-100 shadow-sm" data-testid="chapter-content-card">
        <CardContent className="p-6 md:p-8">
          <div className="prose prose-slate max-w-none">
            {chapter.content.split("\n").map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              if (line.startsWith("- ")) {
                return (
                  <div key={i} className="flex items-start gap-2 ml-4 my-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8500A] mt-2 flex-shrink-0" />
                    <span className="text-sm md:text-base text-[#1A1A1A] leading-relaxed">
                      {line.slice(2)}
                    </span>
                  </div>
                );
              }
              if (line.endsWith(":")) {
                return (
                  <h3 key={i} className="text-lg font-semibold text-[#1B3A6B] mt-6 mb-2">
                    {line}
                  </h3>
                );
              }
              return (
                <p key={i} className="text-sm md:text-base text-[#1A1A1A] leading-relaxed mb-3">
                  {line}
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pb-6" data-testid="chapter-actions">
        {chapter.is_completed ? (
          <Button
            disabled
            className="w-full sm:w-auto bg-emerald-100 text-emerald-700 cursor-not-allowed h-12 px-8 font-medium"
            data-testid="chapter-completed-button"
          >
            <Check className="h-5 w-5 mr-2" />
            Completed
          </Button>
        ) : (
          <Button
            onClick={handleMarkComplete}
            disabled={completing}
            className="w-full sm:w-auto bg-[#E8500A] hover:bg-[#c94408] text-white h-12 px-8 font-medium transition-colors duration-200"
            data-testid="mark-complete-button"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            {completing ? "Saving..." : "Mark as Complete"}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/guide")}
          className="w-full sm:w-auto h-12 px-8 border-[#1B3A6B] text-[#1B3A6B] hover:bg-blue-50 font-medium"
          data-testid="back-to-guide-bottom-button"
        >
          Back to Guide
        </Button>
      </div>
    </div>
  );
}
