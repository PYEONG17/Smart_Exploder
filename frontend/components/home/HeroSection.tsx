"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Hero Section: First impression of SmartExplorer.
 */
export default function HeroSection() {
  const { t, locale } = useLang();

  return (
    <section className="relative isolate overflow-hidden bg-[#0b1530] py-20 text-white md:py-28">
      {/* Background decorative blobs with animation */}
      <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-blue-600/30 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], y: [0, -50, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[100px]" 
        />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: Text content */}
          <motion.div
            className="flex flex-col gap-6 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex self-center lg:self-start items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-md"
              whileHover={{ scale: 1.05 }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
              {t("hero.badge")}
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-7xl">
              Explore.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                {locale === "vi" ? "Khám phá." : "Learn."}
              </span>{" "}
              <br />
              {locale === "vi" ? "Bứt phá." : "Grow beyond."}
            </h1>

            {/* Description */}
            <p className="max-w-xl mx-auto text-base font-medium leading-8 text-slate-300 md:text-lg lg:mx-0">
              {t("hero.desc")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-4 text-sm font-bold text-white shadow-[0_16px_40px_-16px_rgba(34,211,238,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-14px_rgba(34,211,238,0.7)]"
              >
                {t("hero.cta.start")}
                <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-8 py-4 text-sm font-bold text-white backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/10"
              >
                {t("hero.cta.explore")}
              </Link>
            </div>

            {/* Stats (Glassmorphism card) */}
            <motion.div 
              className="mx-auto mt-8 flex max-w-md items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="text-center flex-1">
                <div className="text-3xl font-black bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">500+</div>
                <div className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mt-1">{t("hero.stat.lessons")}</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center flex-1">
                <div className="text-3xl font-black bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">3D</div>
                <div className="text-[10px] text-cyan-300 uppercase tracking-widest font-bold mt-1">{t("hero.stat.models")}</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center flex-1">
                <div className="text-3xl font-black bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">AI</div>
                <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold mt-1">{t("hero.stat.ai")}</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Hero illustration */}
          <motion.div
            className="flex items-center justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          >
            <motion.div
              className="relative h-72 w-72 md:h-96 md:w-96 lg:h-[500px] lg:w-[500px]"
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-indigo-500/30 blur-3xl mix-blend-screen" />
              <Image
                src="/hero-illustration.png"
                alt="STEM learning 3D illustration"
                fill
                className="relative z-10 object-contain drop-shadow-[0_20px_50px_rgba(0,163,255,0.4)]"
                priority
              />
              <div className="absolute -left-5 top-16 z-20 hidden rounded-2xl border border-white/15 bg-slate-900/75 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
                  {locale === "vi" ? "Học hôm nay" : "Today’s learning"}
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {locale === "vi" ? "Toán + Khoa học" : "Math + Science"}
                </div>
              </div>
              <div className="absolute -right-3 bottom-14 z-20 hidden rounded-2xl border border-white/15 bg-slate-900/75 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                    ✦
                  </span>
                  {locale === "vi" ? "Tiến bộ mỗi ngày" : "A little better daily"}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
