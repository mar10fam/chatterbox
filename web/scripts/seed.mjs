// Seeds a test parent with two kids and ~4 weeks of fake practice sessions.
//
//   npm run seed         # test user + fake data (wipes only the test user's kids first)
//   npm run seed:user    # just create/reset the test user
//
// Needs in web/.env.local:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (or _PUBLISHABLE_KEY)
//   SUPABASE_SECRET_KEY (sb_secret_...) or legacy SUPABASE_SERVICE_ROLE_KEY
// The secret key bypasses all security rules: never prefix it with NEXT_PUBLIC_.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_USER_EMAIL ?? "parent@chatterbox.test";
const password = process.env.SEED_USER_PASSWORD ?? "chatterbox123";
const userOnly = process.argv.includes("--user-only");

if (!url || !publicKey || !secretKey) {
  console.error(
    "Missing env in web/.env.local: need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "and SUPABASE_SECRET_KEY.\nGet the secret key from Supabase → Project Settings → API Keys.",
  );
  process.exit(1);
}

const noSession = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, secretKey, noSession);

const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

// ─── 1. Test user ─────────────────────────────────────────────
async function ensureTestUser() {
  for (let page = 1; ; page++) {
    const { users } = must(await admin.auth.admin.listUsers({ page, perPage: 200 }), "list users");
    const hit = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) {
      must(await admin.auth.admin.updateUserById(hit.id, { password, email_confirm: true }), "reset user");
      console.log(`✓ Reset test user ${email}`);
      return hit.id;
    }
    if (users.length < 200) break;
  }
  const { user } = must(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Test Parent" },
    }),
    "create user",
  );
  console.log(`✓ Created test user ${email}`);
  return user.id;
}

const userId = await ensureTestUser();
if (userOnly) {
  console.log(`Sign in with: ${email} / ${password}`);
  process.exit(0);
}

// ─── 2. Sign in as the parent (exercises RLS like the real app) ───
const parent = createClient(url, publicKey, noSession);
must(await parent.auth.signInWithPassword({ email, password }), "sign in as test user");

must(await parent.from("children").delete().eq("parent_id", userId), "clear old children");
const kids = must(
  await parent.from("children").insert([{ name: "Maya" }, { name: "Leo" }]).select("id, name"),
  "create children",
);
const kidByName = Object.fromEntries(kids.map((k) => [k.name, k.id]));
console.log(`✓ Created children: ${kids.map((k) => k.name).join(", ")}`);

const words = must(await parent.from("words").select("id, sound, phonemes"), "load words");
const wordsBySound = { r: [], th: [] };
for (const w of words) wordsBySound[w.sound].push(w);

// ─── 3. Fake history ──────────────────────────────────────────
// Deterministic RNG so every seed run produces the same data.
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261121);
const between = (lo, hi) => lo + rand() * (hi - lo);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Some words are harder (clusters, medial/final positions), so the
// "Hardest words" list has a clear story.
const WORD_DIFFICULTY = {
  frog: -0.18, crab: -0.15, rhino: -0.12, reindeer: -0.1, parrot: -0.08, rat: 0.1, rabbit: 0.05,
  thrush: -0.2, three: -0.16, panther: -0.1, mammoth: -0.06, moth: 0.06, bath: 0.08, thumb: 0.04,
};
// Typical childhood substitutions: /ɹ/ → [w] ("wabbit"), /θ/ → [f] ("fumb").
const SUBSTITUTE = { ɹ: "w", ɚ: "ə", ɪɹ: "ɪə", θ: "f" };
const TARGET = { r: ["ɹ", "ɚ", "ɪɹ"], th: ["θ"] };

const PLANS = [
  // Maya alternates sounds; strong improvement on /r/, slower on /θ/.
  { child: "Maya", sounds: ["r", "th"], start: { r: 0.35, th: 0.3 }, gain: { r: 0.5, th: 0.35 }, days: 0.55 },
  // Leo practises only /r/ and is earlier in therapy.
  { child: "Leo", sounds: ["r"], start: { r: 0.25 }, gain: { r: 0.3 }, days: 0.4 },
];
const HISTORY_DAYS = 28;

function makeAttempts(sound, pCorrect) {
  return shuffle(wordsBySound[sound]).slice(0, 10).map((w, i) => {
    const p = Math.min(0.97, Math.max(0.05, pCorrect + (WORD_DIFFICULTY[w.id] ?? 0) + between(-0.08, 0.08)));
    const correct = rand() < p;
    const heard = correct
      ? [...w.phonemes]
      : w.phonemes.map((ph) => (TARGET[sound].includes(ph) ? SUBSTITUTE[ph] : ph));
    return {
      word_id: w.id,
      item_index: i + 1,
      target_phonemes: w.phonemes,
      heard_phonemes: heard,
      target_sound_correct: correct,
      score: Math.round(correct ? between(72, 100) : between(18, 62)),
    };
  });
}

const sessionRows = [];
const attemptRows = [];
const now = new Date();

for (const plan of PLANS) {
  let turn = 0;
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    if (rand() > plan.days) continue;
    const sound = plan.sounds[turn++ % plan.sounds.length];
    const progress = 1 - daysAgo / HISTORY_DAYS; // 0 → 1 over the period
    const pCorrect = plan.start[sound] + plan.gain[sound] * progress;

    const started = new Date(now);
    started.setUTCDate(started.getUTCDate() - daysAgo);
    started.setUTCHours(Math.floor(between(15, 23)), Math.floor(between(0, 60)), 0, 0);
    const completed = new Date(started.getTime() + between(4, 9) * 60_000);

    const id = crypto.randomUUID();
    sessionRows.push({
      id,
      child_id: kidByName[plan.child],
      sound,
      started_at: started.toISOString(),
      completed_at: completed.toISOString(),
    });
    for (const a of makeAttempts(sound, pCorrect)) attemptRows.push({ session_id: id, ...a });
  }
}

// Backdated rows go in with the admin client, since save_session always stamps
// completed_at = now().
must(await admin.from("sessions").insert(sessionRows), "insert sessions");
must(await admin.from("attempts").insert(attemptRows), "insert attempts");
console.log(`✓ Inserted ${sessionRows.length} past sessions (${attemptRows.length} attempts)`);

// ─── 4. Today's session through the real write path ────────────
const startedAt = new Date(now.getTime() - 6 * 60_000).toISOString();
const sessionId = must(
  await parent.rpc("save_session", {
    p_child_id: kidByName.Maya,
    p_sound: "r",
    p_started_at: startedAt,
    p_attempts: makeAttempts("r", 0.82),
  }),
  "save_session rpc",
);
console.log(`✓ save_session RPC saved today's session for Maya (${sessionId})`);

// ─── 5. Sanity check the views as the parent ──────────────────
const [sp, op, wd] = await Promise.all([
  parent.from("session_progress").select("*", { count: "exact", head: true }),
  parent.from("overall_progress").select("*", { count: "exact", head: true }),
  parent.from("word_difficulty").select("*", { count: "exact", head: true }),
]);
for (const [name, r] of [["session_progress", sp], ["overall_progress", op], ["word_difficulty", wd]]) {
  if (r.error) throw new Error(`${name}: ${r.error.message}`);
  console.log(`  ${name}: ${r.count} rows`);
}

console.log(`\nDone. Sign in with: ${email} / ${password}`);
