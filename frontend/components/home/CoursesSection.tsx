"use client";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { motion } from "motion/react";

/**
 * Courses Preview Section: Showcases featured courses on the homepage.
 */
const featuredCourses = [
  {
    id: 1,
    subjectKey: "courses_section.math" as const,
    levelVi: "Lớp 6",
    levelEn: "Grade 6",
    titleVi: "Phân số và số thập phân",
    titleEn: "Fractions & Decimals",
    descVi: "Nắm vững khái niệm phân số, số thập phân và các phép tính cơ bản qua video tương tác và bài tập thực hành.",
    descEn: "Master fractions, decimals and basic operations through interactive videos and hands-on exercises.",
    lessons: 12,
    durationVi: "4 giờ",
    durationEn: "4 hrs",
    color: "from-blue-500 to-blue-700",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.759 1.5 5.771 1.5 9s-.533 6.241-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09" />
      </svg>
    ),
  },
  {
    id: 2,
    subjectKey: "courses_section.science" as const,
    levelVi: "Lớp 7",
    levelEn: "Grade 7",
    titleVi: "Hệ thống thái dương",
    titleEn: "The Solar System",
    descVi: "Khám phá 8 hành tinh, mặt trăng và các vật thể trong không gian qua mô hình 3D tương tác và bản đồ sao.",
    descEn: "Explore 8 planets, moons, and space objects through interactive 3D models and star maps.",
    lessons: 10,
    durationVi: "3.5 giờ",
    durationEn: "3.5 hrs",
    color: "from-purple-500 to-indigo-700",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    id: 3,
    subjectKey: "courses_section.math" as const,
    levelVi: "Lớp 8",
    levelEn: "Grade 8",
    titleVi: "Hình học phẳng",
    titleEn: "Plane Geometry",
    descVi: "Học về tam giác, tứ giác, đường tròn và các định lý hình học qua mô hình động và chứng minh tương tác.",
    descEn: "Learn triangles, quadrilaterals, circles and theorems through dynamic models and interactive proofs.",
    lessons: 15,
    durationVi: "5 giờ",
    durationEn: "5 hrs",
    color: "from-emerald-500 to-teal-700",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
      </svg>
    ),
  },
];

// These subjects don't need keys – shown as labels only
const subjectLabels: Record<string, { vi: string; en: string }> = {
  "courses_section.math": { vi: "Toán học", en: "Mathematics" },
  "courses_section.science": { vi: "Khoa học", en: "Science" },
};

export default function CoursesSection() {
  const { t, locale } = useLang();

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div 
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 mb-6 backdrop-blur-md">
              {t("courses_section.badge")}
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              {t("courses_section.title1")}{" "}
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
                {t("courses_section.title2")}
              </span>
            </h2>
          </div>
          <Link
            href="/courses"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-muted/50 px-5 py-3 text-sm font-bold text-foreground hover:bg-muted transition-all"
          >
            {t("courses_section.view_all")}
            <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>

        {/* Course cards */}
        <motion.div 
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
            hidden: {}
          }}
        >
          {featuredCourses.map((course) => (
            <motion.div
              key={course.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              }}
            >
              <Link
                href={`/courses/${course.id}`}
                className="group flex flex-col h-full overflow-hidden rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] transition-all duration-500 hover:-translate-y-2"
              >
                {/* Card header with gradient */}
                <div className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${course.color} p-6 overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white,transparent)] mix-blend-overlay" />
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                  <motion.div 
                    className="relative z-10 flex flex-col items-center gap-3"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      {course.icon}
                    </div>
                  </motion.div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-4 p-8 relative">
                  {/* Subtle hover glow inside card */}
                  <div className={`absolute -top-10 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${course.color} blur-[50px] opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  {/* Badges */}
                  <div className="flex items-center gap-2 relative z-10">
                    <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wider font-bold ${course.badge}`}>
                      {locale === "vi" ? subjectLabels[course.subjectKey].vi : subjectLabels[course.subjectKey].en}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                      {locale === "vi" ? course.levelVi : course.levelEn}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="relative z-10 mt-2">
                    <h3 className="text-xl font-extrabold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {locale === "vi" ? course.titleVi : course.titleEn}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground/70 mt-1 uppercase tracking-wide">
                      {locale === "vi" ? course.titleEn : course.titleVi}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 font-medium relative z-10">
                    {locale === "vi" ? course.descVi : course.descEn}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-6 border-t border-border/50 pt-5 mt-2 text-sm font-bold text-muted-foreground relative z-10">
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                      {course.lessons} {t("courses_section.lessons")}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {locale === "vi" ? course.durationVi : course.durationEn}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
