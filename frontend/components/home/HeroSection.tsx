"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useLang } from "@/contexts/LanguageContext";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

/**
 * Hero Section: First impression of SmartExplorer.
 * Sci-Fi AI aesthetic with glassmorphism and neon accents.
 */
export default function HeroSection() {
  const { t, locale } = useLang();

  return (
    <section className="relative isolate overflow-hidden bg-[#060d1f] py-20 text-white md:py-32">
      {/* ── Animated neon background blobs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Primary blue blob */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-blue-600/25 blur-[130px]"
        />
        {/* Violet blob */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -70, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-32 h-[650px] w-[650px] rounded-full bg-violet-600/20 blur-[120px]"
        />
        {/* Cyan accent */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], y: [0, -60, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-[110px]"
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,179,237,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,179,237,0.04)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)]" />
        
        {/* Scan-line glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-transparent to-violet-950/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* ── Left: Text content ── */}
          <motion.div
            className="flex flex-col gap-6 text-center lg:text-left"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            {/* AI badge */}
            <motion.div
              className="inline-flex self-center items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 backdrop-blur-xl lg:self-start"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-cyan-400"
              />
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {t("hero.badge")}
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
              Explore.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(99,179,237,0.4)]">
                {locale === "vi" ? "Khám phá." : "Learn."}
              </span>{" "}
              <br />
              <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                {locale === "vi" ? "Bứt phá." : "Grow beyond."}
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto max-w-xl text-base leading-8 text-slate-300/90 md:text-lg lg:mx-0">
              {t("hero.desc")}
            </p>

            {/* CTA Buttons */}
            <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-[0_0_32px_rgba(59,130,246,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(59,130,246,0.65)] active:translate-y-0"
              >
                {/* Shimmer effect */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {t("hero.cta.start")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] px-8 py-4 text-sm font-bold text-white backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/10"
              >
                {t("hero.cta.explore")}
              </Link>
            </div>

            {/* Stats – Glassmorphism card */}
            <motion.div
              className="mx-auto mt-8 flex max-w-sm items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {[
                { value: "500+", label: t("hero.stat.lessons"), color: "text-cyan-300" },
                { value: "3D", label: t("hero.stat.models"), color: "text-violet-300" },
                { value: "AI", label: t("hero.stat.ai"), color: "text-blue-300" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  {i > 0 && <div className="absolute h-10 w-px bg-white/10" />}
                  <div className={`text-3xl font-black tracking-tighter ${stat.color}`} style={{ textShadow: "0 0 20px currentColor" }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Hero illustration ── */}
          <motion.div
            className="flex items-center justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
          >
            <motion.div
              className="relative h-72 w-72 md:h-96 md:w-96 lg:h-[520px] lg:w-[520px]"
              animate={{ y: [-18, 18, -18] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Neon glow behind image */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/40 via-cyan-500/25 to-violet-600/35 blur-3xl" />
              <Image
                src="/hero-illustration.png"
                alt="STEM learning 3D illustration"
                fill
                className="relative z-10 object-contain drop-shadow-[0_20px_60px_rgba(59,130,246,0.5)]"
                priority
              />
              {/* Floating card: Today's lesson */}
              <motion.div
                className="absolute -left-6 top-16 z-20 hidden rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 shadow-2xl shadow-blue-950/50 backdrop-blur-xl sm:block"
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    {locale === "vi" ? "Học hôm nay" : "Today's learning"}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {locale === "vi" ? "Toán + Khoa học" : "Math + Science"}
                </div>
              </motion.div>
              {/* Floating card: Progress */}
              <motion.div
                className="absolute -right-4 bottom-14 z-20 hidden rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 shadow-2xl shadow-blue-950/50 backdrop-blur-xl sm:block"
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/20 text-amber-300 text-base">
                    ✦
                  </span>
                  {locale === "vi" ? "Tiến bộ mỗi ngày" : "A little better daily"}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
