"use client";

import { useSyncExternalStore } from "react";
import { Beaker, FlaskConical } from "lucide-react";
import { VirtualLabSimulator } from "@/components/lab/VirtualLabSimulator";
import { CustomLabLibrary } from "@/components/lab/CustomLabLibrary";
import { useLang } from "@/contexts/LanguageContext";

type LabSection = "kntt" | "teacher";

function subscribeToLabSection(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("lab-section-change", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("lab-section-change", onChange);
  };
}

function getLabSection(): LabSection {
  return new URLSearchParams(window.location.search).get("tab") === "custom"
    ? "teacher"
    : "kntt";
}

function getServerLabSection(): LabSection {
  return "kntt";
}

export default function LabPage() {
  const { locale } = useLang();
  const activeSection = useSyncExternalStore(
    subscribeToLabSection,
    getLabSection,
    getServerLabSection,
  );

  const selectSection = (section: "kntt" | "teacher") => {
    const url = new URL(window.location.href);
    if (section === "teacher") {
      url.searchParams.set("tab", "custom");
    } else {
      url.searchParams.delete("tab");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    window.dispatchEvent(new Event("lab-section-change"));
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0c1222] pt-24 sm:pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <div
          className="inline-flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5"
          role="tablist"
          aria-label={locale === "vi" ? "Danh mục phòng Lab" : "Lab categories"}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "kntt"}
            onClick={() => selectSection("kntt")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeSection === "kntt"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            {locale === "vi" ? "23 bài thí nghiệm KNTT" : "23 KNTT experiments"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "teacher"}
            onClick={() => selectSection("teacher")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeSection === "teacher"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Beaker className="h-4 w-4" />
            {locale === "vi" ? "Lab do giáo viên tạo" : "Teacher-created Labs"}
          </button>
        </div>
        {activeSection === "kntt" ? (
          <VirtualLabSimulator />
        ) : (
          <CustomLabLibrary />
        )}
      </div>
    </div>
  );
}
