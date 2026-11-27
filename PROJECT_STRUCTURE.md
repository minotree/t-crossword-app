# Recommended Monorepo Project Structure

This architecture shares platform-independent business logic and UI/UX across PWA, Android, iOS and Toss through actual common modules. Platform policies, required design systems, SDKs, native features and routing remain in app adapters. Tauri Desktop is optional.

현재 핵심 로직·데이터 공유 구조와 앱별 UI를 유지한다. `packages/ui`의 홈 본문·아이콘·응원 컴포넌트와 CSS가 PWA에 연결되어 있다. 상단바·하단 메뉴의 DOM·라우팅은 웹 어댑터가 담당한다. contracts·core·data·utils의 역할은 유지하고, 실제 수정·신규 개발 시 필요한 플랫폼 비종속 React 컴포넌트·디자인 토큰·아이콘·반응형 CSS를 가능한 범위에서 `packages/ui`로 공유한다. 단순 복제를 지양하며 React 18/19와 호환되도록 설계한다. 공통 UI는 Ionic·Capacitor·React Router·토스 SDK·TDS에 직접 의존하지 않고 데이터·동작·필수 플랫폼 렌더링을 props 또는 어댑터로 받는다. 라이브러리 버전은 일괄 변경하지 않는다.

점진적 공통화(B안)를 적용한다. 기존 핵심 로직·데이터 공통화 구조와 정상 기능·운영 안정성을 유지하며 기존 플랫폼 UI를 일괄 전환하지 않는다. 실제 수정하거나 신규 개발하는 화면부터 필요성이 확인된 플랫폼 비종속 UI/UX만 가능한 범위에서 공통 구현한다. 불필요한 추상화·과도한 컴포넌트 분리·대규모 리팩터링을 지양하고 공통 코드 변경 시 이를 사용하는 플랫폼의 영향을 검토한다.

현재 `packages/ui`는 `HomeScreen`, `HomeIcon`, `LearningEncouragement`와 디자인 토큰·홈/응원 CSS를 제공한다. PWA 홈 본문은 `HomeScreen`에 연결됐고, 상단바·하단 메뉴는 공통 토큰·아이콘을 사용하는 `apps/web`의 어댑터(`AppLayout.tsx`, `styles/home.css`)로 구현되어 있다. 별도 공통 상단바·하단 메뉴 컴포넌트가 구현된 것은 아니다. PWA 퀴즈는 공통 응원 컴포넌트를 사용하며 퀴즈 배치·판 크기 측정·음성 재생은 웹 전용 구현을 유지한다. Android·토스는 기존 UI를 유지하며 `packages/ui`로 전환하지 않았다. 나머지 화면·플랫폼은 실제 수정 필요성이 생길 때만 공통화하고 향후 iOS에서도 필요한 범위를 재사용한다.

문제 출제는 웹·토스·모바일 기기에서 `packages/core` 공통 엔진을 실행한다. 현재 Worker와 UI 연결은 각 앱에 있으며 플랫폼 비종속 UI는 단계적으로 공통화한다. 2026-10-25 글자 공개·힌트 잔액·완성 보상 제거 후 새 앱은 힌트 서버 인증·판 등록·정답 API를 호출하지 않는다. 정답과 학습 기록은 기기에서 처리하며 기존 오답노트는 보존한다. 기존 API·데이터 패키지·DB 마이그레이션은 구버전 호환 이력으로 남기며 운영 DB 삭제·서버 종료는 수행하지 않았다. 전환 전 Ionic/Capacitor UI와 Android 뒤로가기 동작은 보존한다. 토스의 2026-10-23 검수 요청본은 변경 전 버전이며 최신 번들 적용·실기기 확인은 별도다. 세부 결과는 [진행 기록](progress.md), 기존 서버 구성은 [기기 출제 결정](docs/decisions/20261019-device-puzzle-generation.md)을 따른다.

작업 규칙은 [AGENTS.md](AGENTS.md), 제품 요구사항은 [crossword-project-spec.md](crossword-project-spec.md), 실제 구현·검증 현황은 [progress.md](progress.md)를 따른다. 아래 트리에는 향후 목표 디렉터리도 포함되며 모두 구현되었다는 뜻은 아니다.

토스 퍼즐 Worker는 메인에서 선별한 어휘를 메시지로 받아 공통 core 엔진을 실행한다. 어휘 JSON은 메인에만 포함하고 빌드 산출물은 앱·vendor·vocabulary 청크로 분리한다. 재현 가능한 크기 분석은 `node scripts/analyze-toss-bundle.mjs`를 사용한다.

