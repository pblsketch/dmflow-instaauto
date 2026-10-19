"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Trash2, Globe, Instagram, Zap, ArrowRight, Lock, MessageCircle, Send,
  Pencil, Copy, Image as ImageIcon, Megaphone, EyeOff, Timer,
} from "lucide-react"
import type { Automation } from "@/lib/types"
import { toast } from "sonner"

interface AutomationListProps {
  automations: Automation[]
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onChanged: () => void
  userId: string
}

export function AutomationList({ automations, onDelete, onEdit, onChanged, userId }: AutomationListProps) {
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({})

  const globalRules = automations.filter((rule) => !rule.specific_media_id)
  const postSpecificRules = automations.filter((rule) => rule.specific_media_id)

  useEffect(() => {
    if (!userId || postSpecificRules.length === 0) return
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/instagram/media?userId=${userId}`)
        const data = await res.json()
        if (data.data && Array.isArray(data.data)) {
          const map: Record<string, string> = {}
          data.data.forEach((item: any) => { map[item.id] = item.thumbnail_url || item.media_url })
          setMediaMap(map)
        }
      } catch (e) { console.error("Failed to load thumbnails", e) }
    }
    fetchMedia()
  }, [userId, automations.length])

  const handleToggle = async (rule: Automation, active: boolean) => {
    const res = await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, is_active: active }),
    })
    if (res.ok) {
      toast.success(active ? "자동화를 켰습니다" : "자동화를 일시중지했습니다")
      onChanged()
    } else {
      toast.error("변경에 실패했습니다")
    }
  }

  const handleDuplicate = async (rule: Automation) => {
    const res = await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, action: "duplicate" }),
    })
    if (res.ok) {
      toast.success("복제되었습니다 — 복사본은 일시중지 상태로 시작합니다")
      onChanged()
    } else {
      toast.error("복제에 실패했습니다")
    }
  }

  if (automations.length === 0) {
    return (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-border bg-muted">
          <Zap className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">아직 자동화가 없습니다</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          위에서 첫 자동화를 만들어 보세요 — 30초면 됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Rules
          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-[10px]">
            {automations.length}
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {globalRules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-blue ml-1">
              <Globe className="w-3 h-3" /> 전체 적용
            </div>
            {globalRules.map((rule, idx) => (
              <RuleCard key={rule.id} rule={rule} onDelete={onDelete} onEdit={onEdit} onToggle={handleToggle} onDuplicate={handleDuplicate} index={idx} />
            ))}
          </div>
        )}

        {postSpecificRules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-pink ml-1">
              <Instagram className="w-3 h-3" /> 특정 게시물
            </div>
            {postSpecificRules.map((rule, idx) => (
              <RuleCard key={rule.id} rule={rule} onDelete={onDelete} onEdit={onEdit} onToggle={handleToggle} onDuplicate={handleDuplicate} index={idx} mediaUrl={mediaMap[rule.specific_media_id || ""]} isSpecific />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RuleCard({ rule, onDelete, onEdit, onToggle, onDuplicate, index, isSpecific, mediaUrl }: {
  rule: Automation
  onDelete: (id: string) => void
  onEdit: (rule: Automation) => void
  onToggle: (rule: Automation, active: boolean) => void
  onDuplicate: (rule: Automation) => void
  index: number
  isSpecific?: boolean
  mediaUrl?: string
}) {
  const [confirming, setConfirming] = useState(false)
  const keywords = rule.trigger_value.split(",").map(k => k.trim()).filter(Boolean)
  const content: any = rule.response_content || {}
  const isCard = !!content.card
  const isMedia = !!content.media
  const responsePreview = isCard
    ? content.card.title
    : isMedia
      ? `${content.media.type} 첨부`
      : (content.message?.slice(0, 50) || "") + (content.message?.length > 50 ? "..." : "")

  const replyMode = content.reply_mode
  const isPaused = rule.is_active === false

  return (
    <div
      className={`group p-4 rounded-xl border transition-all duration-200 ${
        isPaused
          ? "border-border bg-muted opacity-70"
          : "border-border bg-card hover:bg-accent hover:border-foreground/20"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        {isSpecific ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
            {mediaUrl ? (
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Instagram className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-accent-blue/10 border border-accent-blue/30">
            <Globe className="w-4 h-4 text-accent-blue" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-foreground truncate">{rule.name}</h4>
            <div className="flex items-center gap-1 shrink-0">
              {confirming ? (
                <div className="flex items-center gap-1 animate-in fade-in">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onDelete(rule.id)}
                    className="h-7 text-xs bg-destructive text-destructive-foreground hover:opacity-90"
                  >
                    삭제
                  </Button>
                </div>
              ) : (
                <>
                  {/* Edit / Duplicate / Delete are ALWAYS visible (no hover reveal) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(rule)}
                    title="수정"
                    aria-label={`${rule.name} 수정`}
                    className="h-7 w-7 text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDuplicate(rule)}
                    title="복제"
                    aria-label={`${rule.name} 복제`}
                    className="h-7 w-7 text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirming(true)}
                    title="삭제"
                    aria-label={`${rule.name} 삭제`}
                    className="h-7 w-7 text-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Switch
                    checked={!isPaused}
                    onCheckedChange={(v) => onToggle(rule, v)}
                    aria-label={isPaused ? "자동화 재개" : "자동화 일시중지"}
                    title={isPaused ? "자동화 재개" : "자동화 일시중지"}
                    className="ml-1 scale-90"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {keywords.slice(0, 3).map((kw, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground border border-border text-[10px] font-mono-ui px-1.5 py-0"
                >
                  {kw}
                </Badge>
              ))}
              {keywords.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{keywords.length - 3}</span>
              )}
            </div>

            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />

            <div className="flex items-center gap-1.5">
              {isCard ? (
                <Send className="w-3 h-3 text-accent-blue" />
              ) : isMedia ? (
                <ImageIcon className="w-3 h-3 text-accent-pink" />
              ) : (
                <MessageCircle className="w-3 h-3 text-accent-yellow-foreground dark:text-accent-yellow" />
              )}
              <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{responsePreview}</span>
            </div>

            {replyMode === "dm_only" && (
              <Badge variant="secondary" className="bg-accent-blue/10 text-accent-blue border border-accent-blue/30 text-[10px] px-1.5 py-0">
                <EyeOff className="w-2.5 h-2.5 mr-0.5" /> DM 전용
              </Badge>
            )}
            {replyMode === "public_only" && (
              <Badge variant="secondary" className="bg-accent-pink/10 text-accent-pink border border-accent-pink/30 text-[10px] px-1.5 py-0">
                <Megaphone className="w-2.5 h-2.5 mr-0.5" /> 공개 답글만
              </Badge>
            )}
            {content.delay_seconds > 0 && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] px-1.5 py-0">
                <Timer className="w-2.5 h-2.5 mr-0.5" /> {content.delay_seconds}s
              </Badge>
            )}
            {content.check_follow && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] px-1.5 py-0">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> 팔로우 확인
              </Badge>
            )}
            {isPaused && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border text-[10px] px-1.5 py-0">
                일시중지
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
