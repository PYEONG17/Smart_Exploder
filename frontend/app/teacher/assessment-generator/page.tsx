"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clipboard, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  generateAssessment,
  type AssessmentDifficulty,
  type GeneratedAssessment,
} from "@/lib/api";

export default function AssessmentGeneratorPage() {
  const { isLoading: isAuthLoading } = useAuthGuard({
    allowedRoles: ["TEACHER", "ADMIN"],
    forbiddenRedirectTo: "/assignments",
  });
  const { token } = useAuth();
  const [grade, setGrade] = useState("6");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] =
    useState<AssessmentDifficulty>("MEDIUM");
  const [questionCount, setQuestionCount] = useState("10");
  const [assessment, setAssessment] = useState<GeneratedAssessment | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error("Vui lòng đăng nhập lại.");
      return;
    }

    setIsGenerating(true);
    setAssessment(null);
    try {
      const result = await generateAssessment(token, {
        grade: Number(grade),
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        question_count: Number(questionCount),
        locale: "vi",
      });
      setAssessment(result);
      toast.success("Đã tạo đề nháp. Vui lòng kiểm tra trước khi sử dụng.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo đề lúc này.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!assessment) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(assessment, null, 2));
      toast.success("Đã sao chép JSON đề kiểm tra.");
    } catch {
      toast.error("Không thể sao chép. Hãy chọn và sao chép JSON thủ công.");
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-24">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Quay lại trang giáo viên
        </Link>

        <header>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-300">
            <Sparkles className="size-4" />
            AI Assessment Generator
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Tạo đề kiểm tra STEM
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Tạo bản nháp theo khối lớp, chủ đề, mức độ và Bloom taxonomy. AI
            tạo đủ MCQ, Đúng/Sai, Nối cặp, Điền khuyết và Trả lời ngắn; giáo
            viên cần rà soát đáp án trước khi dùng.
          </p>
        </header>

        <form
          onSubmit={(event) => void handleGenerate(event)}
          className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2"
        >
          <label className="grid gap-2 text-sm font-medium">
            Khối lớp
            <select
              required
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              {Array.from({ length: 9 }, (_, index) => index + 1).map(
                (level) => (
                  <option key={level} value={level}>
                    Lớp {level}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Môn học
            <input
              required
              minLength={2}
              maxLength={100}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ví dụ: Toán, Khoa học"
              className="h-10 rounded-lg border border-border bg-background px-3"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            Chủ đề
            <input
              required
              minLength={2}
              maxLength={240}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Ví dụ: Phân số, Hệ Mặt Trời"
              className="h-10 rounded-lg border border-border bg-background px-3"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Mức độ mục tiêu
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as AssessmentDifficulty)
              }
              className="h-10 rounded-lg border border-border bg-background px-3"
            >
              <option value="EASY">Cơ bản</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Nâng cao</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Số câu (5–30)
            <input
              required
              type="number"
              min={5}
              max={30}
              value={questionCount}
              onChange={(event) => setQuestionCount(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3"
            />
          </label>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="h-10 gap-2 bg-purple-600 px-5 text-white hover:bg-purple-700"
            >
              {isGenerating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isGenerating ? "Đang tạo đề..." : "Tạo đề bằng Gemini"}
            </Button>
          </div>
        </form>

        {assessment && (
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  {assessment.quiz.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {assessment.questions.length} câu · Điểm độ khó trung bình{" "}
                  {assessment.difficulty_score.toFixed(1)}/5
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void handleCopy()}
              >
                <Clipboard className="size-4" />
                Sao chép JSON
              </Button>
            </div>
            <pre className="max-h-[70vh] overflow-auto p-4 text-xs leading-5 text-foreground">
              <code>{JSON.stringify(assessment, null, 2)}</code>
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
