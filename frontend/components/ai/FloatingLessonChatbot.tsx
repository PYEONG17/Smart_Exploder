"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronDown,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendLessonTutorMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export type FloatingLessonChatbotProps = {
  token?: string | null;
  lessonId?: string;
  lessonTitle: string;
  lessonDescription?: string;
  courseLevel?: string;
  courseSubject?: string;
  isVietnamese?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  floatingPosition?: "bottom-right" | "bottom-left";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
};

function buildQuickPrompts(lessonTitle: string, isVietnamese: boolean) {
  return [
    {
      label: isVietnamese ? "💡 Tóm tắt bài học" : "💡 Summarize lesson",
      query: isVietnamese
        ? `Hãy tóm tắt ngắn gọn các kiến thức trọng tâm của bài "${lessonTitle}" cho học sinh dễ ghi nhớ.`
        : `Please summarize the key takeaways of the lesson "${lessonTitle}" clearly.`,
    },
    {
      label: isVietnamese ? "🔍 Ví dụ thực tế" : "🔍 Real-world example",
      query: isVietnamese
        ? `Cho tôi 1 ví dụ thực tế sinh động liên quan trực tiếp đến bài học "${lessonTitle}".`
        : `Give me a vivid real-world example directly related to the lesson "${lessonTitle}".`,
    },
    {
      label: isVietnamese ? "📝 Bài tập vận dụng" : "📝 Practice question",
      query: isVietnamese
        ? `Hãy ra cho tôi 1 câu hỏi bài tập nhỏ kèm đáp án giải thích về "${lessonTitle}".`
        : `Provide a practice question with answer explanation about "${lessonTitle}".`,
    },
    {
      label: isVietnamese ? "🇬🇧 Thuật ngữ song ngữ" : "🇬🇧 Bilingual terms",
      query: isVietnamese
        ? `Liệt kê các thuật ngữ tiếng Anh quan trọng của bài "${lessonTitle}" kèm phiên âm IPA và nghĩa tiếng Việt.`
        : `List the key English terms for "${lessonTitle}" with pronunciation and meanings.`,
    },
  ];
}

function makeWelcomeMessage(
  lessonTitle: string,
  courseSubject: string | undefined,
  courseLevel: string | undefined,
  isVietnamese: boolean,
): string {
  if (isVietnamese) {
    return `Chào bạn! Mình là **Nora AI** — Trợ lý học tập thông minh trực tiếp trong bài giảng **"${lessonTitle}"**${courseSubject ? ` (*${courseSubject}${courseLevel ? ` Lớp ${courseLevel}` : ""}*)` : ""}.\n\nBạn có chỗ nào chưa hiểu, cần giải thích công thức, hoặc muốn làm thử bài tập vận dụng không? Hãy bấm vào gợi ý bên dưới hoặc nhắn trực tiếp cho mình nhé!`;
  }
  return `Hi! I'm **Nora AI** — your interactive AI Tutor inside the lecture **"${lessonTitle}"**${courseSubject ? ` (*${courseSubject}${courseLevel ? ` Grade ${courseLevel}` : ""}*)` : ""}.\n\nFeel free to ask any question about the concepts, formulas, or practical exercises!`;
}

