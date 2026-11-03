"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical, MousePointer2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import HomeSimulationDemo from "@/components/home/HomeSimulationDemo";

export default function StudioShowcaseSection() {
  const { locale } = useLang();
  const isVietnamese = locale === "vi";

  return (
    <section className="border-t border-slate-100 bg-slate-50/70 py-16 dark:border-slate-900 dark:bg-[#0b0f19] sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-6 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200">
            <FlaskConical className="h-4 w-4" />
            {isVietnamese ? "Demo chạy bằng Lab Engine" : "Powered by the Lab Engine"}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {isVietnamese ? "Thử một mô phỏng thật" : "Try a real simulation"}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            {isVietnamese
              ? "Đây là bản xem thử Định luật Ôm dùng cùng bộ điều khiển và bộ tính công thức đang dùng trong Lab. Kéo thanh trượt để thay đổi hiệu điện thế hoặc điện trở và xem kết quả cập nhật."
              : "This Ohm's law preview uses the same controls and formula engine as the Lab. Adjust voltage or resistance and see the calculated result update."}
          </p>
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <MousePointer2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
            <span>
              {isVietnamese
                ? "Đây là cấu hình mẫu để trải nghiệm, không phải một bài nộp hay dữ liệu học tập được lưu."
                : "This is a sample configuration for preview, not a saved assignment or learning record."}
            </span>
          </div>
          <Link
            href="/lab"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline dark:text-blue-300"
          >
            {isVietnamese ? "Xem các bài Lab hiện có" : "Browse available Labs"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="lg:col-span-7">
          <HomeSimulationDemo />
        </div>
      </div>
    </section>
  );
}
