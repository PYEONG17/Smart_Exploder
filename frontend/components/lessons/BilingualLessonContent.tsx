"use client";

import { useState } from "react";
import { BookOpen, Languages, Volume2 } from "lucide-react";
import { toast } from "sonner";
import type { LessonVocabularyTerm } from "@/types";

type DisplayMode = "vi" | "en" | "both";

type Props = {
  contentVi: string;
  contentEn: string;
  vocabulary: LessonVocabularyTerm[];
  isVietnamese: boolean;
  section?: "all" | "content" | "vocabulary";
};

function splitSections(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);
}

export function BilingualLessonContent({
  contentVi,
  contentEn,
  vocabulary,
  isVietnamese,
  section = "all",
}: Props) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("both");
  const labels = isVietnamese
    ? { vi: "Tiếng Việt", en: "English", both: "Song ngữ" }
    : { vi: "Vietnamese", en: "English", both: "Bilingual" };

  const speakWord = (word: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      toast.error(
        isVietnamese
          ? "Trình duyệt này chưa hỗ trợ phát âm. Hãy thử Chrome hoặc Edge."
          : "Speech is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    const englishVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  };

  const vietnameseSections = splitSections(contentVi);
  const englishSections = splitSections(contentEn);

  return (
    <div className="space-y-6">
      {section !== "vocabulary" && (
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">
              {isVietnamese ? "Nội dung bài giảng" : "Lesson content"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isVietnamese
                ? "Chọn ngôn ngữ phù hợp hoặc xem hai ngôn ngữ cạnh nhau."
                : "Choose a language or read both side by side."}
            </p>
          </div>
          <div
            role="group"
            aria-label={isVietnamese ? "Chế độ ngôn ngữ" : "Language display"}
            className="inline-flex w-fit rounded-xl border border-border bg-background p-1"
          >
            {(["vi", "en", "both"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={displayMode === mode}
                onClick={() => setDisplayMode(mode)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  displayMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[mode]}
              </button>
            ))}
          </div>
        </div>

        {displayMode === "both" ? (
          <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Tiếng Việt
              </h3>
              {vietnameseSections.length ? (
                <div className="space-y-4 text-sm leading-7">
                  {vietnameseSections.map((section, index) => (
                    <p key={`${index}-${section.slice(0, 24)}`} className="whitespace-pre-wrap">
                      {section}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isVietnamese ? "Chưa có nội dung tiếng Việt." : "Vietnamese content is not available."}
                </p>
              )}
            </div>
            <div className="p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                English
              </h3>
              {englishSections.length ? (
                <div className="space-y-4 text-sm leading-7">
                  {englishSections.map((section, index) => (
                    <p key={`${index}-${section.slice(0, 24)}`} className="whitespace-pre-wrap">
                      {section}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isVietnamese
                    ? "Bản tiếng Anh chưa được tạo. Giáo viên có thể tạo trong phần chỉnh sửa bài học."
                    : "The English version has not been created yet."}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {displayMode === "vi" ? "Tiếng Việt" : "English"}
            </h3>
            {(displayMode === "vi" ? vietnameseSections : englishSections).length ? (
              <div className="space-y-4 text-sm leading-7">
                {(displayMode === "vi" ? vietnameseSections : englishSections).map(
                  (section, index) => (
                    <p key={`${index}-${section.slice(0, 24)}`} className="whitespace-pre-wrap">
                      {section}
                    </p>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {displayMode === "vi"
                  ? isVietnamese
                    ? "Chưa có nội dung tiếng Việt."
                    : "Vietnamese content is not available."
                  : isVietnamese
                    ? "Bản tiếng Anh chưa được tạo. Giáo viên có thể tạo trong phần chỉnh sửa bài học."
                    : "The English version has not been created yet."}
              </p>
            )}
          </div>
        )}
      </section>
      )}

      {section !== "content" && (
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-bold">
              {isVietnamese ? "Từ vựng môn học" : "Subject vocabulary"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isVietnamese
                ? "Nhấn biểu tượng loa để nghe cách phát âm tiếng Anh."
                : "Press the speaker to hear the English pronunciation."}
            </p>
          </div>
        </div>

        {vocabulary.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {vocabulary.map((term) => (
              <article
                key={`${term.termEn}-${term.termVi}`}
                className="rounded-xl border border-border/80 bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-primary">{term.termEn}</p>
                    <p className="mt-0.5 text-sm">{term.termVi}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {term.pronunciation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakWord(term.termEn)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                    aria-label={`${isVietnamese ? "Nghe phát âm" : "Hear pronunciation"}: ${term.termEn}`}
                    title={isVietnamese ? "Nghe phát âm tiếng Anh" : "Hear English pronunciation"}
                  >
                    <Volume2 className="h-4 w-4" />
                    {isVietnamese ? "Nghe" : "Listen"}
                  </button>
                </div>
                <div className="mt-3 space-y-2 border-t border-border/70 pt-3 text-xs leading-5">
                  <p>
                    <span className="font-semibold">
                      {isVietnamese ? "Nghĩa: " : "Meaning: "}
                    </span>
                    {displayMode === "en"
                      ? term.definitionEn
                      : displayMode === "vi"
                        ? term.definitionVi
                        : `${term.definitionVi} / ${term.definitionEn}`}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold">
                      {isVietnamese ? "Ví dụ: " : "Example: "}
                    </span>
                    {displayMode === "en"
                      ? term.exampleEn
                      : displayMode === "vi"
                        ? term.exampleVi
                        : `${term.exampleVi} / ${term.exampleEn}`}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {isVietnamese
              ? "Bài học chưa có danh sách từ vựng. Giáo viên có thể dùng AI tạo từ nội dung bài giảng."
              : "No vocabulary list yet. A teacher can generate one from the lesson."}
          </p>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Languages className="h-3.5 w-3.5" />
          {isVietnamese
            ? "Phát âm sử dụng giọng tiếng Anh có sẵn trên thiết bị của bạn."
            : "Pronunciation uses an English voice available on your device."}
        </p>
      </section>
      )}
    </div>
  );
}
