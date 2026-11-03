"use client";

import { useMemo, useState } from "react";
import ohmLawExample from "@/content/virtual-lab/examples/ohm-law.json";
import { SimulationRenderer } from "@/components/lab/virtual-lab/EngineRenderer";
import { createVirtualLabSessionStore } from "@/lib/virtual-lab/state-store";
import { parseVirtualLabActivityJson } from "@/lib/virtual-lab/parser";
import { useLang } from "@/contexts/LanguageContext";

export default function HomeSimulationDemo() {
  const { locale } = useLang();
  const [store] = useState(() => createVirtualLabSessionStore("home-ohm-law-demo"));
  const activity = useMemo(
    () => parseVirtualLabActivityJson(JSON.stringify(ohmLawExample)),
    [],
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {locale === "en" ? "Ohm's law" : "Định luật Ôm"}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {locale === "en" ? "Voltage ÷ resistance = current" : "Hiệu điện thế ÷ điện trở = cường độ dòng điện"}
        </span>
      </div>
      <div className="p-3 sm:p-5">
        <SimulationRenderer
          activity={activity}
          activityId="ohm-law-preview"
          mode={locale === "en" ? "en" : "vi"}
          store={store}
          index={0}
          onRecord={() => undefined}
        />
      </div>
    </div>
  );
}
