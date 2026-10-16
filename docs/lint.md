# 웹 ESLint 실행

공통 작업·검증 규칙은 [AGENTS.md](../AGENTS.md)를 따른다. 문서만 수정했다면 경로·명령·내용과 `git diff --check`를 확인하며 전체 빌드·테스트를 반복하지 않는다.

웹 개발 도구는 Node.js 20.19 이상(20.x), 22.13 이상(22.x), 또는 24 이상을 지원한다. Node.js 22 LTS 이상을 권장한다. 저장소 루트에서 pnpm으로 실행한다.

```powershell
pnpm install --frozen-lockfile
pnpm --filter @t-crossword/web lint
```

기존 설치 상태와 해당 패키지의 `engines`를 먼저 확인한다. 위 설치 명령은 초기 설치·의존성 변경 등 필요한 경우에만 사용하며, lint를 실행할 때마다 재설치하지 않는다. 개인 PC의 임시 Node/pnpm 경로는 필수 프로젝트 설정으로 사용하지 않는다.

자동 수정 가능한 항목만 수정하려면 다음 명령을 사용하고 diff를 확인한다.

```powershell
pnpm --filter @t-crossword/web lint:fix
```

- 설정: `apps/web/eslint.config.mjs` (flat config).
- 대상: 웹의 `src/**/*.ts`, `src/**/*.tsx`. 빌드 결과와 의존성은 제외한다.
- 규칙: ESLint·TypeScript 권장 규칙, React Hooks 호출 규칙과 의존성 배열 검사. 경고가 하나라도 있으면 실패한다.
- 타입 정보가 필요한 검사는 기존 `pnpm --filter @t-crossword/web typecheck`로 별도 실행한다.
- 웹에는 현재 `test` 스크립트가 없다. 기존 설치 환경에서 `apps/web`로 이동해 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`를 실행한다. 루트 `pnpm test`의 성공만으로 웹 테스트가 실행되었다고 보고하지 않는다.
- 개발 의존성만 추가하며 앱 런타임 번들에는 ESLint를 포함하지 않는다.
- pnpm 11에서 기존 의존성 저장소를 검사하다가 비대화형 재설치 오류가 발생하면, 정상 설치 완료 여부를 먼저 확인한다. 이번 검증에서는 기존 설치를 유지하기 위해 `--config.verifyDepsBeforeRun=false`를 일회성으로 사용했다. 이 설정은 저장소나 전역 설정에 저장하지 않았다.

설정 참고: [typescript-eslint 시작 안내](https://typescript-eslint.io/getting-started/), [React Hooks ESLint 규칙](https://react.dev/reference/eslint-plugin-react-hooks).
