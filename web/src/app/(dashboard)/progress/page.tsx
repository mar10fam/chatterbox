import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { TextAlignStart } from "lucide-react";
import { DashboardCard, EmptyState } from "@/components/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SOUND_LIST } from "@/lib/sounds";
import { ProgressChart } from "./progress-chart";
import { ProgressSoundFilter } from "./progress-sound-filter";

export const metadata: Metadata = {
  title: "View Progress · Chatterbox",
};

type Props = PageProps<"/progress">;

// Reads ?sound= and the signed-in parent's data, so it runs at request time
// under <Suspense>. connection() keeps it out of prerendering (the Supabase
// client reads the clock, which cacheComponents forbids while prerendering).
async function ChartSection({ searchParams }: Pick<Props, "searchParams">) {
  await connection();
  const { sound } = await searchParams;
  const selected = sound === "r" || sound === "l" ? sound : "all";
  return <ProgressChart sound={selected} />;
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
