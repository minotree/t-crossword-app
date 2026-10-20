# 토스 광고 테스트 연동

2026-10-20 구현. 사용자는 광고 노출을 최소화하기 위해 선택 시청 보상형(힌트 5개)과 하단 배너 하나를 선택했다. 자동 전면 광고는 없다. PWA에는 적용하지 않는다.

최신 테스트 업로드(2026-10-20): 배너 최하단·퀴즈/단어장/그림책 상단 공간 정리를 포함한 30,450,338바이트 번들 업로드 성공. deploymentId `01a1574a-f255-7367-891b-bbf8d9e941df`, 주소 `intoss-private://t-crossword?_deploymentId=01a1574a-f255-7367-891b-bbf8d9e941df&host=appsInTossHost`. 실제 기기 배치는 확인 대기다.

## 화면·SDK

- 설치 SDK `@apps-in-toss/web-framework` 3.8.0의 `loadFullScreenAd`/`showFullScreenAd`, `TossAds.initialize`/`attachBanner`를 사용한다. 추가 의존성은 없다.
- 상단 힌트 잔액과 설정의 `광고 보고 힌트 5개 받기`로 보상 화면을 연다. 화면에서 로드 후 사용자가 시청 버튼을 눌러야 표시한다. 로드 실패·미지원 환경은 안내하고 일반 기능 이용을 허용한다.
- 보상형 `ait-ad-test-rewarded-id`, 리스트 배너 `ait-ad-test-banner-id`만 사용한다. 운영 ID를 입력하는 설정은 아직 없다. 테스트 ID를 운영 수익 광고로 간주하지 않는다.
- 최신 테스트 번들은 배너를 하단 메뉴 아래의 최하단 영역(컨테이너 100% × 96px, 메뉴와 16px 간격)에 하나 표시한다. 하단 안전 영역은 앱 셸 바닥에서 처리해 광고가 없을 때도 메뉴를 보호한다. 공식 옵션의 card/expanded는 형태 차이이며 작은 높이 프리셋이 아니므로 광고 본문을 임의 축소/자르지 않는다. SDK의 광고 표시·표준 UI를 유지한다. 앱이 주기적으로 새로고침하지 않는다. no-fill/오류는 영역을 접는다.
- 보상 화면이 열리면 배너를 제거해 보상형/배너 동시 로드를 피한다. 초기화 중이던 배너도 해제 뒤 부착하지 않는다. 각 콜백·배너 인스턴스는 정리한다. SDK의 자체 자동 갱신과 초기 네이티브 요청의 실제 취소 여부는 별도 기기 검증 대상이다.
- 광고 로드 대기는 20초, 광고 표시 이벤트 대기는 120초 상한이다. 뒤로가기/닫기는 광고 표시·서버 요청 중에는 대기하고, 실패 후에는 닫을 수 있다. SDK 광고 자체의 닫기/뒤로가기는 가로채지 않는다.

## 보상과 신뢰 경계

- API `POST /ads/test/prepare`, `/ads/test/claim`은 기본 비활성화다. 서버 환경변수 `TOSS_TEST_AD_REWARDS=true`인 명시적 테스트에만 허용한다. 지정 테스트 ID와 UUID, 인증된 토스 세션이 필요하다.
- prepare는 사용자별 요청을 저장하며 잔액을 늘리지 않는다. 앱은 `userEarnedReward` 수신 뒤 광고가 닫히면 claim한다. 클릭·단순 닫기는 지급하지 않는다. SDK가 전달한 수량을 보상량으로 사용하지 않는다.
- DB는 사용자 지갑 행을 잠그고 고정 5개 추가와 지급 기록을 한 트랜잭션에서 처리한다. 같은 사용자·UUID의 중복 claim은 현재 잔액만 반환한다. 다른 사용자·미준비·30분 지난 미지급 요청을 거부한다. 이미 지급된 요청 재시도에는 만료를 적용하지 않는다.
- 시험 보호 한도는 prepare 1분에 1회, 최근 24시간 10회다. 실제 지급뿐 아니라 중도 취소한 prepare도 한도에 포함한다. 클라이언트에는 보상 실패 시 같은 UUID 재시도 버튼을 제공한다. 앱을 열어 둔 동안 모달을 닫았다 열어도 미지급 요청을 유지한다. 종료/새로고침 후 영속 복원은 미구현이다.
- 실제 기기에서 사용자가 목록 버튼 정상·광고 보상 16→21을 확인했다. 1분 제한 오류가 `다시 준비하기`로 표시된 화면에 따라 준비 성공 시 앱 내 60초 대기와 남은 초 표시를 추가했다. 서버의 `ad_reward_limit`도 일반 로드 오류와 구분해 최소 60초 대기 후 준비한다. 서버 한도는 변경하지 않았으며 24시간 한도를 초과하면 60초 후에도 서버 안내에 따라 지급이 거부될 수 있다. 잔여 시간을 서버에서 받은 것은 아니므로 다른 세션·재실행 상황의 정확한 해제 시각을 보장하지 않는다.
- **서버는 광고 제공자의 시청 증명/서명을 검증하지 않는다.** prepare/claim 직접 호출로 SDK 이벤트를 위조할 수 있으므로 인증·UUID·한도는 실제 시청 증명이 아니다. 테스트 전용이며 운영 광고 ID나 유료·교환 보상으로 확대하지 않는다. 운영 전 검증 수단 또는 명시적 위험 수용을 별도로 결정해야 한다.
- 새 테이블은 RLS 활성화·클라이언트 권한 없음, 새 RPC는 service_role만 실행 가능하다. 기존 웹 지갑·토스 힌트/완성 보상 함수를 변경하지 않는다. 광고 지면 클릭 자체에는 보상을 주지 않는다.

