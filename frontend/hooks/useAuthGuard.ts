"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";

interface AuthGuardOptions {
  allowedRoles?: AuthUser["role"][];
  redirectTo?: string;
  forbiddenRedirectTo?: string;
}

/**
 * Chuyển hướng người dùng chưa đăng nhập về /login.
 * Dùng cho các trang được bảo vệ: Dashboard, Hồ sơ, Studio Giáo viên, v.v.
 *
 * @example
 * export default function DashboardPage() {
 *   useAuthGuard();
 *   ...
 * }
 */
export function useAuthGuard({
  allowedRoles,
  redirectTo = "/login",
  forbiddenRedirectTo = "/",
}: AuthGuardOptions = {}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const isRoleAllowed =
    !allowedRoles || (!!user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
    } else if (!isRoleAllowed) {
      router.replace(forbiddenRedirectTo);
    }
  }, [
    forbiddenRedirectTo,
    isAuthenticated,
    isLoading,
    isRoleAllowed,
    redirectTo,
    router,
  ]);

  return { isLoading: isLoading || !isRoleAllowed };
}
