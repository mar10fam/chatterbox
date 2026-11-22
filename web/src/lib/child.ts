import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/** Has the signed-in parent added their child yet? (RLS scopes this to them.) */
export async function hasChild(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { count, error } = await supabase.from("children").select("id", { count: "exact", head: true });
  if (error) throw new Error(`Couldn't check for your child: ${error.message}`);
  return (count ?? 0) > 0;
}

export type Child = { id: string; name: string };

/**
 * The signed-in parent's child (one per parent for now), or null if they
 * haven't added one. Wrapped in React cache() so several components on the
 * same page share one query per request.
 */
export const getChild = cache(async (): Promise<Child | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("children").select("id, name").order("created_at").limit(1);
  if (error) throw new Error(`Couldn't load your child: ${error.message}`);
  return data[0] ?? null;
});
