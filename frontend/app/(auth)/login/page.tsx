"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import Link from "next/link";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/contexts/AuthContext";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t("common.error"));
      return;
    }

    try {
      setIsLoading(true);

      const result = await loginUser({
        email,
        password,
      });

      // Lưu auth state vào context (context sẽ tự lưu localStorage)
      login(result);

      toast.success(
        `${t("common.success")} - ${
          result.user.role === "STUDENT"
            ? t("auth.register.role.student")
            : t("auth.register.role.teacher")
        }!`,
      );

      router.push(getRoleHomePath(result.user.role));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Email hoặc mật khẩu không chính xác";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-foreground mb-2">
          {t("auth.login.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("auth.login.subtitle")}
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 mb-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("auth.login.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhapemail@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t("auth.login.password")}
            </label>
            <Link
              href="#"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              {t("auth.login.forgot")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl py-6 text-base font-semibold group mt-2 shadow-md"
        >
          {isLoading ? "Đang đăng nhập..." : t("auth.login.submit")}

          {!isLoading && (
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-background text-muted-foreground">
            {t("common.or")}
          </span>
        </div>
      </div>

      <GoogleSignInButton
        onSuccess={(result) => {
          login(result);
          toast.success(t("common.success"));
          router.push(getRoleHomePath(result.user.role));
        }}
        onError={(error) =>
          toast.error(
            error instanceof Error ? error.message : "Google sign-in failed",
          )
        }
      />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("auth.login.no_acc")}{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:underline"
        >
          {t("auth.login.register")}
        </Link>
      </p>
    </div>
  );
}
