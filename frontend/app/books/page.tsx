"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Star,
  Search,
  Filter,
  Volume2,
  RotateCw,
  HelpCircle,
  GraduationCap,
  Layers,
  CheckCircle2,
  Plus,
  FileUp,
  Trash2,
  Bot,
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import {
  FLIPBOOKS_DATA,
  getAllFlipbooks,
  deleteUserBook,
  type FlipbookBook,
} from "@/lib/flipbooks-data.config";

export default function BooksPage() {
  const { locale } = useLang();
  const [books, setBooks] = useState<FlipbookBook[]>(FLIPBOOKS_DATA);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    // Load both built-in books and user uploaded/created books from localStorage
    setBooks(getAllFlipbooks());
  }, []);

  const handleDeleteBook = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa cuốn sách tương tác này không?")) {
      deleteUserBook(id);
      setBooks(getAllFlipbooks());
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchSubject = selectedSubject === "all" || book.subject === selectedSubject;
    const matchGrade = selectedGrade === "all" || book.grade === selectedGrade;
    const matchSearch =
      search === "" ||
      book.titleVi.toLowerCase().includes(search.toLowerCase()) ||
      book.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      book.descriptionVi.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchGrade && matchSearch;
  });


  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-[#070b16] text-neutral-900 dark:text-neutral-100 pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── TOP HERO BANNER ── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/60 dark:bg-emerald-950/50 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4 backdrop-blur-md">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {locale === "vi"
                ? "Thư Viện Sách Tương Tác Số (Flipbook) Chuẩn GDPT 2018"
                : "K-9 Interactive Digital Flipbook Library"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Sách Giáo Trình{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 bg-clip-text text-transparent">
              Lật Trang 3D Tương Tác
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {locale === "vi"
              ? "Trải nghiệm đọc sách số với hiệu ứng lật trang 3D chân thực: nhúng mô hình không gian 3 chiều, phát âm tiếng Anh chuẩn bản ngữ và bài tập tự chấm điểm ngay trên từng trang sách."
              : "Experience authentic 3D page curl transitions with embedded real-time 3D models, native STEM pronunciation, and instant on-page self-grading quizzes."}
          </p>

          {/* Quick feature highlights pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-xs">
              <RotateCw className="h-3.5 w-3.5 text-blue-500" />
              <span>Lật trang 3D 2 mặt (Spread)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-xs">
              <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Giọng đọc Audio bài giảng</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
              <span>Mô hình 3D WebGL trên trang</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-xs">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Trắc nghiệm kiểm tra tức thì</span>
            </span>
          </div>
        </div>

        {/* ── CREATE / UPLOAD CTA BANNER ── */}
        <div className="mb-10 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-cyan-950/70 border border-emerald-500/30 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                <Bot className="h-3.5 w-3.5" />
                Nora AI & Document Uploader Studio
              </span>
              <span className="text-xs text-neutral-400">• Dành cho Giáo viên & Người sáng tạo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Đẩy tài liệu lên hoặc nạp nội dung bài giảng thành Sách Lật Trang 3D
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Hỗ trợ 3 cách nạp dữ liệu: <strong>Kéo thả file PDF giáo án</strong>, <strong>dán văn bản bài giảng</strong> để Nora AI tự động bóc tách thành từng trang kèm mô hình 3D tương ứng, hoặc <strong>tự biên tập thủ công</strong> theo ý muốn.
            </p>
          </div>
          <div className="relative z-10 shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              href="/books/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-extrabold shadow-xl shadow-emerald-500/30 transition-all hover:scale-105"
            >
              <FileUp className="h-4 w-4" />
              <span>+ Tải Lên PDF & Tạo Sách 3D</span>
            </Link>
          </div>
        </div>

        {/* ── FILTER & SEARCH BAR ── */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-neutral-900/80 p-4 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 backdrop-blur-xl shadow-xs">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sách giáo khoa, bài học..."
              className="w-full h-10 pl-10 pr-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Subject buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "Tất cả môn" },
              { id: "chemistry", label: "Hóa học" },
              { id: "math", label: "Toán học" },
              { id: "biology", label: "Sinh học" },
              { id: "physics", label: "Vật lý" },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSubject === sub.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {sub.label}
              </button>
            ))}

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1 hidden sm:block" />

            {/* Grade buttons */}
            {[
              { id: "all", label: "Tất cả lớp" },
              { id: "6", label: "Lớp 6" },
              { id: "7", label: "Lớp 7" },
              { id: "8", label: "Lớp 8" },
              { id: "9", label: "Lớp 9" },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGrade === g.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>


        {/* ── BOOKSHELF GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="group flex flex-col rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-300 overflow-hidden"
            >
              {/* Realistic 3D Book Cover Viewport */}
              <div className="relative p-6 sm:p-8 bg-neutral-100 dark:bg-[#0c101c] flex items-center justify-center border-b border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                {/* Background decorative glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${book.coverGradient} opacity-10 group-hover:opacity-20 transition-opacity`}
                />

                {/* 3D Book Graphic */}
                <div className="relative w-48 sm:w-52 h-64 sm:h-70 rounded-r-2xl rounded-l-md shadow-2xl p-5 flex flex-col justify-between text-white transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1"
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  }}
                >
                  <div className={`absolute inset-0 rounded-r-2xl rounded-l-md bg-gradient-to-br ${book.coverGradient}`} />
                  
                  {/* Left Spine Crease Shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/40 via-black/20 to-transparent rounded-l-md" />
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white/20" />

                  {/* Book Cover Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                        {book.textbook}
                      </span>
                      <span className="text-[10px] font-bold bg-black/30 px-2 py-0.5 rounded-md">
                        Lớp {book.grade}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold leading-tight text-white drop-shadow-md">
                      {book.titleVi}
                    </h3>
                    <p className="text-[10px] text-white/80 italic mt-1 line-clamp-1">
                      {book.titleEn}
                    </p>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-white/20 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/70 block">
                        Bộ sách số 3D
                      </span>
                      <span className="text-[10px] font-bold text-white">
                        {book.subjectLabelVi}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-bold bg-black/40 px-2 py-0.5 rounded-md">
                      <BookOpen className="h-3 w-3 text-cyan-300" />
                      <span>{book.pages.length} trang</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Metadata & CTA */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {book.id.startsWith("fb-user-") && (
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                        <Sparkles className="h-3 w-3" />
                        Tài liệu bạn tải lên / Tạo bằng AI
                      </span>
                      <button
                        onClick={(e) => handleDeleteBook(book.id, e)}
                        title="Xóa cuốn sách này"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {book.subjectLabelVi} • Lớp {book.grade}
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{book.rating}</span>
                    </span>
                  </div>


                  <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {book.titleVi}
                  </h3>

                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {book.descriptionVi}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    {book.readCount.toLocaleString()} lượt đọc
                  </span>

                  <Link
                    href={`/books/${book.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                  >
                    <span>Đọc sách lật trang 3D</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
