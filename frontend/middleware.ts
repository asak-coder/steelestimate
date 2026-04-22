import { NextRequest, NextResponse } from "next/server";

function getHostname(request: NextRequest): string {
  const hostHeader = request.headers.get("host") || "";
  return hostHeader.split(":")[0].toLowerCase();
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

function isAdminHost(hostname: string): boolean {
  return hostname === "admin.steelestimate.com";
}

function isPublicHost(hostname: string): boolean {
  return hostname === "steelestimate.com" || hostname.endsWith(".steelestimate.com");
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = getHostname(request);

  if (isLocalhost(hostname)) {
    return NextResponse.next();
  }

  if (isAdminHost(hostname)) {
    if (!pathname.startsWith("/admin")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.search = pathname === "/" && !search ? "" : `?next=${encodeURIComponent(`${pathname}${search}`)}`;
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (isPublicHost(hostname) && pathname.startsWith("/admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
