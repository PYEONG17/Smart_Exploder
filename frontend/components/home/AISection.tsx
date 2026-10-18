"use client";
import * as React from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { motion } from "motion/react";
import {
  Bot,
  Sparkles,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Zap,
  BookOpen,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

/**
 * AI Section: Redesigned with authentic NoraClass aesthetic.
 * Showcases Nora AI 24/7 bilingual STEM personal tutor.
 */
export default function AISection() {
  const { locale } = useLang();
  const [selectedPrompt, setSelectedPrompt] = React.useState<number>(0);

  const samplePrompts = [
    {
      qVi: "Tại sao 2/3 + 1/4 không bằng 3/7?",
      qEn: "Why is 2/3 + 1/4 not equal to 3/7?",
      aVi: "Khi cộng phân số khác mẫu, ta không được cộng tử với tử, mẫu với mẫu. Em cần quy đồng mẫu số chung trước (mẫu số chung nhỏ nhất của 3 và 4 là 12):",
      aEn: "When adding fractions with different denominators, you cannot just add numerators and denominators. First find the common denominator (LCM of 3 and 4 is 12):",
      math: "2/3 + 1/4 = 8/12 + 3/12 = 11/12",
      tipVi: "Mẹo nhỏ: 11/12 là phân số tối giản vì 11 và 12 là số nguyên tố cùng nhau!",
      tipEn: "Quick tip: 11/12 is fully simplified because 11 and 12 are coprime!",
    },
    {
      qVi: "Giải thích quá trình Quang hợp bằng tiếng Anh?",
      qEn: "Explain photosynthesis in simple English?",
      aVi: "Photosynthesis (Quang hợp) là quá trình thực vật dùng ánh sáng mặt trời, nước (H₂O) và khí carbonic (CO₂) để tạo ra đường glucose và giải phóng khí oxy (O₂).",
      aEn: "Photosynthesis is the process where plants use sunlight, water (H₂O), and carbon dioxide (CO₂) to produce glucose and release oxygen (O₂).",
      math: "6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂",
      tipVi: "Thuật ngữ Cambridge: Chlorophyll (Diệp lục), Stomata (Khí khổng).",
      tipEn: "Cambridge key terms: Chlorophyll, Stomata, Chloroplast.",
    },
    {
      qVi: "Định lý Pythagore áp dụng khi nào?",
      qEn: "When does the Pythagorean Theorem apply?",
      aVi: "Định lý Pythagore chỉ áp dụng cho tam giác vuông! Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.",
      aEn: "The Pythagorean Theorem only applies to right-angled triangles! In any right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.",
      math: "a² + b² = c²  (c là cạnh huyền / hypotenuse)",
      tipVi: "Bộ ba Pythagore kinh điển: (3, 4, 5), (5, 12, 13).",
      tipEn: "Common Pythagorean triples: (3, 4, 5), (5, 12, 13).",
    },
  ];

  const current = samplePrompts[selectedPrompt];

  const aiCapabilities = [
    {
      titleVi: "Giải thích từng bước bằng ngôn ngữ dễ hiểu",
      titleEn: "Step-by-step explanations in plain language",
      descVi: "Không đưa đáp án cụt ngủn, AI hướng dẫn tư duy như gia sư riêng.",
      descEn: "Instead of raw answers, AI guides thinking like a patient tutor.",
    },
    {
      titleVi: "Phân tích chính xác bước làm sai",
      titleEn: "Pinpoints exactly where you went wrong",
      descVi: "Chỉ ra học sinh bị nhầm ở phép tính hay định lý nào để sửa ngay.",
      descEn: "Identifies whether confusion came from calculation or theorem.",
    },
    {
      titleVi: "Hỗ trợ song ngữ Anh – Việt & Phát âm",
      titleEn: "Bilingual English – Vietnamese & Pronunciation",
      descVi: "Vừa giỏi Toán – Khoa học vừa thông thạo thuật ngữ tiếng Anh.",
      descEn: "Master STEM subjects while building fluent technical English.",
    },
    {
      titleVi: "Tự động tạo bài tập tương tự để luyện",
      titleEn: "Generates custom follow-up exercises",
      descVi: "Củng cố kiến thức tức thì cho đến khi học sinh thành thạo.",
      descEn: "Reinforces concepts with custom practice until mastered.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left: NoraClass Interactive AI Chat Sandbox */}
          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 blur-2xl -z-10" />

            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Nora AI STEM Tutor
                      </h3>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === "vi" ? "Gia sư song ngữ 24/7" : "24/7 Bilingual STEM Tutor"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>GPT-4o STEM</span>
                </div>
              </div>

              {/* Chat View Area */}
              <div className="p-5 sm:p-6 bg-slate-50/30 dark:bg-slate-900/40 min-h-[350px] flex flex-col justify-between">
                <div className="space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-blue-600 text-white px-4 py-3 text-xs sm:text-sm font-medium shadow-xs">
                      {locale === "vi" ? current.qVi : current.qEn}
                    </div>
                  </div>

                  {/* AI Response Card */}
                  <motion.div
                    key={selectedPrompt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[95%] rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          {locale === "vi" ? "Hướng dẫn giải chi tiết:" : "Step-by-step Solution:"}
                        </span>
                        <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600">
                          <Volume2 className="w-3.5 h-3.5" />
                          Audio
                        </button>
                      </div>

                      <p className="leading-relaxed font-normal">
                        {locale === "vi" ? current.aVi : current.aEn}
                      </p>

                      <div className="rounded-xl bg-blue-50/60 dark:bg-slate-900/80 border border-blue-200/60 dark:border-slate-700 p-2.5 font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                        {current.math}
                      </div>

                      <div className="rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>{locale === "vi" ? current.tipVi : current.tipEn}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Prompt selector pills */}
                <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {locale === "vi" ? "Câu hỏi mẫu:" : "Sample Questions:"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {samplePrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPrompt(idx)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                          selectedPrompt === idx
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                        }`}
                      >
                        {idx === 0
                          ? locale === "vi" ? "Phép cộng phân số" : "Fractions"
                          : idx === 1
                          ? locale === "vi" ? "Quang hợp" : "Photosynthesis"
                          : locale === "vi" ? "Định lý Pythagore" : "Pythagoras"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Tutor Feature List & CTAs */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50 dark:border-cyan-800/60 dark:bg-cyan-950/50 px-4 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 backdrop-blur-sm">
              <Bot className="h-3.5 w-3.5 text-cyan-600" />
              <span>Nora AI Tutor Assistant</span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
              {locale === "vi" ? (
                <>
                  Học cùng gia sư AI{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    thông minh & tận tâm
                  </span>
                </>
              ) : (
                <>
                  Learn with an AI Tutor{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    that truly understands
                  </span>
                </>
              )}
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {locale === "vi"
                ? "Nora AI không chỉ trả lời câu hỏi mà còn đồng hành như một người bạn học: phân tích lỗi sai, giải thích tư duy và hướng dẫn cách phát âm thuật ngữ tiếng Anh chuẩn chỉnh."
                : "Nora AI goes beyond answering — it diagnoses misconceptions, guides deductive reasoning, and trains authentic scientific English pronunciation."}
            </p>

            {/* Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {aiCapabilities.map((cap, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 transition-all hover:bg-white dark:hover:bg-slate-900 hover:border-blue-300 hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {locale === "vi" ? cap.titleVi : cap.titleEn}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-normal pl-6">
                    {locale === "vi" ? cap.descVi : cap.descEn}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Link
                href="/ai"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Bot className="w-4 h-4" />
                <span>
                  {locale === "vi" ? "Trò chuyện cùng Nora AI" : "Chat with Nora AI"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
