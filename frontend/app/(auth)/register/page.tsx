"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

import Link from "next/link";

import {
  ArrowRight,
  Mail,
  Lock,
  User,
  GraduationCap,
  School,
} from "lucide-react";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/contexts/AuthContext";

import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLang();
  const { login } = useAuth();

  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    // Kiểm tra dữ liệu
    if (!name.trim() || !email.trim() || !password) {
      toast.error(t("common.error"));
      return;
    }

    try {
      setLoading(true);

      // Gọi Backend API
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      // Lưu auth state vào context
      login(result);

      // Thông báo thành công
      toast.success("Đăng ký tài khoản thành công!");

      // Chuyển sang dashboard
      router.push(getRoleHomePath(result.user.role));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Đăng ký thất bại";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-foreground mb-2">
          {t("auth.register.title")}
        </h2>

        <p className="text-muted-foreground text-sm">
          {t("auth.register.subtitle")}
        </p>
      </div>

      {/* Role Toggle Selector */}
      <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-2xl mb-6 border border-border">
        <button
          type="button"
          onClick={() => setRole("STUDENT")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
            role === "STUDENT"
              ? "bg-background text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />

          {t("auth.register.role.student")}
        </button>

        <button
          type="button"
          onClick={() => setRole("TEACHER")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
            role === "TEACHER"
              ? "bg-background text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <School className="w-4 h-4" />

          {t("auth.register.role.teacher")}
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 mb-6">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("auth.register.name")}
          </label>

          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("auth.login.password")}
          </label>

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

        {/* Register Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl py-6 text-base font-semibold group mt-2 shadow-md"
        >
          {loading ? "Đang đăng ký..." : t("auth.register.submit")}

          {!loading && (
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
      </form>

      {/* OR */}
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

      {/* Google */}
      <GoogleSignInButton
        role={role}
        onSuccess={(result) => {
          login(result);
          toast.success("Đăng nhập bằng Google thành công!");
          router.push(getRoleHomePath(result.user.role));
        }}
        onError={(error) =>
          toast.error(
            error instanceof Error ? error.message : "Google sign-in failed",
          )
        }
      />

      {/* Login */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("auth.register.has_acc")}{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          {t("auth.register.login")}
        </Link>
      </p>
    </div>
  );
}
