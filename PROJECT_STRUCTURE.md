# Recommended Monorepo Project Structure

This architecture uses independent UIs for Web/PWA, Ionic/Capacitor Mobile and Toss/TDS. Only domain/business logic, contracts, validation and reusable data-access patterns are shared. Tauri Desktop is optional.

문제 출제는 웹·토스·모바일 기기에서 `packages/core` 공통 엔진을 실행한다. Worker와 UI는 각 앱이 소유한다. 서버는 기기 배치를 공통 규칙으로 검증·등록하고 힌트·정답·보상을 처리한다. Ionic/Capacitor는 독립 홈·퀴즈·단어장·그림책·Android 뒤로가기를 구현했으며, 모바일 익명 인증·서버 힌트는 코드 구현 후 운영 연결·기기 통합 검증 대기다. 토스는 사용자 번들 업로드·확인 후 2026-10-23 최신본 검수 요청 완료, 결과 대기다. 세부 구현·검증 상태는 [모바일 README](apps/mobile/README.md)와 [진행 기록](progress.md), 구버전 서버 출제 호환은 [기기 출제 결정](docs/decisions/20261019-device-puzzle-generation.md)을 따른다.

작업 규칙은 [AGENTS.md](AGENTS.md), 제품 요구사항은 [crossword-project-spec.md](crossword-project-spec.md), 실제 구현·검증 현황은 [progress.md](progress.md)를 따른다. 아래 트리에는 향후 목표 디렉터리도 포함되며 모두 구현되었다는 뜻은 아니다.

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
│   │   │   ├── components/         # Web-only React/Tailwind UI
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
│   │   │   ├── components/         # Mobile-only Ionic UI
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
```

## Sharing Policy

| Concern | Shared? | Location |
|---|---|---|
| Domain rules, use cases | Yes | `packages/core` |
| Types, DTOs, repository interfaces, validation schemas | Yes | `packages/contracts` |
| Reusable Supabase repository code | Yes, with injected configuration | `packages/data` |
| Auth contract | Yes | `packages/contracts/ports` |
| Auth token/session implementation | No | `apps/*/src/adapters` |
| React components and styling | No | Each `apps/*` |
| Routing and navigation | No | Each `apps/*` |
| Browser, Capacitor, Toss, Tauri bridges | No | Each `apps/*/src/adapters` |
| Reading manuscripts, translations, source art and provenance | Platform-neutral source assets | `content/*` |
| Reading UI, routing, generated web metadata and WebP | No | `apps/web` |

`content/*` is an asset source directory, not a shared UI package. Other platforms may prepare assets from these sources but own their reading UI and navigation. The current conversion script prepares web assets only. Do not edit generated web JSON without updating the content source. Follow `AGENTS.md` sections 14–15 and each content README for vocabulary, copyright and review rules.

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
5. Implement independent `apps/mobile` Ionic UI reusing core use cases.
6. Implement independent `apps/toss` TDS UI, validating SDK constraints in the Toss environment.
7. Add Tauri desktop only if required.

**Note:** This document describes a target architecture, not a fully bootstrapped, runnable repository. Toss-specific config filenames and entry points must follow the SDK version selected during implementation.
