"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/themeToggle";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  Box,
  PenTool,
  BookOpen,
  Bot,
  FlaskConical,
  Sparkles,
  ArrowRight,
  GraduationCap,
  LayoutDashboard,
  Trophy,
  Cpu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { locale, toggleLocale, t } = useLang();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success(
      locale === "vi" ? "Đã đăng xuất thành công!" : "Logged out successfully!",
    );
    router.push("/");
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    window.localStorage.removeItem("smart_explorer_user_flipbooks");
  }, []);

  const productsList = [
    {
      icon: Box,
      titleVi: "Kho học liệu số 3D/XR",
      titleEn: "3D/XR Learning Repository",
      descVi: "Kho học liệu số 3D/XR chuẩn GDPT 2018, thí nghiệm ảo & Sandbox",
      descEn: "Explore K-9 spatial 3D interactive models & Virtual Labs",
      href: "/explore",
      badgeVi: "Bóc tách 360°",
      badgeEn: "360° Dissect",
      accent: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60",
    },
    {
      icon: PenTool,
      titleVi: "Bảng trắng tương tác",
      titleEn: "Interactive Whiteboard",
      descVi: "Ghi chú, vẽ hình học và giải bài tập trên bảng số",
      descEn: "Digital canvas for live notes and geometry",
      href: "/whiteboard",
      badgeVi: "Canvas số",
      badgeEn: "Digital Canvas",
      accent: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60",
    },
    {
      icon: Bot,
      titleVi: "Trợ lý Nora AI",
      titleEn: "Nora AI STEM Tutor",
      descVi: "Gia sư AI 24/7 giải thích từng bước Toán & Khoa học",
      descEn: "24/7 bilingual STEM tutor and step-by-step solver",
      href: "/ai",
      badgeVi: "AI 24/7",
      badgeEn: "AI 24/7",
      accent: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-800/60",
    },
    {
      icon: FlaskConical,
      titleVi: "Thí nghiệm mô phỏng",
      titleEn: "Virtual Simulation Lab",
      descVi: "Thí nghiệm ảo Vật lý, Hóa học, Sinh học an toàn và trực quan",
      descEn: "Safe virtual physics, chemistry & biology simulations",
      href: "/lab",
      badgeVi: "Phòng Lab ảo",
      badgeEn: "Virtual Lab",
      accent: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60",
    },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] py-2.5"
          : "bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-neutral-200/60 dark:border-slate-800/60 py-3.5"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo (NoraClass Style) */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <motion.div whileHover={{ rotate: 8, scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Image
                src="/logo.png"
                width={36}
                height={36}
                alt="SmartExplorer Logo"
                className="rounded-xl shadow-xs border border-neutral-200 dark:border-slate-800"
              />
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Smart<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">Explorer</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                K-9 STEM
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items (NoraClass Authentic Header Style) */}
          <nav className="hidden xl:flex items-center gap-1">
            {/* "Sản phẩm" Megamenu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProductsOpen((prev) => !prev)}
                onMouseEnter={() => setProductsOpen(true)}
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm py-2 px-3.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap cursor-pointer ${
                  productsOpen
                    ? "bg-neutral-100 text-neutral-900 dark:bg-slate-800 dark:text-white"
                    : "text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{locale === "vi" ? "Sản phẩm" : "Products"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    productsOpen ? "rotate-180 text-blue-600" : "text-neutral-400"
                  }`}
                />
              </button>

              {/* Products Popover / Megamenu */}
              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onMouseLeave={() => setProductsOpen(false)}
                    className="absolute top-full left-0 mt-2 w-[600px] rounded-3xl border border-neutral-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-2xl z-50"
                  >
                    <div className="mb-2 px-3 pt-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-slate-500">
                        {locale === "vi" ? "Hệ sinh thái học tập tương tác" : "Interactive Learning Suite"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        <Sparkles className="w-3 h-3" />
                        {locale === "vi" ? "Chuẩn GDPT 2018" : "K-9 Standard"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {productsList.map((prod, idx) => {
                        const Icon = prod.icon;
                        const title = locale === "vi" ? prod.titleVi : prod.titleEn;
                        const desc = locale === "vi" ? prod.descVi : prod.descEn;
                        return (
                          <Link
                            key={idx}
                            href={prod.href}
                            onClick={() => setProductsOpen(false)}
                            className="group flex items-start gap-3 rounded-2xl p-3 transition-all hover:bg-neutral-50 dark:hover:bg-slate-800/80 border border-transparent hover:border-neutral-200/70 dark:hover:border-slate-700/60"
                          >
                            <div
                              className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${prod.accent}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                  {title}
                                </h4>
                              </div>
                              <p className="mt-1 text-[11px] text-neutral-500 dark:text-slate-400 leading-snug line-clamp-2">
                                {desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-3 border-t border-neutral-100 dark:border-slate-800 pt-3 px-3 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 dark:text-slate-400">
                        {locale === "vi" ? "Trải nghiệm đầy đủ công cụ trực quan" : "Experience full interactive canvas"}
                      </span>
                      <Link
                        href="/explore"
                        onClick={() => setProductsOpen(false)}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>{locale === "vi" ? "Mở Kho Học Liệu Số 3D/XR" : "Open 3D/XR Library"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Kho học liệu số 3D/XR (YooBook style) */}
            <Link
              href="/explore"
              className={`text-xs sm:text-sm py-2 px-3.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap flex items-center gap-1.5 ${
                pathname.startsWith("/explore")
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <span>{locale === "vi" ? "Kho học liệu 3D/XR" : "3D/XR Library"}</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  pathname.startsWith("/explore")
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                }`}
              >
                XR
              </span>
            </Link>

            {/* Main Links */}
            <Link
              href="/courses"
              className={`text-xs sm:text-sm py-2 px-3.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap ${
                pathname.startsWith("/courses")
                  ? "bg-neutral-100 text-neutral-900 dark:bg-slate-800 dark:text-white font-bold"
                  : "text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800/60"
              }`}
            >
              {locale === "vi" ? "Kho học liệu" : "Courses Library"}
            </Link>

            <Link
              href="/quiz"
              className={`text-xs sm:text-sm py-2 px-3.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap ${
                pathname.startsWith("/quiz")
                  ? "bg-neutral-100 text-neutral-900 dark:bg-slate-800 dark:text-white font-bold"
                  : "text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800/60"
              }`}
            >
              {locale === "vi" ? "Thẻ" : "Quiz Flash Card"}
            </Link>

            {/* Role  */}
            {user?.role === "STUDENT" && (
              <Link
                href="/dashboard"
                className={`text-xs sm:text-sm py-2 px-3.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap ${
                  pathname.startsWith("/dashboard")
                    ? "bg-neutral-100 text-neutral-900 dark:bg-slate-800 dark:text-white font-bold"
                    : "text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800/60"
                }`}
              >
                Dashboard
              </Link>
            )}

            {user?.role === "TEACHER" && (
              <Link
                href="/teacher"
                className={`text-xs sm:text-sm py-2 px-3.5 rounded-full transition-all duration-200 font-medium whitespace-nowrap ${
                  pathname.startsWith("/teacher")
                    ? "bg-neutral-100 text-neutral-900 dark:bg-slate-800 dark:text-white font-bold"
                    : "text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800/60"
                }`}
              >
                {locale === "vi" ? "Dành cho Thầy Cô" : "Teacher Studio"}
              </Link>
            )}
          </nav>
        </div>

        {/* Right side: Lang + Auth + Theme + Mobile */}
        <div className="flex items-center gap-2 sm:gap-3 text-neutral-700 dark:text-slate-200">
          {/*chuyen doi ngon ngu */}
          <motion.button
            onClick={toggleLocale}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-neutral-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-700 dark:text-slate-300 transition-all cursor-pointer select-none"
            title={locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            aria-label={locale === "vi" ? "Switch language to English" : "Đổi ngôn ngữ sang Tiếng Việt"}
          >
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            <span className={locale === "vi" ? "text-blue-600 font-bold dark:text-blue-400" : "text-neutral-400"}>
              VI
            </span>
            <span className="text-neutral-300 dark:text-slate-600">/</span>
            <span className={locale === "en" ? "text-blue-600 font-bold dark:text-blue-400" : "text-neutral-400"}>
              EN
            </span>
          </motion.button>

          {/* Auth section */}
          {isLoading ? (
            <div className="w-24 h-9 rounded-xl bg-neutral-200/60 dark:bg-slate-800/60 animate-pulse hidden sm:block" />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {locale === "vi" ? "Đăng ký miễn phí" : "Get Started Free"}
              </Link>
            </div>
          )}

          <ThemeToggle />

          {/* Mobile hamburger menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden rounded-xl"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-5 w-5 text-neutral-700 dark:text-slate-300" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 overflow-y-auto">
              <SheetTitle className="sr-only">Menu điều hướng SmartExplorer</SheetTitle>
              {/* Mobile menu header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-slate-800">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  <Image
                    src="/logo.png"
                    width={28}
                    height={28}
                    alt="SmartExplorer"
                    className="rounded-lg"
                  />
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    Smart<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Explorer</span>
                  </span>
                </Link>
                <SheetClose>
                  <Button variant="ghost" size="icon" className="rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>

              {/* Mobile nav links */}
              <div className="flex flex-col gap-1 px-3 py-4">
                {/* Mobile Products Collapsible */}
                <div>
                  <button
                    onClick={() => setMobileProductsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-800 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-blue-600" />
                      <span>{locale === "vi" ? "Sản phẩm & Công cụ" : "Products & Tools"}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        mobileProductsOpen ? "rotate-180 text-blue-600" : "text-neutral-400"
                      }`}
                    />
                  </button>

                  {mobileProductsOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l-2 border-blue-500/20 space-y-1">
                      {productsList.map((prod, idx) => {
                        const Icon = prod.icon;
                        const title = locale === "vi" ? prod.titleVi : prod.titleEn;
                        return (
                          <Link
                            key={idx}
                            href={prod.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50"
                          >
                            <Icon className="w-4 h-4 shrink-0 text-blue-600" />
                            <span>{title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link
                  href="/explore"
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                    pathname.startsWith("/explore")
                      ? "bg-blue-600 text-white font-bold"
                      : "text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-500" />
                    <span>{locale === "vi" ? "Kho học liệu số 3D/XR" : "3D/XR Library"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                    XR
                  </span>
                </Link>

                <Link
                  href="/whiteboard"
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                    pathname.startsWith("/whiteboard")
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-indigo-500" />
                    <span>{locale === "vi" ? "Bảng trắng tương tác" : "Whiteboard"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                    Canvas
                  </span>
                </Link>

                <Link
                  href="/courses"
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                    pathname.startsWith("/courses")
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                      : "text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>{locale === "vi" ? "Kho học liệu tương tác" : "Courses Library"}</span>
                </Link>

                <Link
                  href="/quiz"
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                    pathname.startsWith("/quiz")
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                      : "text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{locale === "vi" ? "Đấu trường Quiz" : "Quiz Arena"}</span>
                </Link>

                {user?.role === "STUDENT" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-500" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {user?.role === "TEACHER" && (
                  <Link
                    href="/teacher"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-rose-500" />
                    <span>{locale === "vi" ? "Dành cho Thầy Cô" : "Teacher Studio"}</span>
                  </Link>
                )}
              </div>

              <Separator />

              {/* Mobile: Language toggle */}
              <div className="px-4 py-3">
                <button
                  onClick={toggleLocale}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-all"
                >
                  <Globe className="w-4 h-4 text-neutral-500" />
                  <span>
                    {locale === "vi" ? "Chuyển sang English 🇬🇧" : "Chuyển sang Tiếng Việt 🇻🇳"}
                  </span>
                </button>
              </div>

              <Separator />

              {/* Mobile auth */}
              <div className="flex flex-col gap-2 px-4 py-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-center text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
                    >
                      {locale === "vi" ? "Hồ sơ cá nhân" : "My Profile"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      {locale === "vi" ? "Đăng xuất" : "Sign out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-center text-neutral-700 dark:text-slate-200 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white text-center shadow-md hover:bg-blue-700"
                    >
                      {locale === "vi" ? "Đăng ký miễn phí" : "Get Started Free"}
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
