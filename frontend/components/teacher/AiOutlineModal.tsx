"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createLesson,
  generateAiCourseOutline,
  type AiOutlineLesson,
} from "@/lib/api";
import type { Lesson } from "@/types";

type Props = {
  token: string;
  courseId: string;
  nextOrder: number;
  locale: "vi" | "en";
  onClose: () => void;
  onCreated: (lessons: Lesson[]) => void;
};

export function AiOutlineModal({
  token,
  courseId,
  nextOrder,
  locale,
  onClose,
  onCreated,
}: Props) {
  const isVi = locale === "vi";
  const [topic, setTopic] = useState("");
  const [lessonCount, setLessonCount] = useState(6);
  const [outline, setOutline] = useState<AiOutlineLesson[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAiCourseOutline(token, {
        courseId,
        topic: topic.trim() || undefined,
        lessonCount,
      });
      setOutline(result.lessons);
      setSelected(new Set(result.lessons.map((_, index) => index)));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo khung khóa học.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    const chosen = outline.filter((_, index) => selected.has(index));
    if (chosen.length === 0) return;
    setIsSaving(true);
    const created: Lesson[] = [];
    try {
      for (const [index, item] of chosen.entries()) {
        const response = await createLesson(token, {
          courseId,
          title: item.title,
          titleEn: item.titleEn,
          description: item.description,
          descEn: item.descEn,
          duration: item.duration,
          order: nextOrder + index,
        });
        created.push(response.data);
      }
      toast.success(`Đã thêm ${created.length} bài học.`);
      onCreated(created);
      onClose();
    } catch (error) {
      if (created.length > 0) onCreated(created);
      toast.error(
        error instanceof Error ? error.message : "Không thể thêm bài học.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-violet-600" />
            {isVi ? "AI gợi ý khung khóa học" : "AI course outline"}
          </h3>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={
              isVi
                ? "Chủ đề / trọng tâm (không bắt buộc)"
                : "Topic / focus (optional)"
            }
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={lessonCount}
            onChange={(event) => setLessonCount(Number(event.target.value))}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {[3, 4, 5, 6, 8, 10, 12].map((count) => (
              <option key={count} value={count}>
                {count} {isVi ? "bài" : "lessons"}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={isGenerating || isSaving}
            onClick={() => void generate()}
          >
            {isGenerating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {isVi ? "Tạo bằng AI" : "Generate"}
          </Button>
        </div>

        {outline.length > 0 && (
          <>
            <ul className="mt-4 space-y-2">
              {outline.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(index)}
                    onChange={(event) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(index);
                        else next.delete(index);
                        return next;
                      })
                    }
                    aria-label={item.title}
                  />
                  <div className="text-sm">
                    <p className="font-semibold">
                      {isVi ? item.title : item.titleEn}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isVi ? item.description : item.descEn}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                {isVi
                  ? "Nội dung do AI tạo — bạn có thể sửa từng bài sau khi thêm."
                  : "AI-generated — you can edit each lesson after adding."}
              </p>
              <Button
                type="button"
                disabled={isSaving || selected.size === 0}
                onClick={() => void save()}
                className="bg-blue-600 text-white"
              >
                {isSaving
                  ? isVi ? "Đang thêm..." : "Adding..."
                  : isVi
                    ? `Thêm ${selected.size} bài học`
                    : `Add ${selected.size} lessons`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
