import type { Metadata } from "next";
import { DashboardCard, EmptyState } from "@/components/dashboard-card";
import { LineChartIcon, ListIcon } from "@/components/icons";
import { SoundFilter } from "@/components/sound-filter";

export const metadata: Metadata = {
  title: "View Progress · Chatterbox",
};

// Placeholder until sounds come from the database.
const SOUNDS = [
  { id: "r", label: "/r/" },
  { id: "th", label: "/θ/ “th”" },
];

export default function ProgressPage() {
  return (
    <div className="flex max-w-260 flex-col gap-5 lg:gap-7">
      <header className="flex flex-col gap-1 lg:gap-1.5">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold lg:text-[34px]">
          View Progress
        </h1>
        <p className="m-0 text-[15px] text-muted lg:text-base">
          See how at-home practice is going for each target sound.
        </p>
      </header>

      <SoundFilter sounds={SOUNDS} />

      <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:gap-6">
        <DashboardCard id="acc-h" title="Accuracy over time" className="lg:flex-[2_1_420px]">
          <EmptyState
            icon={LineChartIcon}
            title="No practice sessions yet"
            description="Accuracy for each sound will show up here after the first session."
            className="h-[190px] lg:h-auto"
            descriptionClassName="lg:max-w-80"
          />
        </DashboardCard>

        <DashboardCard id="words-h" title="Hardest words" className="lg:flex-[1_1_280px]">
          <EmptyState
            icon={ListIcon}
            title="Nothing to show yet"
            description="Words your child finds tricky will be listed here."
            className="h-[150px] lg:h-auto lg:flex-1"
            descriptionClassName="lg:max-w-60"
          />
        </DashboardCard>
      </div>
    </div>
  );
}
