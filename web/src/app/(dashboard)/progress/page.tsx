import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardCard } from "@/components/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getChild } from "@/lib/child";
import { WELCOME_PATH } from "@/lib/routes";
import { SOUND_LIST } from "@/lib/sounds";
import type { Sound } from "@/types/session";
import { HardestWords } from "./hardest-words";
import { ProgressChart } from "./progress-chart";
import { ProgressSoundFilter } from "./progress-sound-filter";

export const metadata: Metadata = {
  title: "View Progress · Chatterbox",
};

type Props = PageProps<"/progress">;

/**
 * Shared by both cards: wait for a real request (connection() keeps
 * Supabase's clock reads out of prerendering), read ?sound=, and load the
 * child. getChild() is cached, so both cards share one query. Parents without
 * a child are sent to /welcome, like the rest of the app.
 */
async function loadProgressContext(searchParams: Props["searchParams"]) {
  await connection();
  const [{ sound }, child] = await Promise.all([searchParams, getChild()]);
  if (!child) redirect(WELCOME_PATH);
  const selected: "all" | Sound = sound === "r" || sound === "l" ? sound : "all";
  return { child, sound: selected };
}

async function ChartSection({ searchParams }: Pick<Props, "searchParams">) {
  const { child, sound } = await loadProgressContext(searchParams);
  return <ProgressChart sound={sound} child={child} />;
}

async function HardestWordsSection({ searchParams }: Pick<Props, "searchParams">) {
  const { child, sound } = await loadProgressContext(searchParams);
  return <HardestWords sound={sound} child={child} />;
}

export default function ProgressPage({ searchParams }: Props) {
  return (
    <div className="flex max-w-260 flex-col gap-5 lg:gap-7">
      <header className="flex flex-col gap-1 lg:gap-1.5">
        <h1 className="font-heading text-[28px] leading-[1.15] font-semibold lg:text-[34px]">View Progress</h1>
        <p className="text-[15px] text-muted-foreground lg:text-base">
          See how at-home practice is going for each target sound.
        </p>
      </header>

      {/* The filter reads ?sound= (useSearchParams), so it needs a Suspense boundary. */}
      <Suspense fallback={<div className="h-11" />}>
        <ProgressSoundFilter sounds={SOUND_LIST} />
      </Suspense>

      <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:gap-6">
        <DashboardCard id="accuracy" title="Accuracy over time" className="lg:flex-[2_1_420px]">
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl bg-card/70" />}>
            <ChartSection searchParams={searchParams} />
          </Suspense>
        </DashboardCard>

        <DashboardCard id="hardest-words" title="Hardest words" className="lg:flex-[1_1_280px]">
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl bg-card/70" />}>
            <HardestWordsSection searchParams={searchParams} />
          </Suspense>
        </DashboardCard>
      </div>
    </div>
  );
}
