"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { addChild, type AddChildState } from "@/app/(auth)/welcome/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WelcomeForm() {
  const [state, action, pending] = useActionState<AddChildState, FormData>(addChild, {});

  return (
    <Card className="shadow-[0_1px_3px_rgba(48,54,80,0.08)] ring-0 lg:[--card-spacing:--spacing(8)]">
      <CardHeader className="gap-1.5">
        <CardTitle role="heading" aria-level={1} className="text-[28px] leading-[1.15] font-semibold lg:text-[28px]">
          Who’s practicing?
        </CardTitle>
        <CardDescription className="text-[15px]">
          Tell us your child’s first name. We’ll use it to cheer them on.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="font-bold">
              Child’s first name
            </Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={40}
              autoComplete="off"
              autoFocus
              defaultValue={state.name}
            />
          </div>

          {state.error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
