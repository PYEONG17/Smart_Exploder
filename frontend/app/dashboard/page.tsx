"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Trophy,
  PlayCircle,
  Target,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "motion/react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  fetchMyProgress,
  fetchMyLearningAnalytics,
  fetchMyQuizAttempts,
  type LearningAnalyticsSummary,
  type ProgressSummary,
  type QuizAttemptSummary,
} from "@/lib/api";

const studentRoles = ["STUDENT"] as const;

export default function DashboardPage() {
  const { t, locale } = useLang();
  const { token, user } = useAuth();
  const [progress, setProgress] = useState<ProgressSummary[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<LearningAnalyticsSummary | null>(
    null,
  );
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const { isLoading } = useAuthGuard({
    allowedRoles: [...studentRoles],
    forbiddenRedirectTo: "/teacher",
  });

  useEffect(() => {
    if (!token || user?.role !== "STUDENT") return;
    let isActive = true;
    Promise.all([fetchMyProgress(token), fetchMyQuizAttempts(token)])
      .then(([studentProgress, quizAttempts]) => {
        if (!isActive) return;
        setProgress(studentProgress);
        setAttempts(quizAttempts);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setDataError(
            error instanceof Error
              ? error.message
              : "Không thể tải tiến độ học tập.",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsDataLoading(false);
      });
    void fetchMyLearningAnalytics(token)
      .then((summary) => {
        if (isActive) setAnalytics(summary);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setAnalyticsError(
            error instanceof Error
              ? error.message
              : "Không thể tải phân tích học tập.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [token, user?.role]);

  // Show loading skeleton while auth state hydrates
  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const activityDates = new Set([
    ...progress.map((item) => item.updatedAt.slice(0, 10)),
    ...attempts.map((item) => item.createdAt.slice(0, 10)),
  ]);
  const streakDate = new Date();
  if (!activityDates.has(streakDate.toISOString().slice(0, 10))) {
    streakDate.setDate(streakDate.getDate() - 1);
  }
  let studyStreak = 0;
  while (activityDates.has(streakDate.toISOString().slice(0, 10))) {
    studyStreak += 1;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  const averageScore = attempts.length
    ? Math.round(
        attempts.reduce((total, attempt) => total + attempt.percentage, 0) /
          attempts.length,
      )
    : 0;
  const completedLessons = progress.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const courseCount = new Set(progress.map((item) => item.lesson.courseId))
    .size;

  const weeklyProgress = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayKey = date.toISOString().slice(0, 10);
    const dayAttempts = attempts.filter(
      (attempt) => attempt.createdAt.slice(0, 10) === dayKey,
    );
    const dayCompletions = progress.filter(
      (item) =>
        item.status === "COMPLETED" &&
        item.completedAt?.slice(0, 10) === dayKey,
    ).length;

    return {
      week: new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        weekday: "short",
      }).format(date),
      quizScore: dayAttempts.length
        ? Math.round(
            dayAttempts.reduce(
              (total, attempt) => total + attempt.percentage,
              0,
            ) / dayAttempts.length,
          )
        : 0,
      lessonsDone: dayCompletions,
    };
  });

  const stats = [
    {
      labelKey: "dashboard.stat.enrolled" as const,
      value: courseCount,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      labelKey: "dashboard.stat.completed" as const,
      value: completedLessons,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      labelKey: "dashboard.stat.avg_score" as const,
      value: `${averageScore}%`,
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      labelKey: "dashboard.stat.streak" as const,
      value: `${studyStreak} ${t("dashboard.stat.streak_unit")}`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-16 pt-10 md:pt-14">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          className="relative mb-8 flex flex-col justify-between gap-5 overflow-hidden rounded-[2rem] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-[0_24px_70px_-48px_rgba(37,99,235,0.5)] dark:border-blue-400/15 dark:from-blue-950/45 dark:via-card dark:to-cyan-950/30 md:flex-row md:items-center md:p-9"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div>
            <div className="eyebrow mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              {locale === "vi" ? "Góc học tập của bạn" : "Your learning space"}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              {t("dashboard.welcome")}{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {user?.name?.split(" ").pop() ?? "..."}
              </span>
              ! 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              {t("dashboard.subtitle")}
            </p>
          </div>

          <div className="relative flex items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
            <Calendar className="w-4 h-4 text-blue-500" />
            {t("dashboard.today")}{" "}
            {new Date().toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
          </div>
        </motion.div>

        {dataError && (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {dataError}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                className="premium-card premium-card-hover group relative flex items-center gap-4 overflow-hidden p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-colors duration-500" />

                <div
                  className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <div className="text-2xl font-black text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t(stat.labelKey)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <section className="mb-8 space-y-4" aria-labelledby="learning-analytics">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow mb-2">
                {locale === "vi" ? "Phân tích học tập" : "Learning analytics"}
              </p>
              <h2
                id="learning-analytics"
                className="text-xl font-bold tracking-tight"
              >
                {locale === "vi"
                  ? "Thói quen học tập 7 ngày"
                  : "Your 7-day learning pattern"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "vi"
                ? "Thời gian xem chỉ tính khi video đang phát."
                : "Watch time counts active video playback only."}
            </p>
          </div>

          {analyticsError && (
            <p
              role="status"
              className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
            >
              {locale === "vi"
                ? "Chưa tải được dữ liệu phân tích. Kiểm tra migration analytics và thử tải lại."
                : "Analytics are unavailable. Check that the analytics migration is applied, then reload."}
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.5fr]">
            <div className="grid grid-cols-2 gap-3">
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Thời gian xem" : "Watch time"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics
                    ? `${Math.floor(analytics.metrics.watchSeconds / 60)}`
                    : "—"}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground">
                    {locale === "vi" ? "phút" : "min"}
                  </span>
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Ngày học chủ động" : "Active days"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics?.metrics.activeDays ?? "—"}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground">
                    / 7
                  </span>
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Phiên xem video" : "Video sessions"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics?.metrics.activeSessions ?? "—"}
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Hoàn thành bài đã bắt đầu" : "Tracked lesson completion"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics?.metrics.completionRate == null
                    ? "—"
                    : `${analytics.metrics.completionRate}%`}
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Lượt làm bài kiểm tra" : "Quiz attempts"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics?.metrics.quizAttempts ?? "—"}
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Điểm kiểm tra trung bình" : "Average quiz score"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics?.metrics.averageQuizPercentage == null
                    ? "—"
                    : `${analytics.metrics.averageQuizPercentage}%`}
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {locale === "vi" ? "Chỉ số tham gia học tập" : "Engagement index"}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {analytics ? `${analytics.metrics.engagementScore}/100` : "—"}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                  {locale === "vi"
                    ? "Hoạt động, không phải điểm năng lực"
                    : "Activity signal, not an ability score"}
                </p>
                <div className="mt-3 space-y-1.5 border-t border-border/70 pt-2">
                  {(analytics?.metrics.engagementComponents ?? []).map(
                    (component) => (
                      <div
                        key={component.key}
                        className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground"
                      >
                        <span>
                          {component.key === "activeDays"
                            ? locale === "vi"
                              ? "Ngày học"
                              : "Active days"
                            : component.key === "watchSeconds"
                              ? locale === "vi"
                                ? "Thời gian xem"
                                : "Watch time"
                              : component.key === "activeSessions"
                                ? locale === "vi"
                                  ? "Phiên video"
                                  : "Video sessions"
                                : locale === "vi"
                                  ? "Lượt làm bài"
                                  : "Quiz attempts"}
                        </span>
                        <span className="tabular-nums">
                          {component.earnedPoints}/{component.points}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="premium-card p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="font-bold">
                  {locale === "vi" ? "Thời gian xem mỗi ngày" : "Daily watch time"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {locale === "vi" ? "phút" : "minutes"}
                </span>
              </div>
              {analytics ? (
                <div className="flex h-32 items-end justify-between gap-2">
                  {analytics.daily.map((day) => {
                    const maxSeconds = Math.max(
                      1,
                      ...analytics.daily.map((item) => item.watchSeconds),
                    );
                    const date = new Date(`${day.date}T00:00:00Z`);
                    const label = new Intl.DateTimeFormat(
                      locale === "vi" ? "vi-VN" : "en-US",
                      { weekday: "short", timeZone: "UTC" },
                    ).format(date);
                    const height =
                      day.watchSeconds === 0
                        ? 4
                        : Math.max(8, (day.watchSeconds / maxSeconds) * 100);
                    return (
                      <div
                        key={day.date}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        title={`${label}: ${Math.round(day.watchSeconds / 60)} min`}
                      >
                        <div className="flex h-24 w-full items-end justify-center rounded-lg bg-muted/50">
                          <div
                            className="w-2/3 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 transition-all"
                            style={{ height: `${height}%` }}
                            aria-label={`${Math.round(day.watchSeconds / 60)} minutes`}
                          />
                        </div>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {locale === "vi"
                    ? "Biểu đồ sẽ hiện sau khi có dữ liệu xem video."
                    : "The chart appears when video watch data is available."}
                </p>
              )}
            </div>
          </div>

          {analytics &&
            (!analytics.topicMastery.available ||
              !analytics.riskSignals.available) && (
              <p className="text-xs leading-5 text-muted-foreground">
                {locale === "vi"
                  ? "Phân tích điểm mạnh/yếu theo chủ đề và cảnh báo học tập chưa khả dụng: nội dung hiện chưa được gắn taxonomy chủ đề và lịch học."
                  : "Topic strengths, weaknesses, and risk signals are not available yet because content topic tags and instructional schedules are not configured."}
              </p>
            )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <motion.div
            className="lg:col-span-2 space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Progress Chart */}
            <div className="premium-card relative overflow-hidden p-5 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {t("dashboard.chart.weekly")}
                </h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                  <Target className="w-4 h-4" />{" "}
                  {locale === "vi" ? "Mục tiêu: ≥ 85%" : "Goal: ≥ 85%"}
                </div>
              </div>
              <div className="h-[280px] w-full relative z-10">
                {weeklyProgress.some((day) => day.quizScore > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weeklyProgress}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorScore"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="week"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))",
                        }}
                        itemStyle={{
                          color: "hsl(var(--foreground))",
                          fontWeight: "bold",
                        }}
                      />
                      <Area
                        type="natural"
                        dataKey="quizScore"
                        name="Điểm trung bình"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {locale === "vi"
                      ? "Chưa có điểm bài tập trong 7 ngày qua."
                      : "No assignment scores in the last 7 days."}
                  </div>
                )}
              </div>
            </div>

            {/* Recent quiz results */}
            <div className="premium-card p-5 md:p-7">
              <h2 className="text-xl font-bold mb-4">
                {locale === "vi" ? "Kết quả gần đây" : "Recent results"}
              </h2>
              {attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "vi"
                    ? "Kết quả bài tập của bạn sẽ xuất hiện tại đây."
                    : "Your assignment results will appear here."}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {attempts.slice(0, 4).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {locale === "vi"
                            ? attempt.quiz.title
                            : attempt.quiz.titleEn || attempt.quiz.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleDateString(
                            locale === "vi" ? "vi-VN" : "en-US",
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-foreground">
                          {attempt.percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.score}/{attempt.totalQuestions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar Area */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="premium-card relative overflow-hidden p-5 md:p-7">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-xl font-bold">
                  {t("dashboard.recent.title")}
                </h2>
                <Link
                  href="/courses"
                  className="text-sm font-semibold text-blue-500 hover:underline"
                >
                  {t("dashboard.recent.view_all")}
                </Link>
              </div>
              <div className="space-y-4 relative z-10">
                {progress.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/courses/${item.lesson.courseId}/lessons/${item.lesson.id}`}
                    className="block p-4 rounded-2xl border border-border bg-background/50 hover:bg-muted/50 transition-all group hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <PlayCircle className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate group-hover:text-blue-600 transition-colors">
                          {locale === "vi"
                            ? item.lesson.title
                            : item.lesson.titleEn || item.lesson.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                          {locale === "vi"
                            ? item.lesson.course.title
                            : item.lesson.course.titleEn ||
                              item.lesson.course.title}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{
                                width: `${item.status === "COMPLETED" ? 100 : item.status === "IN_PROGRESS" ? 50 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">
                            {item.status === "COMPLETED"
                              ? "100%"
                              : item.status === "IN_PROGRESS"
                                ? locale === "vi"
                                  ? "Đang học"
                                  : "In progress"
                                : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
