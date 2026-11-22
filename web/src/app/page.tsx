import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight, Lock, Users } from "lucide-react";
import { LogoMark } from "@/components/icons";
import { HOME_PATH } from "@/lib/routes";
import { SESSION_LENGTH } from "@/lib/sounds";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import heroImage from "../../public/landing/parent-and-child.webp";

export const metadata: Metadata = {
  title: "Chatterbox · At-home speech practice",
  description:
    "Your child names what’s in the picture. Chatterbox listens sound by sound and tracks how they’re doing, so practice between SLP visits really counts.",
};

async function isSignedIn() {
  if (!isSupabaseConfigured) return false;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

function AccountLinkView({ signedIn }: { signedIn: boolean }) {
  return (
    <Link
      href={signedIn ? HOME_PATH : "/login"}
      className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[15px] font-bold text-ink hover:bg-white/90 lg:min-h-11.5 lg:px-6 lg:text-base"
    >
      {signedIn ? "Dashboard" : "Log in"}
    </Link>
  );
}

// Reads the session cookie, so it streams in under <Suspense> and the rest of
// the landing page stays static. connection() keeps it out of prerendering.
async function AccountLink() {
  await connection();
  return <AccountLinkView signedIn={await isSignedIn()} />;
}

const STEPS = [
  {
    title: "Pick a target sound",
    body: "Choose the sound your child is working on with their SLP, like /r/ or /l/.",
  },
  {
    title: "Say what’s in the picture",
    body: `Your child taps the mic and names ${SESSION_LENGTH} pictures, one try each, with a cheer after every word. No pressure.`,
  },
  {
    title: "See their progress",
    body: "You see accuracy for each sound over time, plus the words your child finds hardest.",
  },
];

function Sparkle({ className, color }: { className: string; color: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`absolute ${className}`}>
      <path d="M12 1c.6 5.2 4.8 9.4 11 11-6.2 1.6-10.4 5.8-11 11-.6-5.2-4.8-9.4-11-11 6.2-1.6 10.4-5.8 11-11z" fill={color} />
    </svg>
  );
}

