"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasChild } from "@/lib/child";
import { createClient } from "@/lib/supabase/server";
import { HOME_PATH, WELCOME_PATH } from "@/lib/routes";

export type AuthState = { error?: string; message?: string; email?: string };

// Only allow redirects to paths on this site.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : HOME_PATH;
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, email };

  revalidatePath("/", "layout");
  // First time in (no child yet)? Ask for the child's name before anything else.
  redirect((await hasChild(supabase)) ? safeNext(formData.get("next")) : WELCOME_PATH);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password.", email };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", email };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${WELCOME_PATH}` },
  });
  if (error) return { error: error.message, email };

  // Email confirmation off → signed in right away; next step is the child's name.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(WELCOME_PATH);
  }
  return { message: `Check ${email} for a link to confirm your account.`, email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
