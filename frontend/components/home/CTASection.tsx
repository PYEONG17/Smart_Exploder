"use client";
import * as React from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { ArrowRight, Sparkles, BookOpen, Check } from "lucide-react";

/**
 * CTA Section: Account creation and course discovery banner.
 */
export default function CTASection() {
  const { locale } = useLang();

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors border-t border-neutral-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
