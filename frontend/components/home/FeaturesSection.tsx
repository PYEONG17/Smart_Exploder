"use client";
import * as React from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { motion } from "motion/react";
import {
  Box,
  PenTool,
  FlaskConical,
  Bot,
  Languages,
  Trophy,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/**
 * Features Section: Authentic NoraClass Expandable Accordion Suite.
 * Matches NoraClass's signature "Bộ công cụ sáng tạo cho giáo viên & học sinh".
 */
export default function FeaturesSection() {
  const { locale } = useLang();
  const [activeCard, setActiveCard] = React.useState<number | null>(0);

  const mainTools = [
    {
      id: "feature-3d",
      icon: Box,
      titleVi: "Bài giảng 3D",
      titleEn: "3D Interactive Lessons",
      descVi:
        "Soạn và học bài giảng ba chiều bằng thao tác xoay 360°, phóng to, bóc tách cơ quan sinh học, khối hình không gian và nguyên tử trực tiếp trong lớp học.",
      descEn:
        "Manipulate spatial 3D models with 360° rotation, explore organ layers, cell biology, and 3D geometry in real-time.",
      badgeVi: "Bóc tách 360°",
      badgeEn: "360° Dissect",
      bulletsVi: [
        "Xoay, thu phóng và bóc tách cấu trúc 3D",
        "Chú thích thuật ngữ tiếng Anh song ngữ chuẩn xác",
        "Trực quan hóa khối hình học không gian & thiên văn",
      ],
      bulletsEn: [
        "Rotate, zoom and dissect 3D structures",
        "Bilingual scientific terminology labels",
        "Spatial geometry and astronomy visualization",
      ],
      href: "/three-d",
      previewType: "3d",
    },
    {
      id: "feature-whiteboard",
      icon: PenTool,
      titleVi: "Bảng trắng tương tác",
      titleEn: "Interactive Whiteboard",
      descVi:
        "Bảng vẽ số giúp giáo viên và học sinh ghi chú, minh họa hình vẽ, giải phương trình và trình bày trực quan như trên bảng lớp thật.",
      descEn:
        "Digital canvas for live notes, math formulas, dynamic geometry sketches, and active classroom presentations.",
      badgeVi: "Bảng vẽ số",
      badgeEn: "Live Canvas",
      bulletsVi: [
        "Bút vẽ vector, thước kẻ và compa kỹ thuật số",
        "Soạn công thức Toán và vẽ đồ thị hàm số",
        "Lưu trữ bài giảng và tái sử dụng cho các lớp sau",
      ],
      bulletsEn: [
        "Digital geometry tools, rulers & compass",
        "Math equation solver and function grapher",
        "Export and share board notes with students",
      ],
      href: "/courses",
      previewType: "whiteboard",
    },
    {
      id: "feature-simulation",
      icon: FlaskConical,
      titleVi: "Thí nghiệm mô phỏng",
      titleEn: "Virtual Simulation Lab",
      descVi:
        "Phòng thí nghiệm ảo an toàn tuyệt đối cho Vật lý, Hóa học và Sinh học. Học sinh tự do điều chỉnh thông số và quan sát hiện tượng khoa học kỳ thú.",
      descEn:
        "Safe virtual science laboratory for physics, chemistry, and biology. Adjust parameters and observe real scientific phenomena.",
      badgeVi: "Phòng Lab ảo",
      badgeEn: "Virtual Lab",
      bulletsVi: [
        "Mô phỏng con lắc đơn, quang học khúc xạ & phản ứng hóa học",
        "Điều chỉnh biến số nhiệt độ, áp suất, gia tốc trọng trường",
        "Không rủi ro cháy nổ, học sinh thoải mái thử sai và rút kinh nghiệm",
      ],
      bulletsEn: [
        "Pendulum motion, optics refraction & chemical reactions",
        "Adjust temperature, gravity, and mass parameters",
        "100% safe exploration with real-time graphs",
      ],
      href: "/three-d",
      previewType: "simulation",
    },
  ];

  const secondaryFeatures = [
    {
      icon: Bot,
      titleVi: "Trợ lý Nora AI 24/7",
      titleEn: "24/7 Nora AI STEM Tutor",
      descVi:
        "Hiểu cặn kẽ điểm nghẽn của từng học sinh, giải thích từng bước bằng ngôn ngữ dễ hiểu và luyện phát âm từ vựng chuẩn Cambridge.",
      descEn:
        "Personalized AI tutor that identifies student hurdles, guides step-by-step, and trains bilingual STEM speech.",
      badgeVi: "Gia sư AI",
      badgeEn: "AI Tutor",
      color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-200/60",
      href: "/ai",
    },
    {
      icon: Languages,
      titleVi: "Chương trình Song ngữ Anh – Việt",
      titleEn: "Bilingual English – Vietnamese",
      descVi:
        "Học Toán và Khoa học song ngữ giúp học sinh tự tin hội nhập, tra cứu thuật ngữ quốc tế chuẩn xác theo khung GDPT 2018.",
      descEn:
        "Learn Math and Science bilingually to gain confidence with international STEM terminology.",
      badgeVi: "Chuẩn Quốc tế",
      badgeEn: "Global Standard",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/60",
      href: "/courses",
    },
    {
      icon: Trophy,
      titleVi: "Đấu trường Quiz & Gamification",
      titleEn: "Gamified Quizzes & Challenges",
      descVi:
        "Biến việc học thành hành trình phiêu lưu đầy hào hứng với hệ thống tích lũy XP, chuỗi ngày học Streak, huy hiệu và bảng xếp hạng.",
      descEn:
        "Turn learning into an adventure with XP, daily study streaks, skill badges, and leaderboards.",
      badgeVi: "Tích lũy XP",
      badgeEn: "XP & Streaks",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/60",
      href: "/quiz",
    },
  ];

  return (
    <section id="features" className="scroll-mt-24 bg-white dark:bg-slate-950 pt-16 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20 transition-colors border-t border-neutral-100 dark:border-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* NoraClass Section Heading */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-block rounded-full bg-blue-50 dark:bg-blue-950/60 px-4 py-1.5 mx-auto mb-4 border border-blue-200/70 dark:border-blue-800/60">
            <span className="font-semibold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              {locale === "vi" ? "Được xây dựng dành cho học tập tương tác" : "Built for Interactive STEM Learning"}
            </span>
          </div>

          <h2 className="text-2xl font-bold leading-tight text-neutral-900 dark:text-white sm:text-3xl lg:text-4xl">
            <span className="block leading-snug">
              {locale === "vi" ? "Tăng cường " : "Empower "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                {locale === "vi" ? "sáng tạo" : "creativity"}
              </span>{" "}
              {locale === "vi" ? "của các thầy cô giáo," : "for teachers,"}
            </span>
            <span className="mt-1.5 block leading-snug">
              {locale === "vi" ? "khai phá " : "unlock "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                {locale === "vi" ? "tiềm năng" : "limitless potential"}
              </span>{" "}
              {locale === "vi" ? "của học sinh." : "for students."}
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-slate-300 sm:text-base">
            {locale === "vi"
              ? "Khám phá bộ công cụ SmartExplorer được xây dựng hoàn chỉnh theo chương trình giáo dục phổ thông K-9, giúp giáo viên thiết kế bài học trực quan và học sinh học tập tương tác mọi lúc mọi nơi."
              : "Discover the SmartExplorer suite aligned with modern K-9 STEM curricula, enabling interactive 3D learning and effortless lesson authoring."}
          </p>
        </div>

        {/* ── NoraClass Signature Expandable Accordion Suite ── */}
        <div className="mt-12 flex flex-col gap-4 sm:grid sm:grid-cols-2 xl:flex xl:flex-row xl:items-stretch">
          {mainTools.map((tool, index) => {
            const Icon = tool.icon;
            const title = locale === "vi" ? tool.titleVi : tool.titleEn;
            const desc = locale === "vi" ? tool.descVi : tool.descEn;
            const badge = locale === "vi" ? tool.badgeVi : tool.badgeEn;
            const bullets = locale === "vi" ? tool.bulletsVi : tool.bulletsEn;
            const isHovered = activeCard === index;

            return (
              <div
                key={tool.id}
                onMouseEnter={() => setActiveCard(index)}
                className={`group relative flex min-w-0 flex-col rounded-3xl border p-6 transition-all duration-500 ease-out cursor-pointer ${
                  isHovered
                    ? "border-blue-500 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20 xl:flex-[2.75] xl:z-10"
                    : "border-neutral-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs hover:border-blue-400/40 xl:flex-1 xl:basis-0"
                }`}
              >
                {/* Top: Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300 ${
                      isHovered
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                      isHovered
                        ? "bg-white/25 text-white"
                        : "bg-neutral-100 text-neutral-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {badge}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`mt-4 text-lg font-bold transition-colors ${
                    isHovered ? "text-white" : "text-neutral-900 dark:text-white"
                  }`}
                >
                  {title}
                </h3>

                {/* Description */}
                <p
                  className={`mt-2 text-xs sm:text-sm leading-relaxed transition-colors ${
                    isHovered
                      ? "text-white/95"
                      : "text-neutral-600 dark:text-slate-400 line-clamp-3 xl:line-clamp-2"
                  }`}
                >
                  {desc}
                </p>

                {/* Bullets: Expand on active/hover */}
                {isHovered && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-1.5 border-t border-white/20 pt-3"
                  >
                    {bullets.map((b, bi) => (
                      <li
                        key={bi}
                        className="flex items-start gap-1.5 text-xs text-white/90"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan-200" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}

                {/* Dynamic NoraClass Preview Illustration Box */}
                <div className="mt-auto pt-5">
                  <div
                    className={`overflow-hidden rounded-2xl border transition-all duration-300 p-3 ${
                      isHovered
                        ? "border-white/25 bg-white/10 backdrop-blur-sm"
                        : "border-neutral-100 dark:border-slate-800 bg-neutral-50 dark:bg-slate-950/60"
                    }`}
                  >
                    {/* Visual Mock tailored for each tool */}
                    {tool.previewType === "3d" && (
                      <div className="relative aspect-[16/10] w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />
                        <Box className="w-10 h-10 text-cyan-400 animate-pulse relative z-10" />
                        <span className="text-[11px] font-bold text-white mt-2 relative z-10">
                          {locale === "vi" ? "Mô hình ADN & Khối Đa diện 3D" : "3D DNA & Polyhedron View"}
                        </span>
                        <div className="flex gap-2 mt-2 relative z-10">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-cyan-200 text-[10px] font-semibold border border-blue-400/30">
                            Xoay 360°
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-semibold border border-emerald-400/30">
                            Bóc tách
                          </span>
                        </div>
                      </div>
                    )}

                    {tool.previewType === "whiteboard" && (
                      <div className="relative aspect-[16/10] w-full rounded-xl bg-slate-900/90 border border-slate-700/60 p-3 flex flex-col justify-between overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[10px] text-slate-300 font-mono">
                          <span>📐 Canvas #1: Tam giác ABC</span>
                          <span className="text-emerald-400">Đang đồng bộ</span>
                        </div>
                        <div className="my-auto text-center font-mono text-cyan-300 text-xs font-bold">
                          a² + b² = c² (Định lý Pythagore)
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                          <span className="px-1.5 py-0.5 rounded bg-white/10">Bút vẽ</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10">Thước</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10">Ghi chú</span>
                        </div>
                      </div>
                    )}

                    {tool.previewType === "simulation" && (
                      <div className="relative aspect-[16/10] w-full rounded-xl bg-slate-950 p-3 flex flex-col justify-between overflow-hidden border border-purple-500/30">
                        <div className="flex items-center justify-between text-[10px] text-purple-200">
                          <span>🔬 Lab Thí nghiệm Vật lý</span>
                          <span className="text-cyan-300">T = 2π√(l/g)</span>
                        </div>
                        <div className="my-auto flex items-center justify-center gap-3">
                          <FlaskConical className="w-8 h-8 text-purple-400" />
                          <div className="text-[10px] text-slate-300">
                            <div>Chiều dài dây: 1.0 m</div>
                            <div>Khối lượng: 200 g</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-full w-2/3" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA link inside card */}
                  <div className="mt-3 flex items-center justify-between text-xs font-bold">
                    <Link
                      href={tool.href}
                      className={`inline-flex items-center gap-1 transition-colors ${
                        isHovered ? "text-white hover:underline" : "text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      }`}
                    >
                      <span>{locale === "vi" ? "Khám phá chi tiết" : "Learn more"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4 Secondary Feature Pillars (Clean NoraClass Card Style) ── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {secondaryFeatures.map((item, idx) => {
            const Icon = item.icon;
            const title = locale === "vi" ? item.titleVi : item.titleEn;
            const desc = locale === "vi" ? item.descVi : item.descEn;
            const badge = locale === "vi" ? item.badgeVi : item.badgeEn;

            return (
              <Link
                key={idx}
                href={item.href}
                className="group flex flex-col justify-between rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-900/60 p-5 transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-neutral-200/80 dark:border-slate-700">
                      {badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                  </h4>
                  <p className="mt-1.5 text-xs text-neutral-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{locale === "vi" ? "Xem ngay" : "View"}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
