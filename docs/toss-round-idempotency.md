# 토스 판 생성 요청 재시도 (2026-10-19)

2026-10-20 후속 원격 시험은 사용자 승인 후 완료했다. 합성 사용자 1명·세션 2개의 21회 요청에서 같은 UUID의 판 1개 재사용·힌트 중복 차감 방지·응답 폐기 후 재시도·보상 +5 한 번을 확인하고 합성 데이터만 정리했다. 실제 DB 연결 PID/강제 행 잠금과 물리적 네트워크 단절은 시험하지 않았다. [결과·범위·한계](toss-remote-verification.md)를 우선한다.

2026-10-20 후속 점검에서 기존 테스트 Origin 허용·사전 요청·미허용 Origin 거부를 확인했다. [원격 시험 계획](toss-remote-verification.md)의 합성 사용자 동시 등록·중복 차감·응답 폐기·보상 1회 지급 시험은 도구만 준비했으며, 운영 DB 쓰기/정리는 별도 승인 대기다. PGlite 검사와 실제 원격 트랜잭션 검증은 구분한다.

기기 출제 후속 변경(2026-10-20 API v3 배포·테스트 업로드 완료): 새 앱의 `/round/register`는 같은 설정·기기 생성 결과·배치·UUID를 재사용하며 fingerprint에 `device-v1`과 정규화한 배치를 포함한다. 기존 SQL 스냅샷을 재사용하므로 새 마이그레이션은 없다. API 배포 후 새 `.ait` 업로드를 완료했으며 실제 기기 재시도 검증은 대기다. 구버전 `/round` 호환·신뢰 경계·Origin 검사 미확인 사항은 [기기 출제 결정](decisions/20261019-device-puzzle-generation.md)을 따른다. 아래 운영 적용 완료 기록은 서버 출제 버전 기준이다.

## 구현과 배포 상태

판 생성 응답을 받지 못했을 때 같은 요청을 다시 보내면 같은 판·퍼즐을 반환하는 경로를 구현했다. 사용자 승인 후 **기존 crossword 프로젝트의 신규 DB 적용·`toss-hints` v2 배포·최신 토스 번들 테스트 업로드를 완료했다.** 최신 버전 기기 확인은 사용자 진행 대기다. 아래 단계별 과거 기록과 최신 업로드 결과를 구분한다.

| 단계 | 구현 |
| --- | --- |
| 토스 gateway | 난이도·크기·정렬/중복 제거한 학습완료 ID 목록이 같은 실패 요청의 UUID 유지 |
| API 조회 | UUID 검증, 동일 설정의 SHA-256 fingerprint 계산, DB의 기존 결과 확인 후 재사용 |
| API 생성 | 기존 결과가 없으면 공유 엔진으로 출제 후 새 저장 RPC 호출 |
| 저장 RPC | 사용자 지갑 행 잠금 후 재조회, 먼저 저장된 후보가 있으면 그 결과 반환 |
| 원자성 | 판 등록과 결과 스냅샷 저장은 같은 DB 트랜잭션에서 처리 |

새 `supabase/migrations/20261019_toss_round_idempotency.sql`은 기존 지갑 RPC를 수정하지 않고 `toss_round_creations`와 조회/저장 RPC 두 개를 추가한다. 테이블은 RLS를 켜고 공개·anon·authenticated의 권한을 차단한다. 두 RPC도 service_role에만 실행 권한을 주며 보안 정의자 함수에서 세션 만료와 소유자를 확인한다. `packages/data`의 서버 저장소가 호출하고 앱 번들은 service-role 키를 받지 않는다.

`requestId`가 없는 기존 클라이언트는 이전 등록 경로를 사용한다. 이 호환 경로에는 판 생성 멱등성이 없다. 새 앱을 먼저 배포하고 기존 API가 요청 ID를 무시하는 경우에도 멱등성을 보장하지 못하므로 아래 순서를 따른다.

## 재시도 규칙

