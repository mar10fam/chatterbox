import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StartSessionForm } from "@/components/session/start-session-form";
import { hasChild } from "@/lib/child";
import { WELCOME_PATH } from "@/lib/routes";
import { SESSION_LENGTH } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Start a Session · Chatterbox",
};

// Parents who haven't added their child yet are sent to /welcome first. This
// reads request-time data, so it sits under <Suspense>; connection() keeps it
// out of prerendering (the Supabase client reads the clock).
async function FormWithChild() {
  await connection();
  if (!(await hasChild(await createClient()))) redirect(WELCOME_PATH);
  return <StartSessionForm />;
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

      <Suspense fallback={<StartSessionForm />}>
        <FormWithChild />
      </Suspense>
    </div>
  );
}
