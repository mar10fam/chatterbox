import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Forwards a recording to the Python scoring service (speech/server.py).
 * Only signed-in users can call it; the browser never talks to the scorer
 * directly, so the scorer needs no CORS or auth of its own.
 */
const SCORER_URL = process.env.SCORER_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const form = await request.formData();
  if (!(form.get("audio") instanceof Blob) || !form.get("word_id") || !form.get("target_phonemes")) {
    return NextResponse.json({ error: "Expected audio, word_id and target_phonemes" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SCORER_URL}/score`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json(
      { error: "The scoring service isn't reachable. Is it running? (uvicorn speech.server:app)" },
      { status: 503 },
    );
  }

  const body = await upstream.json().catch(() => ({ error: "Bad response from scoring service" }));
  return NextResponse.json(body, { status: upstream.ok ? 200 : upstream.status });
}
