import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Has the signed-in parent added their child yet? (RLS scopes this to them.) */
export async function hasChild(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { count, error } = await supabase.from("children").select("id", { count: "exact", head: true });
  if (error) throw new Error(`Couldn't check for your child: ${error.message}`);
  return (count ?? 0) > 0;
}
