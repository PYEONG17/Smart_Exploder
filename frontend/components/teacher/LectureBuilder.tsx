"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getYouTubeEmbedUrl } from "@/lib/video-url";
import { SortableList } from "./SortableList";
import { moveItem } from "./useDragReorder";

export type LectureVideoDraft = {
  id: string;
  mode: "url" | "file";
  url: string;
  file: File | null;
};

export type LectureDraft = {
  id: string;
  title: string;
  description: string;
  videos: LectureVideoDraft[];
};

export const MAX_LECTURE_VIDEO_BYTES = 1024 * 1024 * 1024;

export const createVideoDraft = (): LectureVideoDraft => ({
  id: crypto.randomUUID(),
  mode: "url",
  url: "",
  file: null,
});

export const createLectureDraft = (): LectureDraft => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  videos: [createVideoDraft()],
});

type Props = {
  value: LectureDraft[];
  onChange: (lectures: LectureDraft[]) => void;
  language: "vi" | "en";
  disabled?: boolean;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50";

export function LectureBuilder({ value, onChange, language, disabled }: Props) {
  const isVi = language === "vi";

  const updateLecture = (id: string, patch: Partial<LectureDraft>) =>
    onChange(
      value.map((lecture) =>
        lecture.id === id ? { ...lecture, ...patch } : lecture,
      ),
    );

  const updateVideo = (
    lectureId: string,
    videoId: string,
    patch: Partial<LectureVideoDraft>,
  ) =>
    onChange(
      value.map((lecture) =>
        lecture.id === lectureId
          ? {
              ...lecture,
              videos: lecture.videos.map((video) =>
                video.id === videoId ? { ...video, ...patch } : video,
              ),
            }
          : lecture,
      ),
    );

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {isVi
            ? "Bài giảng & video (không bắt buộc)"
            : "Lectures & videos (optional)"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isVi
            ? "Mỗi bài giảng có nội dung riêng và có thể gắn nhiều video. Câu hỏi tương tác và tài liệu thêm ở bước chỉnh sửa tiếp theo."
            : "Each lecture has its own content and can hold several videos. Add interactive questions and materials in the next step."}
        </p>
      </div>

      {value.map((lecture, lectureIndex) => (
        <fieldset
          key={lecture.id}
          disabled={disabled}
          className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <legend className="text-sm font-bold">
              {isVi ? "Bài giảng" : "Lecture"} {lectureIndex + 1}
            </legend>
            <div className="ml-auto flex items-center">
              <button
                type="button"
                aria-label={isVi ? "Chuyển bài lên" : "Move lecture up"}
                disabled={lectureIndex === 0}
                onClick={() => onChange(moveItem(value, lectureIndex, lectureIndex - 1))}
                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={isVi ? "Chuyển bài xuống" : "Move lecture down"}
                disabled={lectureIndex === value.length - 1}
                onClick={() => onChange(moveItem(value, lectureIndex, lectureIndex + 1))}
                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                onChange(value.filter((item) => item.id !== lecture.id))
              }
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {isVi ? "Xóa bài" : "Remove"}
            </Button>
          </div>

          <input
            value={lecture.title}
            onChange={(event) =>
              updateLecture(lecture.id, { title: event.target.value })
            }
            placeholder={
              isVi ? "Tên bài giảng (không bắt buộc)" : "Lecture title (optional)"
            }
            className={inputClass}
          />
          <textarea
            rows={3}
            value={lecture.description}
            onChange={(event) =>
              updateLecture(lecture.id, { description: event.target.value })
            }
            placeholder={
              isVi
                ? "Nội dung bài giảng / mô tả chủ đề (không bắt buộc)"
                : "Lecture content / topic description (optional)"
            }
            className={`${inputClass} resize-none`}
          />

          <div className="space-y-3">
            <SortableList
              items={lecture.videos}
              label={isVi ? "Sắp xếp video" : "Reorder videos"}
              className="space-y-3"
              onReorder={(ids) =>
                updateLecture(lecture.id, {
                  videos: ids.flatMap((id) => {
                    const found = lecture.videos.find((item) => item.id === id);
                    return found ? [found] : [];
                  }),
                })
              }
              renderItem={(video, videoIndex, { handle }) => (
              <div
                className="space-y-2 rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {handle}
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold">
                    Video {videoIndex + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant={video.mode === "url" ? "default" : "outline"}
                    onClick={() =>
                      updateVideo(lecture.id, video.id, { mode: "url" })
                    }
                  >
                    {isVi ? "Dán link" : "Paste link"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={video.mode === "file" ? "default" : "outline"}
                    onClick={() =>
                      updateVideo(lecture.id, video.id, { mode: "file" })
                    }
                  >
                    {isVi ? "Tải lên" : "Upload"}
                  </Button>
                  {lecture.videos.length > 1 && (
                    <button
                      type="button"
                      aria-label={isVi ? "Xóa video" : "Remove video"}
                      className="ml-auto text-destructive hover:opacity-70"
                      onClick={() =>
                        updateLecture(lecture.id, {
                          videos: lecture.videos.filter(
                            (item) => item.id !== video.id,
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {video.mode === "url" ? (
                  <>
                    <input
                      type="url"
                      value={video.url}
                      onChange={(event) =>
                        updateVideo(lecture.id, video.id, {
                          url: event.target.value,
                        })
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={inputClass}
                    />
                    {getYouTubeEmbedUrl(video.url.trim()) && (
                      <iframe
                        src={getYouTubeEmbedUrl(video.url.trim()) ?? ""}
                        title={`Video ${videoIndex + 1}`}
                        className="aspect-video w-full rounded-xl border border-border"
                        allow="accelerometer; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                      onChange={(event) =>
                        updateVideo(lecture.id, video.id, {
                          file: event.currentTarget.files?.[0] ?? null,
                        })
                      }
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/10 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-500/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      {video.file
                        ? `${video.file.name} · ${(video.file.size / (1024 * 1024)).toFixed(1)} MB`
                        : "MP4, WebM, MOV, AVI; tối đa 1 GB."}
                    </p>
                  </div>
                )}
              </div>
              )}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                updateLecture(lecture.id, {
                  videos: [...lecture.videos, createVideoDraft()],
                })
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {isVi ? "Thêm video" : "Add video"}
            </Button>
          </div>
        </fieldset>
      ))}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => onChange([...value, createLectureDraft()])}
      >
        <Plus className="mr-1 h-4 w-4" />
        {isVi ? "Thêm bài giảng" : "Add lecture"}
      </Button>
    </div>
  );
}
