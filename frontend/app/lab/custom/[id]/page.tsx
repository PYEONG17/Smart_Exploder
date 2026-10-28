"use client";

import { use, useEffect, useState } from "react";
import { fetchCustomLab } from "@/lib/api";
import { CustomLabPlayer } from "@/components/lab/CustomLabPlayer";
import type { CustomLabRecord } from "@/types/custom-lab";

export default function CustomLabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lab, setLab] = useState<CustomLabRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchCustomLab(id)
      .then((record) => {
        if (active) setLab(record);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải bài Lab.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen px-4 pt-32 text-center text-sm text-destructive">
        {error}
      </main>
    );
  }
  if (!lab) {
    return (
      <main className="min-h-screen px-4 pt-32 text-center text-sm text-muted-foreground">
        Đang tải bài Lab...
      </main>
    );
  }
  return <CustomLabPlayer lab={lab} />;
}
