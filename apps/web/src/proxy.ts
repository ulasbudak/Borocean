import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Story 14.6 — one canonical address. Search engines split ranking between duplicate
// hosts, so these permanently redirect to borocean.com. Preview deployments
// (*-<hash>.vercel.app) and localhost are left alone.
const CANONICAL_HOST = "borocean.com";
const REDIRECTED_HOSTS = new Set(["www.borocean.com", "web-three-kappa-87.vercel.app"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();
  if (host && REDIRECTED_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
