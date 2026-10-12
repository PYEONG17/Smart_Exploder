"use client";

import { useState, useRef, useEffect } from "react";
import { mockAIChatHistory } from "@/lib/mock-data";
import {
  Bot,
  Send,
  User,
  Menu,
  X,
  PlusCircle,
  MessageSquare,
  Copy,
  Check,
  Calculator,
  BookOpen,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendLessonTutorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLang } from "@/contexts/LanguageContext";
import type { AIChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getQuickPrompts(isVietnamese: boolean) {
  return [
    {
      icon: Calculator,
      label: isVietnamese
        ? "Giải bài toán hình học lớp 8"
        : "Explain a Grade 8 geometry problem",
      query: isVietnamese
        ? "Hãy giải từng bước bài toán tính diện tích tam giác cân khi biết cạnh đáy và chiều cao."
        : "Please show me, step by step, how to find the area of an isosceles triangle when I know its base and height. Use simple English.",
    },
    {
      icon: Lightbulb,
      label: isVietnamese
        ? "Giải thích Định luật Newton"
        : "Explain Newton's First Law",
      query: isVietnamese
        ? "Giải thích Định luật I Newton về quán tính bằng ví dụ dễ hiểu cho học sinh."
        : "Please explain Newton's First Law with one simple, everyday example. Use easy English.",
    },
    {
      icon: BookOpen,
      label: isVietnamese
        ? "Từ vựng STEM Tiếng Anh"
        : "Learn STEM words in English",
      query: isVietnamese
        ? "Liệt kê 10 từ vựng tiếng Anh chuyên ngành Toán và Khoa học phổ biến lớp 7 kèm nghĩa."
        : "Teach me 10 common Grade 7 math and science words. Give a simple meaning and a short example for each word.",
    },
  ];
}

const gradeOptions = [
  "K1",
  "K2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
];

export default function AIPage() {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { token } = useAuth();
  const { locale } = useLang();
  const isVietnamese = locale === "vi";
  const quickPrompts = getQuickPrompts(isVietnamese);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isTyping) return;
    if (!token) {
      toast.error(
        isVietnamese
          ? "Đăng nhập để sử dụng trợ lý AI."
          : "Please sign in to use the AI tutor.",
      );
      return;
    }

    const newUserMsg = {
      id: String(messages.length),
      role: "user" as const,
      content: text,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    try {
      // AI requests are sent through the backend so provider keys stay private.
      const formattedHistory = messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const aiReply = await sendLessonTutorMessage(token, text, formattedHistory, {
        grade: gradeLevel || undefined,
        subject: "Mathematics and Science",
        locale,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: String(messages.length + 1),
          role: "assistant",
          content: aiReply,
        },
      ]);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : isVietnamese
            ? "Lỗi khi gọi AI. Vui lòng thử lại sau."
            : "The AI tutor could not reply. Please try again.",
      );
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        {isVietnamese ? "Đang kiểm tra đăng nhập..." : "Checking sign-in..."}
      </div>
    );
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success(
      isVietnamese ? "Đã sao chép nội dung." : "Message copied.",
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      {/* Sidebar - History */}
      <aside
        className={`absolute inset-y-0 left-0 z-20 flex w-[min(19rem,86vw)] flex-col border-r border-border/70 bg-card/95 pt-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:translate-x-0 lg:bg-card lg:pt-0 lg:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border/70 p-4">
          <Button
            onClick={() => setMessages([])}
            className="w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-600/15 transition-transform hover:-translate-y-0.5 hover:from-blue-700 hover:to-cyan-600"
          >
            <PlusCircle className="w-4 h-4" />
            {isVietnamese ? "Đoạn chat mới" : "New chat"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {isVietnamese ? "Lịch sử trò chuyện" : "Chat history"}
          </div>
          <div className="space-y-1">
            {mockAIChatHistory.map((chat) => (
              <button
                key={chat.id}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted/70"
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 shrink-0" />
                <div className="flex-1 truncate font-medium">{chat.title}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
      {isSidebarOpen && (
        <button
          type="button"
          aria-label={isVietnamese ? "Đóng lịch sử trò chuyện" : "Close chat history"}
          className="absolute inset-0 z-10 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="relative flex min-w-0 flex-1 flex-col bg-background/60">
        {/* Mobile Header */}
        <div className="flex items-center border-b border-border/70 bg-card/80 p-3 backdrop-blur-xl lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            aria-label={isVietnamese ? "Mở lịch sử trò chuyện" : "Open chat history"}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="ml-3 flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bot className="h-4 w-4" />
            </span>
            SmartExplorer AI Tutor
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-7">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[min(62vh,36rem)] flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-[1.35rem] border border-blue-500/15 bg-gradient-to-br from-blue-500/15 to-cyan-400/10 text-blue-600 shadow-sm dark:text-blue-300">
                  <Bot className="h-8 w-8" />
                </div>
                <div className="eyebrow mb-4">
                  {isVietnamese ? "Bạn đồng hành học tập AI" : "AI learning companion"}
                </div>
                <h2 className="mb-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                  {isVietnamese
                    ? "Trợ lý giải đáp bài giảng (Groq)"
                    : "Your STEM learning tutor (Groq)"}
                </h2>
                <p className="mb-8 max-w-md text-sm leading-7 text-muted-foreground">
                  {isVietnamese
                    ? "Hỏi về Toán, Khoa học, từ vựng STEM hoặc bài tập trên lớp. Bạn có thể hỏi bằng tiếng Việt hoặc tiếng Anh."
                    : "Ask about math, science, STEM words, or schoolwork. You can write in English or Vietnamese."}
                </p>

                {/* Quick Prompts */}
                <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {quickPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt.query)}
                        className="premium-card premium-card-hover group p-4 text-left"
                      >
                        <Icon className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="font-semibold text-xs text-foreground">
                          {prompt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`group relative max-w-[88%] rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 md:max-w-[78%] ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "border border-border/70 bg-card/90 text-foreground shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isVietnamese ? "Sao chép" : "Copy"}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <div className="max-w-none leading-relaxed">
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Hiệu ứng đang gõ chữ của AI */}
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="relative max-w-[85%] md:max-w-[78%] rounded-2xl px-5 py-4 bg-card border border-border shadow-sm rounded-tl-sm flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-3 md:px-7 md:pb-6">
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="tutor-grade-level"
                className="text-xs font-medium text-muted-foreground"
              >
                {gradeLevel
                  ? `Smart STEM AI · ${gradeLevel}`
                  : isVietnamese
                    ? "Smart STEM AI · Tự điều chỉnh K1–Lớp 9"
                    : "Smart STEM AI · Adapts to K1–Grade 9"}
              </label>
              <select
                id="tutor-grade-level"
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
                className="max-w-40 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
                aria-label={
                  isVietnamese ? "Chọn khối lớp" : "Choose your grade level"
                }
              >
                <option value="">
                  {isVietnamese
                    ? "Tự điều chỉnh · K1–Lớp 9"
                    : "Auto-adapt · K1–Grade 9"}
                </option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] transition-shadow focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
            >
              <textarea
                className="max-h-36 min-h-[56px] w-full resize-none bg-transparent py-4 pl-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none scrollbar-hide"
                placeholder={
                  isVietnamese
                    ? "Hỏi AI về bài Toán hoặc khái niệm STEM..."
                    : "Ask about a math problem or STEM idea..."
                }
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className={`absolute right-2 bottom-2 rounded-xl transition-all ${
                  inputValue.trim() && !isTyping
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-muted text-muted-foreground"
                }`}
                disabled={!inputValue.trim() || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <div className="text-center mt-2 text-[11px] text-muted-foreground">
              {isVietnamese
                ? "SmartExplorer AI có thể mắc lỗi. Hãy kiểm tra lại câu trả lời."
                : "SmartExplorer AI can make mistakes. Please check the answer."}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
