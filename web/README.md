# Chatterbox web app

Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui, with Supabase for
auth and data. Setup, env vars and how to run everything (including the Python
scorer) are in the [root README](../README.md).

```bash
npm run dev      # localhost:3000 (needs the scorer on :8000 for sessions)
npm run build    # production build; run before merging
npm run lint
```

## Routes

| Route | What it is | Who |
|---|---|---|
| `/` | Landing page | everyone (header shows "Dashboard" when signed in) |
| `/login`, `/signup` | Email + password. Sign-up creates an already-confirmed account (no email) and signs in. | signed out |
| `/welcome` | Asks for the child's first name (one child per parent) | signed in, no child yet |
| `/session` | Start a Session: pick /r/ or /l/ | signed in |
| `/practice/[sound]` | The session itself: 5 pictures, mic, cheer + ding, results screen | signed in |
| `/progress` | Accuracy chart + hardest words, filter with `?sound=r` or `?sound=l` | signed in |
| `/api/score` | Forwards a recording to the Python scorer (`SCORER_URL`) | signed in |
| `/auth/callback` | Email-link landing (only used if sign-up falls back to Supabase's emails) | |

`src/proxy.ts` (Next 16's name for middleware) refreshes the Supabase session
on every request, sends signed-out visitors to `/login`, and sends signed-in
users away from `/login` and `/signup`. Parents without a child are sent to
`/welcome` by the pages that need one (`src/lib/child.ts`).

## Where things live

| Path | |
|---|---|
| `src/app/(auth)/` | login, signup, welcome + their server actions |
| `src/app/(dashboard)/` | sidebar layout, `/session`, `/progress` |
| `src/app/(practice)/` | full-screen session route |
| `src/components/session/session-flow.tsx` | record → score → cheer → next → save → results |
| `src/lib/audio/` | mic recorder (→ 16 kHz WAV, live level for the mic ring) and the ding |
| `src/lib/supabase/` | `client.ts` (browser), `server.ts` (server components/actions), `proxy.ts`, `admin.ts` (secret key, server only) |
| `src/lib/sounds.ts` | sound labels and `SESSION_LENGTH` |
| `src/lib/routes.ts` | `HOME_PATH` (`/session`), `WELCOME_PATH` |
| `src/types/session.ts` | shared contract with the database (`AttemptResult`, view rows) |
| `src/types/database.ts` | generated Supabase types (`npm run db:types`) |
| `public/assets/{word}.png` | picture for each word; the filename must match the word id |
| `supabase/` | migrations and [`SCHEMA.md`](supabase/SCHEMA.md) |

## Conventions and gotchas

- **Cache Components is on** (`cacheComponents: true`). Anything that reads
  cookies, headers, search params or Supabase must sit inside `<Suspense>`,
  and call `await connection()` first (the Supabase client reads the clock,
  which Next forbids while prerendering). Without it, `npm run build` fails
  with "uncached or runtime data during prerendering". See `/session`,
  `/progress` and `/practice/[sound]` for the pattern.
- **Pages stay alive when you leave them.** Next hides visited pages with
  React `<Activity>` instead of unmounting them, so client state comes back.
  The session screen resets itself on hide (`useLayoutEffect` cleanup) and is
  keyed per visit. Do the same for anything that shouldn't be restored. See
  `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.
- **This Next.js has breaking changes** from older versions. Check the bundled
  docs in `node_modules/next/dist/docs/` (see `AGENTS.md`).
- **Styling:** use the theme tokens from `src/app/globals.css` (`bg-primary`,
  `text-muted-foreground`, `bg-card`, `chart-1` for /r/, `chart-2` for /l/)
  rather than hex values. Add shadcn components with
  `npx shadcn@latest add <name>`; they're copied into `src/components/ui/` and
  tuned to the design (bigger buttons and inputs, `Card variant="tinted"`,
  `Toggle variant="pill"`).
- **Secrets:** only `NEXT_PUBLIC_*` variables reach the browser. The secret key
  is used in `src/lib/supabase/admin.ts` and `scripts/seed.mjs` only.
- **Schema changes:** add a migration (`npx supabase migration new <name>`),
  `npm run db:push`, then `npm run db:types`, and update `src/types/session.ts`
  if the contract changed.
