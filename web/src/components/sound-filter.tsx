"use client";

import { useState } from "react";

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
    <div role="group" aria-label="Filter by sound" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const pressed = o.id === selected;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={pressed}
            onClick={() => {
              setInternal(o.id);
              onChange?.(o.id);
            }}
            className={`min-h-11 cursor-pointer rounded-full border-2 px-4 text-sm text-ink transition-colors lg:px-5 lg:text-[15px] ${
              pressed
                ? "border-ink bg-sky font-bold"
                : "border-sky bg-white font-semibold hover:bg-sky/40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
