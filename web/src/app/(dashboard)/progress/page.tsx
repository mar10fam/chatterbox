import { Suspense } from "react";
import type { Metadata } from "next";
import { TextAlignStart } from "lucide-react";
import { DashboardCard, EmptyState } from "@/components/dashboard-card";
import { ProgressSoundFilter } from "./progress-sound-filter";
import { ProgressChart } from "./progress-chart";

export const metadata: Metadata = {
  title: "View Progress · Chatterbox",
};

// Placeholder until sounds come from the database.
const SOUNDS = [
  { id: "r", label: "/r/" },
  { id: "th", label: "/θ/ “th”" },
];

async function ChartSection({
  searchParams,
}: {
  searchParams: Promise<{ sound?: string }>;
}) {
  const { sound } = await searchParams;
  const selected = sound === "r" || sound === "th" ? sound : "all";
  return <ProgressChart sound={selected} />;
}

export default function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ sound?: string }>;
}) {
  return (
    <div className="flex max-w-260 flex-col gap-5 lg:gap-7">
      <header className="flex flex-col gap-1 lg:gap-1.5">
        <h1 className="font-heading text-[28px] leading-[1.15] font-semibold lg:text-[34px]">View Progress</h1>
        <p className="text-[15px] text-muted-foreground lg:text-base">
          See how at-home practice is going for each target sound.
        </p>
      </header>

      <Suspense fallback={null}>
        <ProgressSoundFilter sounds={SOUNDS} />
      </Suspense>

      <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:gap-6">
        <DashboardCard id="accuracy" title="Accuracy over time" className="lg:flex-[2_1_420px]">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading chart…</p>}>
            <ChartSection searchParams={searchParams} />
          </Suspense>
        </DashboardCard>

        <DashboardCard id="hardest-words" title="Hardest words" className="lg:flex-[1_1_280px]">
          <EmptyState
            icon={TextAlignStart}
            title="Nothing to show yet"
            description="Words your child finds tricky will be listed here."
            className="h-[150px] lg:h-auto lg:min-h-70"
          />
        </DashboardCard>
      </div>
    </div>
  );
}