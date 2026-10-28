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
  Volume2,
  VolumeX,
  Shuffle,
  List,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreeDViewer } from "@/components/ui/ThreeDViewer";
import { useLang } from "@/contexts/LanguageContext";
import type { ExploreMaterial, AutoTourStop, BilingualTerm, MiniQuizQuestion } from "@/lib/explore-data.config";
import Link from "next/link";
import { sendLessonTutorMessage } from "@/lib/api";

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

  // Bilingual Audio TTS & Flashcard state
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [termsViewMode, setTermsViewMode] = useState<"flashcard" | "list">("flashcard");
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredTerms, setMasteredTerms] = useState<Record<string, boolean>>({});

  const speak = (text: string, lang: "en" | "vi" = "en", key?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "en" ? "en-US" : "vi-VN";
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) =>
      lang === "en"
        ? (v.lang.startsWith("en-US") || v.lang.startsWith("en-GB") || v.lang.startsWith("en"))
        : (v.lang.startsWith("vi") || v.name.includes("Vietnamese"))
    );
    if (targetVoice) utterance.voice = targetVoice;

    const currentKey = key || text;
    setSpeakingKey(currentKey);
    utterance.onend = () => setSpeakingKey(null);
    utterance.onerror = () => setSpeakingKey(null);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Reset states when material changes
  useEffect(() => {
    if (material) {
      setTourStep(0);
      setIsPlayingTour(false);
      setSelectedAnswers({});
      setShowExplanation({});
      setCardIndex(0);
      setIsCardFlipped(false);
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

  const handleAskAI = async (questionText?: string) => {
    const q = questionText || userQuestion;
    if (!q.trim()) return;

    setAiMessages((prev) => [...prev, { role: "user", text: q }]);
    setUserQuestion("");
    setIsAiTyping(true);

    try {
      const history = aiMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.text }));

      const reply = await sendLessonTutorMessage(null, q, history, {
        grade: material.grade,
        subject: material.subjectLabelVi || material.subject,
        lessonTitle: locale === "vi" ? material.title : material.titleEn,
        lessonDescription: `${locale === "vi" ? material.description : material.descriptionEn}. Model 3D: ${material.modelType}`,
        locale: locale === "vi" ? "vi" : "en",
      });

      setAiMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
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
    } finally {
      setIsAiTyping(false);
    }
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

              {/* 2. BILINGUAL TERMS & 3D FLASHCARD TAB */}
              {activeTab === "terms" && (
                <div className="space-y-4">
                  {/* Tab Header & View Mode Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-emerald-400" />
                          <span>Học liệu Song ngữ Anh - Việt</span>
                        </h3>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                          IPA + TTS Audio
                        </Badge>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Luyện phát âm chuẩn bản ngữ và ghi nhớ từ vựng qua thẻ Flashcard 3D.
                      </p>
                    </div>

                    {/* Switcher Mode: Flashcard 3D vs List */}
                    <div className="flex items-center bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => {
                          setTermsViewMode("flashcard");
                          setIsCardFlipped(false);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                          termsViewMode === "flashcard"
                            ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Flashcard 3D</span>
                      </button>
                      <button
                        onClick={() => setTermsViewMode("list")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                          termsViewMode === "list"
                            ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <List className="h-3 w-3" />
                        <span>Danh sách</span>
                      </button>
                    </div>
                  </div>

                  {/* MODE A: FLASHCARD 3D INTERACTIVE VIEW */}
                  {termsViewMode === "flashcard" && material.bilingualTerms.length > 0 && (() => {
                    const currentTerm = material.bilingualTerms[cardIndex] || material.bilingualTerms[0];
                    const isMastered = masteredTerms[currentTerm.termEn];

                    return (
                      <div className="space-y-4">
                        {/* Progress and status header */}
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span className="font-semibold text-neutral-300">
                            Thẻ {cardIndex + 1} / {material.bilingualTerms.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const nextIdx = Math.floor(Math.random() * material.bilingualTerms.length);
                                setCardIndex(nextIdx);
                                setIsCardFlipped(false);
                              }}
                              className="flex items-center gap-1 text-[11px] hover:text-white transition-colors bg-neutral-900 hover:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-800"
                            >
                              <Shuffle className="h-3 w-3" />
                              <span>Xáo trộn</span>
                            </button>
                            <button
                              onClick={() =>
                                setMasteredTerms((prev) => ({
                                  ...prev,
                                  [currentTerm.termEn]: !prev[currentTerm.termEn],
                                }))
                              }
                              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                                isMastered
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                              <span>{isMastered ? "Đã thuộc" : "Đánh dấu thuộc"}</span>
                            </button>
                          </div>
                        </div>

                        {/* 3D Perspective Card Container */}
                        <div
                          className="relative h-[280px] w-full perspective-[1000px] cursor-pointer group"
                          onClick={() => setIsCardFlipped(!isCardFlipped)}
                        >
                          <motion.div
                            animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            style={{ transformStyle: "preserve-3d" }}
                            className="relative w-full h-full rounded-3xl"
                          >
                            {/* FRONT FACE: ENGLISH + PHONETICS + AUDIO */}
                            <div
                              style={{ backfaceVisibility: "hidden" }}
                              className="absolute inset-0 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-neutral-900 to-cyan-950/40 p-6 flex flex-col justify-between shadow-2xl overflow-hidden"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400/80 bg-cyan-950/80 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                                  English Term • {currentTerm.partOfSpeech || "noun"}
                                </span>
                                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                                  <RotateCw className="h-3 w-3" />
                                  <span>Nhấn để lật</span>
                                </span>
                              </div>

                              <div className="text-center my-auto space-y-2">
                                <h4 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
                                  {currentTerm.termEn}
                                </h4>

                                {currentTerm.phonetics && (
                                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-sm tracking-wide shadow-inner">
                                    {currentTerm.phonetics}
                                  </div>
                                )}

                                <div className="pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speak(currentTerm.termEn, "en", `card-en-${currentTerm.termEn}`);
                                    }}
                                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                      speakingKey === `card-en-${currentTerm.termEn}`
                                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105"
                                        : "bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60"
                                    }`}
                                  >
                                    <Volume2
                                      className={`h-4 w-4 ${
                                        speakingKey === `card-en-${currentTerm.termEn}` ? "animate-pulse" : ""
                                      }`}
                                    />
                                    <span>
                                      {speakingKey === `card-en-${currentTerm.termEn}` ? "Đang phát âm..." : "Nghe phát âm chuẩn (US)"}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              <div className="text-center">
                                <span className="text-[11px] text-cyan-400/70 font-medium">
                                  Mặt sau: Nghĩa tiếng Việt & Câu ví dụ thực tế ➔
                                </span>
                              </div>
                            </div>

                            {/* BACK FACE: VIETNAMESE + DEFINITION + EXAMPLES */}
                            <div
                              style={{
                                backfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                              }}
                              className="absolute inset-0 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-neutral-900 to-emerald-950/40 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/80 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                                  Tiếng Việt • GDPT 2018
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speak(currentTerm.termVi, "vi", `card-vi-${currentTerm.termVi}`);
                                  }}
                                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40"
                                >
                                  <Volume2 className="h-3 w-3" />
                                  <span>Đọc tiếng Việt</span>
                                </button>
                              </div>

                              <div className="space-y-2 my-1">
                                <h4 className="text-xl font-bold text-emerald-400">
                                  {currentTerm.termVi}
                                </h4>
                                <p className="text-xs text-neutral-200 leading-relaxed">
                                  {currentTerm.definitionVi}
                                </p>

                                {currentTerm.exampleEn && (
                                  <div className="rounded-xl bg-neutral-950/70 border border-emerald-500/20 p-2.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                        Ví dụ ngữ cảnh:
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          speak(currentTerm.exampleEn!, "en", `ex-${currentTerm.termEn}`);
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 p-0.5"
                                        title="Nghe câu ví dụ"
                                      >
                                        <Volume2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-cyan-200 italic">
                                      "{currentTerm.exampleEn}"
                                    </p>
                                    {currentTerm.exampleVi && (
                                      <p className="text-[11px] text-neutral-400">
                                        ➔ {currentTerm.exampleVi}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="text-center pt-1 border-t border-emerald-900/40">
                                <span className="text-[10px] text-neutral-400">
                                  Nhấn để lật lại mặt tiếng Anh ↺
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Navigation controls below card */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => {
                              setCardIndex((prev) => (prev > 0 ? prev - 1 : material.bilingualTerms.length - 1));
                              setIsCardFlipped(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Thẻ trước</span>
                          </button>

                          <button
                            onClick={() => setIsCardFlipped(!isCardFlipped)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-all shadow-sm"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                            <span>Lật mặt {isCardFlipped ? "tiếng Anh" : "tiếng Việt"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setCardIndex((prev) => (prev < material.bilingualTerms.length - 1 ? prev + 1 : 0));
                              setIsCardFlipped(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
                          >
                            <span>Thẻ kế tiếp</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* MODE B: EXPANDED LIST VIEW */}
                  {termsViewMode === "list" && (
                    <div className="space-y-3">
                      {material.bilingualTerms.map((term, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-emerald-400">
                                  {term.termVi}
                                </h4>
                                <button
                                  onClick={() => speak(term.termVi, "vi", `list-vi-${idx}`)}
                                  className="text-neutral-500 hover:text-emerald-400 transition-colors p-0.5"
                                  title="Phát âm tiếng Việt"
                                >
                                  <Volume2 className={`h-3 w-3 ${speakingKey === `list-vi-${idx}` ? "text-emerald-400 animate-pulse" : ""}`} />
                                </button>
                              </div>
                              {term.partOfSpeech && (
                                <span className="text-[10px] text-neutral-500 italic">
                                  ({term.partOfSpeech})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {term.phonetics && (
                                <span className="text-[10px] font-mono text-cyan-400/80 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800">
                                  {term.phonetics}
                                </span>
                              )}
                              <span className="text-xs font-bold font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                <span>{term.termEn}</span>
                                <button
                                  onClick={() => speak(term.termEn, "en", `list-en-${idx}`)}
                                  className="hover:text-white transition-colors"
                                  title="Phát âm tiếng Anh chuẩn"
                                >
                                  <Volume2 className={`h-3 w-3 ${speakingKey === `list-en-${idx}` ? "text-cyan-400 animate-pulse" : ""}`} />
                                </button>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-300 leading-relaxed">
                            {term.definitionVi}
                          </p>
                          <p className="text-[11px] text-neutral-400 italic">
                            "{term.definitionEn}"
                          </p>

                          {term.exampleEn && (
                            <div className="rounded-xl bg-neutral-900/60 p-2 text-[11px] border border-neutral-800/80 space-y-0.5">
                              <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-semibold">
                                <span>Ví dụ câu song ngữ:</span>
                                <button
                                  onClick={() => speak(term.exampleEn!, "en", `list-ex-${idx}`)}
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                >
                                  <Volume2 className="h-2.5 w-2.5" />
                                  <span>Nghe câu</span>
                                </button>
                              </div>
                              <p className="text-cyan-200/90 font-medium">"{term.exampleEn}"</p>
                              {term.exampleVi && <p className="text-neutral-400">➔ {term.exampleVi}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
