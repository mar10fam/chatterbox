import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { DashboardCard } from "@/components/dashboard-card";
import { ProgressSoundFilter } from "./progress-sound-filter";
import { ProgressChart } from "./progress-chart";
import { HardestWords } from "./hardest-words";

export const metadata: Metadata = {
  title: "View Progress · Chatterbox",
};

// Placeholder until sounds come from the database.
const SOUNDS = [
  { id: "r", label: "/r/" },
  { id: "l", label: "/l/" },
];

async function ChartSection({
  searchParams,
}: {
  searchParams: Promise<{ sound?: string }>;
}) {
  await connection();
  const { sound } = await searchParams;
  const selected = sound === "r" || sound === "l" ? sound : "all";
  return <ProgressChart sound={selected} />;
}

async function HardestSection({
  searchParams,
}: {
  searchParams: Promise<{ sound?: string }>;
}) {
  await connection();
  const { sound } = await searchParams;
  const selected = sound === "r" || sound === "l" ? sound : "all";
  return <HardestWords sound={selected} />;
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
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading words…</p>}>
            <HardestSection searchParams={searchParams} />
          </Suspense>
        </DashboardCard>
      </div>
    </div>
  );
}