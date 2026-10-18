"use client";
import * as React from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowRight, Sparkles, BookOpen, Check, School, ShieldCheck } from "lucide-react";

/**
 * CTA Section: Authentic NoraClass LMS Integration & Conversion Banner.
 */
export default function CTASection() {
  const { locale } = useLang();

  const lmsIntegrations = [
    {
      name: "Canvas LMS",
      badge: "LTI 1.3 Certified",
      descVi: "Học sinh có thể hoàn thành bài tập SmartExplorer thông qua Canvas và mở mô hình 3D trực tiếp.",
      descEn: "Complete assignments directly in Canvas and interact with hundreds of embedded 3D models.",
      color: "border-red-200/80 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 text-red-600 dark:text-red-400",
      accent: "#E72429",
      iconLetter: "C",
    },
    {
      name: "Google Classroom",
      badge: "One-Click Sync",
      descVi: "Đồng bộ danh sách học sinh một chạm, giao bài tập video ngắt đố và cập nhật điểm số theo thời gian thực.",
      descEn: "One-click roster import, assign interactive checkpoint videos, and sync grades in real-time.",
      color: "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
      accent: "#0F9D58",
      iconLetter: "G",
    },
    {
      name: "Moodle",
      badge: "SCORM & LTI",
      descVi: "Dễ dàng tích hợp kho học liệu tương tác, theo dõi tiến độ học tập và xuất báo cáo điểm số chi tiết.",
      descEn: "Seamlessly plug interactive courseware, track learning progress, and export detailed score reports.",
      color: "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
      accent: "#F98012",
      iconLetter: "M",
    },
    {
      name: "Microsoft Teams",
      badge: "Education App",
      descVi: "Chia sẻ bài giảng 3D, mở bảng trắng tương tác trực tiếp trong phòng học trực tuyến của Teams.",
      descEn: "Share 3D lessons, launch interactive whiteboards directly inside live Microsoft Teams classes.",
      color: "border-blue-200/80 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
      accent: "#464EB8",
      iconLetter: "T",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors border-t border-neutral-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Part 1: NoraClass LMS Integration Strip ── */}
        <div className="mb-20 text-center">
          <div className="inline-block rounded-full bg-blue-50 dark:bg-blue-950/60 px-4 py-1.5 mx-auto mb-4 border border-blue-200/70 dark:border-blue-800/60">
            <span className="font-semibold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              {locale === "vi" ? "✨ Dành cho trường học & Trung tâm STEM" : "✨ For Schools & STEM Centers"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white max-w-3xl mx-auto">
            {locale === "vi" ? (
              <>
                Sẵn sàng tích hợp và dễ dàng truy cập kho học liệu tương tác{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  vào LMS trường học
                </span>
              </>
            ) : (
              <>
                Ready to integrate and stream interactive courseware{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  into your School LMS
                </span>
              </>
            )}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-slate-400 max-w-2xl mx-auto">
            {locale === "vi"
              ? "SmartExplorer tương thích với các nền tảng quản lý học tập phổ biến nhất, giúp nhà trường triển khai số hóa bài giảng chuẩn GDPT 2018 chỉ trong 1 ngày."
              : "SmartExplorer seamlessly connects with the most popular LMS platforms for instant K-9 STEM rollout."}
          </p>

          <div className="flex justify-center gap-3 mt-6 mb-12 flex-wrap">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 text-sm shadow-md hover:shadow-lg transition-all"
            >
              <School className="w-4 h-4" />
              <span>{locale === "vi" ? "Giải pháp cho Trường học" : "Solutions for Schools"}</span>
            </Link>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 font-medium px-5 py-2.5 text-sm transition-all"
            >
              <span>{locale === "vi" ? "Đăng ký thử nghiệm" : "Request Free Demo"}</span>
            </Link>
          </div>

          {/* LMS Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {lmsIntegrations.map((lms, idx) => (
              <div
                key={idx}
                className="group rounded-3xl border border-neutral-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-xs"
                      style={{ backgroundColor: lms.accent }}
                    >
                      {lms.iconLetter}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
                      {lms.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {lms.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-slate-400">
                    {locale === "vi" ? lms.descVi : lms.descEn}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{locale === "vi" ? "Sẵn sàng đồng bộ" : "Ready to connect"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Part 2: High-Conversion NoraClass Action Banner ── */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 px-6 py-14 sm:px-12 md:py-20 text-center text-white shadow-2xl shadow-blue-500/20">
          {/* Decorative mesh glows */}
          <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />

          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200 animate-pulse" />
              <span>
                {locale === "vi"
                  ? "Khởi đầu trải nghiệm học tập thế hệ mới"
                  : "Start Your Next-Gen Learning Journey"}
              </span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl leading-tight">
              {locale === "vi" ? (
                <>
                  Sẵn sàng bứt phá cùng{" "}
                  <span className="underline decoration-cyan-300 decoration-wavy underline-offset-8">
                    SmartExplorer?
                  </span>
                </>
              ) : (
                <>
                  Ready to transform your learning with{" "}
                  <span className="underline decoration-cyan-300 decoration-wavy underline-offset-8">
                    SmartExplorer?
                  </span>
                </>
              )}
            </h2>

            <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal max-w-2xl">
              {locale === "vi"
                ? "Học Toán và Khoa học chưa bao giờ trực quan và hào hứng đến thế. Đăng ký ngay hôm nay để trải nghiệm miễn phí toàn bộ mô hình 3D, phòng lab ảo và gia sư Nora AI."
                : "Math and Science have never been this visual and captivating. Sign up today for free access to our 3D models and AI tutor."}
            </p>

            {/* Checkmark benefits */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-white/95">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-cyan-300" />
                {locale === "vi" ? "Miễn phí đăng ký" : "100% Free Signup"}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-cyan-300" />
                {locale === "vi" ? "Song ngữ Anh - Việt" : "Bilingual VI - EN"}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-cyan-300" />
                {locale === "vi" ? "Chuẩn GDPT 2018 & K-9" : "Aligned with K-9 Curriculum"}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-blue-600 shadow-xl hover:bg-neutral-50 transition-all hover:scale-105 active:scale-100"
              >
                <span>
                  {locale === "vi" ? "Tạo tài khoản miễn phí" : "Create Free Account"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all hover:scale-105 active:scale-100"
              >
                <BookOpen className="h-4 w-4" />
                <span>
                  {locale === "vi" ? "Khám phá học liệu" : "Explore Courses"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
