"use client";

import { VirtualLabSimulator } from "@/components/lab/VirtualLabSimulator";
import { CustomLabLibrary } from "@/components/lab/CustomLabLibrary";

export default function LabPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0c1222] pt-24 sm:pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <CustomLabLibrary />
        <VirtualLabSimulator />
      </div>
    </div>
  );
}
