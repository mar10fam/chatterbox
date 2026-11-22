"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ImageIcon, Mic, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SOUNDS } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { AttemptResult, Sound } from "@/types/session";

export type SessionWord = {
  id: string;
  label: string;
  phonemes: string[];
};

/**
 * One practice session: shows each picture in turn and collects an
 * AttemptResult per word.
 *
 * Audio isn't wired up yet. When it is, `handleRecord` should record the
 * child, call /score, and pass the AttemptResult to `recordAttempt`. After the
 * last word, send everything to supabase.rpc("save_session", …).
 */
export function SessionFlow({ sound, words }: { sound: Sound; words: SessionWord[] }) {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [status, setStatus] = useState("");

  const total = words.length;
  const index = Math.min(results.length, total - 1);
  const word = words[index];
  const soundInfo = SOUNDS[sound];

  // Will be called with the scored attempt once audio is connected.
  function recordAttempt(result: AttemptResult) {
    setResults((prev) => [...prev, result]);
  }
  void recordAttempt;

  function handleRecord() {
    setStatus("Recording isn’t connected yet. Audio scoring is coming soon.");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-secondary text-foreground">
      <header className="flex items-center gap-3 px-4 py-3.5 sm:flex-wrap sm:justify-between sm:gap-4 sm:px-8 sm:py-5">
        <Button
          asChild
          variant="ghost"
          className="size-11 shrink-0 rounded-full bg-card p-0 text-[15px] hover:bg-card/80 sm:w-auto sm:px-4"
        >
          <Link href="/session" aria-label="End session">
            <X className="size-4.5" strokeWidth={2.4} aria-hidden />
            <span className="hidden sm:inline">End session</span>
          </Link>
        </Button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-105 sm:min-w-50 sm:gap-2">
          <span className="text-sm font-bold sm:text-[15px]">
            Word {index + 1} of {total}
          </span>
          <Progress
            value={(results.length / total) * 100}
            aria-label="Session progress"
            className="h-2.5 bg-card sm:h-3"
            indicatorClassName="rounded-full bg-brand"
          />
        </div>

        <Badge className="h-11 shrink-0 rounded-full bg-accent px-3.5 font-heading text-[17px] font-semibold text-accent-foreground sm:px-4.5 sm:text-lg">
          <span className="hidden sm:inline">Practicing&nbsp;</span>
          {soundInfo.ipa}
        </Badge>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-2 text-center sm:gap-7 sm:px-6 sm:pt-4 sm:pb-8">
        {/* Picture card. Images come later; for now the word is shown as text. */}
        <div className="aspect-square w-70 max-w-full rounded-[28px] bg-card p-4 shadow-[0_6px_24px_rgba(48,54,80,0.10)] sm:w-85 sm:rounded-[32px] sm:p-5">
          <div className="flex size-full flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-lavender-dash sm:rounded-[22px]">
            <ImageIcon className="size-9 text-brand sm:size-10" strokeWidth={1.8} aria-hidden />
            <span className="font-heading text-4xl font-semibold sm:text-[44px]">{word.label}</span>
          </div>
        </div>

        <h1 className="font-heading text-[30px] leading-[1.15] font-semibold sm:text-4xl">What’s in the picture?</h1>

        <div className="flex flex-col items-center gap-3 sm:gap-3.5">
          <Button
            onClick={handleRecord}
            aria-label="Tap to record"
            className="size-25 rounded-full shadow-[0_0_0_10px_var(--accent)] hover:bg-primary/90 sm:size-28 sm:shadow-[0_0_0_12px_var(--accent)]"
          >
            <Mic className="size-10.5 sm:size-11.5" strokeWidth={2.2} aria-hidden />
          </Button>
          <p className="mt-2 text-base font-bold sm:mt-2.5 sm:text-[17px]">Tap and say the word</p>
          <p role="status" className="min-h-5 text-sm text-muted-foreground">
            {status}
          </p>
        </div>
      </main>

      <footer className="flex justify-center px-4 pb-7 sm:px-6 sm:pb-8">
        <ol aria-label="Words in this session" className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {words.map((w, i) => {
            const done = i < results.length;
            const current = i === index && !done;
            return (
              <li
                key={w.id}
                aria-label={done ? `Word ${i + 1} done` : current ? `Word ${i + 1}, current` : `Word ${i + 1}`}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full sm:size-10",
                  done && "bg-brand text-white",
                  current && "border-3 border-foreground bg-card",
                  !done && !current && "border-2 border-dashed border-lavender-dash bg-card",
                )}
              >
                {done && <Check className="size-3.75 sm:size-5" strokeWidth={3.2} aria-hidden />}
              </li>
            );
          })}
        </ol>
      </footer>
    </div>
  );
}
