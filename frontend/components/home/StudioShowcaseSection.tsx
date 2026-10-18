"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Box,
  PenTool,
  Sliders,
  Sparkles,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  RotateCw,
  Eye,
  Layers,
  FlaskConical,
} from "lucide-react";

/**
 * Studio Showcase Section: Captures NoraClass's signature "All-in-One Interactive Canvas".
 * 3D Models + Digital Whiteboard + Virtual Simulations.
 */
export default function StudioShowcaseSection() {
  const { locale } = useLang();
  const [activeTab, setActiveTab] = React.useState<"3d" | "whiteboard" | "lab">("3d");
  const [sliderVal, setSliderVal] = React.useState(60);
  const [showLabels, setShowLabels] = React.useState(true);

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors border-t border-slate-100 dark:border-slate-850">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-950/50 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>
              {locale === "vi"
                ? "Không gian sáng tạo thế hệ mới"
                : "Next-Gen Interactive Canvas"}
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            {locale === "vi" ? (
              <>
                Tất cả công cụ trực quan trong{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  một màn hình duy nhất
                </span>
              </>
            ) : (
              <>
                All interactive tools in{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  a unified canvas
                </span>
              </>
            )}
          </h2>

          <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {locale === "vi"
              ? "Thay vì phải chuyển đổi giữa nhiều phần mềm rời rạc, SmartExplorer tích hợp trọn vẹn mô hình 3D, bảng trắng ghi chú và thí nghiệm ảo tương tác thời gian thực."
              : "Instead of jumping between separate apps, SmartExplorer unifies 3D models, digital annotations, and live physics simulations."}
          </p>

          {/* Interactive Feature Tabs (NoraClass Style) */}
          <div className="mt-8 inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {[
              {
                id: "3d",
                icon: Box,
                labelVi: "Mô hình 3D xoay 360°",
                labelEn: "3D Spatial Studio",
              },
              {
                id: "whiteboard",
                icon: PenTool,
                labelVi: "Bảng trắng tương tác",
                labelEn: "Digital Whiteboard",
              },
              {
                id: "lab",
                icon: FlaskConical,
                labelVi: "Phòng thí nghiệm ảo",
                labelEn: "Virtual Simulation Lab",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "3d" | "whiteboard" | "lab")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{locale === "vi" ? tab.labelVi : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Canvas Showcase Display */}
        <div className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeTab === "3d"
                  ? "SmartExplorer — 3D Dissection Viewport"
                  : activeTab === "whiteboard"
                  ? "SmartExplorer — Interactive Whiteboard Canvas"
                  : "SmartExplorer — Physical Simulation Lab"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  showLabels
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:border-blue-800"
                    : "bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{locale === "vi" ? "Nhãn chú thích" : "Labels"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Screen Content */}
          <div className="p-6 sm:p-8 bg-slate-50/40 dark:bg-slate-900/40 min-h-[420px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {/* TAB 1: 3D SPATIAL STUDIO */}
              {activeTab === "3d" && (
                <motion.div
                  key="showcase-3d"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-7 relative h-72 sm:h-96 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 overflow-hidden flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />

                    <motion.div
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="relative flex items-center justify-center"
                    >
                      <Image
                        src="/hero-illustration.png"
                        alt="3D Interactive Lesson Model"
                        width={240}
                        height={240}
                        className="object-contain drop-shadow-[0_20px_40px_rgba(56,189,248,0.5)]"
                      />
                    </motion.div>

                    {showLabels && (
                      <>
                        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>Mô hình Sinh học 3D K-8</span>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg">
                          🔬 Thuật ngữ: Double Helix Backbone
                        </div>
                        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                          ⚡ Tương tác 360° Real-time
                        </div>
                      </>
                    )}
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/70 self-start">
                      3D Spatial Studio
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {locale === "vi"
                        ? "Bóc tách đa chiều từng lớp cấu trúc"
                        : "Multi-layer 3D Spatial Dissection"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {locale === "vi"
                        ? "Học sinh không chỉ nhìn hình phẳng 2D trong sách giáo khoa, mà có thể xoay tự do, bóc tách từng lớp cơ quan, phóng to tế bào và nghe cách phát âm tiếng Anh chuẩn."
                        : "Students go beyond flat 2D textbook drawings by freely rotating 3D models, peeling back anatomical layers, and hearing genuine STEM English pronunciation."}
                    </p>
                    <div className="space-y-2 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Hơn 120+ mô hình Toán học & Khoa học có sẵn</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Tương thích mượt mà trên máy tính bảng và màn hình tương tác</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/three-d"
                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      >
                        <span>{locale === "vi" ? "Vào thư viện 3D" : "Open 3D Library"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: INTERACTIVE WHITEBOARD */}
              {activeTab === "whiteboard" && (
                <motion.div
                  key="showcase-whiteboard"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-7 relative h-72 sm:h-96 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Bảng tương tác bài giảng: Phân số & Diện tích hình chữ nhật
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-bold">
                        ● Giáo viên đang phát trực tiếp
                      </span>
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center gap-4 my-2">
                      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 text-center max-w-sm">
                        <div className="font-mono text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">
                          S = dài × rộng = (3/4) × (2/5)
                        </div>
                        <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          = (3 × 2) / (4 × 5) = 6/20 = <strong className="text-blue-600">3/10 (m²)</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-24 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          3/4 m
                        </div>
                        <span className="text-slate-400 font-bold">×</span>
                        <div className="h-14 w-14 rounded-lg bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          2/5 m
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Bút vẽ, thước kẻ, tẩy và chèn công thức Toán học</span>
                      <span className="font-bold text-blue-600">Phấn điện tử đa màu</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200/70 self-start">
                      Digital Whiteboard
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {locale === "vi"
                        ? "Bảng trắng số hóa tương tác"
                        : "Interactive Digital Whiteboard"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {locale === "vi"
                        ? "Giáo viên và học sinh có thể vẽ hình, viết công thức Toán học, ghim các câu hỏi đố tương tác và lưu lại toàn bộ diễn biến tiết học chỉ bằng một nút bấm."
                        : "Draw geometric figures, write formulas, pin live interactive quiz cards, and export full session summaries effortlessly."}
                    </p>
                    <div className="space-y-2 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Hỗ trợ bút vẽ cảm ứng và bảng vẽ Wacom</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Ghim mô hình 3D trực tiếp lên trang bài giảng</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: VIRTUAL SIMULATION LAB */}
              {activeTab === "lab" && (
                <motion.div
                  key="showcase-lab"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-7 relative h-72 sm:h-96 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between text-white overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                      <span className="font-bold text-white flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-cyan-400" />
                        Mô phỏng Con lắc Đơn & Gia tốc Trọng trường (Physics K-9)
                      </span>
                      <span className="text-cyan-400 font-bold">Thực hành ảo</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center my-4">
                      {/* Interactive pendulum simulation */}
                      <motion.div
                        animate={{ rotate: [-sliderVal / 2, sliderVal / 2, -sliderVal / 2] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="origin-top flex flex-col items-center"
                      >
                        <div className="w-0.5 h-32 bg-slate-400" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.8)] border border-cyan-200" />
                      </motion.div>
                    </div>

                    {/* Interactive Slider */}
                    <div className="border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-400">Góc lệch ban đầu: {sliderVal}°</span>
                        <span className="font-bold text-cyan-400">Chu kỳ T ≈ 1.8s</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="85"
                        value={sliderVal}
                        onChange={(e) => setSliderVal(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-200/70 self-start">
                      Virtual Lab
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {locale === "vi"
                        ? "Thí nghiệm mô phỏng an toàn & trực quan"
                        : "Safe & Interactive Virtual Simulations"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {locale === "vi"
                        ? "Học sinh có thể tùy chỉnh các biến số vật lý (trọng lực, nhiệt độ, khối lượng, góc nghiêng) và quan sát phản ứng xảy ra ngay lập tức mà không sợ nguy hiểm hay thiếu dụng cụ."
                        : "Students manipulate physical variables (gravity, temperature, mass, friction) to observe immediate dynamic responses safely."}
                    </p>
                    <div className="space-y-2 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>Mô phỏng quang học, điện học và phản ứng hóa học</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>Chấm điểm thao tác thí nghiệm tự động</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
