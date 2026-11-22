import type { Metadata } from "next";
import { StartSessionForm } from "@/components/session/start-session-form";
import { SESSION_LENGTH } from "@/lib/sounds";

export const metadata: Metadata = {
  title: "Start a Session · Chatterbox",
};

export default function StartSessionPage() {
  return (
    <div className="flex max-w-220 flex-col gap-5.5 lg:gap-8">
      <header className="flex flex-col gap-1 lg:gap-1.5">
        <h1 className="font-heading text-[28px] leading-[1.15] font-semibold lg:text-[34px]">Start a Session</h1>
        <p className="text-[15px] text-muted-foreground lg:text-base">
          Pick a sound to practice. Your child will work through {SESSION_LENGTH} picture prompts.
        </p>
      </header>

      <StartSessionForm />
    </div>
  );
}
