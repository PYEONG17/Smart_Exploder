"use client";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import { Zap } from "lucide-react";

/**
 * Footer – Sci-Fi minimal dark footer.
 */
export default function Footer() {
  const { t } = useLang();
  const currentYear = new Date().getFullYear();

  type FooterLink = { labelKey: TranslationKey; href: string };
  type FooterSection = { catKey: TranslationKey; links: FooterLink[] };

  const footerSections: FooterSection[] = [
    {
      catKey: "footer.col.learn",
      links: [
        { labelKey: "footer.link.courses", href: "/courses" },
        { labelKey: "footer.link.classes", href: "/classes" },
        { labelKey: "footer.link.lessons", href: "/lessons" },
        { labelKey: "footer.link.quiz", href: "/quiz" },
      ],
    },
    {
      catKey: "footer.col.resources",
      links: [
        { labelKey: "footer.link.3d", href: "/three-d" },
        { labelKey: "footer.link.ai", href: "/ai" },
        { labelKey: "footer.link.progress", href: "/progress" },
      ],
    },
    {
      catKey: "footer.col.account",
      links: [
        { labelKey: "footer.link.login", href: "/login" },
        { labelKey: "footer.link.register", href: "/register" },
        { labelKey: "footer.link.profile", href: "/profile" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-border/40 bg-card/40 backdrop-blur-xl">
      {/* Subtle top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-5 flex items-center gap-2.5">
              <Image src="/logo.png" width={32} height={32} alt="SmartExplorer Logo" className="rounded-xl shadow-lg" />
              <span className="text-lg font-bold text-foreground">
                Smart
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Explorer
                </span>
              </span>
            </Link>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t("footer.desc")}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-cyan-500" />
              {t("footer.bilingual")}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.catKey}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground/60">
                {t(section.catKey)}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-6 text-center md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} SmartExplorer.{" "}
            <span className="text-foreground/40">{t("footer.copy")}</span>
          </p>
          <p className="text-xs text-muted-foreground">{t("footer.tech")}</p>
        </div>
      </div>
    </footer>
  );
}
