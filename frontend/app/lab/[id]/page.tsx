import { VirtualLabSimulator } from "@/components/lab/VirtualLabSimulator";

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0c1222] pt-24 sm:pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <VirtualLabSimulator initialExpId={id} initialViewMode="detail" />
      </div>
    </div>
  );
}
