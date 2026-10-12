"use client";
import { useLang } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import { motion } from "motion/react";
import { Bot, Sparkles, Check } from "lucide-react";

/**
 * AI Section – Showcases SmartExplorer AI tutor.
 * Sci-Fi chat mockup with neon glow and glassmorphism.
 */
export default function AISection() {
  const { t } = useLang();

  const capKeys: TranslationKey[] = [
    "ai_section.cap1",
    "ai_section.cap2",
    "ai_section.cap3",
    "ai_section.cap4",
    "ai_section.cap5",
    "ai_section.cap6",
  ];

  return (
    <section className="relative py-20 md:py-28">
      {/* Section background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-cyan-600/8 blur-[140px]" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/7 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          
          {/* ── Left: AI Chat mockup ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            {/* Outer glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-600/20 via-blue-600/15 to-violet-600/15 blur-2xl" />

            {/* Chat window */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1526]/95 shadow-2xl shadow-blue-950/50 backdrop-blur-2xl">
              {/* Window chrome dots */}
              <div className="flex items-center gap-1.5 border-b border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <div className="ml-3 flex flex-1 items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">SmartExplorer AI</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      />
                      {t("ai_section.online")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Groq
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex min-h-[280px] flex-col gap-4 p-5">
                {/* User Q1 */}
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-600/25">
                    {t("ai_section.chat.q1")}
                  </div>
                </motion.div>

                {/* AI answer */}
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.06] px-4 py-2.5 text-sm text-slate-200 leading-relaxed backdrop-blur-sm">
                    <p className="mb-1.5 font-semibold text-cyan-400">{t("ai_section.chat.label")}</p>
                    {t("ai_section.chat.a1")}
                    <div className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5 font-mono text-xs text-cyan-300">
                      2/3 + 1/4 = 8/12 + 3/12 = <strong className="text-white">11/12</strong>
                    </div>
                  </div>
                </motion.div>

                {/* User Q2 */}
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.65 }}
                >
                  <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-600/25">
                    {t("ai_section.chat.q2")}
                  </div>
                </motion.div>

                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                          className="h-2 w-2 rounded-full bg-cyan-400/60"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="border-t border-white/8 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm">
                  <input
                    readOnly
                    value={t("ai_section.input_ph")}
                    className="flex-1 bg-transparent text-sm text-slate-400 outline-none"
                  />
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-105">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Text content ── */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-semibold text-cyan-400">
              <Bot className="h-4 w-4" />
              {t("ai_section.badge")}
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {t("ai_section.title1")}{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {t("ai_section.title2")}
              </span>
            </h2>

            <p className="text-lg leading-relaxed text-muted-foreground">{t("ai_section.desc")}</p>

            <ul className="flex flex-col gap-3">
              {capKeys.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm shadow-cyan-500/30">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-muted-foreground">{t(key)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
