"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Beaker, Plus, TriangleAlert } from "lucide-react";
import { fetchCustomLabs } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import type { CustomLabRecord } from "@/types/custom-lab";

export function CustomLabLibrary() {
  const { locale } = useLang();
  const { user } = useAuth();
  const isEnglish = locale === "en";
  const [labs, setLabs] = useState<CustomLabRecord[]>([]);
  const [error, setError] = useState("");

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
        {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
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
            <Link
              key={lab.id}
              href={`/lab/custom/${lab.id}`}
              className="group rounded-2xl border border-indigo-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/60 dark:bg-neutral-900"
            >
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
