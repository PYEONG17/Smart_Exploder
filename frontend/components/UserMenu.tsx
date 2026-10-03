"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  GraduationCap,
  School,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

// ─── Avatar helpers ───────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleConfig(role: AuthUser["role"]) {
  switch (role) {
    case "TEACHER":
      return {
        label: "Giáo viên",
        labelEn: "Teacher",
        icon: School,
        gradient: "from-purple-500 to-violet-600",
        badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
      };
    case "ADMIN":
      return {
        label: "Quản trị viên",
        labelEn: "Admin",
        icon: ShieldCheck,
        gradient: "from-rose-500 to-orange-500",
        badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      };
    default:
      return {
        label: "Học sinh",
        labelEn: "Student",
        icon: GraduationCap,
        gradient: "from-blue-500 to-cyan-500",
        badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      };
  }
}

// ─── Avatar display component ─────────────────────────────────────────────────

function UserAvatar({
  user,
  size = "sm",
}: {
  user: AuthUser;
  size?: "sm" | "md";
}) {
  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.name);
  const dimension = size === "sm" ? 32 : 40;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const rounded = "rounded-xl";

  if (user.avatar) {
    return (
      <div
        className={`relative overflow-hidden shrink-0 ${rounded} shadow-sm`}
        style={{ width: dimension, height: dimension }}
      >
        <Image
          src={user.avatar}
          alt={user.name}
          fill
          sizes={`${dimension}px`}
          className="object-cover"
          unoptimized // allow external URLs (DiceBear SVGs)
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${roleConfig.gradient} ${rounded} flex items-center justify-center text-white font-black shadow-sm shrink-0 ${textSize}`}
      style={{ width: dimension, height: dimension }}
    >
      {initials}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { locale } = useLang();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success(
      locale === "vi" ? "Đã đăng xuất thành công!" : "Logged out successfully!",
    );
    router.push("/");
  };

  const menuItems = [
    ...(user.role === "STUDENT"
      ? [
          {
            label: locale === "vi" ? "Bài tập của tôi" : "My Assignments",
            icon: LayoutDashboard,
            href: "/assignments",
          },
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
          },
        ]
      : []),
    {
      label: locale === "vi" ? "Hồ sơ cá nhân" : "My Profile",
      icon: User,
      href: "/profile",
    },
    ...(user.role === "TEACHER" || user.role === "ADMIN"
      ? [
          {
            label: locale === "vi" ? "Studio Giáo viên" : "Teacher Studio",
            icon: Settings,
            href: "/teacher",
          },
        ]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 rounded-2xl pl-1 pr-3 py-1 border border-border bg-muted/40 hover:bg-muted transition-all duration-200 cursor-pointer select-none"
        aria-label="User menu"
        aria-expanded={open}
      >
        {/* Avatar – real image or initials fallback */}
        <UserAvatar user={user} size="sm" />

        {/* Name + role – hidden on small screens */}
        <div className="hidden lg:block text-left">
          <div className="text-xs font-bold text-foreground leading-none mb-0.5 max-w-[100px] truncate">
            {user.name.split(" ").pop()}
          </div>
          <div
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleConfig.badge}`}
          >
            {locale === "vi" ? roleConfig.label : roleConfig.labelEn}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-60 z-50 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                {/* Avatar in dropdown header – larger */}
                <UserAvatar user={user} size="md" />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleConfig.badge}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {locale === "vi" ? roleConfig.label : roleConfig.labelEn}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5 px-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 group"
                  >
                    <Icon className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Divider + Logout */}
            <div className="border-t border-border px-1.5 py-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150 group cursor-pointer"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {locale === "vi" ? "Đăng xuất" : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
