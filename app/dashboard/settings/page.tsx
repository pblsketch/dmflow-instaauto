"use client"

import { useEffect, useState } from "react"
import { Save, Loader2, Check } from "lucide-react"
import { useInstagramSession } from "@/hooks/use-instagram-session"

const fields = [
    ["business_name", "상호명", "고객에게 보여줄 이름은 무엇인가요?"],
    ["business_description", "무엇을 하는 곳인지", "운영하는 곳과 주요 상품·서비스를 설명해 주세요."],
    ["services", "서비스와 가격", "서비스, 상품, 가격과 주요 정보를 적어 주세요."],
    ["hours_location", "영업시간과 위치", "영업시간, 위치, 배송 또는 서비스 지역을 적어 주세요."],
    ["policies", "정책", "예약, 환불, 취소, 결제 정책을 적어 주세요."],
    ["faq", "자주 묻는 질문", "고객이 자주 묻는 질문과 답변을 적어 주세요."],
] as const

export default function SettingsPage() {
    const { userId, isLoading: sessionLoading } = useInstagramSession()
    const [knowledge, setKnowledge] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (!userId) return
        fetch(`/api/business-profile?userId=${userId}`)
            .then((res) => res.json())
            .then((data) => setKnowledge(data.knowledge ?? {}))
            .finally(() => setLoading(false))
    }, [userId])

    const update = (key: string, value: string) => setKnowledge((current) => ({ ...current, [key]: value }))

    const save = async () => {
        if (!userId || saving) return
        setSaving(true)
        const res = await fetch("/api/business-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, knowledge }),
        })
        if (res.ok) {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
        setSaving(false)
    }

    if (sessionLoading || loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>

    return (
        <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8 lg:px-10">
            <div className="border-b border-border pb-7">
                <p className="text-sm text-muted-foreground">작업 공간 설정</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-foreground">설정</h1>
                <p className="mt-2 text-sm text-muted-foreground">더 정확한 자동 답장을 위해 비즈니스 정보를 입력해 주세요.</p>
            </div>
            <div className="mt-7 space-y-5 rounded-xl border border-border bg-card p-6">
                {fields.map(([key, label, placeholder]) => (
                    <label key={key} className="block space-y-2">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <textarea value={knowledge[key] ?? ""} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} rows={key === "business_name" ? 2 : 4} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </label>
                ))}
            </div>
            <button onClick={save} disabled={saving} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "저장됨" : "설정 저장"}
            </button>
        </div>
    )
}
