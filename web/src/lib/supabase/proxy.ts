import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";
import { HOME_PATH } from "@/lib/routes";

// Pages reachable without signing in ("/" is the landing page; exact match).
const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth"];
// Signed-in users skip these and go straight into the app. The landing page
// ("/") stays reachable so the logo in the app can link back to it.
const AUTH_PAGES = ["/login", "/signup"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Runs on every page request: refreshes the Supabase session cookie and
 * redirects signed-out users to /login (and signed-in users away from it).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Don't put code between createServerClient and getClaims(): it triggers the
  // token refresh. getClaims() also verifies the JWT, so it's safe for gating.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = "";
    if (path === "/login") target.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(target);
    // Keep any refreshed session cookies.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!signedIn && !matches(pathname, PUBLIC_PATHS)) return redirectTo("/login");
  if (signedIn && matches(pathname, AUTH_PAGES)) return redirectTo(HOME_PATH);

  return response;
}
