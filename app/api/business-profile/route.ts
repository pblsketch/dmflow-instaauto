import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

type Knowledge = Record<string, string>

function getSessionUserId(request: NextRequest): string | null {
    try {
        const raw = request.cookies.get("insta_session")?.value
        if (!raw) return null
        const session = JSON.parse(raw) as { userId?: string }
        return session.userId || null
    } catch {
        return null
    }
}

// AI agents (Muse custom connector, MCP, etc.) authenticate with the bearer key
// at the middleware layer instead of the browser session cookie.
function isAgentRequest(request: NextRequest): boolean {
    const key = process.env.AGENT_API_KEY?.trim()
    if (!key) return false
    const authz = (request.headers.get("authorization") || "").replace(/^\s*bearer\s+/i, "").trim()
    const alt = (request.headers.get("x-api-key") || request.headers.get("apikey") || "").trim()
    return authz === key || alt === key
}

export async function GET(request: NextRequest) {
    const sessionUserId = getSessionUserId(request)
    const requestedUserId = request.nextUrl.searchParams.get("userId")
    if (isAgentRequest(request)) {
        if (!requestedUserId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }
    } else if (!sessionUserId || !requestedUserId || sessionUserId !== requestedUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const effectiveUserId = sessionUserId || requestedUserId!

    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.from("users").select("ai_context").eq("id", effectiveUserId).single()
    if (error) return NextResponse.json({ error: "Failed to load business profile" }, { status: 500 })

    let knowledge: Knowledge = {}
    try {
        knowledge = data?.ai_context ? JSON.parse(data.ai_context) : {}
    } catch {
        knowledge = { business_description: data?.ai_context ?? "" }
    }
    return NextResponse.json({ knowledge })
}

export async function PUT(request: NextRequest) {
    const sessionUserId = getSessionUserId(request)
    const body = await request.json()
    const { userId, knowledge } = body as { userId?: string; knowledge?: Knowledge }
    const agent = isAgentRequest(request)
    const effectiveUserId = sessionUserId || (agent ? userId : null)
    if (!effectiveUserId || !userId || effectiveUserId !== userId || !knowledge || typeof knowledge !== "object" || Array.isArray(knowledge)) {
        return NextResponse.json({ error: "Unauthorized or invalid request" }, { status: 401 })
    }

    const sanitizedKnowledge = Object.fromEntries(
        Object.entries(knowledge)
            .filter(([key, value]) => typeof key === "string" && typeof value === "string")
            .map(([key, value]) => [key, value.trim().slice(0, 5000)]),
    )
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.from("users").update({ ai_context: JSON.stringify(sanitizedKnowledge) }).eq("id", effectiveUserId)
    if (error) return NextResponse.json({ error: "Failed to save business profile" }, { status: 500 })
    return NextResponse.json({ ok: true })
}
