import { type NextRequest, NextResponse } from "next/server"

/**
 * Public API documentation for AI agents (Meta Muse custom connector, MCP servers, etc.).
 * Served as markdown at GET /agent-api so an agent can read it and build an integration.
 * The API itself authenticates with the AGENT_API_KEY value (see middleware.ts)
 * via `Authorization: Bearer <key>`.
 */
const markdown = (base: string) => `# dmflow Agent API

dmflow is a personal Instagram automation service (auto-replies, comment-to-DM, follow gate).
Base URL: ${base}
Auth: send header \`Authorization: Bearer <API_KEY>\` on every request. (The API key is the value of the \`AGENT_API_KEY\` environment variable, provided by the account owner.)

This service is single-account. Resolve the account id once via GET /api/me and reuse \`userId\`.

## Endpoints

### GET /api/me
Returns the connected Instagram account.
Response: \`{ "userId": "<userId>", "username": "<username>", "businessAccountId": "...", "tokenExpiresAt": "..." }\`

### GET /api/automations?userId={userId}
List all auto-reply rules.
Each rule: \`{ id, name, trigger_source, trigger_type, trigger_value, specific_media_id, is_active, response_content }\`

### POST /api/automations
Create a rule. Body fields:
- userId (string, required)
- name (string) — internal label
- trigger_source: \`"dm" | "comment" | "story"\`
- trigger_type:
  - dm → \`"keyword"\`
  - comment → \`"keyword"\` or \`"reply_all"\` (reply_all = every comment on the target post/or all posts)
  - story → \`"reply" | "mention" | "reaction"\`
- trigger_value:
  - keywords, comma separated (e.g. \`"가격, price"\`) for keyword rules
  - \`"ALL_COMMENTS"\` for comment reply_all
  - \`"ALL_MENTIONS"\` / \`"ALL_REACTIONS"\` for story mention/reaction
- content (object):
  - message (string, required) — the DM text
  - check_follow (boolean, optional) — follow gate: send a "팔로우 했어요" button card first; the real message is delivered only after the user taps it and the follow is verified
  - reply_mode (comment only): \`"both" | "dm_only" | "public_only"\` — "both" also posts a public reply under the comment
  - public_replies (string[], comment only) — rotating public reply phrases, e.g. \`["DM 보냈어요! 📥"]\`
- specific_media_id (string|null) — restrict a comment rule to one post; omit/null = all posts (media ids come from GET /api/instagram/media)

Example — reply to EVERY comment on one post, with public reply:
\`\`\`json
{
  "userId": "<userId>",
  "name": "모든 댓글에 답장",
  "trigger_source": "comment",
  "trigger_type": "reply_all",
  "trigger_value": "ALL_COMMENTS",
  "content": { "message": "감사합니다! DM 확인해 주세요 😊", "reply_mode": "both", "public_replies": ["DM 보냈어요! 📥"] },
  "specific_media_id": "<media-id from GET /api/instagram/media>"
}
\`\`\`

Example — DM keyword with follow gate:
\`\`\`json
{
  "userId": "<userId>",
  "trigger_source": "dm",
  "trigger_type": "keyword",
  "trigger_value": "안녕",
  "content": { "message": "안녕하세요! 😊", "check_follow": true }
}
\`\`\`

### PATCH /api/automations
Pause/resume: body \`{ "id": "<ruleId>", "is_active": true|false }\`

### DELETE /api/automations?id={ruleId}
Delete a rule.

### GET /api/instagram/media?userId={userId}
Recent posts/reels: \`[{ id, caption, media_type, permalink, timestamp, image_url }]\`

### GET /api/inbox/conversations?userId={userId}
DM conversations: \`[{ id, recipient_id, recipient_username, last_message_at }]\` (read only — no message content here)

### GET /api/inbox/messages?conversationId={conversationId}
Messages of one conversation: \`[{ id, content, is_from_instagram, created_at }]\`
\`is_from_instagram: true\` = incoming from the other user; \`false\` = sent by the account (manual or automatic).

### POST /api/inbox/send
Send a manual DM. Body: \`{ "userId": "...", "recipientId": "<recipient_id from conversations>", "message": "..." }\`
Instagram only allows replies within 24h of the user's last message (requests folder messages may not be repliable). Expect failures outside the window.

### GET /api/dashboard/stats?userId={userId}
\`{ metrics: { totalAutomations, activeTriggers, messagesSent, audienceReached }, recentActivity: [...] }\`

### GET /api/ice-breakers?userId={userId}
List conversation starters: \`[{ id, question, response }]\`

### POST /api/ice-breakers
Replace ice breakers (max 4). Body: \`{ "userId": "...", "iceBreakers": [{ "question": "...", "response": "..." }] }\`

### GET /api/business-profile?userId={userId}
Business knowledge used by the AI assistant: \`{ knowledge: { business_name, business_description, services, hours_location, policies, faq } }\`

### PUT /api/business-profile
Body: \`{ "userId": "...", "knowledge": { "<key>": "<value>" } }\` (same keys as above)

## Behavior notes
- Instagram limits: one private reply per comment (within 7 days); DM replies within 24h of the user's last message.
- Rules fire automatically via webhooks; no polling needed on your side.
- Errors: non-2xx with JSON body; 401 = bad/missing API key.
`

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin
  return new NextResponse(markdown(base), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  })
}