```text
project-root/
├── AGENTS.md
├── PROJECT_STRUCTURE.md
├── .gitignore
├── .env.example
├── .aider.conf.yml
├── package.json
├── pnpm-lock.yaml                 # Generated after pnpm install
├── pnpm-workspace.yaml
├── tsconfig.base.json
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/                # Providers, router, composition root
│   │   │   ├── pages/              # Web/PWA screens
│   │   │   ├── components/         # Current web UI; target: shared UI composition and adapters
│   │   │   ├── hooks/              # Web presentation hooks
│   │   │   ├── adapters/           # Browser/session implementations
│   │   │   ├── data/               # Web-owned picture-book JSON and mapping
│   │   │   ├── styles/
│   │   │   └── main.tsx
│   │   ├── public/picture-books/   # Generated WebP reading cards
│   │   ├── tests/                  # Web tests, including reading navigation
│   │   ├── eslint.config.mjs
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── app/                # Ionic router, providers, composition root
│   │   │   ├── pages/              # Ionic screens
│   │   │   ├── components/         # Current mobile UI; target: shared UI with Ionic adapters
│   │   │   ├── hooks/
│   │   │   ├── adapters/           # Capacitor plugins, auth, storage
│   │   │   └── main.tsx
│   │   ├── android/                # Generated/configured as needed
│   │   ├── ios/                    # Generated/configured as needed
│   │   ├── capacitor.config.ts
│   │   └── package.json
│   │
│   ├── toss/
│   │   ├── apps-in-toss.config.ts # SDK 3.x appName, permissions and webBundleDir
│   │   ├── vite.config.ts         # Independent Vite + development-only mock tools
│   │   ├── README.md              # Run/build steps, implemented scope and pending integrations
│   │   ├── src/
│   │   │   ├── app/                # Toss navigation, providers, composition root
│   │   │   ├── pages/              # Toss-specific screens
│   │   │   ├── components/         # TDS UI
│   │   │   ├── hooks/
│   │   │   ├── adapters/           # Toss SDK, token/auth bridge
│   │   │   └── main.tsx            # TDS AIT Provider and Toss app composition root
│   │   ├── tests/                  # Storage and puzzle presentation regression tests
│   │   └── package.json
│   │
│   ├── toss-api/                  # Node/Edge handler, instance limits, round replay; CPU/SQL regression tests
│   └── desktop/                   # OPTIONAL: create only if needed
│       ├── src/
│       ├── src-tauri/
│       └── package.json
│
├── packages/
│   ├── contracts/
│   │   └── src/
│   │       ├── domain/            # Shared types / DTOs
│   │       ├── ports/             # Repository, auth, storage interfaces
│   │       ├── schemas/           # Input validation contracts
│   │       └── index.ts
│   ├── core/
│   │   └── src/
│   │       ├── domain/            # Entities and domain rules
│   │       ├── use-cases/         # Application business workflows
│   │       ├── services/          # Pure business services
│   │       ├── algorithms/        # Crossword generator
│   │       ├── assets/            # Generated vocab.json
│   │       ├── types/             # Existing domain model exports
│   │       ├── utils/             # Hint limit and other pure helpers
│   │       └── index.ts
│   ├── data/
│   │   └── src/
│   │       ├── supabaseClient.ts  # Existing configurable client factory
│   │       ├── hintManager.ts     # Existing hint data access
│   │       ├── repositories/      # Supabase repository implementations
│   │       ├── clients/           # Configurable client factories
│   │       ├── mappers/           # Database <-> domain mapping
│   │       └── index.ts
│   ├── utils/
│   │   └── src/
│   │       └── index.ts
│   ├── ui/                        # HomeScreen, HomeIcon, LearningEncouragement, tokens/CSS; PWA connected
│   └── config/                    # Shared TS/lint/tooling config
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── content/
│   ├── beginner-poems/           # poems.json, images, generation records, gallery
│   ├── intermediate-readings/    # books.json, images, records, validators, gallery
│   └── advanced-readings/        # Adult readings; same source/review responsibilities
├── words_completed.csv          # Vocabulary source
├── scripts/
│   ├── convert-vocab.mjs         # CSV -> core vocab.json
│   └── prepare-picture-books.py  # Content sources -> web JSON and WebP
└── docs/
    ├── lint.md
    ├── vercel-pwa.md
    ├── architecture/
    └── decisions/
```

## Dependency Direction

