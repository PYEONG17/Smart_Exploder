"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createCourse,
  createLesson,
  createLessonQuiz,
  createLessonVideo,
  uploadCourseMedia,
} from "@/lib/api";
import type { SubjectType } from "@/types";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  AuthoringLanguageToggle,
  type AuthoringLanguage,
} from "@/components/teacher/AuthoringLanguageToggle";
import {
  LectureBuilder,
  MAX_LECTURE_VIDEO_BYTES,
  type LectureDraft,
} from "@/components/teacher/LectureBuilder";
import {
  BilingualTextField,
  type BilingualTextValue,
} from "@/components/teacher/BilingualTextField";

const teacherRoles = ["TEACHER"] as const;

export default function CreateCoursePage() {
  const { isLoading: isAuthLoading } = useAuthGuard({
    allowedRoles: [...teacherRoles],
    forbiddenRedirectTo: "/assignments",
  });
  const router = useRouter();
  const { t, locale } = useLang();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [contentLanguage, setContentLanguage] = useState<AuthoringLanguage>(
    locale === "en" ? "en" : "vi",
  );
  const [subject, setSubject] = useState<SubjectType>("math");
  const [level, setLevel] = useState("8");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [lectures, setLectures] = useState<LectureDraft[]>([]);

  const handleThumbnailUpload = async (file: File) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại trước khi tải ảnh lên.");
      return;
    }
    setIsUploadingThumbnail(true);
    try {
      const uploaded = await uploadCourseMedia(token, file, {
        kind: "thumbnail",
      });
      setThumbnail(uploaded.url);
      toast.success("Đã tải ảnh thumbnail lên.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải ảnh lên.",
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  // Mỗi bài giảng được tạo thành một bài học và có thể chứa nhiều video.
  const createLectures = async (authToken: string, courseId: string) => {
    const failures: string[] = [];
    let order = 1;
    for (const lecture of lectures) {
      const lectureTitle = lecture.title.trim() || lecture.titleEn.trim();
      const lectureTitleEn = lecture.titleEn.trim() || lecture.title.trim();
      const lectureDescription =
        lecture.description.trim() || lecture.descriptionEn.trim();
      const videos = lecture.videos.filter((video) =>
        video.mode === "url" ? video.url.trim() : video.file,
      );
      if (!lectureTitle && !lectureDescription && videos.length === 0) continue;

      const label = lectureTitle || `Bài giảng ${order}`;
      try {
        const lesson = await createLesson(authToken, {
          courseId,
          title:
            lectureTitle ||
            (contentLanguage === "vi" ? `Bài ${order}` : `Lesson ${order}`),
          titleEn: lectureTitleEn || undefined,
          description: lectureDescription || undefined,
          descEn:
            lecture.descriptionEn.trim() ||
            lecture.description.trim() ||
            undefined,
          duration: videos.length > 0 && videos.every((video) => video.durationSeconds != null)
            ? `${Math.max(1, Math.round(videos.reduce((sum, video) => sum + (video.durationSeconds ?? 0), 0) / 60))} phút`
            : undefined,
          order,
        });
        order += 1;
        for (const [index, video] of videos.entries()) {
          try {
            const uploaded =
              video.mode === "file" && video.file
                ? await uploadCourseMedia(authToken, video.file, {
                    kind: "lesson-video",
                    lessonId: lesson.data.id,
                  })
                : null;
            const createdVideo = await createLessonVideo(authToken, lesson.data.id, {
              title: video.title.trim() || video.titleEn.trim() || `${label} - Video phần ${index + 1}`,
              titleEn: video.titleEn.trim() || video.title.trim() || undefined,
              url: uploaded?.url ?? video.url.trim(),
              durationSeconds: video.durationSeconds ?? undefined,
              activities: video.questions.map((question) => ({
                timestampMs: Math.round(Number(question.timestamp) * 1000),
                type: "QUESTION",
                sourceLanguage: contentLanguage,
                content: {
                  question: question.question.trim(),
                  options: question.options.map((option) => option.trim()),
                  correctIndex: question.correctIndex,
                  explanation: question.explanation.trim() || undefined,
                  rewindSeconds: 20,
                },
              })),
            });
            for (const [quizIndex, quiz] of video.practiceQuizzes.entries()) {
              try {
                await createLessonQuiz(authToken, lesson.data.id, {
                  title: quiz.title.trim(),
                  videoId: createdVideo.id,
                  sourceLanguage: contentLanguage,
                  questions: quiz.questions.map((question) => ({
                    question: question.question.trim(),
                    options: question.options.map((content) => ({ content: content.trim() })),
                    correctIndex: question.correctIndex,
                  })),
                });
              } catch (quizError) {
                failures.push(
                  `${label} – video ${index + 1}, bài tập ${quizIndex + 1}: ${quizError instanceof Error ? quizError.message : "lỗi không xác định"}`,
                );
              }
            }
          } catch (videoError) {
            failures.push(
              `${label} – video ${index + 1}: ${videoError instanceof Error ? videoError.message : "lỗi không xác định"}`,
            );
          }
        }
      } catch (lessonError) {
        failures.push(
          `${label}: ${lessonError instanceof Error ? lessonError.message : "lỗi không xác định"}`,
        );
      }
    }
    return failures;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleVi.trim() && !titleEn.trim()) {
      toast.error("Vui lòng nhập tên khóa học");
      return;
    }

    for (const lecture of lectures) {
      for (const video of lecture.videos) {
        const url = video.url.trim();
        if (video.mode === "url" && url && !URL.canParse(url)) {
          toast.error("Có link video không hợp lệ.");
          return;
        }
        if (video.questions.length > 20) {
          toast.error("Mỗi video chỉ hỗ trợ tối đa 20 câu hỏi tương tác.");
          return;
        }
        if (video.practiceQuizzes.length > 10) {
          toast.error("Mỗi video chỉ hỗ trợ tối đa 10 bài tập củng cố.");
          return;
        }
        if (video.questions.length && !(video.mode === "file" ? video.file : url)) {
          toast.error("Hãy chọn video trước khi thêm câu hỏi tương tác.");
          return;
        }
        const questionTimes = video.questions.map((question) => Number(question.timestamp));
        if (video.questions.some((question, index) =>
          question.timestamp.trim() === "" ||
          !Number.isFinite(questionTimes[index]) ||
          questionTimes[index] < 0 ||
          question.question.trim().length < 2 ||
          question.options.some((option) => !option.trim()),
        )) {
          toast.error("Mỗi câu hỏi cần có thời điểm hợp lệ, nội dung và đủ 4 lựa chọn.");
          return;
        }
        if (new Set(questionTimes.map((time) => Math.round(time * 1000))).size !== questionTimes.length) {
          toast.error("Các câu hỏi trong cùng video cần có thời điểm khác nhau.");
          return;
        }
        if (
          video.practiceQuizzes.some(
            (quiz) =>
              quiz.title.trim().length < 2 ||
              quiz.questions.length < 1 ||
              quiz.questions.length > 20 ||
              quiz.questions.some(
                (question) =>
                  question.question.trim().length < 2 ||
                  question.options.some((option) => !option.trim()),
              ),
          )
        ) {
          toast.error("Mỗi bài tập cần có tên và ít nhất một câu hỏi đủ 4 lựa chọn.");
          return;
        }
        if (
          video.practiceQuizzes.length &&
          !(video.mode === "file" ? video.file : url)
        ) {
          toast.error("Hãy chọn video trước khi thêm bài tập củng cố.");
          return;
        }
        if (
          video.mode === "file" &&
          video.file &&
          video.file.size > MAX_LECTURE_VIDEO_BYTES
        ) {
          toast.error("Có video vượt quá giới hạn tải lên 1 GB.");
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (!token || user?.role !== "TEACHER") {
        throw new Error(
          "Bạn cần đăng nhập bằng tài khoản giáo viên để tạo khóa học.",
        );
      }
      const res = await createCourse(token, {
        title: titleVi.trim() || titleEn.trim(),
        titleEn: titleEn.trim() || titleVi.trim(),
        description:
          descriptionVi.trim() || descriptionEn.trim() || undefined,
        descEn: descriptionEn.trim() || descriptionVi.trim() || undefined,
        subject,
        level,
        thumbnail: thumbnail.trim() || undefined,
      });

      if (res.success && res.data) {
        const failures = await createLectures(token, res.data.id);
        if (failures.length > 0) {
          toast.warning(
            "Đã tạo khóa học nhưng chưa lưu được: " +
              failures.join("; ") +
              ". Bạn có thể thêm lại trong trang chỉnh sửa.",
          );
        }
        toast.success(t("common.success"));
        router.push(`/teacher/courses/${res.data.id}/edit`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("create.back")}
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">
                {t("create.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("create.subtitle")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject & Level Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {t("create.subject")}
                </label>
                <select
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value === "science" ? "science" : "math",
                    )
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="math">
                    {locale === "vi" ? "Toán học (Mathematics)" : "Mathematics"}
                  </option>
                  <option value="science">
                    {locale === "vi" ? "Khoa học (Science)" : "Science"}
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {t("create.level")}
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {["6", "7", "8", "9", "10", "11", "12"].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {locale === "vi" ? "Lớp" : "Grade"} {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <AuthoringLanguageToggle
                value={contentLanguage}
                onChange={setContentLanguage}
                disabled={loading}
              />
              <BilingualTextField
                label={locale === "vi" ? "Tên khóa học" : "Course title"}
                value={{ vi: titleVi, en: titleEn }}
                onChange={(value: BilingualTextValue) => {
                  setTitleVi(value.vi);
                  setTitleEn(value.en);
                }}
                disabled={loading}
              />
              <BilingualTextField
                label={
                  locale === "vi"
                    ? "Mô tả khóa học (không bắt buộc)"
                    : "Course description (optional)"
                }
                value={{ vi: descriptionVi, en: descriptionEn }}
                onChange={(value: BilingualTextValue) => {
                  setDescriptionVi(value.vi);
                  setDescriptionEn(value.en);
                }}
                multiline
                disabled={loading}
              />
            </div>

            {/* Thumbnail upload or URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                {t("create.thumbnail")}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploadingThumbnail || loading}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void handleThumbnailUpload(file);
                  event.currentTarget.value = "";
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/10 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-500/20"
              />
              <p className="text-xs text-muted-foreground">
                {isUploadingThumbnail
                  ? "Đang tải ảnh lên..."
                  : "JPG, PNG hoặc WebP; tối đa 15 MB. Hoặc nhập URL ảnh bên dưới."}
              </p>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="https://example.com/thumbnail.png (Để trống nếu dùng mặc định)"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <LectureBuilder
              value={lectures}
              onChange={setLectures}
              language={contentLanguage}
              disabled={loading}
            />

            {/* Submit */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
              <Button variant="ghost" asChild>
                <Link href="/teacher">{t("create.cancel")}</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading || isUploadingThumbnail}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl px-6 py-5 font-semibold"
              >
                {loading ? t("create.creating") : t("create.submit")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
