# Project Instructions & AI Workflow Guidelines

> This file defines shared project rules for AI coding agents and human contributors. Project-specific placeholders must be filled before implementation. Tool-specific configuration must explicitly load this file when automatic discovery is not supported.

## 1. Project Overview

- **Project Name:** t-crossword-app
- **Service Goal:** 십자낱말풀이
- **Primary Language for Reports:** Korean (한국어)
- **Architecture:** pnpm workspace monorepo; independent platform apps; shared domain and business logic; separate UIs.
- **Targets:** Web/PWA, Android/iOS via Ionic React + Capacitor, Toss Mini App with TDS; optional Tauri desktop.

### Non-negotiable principles

1. Share domain models, business rules, validation and reusable data-access mechanisms, **not UI components or app routing**.
2. Each app owns its screens, components, styling, navigation and platform-specific integration.
3. Keep shared packages framework-independent whenever possible.
4. Each app must build and deploy independently.
5. Prefer simple, incremental changes over speculative abstractions.

## 2. Technology Stack

- **Language:** TypeScript (`strict: true`).
- **Workspace:** pnpm workspaces (`workspace:*` for internal packages).
- **Web/PWA:** React, Vite, Tailwind CSS; PWA tooling when required.
- **Mobile:** Ionic React, Capacitor, Android/iOS platform projects.
- **Toss:** Apps in Toss SDK and TDS, following the current official requirements.
- **Backend:** Supabase (PostgreSQL; PostGIS if needed), migrations, Edge Functions when appropriate.
- **Maps:** Leaflet + OpenStreetMap or V-World, selected per platform and licensing/usage requirements.
- **Desktop (optional):** Tauri.
- **Testing:** Vitest and React Testing Library; Playwright and device tests when applicable.

Before adding a dependency, check existing dependencies, bundle impact, licensing, platform compatibility and maintenance status. Do not assume a package or SDK API exists without verifying its installed version and documentation.

## 3. Repository Structure and Ownership

```text
apps/
  web/           # Web/PWA UI, routing, browser adapters
  mobile/        # Ionic UI, Capacitor adapters, native projects
  toss/          # TDS UI, Toss SDK, Toss-specific auth/bridges
  desktop/       # Optional Tauri UI and native bridge
packages/
  contracts/     # Shared DTOs, interfaces, schemas and ports
  core/          # Framework-independent domain and use cases
  data/          # Reusable repositories, Supabase implementations
  utils/         # Pure general-purpose helpers
  config/        # Shared build/lint/TypeScript presets
supabase/
  migrations/
  functions/
  seed.sql
docs/
  architecture/
  decisions/
scripts/
```

- `apps/*` may depend on public APIs from `packages/*`.
- `packages/contracts` and `packages/utils` must not depend on application packages or platform SDKs.
- `packages/core` may depend on `contracts` and pure utilities; it must not import React, Ionic, Capacitor, TDS, Tauri, browser globals or a concrete Supabase client.
- `packages/data` implements repository contracts and may depend on `contracts`, `core` types where appropriate, and Supabase SDK; it must not import an app.
- Do not import from another app, use cross-package relative source paths, introduce circular dependencies or bypass package exports.
- App-specific composition roots wire repository implementations, authentication providers and platform adapters to core use cases.
- Do not create `packages/ui` or shared routing without explicit user approval.

## 4. UI and Platform Boundaries

### Web/PWA
- Owns React/Tailwind components, browser routing, responsive layouts and service-worker behavior.
- Define supported offline operations; do not promise offline behavior for network-only features.
- Test installation, cache updates and data consistency where PWA features are enabled.

### Mobile
- Owns Ionic React screens, navigation, Capacitor plugins, permissions and lifecycle handling.
- Isolate native plugin calls behind mobile adapters; provide meaningful unsupported-feature handling.
- Browser-only testing does not prove Android/iOS compatibility.

### Toss Mini App
- Owns TDS-based UI, Toss SDK integration, platform navigation and authentication handshakes.
- **TDS and current Toss platform rules take priority over visual consistency with other apps.**
- Never call Toss-specific APIs from shared core logic or ordinary web/mobile UI.
- Verify SDK versions, permissions, deployment rules and authentication flows against current official documentation.
- Test critical behavior inside the actual Toss environment where required.

### Desktop (optional)
- Owns Tauri-specific commands, capabilities, permissions and desktop UI.
- Grant minimal system and filesystem permissions.

## 5. Shared Business Logic

- Keep business rules as pure TypeScript functions/classes where practical.
- Prefer dependency injection through interfaces/ports for persistence, auth, clock, geolocation and other effects.
- Shared core code must not depend on React Hooks or platform-specific global objects.
- Define input/output contracts explicitly; validate untrusted input at boundaries.
- Avoid duplicating business rules in app-specific UI code.
- Platform-specific presentation state and Hooks belong in the relevant `apps/*` package.

