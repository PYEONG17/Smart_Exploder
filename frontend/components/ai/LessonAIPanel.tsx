"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  Loader2,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendLessonTutorMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type LessonAIPanelProps = {
  token: string | null;
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string;
  courseLevel?: string;
  courseSubject?: string;
  isVietnamese?: boolean;
  onClose: () => void;
};

function buildQuickPrompts(lessonTitle: string, isVietnamese: boolean) {
  return [
    {
      label: isVietnamese ? "Giải thích tóm tắt bài học" : "Explain this lesson",
      query: isVietnamese
        ? `Hãy giải thích nội dung bài học "${lessonTitle}" một cách súc tích, dễ hiểu cho học sinh.`
        : `Please explain the lesson "${lessonTitle}" in simple language easy for students to understand.`,
    },
    {
      label: isVietnamese ? "Cho ví dụ thực tế minh họa" : "Give a real-world example",
      query: isVietnamese
        ? `Hãy cho tôi một ví dụ thực tế liên quan đến nội dung bài "${lessonTitle}".`
        : `Give me a real-world example related to "${lessonTitle}".`,
    },
    {
      label: isVietnamese ? "Tạo 1 bài tập thử thách" : "Give a practice exercise",
      query: isVietnamese
        ? `Hãy tạo một câu hỏi hoặc bài tập nhỏ để tôi tự kiểm tra kiến thức về "${lessonTitle}".`
        : `Create a short practice exercise about the topic "${lessonTitle}".`,
    },
  ];
}

function makeWelcomeMessage(
  lessonTitle: string,
  _courseLevel: string | undefined,
  _courseSubject: string | undefined,
  isVietnamese: boolean,
): string {
  if (isVietnamese) {
    return `Xin chào! Tôi là **Trợ lý học tập AI** của bài học **"${lessonTitle}"**.\n\nTôi có thể hỗ trợ bạn:\n- Giải thích chi tiết các định nghĩa và công thức\n- Đưa ra ví dụ minh họa và giải đáp thắc mắc\n- Đặt câu hỏi luyện tập nhanh\n\n*Bạn có thể bấm vào các gợi ý bên dưới hoặc đặt câu hỏi bất kỳ!*`;
  }
  return `Hello! I'm your **AI Learning Assistant** for **"${lessonTitle}"**.\n\nI can help you:\n- Clarify definitions and concepts\n- Provide practical examples\n- Create quick self-check questions\n\n*Choose a quick prompt below or type your question anytime!*`;
}

export function LessonAIPanel({
  token,
  lessonId,
  lessonTitle,
  lessonDescription,
  courseLevel,
  courseSubject,
  isVietnamese = true,
  onClose,
}: LessonAIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: makeWelcomeMessage(
        lessonTitle,
        courseLevel,
        courseSubject,
        isVietnamese,
      ),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = buildQuickPrompts(lessonTitle, isVietnamese);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 120);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isTyping) return;

    if (!token) {
      toast.error(
        isVietnamese
          ? "Vui lòng đăng nhập để sử dụng trợ lý AI."
          : "Please sign in to use the AI assistant.",
      );
      return;
    }

    const newUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const historyForApi = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text }));

      const reply = await sendLessonTutorMessage(token, text, historyForApi, {
        grade: courseLevel,
        subject: courseSubject,
        lessonTitle,
        lessonDescription,
        lessonId,
        locale: isVietnamese ? "vi" : "en",
      });

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isVietnamese
            ? "Không thể kết nối trợ lý AI. Vui lòng thử lại."
            : "Could not reach the AI assistant. Please try again.",
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <aside
      className="relative flex w-[min(23rem,92vw)] flex-col border-l border-border/80 bg-card shadow-xl backdrop-blur-xl animate-in slide-in-from-right duration-300"
      aria-label="AI tutor panel"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-border/80 bg-background/60 px-4 py-3.5 backdrop-blur-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {isVietnamese ? "Trợ lý AI Bài học" : "AI Learning Assistant"}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {lessonTitle}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClose}
          aria-label="Close AI panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Messages Container ──────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/80 bg-muted/70 text-primary"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-sm bg-primary text-primary-foreground font-medium shadow-sm"
                  : "rounded-tl-sm border border-border/80 bg-muted/40 text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-xs dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:rounded-lg prose-pre:border prose-pre:border-border/60 prose-pre:bg-background prose-pre:p-2.5 text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/70 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/80 bg-muted/40 px-3.5 py-3">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom floating button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all hover:bg-muted"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* ── Quick Prompts (Only show at start) ─────────── */}
      {messages.length <= 1 && !isTyping && (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {isVietnamese ? "Gợi ý câu hỏi nhanh" : "Suggested questions"}
          </p>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => void handleSend(prompt.query)}
                disabled={isTyping}
                className="group flex w-full items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-left text-xs text-foreground transition-all hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
              >
                <span className="font-medium text-foreground/90 group-hover:text-primary">
                  {prompt.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary shrink-0 ml-1.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Area ──────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="flex items-end gap-2 border-t border-border/80 bg-background/80 p-3 backdrop-blur-sm"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          maxLength={2000}
          placeholder={
            isVietnamese
              ? "Hỏi bất kỳ điều gì về bài học..."
              : "Ask anything about this lesson..."
          }
          aria-label={isVietnamese ? "Câu hỏi cho AI" : "Question for AI"}
          className="flex-1 resize-none overflow-hidden rounded-xl border border-border/80 bg-card px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          style={{ minHeight: "38px", maxHeight: "120px" }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isTyping || !inputValue.trim()}
          aria-label={isVietnamese ? "Gửi câu hỏi" : "Send question"}
          className="h-9 w-9 shrink-0 rounded-xl transition-all"
        >
          {isTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Subtle Disclaimer Footer */}
      <div className="border-t border-border/60 bg-muted/20 px-4 py-1.5 text-center">
        <p className="text-[10px] text-muted-foreground">
          {isVietnamese
            ? "AI có thể có nhầm lẫn. Vui lòng đối chiếu với nội dung bài học."
            : "AI may make mistakes. Please verify important lesson details."}
        </p>
      </div>
    </aside>
  );
}
