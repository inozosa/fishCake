# 🐟 붕세권 — 내 주변 붕어빵 · 닭꼬치 · 포장마차 지도

내 주변 길거리 간식 가게가 **어디에 있는지**, **지금 영업 중인지**, **메뉴가 몇 개 남았는지**를 지도에서 한눈에 확인하는 웹앱입니다.

## 주요 기능

| 구분 | 기능 |
| --- | --- |
| 지도 (누구나) | 현재 위치 기준 반경 1/3/5/10km 안의 가게 표시 · 업종 필터(🐟 붕어빵 / 🍢 닭꼬치 / 🏮 포장마차) · 영업중만 보기 · 마커 색으로 상태 표시(초록 영업중 / 주황 전부 품절 / 회색 영업종료) · 마커 팝업과 목록에서 메뉴별 남은 수량 확인 · 30초마다 자동 새로고침 |
| 사장님 회원가입 `/signup/owner` | 계정 정보 + 가게 정보(업종, 이름, 지도에서 위치 찍기, 위치 설명, 영업시간, 소개)를 한 번에 등록. 업종별 기본 메뉴가 자동으로 생성됨 |
| 사장님 대시보드 `/owner` | 영업 시작/종료 버튼 · 메뉴별 수량 `−` `+` `+10` `품절` · 수량 직접 입력 · 메뉴 추가/수정/삭제 · "지금 위치로 가게 옮기기"(이동하는 노점용) · 가게 정보 수정 |
| 손님 회원가입 `/signup/customer` | 이메일, 비밀번호, 닉네임 |
| 손님 단골 가게 `/me` | 하트로 단골 등록 → 단골 가게들의 영업 여부·남은 수량을 모아 보기 |
| 손님 제보 (지도의 📢 버튼) | 사장님이 가입하지 않은 노점도 손님이 위치·업종·이름(선택)·메모를 제보. 지도에서는 **점선 테두리 + '제보' 태그**, 목록에서는 별도 섹션과 **'제보 위치 · 미인증'** 배지로 사장님 인증 가게와 구분. 수량·영업 여부는 표시하지 않음. 30m 안 같은 업종 중복 제보 차단, 하루 10건 제한, 내 제보 삭제 가능. 제보자 이름은 공개하지 않음 |

### 로그인 · 비밀번호 재설정 (Firebase Authentication)

- **이메일·비밀번호**와 **Google** 로그인 모두 Firebase Authentication이 처리해요. 비밀번호는 Firebase가 관리하고, 우리 DB에는 저장하지 않아요.
- 로그인 화면의 **"비밀번호를 잊으셨나요?" → 재설정 메일 보내기**를 누르면 비밀번호 재설정 링크가 담긴 붕어빵 메일이 가요. 링크에서 새 비밀번호를 정하면, 메일의 '계속' 버튼으로 로그인 화면에 돌아와요. 가입 여부가 드러나지 않도록 없는 이메일이어도 같은 안내를 보여줘요.
- 처음 로그인한 Firebase 계정이면 "손님으로 바로 시작 / 사장님으로 가입(가게 정보 입력)"을 고르게 해요.
- 서버는 브라우저가 보낸 Firebase ID 토큰을 Google 공개키로 검증한 뒤(`src/lib/firebase-verify.ts`) 자체 세션 쿠키로 로그인 처리해요. 그래서 서비스 계정 비밀 키가 필요 없어요.
- 같은 이메일이지만 다른 Firebase 계정인 회원에는 자동으로 연결하지 않아요(남의 이메일로 먼저 가입해 둔 사람이 진짜 주인과 같은 계정을 쓰는 것 방지).

**Firebase 설정 방법**
1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 만들어요.
2. **Authentication → Sign-in method**에서 **이메일/비밀번호**와 **Google**을 사용 설정해요.
3. **프로젝트 설정 → 내 앱 → 웹 앱 추가**로 나오는 `firebaseConfig`의 `apiKey`, `authDomain`, `projectId`, `appId`를 `.env.local`과 Vercel 환경 변수에 넣어요(`.env.example` 참고).
4. 배포 도메인은 **Authentication → 설정 → 승인된 도메인**에 추가해요(`localhost`는 기본 포함). 재설정 메일의 '계속' 버튼도 이 목록에 있는 주소로만 돌아올 수 있어요.
5. 재설정 메일은 Firebase 기본 메일 대신 **우리가 직접 보내요**(이 프로젝트는 Firebase 템플릿 수정이 막혀 있어서). 링크는 서비스 계정으로 Firebase REST API를 불러 만들고(`FIREBASE_SERVICE_ACCOUNT_KEY`, `src/lib/firebase-admin.ts`), 열쇠를 문 붕어빵 그림이 들어간 메일(`src/lib/emails/password-reset.ts`)을 Resend가 보내요(`RESEND_API_KEY`, `EMAIL_FROM`). 같은 이메일은 1시간에 3번, 같은 IP는 20번까지만 보낼 수 있어요. 그림은 Vercel Blob(`fishcake-assets`, 공개)에 있고 원본은 `email-templates/bungeoppang-key.svg`예요.

