# Recommended Monorepo Project Structure

This architecture uses independent UIs for Web/PWA, Ionic/Capacitor Mobile and Toss/TDS. Only domain/business logic, contracts, validation and reusable data-access patterns are shared. Tauri Desktop is optional.

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
│   │   │   ├── styles/
│   │   │   └── main.tsx
│   │   ├── public/
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
│   │   ├── src/
│   │   │   ├── app/                # Toss navigation, providers, composition root
│   │   │   ├── pages/              # Toss-specific screens
│   │   │   ├── components/         # TDS UI
│   │   │   ├── hooks/
│   │   │   ├── adapters/           # Toss SDK, token/auth bridge
│   │   │   └── main.tsx            # Adjust to actual Toss SDK tooling
│   │   └── package.json
│   │
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
│   │       └── index.ts
│   ├── data/
│   │   └── src/
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
├── scripts/
│   └── verify.mjs                # Optional future validation script
└── docs/
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
