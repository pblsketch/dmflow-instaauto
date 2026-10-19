"use client"

import { Activity, ArrowUpRight, BarChart3, MessageSquare, Users } from "lucide-react"

export default function AnalyticsPage() {
  return <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
    <header className="border-b border-border pb-7"><p className="text-sm text-muted-foreground">성과</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">인사이트</h1><p className="mt-2 text-sm text-muted-foreground">사람들이 자동 대화에 어떻게 반응하는지 확인하세요.</p></header>
    <div className="grid border-b border-border sm:grid-cols-3"><Metric label="대화" icon={MessageSquare} /><Metric label="도달한 사람" icon={Users} /><Metric label="응답률" icon={Activity} /></div>
    <section className="mt-7 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">기간별 성과</h2><p className="mt-1 text-xs text-muted-foreground">데이터가 쌓이면 대화 활동이 표시됩니다.</p></div><span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">최근 30일</span></div>
      <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-secondary"><BarChart3 className="size-5 text-muted-foreground" /></span><h3 className="mt-4 text-sm font-medium">인사이트를 준비 중입니다</h3><p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">자동화가 메시지를 보내기 시작하면 성과와 도달 추이가 여기에 표시됩니다.</p><a href="/dashboard/automations" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold">자동화 보기<ArrowUpRight className="size-3.5" /></a></div>
    </section>
  </div>
}

function Metric({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
  return <div className="border-border py-6 sm:border-r sm:px-6 first:pl-0 last:border-r-0"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon className="size-4 text-muted-foreground" /></div><p className="mt-3 text-3xl font-semibold">—</p></div>
}
