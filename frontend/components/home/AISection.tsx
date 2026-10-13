"use client";
import { useLang } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

/**
 * AI Learning Assistant Section: Highlights the AI tutoring feature.
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
    <section className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Chat UI mockup */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-3xl -z-10" />
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">SmartExplorer AI</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("ai_section.online")}
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex flex-col gap-4 p-4 min-h-[260px]">
                {/* User Q1 */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                    {t("ai_section.chat.q1")}
                  </div>
                </div>

                {/* AI answer */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground leading-relaxed">
                    <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">{t("ai_section.chat.label")}</p>
                    {t("ai_section.chat.a1")}
                    <div className="mt-2 rounded-lg bg-background border border-border p-2 font-mono text-xs">
                      2/3 + 1/4 = 8/12 + 3/12 = <strong>11/12</strong>
                    </div>
                  </div>
                </div>

                {/* User Q2 */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                    {t("ai_section.chat.q2")}
                  </div>
                </div>

                {/* AI typing indicator */}
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
                  <input
                    readOnly
                    value={t("ai_section.input_ph")}
                    className="flex-1 bg-transparent text-sm text-muted-foreground outline-none cursor-default"
                  />
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text content */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-600 dark:text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {t("ai_section.badge")}
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("ai_section.title1")}{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                {t("ai_section.title2")}
              </span>
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">{t("ai_section.desc")}</p>

            <ul className="flex flex-col gap-3">
              {capKeys.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span className="text-muted-foreground">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
