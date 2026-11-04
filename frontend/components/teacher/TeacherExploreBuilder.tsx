"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, Save, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  createExploreMaterial,
  fetchManageableExploreMaterial,
  updateExploreMaterial,
} from "@/lib/api";
import type { ExploreMaterial } from "@/lib/explore-data.config";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";

export function TeacherExploreBuilder({ materialId }: { materialId?: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const { isLoading: isAuthLoading } = useAuthGuard({
    allowedRoles: ["TEACHER"],
    forbiddenRedirectTo: "/assignments",
  });
  const [title, setTitle] = useState("");
  const [existingMaterial, setExistingMaterial] = useState<ExploreMaterial | null>(null);
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(Boolean(materialId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const localModelUrl = useMemo(
    () => selectedModelFile ? URL.createObjectURL(selectedModelFile) : null,
    [selectedModelFile],
  );
  useEffect(() => {
    return () => {
      if (localModelUrl) URL.revokeObjectURL(localModelUrl);
    };
  }, [localModelUrl]);

  useEffect(() => {
    if (!materialId || !token) return;
    let active = true;
    fetchManageableExploreMaterial(materialId, token)
      .then(({ data: material }) => {
        if (!active) return;
        setError("");
        setExistingMaterial(material);
        setTitle(material.title);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Không thể tải học liệu.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingMaterial(false);
      });

    return () => {
      active = false;
    };
  }, [materialId, token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    if (!selectedModelFile && !existingMaterial?.uploadedModelUrl) {
      setError("Vui lòng tải lên mô hình GLB trước khi lưu học liệu.");
      return;
    }
    if (!title.trim()) {
      setError("Vui lòng nhập tên mô hình.");
      return;
    }

    setIsSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      title: title.trim(),
      category: existingMaterial?.category ?? "natural_science",
    };

    try {
      if (materialId) {
        await updateExploreMaterial(
          materialId,
          payload,
          token,
          selectedModelFile ?? undefined,
        );
        toast.success("Cập nhật mô hình học liệu thành công.");
      } else {
        await createExploreMaterial(payload, token, selectedModelFile ?? undefined);
        toast.success("Thêm mô hình học liệu thành công.");
      }
      router.push("/teacher?tab=explore");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu học liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || (isLoadingMaterial && token)) {
    return <p className="py-24 text-center text-muted-foreground">Đang tải thông tin học liệu...</p>;
  }

  if (materialId && !token) {
    return (
      <p role="alert" className="py-24 text-center text-destructive">
        Vui lòng đăng nhập lại để chỉnh sửa mô hình 3D.
      </p>
    );
  }

  const modelPreviewUrl = localModelUrl ?? existingMaterial?.uploadedModelUrl;

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-24">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/teacher?tab=explore"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại kho học liệu 3D
        </Link>

        <header className="mb-8">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-300">
            {materialId ? "Chỉnh sửa mô hình học liệu 3D" : "Thêm mô hình học liệu 3D"}
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            {materialId ? "Cập nhật học liệu 3D" : "Tạo học liệu 3D"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Chỉ cần nhập tên, tải mô hình lên và lưu.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="text-lg font-bold">Tên mô hình</h2>
            </div>
            <label className="block space-y-1 text-xs font-semibold">
              <span>Tên hiển thị *</span>
              <input
                required
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Mô hình tế bào"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="text-lg font-bold">Tệp mô hình 3D</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Chọn tệp GLB 2.0 (tối đa 100 MB). Mô hình sẽ tự căn giữa và fit khung xem.
                Có thể xem trước ngay bên cạnh trước khi lưu.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-muted/20 p-6 text-center hover:bg-muted/40">
                  <FileUp className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold">Chọn tệp GLB từ thiết bị</span>
                  <span className="text-xs text-muted-foreground">Định dạng .glb · tối đa 100 MB</span>
                  <input
                    type="file"
                    accept=".glb,model/gltf-binary,application/octet-stream"
                    className="sr-only"
                    disabled={isSaving}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      if (!file.name.toLowerCase().endsWith(".glb")) {
                        setError("Chỉ hỗ trợ mô hình GLB (.glb).");
                        return;
                      }
                      if (file.size > 100 * 1024 * 1024) {
                        setError("Mô hình 3D không được vượt quá 100 MB.");
                        return;
                      }
                      setSelectedModelFile(file);
                      setError("");
                    }}
                  />
                </label>
                {selectedModelFile ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-xs">
                    <span className="min-w-0 truncate">
                      {selectedModelFile.name} · {(selectedModelFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedModelFile(null)}
                      className="shrink-0 rounded p-1 text-destructive hover:bg-destructive/10"
                      aria-label="Bỏ chọn tệp GLB"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : existingMaterial?.uploadedModelUrl ? (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-300">
                    Đang sử dụng mô hình GLB đã tải lên.
                  </p>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-muted-foreground">XEM TRƯỚC</p>
                <div className="aspect-square overflow-hidden rounded-xl border border-border bg-slate-950">
                  {modelPreviewUrl ? (
                    <Uploaded3DModelViewer
                      url={modelPreviewUrl}
                      title={title || "Mô hình 3D"}
                      className="h-full !min-h-0 rounded-none"
                      showControlsHint={false}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-neutral-400">
                      <FileUp className="h-8 w-8 opacity-60" />
                      Thumbnail mô hình xuất hiện sau khi chọn tệp GLB
                    </div>
                  )}
                </div>
                {modelPreviewUrl ? (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Xoay và phóng to để kiểm tra mô hình
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Mô hình chỉ được xuất bản khi có tệp GLB hợp lệ.</p>
            <div className="flex gap-2">
              <Link
                href="/teacher?tab=explore"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Đang lưu..." : materialId ? "Lưu thay đổi" : "Thêm mô hình"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
