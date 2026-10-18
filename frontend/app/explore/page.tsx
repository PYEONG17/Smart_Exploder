"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Box,
  Layers,
  RotateCw,
  Eye,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  Star,
  FlaskConical,
  GraduationCap,
  Atom,
  Globe,
  Compass,
  ArrowRight,
  RefreshCw,
  Grid3X3,
  LayoutGrid,
  PenTool,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import {
  EXPLORE_MATERIALS_CONFIG,
  EXPLORE_CATEGORIES,
  EXPLORE_GRADES,
  EXPLORE_SUBJECTS,
  EXPLORE_TYPES,
  EXPLORE_TEXTBOOKS,
  type ExploreMaterial,
  type ExploreCategoryKey,
} from "@/lib/explore-data.config";
import ExploreViewerModal from "@/components/explore/ExploreViewerModal";
import { ThreeDViewer } from "@/components/ui/ThreeDViewer";

export default function ExplorePage() {
  const { locale } = useLang();

  // Filter states
  const [materials, setMaterials] = useState<ExploreMaterial[]>(EXPLORE_MATERIALS_CONFIG);
  const [selectedCategory, setSelectedCategory] = useState<ExploreCategoryKey>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTextbook, setSelectedTextbook] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">("popular");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal active material
  const [activeMaterial, setActiveMaterial] = useState<ExploreMaterial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Attempt to fetch fresh data from backend API with local fallback
  useEffect(() => {
    async function fetchFromApi() {
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== "all") queryParams.append("category", selectedCategory);
        if (selectedGrade !== "all") queryParams.append("grade", selectedGrade);
        if (selectedSubject !== "all") queryParams.append("subject", selectedSubject);
        if (selectedType !== "all") queryParams.append("type", selectedType);
        if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
        queryParams.append("sortBy", sortBy);

        const res = await fetch(`http://localhost:5000/api/explore?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setMaterials(json.data);
            return;
          }
        }
      } catch {
        // Fallback to local config data if backend is offline
      }
      // Local fallback filter
      let localFiltered = [...EXPLORE_MATERIALS_CONFIG];
      if (selectedCategory !== "all") {
        localFiltered = localFiltered.filter((m) => m.category === selectedCategory);
      }
      if (selectedGrade !== "all") {
        localFiltered = localFiltered.filter((m) => m.grade === selectedGrade || m.grade === "all");
      }
      if (selectedSubject !== "all") {
        localFiltered = localFiltered.filter((m) => m.subject === selectedSubject);
      }
      if (selectedType !== "all") {
        localFiltered = localFiltered.filter((m) => m.type === selectedType);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        localFiltered = localFiltered.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.titleEn.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (sortBy === "rating") {
        localFiltered.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === "newest") {
        localFiltered.reverse();
      } else {
        localFiltered.sort((a, b) => b.viewsCount - a.viewsCount);
      }
      setMaterials(localFiltered);
    }

    fetchFromApi();
  }, [selectedCategory, selectedGrade, selectedSubject, selectedType, searchQuery, sortBy]);

  const handleOpenViewer = (material: ExploreMaterial) => {
    setActiveMaterial(material);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedGrade("all");
    setSelectedSubject("all");
    setSelectedType("all");
    setSelectedTextbook("all");
    setSearchQuery("");
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedGrade !== "all",
    selectedSubject !== "all",
    selectedType !== "all",
    selectedTextbook !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-[#080d19] text-neutral-900 dark:text-neutral-100 pt-24 pb-20 transition-colors">
      {/* ── TOP HERO & SEARCH BAR (YOOBOOK STYLE) ── */}
      <section className="relative overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Nền tảng Học liệu Số 3D/XR chuẩn GDPT 2018</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Kho Học Liệu Số{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  3D / XR & Mô Phỏng
                </span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                Khám phá mô hình 3 chiều tương tác, thí nghiệm ảo Vật lý - Hóa học - Sinh học, Sandbox STEM và ngân hàng câu hỏi đánh giá năng lực dành cho học sinh K-9.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <Link
                  href="/whiteboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all shadow-xs"
                >
                  <PenTool className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Bảng Trắng Tương Tác 3D</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>

                <Link
                  href="/books"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-xs"
                >
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Thư Viện Sách Lật Trang 3D (Flipbook)</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Quick Search Box */}
            <div className="w-full md:w-80 lg:w-96 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài học, mô hình 3D..."
                  className="w-full h-11 pl-10 pr-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Top Category Pills Row (Horizontal Scroll) */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {EXPLORE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                      : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span>{locale === "vi" ? cat.labelVi : cat.labelEn}</span>
                  {cat.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT LAYOUT: SIDEBAR + GRID ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT SIDEBAR FILTERS (YOOBOOK HIERARCHICAL FILTER) ── */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 p-5 backdrop-blur-xl shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  Bộ Lọc Phân Cấp
                </span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Đặt lại ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            {/* 1. Filter by Grade (Khối lớp) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Khối lớp (K-9)</span>
                <span className="text-[11px] text-neutral-400">Cấp THCS</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {EXPLORE_GRADES.map((g) => {
                  const active = selectedGrade === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGrade(g.id)}
                      className={`text-xs py-2 px-3 rounded-xl font-medium border text-left transition-all ${
                        active
                          ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      {g.labelVi}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Filter by Subject (Môn học) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Môn học GDPT 2018
              </label>
              <div className="space-y-1">
                {EXPLORE_SUBJECTS.map((s) => {
                  const active = selectedSubject === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubject(s.id)}
                      className={`w-full flex items-center justify-between py-1.5 px-3 rounded-xl text-xs transition-colors ${
                        active
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span>{s.labelVi}</span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Filter by Resource Type (Định dạng học liệu) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Định dạng học liệu số
              </label>
              <div className="space-y-1">
                {EXPLORE_TYPES.map((t) => {
                  const active = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`w-full flex items-center justify-between py-1.5 px-3 rounded-xl text-xs transition-colors ${
                        active
                          ? "bg-emerald-600 text-white font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span>{t.labelVi}</span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Filter by Textbook (Bộ sách) */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Bộ sách giáo khoa
              </label>
              <div className="space-y-1">
                {EXPLORE_TEXTBOOKS.map((tb) => {
                  const active = selectedTextbook === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => setSelectedTextbook(tb.id)}
                      className={`w-full text-left py-1.5 px-2.5 rounded-xl text-xs truncate transition-colors ${
                        active
                          ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/40"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                      }`}
                    >
                      • {tb.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── RIGHT MAIN GRID (LEARNING RESOURCES CARDS) ── */}
          <main className="lg:col-span-9 flex flex-col gap-6">
            {/* Status & Sorting bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-neutral-900/70 p-3.5 sm:px-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Hiển thị{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {materials.length}
                  </span>{" "}
                  học liệu số 3D/XR
                </span>
                {selectedCategory !== "all" && (
                  <Badge variant="outline" className="text-[11px] border-blue-500/40 text-blue-500">
                    {EXPLORE_CATEGORIES.find((c) => c.id === selectedCategory)?.labelVi}
                  </Badge>
                )}
              </div>

              {/* Sorting and Mobile filter trigger */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                  className="lg:hidden inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Bộ lọc</span>
                </button>

                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl text-xs">
                  <span className="text-[11px] text-neutral-400 pl-2">Sắp xếp:</span>
                  <button
                    onClick={() => setSortBy("popular")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      sortBy === "popular"
                        ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Xem nhiều
                  </button>
                  <button
                    onClick={() => setSortBy("rating")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      sortBy === "rating"
                        ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Đánh giá
                  </button>
                  <button
                    onClick={() => setSortBy("newest")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      sortBy === "newest"
                        ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Mới nhất
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filter Sheet */}
            {isMobileFilterOpen && (
              <div className="lg:hidden p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider">Bộ lọc trên di động</h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-xs text-neutral-500 hover:text-white"
                  >
                    Đóng
                  </button>
                </div>
                {/* Grade buttons */}
                <div>
                  <span className="text-xs text-neutral-400 block mb-1">Khối lớp:</span>
                  <div className="flex flex-wrap gap-1">
                    {EXPLORE_GRADES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGrade(g.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border ${
                          selectedGrade === g.id
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-neutral-200 dark:border-neutral-800"
                        }`}
                      >
                        {g.labelVi}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Materials Grid */}
            {materials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {materials.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="group flex flex-col rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-sm hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all duration-300 overflow-hidden"
                  >
                    {/* Card 3D Preview Banner */}
                    <div
                      onClick={() => handleOpenViewer(item)}
                      className="relative aspect-16/10 w-full bg-linear-to-br from-slate-900 to-black overflow-hidden cursor-pointer"
                    >
                      {/* Subtle WebGL Preview */}
                      <div className="absolute inset-0 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 pointer-events-none">
                        <ThreeDViewer
                          modelType={item.modelType}
                          hideQuickSelector={true}
                        />
                      </div>

                      {/* Card Overlay Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
                        <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                          {item.typeLabelVi}
                        </span>
                        <span className="rounded-full bg-blue-500/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          {item.grade === "all" ? "K-9" : `Lớp ${item.grade}`}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 z-10 pointer-events-none">
                        <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{item.rating}</span>
                        </span>
                      </div>

                      {/* Hover action pill */}
                      <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-neutral-900 font-bold text-xs shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span>Mở Không Gian 3D XR</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Subject & Category tag */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {item.subjectLabelVi}
                          </span>
                          <span className="text-neutral-400 text-xs">•</span>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {item.textbook}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => handleOpenViewer(item)}
                          className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer mb-1.5"
                        >
                          {locale === "vi" ? item.title : item.titleEn}
                        </h3>

                        {/* Bilingual subtitle */}
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 italic mb-2">
                          {locale === "vi" ? item.titleEn : item.title}
                        </p>

                        {/* Description */}
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {locale === "vi" ? item.description : item.descriptionEn}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                          <RotateCw className="h-3 w-3 text-cyan-500" />
                          <span>{item.viewsCount} lượt xem</span>
                        </div>

                        <Button
                          onClick={() => handleOpenViewer(item)}
                          size="sm"
                          className="h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs gap-1.5"
                        >
                          <span>Khám phá 3D</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
                <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
                  <Box className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Không tìm thấy học liệu số phù hợp
                </h3>
                <p className="mt-1 text-xs text-neutral-500 max-w-sm">
                  Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn danh mục khác trong bộ lọc.
                </p>
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl text-xs"
                >
                  Đặt lại tất cả bộ lọc
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── 3D XR VIEWER STUDIO MODAL ── */}
      <ExploreViewerModal
        material={activeMaterial}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
