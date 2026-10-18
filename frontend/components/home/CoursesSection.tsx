"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Box,
  Video,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  GraduationCap,
  Users,
} from "lucide-react";

type SubjectFilter = "all" | "math" | "science" | "physics" | "biology";
type GradeFilter = "all" | "6" | "7" | "8" | "9";

const coursesData = [
  {
    id: "c1",
    subject: "math" as const,
    subjectLabelVi: "Toán học",
    subjectLabelEn: "Mathematics",
    grade: "6" as const,
    gradeVi: "Lớp 6",
    gradeEn: "Grade 6",
    titleVi: "Phân số, Số thập phân & Tỉ số phần trăm",
    titleEn: "Fractions, Decimals & Percentages",
    descVi:
      "Nắm vững các phép tính phân số qua video tương tác và mô hình trực quan biểu diễn diện tích và trục số.",
    descEn:
      "Master fraction operations with interactive checkpoint videos and visual number line simulations.",
    authorVi: "Thầy Trần Đức Minh",
    authorEn: "Mr. Minh Tran",
    authorSchoolVi: "THCS Chu Văn An",
    authorSchoolEn: "Chu Van An School",
    authorInitials: "TM",
    lessons: 14,
    durationVi: "4.5 giờ",
    durationEn: "4.5 hrs",
    students: "1,420",
    rating: "4.9",
    has3D: true,
    hasVideo: true,
    badgeVi: "Mô hình 3D & Video",
    badgeEn: "3D & Video",
    imageGradient: "from-blue-600 via-indigo-600 to-sky-500",
  },
  {
    id: "c2",
    subject: "science" as const,
    subjectLabelVi: "Khoa học tự nhiên",
    subjectLabelEn: "Natural Science",
    grade: "7" as const,
    gradeVi: "Lớp 7",
    gradeEn: "Grade 7",
    titleVi: "Hệ Mặt Trời & Các Thiên Thể Không Gian",
    titleEn: "The Solar System & Space Objects",
    descVi:
      "Khám phá quỹ đạo 8 hành tinh, vệ tinh tự nhiên và hiện tượng nhật thực qua mô hình vũ trụ 3D xoay 360°.",
    descEn:
      "Explore 8 planetary orbits, natural satellites, and eclipses via interactive 360° 3D space models.",
    authorVi: "Cô Lê Hoàng Yến",
    authorEn: "Ms. Yen Le",
    authorSchoolVi: "THCS Trưng Vương",
    authorSchoolEn: "Trung Vuong School",
    authorInitials: "HY",
    lessons: 12,
    durationVi: "4 giờ",
    durationEn: "4 hrs",
    students: "2,150",
    rating: "5.0",
    has3D: true,
    hasVideo: true,
    badgeVi: "Vũ trụ 360°",
    badgeEn: "Space 360°",
    imageGradient: "from-purple-600 via-indigo-600 to-blue-600",
  },
  {
    id: "c3",
    subject: "math" as const,
    subjectLabelVi: "Toán học",
    subjectLabelEn: "Mathematics",
    grade: "8" as const,
    gradeVi: "Lớp 8",
    gradeEn: "Grade 8",
    titleVi: "Hình học Không gian & Định lý Pythagore",
    titleEn: "Spatial Geometry & Pythagorean Theorem",
    descVi:
      "Khám phá các khối đa diện, hình hộp, hình lăng trụ và chứng minh định lý Pythagore qua mô hình 3D động.",
    descEn:
      "Visualize 3D polyhedrons, prisms, and dynamic geometric proofs of the Pythagorean theorem.",
    authorVi: "Thầy Nguyễn Tiến Bình",
    authorEn: "Mr. Binh Nguyen",
    authorSchoolVi: "Đại học Bách Khoa ĐN",
    authorSchoolEn: "Danang Tech University",
    authorInitials: "TB",
    lessons: 16,
    durationVi: "5.5 giờ",
    durationEn: "5.5 hrs",
    students: "980",
    rating: "4.8",
    has3D: true,
    hasVideo: true,
    badgeVi: "Đa diện 3D",
    badgeEn: "3D Geometry",
    imageGradient: "from-emerald-600 via-teal-600 to-cyan-600",
  },
  {
    id: "c4",
    subject: "biology" as const,
    subjectLabelVi: "Sinh học",
    subjectLabelEn: "Biology",
    grade: "8" as const,
    gradeVi: "Lớp 8",
    gradeEn: "Grade 8",
    titleVi: "Cấu tạo Tế bào & Di truyền học ADN",
    titleEn: "Cell Structure & DNA Genetics",
    descVi:
      "Bóc tách tế bào nhân sơ, nhân thực và khám phá chuỗi xoắn kép ADN với thuật ngữ song ngữ chuẩn quốc tế.",
    descEn:
      "Dissect prokaryotic and eukaryotic cells, and examine double-helix DNA with Cambridge bilingual labels.",
    authorVi: "Cô Phạm Thu Trang",
    authorEn: "Ms. Trang Pham",
    authorSchoolVi: "THCS Lê Quý Đôn",
    authorSchoolEn: "Le Quy Don School",
    authorInitials: "TT",
    lessons: 10,
    durationVi: "3.5 giờ",
    durationEn: "3.5 hrs",
    students: "1,890",
    rating: "4.9",
    has3D: true,
    hasVideo: true,
    badgeVi: "Bóc tách ADN",
    badgeEn: "DNA Dissection",
    imageGradient: "from-cyan-600 via-blue-600 to-indigo-600",
  },
  {
    id: "c5",
    subject: "physics" as const,
    subjectLabelVi: "Vật lý",
    subjectLabelEn: "Physics",
    grade: "9" as const,
    gradeVi: "Lớp 9",
    gradeEn: "Grade 9",
    titleVi: "Hiện tượng Khúc xạ & Thấu kính Quang học",
    titleEn: "Refraction & Optical Lenses",
    descVi:
      "Quan sát đường truyền tia sáng qua thấu kính hội tụ, thấu kính phân kỳ và lăng kính trong phòng lab ảo.",
    descEn:
      "Trace light rays through convex, concave lenses and prisms in a live interactive virtual physics lab.",
    authorVi: "Thầy Đỗ Quang Huy",
    authorEn: "Mr. Huy Do",
    authorSchoolVi: "THPT Chuyên Lê Khiết",
    authorSchoolEn: "Le Khiet High School",
    authorInitials: "QH",
    lessons: 15,
    durationVi: "5 giờ",
    durationEn: "5 hrs",
    students: "1,120",
    rating: "4.9",
    has3D: true,
    hasVideo: true,
    badgeVi: "Lab Quang học",
    badgeEn: "Optics Lab",
    imageGradient: "from-amber-500 via-orange-600 to-red-600",
  },
  {
    id: "c6",
    subject: "science" as const,
    subjectLabelVi: "Khoa học tự nhiên",
    subjectLabelEn: "Natural Science",
    grade: "6" as const,
    gradeVi: "Lớp 6",
    gradeEn: "Grade 6",
    titleVi: "Cấu tạo Nguyên tử & Bảng tuần hoàn Hóa học",
    titleEn: "Atomic Structure & Periodic Table",
    descVi:
      "Tương tác với mô hình nguyên tử Bo, electron xoay quanh hạt nhân và khám phá 20 nguyên tố đầu tiên.",
    descEn:
      "Interact with Bohr atomic models, orbiting electron shells, and discover the first 20 elements.",
    authorVi: "Cô Mai Khánh Linh",
    authorEn: "Ms. Linh Mai",
    authorSchoolVi: "THCS Nguyễn Tri Phương",
    authorSchoolEn: "Nguyen Tri Phuong School",
    authorInitials: "KL",
    lessons: 11,
    durationVi: "3.5 giờ",
    durationEn: "3.5 hrs",
    students: "1,670",
    rating: "4.9",
    has3D: true,
    hasVideo: true,
    badgeVi: "Nguyên tử 3D",
    badgeEn: "Atom 3D",
    imageGradient: "from-rose-600 via-pink-600 to-purple-600",
  },
];

