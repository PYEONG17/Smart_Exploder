"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Beaker, FlaskConical, Pencil, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { deleteCustomLab, fetchCustomLabs } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import type { CustomLabRecord } from "@/types/custom-lab";

export function CustomLabLibrary() {
  const { locale } = useLang();
  const { user, token } = useAuth();
  const isEnglish = locale === "en";
  const [labs, setLabs] = useState<CustomLabRecord[]>([]);
  const [error, setError] = useState("");
  const [deletingLabId, setDeletingLabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<"all" | CustomLabRecord["subject"]>("all");
  const [selectedGrade, setSelectedGrade] = useState<"all" | CustomLabRecord["grade"]>("all");

  const filteredLabs = useMemo(() => {
    const normalize = (value: string) =>
      value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
    const query = normalize(searchQuery.trim());

    return labs.filter((lab) => {
      if (selectedSubject !== "all" && lab.subject !== selectedSubject) return false;
      if (selectedGrade !== "all" && lab.grade !== selectedGrade) return false;
      if (!query) return true;

      const searchableText = normalize([
        lab.title,
        lab.titleEn,
        lab.summary,
        lab.summaryEn,
        lab.subject,
        lab.grade,
        ...lab.equipment.flatMap((item) => [item.vi, item.en]),
        ...lab.steps.flatMap((step) => [step.vi, step.en]),
        ...lab.vocabulary.flatMap((item) => [item.vi, item.en]),
        ...lab.attachments.map((attachment) => attachment.name),
      ].join(" "));
      return searchableText.includes(query);
    });
  }, [labs, searchQuery, selectedGrade, selectedSubject]);

  useEffect(() => {
    let active = true;
    fetchCustomLabs()
      .then((items) => {
        if (active) setLabs(items);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải các Lab do giáo viên tạo.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const removeLab = async (lab: CustomLabRecord) => {
    if (!token || deletingLabId) return;
    const confirmed = window.confirm(
      isEnglish
        ? `Delete "${lab.titleEn}"? This cannot be undone.`
        : `Xóa bài Lab "${lab.title}"? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmed) return;
    setDeletingLabId(lab.id);
    setError("");
    try {
      await deleteCustomLab(token, lab.id);
      setLabs((current) => current.filter(({ id }) => id !== lab.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : isEnglish ? "Could not delete the Lab." : "Không thể xóa bài Lab.",
      );
    } finally {
      setDeletingLabId(null);
    }
  };

  return (
    <section className="mb-10 rounded-3xl border border-indigo-200/70 bg-indigo-50/50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
            <Beaker className="h-4 w-4" />
            {isEnglish ? "Teacher-created labs" : "Thí nghiệm do giáo viên tạo"}
          </p>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">
            {isEnglish ? "Build and practice a Lab" : "Tạo mới và thực hành Lab"}
          </h2>
        </div>
        {user?.role === "TEACHER" && (
          <Link
            href="/teacher/labs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {isEnglish ? "Create a Lab" : "Tạo bài Lab"}
          </Link>
        )}
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : labs.length ? (
        <>
          <div className="mb-5 grid gap-3 rounded-2xl border border-indigo-100 bg-white/70 p-3 dark:border-indigo-900/60 dark:bg-neutral-900/60 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={isEnglish ? "Search labs, descriptions, equipment..." : "Tìm tên Lab, mô tả, dụng cụ..."}
                aria-label={isEnglish ? "Search teacher-created labs" : "Tìm kiếm Lab do giáo viên tạo"}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={isEnglish ? "Clear search" : "Xóa tìm kiếm"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>
            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value as typeof selectedSubject)}
              aria-label={isEnglish ? "Filter by subject" : "Lọc theo môn học"}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="all">{isEnglish ? "All subjects" : "Tất cả môn học"}</option>
              <option value="science">{isEnglish ? "Natural science" : "Khoa học tự nhiên"}</option>
              <option value="physics">{isEnglish ? "Physics" : "Vật lý"}</option>
              <option value="chemistry">{isEnglish ? "Chemistry" : "Hóa học"}</option>
              <option value="biology">{isEnglish ? "Biology" : "Sinh học"}</option>
            </select>
            <select
              value={selectedGrade}
              onChange={(event) => setSelectedGrade(event.target.value as typeof selectedGrade)}
              aria-label={isEnglish ? "Filter by grade" : "Lọc theo khối lớp"}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="all">{isEnglish ? "All grades" : "Tất cả khối lớp"}</option>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((grade) => (
                <option key={grade} value={grade}>{isEnglish ? `Grade ${grade}` : `Lớp ${grade}`}</option>
              ))}
            </select>
          </div>
          <p className="mb-3 text-xs text-neutral-500" aria-live="polite">
            {isEnglish
              ? `Showing ${filteredLabs.length} of ${labs.length} Labs`
              : `Hiển thị ${filteredLabs.length}/${labs.length} bài Lab`}
          </p>
        {filteredLabs.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLabs.map((lab) => (
            <article
              key={lab.id}
              className="rounded-2xl border border-indigo-100 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/60 dark:bg-neutral-900"
            >
              <Link
                href={`/lab/custom/${lab.id}`}
                aria-label={isEnglish ? `Open Lab: ${lab.titleEn}` : `Mở bài Lab: ${lab.title}`}
                className="group block"
              >
                <div className="relative mb-3 aspect-[16/8] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900 to-blue-600">
                  {lab.thumbnailUrl ? (
                    <Image
                      src={lab.thumbnailUrl}
                      alt={isEnglish ? `${lab.titleEn} thumbnail` : `Ảnh đại diện ${lab.title}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-white">
                      <FlaskConical className="h-10 w-10 opacity-90" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {lab.subject} · {isEnglish ? "Grade" : "Lớp"} {lab.grade}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                {lab.subject} · {isEnglish ? "Grade" : "Lớp"} {lab.grade}
              </span>
              <Link
                href={`/lab/custom/${lab.id}`}
                className="mt-1 block rounded-sm font-bold text-neutral-900 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white dark:hover:text-indigo-300"
              >
                {isEnglish ? lab.titleEn : lab.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                {isEnglish ? lab.summaryEn : lab.summary}
              </p>
              {user?.id === lab.createdById ? (
                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <Link
                    href={`/teacher/labs/${lab.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {isEnglish ? "Edit" : "Sửa"}
                  </Link>
                  <button
                    type="button"
                    disabled={deletingLabId === lab.id}
                    onClick={() => void removeLab(lab)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingLabId === lab.id
                      ? isEnglish ? "Deleting..." : "Đang xóa..."
                      : isEnglish ? "Delete" : "Xóa"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
        ) : (
          <p className="rounded-xl border border-dashed border-indigo-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-indigo-800">
            {isEnglish
              ? "No Labs match your search or filters."
              : "Không tìm thấy Lab phù hợp với nội dung tìm kiếm hoặc bộ lọc."}
          </p>
        )}
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-indigo-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-indigo-800">
          {isEnglish
            ? "No custom Labs yet. Teachers can create the first one with the Lab Builder."
            : "Chưa có bài Lab tự tạo. Giáo viên có thể bắt đầu tạo bằng Lab Builder."}
        </p>
      )}
    </section>
  );
}
