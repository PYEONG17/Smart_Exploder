"use client";

import { useState, useEffect } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  Bot,
  HelpCircle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCw,
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  GraduationCap,
  Globe,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreeDViewer } from "@/components/ui/ThreeDViewer";
import { useLang } from "@/contexts/LanguageContext";
import type { ExploreMaterial, AutoTourStop, BilingualTerm, MiniQuizQuestion } from "@/lib/explore-data.config";
import Link from "next/link";

interface ExploreViewerModalProps {
  material: ExploreMaterial | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExploreViewerModal({
  material,
  isOpen,
  onClose,
}: ExploreViewerModalProps) {
  const { locale } = useLang();
  const [activeTab, setActiveTab] = useState<"tour" | "terms" | "ai" | "quiz">("tour");
  const [tourStep, setTourStep] = useState(0);
  const [isPlayingTour, setIsPlayingTour] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Mini quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  // Reset states when material changes
  useEffect(() => {
    if (material) {
      setTourStep(0);
      setIsPlayingTour(false);
      setSelectedAnswers({});
      setShowExplanation({});
      // Initial AI greeting
      setAiMessages([
        {
          role: "assistant",
          text:
            locale === "vi"
              ? `Chào bạn! Mình là Nora AI. Bạn đang quan sát mô hình "${material.title}". Bạn có câu hỏi nào về kiến thức hoặc cấu tạo của mô hình này không? Hãy nhấn các gợi ý bên dưới hoặc gõ câu hỏi nhé!`
              : `Hello! I'm Nora AI. You are exploring "${material.titleEn}". Do you have any questions about its structure or concepts? Feel free to ask!`,
        },
      ]);
    }
  }, [material, locale]);

  // Auto-tour timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingTour && material && material.autoTourStops.length > 0) {
      interval = setInterval(() => {
        setTourStep((prev) => {
          if (prev >= material.autoTourStops.length - 1) {
            setIsPlayingTour(false);
            return 0;
          }
          return prev + 1;
        });
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTour, material]);

  if (!isOpen || !material) return null;

  const currentTourStop: AutoTourStop | undefined =
    material.autoTourStops && material.autoTourStops[tourStep];

  const handleAskAI = (questionText?: string) => {
    const q = questionText || userQuestion;
    if (!q.trim()) return;

    setAiMessages((prev) => [...prev, { role: "user", text: q }]);
    setUserQuestion("");
    setIsAiTyping(true);

    // Call backend AI API or smart fallback
    setTimeout(() => {
      let reply = "";
      const lower = q.toLowerCase();

      if (lower.includes("nguyên tử") || lower.includes("atom") || lower.includes("electron")) {
        reply =
          locale === "vi"
            ? `💡 **Nguyên tử** gồm hạt nhân mang điện tích dương ở trung tâm và các electron mang điện tích âm quay xung quanh theo các quỹ đạo elip xác định. Khối lượng nguyên tử hầu như tập trung toàn bộ ở hạt nhân (gồm proton và neutron).`
            : `💡 The **atom** consists of a central positive nucleus surrounded by negative electrons orbiting in specific shells. Protons and neutrons in the nucleus account for over 99.9% of its mass.`;
      } else if (lower.includes("hệ mặt trời") || lower.includes("solar") || lower.includes("hành tinh")) {
        reply =
          locale === "vi"
            ? `🪐 **Hệ Mặt Trời** gồm Mặt Trời ở trung tâm và 8 hành tinh quay quanh theo quỹ đạo hình elip. Trái Đất của chúng ta nằm ở vùng "Goldilocks" (vùng có nhiệt độ vừa phải cho nước lỏng và sự sống).`
            : `🪐 The **Solar System** features the Sun at its core with 8 planets in elliptical orbits. Earth is located in the habitable Goldilocks zone.`;
      } else if (lower.includes("dna") || lower.includes("di truyền")) {
        reply =
          locale === "vi"
            ? `🧬 **DNA (Axit Deoxyribonucleic)** có cấu trúc xoắn kép 2 mạch đối song song. Các bazơ nitơ bắt cặp theo nguyên tắc bổ sung: Adenine (A) nối với Thymine (T), Guanine (G) nối với Cytosine (X).`
            : `🧬 **DNA** forms an antiparallel double helix. Nucleotides pair complementarily: A pairs with T via 2 hydrogen bonds, and G pairs with C via 3 hydrogen bonds.`;
      } else {
        reply =
          locale === "vi"
            ? `Nora AI ghi nhận câu hỏi: "${q}". Đối với bài học **${material.title}** (${material.curriculum}), bạn hãy chú ý quan sát trực quan các chi tiết trên mô hình 3D, thử chuyển đổi giữa chế độ Khung dây và Bề mặt để hiểu rõ hơn về cấu trúc không gian nhé!`
            : `Nora AI received: "${q}". For **${material.titleEn}**, try rotating the 3D model and toggling wireframe mode to observe inner mechanisms!`;
      }

      setAiMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setIsAiTyping(false);
    }, 1000);
  };

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    setShowExplanation((prev) => ({ ...prev, [questionId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full rounded-3xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[90vh] max-w-7xl"
        }`}
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/80 px-4 sm:px-6 py-3.5 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                  {locale === "vi" ? material.title : material.titleEn}
                </h2>
                <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400 bg-blue-500/10">
                  {material.typeLabelVi}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                  {material.grade === "all" ? "K-9" : `Lớp ${material.grade}`} • {material.subjectLabelVi}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 truncate">
                {locale === "vi" ? material.titleEn : material.title} • {material.textbook}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns (3D Canvas + Interactive Multi-Tab Inspector) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: 3D Canvas Studio Viewport */}
          <div className="lg:col-span-7 xl:col-span-8 relative flex flex-col bg-black">
            <div className="flex-1 relative w-full h-full min-h-[300px]">
              <ThreeDViewer
                modelType={material.modelType}
                hideQuickSelector={true}
              />

              {/* Watermark/Badge */}
              <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-neutral-200">
                  {material.categoryLabelVi}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400 font-mono text-[11px]">WebGL 3D</span>
              </div>

              {/* Auto Tour floating control overlay */}
              {material.autoTourStops && material.autoTourStops.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold">
                        {tourStep + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {locale === "vi"
                          ? currentTourStop?.titleVi
                          : currentTourStop?.titleEn}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setTourStep((prev) => Math.max(0, prev - 1))
                        }
                        disabled={tourStep === 0}
                        className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                      >
                        <SkipBack className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setIsPlayingTour(!isPlayingTour)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        {isPlayingTour ? (
                          <>
                            <Pause className="h-3 w-3" />
                            <span>Tạm dừng</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            <span>Auto Tour</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setTourStep((prev) =>
                            Math.min(material.autoTourStops.length - 1, prev + 1)
                          )
                        }
                        disabled={tourStep >= material.autoTourStops.length - 1}
                        className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {locale === "vi"
                      ? currentTourStop?.descriptionVi
                      : currentTourStop?.descriptionEn}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tabbed Inspector (Auto Tour / Terms / AI Tutor / Mini Quiz) */}
          <div className="lg:col-span-5 xl:col-span-4 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/60 flex flex-col h-full overflow-hidden">
            {/* Tab navigation headers */}
            <div className="flex border-b border-neutral-800 bg-neutral-900/90 px-3 pt-2 gap-1 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab("tour")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
                  activeTab === "tour"
                    ? "bg-neutral-800 text-blue-400 border-t-2 border-blue-500"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Thuyết minh</span>
              </button>

              <button
                onClick={() => setActiveTab("terms")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
                  activeTab === "terms"
                    ? "bg-neutral-800 text-emerald-400 border-t-2 border-emerald-500"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Từ vựng song ngữ</span>
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
                  activeTab === "ai"
                    ? "bg-neutral-800 text-cyan-400 border-t-2 border-cyan-500"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Gia sư AI</span>
              </button>

              <button
                onClick={() => setActiveTab("quiz")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
                  activeTab === "quiz"
                    ? "bg-neutral-800 text-amber-400 border-t-2 border-amber-500"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Ôn tập trắc nghiệm</span>
              </button>
            </div>

            {/* Tab content bodies */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* 1. TOUR / OVERVIEW TAB */}
              {activeTab === "tour" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {locale === "vi" ? "Mục tiêu bài học & Khám phá" : "Learning Objectives"}
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {locale === "vi" ? material.description : material.descriptionEn}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 space-y-2">
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                      <span>Thông tin chương trình học</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/60">
                        <span className="text-neutral-500 block text-[10px]">Chương trình:</span>
                        <span className="font-semibold text-neutral-200">{material.curriculum}</span>
                      </div>
                      <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/60">
                        <span className="text-neutral-500 block text-[10px]">Bộ sách:</span>
                        <span className="font-semibold text-neutral-200">{material.textbook}</span>
                      </div>
                      <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/60">
                        <span className="text-neutral-500 block text-[10px]">Môn học:</span>
                        <span className="font-semibold text-neutral-200">{material.subjectLabelVi}</span>
                      </div>
                      <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/60">
                        <span className="text-neutral-500 block text-[10px]">Khối lớp:</span>
                        <span className="font-semibold text-neutral-200">
                          {material.grade === "all" ? "Tất cả khối lớp" : `Lớp ${material.grade}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Auto-tour stop list */}
                  {material.autoTourStops && material.autoTourStops.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        {locale === "vi" ? "Các chặng thuyết minh 3D" : "3D Tour Stops"}
                      </h4>
                      <div className="space-y-2">
                        {material.autoTourStops.map((stop, idx) => (
                          <button
                            key={stop.id}
                            onClick={() => {
                              setTourStep(idx);
                              setIsPlayingTour(false);
                            }}
                            className={`w-full text-left p-3 rounded-2xl border transition-all ${
                              tourStep === idx
                                ? "border-blue-500/60 bg-blue-500/10 text-white"
                                : "border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:bg-neutral-800/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-blue-400">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {locale === "vi" ? stop.titleVi : stop.titleEn}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 line-clamp-2">
                              {locale === "vi" ? stop.descriptionVi : stop.descriptionEn}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link to related courses if available */}
                  {material.relatedCourseId && (
                    <div className="pt-2">
                      <Link
                        href={`/courses/${material.relatedCourseId}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Mở toàn bộ khóa học liên quan</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 2. BILINGUAL TERMS TAB */}
              {activeTab === "terms" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Thuật ngữ Khoa học Anh - Việt
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                      GDPT 2018
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Tra cứu nhanh các khái niệm và từ vựng chuyên ngành STEM song ngữ liên quan đến mô hình.
                  </p>

                  <div className="space-y-2.5">
                    {material.bilingualTerms.map((term, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-emerald-400">
                            {term.termVi}
                          </h4>
                          <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                            {term.termEn}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed mb-1">
                          {term.definitionVi}
                        </p>
                        <p className="text-[11px] text-neutral-400 italic">
                          "{term.definitionEn}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. AI TUTOR TAB */}
              {activeTab === "ai" && (
                <div className="flex flex-col h-[400px]">
                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {aiMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-7 w-7 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-neutral-800 text-neutral-200 border border-neutral-700/60"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex items-center gap-2 text-xs text-cyan-400 bg-neutral-800/50 p-2 rounded-xl w-fit">
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        <span>Nora AI đang phân tích bài học...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick question prompts */}
                  <div className="pt-2 pb-2 flex flex-wrap gap-1.5">
                    {[
                      "Giải thích cấu tạo mô hình",
                      "Ứng dụng trong thực tế?",
                      "Cho ví dụ bài tập",
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskAI(prompt)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAI();
                    }}
                    className="flex items-center gap-2 pt-2 border-t border-neutral-800"
                  >
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="Hỏi Nora AI về mô hình 3D này..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-8 px-3"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              )}

              {/* 4. MINI QUIZ TAB */}
              {activeTab === "quiz" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Trắc nghiệm Ôn tập Nhanh
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                      Tương tác 3D
                    </Badge>
                  </div>

                  {material.miniQuiz && material.miniQuiz.length > 0 ? (
                    <div className="space-y-4">
                      {material.miniQuiz.map((quizItem, qIdx) => {
                        const selectedIdx = selectedAnswers[quizItem.id];
                        const isAnswered = selectedIdx !== undefined;

                        return (
                          <div
                            key={quizItem.id}
                            className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-3"
                          >
                            <h4 className="text-xs font-bold text-white leading-relaxed">
                              Câu {qIdx + 1}: {locale === "vi" ? quizItem.questionVi : quizItem.questionEn}
                            </h4>

                            <div className="space-y-2">
                              {quizItem.optionsVi.map((option, optIdx) => {
                                const isSelected = selectedIdx === optIdx;
                                const isCorrect = quizItem.correctIndex === optIdx;

                                let btnStyle =
                                  "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300";
                                if (isAnswered) {
                                  if (isCorrect) {
                                    btnStyle = "border-emerald-500/80 bg-emerald-500/20 text-emerald-300 font-semibold";
                                  } else if (isSelected) {
                                    btnStyle = "border-rose-500/80 bg-rose-500/20 text-rose-300 line-through";
                                  } else {
                                    btnStyle = "opacity-40 border-neutral-800 bg-neutral-950 text-neutral-500";
                                  }
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleSelectAnswer(quizItem.id, optIdx)}
                                    disabled={isAnswered}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                  >
                                    <span>
                                      {String.fromCharCode(65 + optIdx)}. {option}
                                    </span>
                                    {isAnswered && isCorrect && (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    )}
                                    {isAnswered && isSelected && !isCorrect && (
                                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Explanation */}
                            {showExplanation[quizItem.id] && (
                              <div className="mt-2 p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-300 leading-relaxed">
                                <span className="font-bold">💡 Giải thích: </span>
                                {locale === "vi" ? quizItem.explanationVi : quizItem.explanationEn}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500 text-xs">
                      Chưa có câu hỏi trắc nghiệm cho mô hình này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