## 6. Data, Authentication and Security

- Centralize reusable database access patterns in `packages/data`, while keeping platform-specific client/session initialization in the corresponding app.
- Keep web, Capacitor and Toss authentication/session/token flows separate; share contracts only where appropriate.
- Treat Toss identity and token handling as platform-specific and verify server-side trust boundaries.
- Use Supabase migrations for schema changes; never silently alter production schemas.
- Apply and review RLS policies for every client-accessible table; do not rely on UI checks for authorization.
- Never ship service-role/secret keys in browser, mobile or Toss bundles. Public client keys still require correct RLS.
- Do not commit secrets, tokens, private `.env` files, customer data or sensitive logs.
- Use environment-specific configuration and `.env.example` with placeholder values only.
- Review authentication, authorization, payments, data deletion, storage permissions and external API calls as security-sensitive changes.
- Use PostGIS spatial indexes and query plans where relevant; avoid premature performance assumptions.
- Destructive database operations, production changes and credential rotation require explicit user approval.

## 7. Code Standards

- TypeScript strict mode; avoid `any`, unchecked casts and unnecessary non-null assertions.
- Favor small, cohesive modules and descriptive naming consistent with existing code.
- Handle async loading, error and cancellation states; do not silently swallow errors.
- Keep user-facing errors understandable and developer logs free of secrets.
- Maintain accessible UI in each app independently.
- Add or update tests for changed business rules and regressions.
- Do not introduce new libraries or architectural layers for trivial changes.
- Keep comments focused on intent and non-obvious constraints, not line-by-line narration.

## 8. AI Workflow Guidelines

### General rules for every AI agent

- Read this file and relevant package-specific instructions before modifying code.
- Do not claim a tool automatically reads `AGENTS.md` unless configured or verified.
- Avoid simultaneous edits to the same working tree/files; use separate Git worktrees when parallel changes are necessary.
- Do not overwrite user edits, discard uncommitted work or rewrite unrelated history.
- Never claim a test/build passed unless it actually ran and passed.
- Obtain explicit approval before committing, pushing, deploying, deleting data or running destructive commands.
## 9. Standard Implementation Workflow

1. Identify the requested behavior, affected platforms and acceptance criteria.
2. Inspect existing implementation, package APIs, scripts and tests.
3. Decide whether changes belong in shared `packages/*` or a specific `apps/*` directory.
4. For broad or high-risk changes, explain the plan and impact before editing.
5. Make the smallest coherent change; preserve backward compatibility when practical.
6. Add/update relevant unit tests and integration tests.
7. Run applicable typecheck, lint, test and build commands from actual package scripts.
8. Inspect `git diff`, especially dependency, migration, auth and platform boundaries.
9. Summarize changes, verification performed, unverified platforms and remaining risks in Korean.

## 10. Verification Matrix

- **Shared core/contracts:** TypeScript typecheck, unit tests, public API compatibility and dependent-app typecheck when relevant.
- **Data/Supabase:** repository tests, migration review, RLS/auth checks and relevant integration tests.
- **Web/PWA:** typecheck, lint, unit tests, production build, PWA/offline checks when affected.
- **Mobile:** typecheck, build, Capacitor sync and actual device/emulator verification for native behavior when affected.
- **Toss:** typecheck, build, TDS/SDK compatibility and Toss runtime validation for affected features.
- **Desktop:** Tauri build and capability/security review when enabled.

Use scripts that actually exist in `package.json`; do not invent successful command output. If a check cannot be run, state why and identify the remaining risk. Full workspace checks are recommended for shared contract changes.

## 11. Git and Change Management

- Prefer narrowly scoped changes and clear commit messages when the user authorizes commits.
- Never use destructive Git operations (`reset --hard`, force push, blanket clean) without explicit approval.
- Keep lockfile changes aligned with dependency changes.
- Do not modify generated native/build artifacts unless necessary.
- Document important architectural decisions in `docs/decisions/`.
- Do not push, release or deploy without explicit authorization.

## 12. Agent Response Format

Use concise Korean reporting with these items when code was changed:

1. **변경 요약** — what changed and why.
2. **수정 파일** — paths and responsibilities.
3. **검증 결과** — exact commands and pass/fail/not-run status.
4. **주의 사항** — risks, unverified platforms and follow-up work.

Ask focused questions only when unresolved requirements materially affect implementation or safety.

## 13. Instruction Precedence

Respect tool/system safety requirements first. Within project guidance, prioritize: explicit user requirements, security/data integrity, mandatory platform policies, architectural boundaries, coding standards and agent-role preferences. This file cannot override higher-priority tool or system instructions.

## 프로젝트 참고 문서
- 구조와 아키텍처: `PROJECT_STRUCTURE.md`
- 제품 요구사항: `crossword-project-spec.md`
- 개발 진행사항:`progress.md`