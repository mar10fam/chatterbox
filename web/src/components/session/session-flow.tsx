"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, Loader2, Mic, PartyPopper, Square, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MicPermissionError, WavRecorder } from "@/lib/audio/wav-recorder";
import { SOUNDS } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AttemptResult, SaveSessionArgs, Sound } from "@/types/session";

export type SessionWord = {
  id: string;
  label: string;
  phonemes: string[];
};

type Phase = "idle" | "listening" | "thinking" | "cheer" | "saving" | "done" | "save-error";

const MAX_RECORD_MS = 3000;
const CHEER_MS = 1300;
// Same warm feedback whether the target sound was right or not: sessions
// measure progress, they never tell a child they got it wrong.
const CHEERS = ["Nice job!", "Great try!", "Awesome!", "You did it!", "Super!", "Way to go!"];

/**
 * One practice session. For each picture: record → score via /api/score →
 * cheer → next. After the last word the attempts are saved with
 * save_session() and the child sees a celebration screen (no score).
 */
export function SessionFlow({
  sound,
  words,
  childId,
  childName,
}: {
  sound: Sound;
  words: SessionWord[];
  childId: string;
  childName: string;
}) {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("");
  const [cheer, setCheer] = useState(CHEERS[0]);

  const recorder = useRef<WavRecorder | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<string | null>(null);

  const total = words.length;
  const index = Math.min(results.length, total - 1);
  const word = words[index];
  const soundInfo = SOUNDS[sound];

  useEffect(() => {
    recorder.current = new WavRecorder();
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      recorder.current?.dispose();
    };
  }, []);

  async function save(attempts: AttemptResult[]) {
    setPhase("saving");
    const args: SaveSessionArgs = {
      p_child_id: childId,
      p_sound: sound,
      p_started_at: startedAt.current ?? new Date().toISOString(),
      p_attempts: attempts,
    };
    const { error } = await createClient().rpc("save_session", args);
    if (error) {
      setStatus(error.message);
      setPhase("save-error");
    } else {
      recorder.current?.dispose();
      setPhase("done");
    }
  }

  function recordAttempt(result: AttemptResult) {
    const next = [...results, result];
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    setPhase("cheer");
    setTimeout(() => {
      setResults(next);
      if (next.length >= total) void save(next);
      else setPhase("idle");
    }, CHEER_MS);
  }

  async function finishRecording() {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (!recorder.current?.isRecording) return;
    setPhase("thinking");
    setStatus("");
    try {
      const wav = await recorder.current.stop();
      const form = new FormData();
      form.append("audio", wav, "attempt.wav");
      form.append("word_id", word.id);
      form.append("target_phonemes", JSON.stringify(word.phonemes));
      form.append("sound", sound);

      const res = await fetch("/api/score", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Scoring failed (${res.status})`);

      if (body.no_speech) {
        setStatus("Hmm, I didn’t hear that. Tap and try again!");
        setPhase("idle");
        return;
      }
      recordAttempt({
        word_id: word.id,
        item_index: results.length + 1,
        target_phonemes: body.target_phonemes,
        heard_phonemes: body.heard_phonemes,
        target_sound_correct: body.target_sound_correct,
        score: body.score,
      });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong. Tap to try again.");
      setPhase("idle");
    }
  }

  async function handleMic() {
    if (phase === "listening") return void finishRecording();
    if (phase !== "idle" || !recorder.current) return;
    setStatus("");
    try {
      await recorder.current.start();
    } catch (e) {
      setStatus(
        e instanceof MicPermissionError
          ? "Chatterbox needs the microphone. Allow it in your browser’s address bar, then tap again."
          : "Couldn’t start recording. Tap to try again.",
      );
      return;
    }
    startedAt.current ??= new Date().toISOString();
    setPhase("listening");
    stopTimer.current = setTimeout(() => void finishRecording(), MAX_RECORD_MS);
  }

  if (phase === "done" || phase === "saving" || phase === "save-error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-secondary px-5 text-center">
        {phase === "saving" ? (
          <>
            <Loader2 className="size-12 animate-spin text-brand" aria-hidden />
            <p className="font-heading text-2xl font-semibold">Saving…</p>
          </>
        ) : phase === "save-error" ? (
          <>
            <h1 className="font-heading text-3xl font-semibold">We couldn’t save this session</h1>
            <p className="max-w-sm text-muted-foreground">{status}</p>
            <Button size="lg" className="rounded-full" onClick={() => void save(results)}>
              Try saving again
            </Button>
          </>
        ) : (
          <>
            <div className="flex size-28 items-center justify-center rounded-full bg-card shadow-[0_6px_24px_rgba(48,54,80,0.10)]">
              <PartyPopper className="size-14 text-brand" strokeWidth={1.8} aria-hidden />
            </div>
            <h1 className="font-heading text-4xl font-semibold sm:text-5xl">All done{childName ? `, ${childName}` : ""}!</h1>
            <p className="max-w-sm text-lg text-muted-foreground">
              You practiced {total} {soundInfo.ipa} words. Amazing work!
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/session">Practice again</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full bg-card hover:bg-card/80">
                <Link href="/progress">See progress</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  const busy = phase === "thinking" || phase === "cheer";

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
        <div className="relative aspect-square w-70 max-w-full rounded-[28px] bg-card p-4 shadow-[0_6px_24px_rgba(48,54,80,0.10)] sm:w-85 sm:rounded-[32px] sm:p-5">
          <div className="flex size-full flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-lavender-dash sm:rounded-[22px]">
            <ImageIcon className="size-9 text-brand sm:size-10" strokeWidth={1.8} aria-hidden />
            <span className="font-heading text-4xl font-semibold sm:text-[44px]">{word.label}</span>
          </div>
          {phase === "cheer" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[28px] bg-card animate-in fade-in zoom-in-95 sm:rounded-[32px]">
              <PartyPopper className="size-14 text-brand" strokeWidth={1.8} aria-hidden />
              <span className="font-heading text-4xl font-semibold">{cheer}</span>
            </div>
          )}
        </div>

        <h1 className="font-heading text-[30px] leading-[1.15] font-semibold sm:text-4xl">What’s in the picture?</h1>

        <div className="flex flex-col items-center gap-3 sm:gap-3.5">
          <Button
            onClick={() => void handleMic()}
            disabled={busy}
            aria-label={phase === "listening" ? "Stop recording" : "Tap to record"}
            className={cn(
              "size-25 rounded-full shadow-[0_0_0_10px_var(--accent)] hover:bg-primary/90 disabled:opacity-100 sm:size-28 sm:shadow-[0_0_0_12px_var(--accent)]",
              phase === "listening" && "animate-pulse bg-[#e5689a] shadow-[0_0_0_14px_#fbd5e4] hover:bg-[#e5689a] sm:shadow-[0_0_0_16px_#fbd5e4]",
            )}
          >
            {phase === "thinking" ? (
              <Loader2 className="size-10.5 animate-spin sm:size-11.5" aria-hidden />
            ) : phase === "listening" ? (
              <Square className="size-9 sm:size-10" fill="currentColor" strokeWidth={0} aria-hidden />
            ) : (
              <Mic className="size-10.5 sm:size-11.5" strokeWidth={2.2} aria-hidden />
            )}
          </Button>
          <p className="mt-2 text-base font-bold sm:mt-2.5 sm:text-[17px]">
            {phase === "listening" ? "Listening…" : phase === "thinking" ? "Checking…" : "Tap and say the word"}
          </p>
          <p role="status" className="min-h-5 max-w-sm text-sm text-muted-foreground">
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
