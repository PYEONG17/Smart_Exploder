"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ChevronLeft,
  PlayCircle,
  FileText,
  Download,
  CheckCircle2,
  Lock,
  Menu,
  X,
  HelpCircle,
  Box,
  Bot,
  Send,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mockCourses, mockLessons } from "@/lib/mock-data";
import { Quiz } from "@/components/lessons/Quiz";
import { InteractiveEventOverlay } from "@/components/lessons/InteractiveEventOverlay";
import { TutorAnswer } from "@/components/ai/TutorAnswer";
import { ThreeDViewer, type ModelType } from "@/components/ui/ThreeDViewer";
import {
  fetchLessonById,
  fetchLessonQuestions,
  postLessonQuestion,
  recordVideoWatchHeartbeat,
  saveProgress,
  sendChatMessage,
  type LessonQuestion,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import type {
  Course,
  InteractiveActivity,
  Lesson,
  Quiz as LessonQuiz,
} from "@/types";
import { useInteractiveVideoStore } from "@/stores/interactiveVideoStore";
import { toast } from "sonner";
import { getYouTubeEmbedUrl } from "@/lib/video-url";

function getThreeDModelType(value: unknown): ModelType {
  switch (value) {
    case "torus":
    case "icosahedron":
    case "atom":
    case "solar_system":
    case "dna":
      return value;
    default:
      return "sphere";
  }
}

function getDemoCourseLessons(courseId: string): {
  course: Course;
  lessons: Lesson[];
} | null {
  const demoCourse = mockCourses.find((item) => item.id === courseId);
  if (!demoCourse) return null;

  const lessons =
    courseId === "c1"
      ? mockLessons
      : Array.from({ length: demoCourse.lessonCount }, (_, index) => ({
          id: `${courseId}-l${index + 1}`,
          title: `Bài ${index + 1}: Nội dung bài học ${index + 1}`,
          titleEn: `Lesson ${index + 1}: Lesson content ${index + 1}`,
          description: `Mô tả ngắn cho bài học ${index + 1}`,
          descriptionEn: "Short description",
          order: index + 1,
          duration: "20 phút",
          courseId,
          isLocked: index > 2,
          isCompleted: index < 2,
        }));

  const course: Course = {
    id: demoCourse.id,
    title: demoCourse.title,
    titleEn: demoCourse.titleEn,
    description: demoCourse.description,
    descEn: demoCourse.descriptionEn,
    subject: demoCourse.subject,
    subjectLabel: demoCourse.subjectLabel,
    level: demoCourse.level,
    lessonCount: lessons.length,
    lessons: lessons.map(({ descriptionEn, ...lesson }) => ({
      ...lesson,
      descEn: descriptionEn,
    })),
  };

  return { course, lessons: course.lessons ?? [] };
}

const DEFAULT_REWIND_SECONDS = 20;

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = use(params);
  const router = useRouter();
  const { token, user } = useAuth();
  const { locale } = useLang();
  const isVietnamese = locale === "vi";
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "video" | "content" | "threed" | "materials" | "quiz" | "questions"
  >("video");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [lessonQuiz, setLessonQuiz] = useState<LessonQuiz | null>(null);
  const [lessonQuestions, setLessonQuestions] = useState<LessonQuestion[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [questionLanguage, setQuestionLanguage] = useState<"vi" | "en">(
    isVietnamese ? "vi" : "en",
  );
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(
    null,
  );
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const activeCheckpoint = useInteractiveVideoStore(
    (state) => state.activeEvent,
  );
  const completedEventIds = useInteractiveVideoStore(
    (state) => state.completedEventIds,
  );
  const cancelActiveEvent = useInteractiveVideoStore(
    (state) => state.cancelActiveEvent,
  );
  const activateEvent = useInteractiveVideoStore(
    (state) => state.activateEvent,
  );
  const completeActiveEvent = useInteractiveVideoStore(
    (state) => state.completeActiveEvent,
  );
  const startVideoSession = useInteractiveVideoStore(
    (state) => state.startSession,
  );
  const rearmEvents = useInteractiveVideoStore((state) => state.rearmEvents);
  const setVideoPhase = useInteractiveVideoStore((state) => state.setPhase);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchSessionRef = useRef<{
    videoId: string;
    sessionId: string;
    lastPositionMs: number | null;
    lastHeartbeatAt: number | null;
  } | null>(null);
  const watchHeartbeatQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [aiInput, setAiInput] = useState("");
  const [isSendingAi, setIsSendingAi] = useState(false);
  const [aiChat, setAiChat] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  useEffect(() => {
    if (!token || !lessonId) return;
    let isActive = true;
    fetchLessonQuestions(token, lessonId)
      .then((questions) => {
        if (isActive) setLessonQuestions(questions);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setQuestionLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải phần hỏi đáp.",
          );
        }
      });
    return () => {
      isActive = false;
    };
  }, [lessonId, token]);

  useEffect(() => {
    const videos = lesson?.videos ?? [];
    const video =
      videos.find((item) => item.id === selectedVideoId) ?? videos[0];
    if (video) {
      startVideoSession(video.id);
      watchSessionRef.current = {
        videoId: video.id,
        sessionId: crypto.randomUUID(),
        lastPositionMs: null,
        lastHeartbeatAt: null,
      };
    }
  }, [lesson?.videos, selectedVideoId, startVideoSession]);

  useEffect(() => {
    let isActive = true;
    const demoData = getDemoCourseLessons(id);
    const applyDemoData = () => {
      const demoLesson = demoData?.lessons.find((item) => item.id === lessonId);
      if (!demoData || !demoLesson) return false;
      setCourse(demoData.course);
      setLessons(demoData.lessons);
      setLesson(demoLesson);
      setIsLessonCompleted(demoLesson.isCompleted ?? false);
      setAiChat([
        {
          role: "assistant",
          text: `Xin chào! Tôi là Trợ lý AI SmartExplorer. Bạn có thắc mắc gì về bài học "${demoLesson.title}" không?`,
        },
      ]);
      return true;
    };

    fetchLessonById(lessonId)
      .then((lessonData) => {
        if (!isActive) return;
        if (lessonData?.courseId === id) {
          setCourse(lessonData.course);
          setLessons(lessonData.course.lessons ?? [lessonData]);
          setLesson(lessonData);
          setLessonQuiz(lessonData.quizzes?.[0] ?? null);
          setSelectedVideoId(lessonData.videos?.[0]?.id ?? null);
          setIsLessonCompleted(false);
          setAiChat([
            {
              role: "assistant",
              text: `Xin chào! Tôi là Trợ lý AI SmartExplorer. Bạn có thắc mắc gì về bài học "${lessonData.title}" không?`,
            },
          ]);
        } else if (!applyDemoData()) {
          setLoadError("Không tìm thấy bài học.");
        }
      })
      .catch((error: unknown) => {
        if (isActive && !applyDemoData()) {
          setLoadError(
            error instanceof Error ? error.message : "Không thể tải bài học.",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id, lessonId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang tải bài học...
      </div>
    );
  }

  if (loadError || !course || !lesson) {
    notFound();
  }

  const lessonVideos = lesson.videos ?? [];
  const currentVideo =
    lessonVideos.find((video) => video.id === selectedVideoId) ??
    lessonVideos[0];
  const currentYouTubeEmbed = currentVideo
    ? getYouTubeEmbedUrl(currentVideo.url)
    : null;

  const completedCount = lessons.filter(
    (l) => l.isCompleted || (l.id === lessonId && isLessonCompleted),
  ).length;
  const progressPercent = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const tabs = [
    {
      id: "video" as const,
      label: isVietnamese ? "Video bài giảng" : "Lesson videos",
      icon: PlayCircle,
    },
    {
      id: "content" as const,
      label: isVietnamese ? "Lý thuyết" : "Theory",
      icon: FileText,
    },
    {
      id: "threed" as const,
      label: isVietnamese ? "Mô hình 3D" : "3D models",
      icon: Box,
    },
    {
      id: "materials" as const,
      label: isVietnamese ? "Tài liệu" : "Materials",
      icon: Download,
    },
    {
      id: "quiz" as const,
      label: isVietnamese ? "Bài tập" : "Assignments",
      icon: HelpCircle,
    },
    {
      id: "questions" as const,
      label: isVietnamese ? "Hỏi giáo viên" : "Ask the teacher",
      icon: MessageCircle,
    },
  ];

  const handleVideoTimeUpdate = (
    event: React.SyntheticEvent<HTMLVideoElement>,
  ) => {
    const media = event.currentTarget;
    if (!media.paused) recordPlaybackHeartbeat(media);
    if (!currentVideo || activeCheckpoint) return;

    // Scrubbing back before a finished checkpoint makes it appear again.
    const rearmIds = (currentVideo.activities ?? [])
      .filter(
        (item) =>
          completedEventIds.has(item.id) &&
          (item.timestampMs ?? item.timestamp * 1000) / 1000 -
            media.currentTime >
            0.5,
      )
      .map((item) => item.id);
    if (rearmIds.length) rearmEvents(rearmIds);

    const activity = [...(currentVideo.activities ?? [])]
      .sort(
        (first, second) =>
          (first.timestampMs ?? first.timestamp * 1000) -
          (second.timestampMs ?? second.timestamp * 1000),
      )
      .find(
        (item) =>
          event.currentTarget.currentTime >=
            (item.timestampMs ?? item.timestamp * 1000) / 1000 &&
          !completedEventIds.has(item.id),
      );
    if (!activity) return;

    const eventTimeSeconds =
      (activity.timestampMs ?? activity.timestamp * 1000) / 1000;
    if (event.currentTarget.currentTime > eventTimeSeconds) {
      event.currentTarget.currentTime = eventTimeSeconds;
    }
    activateEvent(activity);
    event.currentTarget.pause();
  };

  const recordPlaybackHeartbeat = (
    media: HTMLVideoElement,
    force = false,
  ) => {
    if (!token || !currentVideo) return;
    const tracker = watchSessionRef.current;
    if (!tracker || tracker.videoId !== currentVideo.id) return;

    const now = Date.now();
    const positionMs = Math.floor(media.currentTime * 1000);
    if (document.visibilityState !== "visible") {
      tracker.lastPositionMs = positionMs;
      tracker.lastHeartbeatAt = now;
      return;
    }
    if (tracker.lastPositionMs === null || tracker.lastHeartbeatAt === null) {
      tracker.lastPositionMs = positionMs;
      tracker.lastHeartbeatAt = now;
      return;
    }

    const elapsedMs = now - tracker.lastHeartbeatAt;
    if (elapsedMs < (force ? 2_000 : 10_000)) return;
    tracker.lastPositionMs = positionMs;
    tracker.lastHeartbeatAt = now;

    watchHeartbeatQueueRef.current = watchHeartbeatQueueRef.current
      .then(() =>
        recordVideoWatchHeartbeat(token, currentVideo.id, {
          clientEventId: crypto.randomUUID(),
          sessionId: tracker.sessionId,
          positionMs,
          occurredAt: new Date(now).toISOString(),
        }),
      )
      .catch((error: unknown) => {
        console.error("Unable to record video watch heartbeat:", error);
      });
  };

  const resetPlaybackHeartbeat = (media: HTMLVideoElement) => {
    const tracker = watchSessionRef.current;
    if (!tracker || tracker.videoId !== currentVideo?.id) return;
    tracker.lastPositionMs = Math.floor(media.currentTime * 1000);
    tracker.lastHeartbeatAt = Date.now();
  };

  const handleRewindVideo = (activity: InteractiveActivity) => {
    const media = videoRef.current;
    const eventSeconds =
      (activity.timestampMs ?? activity.timestamp * 1000) / 1000;
    const configured = activity.content.rewindSeconds;
    const rewindSeconds =
      typeof configured === "number" ? configured : DEFAULT_REWIND_SECONDS;
    cancelActiveEvent();
    if (!media) return;
    media.currentTime = Math.max(0, eventSeconds - rewindSeconds);
    void media.play();
  };

  const handleContinueVideo = () => {
    completeActiveEvent();
    void videoRef.current?.play();
  };

  const handleCompleteLesson = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để lưu tiến độ học tập.");
      router.push("/login");
      return;
    }

    setIsSavingProgress(true);
    try {
      await saveProgress(token, lesson.id, "COMPLETED");
      setIsLessonCompleted(true);
      toast.success(
        "Đã ghi nhận hoàn thành bài học! Tiến độ của bạn đã được lưu.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu tiến độ.",
      );
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handlePostQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error(
        isVietnamese
          ? "Đăng nhập để gửi câu hỏi cho giáo viên."
          : "Sign in to ask your teacher a question.",
      );
      router.push("/login");
      return;
    }
    if (user?.role !== "STUDENT") {
      toast.error(
        isVietnamese
          ? "Tính năng gửi câu hỏi dành cho học sinh."
          : "Only students can post lesson questions.",
      );
      return;
    }
    if (questionText.trim().length < 3) {
      toast.error(
        isVietnamese
          ? "Câu hỏi cần có ít nhất 3 ký tự."
          : "Please enter at least 3 characters.",
      );
      return;
    }

    setIsPostingQuestion(true);
    try {
      const created = await postLessonQuestion(token, lessonId, {
        text: questionText.trim(),
        language: questionLanguage,
      });
      setLessonQuestions((current) => [...current, created]);
      setQuestionText("");
      toast.success(
        isVietnamese
          ? "Đã gửi câu hỏi. Giáo viên sẽ thấy câu hỏi bằng ngôn ngữ của họ."
          : "Question posted. Your teacher will see it in their language.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isVietnamese
            ? "Không thể gửi câu hỏi."
            : "Could not post your question.",
      );
    } finally {
      setIsPostingQuestion(false);
    }
  };

  const handleSendAi = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiInput.trim() || isSendingAi) return;
    if (!token) {
      toast.error("Đăng nhập để trò chuyện với trợ lý AI.");
      router.push("/login");
      return;
    }

    const userMsg = aiInput.trim();
    const history = aiChat
      .slice(aiChat[0]?.role === "assistant" ? 1 : 0)
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.text }));
    setAiChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setIsSendingAi(true);
    try {
      const reply = await sendChatMessage(token, userMsg, history, {
        grade: course.level,
        subject: course.subjectLabel || course.subject,
        lessonTitle: isVietnamese
          ? lesson.title
          : lesson.titleEn || lesson.title,
        lessonDescription: isVietnamese
          ? lesson.description
          : lesson.descEn || lesson.description,
        lessonId: lesson.id,
        locale: isVietnamese ? "vi" : "en",
      });
      setAiChat((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
        },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể kết nối trợ lý AI. Vui lòng thử lại.",
      );
    } finally {
      setIsSendingAi(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-background">
      {/* Top Navbar for Lesson */}
      <div className="sticky top-16 z-30 flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Trở về khóa học</span>
          </Link>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <h1 className="text-sm font-semibold truncate max-w-45 sm:max-w-md">
            {lesson.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Tiến trình:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {progressPercent}%
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleCompleteLesson}
            disabled={isSavingProgress}
            className={`${isLessonCompleted ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} text-white font-medium`}
          >
            {isLessonCompleted ? (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            ) : null}
            {isSavingProgress
              ? "Đang lưu..."
              : isLessonCompleted
                ? "Đã hoàn thành"
                : "Hoàn thành bài học"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="rounded-xl border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
            title="Trợ lý AI Hỗ trợ"
          >
            <Bot className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (Lessons List) */}
        <aside
          className={`absolute inset-y-0 left-0 z-20 flex w-[min(20rem,88vw)] flex-col border-r border-border/70 bg-card/95 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:w-80 lg:translate-x-0 lg:bg-muted/20 lg:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="border-b border-border/70 bg-card/80 p-4">
            <h2 className="font-bold text-foreground line-clamp-2">
              {course.title}
            </h2>
            <div className="mt-4 h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount}/{lessons.length} bài hoàn thành
            </p>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
            {lessons.map((l) => {
              const isCurrent = l.id === lessonId;
              const isDone =
                l.isCompleted || (l.id === lessonId && isLessonCompleted);
              return (
                <Link
                  key={l.id}
                  href={
                    l.isLocked ? "#" : `/courses/${course.id}/lessons/${l.id}`
                  }
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    isCurrent
                      ? "border border-primary/25 bg-primary/8 font-medium text-primary"
                      : l.isLocked
                        ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                        : "hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    if (l.isLocked) e.preventDefault();
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : l.isLocked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <PlayCircle
                        className={`w-4 h-4 ${isCurrent ? "text-blue-500" : "text-muted-foreground"}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm leading-snug">{l.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {l.duration}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-background/60 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Tabs Header */}
            <div className="mb-7 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/70 bg-card/75 p-1.5 shadow-sm scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-background text-primary shadow-sm ring-1 ring-border/70"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab: Video */}
            {activeTab === "video" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {lessonVideos.length > 1 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {lessonVideos.map((video) => (
                      <Button
                        key={video.id}
                        size="sm"
                        variant={
                          currentVideo?.id === video.id ? "default" : "outline"
                        }
                        onClick={() => {
                          setSelectedVideoId(video.id);
                          startVideoSession(video.id);
                        }}
                      >
                        {isVietnamese
                          ? video.title
                          : video.titleEn || video.title}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.5)] md:rounded-3xl">
                  {currentVideo && currentYouTubeEmbed ? (
                    <iframe
                      key={currentVideo.id}
                      src={currentYouTubeEmbed}
                      title={
                        isVietnamese
                          ? currentVideo.title
                          : currentVideo.titleEn || currentVideo.title
                      }
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : currentVideo ? (
                    <video
                      key={currentVideo.id}
                      ref={videoRef}
                      className="h-full w-full"
                      controls
                      playsInline
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPlay={(event) => {
                        if (!watchSessionRef.current) {
                          watchSessionRef.current = {
                            videoId: currentVideo.id,
                            sessionId: crypto.randomUUID(),
                            lastPositionMs: null,
                            lastHeartbeatAt: null,
                          };
                        }
                        resetPlaybackHeartbeat(event.currentTarget);
                        if (!activeCheckpoint) setVideoPhase("PLAYING");
                      }}
                      onPause={() => {
                        if (videoRef.current) {
                          recordPlaybackHeartbeat(videoRef.current, true);
                        }
                        if (
                          !useInteractiveVideoStore.getState().activeEvent
                        ) {
                          setVideoPhase("PAUSED_BY_USER");
                        }
                      }}
                      onSeeking={(event) =>
                        resetPlaybackHeartbeat(event.currentTarget)
                      }
                      onEnded={(event) => {
                        recordPlaybackHeartbeat(event.currentTarget, true);
                        setVideoPhase("ENDED");
                      }}
                      aria-label={
                        isVietnamese
                          ? currentVideo.title
                          : currentVideo.titleEn || currentVideo.title
                      }
                    >
                      <source src={currentVideo.url} />
                      {isVietnamese
                        ? "Trình duyệt không hỗ trợ phát video này."
                        : "Your browser cannot play this video."}
                    </video>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white/70">
                      <PlayCircle className="h-10 w-10" />
                      <p>
                        {isVietnamese
                          ? "Giáo viên chưa thêm video cho bài học này."
                          : "No lesson video has been added yet."}
                      </p>
                    </div>
                  )}

                  {activeCheckpoint && currentVideo && (
                    <InteractiveEventOverlay
                      activity={activeCheckpoint}
                      videoId={currentVideo.id}
                      token={token}
                      isVietnamese={isVietnamese}
                      lessonTitle={
                        isVietnamese
                          ? lesson.title
                          : lesson.titleEn || lesson.title
                      }
                      grade={course.level}
                      subject={course.subjectLabel || course.subject}
                      onContinue={handleContinueVideo}
                      onRewind={handleRewindVideo}
                    />
                  )}
                </div>

                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-xs font-semibold">
                      {isVietnamese
                        ? `Bài ${lesson.order}`
                        : `Lesson ${lesson.order}`}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {lesson.duration}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">
                    {isVietnamese
                      ? lesson.title
                      : lesson.titleEn || lesson.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {isVietnamese
                      ? lesson.description
                      : lesson.descEn || lesson.description}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Content (Theory) */}
            {activeTab === "content" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line text-muted-foreground">
                      {lesson.description ||
                        "Bài học chưa có nội dung lý thuyết."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: 3D Model Explorer */}
            {activeTab === "threed" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
                  <div className="aspect-video w-full relative bg-slate-950">
                    <ThreeDViewer
                      modelType={
                        "threeDModelType" in lesson &&
                        typeof lesson.threeDModelType === "string"
                          ? getThreeDModelType(lesson.threeDModelType)
                          : "sphere"
                      }
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-1">
                      Mô hình 3D tương tác bài học
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sử dụng chuột trái để xoay 360°, cuộn chuột để phóng
                      to/thu nhỏ vật thể.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Materials */}
            {activeTab === "materials" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6">Tài liệu đính kèm</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(lesson.materials ?? []).length ? (
                    lesson.materials?.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center p-4 border border-border rounded-2xl bg-card hover:border-blue-500/50 hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mr-4 text-blue-600 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">
                            {material.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {material.type}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground group-hover:text-blue-600"
                          asChild
                        >
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Mở tài liệu ${material.title}`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                      Bài học chưa có tài liệu đính kèm.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Quiz */}
            {activeTab === "quiz" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {lessonQuiz ? (
                  <Quiz quiz={lessonQuiz} />
                ) : (
                  <p className="py-12 text-center text-muted-foreground">
                    Bài học này chưa có bài kiểm tra.
                  </p>
                )}
              </div>
            )}

            {activeTab === "questions" && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    {isVietnamese ? "Hỏi giáo viên" : "Ask the teacher"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isVietnamese
                      ? "Hỏi về bài học hoặc tài liệu. Bạn chỉ cần viết bằng một ngôn ngữ; câu hỏi và lời giải sẽ được dịch tự động."
                      : "Ask about the lesson or materials. Write in either language; questions and answers are translated automatically."}
                  </p>
                </div>

                <form
                  onSubmit={handlePostQuestion}
                  className="space-y-3 rounded-xl border border-primary/20 bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="lesson-question-language"
                      className="text-sm font-medium"
                    >
                      {isVietnamese
                        ? "Ngôn ngữ bạn đang viết"
                        : "Language you are writing in"}
                    </label>
                    <select
                      id="lesson-question-language"
                      value={questionLanguage}
                      onChange={(event) =>
                        setQuestionLanguage(event.target.value as "vi" | "en")
                      }
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={3000}
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    placeholder={
                      isVietnamese
                        ? "Viết câu hỏi hoặc điều bạn chưa hiểu..."
                        : "Ask a question or describe what you don't understand..."
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {isVietnamese
                        ? "Nội dung sẽ tự dịch sang ngôn ngữ còn lại."
                        : "Your message will be translated into the other language."}
                    </span>
                    <Button
                      type="submit"
                      disabled={isPostingQuestion || user?.role !== "STUDENT"}
                      className="gap-2"
                    >
                      {isPostingQuestion && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {isPostingQuestion
                        ? isVietnamese
                          ? "Đang gửi..."
                          : "Posting..."
                        : isVietnamese
                          ? "Gửi câu hỏi"
                          : "Post question"}
                    </Button>
                  </div>
                  {user?.role !== "STUDENT" && (
                    <p className="text-xs text-muted-foreground">
                      {isVietnamese
                        ? "Đăng nhập bằng tài khoản học sinh để gửi câu hỏi."
                        : "Sign in with a student account to post a question."}
                    </p>
                  )}
                </form>

                {questionLoadError && (
                  <p role="alert" className="text-sm text-destructive">
                    {questionLoadError}
                  </p>
                )}
                <div className="space-y-3">
                  {lessonQuestions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                      {isVietnamese
                        ? "Chưa có câu hỏi nào cho bài học này."
                        : "No questions have been posted for this lesson yet."}
                    </p>
                  ) : (
                    lessonQuestions.map((question) => {
                      const questionTextForDisplay =
                        (isVietnamese ? "vi" : "en") ===
                        question.questionLanguage
                          ? question.question
                          : question.questionTranslated;
                      const answerForDisplay =
                        question.answer === null
                          ? null
                          : (isVietnamese ? "vi" : "en") ===
                              question.answerLanguage
                            ? question.answer
                            : question.answerTranslated;
                      return (
                        <article
                          key={question.id}
                          className="space-y-3 rounded-xl border border-border bg-card p-4"
                        >
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {question.authorId === user?.id
                                ? isVietnamese
                                  ? "Câu hỏi của bạn"
                                  : "Your question"
                                : isVietnamese
                                  ? "Câu hỏi học sinh"
                                  : "Student question"}
                              {" · "}
                              {new Date(question.createdAt).toLocaleString(
                                isVietnamese ? "vi-VN" : "en-US",
                              )}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">
                              {questionTextForDisplay}
                            </p>
                          </div>
                          <div className="rounded-lg bg-emerald-500/5 p-3">
                            <p className="text-xs font-semibold text-emerald-700">
                              {isVietnamese
                                ? "Lời giải của giáo viên"
                                : "Teacher's explanation"}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">
                              {answerForDisplay ??
                                (isVietnamese
                                  ? "Giáo viên chưa trả lời."
                                  : "The teacher has not answered yet.")}
                            </p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Floating AI Assistant Drawer */}
        {isAiOpen && (
          <aside className="w-80 border-l border-border bg-card flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Bot className="w-5 h-5 text-blue-500" />
                Trợ lý AI Bài Học
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAiOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {aiChat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-muted text-foreground"}`}
                  >
                    {msg.role === "assistant" ? (
                      <TutorAnswer content={msg.text} compact />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendAi}
              className="p-3 border-t border-border flex gap-2"
            >
              <input
                type="text"
                placeholder="Hỏi AI về bài học..."
                value={aiInput}
                maxLength={2000}
                disabled={isSendingAi}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-1 text-xs bg-muted/50 border border-border rounded-xl px-3 py-2 focus:outline-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSendingAi || !aiInput.trim()}
                className="bg-blue-600 text-white rounded-xl h-8 w-8"
              >
                {isSendingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
