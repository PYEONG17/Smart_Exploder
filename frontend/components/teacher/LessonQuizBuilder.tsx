"use client";

import { useState } from "react";
import { ClipboardList, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createLessonQuiz,
  generateAiLessonQuizDraft,
  type LessonQuizDraftQuestion,
} from "@/lib/api";
import type { Lesson } from "@/types";
import { toast } from "sonner";

type QuizQuestionDraft = {
  question: string;
  questionEn: string;
  options: { content: string; contentEn: string }[];
  correctIndex: number;
};

function createQuestionDraft(): QuizQuestionDraft {
  return {
    question: "",
    questionEn: "",
    options: Array.from({ length: 4 }, () => ({ content: "", contentEn: "" })),
    correctIndex: 0,
  };
}

function mapAiQuestion(question: LessonQuizDraftQuestion): QuizQuestionDraft {
  return {
    question: question.question,
    questionEn: question.questionEn,
    options: question.options.map((content, index) => ({
      content,
      contentEn: question.optionsEn[index] ?? "",
    })),
    correctIndex: question.correctIndex,
  };
}

export function LessonQuizBuilder({
  token,
  lessonId,
  lessonTitle,
  videoId,
  onCreated,
}: {
  token: string;
  lessonId: string;
  lessonTitle: string;
  videoId?: string;
  onCreated: (quiz: NonNullable<Lesson["quizzes"]>[number]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([
    createQuestionDraft(),
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focus, setFocus] = useState(lessonTitle);

  const updateQuestion = (index: number, patch: Partial<QuizQuestionDraft>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  };

  const generateDraft = async () => {
    setIsGenerating(true);
    try {
      const draft = await generateAiLessonQuizDraft(token, lessonId, {
        questionCount: 5,
        focus: focus.trim() || undefined,
        videoId,
      });
      setTitle(draft.title);
      setTitleEn(draft.titleEn);
      setQuestions(draft.questions.map(mapAiQuestion));
      toast.success("AI đã tạo bản nháp. Hãy kiểm tra đáp án trước khi lưu.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo câu hỏi bằng AI.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuiz = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (questions.some((question) => question.options.some((option) => !option.content.trim()))) {
      toast.error("Vui lòng nhập đủ 4 lựa chọn cho mỗi câu.");
      return;
    }
    setIsSaving(true);
    try {
      const quiz = await createLessonQuiz(token, lessonId, {
        title: title.trim(),
        titleEn: titleEn.trim() || undefined,
        videoId,
        questions: questions.map((question) => ({
          question: question.question.trim(),
          questionEn: question.questionEn.trim() || undefined,
          options: question.options.map((option) => ({
            content: option.content.trim(),
            contentEn: option.contentEn.trim() || undefined,
          })),
          correctIndex: question.correctIndex,
        })),
      });
      onCreated(quiz);
      setIsOpen(false);
      setTitle("");
      setTitleEn("");
      setQuestions([createQuestionDraft()]);
      toast.success(videoId ? "Đã tạo bài tập cho video." : "Đã tạo bài tập cho bài học.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu bài tập.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            Bài tập trắc nghiệm
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Tạo câu hỏi, chọn đáp án đúng hoặc để AI soạn bản nháp để thầy cô duyệt.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setIsOpen((open) => !open)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {isOpen ? "Đóng" : "Tạo bài tập"}
        </Button>
      </div>

      {isOpen && (
        <form onSubmit={saveQuiz} className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium">
              <span>Tên bài tập (Tiếng Việt) *</span>
              <input
                required
                minLength={2}
                maxLength={150}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs font-medium">
              <span>Tên bài tập (English)</span>
              <input
                maxLength={150}
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              aria-label="Chủ đề câu hỏi AI"
              placeholder="Chủ đề AI cần tập trung"
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isGenerating}
              onClick={() => void generateDraft()}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Đang soạn..." : "AI tạo 5 câu"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nội dung do AI tạo cần được thầy cô kiểm tra và chỉnh sửa trước khi lưu.
          </p>

          {questions.map((question, questionIndex) => (
            <fieldset
              key={questionIndex}
              className="space-y-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="flex items-center justify-between">
                <legend className="text-xs font-bold">Câu {questionIndex + 1}</legend>
                {questions.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Xóa câu ${questionIndex + 1}`}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((_, index) => index !== questionIndex),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  required
                  minLength={2}
                  maxLength={1000}
                  value={question.question}
                  onChange={(event) =>
                    updateQuestion(questionIndex, { question: event.target.value })
                  }
                  placeholder="Câu hỏi (Tiếng Việt)"
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                />
                <input
                  maxLength={1000}
                  value={question.questionEn}
                  onChange={(event) =>
                    updateQuestion(questionIndex, { questionEn: event.target.value })
                  }
                  placeholder="Question (English)"
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-start gap-2">
                    <input
                      type="radio"
                      name={`correct-${lessonId}-${questionIndex}`}
                      checked={question.correctIndex === optionIndex}
                      onChange={() =>
                        updateQuestion(questionIndex, { correctIndex: optionIndex })
                      }
                      aria-label={`Đặt lựa chọn ${optionIndex + 1} làm đáp án đúng`}
                      className="mt-2"
                    />
                    <div className="grid min-w-0 flex-1 gap-1">
                      <input
                        required
                        maxLength={300}
                        value={option.content}
                        onChange={(event) =>
                          updateQuestion(questionIndex, {
                            options: question.options.map((item, index) =>
                              index === optionIndex
                                ? { ...item, content: event.target.value }
                                : item,
                            ),
                          })
                        }
                        placeholder={`Lựa chọn ${optionIndex + 1}`}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      />
                      <input
                        maxLength={300}
                        value={option.contentEn}
                        onChange={(event) =>
                          updateQuestion(questionIndex, {
                            options: question.options.map((item, index) =>
                              index === optionIndex
                                ? { ...item, contentEn: event.target.value }
                                : item,
                            ),
                          })
                        }
                        placeholder={`Option ${optionIndex + 1} (English)`}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Chọn nút tròn bên cạnh đáp án đúng.
              </p>
            </fieldset>
          ))}

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={questions.length >= 20}
              onClick={() => setQuestions((current) => [...current, createQuestionDraft()])}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm câu
            </Button>
            <Button type="submit" disabled={isSaving || isGenerating}>
              {isSaving ? "Đang lưu..." : "Lưu và giao bài tập"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
