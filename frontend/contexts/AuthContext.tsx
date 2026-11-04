"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ApiError, getMe } from "@/lib/api";

// ─── Loại dữ liệu ────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
  avatar: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (result: AuthResult) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

// ─── Bối cảnh ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "smartexplorer_token";
const USER_KEY = "smartexplorer_user";

export function getRoleHomePath(role: AuthUser["role"]): string {
  return role === "STUDENT" ? "/assignments" : "/teacher";
}

// ─── Nhà cung cấp ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tải dữ liệu từ localStorage sau khi mount (tránh xung đột SSR)
  useEffect(() => {
    let isActive = true;
    queueMicrotask(() => {
      if (!isActive) return;
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!savedToken) {
        localStorage.removeItem(USER_KEY);
        setIsLoading(false);
        return;
      }

      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser) as AuthUser);
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }

      getMe(savedToken)
        .then((currentUser) => {
          if (!isActive) return;
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          setUser(currentUser);
        })
        .catch((error: unknown) => {
          // Lỗi API/mạng tạm thời không nên xóa phiên đã lưu trong bộ nhớ cache.
          if (!isActive || !(error instanceof ApiError) || error.status !== 401) {
            return;
          }
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    });

    return () => {
      isActive = false;
    };
  }, []);

  /**
   * Gọi sau khi đăng nhập hoặc đăng ký thành công.
   * Lưu mã thông báo và người dùng vào trạng thái ứng dụng cùng localStorage.
   */
  const login = useCallback((result: AuthResult) => {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  }, []);

  /**
   * Xóa trạng thái xác thực và dữ liệu trong localStorage.
   * Giao diện sẽ chịu trách nhiệm chuyển hướng sau đó.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Cập nhật các trường người dùng trong trạng thái ứng dụng và localStorage mà không cần đăng nhập lại.
   * Dùng sau khi hồ sơ được cập nhật, chẳng hạn khi đổi tên.
   */
  const updateUser = useCallback((updatedFields: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
