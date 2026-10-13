"use client";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Footer: Site-wide footer with links and branding.
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
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" width={32} height={32} alt="SmartExplorer Logo" className="rounded-lg" />
              <span className="text-lg font-bold text-foreground">
                Smart<span className="text-blue-500">Explorer</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t("footer.desc")}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("footer.bilingual")}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.catKey}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t(section.catKey)}</h3>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-center md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} SmartExplorer. {t("footer.copy")}
          </p>
          <p className="text-xs text-muted-foreground">{t("footer.tech")}</p>
        </div>
      </div>
    </footer>
  );
}
