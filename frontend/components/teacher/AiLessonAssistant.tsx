"use client";

import { useState } from "react";
import { Loader2, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createLessonMaterial,
  createLessonQuiz,
  findAiLessonResources,
  generateAiLessonDraft,
  updateLesson,
  type AiLessonDraft,
  type AiResourceResult,
} from "@/lib/api";
import type { Lesson, Material } from "@/types";

type Props = {
  token: string;
  lesson: Lesson;
  locale: "vi" | "en";
  onLessonUpdated: (lesson: Lesson) => void;
  onQuizSaved: (lessonId: string, quiz: NonNullable<Lesson["quizzes"]>[number]) => void;
  onMaterialAdded: (material: Material) => void;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AiLessonAssistant({
  token,
  lesson,
  locale,
  onLessonUpdated,
  onQuizSaved,
  onMaterialAdded,
}: Props) {
  const isVi = locale === "vi";
  const [busy, setBusy] = useState<"draft" | "resources" | "save" | null>(null);
  const [draft, setDraft] = useState<AiLessonDraft | null>(null);
  const [resources, setResources] = useState<AiResourceResult | null>(null);
  const [addedUrls, setAddedUrls] = useState<string[]>([]);

  const runDraft = async () => {
    setBusy("draft");
    try {
      setDraft(await generateAiLessonDraft(token, lesson.id));
    } catch (error) {
      toast.error(errorMessage(error, "Không thể soạn bài bằng AI."));
    } finally {
      setBusy(null);
    }
  };

  const runResources = async () => {
    setBusy("resources");
    try {
      setResources(await findAiLessonResources(token, lesson.id, locale));
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tìm tài liệu."));
    } finally {
      setBusy(null);
    }
  };

  const applyDescription = async () => {
    if (!draft) return;
    setBusy("save");
    try {
      const bullets = (language: "vi" | "en") =>
        draft.keyPoints.map((point) => `• ${point[language]}`).join("\n");
      const updated = await updateLesson(token, lesson.id, {
        description: `${draft.description}\n\n${bullets("vi")}`.slice(0, 5000),
        descEn: `${draft.descEn}\n\n${bullets("en")}`.slice(0, 5000),
      });
      onLessonUpdated(updated);
      toast.success("Đã áp dụng mô tả và ý chính vào bài học.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật bài học."));
    } finally {
      setBusy(null);
    }
  };

  const saveQuiz = async () => {
    if (!draft) return;
    setBusy("save");
    try {
      const saved = await createLessonQuiz(token, lesson.id, {
        title: isVi ? "Bài tập do AI soạn" : "AI-generated quiz",
        questions: draft.quiz.map((item) => ({
          question: item.question,
          questionEn: item.questionEn,
          type: "MULTIPLE_CHOICE" as const,
          answers: item.options.map((content, index) => ({
            content,
            contentEn: item.optionsEn[index],
            isCorrect: index === item.correctIndex,
          })),
        })),
      });
      onQuizSaved(lesson.id, saved as NonNullable<Lesson["quizzes"]>[number]);
      toast.success("Đã lưu bài tập AI vào bài học.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu bài tập."));
    } finally {
      setBusy(null);
    }
  };

  const addSource = async (source: { title: string; url: string }) => {
    try {
      const material = await createLessonMaterial(token, lesson.id, {
        title: source.title.slice(0, 150),
        type: "OTHER",
        url: source.url,
      });
      onMaterialAdded(material);
      setAddedUrls((urls) => [...urls, source.url]);
      toast.success("Đã thêm vào tài liệu bài học.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể thêm tài liệu."));
    }
  };

  return (
    <section className="mb-4 space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <h4 className="text-sm font-bold">
          {isVi ? "Trợ lý AI cho bài học" : "AI lesson assistant"}
        </h4>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void runDraft()}
          >
            {busy === "draft" ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3.5 w-3.5" />
            )}
            {isVi ? "AI soạn nội dung & bài tập" : "AI draft content & quiz"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void runResources()}
          >
            {busy === "resources" ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="mr-1 h-3.5 w-3.5" />
            )}
            {isVi ? "AI tìm tài liệu" : "AI find resources"}
          </Button>
        </div>
      </div>

      {draft && (
        <div className="space-y-3 rounded-lg border border-border bg-background p-3 text-xs">
          <p className="whitespace-pre-line">
            {isVi ? draft.description : draft.descEn}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {draft.keyPoints.map((point, index) => (
              <li key={index}>{isVi ? point.vi : point.en}</li>
            ))}
          </ul>
          <ol className="list-decimal space-y-2 pl-5">
            {draft.quiz.map((item, index) => (
              <li key={index}>
                <span className="font-semibold">
                  {isVi ? item.question : item.questionEn}
                </span>
                <ul className="mt-1 space-y-0.5">
                  {(isVi ? item.options : item.optionsEn).map((option, optionIndex) => (
                    <li
                      key={optionIndex}
                      className={
                        optionIndex === item.correctIndex
                          ? "font-semibold text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy !== null}
              onClick={() => void applyDescription()}
            >
              {isVi ? "Áp dụng mô tả & ý chính" : "Apply description & key points"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void saveQuiz()}
            >
              {isVi ? "Lưu thành bài tập" : "Save as quiz"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isVi
              ? "Nội dung do AI tạo — hãy kiểm tra lại trước khi đăng cho học sinh."
              : "AI-generated content — please review before publishing to students."}
          </p>
        </div>
      )}

      {resources && (
        <div className="space-y-2 rounded-lg border border-border bg-background p-3 text-xs">
          {resources.text && (
            <p className="whitespace-pre-line">{resources.text}</p>
          )}
          {resources.sources.length === 0 ? (
            <p className="text-muted-foreground">
              {isVi ? "AI chưa tìm thấy nguồn phù hợp." : "No sources found."}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {resources.sources.map((source) => (
                <li key={source.url} className="flex items-center gap-2">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-blue-600 hover:underline"
                  >
                    {source.title}
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={addedUrls.includes(source.url)}
                    onClick={() => void addSource(source)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {addedUrls.includes(source.url)
                      ? isVi ? "Đã thêm" : "Added"
                      : isVi ? "Thêm vào bài" : "Add to lesson"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
