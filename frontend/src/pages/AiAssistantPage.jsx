import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Send, Trash2, Bot, User, MessageCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WELCOME_MSG = {
  id: "welcome",
  type: "bot",
  text: "Namaste! Main aapka Sundar Ghar AI Saathi hun. Ghar banane ke baare mein koi bhi sawaal poochho — main aapki guide ki knowledge se jawab dunga! \u{1F3E0}\n\nAap Hindi ya English mein poochh sakte hain.",
  created_at: new Date().toISOString(),
};

const SUGGESTED_QUESTIONS = [
  "Contractor ko kitna advance dena chahiye?",
  "Foundation ke liye soil test kab karein?",
  "Cement ki quality kaise check karein?",
  "Ghar banane mein kitna time lagta hai?",
];

export default function AiAssistantPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const history = res.data.messages || [];
      if (history.length > 0) {
        const formatted = [];
        for (const m of history) {
          formatted.push({ id: m.id + "_u", type: "user", text: m.message, created_at: m.created_at });
          formatted.push({ id: m.id + "_b", type: "bot", text: m.response, created_at: m.created_at });
        }
        setMessages([WELCOME_MSG, ...formatted]);
        setShowSuggestions(false);
      }
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg = { id: Date.now() + "_u", type: "user", text: trimmed, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setSending(true);

    try {
      const res = await axios.post(
        `${API}/chat/send`,
        { message: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const botMsg = { id: res.data.id + "_b", type: "bot", text: res.data.response, created_at: res.data.created_at };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + "_err", type: "bot", text: "Kuch technical issue aa gaya. Please thodi der baad try karein.", created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    try {
      await axios.delete(`${API}/chat/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([WELCOME_MSG]);
      setShowSuggestions(true);
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-5.5rem)]" data-testid="ai-assistant-page">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white rounded-t-xl" data-testid="ai-header">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#1B3A6B]" />
            <h1 className="text-lg font-bold text-[#1B3A6B]">AI Assistant</h1>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full" data-testid="ai-online-badge">
              Online
            </span>
          </div>
          <p className="text-xs text-slate-400 ml-7">Powered by Sundar Ghar Guide</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-slate-400 hover:text-red-500 text-xs gap-1"
          data-testid="ai-clear-button"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50" data-testid="ai-messages-area">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} formatTime={formatTime} />
        ))}

        {/* Suggested questions */}
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pl-9" data-testid="ai-suggestions">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs bg-white border border-[#1B3A6B]/20 text-[#1B3A6B] px-3 py-1.5 rounded-full hover:bg-[#1B3A6B]/5 transition-colors shadow-sm"
                data-testid={`ai-suggestion-${i}`}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex items-start gap-2" data-testid="ai-typing-indicator">
            <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center flex-shrink-0">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-[#E8F4FD] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#1B3A6B]/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#1B3A6B]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#1B3A6B]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-100 px-4 py-3 bg-white rounded-b-xl" data-testid="ai-input-bar">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            placeholder="Koi bhi sawaal poochho..."
            disabled={sending}
            className="flex-1 h-11 rounded-full px-4 border border-slate-200 bg-slate-50 text-sm outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/30 transition-colors disabled:opacity-50"
            data-testid="ai-message-input"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="h-11 w-11 rounded-full bg-[#E8500A] hover:bg-[#c94408] p-0 flex-shrink-0"
            data-testid="ai-send-button"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-1">{input.length}/500</p>
      </div>
    </div>
  );
}

function ChatBubble({ msg, formatTime }) {
  const isBot = msg.type === "bot";

  return (
    <div className={`flex items-start gap-2 ${isBot ? "" : "flex-row-reverse"}`} data-testid={`chat-msg-${msg.id}`}>
      {isBot ? (
        <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#E8500A] flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className="max-w-[80%] md:max-w-[70%]">
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isBot
              ? "bg-[#E8F4FD] text-[#1A1A1A] rounded-2xl rounded-tl-sm"
              : "bg-[#E8500A] text-white rounded-2xl rounded-tr-sm"
          }`}
        >
          {msg.text}
        </div>
        <p className={`text-[10px] text-slate-300 mt-1 ${isBot ? "" : "text-right"}`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}
