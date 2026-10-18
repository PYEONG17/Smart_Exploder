"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/contexts/LanguageContext";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  BookOpen,
  Box,
  Bot,
  Video,
} from "lucide-react";

/**
 * Footer: Redesigned with authentic NoraClass aesthetic.
 * Clean, structured, and informative layout for SmartExplorer.
 */
export default function Footer() {
  const { locale } = useLang();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 pt-16 pb-12 transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-100 dark:border-slate-800">
          {/* Brand Info Column */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                width={36}
                height={36}
                alt="SmartExplorer Logo"
                className="rounded-xl shadow-xs border border-slate-200 dark:border-slate-800"
              />
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Smart<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">Explorer</span>
              </span>
            </Link>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {locale === "vi"
                ? "Nền tảng học Toán và Khoa học bằng Tiếng Anh tích hợp Video tương tác, Mô hình 3D và Trí tuệ nhân tạo (AI) dành cho học sinh K-9."
                : "Interactive bilingual STEM platform integrating 3D models, checkpoint videos, and AI tutoring for K-9 learners."}
            </p>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {locale === "vi"
                    ? "Đại học Bách Khoa - Đại học Đà Nẵng, Việt Nam"
                    : "Danang University of Science and Technology, Vietnam"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <a
                  href="mailto:contact@smartexplorer.edu.vn"
                  className="hover:text-blue-600 transition-colors"
                >
                  contact@smartexplorer.edu.vn
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {locale === "vi"
                    ? "Đồ án Tốt nghiệp Kỹ sư CNTT — Nguyễn Tiến Bình"
                    : "Graduation Thesis — Nguyen Tien Binh"}
                </span>
              </div>
            </div>
          </div>

          {/* Links Column 1: Sản phẩm (Products like NoraClass) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {locale === "vi" ? "Sản phẩm & Tính năng" : "Products & Features"}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href="/three-d"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5 text-blue-500" />
                  <span>{locale === "vi" ? "Mô hình 3D tương tác" : "Interactive 3D Studio"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{locale === "vi" ? "Video bài giảng ngắt đố" : "Checkpoint Video Lessons"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/ai"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{locale === "vi" ? "Trợ lý AI Nora Tutor 24/7" : "Nora AI STEM Tutor"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/quiz"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>{locale === "vi" ? "Đấu trường Quiz & Flashcard" : "Gamified Quizzes & Flashcards"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/teacher"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{locale === "vi" ? "Teacher Studio & LMS" : "Teacher Studio & LMS"}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Học liệu K-9 */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {locale === "vi" ? "Kho học liệu K-9" : "Curriculum & Grades"}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href="/courses?subject=math"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Toán học Tiểu học (Lớp 1 - 5)" : "Primary Math (Grades 1 - 5)"}
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?subject=math"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Toán học THCS (Lớp 6 - 9)" : "Middle School Math (Grades 6 - 9)"}
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?subject=science"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Khoa học tự nhiên & Sinh học" : "Natural Science & Biology"}
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?subject=physics"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Vật lý & Hóa học thực hành" : "Physics & Chemistry Labs"}
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?subject=cambridge"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Thuật ngữ Tiếng Anh STEM" : "STEM English Vocabulary"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Tài khoản & Trợ giúp */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {locale === "vi" ? "Tài khoản" : "Account"}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li>
                <Link
                  href="/login"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Đăng nhập" : "Sign In"}
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Đăng ký thành viên" : "Create Account"}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Bảng điều khiển học tập" : "Learning Dashboard"}
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {locale === "vi" ? "Hồ sơ cá nhân" : "My Profile"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            © {currentYear} SmartExplorer Platform. {locale === "vi" ? "Bản quyền thuộc về Nguyễn Tiến Bình." : "All Rights Reserved."}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {locale === "vi" ? "Chuẩn GDPT 2018 · Cambridge STEM K-9" : "GDPT 2018 · Cambridge STEM K-9"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
