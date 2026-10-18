"use client";
import * as React from "react";
import { useLang } from "@/contexts/LanguageContext";
import { motion } from "motion/react";
import { Star, Quote, Award, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * Testimonials & Trust Section: NoraClass Social Proof.
 */
export default function TestimonialsSection() {
  const { locale } = useLang();

  const testimonials = [
    {
      id: 1,
      quoteVi:
        "Nhờ mô hình 3D trên SmartExplorer, học sinh lớp 8 của tôi dễ dàng hình dung cấu trúc ADN và các khối hình học không gian. Tiết học sôi nổi hơn hẳn so với cách chiếu slide trước đây!",
      quoteEn:
        "With 3D models on SmartExplorer, my 8th graders can easily grasp DNA structures and spatial geometry. Classroom engagement is significantly higher than traditional slides!",
      authorVi: "Cô Nguyễn Thu Hà",
      authorEn: "Ms. Thu Ha Nguyen",
      roleVi: "Giáo viên Khoa học Tự nhiên · Trường THCS Trưng Vương",
      roleEn: "Science Teacher · Trung Vuong Secondary School",
      rating: 5,
      avatarBg: "from-blue-500 to-indigo-600",
      initials: "TH",
    },
    {
      id: 2,
      quoteVi:
        "Em thích nhất là video ngắt đố và trợ lý Nora AI. Mỗi lần xem video đến đoạn quan trọng là có câu hỏi dừng lại, làm sai thì AI giải thích cặn kẽ từng bước bằng cả tiếng Anh và tiếng Việt.",
      quoteEn:
        "I love the checkpoint videos and Nora AI. Whenever a key moment appears, an interactive question pauses the video, and the AI patiently walks me through mistakes in both languages.",
      authorVi: "Lê Minh Quân",
      authorEn: "Minh Quan Le",
      roleVi: "Học sinh Lớp 7 · Đạt giải Nhì HSG Khoa học cấp Quận",
      roleEn: "Grade 7 Student · District Science Award Winner",
      rating: 5,
      avatarBg: "from-purple-500 to-pink-600",
      initials: "MQ",
    },
    {
      id: 3,
      quoteVi:
        "Con tôi trước đây rất ngại học Toán bằng tiếng Anh vì sợ thuật ngữ khó. Nhưng từ khi dùng SmartExplorer, con tự giác học mỗi ngày để tích lũy XP và xem mô hình 3D.",
      quoteEn:
        "My child used to hesitate learning STEM in English due to difficult terminology. Since using SmartExplorer, he studies enthusiastically every day to earn XP and explore 3D models.",
      authorVi: "Chị Trần Thanh Mai",
      authorEn: "Ms. Thanh Mai Tran",
      roleVi: "Phụ huynh học sinh Lớp 6 · Hà Nội",
      roleEn: "Parent of Grade 6 Student · Hanoi",
      rating: 5,
      avatarBg: "from-emerald-500 to-teal-600",
      initials: "TM",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#090d16] relative transition-colors">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block rounded-full bg-blue-50 dark:bg-blue-950/60 px-4 py-1.5 mx-auto mb-4 border border-blue-200/70 dark:border-blue-800/60">
            <span className="font-semibold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              {locale === "vi" ? "Cảm nhận từ người học & giáo viên" : "Trusted by Students & Educators"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {locale === "vi" ? (
              <>
                Được tin cậy bởi nhiều giáo viên và{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  các trường học
                </span>
              </>
            ) : (
              <>
                Trusted by thousands of educators and{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  leading schools
                </span>
              </>
            )}
          </h2>

          <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {locale === "vi"
              ? "Sự hài lòng và tiến bộ của học sinh là thước đo giá trị lớn nhất của nền tảng SmartExplorer."
              : "Student joy and teacher empowerment are the true benchmarks of the SmartExplorer platform."}
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {testimonials.map((item, index) => {
            const quote = locale === "vi" ? item.quoteVi : item.quoteEn;
            const author = locale === "vi" ? item.authorVi : item.authorEn;
            const role = locale === "vi" ? item.roleVi : item.roleEn;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:border-blue-400/40 transition-all duration-300"
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal italic">
                    "{quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${item.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {author}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                      {role}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