- 키는 `(인증된 사용자, 요청 UUID)`다. 토스 자체 세션이 갱신되어도 같은 사용자면 기존 결과를 조회한다. 다른 사용자가 같은 UUID를 보내도 상대 결과를 읽지 못한다.
- 설정 fingerprint는 난이도·크기·정렬/중복 제거한 학습완료 ID 목록으로 만든다. 목록 순서와 중복만 달라진 재시도는 동일 요청이다. 같은 UUID에서 설정이 달라지면 `round_request_mismatch`로 거부한다.
- 저장 결과는 판 ID·처음 생성한 퍼즐이며 재조회 시 **현재 지갑 잔액**을 반환한다. 빈 퍼즐도 판 ID가 null인 결과로 저장한다. 재조회는 판 생성의 시간당 등록 한도를 추가 소비하지 않지만 HTTP 요청 제한과 함수 호출량은 소비한다.
- 결과는 24시간 동안 재사용한다. 그 뒤 같은 UUID로 새 판을 만들지 않고 `round_request_expired`로 거부한다. 토스 gateway는 만료/불일치의 명시적 오류를 받으면 보관 ID를 버리고 다음 수동 요청에 새 ID를 쓴다. 만료 행을 자동 삭제하지 않으며 추후 보관 정책이 필요하다.
- 새 등록에는 기존 사용자당 시간당 60판 한도를 유지한다. 새 빈 결과는 별도로 사용자당 시간당 60개 이하로 제한한다. 두 종류를 합산한 60회 제한은 아니다.
- gateway는 네트워크 오류·429·서버 오류·응답 검증 실패에서 같은 ID를 유지한다. 정상 결과를 검증하면 ID를 해제하고 다음 새 퍼즐에는 새 ID를 발급한다. 자동 반복 호출을 추가하지 않았다.
- gateway 인스턴스의 메모리에서 마지막 요청 하나를 보관한다. 설정을 바꾸면 새 ID를 쓰며, 이후 이전 설정으로 돌아갔을 때 그 이전 실패 ID까지 복구하지 않는다. 앱 완전 종료·새로고침 후 판/대기 요청 복원은 제공하지 않는다.

동시 요청들이 모두 저장 전 조회에 실패하면 **출제 CPU는 중복 사용될 수 있다.** 지갑 행 잠금 후 저장 단계에서 다시 확인하므로 확정 판·결과 행은 하나다. 분산 CPU 작업 예약이나 실행 중 요청을 재사용하는 기능은 이번 변경에 포함하지 않는다.

## 로컬 검증

- API 테스트 **46개 통과**, 프로파일 1개는 일반 실행에서 의도적으로 건너뜀. 토스 테스트 **46개 통과**.
- 새 SQL 검사: 원본 결과 유지·현재 잔액·재인증·사용자 격리·설정 불일치·24시간 만료·가짜/만료 세션·빈 결과·중첩 후보 6개·실패 롤백·60판 한도에서 재조회·클라이언트 권한 차단·service_role 실행을 확인했다.
- 실제 마이그레이션을 실행한 PGlite 저장소에 HTTP 핸들러를 연결해 최초 응답을 버리고 정규화된 설정으로 재요청했다. 저장 RPC 1회, 판/결과 행 각 1개, 동일 응답을 확인했다. 기존 결과 조회 시 등록·생성 경로로 들어가지 않는 회귀 검사도 추가했다.
- 토스 gateway의 실패 ID 유지·정상 성공 후 ID 갱신·설정 변경·401 재인증·429·명시적 만료 오류를 검사했다.
- `pnpm.cmd typecheck` 전체, API `build`/`build:edge`, 토스 `lint`/`build:ait`, `git diff --check` 통과. 토스 번들 61편/119장 대응·dist 31,818,542바이트(<100MB) 검사 통과. 기존 큰 JS 청크 경고 유지.
- 새 경로의 실제 Supabase/Edge 실행·PostgREST 통신·다중 연결 경합·기기 동작은 미검증이다. PGlite의 중첩 후보 검사는 단일 연결 큐이므로 실제 행 잠금 경합 통과로 해석하지 않는다. 이전 [CPU 측정](toss-api-local-verification.md)은 당시 소스와 기존 요청 경로의 기록이며 새 DB 조회/스냅샷 경로의 Edge CPU 측정을 대신하지 않는다.

주요 명령(저장소 루트):

```powershell
pnpm.cmd typecheck
pnpm.cmd --filter @t-crossword/toss-api test
pnpm.cmd --filter @t-crossword/toss test
pnpm.cmd --filter @t-crossword/toss lint
pnpm.cmd --filter @t-crossword/toss-api build
pnpm.cmd --filter @t-crossword/toss-api build:edge
pnpm.cmd --filter @t-crossword/toss build:ait
git diff --check
```

## 적용 순서와 남은 확인

사용자 승인 후 아래 DB 적용·API 배포를 완료했다. 다른 환경에서도 승인을 받은 뒤 이 순서를 따른다.

