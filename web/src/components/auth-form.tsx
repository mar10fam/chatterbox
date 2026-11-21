"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleAlert, MailCheck } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="shadow-[0_1px_3px_rgba(48,54,80,0.08)] ring-0 lg:[--card-spacing:--spacing(8)]">
      <CardHeader className="gap-1.5">
        <CardTitle role="heading" aria-level={1} className="text-[28px] leading-[1.15] font-semibold lg:text-[28px]">
          {copy.title}
        </CardTitle>
        <CardDescription className="text-[15px]">{copy.subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        {state.message ? (
          <Alert className="border-none bg-accent">
            <MailCheck />
            <AlertDescription className="font-semibold text-accent-foreground">{state.message}</AlertDescription>
          </Alert>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            {next && <input type="hidden" name="next" value={next} />}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="font-bold">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={state.email}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="font-bold">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={copy.autoComplete}
              />
            </div>

            {state.error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
              {pending ? copy.pending : copy.submit}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="border-none bg-transparent pt-0 text-[15px] text-muted-foreground">
        <p>
          {copy.switchText}{" "}
          <Link href={copy.switchLink.href} className="font-bold text-foreground hover:text-primary">
            {copy.switchLink.label}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
