"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, FlaskConical } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const { locale } = useLang();
  const isVietnamese = locale === "vi";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pb-16 pt-28 dark:from-slate-950 dark:via-[#0c1222] dark:to-slate-950 sm:pb-20 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] opacity-20 [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_75%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <BookOpenCheck className="h-4 w-4" />
            {isVietnamese
              ? "Học liệu và công cụ học tập tương tác"
              : "Interactive learning resources and tools"}
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            {isVietnamese ? (
              <>
                Khám phá kiến thức
                <span className="mt-1 block bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  bằng trải nghiệm tương tác
                </span>
              </>
            ) : (
              <>
                Explore learning
                <span className="mt-1 block bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  through interaction
                </span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 lg:mx-0 sm:text-lg">
            {isVietnamese
              ? "SmartExplorer kết hợp thí nghiệm mô phỏng, học liệu khám phá, khóa học và công cụ học tập trong một nền tảng song ngữ."
              : "SmartExplorer brings together virtual experiments, explorable learning resources, courses, and study tools in one bilingual platform."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FlaskConical className="h-4 w-4" />
              {isVietnamese ? "Khám phá phòng Lab" : "Explore the Lab"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {isVietnamese ? "Duyệt học liệu" : "Browse resources"}
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            {isVietnamese
              ? "Có thể xem và thử mô phỏng mẫu ngay bên dưới."
              : "Scroll down to try a sample simulation."}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-cyan-400/20 blur-2xl" />
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {isVietnamese ? "Phòng Lab tương tác" : "Interactive Lab"}
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {isVietnamese ? "Mô phỏng mẫu" : "Sample simulation"}
              </span>
            </div>
            <div className="p-3 sm:p-5">
              <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {isVietnamese
                  ? "Bản xem thử Định luật Ôm. Điều chỉnh hiệu điện thế hoặc điện trở để xem cường độ dòng điện được tính lại."
                  : "Ohm's law preview. Adjust voltage or resistance to recalculate the current."}
              </p>
              <Link
                href="/lab"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline dark:text-blue-300"
              >
                {isVietnamese ? "Mở phòng Lab đầy đủ" : "Open the full Lab"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
