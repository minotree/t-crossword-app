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
- 향후 하이브리드 배포를 고려해 Safe Area·작은 화면·가로 회전·키보드 표시 시 콘텐츠와 조작 영역을 확인한다. 토스에서 검증한 메뉴 명칭·사용 흐름은 일관되게 반영하되 광고·네이티브 상단 영역에 따른 치수는 플랫폼에 맞춘다. 웹 UI 개선을 Capacitor 통합이나 Android/iOS 검증 완료로 보고하지 않는다.
- Owns React/Tailwind components, browser routing, responsive layouts and service-worker behavior.
- Define supported offline operations; do not promise offline behavior for network-only features.
- Test installation, cache updates and data consistency where PWA features are enabled.
- 웹/PWA·토스·모바일 퀴즈 그리드는 앱 콘텐츠의 가로 공간을 채우고 아래에 한 줄의 `문제 전체 보기` 버튼을 둔다. 버튼을 누르면 그리드 전체 영역을 덮어 2열 문제 목록을 표시한다. 닫기·Escape·단어 선택으로 닫으며 토스/Android 뒤로가기는 방향 선택·문제 목록을 먼저 닫는다. 낮은 화면에서는 본문 스크롤을 허용한다. 진행 숫자와 새 퍼즐은 오른쪽 정렬한다.
- 세 앱의 번호가 있는 칸을 누르면 미완료 시작 단어의 정답 입력창을 연다. 같은 칸에서 가로·세로가 모두 미완료이면 두 방향의 문제를 먼저 표시한다. 한 방향만 남으면 바로 해당 입력창을 열고 모두 완료하면 번호 클릭을 비활성화한다. 완료 문제 목록도 선택할 수 없다. 완성 축하에는 하단 발사 색종이 폭죽과 큰 🎉 아이콘을 표시하며 동작 줄이기 설정과 버튼 조작을 보장한다.
- 세 앱의 퀴즈 모두 가로/세로 문제 제목과 진행 숫자는 고정하고 아래 2열 문제 목록만 함께 스크롤한다. 가로·세로 화면 모두 적용한다.
- 오답노트 삭제는 목록 숨김으로 처리하고 기존 단어·힌트 사용 이력·즐겨찾기·학습완료 기록을 보존한다. 2026-10-26 사용자 결정으로 세 앱 모두 틀린 영문 글자가 붉게 표시되는 즉시 해당 단어를 기기 오답노트에 중복 없이 등록한다. 전체 답안 제출은 필요하지 않으며, 숨긴 단어도 다시 틀리면 복귀한다. 정답 수정·학습완료 후에도 오답노트 기록을 유지한다. 글자 공개 힌트는 복원하지 않는다.
- 웹/PWA·토스·모바일 정답 입력창은 틀린 영문 글자를 횟수 제한 없이 붉은색과 접근성 상태로 표시한다. 정답으로 수정하거나 삭제하면 해당 칸의 오답 표시를 해제하며 다른 칸의 표시는 유지한다. 남은 횟수·소진·재실행 초기화 안내는 제공하지 않는다.
- 2026-10-25 사용자 결정으로 웹/PWA·토스·모바일의 글자 공개·힌트 잔액·완성 보상을 제거한다. 문제의 뜻·동의어·문제 목록과 완성 축하는 유지한다. 새 앱은 힌트 인증·잔액·판 등록·정답/보상 API를 호출하지 않고 기기에서 출제·정답 확인을 처리한다. 기존 운영 DB·잔액·마이그레이션·구버전 API는 임의 삭제하거나 배포하지 않는다. 이전 보상 문서는 이력이다.

### Mobile
- Owns Ionic React screens, navigation, Capacitor plugins, permissions and lifecycle handling.
- Isolate native plugin calls behind mobile adapters; provide meaningful unsupported-feature handling.
- Browser-only testing does not prove Android/iOS compatibility.

### Toss Mini App

- 단어장 음성은 기기 브라우저 TTS 대신 Cloudflare 정적 MP3를 사용한다. 단어+예문 결합 음성의 삽입 쉼은 2026-10-26 사용자 선택으로 0.5초다. 단어장 변경 시 표제어·예문과 음성 manifest의 대응을 검사하고, 음성 바이트 해시가 포함된 URL을 사용한다. 기존 배포본이 참조하는 파일도 후속 정적 배포에 보존한다. 공개 manifest는 다른 앱에서 영단어+예문으로 연결할 수 있어야 한다. 생성 도구/모델은 앱 런타임에 포함하지 않으며 제작·검수·권리 기록은 `content/word-audio/README.md`를 따른다.

