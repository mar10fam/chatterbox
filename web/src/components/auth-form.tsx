"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to see how practice is going.",
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "New to Chatterbox?",
    switchLink: { href: "/signup", label: "Create an account" },
    autoComplete: "current-password",
  },
  signup: {
    title: "Create your account",
    subtitle: "Track your child's at-home speech practice.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: { href: "/login", label: "Sign in" },
    autoComplete: "new-password",
  },
} as const;

const inputClass =
  "min-h-12 w-full rounded-[14px] border-2 border-sky bg-white px-4 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-brand";

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "login" | "signup";
  next?: string;
  initialError?: string;
}) {
  const copy = COPY[mode];
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? signIn : signUp,
    { error: initialError },
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">{copy.title}</h1>
        <p className="m-0 text-[15px] text-muted">{copy.subtitle}</p>
      </header>

      {state.message ? (
        <p role="status" className="m-0 rounded-[14px] bg-sky px-4 py-3 text-[15px] font-semibold">
          {state.message}
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.email}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={copy.autoComplete}
              className={inputClass}
            />
          </label>

          {state.error && (
            <p role="alert" className="m-0 text-sm font-semibold text-[#c2410c]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 min-h-12 cursor-pointer rounded-[14px] border-none bg-brand px-5 font-sans text-base font-bold text-white transition-colors hover:bg-brand-strong disabled:cursor-default disabled:opacity-70"
          >
            {pending ? copy.pending : copy.submit}
          </button>
        </form>
      )}

      <p className="m-0 text-[15px] text-muted">
        {copy.switchText}{" "}
        <Link href={copy.switchLink.href} className="font-bold text-ink hover:text-brand-strong">
          {copy.switchLink.label}
        </Link>
      </p>
    </div>
  );
}
