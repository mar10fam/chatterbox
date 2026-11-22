"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, Play, UserPlus } from "lucide-react";
import { addChild, type AddChildState } from "@/app/(dashboard)/session/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SOUND_LIST } from "@/lib/sounds";
import type { Sound } from "@/types/session";

const CHECKLIST = [
  "Find a quiet spot so Chatterbox can hear clearly.",
  "Your browser will ask to use the microphone.",
  "Recordings are scored and then discarded. We never store your child’s audio.",
];

function AddChildCard() {
  const [state, action, pending] = useActionState<AddChildState, FormData>(addChild, {});
  return (
    <Card variant="tinted" className="gap-3 rounded-[20px] lg:rounded-[22px]">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Who’s practicing?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="child-name" className="font-bold">
              Your child’s first name
            </Label>
            <Input id="child-name" name="name" required maxLength={40} autoComplete="off" />
          </div>
          <Button type="submit" size="lg" disabled={pending} className="rounded-full">
            <UserPlus aria-hidden />
            {pending ? "Adding…" : "Add child"}
          </Button>
        </form>
        {state.error && <p className="mt-2 text-sm font-semibold text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}

/** One child per parent for now. hasChild=false shows the "add your child" card. */
export function StartSessionForm({ hasChild }: { hasChild: boolean }) {
  const [sound, setSound] = useState<Sound>("r");
  const needsChild = !hasChild;

  return (
    <div className="flex flex-col gap-5.5 lg:gap-8">
      {needsChild && <AddChildCard />}

      <fieldset className="flex flex-col gap-3 lg:gap-3.5">
        <legend className="mb-3 font-heading text-lg font-medium lg:mb-3.5 lg:text-xl">Choose a target sound</legend>
        <RadioGroup
          value={sound}
          onValueChange={(v) => setSound(v as Sound)}
          className="flex gap-3 lg:flex-wrap lg:gap-4"
        >
          {SOUND_LIST.map((s) => (
            <Label
              key={s.id}
              htmlFor={`sound-${s.id}`}
              className="flex min-h-31 flex-1 cursor-pointer flex-col items-stretch justify-between gap-2.5 rounded-[20px] border-2 border-accent bg-card p-4 font-normal transition-colors hover:bg-accent/40 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-accent lg:min-h-37 lg:basis-65 lg:gap-3 lg:rounded-[22px] lg:px-5.5 lg:py-5"
            >
              <span className="flex items-start justify-between">
                <span className="font-heading text-4xl leading-none font-semibold lg:text-[44px]">{s.ipa}</span>
                <RadioGroupItem
                  id={`sound-${s.id}`}
                  value={s.id}
                  className="size-5.5 border-2 border-foreground/40 bg-card [&_[data-slot=radio-group-indicator]>span]:size-2.5"
                />
              </span>
              <span className="text-sm font-semibold lg:text-base">
                {s.examplePrefix} <strong className="font-extrabold">{s.exampleWord}</strong>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <Card variant="tinted" className="gap-2.5 rounded-[20px] [--card-spacing:--spacing(4.5)] lg:gap-3 lg:rounded-[22px] lg:py-5.5 lg:[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle role="heading" aria-level={2} className="text-[17px] lg:text-lg">
            Before you start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5 text-sm lg:text-[15px]">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-px size-4.5 shrink-0 text-primary lg:size-5" strokeWidth={2.4} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        {needsChild ? (
          <Button size="lg" disabled className="h-14 w-full rounded-full px-7 text-[17px] lg:h-13.5 lg:w-auto">
            <Play fill="currentColor" strokeWidth={0} aria-hidden />
            Add a child to start
          </Button>
        ) : (
          <Button
            asChild
            size="lg"
            className="h-14 w-full rounded-full px-7 text-[17px] lg:h-13.5 lg:w-auto [&_svg:not([class*='size-'])]:size-5"
          >
            <Link href={`/practice/${sound}`}>
              <Play fill="currentColor" strokeWidth={0} aria-hidden />
              Start session
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
