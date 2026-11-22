import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StartSessionForm } from "@/components/session/start-session-form";
import { SESSION_LENGTH } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Start a Session · Chatterbox",
};

// Checks whether the parent has added their child yet (request-time data), so
// it streams in under <Suspense>. connection() keeps it out of prerendering
// (the Supabase client reads the clock, which Next forbids while prerendering).
async function FormWithChild() {
  await connection();
  const supabase = await createClient();
  const { count, error } = await supabase.from("children").select("id", { count: "exact", head: true });
  if (error) throw new Error(`Couldn't load your child: ${error.message}`);
  return <StartSessionForm hasChild={(count ?? 0) > 0} />;
}

export default function StartSessionPage() {
  return (
    <div className="flex max-w-220 flex-col gap-5.5 lg:gap-8">
      <header className="flex flex-col gap-1 lg:gap-1.5">
        <h1 className="font-heading text-[28px] leading-[1.15] font-semibold lg:text-[34px]">Start a Session</h1>
        <p className="text-[15px] text-muted-foreground lg:text-base">
          Pick a sound to practice. Your child will work through {SESSION_LENGTH} picture prompts.
        </p>
      </header>

      <Suspense fallback={<StartSessionForm hasChild />}>
        <FormWithChild />
      </Suspense>
    </div>
  );
}