- 토스 번들 업로드는 사용자가 직접 수행한다(2026-10-21 사용자 결정). 에이전트는 수정·검사·`.ait` 생성과 파일 경로 안내까지 진행한다. 이후 사용자가 명시적으로 업로드를 요청한 경우에만 업로드하며, 과거 업로드 승인을 후속 버전의 자동 업로드 승인으로 해석하지 않는다.
- 배너 광고를 사용하는 토스 미니앱은 초기 화면 설계부터 토스 기본 상단 영역·앱 헤더·하단 메뉴·배너·Safe Area·키보드를 제외한 실제 콘텐츠 공간을 계산한다. 배너를 나중에 추가할 공간으로 취급하지 않으며, 작은 화면에서도 퍼즐·힌트·그림책 본문의 가독성과 조작 영역을 확보한다. 중복 제목·설명·진행 표시를 정리하고 고정 영역과 스크롤 영역을 함께 설계한다.
- 이 앱의 배너는 하단 메뉴 아래 최하단에 배치하고 메뉴와 간격을 확보한다. 배너 높이·표준 UI는 현재 공식 SDK 기준을 확인하며 광고를 임의 축소·자르거나 메뉴·본문과 겹치지 않는다. 미지원·광고 없음·실패·보상형 광고 이용 중 배너가 사라지는 경우에도 콘텐츠 공간과 하단 안전 영역이 정상적으로 유지되는지 확인한다. 자동 검사와 실제 토스 기기의 배치·가독성 검증을 구분하고, 상세 기준은 `docs/toss-ads.md`를 따른다.
- 힌트 제거 후 토스 새 앱은 기기 출제를 바로 사용하며 서버 판 등록을 하지 않는다. `docs/toss-round-idempotency.md`와 `docs/toss-free-hosting.md`의 판 등록·재시도 규칙은 기존 서버/구버전 앱 이력으로 보존한다.
- 콘솔 업로드 키는 사용자 로컬 `ait token add` 프로필로 등록하고 키 내용은 읽거나 로그·채팅·저장소에 남기지 않는다. 명시적으로 승인된 `ait deploy` 업로드와 공개 검토 요청·출시를 구분한다. CLI 성공·실제 기기 검증도 별도로 기록한다.
- 토스 출시는 별도 서버 관리 없이 무료 범위를 기준으로 한다. 유료 호스팅·요금제 전환을 기본 전제로 삼지 않는다. Supabase Edge Functions 대체는 실제 mTLS·실행 제한 검증 전 확정하지 않는다. 검토 상태는 `docs/toss-free-hosting.md`를 따른다.
- Owns TDS-based UI, Toss SDK integration, platform navigation and authentication handshakes.
- **TDS and current Toss platform rules take priority over visual consistency with other apps.**
- UI 구현은 분리하되 제공하는 기능의 화면 구성·메뉴 명칭·사용 흐름은 Web/PWA를 기준으로 일관되게 유지한다. 플랫폼 제약이나 미구현 범위로 차이가 생기면 구분해 기록한다.
- Never call Toss-specific APIs from shared core logic or ordinary web/mobile UI.
- Verify SDK versions, permissions, deployment rules and authentication flows against current official documentation.
- Test critical behavior inside the actual Toss environment where required.

### Desktop (optional)
- Owns Tauri-specific commands, capabilities, permissions and desktop UI.
- Grant minimal system and filesystem permissions.

## 5. Shared Business Logic

- 학습완료한 단어도 현재 오답노트에 표시 중이면 다시 출제 대상으로 삼는다. 기존 오답 이력만 있고 목록에서 숨긴 단어는 이 예외에 포함하지 않는다. 학습완료 기록·집계는 유지하며 난이도·격자 크기 제약을 우회하지 않는다. 이 판정은 공통 `vocabularyForProgress`에서 처리하고 각 앱과 Worker는 오답·숨김 ID를 전달한다.

