"use client";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

/**
 * CTA Section: Final call-to-action before footer.
 */
export default function CTASection() {
  const { t } = useLang();

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-8 py-16 text-center md:px-16 md:py-20">
          {/* Background blobs */}
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
              {t("cta.badge")}
            </div>

            <h2 className="max-w-2xl text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
              {t("cta.title1")}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {t("cta.title2")}
              </span>
            </h2>

            <p className="max-w-xl text-slate-300 text-lg leading-relaxed">{t("cta.desc")}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all duration-200 hover:-translate-y-0.5"
              >
                {t("cta.register")}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
              >
                {t("cta.courses")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