export default function CoursesSection() {
  const { locale } = useLang();
  const [selectedGrade, setSelectedGrade] = React.useState<GradeFilter>("all");
  const [selectedSubject, setSelectedSubject] = React.useState<SubjectFilter>("all");

  const filteredCourses = coursesData.filter((c) => {
    const matchGrade = selectedGrade === "all" || c.grade === selectedGrade;
    const matchSubject =
      selectedSubject === "all" ||
      c.subject === selectedSubject ||
      (selectedSubject === "science" && (c.subject === "biology" || c.subject === "physics"));
    return matchGrade && matchSubject;
  });

  return (
    <section className="py-20 md:py-28 bg-neutral-50/50 dark:bg-[#0b0f19] relative transition-colors border-t border-neutral-200/60 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* NoraClass Section Heading */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-center text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white">
            {locale === "vi" ? "Thư viện " : "Interactive "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              {locale === "vi" ? "học liệu tương tác" : "Resource Library"}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-slate-300 sm:text-lg">
            {locale === "vi"
              ? "Từ tâm huyết nghề dạy đến lớp học sống động, khám phá kho học liệu tương tác do cộng đồng thầy cô và sinh viên sư phạm đóng góp, mang cảm hứng sáng tạo vào từng tiết học."
              : "From pedagogical passion to active classrooms, explore an interactive K-9 STEM repository contributed by leading educators."}
          </p>

          {/* Dual CTAs (NoraClass Style) */}
          <div className="flex justify-center gap-3 sm:gap-4 mt-8 mb-10 flex-wrap">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>{locale === "vi" ? "Khám phá học liệu" : "Browse All Resources"}</span>
            </Link>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 font-medium px-5 py-3 text-sm transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{locale === "vi" ? "Tạo bài giảng ngay" : "Create Lesson Studio"}</span>
            </Link>
          </div>
        </div>

        {/* ── Dual-Tier NoraClass Filters Bar ── */}
        <div className="mb-10 flex flex-col gap-4">
          {/* Grade Selector Tabs */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              { id: "all", labelVi: "Tất cả các khối", labelEn: "All Grades" },
              { id: "6", labelVi: "Khối Lớp 6", labelEn: "Grade 6" },
              { id: "7", labelVi: "Khối Lớp 7", labelEn: "Grade 7" },
              { id: "8", labelVi: "Khối Lớp 8", labelEn: "Grade 8" },
              { id: "9", labelVi: "Khối Lớp 9", labelEn: "Grade 9" },
            ].map((tab) => {
              const isActive = selectedGrade === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedGrade(tab.id as GradeFilter)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-white dark:bg-slate-900 text-neutral-600 dark:text-slate-400 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {locale === "vi" ? tab.labelVi : tab.labelEn}
                </button>
              );
            })}
          </div>

          {/* Subject Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
            {[
              { id: "all", labelVi: "Tất cả môn", labelEn: "All Subjects" },
              { id: "math", labelVi: "Toán học", labelEn: "Mathematics" },
              { id: "science", labelVi: "Khoa học tự nhiên", labelEn: "Natural Science" },
              { id: "physics", labelVi: "Vật lý", labelEn: "Physics" },
              { id: "biology", labelVi: "Sinh học", labelEn: "Biology" },
            ].map((sub) => {
              const isActive = selectedSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id as SubjectFilter)}
                  className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                      : "bg-neutral-100 text-neutral-600 dark:bg-slate-800/80 dark:text-slate-400 hover:bg-neutral-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {locale === "vi" ? sub.labelVi : sub.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── NoraClass Course Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course) => {
              const title = locale === "vi" ? course.titleVi : course.titleEn;
              const desc = locale === "vi" ? course.descVi : course.descEn;
              const grade = locale === "vi" ? course.gradeVi : course.gradeEn;
              const subject = locale === "vi" ? course.subjectLabelVi : course.subjectLabelEn;
              const author = locale === "vi" ? course.authorVi : course.authorEn;
              const school = locale === "vi" ? course.authorSchoolVi : course.authorSchoolEn;
              const duration = locale === "vi" ? course.durationVi : course.durationEn;
              const badge = locale === "vi" ? course.badgeVi : course.badgeEn;

              return (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400/40 hover:-translate-y-1"
                >
                  {/* Top Thumbnail Preview */}
                  <div className={`relative aspect-[16/9] w-full bg-gradient-to-br ${course.imageGradient} p-4 flex flex-col justify-between overflow-hidden`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

                    {/* Badges on top */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-950/90 px-2.5 py-1 text-[11px] font-bold text-neutral-800 dark:text-white shadow-xs backdrop-blur-md">
                        <Box className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{badge}</span>
                      </span>
                      <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {grade}
                      </span>
                    </div>

                    {/* Center Icon Illustration */}
                    <div className="relative z-10 my-auto text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md group-hover:scale-110 transition-transform">
                        <Box className="w-6 h-6 animate-pulse" />
                      </div>
                    </div>

                    {/* Bottom Metadata inside Thumbnail */}
                    <div className="relative z-10 flex items-center justify-between text-xs text-white/90 font-medium">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-cyan-300" />
                        <span>{course.lessons} bài học</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-300" />
                        <span>{duration}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {subject}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {title}
                    </h3>

                    <p className="mt-2 text-xs text-neutral-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {desc}
                    </p>

                    {/* Teacher Author Card */}
                    <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                          {course.authorInitials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {author}
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-slate-400 truncate">
                            {school}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{course.rating}</span>
                      </div>
                    </div>

                    {/* Card CTA Action */}
                    <div className="mt-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course.students} {locale === "vi" ? "học sinh" : "learners"}</span>
                      </div>

                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 transition-all duration-200"
                      >
                        <span>{locale === "vi" ? "Vào học ngay" : "Start Learning"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* View All & Explore 3D Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-7 py-3.5 text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200"
          >
            <Box className="w-4 h-4 text-cyan-200" />
            <span>{locale === "vi" ? "Khám phá Kho học liệu số 3D/XR (YooBook)" : "Explore 3D/XR Library (YooBook)"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3.5 text-sm font-semibold text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>{locale === "vi" ? "Xem toàn bộ danh mục bài giảng" : "View All Interactive Courses"}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