## 기술 스택

- **Next.js 16** (App Router, Route Handlers) + **Tailwind CSS 4**
- **Neon Postgres** (`@neondatabase/serverless` HTTP 드라이버) — Vercel Marketplace로 프로비저닝
- **Leaflet + OpenStreetMap** 지도 (API 키 불필요)
- 인증: **Firebase Authentication**(이메일·비밀번호, Google, 비밀번호 재설정 메일) → 서버에서 토큰 검증 후 httpOnly 세션 쿠키(DB에는 세션 토큰 해시만 저장)

## 실행 방법

```bash
npm install

# Vercel에 연결된 Neon의 DATABASE_URL을 .env.local로 받기
vercel env pull .env.local --yes
#  (Vercel 없이 쓰려면 .env.example을 참고해 .env.local에 DATABASE_URL을 직접 넣어도 됩니다)

npm run db:setup   # 테이블 생성 (여러 번 실행해도 안전). 빈 DB면 데모 데이터도 넣음
npm run dev        # http://localhost:3000
```

`npm run db:setup`은 `npm run build` 전에도 자동으로 실행돼서, Vercel에 배포할 때 스키마가 알아서 맞춰져요. 스키마는 `src/lib/schema.ts`에 있고, 모든 문장이 여러 번 실행해도 안전해요.
DB가 비어 있으면 서울시청 주변 데모 가게 9곳, 손님 제보 위치 3곳, 데모 계정이 들어가요.
데모 데이터를 원하지 않으면 환경 변수 `SEED_DEMO=false`를 설정하세요.

### 데모 계정 (비밀번호 모두 `demo1234`)

- 사장님: `owner1@example.com` ~ `owner9@example.com`
- 손님: `guest@example.com`

`npm run db:setup`이 데모 계정을 Firebase에 등록해요(이메일/비밀번호 로그인이 켜져 있어야 함). `example.com`은 메일이 실제로 가지 않는 예약 도메인이라, 데모 계정에 재설정 메일을 보내도 아무에게도 가지 않아요.

> 실제 서비스로 공개할 때는 데모 계정을 지우거나 `SEED_DEMO=false`로 시작하세요.

## 폴더 구조

```
src/
├─ app/
│  ├─ page.tsx                 지도 메인
│  ├─ login/                   로그인 (사장님·손님 공통)
│  ├─ signup/                  가입 유형 선택 → owner/ · customer/
│  ├─ owner/                   사장님 대시보드
│  ├─ me/                      손님 단골 가게
│  └─ api/
│     ├─ auth/signup           Firebase ID 토큰 + 가입 정보로 회원가입
│     ├─ auth/firebase         Firebase ID 토큰으로 로그인 (처음이면 가입 유형 선택 / 손님 바로 가입)
│     ├─ auth/password-reset   비밀번호 재설정 메일 발송 (Firebase 링크 + Resend)
│     ├─ auth/logout
│     ├─ me                    현재 로그인 사용자
│     ├─ stores                GET ?lat&lng&radius  주변 인증 가게(메뉴·수량) + 제보 위치
│     ├─ reports[/id]          POST 제보 (손님) / DELETE 내 제보 삭제
│     ├─ owner/store           GET/PATCH 내 가게 (영업 상태, 정보, 위치)
│     ├─ owner/menus[/id]      POST / PATCH(name, price, stock, delta) / DELETE
│     └─ favorites[/storeId]   단골 목록 / 등록 / 해제
├─ components/                 화면 컴포넌트 (map/ 은 Leaflet 지도)
└─ lib/
   ├─ db.ts                    Neon 연결
   ├─ schema.ts                테이블 정의 + migrate() (scripts/db-setup.ts에서 실행)
   ├─ stores.ts                가게 조회 쿼리
   ├─ reports.ts               제보 위치 조회·중복 확인
   ├─ auth.ts                  세션·권한 확인
   └─ seed.ts                  데모 데이터
```

## 배포 메모

- `vercel deploy`로 배포하면 Marketplace가 넣어 준 `DATABASE_URL`을 그대로 사용합니다.
- Neon DB가 싱가포르(sin1)에 있으므로 Vercel 함수 리전도 `sin1`로 맞추면 응답이 빨라집니다.
- OpenStreetMap 공용 타일은 트래픽이 많은 서비스에는 권장되지 않습니다. 사용자가 늘면 카카오맵/네이버 지도 API나 유료 타일 서비스로 교체하세요. 지도 코드는 `src/components/map/`에 모여 있습니다.
