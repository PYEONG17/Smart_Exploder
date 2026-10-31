"use client";

import { use } from "react";
import { CustomLabBuilder } from "@/components/teacher/CustomLabBuilder";

export default function EditCustomLabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CustomLabBuilder labId={id} />;
}
