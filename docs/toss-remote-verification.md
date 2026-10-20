# 토스 서버 경계 확인과 소규모 동시성 시험

2026-10-20 기준. 실제 기기 테스트는 사용자가 진행한다. 아래 21회 시험과 합성 데이터 정리는 사용자 승인 후 실행 완료했다. 추가/재실행하는 운영 DB 쓰기·삭제·부하 시험은 새 범위를 승인받은 뒤 실행한다.

## 원격 실행 완료 결과

사용자 `응 진행해` 승인 후 `node --env-file=apps/toss-api/.env.local scripts/verify-toss-concurrency.mjs --execute zduyaejdjwfhsiazcmrn`을 실행해 exit 0·21회 상한·최대 동시 2개 검사를 통과했다. 합성 사용자 1명·세션 2개에서 등록 판/스냅샷은 1개, 힌트 요청 기록은 4개였다. 동일 UUID/동일 칸 중복 힌트와 응답 본문 폐기 후 재시도에서도 추가 차감 없이 잔액 10→9→8, 동시 최종 정답과 재시도에서 보상 +5 한 번으로 13을 확인했다. solved 두 단어의 중복 없음·rewarded도 조회했다.

실행 ID는 `7db68583-74dc-4e2e-89a3-f4c1fc8d9314`다. scope/정리 SQL의 합성 사용자 해시를 대조한 뒤 승인된 범위의 `cleanup.sql`을 기존 Supabase CLI `db query --linked --project-ref ... --file ...`로 실행했다. 정리 트랜잭션 exit 0, `remaining_test_players: 0`을 확인했다. 정리는 해당 해시의 스냅샷·요청·판·세션·사용자만 대상으로 했고 FK를 유지한 채 commit했다. 기존 사용자 전후 전체 집계 비교를 수행한 것은 아니다. [비밀 없는 결과 기록](verification/toss-concurrency-2026-10-20.json)을 보관한다.

서버 배포·스키마·Secrets·요금제 변경은 없었다. 아래 물리적 네트워크 단절·강제 DB 잠금 경합·대규모 부하·기기 검증의 한계는 그대로 남는다.

## Origin 확인 결과

서버 설정을 바꾸지 않고 읽기 요청으로 확인했다. `https://not-allowed.example`·`https://example.org`는 403, 확인된 테스트 Origin `https://t-crossword.private-apps.tossmini.com`의 health는 200이며 응답의 Access-Control-Allow-Origin이 일치했다. 같은 Origin의 `/round/register` 사전 요청은 204, 미허용 Origin의 실제 POST도 403이다. [측정 기록](verification/toss-origin-2026-10-20.json)을 보관했다.

이전 시간 초과는 재현되지 않았지만 당시 원인은 확정하지 못했다. 처음 비교에 넣은 추정 주소 `https://t-crossword.private-web.tossmini.com`는 403이었다. 이후 로컬 설정의 Origin 항목만 선택적으로 확인해 실제 사용 중인 주소로 재검사했다. 비밀 키·인증서 내용은 읽거나 출력하지 않았다. 실제 기기/출시 주소가 달라질 경우 정확한 Origin을 별도로 확인해야 한다. 허용 목록 확대나 `*` 적용은 하지 않았다. Origin 검사는 브라우저 CORS 경계이며 사용자 인증·월 호출량 소모 차단을 대체하지 않는다.

재실행은 확인된 주소를 명시한다. 자동 재시도는 없다.

```powershell
node scripts/diagnose-toss-origin.mjs https://zduyaejdjwfhsiazcmrn.supabase.co/functions/v1/toss-hints https://t-crossword.private-apps.tossmini.com
# 마지막 인수로 preview-origin,preflight처럼 필요한 검사만 선택할 수 있다.
node scripts/verify-toss-device-api.mjs https://zduyaejdjwfhsiazcmrn.supabase.co/functions/v1/toss-hints "disallowed origin"
```

## 실행한 시험 범위와 재실행 절차

`scripts/verify-toss-concurrency.mjs`는 기본 실행 시 계획만 출력한다. 별도 동의 후 `--execute <승인한 project-ref>`를 사용한다. 입력 프로젝트와 서버 환경의 Supabase URL이 정확히 같아야 하며 서버용 service-role 키는 기존 환경에서만 받는다. 키를 인수·로그·문서에 넣지 않는다. 새 서비스 가입·패키지 설치·키 회전·스키마 변경·함수 배포는 없다.

