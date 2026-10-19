import { NextResponse, type NextRequest } from "next/server"

// Basic-auth gate for the whole app (single operator).
// Public exceptions:
//  - /api/instagram/webhook  : Meta webhooks (guarded by verify token + HMAC signature)
//  - /api/instagram/callback : OAuth redirect target (GET only; POST stays protected)
//  - /privacy                : must be publicly reachable (Meta app platform requirement)
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/api/instagram/webhook") {
    return NextResponse.next()
  }
  if (pathname === "/api/instagram/callback" && request.method === "GET") {
    return NextResponse.next()
  }
  if (pathname === "/privacy") {
    return NextResponse.next()
  }
  if (pathname === "/agent-api") {
    return NextResponse.next()
  }

  // AI agent access (e.g. Meta Muse custom connector).
  // Lenient matching: accept the key with or without a "Bearer " prefix (any case),
  // ignore surrounding whitespace/newlines, and also accept common alternative
  // placements (x-api-key / apikey headers, ?api_key= query param).
  const agentKey = process.env.AGENT_API_KEY?.trim()
  const authorization = request.headers.get("authorization") || ""
  if (agentKey) {
    const bearerToken = authorization.replace(/^\s*bearer\s+/i, "").trim()
    const altToken =
      (request.headers.get("x-api-key") || request.headers.get("apikey") || "").trim() ||
      (request.nextUrl.searchParams.get("api_key") || "").trim()
    if (bearerToken === agentKey || altToken === agentKey) {
      return NextResponse.next()
    }
  }

  const user = process.env.DASH_USER
  const pass = process.env.DASH_PASS

  if (!user || !pass) {
    return new NextResponse("Auth not configured", { status: 503 })
  }

  const header = authorization
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6))
      const sep = decoded.indexOf(":")
      if (sep > 0 && decoded.slice(0, sep) === user && decoded.slice(sep + 1) === pass) {
        return NextResponse.next()
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="dmflow", charset="UTF-8"' },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
