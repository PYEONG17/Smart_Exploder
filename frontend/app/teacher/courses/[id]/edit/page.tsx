"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Video,
  FileText,
  ExternalLink,
  Upload,
  X,
  PlayCircle,
  ClipboardList,
  BarChart3,
  MessageCircle,
  ArrowDown,
  ArrowUp,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createLesson,
  deleteCourse,
  deleteLesson,
  deleteLessonContent,
  reorderCourseLessons,
  reorderLessonVideos,
  updateCourse,
  updateLesson,
  createLessonQuiz,
  createLessonMaterial,
  answerLessonQuestion,
  createLessonVideo,
  uploadCourseMedia,
  uploadLessonMaterial,
  fetchInteractiveVideoAnalytics,
  fetchCourseById,
  fetchLessonQuestions,
  type CreateLessonQuizInput,
  type CreateLessonVideoInput,
  type InteractiveVideoAnalytics,
  type LessonQuestion,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AiLessonAssistant } from "@/components/teacher/AiLessonAssistant";
import { AiOutlineModal } from "@/components/teacher/AiOutlineModal";
import { SortableList } from "@/components/teacher/SortableList";
import { VideoCheckpointManager } from "@/components/teacher/VideoCheckpointManager";
import { VideoTimePicker } from "@/components/teacher/VideoTimePicker";
import { moveItem } from "@/components/teacher/useDragReorder";
import {
  AuthoringLanguageToggle,
  type AuthoringLanguage,
} from "@/components/teacher/AuthoringLanguageToggle";
import { toast } from "sonner";
import { getYouTubeEmbedUrl } from "@/lib/video-url";
import { useLang } from "@/contexts/LanguageContext";
import type {
  ActivityType,
  Course,
  Lesson,
  Material,
  MaterialType,
} from "@/types";

type QuizQuestionDraft = {
  question: string;
  questionEn: string;
  answers: string[];
  answersEn: string[];
  correctIndex: number;
};

type VideoCheckpointDraft = {
  timestamp: string;
  question: string;
  questionEn: string;
  options: string[];
  optionsEn: string[];
  correctIndex: number;
  rewindSeconds: string;
  skipAfterAttempts: string;
};

type AdditionalVideoActivityType = Exclude<
  ActivityType,
  "QUESTION" | "QUIZ"
>;

type AdditionalVideoActivityDraft = {
  timestamp: string;
  type: AdditionalVideoActivityType;
  content: string;
};

type VideoNoteDraft = {
  timestamp: string;
  text: string;
};

const additionalActivityTemplates: Record<
  AdditionalVideoActivityType,
  unknown
> = {
  EXPLANATION: { text: "Key idea", textEn: "Key idea in English" },
  DRAG_DROP: {
    prompt: "Place each item in the correct zone",
    items: [
      { id: "item-a", label: "Item A", targetZoneId: "zone-a" },
      { id: "item-b", label: "Item B", targetZoneId: "zone-b" },
    ],
    zones: [
      { id: "zone-a", label: "Zone A" },
      { id: "zone-b", label: "Zone B" },
    ],
  },
  MATCHING: {
    prompt: "Match each item with its pair",
    leftItems: [
      { id: "left-a", label: "Left A" },
      { id: "left-b", label: "Left B" },
    ],
    rightItems: [
      { id: "right-a", label: "Right A" },
      { id: "right-b", label: "Right B" },
    ],
    correctPairs: [
      { leftId: "left-a", rightId: "right-a" },
      { leftId: "left-b", rightId: "right-b" },
    ],
  },
  FILL_BLANK: {
    prompt: "Complete the missing answer",
    blanks: [{ id: "answer-1", acceptedAnswers: ["answer"] }],
  },
  POLL: {
    prompt: "What do you think?",
    options: [
      { id: "option-a", label: "Option A" },
      { id: "option-b", label: "Option B" },
    ],
    allowMultiple: false,
  },
  REFLECTION: {
    prompt: "What did you learn from this section?",
    minLength: 0,
    maxLength: 1000,
    dataNotice: "Your response is saved for learning purposes.",
  },
  VOCABULARY: {
    term: "New term",
    definition: "Definition",
    example: "Example sentence",
  },
  AI_EXPLANATION: {
    prompt: "Explain this concept in simple terms",
    context: "Add lesson-specific context here",
  },
};

function createQuizQuestionDraft(): QuizQuestionDraft {
  return {
    question: "",
    questionEn: "",
    answers: ["", "", "", ""],
    answersEn: ["", "", "", ""],
    correctIndex: 0,
  };
}

function createVideoCheckpointDraft(timestamp = "60"): VideoCheckpointDraft {
  return {
    timestamp,
    question: "",
    questionEn: "",
    options: ["", "", "", ""],
    optionsEn: ["", "", "", ""],
    correctIndex: 0,
    rewindSeconds: "20",
    skipAfterAttempts: "",
  };
}

function createAdditionalVideoActivityDraft(
  timestamp = "120",
  type: AdditionalVideoActivityType = "EXPLANATION",
): AdditionalVideoActivityDraft {
  return {
    timestamp,
    type,
    content: JSON.stringify(additionalActivityTemplates[type], null, 2),
  };
}

function isAdditionalVideoActivityType(
  value: string,
): value is AdditionalVideoActivityType {
  return Object.prototype.hasOwnProperty.call(
    additionalActivityTemplates,
    value,
  );
}