## 적용 순서와 승인 범위

1. 별도 사용자 승인 후 기존 crossword DB에 `supabase/migrations/20261020_toss_test_ad_rewards.sql`을 적용한다. 테이블 1개·함수 1개를 추가하며 기존 데이터 삭제는 없다.
2. 승인 후 `TOSS_TEST_AD_REWARDS=true`를 서버에 설정하고 새 `toss-hints` Edge 번들을 배포한다. mTLS 인증서·키는 변경하지 않는다. 환경변수 활성화 자체도 운영 변경이다.
3. 승인된 테스트 앱 업로드를 진행한다. 공개 검토 요청·출시는 포함하지 않는다. API 비활성/구버전이면 시청 전에 준비 실패를 안내한다.
4. 실제 토스 콘솔 테스트 링크에서 배너·보상형 지원, Safe Area·작은 화면의 퍼즐 공간, 광고 닫기, 완료 시 +5, 중도 닫기 미지급, 재시도 중복 지급 방지를 확인한다. 브라우저 모의 SDK·PGlite 검사는 실제 광고 검증이 아니다.

2026-10-20 사용자의 `업로드까지 해줘` 승인 후 기존 crossword 프로젝트(`zduyaejdjwfhsiazcmrn`)에 지정 SQL만 `db query --file`로 적용했다. 새 테이블/RPC 부재와 기존 지갑 존재를 먼저 확인했다. 적용 후 RLS true, anon 조회/RPC 실행 false, authenticated INSERT/RPC 실행 false, service_role 실행 true를 확인했다. 기존 데이터 삭제·마이그레이션 이력 테이블 변경은 하지 않았다.

`TOSS_TEST_AD_REWARDS=true` 설정 1개를 등록하고 `toss-hints`를 배포해 v5 ACTIVE·verify_jwt false 유지를 확인했다. 원격 요청 3회에서 health 200, 무인증 claim 401, 테스트 경로 활성 상태에서 가짜 세션 prepare 401(unauthorized)을 확인했다. 실제 사용자 세션이나 지갑 잔액을 바꾼 원격 시험은 아니다. 키/인증서 내용은 읽거나 출력하지 않았다.

광고 포함 `.ait` 30,449,932바이트 업로드 성공(exit 0). deploymentId `01a1572b-1006-7544-84b2-4adaf309a538`, 테스트 주소 `intoss-private://t-crossword?_deploymentId=01a1572b-1006-7544-84b2-4adaf309a538&host=appsInTossHost`. 실제 광고 표시·보상 +5·중도 닫기·가독성은 사용자 기기 확인 대기다. 공개 검토 요청·출시는 하지 않았다. 기존 광고 없는 앱의 기기 테스트 완료와 신규 광고 검증을 구분한다.

## 공식 근거

기기 피드백 반영 수정본 업로드(2026-10-20): 배너 바깥 여백 축소·보상 대기 안내, 토스 테스트 73개/lint/build:ait 통과. deploymentId `01a1573d-a6d1-78ca-a339-a5199c927829`, 번들 30,450,207바이트. 테스트 주소 `intoss-private://t-crossword?_deploymentId=01a1573d-a6d1-78ca-a339-a5199c927829&host=appsInTossHost`. DB/API는 바꾸지 않았다. 수정본 기기 검증은 대기다.

확인 날짜: 2026-10-20. 테스트는 테스트 ID를 사용하고 실제 토스 콘솔 테스트로 확인한다. SDK는 샌드박스 광고를 지원하지 않는다. 배너·보상형을 동시에 로드할 때 일부 Android 버전에서 이벤트가 누락되는 이슈가 문서화되어 있다.

- [광고 소개·정책·콘솔 등록](https://developers-apps-in-toss.toss.im/guide/monetization/in-app-ad.md)
- [보상형 API·완료 이벤트·테스트 ID·동시 로드 이슈](https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/interstitial-rewarded-ad.md)
- [배너 API·표준 UI·크기·자동 갱신·정리](https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner.md)
