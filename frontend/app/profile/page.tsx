"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  GraduationCap,
  School,
  Shuffle,
  Camera,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLang } from "@/contexts/LanguageContext";
import { updateMyProfile, uploadAvatar, getRandomAvatar } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleConfig(role: "STUDENT" | "TEACHER") {
  switch (role) {
    case "TEACHER":
      return {
        label: "Giáo viên",
        labelEn: "Teacher",
        Icon: School,
        gradient: "from-purple-500 to-violet-600",
        badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    default:
      return {
        label: "Học sinh",
        labelEn: "Student",
        Icon: GraduationCap,
        gradient: "from-blue-500 to-cyan-500",
        badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();
  const { locale } = useLang();

  // Name edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");

  // Bio edit state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio ?? "");

  // Loading states
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRandomAvatar, setIsRandomAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Spinner while auth hydrates / redirecting
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.Icon;
  const initials = getInitials(user.name);
  const joinedDate = new Date(user.createdAt).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user.name) { setIsEditingName(false); return; }
    if (trimmed.length < 2) {
      toast.error(locale === "vi" ? "Tên phải có ít nhất 2 ký tự" : "Name must be at least 2 characters");
      return;
    }
    try {
      setIsSavingName(true);
      const updated = await updateMyProfile(token!, { name: trimmed });
      updateUser({ name: updated.name });
      toast.success(locale === "vi" ? "Đã cập nhật tên!" : "Name updated!");
      setIsEditingName(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveBio = async () => {
    const trimmed = bioInput.trim();
    if (trimmed === (user.bio ?? "")) { setIsEditingBio(false); return; }
    try {
      setIsSavingBio(true);
      const updated = await updateMyProfile(token!, { bio: trimmed || null });
      updateUser({ bio: updated.bio });
      toast.success(locale === "vi" ? "Đã cập nhật bio!" : "Bio updated!");
      setIsEditingBio(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const updated = await uploadAvatar(token!, user.id, file);
      updateUser({ avatar: updated.avatar });
      toast.success(locale === "vi" ? "Đã cập nhật ảnh đại diện!" : "Avatar updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRandomAvatar = async () => {
    try {
      setIsRandomAvatar(true);
      const updated = await getRandomAvatar(token!, user.id);
      updateUser({ avatar: updated.avatar });
      toast.success(locale === "vi" ? "Avatar ngẫu nhiên đã được áp dụng!" : "Random avatar applied!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setIsRandomAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-6">

        {/* ── Profile Card ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 mb-6 shadow-sm"
        >
          {/* Background decoration */}
          <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${roleConfig.gradient} opacity-10`} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 -translate-y-32 translate-x-32" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-start gap-6">

            {/* ── Avatar Column ── */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              {/* Avatar display */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                className={`relative w-24 h-24 rounded-2xl shadow-lg overflow-hidden ring-2 ring-border cursor-pointer`}
                onClick={() => fileInputRef.current?.click()}
                title={locale === "vi" ? "Click để thay đổi ảnh" : "Click to change photo"}
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${roleConfig.gradient} flex items-center justify-center text-white text-3xl font-black`}>
                    {initials}
                  </div>
                )}

                {/* Upload overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </motion.div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFileChange}
                id="avatar-upload"
              />

              {/* Avatar action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 h-7 px-2"
                  title={locale === "vi" ? "Tải ảnh lên" : "Upload photo"}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                  {locale === "vi" ? "Tải lên" : "Upload"}
                </Button>

                <Button
                  onClick={handleRandomAvatar}
                  disabled={isRandomAvatar}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 h-7 px-2"
                  title={locale === "vi" ? "Avatar ngẫu nhiên" : "Random avatar"}
                >
                  {isRandomAvatar ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Shuffle className="w-3 h-3" />
                  )}
                  {locale === "vi" ? "Ngẫu nhiên" : "Random"}
                </Button>
              </div>
            </div>

            {/* ── Info Column ── */}
            <div className="flex-1 min-w-0">
              {/* Editable name */}
              <div className="flex items-center gap-2 mb-2">
                {isEditingName ? (
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-2xl font-extrabold text-foreground bg-muted/50 border border-border rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 max-w-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") { setNameInput(user.name); setIsEditingName(false); }
                    }}
                  />
                ) : (
                  <h1 className="text-2xl font-extrabold text-foreground">{user.name}</h1>
                )}

                {!isEditingName && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setNameInput(user.name); setIsEditingName(true); }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Name edit actions */}
              {isEditingName && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 mb-3"
                >
                  <Button onClick={handleSaveName} disabled={isSavingName} size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5">
                    {isSavingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {locale === "vi" ? "Lưu" : "Save"}
                  </Button>
                  <Button onClick={() => { setNameInput(user.name); setIsEditingName(false); }}
                    variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    {locale === "vi" ? "Hủy" : "Cancel"}
                  </Button>
                </motion.div>
              )}

              {/* Email */}
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>

              {/* Role badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${roleConfig.badge}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {locale === "vi" ? roleConfig.label : roleConfig.labelEn}
              </div>

              {/* Editable bio */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Bio
                  </span>
                  {!isEditingBio && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setBioInput(user.bio ?? ""); setIsEditingBio(true); }}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>

                {isEditingBio ? (
                  <div>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      maxLength={200}
                      rows={3}
                      placeholder={locale === "vi" ? "Giới thiệu bản thân..." : "Tell us about yourself..."}
                      className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{bioInput.length}/200</span>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveBio} disabled={isSavingBio} size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5">
                          {isSavingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {locale === "vi" ? "Lưu" : "Save"}
                        </Button>
                        <Button onClick={() => setIsEditingBio(false)} variant="outline" size="sm" className="rounded-xl text-xs">
                          {locale === "vi" ? "Hủy" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {user.bio || (locale === "vi" ? "Chưa có giới thiệu. Click ✏️ để thêm." : "No bio yet. Click ✏️ to add one.")}
                  </p>
                )}
              </div>
            </div>

            {/* Join date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border px-3 py-2 rounded-xl self-start shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span>{locale === "vi" ? "Tham gia" : "Joined"}: {joinedDate}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Account Info Card ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">
            {locale === "vi" ? "Thông tin tài khoản" : "Account Information"}
          </h2>
          <div className="space-y-3">
            {[
              { label: locale === "vi" ? "Tên đầy đủ" : "Full name", value: user.name, icon: User },
              { label: "Email", value: user.email, icon: Mail },
              { label: locale === "vi" ? "Vai trò" : "Role", value: locale === "vi" ? roleConfig.label : roleConfig.labelEn, icon: RoleIcon },
              { label: "ID", value: user.id, icon: Shield },
            ].map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{row.label}</div>
                    <div className="text-sm font-medium text-foreground truncate">{row.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