| 항목 | 고정 범위 |
| --- | --- |
| 제안 대상 | 기존 crossword `zduyaejdjwfhsiazcmrn`; 승인 전 실행 금지 |
| 별도 합성 데이터 | 사용자 1명·임의 세션 2개·판 1개·스냅샷 1개·힌트 요청 기록 최대 4개 |
| 동시 요청 | 최대 2개, 단계별 진행; 자동 재시도·대량 반복 없음 |
| 요청 수 | Edge 15회 + 세션 생성 RPC 2회 + 해당 합성 데이터 읽기 4회 = 총 21회 상한 |
| 정리 | 추가로 SQL 트랜잭션 1회; 생성한 합성 사용자 해시에 연결된 행만 삭제 |
| 기대 잔액 | 합성 사용자만 10→9→8→13; 기존 사용자의 잔액·판은 수정하지 않음 |
| 중단 | 20초 요청 제한, HTTP 오류·검증 불일치 시 후속 단계 중단; 이미 시작한 최대 2개는 완료될 수 있음 |

공통 단어장 CAT·TAP의 유효한 중급 8×8 교차 배치를 사용한다. 먼저 서버 전용 RPC로 합성 사용자/세션만 준비한다. 이는 실제 토스 인증 성공을 시험하는 과정이 아니며, 실제 사용자의 SDK 코드나 세션을 복사하지 않는다.

1. 두 세션으로 같은 요청 UUID/배치를 동시에 등록하고 같은 판 ID인지 확인한다.
2. 등록 응답 본문을 버리고 같은 요청을 재전송해 같은 판인지 확인한다.
3. 같은 힌트 UUID 중복 요청·다른 UUID로 같은 칸 요청에서 1개만 차감되는지 확인한다.
4. 다른 단어 힌트 응답을 버린 뒤 재요청해 추가 차감이 없는지 확인한다.
5. 첫 정답 제출 후 마지막 정답을 두 세션에서 동시에 제출하고 한 응답을 버린다. 다시 제출해 보상 +5가 한 번인지 확인한다.
6. 해당 합성 사용자만 조회해 판/스냅샷 1개, 세션 2개, 힌트 요청 4개, solved 중복 없음·rewarded와 최종 잔액 13을 확인한다.

응답 폐기는 서버가 응답 헤더를 보낸 후 본문을 취소하는 방식이다. 물리적인 네트워크 단절이나 서버 commit 이전/이후 모든 타이밍을 증명하지 않는다. 실제 원격 HTTP/RPC 트랜잭션을 중첩시키지만 DB 연결 PID·행 잠금 대기를 강제/관측하지 않으므로 모든 다중 연결 경합과 교착 상태를 검증했다고 표현하지 않는다. psql·Docker는 현재 명령 경로에 없어 별도 설치하지 않았다. 강제 잠금 경합 검증은 별도 테스트 DB/직접 연결 환경이 준비되면 추가한다.

실행 전에 `tmp/toss-concurrency-<runId>/scope.json`과 `cleanup.sql`을 저장한다. 원문 세션 토큰·키는 파일에 저장하지 않는다. 성공 시 `result.json`만 추가하며 실패 시에도 복구용 scope/SQL은 남는다. 정리 SQL은 스키마 변경이나 전체 삭제 없이 이 실행의 합성 사용자 해시로 한정한 DELETE 다섯 개를 한 트랜잭션으로 실행한다. 실패로 일부 합성 기록만 생겨도 같은 SQL로 범위 내 정리가 가능하다. FK/권한 오류 시 임의 권한 변경·광범위 삭제를 하지 않고 중단한다.

```powershell
# 네트워크·DB 쓰기 없이 계획 출력
node scripts/verify-toss-concurrency.mjs
# 로컬 시나리오 안전장치 검사: 실제 DB/동시성 검증이 아님
node --test scripts/verify-toss-concurrency.test.mjs
# 위 표의 쓰기·요청·정리 범위 승인 후에만 실행
node --env-file=apps/toss-api/.env.local scripts/verify-toss-concurrency.mjs --execute zduyaejdjwfhsiazcmrn
# 이어 해당 실행 폴더의 cleanup.sql을 검토·승인 범위 내 적용하고 0행 결과 확인
```

기존 서버 환경의 service-role 권한으로 대상 테이블 SELECT와 세션 RPC가 가능해야 한다. 환경/권한이 다르면 설정을 추측해 수정하지 않는다. 기존 운영 DB의 유효 사용자 작업과 동시에 돌리지 않는 시간을 정해 시행한다.
