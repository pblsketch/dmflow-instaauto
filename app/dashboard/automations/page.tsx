"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Loader2, Pencil, Search, Trash2 } from "lucide-react"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { QuickAutomationForm } from "@/components/dashboard/QuickAutomationForm"
import { AssistantSettings } from "@/components/dashboard/AssistantSettings"
import { CreateRuleForm } from "@/components/dashboard/CreateRuleForm"
import type { Automation } from "@/lib/types"

export default function AutomationsPage() {
  const { userId, isLoading: sessionLoading } = useInstagramSession()
  const [rules, setRules] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [edit, setEdit] = useState<Automation | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/automations?userId=${userId}`)
      const data = await response.json()
      if (!response.ok || !Array.isArray(data)) throw new Error()
      setRules(data)
      setError("")
    } catch { setError("자동 답장을 불러오지 못했습니다. 다시 시도해 주세요.") }
    finally { setLoading(false) }
  }, [userId])
  useEffect(() => { void refresh() }, [refresh])

  async function update(rule: Automation, remove = false) {
    if (busy) return
    setBusy(rule.id)
    try {
      const response = await fetch(remove ? `/api/automations?id=${rule.id}` : "/api/automations", {
        method: remove ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(remove ? {} : { body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }) }),
      })
      if (!response.ok) throw new Error()
      setRules(current => remove ? current.filter(item => item.id !== rule.id) : current.map(item => item.id === rule.id ? { ...item, is_active: !item.is_active } : item))
      setDeleting(null)
    } catch { setError("변경사항을 저장하지 못했습니다. 다시 시도해 주세요.") }
    finally { setBusy(null) }
  }

  if (sessionLoading) return <div className="p-8"><Loader2 className="size-5 animate-spin" /></div>
  if (!userId) return <p className="p-8 text-sm text-muted-foreground">자동화를 만들려면 인스타그램 계정을 연결하세요.</p>

  const filtered = rules.filter(rule => `${rule.name} ${rule.trigger_value} ${rule.response_content?.message || ""}`.toLowerCase().includes(query.toLowerCase()))
  const button = "rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  return <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
    <header className="mb-8 flex items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">자동 답장</h1><p className="mt-1.5 text-sm text-muted-foreground">키워드가 들어오면, 답장이 나갑니다.</p></div>
      <span className="pt-1 text-xs text-muted-foreground">{rules.filter(rule => rule.is_active).length}개 활성</span>
    </header>
    {edit ? <section>
      <button className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setEdit(null)}><ArrowLeft className="size-4" />자동 답장 목록으로</button>
      <CreateRuleForm key={edit.id} userId={userId} triggerSource={edit.trigger_source} editRule={edit} onSuccess={() => { setEdit(null); void refresh() }} />
    </section> : <>
      <QuickAutomationForm userId={userId} initialSource="dm" onSuccess={() => { setSaved(true); void refresh() }} />
      {saved && <p role="status" className="mt-3 text-xs text-muted-foreground">저장되어 활성화되었습니다. 위에서 답장을 더 추가할 수 있어요.</p>}
      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">내 답장 <span className="ml-1 text-muted-foreground">{rules.length}</span></h2>
          {rules.length > 0 && <label className="flex items-center gap-2 text-muted-foreground"><Search className="size-3.5" /><input aria-label="답장 검색" placeholder="키워드 찾기..." value={query} onChange={event => setQuery(event.target.value)} className="w-40 bg-background py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>}
        </div>
        {error && <div role="alert" className="mb-3 flex items-center justify-between text-sm"><span>{error}</span><button onClick={() => void refresh()} className="underline">다시 시도</button></div>}
        {loading ? <Loader2 className="my-8 size-5 animate-spin text-muted-foreground" /> :
          <div className="divide-y divide-border border-y border-border">
            {filtered.map(rule => <div key={rule.id} className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{rule.trigger_value}</p><p className="mt-1 truncate text-sm text-muted-foreground">{rule.response_content?.message || rule.response_content?.card?.title || rule.name}</p><p className="mt-1.5 text-xs text-muted-foreground">{rule.trigger_source === "dm" ? "DM" : rule.trigger_source === "comment" ? "게시물 댓글" : "스토리"}{rule.specific_media_id ? " · 선택한 게시물" : ""}</p></div>
              {deleting === rule.id ? <div className="flex items-center gap-2 text-xs"><span>이 답장을 삭제할까요?</span><button disabled={!!busy} onClick={() => void update(rule, true)} className="rounded-md bg-primary px-3 py-2 text-primary-foreground">삭제</button><button onClick={() => setDeleting(null)} className={button}>취소</button></div> :
                <div className="flex items-center gap-1">
                  <button disabled={!!busy} onClick={() => void update(rule)} aria-label={`${rule.is_active ? "일시중지" : "활성화"} ${rule.name}`} aria-pressed={rule.is_active} className="mr-2 flex min-w-16 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs">{busy === rule.id ? <Loader2 className="size-3 animate-spin" /> : <span className={`size-1.5 rounded-full ${rule.is_active ? "bg-foreground" : "bg-muted-foreground"}`} />}{rule.is_active ? "켜짐" : "일시중지"}</button>
                  <button onClick={() => setEdit(rule)} aria-label={`${rule.name} 수정`} className={button}><Pencil className="size-3.5" /></button>
                  <button onClick={() => setDeleting(rule.id)} aria-label={`${rule.name} 삭제`} className={button}><Trash2 className="size-3.5" /></button>
                </div>}
            </div>)}
            {!filtered.length && <p className="py-8 text-sm text-muted-foreground">{query ? "검색 결과가 없습니다." : "아직 답장이 없습니다. 위에서 첫 키워드와 답장을 추가해 보세요."}</p>}
          </div>}
      </section>
      <AssistantSettings userId={userId} />
    </>}
  </div>
}
