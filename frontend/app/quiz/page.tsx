"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Layers,
  BrainCircuit,
  PlusCircle,
  RotateCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  Play,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Plus,
  Send,
  Loader2,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import {
  fetchMyCourses,
  createLessonQuiz,
  generateAssessment,
  type AssessmentDifficulty,
} from "@/lib/api";
import type { Course, Lesson } from "@/types";

// ── Types ──────────────────────────────────────────────────────────
export type Flashcard = {
  id: string;
  front: string;
  back: string;
  tag: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  mastered?: boolean;
};

export type PracticeQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
};

// ── Initial Mock / Default Data ─────────────────────────────────────
const defaultFlashcards: Flashcard[] = [
  {
    id: "fc-1",
    front: "Định luật I Newton (Quán tính)",
    back: "Một vật nếu không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực cân bằng thì sẽ giữ nguyên trạng thái đứng yên hoặc chuyển động thẳng đều.",
    tag: "Khoa học - Vật lý",
    difficulty: "EASY",
    mastered: false,
  },
  {
    id: "fc-2",
    front: "Photosynthesis (Quang hợp)",
    back: "Quá trình thực vật sử dụng ánh sáng mặt trời để chuyển đổi nước và CO₂ thành glucose và khí O₂ (6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂).",
    tag: "Khoa học - Sinh học",
    difficulty: "MEDIUM",
    mastered: false,
  },
  {
    id: "fc-3",
    front: "Định lý Pytago",
    back: "Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông: a² + b² = c².",
    tag: "Toán học - Hình học",
    difficulty: "EASY",
    mastered: true,
  },
  {
    id: "fc-4",
    front: "Mặt phẳng tọa độ Descartes",
    back: "Hệ trục gồm hai trục số vuông góc với nhau tại gốc O: trục hoành Ox nằm ngang và trục tung Oy thẳng đứng.",
    tag: "Toán học - Đại số",
    difficulty: "MEDIUM",
    mastered: false,
  },
];

const defaultQuestions: PracticeQuestion[] = [
  {
    id: "q-1",
    question: "Số nguyên tố chẵn duy nhất trong tập hợp các số tự nhiên là số nào?",
    options: ["0", "2", "4", "Không có số nào"],
    correctAnswer: 1,
    explanation: "2 là số nguyên tố chẵn duy nhất vì mọi số chẵn khác lớn hơn 2 đều chia hết cho 2 ngoài 1 và chính nó.",
    topic: "Toán học",
  },
  {
    id: "q-2",
    question: "Hành tinh nào trong Hệ Mặt Trời được mệnh danh là 'Hành tinh Đỏ'?",
    options: ["Sao Kim (Venus)", "Sao Hỏa (Mars)", "Sao Mộc (Jupiter)", "Sao Thủy (Mercury)"],
    correctAnswer: 1,
    explanation: "Sao Hỏa có màu đỏ cam do bề mặt chứa nhiều oxit sắt (gỉ sắt) phản xạ ánh sáng mặt trời.",
    topic: "Khoa học",
  },
  {
    id: "q-3",
    question: "Tam giác đều là tam giác có đặc điểm nào dưới đây?",
    options: [
      "Có 2 cạnh bằng nhau",
      "Có 1 góc vuông 90°",
      "Có 3 cạnh bằng nhau và 3 góc bằng 60°",
      "Có tổng ba góc bằng 360°",
    ],
    correctAnswer: 2,
    explanation: "Tam giác đều có 3 cạnh bằng nhau và mỗi góc trong có số đo chính xác là 60°.",
    topic: "Toán học",
  },
];

