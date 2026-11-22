"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasChild } from "@/lib/child";
import { HOME_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type AddChildState = { error?: string; name?: string };

/** Saves the parent's child (one per parent for now), then goes into the app. */
export async function addChild(_prev: AddChildState, formData: FormData): Promise<AddChildState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter your child’s first name." };
  if (name.length > 40) return { error: "That name is a bit long. Try a first name.", name };

  const supabase = await createClient();
  if (!(await hasChild(supabase))) {
    // parent_id defaults to auth.uid() in the database.
    const { error } = await supabase.from("children").insert({ name });
    if (error) return { error: error.message, name };
  }

  revalidatePath("/", "layout");
  redirect(HOME_PATH);
}
