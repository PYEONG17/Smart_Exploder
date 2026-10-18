"use client";

import { useState, useMemo, type ComponentProps } from "react";
import Link from "next/link";
import { mock3DModels } from "@/lib/mock-data";
import {
  Box,
  Search,
  Maximize2,
  Play,
  RotateCw,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  X,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreeDViewer } from "@/components/ui/ThreeDViewer";
import { useLang } from "@/contexts/LanguageContext";

export default function ThreeDPage() {
  const { locale } = useLang();
  const [selectedModel, setSelectedModel] = useState<string | null>("m1"); // Default to first model
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", labelVi: "Tất cả mô hình", labelEn: "All Models" },
    { id: "Hình học", labelVi: "Hình học Không gian", labelEn: "Spatial Geometry" },
    { id: "Thiên văn", labelVi: "Thiên văn & Vũ trụ", labelEn: "Astronomy & Space" },
    { id: "Hóa học", labelVi: "Hóa học & Nguyên tử", labelEn: "Chemistry & Atoms" },
    { id: "Sinh học", labelVi: "Sinh học & Tế bào", labelEn: "Biology & Genetics" },
  ];

  const filteredModels = useMemo(() => {
    return mock3DModels.filter((model) => {
      const matchSearch =
        search === "" ||
        model.title.toLowerCase().includes(search.toLowerCase()) ||
        model.titleEn.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "all" || model.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory]);

  const activeModel = mock3DModels.find((m) => m.id === selectedModel);

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0c1222] pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* NoraClass Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 dark:border-blue-800/60 dark:bg-blue-950/50 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-4 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {locale === "vi"
                ? "Bộ sưu tập mô hình trực quan chuẩn GDPT 2018"
                : "K-9 Interactive 3D STEM Catalog"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {locale === "vi" ? (
              <>
                Không gian Khám phá{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Mô hình 3D
                </span>
              </>
            ) : (
              <>
                Interactive{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  3D Studio
                </span>
              </>
            )}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-slate-300 leading-relaxed">
            {locale === "vi"
              ? "Tương tác ba chiều thời gian thực: xoay 360°, phóng to chi tiết, bóc tách cơ quan và tra cứu thuật ngữ khoa học song ngữ Anh – Việt."
              : "Manipulate 3D models in real-time: 360° rotation, zoom, dissect layers, and inspect bilingual terminology."}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Box className="w-4 h-4" />
              <span>
                {locale === "vi"
                  ? "Xem Kho Học Liệu Số 3D/XR Đầy Đủ (YooBook Style)"
                  : "Open Full 3D/XR Library (YooBook Layout)"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Active 3D Viewer Studio Area ── */}
        {activeModel && (
          <div className="mb-14 rounded-3xl overflow-hidden border border-neutral-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
            {/* Viewer Top Window Bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-slate-800 bg-neutral-100/70 dark:bg-slate-950/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs font-bold text-neutral-700 dark:text-slate-300">
                  {activeModel.title} — {activeModel.titleEn}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {activeModel.category}
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  WebGL 3D
                </span>
              </div>
            </div>

            {/* 3D Canvas Box */}
            <div className="aspect-[16/9] sm:aspect-[21/9] w-full relative bg-slate-950 overflow-hidden">
              <div className="absolute inset-0">
                <ThreeDViewer
                  modelType={
                    activeModel.modelType as ComponentProps<
                      typeof ThreeDViewer
                    >["modelType"]
                  }
                />
              </div>

              {/* Floating Overlay Instruction */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 text-white text-[11px] font-medium flex items-center gap-2 pointer-events-none">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>{locale === "vi" ? "Kéo chuột để xoay 360° · Cuộn để thu phóng" : "Drag to rotate 360° · Scroll to zoom"}</span>
              </div>
            </div>

            {/* Viewer Bottom Info Strip */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-neutral-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {activeModel.title}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {activeModel.titleEn}
                </p>
                <p className="text-sm text-neutral-600 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
                  {activeModel.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedModel(null)}
                  className="rounded-xl border-neutral-300 dark:border-slate-700 text-xs font-semibold"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {locale === "vi" ? "Ẩn khung xem" : "Close Viewer"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter Bar & Search ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-white dark:bg-slate-900 text-neutral-600 dark:text-slate-400 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {locale === "vi" ? cat.labelVi : cat.labelEn}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={locale === "vi" ? "Tìm kiếm mô hình 3D..." : "Search 3D models..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* ── Models Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => {
            const isSelected = selectedModel === model.id;

            return (
              <div
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className={`group cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300 ${
                  isSelected
                    ? "border-blue-500 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900"
                    : "border-neutral-200/90 dark:border-slate-800 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900 shadow-xs"
                }`}
              >
                {/* Visual Thumbnail */}
                <div
                  className={`aspect-[16/10] bg-gradient-to-br ${model.color} relative overflow-hidden flex items-center justify-center`}
                >
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,white,transparent)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

                  <Box className="w-14 h-14 text-white/90 group-hover:scale-110 transition-transform duration-500 drop-shadow-md" />

                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-950/90 px-2.5 py-0.5 text-[10px] font-bold text-neutral-800 dark:text-white shadow-xs backdrop-blur-md">
                      360° 3D
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/40 backdrop-blur-md text-white border-white/10 hover:bg-black/50 text-[10px] font-semibold">
                      {model.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {model.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-slate-400 font-medium mb-3">
                    {model.titleEn}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {model.description}
                  </p>

                  <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSelected ? (locale === "vi" ? "Đang xem" : "Viewing") : (locale === "vi" ? "Xem mô hình" : "Open 3D Model")}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
