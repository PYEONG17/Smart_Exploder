"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Edit,
  ExternalLink,
  Sparkles,
  Layers,
  Users,
  TrendingUp,
  Box,
  Database,
} from "lucide-react";
import TeacherExploreManager from "@/components/teacher/TeacherExploreManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchMyCourses } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { Course } from "@/types";
import { useLang } from "@/contexts/LanguageContext";
import { motion } from "motion/react";

const teacherRoles = ["TEACHER", "ADMIN"] as const;

export default function TeacherDashboardPage() {
  const { isLoading: isAuthLoading } = useAuthGuard({
    allowedRoles: [...teacherRoles],
    forbiddenRedirectTo: "/assignments",
  });
  const { token, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<"courses" | "explore_3d">("courses");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useLang();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam === "explore" || tabParam === "explore_3d" || tabParam === "3d") {
        setActiveTab("explore_3d");
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token || (user?.role !== "TEACHER" && user?.role !== "ADMIN")) {
      return;
    }
    fetchMyCourses(token)
      .then(setCourses)
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải khóa học.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, token, user?.role]);

  const teacherStats = [
    {
      label: locale === "vi" ? "Khóa học đã tạo" : "Courses Created",
      value: courses.length,
      icon: BookOpen,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: locale === "vi" ? "Bài học đã tạo" : "Lessons Created",
      value: courses.reduce(
        (total, course) => total + (course.lessonCount ?? 0),
        0,
      ),
      icon: Layers,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: locale === "vi" ? "Lượt học sinh đã xem video" : "Video learners",
      value: courses.reduce((total, course) => total + (course.activeLearners ?? 0), 0),
      icon: Users,
      color: "text-violet-500 bg-violet-500/10",
    },
    {
      label: locale === "vi" ? "Hoàn thành trung bình" : "Average completion",
      value: courses.length
        ? `${Math.round(courses.reduce((total, course) => total + (course.completionRate ?? 0), 0) / courses.length)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  if (
    isAuthLoading ||
    (isLoading && !!token && (user?.role === "TEACHER" || user?.role === "ADMIN"))
  ) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Đang tải dữ liệu giáo viên...
      </div>
    );
  }

  if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background pt-24 text-center text-muted-foreground">
        Tài khoản này không có quyền giáo viên.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 pt-10 md:pt-14">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          className="premium-card relative mb-8 flex flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-violet-50 via-card to-sky-50 p-6 dark:from-violet-950/25 dark:via-card dark:to-sky-950/20 md:flex-row md:items-center md:p-9"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
          <div>
            <div className="eyebrow mb-3 border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300">
              <Sparkles className="w-4 h-4 text-purple-500" />
              {locale === "vi"
                ? "Dành cho Giáo viên & Tác giả Khóa học"
                : "For Teachers & Course Authors"}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              {t("teacher.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {t("teacher.subtitle")}
            </p>
          </div>

          <div className="relative flex flex-wrap items-center gap-3">
            <Button
              variant={activeTab === "explore_3d" ? "default" : "outline"}
              onClick={() => setActiveTab(activeTab === "explore_3d" ? "courses" : "explore_3d")}
              className={`rounded-xl py-5 font-semibold ${
                activeTab === "explore_3d"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md"
                  : ""
              }`}
            >
              <Database className="mr-2 h-4 w-4 text-cyan-500" />
              <span>{locale === "vi" ? "Kho Học Liệu 3D (DB)" : "3D Materials DB"}</span>
            </Button>
            <Button variant="outline" className="rounded-xl py-5" asChild>
              <Link href="/teacher/labs/new">
                <Plus className="mr-2 h-4 w-4" />
                {locale === "vi" ? "Tạo thí nghiệm Lab" : "Create a Lab"}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-xl py-5" asChild>
              <Link href="/teacher/assessment-generator">
                <Sparkles className="mr-2 h-4 w-4" />
                {locale === "vi" ? "Tạo đề bằng AI" : "AI Assessment Generator"}
              </Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md py-5 font-semibold"
              asChild
            >
              <Link href="/teacher/courses/create">
                <Plus className="w-4 h-4 mr-2" />
                {t("teacher.create")}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teacherStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                className="premium-card premium-card-hover flex items-center gap-4 p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <div className={`p-3 rounded-xl ${stat.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "courses"
                ? "bg-blue-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{t("teacher.courses")}</span>
            <Badge variant="secondary" className="ml-1 text-[11px] py-0 px-2 bg-white/20 text-white">
              {courses.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("explore_3d")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "explore_3d"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Box className="h-4 w-4" />
            <span>{locale === "vi" ? "Kho Học Liệu 3D & Song Ngữ (Database)" : "3D Materials DB Manager"}</span>
            <Badge variant="outline" className="ml-1 text-[10px] py-0 px-2 border-cyan-400/50 text-cyan-400">
              PostgreSQL
            </Badge>
          </button>
        </div>

        {/* Tab Content 1: 3D Explore DB Manager */}
        {activeTab === "explore_3d" && <TeacherExploreManager />}

        {/* Tab Content 2: Courses Table / Cards */}
        {activeTab === "courses" && (
        <div className="premium-card p-5 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              {t("teacher.courses")}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {courses.length} {t("teacher.stat.courses").toLowerCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {error ? (
              <p className="py-10 text-center text-destructive">{error}</p>
            ) : courses.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                Bạn chưa tạo khóa học nào.
              </p>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-lg lg:flex-row lg:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${course.color || "from-blue-500 to-indigo-600"} flex items-center justify-center text-white shrink-0 shadow-md overflow-hidden`}
                    >
                      {course.thumbnail ? (
                        // Thumbnails can be uploaded files or arbitrary external URLs.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-600 border-0"
                        >
                          {locale === "vi"
                            ? course.subjectLabel
                            : course.subject === "math"
                              ? "Mathematics"
                              : "Science"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          {locale === "vi" ? "Lớp" : "Grade"} {course.level}
                        </Badge>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {locale === "vi" ? "Đang xuất bản" : "Published"}
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground text-lg hover:text-blue-600 transition-colors">
                        <Link
                          href={`/teacher/courses/${course.id}/edit`}
                          className="after:absolute after:inset-0 after:content-['']"
                        >
                          {locale === "vi"
                            ? course.title
                            : course.titleEn || course.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {locale === "vi"
                          ? course.description
                          : course.descEn || course.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                        <span>
                          {course.lessonCount ?? 0}{" "}
                          {locale === "vi" ? "bài học" : "lessons"}
                        </span>
                        {course.duration && <span>{course.duration}</span>}
                        <span>
                          {course.activeLearners ?? 0} {locale === "vi" ? "học sinh đã xem" : "learners"}
                        </span>
                        <span>
                          {course.completionRate ?? 0}% {locale === "vi" ? "hoàn thành TB" : "avg. complete"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-2 self-end lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-semibold border-border hover:bg-muted"
                      asChild
                    >
                      <Link href={`/teacher/courses/${course.id}/edit`}>
                        <Edit className="w-4 h-4 mr-1.5 text-blue-500" />
                        {t("teacher.edit")}
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-muted-foreground hover:text-foreground"
                      asChild
                      title={
                        locale === "vi"
                          ? "Xem giao diện học sinh"
                          : "View as student"
                      }
                    >
                      <Link href={`/courses/${course.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
