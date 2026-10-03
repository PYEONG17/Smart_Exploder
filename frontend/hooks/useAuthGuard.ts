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
 * Redirect unauthenticated users to /login.
 * Use in protected pages: Dashboard, Profile, Teacher Studio, etc.
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
