import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

// Single-user helper: returns the connected Instagram account so tools/agents
// can resolve the userId used by the rest of the API without hardcoding it.
export async function GET(_request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, username, business_account_id, token_expires_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "No connected Instagram account" }, { status: 404 })
  }

  return NextResponse.json({
    userId: String(data.id),
    username: data.username,
    businessAccountId: data.business_account_id ? String(data.business_account_id) : null,
    tokenExpiresAt: data.token_expires_at,
  })
}
