"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, X, Sparkles, ChevronDown } from "lucide-react";
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
      label: isVietnamese ? "Giải thích bài học này" : "Explain this lesson",
      query: isVietnamese
        ? `Hãy giải thích nội dung bài học "${lessonTitle}" bằng ngôn ngữ đơn giản, dễ hiểu cho học sinh.`
        : `Please explain the lesson "${lessonTitle}" in simple language easy for students to understand.`,
    },
    {
      label: isVietnamese ? "Cho ví dụ thực tế" : "Give a real example",
      query: isVietnamese
        ? `Hãy cho tôi một ví dụ thực tế về nội dung bài "${lessonTitle}".`
        : `Give me a real-world example related to "${lessonTitle}".`,
    },
    {
      label: isVietnamese ? "Tạo bài tập luyện tập" : "Practice exercise",
      query: isVietnamese
        ? `Hãy tạo một bài tập nhỏ để tôi luyện tập về chủ đề "${lessonTitle}".`
        : `Create a short practice exercise about the topic "${lessonTitle}".`,
    },
  ];
}

function makeWelcomeMessage(
  lessonTitle: string,
  courseLevel: string | undefined,
  courseSubject: string | undefined,
  isVietnamese: boolean,
): string {
  if (isVietnamese) {
    return `Xin chào! Tôi là Trợ lý AI SmartExplorer. Tôi đã tải bài học **"${lessonTitle}"** và sẵn sàng giúp bạn hiểu bài.\n\nBạn có thể hỏi tôi:\n- Giải thích các khái niệm khó hiểu.\n- Cho thêm ví dụ minh họa.\n- Tạo bài tập luyện tập nhỏ.\n\n💡 *Mẹo: Sử dụng các gợi ý nhanh bên dưới để bắt đầu!*`;
  }
  return `Hello! I'm SmartExplorer AI Tutor. I've loaded the lesson **"${lessonTitle}"** and I'm ready to help you understand it.\n\nYou can ask me to:\n- Explain concepts.\n- Give more examples.\n- Create short practice exercises.\n\n💡 *Tip: Use the quick prompts below to get started!*`;
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
      className="relative flex w-[min(22rem,92vw)] flex-col border-l border-border/70 bg-card/95 shadow-2xl shadow-slate-950/15 backdrop-blur-xl animate-in slide-in-from-right duration-300"
      aria-label="AI tutor panel"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 border-b border-border/70 bg-gradient-to-r from-blue-600/10 via-indigo-500/8 to-purple-500/10 px-4 py-3.5">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-blue-500/40 via-indigo-400/40 to-purple-400/40" />

        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-600/30">
          <Bot className="h-4 w-4 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-foreground">
            {isVietnamese ? "Trợ lý AI Bài học" : "AI Lesson Tutor"}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
            {lessonTitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Gemini
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            onClick={onClose}
            aria-label="Close AI panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-hide"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 shadow-blue-600/20"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
              }`}
            >
              {msg.role === "user" ? (
                <span className="text-[10px] font-bold">B</span>
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`min-w-0 max-w-[87%] rounded-2xl px-3.5 py-3 text-xs leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "rounded-tr-sm bg-blue-600 text-white"
                  : "rounded-tl-sm border border-border/60 bg-background/80 text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground">
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
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/60 bg-background/80 px-4 py-3.5 shadow-sm">
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 right-4 z-10 grid h-7 w-7 place-items-center rounded-full border border-border bg-card shadow-md transition-opacity hover:bg-muted"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* ── Quick Prompts ───────────────────────────────── */}
      {messages.length <= 1 && !isTyping && (
        <div className="px-4 pb-2">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {isVietnamese ? "Gợi ý nhanh" : "Quick prompts"}
          </p>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => void handleSend(prompt.query)}
                disabled={isTyping}
                className="w-full rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
              >
                {prompt.label}
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
        className="flex items-end gap-2 border-t border-border/70 bg-card/80 p-3"
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
              ? "Hỏi AI về bài học này..."
              : "Ask AI about this lesson..."
          }
          aria-label={isVietnamese ? "Câu hỏi cho AI" : "Question for AI"}
          className="flex-1 resize-none overflow-hidden rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isTyping || !inputValue.trim()}
          aria-label={isVietnamese ? "Gửi câu hỏi" : "Send question"}
          className={`h-9 w-9 shrink-0 rounded-xl transition-all ${
            inputValue.trim() && !isTyping
              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isTyping ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="border-t border-border/50 bg-card/60 px-4 py-2 text-center text-[10px] text-muted-foreground">
        {isVietnamese
          ? "AI có thể mắc lỗi. Hãy kiểm tra lại kết quả."
          : "AI can make mistakes. Please verify answers."}
      </p>
    </aside>
  );
}
