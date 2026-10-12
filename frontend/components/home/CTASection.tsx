"use client";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { motion } from "motion/react";
import { ArrowRight, Rocket } from "lucide-react";

/**
 * CTA Section – Final call-to-action with Sci-Fi neon aesthetic.
 */
export default function CTASection() {
  const { t } = useLang();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#060d1f] via-[#0a1535] to-[#080f28] px-8 py-16 text-center md:px-16 md:py-24"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated background blobs */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-600/25 blur-[90px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -60, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-600/20 blur-[90px]"
          />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/8 blur-[120px]" />

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,179,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,179,237,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_50%,#000_50%,transparent_100%)]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-7">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300 backdrop-blur-xl">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-cyan-400"
              />
              {t("cta.badge")}
            </div>

            <h2 className="max-w-2xl text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              {t("cta.title1")}{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                {t("cta.title2")}
              </span>
            </h2>

            <p className="max-w-xl text-lg leading-relaxed text-slate-300/90">
              {t("cta.desc")}
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-[0_0_32px_rgba(59,130,246,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(59,130,246,0.65)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Rocket className="h-4 w-4" />
                {t("cta.register")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-8 py-4 text-sm font-bold text-white backdrop-blur-xl transition-all duration-300 hover:border-white/28 hover:bg-white/10"
              >
                {t("cta.courses")}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
