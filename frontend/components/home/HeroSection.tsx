"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useLang } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Sparkles,
  Box,
  Play,
  RotateCw,
  Bot,
  Video,
  CheckCircle2,
  Layers,
  Volume2,
  ZoomIn,
  Flame,
  Award,
} from "lucide-react";

/**
 * Hero Section: Redesigned with authentic NoraClass aesthetic.
 * Clean, luminous, interactive educational canvas for K-9 STEM.
 */
export default function HeroSection() {
  const { t, locale } = useLang();
  const [activeTab, setActiveTab] = React.useState<"3d" | "video" | "ai">("3d");
  const [rotationAngle, setRotationAngle] = React.useState(25);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [quizAnswered, setQuizAnswered] = React.useState<number | null>(null);

  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 45) % 360);
  };

  const handleZoom = () => {
    setZoomLevel((prev) => (prev >= 1.25 ? 0.9 : prev + 0.15));
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50/40 dark:from-slate-950 dark:via-[#0c1222] dark:to-slate-950 pt-28 pb-20 md:pt-36 md:pb-28 transition-colors">
      {/* Background NoraClass luminous orbs & dot grid */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-blue-400/12 dark:bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-1/4 -right-32 h-[520px] w-[520px] rounded-full bg-indigo-400/10 dark:bg-indigo-600/15 blur-[130px]" />
        <div className="absolute -bottom-24 left-1/3 h-[460px] w-[460px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/10 blur-[100px]" />
        {/* Fine NoraClass dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_60%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Badge, CTAs, Trust Proof */}
          <motion.div
            className="flex flex-col gap-6 text-center lg:text-left lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Pill Badge */}
            <motion.div
              className="inline-flex self-center lg:self-start items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 dark:border-blue-800/60 dark:bg-blue-950/50 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-xs backdrop-blur-md"
              whileHover={{ scale: 1.03 }}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span>
                {locale === "vi"
                  ? "Nền tảng học Toán & Khoa học tương tác 3D & AI K-9"
                  : "Next-Gen K-9 3D & AI STEM Learning Platform"}
              </span>
            </motion.div>

            {/* Display Headline */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold leading-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-[46px] xl:text-[50px]">
                {locale === "vi" ? (
                  <>
                    <span className="block">
                      Cùng thầy cô tạo những điều kì diệu khi{" "}
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                        dạy học
                      </span>
                    </span>
                    <span className="mt-2 block text-xl sm:text-2xl lg:text-[30px] font-semibold text-neutral-700 dark:text-slate-300">
                      Khám phá trực quan • Học tương tác 3D • K-9 STEM
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block">
                      Creating educational wonders together in{" "}
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                        classrooms
                      </span>
                    </span>
                    <span className="mt-2 block text-xl sm:text-2xl lg:text-[30px] font-semibold text-neutral-700 dark:text-slate-300">
                      Visual Discovery • 3D Interactive • K-9 STEM
                    </span>
                  </>
                )}
              </h1>
            </div>

            {/* Description */}
            <p className="max-w-xl mx-auto lg:mx-0 text-sm leading-relaxed text-neutral-600 dark:text-slate-300 sm:text-base md:text-lg font-normal">
              {locale === "vi"
                ? "Nền tảng học Toán và Khoa học tương tác sáng tạo dành cho học sinh và giáo viên các cấp. Bộ giải pháp thư viện bài giảng 3D, bảng trắng tương tác, video ngắt đố và phòng lab ảo kết hợp trợ lý Nora AI trong một nơi duy nhất."
                : "An all-in-one interactive STEM platform for K-9 teachers and students: 3D lessons, digital whiteboard, checkpoint videos, and virtual simulations powered by Nora AI."}
            </p>

            {/* CTAs (NoraClass Style) */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{locale === "vi" ? "Đăng ký miễn phí" : "Get Started Free"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 text-sm font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span>{locale === "vi" ? "Dành cho trường học & LMS" : "For Schools & LMS"}</span>
              </Link>
            </div>

            {/* Trust and Social Proof bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-950">
                  A
                </div>
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-950">
                  B
                </div>
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-950">
                  C
                </div>
                <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px] ring-2 ring-white dark:ring-slate-950">
                  +10k
                </div>
              </div>
              <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-amber-500">★★★★★</span>
                <span>
                  {locale === "vi"
                    ? "10,000+ học sinh & giáo viên tin dùng"
                    : "10,000+ Students & Teachers"}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 p-3 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                  500+
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("hero.stat.lessons")}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 p-3 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  120+
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("hero.stat.models")}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 p-3 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  24/7
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("hero.stat.ai")}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive NoraClass Canvas Showcase */}
          <motion.div
            className="lg:col-span-6 relative"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          >
            {/* Outer Decorative Glow */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 blur-2xl -z-10" />

            {/* NoraClass Canvas Card Container */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* NoraClass Window Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    SmartExplorer Studio
                  </span>
                </div>

                {/* Tab Switcher inside Canvas */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("3d")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      activeTab === "3d"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Studio</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("video")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      activeTab === "video"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{locale === "vi" ? "Video đố" : "Interactive"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("ai")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      activeTab === "ai"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Nora AI</span>
                  </button>
                </div>
              </div>

              {/* Canvas Content Area */}
              <div className="relative p-5 sm:p-6 min-h-[360px] flex flex-col justify-between bg-slate-50/40 dark:bg-slate-900/40">
                <AnimatePresence mode="wait">
                  {/* TAB 1: 3D MODEL STUDIO */}
                  {activeTab === "3d" && (
                    <motion.div
                      key="tab-3d"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-4 h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60">
                              Biology · Sinh học K-8
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              Model #BIO-304
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            DNA Double Helix — Cấu trúc xoắn kép ADN
                          </h3>
                        </div>

                        {/* Interactive Canvas Controls */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                          <button
                            onClick={handleRotate}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Xoay mô hình"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleZoom}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Phóng to / Thu nhỏ"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 3D Visual Sandbox with Interactive Rotation */}
                      <div className="relative h-56 w-full rounded-2xl bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

                        {/* Simulated 3D Model with live rotation */}
                        <motion.div
                          animate={{
                            rotateY: rotationAngle,
                            scale: zoomLevel,
                          }}
                          transition={{ type: "spring", stiffness: 120, damping: 15 }}
                          className="relative flex items-center justify-center cursor-grab active:cursor-grabbing"
                        >
                          <Image
                            src="/hero-illustration.png"
                            alt="3D STEM Model"
                            width={180}
                            height={180}
                            className="object-contain drop-shadow-[0_15px_30px_rgba(56,189,248,0.4)]"
                            priority
                          />
                        </motion.div>

                        {/* Interactive floating annotations like NoraClass */}
                        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-cyan-300 font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                          <span>Góc xoay: {rotationAngle}°</span>
                        </div>

                        <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] text-white font-medium flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-400" />
                          <span>Sugar-Phosphate Backbone</span>
                        </div>
                      </div>

                      {/* Part tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="font-semibold text-slate-500">Thành phần:</span>
                        <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full font-medium text-slate-700 dark:text-slate-300">
                          Adenine (A)
                        </span>
                        <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full font-medium text-slate-700 dark:text-slate-300">
                          Thymine (T)
                        </span>
                        <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full font-medium text-slate-700 dark:text-slate-300">
                          Hydrogen Bonds
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: INTERACTIVE VIDEO QUIZ */}
                  {activeTab === "video" && (
                    <motion.div
                      key="tab-video"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-3.5 h-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                          {locale === "vi" ? "Video dừng lại đặt câu hỏi" : "Checkpoint Video Quiz"}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> +20 XP
                        </span>
                      </div>

                      {/* Video Player Mockup with Checkpoint Prompt */}
                      <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white overflow-hidden">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="flex items-center gap-1.5 font-bold text-white">
                            <Play className="w-3.5 h-3.5 text-blue-400 fill-current" />
                            Toán Lớp 6: Phân số & Tỉ số phần trăm
                          </span>
                          <span>02:45 / 08:30</span>
                        </div>

                        {/* Progress bar with pause checkpoint */}
                        <div className="relative h-2 w-full bg-slate-800 rounded-full my-3 overflow-hidden">
                          <div className="absolute top-0 left-0 bottom-0 w-[45%] bg-blue-500 rounded-full" />
                          <div className="absolute top-0 left-[45%] h-full w-2 bg-amber-400 rounded-full animate-pulse" />
                        </div>

                        {/* Interactive question popup right in the video */}
                        <div className="rounded-xl bg-slate-800/90 border border-slate-700 p-3 mt-2 backdrop-blur-md">
                          <p className="text-xs font-bold text-amber-300 flex items-center gap-1 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {locale === "vi"
                              ? "Dừng lại: Chọn đáp án đúng để xem tiếp video:"
                              : "Checkpoint: Choose the correct answer to resume:"}
                          </p>
                          <p className="text-xs font-medium text-slate-200 mb-2.5">
                            {locale === "vi"
                              ? "Phân số nào sau đây tối giản và bằng 0.75?"
                              : "Which fraction is simplified and equals 0.75?"}
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 1, label: "3/4", correct: true },
                              { id: 2, label: "6/8", correct: false },
                              { id: 3, label: "75/100", correct: false },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setQuizAnswered(opt.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  quizAnswered === opt.id
                                    ? opt.correct
                                      ? "bg-emerald-600 text-white"
                                      : "bg-rose-600 text-white"
                                    : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {quizAnswered === 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {locale === "vi"
                                ? "Chính xác! 3/4 = 0.75. Bạn nhận được +20 XP."
                                : "Correct! 3/4 = 0.75. You earned +20 XP."}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: NORA AI TUTOR */}
                  {activeTab === "ai" && (
                    <motion.div
                      key="tab-ai"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-3 h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Nora AI Assistant
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-semibold">
                              ● Đang trực tuyến 24/7
                            </span>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-lg">
                          <Volume2 className="w-3.5 h-3.5" />
                          Phát âm
                        </button>
                      </div>

                      {/* Chat Bubbles */}
                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="self-end max-w-[85%] rounded-2xl rounded-tr-xs bg-blue-600 text-white p-3 shadow-xs">
                          {locale === "vi"
                            ? "Tại sao trọng lượng của ta trên Mặt Trăng lại nhẹ hơn Trái Đất?"
                            : "Why is our weight on the Moon less than on Earth?"}
                        </div>

                        <div className="self-start max-w-[90%] rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-3 shadow-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          <p className="font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {locale === "vi" ? "Nora AI giải thích:" : "Nora AI explains:"}
                          </p>
                          {locale === "vi"
                            ? "Vì khối lượng Mặt Trăng chỉ bằng 1/81 khối lượng Trái Đất, nên lực hấp dẫn (Gravity) ở bề mặt Mặt Trăng chỉ bằng 1/6 so với Trái Đất. Do đó, nếu bạn nặng 60kg trên Trái Đất, trên Mặt Trăng bạn chỉ nặng khoảng 10kg!"
                            : "Because the Moon's mass is only about 1/81 of Earth's, surface gravity is roughly 1/6th of Earth's. If you weigh 60kg on Earth, you will weigh about 10kg on the Moon!"}
                        </div>
                      </div>

                      {/* Prompt suggestion chip */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 overflow-x-auto">
                        <span className="font-semibold shrink-0">Gợi ý:</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap cursor-pointer hover:bg-blue-50 hover:text-blue-600">
                          Giải thích Định luật Newton
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap cursor-pointer hover:bg-blue-50 hover:text-blue-600">
                          Tạo bài tập tương tự
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Canvas Footer Bar */}
              <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">
                    {locale === "vi" ? "Học liệu tương tác chuẩn K-9" : "Interactive K-9 Learning"}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Chuẩn GDPT 2018
                  </span>
                </div>
              </div>
            </div>

            {/* Floating NoraClass Interactive Badges */}
            <motion.div
              className="absolute -left-5 top-20 hidden md:flex items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  3D View
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-white">
                  Xoay & bóc tách 360°
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-5 bottom-12 hidden md:flex items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hiệu quả
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-white">
                  +98% Hiểu bài nhanh hơn
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
