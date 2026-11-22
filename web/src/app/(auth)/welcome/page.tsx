import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { WelcomeForm } from "@/components/welcome-form";
import { hasChild } from "@/lib/child";
import { HOME_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Welcome · Chatterbox" };

// Parents who already added their child skip straight into the app.
async function WelcomeGate() {
  await connection();
  if (await hasChild(await createClient())) redirect(HOME_PATH);
  return <WelcomeForm />;
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeForm />}>
      <WelcomeGate />
    </Suspense>
  );
}
