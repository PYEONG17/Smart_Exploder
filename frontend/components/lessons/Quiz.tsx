"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { submitQuizResult } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLang } from "@/contexts/LanguageContext";

const TILE_STYLES = [
  { bg: "bg-red-500 border-red-700", shape: "▲" },
  { bg: "bg-blue-500 border-blue-700", shape: "◆" },
  { bg: "bg-amber-500 border-amber-700", shape: "●" },
  { bg: "bg-emerald-500 border-emerald-700", shape: "■" },
];

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
      <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-2xl mx-auto">
        <div className="mx-auto w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold mb-2">
          {isVietnamese ? "Hoàn thành bài kiểm tra!" : "Assignment completed!"}
        </h3>
        <p className="text-muted-foreground mb-6">
          {isVietnamese
            ? `Bạn đã hoàn thành bài kiểm tra "${quiz.title}"`
            : `You completed "${quiz.titleEn || quiz.title}"`}
        </p>

        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="text-center p-4 rounded-xl bg-muted/50 w-32">
            <div className="text-3xl font-bold text-foreground">
              {result.score}/{result.totalQuestions}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              {isVietnamese ? "Điểm số" : "Score"}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50 w-32">
            <div
              className={`text-3xl font-bold ${percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-red-500"}`}
            >
              {percentage}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              {isVietnamese ? "Độ chính xác" : "Accuracy"}
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setResult(null);
            setCurrentQuestionIdx(0);
            setAnswers({});
          }}
        >
          {isVietnamese ? "Làm lại bài kiểm tra" : "Try again"}
        </Button>
      </div>
    );
  }

  if (!question) {
    return (
      <p className="text-center text-muted-foreground">
        {isVietnamese
          ? "Bài kiểm tra chưa có câu hỏi."
          : "This quiz has no questions yet."}
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">
            {isVietnamese ? quiz.title : quiz.titleEn || quiz.title}
          </h3>
          {quiz.titleEn && (
            <p className="mt-1 text-sm text-muted-foreground">
              {isVietnamese ? quiz.titleEn : quiz.title}
            </p>
          )}
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {isVietnamese ? "Câu" : "Question"} {currentQuestionIdx + 1} /{" "}
          {quiz.questions.length}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h4 className="text-lg font-medium text-foreground mb-6 leading-relaxed">
          <span>
            {isVietnamese
              ? question.question
              : question.questionEn || question.question}
          </span>
          {question.questionEn && (
            <span className="mt-2 block text-sm font-normal text-muted-foreground">
              {isVietnamese ? question.questionEn : question.question}
            </span>
          )}
        </h4>

        <div className="grid gap-3 mb-8 sm:grid-cols-2">
          {question.answers.map((answer, answerIndex) => {
            const isSelected = selectedAnswer === answer.id;
            const tile = TILE_STYLES[answerIndex % TILE_STYLES.length];
            const answerClass = `${tile.bg} text-white shadow-md border-b-4 active:translate-y-0.5 active:border-b-2 ${
              selectedAnswer && !isSelected ? "opacity-50" : "hover:brightness-110"
            } ${isSelected ? "ring-4 ring-foreground/30" : ""}`;

            return (
              <button
                key={answer.id}
                onClick={() => handleSelectAnswer(answer.id)}
                disabled={isSubmitting}
                className={`w-full text-left p-4 rounded-xl font-medium transition-all ${answerClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl leading-none" aria-hidden="true">
                    {tile.shape}
                  </span>
                  <span className="flex-1">
                    {isVietnamese
                      ? answer.content
                      : answer.contentEn || answer.content}
                    {answer.contentEn && (
                      <span className="mt-1 block text-sm font-normal text-white/80">
                        {isVietnamese ? answer.contentEn : answer.content}
                      </span>
                    )}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-border pt-6">
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer || isSubmitting}
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
                  ? "Nộp bài"
                  : "Submit"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