- 어휘·퀴즈는 초급·중급·고급·특급(`special`) 4단계다. 선택 수준 이하의 미완료 어휘를 누적 출제하되 학습완료 집계는 선택 수준만 대상으로 한다. 특급 500개는 학술·심화 어휘이며 공식 토플 목록·출제 빈도 인증으로 표시하지 않는다. 그림책은 기존 3단계로 구분한다. 단어를 추가할 때 기존 CSV 행 순서·ID를 보존하고 WordNet 등 필수 고지의 앱 내 열람·배포 포함을 확인한다. 특급 제작·검수 기록은 `content/special-vocabulary/README.md`를 따른다.

- 웹/PWA·토스·하이브리드 앱의 문제 출제는 `packages/core` 공통 엔진을 기기에서 실행한다. 플랫폼별로 출제 규칙을 복제하지 않는다. 힌트 제거 후 정답 확인·완료 기록도 기기에서 처리한다. 기존 서버의 배치 검증·힌트·보상은 구버전 호환 이력이며 `docs/decisions/20261019-device-puzzle-generation.md`를 따른다.

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

### 사용자 마무리 명령: `마무리하자`

- 사용자가 작업 지시로 `마무리하자`라고 하면, 진행한 작업의 문서 정리와 커밋·푸시까지 수행하라는 명시적 승인으로 해석한다. 규칙을 설명하거나 인용하는 문맥은 실행 요청으로 보지 않는다.
- 먼저 현재 변경 사항과 완료·미완료 작업을 확인하고, `AGENTS.md` 및 이 파일의 프로젝트 참고 문서와 본문에서 연결한 문서를 검토한다. `AGENTS.md`에는 달라진 작업 규칙·기준을, `progress.md`에는 작업 결과·검증·남은 항목을 반영한다. 요구사항·구조·배포·콘텐츠 등 다른 연계 문서는 이번 변경과 관련된 내용만 갱신한다. 이미 정확한 문서는 불필요하게 수정하지 않는다.
- 변경에 맞는 자동 검사와 `git diff --check`를 수행한다. 같은 코드에 대해 이미 통과한 검사는 불필요하게 반복하지 않으며, 실제 실행 결과와 미실행 항목을 구분해 문서에 기록한다. 사용자가 맡은 브라우저·기기 검증은 미실행으로 남긴다.
- 문서와 diff를 검토한 뒤 이번 작업에 해당하는 파일만 명시적으로 스테이징하고 커밋한다. 무관한 사용자 변경·추가 파일과 비밀 정보는 포함하지 않는다.
- 현재 브랜치와 원격 연결을 확인하고 해당 원격 브랜치로 일반 푸시한다. 커밋·푸시 자체에 대한 추가 확인은 요청하지 않는다. 도구의 권한 승인이 필요하면 정해진 승인 절차를 따른다. 푸시가 거절되면 강제 푸시나 이력 재작성 없이 원인을 보고한다.
- 이 명령은 별도 배포 명령 실행, 데이터 삭제, 운영 DB 변경, 자격 증명 교체 또는 파괴적 Git 작업의 승인을 포함하지 않는다.
- 완료 후 변경·문서 요약, 검증 결과와 미검증 항목, 커밋 해시, 푸시 대상·결과, 남아 있는 작업 트리 변경을 한국어로 간결하게 보고한다.

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

- 문서만 수정한 경우 내용·경로·명령의 정확성과 `git diff --check`를 확인한다. 실행 코드나 설정에 영향이 없다면 불필요하게 전체 빌드·테스트를 반복하지 않는다.
- 사용자가 브라우저·기기 확인을 맡겠다고 한 경우 자동 검사와 콘텐츠 검사를 진행하고, 실제 브라우저·기기 확인은 미실행으로 보고한다. 렌더링 테스트 통과를 실제 기기 검증으로 간주하지 않는다.
- Node/pnpm 환경은 해당 패키지의 `engines`와 현재 설치 상태를 먼저 확인한다. 개인 PC의 임시 실행 경로를 프로젝트의 필수 설정으로 고정하거나, 확인 없이 의존성을 재설치하지 않는다. 웹 lint 환경은 `docs/lint.md`를 참고한다.

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

## 14. 콘텐츠 저작권 및 이용 권한

