"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

const links = [
  { href: "/lab", vi: "Phòng Lab", en: "Virtual Lab" },
  { href: "/explore", vi: "Khám phá học liệu", en: "Explore resources" },
  { href: "/courses", vi: "Khóa học", en: "Courses" },
  { href: "/whiteboard", vi: "Bảng trắng số", en: "Whiteboard" },
  { href: "/ai", vi: "Trợ lý AI", en: "AI assistant" },
];

export default function Footer() {
  const { locale } = useLang();

  return (
    <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              width={30}
              height={30}
              alt="SmartExplorer"
              className="rounded-lg"
            />
            <span className="font-black text-slate-900 dark:text-white">
              SmartExplorer
            </span>
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {locale === "vi"
              ? "Nền tảng học tập với phòng Lab mô phỏng, học liệu khám phá và công cụ hỗ trợ học tập."
              : "A learning platform with virtual labs, explorable resources, and study tools."}
          </p>
        </div>
        <nav aria-label={locale === "vi" ? "Liên kết chính" : "Main links"}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {locale === "vi" ? link.vi : link.en}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
