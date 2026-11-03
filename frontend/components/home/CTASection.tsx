"use client";

import Link from "next/link";
import { ArrowRight, Compass, FlaskConical } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function CTASection() {
  const { locale } = useLang();
  const isVietnamese = locale === "vi";

  return (
    <section className="bg-white py-14 dark:bg-slate-950 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-700 px-6 py-12 text-center text-white sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-bold text-cyan-100">
              {isVietnamese ? "Bắt đầu từ nội dung đang có" : "Start with what is available"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {isVietnamese
                ? "Chọn một bài Lab hoặc học liệu để khám phá"
                : "Choose a Lab or resource to explore"}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-blue-50 sm:text-base">
              {isVietnamese
                ? "Mở phòng Lab để thực hành mô phỏng, hoặc duyệt thư viện học liệu theo lớp và môn học."
                : "Open the Lab to try simulations, or browse learning resources by grade and subject."}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/lab"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                <FlaskConical className="h-4 w-4" />
                {isVietnamese ? "Mở phòng Lab" : "Open the Lab"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <Compass className="h-4 w-4" />
                {isVietnamese ? "Duyệt học liệu" : "Browse resources"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
