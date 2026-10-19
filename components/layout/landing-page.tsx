"use client"

import { useRouter } from "next/navigation"
import {
  Zap, MessageCircle, Sparkles, ArrowUpRight,
  Send, AtSign, Brain, Inbox, Lock, Terminal,
} from "lucide-react"

export function LandingPage() {
  const router = useRouter()

  const handleLogin = () => {
    // Instagram Business Login (Instagram API with Instagram Login). client_id must be the
    // Instagram app ID from the Instagram product page, not the parent Meta app ID.
    window.location.href = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments`
  }

  const handleTestLogin = () => {
    localStorage.setItem("ig_user_id", "9999999999")
    localStorage.setItem("ig_username", "test_creator")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] selection:bg-[#ffe14d] selection:text-black overflow-x-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-serif-display { font-family: 'Instrument Serif', Georgia, serif; }
        .font-mono-ui { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 30s linear infinite; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up .7s cubic-bezier(.2,.7,.2,1) both; }
        .grain::before {
          content: ""; position: fixed; inset: 0; z-index: 5; pointer-events: none; opacity: .04;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="grain" />

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-5 md:px-10 h-16 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#ffe14d] text-black flex items-center justify-center rounded-[6px]">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="font-mono-ui text-sm font-bold tracking-tight">dmflow</span>
          <span className="hidden sm:inline-block font-mono-ui text-[10px] text-neutral-500 border border-white/10 rounded-full px-2 py-0.5">개인용</span>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={handleTestLogin}
              className="font-mono-ui text-xs font-bold text-[#ffe14d] border border-[#ffe14d]/30 rounded-full px-4 py-1.5 hover:bg-[#ffe14d]/10 transition-colors"
            >
              Dev Login
            </button>
          )}
          <button
            onClick={handleLogin}
            className="font-mono-ui text-xs font-bold bg-white text-black rounded-full px-4 py-1.5 hover:bg-[#ffe14d] transition-colors"
          >
            로그인
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="px-5 md:px-10 pt-16 md:pt-28 pb-16 max-w-6xl mx-auto">
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.25em] text-neutral-500 mb-6">
              Instagram 자동화 // 나만 쓰는 도구 // 월 비용 0원
            </p>
          </div>

          <h1 className="fade-up font-serif-display text-[15vw] md:text-[7.5rem] leading-[0.95] tracking-tight" style={{ animationDelay: "80ms" }}>
            내 DM은,
            <br />
            <span className="italic text-[#ffe14d]">알아서 답장.</span>
          </h1>

          <div className="fade-up mt-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-16" style={{ animationDelay: "160ms" }}>
            <p className="text-neutral-400 text-base md:text-lg max-w-md leading-relaxed">
              댓글 → DM 자동 발송, 키워드 자동 답장, 스토리 반응, AI 답장, 실시간 인박스까지.
              모든 데이터는 내 Supabase에만 저장됩니다.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLogin}
                className="group flex items-center gap-2 bg-[#ffe14d] text-black font-mono-ui text-sm font-bold px-7 py-4 rounded-full hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                Instagram 연결하기
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={handleTestLogin}
                  className="group flex items-center gap-2 font-mono-ui text-sm font-bold text-[#ffe14d] border border-[#ffe14d]/25 px-7 py-4 rounded-full hover:bg-[#ffe14d]/10 active:scale-[0.98] transition-all"
                >
                  <Terminal className="w-4 h-4" />
                  Dev Login
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="border-y border-white/[0.08] py-3 overflow-hidden">
          <div className="marquee-track flex whitespace-nowrap font-mono-ui text-xs uppercase tracking-[0.2em] text-neutral-600 gap-8 w-max">
            {Array.from({ length: 2 }).map((_, copy) => (
              <div key={copy} className="flex gap-8">
                {["댓글 → DM", "키워드 자동 답장", "스토리 반응", "AI 자동 답장", "실시간 인박스", "아이스 브레이커", "팔로우 확인", "빠른 답장", "미디어 첨부", "공개 + 비공개 답장"].map((t) => (
                  <span key={t} className="flex items-center gap-8">
                    {t} <span className="text-[#ffe14d]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <section className="px-5 md:px-10 py-20 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-serif-display text-4xl md:text-5xl">유료 도구가 하는 일, 전부.</h2>
            <span className="hidden md:block font-mono-ui text-xs text-neutral-600">월 0원</span>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08]">
            <Feature icon={<MessageCircle className="w-4 h-4" />} title="댓글 → DM 자동 발송"
              desc="게시물·릴스 댓글의 키워드를 감지해 DM을 보냅니다. DM만, 공개 답글만, 또는 둘 다 — 공개 답글은 여러 문구를 돌려가며 사용." />
            <Feature icon={<Send className="w-4 h-4" />} title="DM 키워드 자동 답장"
              desc="텍스트, 이미지, 버튼 카드로 자동 응답합니다. 빠른 답장 버튼으로 대화를 자연스럽게 이어가세요." />
            <Feature icon={<AtSign className="w-4 h-4" />} title="스토리 트리거"
              desc="스토리 멘션, 이모지 반응, 스토리 답장에 반응합니다. 이모지나 키워드로 필터링 가능." />
            <Feature icon={<Brain className="w-4 h-4" />} title="AI 자동 답장"
              desc="계정 정보(분야, 상품, 말투)를 알려주면 매칭되지 않은 DM도 사람처럼 답합니다." />
            <Feature icon={<Inbox className="w-4 h-4" />} title="실시간 인박스"
              desc="모든 대화를 한 화면에서. 언제든 직접 답장하고, 저장한 자동화로 빠른 답장을 보내세요." />
            <Feature icon={<Lock className="w-4 h-4" />} title="팔로우 확인"
              desc="팔로우한 사람에게만 콘텐츠를 보냅니다. 팔로우 안 한 사람에게는 안내 후, 팔로우하면 잠금 해제." />
            <Feature icon={<Sparkles className="w-4 h-4" />} title="자연스러운 발송"
              desc="입력 중 표시와 랜덤 지연으로 봇 느낌 없이 자연스럽게 답장합니다." />
            <Feature icon={<Terminal className="w-4 h-4" />} title="내 서버에서 직접"
              desc="Next.js + Supabase. 무료 요금제로 운영됩니다. 모든 코드를 확인하고, 데이터와 토큰을 직접 소유하세요." />
          </div>
        </section>

        {/* Quick guide */}
        <section className="px-5 md:px-10 pb-24 max-w-6xl mx-auto">
          <div className="border border-white/[0.08] rounded-2xl p-8 md:p-12 bg-gradient-to-br from-white/[0.03] to-transparent">
            <h3 className="font-serif-display text-3xl md:text-4xl mb-4">사용법은 간단합니다</h3>
            <ul className="text-neutral-400 text-sm leading-7 space-y-1">
              <li><span className="text-[#ffe14d]">1.</span> 위의 <b>Instagram 연결하기</b>로 계정을 연결합니다.</li>
              <li><span className="text-[#ffe14d]">2.</span> 대시보드 → <b>자동 답장</b>에서 키워드와 보낼 답장을 등록합니다.</li>
              <li><span className="text-[#ffe14d]">3.</span> 인스타에서 누군가 키워드를 댓글·DM으로 보내면 자동으로 답장이 나갑니다.</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-5 md:px-10 py-8 flex items-center justify-between gap-4">
        <span className="font-mono-ui text-[11px] text-neutral-600">
          dmflow — 개인용 Instagram 자동화 도구
        </span>
      </footer>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-[#0a0a0a] p-7 group hover:bg-[#0f0f0e] transition-colors">
      <div className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-neutral-500 group-hover:text-[#ffe14d] group-hover:border-[#ffe14d]/30 transition-colors mb-5">
        {icon}
      </div>
      <h3 className="font-mono-ui text-sm font-bold text-white mb-2">{title}</h3>
      <p className="text-[13px] text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  )
}
