"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

const protectedRoutes = [
  "/ai",
  "/assignments",
  "/courses",
  "/dashboard",
  "/explore",
  "/lab",
  "/profile",
  "/quiz",
  "/teacher",
  "/three-d",
  "/whiteboard",
];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function LearningAccessGuard({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { locale } = useLang();
  const isProtected = isProtectedRoute(pathname);
  const loginHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(pathname)}`,
    [pathname],
  );

  useEffect(() => {
    if (!isLoading && isProtected && !isAuthenticated) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
    }
  }, [isAuthenticated, isLoading, isProtected, router]);

  if (!isProtected || (isAuthenticated && !isLoading)) {
    return children;
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 text-sm text-muted-foreground"
        role="status"
      >
        {locale === "vi" ? "Đang kiểm tra đăng nhập..." : "Checking sign-in..."}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">
          {locale === "vi" ? "Đăng nhập để tiếp tục học" : "Sign in to continue learning"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {locale === "vi"
            ? "Vui lòng đăng nhập hoặc tạo tài khoản để xem bài giảng và sử dụng các công cụ học tập."
            : "Please sign in or create an account to watch lessons and use learning tools."}
        </p>
        <Link
          href={loginHref}
          className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {locale === "vi" ? "Đăng nhập" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
