"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Beaker, FlaskConical, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <article
              key={lab.id}
              className="rounded-2xl border border-indigo-100 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/60 dark:bg-neutral-900"
            >
              <Link href={`/lab/custom/${lab.id}`} className="group block">
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
                <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  {lab.subject} · {isEnglish ? "Grade" : "Lớp"} {lab.grade}
                </span>
                <h3 className="mt-1 font-bold text-neutral-900 dark:text-white">
                  {isEnglish ? lab.titleEn : lab.title}
                </h3>
                {isEnglish ? (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {lab.summaryEn}
                  </p>
                ) : (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {lab.summary}
                  </p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                  {isEnglish ? "Open Lab" : "Mở bài Lab"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
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
            ? "No custom Labs yet. Teachers can create the first one with the Lab Builder."
            : "Chưa có bài Lab tự tạo. Giáo viên có thể bắt đầu tạo bằng Lab Builder."}
        </p>
      )}
    </section>
  );
}
