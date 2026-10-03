"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/themeToggle";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Menu, X, Globe } from "lucide-react";
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
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";
import type { TranslationKey } from "@/lib/i18n";

type NavItem = {
  labelKey: TranslationKey;
  href: string;
  roles?: AuthUser["role"][];
};
const navItems: NavItem[] = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.courses", href: "/courses" },
  { labelKey: "nav.classes", href: "/classes" },
  { labelKey: "nav.assignments", href: "/assignments", roles: ["STUDENT"] },
  { labelKey: "nav.dashboard", href: "/dashboard", roles: ["STUDENT"] },
  { labelKey: "nav.ai", href: "/ai" },
  { labelKey: "nav.3d", href: "/three-d" },
  {
    labelKey: "nav.teacher",
    href: "/teacher",
    roles: ["TEACHER", "ADMIN"],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
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

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (!!user && item.roles.includes(user.role)),
  );

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-sm py-2" : "bg-transparent py-4"}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <motion.div whileHover={{ rotate: 10 }} whileTap={{ scale: 0.9 }}>
            <Image
              src="/logo.png"
              width={36}
              height={36}
              alt="SmartExplorer Logo"
              className="rounded-xl shadow-lg"
            />
          </motion.div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Smart
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Explorer
            </span>
          </span>
        </Link>

        {/* Desktop navigation links */}
        <div className="hidden xl:flex items-center gap-1">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm font-semibold transition-all duration-300 group"
              >
                <span
                  className={`relative z-10 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {t(item.labelKey)}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-400/10"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side: Lang + Auth + Theme + Mobile */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <motion.button
            onClick={toggleLocale}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden lg:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground transition-all cursor-pointer select-none"
            title={
              locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"
            }
            aria-label={
              locale === "vi"
                ? "Switch language to English"
                : "Đổi ngôn ngữ sang Tiếng Việt"
            }
          >
            <Globe className="w-3.5 h-3.5" />
            <span
              className={
                locale === "vi" ? "text-blue-500" : "text-muted-foreground"
              }
            >
              VI
            </span>
            <span className="opacity-40">/</span>
            <span
              className={
                locale === "en" ? "text-blue-500" : "text-muted-foreground"
              }
            >
              EN
            </span>
          </motion.button>

          {/* Auth section – skeleton placeholder while loading */}
          {isLoading ? (
            <div className="w-24 h-8 rounded-xl bg-muted/50 animate-pulse hidden sm:block" />
          ) : isAuthenticated ? (
            /* ── Logged in: show UserMenu ── */
            <UserMenu />
          ) : (
            /* ── Guest: show Login + Register buttons ── */
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-blue-500/25 transition-all duration-200"
              >
                {t("nav.register")}
              </Link>
            </>
          )}

          <ThemeToggle />

          {/* Mobile hamburger menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
              {/* Mobile menu header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
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
                  <span className="text-lg font-bold text-foreground">
                    Smart<span className="text-blue-500">Explorer</span>
                  </span>
                </Link>
                <SheetClose>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>

              {/* Mobile nav links */}
              <div className="flex flex-col gap-1 px-3 py-4">
                {visibleNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>

              <Separator />

              {/* Mobile: Language toggle */}
              <div className="px-3 py-3">
                <button
                  onClick={toggleLocale}
                  aria-label={
                    locale === "vi"
                      ? "Switch language to English"
                      : "Đổi ngôn ngữ sang Tiếng Việt"
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold border border-border bg-muted/40 hover:bg-muted transition-all"
                >
                  <Globe className="w-4 h-4" />
                  {locale === "vi"
                    ? "Switch to English 🇬🇧"
                    : "Chuyển Tiếng Việt 🇻🇳"}
                </button>
              </div>

              <Separator />

              {/* Mobile auth section */}
              <div className="flex flex-col gap-2 px-3 py-4">
                {isAuthenticated ? (
                  /* ── Logged-in mobile: profile + logout ── */
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                      {locale === "vi" ? "Hồ sơ cá nhân" : "My Profile"}
                    </Link>
                    <Link
                      href={
                        user?.role === "STUDENT" ? "/dashboard" : "/teacher"
                      }
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-semibold text-center bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                    >
                      {user?.role === "STUDENT"
                        ? "Dashboard"
                        : locale === "vi"
                          ? "Giáo viên Studio"
                          : "Teacher Studio"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-center text-rose-500 hover:bg-rose-500/10 transition-all duration-200"
                    >
                      {locale === "vi" ? "Đăng xuất" : "Sign out"}
                    </button>
                  </>
                ) : (
                  /* ── Guest mobile: login + register ── */
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-sm hover:bg-blue-700 transition-all duration-200"
                    >
                      {t("nav.register")}
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
