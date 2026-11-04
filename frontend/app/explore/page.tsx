"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Database, Eye, PenTool, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import ExploreViewerModal from "@/components/explore/ExploreViewerModal";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";
import { fetchExploreMaterials } from "@/lib/api";
import type { ExploreMaterial } from "@/lib/explore-data.config";

export default function ExplorePage() {
  const { locale } = useLang();
  const [materials, setMaterials] = useState<ExploreMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeMaterial, setActiveMaterial] = useState<ExploreMaterial | null>(null);

  useEffect(() => {
    let active = true;

    fetchExploreMaterials()
      .then(({ data }) => {
        if (!active) return;
        setMaterials(
          data.filter(
            (material) =>
              typeof material.uploadedModelUrl === "string" &&
              material.uploadedModelUrl.trim().length > 0,
          ),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load uploaded 3D models:", error);
        setLoadError("Không thể tải danh sách mô hình 3D. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return materials;
    return materials.filter((material) =>
      material.title.toLocaleLowerCase().includes(query),
    );
  }, [materials, search]);

  return (
    <main className="min-h-screen bg-neutral-50/60 pb-20 pt-24 text-neutral-900 transition-colors dark:bg-[#080d19] dark:text-neutral-100">
      <section className="border-b border-neutral-200/80 bg-white/70 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? "Mô hình 3D tương tác" : "Interactive 3D Models"}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {locale === "vi" ? "Mô hình 3D" : "3D Models"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {locale === "vi"
                ? "Chọn một mô hình để xem và tương tác trực tiếp."
                : "Choose a model to view and interact with it."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/whiteboard"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-4 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-600/20 dark:text-indigo-300"
              >
                <PenTool className="h-3.5 w-3.5" />
                {locale === "vi" ? "Bảng trắng 3D" : "3D Whiteboard"}
              </Link>
              <Link
                href="/teacher?tab=explore"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-600/10 px-4 py-2 text-xs font-bold text-cyan-700 transition-colors hover:bg-cyan-600/20 dark:text-cyan-300"
              >
                <Database className="h-3.5 w-3.5" />
                {locale === "vi" ? "Quản lý mô hình (Giáo viên)" : "Manage models (Teacher)"}
              </Link>
            </div>
          </div>

          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "vi" ? "Tìm tên mô hình..." : "Search model names..."}
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white/90 pl-10 pr-4 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-white"
            />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {locale === "vi" ? "Danh sách mô hình" : "Model list"}
          </h2>
          {!isLoading && !loadError ? (
            <span className="text-xs text-neutral-500">
              {visibleMaterials.length} {locale === "vi" ? "mô hình" : "models"}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {locale === "vi" ? "Đang tải mô hình 3D..." : "Loading 3D models..."}
          </p>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {loadError}
          </div>
        ) : visibleMaterials.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleMaterials.map((material) => (
              <article
                key={material.id}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900/90"
              >
                <button
                  type="button"
                  onClick={() => setActiveMaterial(material)}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-950"
                  aria-label={`${locale === "vi" ? "Xem mô hình" : "View model"} ${material.title}`}
                >
                  <Uploaded3DModelViewer
                    url={material.uploadedModelUrl!}
                    title={material.title}
                    className="h-full !min-h-0 rounded-none"
                    interactive={false}
                    showControlsHint={false}
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/75 via-transparent to-transparent pb-3 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {locale === "vi" ? "Nhấn để xem tương tác" : "Click to interact"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMaterial(material)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="line-clamp-2 text-sm font-bold transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    {material.title}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white/50 px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold">
              {search
                ? (locale === "vi" ? "Không tìm thấy mô hình" : "No models found")
                : (locale === "vi" ? "Chưa có mô hình 3D" : "No 3D models yet")}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              {search
                ? (locale === "vi" ? "Thử tìm bằng tên khác." : "Try another model name.")
                : (locale === "vi"
                  ? "Mô hình 3D được tải lên sẽ hiển thị tại đây."
                  : "Uploaded 3D models will appear here.")}
            </p>
            {!search ? (
              <Button asChild className="mt-5">
                <Link href="/teacher?tab=explore">
                  {locale === "vi" ? "Mở quản lý mô hình" : "Open model manager"}
                </Link>
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <ExploreViewerModal
        key={activeMaterial?.id ?? "no-material"}
        material={activeMaterial}
        isOpen={Boolean(activeMaterial)}
        onClose={() => setActiveMaterial(null)}
      />
    </main>
  );
}
