"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type SoundOption = { id: string; label: string };

export function SoundFilter({
  sounds,
  value,
  onChange,
}: {
  sounds: SoundOption[];
  value?: string;
  onChange?: (id: string) => void;
}) {
  const [internal, setInternal] = useState("all");
  const selected = value ?? internal;
  const options: SoundOption[] = [{ id: "all", label: "All sounds" }, ...sounds];

  return (
    <ToggleGroup
      type="single"
      variant="pill"
      size="chip"
      spacing={2}
      value={selected}
      // Radix sends "" when the active chip is clicked again; keep one selected.
      onValueChange={(id) => {
        if (!id) return;
        setInternal(id);
        onChange?.(id);
      }}
      aria-label="Filter by sound"
      className="flex-wrap"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