export default function CourseEditStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isLoading: isAuthLoading } = useAuthGuard({
    allowedRoles: ["TEACHER", "ADMIN"],
    forbiddenRedirectTo: "/assignments",
  });
  const { id } = use(params);
  const router = useRouter();
  const { token } = useAuth();
  const { locale } = useLang();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lessonQuestions, setLessonQuestions] = useState<
    Record<string, LessonQuestion[]>
  >({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>(
    {},
  );
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answerLanguages, setAnswerLanguages] = useState<
    Record<string, "vi" | "en">
  >({});
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  useEffect(() => {
    let isActive = true;
    fetchCourseById(id)
      .then((courseData) => {
        if (!courseData) throw new Error("Không tìm thấy khóa học.");
        if (!isActive) return;
        setCourse(courseData);
        setLessons(courseData.lessons ?? []);
        setMaterials(
          (courseData.lessons ?? []).flatMap(
            (lesson) => lesson.materials ?? [],
          ),
        );
        if (token) {
          void Promise.all(
            (courseData.lessons ?? []).map(async (lesson) => {
              try {
                const questions = await fetchLessonQuestions(token, lesson.id);
                setLessonQuestions((current) => ({
                  ...current,
                  [lesson.id]: questions,
                }));
              } catch (loadError) {
                setQuestionErrors((current) => ({
                  ...current,
                  [lesson.id]:
                    loadError instanceof Error
                      ? loadError.message
                      : "Không thể tải câu hỏi học sinh.",
                }));
              }
            }),
          );
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải khóa học.",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id, token]);

  // Modals state
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState<
    string | null
  >(null);

  // Form states
  const [contentLanguage, setContentLanguage] = useState<AuthoringLanguage>(
    locale === "en" ? "en" : "vi",
  );
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDescription, setNewLessonDescription] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isAiOutlineOpen, setIsAiOutlineOpen] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [courseDraft, setCourseDraft] = useState({
    title: "",
    description: "",
    subject: "math" as "math" | "science",
    level: "8",
    thumbnail: "",
  });
  const [isUploadingCourseThumbnail, setIsUploadingCourseThumbnail] =
    useState(false);
  const [newLessonDuration, setNewLessonDuration] = useState("20 phút");
  const [activeEditor, setActiveEditor] = useState<{
    lessonId: string;
    kind: "video" | "quiz";
  } | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSourceMode, setVideoSourceMode] = useState<"url" | "file">(
    "url",
  );
  const [videoCheckpoints, setVideoCheckpoints] = useState<
    VideoCheckpointDraft[]
  >([]);
  const [additionalVideoActivities, setAdditionalVideoActivities] = useState<
    AdditionalVideoActivityDraft[]
  >([]);
  const [videoNotes, setVideoNotes] = useState<VideoNoteDraft[]>([]);
  const [videoAnalytics, setVideoAnalytics] = useState<
    Record<string, InteractiveVideoAnalytics[]>
  >({});
  const [openAnalyticsVideoId, setOpenAnalyticsVideoId] = useState<
    string | null
  >(null);
  const [loadingAnalyticsVideoId, setLoadingAnalyticsVideoId] = useState<
    string | null
  >(null);
  const [analyticsErrors, setAnalyticsErrors] = useState<
    Record<string, string>
  >({});
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDraft[]>([
    createQuizQuestionDraft(),
  ]);

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("PDF");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  const resetLessonForm = () => {
    setNewLessonTitle("");
    setNewLessonDescription("");
    setNewLessonDuration("20 phút");
  };

  const closeLessonModal = () => {
    setIsAddLessonOpen(false);
    setEditingLessonId(null);
    resetLessonForm();
  };

  const openAddLesson = () => {
    setEditingLessonId(null);
    resetLessonForm();
    setIsAddLessonOpen(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    const useEnglish = contentLanguage === "en";
    setEditingLessonId(lesson.id);
    setNewLessonTitle(
      (useEnglish ? lesson.titleEn : lesson.title) || lesson.title,
    );
    setNewLessonDescription(
      (useEnglish ? lesson.descEn : lesson.description) ||
        lesson.description ||
        "",
    );
    setNewLessonDuration(lesson.duration || "20 phút");
    setIsAddLessonOpen(true);
  };

  const handleReorderVideos = async (lessonId: string, orderedIds: string[]) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    const previous = lessons;
    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        const byId = new Map((lesson.videos ?? []).map((video) => [video.id, video]));
        return {
          ...lesson,
          videos: orderedIds.flatMap((id) => {
            const video = byId.get(id);
            return video ? [video] : [];
          }),
        };
      }),
    );
    try {
      await reorderLessonVideos(token, lessonId, orderedIds);
    } catch (reorderError) {
      setLessons(previous);
      toast.error(
        reorderError instanceof Error
          ? reorderError.message
          : "Không thể đổi thứ tự video.",
      );
    }
  };

  const handleMoveLesson = async (index: number, direction: -1 | 1) => {
    if (!token || !course) return toast.error("Vui lòng đăng nhập lại.");
    const previous = lessons;
    const moved = moveItem(lessons, index, index + direction);
    if (moved === lessons) return;
    const reordered = moved.map((lesson, position) => ({
      ...lesson,
      order: position + 1,
    }));
    setLessons(reordered);
    try {
      await reorderCourseLessons(
        token,
        course.id,
        reordered.map((lesson) => lesson.id),
      );
    } catch (reorderError) {
      setLessons(previous);
      toast.error(
        reorderError instanceof Error
          ? reorderError.message
          : "Không thể đổi thứ tự bài học.",
      );
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    if (
      !window.confirm(
        `Xóa bài học "${lesson.title}" cùng video, bài tập và tài liệu của bài? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }
    try {
      await deleteLesson(token, lesson.id);
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      setMaterials((prev) => prev.filter((item) => item.lessonId !== lesson.id));
      toast.success("Đã xóa bài học.");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa bài học.",
      );
    }
  };

  const handleDeleteContent = async (
    kind: "videos" | "quizzes" | "materials",
    contentId: string,
    label: string,
  ) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    if (!window.confirm(`Xóa "${label}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await deleteLessonContent(token, kind, contentId);
      if (kind === "materials") {
        setMaterials((prev) => prev.filter((item) => item.id !== contentId));
      } else {
        setLessons((prev) =>
          prev.map((lesson) => ({
            ...lesson,
            [kind]: (lesson[kind] ?? []).filter(
              (item: { id: string }) => item.id !== contentId,
            ),
          })),
        );
      }
      toast.success("Đã xóa.");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Không thể xóa.",
      );
    }
  };

  const openEditCourse = () => {
    if (!course) return;
    const useEnglish = contentLanguage === "en";
    setCourseDraft({
      title: (useEnglish ? course.titleEn : course.title) || course.title,
      description:
        (useEnglish ? course.descEn : course.description) ||
        course.description ||
        "",
      subject: course.subject === "science" ? "science" : "math",
      level: course.level,
      thumbnail: course.thumbnail ?? "",
    });
    setIsEditCourseOpen(true);
  };

  const handleCourseThumbnailUpload = async (file: File) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    setIsUploadingCourseThumbnail(true);
    try {
      const uploaded = await uploadCourseMedia(token, file, {
        kind: "thumbnail",
      });
      setCourseDraft((draft) => ({ ...draft, thumbnail: uploaded.url }));
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể tải ảnh lên.",
      );
    } finally {
      setIsUploadingCourseThumbnail(false);
    }
  };

  const handleSaveCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !course) return;
    if (!courseDraft.title.trim()) {
      toast.error("Nhập tên khóa học.");
      return;
    }
    setIsSavingCourse(true);
    try {
      const updated = await updateCourse(token, course.id, {
        title: courseDraft.title.trim(),
        description: courseDraft.description.trim(),
        subject: courseDraft.subject,
        level: courseDraft.level,
        thumbnail: courseDraft.thumbnail.trim(),
        sourceLanguage: contentLanguage,
      });
      setCourse((current) => (current ? { ...current, ...updated } : current));
      setIsEditCourseOpen(false);
      toast.success("Đã cập nhật khóa học.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật khóa học.",
      );
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!token || !course) return;
    if (
      !window.confirm(
        `Xóa khóa học "${course.title}" cùng toàn bộ bài học, video, bài tập và tài liệu? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }
    try {
      await deleteCourse(token, course.id);
      toast.success("Đã xóa khóa học.");
      router.push("/teacher");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa khóa học.",
      );
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) {
      toast.error("Nhập tên bài học.");
      return;
    }
    if (!token) {
      toast.error("Vui lòng đăng nhập để lưu bài học.");
      return;
    }

    if (editingLessonId) {
      setIsSavingLesson(true);
      try {
        const updated = await updateLesson(token, editingLessonId, {
          title: newLessonTitle.trim(),
          description: newLessonDescription.trim(),
          duration: newLessonDuration.trim() || undefined,
          sourceLanguage: contentLanguage,
        });
        setLessons((prev) =>
          prev.map((lesson) =>
            lesson.id === editingLessonId ? { ...lesson, ...updated } : lesson,
          ),
        );
        closeLessonModal();
        toast.success("Đã cập nhật bài học.");
      } catch (saveError) {
        toast.error(
          saveError instanceof Error
            ? saveError.message
            : "Không thể cập nhật bài học.",
        );
      } finally {
        setIsSavingLesson(false);
      }
      return;
    }

    setIsSavingLesson(true);
    try {
      const res = await createLesson(token, {
        courseId: id,
        title: newLessonTitle.trim(),
        description: newLessonDescription.trim() || undefined,
        sourceLanguage: contentLanguage,
        order:
          lessons.reduce(
            (maxOrder, lesson) => Math.max(maxOrder, lesson.order),
            0,
          ) + 1,
        duration: newLessonDuration,
      });
      setLessons((prev) => [...prev, res.data]);
      setNewLessonTitle("");
      setNewLessonDescription("");
      setIsAddLessonOpen(false);
      toast.success("Đã thêm bài học mới vào khóa học!");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể thêm bài học.",
      );
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleSaveLessonVideo = async (lessonId: string) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    const hasVideoSource =
      videoSourceMode === "url" ? Boolean(videoUrl.trim()) : Boolean(videoFile);
    if (!hasVideoSource) {
      return toast.error(
        videoSourceMode === "url"
          ? "Dán link YouTube hoặc URL video."
          : "Chọn tệp video để tải lên.",
      );
    }
    if (
      videoSourceMode === "file" &&
      videoFile &&
      videoFile.size > 1024 * 1024 * 1024
    ) {
      return toast.error("Video vượt quá giới hạn tải lên 1 GB.");
    }
    if (videoSourceMode === "url" && !URL.canParse(videoUrl.trim())) {
      return toast.error("Link video không hợp lệ.");
    }
    const isYouTubeVideo =
      videoSourceMode === "url" && Boolean(getYouTubeEmbedUrl(videoUrl.trim()));
    const checkpoints = videoCheckpoints.map((checkpoint) => ({
      timestamp: Number(checkpoint.timestamp),
      question: checkpoint.question.trim(),
      questionEn: checkpoint.questionEn.trim(),
      options: checkpoint.options.map((option) => option.trim()),
      optionsEn: checkpoint.optionsEn.map((option) => option.trim()),
      correctIndex: checkpoint.correctIndex,
      rewindSeconds: Number(checkpoint.rewindSeconds),
      skipAfterAttempts:
        checkpoint.skipAfterAttempts.trim() === ""
          ? undefined
          : Number(checkpoint.skipAfterAttempts),
    }));
    if (
      checkpoints.some(
        (checkpoint) =>
          !Number.isInteger(checkpoint.timestamp) ||
          checkpoint.timestamp < 0 ||
          checkpoint.question.length < 2 ||
          checkpoint.options.some((option) => !option),
      )
    ) {
      return toast.error(
        "Mỗi checkpoint cần thời điểm hợp lệ, câu hỏi và đủ 4 lựa chọn.",
      );
    }
    if (
      checkpoints.some(
        (checkpoint) =>
          !Number.isInteger(checkpoint.rewindSeconds) ||
          checkpoint.rewindSeconds < 0 ||
          checkpoint.rewindSeconds > 3600 ||
          (checkpoint.skipAfterAttempts !== undefined &&
            (!Number.isInteger(checkpoint.skipAfterAttempts) ||
              checkpoint.skipAfterAttempts < 1 ||
              checkpoint.skipAfterAttempts > 10)),
      )
    ) {
      return toast.error(
        "Số giây tua lại phải từ 0–3600 và số lần sai để bỏ qua từ 1–10 (hoặc để trống).",
      );
    }
    const additionalActivities: NonNullable<
      CreateLessonVideoInput["activities"]
    > = [];
    for (const draft of additionalVideoActivities) {
      const timestampSeconds = Number(draft.timestamp);
      if (
        draft.timestamp.trim() === "" ||
        !Number.isFinite(timestampSeconds) ||
        timestampSeconds < 0
      ) {
        return toast.error("Thời điểm hoạt động phải là số giây hợp lệ.");
      }
      let content: unknown;
      try {
        content = JSON.parse(draft.content);
      } catch {
        return toast.error("JSON nội dung hoạt động không hợp lệ.");
      }
      additionalActivities.push({
        timestampMs: Math.round(timestampSeconds * 1000),
        type: draft.type,
        content,
      });
    }
    const timestamps = [
      ...checkpoints.map((checkpoint) => checkpoint.timestamp * 1000),
      ...additionalActivities.map((activity) => activity.timestampMs ?? 0),
      ...videoNotes.map((note) => Number(note.timestamp) * 1000),
    ];
    if (timestamps.length > 20) {
      return toast.error("Mỗi video chỉ hỗ trợ tối đa 20 hoạt động.");
    }
    if (new Set(timestamps).size !== timestamps.length) {
      return toast.error("Mỗi ghi chú hoặc hoạt động cần có thời điểm riêng.");
    }
    if (
      isYouTubeVideo &&
      (videoCheckpoints.length > 0 ||
        additionalVideoActivities.length > 0 ||
        videoNotes.length > 0)
    ) {
      return toast.error(
        "Video YouTube phát được như bài giảng, nhưng ghi chú đánh dấu và checkpoint theo thời gian hiện chỉ hỗ trợ khi tải video lên hoặc dùng URL tệp video trực tiếp.",
      );
    }
    if (
      videoNotes.some(
        (note) =>
          !Number.isFinite(Number(note.timestamp)) ||
          Number(note.timestamp) < 0 ||
          !note.text.trim(),
      )
    ) {
      return toast.error("Mỗi ghi chú cần thời điểm và nội dung hợp lệ.");
    }

    setIsSavingContent(true);
    try {
      const uploadedVideo =
        videoSourceMode === "file" && videoFile
        ? await uploadCourseMedia(token, videoFile, {
            kind: "lesson-video",
            lessonId,
          })
        : null;
      const checkpointActivities: NonNullable<
        CreateLessonVideoInput["activities"]
      > = checkpoints.map((checkpoint) => ({
        timestamp: checkpoint.timestamp,
        type: "QUESTION",
        content: {
          question: checkpoint.question,
          questionEn: checkpoint.questionEn || undefined,
          options: checkpoint.options,
          optionsEn: checkpoint.optionsEn.every(Boolean)
            ? checkpoint.optionsEn
            : undefined,
          correctIndex: checkpoint.correctIndex,
          rewindSeconds: checkpoint.rewindSeconds,
          skipAfterAttempts: checkpoint.skipAfterAttempts,
        },
      }));
      const noteActivities: NonNullable<
        CreateLessonVideoInput["activities"]
      > = videoNotes.map((note) => ({
        timestampMs: Math.round(Number(note.timestamp) * 1000),
        type: "EXPLANATION",
        content: { text: note.text.trim() },
      }));
      const data: CreateLessonVideoInput = {
        title: videoTitle.trim() || undefined,
        sourceLanguage: contentLanguage,
        url:
          uploadedVideo?.url ??
          (videoSourceMode === "url" ? videoUrl.trim() : ""),
        activities: [
          ...checkpointActivities,
          ...noteActivities,
          ...additionalActivities,
        ].sort(
          (first, second) =>
            (first.timestampMs ?? (first.timestamp ?? 0) * 1000) -
            (second.timestampMs ?? (second.timestamp ?? 0) * 1000),
        ),
      };
      const savedVideo = await createLessonVideo(token, lessonId, data);
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                videos: [
                  ...(lesson.videos ?? []),
                  savedVideo as NonNullable<Lesson["videos"]>[number],
                ],
              }
            : lesson,
        ),
      );
      setVideoTitle("");
      setVideoUrl("");
      setVideoFile(null);
      setVideoSourceMode("url");
      setVideoCheckpoints([]);
      setVideoNotes([]);
      setAdditionalVideoActivities([]);
      setActiveEditor(null);
      toast.success("Đã lưu video và các checkpoint vào bài học.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "Không thể lưu video.",
      );
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleToggleVideoAnalytics = async (videoId: string) => {
    if (openAnalyticsVideoId === videoId) {
      setOpenAnalyticsVideoId(null);
      return;
    }
    setOpenAnalyticsVideoId(videoId);
    if (videoAnalytics[videoId] || !token) return;

    setLoadingAnalyticsVideoId(videoId);
    setAnalyticsErrors((current) => {
      const next = { ...current };
      delete next[videoId];
      return next;
    });
    try {
      const result = await fetchInteractiveVideoAnalytics(token, videoId);
      setVideoAnalytics((current) => ({ ...current, [videoId]: result }));
    } catch (error) {
      setAnalyticsErrors((current) => ({
        ...current,
        [videoId]:
          error instanceof Error
            ? error.message
            : "Không thể tải phân tích video.",
      }));
    } finally {
      setLoadingAnalyticsVideoId(null);
    }
  };

  const handleSaveLessonQuiz = async (lessonId: string) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    if (
      quizQuestions.some(
        (question) =>
          question.question.trim().length < 2 ||
          question.answers.some((answer) => !answer.trim()),
      )
    ) {
      return toast.error(
        "Nhập từng câu hỏi và đủ 4 lựa chọn trước khi lưu.",
      );
    }
    setIsSavingContent(true);
    try {
      const data: CreateLessonQuizInput = {
        title: quizTitle.trim() || undefined,
        sourceLanguage: contentLanguage,
        questions: quizQuestions.map((question) => ({
          question: question.question.trim(),
          questionEn: question.questionEn.trim() || undefined,
          type: "MULTIPLE_CHOICE",
          answers: question.answers.map((content, index) => ({
            content: content.trim(),
            contentEn: question.answersEn[index].trim() || undefined,
            isCorrect: index === question.correctIndex,
          })),
        })),
      };
      const savedQuiz = await createLessonQuiz(token, lessonId, data);
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                quizzes: [
                  ...(lesson.quizzes ?? []),
                  savedQuiz as NonNullable<Lesson["quizzes"]>[number],
                ],
              }
            : lesson,
        ),
      );
      setQuizTitle("");
      setQuizQuestions([createQuizQuestionDraft()]);
      setActiveEditor(null);
      toast.success("Đã thêm bài tập song ngữ vào bài học.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu bài tập.",
      );
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleAnswerQuestion = async (
    lessonId: string,
    question: LessonQuestion,
  ) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại để trả lời câu hỏi.");
      return;
    }
    const text = answerDrafts[question.id]?.trim() ?? "";
    if (!text) {
      toast.error("Nhập lời giải trước khi gửi.");
      return;
    }
    setAnsweringQuestionId(question.id);
    try {
      const updated = await answerLessonQuestion(token, question.id, {
        text,
        language: answerLanguages[question.id] ?? locale,
      });
      setLessonQuestions((current) => ({
        ...current,
        [lessonId]: (current[lessonId] ?? []).map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
      setAnswerDrafts((current) => ({ ...current, [question.id]: "" }));
      toast.success("Đã gửi lời giải; hệ thống đã tạo bản dịch tự động.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu lời giải.",
      );
    } finally {
      setAnsweringQuestionId(null);
    }
  };

  const handleUploadMaterial = async (
    e: React.FormEvent,
    lessonId: string,
  ) => {
    e.preventDefault();
    if (!token) {
      toast.error("Vui lòng đăng nhập lại để tải tài liệu lên.");
      return;
    }
    if (!materialTitle.trim() || (!materialFile && !materialUrl.trim())) {
      toast.error("Nhập tên tài liệu và chọn tệp hoặc nhập URL tài liệu.");
      return;
    }
    if (materialFile && materialFile.size > 50 * 1024 * 1024) {
      toast.error("Tài liệu vượt quá giới hạn tải lên 50 MB.");
      return;
    }
    setIsUploadingMaterial(true);
    try {
      let savedMaterial: Material;
      if (materialFile) {
        if (materialType === "MODEL_3D") {
          throw new Error("Upload tệp hiện hỗ trợ PDF, DOCX, PPTX và TXT.");
        }
        savedMaterial = await uploadLessonMaterial(
          token,
          lessonId,
          materialFile,
          materialTitle.trim(),
          materialType,
        );
      } else {
        const response = await createLessonMaterial(token, lessonId, {
          title: materialTitle.trim(),
          type: materialType,
          url: materialUrl.trim(),
        });
        savedMaterial = response;
      }
      setMaterials((current) => [...current, savedMaterial]);
      setMaterialTitle("");
      setMaterialUrl("");
      setMaterialFile(null);
      setIsUploadMaterialOpen(null);
      toast.success("Đã lưu tài liệu vào bài học.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu tài liệu.",
      );
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const trimmedVideoUrl = videoUrl.trim();
  const newVideoPreviewFile = videoSourceMode === "file" ? videoFile : null;
  const newVideoPreviewUrl =
    videoSourceMode === "url" &&
    trimmedVideoUrl &&
    !getYouTubeEmbedUrl(trimmedVideoUrl)
      ? trimmedVideoUrl
      : undefined;
  const newVideoMarkers = [
    ...videoCheckpoints.map((item) => Number(item.timestamp)),
    ...additionalVideoActivities.map((item) => Number(item.timestamp)),
    ...videoNotes.map((item) => Number(item.timestamp)),
  ].filter((value) => Number.isFinite(value) && value >= 0);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang tải khóa học...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-destructive">
        {error || "Không tìm thấy khóa học."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Trở về Studio Giáo viên
          </Link>

          <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-border"
            onClick={openEditCourse}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            Sửa khóa học
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleDeleteCourse()}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Xóa khóa học
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border"
            asChild
          >
            <Link href={`/courses/${course.id}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-1.5 text-blue-500" />
              Xem giao diện học sinh
            </Link>
          </Button>
          </div>
        </div>

        {/* Course Header Card */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-600 border-0"
                >
                  {course.subjectLabel || "STEM"}
                </Badge>
                <Badge variant="outline">Lớp {course.level}</Badge>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground">
                {course.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {course.description}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAiOutlineOpen(true)}
              className="rounded-xl border-violet-500/30 text-violet-700 hover:bg-violet-500/10 font-semibold shrink-0"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI gợi ý khung khóa học
            </Button>
            <Button
              onClick={openAddLesson}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-semibold shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm bài học mới
            </Button>
          </div>
        </div>

        {isAiOutlineOpen && token && (
          <AiOutlineModal
            token={token}
            courseId={course.id}
            nextOrder={
              lessons.reduce((max, lesson) => Math.max(max, lesson.order), 0) + 1
            }
            locale={locale === "en" ? "en" : "vi"}
            onClose={() => setIsAiOutlineOpen(false)}
            onCreated={(created) => setLessons((prev) => [...prev, ...created])}
          />
        )}

        {isEditCourseOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Sửa khóa học</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditCourseOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <AuthoringLanguageToggle
                  value={contentLanguage}
                  onChange={setContentLanguage}
                  disabled={isSavingCourse}
                />
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    {contentLanguage === "vi" ? "Tên khóa học" : "Course title"}
                  </label>
                  <input
                    type="text"
                    value={courseDraft.title}
                    onChange={(e) =>
                      setCourseDraft((draft) => ({ ...draft, title: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    {contentLanguage === "vi" ? "Mô tả (không bắt buộc)" : "Description (optional)"}
                  </label>
                  <textarea
                    rows={4}
                    value={courseDraft.description}
                    onChange={(e) =>
                      setCourseDraft((draft) => ({ ...draft, description: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={courseDraft.subject}
                    onChange={(e) =>
                      setCourseDraft((draft) => ({
                        ...draft,
                        subject: e.target.value === "science" ? "science" : "math",
                      }))
                    }
                    className="px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="math">Toán học</option>
                    <option value="science">Khoa học</option>
                  </select>
                  <select
                    value={courseDraft.level}
                    onChange={(e) =>
                      setCourseDraft((draft) => ({ ...draft, level: e.target.value }))
                    }
                    className="px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    {["6", "7", "8", "9", "10", "11", "12"].map((level) => (
                      <option key={level} value={level}>
                        Lớp {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Ảnh thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingCourseThumbnail || isSavingCourse}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void handleCourseThumbnailUpload(file);
                      event.currentTarget.value = "";
                    }}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/10 file:px-3 file:py-2 file:font-semibold file:text-blue-700"
                  />
                  <input
                    type="text"
                    placeholder="Hoặc dán URL ảnh (để trống để xóa ảnh)"
                    value={courseDraft.thumbnail}
                    onChange={(e) =>
                      setCourseDraft((draft) => ({ ...draft, thumbnail: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditCourseOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingCourse || isUploadingCourseThumbnail}
                    className="bg-blue-600 text-white"
                  >
                    {isSavingCourse ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Lesson Modal */}
        {isAddLessonOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">
                  {editingLessonId ? "Sửa bài học" : "Thêm bài học mới"}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeLessonModal}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleAddLesson} className="space-y-4">
                <AuthoringLanguageToggle
                  value={contentLanguage}
                  onChange={setContentLanguage}
                  disabled={isSavingLesson}
                />
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    {contentLanguage === "vi" ? "Tên bài học" : "Lesson title"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      contentLanguage === "vi"
                        ? "Ví dụ: Bài 4: Nhân và chia phân số"
                        : "Example: Lesson 4: Multiplying and dividing fractions"
                    }
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    {contentLanguage === "vi" ? "Mô tả bài học (không bắt buộc)" : "Lesson description (optional)"}
                  </label>
                  <textarea
                    rows={3}
                    value={newLessonDescription}
                    onChange={(e) => setNewLessonDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Thời lượng bài học
                  </label>
                  <input
                    type="text"
                    placeholder="25 phút"
                    value={newLessonDuration}
                    onChange={(e) => setNewLessonDuration(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeLessonModal}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingLesson}
                    className="bg-blue-600 text-white"
                  >
                    {isSavingLesson
                      ? "Đang lưu..."
                      : editingLessonId
                        ? "Lưu thay đổi"
                        : "Thêm bài học"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lessons Accordion / List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Danh sách bài học & Tài liệu đã đính kèm
          </h2>

          {lessons.map((lesson, idx) => {
            const lessonMats = materials.filter(
              (m) => m.lessonId === lesson.id,
            );
            return (
              <div
                key={lesson.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label="Chuyển bài học lên"
                        disabled={idx === 0}
                        onClick={() => void handleMoveLesson(idx, -1)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Chuyển bài học xuống"
                        disabled={idx === lessons.length - 1}
                        onClick={() => void handleMoveLesson(idx, 1)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {lesson.duration || "20 phút"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setActiveEditor({ lessonId: lesson.id, kind: "video" })
                      }
                      className="rounded-xl border-blue-500/30 text-blue-600 hover:bg-blue-500/10 text-xs font-semibold"
                    >
                      <Video className="w-3.5 h-3.5 mr-1" />
                      Thêm video tương tác
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setActiveEditor({ lessonId: lesson.id, kind: "quiz" })
                      }
                      className="rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 text-xs font-semibold"
                    >
                      <ClipboardList className="w-3.5 h-3.5 mr-1" />
                      Tạo bài tập
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsUploadMaterialOpen(lesson.id)}
                      className="rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-500/10 text-xs font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Upload Tài liệu/PDF
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditLesson(lesson)}
                      className="rounded-xl text-xs font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Sửa
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDeleteLesson(lesson)}
                      className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>

                {activeEditor?.lessonId === lesson.id && (
                  <section className="mb-5 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">
                          {activeEditor.kind === "video"
                            ? "Video bài giảng tương tác"
                            : "Bài tập của bài học"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Nội dung Tiếng Việt và Tiếng Anh được lưu riêng.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveEditor(null)}
                        aria-label="Đóng biểu mẫu"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {activeEditor.kind === "video" ? (
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleSaveLessonVideo(lesson.id);
                        }}
                      >
                        <AuthoringLanguageToggle
                          value={contentLanguage}
                          onChange={setContentLanguage}
                          disabled={isSavingContent}
                        />
                        <input
                          value={videoTitle}
                          onChange={(event) => setVideoTitle(event.target.value)}
                          placeholder={
                            contentLanguage === "vi" ? "Tên video (không bắt buộc)" : "Video title (optional)"
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nguồn video">
                          <Button
                            type="button"
                            size="sm"
                            variant={videoSourceMode === "url" ? "default" : "outline"}
                            onClick={() => setVideoSourceMode("url")}
                            disabled={isSavingContent}
                          >
                            Dán link YouTube / URL video
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={videoSourceMode === "file" ? "default" : "outline"}
                            onClick={() => setVideoSourceMode("file")}
                            disabled={isSavingContent}
                          >
                            Tải video lên
                          </Button>
                        </div>
                        {videoSourceMode === "url" ? (
                          <div className="space-y-2">
                            <input
                              type="url"
                              required
                              value={videoUrl}
                              onChange={(event) => setVideoUrl(event.target.value)}
                              placeholder="Dán link YouTube, ví dụ: https://youtu.be/VIDEO_ID"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            />
                            {getYouTubeEmbedUrl(videoUrl.trim()) ? (
                              <div className="aspect-video max-w-xl overflow-hidden rounded-lg bg-black">
                                <iframe
                                  src={getYouTubeEmbedUrl(videoUrl.trim()) ?? ""}
                                  title="Xem trước video YouTube"
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Hỗ trợ link YouTube watch, youtu.be, Shorts hoặc live; cũng có thể dùng URL MP4/WebM trực tiếp.
                              </p>
                            )}
                            {(videoCheckpoints.length > 0 ||
                              additionalVideoActivities.length > 0) &&
                              getYouTubeEmbedUrl(videoUrl.trim()) && (
                                <p className="text-xs text-amber-700">
                                  Muốn đặt checkpoint tương tác theo thời gian? Hãy tải tệp video lên hoặc dùng URL tệp video trực tiếp.
                                </p>
                              )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Chọn video (MP4, WebM, MOV, AVI; tối đa 1 GB)
                            </label>
                            <input
                              type="file"
                              required
                              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                              disabled={isSavingContent}
                              onChange={(event) =>
                                setVideoFile(event.currentTarget.files?.[0] ?? null)
                              }
                              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/10 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-500/20"
                            />
                            {videoFile && (
                              <p className="text-xs text-muted-foreground">
                                {videoFile.name} ·{" "}
                                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-semibold">
                                Ghi chú và đánh dấu video
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Tạo ghi chú xuất hiện đúng thời điểm khi học sinh xem.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                isSavingContent ||
                                videoNotes.length +
                                  videoCheckpoints.length +
                                  additionalVideoActivities.length >=
                                  20
                              }
                              onClick={() =>
                                setVideoNotes((current) => [
                                  ...current,
                                  {
                                    timestamp: current.length
                                      ? String(
                                          Number(current[current.length - 1].timestamp) +
                                            60,
                                        )
                                      : "30",
                                    text: "",
                                  },
                                ])
                              }
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Thêm ghi chú
                            </Button>
                          </div>
                          {videoNotes.map((note, index) => (
                            <div
                              key={index}
                              className="grid gap-2 sm:grid-cols-[130px_1fr_auto]"
                            >
                              <div className="text-xs text-muted-foreground"><label className="block">
                                Thời điểm (giây)
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={note.timestamp}
                                  onChange={(event) =>
                                    setVideoNotes((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              timestamp: event.target.value,
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                              </label><VideoTimePicker src={newVideoPreviewUrl} file={newVideoPreviewFile} value={note.timestamp} integer onChange={(timestamp) => setVideoNotes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, timestamp } : item))} markers={newVideoMarkers} /></div>
                              <label className="text-xs text-muted-foreground">
                                Nội dung ghi chú
                                <textarea
                                  rows={2}
                                  maxLength={2000}
                                  value={note.text}
                                  onChange={(event) =>
                                    setVideoNotes((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, text: event.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                  placeholder="Ví dụ: Lưu ý công thức này trước khi chuyển sang phần tiếp theo..."
                                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                              </label>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="self-end"
                                onClick={() =>
                                  setVideoNotes((current) =>
                                    current.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                                aria-label={`Xóa ghi chú video ${index + 1}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-border pt-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold">
                              Checkpoint tương tác (tối đa 20)
                            </h5>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                videoCheckpoints.length +
                                  additionalVideoActivities.length >=
                                20
                              }
                              onClick={() => {
                                const nextTimestamp = videoCheckpoints.length
                                  ? String(
                                      Math.max(
                                        ...videoCheckpoints.map(
                                          (checkpoint) =>
                                            Number(checkpoint.timestamp) || 0,
                                        ),
                                      ) + 60,
                                    )
                                  : "60";
                                setVideoCheckpoints((current) => [
                                  ...current,
                                  createVideoCheckpointDraft(nextTimestamp),
                                ]);
                              }}
                            >
                              <Plus className="mr-1.5 h-4 w-4" />
                              Thêm checkpoint
                            </Button>
                          </div>
                          {videoCheckpoints.map(
                            (checkpoint, checkpointIndex) => (
                              <fieldset
                                key={checkpointIndex}
                                className="mb-3 space-y-2 rounded-md border border-border p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <legend className="text-xs font-semibold text-muted-foreground">
                                    Mốc {checkpointIndex + 1}
                                  </legend>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      setVideoCheckpoints((current) =>
                                        current.filter(
                                          (_, index) =>
                                            index !== checkpointIndex,
                                        ),
                                      )
                                    }
                                    aria-label={`Xóa checkpoint ${checkpointIndex + 1}`}
                                    title="Xóa checkpoint"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-[140px_1fr_1fr]">
                                  <div className="text-xs text-muted-foreground"><label className="block">
                                    Thời điểm (giây)
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={checkpoint.timestamp}
                                      onChange={(event) =>
                                        setVideoCheckpoints((current) =>
                                          current.map((item, index) =>
                                            index === checkpointIndex
                                              ? {
                                                  ...item,
                                                  timestamp: event.target.value,
                                                }
                                              : item,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </label><VideoTimePicker src={newVideoPreviewUrl} file={newVideoPreviewFile} value={checkpoint.timestamp} integer onChange={(timestamp) => setVideoCheckpoints((current) => current.map((item, index) => index === checkpointIndex ? { ...item, timestamp } : item))} markers={newVideoMarkers} /></div>
                                  <input
                                    value={checkpoint.question}
                                    onChange={(event) =>
                                      setVideoCheckpoints((current) =>
                                        current.map((item, index) =>
                                          index === checkpointIndex
                                            ? {
                                                ...item,
                                                question: event.target.value,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                    placeholder="Câu hỏi checkpoint (VI)"
                                    className="self-end rounded-md border border-border bg-background px-3 py-2 text-sm"
                                  />
                                  <input
                                    value={checkpoint.questionEn}
                                    onChange={(event) =>
                                      setVideoCheckpoints((current) =>
                                        current.map((item, index) =>
                                          index === checkpointIndex
                                            ? {
                                                ...item,
                                                questionEn: event.target.value,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                    placeholder="Checkpoint question (EN)"
                                    className="self-end rounded-md border border-border bg-background px-3 py-2 text-sm"
                                  />
                                </div>
                                {checkpoint.options.map(
                                  (option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="grid gap-2 sm:grid-cols-[32px_1fr_1fr]"
                                    >
                                      <label
                                        className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
                                        title="Chọn đáp án đúng"
                                      >
                                        <input
                                          type="radio"
                                          name={`checkpoint-correct-${lesson.id}-${checkpointIndex}`}
                                          checked={
                                            checkpoint.correctIndex ===
                                            optionIndex
                                          }
                                          onChange={() =>
                                            setVideoCheckpoints((current) =>
                                              current.map((item, index) =>
                                                index === checkpointIndex
                                                  ? {
                                                      ...item,
                                                      correctIndex: optionIndex,
                                                    }
                                                  : item,
                                              ),
                                            )
                                          }
                                        />
                                        {String.fromCharCode(65 + optionIndex)}
                                      </label>
                                      <input
                                        value={option}
                                        onChange={(event) =>
                                          setVideoCheckpoints((current) =>
                                            current.map((item, index) =>
                                              index === checkpointIndex
                                                ? {
                                                    ...item,
                                                    options: item.options.map(
                                                      (value, currentIndex) =>
                                                        currentIndex ===
                                                        optionIndex
                                                          ? event.target.value
                                                          : value,
                                                    ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        placeholder={`Lựa chọn ${optionIndex + 1} (VI)`}
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                      />
                                      <input
                                        value={
                                          checkpoint.optionsEn[optionIndex]
                                        }
                                        onChange={(event) =>
                                          setVideoCheckpoints((current) =>
                                            current.map((item, index) =>
                                              index === checkpointIndex
                                                ? {
                                                    ...item,
                                                    optionsEn:
                                                      item.optionsEn.map(
                                                        (
                                                          value,
                                                          currentIndex,
                                                        ) =>
                                                          currentIndex ===
                                                          optionIndex
                                                            ? event.target.value
                                                            : value,
                                                      ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        placeholder={`Option ${optionIndex + 1} (EN, tùy chọn)`}
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                      />
                                    </div>
                                  ),
                                )}
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <label className="text-xs text-muted-foreground">
                                    Khi sai, &quot;Xem lại&quot; tua về trước mốc (giây; 0 = ẩn nút)
                                    <input
                                      type="number"
                                      min="0"
                                      max="3600"
                                      step="1"
                                      value={checkpoint.rewindSeconds}
                                      onChange={(event) =>
                                        setVideoCheckpoints((current) =>
                                          current.map((item, index) =>
                                            index === checkpointIndex
                                              ? {
                                                  ...item,
                                                  rewindSeconds:
                                                    event.target.value,
                                                }
                                              : item,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground">
                                    Cho bỏ qua sau số lần sai
                                    <input
                                      type="number"
                                      min="1"
                                      max="10"
                                      step="1"
                                      value={checkpoint.skipAfterAttempts}
                                      placeholder="Trống = phải đúng mới đi tiếp"
                                      onChange={(event) =>
                                        setVideoCheckpoints((current) =>
                                          current.map((item, index) =>
                                            index === checkpointIndex
                                              ? {
                                                  ...item,
                                                  skipAfterAttempts:
                                                    event.target.value,
                                                }
                                              : item,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </label>
                                </div>
                              </fieldset>
                            ),
                          )}
                        </div>
                        <div className="border-t border-border pt-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-semibold">
                                Hoạt động tương tác khác
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                Chọn loại, sửa JSON mẫu; máy chủ sẽ kiểm tra cấu trúc.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                videoCheckpoints.length +
                                  additionalVideoActivities.length >=
                                20
                              }
                              onClick={() => {
                                const timestamps = [
                                  ...videoCheckpoints.map(
                                    (checkpoint) =>
                                      Number(checkpoint.timestamp) || 0,
                                  ),
                                  ...additionalVideoActivities.map(
                                    (activity) =>
                                      Number(activity.timestamp) || 0,
                                  ),
                                ];
                                const nextTimestamp = timestamps.length
                                  ? String(Math.max(...timestamps) + 60)
                                  : "120";
                                setAdditionalVideoActivities((current) => [
                                  ...current,
                                  createAdditionalVideoActivityDraft(
                                    nextTimestamp,
                                  ),
                                ]);
                              }}
                            >
                              <Plus className="mr-1.5 h-4 w-4" />
                              Thêm hoạt động
                            </Button>
                          </div>
                          {additionalVideoActivities.map((activity, index) => (
                            <fieldset
                              key={index}
                              className="mb-3 space-y-2 rounded-md border border-border p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <legend className="text-xs font-semibold text-muted-foreground">
                                  Hoạt động {index + 1}
                                </legend>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    setAdditionalVideoActivities((current) =>
                                      current.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                      ),
                                    )
                                  }
                                  aria-label={`Xóa hoạt động ${index + 1}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-1 text-xs"><label className="block space-y-1">
                                  <span>Thời điểm (giây, hỗ trợ mili giây)</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={activity.timestamp}
                                    onChange={(event) =>
                                      setAdditionalVideoActivities((current) =>
                                        current.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                timestamp: event.target.value,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                  />
                                </label><VideoTimePicker src={newVideoPreviewUrl} file={newVideoPreviewFile} value={activity.timestamp} onChange={(timestamp) => setAdditionalVideoActivities((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, timestamp } : item))} markers={newVideoMarkers} /></div>
                                <label className="space-y-1 text-xs">
                                  <span>Loại hoạt động</span>
                                  <select
                                    value={activity.type}
                                    onChange={(event) => {
                                      const nextType = event.target.value;
                                      if (!isAdditionalVideoActivityType(nextType)) {
                                        return;
                                      }
                                      setAdditionalVideoActivities((current) =>
                                        current.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? createAdditionalVideoActivityDraft(
                                                item.timestamp,
                                                nextType,
                                              )
                                            : item,
                                        ),
                                      );
                                    }}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                  >
                                    {Object.keys(additionalActivityTemplates).map(
                                      (type) => (
                                        <option key={type} value={type}>
                                          {type.replaceAll("_", " ")}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                              </div>
                              <label className="block space-y-1 text-xs">
                                <span>Nội dung JSON</span>
                                <textarea
                                  rows={10}
                                  spellCheck={false}
                                  value={activity.content}
                                  onChange={(event) =>
                                    setAdditionalVideoActivities((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              content: event.target.value,
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs"
                                />
                              </label>
                            </fieldset>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isSavingContent}
                            className="bg-blue-600 text-white"
                          >
                            {isSavingContent
                              ? "Đang lưu..."
                              : "Lưu video và checkpoint"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleSaveLessonQuiz(lesson.id);
                        }}
                      >
                        <AuthoringLanguageToggle
                          value={contentLanguage}
                          onChange={setContentLanguage}
                          disabled={isSavingContent}
                        />
                        <input
                          value={quizTitle}
                          onChange={(event) => setQuizTitle(event.target.value)}
                          placeholder={
                            contentLanguage === "vi" ? "Tên bài tập (không bắt buộc)" : "Assignment title (optional)"
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                        {quizQuestions.map((draft, questionIndex) => (
                          <fieldset
                            key={questionIndex}
                            className="space-y-3 rounded-lg border border-border p-3"
                          >
                            <div className="flex items-center justify-between">
                              <legend className="text-sm font-semibold">
                                Câu hỏi {questionIndex + 1}
                              </legend>
                              {quizQuestions.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setQuizQuestions((current) =>
                                      current.filter(
                                        (_, index) => index !== questionIndex,
                                      ),
                                    )
                                  }
                                >
                                  Xóa câu
                                </Button>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <textarea
                                required
                                value={draft.question}
                                onChange={(event) =>
                                  setQuizQuestions((current) =>
                                    current.map((item, index) =>
                                      index === questionIndex
                                        ? {
                                            ...item,
                                            question: event.target.value,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                placeholder="Câu hỏi (Tiếng Việt)"
                                rows={2}
                                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                              />
                              <textarea
                                value={draft.questionEn}
                                onChange={(event) =>
                                  setQuizQuestions((current) =>
                                    current.map((item, index) =>
                                      index === questionIndex
                                        ? {
                                            ...item,
                                            questionEn: event.target.value,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                placeholder="Question (English)"
                                rows={2}
                                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            {draft.answers.map((answer, answerIndex) => (
                              <div
                                key={answerIndex}
                                className="grid gap-2 sm:grid-cols-[32px_1fr_1fr]"
                              >
                                <label
                                  className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
                                  title="Chọn đáp án đúng"
                                >
                                  <input
                                    type="radio"
                                    name={`quiz-correct-${lesson.id}-${questionIndex}`}
                                    checked={draft.correctIndex === answerIndex}
                                    onChange={() =>
                                      setQuizQuestions((current) =>
                                        current.map((item, index) =>
                                          index === questionIndex
                                            ? {
                                                ...item,
                                                correctIndex: answerIndex,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                  />
                                  {String.fromCharCode(65 + answerIndex)}
                                </label>
                                <input
                                  required
                                  value={answer}
                                  onChange={(event) =>
                                    setQuizQuestions((current) =>
                                      current.map((item, index) =>
                                        index === questionIndex
                                          ? {
                                              ...item,
                                              answers: item.answers.map(
                                                (value, optionIndex) =>
                                                  optionIndex === answerIndex
                                                    ? event.target.value
                                                    : value,
                                              ),
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  placeholder={`Lựa chọn ${answerIndex + 1} (VI)`}
                                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                                <input
                                  value={draft.answersEn[answerIndex]}
                                  onChange={(event) =>
                                    setQuizQuestions((current) =>
                                      current.map((item, index) =>
                                        index === questionIndex
                                          ? {
                                              ...item,
                                              answersEn: item.answersEn.map(
                                                (value, optionIndex) =>
                                                  optionIndex === answerIndex
                                                    ? event.target.value
                                                    : value,
                                              ),
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  placeholder={`Option ${answerIndex + 1} (EN, tùy chọn)`}
                                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                              </div>
                            ))}
                          </fieldset>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          disabled={quizQuestions.length >= 40}
                          onClick={() =>
                            setQuizQuestions((current) => [
                              ...current,
                              createQuizQuestionDraft(),
                            ])
                          }
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          Thêm câu hỏi
                        </Button>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isSavingContent}
                            className="bg-emerald-600 text-white"
                          >
                            {isSavingContent ? "Đang lưu..." : "Lưu bài tập"}
                          </Button>
                        </div>
                      </form>
                    )}
                  </section>
                )}

                {token && (
                  <AiLessonAssistant
                    token={token}
                    lesson={lesson}
                    locale={locale === "en" ? "en" : "vi"}
                    onLessonUpdated={(updated) =>
                      setLessons((prev) =>
                        prev.map((item) =>
                          item.id === updated.id ? { ...item, ...updated } : item,
                        ),
                      )
                    }
                    onQuizSaved={(lessonId, quiz) =>
                      setLessons((prev) =>
                        prev.map((item) =>
                          item.id === lessonId
                            ? { ...item, quizzes: [...(item.quizzes ?? []), quiz] }
                            : item,
                        ),
                      )
                    }
                    onMaterialAdded={(material) =>
                      setMaterials((prev) => [...prev, material])
                    }
                  />
                )}

                {/* Saved videos */}
                {(lesson.videos ?? []).length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Video bài giảng ({lesson.videos?.length ?? 0}):
                    </div>
                    <SortableList
                      items={lesson.videos ?? []}
                      label="Sắp xếp video"
                      className="space-y-1.5"
                      onReorder={(ids) => void handleReorderVideos(lesson.id, ids)}
                      renderItem={(video, videoIndex, { handle }) => (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 text-xs">
                          {handle}
                          <span className="shrink-0 font-bold text-blue-600">
                            {videoIndex + 1}.
                          </span>
                          <PlayCircle className="h-4 w-4 shrink-0 text-blue-500" />
                          <span className="truncate font-semibold text-foreground">
                            {video.title}{" "}
                            {video.titleEn ? `· ${video.titleEn}` : ""}
                          </span>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto max-w-[180px] truncate font-mono text-[10px] text-blue-500 hover:underline"
                          >
                            {video.url}
                          </a>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            disabled={loadingAnalyticsVideoId !== null}
                            onClick={() =>
                              void handleToggleVideoAnalytics(video.id)
                            }
                          >
                            <BarChart3 className="mr-1 h-3.5 w-3.5" />
                            {openAnalyticsVideoId === video.id
                              ? "Ẩn phân tích"
                              : "Phân tích"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                            aria-label="Xóa video"
                            onClick={() =>
                              void handleDeleteContent("videos", video.id, video.title)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {token && (
                          <VideoCheckpointManager
                            token={token}
                            videoId={video.id}
                            videoUrl={video.url}
                          />
                        )}
                        {openAnalyticsVideoId === video.id && (
                          <div className="rounded-lg border border-border bg-muted/20 p-3">
                            {loadingAnalyticsVideoId === video.id ? (
                              <p className="text-xs text-muted-foreground">
                                Đang tải phân tích...
                              </p>
                            ) : analyticsErrors[video.id] ? (
                              <p role="alert" className="text-xs text-destructive">
                                {analyticsErrors[video.id]}
                              </p>
                            ) : videoAnalytics[video.id]?.length ? (
                              <div className="space-y-2">
                                {videoAnalytics[video.id].map((metric) => (
                                  <div
                                    key={metric.activityId}
                                    className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/70 pb-2 text-xs last:border-0 last:pb-0"
                                  >
                                    <span className="min-w-28 font-semibold">
                                      {metric.type.replaceAll("_", " ")} ·{" "}
                                      {(metric.timestampMs / 1000).toFixed(1)}s
                                    </span>
                                    <span>
                                      {metric.uniqueParticipants} học sinh
                                    </span>
                                    <span>{metric.attempts} lượt trả lời</span>
                                    {metric.correctnessRate !== null && (
                                      <span>
                                        Đúng{" "}
                                        {Math.round(
                                          metric.correctnessRate * 100,
                                        )}
                                        %
                                      </span>
                                    )}
                                    {metric.averageDurationMs !== null && (
                                      <span>
                                        TB{" "}
                                        {Math.round(
                                          metric.averageDurationMs / 1000,
                                        )}
                                        s
                                      </span>
                                    )}
                                    {metric.pollOptionCounts &&
                                      Object.entries(
                                        metric.pollOptionCounts,
                                      ).map(([optionId, count]) => (
                                        <span key={optionId}>
                                          Poll {optionId}: {count}
                                        </span>
                                      ))}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Chưa có phản hồi cho các hoạt động của video.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      )}
                    />
                  </div>
                )}

                {(lesson.quizzes ?? []).length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(lesson.quizzes ?? []).map((quiz) => (
                      <span
                        key={quiz.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-700"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        {quiz.title} · {quiz.questions.length} câu
                        <button
                          type="button"
                          aria-label="Xóa bài tập"
                          className="ml-1 text-destructive hover:opacity-70"
                          onClick={() =>
                            void handleDeleteContent("quizzes", quiz.id, quiz.title)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Upload Material Modal */}
                {isUploadMaterialOpen === lesson.id && (
                  <div className="mb-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs animate-in fade-in">
                    <h4 className="font-bold text-sm mb-2 text-purple-600 flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Tài liệu và ghi chú học tập
                    cho &quot;{lesson.title}&quot;
                    </h4>
                    <form
                      onSubmit={(e) => handleUploadMaterial(e, lesson.id)}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Tên tài liệu (ví dụ: Tóm tắt lý thuyết PDF)"
                          value={materialTitle}
                          onChange={(e) => setMaterialTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                        />
                        <select
                          value={materialType}
                          onChange={(e) =>
                            setMaterialType(e.target.value as MaterialType)
                          }
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium"
                        >
                          <option value="PDF">Tài liệu PDF</option>
                          <option value="DOCUMENT">Tài liệu DOCX / PPTX</option>
                          <option value="OTHER">Tệp TXT hoặc tài liệu khác</option>
                          <option value="MODEL_3D">Link mô hình 3D</option>
                        </select>
                      </div>
                      <label className="block space-y-1">
                        <span className="font-medium">
                          Tải tài liệu lên (PDF, DOCX, PPTX, TXT; tối đa 50 MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                          disabled={isUploadingMaterial}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0] ?? null;
                            setMaterialFile(file);
                            if (file) setMaterialUrl("");
                          }}
                          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-500/10 file:px-3 file:py-2 file:font-semibold file:text-purple-700"
                        />
                      </label>
                      {materialFile ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2">
                          <span className="truncate">{materialFile.name}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setMaterialFile(null)}
                          >
                            Bỏ tệp
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="url"
                          placeholder="Hoặc dán link tài liệu/mô hình 3D"
                          value={materialUrl}
                          onChange={(e) => setMaterialUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isUploadingMaterial}
                          onClick={() => {
                            setIsUploadMaterialOpen(null);
                            setMaterialFile(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isUploadingMaterial}
                          className="bg-purple-600 text-white"
                        >
                          {isUploadingMaterial
                            ? "Đang tải..."
                            : "Lưu tài liệu"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Attached Materials list */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Tài liệu đã đính kèm ({lessonMats.length}):
                  </div>
                  {lessonMats.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic py-1">
                      Chưa có tài liệu đính kèm cho bài học này.
                    </div>
                  ) : (
                    lessonMats.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold text-foreground">
                            {m.title}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-[10px] font-bold">
                            {m.type}
                          </span>
                        </div>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-[220px] truncate text-blue-600 hover:underline"
                        >
                          Mở tài liệu
                        </a>
                        <button
                          type="button"
                          aria-label="Xóa tài liệu"
                          className="ml-2 text-destructive hover:opacity-70"
                          onClick={() =>
                            void handleDeleteContent("materials", m.id, m.title)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <section className="mt-5 space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-cyan-700" />
                    <h4 className="text-sm font-bold">
                      Hỏi đáp học sinh (
                      {(lessonQuestions[lesson.id] ?? []).length})
                    </h4>
                  </div>
                  {questionErrors[lesson.id] ? (
                    <p role="alert" className="text-sm text-destructive">
                      {questionErrors[lesson.id]}
                    </p>
                  ) : (lessonQuestions[lesson.id] ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Chưa có câu hỏi. Câu hỏi mới sẽ xuất hiện tại đây.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {(lessonQuestions[lesson.id] ?? []).map((question) => {
                        const questionText =
                          locale === question.questionLanguage
                            ? question.question
                            : question.questionTranslated;
                        const answerText =
                          question.answer === null
                            ? null
                            : locale === question.answerLanguage
                              ? question.answer
                              : question.answerTranslated;
                        return (
                          <article
                            key={question.id}
                            className="space-y-3 rounded-lg border border-border bg-card p-3"
                          >
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">
                                Câu hỏi ·{" "}
                                {new Date(question.createdAt).toLocaleString(
                                  locale === "vi" ? "vi-VN" : "en-US",
                                )}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm">
                                {questionText}
                              </p>
                            </div>
                            {answerText && (
                              <div className="rounded-md bg-emerald-500/5 p-3">
                                <p className="text-xs font-semibold text-emerald-700">
                                  Lời giải đã gửi
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm">
                                  {answerText}
                                </p>
                              </div>
                            )}
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <label
                                  htmlFor={`answer-language-${question.id}`}
                                  className="text-xs font-medium"
                                >
                                  Ngôn ngữ mình sẽ nhập
                                </label>
                                <select
                                  id={`answer-language-${question.id}`}
                                  value={
                                    answerLanguages[question.id] ?? locale
                                  }
                                  onChange={(event) =>
                                    setAnswerLanguages((current) => ({
                                      ...current,
                                      [question.id]: event.target.value as
                                        | "vi"
                                        | "en",
                                    }))
                                  }
                                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                                >
                                  <option value="vi">Tiếng Việt</option>
                                  <option value="en">English</option>
                                </select>
                              </div>
                              <textarea
                                rows={3}
                                maxLength={5000}
                                value={answerDrafts[question.id] ?? ""}
                                onChange={(event) =>
                                  setAnswerDrafts((current) => ({
                                    ...current,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                placeholder="Nhập lời giải bằng Tiếng Việt hoặc English"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              />
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    answeringQuestionId === question.id ||
                                    !answerDrafts[question.id]?.trim()
                                  }
                                  onClick={() =>
                                    void handleAnswerQuestion(
                                      lesson.id,
                                      question,
                                    )
                                  }
                                >
                                  {answeringQuestionId === question.id
                                    ? "Đang dịch và lưu..."
                                    : answerText
                                      ? "Cập nhật lời giải"
                                      : "Gửi lời giải"}
                                </Button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
