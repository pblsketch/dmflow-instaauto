const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const OPENAI_URL = "https://api.openai.com/v1/chat/completions"

function resolveEndpoint(userBaseUrl?: string | null): string {
  if (userBaseUrl) {
    // user stored a base URL like "https://api.quickaitool.com/v1" — append the completions path
    const base = userBaseUrl.replace(/\/+$/, "")
    return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`
  }
  return process.env.AI_BASE_URL || (process.env.GROQ_API_KEY ? GROQ_URL : OPENAI_URL)
}

export async function generateAIReply(
  userMessage: string,
  aiContext: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  userApiKey?: string | null,
  userBaseUrl?: string | null,
  userModel?: string | null,
): Promise<string | null> {
  const apiKey = userApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn("[ai-reply] No API key configured (GROQ_API_KEY or OPENAI_API_KEY)")
    return null
  }

  const endpoint = resolveEndpoint(userBaseUrl)
  const model = userModel || process.env.AI_MODEL || (process.env.GROQ_API_KEY ? "llama-3.1-8b-instant" : "gpt-4o-mini")

  const disclosure = process.env.AI_REPLY_DISCLOSURE?.trim()
  const identityRule = disclosure
    ? "do not claim to be a human when asked"
    : "never reveal you are AI"

  const systemPrompt = aiContext?.trim()
    ? `You are replying to Instagram DMs on behalf of this account: ${aiContext.trim()}\n\nRules: max 1 sentence, casual Instagram tone, no hashtags, no emojis unless natural, ${identityRule}. If you don't know something specific, say you'll get back to them.`
    : `You are replying to Instagram DMs. Keep replies to 1 short sentence. Casual tone. No hashtags. ${disclosure ? "Do not claim to be a human when asked." : "Never reveal you are AI."}`

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-10),
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error("[ai-reply] API error", res.status, errText.slice(0, 200))
      return null
    }
    const data = await res.json()
    const text: string | null = data.choices?.[0]?.message?.content?.trim() || null
    if (!text) return null
    return disclosure ? `${text} ${disclosure}` : text
  } catch (e) {
    console.error("[ai-reply] fetch error", e)
    return null
  }
}