export default function QuizHubPage() {
  const { user, token } = useAuth();
  const { locale } = useLang();
  const isVietnamese = locale === "vi";

  // Tab: "flashcards" | "practice" | "teacher-assignment"
  const [activeTab, setActiveTab] = useState<"flashcards" | "practice" | "teacher-assignment">("flashcards");

  // ── Flashcard state ───────────────────────────────────────────────
  const [flashcards, setFlashcards] = useState<Flashcard[]>(defaultFlashcards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newTag, setNewTag] = useState("Toán học");
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // ── Practice Quiz State ──────────────────────────────────────────
  const [questions, setQuestions] = useState<PracticeQuestion[]>(defaultQuestions);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Quick Create question state
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQTitle, setNewQTitle] = useState("");
  const [newQOptions, setNewQOptions] = useState(["", "", "", ""]);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState("");
  const [newQTopic, setNewQTopic] = useState("Toán học");

  // ── Teacher Assignment Creation State ────────────────────────────
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiGrade, setAiGrade] = useState("6");
  const [aiDifficulty, setAiDifficulty] = useState<AssessmentDifficulty>("MEDIUM");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load teacher courses if user has rights
  useEffect(() => {
    if (token && isTeacher) {
      fetchMyCourses(token)
        .then((courses) => {
          setTeacherCourses(courses);
          if (courses.length > 0) {
            setSelectedCourseId(courses[0].id);
          }
        })
        .catch(() => {
          // ignore or fallback
        });
    }
  }, [token, isTeacher]);

  const selectedCourse = teacherCourses.find((c) => c.id === selectedCourseId);
  const lessonOptions: Lesson[] = selectedCourse?.lessons || [];

  // Flashcard controls
  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleMastered = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, mastered: !card.mastered } : card
      )
    );
    toast.success(isVietnamese ? "Đã cập nhật trạng thái thẻ!" : "Card status updated!");
  };

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) {
      toast.error(isVietnamese ? "Vui lòng nhập mặt trước và mặt sau thẻ" : "Please fill in front and back");
      return;
    }
    const newCard: Flashcard = {
      id: "fc-" + Date.now(),
      front: newFront.trim(),
      back: newBack.trim(),
      tag: newTag,
      difficulty: "MEDIUM",
      mastered: false,
    };
    setFlashcards((prev) => [newCard, ...prev]);
    setNewFront("");
    setNewBack("");
    setShowAddCardModal(false);
    toast.success(isVietnamese ? "Đã thêm thẻ ghi nhớ mới!" : "Flashcard added successfully!");
  };

  // Practice Quiz controls
  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === questions[currentQIndex].correctAnswer) {
      setScore((s) => s + 1);
      toast.success(isVietnamese ? "Chính xác! Làm tốt lắm 🎉" : "Correct! Well done 🎉");
    } else {
      toast.error(isVietnamese ? "Chưa chính xác. Hãy xem giải thích bên dưới nhé!" : "Incorrect. Check the explanation below!");
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTitle.trim() || newQOptions.some((opt) => !opt.trim())) {
      toast.error(isVietnamese ? "Vui lòng nhập đầy đủ câu hỏi và 4 lựa chọn" : "Please fill in all options");
      return;
    }
    const newQ: PracticeQuestion = {
      id: "q-" + Date.now(),
      question: newQTitle.trim(),
      options: newQOptions.map((o) => o.trim()),
      correctAnswer: newQCorrect,
      explanation: newQExplanation.trim() || (isVietnamese ? "Đáp án chính xác." : "Correct answer."),
      topic: newQTopic,
    };
    setQuestions((prev) => [...prev, newQ]);
    setNewQTitle("");
    setNewQOptions(["", "", "", ""]);
    setNewQExplanation("");
    setShowAddQuestionModal(false);
    toast.success(isVietnamese ? "Đã thêm câu hỏi ôn tập mới!" : "Practice question added!");
  };

  // Teacher AI Assessment generation and direct publishing
  const handleTeacherGenerateAndPublish = async () => {
    if (!token) {
      toast.error(isVietnamese ? "Vui lòng đăng nhập" : "Please log in");
      return;
    }
    if (!selectedLessonId) {
      toast.error(isVietnamese ? "Vui lòng chọn bài học cần giao bài tập" : "Please select a lesson");
      return;
    }
    if (!aiTopic.trim()) {
      toast.error(isVietnamese ? "Vui lòng nhập chủ đề bài tập" : "Please enter a topic");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const assessment = await generateAssessment(token, {
        grade: Number(aiGrade),
        subject: selectedCourse?.subject === "math" ? "Mathematics" : "Science",
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
        question_count: 5,
        locale: isVietnamese ? "vi" : "en",
      });

      setIsPublishing(true);
      // Map AI assessment questions into lesson quiz format
      const formattedQuestions = assessment.questions.map((q) => {
        const choices = q.choices && q.choices.length > 0 ? q.choices : ["A", "B", "C", "D"];
        const ansObj = assessment.answers.find((a) => a.question_number === q.question_number);
        const correctStr = String(ansObj?.correct_answer || choices[0]);

        return {
          question: q.prompt,
          type: "MULTIPLE_CHOICE" as const,
          answers: choices.map((choice) => ({
            content: choice,
            isCorrect: choice.toLowerCase().trim() === correctStr.toLowerCase().trim(),
          })),
        };
      });

      // Ensure at least one correct answer per question
      formattedQuestions.forEach((fq) => {
        if (!fq.answers.some((a) => a.isCorrect)) {
          fq.answers[0].isCorrect = true;
        }
      });

      await createLessonQuiz(token, selectedLessonId, {
        title: assignmentTitle.trim() || assessment.quiz.title,
        questions: formattedQuestions,
      });

      toast.success(
        isVietnamese
          ? "Đã tạo và giao bài tập trắc nghiệm thành công cho học sinh!"
          : "Quiz assignment successfully created and assigned to students!"
      );
      setAssignmentTitle("");
      setAiTopic("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : isVietnamese ? "Không thể tạo bài tập lúc này" : "Failed to create assignment"
      );
    } finally {
      setIsGeneratingAi(false);
      setIsPublishing(false);
    }
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <main className="min-h-screen bg-background pb-20 pt-24">
      <div className="page-container max-w-6xl">
        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm md:p-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="eyebrow mb-3">
                <BrainCircuit className="h-4 w-4" />
                {isVietnamese ? "Trung tâm Luyện tập & Đánh giá" : "Practice & Assessment Hub"}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {isVietnamese ? "Quiz & Flashcard Thông Minh" : "Smart Quiz & Flashcards"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {isVietnamese
                  ? "Tăng tốc ghi nhớ thuật ngữ STEM với thẻ ghi nhớ tương tác, luyện tập câu hỏi trắc nghiệm và giao bài tập kiểm tra cho học sinh."
                  : "Accelerate your STEM retention with interactive flashcards, practice quizzes, and teacher assignment tools."}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={activeTab === "flashcards" ? "default" : "outline"}
                className="rounded-xl font-semibold gap-2"
                onClick={() => setActiveTab("flashcards")}
              >
                <Layers className="h-4 w-4" />
                Flashcard ({flashcards.length})
              </Button>
              <Button
                variant={activeTab === "practice" ? "default" : "outline"}
                className="rounded-xl font-semibold gap-2"
                onClick={() => setActiveTab("practice")}
              >
                <HelpCircle className="h-4 w-4" />
                {isVietnamese ? "Ôn tập Quiz" : "Practice Quiz"}
              </Button>
              {isTeacher && (
                <Button
                  variant={activeTab === "teacher-assignment" ? "default" : "outline"}
                  className="rounded-xl font-semibold gap-2 border-primary/30"
                  onClick={() => setActiveTab("teacher-assignment")}
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {isVietnamese ? "Giáo viên Giao Bài" : "Assign Quiz"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── TAB 1: FLASHCARDS ────────────────────────────────────────── */}
        {activeTab === "flashcards" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1 font-semibold text-xs rounded-xl">
                  {currentCardIndex + 1} / {flashcards.length} {isVietnamese ? "thẻ" : "cards"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {flashcards.filter((c) => c.mastered).length} {isVietnamese ? "đã thuộc" : "mastered"}
                </span>
              </div>
              <Button
                onClick={() => setShowAddCardModal(true)}
                className="rounded-xl gap-2 font-semibold shadow-xs"
              >
                <Plus className="h-4 w-4" />
                {isVietnamese ? "Tạo Flashcard mới" : "New Flashcard"}
              </Button>
            </div>

            {/* Flashcard Component */}
            {flashcards.length > 0 && currentCard ? (
              <div className="mx-auto max-w-2xl">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  role="button"
                  tabIndex={0}
                  aria-label="Click to flip card"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsFlipped(!isFlipped);
                    }
                  }}
                  className="group relative h-80 w-full cursor-pointer select-none rounded-3xl border border-border/90 bg-card p-8 shadow-md transition-all hover:border-primary/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                      {currentCard.tag}
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCw className="h-3.5 w-3.5 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                      {isVietnamese ? "Nhấp để lật thẻ" : "Click to flip"}
                    </span>
                  </div>

                  <div className="my-auto text-center px-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {isFlipped ? (isVietnamese ? "Đáp án / Ý nghĩa" : "Answer / Meaning") : (isVietnamese ? "Thuật ngữ / Khái niệm" : "Term / Question")}
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold leading-relaxed text-foreground">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/70 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMastered(currentCard.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                        currentCard.mastered
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {currentCard.mastered
                        ? (isVietnamese ? "Đã ghi nhớ" : "Mastered")
                        : (isVietnamese ? "Đánh dấu đã thuộc" : "Mark as mastered")}
                    </button>
                    <span>{isVietnamese ? "Nhấn phím Cách để lật" : "Press Space to flip"}</span>
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevCard}
                    className="rounded-2xl h-11 w-11"
                    title="Thẻ trước"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl px-6 font-semibold"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    {isVietnamese ? "Lật thẻ" : "Flip"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextCard}
                    className="rounded-2xl h-11 w-11"
                    title="Thẻ tiếp theo"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                {isVietnamese ? "Chưa có flashcard nào. Hãy tạo chiếc thẻ đầu tiên!" : "No flashcards yet. Create your first card!"}
              </div>
            )}

            {/* Modal / Form: Add Flashcard */}
            {showAddCardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {isVietnamese ? "Tạo Flashcard Mới" : "Create New Flashcard"}
                  </h3>
                  <form onSubmit={handleAddFlashcard} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "Chủ đề / Môn học" : "Subject / Topic"}
                      </label>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Toán học, Vật lý, Sinh học..."
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "Mặt trước (Khái niệm / Câu hỏi)" : "Front (Question / Term)"}
                      </label>
                      <textarea
                        rows={2}
                        value={newFront}
                        onChange={(e) => setNewFront(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Ví dụ: Định luật bảo toàn năng lượng..."
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "Mặt sau (Giải thích / Ý nghĩa)" : "Back (Explanation / Definition)"}
                      </label>
                      <textarea
                        rows={3}
                        value={newBack}
                        onChange={(e) => setNewBack(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Năng lượng không tự nhiên sinh ra hay mất đi..."
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowAddCardModal(false)}
                        className="rounded-xl"
                      >
                        {isVietnamese ? "Hủy" : "Cancel"}
                      </Button>
                      <Button type="submit" className="rounded-xl font-semibold">
                        {isVietnamese ? "Thêm thẻ" : "Add Card"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PRACTICE QUIZ ─────────────────────────────────────── */}
        {activeTab === "practice" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1 font-semibold text-xs rounded-xl">
                  {isVietnamese ? "Câu hỏi" : "Question"} {currentQIndex + 1} / {questions.length}
                </Badge>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isVietnamese ? "Điểm:" : "Score:"} {score}
                </span>
              </div>
              <Button
                onClick={() => setShowAddQuestionModal(true)}
                className="rounded-xl gap-2 font-semibold shadow-xs"
              >
                <Plus className="h-4 w-4" />
                {isVietnamese ? "Tự soạn câu hỏi ôn tập" : "Create Question"}
              </Button>
            </div>

            {quizFinished ? (
              <div className="mx-auto max-w-xl rounded-3xl border border-border/80 bg-card p-8 text-center shadow-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {isVietnamese ? "Hoàn thành buổi ôn tập!" : "Quiz completed!"}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {isVietnamese
                    ? `Bạn đã đạt ${score}/${questions.length} câu trả lời chính xác (${Math.round((score / questions.length) * 100)}%).`
                    : `You scored ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%).`}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button onClick={handleResetQuiz} className="rounded-xl font-semibold">
                    <RotateCw className="h-4 w-4 mr-2" />
                    {isVietnamese ? "Làm lại bài kiểm tra" : "Restart Quiz"}
                  </Button>
                </div>
              </div>
            ) : questions.length > 0 ? (
              <div className="mx-auto max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-sm md:p-8">
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span className="rounded-full bg-primary/10 text-primary px-3 py-1">
                    {questions[currentQIndex].topic}
                  </span>
                  <span>
                    {isVietnamese ? "Chọn 1 đáp án đúng nhất" : "Select the best answer"}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-foreground mb-6 leading-relaxed">
                  {questions[currentQIndex].question}
                </h3>

                <div className="space-y-3">
                  {questions[currentQIndex].options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === questions[currentQIndex].correctAnswer;
                    let optionStyle = "border-border/80 hover:bg-muted/60";

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500/80 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                      } else if (isSelected) {
                        optionStyle = "border-destructive/80 bg-destructive/10 text-destructive font-semibold";
                      } else {
                        optionStyle = "opacity-50 border-border";
                      }
                    } else if (isSelected) {
                      optionStyle = "border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20";
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerSubmitted}
                        className={`w-full flex items-center gap-3 p-4 text-left rounded-2xl border text-sm transition-all ${optionStyle}`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-current text-xs font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-snug">{option}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        )}
                        {isAnswerSubmitted && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-destructive shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {isAnswerSubmitted && (
                  <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed animate-in fade-in">
                    <p className="font-bold text-primary mb-1">
                      {isVietnamese ? "💡 Giải thích đáp án:" : "💡 Explanation:"}
                    </p>
                    <p className="text-muted-foreground">
                      {questions[currentQIndex].explanation}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border/70">
                  {!isAnswerSubmitted ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="rounded-xl font-semibold px-6"
                    >
                      {isVietnamese ? "Kiểm tra đáp án" : "Check Answer"}
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion} className="rounded-xl font-semibold px-6">
                      {currentQIndex + 1 < questions.length
                        ? (isVietnamese ? "Câu tiếp theo" : "Next Question")
                        : (isVietnamese ? "Xem kết quả" : "View Results")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal: Add Custom Question */}
            {showAddQuestionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {isVietnamese ? "Tạo Câu Hỏi Ôn Tập Mới" : "Create New Practice Question"}
                  </h3>
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "Môn học / Chủ đề" : "Topic"}
                      </label>
                      <input
                        type="text"
                        value={newQTopic}
                        onChange={(e) => setNewQTopic(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "Nội dung câu hỏi" : "Question Prompt"}
                      </label>
                      <textarea
                        rows={2}
                        value={newQTitle}
                        onChange={(e) => setNewQTitle(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Nhập nội dung câu hỏi..."
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "4 Lựa chọn trả lời & Chọn đáp án đúng" : "4 Options & Correct Answer"}
                      </label>
                      <div className="space-y-2">
                        {newQOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctAnswerOption"
                              checked={newQCorrect === i}
                              onChange={() => setNewQCorrect(i)}
                              className="h-4 w-4 text-primary"
                              title="Chọn làm đáp án đúng"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newQOptions];
                                updated[i] = e.target.value;
                                setNewQOptions(updated);
                              }}
                              className="flex-1 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        {isVietnamese ? "Giải thích đáp án" : "Explanation"}
                      </label>
                      <textarea
                        rows={2}
                        value={newQExplanation}
                        onChange={(e) => setNewQExplanation(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Giải thích vì sao đáp án này đúng..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowAddQuestionModal(false)}
                        className="rounded-xl"
                      >
                        {isVietnamese ? "Hủy" : "Cancel"}
                      </Button>
                      <Button type="submit" className="rounded-xl font-semibold">
                        {isVietnamese ? "Lưu câu hỏi" : "Save Question"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TEACHER ASSIGNMENT CREATION ──────────────────────── */}
        {activeTab === "teacher-assignment" && isTeacher && (
          <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {isVietnamese ? "Giáo viên Soạn & Giao Bài Kiểm Tra" : "Create & Assign Quiz to Students"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isVietnamese
                      ? "Tạo bộ câu hỏi theo chuẩn bài giảng hoặc sử dụng AI để tự động tạo đề kiểm tra."
                      : "Create quiz questions aligned to your course lessons or generate them instantly with AI."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      {isVietnamese ? "1. Chọn Khóa học" : "1. Select Course"}
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setSelectedLessonId("");
                      }}
                      className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {teacherCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      {isVietnamese ? "2. Chọn Bài học để giao" : "2. Select Lesson"}
                    </label>
                    <select
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">
                        {isVietnamese ? "-- Chọn bài học --" : "-- Select a lesson --"}
                      </option>
                      {lessonOptions.map((l) => (
                        <option key={l.id} value={l.id}>
                          Bài {l.order}: {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    {isVietnamese ? "3. Tiêu đề bài kiểm tra" : "3. Quiz Title"}
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="Ví dụ: Kiểm tra 15 phút - Định luật Newton..."
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      {isVietnamese ? "Trợ lý AI Tự Động Tạo Bộ Câu Hỏi" : "AI Quiz Generator"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        {isVietnamese ? "Khối lớp" : "Grade"}
                      </label>
                      <select
                        value={aiGrade}
                        onChange={(e) => setAiGrade(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground"
                      >
                        {["6", "7", "8", "9"].map((g) => (
                          <option key={g} value={g}>
                            Lớp {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        {isVietnamese ? "Độ khó" : "Difficulty"}
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as AssessmentDifficulty)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground"
                      >
                        <option value="EASY">Cơ bản (Easy)</option>
                        <option value="MEDIUM">Vừa phải (Medium)</option>
                        <option value="HARD">Nâng cao (Hard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        {isVietnamese ? "Chủ đề kiến thức" : "Topic"}
                      </label>
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Ví dụ: Phân số, Định luật Newton..."
                        className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {isVietnamese
                      ? "AI sẽ tạo 5 câu hỏi trắc nghiệm chất lượng cao kèm giải thích và tự động lưu trực tiếp vào bài tập của học sinh."
                      : "AI will generate 5 high-quality questions with explanations and link them directly to student assignments."}
                  </p>

                  <Button
                    onClick={handleTeacherGenerateAndPublish}
                    disabled={isGeneratingAi || isPublishing || !selectedLessonId || !aiTopic.trim()}
                    className="w-full rounded-xl font-semibold gap-2 py-5 shadow-xs"
                  >
                    {isGeneratingAi || isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isGeneratingAi
                          ? (isVietnamese ? "Đang soạn đề bằng AI..." : "Generating with AI...")
                          : (isVietnamese ? "Đang lưu bài tập..." : "Publishing assignment...")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {isVietnamese ? "Tạo và Giao Bài Kiểm Tra Ngay" : "Generate & Assign Quiz Now"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