1. 승인된 대상 DB에 **신규 마이그레이션만 추가 적용**하고 테이블 RLS·두 RPC의 service_role 전용 권한을 확인한다. 기존 마이그레이션을 다시 실행하거나 지갑/판을 초기화하지 않는다.
2. 새 API를 배포하고 실제 인증 세션에서 같은 요청 ID의 조회/생성/재조회, 다른 설정의 거부를 확인한다. 새 API가 DB 적용 전에 배포되면 ID 포함 요청은 실패할 수 있다. 기존 클라이언트 경로는 유지한다.
3. 새 토스 번들을 테스트 업로드해 최초 요청의 응답 유실·재인증 후 같은 판 재사용·새 퍼즐 요청의 새 판 발급을 확인한다. DB의 판/결과 행 수와 잔액도 대조한다.
4. 둘 이상의 실제 DB 연결에서 같은 사용자·UUID와 서로 다른 후보를 겹쳐 실행해 하나의 결과만 저장되는지 확인한다. 이 작업은 로컬 검사의 연장이며 현재 완료로 기록하지 않는다.

## 실제 적용 결과 (2026-10-19)

후속 업로드 완료: 사용자가 키를 default 프로필에 등록한 뒤 업로드를 승인했다. 준비된 30,159,418바이트 번들의 `ait deploy --location ./t-crossword.ait` 성공(exit 0)을 확인했다. deploymentId: `01a15094-d600-75c6-b2eb-f48c4a049b1f`. 테스트 주소는 `intoss-private://t-crossword?_deploymentId=01a15094-d600-75c6-b2eb-f48c4a049b1f&host=appsInTossHost`다. 아래 프로필 없음·업로드 미실행 기록은 이 성공 이전 상태다. 키 내용은 읽거나 출력하지 않았으며 공개 검토 요청·출시는 하지 않았다.

- 기존 `crossword` (`zduyaejdjwfhsiazcmrn`)만 대상으로 `db query --linked --project-ref ... --file supabase/migrations/20261019_toss_round_idempotency.sql`을 실행했다. 기존 마이그레이션 재실행·지갑/판 초기화·`db push`는 하지 않았다. 직접 SQL 적용이며 CLI migration history를 별도로 등록하지 않았다.
- 적용 전후 지갑 1개·판 19개·힌트 합계 16개로 동일했다. 새 스냅샷은 0행이고 RLS 활성, anon/authenticated 테이블 접근 false다. 두 함수는 SECURITY DEFINER이고 PUBLIC/anon/authenticated 실행 false, service_role 실행 true를 확인했다.
- 실제 PostgreSQL에서 합성 사용자·세션·판을 한 트랜잭션 안에 만들고 중복 저장·세션 갱신 조회·설정 불일치 거부·힌트 10→9·완성 9→14·중복 정답 14 유지를 검사했다. 마지막 **ROLLBACK** 후 `passed_rolled_back`을 받았으며 기존 실제 사용자 세션/잔액은 사용하지 않았다. [롤백 검사 SQL](../scripts/verify-toss-round-rollback.sql), [권한·집계 SQL](../scripts/verify-toss-round-schema.sql)에 재실행 자료를 보관한다. CLI는 여러 SELECT의 마지막 결과만 보여 주므로 집계 SELECT는 별도로도 실행했다.
- `functions deploy toss-hints --project-ref ... --use-api` 성공 후 **v2 ACTIVE**, `verify_jwt: false` 유지 확인. 토스 자체 세션 검증을 유지하며 probe JWT·Secrets·인증서·요금제는 변경하지 않았다.
- 원격 health 200, 무인증 잔액 401, UUID 포함 무효 세션 판 요청 401, 미허용 Origin 403, 기존 허용 HTTPS Origin preflight 204 통과. 첫 preflight는 로컬 개발 Origin을 사용해 403이었으며 기존 HTTPS Origin으로 재확인했다. 정상 사용자 인증을 우회한 Edge 판 생성은 하지 않았다.
- 최신 `apps/toss/t-crossword.ait`: 30,159,418바이트, SHA-256 `248C0788787986E7BF2B3666B2B3ECC07E173A4AEAA50DA6A4974290584998A0`. `~/.ait/credentials` 저장 프로필이 없어 토스 콘솔 테스트 업로드는 실행하지 않았다. API 키를 채팅이나 명령 인수로 요청하지 않았다.
- 미실행: 최신 토스 번들의 실제 인증·판 재시도/새 판 발급·실제 응답 연결 유실·둘 이상의 DB 연결 경합·hosted Edge CPU/부하. 위 DB 트랜잭션 검사를 다중 연결·기기 검증으로 간주하지 않는다.
- 콘솔 업로드·공개 검수 요청·커밋·푸시 없음. 같은 코드의 기존 로컬 테스트/빌드는 반복하지 않고 문서·SQL 경로와 `git diff --check`를 확인했다.
