"use client";

import { use } from "react";
import { TeacherExploreBuilder } from "@/components/teacher/TeacherExploreBuilder";

export default function EditExploreMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TeacherExploreBuilder materialId={id} />;
}