- 모든 플랫폼의 콘텐츠는 직접 창작하거나 필요한 이용 권한이 확인된 자료만 사용한다. 기존 단어 데이터, 동시, 동요, 해석, 삽화, 캐릭터, 폰트, 음원에도 동일하게 적용한다.
- 동시·동요의 문장, 가사, 멜로디는 새로 창작한다. 기존 작품을 복사·번역·개작하거나 일부 표현만 바꾸어 사용하지 않는다. 외부 작품을 활용하려면 해당 이용 방식에 대한 권한을 먼저 확인한다.
- 삽화는 독자적인 장면과 캐릭터로 제작한다. 기존 캐릭터·로고·작품을 복제하거나 특정 작가의 화풍을 모방하도록 지시하지 않는다.
- 단어 자체와 사전·교재의 설명 문구를 구분한다. `words_completed.csv` 및 파생 JSON의 뜻·동의어·예문·해석을 외부 사전이나 교재에서 무단 복사하지 않고, 직접 작성하거나 이용 조건을 확인한 데이터를 사용한다.
- 외부 자료는 공식 출처의 최신 라이선스·약관에서 상업적 이용, 수정·번역, 앱 내 배포·재배포, 출처 표시 등 필요한 조건을 확인하고 준수한다. 무료 공개 또는 출처 표시만으로 사용 권한이 확보되었다고 판단하지 않는다.
- 콘텐츠별 제작 경위, 원본 출처, 저작자·권리자, 라이선스·허락 근거, 확인 날짜, 필수 표시 사항을 저장소 문서에 기록한다. AI 생성물은 사용 도구·모델, 생성 날짜, 프롬프트와 참조 자료도 기록하고 해당 도구의 이용 조건을 확인한다.
- AI로 새로 생성했다는 이유만으로 비침해나 독점적 권리 확보를 보장하지 않는다. 배포 전 기존 작품과의 유사성, 참조 자료의 권한, 필수 출처 표시를 검토한다.
- 출처나 이용 권한이 불명확한 자료는 배포 대상에 포함하지 않는다. 문제를 발견하면 해당 자료를 식별해 보고하고, 권한을 확인하거나 독자적으로 만든 자료로 대체한다. 사용자 파일을 임의로 삭제하지 않는다.
- 실제로 확인한 범위와 미확인 항목을 구분해 보고하며, 검토 없이 “저작권 문제가 없다”고 단정하지 않는다.

## 15. 그림책 콘텐츠 제작 및 관리

### 대상과 누적 어휘

- 초급은 초급 어휘, 중급은 초급+중급 어휘, 고급은 초급+중급+고급 어휘를 누적 사용한다. 중급은 중·고등학생, 고급은 성인 독자를 대상으로 한다. 난이도는 어려운 단어 수뿐 아니라 주제·문장·감정과 선택의 복잡성에도 반영한다.
- 현재 어휘 검사 기준은 `packages/core/src/assets/vocab.json`이다. 원본 단어 데이터는 `words_completed.csv`이며 변환은 `scripts/convert-vocab.mjs`를 사용한다. 콘텐츠 검사를 통과시키기 위해 단어 데이터의 난이도나 항목을 임의로 바꾸지 않는다.
- 목록에 없는 기본 문법어·활용형·파생형을 사용하면 해당 콘텐츠의 검사 코드와 보고서에 구분해 기록한다. 단순 철자 대응을 의미·문법 검증으로 간주하지 않으며, 파생형을 별도 기본 어휘로 중복 집계하지 않는다. 어휘 수를 보고할 때 본문만인지 제목 포함인지 명시한다.
- 시·창작 에세이·소설을 지원한다. 작품 수·장르·분량은 사용자의 최신 요청과 해당 콘텐츠 README를 따른다. 기존 제작 분량을 모든 후속 작품의 고정 제한으로 해석하지 않는다.

### 원본과 웹용 파일

