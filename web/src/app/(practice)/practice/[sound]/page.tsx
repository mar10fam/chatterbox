import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SessionFlow, type SessionWord } from "@/components/session/session-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { isSound, SESSION_LENGTH } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Practice · Chatterbox",
};

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reads the URL and the signed-in user's session, so it runs at request time
// inside <Suspense> (required by cacheComponents).
async function PracticeSession({ params }: { params: PageProps<"/practice/[sound]">["params"] }) {
  const { sound } = await params;
  if (!isSound(sound)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select("id, label, phonemes")
    .eq("sound", sound)
    .order("sort_order");
  if (error) throw new Error(`Couldn't load words: ${error.message}`);

  const words: SessionWord[] = shuffle(data).slice(0, SESSION_LENGTH);
  if (words.length === 0) notFound();

  return <SessionFlow sound={sound} words={words} />;
}

function SessionSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-secondary px-5">
      <Skeleton className="aspect-square w-70 rounded-[28px] bg-card/70 sm:w-85" />
      <Skeleton className="h-9 w-64 rounded-full bg-card/70" />
      <Skeleton className="size-25 rounded-full bg-card/70 sm:size-28" />
    </div>
  );
}

export default function PracticePage({ params }: PageProps<"/practice/[sound]">) {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <PracticeSession params={params} />
    </Suspense>
  );
}