export function FloatingLessonChatbot({
  token,
  lessonId,
  lessonTitle,
  lessonDescription,
  courseLevel,
  courseSubject,
  isVietnamese = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  floatingPosition = "bottom-right",
}: FloatingLessonChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [showHintBubble, setShowHintBubble] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      text: makeWelcomeMessage(
        lessonTitle,
        courseSubject,
        courseLevel,
        isVietnamese,
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update welcome message if lesson changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: makeWelcomeMessage(
          lessonTitle,
          courseSubject,
          courseLevel,
          isVietnamese,
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [lessonTitle, courseSubject, courseLevel, isVietnamese]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom(false);
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom(true);
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 100);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: makeWelcomeMessage(
          lessonTitle,
          courseSubject,
          courseLevel,
          isVietnamese,
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success(isVietnamese ? "Đã làm mới cuộc hội thoại" : "Chat refreshed");
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(isVietnamese ? "Đã sao chép câu trả lời" : "Copied to clipboard");
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown characters for cleaner speech
    const cleanText = text
      .replace(/[#*`_~[\]()]/g, " ")
      .replace(/-\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isVietnamese ? "vi-VN" : "en-US";
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) =>
      isVietnamese
        ? v.lang.startsWith("vi") || v.name.includes("Vietnamese")
        : v.lang.startsWith("en"),
    );
    if (targetVoice) utterance.voice = targetVoice;

    setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isTyping) return;

    const newUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
        .slice(-8)
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
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isVietnamese
            ? "Không thể kết nối trợ lý AI. Vui lòng thử lại."
            : "Could not reach AI tutor. Please try again.",
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const quickPrompts = buildQuickPrompts(lessonTitle, isVietnamese);

  const positionClasses =
    floatingPosition === "bottom-left" ? "left-6" : "right-6";

  return (
    <>
      {/* ── 1. Floating Launcher Button (Góc dưới bài giảng) ── */}
      <div className={`fixed bottom-6 ${positionClasses} z-50 flex flex-col items-end gap-2 select-none`}>
        {/* Floating Hint Speech Bubble */}
        <AnimatePresence>
          {!isOpen && showHintBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-xs rounded-2xl bg-gradient-to-r from-card to-background p-3 shadow-2xl border border-primary/30 text-xs text-foreground backdrop-blur-md mb-1 hidden sm:block"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHintBubble(false);
                }}
                className="absolute top-1.5 right-1.5 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                aria-label="Close hint"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-start gap-2 pr-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Sparkles className="h-3 w-3 animate-spin text-primary" style={{ animationDuration: "6s" }} />
                </div>
                <div>
                  <p className="font-semibold text-primary">Nora AI Trợ lý bài giảng</p>
                  <p className="text-muted-foreground mt-0.5">
                    {isVietnamese
                      ? "Chưa hiểu bài hay cần giải đáp công thức? Bấm vào đây để hỏi ngay!"
                      : "Need quick explanations? Click to ask AI directly!"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Floating Bubble Button */}
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setShowHintBubble(false);
            }}
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-tr from-indigo-600 via-primary to-cyan-500 px-4 py-3.5 text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 border border-white/25 cursor-pointer"
            aria-label="Open AI Tutor"
          >
            {/* Pulsing ring indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </span>

            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm group-hover:rotate-12 transition-transform">
              <Bot className="h-4 w-4" />
            </div>

            <span className="text-sm font-semibold tracking-wide pr-1">
              {isVietnamese ? "Hỏi AI Bài Này" : "Ask AI Tutor"}
            </span>

            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
          </motion.button>
        )}
      </div>

      {/* ── 2. Floating Chatbot Window (Ô Chatbot Nhỏ Gọn) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "auto" : "560px",
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.22 }}
            className={`fixed bottom-6 ${positionClasses} z-50 flex w-[min(26rem,94vw)] flex-col rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl overflow-hidden ring-1 ring-primary/20`}
            style={{ maxHeight: isMinimized ? "auto" : "85vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-primary/10 via-background/80 to-cyan-500/10 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-cyan-500 text-white shadow-md shadow-primary/25">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      Nora AI • Gia Sư Bài Giảng
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {courseSubject ? `${courseSubject} • ` : ""}{lessonTitle}
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted"
                  onClick={handleResetChat}
                  title={isVietnamese ? "Làm mới cuộc trò chuyện" : "Reset chat"}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted"
                  onClick={() => setIsMinimized((prev) => !prev)}
                  title={isMinimized ? (isVietnamese ? "Mở rộng" : "Expand") : (isVietnamese ? "Thu nhỏ" : "Minimize")}
                >
                  {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsOpen(false)}
                  title={isVietnamese ? "Đóng" : "Close"}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Chat Body - Collapsed when Minimized */}
            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 space-y-3.5 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border"
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {msg.role === "user" ? "Bạn" : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[82%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-tr-none shadow-sm"
                              : "bg-muted/70 text-foreground border border-border/70 rounded-tl-none shadow-sm backdrop-blur-sm"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-xs dark:prose-invert max-w-none space-y-1.5 [&>p]:leading-relaxed [&>h3]:text-xs [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-2 [&>h3]:mb-1 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-2 [&>blockquote]:italic [&>table]:w-full [&>table]:text-[11px] [&>table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </div>

                        {/* Actions on assistant message */}
                        {msg.role === "assistant" && msg.id !== "welcome" && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground px-1">
                            {msg.timestamp && <span>{msg.timestamp}</span>}
                            <span>•</span>
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="flex items-center gap-0.5 hover:text-foreground transition-colors"
                              title="Sao chép"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>{copiedId === msg.id ? "Đã chép" : "Sao chép"}</span>
                            </button>
                            <span>•</span>
                            <button
                              onClick={() => handleSpeak(msg.id, msg.text)}
                              className={`flex items-center gap-0.5 transition-colors ${speakingId === msg.id ? "text-primary font-medium" : "hover:text-foreground"}`}
                              title="Đọc to câu trả lời"
                            >
                              {speakingId === msg.id ? (
                                <VolumeX className="h-3 w-3 animate-pulse text-primary" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                              <span>{speakingId === msg.id ? "Dừng đọc" : "Đọc to"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-3 w-3 animate-spin" />
                      </div>
                      <div className="flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1.5 border border-border/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="text-[11px] font-medium ml-1 text-primary">Nora đang soạn câu trả lời...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Suggestions */}
                <div className="px-3 py-1.5 border-t border-border/50 bg-background/40">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        disabled={isTyping}
                        onClick={() => void handleSend(prompt.query)}
                        className="shrink-0 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/40 px-2.5 py-1 text-[11px] font-medium text-foreground transition-all duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border/80 bg-background/70 backdrop-blur-sm">
                  <div className="relative flex items-end gap-2 rounded-2xl border border-input bg-card p-1.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      disabled={isTyping}
                      placeholder={
                        isVietnamese
                          ? `Hỏi bất kỳ điều gì về bài "${lessonTitle}"...`
                          : `Ask anything about "${lessonTitle}"...`
                      }
                      rows={1}
                      className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-[13px] placeholder:text-muted-foreground focus:outline-none max-h-24 disabled:opacity-50"
                    />

                    <Button
                      type="button"
                      size="icon"
                      disabled={!inputValue.trim() || isTyping}
                      onClick={() => void handleSend()}
                      className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 text-white shadow-md hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                      aria-label="Send question"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-primary" />
                      Chuẩn kiến thức GDPT 2018
                    </span>
                    <span>Enter để gửi, Shift+Enter xuống dòng</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
