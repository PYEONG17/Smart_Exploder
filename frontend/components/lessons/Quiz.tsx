"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { submitQuizResult } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLang } from "@/contexts/LanguageContext";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

interface QuizQuestion {
  id: string;
  question: string;
  questionEn?: string | null;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK";
  answers: {
    id: string;
    content: string;
    contentEn?: string | null;
  }[];
  explanation?: string;
  explanationEn?: string;
}

interface QuizProps {
  quiz: {
    id: string;
    title: string;
    titleEn?: string | null;
    questions: QuizQuestion[];
  };
}

export function Quiz({ quiz }: QuizProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { locale } = useLang();
  const isVietnamese = locale === "vi";
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
  } | null>(null);

  const question = quiz.questions[currentQuestionIdx];
  const selectedAnswer = question ? (answers[question.id] ?? null) : null;

  const handleSelectAnswer = (answerId: string) => {
    if (!question || isSubmitting) return;
    setAnswers((current) => ({ ...current, [question.id]: answerId }));
  };

  const handleNext = async () => {
    if (!selectedAnswer) return;

    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      return;
    }

    if (!token) {
      toast.error("Vui lòng đăng nhập để lưu kết quả bài kiểm tra.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const attempt = await submitQuizResult(token, quiz.id, {
        ...answers,
        [question.id]: selectedAnswer,
      });
      setResult(attempt);
      if (attempt.percentage >= 80) {
        toast.success("Tuyệt vời! Bạn đã hoàn thành xuất sắc bài kiểm tra.");
      } else {
        toast.info("Hoàn thành! Hãy ôn lại bài để củng cố kiến thức nhé.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể lưu kết quả bài kiểm tra.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    const percentage = result.percentage;
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 md:p-10 text-center max-w-2xl mx-auto shadow-sm">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
          {isVietnamese ? "Hoàn thành bài kiểm tra" : "Assignment completed"}
        </h3>
        <p className="text-sm text-muted-foreground mb-8">
          {isVietnamese
            ? `Bạn đã hoàn tất bài tập "${quiz.title}"`
            : `You completed "${quiz.titleEn || quiz.title}"`}
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
          <div className="text-center p-4 rounded-xl border border-border/60 bg-muted/30">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {result.score}/{result.totalQuestions}
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              {isVietnamese ? "Số câu đúng" : "Correct"}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl border border-border/60 bg-muted/30">
            <div
              className={`text-2xl sm:text-3xl font-extrabold ${percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : percentage >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {percentage}%
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              {isVietnamese ? "Tỉ lệ chính xác" : "Accuracy"}
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setResult(null);
            setCurrentQuestionIdx(0);
            setAnswers({});
          }}
          className="rounded-xl px-6 font-semibold"
        >
          {isVietnamese ? "Làm lại bài kiểm tra" : "Try again"}
        </Button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-muted-foreground">
        {isVietnamese
          ? "Bài kiểm tra chưa có câu hỏi."
          : "This quiz has no questions yet."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {isVietnamese ? quiz.title : quiz.titleEn || quiz.title}
          </h3>
          {quiz.titleEn && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isVietnamese ? quiz.titleEn : quiz.title}
            </p>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
          <span>{isVietnamese ? "Câu" : "Question"}</span>
          <span className="text-foreground font-bold">{currentQuestionIdx + 1}</span>
          <span>/</span>
          <span>{quiz.questions.length}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {isVietnamese ? `Câu hỏi ${currentQuestionIdx + 1}` : `Question ${currentQuestionIdx + 1}`}
          </span>
          <h4 className="mt-2 text-base sm:text-lg font-semibold text-foreground leading-relaxed">
            {isVietnamese
              ? question.question
              : question.questionEn || question.question}
          </h4>
          {question.questionEn && isVietnamese && (
            <p className="mt-1 text-xs text-muted-foreground">
              {question.questionEn}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="grid gap-3 mb-8 sm:grid-cols-2">
          {question.answers.map((answer, answerIndex) => {
            const isSelected = selectedAnswer === answer.id;
            const letter = OPTION_LETTERS[answerIndex % OPTION_LETTERS.length];

            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => handleSelectAnswer(answer.id)}
                disabled={isSubmitting}
                className={`group relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/8 ring-2 ring-primary/25 shadow-xs"
                    : "border-border/80 bg-background/50 hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
                  }`}
                >
                  {letter}
                </span>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className={`text-sm leading-snug transition-colors ${
                      isSelected
                        ? "font-semibold text-foreground"
                        : "text-foreground/90 group-hover:text-foreground"
                    }`}
                  >
                    {isVietnamese
                      ? answer.content
                      : answer.contentEn || answer.content}
                  </p>
                  {answer.contentEn && isVietnamese && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {answer.contentEn}
                    </p>
                  )}
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/70 pt-5">
          <span className="text-xs text-muted-foreground">
            {selectedAnswer
              ? isVietnamese
                ? "Đã chọn câu trả lời"
                : "Answer selected"
              : isVietnamese
                ? "Vui lòng chọn 1 đáp án"
                : "Please select an option"}
          </span>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer || isSubmitting}
            className="rounded-xl px-5 font-semibold"
          >
            {isSubmitting
              ? isVietnamese
                ? "Đang lưu..."
                : "Saving..."
              : currentQuestionIdx < quiz.questions.length - 1
                ? isVietnamese
                  ? "Câu tiếp theo"
                  : "Next question"
                : isVietnamese
                  ? "Nộp bài kiểm tra"
                  : "Submit"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
