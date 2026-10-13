"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  BookOpen,
  Users,
  Star,
  Lock,
  CheckCircle2,
  PlayCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Course, Lesson } from "@/types";
import { fetchMyProgress } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type CourseDetailCourse = Course & {
  descriptionEn?: string;
  subjectLabelEn?: string;
  duration?: string;
  enrolled?: number;
  rating: number;
  color?: string;
};

export type CourseDetailLesson = Lesson & {
  descriptionEn?: string;
  isLocked?: boolean;
  isCompleted?: boolean;
};

interface CourseDetailClientProps {
  course: CourseDetailCourse;
  lessons: CourseDetailLesson[];
}

export default function CourseDetailClient({
  course,
  lessons: initialLessons,
}: CourseDetailClientProps) {
  const { token, user } = useAuth();
  const [lessonStates, setLessonStates] = useState(initialLessons);
  const lessons = lessonStates;
  useEffect(() => {
    setLessonStates(initialLessons);
    if (!token || user?.role !== "STUDENT") return;
    let active = true;
    fetchMyProgress(token).then((progress) => {
      if (!active) return;
      const completedIds = new Set(progress
        .filter((item) => item.status === "COMPLETED" && item.lesson.courseId === course.id)
        .map((item) => item.lessonId));
      let previousIncomplete = false;
      setLessonStates(initialLessons.map((lesson) => {
        const isCompleted = completedIds.has(lesson.id);
        const state = { ...lesson, isCompleted, isLocked: previousIncomplete };
        if (!isCompleted) previousIncomplete = true;
        return state;
      }));
    }).catch((error: unknown) => {
      console.error("Unable to load course learning progress:", error);
    });
    return () => { active = false; };
  }, [course.id, initialLessons, token, user?.role]);
  const [activeTab, setActiveTab] = useState<"lessons" | "info" | "reviews">(
    "lessons",
  );
  const [expandedLesson, setExpandedLesson] = useState<string | null>(
    lessons[0]?.id || null,
  );

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;
  const nextLesson =
    lessons.find((lesson) => !lesson.isCompleted && !lesson.isLocked) ||
    lessons[0];

  const tabs = [
    { id: "lessons" as const, label: "Bài học", count: lessons.length },
    { id: "info" as const, label: "Thông tin" },
    { id: "reviews" as const, label: "Đánh giá" },
  ];

  return (
    <>
      {/* Course header */}
      <section
        className={`relative overflow-hidden bg-gradient-to-br ${course.color} py-16 md:py-20`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_50%,white,transparent)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          {/* Breadcrumb */}
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Khóa học
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Course info */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0 hover:bg-white/30"
                >
                  {course.subjectLabel}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0 hover:bg-white/30"
                >
                  Lớp {course.level}
                </Badge>
              </div>

              <h1 className="text-3xl font-extrabold text-white md:text-4xl">
                {course.title}
              </h1>
              <p className="text-lg text-white/80 font-medium">
                {course.titleEn}
              </p>
              <p className="text-white/70 leading-relaxed max-w-2xl">
                {course.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm mt-2">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {course.lessonCount} bài học
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.enrolled} học sinh
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {course.rating} / 5.0
                </span>
              </div>
            </div>

            {/* Right: CTA card (desktop) */}
            <div className="hidden lg:block">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                    <span>Tiến trình</span>
                    <span className="font-semibold text-white">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-1.5">
                    {completedCount}/{lessons.length} bài hoàn thành
                  </p>
                </div>

                {nextLesson ? (
                  <Link
                    href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg rounded-lg px-6 py-3 text-sm transition-colors"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {completedCount > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                  </Link>
                ) : (
                  <p className="text-center text-sm text-white/75">
                    Khóa học chưa có bài học.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile CTA */}
      <div className="lg:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount}/{lessons.length} bài hoàn thành
            </p>
          </div>
          {nextLesson ? (
            <Link
              href={`/courses/${course.id}/lessons/${nextLesson.id}`}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              {completedCount > 0 ? "Tiếp tục" : "Bắt đầu"}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              Chưa có bài học
            </span>
          )}
        </div>
      </div>

      {/* Tabs & Content */}
      <section className="py-8 md:py-12 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1 mb-8 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Lessons */}
          {activeTab === "lessons" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lessons list */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                {lessons.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground">
                    Khóa học chưa có bài học.
                  </p>
                )}
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`rounded-xl border transition-all duration-200 ${
                      lesson.isLocked
                        ? "border-border bg-muted/30 opacity-60"
                        : lesson.isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-card hover:border-blue-500/30 hover:shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedLesson(
                          expandedLesson === lesson.id ? null : lesson.id,
                        )
                      }
                      className="w-full flex items-center gap-4 p-4 text-left"
                      disabled={lesson.isLocked}
                    >
                      {/* Order number / Status icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          lesson.isCompleted
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : lesson.isLocked
                              ? "bg-muted text-muted-foreground"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : lesson.isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          lesson.order
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lesson.titleEn}
                        </p>
                      </div>

                      {/* Duration + expand */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {lesson.duration}
                        </span>
                        {!lesson.isLocked && (
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                              expandedLesson === lesson.id ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {expandedLesson === lesson.id && !lesson.isLocked && (
                      <div className="px-4 pb-4 pt-0">
                        <Separator className="mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">
                          {lesson.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/courses/${course.id}/lessons/${lesson.id}`}
                            className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            {lesson.isCompleted ? "Xem lại" : "Học ngay"}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {lesson.duration}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sidebar (desktop) */}
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-border bg-card p-6 sticky top-24">
                  <h3 className="font-semibold text-foreground mb-4">
                    Thông tin khóa học
                  </h3>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Môn học</span>
                      <span className="font-medium text-foreground">
                        {course.subjectLabel}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cấp lớp</span>
                      <span className="font-medium text-foreground">
                        Lớp {course.level}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Số bài học</span>
                      <span className="font-medium text-foreground">
                        {course.lessonCount}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thời lượng</span>
                      <span className="font-medium text-foreground">
                        {course.duration}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Học sinh</span>
                      <span className="font-medium text-foreground">
                        {course.enrolled}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Đánh giá</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        {course.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="max-w-3xl">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {course.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {course.titleEn}
                </p>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3>Mô tả khóa học</h3>
                  <p>{course.description}</p>
                  <p className="text-muted-foreground italic">
                    {course.descriptionEn}
                  </p>

                  <h3>Bạn sẽ học được gì?</h3>
                  <ul>
                    <li>
                      Nắm vững kiến thức nền tảng về{" "}
                      {course.title.toLowerCase()}
                    </li>
                    <li>Hiểu và sử dụng thuật ngữ STEM bằng tiếng Anh</li>
                    <li>Áp dụng kiến thức vào bài toán thực tế</li>
                    <li>
                      Phát triển tư duy phản biện và kỹ năng giải quyết vấn đề
                    </li>
                  </ul>

                  <h3>Yêu cầu</h3>
                  <ul>
                    <li>Kiến thức cơ bản Toán / Khoa học lớp trước</li>
                    <li>Trình độ tiếng Anh cơ bản (có hỗ trợ song ngữ)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Reviews */}
          {activeTab === "reviews" && (
            <div className="max-w-3xl">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                {/* Overall rating */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-foreground">
                      {course.rating}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(course.rating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {course.enrolled} đánh giá
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const percent =
                        rating === 5
                          ? 68
                          : rating === 4
                            ? 22
                            : rating === 3
                              ? 7
                              : rating === 2
                                ? 2
                                : 1;
                      return (
                        <div
                          key={rating}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-3 text-muted-foreground">
                            {rating}
                          </span>
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-yellow-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">
                            {percent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Mock reviews */}
                {[
                  {
                    name: "Minh Anh",
                    rating: 5,
                    date: "2 ngày trước",
                    comment:
                      "Khóa học rất hay, giải thích dễ hiểu và có video tương tác rất thú vị!",
                  },
                  {
                    name: "Đức Huy",
                    rating: 4,
                    date: "1 tuần trước",
                    comment:
                      "Nội dung tốt, song ngữ giúp em hiểu thêm tiếng Anh. Mong có thêm bài tập.",
                  },
                  {
                    name: "Thanh Trúc",
                    rating: 5,
                    date: "2 tuần trước",
                    comment:
                      "Em thích nhất phần mô hình 3D, giúp hiểu bài nhanh hơn nhiều so với sách giáo khoa.",
                  },
                ].map((review, i) => (
                  <div key={i} className={i > 0 ? "mt-6" : ""}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {review.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {review.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pl-11">
                      {review.comment}
                    </p>
                    {i < 2 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
