"use client";

import { useState } from "react";
import {
  Bot,
  Layers,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";
import { useLang } from "@/contexts/LanguageContext";
import type { ExploreMaterial } from "@/lib/explore-data.config";
import { sendLessonTutorMessage } from "@/lib/api";

interface ExploreViewerModalProps {
  material: ExploreMaterial | null;
  isOpen: boolean;
  onClose: () => void;
}

function getInitialMessages(
  material: ExploreMaterial | null,
  locale: string,
): { role: "assistant"; text: string }[] {
  if (!material) return [];
  return [{
    role: "assistant",
    text:
      locale === "vi"
        ? `Chào bạn! Mình là Nora AI. Bạn đang quan sát mô hình "${material.title}". Bạn có câu hỏi nào về kiến thức hoặc cấu tạo của mô hình này không?`
        : `Hello! I'm Nora AI. You are exploring "${material.titleEn}". Ask me about this model or its related concepts.`,
  }];
}

export default function ExploreViewerModal({
  material,
  isOpen,
  onClose,
}: ExploreViewerModalProps) {
  const { locale } = useLang();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiMessages, setAiMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >(() => getInitialMessages(material, locale));
  const [userQuestion, setUserQuestion] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  if (!isOpen || !material) return null;

  const handleAskAI = async (questionText?: string) => {
    const question = questionText || userQuestion;
    if (!question.trim() || isAiTyping) return;

    const history = aiMessages
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.text }));
    setAiMessages((messages) => [...messages, { role: "user", text: question }]);
    setUserQuestion("");
    setIsAiTyping(true);

    try {
      const reply = await sendLessonTutorMessage(null, question, history, {
        grade: material.grade,
        subject: material.subjectLabelVi || material.subject,
        lessonTitle: locale === "vi" ? material.title : material.titleEn,
        lessonDescription: `${locale === "vi" ? material.description : material.descriptionEn}. Model 3D: ${material.modelType}`,
        locale: locale === "vi" ? "vi" : "en",
      });
      setAiMessages((messages) => [...messages, { role: "assistant", text: reply }]);
    } catch (error) {
      console.error("Unable to send 3D model question to AI tutor:", error);
      setAiMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          text:
            locale === "vi"
              ? "Gia sư AI hiện chưa trả lời được. Vui lòng thử lại sau."
              : "The AI tutor could not respond right now. Please try again later.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-md sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative flex w-full flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl transition-all duration-300 ${
          isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[90vh] max-w-7xl"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800/80 bg-neutral-900/80 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20 text-blue-400">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="max-w-md truncate text-sm font-bold text-white sm:max-w-xl sm:text-base">
                  {locale === "vi" ? material.title : material.titleEn}
                </h2>
                <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-[10px] text-blue-400">
                  {material.typeLabelVi}
                </Badge>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400">
                  {material.grade === "all" ? "K-9" : `${locale === "vi" ? "Lớp" : "Grade"} ${material.grade}`} · {material.subjectLabelVi}
                </Badge>
              </div>
              <p className="truncate text-xs text-neutral-400">
                {locale === "vi" ? material.titleEn : material.title} · {material.textbook}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((fullscreen) => !fullscreen)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/60 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white sm:flex"
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              aria-label={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/60 text-neutral-400 transition-colors hover:border-red-500/30 hover:bg-red-500/20 hover:text-white"
              aria-label={locale === "vi" ? "Đóng mô hình" : "Close model"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          <div className="relative flex min-h-[300px] flex-col bg-black lg:col-span-7 xl:col-span-8">
            <div className="relative h-full min-h-[300px] w-full flex-1">
              {material.uploadedModelUrl ? (
                <Uploaded3DModelViewer
                  url={material.uploadedModelUrl}
                  title={material.title}
                  className="h-full !min-h-0 rounded-none"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-neutral-300">
                  Không tìm thấy tệp mô hình GLB cho học liệu này.
                </div>
              )}
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-semibold text-neutral-200">{material.categoryLabelVi}</span>
                <span className="text-neutral-500">·</span>
                <span className="font-mono text-[11px] text-neutral-400">GLB 3D</span>
              </div>
            </div>
          </div>

          <section className="flex h-full min-h-[300px] flex-col overflow-hidden border-t border-neutral-800 bg-neutral-900/60 lg:col-span-5 lg:border-l lg:border-t-0 xl:col-span-4">
            <header className="flex shrink-0 items-center gap-2 border-b border-neutral-800 bg-neutral-900/90 px-4 py-3">
              <Bot className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                {locale === "vi" ? "Gia sư AI" : "AI tutor"}
              </h3>
            </header>
            <div
              className="flex-1 space-y-3 overflow-y-auto p-4"
              aria-live="polite"
              aria-label={locale === "vi" ? "Cuộc trò chuyện với gia sư AI" : "AI tutor conversation"}
            >
              {aiMessages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-600/30 text-cyan-400">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : null}
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl border p-3 text-xs leading-relaxed ${
                      message.role === "user"
                        ? "border-blue-500/30 bg-blue-600 text-white"
                        : "border-neutral-700/60 bg-neutral-800 text-neutral-200"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              ))}
              {isAiTyping ? (
                <div className="flex w-fit items-center gap-2 rounded-xl bg-neutral-800/50 p-2 text-xs text-cyan-400">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>{locale === "vi" ? "Nora AI đang phân tích..." : "Nora AI is thinking..."}</span>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-2">
              {(locale === "vi"
                ? ["Giải thích cấu tạo mô hình", "Ứng dụng trong thực tế?", "Cho ví dụ bài tập"]
                : ["Explain the model structure", "How is it used in real life?", "Give me a practice example"]
              ).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isAiTyping}
                  onClick={() => void handleAskAI(prompt)}
                  className="rounded-full border border-neutral-700/60 bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleAskAI();
              }}
              className="flex shrink-0 items-center gap-2 border-t border-neutral-800 p-4"
            >
              <input
                type="text"
                value={userQuestion}
                onChange={(event) => setUserQuestion(event.target.value)}
                placeholder={locale === "vi" ? "Hỏi Nora AI về mô hình 3D này..." : "Ask Nora AI about this 3D model..."}
                className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAiTyping || !userQuestion.trim()}
                aria-label={locale === "vi" ? "Gửi câu hỏi" : "Send question"}
                className="h-8 rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-500"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
