"use client";

import { useEffect, useState } from "react";
import { ClipboardList, PlayCircle } from "lucide-react";
import { Quiz } from "@/components/lessons/Quiz";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLang } from "@/contexts/LanguageContext";
import {
  fetchAvailableQuizzes,
  fetchMyQuizAttempts,
  type AvailableQuiz,
  type QuizAttemptSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

const studentRoles = ["STUDENT"] as const;

export default function AssignmentsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard({
    allowedRoles: [...studentRoles],
    forbiddenRedirectTo: "/teacher",
  });
  const { token, user } = useAuth();
  const { locale } = useLang();
  const isVietnamese = locale === "vi";
  const [quizzes, setQuizzes] = useState<AvailableQuiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<AvailableQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "STUDENT") return;
    let isActive = true;

    Promise.all([fetchAvailableQuizzes(token), fetchMyQuizAttempts(token)])
      .then(([availableQuizzes, quizAttempts]) => {
        if (!isActive) return;
        setQuizzes(availableQuizzes);
        setAttempts(quizAttempts);
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải bài tập.",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token, user?.role]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang tải bài tập...
      </div>
    );
  }

  const latestAttempts = new Map<string, QuizAttemptSummary>();
  for (const attempt of attempts) {
    if (!latestAttempts.has(attempt.quizId)) {
      latestAttempts.set(attempt.quizId, attempt);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 pb-16 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isVietnamese ? "Bài tập của tôi" : "My assignments"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isVietnamese
                ? "Bài kiểm tra được giao theo từng bài học và khóa học."
                : "Quizzes assigned to your lessons and courses."}
            </p>
          </div>
        </div>

        {error ? (
          <p className="py-12 text-center text-destructive">{error}</p>
        ) : activeQuiz ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {isVietnamese
                    ? `${activeQuiz.lesson.course.title} · ${activeQuiz.lesson.title}`
                    : `${activeQuiz.lesson.course.titleEn || activeQuiz.lesson.course.title} · ${activeQuiz.lesson.titleEn || activeQuiz.lesson.title}`}
                </p>
                <h2 className="text-xl font-bold">
                  {isVietnamese
                    ? activeQuiz.title
                    : activeQuiz.titleEn || activeQuiz.title}
                </h2>
              </div>
              <Button variant="outline" onClick={() => setActiveQuiz(null)}>
                {isVietnamese ? "Danh sách bài tập" : "All assignments"}
              </Button>
            </div>
            <Quiz key={activeQuiz.id} quiz={activeQuiz} />
          </section>
        ) : quizzes.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            {isVietnamese
              ? "Hiện chưa có bài tập nào. Bài tập mới sẽ xuất hiện tại đây."
              : "No assignments yet. New assignments will appear here."}
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {quizzes.map((quiz) => {
              const latestAttempt = latestAttempts.get(quiz.id);
              return (
                <article
                  key={quiz.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isVietnamese
                        ? `${quiz.lesson.course.title} · ${quiz.lesson.title}`
                        : `${quiz.lesson.course.titleEn || quiz.lesson.course.title} · ${quiz.lesson.titleEn || quiz.lesson.title}`}
                    </p>
                    <h2 className="mt-1 truncate font-bold text-foreground">
                      {isVietnamese ? quiz.title : quiz.titleEn || quiz.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isVietnamese
                        ? `${quiz.questions.length} câu hỏi`
                        : `${quiz.questions.length} questions`}
                      {latestAttempt &&
                        (isVietnamese
                          ? ` · Lần gần nhất: ${latestAttempt.score}/${latestAttempt.totalQuestions} (${latestAttempt.percentage}%)`
                          : ` · Latest: ${latestAttempt.score}/${latestAttempt.totalQuestions} (${latestAttempt.percentage}%)`)}
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveQuiz(quiz)}
                    className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {latestAttempt
                      ? isVietnamese
                        ? "Làm lại"
                        : "Try again"
                      : isVietnamese
                        ? "Bắt đầu làm"
                        : "Start assignment"}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
