"use client"

import { useState, useEffect } from "react"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type IceBreakerRow = { id?: string; question: string; response: string }

export function IceBreakersManager() {
    const { userId, isLoading } = useInstagramSession()
    const [breakers, setBreakers] = useState<IceBreakerRow[]>([])
    const [saving, setSaving] = useState(false)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!userId) return
        fetch(`/api/ice-breakers?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBreakers(data)
                setFetching(false)
            })
            .catch(err => {
                console.error(err)
                setFetching(false)
            })
    }, [userId])

    const handleAdd = () => {
        if (breakers.length >= 4) {
            toast.error("인스타그램은 아이스 브레이커를 최대 4개까지 허용합니다")
            return
        }
        setBreakers([...breakers, { question: "", response: "" }])
    }

    const handleChange = (index: number, field: "question" | "response", value: string) => {
        const newBreakers = [...breakers]
        newBreakers[index] = { ...newBreakers[index], [field]: value }
        setBreakers(newBreakers)
    }

    const handleRemove = (index: number) => {
        setBreakers(breakers.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!userId) return

        // Validation
        if (breakers.some(b => !b.question?.trim() || !b.response?.trim())) {
            toast.error("모든 항목을 입력해 주세요")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/ice-breakers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, iceBreakers: breakers })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("아이스 브레이커가 저장되고 동기화되었습니다!")
            } else {
                toast.error("저장에 실패했습니다")
            }
        } catch (e) {
            toast.error("저장 중 오류가 발생했습니다")
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) {
            return (
                <div className="p-10 flex justify-center">
                    <Loader2 className="animate-spin text-accent-yellow-foreground dark:text-accent-yellow" />
                </div>
            )
        }

        if (!userId) {
            return (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="text-center py-10 border border-border rounded-xl text-muted-foreground bg-card">
                        <p className="text-sm font-medium">연결되지 않음</p>
                        <p className="text-xs mt-1">아이스 브레이커를 관리하려면 인스타그램 계정을 연결하세요.</p>
                    </div>
                </div>
            )
        }

        if (fetching && !breakers.length) {
            return (
                <div className="p-10 flex justify-center">
                    <Loader2 className="animate-spin text-accent-yellow-foreground dark:text-accent-yellow" />
                </div>
            )
        }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">아이스 브레이커</h2>
                    <p className="text-muted-foreground text-sm">
                        대화를 시작할 때 사람들이 보게 되는 질문입니다.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-primary-foreground hover:opacity-90 font-bold"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    저장 및 동기화
                </Button>
            </div>

            <div className="space-y-4">
                {breakers.map((item, idx) => (
                    <div key={idx} className="bg-card border border-border p-4 rounded-xl space-y-3 relative group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground font-semibold uppercase">질문</label>
                                    <Input
                                        value={item.question}
                                        onChange={e => handleChange(idx, "question", e.target.value)}
                                        placeholder="예: 수업 자료 받을 수 있나요?"
                                        className="bg-background border-input mt-1 focus-visible:ring-ring"
                                        maxLength={80}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-semibold uppercase">자동 응답</label>
                                    <Textarea
                                        value={item.response}
                                        onChange={e => handleChange(idx, "response", e.target.value)}
                                        placeholder="사용자에게 보낼 답장을 입력하세요..."
                                        className="bg-background border-input mt-1 focus-visible:ring-ring"
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(idx)}
                                aria-label="아이스 브레이커 삭제"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {breakers.length === 0 && (
                    <div className="text-center py-10 border border-border rounded-xl text-muted-foreground bg-card">
                        아직 아이스 브레이커가 없습니다. 하나 추가해 보세요!
                    </div>
                )}

                {breakers.length < 4 && (
                    <Button
                        variant="outline"
                        onClick={handleAdd}
                        className="w-full border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="w-4 h-4 mr-2" /> 질문 추가
                    </Button>
                )}
            </div>

            <div className="bg-muted border border-border p-4 rounded-xl flex gap-3 text-sm text-foreground">
                <RefreshCw className="w-5 h-5 shrink-0 text-muted-foreground" />
                <p>
                    여기서 변경한 내용은 인스타그램 프로필에 자동으로 동기화됩니다. 모든 사용자에게 표시되기까지 몇 분 걸릴 수 있습니다.
                </p>
            </div>
        </div>
    )
}