```text
apps/web ──────┐
apps/mobile ───┼──> packages/core ──────> packages/contracts
apps/toss ────┤          │                        ▲
apps/desktop ──┘          └─ uses ports             │
       │                                           │
       └──────────> packages/data ─────────────────┘
                       (Supabase implementations)

apps/* compose use cases with repository/auth/platform adapters.
packages/core does not import packages/data or any app SDK.
Current: apps/web -> packages/ui (home, icons, encouragement).
Future: other apps adopt shared UI only when needed; platform behavior uses props/adapters.
```

## Current PWA Composition (2026-11-28)

| 범위 | 실제 구현과 연결 |
| --- | --- |
| 공통 홈 본문·아이콘 | `packages/ui/src/home` → `apps/web/src/pages/HomePage.tsx` |
| 상단바·하단 메뉴 | 공통 토큰·`HomeIcon` + 웹 `AppLayout.tsx`, `styles/home.css`; 공통 바 컴포넌트는 없음 |
| 공통 학습 응원 | `packages/core/src/encouragement` 데이터·순환 → UI `LearningEncouragement` → 웹 `QuizPage.tsx`; 오디오는 웹 어댑터 |
| 퀴즈 반응형 | 웹 `styles/index.css`, `useQuizBoardSize.ts`, `CrosswordBoard.tsx`, 기존 `HintListSection.tsx`; 전체 퀴즈 공통화는 하지 않음 |
| PWA 캐시·복구 | 웹 `scripts/build-pwa.mjs`가 `dist/sw.js` 생성, `PwaStatus.tsx`가 등록·일반 업데이트 승인 처리 |

현재 로컬 구현과 운영 배포는 별개다. 자동 검사·사용자 브라우저 확인·실제 기기·운영 반영 범위는 [progress.md](progress.md)의 최신 기록에서 구분한다. Android·토스의 기존 UI·광고·네이티브 정책은 이번 PWA 공통화로 변경하지 않는다.

## Sharing Policy

| Concern | Shared? | Location |
|---|---|---|
| Domain rules, use cases | Yes | `packages/core` |
| Types, DTOs, repository interfaces, validation schemas | Yes | `packages/contracts` |
| Reusable Supabase repository code | Yes, with injected configuration | `packages/data` |
| Auth contract | Yes | `packages/contracts/ports` |
| Auth token/session implementation | No | `apps/*/src/adapters` |
| Platform-independent React UI, tokens, icons and responsive CSS | As needed; home/encouragement components and CSS used by PWA | `packages/ui` |
| Required platform presentation and adapters | No | Each `apps/*` |
| Routing and navigation | No | Each `apps/*` |
| Browser, Capacitor, Toss, Tauri bridges | No | Each `apps/*/src/adapters` |
| Reading manuscripts, translations, source art and provenance | Platform-neutral source assets | `content/*` |
| Platform-independent reading UI | Only when reading UI changes require sharing | `packages/ui` |
| Reading routing, generated web metadata and WebP | Platform-specific | Corresponding app |

`content/*` is an asset source directory, not a shared UI package. Other platforms may prepare assets from these sources; platform-independent reading UI may be shared while navigation remains app-specific. The current conversion script prepares web assets only. Do not edit generated web JSON without updating the content source. Follow `AGENTS.md` sections 14–15 and each content README for vocabulary, copyright and review rules.

## pnpm Workspace Baseline

`pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Use `workspace:*` for internal package dependencies and expose package public APIs through `exports`. Each app should have independent `dev`, `build`, `typecheck`, `lint` and `test` scripts where applicable. Add scripts only when their tools are installed and configured.

## AI Tool Setup

- Aider: configure `.aider.conf.yml` with `read: [AGENTS.md]`, or pass `--read AGENTS.md` explicitly.
- The repository's Aider read list also includes this structure document, the product specification and progress document. This records configuration intent; confirm loading in the actual tool session.
- Antigravity: configure the tool/version-specific project instruction mechanism to load `AGENTS.md`; verify actual behavior before relying on automatic loading.
- No Claude Code configuration is required.

## Initial Build Order

1. Initialize pnpm workspace and TypeScript baseline.
2. Create `contracts` and `core`, including tests.
3. Create `data` with Supabase repository implementations and dependency injection.
4. Build `apps/web` as the first vertical slice.
5. Prioritize shared PWA home implementation and integration; preserve existing Android UI.
6. Consider mobile/Toss sharing only when actual screen changes require it, using platform adapters and reviewing affected consumers; reuse for iOS as needed.
7. Add Tauri desktop only if required.

**Note:** This document describes a target architecture, not a fully bootstrapped, runnable repository. Toss-specific config filenames and entry points must follow the SDK version selected during implementation.
