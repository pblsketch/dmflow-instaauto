# 📖 dmflow 설치 가이드 — 비개발자용

> **코딩을 몰라도 OK.** 이 문서를 위에서 아래로 순서대로 따라 하면 약 **30~40분** 안에
> 내 인스타그램 계정에서 자동 답장이 돌아갑니다.
>
> 어려운 용어가 나오면 [용어 사전](#부록-a-용어-사전)을 먼저 보고 오세요.

---

## 0. 준비물 체크리스트

시작 전에 아래 5개 계정을 준비하세요. **전부 무료**입니다.

| 준비물 | 왜 필요한가요? | 만드는 곳 |
|---|---|---|
| ☐ **인스타그램 계정** | 자동화를 돌릴 내 계정. **프로페셔널(비즈니스/크리에이터)** 이어야 함 | 인스타 앱 → 프로필 → ☰ → 계정 유형 및 도구 → 프로페셔널 계정으로 전환 (무료) |
| ☐ **Meta(페이스북) 개발자 계정** | 인스타 API를 쓰기 위한 "앱"을 만들 수 있는 자격 | [developers.facebook.com](https://developers.facebook.com) — 인스타와 연결된 페이스북 계정으로 로그인 |
| ☐ **Supabase 계정** | 대화·규칙·토큰이 저장될 **내 데이터베이스** | [supabase.com](https://supabase.com) — GitHub 계정으로 가입 가능 |
| ☐ **Vercel 계정** | 이 앱이 24시간 돌아갈 **내 서버** | [vercel.com](https://vercel.com) — GitHub 계정으로 가입 권장 |
| ☐ **GitHub 계정** | 코드 보관함. Vercel이 여기서 코드를 가져감 | [github.com](https://github.com) |

### 전체 순서 한눈에 보기

```txt
1. Supabase  → 데이터베이스 만들고 키 3개 복사
2. Meta 앱   → Instagram 앱 ID + 시크릿 확보
3. Vercel    → 배포! (환경변수 입력) → 내 주소 생김
4. Meta 앱   → 3번에서 생긴 주소를 redirect / 웹훅으로 등록
5. 인스타 연결 → 배포된 사이트에서 로그인
6. 자동화 만들고 테스트
```

> ⚠️ **순서가 중요합니다.** 4단계(Meta에 주소 등록)는 3단계(배포) 전에 할 수 없습니다.
> 배포 주소가 나와야 등록할 수 있기 때문이에요.

---

## 1단계. Supabase 데이터베이스 만들기 (~7분)

### 1-1. 가입 & 프로젝트 생성
1. [supabase.com](https://supabase.com) 로그인 → **New project**
2. 입력:
   - **Name**: `dmflow` (아무거나)
   - **Database Password**: 자동 생성된 비밀번호 → **어딘가에 저장** (앱에서는 안 쓰지만 나중에 필요할 수 있음)
   - **Region**: `Northeast Asia (Seoul)` 또는 가까운 곳
3. **Create new project** → 1~2분 기다림

### 1-2. 테이블 만들기 (schema.sql 실행)
1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **New query** 클릭
3. 이 저장소의 **`schema.sql`** 파일을 엽니다 (GitHub 저장소 → `schema.sql` 클릭 → 오른쪽 위 복사 아이콘)
4. 전체 내용을 붙여넣기 → **Run** (또는 `Ctrl+Enter`)
5. ✅ `Success. No rows returned` 가 나오면 성공

확인: 왼쪽 **Table Editor** 에서 테이블이 여러 개 보이면 OK.
(`users`, `conversations`, `messages`, `automations`, `media_cache`, `ice_breakers`, `unlock_attempts` 등 12개)

> 💡 schema.sql은 여러 번 실행해도 안전하게 만들어져 있습니다. 문제가 생기면 지우고 다시 Run 하세요.

### 1-3. 키 3개 복사해 두기
1. 왼쪽 아래 **⚙️ Settings** → **API Keys** (또는 **Data API**)
2. 아래 3개를 메모장에 복사해 둡니다 (3단계에서 사용):

| 복사할 것 | 이름 | 3단계에서 쓸 이름 |
|---|---|---|
| Project URL | `https://xxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public 키 | `eyJ...` 로 시작하는 긴 문자열 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** 키 | `eyJ...` 로 시작하는 긴 문자열 | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **service_role 키는 관리자 마스터 키입니다.** 절대 깃허브·블로그·질문글에 붙여넣지 마세요.
> (anon 키는 공개되어도 되는 키입니다.)

### 1-4. (권장) 오래된 데이터 자동 청소 예약
1. **Database → Extensions** 에서 `pg_cron` 검색 → **Enable**
2. **SQL Editor** 에서 아래 한 줄 실행:

```sql
SELECT cron.schedule('purge-unlock-attempts', '0 * * * *',
  $$DELETE FROM public.unlock_attempts WHERE updated_at < NOW() - INTERVAL '24 hours'$$);
```

> 이걸 안 해도 동작은 하지만, 팔로우 게이트 기록이 조금씩 쌓입니다. 개인용이면 나중에 해도 OK.

---

## 2단계. Meta(인스타그램) 개발자 앱 만들기 (~10분)

### 2-1. 개발자 등록 & 앱 만들기
1. [developers.facebook.com](https://developers.facebook.com) 접속 → 우측 상단 **시작하기/Log in** → 인스타그램과 연결된 **페이스북 계정**으로 로그인 (개발자 등록 안내가 나오면 따라 하기 — 무료)
2. **My Apps → Create App**
3. 앱 이름(예: `dmflow`)과 연락 이메일 입력
4. 사용 사례(use case) 화면이 나오면 **Instagram** 관련 항목을 선택
   (UI가 버전마다 조금씩 다릅니다. "Instagram"이 들어간 것을 고르세요)

### 2-2. Instagram 제품 추가 & 키 확보 ★중요★
1. 앱 대시보드 → **Add Product / 제품 추가** → **Instagram** 찾기 → **Set up** (설정)
2. **API setup with Instagram business login** (Instagram 비즈니스 로그인) 화면으로 이동
3. 이 화면에 있는 두 값을 메모:
   - **Instagram 앱 ID** → `NEXT_PUBLIC_INSTAGRAM_APP_ID` / `INSTAGRAM_APP_ID`
   - **Instagram 앱 시크릿** (옆의 "Show" 버튼) → `INSTAGRAM_APP_SECRET`

> ⚠️⚠️ **가장 흔한 실수**: `Settings → Basic` 에 있는 **"Meta 앱 ID / Meta 앱 시크릿"이 아닙니다!**
> 반드시 **Instagram 제품 화면의 "Instagram 앱 ID / Instagram 앱 시크릿"** 입니다.

### 2-3. 나중에 할 일 미리보기 (3~4단계에서 다시 옵니다)
- **Business login settings**: OAuth redirect URI 등록 (배포 후)
- **Webhooks**: Callback URL + Verify token 등록 (배포 후)

### 2-4. 개발 모드 안내
- 지금 만든 앱은 **개발 모드**입니다. **내(관리자) 계정은 바로 사용 가능**합니다.
- 다른 사람 계정까지 쓰게 하려면 Meta의 앱 검토(Live 전환)가 필요하지만, **개인용이라면 필요 없습니다.**

---

## 3단계. Vercel에 배포하기 (~10분)

### 3-1. 방법 A — Deploy 버튼 (추천)
1. 저장소의 README에서 **[Deploy with Vercel]** 버튼 클릭
2. Vercel 로그인 (GitHub로 가입 권장) → GitHub 연결 허용
3. 저장소 이름을 확인 (예: `dmflow`) → **Create**
4. **환경변수 입력 화면**이 나옵니다 → 아래 3-3 표의 값을 하나씩 붙여넣기
5. **Deploy** 클릭 → 2분 정도 기다리면 끝!

### 3-2. 방법 B — Fork 후 가져오기
1. GitHub에서 이 저장소 우측 상단 **Fork** 클릭
2. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** 에서 fork한 저장소 **Import**
3. 환경변수 입력 → **Deploy**

### 3-3. 환경변수 표 (그대로 따라 넣으세요)

| 변수 이름 | 어디서 가져오나요? | 값 예시 |
|---|---|---|
| `DASH_USER` | **내가 정함** — 대시보드 로그인 아이디 | `dmflow` |
| `DASH_PASS` | **내가 정함** — 대시보드 로그인 비밀번호 (길게!) | `MyStrongPass123!` |
| `NEXT_PUBLIC_SUPABASE_URL` | 1단계 Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1단계 anon 키 | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | 1단계 service_role 키 | `eyJ...` |
| `NEXT_PUBLIC_INSTAGRAM_APP_ID` | 2단계 Instagram 앱 ID | `1234567890` |
| `INSTAGRAM_APP_ID` | 위와 **같은 값** | `1234567890` |
| `INSTAGRAM_APP_SECRET` | 2단계 Instagram 앱 시크릿 | `abc123...` |
| `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI` | 아래 설명대로 조합 | `https://dmflow-홍길동.vercel.app/api/instagram/callback` |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | **내가 만듦** — 아무 긴 랜덤 문자열 | `dmflow-webhook-8f3k2p9x` |
| `META_APP_SECRET` | (선택) 나중에 웹훅 401 오류 시에만 | — |
| `GROQ_API_KEY` | (선택) AI 답장 원하면 [console.groq.com](https://console.groq.com) 에서 무료 발급 | `gsk_...` |
| `AGENT_API_KEY` | (선택) AI 에이전트 연동 안 하면 비워둠 | — |
| `PRIVACY_CONTACT_EMAIL` | (선택) /privacy 페이지 문의 이메일 | `me@example.com` |

**`NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI` 만드는 법:**
배포 후 받게 될 내 주소 + `/api/instagram/callback` 입니다.
예: 프로젝트 이름이 `dmflow-hong` 이면 → `https://dmflow-hong.vercel.app/api/instagram/callback`

> 💡 프로젝트 이름을 `dmflow-내닉네임` 처럼 **고유하게** 지으면 주소 충돌이 없어서 예측이 쉽습니다.

### 3-4. 배포 후 확인
1. Vercel 대시보드에서 내 프로젝트 → **도메인 주소 확인** (예: `https://dmflow-hong.vercel.app`)
2. 주소가 위에서 예상한 것과 **다르면**: Vercel → Settings → Environment Variables → `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI` 값을 실제 주소로 수정 → **Deployments → 최신 → Redeploy**
3. 브라우저에서 내 주소 접속 → **아이디/비밀번호 창**이 뜨면 `DASH_USER` / `DASH_PASS` 입력 → dmflow 랜딩 페이지가 보이면 성공 🎉

> ❌ `503 Auth not configured` 가 보이면 → `DASH_USER`/`DASH_PASS`가 입력되지 않은 것입니다. Vercel에서 추가 후 Redeploy.

---

## 4단계. Meta 앱에 배포 주소 등록하기 (~5분)

> 이 단계는 3단계에서 **배포가 끝나고 주소가 생긴 뒤에** 하세요.

### 4-1. 로그인 리다이렉트 주소 등록
1. Meta 앱 대시보드 → **Instagram → API setup with Instagram business login** 화면
2. **Business login settings** (비즈니스 로그인 설정) 열기
3. **OAuth redirect URI** 칸에 입력:
   ```txt
   https://내주소.vercel.app/api/instagram/callback
   ```
   → 💡 Vercel의 `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI` 와 **문자 단위로 똑같아야** 합니다 (https 포함, 끝 슬래시 없음).
4. **Save**

### 4-2. 웹훅(Webhooks) 등록
1. 같은 Instagram 화면에서 **Webhooks** (또는 Callback URL) 설정 열기
2. **Callback URL**:
   ```txt
   https://내주소.vercel.app/api/instagram/webhook
   ```
3. **Verify Token**: Vercel에 넣은 `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` 과 **완전히 같은 값**
4. **Verify and save** 클릭 → ✅ 체크가 뜨면 성공!
   - ❌ 실패하면: 앱이 실제로 배포됐는지(주소 접속 확인), 토큰 오타, 주소 오타를 확인하세요.
5. **구독 필드(subscribe fields)** 체크 — 아래 항목을 체크하세요:
   - ☑ `comments` (게시물 댓글)
   - ☑ `messages` (DM)
   - ☑ `messaging_postbacks` (버튼/아이스브레이커 응답)
   - ☑ `message_reactions` (이모지 반응)
   - ☑ `mentions` (스토리 멘션)
   - (보이는 항목을 전부 체크해도 됩니다)

### 4-3. 개인정보처리방침 URL 등록
1. Meta 앱 → **Settings → Basic** (앱 기본 설정)
2. **Privacy Policy URL**:
   ```txt
   https://내주소.vercel.app/privacy
   ```
   - 문의 이메일도 표시하고 싶다면 Vercel에 `PRIVACY_CONTACT_EMAIL` 추가(선택)
3. 저장

---

## 5단계. 인스타그램 계정 연결하기 (~3분)

1. 배포된 내 주소 접속 (예: `https://dmflow-hong.vercel.app`) → DASH 로그인
2. 가운데의 **`Instagram 연결하기`** 버튼 클릭
3. 인스타그램 로그인 화면 → **프로페셔널 계정으로 로그인** (이미 로그인돼 있으면 뜨는 계정 선택)
4. 권한 화면이 나오면 전부 **허용/승인**:
   - 프로필 기본 정보, 메시지 관리, 댓글 관리
5. 자동으로 대시보드로 돌아오고, 왼쪽 아래에 **@내계정** 과 "인스타그램 연결됨" 이 보이면 성공 🎉

> ❌ `Incorrect redirect_uri` 오류 → 4-1의 주소와 Vercel의 `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI` 가 다른 것입니다. 문자 단위로 비교하세요.
> ❌ 권한 화면이 이상하면 → 인스타 계정이 프로페셔널(비즈니스/크리에이터)인지 확인하세요.

---

## 6단계. 첫 자동화 만들기 (~5분)

왼쪽 메뉴 **자동 답장** 페이지에서 시작합니다. 페이지 상단 폼에서 바로 만들 수 있어요.

### 예시 1 — DM 키워드 자동 답장
| 항목 | 입력할 값 |
|---|---|
| 반응 대상 | `DM(다이렉트 메시지)` |
| 이런 말을 하면 | `가격` (쉼표로 여러 개: `가격, price, 얼마`) |
| 이 답장 보내기 | `안녕하세요! 가격 안내는 프로필 링크를 확인해 주세요 😊` |

→ **[답장 저장]** → "저장되어 활성화되었습니다" 메시지 확인.

### 예시 2 — 댓글 → DM 자동 발송 (자료 배포용)
| 항목 | 입력할 값 |
|---|---|
| 반응 대상 | `게시물 댓글` |
| 대상 게시물 | `모든 게시물` 또는 특정 게시물 선택 |
| 답장 방식 | `댓글 + DM` (공개 답글도 달고 DM도 보냄) |
| 공개 답글 문구 | `DM 보냈어요! 📥` (여러 개 넣으면 랜덤 순환) |
| 감지 키워드 | `자료` (비워두면 **모든 댓글**에 반응) |
| DM으로 보낼 내용 | `안녕하세요! 요청하신 자료 링크입니다 👉 https://...` |
| ☑ 팔로우 확인 후 보내기 | (선택) 팔로우한 사람에게만 자료 전달 |

→ **[답장 저장]**

### 예시 3 — 스토리 반응
| 항목 | 입력할 값 |
|---|---|
| 반응 대상 | `스토리 답장` |
| 이런 말을 하면 | `info` |
| 이 답장 보내기 | `안녕하세요! 자세한 내용은 DM으로 보내드릴게요 😊` |

### 그 밖에 알아두면 좋은 것
- **목록 관리**: 만든 규칙은 목록에서 `켜짐/일시중지` 토글, 연필(수정), 휴지통(삭제) 가능
- **수정(연필)** 을 누르면 3단계 마법사가 열립니다: `조건 → 답장 → 확인`
  - 답장 유형: 텍스트 / **카드(이미지+버튼)** / 미디어(이미지·영상 URL)
  - 버튼 카드, 빠른 답장, 랜덤 지연, "입력 중" 표시 등 고급 옵션 제공
- **AI 자동 답장**: 자동 답장 페이지 맨 아래 **`AI 도우미 설정`** → `AI 꺼짐 · 켜기` →
  - API 키 입력 (`gsk_...` — [console.groq.com](https://console.groq.com) 무료)
  - `도우미 설정` 에서 AI 기본 URL/모델 변경 가능(선택)
  - **설정 메뉴**에서 상호명·서비스·FAQ를 입력하면 AI 답변이 훨씬 정확해집니다
- **아이스 브레이커**: 메뉴 **아이스 브레이커** → 질문/답변 최대 4개 → 저장하면 인스타 프로필의 "대화 시작" 버튼에 자동 동기화
- **대화(인박스)**: 모든 DM을 한 화면에서 확인 + 직접 답장 (상대가 보낸 지 24시간 이내만 가능)

---

## 7단계. 테스트하기 (체크리스트)

> ⚠️ **반드시 다른 계정(가족/친구 계정)으로 테스트하세요.** 내 계정 → 내 계정 DM은 인스타가 이벤트를 보내주지 않습니다.

- ☐ 다른 계정에서 내 인스타로 `가격` DM 전송 → 자동 답장 도착
- ☐ 내 게시물 댓글에 `자료` 작성 → 공개 답글 + DM 도착
- ☐ 팔로우 게이트: 팔로우 안 한 계정 댓글 → "팔로우 했어요" 버튼 카드 수신 → 팔로우 후 버튼 탭 → 실제 내용 수신
- ☐ **대화** 메뉴에 방금 대화가 기록됨
- ☐ (AI 켠 경우) 아무 문장이나 DM → AI가 답장
- ☐ **인사이트** 메뉴에서 숫자 확인

**동작이 안 될 때 로그 보는 법**: Vercel 대시보드 → 내 프로젝트 → **Logs**(또는 Deployments → Functions) → 실시간 로그에서 `[webhook]` 으로 시작하는 줄 확인.

---

## 운영 팁

| 주제 | 내용 |
|---|---|
| **토큰 만료** | 인스타 액세스 토큰은 약 60일 후 만료됩니다. 답장이 멈추면 대시보드에서 **다시 인스타 연결**하면 됩니다 |
| **24시간 규칙** | DM 답장은 "상대가 마지막으로 보낸 뒤 24시간" 안에만 가능 (인스타 정책) |
| **댓글 비공개 답장** | 댓글 1개당 비공개 답장은 1회, 7일 이내에만 가능 (인스타 정책) |
| **비용** | Vercel·Supabase 무료 티어로 개인 계정 1개는 충분합니다 |
| **업데이트** | Fork 저장소라면 GitHub의 **Sync fork** 버튼 / Deploy 버튼으로 만든 저장소라면 최신 변경사항을 반영하면 Vercel이 자동 재배포 |
| **백업** | Supabase → Database → Backups 에서 확인 |
| **정책** | 스팸성 대량 발송은 인스타 정책 위반입니다. 사용자 행동에 반응하는 용도로만 쓰세요 |

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 접속 시 `503 Auth not configured` | `DASH_USER`/`DASH_PASS` 미설정 | Vercel → Settings → Environment Variables에 추가 → Redeploy |
| 아이디/비번 창에서 계속 틀렸다고 나옴 | DASH 값 오타 | Vercel 환경변수 다시 확인 |
| Meta 웹훅 `Verify and save` 실패 | verify token 불일치 / URL 오타 / 배포 미완료 | 토큰·주소 대조, 배포 상태 확인 |
| 로그인 시 `Incorrect redirect_uri` | Meta 등록 주소 ≠ Vercel env 값 | 문자 단위 비교 (https, 경로, 끝 슬래시) |
| 웹훅은 오는데 답장이 안 감 | 규칙 `일시중지` 상태 / 키워드 오타 / 특정 게시물 지정 문제 | 목록에서 `켜짐` 확인, 키워드 수정, 대상 게시물 재선택 |
| 며칠 뒤부터 답장이 멈춤 | 토큰 만료(60일) | 인스타 다시 연결 |
| 댓글엔 공개 답글이 달리는데 DM이 안 옴 | 인스타 제한(1회/7일) 또는 권한 문제 | 정책상 불가한 경우가 있음, 권한 재허용 |
| 웹훅 서명 검증 401 | 상위 Meta 앱 시크릿 필요 | `META_APP_SECRET` 에 Settings → Basic의 앱 시크릿 설정 |
| AI 답장이 안 됨 | API 키 미입력/오류 | 자동 답장 페이지 → AI 도우미 설정에서 키 확인 |
| Supabase에서 schema.sql 오류 | 일부만 붙여넣음 | 전체 복사 후 재실행 (여러 번 실행해도 안전) |

> 🧪 `DISABLE_WEBHOOK_SIGNATURE_CHECK=true` 라는 임시 디버그 옵션도 있지만 **테스트 후 반드시 제거**하세요. 보안이 약해집니다.

---

## 자주 묻는 질문 (FAQ)

**Q. 진짜 무료인가요?**
네. 이 앱은 내 Supabase + 내 Vercel에서 돌아갑니다. 두 서비스 모두 개인용으로는 무료 요금제로 충분합니다.

**Q. 컴퓨터를 24시간 켜둬야 하나요?**
아니요. 서버(Vercel)가 대신 돌아갑니다. 내 컴퓨터와 무관합니다.

**Q. 내 데이터와 인스타 토큰은 어디에 있나요?**
오직 내 Supabase 프로젝트에만 저장됩니다. 운영자(나)만 볼 수 있습니다.

**Q. 다른 사람도 내 앱을 쓸 수 있나요?**
이 앱은 **1인 1계정** 설계입니다 (본인 계정 자동화 도구). 다른 사람도 쓰게 하려면 그 사람도 이 저장소를 각자 배포(self-host)하는 방식이 맞습니다.

**Q. 계정이 정지될 위험은 없나요?**
공식 Instagram API만 사용하고, 사용자가 먼저 행동한 것(DM/댓글/스토리 반응)에만 답장합니다. 단, 스팸성 사용은 어느 도구든 정책 위반이 될 수 있으니 주의하세요.

**Q. 나중에 다른 인스타 계정으로 바꿀 수 있나요?**
연결을 해제하고 다시 연결하면 됩니다. 계정마다 각각 배포하는 것을 권장합니다.

---

## 보안 체크리스트 (꼭 지켜주세요)

- ☐ `SUPABASE_SERVICE_ROLE_KEY`, `INSTAGRAM_APP_SECRET` 는 **Vercel 환경변수에만** — 깃허브/블로그/질문글 금지
- ☐ `.env.local` 파일은 커밋 금지 (이 저장소는 이미 자동 제외 처리됨)
- ☐ 문제를 물어볼 때 토큰·키·비밀번호는 `***` 로 가리고 올리기
- ☐ `DASH_PASS` 는 충분히 길게 (12자 이상)

## 도움 받기

- 기능 문의/버그: 이 저장소의 **Issues** 탭 (⚠️ 토큰·키는 절대 붙여넣지 마세요!)
- 원본 오픈소스 프로젝트: [insta-p8](https://github.com/ayuuxh2/insta-p8)

---

## 부록 A. 용어 사전

| 용어 | 쉬운 설명 |
|---|---|
| **배포(Deploy)** | 내 코드를 인터넷 서버에 올려서 주소로 접속할 수 있게 만드는 것 |
| **환경변수** | 코드에 직접 쓰면 위험한 비밀값(비밀번호·키)을 앱에 안전하게 전달하는 설정값 |
| **웹훅(Webhook)** | "누가 댓글 달면 알려줘" 처럼 인스타가 내 앱에 실시간으로 보내주는 알림 |
| **저장소(Repository)** | 코드 보관함. GitHub에서 관리 |
| **토큰(Token)** | 앱이 내 인스타 계정을 대신 조작할 수 있게 해주는 열쇠 (주기적으로 만료됨) |
| **redirect URI** | 인스타 로그인 후 돌아올 내 앱 주소 |
| **Supabase** | 데이터베이스(데이터 저장소)를 무료로 제공해주는 서비스 |
| **Vercel** | 내 앱을 24시간 돌려주는 서버를 무료로 제공해주는 서비스 |

## 부록 B. 나중에 다시 쓸 명령어 (개발자용)

```bash
# 로컬 실행
npm install && npm run dev

# 최신 버전 반영 후 재배포 (클론한 경우)
git pull
# → GitHub에 push하면 Vercel이 자동 재배포
```
