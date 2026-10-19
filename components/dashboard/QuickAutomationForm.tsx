"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import type { Automation } from "@/lib/types"
import { TagInput } from "@/components/ui/tag-input"

type Source = Automation["trigger_source"]
type CommentReplyMode = "both" | "public_only" | "dm_only"

interface MediaItem {
  id: string
  caption?: string
  media_type?: string
  image_url?: string
  timestamp?: string
}

const DEFAULT_PUBLIC_REPLIES = ["DM 보냈어요! 📥", "확인해 주세요! ✨", "메시지함을 확인해 주세요 💌"]

const MODE_LABELS: Record<CommentReplyMode, string> = {
  both: "댓글 + DM",
  public_only: "댓글(대댓글)만",
  dm_only: "DM만",
}

export function QuickAutomationForm({ userId, initialSource, onSuccess }: {
  userId: string
  initialSource: Source
  onSuccess: (source: Source) => void
}) {
  const [source, setSource] = useState<Source>(initialSource)
  const [keyword, setKeyword] = useState("")
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submitting = useRef(false)

  /* ---------- 옵션 ---------- */
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [postId, setPostId] = useState<string>("") // "" = 모든 게시물
  const [replyMode, setReplyMode] = useState<CommentReplyMode>("both")
  const [publicReplies, setPublicReplies] = useState<string[]>(DEFAULT_PUBLIC_REPLIES)
  const [followGate, setFollowGate] = useState(false)

  const field = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  useEffect(() => {
    if (source !== "comment" || !userId) return
    let cancelled = false
    setLoadingMedia(true)
    fetch(`/api/instagram/media?userId=${userId}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        const list = j.data && Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : []
        setMedia(list)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingMedia(false))
    return () => { cancelled = true }
  }, [source, userId])

  const keywordRequired = source === "dm" || source === "story"
  const dmIncluded = source !== "comment" || replyMode !== "public_only"
  const answerRequired = dmIncluded

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const kw = keyword.trim()
    if (submitting.current) return
    if (keywordRequired && !kw) return
    if (answerRequired && !answer.trim()) return
    submitting.current = true
    setSaving(true)
    setError("")

    const isReplyAll = source === "comment" && !kw
    const content: Record<string, unknown> = {}
    if (dmIncluded) content.message = answer.trim() || "감사합니다! 😊"
    if (followGate && dmIncluded) content.check_follow = true
    if (source === "comment") {
      content.reply_mode = replyMode
      if (replyMode !== "dm_only") {
        const cleaned = publicReplies.map((p) => p.trim()).filter(Boolean)
        content.public_replies = cleaned.length ? cleaned : DEFAULT_PUBLIC_REPLIES
      }
    }

    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: isReplyAll ? "모든 댓글에 답장" : `${kw} 자동답장`,
          trigger_source: source,
          trigger_type: isReplyAll ? "reply_all" : source === "story" ? "reply" : "keyword",
          trigger_value: isReplyAll ? "ALL_COMMENTS" : kw,
          content,
          specific_media_id: source === "comment" && postId ? postId : null,
        }),
      })
      if (!response.ok) throw new Error("Could not save. Please try again.")
      setKeyword("")
      setAnswer("")
      onSuccess(source)
    } catch {
      setError("저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.")
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  const kwLabel = keyword.trim()
  const modeText = replyMode === "both" ? "공개 답글(랜덤) + DM" : replyMode === "public_only" ? "공개 답글(랜덤)만" : "DM만"
  const summary = source === "comment"
    ? (kwLabel ? `"${kwLabel}" 댓글 → ${modeText}` : `모든 댓글 → ${modeText}`)
    : source === "story"
      ? "스토리 답장의 키워드와 일치하면 DM 발송"
      : "들어온 DM의 키워드와 일치하면 답장"

  return <form onSubmit={save} className="overflow-hidden rounded-xl border border-border bg-card">
    <fieldset disabled={saving} className="min-w-0">
      <label className="flex items-center gap-3 border-b border-border px-4 py-3"><span className="shrink-0 text-xs text-muted-foreground">반응 대상</span>
        <select value={source} onChange={event => setSource(event.target.value as Source)} className="rounded-md bg-card py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="dm">DM(다이렉트 메시지)</option><option value="comment">게시물 댓글</option><option value="story">스토리 답장</option>
        </select>
      </label>

      {source === "comment" && (
        <div className="border-b border-border px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">대상 게시물</span>
          <select value={postId} onChange={event => setPostId(event.target.value)} className={`${field} mt-2`}>
            <option value="">모든 게시물 (전체 적용)</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {(item.caption || item.id).slice(0, 40)}{item.media_type === "VIDEO" ? " (릴스)" : ""}
              </option>
            ))}
          </select>
          {loadingMedia && <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Loader2 className="size-3 animate-spin" />게시물 불러오는 중…</p>}
        </div>
      )}

      {source === "comment" && (
        <div className="border-b border-border px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">답장 방식</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(MODE_LABELS) as CommentReplyMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setReplyMode(mode)}
                className={`h-9 rounded-lg border text-xs font-medium transition-colors ${
                  replyMode === mode
                    ? "border-foreground bg-accent text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {replyMode === "both" && "댓글 아래에 공개 답글을 달고, 작성자에게 DM도 보냅니다."}
            {replyMode === "public_only" && "댓글 아래에 공개 답글만 달고, DM은 보내지 않습니다."}
            {replyMode === "dm_only" && "댓글 작성자에게 DM만 보내고, 공개 답글은 달지 않습니다."}
          </p>
        </div>
      )}

      {source === "comment" && replyMode !== "dm_only" && (
        <div className="border-b border-border px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">공개 답글 문구 (순환)</span>
          <p className="mt-1 text-[11px] text-muted-foreground">여러 개를 추가하면 그중 하나가 랜덤으로 댓글 아래에 달립니다.</p>
          <div className="mt-2">
            <TagInput value={publicReplies} onChange={setPublicReplies} placeholder='문구 입력 후 Enter (예: "DM 보냈어요! 📥")' />
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-[1fr_2fr]">
      <label className="block border-b border-border p-4 sm:border-b-0 sm:border-r"><span className="text-xs font-medium text-muted-foreground">{source === "comment" ? "감지 키워드 (선택)" : "이런 말을 하면"}</span>
        <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder={source === "comment" ? "비워두면 모든 댓글" : "예: 가격"} className="mt-2 w-full rounded-sm bg-card py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>
      {dmIncluded ? (
        <label className="block p-4"><span className="text-xs font-medium text-muted-foreground">{source === "comment" ? "DM으로 보낼 내용" : "이 답장 보내기"}</span>
          <textarea required maxLength={1000} rows={3} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="가격은 3만 원부터입니다. 여기에서 확인해 주세요…" className="mt-2 w-full resize-y rounded-sm bg-card py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
      ) : (
        <div className="flex items-center p-4 text-xs text-muted-foreground">공개 답글만 사용합니다 — DM 내용은 필요하지 않아요.</div>
      )}
      </div>

      {source !== "story" && dmIncluded && (
        <div className="border-t border-border px-4 py-3">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={followGate} onChange={event => setFollowGate(event.target.checked)} className="size-3.5 accent-current" />
            팔로우 확인 후 보내기 — "팔로우 했어요" 버튼을 먼저 보내고, 팔로워만 실제 DM을 받습니다
          </label>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">{summary}</p>
      <button disabled={saving || (answerRequired && !answer.trim()) || (keywordRequired && !keyword.trim())} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {saving && <Loader2 className="size-4 animate-spin" />}{saving ? "저장 중…" : "답장 저장"}
      </button>
      </div>
      {error && <p role="alert" className="px-4 pb-3 text-sm text-destructive">{error}</p>}
    </fieldset>
  </form>
}
