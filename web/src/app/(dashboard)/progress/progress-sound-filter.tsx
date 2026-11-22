"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SoundFilter, type SoundOption } from "@/components/sound-filter";

export function ProgressSoundFilter({ sounds }: { sounds: SoundOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <SoundFilter
      sounds={sounds}
      // Anything that isn't a known sound (e.g. ?sound=zz) shows as "All sounds",
      // matching how the page treats it.
      value={sounds.some((s) => s.id === params.get("sound")) ? params.get("sound")! : "all"}
      onChange={(id) => {
        const next = new URLSearchParams(params.toString());
        if (id === "all") next.delete("sound");
        else next.set("sound", id);
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    />
  );
}