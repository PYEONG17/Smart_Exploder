"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  BookOpen,
  Compass,
  FlaskConical,
  PenTool,
  PlusSquare,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const features = [
  {
    icon: FlaskConical,
    href: "/lab",
    titleVi: "Phòng Lab mô phỏng",
    titleEn: "Virtual Lab",
    descriptionVi:
      "Thử các thí nghiệm Vật lý, Hóa học và Sinh học; điều chỉnh thông số và quan sát kết quả trên mô phỏng.",
    descriptionEn:
      "Explore Physics, Chemistry, and Biology experiments; adjust parameters and observe simulation results.",
    detailVi: "23 thí nghiệm tương tác có sẵn",
    detailEn: "23 built-in interactive experiments",
    color: "text-cyan-700 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-950/50",
  },
  {
    icon: Compass,
    href: "/explore",
    titleVi: "Khám phá học liệu",
    titleEn: "Explore resources",
    descriptionVi:
      "Tìm học liệu theo lớp, môn, loại nội dung và bộ sách; mở mô hình hoặc tài nguyên tương tác.",
    descriptionEn:
      "Filter learning resources by grade, subject, content type, and textbook, then open interactive materials.",
    detailVi: "Có bộ lọc và nội dung song ngữ",
    detailEn: "Filters and bilingual content",
    color: "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50",
  },
  {
    icon: BookOpen,
    href: "/courses",
    titleVi: "Khóa học và bài học",
    titleEn: "Courses and lessons",
    descriptionVi:
      "Duyệt các khóa học trên hệ thống và mở nội dung bài học tương ứng.",
    descriptionEn:
      "Browse the courses available on the platform and open their lesson content.",
    detailVi: "Nội dung tải từ hệ thống",
    detailEn: "Content served by the platform",
    color: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50",
  },
  {
    icon: Bot,
    href: "/ai",
    titleVi: "Trợ lý AI học tập",
    titleEn: "AI study assistant",
    descriptionVi:
      "Đặt câu hỏi về Toán và STEM, chọn khối lớp, xem lại các cuộc trò chuyện đã lưu. Cần đăng nhập để sử dụng.",
    descriptionEn:
      "Ask Math and STEM questions, choose a grade level, and revisit saved conversations. Sign-in is required.",
    detailVi: "Có yêu cầu đăng nhập",
    detailEn: "Sign-in required",
    color: "text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/50",
  },
  {
    icon: PenTool,
    href: "/whiteboard",
    titleVi: "Bảng trắng số",
    titleEn: "Digital whiteboard",
    descriptionVi:
      "Mở bảng trắng để viết, vẽ và minh họa nội dung học tập.",
    descriptionEn:
      "Open a digital canvas to write, draw, and illustrate learning content.",
    detailVi: "Công cụ học tập trên trình duyệt",
    detailEn: "Browser-based learning tool",
    color: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50",
  },
  {
    icon: PlusSquare,
    href: "/teacher/labs/new",
    titleVi: "Tạo bài Lab",
    titleEn: "Create a Lab",
    descriptionVi:
      "Giáo viên có thể tạo bài Lab bằng nội dung cấu hình, sau đó xem, chỉnh sửa hoặc xóa bài do mình tạo.",
    descriptionEn:
      "Teachers can create Labs from configured content, then view, edit, or delete their own Labs.",
    detailVi: "Dành cho tài khoản giáo viên",
    detailEn: "For teacher accounts",
    color: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50",
  },
];

export default function FeaturesSection() {
  const { locale } = useLang();
  const isVietnamese = locale === "vi";

  return (
    <section id="features" className="border-t border-slate-100 bg-white py-16 dark:border-slate-900 dark:bg-slate-950 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            {isVietnamese ? "Có gì trên SmartExplorer?" : "What's on SmartExplorer?"}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {isVietnamese
              ? "Các công cụ bạn có thể mở và trải nghiệm"
              : "Tools you can open and try"}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            {isVietnamese
              ? "Mỗi mục bên dưới dẫn đến tính năng đang có trong website. Nội dung và quyền truy cập phụ thuộc vào dữ liệu, tài khoản và vai trò."
              : "Each link below opens an existing part of the website. Content and access depend on available data, account, and role."}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                  {isVietnamese ? feature.titleVi : feature.titleEn}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {isVietnamese ? feature.descriptionVi : feature.descriptionEn}
                </p>
                <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isVietnamese ? feature.detailVi : feature.detailEn}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
