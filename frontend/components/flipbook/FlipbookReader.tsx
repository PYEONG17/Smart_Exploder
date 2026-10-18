"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkCheck,
  List,
  Sparkles,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Sliders,
  Languages,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import { ThreeDViewer } from "@/components/ui/ThreeDViewer";
import type { FlipbookBook, FlipbookPage, FlipbookTerm, FlipbookQuiz } from "@/lib/flipbooks-data.config";

interface FlipbookReaderProps {
  book: FlipbookBook;
}

export default function FlipbookReader({ book }: FlipbookReaderProps) {
  const { locale } = useLang();
  // 1-indexed page number
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isTwoPageMode, setIsTwoPageMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");

  // Audio Speech Narration
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechLanguage, setSpeechLanguage] = useState<"vi-VN" | "en-US">("vi-VN");

  // Quiz state on pages: Record<quizId, selectedAnswerIndex>
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = book.pages.length;

  // Responsive two-page detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsTwoPageMode(false);
      } else {
        setIsTwoPageMode(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard Navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        handleNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrevPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, isTwoPageMode, totalPages]);

  // Audio speech synthesis
  const speakText = (text: string, lang = speechLanguage) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Pronounce individual English vocabulary term
  const speakTerm = (term: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Page turning handlers
  const handleNextPage = () => {
    stopSpeaking();
    setTurnDirection("next");
    const increment = isTwoPageMode ? 2 : 1;
    setCurrentPage((prev) => Math.min(totalPages, prev + increment));
  };

  const handlePrevPage = () => {
    stopSpeaking();
    setTurnDirection("prev");
    const decrement = isTwoPageMode ? 2 : 1;
    setCurrentPage((prev) => Math.max(1, prev - decrement));
  };

  const handleGoToPage = (pageNum: number) => {
    stopSpeaking();
    setTurnDirection(pageNum > currentPage ? "next" : "prev");
    setCurrentPage(pageNum);
    setShowToc(false);
  };

  const toggleBookmark = (pageNum: number) => {
    setBookmarkedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Quiz submission with confetti celebration
  const handleAnswerQuiz = (quiz: FlipbookQuiz, optionIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [quiz.id]: optionIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [quiz.id]: true }));

    if (optionIdx === quiz.correctIndex) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  // Determine which page(s) to show
  // In Two-Page spread: left page = odd or even, right page = left + 1
  const leftPageNum = isTwoPageMode
    ? currentPage % 2 === 1
      ? currentPage
      : currentPage - 1
    : currentPage;
  const rightPageNum = isTwoPageMode ? leftPageNum + 1 : null;

  const leftPageData = book.pages.find((p) => p.pageNumber === leftPageNum);
  const rightPageData = rightPageNum
    ? book.pages.find((p) => p.pageNumber === rightPageNum)
    : null;

  // Render a single page inside the book spread
  const renderSinglePage = (page: FlipbookPage | null | undefined, isRightSide: boolean) => {
    if (!page) {
      return (
        <div className="h-full w-full bg-neutral-100 dark:bg-neutral-900/60 flex items-center justify-center p-8 text-neutral-400 text-xs italic">
          (Hết trang sách)
        </div>
      );
    }

    const isBookmarked = bookmarkedPages.includes(page.pageNumber);

    return (
      <div className="relative h-full w-full flex flex-col justify-between p-6 sm:p-8 md:p-10 select-text overflow-y-auto">
        {/* Top Header of the Page */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                {book.textbook}
              </span>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                {page.chapterTitleVi}
              </span>
            </div>

            <button
              onClick={() => toggleBookmark(page.pageNumber)}
              className="p-1 rounded-md text-neutral-400 hover:text-amber-500 transition-colors"
              title={isBookmarked ? "Bỏ đánh dấu trang" : "Đánh dấu trang này"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-500" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              {page.headingVi}
            </h2>
            <h3 className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 italic mt-0.5">
              {page.headingEn}
            </h3>
            {page.subHeadingVi && (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                • {page.subHeadingVi}
              </p>
            )}
          </div>

          {/* Paragraphs content */}
          <div className="space-y-3 text-xs sm:text-[13px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {page.paragraphsVi.map((p, idx) => (
              <p key={idx} className="text-justify">
                {p}
              </p>
            ))}
          </div>

          {/* Callout box */}
          {page.calloutVi && (
            <div className="my-4 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
              {page.calloutVi}
            </div>
          )}

          {/* Embedded 3D Model Viewport inside Page */}
          {page.embedded3DModel && (
            <div className="my-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black shadow-md">
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-white">
                <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                  <RotateCw className="h-3 w-3 animate-spin" style={{ animationDuration: "8s" }} />
                  {page.embedded3DModel.titleVi}
                </span>
                <span className="text-[10px] text-neutral-400">Xoay 360° trực tiếp trên sách</span>
              </div>
              <div className="h-44 sm:h-52 w-full relative">
                <ThreeDViewer
                  modelType={page.embedded3DModel.modelType}
                  hideQuickSelector={true}
                />
              </div>
              <div className="p-2 bg-neutral-900/90 text-[10px] text-neutral-400 text-center italic">
                {page.embedded3DModel.captionVi}
              </div>
            </div>
          )}

          {/* Bilingual Terminology Card list */}
          {page.bilingualTerms && page.bilingualTerms.length > 0 && (
            <div className="my-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                Thuật ngữ tiếng Anh trong bài:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {page.bilingualTerms.map((term, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                          {term.termEn}
                        </span>
                        {term.phonetics && (
                          <span className="text-[10px] font-mono text-neutral-400">
                            {term.phonetics}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium block">
                        {term.termVi}
                      </span>
                      <span className="text-[10px] text-neutral-400 block line-clamp-1">
                        {term.definitionVi}
                      </span>
                    </div>

                    <button
                      onClick={() => speakTerm(term.termEn)}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors shrink-0"
                      title="Phát âm tiếng Anh bản xứ"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Embedded Checkpoint Quiz on Page */}
          {page.quiz && (
            <div className="my-4 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                  Câu hỏi kiểm tra nhanh trên trang:
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                  Tự chấm điểm
                </span>
              </div>

              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                {page.quiz.questionVi}
              </p>

              <div className="space-y-1.5">
                {page.quiz.optionsVi.map((opt, optIdx) => {
                  const isSubmitted = quizSubmitted[page.quiz!.id];
                  const selectedIdx = quizAnswers[page.quiz!.id];
                  const isSelected = selectedIdx === optIdx;
                  const isCorrect = optIdx === page.quiz!.correctIndex;

                  let optClass =
                    "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800";
                  if (isSubmitted) {
                    if (isCorrect) {
                      optClass =
                        "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold";
                    } else if (isSelected) {
                      optClass =
                        "border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through";
                    } else {
                      optClass = "opacity-50 border-neutral-200 dark:border-neutral-800";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswerQuiz(page.quiz!, optIdx)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${optClass}`}
                    >
                      <span>
                        {String.fromCharCode(65 + optIdx)}. {opt}
                      </span>
                      {isSubmitted && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted[page.quiz.id] && (
                <div className="p-2.5 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                  <span className="font-bold">💡 Giải thích: </span>
                  {page.quiz.explanationVi}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page Footer Number */}
        <div className="pt-4 mt-6 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>{book.titleVi}</span>
          <span className="font-bold text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
            {page.pageNumber}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col bg-neutral-950 text-white ${
        isFullscreen ? "h-screen" : "min-h-[85vh] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl"
      }`}
    >
      {/* ── TOP CONTROL BAR ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-neutral-900/90 backdrop-blur-xl border-b border-neutral-800 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/books"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-xl hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kệ sách</span>
          </Link>

          <div className="h-4 w-px bg-neutral-800" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {book.titleVi}
              </h1>
              <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400">
                Lớp {book.grade}
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-400 truncate hidden sm:block">
              {book.author} • {book.publisher}
            </p>
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Table of contents toggle */}
          <button
            onClick={() => setShowToc(!showToc)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-colors ${
              showToc
                ? "bg-blue-600 text-white border-blue-600"
                : "border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700"
            }`}
            title="Mục lục các bài học"
          >
            <List className="h-4 w-4" />
            <span className="hidden md:inline">Mục lục</span>
          </button>

          {/* Voice Narrator Player Button */}
          <button
            onClick={() => {
              const textToRead =
                leftPageData?.audioNarrationText ||
                leftPageData?.paragraphsVi.join(" ") ||
                "";
              speakText(textToRead);
            }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
              isSpeaking
                ? "bg-emerald-600 text-white border-emerald-500 animate-pulse shadow-md shadow-emerald-500/20"
                : "border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700"
            }`}
            title={isSpeaking ? "Dừng đọc" : "Nghe giọng đọc bài giảng"}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Dừng đọc</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Giọng đọc</span>
              </>
            )}
          </button>

          {/* Spread Mode Toggle (Desktop only) */}
          <button
            onClick={() => setIsTwoPageMode(!isTwoPageMode)}
            className="hidden lg:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
            title={isTwoPageMode ? "Chuyển sang 1 trang đơn" : "Chuyển sang 2 trang đôi"}
          >
            <BookOpen className="h-4 w-4" />
            <span>{isTwoPageMode ? "2 Trang" : "1 Trang"}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl border border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ── 3D FLIPBOOK VIEWPORT CONTAINER ── */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#0a0f1d] overflow-hidden">
        {/* Realistic Book Wooden/Leather Table Texture Background */}
        <div className="absolute inset-0 bg-radial from-blue-950/20 via-transparent to-black pointer-events-none" />

        {/* The 3D Book Object */}
        <div className="relative w-full max-w-6xl h-[650px] sm:h-[720px] flex items-center justify-center perspective-[2000px]">
          {/* Book Spine Shadow in Center */}
          {isTwoPageMode && (
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 z-10 pointer-events-none bg-gradient-to-r from-black/40 via-black/70 to-black/40 shadow-inner" />
          )}

          {/* Book Container with Realistic Binding Border & Shadow */}
          <div
            className={`w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-neutral-700/60 bg-white dark:bg-[#121624] grid ${
              isTwoPageMode ? "grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800" : "grid-cols-1"
            }`}
          >
            {/* Left Page (or Single Page) */}
            <motion.div
              key={`page-${leftPageNum}`}
              initial={{
                opacity: 0.8,
                rotateY: turnDirection === "next" ? -8 : 8,
              }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full bg-white dark:bg-[#111625] overflow-y-auto"
            >
              {renderSinglePage(leftPageData, false)}
            </motion.div>

            {/* Right Page (Only in Two-Page Spread) */}
            {isTwoPageMode && (
              <motion.div
                key={`page-${rightPageNum}`}
                initial={{
                  opacity: 0.8,
                  rotateY: turnDirection === "next" ? 8 : -8,
                }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-full bg-white dark:bg-[#0f1422] overflow-y-auto"
              >
                {renderSinglePage(rightPageData, true)}
              </motion.div>
            )}
          </div>
        </div>

        {/* Floating Quick Prev/Next Click Wings */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-blue-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center disabled:opacity-20 disabled:hover:bg-black/60 transition-all shadow-lg z-20 group"
          title="Trang trước (Phím mũi tên Trái)"
        >
          <ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={handleNextPage}
          disabled={isTwoPageMode ? currentPage >= totalPages - 1 : currentPage >= totalPages}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-blue-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center disabled:opacity-20 disabled:hover:bg-black/60 transition-all shadow-lg z-20 group"
          title="Trang sau (Phím mũi tên Phải)"
        >
          <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── BOTTOM TOOLBAR & PAGE SLIDER ── */}
      <footer className="px-4 sm:px-6 py-3 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 shrink-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs font-bold text-neutral-300">
            {isTwoPageMode
              ? `Trang ${leftPageNum}${rightPageData ? ` - ${rightPageNum}` : ""} / ${totalPages}`
              : `Trang ${currentPage} / ${totalPages}`}
          </span>

          {/* Quick chapter badge */}
          <span className="text-[11px] text-neutral-400 font-medium truncate max-w-[200px]">
            {leftPageData?.chapterTitleVi}
          </span>
        </div>

        {/* Slider bar */}
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="text-xs p-1 text-neutral-400 hover:text-white disabled:opacity-20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <input
            type="range"
            min={1}
            max={totalPages}
            step={isTwoPageMode ? 2 : 1}
            value={currentPage}
            onChange={(e) => handleGoToPage(Number(e.target.value))}
            className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <button
            onClick={handleNextPage}
            disabled={isTwoPageMode ? currentPage >= totalPages - 1 : currentPage >= totalPages}
            className="text-xs p-1 text-neutral-400 hover:text-white disabled:opacity-20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation hotkey guide */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
          <span>Dùng phím ◀ / ▶ để lật trang</span>
        </div>
      </footer>

      {/* ── TABLE OF CONTENTS (MỤC LỤC) SLIDEOUT DRAWER ── */}
      <AnimatePresence>
        {showToc && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute top-14 left-0 bottom-14 w-80 bg-neutral-900/95 backdrop-blur-2xl border-r border-neutral-800 z-30 shadow-2xl flex flex-col p-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <List className="h-4 w-4 text-blue-400" />
                <span>Mục lục các bài học</span>
              </h3>
              <button
                onClick={() => setShowToc(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {book.pages.map((p) => {
                const isActive =
                  p.pageNumber === leftPageNum ||
                  (isTwoPageMode && p.pageNumber === rightPageNum);
                const isBookmarked = bookmarkedPages.includes(p.pageNumber);

                return (
                  <button
                    key={p.pageNumber}
                    onClick={() => handleGoToPage(p.pageNumber)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                      isActive
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-neutral-800 hover:bg-neutral-800/60 text-neutral-300"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 block mb-0.5">
                        Trang {p.pageNumber}
                      </span>
                      <h4 className="text-xs font-bold leading-snug line-clamp-2">
                        {p.headingVi}
                      </h4>
                      <p className="text-[10px] text-neutral-400 italic line-clamp-1 mt-0.5">
                        {p.headingEn}
                      </p>
                    </div>

                    {isBookmarked && (
                      <BookmarkCheck className="h-4 w-4 text-amber-500 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