function SoundRow({ label, letter, rest, ipaLetter, ipaRest, highlight }: {
  label: string;
  letter: string;
  rest: string;
  ipaLetter: string;
  ipaRest: string;
  highlight: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[14px] bg-card px-3.5 py-3 lg:gap-3 lg:rounded-[18px] lg:px-5 lg:py-4">
      <span className="text-[13px] font-bold text-muted-foreground lg:text-sm">{label}</span>
      <span className="font-heading text-[21px] font-semibold lg:text-2xl">
        <span className="rounded-md px-1.5 lg:rounded-lg" style={{ background: highlight }}>
          {letter}
        </span>
        {rest}
      </span>
      <span className="text-sm text-muted-foreground lg:text-[15px]">
        /<span className="font-bold text-foreground">{ipaLetter}</span>
        {ipaRest}/
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background p-3 lg:p-5">
      {/* Hero */}
      <section
        aria-label="Chatterbox"
        className="relative flex flex-col items-center overflow-hidden rounded-[28px] bg-[#5B62E8] text-white lg:rounded-[36px]"
      >
        {/* Concentric glow behind the photo */}
        <div aria-hidden className="absolute -bottom-75 left-1/2 size-160 -translate-x-1/2 rounded-full bg-[#646BEE] lg:-bottom-115 lg:size-260" />
        <div aria-hidden className="absolute -bottom-57.5 left-1/2 size-125 -translate-x-1/2 rounded-full bg-[#6E75F5] lg:-bottom-87.5 lg:size-205" />
        <div aria-hidden className="absolute -bottom-40 left-1/2 size-90 -translate-x-1/2 rounded-full bg-brand lg:-bottom-60 lg:size-150" />
        <Sparkle color="#FFE8A3" className="top-140 right-5.5 size-7 lg:top-82.5 lg:right-[16%] lg:size-11" />
        <Sparkle color="#FFCDBB" className="top-155 left-6 size-4.5 lg:top-117.5 lg:left-[20%] lg:size-6.5" />
        <div aria-hidden className="absolute top-75 left-[13%] hidden size-4.5 rounded-full bg-sky lg:block" />

        <header className="relative flex w-full max-w-310 items-center justify-between gap-4 py-4 pr-4 pl-5 lg:px-9 lg:py-6">
          <Link href="/" aria-label="Chatterbox home" className="flex items-center gap-2 text-white lg:gap-2.5">
            <LogoMark tone="inverse" size={30} />
            <span className="font-display text-[21px] font-semibold lg:text-[25px]">Chatterbox</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-7">
            <a href="#how" className="hidden font-semibold text-white hover:underline lg:inline">
              How it works
            </a>
            <Suspense fallback={<AccountLinkView signedIn={false} />}>
              <AccountLink />
            </Suspense>
          </nav>
        </header>

        <div className="relative flex max-w-205 flex-col items-center gap-4 px-5.5 pt-7 text-center lg:gap-5 lg:px-6 lg:pt-12">
          <h1 className="font-display text-4xl leading-[1.1] font-semibold lg:text-6xl lg:leading-[1.08] lg:tracking-[-0.5px]">
            At-home speech practice, with progress you can see
          </h1>
          <p className="max-w-150 text-base leading-[1.55] lg:text-lg">
            Your child names what’s in the picture. Chatterbox listens sound by sound and tracks how they’re doing, so
            practice between SLP visits really counts.
          </p>
          <div className="mt-1.5 flex w-full flex-col items-center gap-3.5 lg:mt-2 lg:w-auto lg:flex-row lg:flex-wrap lg:justify-center lg:gap-x-6 lg:gap-y-3">
            <Link
              href="/signup"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white px-8 text-[17px] font-bold text-ink hover:bg-white/90 lg:w-auto"
            >
              Get started
              <ArrowRight className="size-4.5" strokeWidth={2.4} aria-hidden />
            </Link>
            <a href="#how" className="font-bold text-white underline-offset-4 hover:underline">
              See how it works
            </a>
          </div>
        </div>

        <Image
          src={heroImage}
          alt="A parent and young child sitting together, the child pointing at a laptop"
          priority
          sizes="(min-width: 1024px) 560px, 340px"
          className="relative mt-7 block h-auto w-85 max-w-[92%] lg:mt-9 lg:w-140"
        />
      </section>

      {/* How it works */}
      <section
        id="how"
        aria-labelledby="how-h"
        className="mx-auto flex max-w-280 scroll-mt-4 flex-col gap-8 px-2 pt-16 pb-14 lg:gap-12 lg:px-6 lg:pt-24 lg:pb-22"
      >
        <div className="flex flex-col items-center gap-2.5 text-center lg:gap-3">
          <span className="text-sm font-bold tracking-[0.6px] text-primary uppercase lg:text-[15px]">How it works</span>
          <h2 id="how-h" className="max-w-180 font-heading text-3xl leading-[1.15] font-semibold lg:text-[42px] lg:leading-[1.12]">
            Practice that feels like play. Progress you can actually see.
          </h2>
        </div>

        <ol className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:gap-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-2.5 rounded-[22px] bg-secondary p-5.5 lg:flex-[1_1_280px] lg:gap-3 lg:rounded-[26px] lg:p-7"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent font-heading text-lg font-semibold lg:size-11 lg:rounded-[14px] lg:text-xl">
                {i + 1}
              </span>
              <h3 className="mt-0.5 font-heading text-xl font-semibold lg:mt-1 lg:text-[22px]">{step.title}</h3>
              <p className="text-[15px] leading-[1.55] lg:text-base">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-6 rounded-[26px] border-2 border-secondary p-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-10 lg:rounded-[30px] lg:p-10">
          <div className="flex min-w-0 flex-col gap-3.5 lg:flex-[1_1_380px] lg:gap-4">
            <h3 className="font-heading text-[25px] leading-[1.15] font-semibold lg:text-3xl">
              Hears the sounds, not just the words
            </h3>
            <p className="text-[15px] leading-[1.6] lg:text-base">
              Regular speech recognition quietly fixes mistakes. It hears “wabbit” and writes “rabbit.” Chatterbox listens
              to each individual speech sound, so it can tell exactly which one was swapped, dropped, or added.
            </p>
            <ul className="mt-0.5 flex flex-wrap gap-2 lg:mt-1 lg:gap-2.5">
              {[
                { icon: Lock, text: "Audio is never stored" },
                { icon: Users, text: "Works alongside your child’s SLP" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex min-h-9.5 items-center gap-2 rounded-full bg-secondary px-3.5 text-[13px] font-bold lg:min-h-10 lg:px-4 lg:text-sm"
                >
                  <Icon className="size-4" strokeWidth={2.2} aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-muted-foreground lg:text-sm">
              Chatterbox is a practice companion, not a diagnostic tool.
            </p>
          </div>

          <figure
            aria-label="Example of how Chatterbox compares sounds"
            className="flex min-w-0 flex-col gap-2.5 rounded-[20px] bg-accent p-4.5 lg:flex-[1_1_340px] lg:gap-3.5 lg:rounded-3xl lg:p-7"
          >
            <SoundRow label="Expected" letter="r" rest="abbit" ipaLetter="ɹ" ipaRest="æbɪt" highlight="#FFE8A3" />
            <SoundRow label="Heard" letter="w" rest="abbit" ipaLetter="w" ipaRest="æbɪt" highlight="#FFCDBB" />
            <figcaption className="text-center text-sm font-bold lg:text-[15px]">/r/ was replaced with /w/</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
