// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them
// into the browser bundle — don't read them via a dynamic key.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export function getSupabaseEnv() {
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (or _PUBLISHABLE_KEY) in web/.env.local.",
    );
  }
  return { url, key };
}
