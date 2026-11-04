"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Video,
  Upload,
  X,
  Link2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface VideoUploadModalProps {
  lessonTitle: string;
  lessonId: string;
  onClose: () => void;
  /** Được gọi với URL/objectURL đã giải quyết khi giáo viên xác nhận */
  onSave: (lessonId: string, videoTitle: string, videoUrl: string) => void;
}

type Tab = "file" | "url";
type UploadStatus = "idle" | "uploading" | "done" | "error";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function VideoUploadModal({
  lessonTitle,
  lessonId,
  onClose,
  onSave,
}: VideoUploadModalProps) {
  const { t, locale } = useLang();
  const [tab, setTab] = useState<Tab>("file");

  // Trạng thái tải lên tệp
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái URL
  const [videoUrl, setVideoUrl] = useState("");

  // Chung
  const [videoTitle, setVideoTitle] = useState("");

  /* ─── Helpers ─── */
  const ACCEPTED = ["video/mp4", "video/mov", "video/quicktime", "video/avi", "video/webm"];
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
      return locale === "vi" ? "Định dạng không hỗ trợ. Vui lòng chọn MP4, MOV, AVI hoặc WebM." : "Unsupported format. Please select MP4, MOV, AVI, or WebM.";
    }
    if (f.size > MAX_SIZE) {
      return locale === "vi" ? "File vượt quá giới hạn 2GB." : "File exceeds 2GB limit.";
    }
    return null;
  };

  const pickFile = (f: File) => {
    const err = validateFile(f);
    if (err) { toast.error(err); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setUploadStatus("idle");
    setUploadProgress(0);
    if (!videoTitle) setVideoTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  /**
   * Mô phỏng tiến trình tải lên; thay bằng yêu cầu FormData thật khi backend sẵn sàng.
   * Khi chạy thật: gửi POST /api/upload/video cùng FormData rồi dùng URL nhận được.
   */
  const simulateUpload = (): Promise<string> => {
    return new Promise((resolve) => {
      setUploadStatus("uploading");
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(100);
          setUploadStatus("done");
          // Khi triển khai thật, trả về URL do máy chủ cung cấp.
          resolve(previewUrl || "");
        } else {
          setUploadProgress(Math.min(progress, 99));
        }
      }, 200);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      toast.error(locale === "vi" ? "Vui lòng nhập tên video." : "Please enter a video name.");
      return;
    }

    if (tab === "file") {
      if (!file) { toast.error(locale === "vi" ? "Vui lòng chọn file video." : "Please select a video file."); return; }
      try {
        const resolvedUrl = await simulateUpload();
        onSave(lessonId, videoTitle, resolvedUrl);
        toast.success(locale === "vi" ? `Đã upload video "${videoTitle}" thành công!` : `Successfully uploaded "${videoTitle}"!`);
        onClose();
      } catch {
        setUploadStatus("error");
        toast.error(t("common.error"));
      }
    } else {
      if (!videoUrl.trim()) { toast.error(locale === "vi" ? "Vui lòng nhập link video." : "Please enter a video link."); return; }
      onSave(lessonId, videoTitle, videoUrl);
      toast.success(locale === "vi" ? `Đã đính kèm video "${videoTitle}".` : `Attached video "${videoTitle}".`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {/* Lớp nền */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Lớp phủ làm mờ */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Hộp thoại */}
        <motion.div
          className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.35 }}
        >
          {/* Tiêu đề */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Video className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">
                  {t("upload.video.title")}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                  {lessonTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chuyển tab */}
          <div className="flex mx-6 mt-4 mb-1 p-1 bg-muted rounded-xl gap-1">
            {(["file", "url"] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === tabKey
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tabKey === "file" ? (
                  <><HardDrive className="w-3.5 h-3.5" /> {t("upload.video.tab.file")}</>
                ) : (
                  <><Link2 className="w-3.5 h-3.5" /> {t("upload.video.tab.url")}</>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="p-6 pt-3 space-y-4">
            {/* Nội dung tab */}
            {tab === "file" ? (
              <div className="space-y-3">
                {/* Vùng kéo thả */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none
                    ${dragOver
                      ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
                      : file
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-border hover:border-blue-400/60 hover:bg-muted/40"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreviewUrl(null);
                          setUploadStatus("idle");
                          setUploadProgress(0);
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <motion.div
                        animate={dragOver ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Upload className="w-10 h-10 text-muted-foreground" />
                      </motion.div>
                      <p className="text-sm text-muted-foreground">
                        <span>{t("upload.video.drop")}</span>{" "}
                        <span className="text-blue-500 font-semibold hover:underline">
                          {t("upload.video.browse")}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {t("upload.video.formats")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview video thumbnail */}
                {previewUrl && uploadStatus !== "uploading" && (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-32 object-cover rounded-xl border border-border"
                  />
                )}

                {/* Progress bar */}
                {uploadStatus === "uploading" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        {t("common.loading")}
                      </span>
                      <span className="font-mono font-bold text-blue-500">
                        {uploadProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: "linear", duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {uploadStatus === "done" && (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> {t("common.success")}!
                  </div>
                )}
                {uploadStatus === "error" && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-semibold">
                    <AlertCircle className="w-4 h-4" /> {t("common.error")}
                  </div>
                )}
              </div>
            ) : (
              /* Thẻ URL */
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  {t("upload.video.url.ph")}
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... hoặc https://cdn.example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {/* YouTube embed preview */}
                {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    YouTube link được nhận diện
                  </div>
                ) : null}
              </div>
            )}

            {/* Video name (shared) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {t("upload.video.name")}
              </label>
              <input
                type="text"
                placeholder={t("upload.video.name.ph")}
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={uploadStatus === "uploading"}
              >
                {t("upload.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={uploadStatus === "uploading"}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl px-6"
              >
                {uploadStatus === "uploading" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("common.loading")}</>
                ) : (
                  t("upload.save")
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