- 초급 원본은 `content/beginner-poems/poems.json`, 중급·고급 원본은 각각 `content/intermediate-readings/books.json`, `content/advanced-readings/books.json`에서 관리한다. 이미지·페이지별 제작 기록·검수 자료는 해당 콘텐츠 디렉터리에 둔다.
- `apps/web/src/data/`의 그림책 JSON과 `apps/web/public/picture-books/`의 WebP는 `python scripts/prepare-picture-books.py`로 갱신한다(Python/Pillow 필요). 파생 파일만 직접 고쳐 원본과 불일치하게 만들지 않는다. 생성된 웹용 파일을 배포 소스에 포함하며 Vercel 빌드에 Python이 있다고 가정하지 않는다.
- 작품 ID와 페이지 순서·이미지 경로를 안정적으로 관리한다. 이미지 보정본은 버전이 있는 별도 파일로 저장하고 원본·이전 제작 기록을 보존한다. 실제 사용하는 경로와 제작 기록을 함께 갱신한다.
- 기술 검사 통과와 최종 편집·권리 검토 상태를 구분한다. `draft-unreviewed`를 이미지 생성이나 빌드 성공만으로 검토 완료 상태로 바꾸지 않는다.
- 토스 그림책은 `scripts/prepare-toss-picture-book-images.py`로 원본에서 토스 전용 WebP를 준비하고 결과 파일을 저장소에 포함한다. 일반 빌드는 Python 없이 `prepare-toss-picture-books.mjs`로 승인 목록·원본/이미지 해시를 확인한다. 승인 후 본문·해석·이미지가 바뀌면 변경 부분을 재검토하고 `content/picture-book-approval.json`을 갱신한다. 해시 갱신만으로 검토를 대신하지 않는다. `build:ait`의 이미지 대응·번들 크기 검사와 실제 기기 가독성 검증을 구분한다.

### 제작과 검수 순서

1. 영어 원문과 페이지별 한글 해석을 먼저 작성하고 어휘·문법·내용의 연결을 검토한다. 자동 단어 치환 후에는 관사·수일치·시제·자연스러움과 번역 대응을 다시 확인한다.
2. 이미지 제작 전에 영어 원문을 확정한다. 삽화에는 독자적인 인물·장면을 사용하고, 연속 작품의 인물별 나이·외형·역할을 구분해 지정한다. 법률·의료·과학 등 실제 사실을 설명할 때는 공식 근거를 확인하고, 창작 설정과 구분한다.
3. 이미지 속 제목·본문·페이지 번호를 원문과 시각적으로 대조한다. 잘림·오탈자·가독성·인물 혼동을 확인하고, 보정 후에도 다시 대조한다. 파일 존재 검사만으로 시각 검수를 대신하지 않는다.
4. 영어 원문을 수정하면 이미지 속 본문·한글 해석·생성 기록·웹용 파일·검수 갤러리도 함께 맞춘다. 새 어휘나 표현을 넣으면 어휘 검사도 다시 실행한다.
5. 해당 디렉터리에 있는 `validate.py`, `build-preview.py` 등 실제 검사 도구와 웹용 변환을 실행한다. 원본·웹 JSON·이미지·빌드 결과의 대응을 확인하고 관련 웹 검사를 수행한다. 작품 수가 바뀌면 검사 코드와 문서의 예상 개수도 갱신한다.

### 읽기 화면과 오프라인 범위

- 하단 메뉴명은 `그림책`이며 초급·중급·고급 선택을 제공한다. 여러 장의 작품은 이전·다음·목록 복귀와 페이지별 `해석 보기`를 제공한다.
- 이미지에 영어 본문이 있으므로 별도의 보이는 `영어 원문 보기`를 중복 추가하지 않는다. 스크린리더가 영어 본문을 읽을 수 있는 텍스트는 유지한다. AI를 활용한 창작 콘텐츠임을 읽기 화면에 알린다.
- 그림책 이미지는 설치 시 일괄 precache하지 않고 성공적으로 읽어 온 이미지부터 캐시한다. 처음 여는 이미지와 캐시에서 삭제된 이미지에는 인터넷이 필요하므로 모든 그림책을 오프라인에서 볼 수 있다고 안내하지 않는다.

## 프로젝트 참고 문서
- 구조와 아키텍처: `PROJECT_STRUCTURE.md`
- 제품 요구사항: `crossword-project-spec.md`
- 개발 진행사항: `progress.md`
- 웹 lint 환경: `docs/lint.md`
- Vercel·PWA 배포와 기기 검증: `docs/vercel-pwa.md`
- 퍼즐 완성 힌트 보상: `docs/puzzle-completion-rewards.md`
- 토스 미니앱 개발·검증 범위: `apps/toss/README.md`
- 그림책 제작·검수 기준: `content/beginner-poems/README.md`, `content/intermediate-readings/README.md`, `content/advanced-readings/README.md`
