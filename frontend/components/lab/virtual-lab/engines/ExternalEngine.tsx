"use client";

import type { EngineRendererProps } from "@/lib/virtual-lab/engine/types";

export default function ExternalEngine(props: EngineRendererProps) {
  const { activity, mode } = props;
  if (activity.type !== "external") return null;
  let validUrl = false;
  try {
    const url = new URL(activity.url);
    const allowedHosts = ["phet.colorado.edu", "phet.colorado.org", "geogebra.org", "www.geogebra.org"];
    validUrl = url.protocol === "https:" && allowedHosts.includes(url.hostname.toLowerCase());
  } catch {
    validUrl = false;
  }
  const title = mode === "en" ? activity.titleEn || activity.titleVi : activity.titleVi || activity.titleEn;
  return (
    <section className="space-y-3 rounded-2xl border border-indigo-200/70 bg-background p-4 dark:border-indigo-900/60">
      <h3 className="font-bold">{title || (activity.provider === "phet" ? "PhET" : "GeoGebra")}</h3>
      {validUrl ? (
        <iframe
          src={activity.url}
          title={title || "External virtual lab"}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="fullscreen; clipboard-read; clipboard-write"
          className="h-[min(70vh,680px)] w-full rounded-xl border border-border bg-white"
        />
      ) : (
        <p role="alert" className="text-sm text-destructive">
          {mode === "en" ? "This simulation URL is not allowed." : "Đường dẫn mô phỏng không hợp lệ hoặc không được hỗ trợ."}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {mode === "en"
          ? "External simulations do not automatically send measurements to this lab."
          : "Mô phỏng bên ngoài không tự gửi số liệu về bảng đo của bài Lab."}
      </p>
    </section>
  );
}
