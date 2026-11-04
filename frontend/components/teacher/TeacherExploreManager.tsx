"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit3, ExternalLink, Eye, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ExploreViewerModal from "@/components/explore/ExploreViewerModal";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";
import {
  deleteExploreMaterial,
  fetchManageableExploreMaterials,
} from "@/lib/api";
import type { ExploreMaterial } from "@/lib/explore-data.config";

export default function TeacherExploreManager() {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<ExploreMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<ExploreMaterial | null>(null);

  const loadMaterials = useCallback(async () => {
    if (!token) {
      setLoadError("Vui lòng đăng nhập lại để quản lý mô hình 3D.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetchManageableExploreMaterials(token);
      setMaterials(response.data);
    } catch (error: unknown) {
      console.error("Failed to load 3D materials:", error);
      setLoadError(error instanceof Error ? error.message : "Không thể tải mô hình 3D.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(loadMaterials);
  }, [loadMaterials]);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return materials;
    return materials.filter((material) => material.title.toLocaleLowerCase().includes(query));
  }, [materials, search]);

  const handleDelete = async (material: ExploreMaterial) => {
    if (!token || !window.confirm(`Xóa mô hình "${material.title}"?`)) return;
    try {
      await deleteExploreMaterial(material.id, token);
      toast.success("Đã xóa mô hình 3D.");
      await loadMaterials();
    } catch (error: unknown) {
      console.error("Failed to delete 3D material:", error);
      toast.error(error instanceof Error ? error.message : "Không thể xóa mô hình 3D.");
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Mô hình 3D</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách mô hình 3D. Nhấn vào thumbnail để xem trước và tương tác.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/teacher/explore/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm mô hình 3D
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="/explore" target="_blank" rel="noreferrer">
              Xem trang học liệu
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      <label className="relative block max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên mô hình..."
          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm"
        />
      </label>

      {loadError ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Đang tải mô hình...</p>
      ) : filteredMaterials.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <article key={material.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setPreviewMaterial(material)}
                className="group relative block aspect-[16/10] w-full overflow-hidden bg-slate-950"
                aria-label={`Xem mô hình ${material.title}`}
              >
                {material.uploadedModelUrl ? (
                  <Uploaded3DModelViewer
                    url={material.uploadedModelUrl}
                    title={material.title}
                    className="h-full !min-h-0 rounded-none"
                    interactive={false}
                    showControlsHint={false}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-neutral-400">
                    Chưa tải mô hình GLB
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/75 to-transparent pb-3 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Nhấn để xem mô hình
                </span>
              </button>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold">{material.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {material.uploadedModelUrl ? "Đã có mô hình 3D" : "Cần tải mô hình GLB"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPreviewMaterial(material)}
                    aria-label={`Xem ${material.title}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" asChild>
                    <Link
                      href={`/teacher/explore/${encodeURIComponent(material.id)}/edit`}
                      aria-label={`Sửa ${material.title}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleDelete(material)}
                    aria-label={`Xóa ${material.title}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-semibold">Chưa có mô hình phù hợp</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Thêm mô hình mới bằng tên và tệp GLB.
          </p>
        </div>
      )}

      <ExploreViewerModal
        key={previewMaterial?.id ?? "no-material"}
        material={previewMaterial}
        isOpen={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
      />
    </section>
  );
}
