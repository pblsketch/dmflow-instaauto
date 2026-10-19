export default function PrivacyPage() {
  // 연락 이메일은 환경변수(PRIVACY_CONTACT_EMAIL)로 설정합니다.
  // 비워두면 플레이스홀더가 표시됩니다 — self-host 시 내 이메일을 넣으세요.
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL?.trim() || "your-email@example.com"

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">개인정보처리방침 / Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">최종 갱신: 2026년 10월 / Last updated: October 2026</p>

      <section className="space-y-4">
        <p>
          본 앱(&quot;dmflow&quot;)은 개인 운영자가 자신의 Instagram 프로페셔널 계정을 관리하기 위해 직접 운영하는
          개인용 도구입니다. Instagram Graph API를 사용하여 댓글·Direct 메시지 자동 답장 기능을 제공합니다.
        </p>
        <p className="text-sm text-muted-foreground">
          This app (&quot;dmflow&quot;) is a personal, self-operated tool for managing the operator&apos;s own Instagram
          professional account. It uses the Instagram Graph API for automated replies to comments and direct messages.
        </p>

        <h2 className="text-xl font-semibold mt-6">수집하는 데이터 / Data We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Instagram 프로필 정보 (사용자명, 이름, 프로필 사진)</li>
          <li>Instagram 콘텐츠 (게시물, 캡션, 댓글)</li>
          <li>메시지 및 대화 (자동 답장 기능 제공 목적)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">데이터 이용 목적 / How We Use Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>요청 시 Instagram 계정에 콘텐츠를 게시하기 위해</li>
          <li>메시지와 댓글에 자동으로 답장하기 위해</li>
          <li>계정 활동 통계를 표시하기 위해</li>
          <li>데이터를 제3자에게 판매하지 <strong>않습니다</strong></li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">데이터 보관 / Data Storage</h2>
        <p>
          Instagram 액세스 토큰과 프로필 데이터는 운영자의 데이터베이스(Supabase)에 안전하게 저장됩니다.
          언제든지 계정 연결을 해제할 수 있으며, 연결 해제 시 저장된 토큰이 삭제됩니다.
        </p>

        <h2 className="text-xl font-semibold mt-6">문의 / Contact</h2>
        <p>
          문의사항은 앱 대시보드를 통해 또는 이메일({contactEmail})로 연락해 주세요.
        </p>
      </section>
    </div>
  )
}
