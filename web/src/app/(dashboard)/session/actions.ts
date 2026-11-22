"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddChildState = { error?: string };

/** Adds the signed-in parent's child (parent_id defaults to auth.uid()). One child per parent for now. */
export async function addChild(_prev: AddChildState, formData: FormData): Promise<AddChildState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter your child’s first name." };
  if (name.length > 40) return { error: "That name is a bit long. Try a first name." };

  const supabase = await createClient();
  const { count } = await supabase.from("children").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { error: "You’ve already added your child." };

  const { error } = await supabase.from("children").insert({ name });
  if (error) return { error: error.message };

  revalidatePath("/session");
  return {};
}
