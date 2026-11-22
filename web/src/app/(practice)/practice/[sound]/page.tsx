import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SessionFlow, type SessionWord } from "@/components/session/session-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { WELCOME_PATH } from "@/lib/routes";
import { isSound, SESSION_LENGTH } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Practice · Chatterbox",
};

type Props = PageProps<"/practice/[sound]">;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reads the URL and the signed-in user's data, so it runs at request time
// inside <Suspense> (required by cacheComponents). connection() keeps it out
// of prerendering, and the shuffle below differs per request anyway.
async function PracticeSession({ params }: Pick<Props, "params">) {
  const { sound } = await params;
  if (!isSound(sound)) notFound();
  await connection();

  const supabase = await createClient();
  const [wordsRes, childrenRes] = await Promise.all([
    supabase.from("words").select("id, label, phonemes").eq("sound", sound).order("sort_order"),
    // One child per parent for now; RLS limits this to the signed-in parent's.
    supabase.from("children").select("id, name").order("created_at").limit(1),
  ]);
  if (wordsRes.error) throw new Error(`Couldn't load words: ${wordsRes.error.message}`);
  if (childrenRes.error) throw new Error(`Couldn't load children: ${childrenRes.error.message}`);

  const child = childrenRes.data[0];
  if (!child) redirect(WELCOME_PATH); // asks for the child's name first

  const words: SessionWord[] = shuffle(wordsRes.data).slice(0, SESSION_LENGTH);
  if (words.length === 0) notFound();

  // A new key per request means a brand-new SessionFlow (fresh state) on every visit.
  const sessionKey = crypto.randomUUID();
  return <SessionFlow key={sessionKey} sound={sound} words={words} childId={child.id} childName={child.name} />;
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

export default function PracticePage({ params }: Props) {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <PracticeSession params={params} />
    </Suspense>
  );
}
