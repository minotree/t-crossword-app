# 십자낱말 영단어 앱 (t-crossword-app) 구현 진행표

## 퀴즈 새 퍼즐 2회당 전면광고 1회 (2026-10-30)

- 사용자 요청으로 토스 App의 새 퍼즐 공통 흐름에 실행 중 카운터를 추가했다. 새 퍼즐 버튼·완성 화면 새 퍼즐·난이도/크기 변경을 합쳐 2/4/6회째 광고를 요청한다. 첫 진입·기존 판 복귀·같은 설정·생성 실패는 집계하지 않는다. 앱 재실행 시 초기화하며 그림책 연속듣기 광고는 별도다. 출제 성공 후 광고를 처리하고 화면을 전환한다. 기존 광고 미준비/미지원/실패 처리와 중복 실행 잠금은 유지한다.
- hintsApp 테스트에서 설정 변경→새 퍼즐의 누적 간격과 실패 제외를 검증했다. `vitest run tests/hintsApp.test.tsx tests/pictureBookAudio.test.tsx` 25개, 토스 lint, production build(타입 포함), git diff --check 통과. 실제 토스 기기 광고 빈도 확인은 미실행이다. 기존 큰 JS 청크 경고는 유지된다. 배포용 패키지 생성·업로드는 하지 않았다.

## 토스 연속듣기 회차 전환 레이아웃 고정 (2026-10-30)

- 반복 대기의 `1초 후 다시 재생`이 회차와 같은 flex 줄을 차지하면서 두 버튼이 좁아지고 텍스트가 줄바꿈되는 사용자 화면을 확인했다. PictureBookAudio와 styles.css에서 버튼 2개·회차를 고정된 3열로 나누고 대기/로딩/오류 안내는 아래 별도 줄에 표시한다. 안내가 비어도 한 줄 높이를 확보해 정상 재생↔반복 대기 시 버튼 폭과 아래 해석 위치가 변하지 않도록 했다.
- 토스 lint, production build(타입 포함), 음성 테스트 8개, git diff --check 통과. 실제 기기의 작은 화면·폰트 확대 시 배치는 사용자 확인 대상이다. 다른 앱의 UI는 이번 수정 대상이 아니다. 업로드·배포용 패키지 생성은 하지 않았다.

## 콘텐츠 음성 Cloudflare 배포 확인·앱 주소 연결 (2026-10-30)

- 사용자가 그림책 119개·응원 문구 50개의 정적 패키지(175개 파일, MP3 18,550,080바이트)를 새 `crossword-content-audio.minotree0902.workers.dev`에 직접 업로드했다. 기존 단어장 프로젝트는 변경하지 않았다. 패키지 도구는 `scripts/package-content-audio.py`, 준비 ZIP은 `artifacts/crossword-content-audio.zip`이다.
- `scripts/check-content-audio-remote.py`로 공개 174개 파일의 HTTP/실제 바이트 해시와 MP3 MIME/CORS/캐시, manifest CORS를 통과했다. Python 기본 요청의 403을 브라우저 User-Agent로 재확인했고 결과는 content/picture-book-audio/content-audio-remote-validation.json에 보관했다. 119개 원문/해시/디코딩/원본ZIP, 응원 문구 50개 검사도 통과했다. 원본 이미지 원복으로 JSON 해시가 달라진 것은 생성 당시 파일 백업과 구조 비교해 image 경로만 달라졌음을 확인했다.
- 웹·토스·모바일 그림책 듣기/연속듣기를 원격 주소에 연결하고 선택적 env 주소 재정의를 유지했다. 토스 응원 문구도 새 원격 주소로 연결했다. 토스 테스트 27개, 웹/토스 lint, 세 앱 production build(타입 포함) 통과. 큰 JS 청크 경고는 유지된다. 실제 청취·광고·기기 검증과 앱 배포용 패키지 생성/업로드는 별도다. 기존 정적 파일은 보존했다.

## 그림책 글자·단락 배치 원복 (2026-10-30)

- 사용자 요청으로 중급 36장·고급 38장의 이미지 경로, 중급 제작 기록, 세 앱 WebP 222개와 파생 데이터/이미지 manifest를 글자 확대 전 백업으로 복원했다. 원문·번역·그 외 메타데이터가 변경 전과 같은지 쓰기 전에 검사하고 변경 전 원본 PNG 해시를 대조했다. 토스 승인도 해당 16편만 원래 항목으로 되돌렸다. 초급과 듣기·연속듣기/광고/5·10회 재생 코드는 유지한다.
- `scripts/restore-original-picture-book-layout.py`는 복원 대상 268개 파일의 직전 상태를 `artifacts/picture-book-before-original-layout-20261030.zip`으로 추가 보관했다. 확대본 이미지·갤러리·제작 기록은 이력으로 남기며 삭제하지 않았다. 원본 갤러리를 다시 생성했다. 기존 본문 확대 검사 도구는 확대 이력용이며 현재 앱의 합격 기준이 아니다.
- 중급/고급 build-preview.py(어휘·원본·제작 기록 포함), 토스 원본/승인/파생 이미지 해시 검사, 모바일 61편/119장 해시 검사를 통과했다. 실제 기기 확대/단락 가독성은 사용자 확인 대상이다. 업로드·배포·배포용 패키지는 만들지 않았다.
- 세 앱 production build(타입 포함), 토스 그림책/듣기 테스트 16개 통과. 동일 파일명 WebP 바이트가 바뀌므로 설치형 웹/PWA의 기존 이미지 캐시에서는 이전 확대 이미지가 남을 수 있다. 실제 브라우저 캐시 갱신은 별도 확인 대상이며 빌드 성공을 기기 표시 검증으로 보지 않는다.

## 그림책 듣기 화면 누락 수정 (2026-10-30)

- 앞선 듣기/연속듣기·0.7 제거 요청이 설명에만 머물렀음을 확인하고 실제 세 앱 UI/재생 어댑터에 반영했다. 듣기는 1회, 연속듣기는 횟수 모달에서 5/10회 선택 후 일반 속도로 재생한다. 이전 0.7·1/3/5/무한 UI를 제거했고 중지·이동·숨김 시 반복 취소/1초 간격은 유지한다.
- 토스는 기존 interstitial show 종료 후 횟수 모달을 표시하며 기존 광고 미준비/미지원/실패 시 광고 없이 진행하는 정책을 따른다. 웹/모바일은 광고 연동이 없어 모달을 바로 연다. 음성 주소 미설정 상태에서도 버튼/모달을 확인할 수 있지만 재생은 비활성이다. 토스 광고 대기 중 중복 클릭·화면 이탈 후 늦은 모달 표시를 방지한다. 그림책 모달의 토스 뒤로가기는 목록 이동보다 먼저 닫는다.
- 웹/토스 lint, 세 앱 production build(타입 포함), 토스 그림책 테스트 17개 통과(정확한 1/5/10회·1초 간격·정상 속도·중지/이동/숨김 취소·광고 대기→선택 모달·늦은 광고 완료 무시). 기존 큰 JS 청크 경고는 유지된다. 실제 기기 광고/모달/재생은 미검증이다. 배포용 파일·업로드·배포는 수행하지 않았다.

## 그림책 반복 듣기 (2026-10-30)

- 웹·토스·모바일 그림책에 1회(기본)·3회·5회·계속 반복을 추가했다. 첫 재생을 포함한 총 횟수이며 같은 MP3/Audio 요소를 일반·0.7배속으로 재사용하고 재생 사이 1초 쉰다. 현재 회차와 대기 상태를 표시한다. 횟수 변경은 현재 재생을 중지하고 다음 재생부터 적용한다. 중지·페이지/작품/메뉴 전환·숨김 시 반복 대기 타이머도 취소하고 페이지 변경은 1회로 초기화한다.
- 토스 음성 회귀 테스트에 정확한 1/3/5회·1초 간격·한 번의 manifest 요청·0.7배속 유지·계속 반복 중 중지·페이지/횟수/pagehide 변경 시 대기 취소를 추가했다. 그림책 관련 20개 테스트와 웹/토스 lint를 통과했다. 실제 원격 주소 설정 전에는 기존 준비 중 상태를 유지한다. 실제 브라우저·기기 반복 재생 검증과 음성 업로드는 별도다.
- 웹·토스·모바일 production build(타입 포함) 통과. 기존 큰 JS 청크 경고는 유지된다. 토스 조작 영역은 작은 화면에서 줄바꿈하도록 했다. 배포용 AIT/APK 생성·커밋·푸시·배포는 하지 않았다.

## 그림책 일반·0.7배속 듣기 제어 준비 (2026-10-30)

- 사용자 선택으로 웹·토스·모바일의 그림책 읽기 화면에 일반/느리게(0.7배속) 듣기를 추가했다. 각 앱은 자체 UI·재생 어댑터를 소유하며 같은 MP3의 재생 속도만 바꾼다. 응원 문구는 기존 일반 듣기를 유지한다.
- HTTPS 정적 디렉터리의 manifest를 클릭 시 읽어 페이지 ID·영어 원문·해시 파일명을 확인하고 재생한다. 페이지/작품/메뉴 이동·숨김/pagehide에서 요청 취소·음성 중지를 처리하며 로딩/버퍼링 15초 후 오류와 재시도를 제공한다. env `VITE_PICTURE_BOOK_AUDIO_BASE_URL` 미설정 시 준비 중·비활성으로 둔다. 현재 그림책 Qwen 생성은 진행 중이므로 최종 manifest 원격 업로드와 주소 연결은 아직 하지 않았다.
- 세 앱 build(타입 포함), 웹/토스 lint, 토스 그림책 회귀 테스트 13개(음성 4개 포함)를 통과했다. 1.0/0.7에서 같은 파일 사용·음정 보존 요청·페이지 전환 해제·원문 불일치 차단·늦은 요청 취소·타임아웃/숨김을 검사했다. 기존 큰 JS 청크 경고는 유지된다. 실제 기기 재생·가독성·Capacitor sync·배포용 패키지 생성은 미실행이다.

## 토스 퀴즈 응원 문구 영어 듣기 (2026-10-30)

- 사용자가 기존 일반인 성우 af_heart를 선택했다. 사용자 제공 응원 문구 50개의 영어만 기존 오프라인 Kokoro로 생성하고 24kHz mono/64kbps MP3 총 1,144,128바이트를 토스 앱 정적 파일에 포함했다. 실제 바이트 해시 파일명·입력/모델 provenance·음소·길이·제작 보고서를 `content/encouragement-audio/`에 기록했다. 생성 도구는 `scripts/prepare-encouragement-audio.py`, 청취 미리보기는 `artifacts/encouragement-audio/public/index.html`이다.
- `EncouragementAudio.tsx`와 App 연결로 해석 버튼 옆 영어 듣기/중지를 제공한다. 클릭 전 로딩하지 않고 새 문구·메뉴 이동·백그라운드에서 중지한다. 초기/버퍼링 15초 제한과 오류 재시도·늦게 실패하는 play Promise의 취소 보호를 제공한다. 설정에 AI 음성 고지를 추가했다. 기존 해석 버튼의 펼침/스크롤 동작을 유지하며 그림책 생성 작업과 Cloudflare 파일은 바꾸지 않았다.
- 통과: `artifacts/tts-venv/Scripts/python.exe scripts/check-encouragement-audio.py`(50개 원문/manifest/바이트 해시·디코딩·유한값·비무음·음소 누락), 토스 lint, production build(타입 포함), `vitest run tests/encouragementAudio.test.tsx tests/hintsApp.test.tsx` 19개. 새 음성 테스트는 클릭/중지·문구 변경 해제·숨김 중지·타임아웃 재시도·취소 후 늦은 실패를 검사한다. 빌드의 기존 큰 JS 청크 경고는 유지된다.
- 전수 청취·발음/억양 검수와 실제 토스 기기 버튼 배치·오디오 포커스는 미실행이다. 웹/모바일에는 기존 응원 문구 화면이 없어 이번 작업은 토스에 적용했다. 배포용 AIT/APK/업로드·커밋·푸시는 하지 않았다.

## 그림책 페이지 표시 위치 복구 (2026-10-30)

- 중급·고급 74장의 `현재 / 전체`를 본문 아래에서 제목·소제목 아래 오른쪽으로 이동했다. 글자 크기·본문 조판·삽화를 유지하고 하단 빈 영역을 줄였다. v3 이미지와 제작 기록을 연결하고 v2 이미지·비교·검수 기록을 보존했다. 직전 상태는 별도 `artifacts/picture-book-page-number-backup-20261030/`에 백업했다.
- 모든 카드의 페이지 표시 충돌·경계와 본문 픽셀 보존을 검사하며 The Memory Deposit 7/10 대표 시각 검사를 수행했다. 원본 어휘/제작 기록 검사는 중급·고급 build-preview.py로 통과했다. 실제 기기 검증은 미실행이다.
- 세 앱 이미지 변환 및 production build(타입 포함), 토스 승인/원본/이미지 해시 검사와 모바일 해시 검사, 토스 번들 크기 검사를 통과했다. 기존 큰 JS 청크 경고는 유지된다. 본문·앱 동작 변경이 없어 기존 그림책 테스트를 반복하지 않았다. 배포·커밋·푸시는 하지 않았다.

## 그림책 제목·소제목 크기 순서 수정 (2026-10-30)

- 사용자 지적에 따라 중급·고급 74장의 제목 88px > 소제목 72px > 본문 64px로 수정했다. 본문 확대 크기를 유지했다. `scripts/refine-picture-book-hierarchy.py`로 v2 이미지를 만들고 v1 이미지·조판/검수 기록·제작 기록을 보존했다. 직전 718개 파일/418,117,718바이트는 별도 `artifacts/picture-book-hierarchy-backup-20261030/`에 보관한다.
- 전체 줄 경계·원문 일치 검사와 대표 4장 시각 검사를 수행했다. 원본/현재 메타데이터 비교·삽화 픽셀 보존·초급 파일 보존·앱별 해상도 검사는 기존 검사 도구를 사용한다. 실제 기기 검증은 미실행이다. 비교 화면은 동일 경로의 index.html을 새로 열어 확인한다.
- 통과: 중급·고급 build-preview.py(어휘 검사 포함), 세 앱 이미지 준비, check-large-picture-book-text.py, prepare-toss-picture-books.mjs, check-mobile-picture-books.mjs, 세 앱 production build(타입 검사 포함). 본문/앱 로직은 바뀌지 않아 앞서 통과한 그림책 테스트는 반복하지 않았다. 기존 큰 JS 청크 경고는 유지된다.

## 중급·고급 그림책 본문 확대 및 복원 백업 (2026-10-30)

- 작업 전 570개 파일/307,377,863바이트를 `artifacts/picture-book-layout-backup-20261029/before.zip`으로 백업하고 해시·ZIP 무결성을 검사했다. `scripts/backup-picture-book-layout.py`는 완료 해시를 기록하고 이후 수정이 없는 기존 파일만 복원한다. 별도 임시 디렉터리에서 복원 성공·새 파일 유지·이후 사용자 수정 시 쓰기 전 중단을 시험했다. 백업은 Git 제외이므로 별도 보관이 필요하다.
- 중급 36장·고급 38장의 원본 PNG를 보존하고 `-large-text-v1.png`에 기존 삽화 crop을 픽셀 그대로 유지하면서 본문 64px/줄 간격 88px로 조판했다. Source Serif 4의 공식 고정 revision·OFL 1.1·파일 해시를 `content/fonts/source-serif/`에 기록했다. AI 이미지 재생성 호출은 0회이며 영어·해석·제목·순서는 바꾸지 않았다. 크림색 본문 패널로 장식을 단순화하고 페이지 높이는 1918~2376px로 늘어났다.
- 원본 74장과 새 카드 전체의 19개 시트를 시각 대조했다. `content/picture-book-large-text-2026-10-29/`에 전후 비교·조판 좌표·검수 근거를 보관하고 제작 기록·원본 참조·승인 해시·웹/토스/모바일 WebP를 연결했다. 앱 준비 스크립트는 이 버전의 세로 높이를 보존한다. 이전 사전 검수는 변경 전 스냅샷이며 현재 검수는 새 기록을 따른다.
- 통과: 중급/고급 `validate.py`와 `build-preview.py`, 세 앱 이미지 준비, `python scripts/check-large-picture-book-text.py`(원문/메타데이터·삽화·222개 앱 이미지 해상도·초급 파일 보존), `node scripts/prepare-toss-picture-books.mjs`, `node scripts/check-mobile-picture-books.mjs`, `node scripts/check-toss-picture-book-build.mjs`(dist 34,465,417바이트), 세 앱 `pnpm.cmd --filter @t-crossword/{web,toss,mobile} build`(타입 포함), 웹 그림책 테스트 10개와 토스 그림책 테스트 9개. 빌드에는 큰 JS 청크 경고가 있다.
- 실제 브라우저/휴대폰·토스 기기의 확대 가독성과 세로 스크롤은 미검증이다. Capacitor sync·APK·AIT 생성·배포·커밋·푸시는 하지 않았다. 관련 명령·복원 조건은 새 검수 README를 따른다.

## 중급·고급 그림책 본문 확대 사전 검수 (2026-10-29)

- 사용자 요청으로 현재 books.json이 참조하는 중급 36장·고급 38장 PNG를 view_image로 각각 열어 삽화/본문 분리·경계·장식·공간 사용을 확인했다. 74장 모두 상단 삽화와 하단 밝은 읽기 패널이 구분되어 삽화를 유지하고 본문을 다시 조판할 수 있다는 판단이다. 일반 분리형 63장, 장식 테두리형 9장, 번짐 경계형 2장. 반복 제목 2장과 상단 복수 장면 보존 주의 페이지를 따로 기록했다.
- `content/picture-book-layout-review-2026-10-29/README.md`, `review.json`, `index.html`에 페이지별 관찰·현재 원본/본문 해시·크기·대략적 경계(±20px, 확정 크롭 좌표 아님)와 원본 링크를 남겼다. 원본 이미지는 모두 1024×1536이고, 해당 디렉터리에서 편집 레이어 파일은 찾지 못했다. `scripts/check-picture-book-layout-review.py`는 자료 변경 시 검수를 다시 요구하며 시각 검토를 자동 승인하지 않는다.
- 중요한 후속 제약: 웹/토스 변환은 높이 1536px, 모바일은 1600px thumbnail 제한이 있어, 본문을 키워 긴 이미지를 만들 때 이 제한을 그대로 적용하면 폭까지 줄어 글자 확대 효과가 감소한다. 실제 수정 시 높이 정책·새 폰트 권리·버전 이미지·파생 WebP·승인 해시·기기 가독성을 함께 검토한다. 페이지 분할 없이 하단을 길게 만드는 방향은 가능하지만 새 조판 결과는 아직 만들지 않았다.
- `python scripts/check-picture-book-layout-review.py` 통과: 원본/본문 해시·74개 페이지 누락/중복·이미지 크기/무결성·갤러리 링크·분류 집계 확인. `git diff --check` 통과. 이미지 생성 호출·원본 수정·앱 변경·기존 승인 갱신·배포는 없음. 영어/번역/권리 재전수 검토·실제 기기 검증·새 조판 검수는 이번 범위가 아니며 기존 2026-10-19 콘텐츠 승인과 구분한다. 앱 실행 코드/설정은 변경하지 않아 앱 빌드·테스트는 반복하지 않았다.

## 토스 퀴즈 응원 문구 수정·해석 버튼 (2026-10-29)

- 해석 버튼 후속 요청으로 해석을 펼친 DOM 반영 후 퀴즈 본문 스크롤을 맨 아래로, 닫으면 맨 위로 이동한다. 버튼을 통한 전환에만 적용해 새 퍼즐·탭 이동에서 불필요하게 이동하지 않는다. 동작 줄이기 설정에서는 즉시 이동하고 그 외에는 부드럽게 이동한다. App의 본문 ref/효과와 기존 회귀 테스트를 수정했다. `pnpm.cmd --filter @t-crossword/toss test` 107개, `lint`, `build`(타입 포함), `git diff --check` 통과. 추가한 동작 줄이기 검증도 후속 테스트 실행에서 통과했다. 실제 토스 기기 스크롤·배포는 미실행이다.
- 사용자 화면에서 해석 버튼이 하단 메뉴 위로 잘려 보이는 현상을 받아 퀴즈에 한해 제목 세로 여백 6→4px, 본문 세로 여백 6→4px, 설정/진행 하단 간격 12→8px, 그리드·문제 전체 보기 간격 12→8px, 응원 영역·하단 메뉴 여백을 소폭 축소했다. 해석 버튼은 높이 44→32px·12px 글씨로 조정했다. 퍼즐 가로 크기와 영문 16px/해석 14px는 유지하고 기존 본문 스크롤로 낮은 화면과 펼친 해석에 접근한다. 후속 CSS 변경의 `pnpm.cmd --filter @t-crossword/toss lint`, `build`(타입 포함), `git diff --check` 통과. CSS만 변경되어 앞선 동작 테스트는 반복하지 않았다. 실제 토스 기기 재확인·브라우저 좌표 검증은 미실행이다.
- 사용자 제공 수정본 50개를 `apps/toss/src/data/encouragements.json`에 순서대로 반영했다. 기존 퍼즐별 문구 선택·색상 흐름을 유지하고 영문 14→16px, 한글 12→14px로 확대했다. 출처는 이번 대화의 사용자 제공 문구이며 외부 격언/작가 인용으로 표시하지 않는다.
- App의 퀴즈 하단에 TDS `해석 보기`/`해석 닫기` 버튼을 추가했다. 해석은 기본 숨김이며 `aria-expanded`/`aria-controls`로 상태와 대상을 연결한다. 새 퍼즐·난이도/크기 변경으로 새 판을 만들면 다시 접힌다. 버튼 조작 영역은 최소 44px이며 낮은 화면은 기존 본문 스크롤을 따른다.
- `pnpm.cmd --filter @t-crossword/toss test` 107개, `lint`, `build`(타입 검사 포함), `git diff --check` 통과. 초기 검사에서 한글 stdin 인코딩 문제와 미지원 TDS 크기를 발견해 UTF-8 원문 및 기존 지원 `small`로 수정 후 재검사했다. 기존 큰 청크 경고 유지. 실제 브라우저·토스 기기 배치 검증·.ait 생성·업로드는 미실행이다. 웹/PWA·모바일 UI와 진행 중인 그림책 음성 제작은 변경하지 않았다.

## 그림책 영어 본문 TTS 제작 (2026-10-29)

- Python 메모리 읽기 오류 창 신고 후 확인: 당시 로그는 3페이지 생성 진입이었으나 후속 확인에서 3·4페이지 완료와 5페이지 진입을 확인했다. 작업 중단으로 단정한 초기 판단을 정정한다. 완료 4개 MP3의 해시·디코딩·비무음·길이를 별도 검사해 통과했다. 오류 창을 발생시킨 Python 프로세스와 원인은 미확정이다. 사용자가 오류 창을 닫았으며 기존 백그라운드 제작은 유지했다. 별도 진단 재시험은 모델 로딩 전 중단해 중복 제작하지 않았다. 차후 실행기의 자식 PID·네이티브 종료 코드·faulthandler 로그·프로세스 범위 오류 대화상자 억제를 보완했다. 현재 실행 중인 작업에는 실행기 변경이 소급 적용되지 않는다. Python 문법 검사·git diff --check 통과, 실제 네이티브 충돌 재현·보완 후 실패 상태 처리는 미검증이다.
- 후속 제작: 사용자가 직접 생성·청취 후 승인한 Qwen3-TTS 초급 `D:/Download/audio_12.wav`, 중급 `audio_17.wav`를 프로젝트 `content/picture-book-audio/references/`에 보존하고 프롬프트·전사 입력·SHA-256을 기록했다. 공식 1.7B Base 모델을 고정 리비전으로 다운로드하고 모델/토크나이저 전체 해시 및 Apache-2.0 원문을 보존했다. Qwen 설치 환경은 torch 2.15.0+cpu로 GPU 가속이 없었다.
- 첫 페이지 CPU 재현 시험 성공: 9.336초 MP3 74,688 bytes, 추론·인코딩 57.52초. 디코딩/비무음/길이 검사 통과. 초기 샌드박스 시도는 파일 저장 전 결과 없이 종료됐고 승인된 일반 실행에서 통과했다. 기존 SoX 미설치/FlashAttention 미설치 안내가 있으나 이 시험은 정상 완료됐다. 외부 설치 환경은 변경하지 않았다.
- 초급·중급 81페이지 재생성 → 고급 38페이지 기존 바이트 유지 → 새 manifest/미리보기/ZIP → 전체 검사를 수행하는 백그라운드 작업을 시작했다. `artifacts/picture-book-audio-qwen/job-status.json`, `progress.json`, `job.log`로 확인한다. 시작 시점에는 첫 페이지 재사용과 두 번째 페이지 생성 진입을 확인했다. **전체 생성·최종 검증은 진행 중이며 아직 통과로 보고하지 않는다.** 기존 전체 119개와 ZIP/manifest는 보존한다. 새 생성분의 목소리 일관성·전체 낭독 청취, 앱 연결·기기 검사·호스팅 변경·배포·Git 작업은 미실행이다.
- 추가 요청: 초급은 어린이, 중급은 청소년처럼 들리는 목소리, 고급은 현재 `af_heart` 유지. 공식 나이 구분이 없는 Kokoro의 `af_sky`·`af_bella`를 미선정 후보로 초급/중급 첫 작품에 각각 합성하고 기존 `af_heart`와 비교하는 샘플 6개를 준비했다. `artifacts/picture-book-voice-preview/public/index.html`, 제작 기록 `content/picture-book-audio/voice-audition.json`. `scripts/preview-picture-book-voices.py --download` 및 생성 명령 통과, 별도 Python 검사에서 6개 해시·MP3 디코딩/비무음 확인. 전체 119개는 유지하며 청취 후 성우 선정·전체 재생성은 대기다. 후보가 실제 어린이/청소년처럼 들린다고 검증한 상태는 아니다.
- 기존 로컬 Kokoro v1.0/af_heart 환경으로 초급 45편·45페이지, 중급 9편·36페이지, 고급 7편·38페이지의 영어 본문만 페이지별 MP3로 생성했다. 제목·해석은 낭독하지 않으며 원문·줄바꿈을 그대로 사용한다. 원본 그림책·앱 UI는 변경하지 않았다.
- 총 119개, 16,368,000 bytes, 2,046초(34분 6초). 미리보기 `artifacts/picture-book-audio/public/index.html`, 정적 ZIP `artifacts/picture-book-audio.zip`(14,401,616 bytes). 생성/재시도 스크립트와 독립 검사 스크립트, 원문·모델/음성·MP3 해시·발음 기호·제작 보고서를 보존했다. 상세는 `content/picture-book-audio/README.md`를 따른다.
- `artifacts/tts-venv/Scripts/python.exe scripts/prepare-picture-book-audio.py` 및 `artifacts/tts-venv/Scripts/python.exe scripts/check-picture-book-audio.py` 통과: 원본 전체 페이지 누락·중복 없음, 원문·해시·파일명·바이트·발음 기호 누락·MP3 디코딩/길이/유한값/비무음·ZIP 대응 확인. Python AST 문법 검사와 `git diff --check` 통과. 실행 중 기존 Torch API 경고가 있었으나 생성 실패는 없다. 앱 실행 코드/설정 변경이 없어 앱 전체 빌드·테스트는 실행하지 않았다.
- 공식 모델 카드의 Apache-2.0 및 사용 안내를 재확인하고 기존 권리 검토 범위·한계와 라이선스 고지를 연결했다. 전체 음성의 발음·억양·원문 낭독 청취 및 실제 기기 확인은 미실행이다. 앱 연결·Cloudflare 업로드·배포·커밋·푸시는 수행하지 않았다. ZIP에는 기존 단어장 파일이 없으므로 기존 호스팅을 교체하는 용도로 바로 업로드하지 않는다.

## PWA·하이브리드 긴 설명 스크롤·정답 버튼 유지 적용 (2026-10-28)

- 사용자 요청으로 토스 방식의 긴 설명 스크롤을 PWA와 모바일에 각각 적용했다. WordInputModal은 제목/닫기와 입력·버튼 영역을 분리하고 뜻·동의어·예문만 스크롤한다. 웹 전용 answerViewport 어댑터로 키보드 위 실제 영역을 따라 높이/위치를 제한하며 focus preventScroll을 적용했다. 작은 화면에서 설명 영역이 지나치게 작아지지 않도록 간격·입력칸 48px·동일 의미의 짧은 오답 안내를 조정했다.
- 모바일 AnswerEntry는 문제 설명과 입력/버튼 영역을 분리하고 기존 visualViewport 처리와 dialog 세로 flex를 연결했다. 320px 실제 Ionic 렌더링에서 버튼 줄바꿈을 발견해 padding·flex·nowrap·최소 높이 44px을 보완했다. 긴 원문은 생략하지 않고 극도로 낮은 화면의 바깥 모달 스크롤을 유지한다. 힌트·음성·완료·오답노트 정책은 변경하지 않았다.
- 검증 통과: apps/web에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 61개, `pnpm.cmd --filter @t-crossword/web lint`·`build`(타입 포함); 모바일 `pnpm.cmd --filter @t-crossword/mobile test` 30개·`build`(타입 포함), apps/mobile에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/letterHints.test.tsx tests/wordAudio.test.ts tests/wordAudioLifecycle.test.ts tests/wordAudioManifest.test.ts` 19개. 설명 영역 분리와 웹 viewport resize/리스너 해제를 검사했다. 기존 큰 청크 경고 유지.
- 실제 React/Tailwind·Ionic 컴포넌트와 CSS를 Headless Chrome에서 폭 390/320/844px·가용 높이 380/280/270px로 모사했다. 설명 스크롤 전후 버튼이 화면 안에 유지됨을 좌표·320px 캡처로 확인했다. PWA는 낮은 영역의 여백을 추가 조정한 뒤 재검사했다. docs/verification/20261028-web-mobile-answer-layout.json에 최종 결과를 보존했다. 임시 HTML/TSX fixture·전용 검사 서버·브라우저는 정리했고 로컬 캡처는 Git 제외 tmp/lint-tools에 있다.
- 권한 승인 후 `pnpm.cmd exec cap sync android`, JDK 21을 해당 명령 환경에 지정한 `gradlew.bat assembleDebug --console=plain` 통과. APK: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk, 34,850,410 bytes, SHA-256 D76E6686A7F48939CB896EC348712DAEB66863E72453433281C03FD4DEF8FDBB. APK/dist 자산 131개 해시 일치. 기존 Gradle flatDir 경고 유지. git diff --check 통과.
- 사용자가 Git 작업·토스 빌드·업로드를 직접 진행한다고 결정했다. 이번 작업에서 커밋·푸시·토스 .ait 생성·업로드·공개 배포는 하지 않았다. 설치 PWA 갱신·실제 Android/iOS 키보드·가로 회전·기기 조작은 미실행이다. 이전 토스 재현용 5174 개발 서버는 사용자 확인용으로 유지하며 기존 작업의 변경은 보존했다.

## 토스 로컬 긴 설명 모달 강제 재현 주소 (2026-10-27)

- 사용자 요청으로 `http://localhost:5174/?answer-layout=long` 개발용 시나리오를 추가했다. 실제 MASS 뜻·동의어와 6회 반복 예문으로 모달을 즉시 열고 기본 360px 최대 높이로 좁은 영역을 재현한다. height 쿼리로 180~600px 지정 가능하다. 닫기·다시 열기·일반 앱 복귀를 제공하며 학습/오답 기록은 저장하지 않는다.
- main.tsx는 DEV와 쿼리를 모두 확인해 dev/AnswerLayoutPreview.tsx를 동적 로드한다. 일반 주소·프로덕션 경로는 기존 App이다. 타입 포함 build·lint, 토스 테스트 100개·git diff --check 통과. 개발용 장문 fixture가 production JS에 포함되지 않는 것을 검사했다. 시나리오 즉시 열기·힌트 사용·재열기 초기화도 검사했다.
- `pnpm.cmd --filter @t-crossword/toss dev`로 5174 서버를 시작해 사용자 확인용으로 유지했다. 재현 주소·TSX 모듈 HTTP 200을 확인했다. 이전 별도 Headless Chrome 좌표 검사와 이번 실제 토스/사용자 브라우저 조작 여부는 구분하며 후자는 미실행이다. .ait 생성·업로드·배포는 하지 않았다.

## 토스 긴 뜻·동의어·예문으로 정답 버튼 가림 수정 (2026-10-27)

- 사용자 Android 토스 캡처에서 긴 설명과 키보드 표시로 모달 하단 버튼이 가려졌다. AnswerModal에 문제 설명 스크롤 영역을 추가하고 styles.css에서 열린 정답 dialog를 세로 flex로 구성해 제목/닫기·입력칸·힌트/정답입력을 축소 없이 유지한다. 설명만 남은 높이에 맞춰 스크롤하며 뜻·동의어·예문을 생략하지 않는다. 극도로 낮은 영역에서는 기존 dialog 스크롤도 유지한다. 모달 위치/키보드 anchor·TDS 버튼·힌트 정책은 유지했다.
- `pnpm.cmd --filter @t-crossword/toss test` 99개·`lint`·`build`(타입 포함), `git diff --check` 통과. 설명 영역과 입력/버튼 영역 분리 회귀 검사를 추가했다. 기존 큰 청크 경고 유지.
- 별도 임시 프로필의 Headless Chrome과 실제 React AnswerModal/TDS/CSS로 폭 390/320/844px, visualViewport 가용 높이 380/280/270px를 모사했다. 긴 설명에 스크롤이 생기고 전후 힌트/정답입력이 표시 영역에 유지됨을 좌표로 확인했다. 결과: docs/verification/20261027-toss-answer-layout.json. 390px 화면 캡처도 시각 확인했다. 임시 HTML/TSX fixture는 제거하고 전용 브라우저·검사 서버를 종료했다. 로컬 캡처/검사 도구는 Git 제외 tmp/lint-tools 아래에 있다.
- 실제 토스 Android/iPhone 키보드·가로 회전·화면 조작 재검증은 미실행이다. 이번 수정은 토스 모달에 한정하며 PWA·하이브리드 수정·.ait 생성·업로드·배포·커밋·푸시는 수행하지 않았다. 다른 작업의 기존 변경은 보존했다.

## 세 앱의 공개 음성 manifest 공유 연결 (2026-10-27)

- Web/PWA의 브라우저 TTS를 기존 Cloudflare MP3로 교체하고 토스·모바일도 공개 manifest를 조회하도록 연결했다. 기존 미커밋 힌트·모바일 작업은 보존했다. core는 플랫폼 중립의 manifest 검사와 전송 함수 주입형 요청 재사용만 담당하며 각 앱은 자체 재생 어댑터·UI·수명주기를 유지한다.
- 앱 ID 대신 대문자 영단어와 정확히 같은 예문으로 연결한다. 해시 포함 파일명·500ms 쉼·스키마·경로를 검증하고 누락·예문 불일치·목록/음성 실패를 카드에 표시한다. 클릭 재생·1.0/0.7배속·중복 재생 방지·화면 이탈 중지·늦은 응답 방어·실패 후 재시도를 처리한다. MP3 일괄 다운로드/precache·새 음성 생성·Cloudflare 변경은 하지 않았다.
- 공개 manifest를 curl로 실제 조회해 HTTP 200·JSON·CORS `*`를 확인했다. 현재 CSV SHA-256은 `d26ad70a72847dba259086c849c9ddb4da971d9696e28b87af98afdc5af36e2a`로 manifest와 바이트 단위 일치한다. `python scripts/check-shared-word-audio.py artifacts/shared-word-audio-manifest.json` 및 실제 공개 파일의 core parser 검사 통과: 3,839개, 누락·추가·예문 불일치 0개. 줄바꿈/인코딩 차이도 없다.
- 자동 검사 통과: `pnpm.cmd --config.verifyDepsBeforeRun=false -r run typecheck`, 같은 옵션의 `-r run build`, `--filter @t-crossword/web --filter @t-crossword/toss lint`, `--filter @t-crossword/core test`(79개), `--filter @t-crossword/toss test`(98개). 웹 디렉터리에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(59개), 모바일 디렉터리에서 같은 Vitest 경로로 `run tests/wordAudio.test.ts tests/letterHints.test.tsx`(14개) 및 `pnpm.cmd --config.verifyDepsBeforeRun=false test`(30개) 통과. 기존 대형 청크 경고는 남는다. `git diff --check` 통과.
- 실제 브라우저·설치 PWA·토스·Android/iOS 재생, 최초 클릭의 재생 정책·무음 모드·앱 전환·전화/음악/광고 오디오 포커스는 미검증이다. 이번 변경으로 APK/ait 생성·Capacitor sync·커밋·푸시·배포는 실행하지 않았다. 아래 기존 Android APK 기록은 해당 생성 시점의 결과이며 이번 공개 manifest 연결을 포함하는 새 APK 검증으로 해석하지 않는다.
- 모바일 추가 확인: Vitest에 `run tests`를 전달하면 Node test runner 전용 `.mjs` 6개를 Vitest 스위트로 인식하지 못해 실패했다. 실행기를 구분해 모바일 Vitest 명령은 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/wordAudio.test.ts tests/wordAudioLifecycle.test.ts tests/wordAudioManifest.test.ts tests/letterHints.test.tsx`로 실행했고 18개 통과했다. Node 전용 30개는 위 `pnpm.cmd ... test`로 별도 통과했다.

## Android 단어·예문 Cloudflare MP3 듣기 연결 (2026-10-27)

- 사용자 요청으로 모바일 단어장에 듣기·느리게(0.7배속)·중지와 로딩/오류/재시도를 연결했다. 기존 3,839개 단어+예문 MP3(삽입 쉼 0.5초)를 재사용하며 MP3/모델은 APK에 넣지 않는다. 인터넷 필요·AI 생성 음성 안내를 표시한다. 검색·필터·메뉴·document 숨김/pagehide·Capacitor appStateChange 비활성 전환·컴포넌트 해제 시 중지한다. 네이티브 호출은 모바일 lifecycle 어댑터로 분리했다.
- scripts/prepare-mobile-word-audio.mjs로 content 제작 원본·vocab/예문·제작 보고서·해시 파일명·0.5초 대응을 검사해 모바일 manifest를 준비한다. dev/typecheck/build에 연결했다. 기존 공개 Cloudflare 주소가 기본이며 VITE_MOBILE_WORD_AUDIO_BASE_URL로 변경 가능하다. 앱 간 소스 import·새 의존성·음성 재생성·Cloudflare 재배포·권한 추가는 없다. 기존 제작/권리 기록을 재사용하며 새 라이선스 확인이나 전수 청취를 수행한 것은 아니다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/mobile test` 30개, `pnpm.cmd --filter @t-crossword/mobile build`(타입·그림책·음성 대응 포함), apps/mobile에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/letterHints.test.tsx tests/wordAudio.test.ts tests/wordAudioLifecycle.test.ts tests/wordAudioManifest.test.ts` 18개. 재생은 탭 이후만 수행·속도/단어 전환·중지·지연/실패·늦은 콜백·앱 상태 리스너 정리·모든 어휘 대응을 검사했다. 모사 검사는 실제 기기 재생과 구분한다.
- `node scripts/check-mobile-word-audio-remote.mjs`는 최초 외부 연결 EACCES 후 권한 승인 재실행으로 통과했다. 공개 manifest 3,839개 원본 대응과 대표 MP3 YOU/LET/MINE/ABSTRACTION 4개 해시·HTTP 200·audio/mpeg·https://localhost 요청 CORS·immutable 캐시 확인. content/word-audio/mobile-remote-validation.json에 범위를 기록했다. 원격 MP3 전수 다운로드·실제 WebView 재생은 미실행이다.
- 웹 빌드 후 권한 승인된 `pnpm.cmd exec cap sync android`, 설치 JDK 21을 명령 환경에만 지정한 `gradlew.bat assembleDebug --console=plain` 통과. APK: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk, 34,861,997 bytes, SHA-256 1C89E09D1840507347BA922AB64FC2F19155B94C9E8F2E19859084B52D614162. APK/dist 자산 131개 해시 일치·공개 HTTPS 주소 포함·MP3/모델 미포함 확인. `git diff --check` 통과. 기존 큰 청크/flatDir 경고 유지.
- 실제 Android 설치·일반/느리게 재생·음량/무음/블루투스·전화/음악/광고 오디오 포커스·백그라운드/복귀·오프라인 오류 조작은 미실행이다. iOS·실제 광고 SDK·공개 배포·커밋·푸시는 하지 않았다. 작업 중 별도로 나타난 토스/PWA 음성 및 core manifest 관련 변경은 덮어쓰지 않고 보존했다.

## Android 하이브리드에 토스 최신 힌트 정책 적용·APK 재생성 (2026-10-27)

- 사용자 요청으로 모바일 AnswerEntry에 core 공통 규칙의 단어별 무료 글자 공개를 적용했다. 모달 생성 시 빈칸 절반 내림·사용 차감·재열기 재계산, 앞쪽 미정답 공개·글자 유지·읽기 전용·오답 표시 개별 해제를 처리한다. 하단 버튼은 `힌트 N회` → `정답입력` → `닫기`다. 2초 미리보기는 적용하지 않는다.
- HomePage·모바일 퍼즐 표시 adapter/Board/QuizPanel에서 공개 글자 유지·교차 반영·새 퍼즐/학습 초기화 시 제거를 연결했다. 힌트 사용 즉시 오답노트 중복 방지·숨김 복귀를 처리하고 최신 progressRef로 힌트 등록과 같은 클릭의 정답 완료가 서로 덮어쓰지 않게 했다. 모바일 저장 실패는 공개·차감하지 않고 재시도한다. 힌트로 완성해도 정상 학습완료하며 기존 완료·즐겨찾기를 유지한다.
- 검증: `pnpm.cmd --filter @t-crossword/mobile typecheck`, `pnpm.cmd --filter @t-crossword/mobile test` 30개, apps/mobile에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/letterHints.test.tsx` 7개, `pnpm.cmd --filter @t-crossword/mobile sync:android`의 웹 빌드(타입 포함) 통과. 통합 테스트 최초에는 jsdom ResizeObserver 부재로 2개 실패해 테스트 환경 모사를 보완한 뒤 통과했다. Ionic·Worker·뷰포트 모사 검사이며 기기 검증과 구분한다.
- Android sync는 최초 샌드박스 사용자 정보 조회 오류(uv_os_get_passwd ENOMEM)로 실패했다. 권한 승인 후 apps/mobile에서 `pnpm.cmd exec cap sync android` 재실행 통과. 설치 JDK 21을 해당 명령의 JAVA_HOME에만 지정한 `gradlew.bat assembleDebug` 통과. 기존 큰 JS 청크·Gradle flatDir 경고 유지. 개인 JDK 경로는 프로젝트 설정에 고정하지 않았다.
- 산출물: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`, 34,850,410 bytes, SHA-256 `996CA4B0E5F8B0AC6C6B9A0E40E000283C00DD9BE4B7EEF831DCCA3908ED3DE5`. APK 내 웹 자산 131개의 SHA-256을 최신 dist와 대조해 모두 일치했다. `git diff --check` 통과.
- AGENTS.md·사양서·플랫폼 README를 최신 적용 범위로 갱신했다. 토스·PWA의 기존 작업은 보존했다. 실제 Android 설치/에뮬레이터/기기의 키보드·뒤로가기·회전·광고 영역·저장 실패 조작 검증, iOS 프로젝트 생성·검증, 정적 MP3 음성·실제 광고 SDK 연동은 미실행이다. 배포·커밋·푸시는 하지 않았다.

## PWA에 무료 단어별 힌트·오답노트 등록 적용 (2026-10-27)

- 사용자 요청으로 토스의 최신 힌트 정책을 PWA에 적용했다. WordInputModal은 core의 getModalHintLimit/firstIncorrectLetterIndex를 재사용해 모달 생성 시 빈칸 절반 내림·재열기 재계산·앞쪽 미정답 공개를 처리한다. `힌트 N회` 버튼은 정답입력 왼쪽에 두고 공개 글자는 계속 유지·읽기 전용·개별 오답 표시 해제·다음 칸 이동을 적용했다.
- useCrosswordGame/QuizPage에서 공개 글자를 현재 userGrid에 저장해 모달 재열기·교차 단어에 반영하고 markHintUsed로 즉시 오답노트 등록·숨김 복귀·중복 방지·기존 완료/즐겨찾기 보존을 처리한다. 힌트로 마지막 칸을 채워도 기존 250ms 성공 표시 후 학습완료한다. 완료 중 중복 제출 방지와 모달 닫기 시 완료 타이머 취소도 처리했다. 잔액·인증·보상 API나 DB는 변경하지 않았다.
- 검증 통과: apps/web에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 60개, 루트에서 `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입 포함), `git diff --check`. 12/8/5/1칸 한도·공개 유지·재열기·오답 상태·교차 반영·새 퍼즐 초기화·힌트 즉시 오답노트 등록·숨김 복귀·힌트 완료·완료 타이머 취소·네트워크 무호출을 검사했다. 빌드의 기존 큰 청크 경고 유지, PWA precache 16개 생성.
- AGENTS.md·사양서·토스 README·docs/vercel-pwa.md의 적용 범위를 갱신했다. 기존 토스 수정은 보존했다. 실제 브라우저·설치 PWA 업데이트·오프라인·iOS/Android 확인은 미실행이다. 하이브리드 적용·배포·커밋·푸시도 미실행이다.

## 토스 힌트 사용 단어도 오답노트 등록 (2026-10-27)

- 사용자 추가 요청으로 힌트 공개 시 App에서 기존 recordMistake를 호출해 즉시 기기 오답노트에 중복 없이 등록한다. 숨겼던 단어는 복귀시키며 학습완료·즐겨찾기·기존 이력을 유지한다. 정답 제출 전에도 등록하고 힌트로 완성한 뒤에도 기록을 보존한다. 이전의 '힌트만으로 등록하지 않음' 정책은 이 결정으로 대체한다.
- App·관련 앱 테스트 및 AGENTS.md·사양서·토스 README를 갱신했다. `pnpm.cmd --filter @t-crossword/toss test` 98개·`lint`·`build`(타입 포함), `git diff --check` 통과. 즉시 등록·숨김 복귀·중복 방지·완료/즐겨찾기 보존·완료 후 기록 유지를 검증했다. 기존 큰 청크 경고 유지.
- 실제 Devtools·토스 기기 검증, PWA·하이브리드 적용, 번들 생성·업로드는 미실행이다.

## 토스 힌트 2초 미리보기 철회·정답 유지 복원 (2026-10-27)

- 사용자가 테스트 후 사라지는 동작 제거를 요청했다. AnswerModal의 2초 타이머·임시 표시·입력 대기를 제거하고 힌트 정답이 계속 유지되는 방식으로 복원했다. 공개 칸은 읽기 전용이며 다음 수정 가능한 칸으로 이동한다. App/QuizPanel의 현재 퍼즐 공개 상태와 교차 반영, 모달 재열기 유지, 새 퍼즐·학습 초기화 시 초기화를 복원했다. 힌트로 마지막 칸을 채워도 정상 학습완료한다. `힌트 N회`와 빈칸 절반 내림·재열기 재계산은 유지한다.
- 테스트를 최신 정책으로 변경했다. 첫 실행에서 재열기 후 빈칸 1개의 이전 기대값 1회가 실패해 0회로 수정했다. 최종 `pnpm.cmd --filter @t-crossword/toss test` 97개·`lint`·`build`(타입 포함), `git diff --check` 통과. 3초 후에도 공개 글자 유지·오답 표시 해제·읽기 전용·자동 완료·교차 반영을 확인했다. 기존 큰 청크 경고 유지.
- AGENTS.md·사양서·토스 README를 최신 정책으로 맞췄다. 아래 2초 미리보기 기록은 철회된 시험 이력이다. 사용자 테스트 피드백은 미리보기 선호에 대한 확인이며 전체 기기 검증 완료를 뜻하지 않는다. 최신 유지 동작의 Devtools·실제 토스 기기 재확인, PWA·하이브리드 적용·번들 생성·업로드는 미실행이다.

## 토스 힌트 2초 미리보기·직접 입력으로 변경 (2026-10-27)

- 사용자 후속 결정으로 앞선 영구 공개·교차 반영·힌트 자동 완료를 대체한다. AnswerModal에서 정답을 2초만 표시한 뒤 빈칸으로 되돌리고 같은 칸에 커서를 유지한다. 오답 칸도 같은 방식이며 해당 오류 표시만 해제한다. 표시 중 해당 칸 읽기 전용·힌트/제출 비활성화, 모달 닫기 시 타이머 정리를 적용했다. 모달 생성 시 빈칸 절반 내림과 `힌트 N회` 표시는 유지한다.
- 힌트는 답안이 아닌 미리보기이므로 App/QuizPanel의 공개 글자 저장·교차 반영을 제거했다. 사용자가 직접 정답을 입력한 뒤 정상 학습완료한다. 힌트만으로 오답노트에 추가하지 않는다. AGENTS.md·사양서·토스 README를 최신 정책으로 갱신했다.
- 검증: 최초 토스 테스트에서 이전 영구 공개 정책을 기대한 앱 테스트 2개가 실패해 기대값을 수정했다. 최종 `pnpm.cmd --filter @t-crossword/toss test` 98개·`lint`·`build`(타입 포함), `git diff --check` 통과. 1.999초 유지·2초 후 삭제/포커스/입력 복귀·타이머 취소·직접 입력 후 완료·교차 미반영을 검사했다. 기존 큰 청크 경고 유지.
- 실제 Devtools·토스 기기 확인, PWA·하이브리드 적용, 번들 생성·업로드는 미실행이다. 토스 사용자 확인 후 후속 플랫폼으로 진행한다.

## 토스 힌트 횟수를 버튼 안에 표시 (2026-10-27)

- 정답 모달의 긴 힌트 설명 문구를 제거하고 `힌트 N회` 버튼으로 남은 횟수를 표시했다. 횟수 계산·공개·완료 정책은 유지했다. 수정: AnswerModal과 관련 모달·앱 테스트.
- `pnpm.cmd --filter @t-crossword/toss test` 97개·`lint`·`build`(타입 포함), `git diff --check` 통과. 기존 큰 청크 경고 유지. 실제 Devtools·토스 기기 확인은 미실행이며 PWA·하이브리드는 토스 사용자 확인 후 적용한다.

## 단어별 무료 글자 힌트 복원 — 토스 우선 (2026-10-27)

- 사용자 정책 변경: 정답 모달 생성 시 현재 빈칸의 절반을 내림해 힌트 횟수를 만들며, 재열기는 현재 빈칸으로 재계산하고 이전 사용 횟수를 차감하지 않는다. 앞에서부터 정답이 아닌 첫 칸(오답 포함)을 공개한다. 정답입력 왼쪽에 힌트 버튼과 남은 횟수를 표시한다.
- `packages/core/src/utils/letterHints.ts`에 순수 계산·위치 선택 규칙을 추가했다. 기존 구버전 서버의 `getWordHintLimit`·계약·DB는 유지했다. 토스 AnswerModal은 공개 칸 읽기 전용·개별 오답 표시 해제·횟수 소진·정답 자동 제출을 처리하며 App/QuizPanel에서 공개 글자를 현재 퍼즐에 유지·교차 반영한다. 모달 닫기·홈 왕복은 유지하고 새 퍼즐·학습 초기화는 초기화한다. 앱 종료 후 퍼즐 복원은 범위 밖이다.
- 힌트로 완성해도 학습완료·축하 처리하며 힌트만으로 오답노트에 등록하지 않는다. 실제 오답 기록은 보존한다. 서버 잔액·충전·보상·인증·판 등록 API는 복원하지 않았다. AGENTS.md·사양서·토스 README에 최신 정책과 순차 적용 범위를 기록했다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/core test` 69개, `pnpm.cmd --filter @t-crossword/core typecheck`, `pnpm.cmd --filter @t-crossword/toss test` 97개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build`(타입 검사 포함). 12→6·8→4·홀수/1칸 계산, 재열기, 오답 교체, 교차 반영, 새 퍼즐 초기화, 힌트로 완료·네트워크 무호출을 검사했다. `git diff --check` 통과. 기존 큰 청크 경고 유지.
- 남은 작업: 사용자의 AIT Devtools·실제 토스 Android/iPhone 확인 후 PWA·하이브리드에 같은 공통 규칙을 적용한다. 현재 두 앱은 수정하지 않았고 번들 생성·업로드·배포·커밋·푸시는 수행하지 않았다.

## 토스 난이도 위 중앙 정렬 여백 제거 (2026-10-26)

- 제목 복원 후 사용자가 난이도 위 여백이 넓다고 지적해 `.quiz-content`의 `margin-block: auto`를 제거하고 상단 정렬로 변경했다(`apps/toss/src/styles.css`). 이전 중앙 정렬 요구보다 최신 여백 축소 요청을 우선한다. 공통 제목은 유지하고 본문 상단 padding 6px 뒤에 난이도가 배치되며 남는 공간은 하단에 둔다. 절대 위치·음수 여백 없이 화면 크기에 따라 본문 높이가 변하고 부족하면 본문 전체가 스크롤된다.
- `pnpm.cmd --filter @t-crossword/toss build`(타입 포함) 통과. 기존 큰 청크 경고 유지. 실제 Android/iPhone 확인 및 번들 생성·업로드 미실행.

## 토스 퀴즈 공통 제목 복원 (2026-10-26)

- 사용자가 퀴즈의 `영어 낱말 · N개 학습` 줄을 유지하도록 정정했다. `apps/toss/src/App.tsx`에서 퀴즈 제외 조건을 제거해 공통 제목을 복원했다. 이후 버튼 노출을 위한 공간 조정에서도 해당 제목을 삭제하지 않는다. 공통 헤더의 상하 6px 여백·기존 반응형 퀴즈 중앙 정렬·Android 미리보기 기본값은 유지한다.
- `pnpm.cmd --filter @t-crossword/toss typecheck` 통과. 실제 기기 배치 재확인은 미실행이며 번들 생성·업로드는 하지 않았다.

## 토스 로컬 미리보기 Android 기본값 (2026-10-26)

- 사용자 요청으로 `apps/toss/vite.config.ts`의 devtools 기본 viewport를 `iphone-17-pro`에서 설치된 패키지가 제공하는 `galaxy-s26`으로 변경했다. `http://localhost:5174/` 개발 미리보기 전용이며 실제 Android WebView나 배포 앱의 기기 설정을 바꾸는 작업은 아니다.
- 설치된 devtools 프리셋 타입 확인 및 `pnpm.cmd --filter @t-crossword/toss typecheck`, `git diff --check` 통과. 브라우저 시각 확인은 미실행. 일반 빌드·번들·APK 생성·업로드는 하지 않았다.

## 토스 퀴즈 상단 중복 제목 생략 (2026-10-26)

- Android 캡처에서 `문제 전체 보기`가 하단 메뉴에 일부 가려 보이는 피드백에 따라 퀴즈에서만 앱 내부 `영어 낱말 · N개 학습` 헤더를 생략했다(`apps/toss/src/App.tsx`). 토스 기본 상단 제목과 난이도별 학습완료 표시는 유지한다. 헤더가 차지하던 본문 높이를 확보해 난이도·진행·보드·하단 버튼 묶음을 위로 배치할 수 있게 했다. 보드 너비·버튼 높이·광고 크기는 변경하지 않았다.
- 충분한 높이에서는 기존 auto margin 중앙 정렬, 낮은 화면에서는 위에서부터 배치하고 본문 전체 스크롤을 유지한다. 절대 위치·음수 여백·보드 내부 스크롤을 추가하지 않았다. 모든 화면에서 스크롤 없이 맞는다고 보장하지 않는다.
- `pnpm.cmd --filter @t-crossword/toss test` 90개·`lint`·`build`(타입 포함) 통과. 큰 청크 경고 유지. 실제 Android/iPhone 버튼 노출 확인은 사용자 재배포 후 대기. `.ait` 생성·업로드 미실행.

## 토스 화면 공통 상단 여백 통일·TTS 기기 피드백 (2026-10-26)

- 사용자가 Android·iPhone 토스에서 음성이 잘 나온다고 확인했다. 에이전트의 직접 기기 검증이나 전화/광고 오디오 포커스 전수 검증과 구분한다.
- Android 캡처에서 퀴즈와 홈/단어장의 공통 제목 위치가 달랐다. `.quiz-active .app-heading`만 6px, 나머지는 12px이던 분기를 제거하고 공통 헤더 상하 padding을 6px로 통일했다. 단어장 별도 제목은 24→20px, 제목 영역 상단 padding은 8→6px로 줄여 중복 제목의 시각적 비중과 필터까지 간격을 줄였다.
- 수정 파일: `apps/toss/src/styles.css`. 퀴즈 묶음의 남은 본문 높이 기준 중앙 정렬과 짧은 화면의 본문 스크롤을 유지한다. 공통 헤더 아래의 홈·퀴즈·단어장 자체 콘텐츠 구성은 서로 다르다.
- `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build`(타입 포함) 통과. 기존 큰 청크 경고 유지. CSS 변경으로 단위 테스트는 반복하지 않았다. 실제 Android/iPhone 제목 위치 재확인은 사용자 배포 후 대기이며 `.ait`·APK 생성 및 업로드는 하지 않았다.

## 전체 음성 Cloudflare 업로드 확인 (2026-10-26)

- 콘솔은 ZIP 25MiB·파일 1,000개 제한으로 실패했다. 사용자가 Wrangler로 기존 `crossword-word-audio`에 배포를 완료했다. CLI의 3,865개 업로드는 정적 응답 설정인 `_headers`를 제외한 수이며 로컬 public 3,866개와 구분한다.
- 공개 manifest 3,839개가 로컬 원본과 완전히 일치하고 `pauseMs: 500`임을 확인했다. 난이도별 대표 음성 YOU·LET·MINE·ABSTRACTION 4개를 내려받아 원본 SHA-256·HTTP 200·audio/mpeg·CORS·immutable 캐시를 확인했다. 전체 3,839개 원격 MP3 재다운로드 검사는 수행하지 않았다. 기록: `content/word-audio/full-remote-validation.json`.
- 아래 전체 업로드 대기는 업로드 전 이력이다. 이제 사용자 토스 번들 생성·업로드 및 실제 iPhone/Android 재생 확인이 남아 있다. 에이전트는 배포·번들 생성을 실행하지 않았다.

## 전체 3,839개 TTS 생성·소스 연결 완료 (2026-10-26)

- 사용자 선택으로 삽입 쉼 0.5초를 적용하고 전체 생성을 완료했다(실패 0). 기존 v2 음질 확인은 일반 사용자 청취 피드백으로 기록했다. 오프라인 Kokoro 모델/음성 해시는 기존 검증본을 사용한다. 전체 사람 청취 검사는 수행하지 않았다.
- `scripts/generate-all-word-audio.py`는 각 항목의 MP3 디코딩·해시·0.5초 무음·발음 기호 누락을 확인하고 체크포인트를 남긴다. 처음 4개 작업에서 6개로 늘릴 때 완료 체크포인트를 보존해 재시작했다. 재개 명령: `artifacts/tts-venv/Scripts/python.exe scripts/generate-all-word-audio.py --workers 6 --threads 1`. 현황은 `artifacts/toss-word-audio-full/progress.json`이다.
- `python scripts/package-all-word-audio.py`로 전체 CSV 대응·해시·디코딩·무음·발음 기호 누락 검사를 통과했다. 공개 영단어 키 manifest·다른 앱용 BOM URL CSV·검색/청취 화면·v1/v2 URL 보존 패키지를 준비한 후 토스 manifest 3,839개를 갱신했다. 전체 MP3/ZIP/체크포인트는 Git에서 제외하고 제작·검증 기록과 앱 manifest를 소스에 보존한다.
- 전체 음성 163,234,176 bytes, 이전 표본 20개 포함 정적 파일 3,866개, ZIP 117,485,166 bytes. `artifacts/toss-word-audio-full.zip`을 기존 Cloudflare에 먼저 업로드한 후 사용자 토스 번들을 생성한다. 다른 앱용 주소표는 `artifacts/toss-word-audio-full/word-audio-links.csv`다. 전체 사용 안내는 `content/word-audio/FULL.md`다.
- `pnpm.cmd --filter @t-crossword/toss test` 90개·`lint`·`build`(타입 포함) 통과. 기존 큰 청크 경고는 유지. 새 스크립트 구문 검사와 전체 manifest 대응 회귀 검사를 추가했다. 전체 Cloudflare 원격 검사·토스 iPhone/Android 실제 청취·광고/전화 포커스는 미실행이며 공개 배포·`.ait`·APK 생성은 하지 않았다. 퀴즈 묶음의 비례적 중앙 배치는 기존 소스 수정을 유지한다.
- 최종 ZIP CRC·파일 3,866개·공개 manifest 3,839개·일반 빌드의 전체 파일명/Cloudflare 주소 포함·MP3 번들 미포함 검사 및 `git diff --check` 통과. Git의 기존 LF/CRLF 변환 안내는 오류와 구분한다.

## Android 토스 중앙 정렬 추가 점검 (2026-10-26)

- 토스 퀴즈의 `.quiz-page` flex 본문·`.quiz-content` 세로 auto margin은 OS별 분기 없이 iPhone/Android에 공통 적용됨을 소스로 확인했다. 남는 본문 공간에 중앙 정렬하며 공간 부족 시 묶음 전체가 스크롤되고 보드 내부 스크롤은 없다. 하단 메뉴·광고·안전 영역은 flex 일반 흐름으로 분리된다. 개발용 54px 미리보기 보정은 DEV에서만 로드한다.
- 기본 Android SDK 경로의 adb로 `devices -l` 확인. 최초 샌드박스 실행은 `.android` 디렉터리 권한 오류였고 권한 승인 후 정상 조회했으나 연결된 기기 목록은 비어 있었다. 따라서 실제 Android 토스 화면·키보드·광고 유무·가로 배치 검증은 수행하지 못했다. 직전 89개 테스트/lint/빌드 통과와 구분한다. 소스 변경이 없어 전체 검사는 반복하지 않았으며 이번 변경은 점검 문서뿐이다.

## 토스 퀴즈 묶음 반응형 세로 중앙 정렬 (2026-10-26)

- 사용자 iPhone 16 Pro 캡처 피드백에 따라 난이도/격자 선택·학습/퍼즐 진행·보드·문제 전체 보기를 `.quiz-content` 한 묶음으로 감쌌다. 앱 제목과 하단 메뉴/광고/Safe Area를 제외한 본문에서 `margin-block: auto`로 남는 높이를 위아래에 균등 분배한다. 본문 상하 padding도 대칭으로 맞췄다.
- 고정 top/height·위치 오프셋·기기별 좌표를 추가하지 않았다. 화면 높이·가로세로 전환·광고 높이에 따라 flex 본문 높이로 정렬한다. 공간이 부족하면 auto margin이 0이 되어 본문 전체를 스크롤하며 보드 내부 스크롤은 없다. 보드 가로 너비·하단 버튼·광고·Safe Area 유지.
- 수정 파일: `apps/toss/src/App.tsx`, `apps/toss/src/styles.css`. `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build`(타입 포함), `pnpm.cmd --filter @t-crossword/toss test` 89개, `git diff --check` 통과. 큰 청크 경고는 유지. 실제 iPhone/Android 중앙 위치·가로 화면 확인은 대기이며 번들 생성·업로드는 하지 않았다.

## 토스 음성 v2 사용자 배포 확인 (2026-10-26)

- 사용자가 같은 Cloudflare 프로젝트에 v2 ZIP을 배포했다. 공개 페이지의 v2 표기와 새 MP3 10개·기존 URL 보존용 v1 MP3 10개 모두 HTTP 정상 응답·원본 SHA-256 일치·audio/mpeg·CORS를 curl 읽기 검사로 확인했다. `content/word-audio/remote-validation.json`을 실제 결과로 갱신했다.
- 토스 소스 manifest는 이미 v2를 가리키므로 추가 코드 수정·빌드 반복은 하지 않았다. 사용자가 새 토스 번들을 생성/업로드한 뒤 실제 단어/예문 간격을 확인해야 한다. 이번에 에이전트의 배포·`.ait`·APK 생성·업로드는 없었다.

## 토스 음성 단어·예문 간격 확대 v2 (2026-10-26)

- 사용자 ‘단어와 예문 간격이 좁다’ 피드백을 음성 간격으로 해석해 단어/예문을 별도 합성하고 24kHz PCM 무음 19,200샘플(0.8초)을 삽입했다. 느린 0.7배속에서는 삽입 쉼도 약 1.14초로 늘어난다. 표본 10개 새 MP3 476,160 bytes·전체 단순 추정 182,797,824 bytes. 현재 manifest는 v2 파일명을 사용한다.
- `scripts/prepare-word-audio.py`, `scripts/check-word-audio.py` 갱신. v1 제작/검사/청취/원격 기록과 스크립트는 `content/word-audio/revisions/v1/`에 보존했다. v2 청취·원격 검사는 대기로 구분했다.
- 현재 로컬 미리보기 `artifacts/toss-word-audio-preview-v2/public/index.html`, 업로드 ZIP `artifacts/toss-word-audio-preview-v2.zip`(625,438 bytes). ZIP에는 새 음성 10개와 기존 토스 URL을 보존하는 v1 음성 10개를 함께 넣었다. Cloudflare ZIP 갱신 후 새 토스 번들을 사용해야 한다. 공개 업로드·번들 생성은 하지 않았다.
- 로컬 생성·`python scripts/check-word-audio.py`로 10개 디코딩/해시/본문 대응·삽입 구간 중앙 0.6초 peak<0.001·v1 보존 파일 해시 검사 통과. `pnpm.cmd --filter @t-crossword/toss build`(타입 포함) 및 `git diff --check` 통과. 재생 코드 변경 없이 데이터·제작 스크립트만 변경했으므로 기존 89개 테스트는 반복하지 않았다. 실제 청취·기기는 미검증이다.

## 토스 TTS 표본 Cloudflare 주소 연결 (2026-10-26)

- 사용자가 표본 로컬 청취를 긍정 확인하고 Cloudflare Workers 정적 파일 업로드를 완료했다. 공개 기본 주소 `https://crossword-word-audio.minotree0902.workers.dev/word-audio/`를 `apps/toss/.env.production`에 추가했다. 기존 광고 설정은 유지했다. 현재 표본 10개에만 재생 버튼을 제공한다.
- curl 검사에서 페이지 200, MP3 10개 각각 200·원본 SHA-256 일치·`audio/mpeg`·CORS `*`·장기 immutable 캐시 확인. 기록은 `content/word-audio/remote-validation.json`이다. urllib는 403이었으며 curl로 실제 응답을 확인했다. Range는 206 대신 전체 파일 200으로 응답했으므로 부분 응답 지원을 검증했다고 하지 않는다.
- `pnpm.cmd --filter @t-crossword/toss build`(타입 포함)·빌드 JS의 실제 음성 주소 포함 검사·`git diff --check` 통과. 기존 큰 청크 경고 유지. 코드/출제 규칙 변경이 없는 공개 주소 설정 작업이라 이미 통과한 89개 테스트는 반복하지 않았다. 일반 표본 청취 피드백은 별도 JSON으로 기록했고 토스 Android/iPhone 청취·느린 재생·배경 전환 검증은 대기다.
- 이번 Cloudflare 배포는 사용자가 수행했다. 에이전트는 읽기 검사·로컬 주소 연결만 진행했으며 `.ait`·APK 생성·토스 업로드·전체 음성 생성은 하지 않았다.

## 토스 TTS 표본·플레이어 준비 (2026-10-26)

- 사용자 요청으로 로컬 Kokoro 0.9.4 / Kokoro-82M v1.0 / af_heart 표본 10개를 생성했다. YOU·SEA·SAME·APPLE·SCIENCE·KNOWLEDGE·ENVIRONMENT·ABSTRACTION·CORRELATION·EPISTEMOLOGY의 단어+영어 예문을 읽는다. 24kHz mono·64kbps MP3 총 344,640 bytes. 전체 3,839개 단순 추정 132,307,296 bytes(표본 평균 기반이며 실제 전체 용량 미측정).
- 모델 카드·선택 음성 목록·Apache-2.0 전문 및 모델 리비전/해시·입력 텍스트·환경·파일 해시를 `content/word-audio/`에 보존했다. 생성 가중치/도구는 로컬 `artifacts/tts-cache`, `tts-venv`에 두고 Git에서 제외했다. 앱 런타임 의존성 추가 없음. 미등록 BEAUTIFUL은 현재 어휘에 있는 SCIENCE로 표본 교체 후 생성했다.
- 토스 소유 `adapters/wordAudio.ts`, `components/WordAudioButtons.tsx`, `data/word-audio.json`, App/WordList 연결로 클릭 재생·일반/0.7배속·중지·교체·이전 이벤트 무시·오류/시간초과·화면 숨김/메뉴/검색/분류 전환 중지를 구현했다. 원본 단어/예문 대응을 검사하고 실제 MP3 바이트 해시를 URL에 사용한다. 저장소와 로컬 미리보기는 별개이며 처음부터 음원을 내려받지 않는다.
- `VITE_TOSS_WORD_AUDIO_BASE_URL` 공개 HTTPS 주소를 쓰며 실제 주소는 미설정이다. 미설정 시 버튼을 숨긴다. 현재 표본 10개만 지원하며 전체 어휘 음성 생성·주소 설정·토스 기기 검증은 대기다. PWA TTS·Android 소스는 변경하지 않았다.
- `artifacts/tts-word-audio` 같은 별도 경로가 아니라 **`artifacts/toss-word-audio-preview/public/index.html`**이 현재 미리보기다. 업로드 ZIP은 **`artifacts/toss-word-audio-preview.zip`**(298,642 bytes). Cloudflare Workers Static Assets용 public 폴더·_headers·CLI용 wrangler.jsonc를 준비했다. 이전 `toss-word-audio-sample` 폴더는 초기 제작 이력이다.
- `python scripts/check-word-audio.py`로 10개 MP3 디코딩·24kHz·길이·유한값/비무음·해시·단어장/manifest 대응 검사 통과. `pnpm.cmd --filter @t-crossword/toss test` 89개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build`(타입 포함) 및 `git diff --check` 통과. 큰 청크 경고는 유지된다.
- 사람 청취·발음 검수·Cloudflare HTTP 응답·실제 토스 Android/iPhone에서 무음 모드·음량·전화/음악/광고 오디오 포커스·앱 전환은 미검증이다. 사용자 청취 후 표본 채택→Cloudflare 업로드→실제 주소 연결→토스 확인→전체 생성 순서로 진행한다. 이번에 공개 배포·토스 `.ait`·APK·동기화·커밋·푸시는 하지 않았다.

## 토스 Android 상단 빈 공간 대응 (2026-10-26)

- 사용자 Android 캡처에서 토스 기본 상단 바와 앱 제목 사이의 큰 여백을 확인했다. 현재 비게임·기본 내비게이션 바 구성에서 `.app-shell`이 추가 적용하던 `env(safe-area-inset-top)`을 0으로 변경했다. 중복 보정 가능성을 제거한 수정이며 기기의 실제 원인·해소 여부를 자동 검사만으로 확정하지 않는다. 하단 Safe Area·광고·보드 크기는 유지했다.
- 설치 TDS AIT 2.5.1 소스는 Safe Area CSS 변수를 제공하지만 자체 상단 padding은 추가하지 않음을 확인했다. [공식 Safe Area 설명](https://developers-apps-in-toss.toss.im/documentation/common/screen/safe-area)은 시스템 UI 보호용 일반 inset 안내이며 특정 기기에서 여백이 중복됐다는 직접 증거로 취급하지 않았다.
- 기존 opt-in `layoutDiagnostics.ts`에 상단 SDK/env 값·앱 padding·앱/제목 시작 좌표를 추가했다. 일반 빌드에서 진단은 비활성화한다. 수정 파일은 토스 `styles.css`, `adapters/layoutDiagnostics.ts`다.
- `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build`(타입 검사 포함), `pnpm.cmd --filter @t-crossword/toss test` 82개 및 `git diff --check` 통과. 큰 청크 경고는 기존 상태다. 실제 Android/iOS 토스에서 상단 여백·겹침 확인은 대기다. `.ait` 생성·업로드는 실행하지 않았다.

## 토스 보드 스크롤 철회·퀴즈 여백 축소 (2026-10-26)

- 사용자 요청으로 직전 보드 내부 스크롤·최소 높이·overlay 표시 영역 변경을 철회했다. 보드 전체와 아래 `문제 전체 보기`가 본문에 함께 놓이는 구조를 유지한다.
- 퀴즈에서만 앱 제목 상하 padding 12→6px, 하단 메뉴 위 padding 12→6px. 퀴즈 본문 아래 12→6px, 난이도/진행 아래 간격 각각 8→4px, 보드-버튼 간격 8→6px로 조정했다. 직전 스크롤 도입 전 기준 약 34 CSS px를 확보하며 보드 너비·버튼 높이·광고·Safe Area는 유지했다. 극히 낮은 화면의 본문 스크롤은 유지한다.
- 수정: 토스 `App.tsx`, `QuizPanel.tsx`, `styles.css`, `quizPanel.test.tsx`. `pnpm.cmd --filter @t-crossword/toss test` 82개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build` 및 `git diff --check` 통과. 실제 토스 기기 잘림 해소는 미검증이며 `.ait` 생성·업로드는 하지 않았다. 아래 내부 스크롤 항목은 철회한 구현 이력이다.

## 토스 문제 전체 보기 버튼 잘림 대응 (2026-10-26)

- 사용자 이전 배포본 캡처에서 `문제 전체 보기`가 하단 메뉴 경계에 일부 가려짐을 확인했다. 너비 기준 정사각형 보드와 버튼 전체를 스크롤 본문에 배치하던 구조를 바꿔, 토스 소유 `QuizPanel`의 보드만 별도 스크롤하고 버튼 공간을 확보한다. 보드 가로 너비는 유지하고 메뉴·광고·Safe Area 치수는 변경하지 않았다. 매우 낮은 화면은 최소 보드 조작 공간 때문에 본문 스크롤도 허용한다.
- 문제 목록을 열 때 보드 스크롤을 맨 위로 돌리고 표시 영역에 맞춰 overlay 높이를 제한한다. 가로/세로 제목·진행은 고정하고 2열 목록만 스크롤하며 닫기·Escape·뒤로가기 흐름은 유지한다.
- 수정: `apps/toss/src/components/QuizPanel.tsx`, `apps/toss/src/styles.css`, `apps/toss/tests/quizPanel.test.tsx`. `pnpm.cmd --filter @t-crossword/toss test` 82개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build` 및 `git diff --check` 통과. 빌드에 포함된 타입 검사도 통과. 기존 큰 청크 경고는 유지된다.
- DOM 회귀 검사에서 버튼이 보드 스크롤 밖에 있는지·overlay 열기 시 스크롤 위치와 상태 전환을 확인했다. 실제 브라우저 치수·토스 기기에서 잘림 해소·광고 유무·가로 화면 확인은 미실행이다. `.ait` 생성·업로드는 사용자 담당이며 실행하지 않았다.

## 학습완료·오답노트 단어 재출제 (2026-10-26)

- 공통 `vocabularyForProgress`에 오답·숨김 ID를 선택 인자로 추가했다. 학습완료했더라도 현재 오답노트에 표시 중이면 `isQuizUsed`를 출제 가능 상태로 적용한다. 저장된 완료 기록·집계·원본 객체는 유지한다. 오답노트에서 숨긴 완료 단어는 기존처럼 제외하고 미완료 단어는 숨김 여부와 무관하게 출제한다. 난이도·격자 크기 제한도 유지한다.
- PWA `useCrosswordGame`, 토스 생성 adapter·Worker, 모바일 생성 요청·Worker에 최신 오답·숨김 기록을 전달했다. 기존 두 인자 호출과 구버전 서버 경로의 기본 동작은 유지한다. 세 앱 설정 안내도 수정했다. 오답 단어를 다시 맞혀도 목록에서 삭제하기 전까지는 재출제될 수 있다.
- `pnpm.cmd typecheck`, `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/toss lint` 통과. `pnpm.cmd --filter @t-crossword/core test` 60개, `pnpm.cmd --filter @t-crossword/toss test` 81개, `pnpm.cmd --filter @t-crossword/mobile test` 29개 통과. `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 52개 통과. 신규 검사는 완료+오답 재출제·숨김 제외·기록 보존·난이도/격자 제한·토스 Worker 전달 및 Worker 미지원 경로를 확인했다. 토스 기존 호출 인자 기대값은 추가된 오답·숨김 배열에 맞춰 수정 후 통과했다.
- `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/toss build`, `pnpm.cmd --filter @t-crossword/mobile build`, `git diff --check` 통과. 큰 JS 청크 경고는 유지된다. 실제 브라우저·토스·Android/iOS 확인은 미실행. `.ait`·APK·Capacitor sync·배포는 실행하지 않았다.

## 특급 500개 앱 소스 반영 (2026-10-26)

- 사용자 승인으로 001~010 검수본을 CSV 뒤에 추가하고 변환했다. 총 3,839개(초급 775·중급 1,199·고급 1,365·특급 500). 기존 3,339개 JSON 객체 전체 일치와 ID/철자/난이도 해시 보존 확인. 원본·검수 자료는 보존하고 운영 배포는 하지 않았다.
- 공통 `DifficultyLevel`·출제 순위·파서·단어장 서비스·CSV 변환기에 `special` 추가. 하위 수준 누적 출제 유지. PWA·토스·모바일에 특급 선택·단어장 표시·선택 수준 집계를 반영하고, 토스 난이도 버튼을 4열로 배치했다. 그림책 타입과 선택은 3단계를 유지한다.
- 설정에 특급 학술·심화 500개, AI 작성·편집검수, 누적 출제/집계 설명 및 WordNet 전문을 추가했다. 공식 토플 목록·빈도 순위라고 안내하지 않는다. [WordNet 공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use)을 재조회했고 고지 전체를 공통 순수 데이터로 보존했다. `python scripts/check-special-vocabulary-integration.py --builds`로 검수본/CSV/JSON 일치·기존 ID·개수·중복·고지 및 세 앱 일반 빌드의 고지 표지를 확인했다.
- `pnpm.cmd typecheck`, `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/toss lint` 통과. `pnpm.cmd --filter @t-crossword/core test` 58개, `pnpm.cmd --filter @t-crossword/toss test` 80개, `pnpm.cmd --filter @t-crossword/mobile test` 29개 통과. `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 52개 통과. `pnpm.cmd --filter @t-crossword/toss-api test` 구버전 회귀 68개 통과·프로파일 1개 기본 건너뜀. 구버전 서버에 특급 API 지원을 추가하거나 배포하지 않았다.
- 특급은 8/10/12 격자·하위 수준 완료 후 출제·전체 완료 시 빈 출제까지 검사했다. 최초 타입 검사에서 그림책 콜백의 확장된 타입 오류를 발견해 그림책 타입을 3단계로 제한했고 재검사 통과. 신규 웹 검사의 잘못된 CSS 선택자는 접근성 이름 선택자로 고쳐 재검사 통과.
- `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/toss build`, `pnpm.cmd --filter @t-crossword/mobile build` 통과. 큰 JS 청크 경고는 남아 있다. PWA shell 캐시는 새 빌드 해시로 생성됐다. 자동 UI 검사와 실제 브라우저·설치 업데이트·키보드·토스·Android/iOS 기기 검증은 구분하며 후자는 미실행.
- 사람의 최종 영어·한국어 검수·외부 문구 유사성 전수검색·토플 빈도 검증은 미실행. 이번에는 `.ait`·APK·Capacitor sync·업로드·커밋·푸시를 실행하지 않았다.

## 특급 010 ZIP 검수·후보 500개 수집 완료 (2026-10-26)

- ZIP 9개 원본 보존. 50개는 운영 3,339개·이전 후보 450개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 및 LICENSE 일치 확인.
- 전체 직접 검수 후 atypical·bifurcate·conciliatory·conclusive·fortuitous·indicative·replete의 7필드 보완. 미해결 추가 모델 판단 항목이 없어 로컬 LLM 미사용.
- `python scripts/review-special-vocabulary-batch.py --batch 010 --input-dir artifacts/vocabulary-review-010/input` 통과. 파일 왕복·WordNet gloss 8토큰 비교·공통 원인 구성 계산·누적 후보 중복/필수값·구문·공백·diff 검사 통과.
- 후보 총 500개로 수집 목표 달성. 사람 최종 검수·외부 문구 전수검증·토플 빈도·앱 고지 연결은 미실행. 운영 미병합. 앱 변경·빌드·토스 번들·APK·동기화 없음.

## 특급 009 ZIP 검수 (2026-10-26)

- 중복 첨부는 한 번만 처리하고 9개 원본을 보존했다. 후보 50개는 운영 3,339개·이전 후보 400개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 및 LICENSE 일치 확인.
- 전체 직접 검수 후 anachronism·antithetical·expository·homogenize·impersonal의 5필드 보완. 추가 모델 판단이 필요한 미해결 항목이 없어 로컬 LLM 미사용.
- `python scripts/review-special-vocabulary-batch.py --batch 009 --input-dir artifacts/vocabulary-review-009/input` 통과. 파일 왕복·WordNet gloss 8토큰 비교·구문·공백·diff 검사 통과. 사람 최종 검수·외부 문구 전수검증·토플 빈도·앱 고지 연결은 미실행.
- 누적 후보 450개·500개 목표까지 50개 남음. 새 프롬프트·첨부 ZIP·앱 변경·운영 병합·빌드·토스 번들·APK·동기화 없음.

## 특급 008 ZIP 검수 (2026-10-26)

- 9개 원본 보존. 후보 50개는 기존 3,339개·이전 후보 350개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 확인 및 LICENSE 일치.
- 50개 직접 검수 후 axiomatic·cognate·denounce·ineffable·exonerate의 8필드 보완. exonerate는 혐의 해소와 무죄 판결을 구분해 법률 근거를 대조했다. 추가 미해결 언어 항목이 없어 로컬 LLM 미사용.
- `python scripts/review-special-vocabulary-batch.py --batch 008 --input-dir artifacts/vocabulary-review-008/input` 및 파일 왕복·WordNet gloss 8토큰 비교·정확한 유리수 계산·구문·공백·diff 검사 통과. 외부 문구 전수검증·사람 최종 검수·토플 빈도·앱 고지 연결은 미실행이다.
- 누적 후보 400개·추가 목표 100개. 새 요청 프롬프트·첨부 ZIP·앱 코드 변경·운영 병합·빌드·토스 번들·APK·동기화 없음.

## 특급 007 ZIP 검수 (2026-10-26)

- 입력 9개 원본 보존. 후보 50개는 기존 3,339개·이전 후보 300개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 대조 및 LICENSE 일치. 50개 직접 검수 후 aversion·canonical·dissident·narrative·sequential의 6필드 보완. 로컬 LLM 추가 호출 없음.
- `python scripts/review-special-vocabulary-batch.py --batch 007 --input-dir artifacts/vocabulary-review-007/input` 통과. 보정 파일 왕복·WordNet gloss 8토큰 비교·분수 유리수 계산·구문·공백·diff 검사 통과. 모수·표본 평균·소송 반대 청구·관할권은 근거 자료를 대조했다. 사람의 최종 검수·외부 전체 문구 유사성·토플 빈도·앱 고지 연결은 미실행이다.
- 후보 누적 350개·추가 목표 150개. 새 요청 프롬프트·첨부 ZIP 없음. 운영 병합·앱 변경·빌드·토스 번들·APK·동기화 미실행.

## 특급 006 ZIP 검수 (2026-10-26)

- 입력 ZIP 9개 원본 보존. 후보 50개는 기존 3,339개·이전 후보 250개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 확인, 공식 LICENSE 일치. 50개 직접 검수 후 apathy·intermediary·specious·verifiable의 5필드를 보완했다. 로컬 LLM 추가 호출 없음.
- `python scripts/review-special-vocabulary-batch.py --batch 006 --input-dir artifacts/vocabulary-review-006/input` 통과. 보정 CSV/XLSX 왕복·WordNet gloss 8토큰 비교·유리수 계산·구문·공백·diff 검사 통과. 명목 임금·역수·순서형 개념은 공식 자료를 대조했다. 사람의 최종 검수·인터넷 전체 유사성·토플 빈도·앱 고지 연결은 미실행이다.
- 후보 누적 300개·추가 목표 200개. 새 요청 프롬프트·첨부 ZIP 없음. 앱 변경·운영 병합·빌드·토스 번들·APK·동기화 미실행.

## 즐겨찾기 전용 삭제 버튼 제거 (2026-10-26)

- 최신 사용자 결정에 따라 PWA·토스·모바일에서 즐겨찾기 전용 삭제 버튼을 제거했다. 별 토글로 등록·해제하며 오답노트 삭제 버튼과 저장 기록은 유지한다. 토스의 불필요해진 `bookmarksOnly` prop도 제거했다.
- 웹 build(타입 검사 포함)·lint, 토스 typecheck·lint, 모바일 typecheck 및 `git diff --check` 통과. 실제 화면 확인·토스 번들·APK·Capacitor 동기화는 미실행이다.

## Android 학습 기록 초기화 추가 (2026-10-26)

- 설정의 데이터 관리에 확인창·초기화 버튼을 추가했다. 성공 시 학습완료만 초기화하고 진행 중 퍼즐·선택·완성 축하를 종료한다. 즐겨찾기·오답 이력·오답 숨김 기록은 보존하며 저장 실패 시 기존 기록과 퍼즐을 유지하고 확인창에 오류를 표시한다. 생성·정답 처리 중에는 초기화를 막고 Android 뒤로가기는 확인창부터 닫는다.
- 모바일 typecheck·테스트 29개(초기화 보존·저장 실패 회귀 포함)·`git diff --check` 통과. TTS를 제외한 이번 대화의 공통 변경은 세 앱 소스에 반영했다. 플랫폼별 광고·설치 안내·네이티브 연결 등 고유 차이는 남으며 전체 화면·플랫폼 기능의 완전 동일을 뜻하지 않는다. 빌드·APK·동기화·실기기 검증은 미실행이다.

## Android 소스 누락분 반영 (2026-10-26)

- 이번 대화의 토스 변경과 비교해 모바일에 즐겨찾기 탭 삭제 버튼과 문제 없는 칸의 회색(`#8b95a1`)을 반영했다. 삭제는 즐겨찾기 ID만 제거하며 학습완료·오답노트 기록을 보존한다. 오답 자동 등록·난이도별 현황·설정 카드·단어장 구성 안내는 이미 반영된 상태를 확인했다.
- 모바일 typecheck·기존 테스트 27개·`git diff --check` 통과. 실제 Android 화면·조작 확인, 빌드·Capacitor 동기화·APK 생성은 미실행이다. TTS는 PWA 우선이라는 기존 선택에 따라 이번 범위에 포함하지 않았다.

## 특급 005 ZIP 검수 (2026-10-26)

- 사용자 ZIP 9개 원본 보존. 후보 50개는 앞선 3,539개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 대조 및 LICENSE 일치 확인.
- 50개 직접 검수 후 covariance/entropy 뜻·culpable/deprivation 해석·dogmatic 변이 동의어 5필드 보완. 공분산·엔트로피·금지명령 의미는 NIST·SciPy·미 연방사법센터 공식 자료를 확인하고 수치 예문은 직접 계산했다. 로컬 LLM 추가 호출 없음.
- `python scripts/review-special-vocabulary-batch.py --batch 005 --input-dir artifacts/vocabulary-review-005/input` 통과. WordNet gloss 연속 8토큰 일치 0건, CSV/XLSX 왕복 통과. 구문·공백·diff 검사 수행. 사람의 최종 검수·외부 문구 전수확인·토플 빈도·앱 고지 연결은 미실행이다.
- 후보 누적 250개·추가 목표 250개. 사용자 요청에 따라 새 수집 프롬프트·첨부 ZIP은 만들지 않았다. 앱 변경·운영 병합·빌드·토스 번들·APK·동기화 없음.

## 특급 004 ZIP 검수·005 수집 준비 (2026-10-26)

- 사용자 ZIP의 9개 파일을 안전한 작업 경로로 복사·보존했다. 후보 50개는 앞선 3,489개와 중복 없음. CSV/XLSX 일치, WordNet 의미·품사·sense key·원문 행 해시 50개 일치, 제출 LICENSE와 공식 원자료 LICENSE 바이트 일치 확인.
- 50개 직접 검수 후 judicious 뜻·exhaustive/tenable 해석·variance 뜻 4필드를 보완했다. variance는 WordNet 확률분포 정의와 NIST 표본 분산 설명을 구분했다. 로컬 LLM 추가 호출 없음. WordNet 전체 gloss 117,659개와 8토큰 비교 일치 0건이며 외부 전체 유사성 검증은 아니다.
- `python scripts/review-special-vocabulary-batch.py --batch 004 --input-dir artifacts/vocabulary-review-004/input` 통과. Python 구문·공백·`git diff --check` 확인. 앱 코드 변경·빌드·운영 병합·토스 번들·APK·동기화 없음. 사람의 최종 검수·토플 빈도·외부 문구 전수검증·앱 고지 연결은 미실행이다.
- 후보 누적 200개, 추가 목표 300개. 005 프롬프트와 3,539개 제외 목록을 `artifacts/vocabulary-review-004/`에 준비했다.

## 특급 003 후보 검수·004 수집 준비 (2026-10-26)

- 후보·출처 CSV와 XLSX 3개를 원본 보존하고 50개 전체를 직접 검수했다. 기존 3,339개와 앞선 후보 100개에 중복 없음, XLSX/CSV 일치, WordNet 의미 ID·품사·sense key 50개 확인. provenance 미제공으로 자체 확인 기록과 원문 행 해시를 별도 생성하고 원작성자의 provenance와 구분했다.
- analogy·fallacy·peripheral 해석 3개 보완. 로컬 LLM 미사용. WordNet 형용사 `(p)` 문법 표식 처리를 공식 형식 문서로 확인해 검사기에 반영했다. `python scripts/review-special-vocabulary-batch.py --batch 003 --input-dir D:/Download` 및 002 회귀 확인, Python 구문·새 파일 공백 검사·`git diff --check` 통과. WordNet gloss 117,659개와 8토큰 일치 0건, 인터넷 전체 유사성 확인은 아니다.
- 후보 누적 150개, 추가 목표 350개. 004 프롬프트·3,489개 제외 목록을 `artifacts/vocabulary-review-003/`에 준비했다. 운영 병합·앱 변경·빌드·토스 번들·APK·동기화 미실행. 사람의 최종 검수·토플 빈도·외부 전체 유사성·앱 고지 연결은 미실행이다.

## 특급 002 후보 50개 검수·003 수집 준비 (2026-10-26)

- 사용자 제공 CSV 2개·provenance JSON·XLSX를 원본 보존하고 검수했다. 기존 3,339개·001 후보 50개와 중복 없음. XLSX 두 시트와 CSV 일치, WordNet 3.0 선택 의미 ID·품사·sense key·끝 LF 포함 원문 행 해시 50개 일치. LICENSE는 공식 배포본에서 확보하고 provenance 해시와 일치 확인했다.
- 50개 직접 검수 후 altruism 해석·offset/incidence 뜻·premise 철자 변이 동의어 4필드를 보완했다. 미해결 항목이 없어 이번에는 로컬 LLM 추가 검수를 실행하지 않았다. WordNet 전체 gloss 연속 8토큰 비교 일치 0건이며 외부 전체 유사성 검증은 아니다.
- `python scripts/review-special-vocabulary-batch.py --batch 002 --input-dir D:/Download` 통과. 보정 CSV UTF-8 BOM·XLSX 왕복 검사 통과. 코드 형식 검사와 `git diff --check` 실행. 앱 실행 코드 변경·빌드·운영 병합·토스 번들·APK·동기화 없음. 사람의 최종 검수·토플 빈도·앱 고지 연결은 미실행이다.
- 후보 누적 100개, 추가 목표 400개. 003 요청 프롬프트와 3,439개 제외 목록을 `artifacts/vocabulary-review-002/`에 준비했다. 상세는 `content/special-vocabulary/review-002/README.md`.

## PWA 단어장 TTS 1차 구현 (2026-10-26)

- 사용자 선택에 따라 PWA부터 단어·영어 예문 `듣기`/`느리게`를 구현했다. 재생 중지·단어/속도 교체·화면 숨김/이탈·검색/분류 변경 취소, 늦은 취소 이벤트 무시, 미지원/음성 없음/재생 시작 실패 안내와 접근성 상태를 추가했다. 웹 전용 어댑터이며 공유 core·토스·Android에는 브라우저 API를 넣지 않았다.
- `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/wordSpeech.test.tsx`(apps/web에서 실행) 7개 통과. 웹 typecheck·lint·build 통과. 실제 브라우저 청취·PWA 설치 기기 검증은 미실행이다. 새 의존성·유료 서버·API 키 없음. 기기 음성이 네트워크를 사용할 수 있으므로 오프라인 재생은 보장하지 않는다.
- 공식 호환성 자료와 토스 측 답변에서 Android WebView의 speechSynthesis 미지원을 확인했다. 토스는 사용자가 선택한 음성 파일 방식 검토 단계이며 Android는 네이티브 TTS 또는 음성 파일이 필요하다. `docs/word-audio.md`에 권리·품질·용량·재생 수명주기 검토 범위와 미실행 항목을 기록했다. 토스 번들·APK·Capacitor 동기화 미실행.

## 특급 후보 50개 보완·검수 및 후속 수집 준비 (2026-10-26)

- 원본 3개를 `content/special-vocabulary/review-001/`에 보존하고 5개 단어·6개 필드를 보정한 별도 CSV/XLSX와 수정 이력을 생성했다. 원본 WordNet 3.0에서 선택 의미·품사 50개를 연결하고 LICENSE 전문·원자료 해시·AI 제작/검수 기록을 보존했다.
- Ollama Qwen3 14B와 GPT OSS 20B의 50개 보조 검수를 실제 실행했다. GPT OSS 첫 실행은 출력 한도 초과로 미완료, 낮은 추론 설정의 재실행은 완료. 모델 의견은 편집 검토를 대체하지 않으며 채택·미채택 이유를 기록했다.
- `python scripts/review-special-vocabulary.py`, 로컬 검수 명령, `python scripts/finalize-special-vocabulary-review.py` 실행. 형식·기존/신규 중복·선택 의미 ID/품사·CSV/XLSX 왕복 검사 통과. WordNet 117,659개 gloss와 연속 8토큰 비교 일치 0건. 공식 이용 조건을 열어 확인하고 기록했다. 외부 문구 전체 유사성·사람의 최종 검수·토플 빈도 검증은 미실행이다.
- 450개 추가 요청용 프롬프트와 운영 3,339개+후보 50개의 제외 목록 준비. ChatGPT 웹 요청은 사용자가 프롬프트·첨부 파일로 진행한다. 운영 단어장 병합·난이도/앱 변경·빌드·토스 번들·APK·Capacitor 동기화는 이번 작업에서 실행하지 않았다.

## 오답 입력 즉시 오답노트 등록 (2026-10-26)

- 웹/PWA에 이어 토스·모바일에도 틀린 영문 글자 표시 시 오답노트 저장을 연결했다. 답안이 미완성이어도 등록하며 중복은 제거한다. 삭제는 숨김이고 재오답 시 복귀하며 기존 학습완료·즐겨찾기·기존 오답노트는 보존한다. 기존 저장 형식을 재사용하며 힌트 기능이나 서버 호출을 추가하지 않았다. 목록 안내도 새 동작에 맞췄다.
- 검증: 웹 입력 중 오답 재현·저장소 14개 테스트, 웹 lint/build 통과. 토스 `pnpm.cmd --filter @t-crossword/toss test` 79개, `lint`, `build:ait` 통과. 모바일 `pnpm.cmd --filter @t-crossword/mobile test` 27개 및 `build` 통과. Capacitor 동기화는 샌드박스 사용자 정보 조회 오류 후 권한 승인 재실행(`pnpm.cmd exec cap sync android`)으로 통과했다. JDK 21을 명령 환경에서 지정해 `gradlew.bat assembleDebug` 통과. 큰 JS 청크 경고는 남는다.
- 산출물: `apps/toss/english-words.ait`, `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`. 토스 업로드·Android 설치·실제 기기 조작·iOS 검증은 미실행이다.

## 오늘 변경 최종 문서 정리·Git/배포 사용자 진행 (2026-10-25)

- 사용자 결정: 오늘 변경의 최종 정리만 에이전트가 수행하고 스테이징·커밋·푸시·배포는 사용자가 직접 수행한다. `AGENTS.md`에 남은 현재 UI 명칭 두 곳을 문제로 정리하고 완성 🎉 아이콘 기준을 반영했다. 기존 진행 기록은 삭제하지 않는다.
- 오늘 반영: 세 앱의 전체 너비 보드·문제 전체 보기 오버레이·번호별 입력/방향 선택·완료 항목 비활성화·완성 색종이/아이콘·진행/새 퍼즐 오른쪽 정렬·오답 표시 무제한. 글자 공개·힌트 잔액·완성 보상과 앱의 관련 서버 호출은 제거했다. 기존 학습 기록·오답노트·운영 DB·구버전 API는 보존한다.
- 실행 코드와 문서는 앞선 각 항목의 검사·빌드 결과를 따른다. 이번 정리는 문서만 수정해 전체 검사를 반복하지 않고 경로·산출물 존재와 `git diff --check`를 확인했다. 웹 미리보기 캡처는 실제 웹 컴포넌트에 예시 퍼즐을 넣어 만든 것이며 토스/Android 실기기 확인을 대신하지 않는다.
- 사용자 Git에는 새로 추가된 플랫폼별 `QuizPanel`·`PuzzleBoard`·`ClueButton`·`Modal`·`CompletionConfetti`와 테스트/어댑터 등 미추적 소스도 함께 포함해야 한다. `dist`·`.ait`·APK·개인 환경/SDK 경로·키는 소스 커밋 대상이 아니다.
- PWA는 커밋만으로 갱신되지 않는다. Vercel Git 연결·자동 배포가 활성화된 경우 운영 브랜치로 푸시하고 배포 성공을 확인한다. 저장소 `vercel.json`은 웹 빌드/출력 경로를 지정하지만 현재 원격 Vercel 프로젝트의 연결·운영 브랜치·배포 상태는 조회하지 않았다. 설치된 PWA는 새 버전 안내를 적용해야 할 수 있다.
- 최신 토스 배포용 파일 존재 확인: `apps/toss/english-words.ait` (30,449,636바이트), 빌드 식별자 `01a17329-93f7-7120-be6c-2d1e3af57aac`. 최신 Android 디버그 APK: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (35,148,462바이트). 파일 생성 완료이며 업로드·설치·검토 요청·출시를 의미하지 않는다.
- 미검증: 새 버전의 실제 브라우저/PWA 업데이트·토스/Android/iOS 조작·키보드·배너/no-fill·폭죽 가독성/성능. 스테이징·커밋·푸시·배포·설치 없음.

## 토스·Android 완성 화면 축하 아이콘 누락 보정 (2026-10-25)

- 사용자 지적: 움직이는 색종이와 별개로 웹 완성 화면의 큰 🎉 아이콘이 토스에 없었다. 토스 `App`·모바일 `HomePage` 완성 모달에 48px 중앙 축하 아이콘을 추가하고 각 앱 CSS로 표시한다. 스크린리더에서는 장식으로 제외한다. 기존 발사 효과와 동작 줄이기는 유지한다.
- `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/mobile build`(타입 포함), Android sync·JDK 21 `assembleDebug`, `git diff --check` 통과. 장식 추가로 테스트는 반복하지 않았다. 기존 큰 청크·Gradle flatDir 경고 유지.
- 최신 토스 `apps/toss/english-words.ait`, 빌드 식별자 `01a17329-93f7-7120-be6c-2d1e3af57aac`. Android `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` 갱신. 업로드·설치·실기기 아이콘/배치 확인·커밋·푸시 없음. 이모지 모양은 기기 글꼴에 따라 다를 수 있다.

## 퀴즈 목록 명칭을 문제로 통일 (2026-10-25)

- 사용자 지적에 따라 세 앱의 표시 문구를 `문제 전체 보기`, `가로 문제`, `세로 문제`, `문제 선택`으로 통일했다. 접근성 이름도 퍼즐 문제/문제 목록으로 맞췄다. 내부 컴포넌트 이름·CSS 식별자·구버전 힌트 API는 변경하지 않았다. 현재 지침·요구사항·앱 안내는 새 명칭을 사용하며 과거 진행 기록은 보존한다.
- 세 앱 빌드(타입 검사 포함), 토스 관련 상호작용 테스트 14개·웹 번호 렌더링 테스트 5개, `git diff --check` 통과. 기존 큰 청크 경고 유지. 문구 변경으로 전체 테스트·lint는 반복하지 않았다.
- 토스 최신 로컬 산출물 `apps/toss/english-words.ait`, 빌드 식별자 `01a17325-bdd3-790e-8026-0e1afa661da7`. `pnpm.cmd --filter @t-crossword/mobile exec cap sync android`·JDK 21을 사용한 `.\gradlew.bat assembleDebug`도 통과해 `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`를 갱신했다. 업로드·설치·실기기 확인·커밋·푸시 없음.

## 토스·Android에 PWA 퀴즈 변경 전체 반영 (2026-10-25)

- 요청: 앞선 PWA의 그리드 너비 확대·힌트 전체 보기·번호 클릭·완료 항목 비활성화·색종이 폭죽·진행/새 퍼즐 오른쪽 정렬을 토스와 Android에도 반영했다. 글자 공개/지갑/보상 제거·오답 표시 무제한은 앞선 적용을 유지한다.
- 토스 `QuizPanel`·`PuzzleBoard`·CSS를 독립 구현했다. 번호가 있는 칸 전체를 누르면 미완료 시작 단어만 선택하며 양방향이면 뜻/글자 수/동의어로 방향을 선택한다. 완료 번호·목록은 비활성화한다. `힌트 전체 보기`는 보드 전체를 덮고 가로/세로 제목·진행은 고정, 아래 2열 목록은 한 영역에서 함께 스크롤한다. 닫기·Escape·단어 선택·토스 뒤로가기를 연결하고 초점 이동을 처리한다. 새 판은 패널을 초기화하며 홈 왕복의 퍼즐은 유지한다.
- 모바일도 자체 `QuizPanel`·`PuzzleBoard`·`ClueButton`·`Modal`을 구현했다. 기존 칸 클릭의 임의 단어 선택 대신 번호 시작 위치별 선택으로 맞췄다. Ionic 설정 바 아래 진행/새 퍼즐을 오른쪽 정렬했다. 기존 최대 너비·화면 높이 보드 제한·가로 화면 분할을 제거하고 본문 스크롤을 허용한다. Android 뒤로가기는 입력창·방향 선택·목록·완성창을 닫은 뒤 홈/종료로 진행한다.
- 토스·모바일이 각각 소유하는 `CompletionConfetti`·CSS로 하단 세 지점에서 위로 발사하는 색종이/리본을 표시한다. 약 4초 내 종료·4.5초 자산 제거·언마운트 타이머 해제·포인터 비차단·동작 줄이기를 적용했다. 모바일 완성 모달에 단어 복습·다음 퍼즐도 연결했다. 앱 사이 UI import나 공유 UI 패키지는 만들지 않았다.
- 토스 상단 영역·하단 메뉴·자동 높이 배너·Safe Area는 기존 셸 흐름을 유지한다. 2026-10-25 [공식 배너 문서](https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner.md)의 화면 너비 컨테이너·고정형 높이 권고를 확인했고 광고 내부 크기·UI는 변경하지 않았다. 광고 없음/미지원/실패의 새 보드 배치·가독성은 실제 토스 확인 대기다. Android 가상 배너 영역도 유지한다.
- 자동 검사 통과: `pnpm.cmd --filter @t-crossword/toss typecheck`, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss test`(11개 파일·77개), `pnpm.cmd --filter @t-crossword/toss build:ait`; `pnpm.cmd --filter @t-crossword/mobile typecheck`, `pnpm.cmd --filter @t-crossword/mobile test`(26개), `pnpm.cmd --filter @t-crossword/mobile build`, `pnpm.cmd --filter @t-crossword/mobile exec cap sync android`; `git diff --check`. 모바일에는 lint 스크립트가 없다. 마지막 색종이 표시 assertion 추가 후 토스 `exec vitest run tests/hintsApp.test.tsx` 9개도 통과했다. 웹 소스는 이번 턴에 변경하지 않아 웹 검사를 반복하지 않았다.
- 회귀 검증: 토스에서 번호→양방향 선택→단어 전달, 한 방향 완료 후 바로 다른 방향, 전체 완료 비활성화, 목록 열기·닫기·Escape·뒤로가기·초점을 검사했다. 완성 통합 테스트는 색종이 존재도 확인한다. 모바일은 번호의 시작 좌표/교차 구분·방향별 완료 처리·빈 번호 선택을 단위 검사했다. 모바일 UI 상호작용·CSS 렌더링은 단위 검사로 검증했다고 보지 않는다.
- Android 네이티브: 기존 Android Studio 설정의 설치 JDK 21을 명령 범위의 `JAVA_HOME`으로만 지정하고 `apps/mobile/android`에서 `.\gradlew.bat assembleDebug` 실행, `BUILD SUCCESSFUL`. 사용자 캐시 접근을 위한 도구 권한 승인을 거쳤다. 개인 경로·JDK 설정은 저장소에 추가하지 않았다. Gradle `flatDir` 권고와 기존 Vite 큰 청크 경고 유지. dist→Android assets→APK의 모든 웹 자산 해시 대응을 추가 검사했다.
- 산출물: 토스 `apps/toss/english-words.ait` (로컬 빌드 식별자 `01a17319-3861-7c24-9316-2663e9dd088a`), Android `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`. 토스 업로드·검토 요청·출시, APK 설치·에뮬레이터 실행은 하지 않았다.
- 실제 토스/Android/iOS의 작은 화면·회전·키보드·배너/no-fill·폭죽 성능·방향 선택/목록 뒤로가기 검증은 남아 있다. 토스 기기 회전 지원 상태는 이전 기록과 같이 별도 확인이 필요하다. 운영 DB·API·커밋·푸시 없음.

## 웹 진행 숫자·새 퍼즐 오른쪽 정렬 (2026-10-25)

- `QuizPage.tsx`의 진행 숫자·새 퍼즐 버튼 줄에 `justify-end`를 적용했다.
- `pnpm.cmd --filter @t-crossword/web build`(타입·PWA 포함)·`git diff --check` 통과. 기존 큰 청크 경고 유지. 정렬 변경으로 테스트는 반복하지 않았다. 실제 브라우저 확인·배포 없음.

## 정답 입력 오답 표시 무제한 (2026-10-25)

- 웹/PWA `WordInputModal`·토스 `AnswerModal`의 횟수 카운터·글자 수 한도 조건·남은 횟수/초기화 안내를 제거했다. 틀린 영문 글자는 계속 붉은색과 `aria-invalid`로 표시한다. 정답 수정·삭제 시 해당 칸만 해제하며 다른 칸의 표시는 유지한다.
- 모바일 `AnswerEntry`·`letterFeedback`도 횟수 인자·잔여 카운터를 제거했다. 토스는 글자 수를 초과해 틀린 뒤에도 붉은 표시와 제출이 가능한 상호작용 회귀 검사, 모바일은 100회 반복 오답 검사로 변경했다. 지침·요구사항·앱 README·PWA 기기 확인 기준을 갱신했다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`, `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(42개), `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss test`(72개), `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/mobile test`(23개), `pnpm.cmd --filter @t-crossword/mobile build`, `pnpm.cmd --filter @t-crossword/mobile exec cap sync android`, `git diff --check`. 세 앱 빌드에 타입 검사 포함. 기존 큰 청크 경고 유지.
- 최신 토스 로컬 번들: `apps/toss/english-words.ait`, 빌드 식별자 `01a17311-9cab-7e93-813b-0336179fed56`. 직전 힌트 제거본을 포함해 다시 생성했으며 업로드·검토 요청·출시는 하지 않았다.
- 실제 브라우저/PWA·토스·Android/iOS 키보드/반복 입력·수정/삭제 확인은 미실행이다. APK 빌드·커밋·푸시·운영 변경 없음.

## 글자 공개·힌트 잔액·완성 보상 제거 (2026-10-25)

- 사용자 확인: 글자 공개·잔액·완성 보상은 삭제하고 문제의 뜻 목록은 유지한다. 웹/PWA·토스·모바일 사용자 기능에 적용했다. 기존 오답노트·즐겨찾기·학습완료·DB 잔액은 삭제하지 않는다.
- 웹 `useCrosswordGame`·`WordInputModal`·`QuizPage`·`PuzzleCompletionModal`에서 공개/차감/잔액/보상 상태·버튼·요청을 제거했다. `App`의 Supabase 설정·익명 인증 진입 조건도 제거해 로컬 퍼즐이 인증 서버 장애로 차단되지 않는다. 완성 축하·색종이 폭죽·복습·다음 퍼즐은 유지하며 보상 대기가 없다. 문제 목록과 번호 클릭은 앞선 작업을 유지한다.
- 토스 `App`·`AnswerModal`·`main`과 모바일 `HomePage`·`AnswerEntry`에서 공개·잔액·보상·gateway 연결을 제거했다. 공통 엔진 기기 출제 뒤 서버 판 등록 없이 사용하고 정답을 기기에서 확인해 저장한다. 토스 배너 광고는 유지한다. 서버가 정답 API에서 보상을 지급하던 경로도 새 앱이 호출하지 않는다.
- 기존 오답노트 안내와 PWA 오프라인 안내를 수정했다. 새 오답노트 등록 정책은 추가하지 않았다. 지침·요구사항·구조·앱 README·PWA 배포·보상 문서에 최신 동작과 기존 이력을 구분했다. core의 기존 힌트 필드·계약, 미사용 gateway/auth 어댑터·테스트, 구버전 서버·마이그레이션은 호환 이력으로 남기며 운영 서버/DB 변경·삭제·배포는 하지 않았다. 기존 배포본에서는 업데이트 전까지 과거 기능이 남을 수 있다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입·PWA), `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(7개 파일·42개 테스트), `pnpm.cmd --filter @t-crossword/toss typecheck`, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss test`(10개 파일·72개 테스트), `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/mobile typecheck`, `pnpm.cmd --filter @t-crossword/mobile test`(23개), `pnpm.cmd --filter @t-crossword/mobile build`, `git diff --check`. 모바일에는 lint 스크립트가 없다. 기존 큰 청크 경고는 유지한다.
- 테스트는 폐기된 힌트 UI/보상 기대를 제거하고 일반 입력·교차 셀·학습 기록·완성 축하를 검증한다. 토스는 기기 퍼즐 생성부터 정답 완성까지 `fetch` 호출이 없고 지갑·공개·보상 UI가 없는 상호작용 회귀 검사를 통과했다. 세 앱 dist JS에서 기존 차감·보상 RPC와 판 등록 등 지정된 호출 표식이 없음을 추가 검사했다. 문자열 검사는 모든 네트워크 동작이나 실기기 검증을 대신하지 않는다.
- Android sync는 샌드박스의 `uv_os_get_passwd ENOMEM`로 처음 실패했으며 도구 권한 승인 후 같은 `pnpm.cmd --filter @t-crossword/mobile exec cap sync android` 재실행으로 통과했다. APK 빌드·Android/iOS 기기 검증은 하지 않았다.
- 토스 로컬 산출물: `apps/toss/english-words.ait`, CLI 빌드 식별자 `01a1730d-6a08-7bb3-ba0b-c40d48da48ff`. `ait build`만 실행했으며 업로드·검토 요청·출시는 하지 않았다. 사용자 직접 업로드 대상이다.
- 남은 검증: 실제 브라우저/PWA 업데이트·오프라인·완성/다음 판, 토스 실제 기기·저장·배너·키보드, Android/iOS. 운영 DB·기존 API를 종료하거나 삭제하려면 별도 승인과 구버전 사용자 영향 확인이 필요하다. 커밋·푸시 없음.

## 웹 퍼즐 완성 색종이 폭죽 (2026-10-25)

- 요청 이미지의 색종이·리본 느낌을 CSS로 구현했다. `CompletionConfetti.tsx`와 `styles/index.css`에서 72개 입자가 화면 하단 세 지점에서 세 차례 위로 퍼진 후 내려오며 사라진다. 외부 이미지·라이브러리는 추가하지 않았다.
- `PuzzleCompletionModal.tsx`가 열릴 때 효과를 시작하며 보상 지급 상태 변경에는 다시 시작하지 않는다. 약 4초 내 애니메이션 종료 후 4.5초에 입자를 제거하고 모달 해제 시 타이머도 정리한다. 효과는 포인터를 가로채지 않고 스크린리더에서 제외한다. 동작 줄이기 설정에서는 입자와 기존 축하 이모지 바운스를 중단한다. 서버 보상 확인 전 지급 성공을 안내하지 않는 기존 경계를 유지한다.
- 검증: 초기 빌드에서 CSS 사용자 정의 속성 타입 오류를 확인해 명시적 타입으로 수정했다. 이후 `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입·PWA 포함), `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(7개 파일·44개 테스트), `git diff --check` 통과. 보상 상태와 독립적인 축하 표시/닫힘 회귀 검사를 추가했다. 기존 큰 청크 경고 유지.
- 미검증: 실제 브라우저/PWA의 발사 궤적·프레임 성능·회전·동작 줄이기·버튼 조작. 정적 렌더링 테스트는 애니메이션 시각 검증을 대신하지 않는다. 웹 전용이며 토스·모바일 변경, 커밋·푸시·배포 없음.

## 웹 완료 힌트 클릭 비활성화 (2026-10-25)

- `HintListSection.tsx`의 완료 항목 버튼에 `disabled`를 적용해 클릭·키보드로 정답 입력창을 다시 열 수 없도록 했다. 기존 체크·정답 표시·목록 위치는 유지한다.
- 검증: `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입·PWA 포함), `git diff --check` 통과. 기존 큰 청크 경고 유지. 단순 버튼 비활성화 변경으로 전체 테스트는 반복하지 않았다.
- 실제 브라우저/PWA의 클릭·키보드 확인 미실행. 토스·모바일 변경, 커밋·푸시·배포 없음.

## 웹 완료 번호 비활성화·남은 방향 바로 입력 (2026-10-25)

- `CrosswordBoard.tsx`에서 시작 좌표의 단어 중 `solvedWordIds`에 없는 단어만 번호 클릭 대상으로 삼는다. 미완료가 2개면 방향 선택, 1개면 해당 단어 입력창, 0개면 번호 버튼 비활성화로 처리한다. 교차 칸이 초록색이어도 다른 방향이 미완료이면 입력할 수 있다. 접근성 이름도 남은 방향/완료 상태를 반영한다.
- `tests/crosswordBoard.test.tsx`에 양방향 미완료·가로만 완료·세로만 완료·양방향 완료·단일 방향 완료의 번호 상태 회귀 검사 5개를 추가했다. 정적 렌더링 검사이며 실제 클릭·모달 전환 검증과 구분한다.
- 검증: `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입·PWA 포함), `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(7개 파일·43개 테스트), `git diff --check` 통과. 기존 큰 청크 경고 유지.
- 미검증: 실제 브라우저/PWA에서 완료 전후 클릭·모달 전환. 토스·모바일 변경, 커밋·푸시·배포 없음.

## 웹 그리드 번호 선택·가로/세로 힌트 선택 (2026-10-25)

- 요청: `CrosswordBoard.tsx`의 번호 칸 전체에 버튼을 배치하고 `QuizPage.tsx`에서 기존 `selectWord`로 연결했다. 해당 칸을 시작 좌표로 하는 단어가 하나면 바로 정답 입력창을 연다. 번호 없는 칸에는 버튼을 만들지 않는다.
- 같은 칸에서 가로·세로가 시작하면 네이티브 dialog에 가로·세로 순으로 뜻·글자 수·동의어를 표시한다. 선택하면 방향 선택창을 닫고 해당 단어의 입력창을 연다. 닫기·Escape 취소와 브라우저의 모달 포커스 처리를 사용한다. 정답 판정·힌트 차감 규칙은 기존 흐름을 사용한다.
- 검증: `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입·PWA 포함), `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(6개 파일·38개 테스트), `git diff --check` 통과. 기존 큰 청크 경고 유지.
- 미검증: 실제 브라우저/PWA에서 단일·양방향 번호 클릭, 선택 취소·키보드·입력 모달 전환. 기존 테스트 통과는 신규 클릭 상호작용 검증을 포함하지 않는다. 토스·모바일 수정, 커밋·푸시·배포 없음.

## 웹 퀴즈 그리드 확대·힌트 전체 보기 (2026-10-25)

- 요청: 그리드를 화면 가로 공간에 맞춰 확대하고 상시 힌트 목록을 한 줄 버튼으로 변경했다. `CrosswordBoard.tsx`의 400px/46svh 제한과 `QuizPage.tsx`의 본문 최대 너비·방향별 분할을 제거했다. 작은 좌우 여백과 정사각형 셀은 유지하며 낮은 화면에서는 본문을 스크롤한다.
- `힌트 전체 보기`를 누르면 그리드 전체 영역에 기존 가로·세로 2열 목록이 겹쳐 표시된다. 제목·진행은 고정하고 문제 목록만 스크롤한다. 닫기·Escape·단어 선택으로 닫으며 열 때 닫기 버튼, 닫을 때 열기 버튼으로 포커스를 이동한다. 단어 선택은 기존 입력창으로 연결한다. 난이도·크기·새 퍼즐 변경 시 목록을 접는다.
- `AGENTS.md`의 웹 퀴즈 배치 기준을 최신 요청에 맞췄다. 토스·모바일 UI는 변경하지 않았다.
- 검증: `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입 검사·PWA 생성 포함), `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(6개 파일·38개 테스트), `git diff --check` 통과. 기존 500kB 초과 청크 경고 유지.
- 미검증: 실제 브라우저의 작은 화면·가로 회전·키보드·힌트 열기/닫기·단어 입력 흐름 및 설치된 PWA 갱신. 기존 웹 테스트는 통과했으나 신규 힌트 동작을 자동 상호작용 테스트로 검증한 것은 아니다. 커밋·푸시·배포 없음.

## 모바일 작업 문서 정리·커밋 사용자 진행 (2026-10-23)

- 사용자 결정: 커밋은 사용자가 직접 수행한다. 에이전트는 이번 문서 정리에서 스테이징·커밋·푸시를 실행하지 않는다.
- `apps/mobile/README.md`에 오답노트·뒤로가기·힌트 번호 정렬·그리드 크기 대응·그림책 화살표/해석/목록 최종 구성을 반영했다. 예전 테스트 5개/뒤로가기 미구현/준비 화면 설명을 최신 23개 테스트·구현 완료/기기 검증 대기로 구분하고, 사용자 캡처 확인과 에이전트 CLI APK 미실행을 구분했다.
- `PROJECT_STRUCTURE.md`의 모바일 준비 화면 설명을 공통 엔진 Worker·독립 UI 구현 상태로 갱신하고 토스 검수 요청 상태도 반영했다. Phase 7 체크리스트를 구현·운영 연결·기기 확인·후속 광고/저장으로 나눴다. 기존 날짜별 작업 기록은 보존한다.
- 문서만 변경했다. 경로·기존 실행 이력을 대조하고 `git diff --check` 통과. 추가 빌드·테스트·네이티브 sync·배포 없음. 기존 큰 청크 경고와 실제 Android/iOS·운영 힌트·광고 검증 대기는 유지한다.

## 모바일 그림책 목록 버튼 테두리·우측 정렬 (2026-10-23)

- 사용자 요청으로 `PictureBooks.tsx`의 목록으로 버튼을 해석 보기와 같은 outline 형태로 변경하고 `mobile.css` 버튼 줄에 space-between을 적용해 오른쪽 끝에 배치했다.
- 모바일 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile build`(타입·콘텐츠 검사)·`exec cap sync android`·`git diff --check` 통과. 기존 큰 청크 경고 유지. 배치 변경으로 기능 테스트는 반복하지 않았다. 실제 기기 배치 확인 대기, 커밋·푸시 없음.

## 모바일 그림책 목록 버튼 위치 조정 (2026-10-23)

- 사용자 요청으로 `PictureBooks.tsx`의 상단 목록으로 버튼을 이미지 아래 해석 보기 오른쪽으로 이동했다. 두 버튼을 `mobile-reading-actions`에 배치하고 해석은 버튼 줄 아래에 표시한다. 단일/다중 페이지 모두 적용하며 목록 복귀·Android 뒤로가기 동작은 유지한다.
- 모바일 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile build`(타입·61편/119장 검사)·`exec cap sync android`·`git diff --check` 통과. 기존 큰 청크 경고 유지. 배치만 변경해 기능 테스트는 반복하지 않았다. 실제 Android 배치는 사용자 확인 대기다. 커밋·푸시 없음.

## 모바일 그림책 이미지 위 페이지 화살표 (2026-10-23)

- 사용자 요청으로 `PictureBooks.tsx`의 이전/다음 이동을 이미지 프레임 좌우의 반투명 화살표로 옮겼다. 한 장짜리 작품에는 이동 nav를 만들지 않고 첫 장의 이전·마지막 장의 다음은 숨긴다. 상단 목록으로는 유지하고 하단의 중복 이전/목록/다음 줄을 제거했다.
- `mobile.css`에 이미지 기준 오버레이·44×48px 조작 영역·키보드 포커스 표시를 추가했다. 오버레이 전체는 포인터를 가로채지 않고 버튼만 클릭 가능하다. 기존 이미지 재시도·해석 보기·페이지 이동 시 스크롤 초기화와 Android 뒤로가기 목록 복귀는 유지한다.
- 모바일 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile build`(타입·61편/119장 검사)·`exec cap sync android`·`git diff --check` 통과. 기존 큰 청크 경고 유지. 단순 UI 변경으로 기존 기능 테스트는 반복하지 않았다. 실제 Android 한 장/여러 장·화살표 가독성/본문 가림·회전 확인은 사용자 대기다. 커밋·푸시 없음.

## 모바일 정답 표시 후 그리드 셀 확대 대응 (2026-10-23)

- 사용자 보고를 바탕으로 보드가 열만 1fr로 지정하고 행은 콘텐츠 높이에 의존하는 것을 확인했다. 글자가 들어간 버튼의 최소 콘텐츠 높이로 행이 커질 수 있어 `HomePage.tsx`에서 행·열을 모두 판 크기별 `minmax(0, 1fr)`로 지정했다.
- `mobile.css`에 셀 최소 높이 0·중앙 정렬·line-height 1을 적용하고 글자 크기를 10~18px로 조정했다. 콘텐츠가 트랙을 확장하지 않도록 셀 overflow를 제한했다. 입력 모달과 정답 판정 로직은 유지한다.
- 모바일 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile build`(타입·61편/119장 검사)·`exec cap sync android`·`git diff --check` 통과. 기존 큰 JS 청크 경고 유지. 레이아웃 수정으로 기능 테스트는 반복하지 않았다. 실제 기기에서 8/10/12 정답 표시 전후의 셀 크기·번호/글자 가독성·가로 화면은 확인 대기다. 커밋·푸시 없음.

## 모바일 힌트 번호 오름차순 정렬 (2026-10-23)

- 사용자 캡처의 16→19→6 등 순서 문제를 수정했다. `apps/mobile/src/pages/HomePage.tsx`에서 방향별로 필터링한 새 배열을 번호 오름차순으로 정렬해 가로/세로 각각 표시한다. 완료 단어도 번호 위치를 유지하며 원본 퍼즐 배열은 변경하지 않는다.
- 모바일 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile build`(타입·61편/119장 검사 포함)·`exec cap sync android`·`git diff --check` 통과. 기존 큰 청크 경고 유지. 단순 표시 정렬로 기능 테스트는 반복하지 않았다. 실제 기기 목록 확인은 사용자 대기이며 커밋·푸시 없음.

## Android 하드웨어 뒤로가기 연결 (2026-10-23)

- 공식 App 플러그인 7.1.2의 MIT·core >=7 peer·배포 크기 약 70KB(unpacked)를 레지스트리로 확인하고 모바일에 고정 버전 추가했다. SDK 네이티브 소스에서 backButton 리스너가 있어야 document backbutton이 전달되는 것을 확인했다. AGP/Gradle 버전은 변경하지 않았다.
- `adapters/androidBack.ts`는 Android에서만 App 리스너와 Ionic `ionBackButton` 우선순위 10을 등록한다. 실제 이동은 Ionic 한 경로로만 실행하고 비동기 등록 후 해제·언마운트도 처리한다. 네이티브 실패는 화면 오류로 안내한다.
- `backNavigation.ts`·`HomePage.tsx`·`PictureBooks.tsx`에 요청 중 대기 → 정답 입력창 닫기 → 활성 그림책 읽기에서 목록 → 다른 탭에서 홈 → 홈에서 종료를 연결했다. 숨겨진 그림책 읽기 상태는 다른 탭 뒤로가기에 관여하지 않는다. HTML dialog cancel 기본 동작도 막아 요청 중 닫힘을 방지한다. 진행 판 상태는 메뉴 이동에 보존하지만 종료 후 판 복원은 제공하지 않는다.
- 검증: 모바일 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile test` 23개 통과(뒤로가기 분기/우선순위/종료 실패 5개 포함). 모바일 `build` 타입·콘텐츠 61편/119장·웹 빌드 통과. 최초 타입 검사에서 DocumentEventMap 누락을 확인해 공식 이벤트 타입으로 보강 후 통과했다. 네이티브 호출을 어댑터로 분리한 최종 빌드도 통과했다. 기존 큰 JS 청크 경고 유지.
- 설치 시 pnpm이 정리한 무관한 lockfile 해석·스냅샷을 보존했고 `pnpm.cmd install --lockfile-only --frozen-lockfile --offline --ignore-scripts` 통과. Android sync에서 App 7.1.2 등록 확인, 최종 동기화·`git diff --check` 확인. README 갱신.
- 실제 Android 물리 버튼/제스처·키보드가 먼저 닫히는 경우·그림책 목록 위치·빠른 연속 입력·요청 중 보호·홈 종료는 기기 검증 대기다. APK 빌드·iOS·운영 서버·광고 연결·배포는 이번 범위에서 실행하지 않았다. 커밋·푸시는 사용자 요청에 따라 보류한다.

## 모바일 배너 실제 높이 연동 후속 작업 (2026-10-23)

- 사용자 요청으로 지금 광고 SDK를 추가하지 않고 후속 작업으로 남긴다. 현재 Android 하단의 96px은 가상 광고 예약 공간이며 실제 광고 높이에 연동되지 않는다. 토스의 콘텐츠 높이 배너와 구분한다.
- [ ] 설치 Capacitor 버전에 맞는 AdMob 플러그인의 버전·API·라이선스·유지보수·네이티브 호환성을 확인하고 광고 SDK를 연결한다. 현재 Capacitor 7이며 운영 앱 ID·배너 광고 단위 ID는 아직 확인하지 않았다.
- [ ] 공식 테스트 광고로 시작해 SDK 배너 크기 변경 이벤트에 맞춰 하단 예약 공간을 실제 높이로 갱신한다. 네이티브 dp/물리 픽셀과 WebView CSS px의 단위를 확인하고 96px 고정을 제거한다. 광고 자체를 축소하거나 자르지 않는다.
- [ ] 초기 로드·광고 없음·실패·숨김/제거·앱 복귀·화면 회전·키보드 상태에서 높이를 처리하고 리스너를 정리한다. 메뉴와 광고의 겹침·오클릭·로드 후 레이아웃 이동을 방지하고 시스템 안전영역을 한 번 적용한다.
- [ ] Android 기기/에뮬레이터에서 실제 광고 높이·탭 접근·작은 화면·가로 화면을 검증한다. iOS는 별도 설정·검증한다. 운영 전 광고 ID·동의 처리·광고 정책과 배포 산출물을 확인한다.
- 이번에는 문서만 수정했다. SDK 설치·광고 요청·네이티브 설정 변경·빌드·배포·커밋·푸시 없음. `git diff --check` 확인.

## 모바일 오답노트 숨김 삭제·힌트 재사용 시 복귀 (2026-10-23)

- 사용자 선택에 따라 `apps/mobile/src/adapters/progress.ts`에 선택적 `hiddenHintedWords` 저장·검증과 숨김/힌트 기록/목록 판별 함수를 추가했다. 기존 기록을 호환하고 손상된 숨김 필드는 덮어쓰지 않는다. 숨김은 힌트 이력·즐겨찾기·학습완료를 보존하며 힌트 성공 시 해당 단어만 복귀한다.
- `HomePage.tsx`에 오답노트 전용 삭제 버튼·목록 숨김 안내·필터를 연결했다. 저장 성공 후에만 목록을 갱신한다. `mobile.css`에 버튼 터치 크기와 안내 배치를 추가했다. 공통 패키지·토스·서버·DB 변경 없음.
- 검증: `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile test` 18개 통과(추가 3개: 숨김/복귀·기록 보존/영속 복원·구버전/손상 데이터·쓰기 실패). `sync:android`의 타입·61편/119장 콘텐츠 검사·웹 빌드는 통과했으나 Capacitor의 시스템 사용자 정보 조회 `uv_os_get_passwd ENOMEM`으로 중단됐다. 권한 상승 후 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/mobile exec cap sync android` 재실행 통과. `git diff --check` 확인. 기존 큰 JS 청크 경고 유지.
- 모바일 README·`docs/mobile-hints.md` 갱신. 실제 Android 삭제·탭 이동/재시작 후 숨김 유지·힌트 재사용 복귀와 서버 연결은 사용자 기기 확인 대기다. APK 빌드·iOS 검증·운영 설정·배포는 하지 않았다. 사용자 요청에 따라 커밋·푸시는 보류한다.

## 토스 사용자 검수 요청 완료 (2026-10-23)

- 사용자가 최신 토스 배포본의 검수 요청을 완료했다고 보고했다. 앞선 최신 번들 업로드·검수 요청 대기는 이 보고로 갱신하며 검수 결과는 대기다. 승인·공개 출시 완료를 의미하지 않는다.
- 힌트 하단 여백 제거 후 실제 기기 배치 및 다른 광고·작은 화면·가로 화면 검증은 별도 완료 보고가 없어 대기로 유지한다. 에이전트의 추가 업로드·배포·검사 실행은 없다.

## 타 프로젝트 전달용 하단 레이아웃 사례 정리 (2026-10-23)

- `docs/toss-miniapp-deployment-lessons.md`에 SDK/TDS/env 단일 적용 확인, 96px 권장값과 최대값의 구분, 콘텐츠 높이 배너 CSS·적용 전제, 색상/좌표 진단, 실기기 수치와 미검증 항목, 힌트/메뉴 여백 분리, 진단 없는 일반 빌드·사용자 업로드 절차를 추가했다. 앱 식별자나 비밀값 없이 다른 프로젝트에 전달할 수 있게 정리했다.
- 직전 일반 배포본 재생성 성공: deploymentId `01a167b8-f808-7646-b42f-ba739da8f6ea`(이전 기록의 번들을 대체). 이번 작업은 문서만 수정했으며 `git diff --check` 확인. 추가 빌드·테스트·업로드·커밋·푸시 없음.

## 토스 퀴즈 힌트 아래 외부 여백 제거 (2026-10-23)

- 사용자 캡처·요청에 따라 `apps/toss/src/styles.css`의 `.quiz-page` 하단 padding 12px을 제거했다. 하단 메뉴 상단 12px과 힌트 내부 포커스/목록 여백, 광고 자동 높이·안전영역은 유지한다. 가로·세로에 공통 적용하며 힌트 제목 고정·문제 목록 스크롤 구조는 유지한다.
- 일반 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/toss build:ait` 통과(타입·콘텐츠 61편/119장·크기·광고 검사). `git diff --check` 통과. CSS만 변경하여 기존 기능 테스트·lint는 반복하지 않았다. 기존 큰 JS 청크 경고 유지. 실제 기기 배치는 사용자 확인 대기다.
- 최신 검수 업로드용 `apps/toss/english-words.ait`, deploymentId `01a167b8-0c01-79e6-b713-eeb94613a827`. 진단 없는 일반 번들이며 업로드·검수 요청은 사용자 담당이다. 에이전트 업로드·출시·커밋·푸시 없음.

## 토스 검수 업로드용 일반 번들 준비 (2026-10-23)

- 후속 사용자 캡처에서 광고 자동 높이 적용 후 광고 외부 94px(기존 101px), 탭 64px, 안전영역 31px을 확인했다. 해당 홈 캡처상 겹침·잘림은 보이지 않는다. 다른 광고·기기·화면까지 검증한 것은 아니다.
- 사용자 결정에 따라 광고 자동 높이와 안전영역을 유지하고 진단 환경변수 없이 일반 `build:ait`를 실행했다. 배포 dist에서 진단 코드·패널·색상 표식 미포함을 별도 확인했다. 진단 소스는 opt-in 도구로 보존한다.
- 검증: `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/toss build:ait` 통과(타입·61편/119장·크기·테스트 광고 검사 포함), 진단 표식 검사·`git diff --check` 통과. 기존 큰 JS 청크 경고 유지. 실행 코드 추가 수정 없이 기능 테스트·lint는 앞선 통과 결과를 유지한다.
- 검수 업로드용 `apps/toss/english-words.ait`, deploymentId `01a167b2-5627-7492-88f9-85997b086469`. 앱 버전 1.0.1 유지. 업로드·검수 요청은 사용자 담당이며 에이전트는 업로드·공개 검토·출시·커밋·푸시를 실행하지 않았다.

## 토스 배너 SDK 콘텐츠 높이 적용 비교본 (2026-10-23)

- 사용자 진단 캡처에서 SDK 31 / TDS 31px / env 31px, 광고 시작 585·끝 686(101px), 안전영역 31·앱끝 717을 확인했다. 앱 내부 안전영역은 한 번 적용된다. 비교 앱의 실제 배너 높이는 미측정이며 캡처 추정치다.
- 공식 배너 문서의 컨테이너 사이즈 설정은 고정형 96px 권장과 인라인 높이 미지정을 구분한다: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner.md (2026-10-23 확인). 작은 높이 옵션·높이 반환 API는 확인되지 않았다.
- 일반 flex 문서 흐름인 광고 컨테이너의 고정 96px을 제거하고 SDK가 렌더링하는 콘텐츠 높이를 사용한다. `display: flow-root`로 내부 레이아웃을 포함하며 광고 내부 스타일·자르기·축소는 적용하지 않는다. 탭 간격·안전영역·색상/숫자 진단을 유지한다. 콘텐츠 자체가 96px이면 높이가 줄지 않을 수 있다. 광고가 자체 높이를 제공하는지·탭/광고 겹침과 no-fill 상태는 실제 토스 비교가 필요하다.
- 진단 환경 `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/toss build:ait` 통과(타입·61편/119장·번들 크기·테스트 광고 검사 포함). CSS만 변경하여 앞서 통과한 기능 테스트 77개·lint는 반복하지 않았다. 기존 큰 JS 청크 경고 유지. `git diff --check` 통과.
- 새 `apps/toss/english-words.ait`, deploymentId `01a167ae-2868-7b06-980e-cfdf3c0f0be6`. 업로드는 사용자 담당이며 이번 업로드·기기 확인·공개 출시는 실행하지 않았다.

## 토스 하단 여백 조사·진단 번들 (2026-10-23)

- 설치 SDK 3.8.0·TDS AIT 2.5.1 소스 확인: Provider는 SDK 안전영역을 body의 `--toss-safe-area-bottom`으로 전달하며 자체 하단 padding을 추가하지 않는다. 기존 CSS `var(..., env(...))`는 두 값을 합산하지 않는다. 따라서 중복 적용이나 불필요한 여백은 아직 확정하지 않았다.
- `styles.css`·`App.tsx`에서 셸 하단 padding을 같은 높이의 `.bottom-safe-area`로 분리했다. SDK의 0도 유지하고 광고 96px·메뉴 간격·flex 배치를 보존한다. 안전영역을 임의로 삭제하거나 광고를 축소하지 않았다.
- `main.tsx`·`adapters/layoutDiagnostics.ts`/`.css`에 `VITE_TOSS_LAYOUT_DEBUG=true` 빌드 전용 진단을 추가했다. 초록=탭, 노랑=광고 슬롯(SDK 내부 UI 유지), 주황=앱 하단 안전영역, 분홍/보라=body/root 배경이다. 포인터를 가로채지 않는 상단 표시로 SDK/TDS/env·창/화면 높이·각 시작/끝 좌표를 확인한다. 일반 빌드에서는 활성화하지 않는다.
- 검증: 토스 `lint`, `test` 77개, 진단 환경으로 `build:ait`(타입·61편/119장·크기·테스트 광고 검사 포함), `git diff --check` 통과. 기존 큰 청크 경고 유지. 최초 진단 빌드의 top-level await 오류를 비동기 import로 수정한 뒤 재빌드 통과했다.
- 번들 `apps/toss/english-words.ait`, deploymentId `01a167a8-5f1d-7044-a363-5c17ff5e37ac`. 사용자 요청으로 업로드를 시도했으나 `fetch failed`; 네트워크 권한 상승 재시도는 사용자 거절로 실행되지 않았다. **업로드 미완료**, 기기 비교·중복 여부 확정과 불필요한 여백 제거는 대기다. 공개 검토·출시·DB/API 변경·커밋·푸시는 하지 않았다.

## 토스 번들 사용자 업로드·확인 완료 (2026-10-23)

- 사용자가 토스 번들을 직접 업로드하고 확인했으며 이상 없다고 보고했다. 앞선 토스 수정 기록의 번들 업로드·사용자 확인 대기는 이 보고로 갱신한다.
- 기기·OS와 개별 시나리오별 확인 내역은 별도로 전달받지 않았다. 에이전트의 추가 업로드·배포·검사 실행은 없으며, 공개 검토 요청·출시 완료를 의미하지 않는다. 모바일 운영 연결·기기 검증 대기는 유지한다.

## 모바일 비회원 인증·서버 힌트 연결 구현 (2026-10-22)

- 사용자 동의한 비회원 익명 방식과 토스 동일 힌트 정책을 구현했다. 모바일 Auth REST 어댑터는 익명 세션 저장·복원·갱신, 동시 가입 방지·기존 계정 보존을 처리한다. Supabase 공식 익명 인증 문서와 설치 SDK의 signup 경로를 확인했다. 새 의존성은 없다.
- 별도 `mobile-hints` Edge 진입점을 추가했다. 기존 API 처리·지갑/RPC를 재사용하고 서버에서 Supabase getUser 검증·익명 여부 확인 후 `mobile-anonymous:` identity와 `mobile-v1:` 세션 해시로 토스와 격리한다. 신규 스키마·운영 DB 변경은 없다. 기존 토스 기본 동작은 유지한다.
- 모바일 판 등록·중복 재시도 UUID, 힌트 1개 차감·공개 셀·오답노트 이력, 상단 잔액과 서버 완료 확인 후 +5 보상을 연결했다. 설정 없이는 기존 로컬 퀴즈를 유지하고 힌트는 연결 필요로 표시한다. 보상형 광고와 오답노트 숨김 삭제 UI는 미구현이다.
- 검증: 모바일 테스트 15개·build(타입/61편·119장 검사), API 전체 68개 통과/프로파일링 1개 skip·`build:mobile-edge` 통과. 큰 JS 청크 경고 유지. `git diff --check` 확인. Auth/네임스페이스·기존 지갑/권한/멱등성은 mock/PGlite 검사이며 실제 가입·지급 검증은 아니다.
- `docs/mobile-hints.md`에 적용 순서·세션 상실·localStorage 보안/영속성·익명 남용·기존 authenticated 역할 권한·미검증 범위를 기록했다. 운영 인증 설정 변경·신규 함수 배포·모바일 환경 설정은 승인 전이며 실제 사용자/잔액은 변경하지 않았다. 앱 키·인증서·서비스 역할 키는 추가하거나 출력하지 않았다.

## 토스 설정 홈 화면 추가 안내 (2026-10-22)

- 설정 제목 아래에 연한 파란 안내 카드를 추가했다. 문구는 ‘영어 낱말을 더 가까이 두세요. 오른쪽 위 ··· 를 누르고 ‘휴대폰 홈 화면에 추가’를 선택해 보세요.’이며 더보기 모양은 비클릭 안내 표시다. 사용자 제공 메뉴 문구를 사용했고 SDK 호출은 추가하지 않았다.
- `apps/toss/src/App.tsx`·`styles.css` 변경. build:ait(타입·콘텐츠·크기·테스트 광고 검사) 통과, `git diff --check` 확인. 배치·메뉴 안내의 실제 기기 확인 및 업로드는 사용자 진행 대기다.

## 토스 퍼즐 비문제 칸 회색 조정 (2026-10-22)

- 사용자 참고 이미지에 맞춰 `apps/toss/src/styles.css`의 `.cell.blocked` 배경을 진한 회색 `#333d4b`에서 안드로이드와 같은 회색 `#8b95a1`로 변경했다. 문제 칸·공개 글자 스타일은 유지한다.
- 토스 build:ait(타입·콘텐츠·번들/테스트 광고 검사)·`git diff --check` 확인. 색상 변경으로 기능 테스트는 반복하지 않았다. 실제 토스 기기 색상 확인·업로드는 사용자 진행 대기다.

## Android 그림책 목록 참고 화면 대응 (2026-10-22)

- 모바일 그림책 제목·설명을 같은 헤더에 배치하고 초/중/고급 선택 버튼을 같은 너비로 펼쳤다. 목록은 연한 파랑의 영문 제목 버튼으로 단순화하고 한국어 제목/페이지 수는 접근성 이름에 유지했다. AI 창작 안내는 목록/읽기 아래의 고정 영역에 유지한다.
- 제목·난이도·안내는 고정하고 작품 목록만 스크롤하며 기존 읽기·해석·목록 위치 복원은 유지한다. 모바일 build·Android sync·`git diff --check` 확인. 실제 에뮬레이터 배치는 사용자 확인 대기다.

## Android 단어장 참고 화면 대응 (2026-10-22)

- 나의 단어장 제목·결과 개수, 전체/즐겨찾기/학습완료/오답노트 분류, 검색창, 단어/난이도/품사/뜻/보라색 동의어/영한 예문 표시를 참고 화면에 맞췄다. 헤더·필터·검색 고정과 목록 스크롤을 유지한다.
- 학습완료 필터는 모바일 저장 기록을 사용한다. 모바일 힌트 이력이 아직 없어 오답노트는 빈 목록이며 오답 입력을 임의로 힌트 사용 이력으로 바꾸지 않는다. 삭제·숨김·재등록 연동은 실제 힌트 기능 구현 시 추가한다.
- 모바일 build(타입·콘텐츠 포함)·Android sync·`git diff --check` 확인. 실제 필터/검색/스크롤·글자 가독성은 사용자 에뮬레이터 확인 대기다.

## Android 오답 표시 유지·토스 회귀 확인 (2026-10-22)

- 모바일 `AnswerEntry.tsx`가 다음 입력마다 단일 오답 위치를 지우던 것을 칸별 목록으로 수정했다. 다른 칸 이동/입력은 기존 붉은 표시를 보존하고 수정/삭제한 칸만 갱신한다. 글자 수 표시 한도는 유지한다.
- 토스는 기존 `incorrectIndices`가 같은 정책으로 동작하며 실행 코드는 변경하지 않았다. 포커스 이동·다음 칸 오답 입력·이전 칸 정정 시 다른 칸 표시 유지 DOM 회귀 테스트를 추가했다.
- 모바일 테스트 11개·build(타입/콘텐츠 포함)·Android sync, 토스 answerModal 11개 통과. `git diff --check` 확인. 실제 Android/iPhone 색상 유지 확인은 사용자 대기다. 토스 테스트만 추가되어 번들은 다시 만들지 않았다.

## Android 긴 단어 정답 칸 한 줄 유지 (2026-10-22)

- 사용자 캡처의 긴 단어 마지막 입력 칸 줄바꿈을 수정했다. `AnswerEntry.tsx`·`mobile.css`에서 flex-wrap 대신 글자 수 기준 CSS grid로 너비를 균등 분배한다. 칸 높이 최소 48px·글자 크기 최소 16px를 유지하고 짧은 단어는 최대 너비로 제한한다.
- 모바일 build·Android sync·`git diff --check` 확인. 긴 단어·작은 화면에서 실제 키보드 입력 가독성은 사용자 에뮬레이터 확인 대기다. 캡처에 보이는 키보드 문자 미리보기 팝업은 키보드 자체 표시로 이번 수정 대상은 줄바꿈이다.

## Android 힌트 카드·방향별 진행 표시 (2026-10-22)

- 사용자 참고 화면에 맞춰 모바일 가로/세로 제목 옆에 방향별 완료/전체 숫자를 표시했다. 문제 카드에 번호·뜻과 우측 글자 수를 배치하고 동의어는 보라색 별도 줄로 표시한다. 동의어 없는 항목은 생략한다.
- 연한 파란 카드·완료 카드의 구분과 긴 뜻/동의어 줄바꿈을 적용했다. 제목·진행 숫자는 고정하고 2열 목록만 스크롤한다. 모바일 build·Android sync·`git diff --check` 확인. 실제 에뮬레이터 가독성은 사용자 확인 대기다.

## Android 난이도·그리드 선택 즉시 출제 (2026-10-22)

- 모바일은 선택 상태만 변경하던 동작을 수정했다. 다른 난이도/크기를 누르면 선택 값을 Worker에 직접 전달해 즉시 새 판을 생성한다. 성공 시 판과 선택 상태를 함께 갱신하고 실패 시 기존 판·선택·풀이 기록을 보존한다. 같은 설정 클릭은 재생성하지 않고 생성 중에는 중복 요청을 차단한다.
- 토스는 이미 설정 선택 시 출제하는 것을 확인해 변경하지 않았다. 모바일 build(타입·콘텐츠 검사 포함)·Android sync·`git diff --check` 확인. 실제 설정 전환 동작의 에뮬레이터 확인은 사용자 대기다.

## 토스 힌트 후 iOS 정답 모달 밀림 대응 (2026-10-22)

- 사용자 보고: 힌트 후 인접 입력 칸을 누르면 모달이 위로 밀리고 다른 이벤트 때 복구된다. 원인 후보로 힌트 요청 중 모든 입력의 readOnly 전환과 힌트 버튼 포커스 이동을 확인했다. 실제 iOS 원인 확정·수정 성공은 기기 재검증 전이다.
- `AnswerModal.tsx`에서 힌트 버튼 pointerdown의 기본 포커스 이동을 막고, 공개될 입력 칸이 readOnly가 되기 전에 다음 빈 칸으로 preventScroll 포커스를 옮긴다. 요청 중 전체 readOnly 전환 대신 기존 ref 입력/제출 차단과 aria-disabled를 사용한다. 교차/공개 글자 readOnly와 중복 요청 차단은 유지한다. 기존 모달의 viewport scroll/focus 반복 재배치 방식은 다시 추가하지 않았다.
- 토스 테스트 76개 통과: 요청 중 입력 차단·포커스 유지, 부모 힌트 반영 후 공개 칸 보호·인접 칸 이동 검사 포함. build:ait와 lint 결과 확인 후 새 번들을 전달한다. 실제 토스 iPhone에서 힌트→인접 칸 터치·키보드 유지·위치 복원은 사용자 확인 대기다. 업로드·배포는 실행하지 않았다.

## Android 최초 퀴즈 진입 자동 생성 (2026-10-22)

- 홈 `퀴즈 시작`과 하단 `퀴즈 풀기`를 `openQuiz`로 연결했다. 판이 없으면 현재 난이도/크기로 자동 생성하고 기존 판이 있으면 풀이 상태를 보존해 복귀한다. 종료 후 판 복원은 제공하지 않는다.
- Worker 참조로 빠른 중복 진입의 동시 생성을 방지하고 생성 도중 다른 메뉴로 이동한 경우 완료 시 화면을 강제로 퀴즈로 바꾸지 않는다. 실패 후 제목 우측 버튼으로 다시 생성할 수 있다.
- 모바일 build(타입·콘텐츠 포함)·Android sync 통과. `git diff --check` 확인. 자동 진입·진행 판 복귀·실패 재시도의 에뮬레이터 확인은 사용자 진행 대기다. 기존 단위 테스트는 이번 화면 전환 동작을 직접 검증하지 않는다.

## 모바일 가상 광고 공간 선반영 (2026-10-22)

- 사용자 요청으로 모든 모바일 화면의 공통 footer에서 하단 메뉴 아래 96px 비클릭 광고 자리를 예약했다. 실제 SDK·광고 요청·ID·보상은 연결하지 않으며 이 크기는 설계용이다. Ionic footer의 하단 안전 영역 위에 배치한다.
- 퀴즈 보드는 뷰포트 전체 높이 대신 남은 본문 컨테이너 높이에 반응하도록 크기를 조정했다. 홈 중앙 정렬·그림책·단어장/힌트 내부 스크롤이 줄어든 콘텐츠 공간을 사용한다. 실제 에뮬레이터 작은 화면·키보드·가로 화면 가독성은 확인 대기다.
- 모바일 build·Android sync·`git diff --check`를 수행한다. 기존 기능 로직 변경 없이 공간 배치만 수정했으며 실제 광고 SDK 크기는 연동 시 별도 확인한다.

## Android 퍼즐 생성 버튼 제목 우측 이동 (2026-10-22)

- 사용자 요청으로 퍼즐 만들기/새 퍼즐 버튼을 `퀴즈 풀기` 제목과 같은 줄 오른쪽으로 이동했다. 난이도·크기 한 줄 배치는 유지했다. `HomePage.tsx`·`mobile.css` 변경.
- 모바일 build·Android sync·`git diff --check` 확인. 기능 로직 변경 없이 배치만 수정했으며 에뮬레이터 확인은 사용자 진행 대기다.

## Android 퀴즈 선택 영역 한 줄 정렬 (2026-10-22)

- 난이도 3개와 크기 3개를 같은 줄의 두 그룹으로 배치하고 퍼즐 생성 버튼은 아래 오른쪽으로 분리했다. 그룹별 접근성 이름과 선택 상태는 유지한다. `HomePage.tsx`·`mobile.css` 변경.
- 모바일 build(타입·그림책 검사 포함)·Android sync·`git diff --check`를 실행한다. 배치 변경으로 기존 기능 테스트는 반복하지 않는다. 실제 작은 화면 배치는 사용자 에뮬레이터 확인 대기다.

## Android 정답 모달 여백·키보드 가림 보정 (2026-10-22)

- 사용자 API 37 에뮬레이터 캡처에서 예문/입력칸 사이 여백과 키보드의 제출 버튼 가림을 확인했다. 모바일 모달 padding 24→16px, 문단 margin 8px, 글자 칸 위 margin 0·입력 영역 padding 4/8px로 조정하고 입력칸 높이는 최소 48px로 유지했다.
- `adapters/answerViewport.ts`에서 visualViewport의 실제 보이는 높이와 offset을 기준으로 모달 위치·최대 높이를 계산한다. 키보드 resize와 모달 내용 크기 변경에 재배치하고 긴 내용은 내부 스크롤한다. 닫힐 때 리스너·프레임·관찰자를 정리한다.
- 모바일 테스트 10개(뷰포트 계산 3개 포함)와 `build` 타입·61편/119장 콘텐츠 검사 통과. 큰 JS 청크 경고 유지. Android sync 후 새 모달의 에뮬레이터 키보드/오류 표시/회전 검증은 사용자 확인 대기다. 네이티브 플러그인·원격 배포 변경 없음.

## Android UI·UX 토스 흐름 대응 (2026-10-22)

- 사용자 에뮬레이터 화면에서 기존 모바일 앱 홈·하단 메뉴 실행을 확인했다(API 37). Android Studio의 JVM 25/Gradle 8.11.1 호환 안내 후 JVM 21 사용을 안내했다. 과거 Java 부재는 초기 CLI 상태이며 IDE 실행 성공과 구분한다.
- 요청에 따라 모바일 전용 홈에 WORDS 그림·환영 문구·나란한 진입 버튼·flex 중앙 정렬을 적용했다. Ionicons 하단 5개 메뉴·상단 학습 개수·난이도/크기 버튼을 제공하고 퀴즈 힌트와 단어장 목록만 내부 스크롤하도록 조정했다. 가로 화면은 보드 왼쪽·힌트 오른쪽이다.
- `AnswerEntry.tsx`에 글자별 입력, 완성 교차 글자 보호, 포커스 이동, 예문 마스킹·보라색 동의어, 정답 자동/수동 제출을 구현했다. 입력 창별 글자 수 한도의 오답 붉은 표시와 소진 후 입력 허용을 `letterFeedback.ts`·테스트로 검사했다. 모바일 UI는 앱이 소유하며 다른 앱 소스를 import하지 않는다.
- 모바일 테스트 7개, `build`(타입·61편/119장 승인/해시 검사 포함), `exec cap sync android` 통과. 큰 JS 청크 경고 유지. `git diff --check` 확인. 새 UI의 실제 키보드·스크롤·레이아웃·자동 제출 검증은 사용자 에뮬레이터 확인 대기다.
- 모바일 서버 힌트/광고·네이티브 저장/뒤로가기와 단어장 학습완료 필터/오답노트 등 미대응 기능은 남아 있다. 토스와 모든 기능이 같아졌다고 보지 않는다. 원격 배포·커밋·푸시는 하지 않았다.

## Android 모바일 그림책 연결 (2026-10-22)

- 모바일 전용 `components/PictureBooks.tsx`를 추가하고 하단 `그림책` 메뉴를 연결했다. 초·중·고급 61편, 이전/다음/목록, 페이지별 해석·이미지 재시도·스크린리더 원문·AI 창작 안내·목록 위치 및 탭 간 읽기 상태 유지를 구현했다.
- `prepare-mobile-picture-books.py`로 공통 승인 원본에서 모바일 전용 WebP 119장·manifest를 생성했다. `check-mobile-picture-books.mjs`는 원본 승인/본문·이미지 해시와 모바일 이미지 대응을 검사해 전용 JSON을 만든다. 앱 간 UI·데이터·이미지를 import/복사하지 않는다. 원본·영문·해석·승인 상태는 변경하지 않았다.
- `build`에 Node 콘텐츠 검사를 연결했다. Vite 타입 선언 누락을 수정한 뒤 모바일 `build`(타입·61편/119장 검사 포함), 저장 테스트 5개, dist 이미지 119장 해시 대조, `exec cap sync android` 통과. 이미지 합계 29,369,890바이트, 기존 JS 큰 청크 경고 유지.
- 이미지 변환은 기존 승인 원본의 배포용 파생 작업이며 새 시각 검수·Android 가독성·오프라인/키보드·페이지 조작 검증은 미실행이다. APK·기기 검증은 사용자 Android Studio 환경 준비 후 진행한다. 서버 힌트·광고·네이티브 저장/뒤로가기·세부 입력 UX는 남아 있다. 배포·커밋·푸시는 실행하지 않았다.

## Android 모바일 홈·퀴즈·단어장 1차 (2026-10-22)

- `apps/mobile/src/pages/HomePage.tsx`·`mobile.css`에 Ionic 기반 홈·퀴즈·단어장·설정과 하단 메뉴를 구현했다. 모바일 전용 UI이며 웹·토스 소스를 import하지 않는다.
- `adapters/puzzle.worker.ts`에서 공통 core 엔진으로 초·중·고급, 8/10/12 출제와 학습완료 제외를 연결했다. 보드·가로/세로 힌트·단어 정답 제출·완료 표시, Worker 취소 정리·오류·30초 시간 제한을 처리한다.
- `adapters/progress.ts`는 모바일 WebView localStorage 전용 namespace로 완료·즐겨찾기를 저장한다. 손상/접근 오류 시 기록을 덮어쓰지 않으며 쓰기 실패 시 UI 성공 상태로 진행하지 않는다. 단어장 검색·즐겨찾기 필터·100개씩 더 보기를 제공한다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/mobile test` 저장 회귀 5개, `typecheck`, `build`, `exec cap sync android`, `git diff --check`. 큰 JS 청크 경고 유지. Node 24 테스트 실행 조건을 모바일 engines에 명시했다. 새 의존성·lockfile 변경은 없다.
- Java/기본 Android SDK는 여전히 확인하지 못해 APK 빌드·기기/UI 조작 검증은 진행하지 못했다. 그림책·서버 힌트·광고, 네이티브 저장 보강·하드웨어 뒤로가기, 글자별 입력 등 기존 플랫폼 세부 대응은 미완료다. 원격 배포·커밋·푸시는 하지 않았다.

## 타 프로젝트 진행 기록 방식 구체화 (2026-10-22)

- `docs/AGENTS.template.md`에 루트 `progress.md` 필수 생성·유지와 현재 프로젝트처럼 최신 날짜별 작업 기록·Phase별 체크리스트를 병행하는 방식을 명시했다.
- 변경 파일·실제 검증 명령/결과·사용자 기기 확인·승인과 배포 결과·미검증·후속 확인의 기록 기준 및 초기 형식 예시를 추가했다. 기존 이력을 보존하고 과거 대기 상태와 최신 결과를 구분하도록 했다.
- 문서만 변경했다. `git diff --check` 확인. 빌드·테스트·배포·커밋·푸시는 실행하지 않는다.

## 타 프로젝트용 AGENTS 템플릿 (2026-10-22)

- `docs/AGENTS.template.md`에 pnpm workspace·TypeScript·독립 React 앱, Web/PWA, Ionic React/Capacitor Android/iOS, Toss/TDS와 서버·인증·광고·검증·승인 기준을 재사용 템플릿으로 정리했다.
- 대상 저장소의 루트 `AGENTS.md`로 복사/병합하는 방법, 프로젝트 정보·실제 scripts·문서 경로 placeholder를 포함했다. 특정 버전·앱 ID·서비스 고유 규칙을 필수 기준으로 복제하지 않는다.
- 문서만 변경. 내용·placeholder·`git diff --check` 확인하며 코드 빌드·배포·커밋·푸시는 실행하지 않는다.

## 토스 배포 경험 외부 전달 문서 (2026-10-22)

- `docs/toss-miniapp-deployment-lessons.md`를 새로 작성했다. 테스트/출시 CORS·mTLS 매핑, 광고 ID 반려·생성 제한, SDK/React 분리, 화면·키보드·스크롤, 무료 서버·멱등성, 출시 절차와 연결표를 다른 프로젝트가 재사용할 수 있게 정리했다.
- 앱별 실제 광고 ID·서버 주소·개인 경로·비밀 정보 대신 예시를 사용했다. 과거 시행 기록·현재 해결 상태·미검증 범위를 구분했으며 공개 앱 잔액 재확인은 대기로 유지한다.
- 문서만 변경했다. 내용·참조 경로와 `git diff --check`를 검사하며 빌드·테스트·배포·외부 전송·커밋·푸시는 실행하지 않는다.

## 토스 공개 출시 잔액 Load failed 조사 (2026-10-22)

후속 적용 완료: 사용자 명시 승인 후 기존 `TOSS_ALLOWED_ORIGINS` 다이제스트가 테스트 Origin 2개의 조합과 일치함을 확인하고 두 주소를 보존하면서 `https://english-words.apps.tossmini.com`만 추가했다. `toss-hints`를 `--use-api`로 재배포해 CLI 성공을 확인했다. 배포 후 출시·기존 테스트 Origin 2개 OPTIONS 모두 204·정확한 허용 헤더, 임의 Origin 403, 출시 Origin 무인증 balance 401을 확인했다. 인증서·키·DB·잔액은 변경하지 않았다. 실제 공개 앱에서 유효 코드 인증·잔액 조회 재확인은 사용자 확인 대기다. 아래 미배포 기록은 적용 전 상태다.

- 사용자 공유 링크 `https://tossminiapp.com/s/9Rpp71Q3`의 리디렉션에서 `english-words` 출시 연결을 확인했다. 공식 FAQ의 SDK 3.1+ Origin 규칙은 실제 서비스 `https://<appName>.apps.tossmini.com`, 콘솔 테스트 `https://<appName>.private-apps.tossmini.com`이다: https://developers-apps-in-toss.toss.im/guide/faq.md .
- 데이터 변경 없는 원격 OPTIONS로 신규 앱 테스트 Origin 204와 출시 Origin `https://english-words.apps.tossmini.com` 403·허용 헤더 없음 확인. 인증서 선택도 테스트 Origin만 지원하므로 공개 출시 요청 처리에 두 누락이 있다.
- `tossAppCredentials.ts`에 출시 Origin의 신규 앱 인증서·동일 identityPrefix 선택을 추가했다. 해당 회귀·미허용 Origin 및 핸들러 테스트 총 26개, `build:edge` 타입 검사·번들 생성 통과. 실제 운영 설정 변경·재배포·공개 앱 재검증은 아직 하지 않았다.
- 적용 예정: 기존 Origin을 보존하며 서버 `TOSS_ALLOWED_ORIGINS`에 정확한 출시 Origin 1개 추가 후 `toss-hints` 재배포. 운영 변경은 사용자 명시 승인 후 진행한다. 앱 번들·인증서·DB·잔액 변경은 필요하지 않다.

## 토스 메뉴·배너 간격 축소 (2026-10-22)

- 사용자 요청으로 `apps/toss/src/styles.css`의 메뉴 아래 padding과 배너 위 padding을 각각 4px로 조정했다. 외부 여백 합계 28→8px(경계선 제외). 배너 높이·Safe Area는 유지했다.
- `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·119장 대응·번들 크기·테스트 광고 검사 포함) 통과. 큰 JS 청크 경고 유지. CSS 여백 변경으로 기능 테스트는 반복하지 않았다. 실제 토스 배치·오터치 검증 및 업로드는 미실행이다.

## 토스 홈 세로 중앙 정렬 (2026-10-22)

- 홈 제목 아래의 퍼즐 그림·환영 문구·설명·버튼을 별도 묶음으로 만들고 flex와 위아래 자동 여백으로 남은 콘텐츠 공간의 세로 중앙에 배치했다. 상단 영역·하단 메뉴·배너·Safe Area를 제외한 앱 공간에 맞추며 높이가 부족하면 홈 본문을 스크롤한다.
- 변경: `apps/toss/src/App.tsx`, `apps/toss/src/styles.css`. 운영 배너 ID와 앱 버전 1.0.1 유지. 토스 테스트 75개·`build:ait`(타입 검사·이미지·테스트 광고 검사 포함)·`git diff --check` 통과. 큰 JS 청크 경고 유지.
- 새 `english-words.ait` deploymentId `01a16239-f390-7e10-83e2-8e03df6b9894`. 실제 스마트폰 길이별 배치·짧은 화면 스크롤 확인은 미실행이며 사용자 확인이 필요하다. 업로드는 실행하지 않았다.

## 토스 운영 배너 ID 적용 (2026-10-22)

- 사용자 제공 `ait.v2.live.acf9c47ad0fc4a0f`를 `apps/toss/.env.production`에 반영하고 앱 정보 1.0.1의 새 `english-words.ait`를 생성했다. 보상형 광고는 제외 상태를 유지한다.
- `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·119장 이미지·100MB 제한·테스트 광고 검사), `pnpm.cmd --filter @t-crossword/toss exec vitest run tests/ads.test.tsx` 3개 통과. 프로덕션 JS의 실제 배너 ID 포함도 별도 검사했다. 큰 JS 청크 경고 유지.
- deploymentId `01a16236-ac29-7aed-9a26-3601bfb6784f`. 실제 토스 배너 노출·작은 화면 가독성은 미검증이며 사용자가 업로드 후 확인한다. 업로드·재검토·서버 배포는 실행하지 않았다.

## Android 하이브리드 기반 시작 (2026-10-22)

- 기존 Ionic/React 19 모바일 앱에 core/CLI와 같은 `@capacitor/android` 7.6.9(MIT)를 추가하고 Android 네이티브 프로젝트를 생성했다. 앱 ID `com.tcrossword.app` 유지, 표시 이름 `영어 낱말`. 웹·토스 UI나 React 버전은 변경하지 않았다.
- Ionic 호환 `react-router` 5.3.4를 명시하고 잠금 파일은 Android 패키지·모바일 직접 의존성 15줄 추가로 한정했다. 다른 importer의 해석을 보존했다. 의존성 전체 재설치는 수행하지 않았다.
- `sync:android`(타입 검사·프로덕션 빌드·Capacitor 동기화), `pnpm.cmd install --lockfile-only --frozen-lockfile --offline --ignore-scripts` 통과. 큰 청크 경고 유지. 전체 install 검증은 모듈 재구성 요구로 중단해 성공으로 보지 않는다.
- `apps/mobile/android`에서 `gradlew.bat assembleDebug`는 Java/JAVA_HOME 부재로 실패했다. 기본 Android SDK·Studio 경로도 확인하지 못했다. APK·실제 기기 검증은 미완료다.
- 현재 모바일 화면은 준비 화면이며 기능 이식은 후속 작업이다. 환경 구성과 실행 명령·검증 경계는 `apps/mobile/README.md`에 기록했다. 서명·배포·커밋·푸시·iOS 생성은 하지 않았다.

## 토스 출시 반려 대응 (2026-10-22)

- 사용자 제공 반려 사유인 테스트 광고 그룹 ID 포함을 수정했다. 보상형 광고 진입·화면과 앱의 테스트 보상 API 호출을 제거하고 잔액은 읽기 전용으로 표시한다. 판 완성 보상 +5는 유지한다. 신규 리워드 그룹 생성은 콘솔에서 제한 중이다.
- 앱 정보 버전을 0.0.0 → 1.0.1로 갱신했다. 배너는 `VITE_TOSS_BANNER_AD_GROUP_ID` 설정 시 사용하며 미설정·테스트 ID는 표시하지 않는다. 현재 운영 배너 ID 발급 대기이므로 새 번들은 광고 없음 상태다.
- `build:ait`에 dist 테스트 광고 ID·보상 경로 검사를 추가했다. `pnpm.cmd --filter @t-crossword/toss test` 75개, `lint`, `build:ait`(타입 검사·119장 대응·100MB 제한·테스트 광고 검사 포함) 통과. 기존 큰 JS 청크 경고 유지.
- 산출물 `apps/toss/english-words.ait`, deploymentId `01a1612f-7acd-7dd4-9ca5-d6b9bfd97508`. 실제 기기에서 이번 수정본 확인·업로드·재검토 요청은 미실행이며 사용자가 진행한다. 서버·DB 변경이나 배포는 하지 않았다. 상세: `docs/toss-ads.md`.

## 그림책 상세 바깥 페이지 스크롤 방지 (2026-10-21)

- 사용자 상세 화면에서 앱 헤더가 사라지고 메뉴·광고가 위로 이동한 캡처에 따라 바깥 document 스크롤/스크롤 전달 가능성을 보정했다. `styles.css`의 html/body/#root 높이를 100%로 제한하고 overflow:hidden, html/body overscroll-behavior:none을 적용했다. 앱 셸은 dvh 대신 부모 높이 100%를 따른다.
- 읽기 main.scroll-page의 내부 스크롤은 유지하고 overscroll-behavior-y:contain으로 끝에서 바깥으로 전달되지 않도록 했다. 하단 메뉴·광고는 기존 flex 고정 영역을 유지한다. 본문과 해석의 스크롤·접근성을 막는 touchmove 차단은 추가하지 않았다.
- `pnpm.cmd --filter @t-crossword/toss build:ait`(타입·61편/119장·크기 검사) 및 `git diff --check` 통과. CSS 스크롤 경계 변경으로 기존 기능 테스트는 반복하지 않았다. 실제 iOS 상세 읽기 끝·해석 확장·메뉴/광고 위치·키보드 재진입 검증은 사용자 확인 대기다. 최신 번들 생성, 업로드 미실행.

## 그림책 작품 리스트만 스크롤 (2026-10-21)

- 사용자 요청으로 그림책 목록은 제목·설명·난이도·AI 안내를 고정하고 `book-list-scroll` 안의 작품 목록만 스크롤하도록 변경했다. 읽기 화면은 기존 main 스크롤을 유지한다. App.tsx·PictureBooks.tsx·styles.css를 변경했다.
- 작품 선택 전 내부 리스트 위치를 보관하고 목록 복귀·기기 뒤로에서 복원하며 난이도 변경 시 초기화한다. 현재 보이는 상단 3개 이미지 준비도 새 스크롤 컨테이너의 경계·이벤트를 사용하도록 갱신했다.
- 기존 읽기 스크롤 회귀 테스트의 main 위치 기대값을 새 리스트 위치로 바꾼 뒤 `pnpm.cmd --filter @t-crossword/toss test` 75개 통과(초·중·고급 목록 복원·읽기 페이지 이동 포함). `lint`·`build:ait`(타입·콘텐츠·크기 검사 포함), `git diff --check` 통과. 실제 기기 목록 고정·스크롤·가독성은 사용자 확인 대기다.
- 최신 `apps/toss/english-words.ait` 생성. 업로드는 사용자가 직접 수행하며 실행하지 않았다.

## iPhone 입력 시 정답 모달 흔들림 보정 (2026-10-21)

- 사용자 iPhone 15 Pro Max에서 키 입력마다 모달이 위아래로 흔들린다는 보고에 따라 기존 viewport.scroll/focusin→offsetTop 재배치·내부 스크롤 보정을 제거했다. 해당 조합이 iOS 포커스 이동과 피드백을 일으킬 가능성을 수정한 것이며 기기 원인 확정은 아니다.
- `Modal.tsx`는 키보드가 열릴 때 상단 기준을 한 번 정하고 열린 동안 유지한다. viewport resize에서는 최대 높이만 갱신하고 키보드가 닫히면 중앙 배치를 복원한다. `AnswerModal.tsx`는 초기·다음 칸·백스페이스 포커스에 preventScroll을 적용한다. 긴 모달 내부 수동 스크롤은 유지한다.
- 회귀 검사에서 viewport offsetTop 변경·scroll·focusin에 위치 유지, 높이 변경 시 상단 유지·높이 갱신, 키보드 닫힘 복원을 확인했다. 토스 test 75개·lint·build:ait(타입·콘텐츠·크기 포함), `git diff --check` 통과. 실제 iOS 입력·삭제·힌트·키보드 재열기 검증은 사용자 확인 대기다.
- 최신 `apps/toss/english-words.ait` 생성. 단어장 전용 스크롤·간격과 앞선 홈·모달 축소도 포함한다. 사용자 직접 업로드 원칙에 따라 업로드하지 않았다.

## 토스 단어장 목록 전용 스크롤·간격 축소 (2026-10-21)

- 사용자 요청으로 토스 단어장 제목·개수·분류·검색창을 고정하고 `word-list-scroll` 내부 단어/빈 목록/더 보기만 스크롤하도록 App.tsx·styles.css를 변경했다. flex의 min-height:0으로 본문 가용 높이를 따르며 하단 메뉴·광고와 분리한다. 키보드 접근 가능한 이름 있는 목록 영역을 제공한다.
- 단어 카드 상하 padding 20→12px, 단어 제목 아래 6→4px, 뜻·동의어·예문 위 8→4px와 줄 높이 1.6→1.45로 축소했다. 제목 위아래·필터 아래 간격도 줄였다. 글자 크기·즐겨찾기 버튼 크기와 데이터/오답노트 정책은 유지한다.
- `pnpm.cmd --filter @t-crossword/toss test` 75개·`lint`·`build:ait`(타입·61편/119장·크기 검사), `git diff --check` 통과. 검색·필터·더 보기 관련 기존 회귀 테스트 포함. 실제 iOS 키보드·가로 화면·목록 스크롤 고정의 시각 검증은 미실행이다.
- 최신 `apps/toss/english-words.ait` 생성 완료. 사용자 직접 업로드 원칙에 따라 업로드하지 않았다. 앞선 홈 간격·정답 모달 간격 수정도 포함된다.

## 토스 업로드 담당 변경 (2026-10-21)

- 사용자 결정: 앞으로 토스 번들은 사용자가 직접 업로드한다. 에이전트는 코드 수정·관련 검사·번들 생성 후 파일 경로와 검증 결과를 안내한다. 기존 자동 업로드 승인을 이후 버전에 재사용하지 않으며 별도 명시적 업로드 요청이 있을 때만 실행한다. `AGENTS.md`에 반영했다.
- 문서만 변경했다. `git diff --check` 통과. 추가 빌드·업로드·커밋·푸시는 실행하지 않았다.

## 정답 모달 줄 간격·높이 축소 (2026-10-21)

- 사용자 요청에 따라 `apps/toss/src/styles.css`의 정답 모달 전용 여백을 축소했다. 상하 padding 24→16px, 제목 아래 20→8px, 동의어 위 12→4px, 예문 위 16→8px, 폼 위 20→10px, 입력칸 위 16→0px·아래 12→8px, 안내 아래 12→8px로 조정했다. 문단 줄 높이도 1.4~1.45로 낮췄다.
- 글자 크기·48px 입력칸·힌트/정답 버튼 크기는 유지하며 닫기 버튼을 위한 제목 행 높이는 32px 확보한다. 다른 모달의 공통 간격은 변경하지 않았다.
- `pnpm.cmd --filter @t-crossword/toss build:ait` 통과(타입·61편/119장·크기 검사 포함), `git diff --check` 통과. CSS 간격 변경으로 기존 기능 테스트는 반복하지 않았다. 홈 간격 보정과 함께 최신 번들에 포함됐으며 업로드·실제 iOS 키보드 시각 검증은 미실행이다.

## iPhone 15 Pro Max 홈 버튼 위치 보정 (2026-10-21)

- 사용자가 보고한 iPhone 15 Pro Max 홈 캡처에서 상단 큰 여백 해소·잔액 10개 표시를 확인했다. 홈 본문의 버튼 하단은 스크롤 영역 끝에서 잘려 보여 초기 화면의 조작 접근성을 보정했다.
- `styles.css`에서 그림 상하 여백 24→12px, 설명 위 16→10px, 버튼 위 20→12px로 줄여 두 버튼 위치를 총 38px 올렸다. 그림 160px·본문 글자 크기·하단 메뉴·광고 높이는 유지한다. 더 작은 화면의 스크롤은 허용한다.
- `pnpm.cmd --filter @t-crossword/toss build:ait`(타입·61편/119장·크기 검사) 통과. CSS 간격 변경으로 기능 테스트는 반복하지 않았다. `git diff --check` 통과. 실제 해당 기기 수정본 검증·업로드 미실행.

## 그림책 로딩·키보드 보정 테스트 업로드 (2026-10-21)

- 사용자 승인으로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./english-words.ait --memo "그림책 보이는 상단 3개 첫 장 준비 및 키보드 입력 모달 보정"` 성공(exit 0). 30,451,346바이트, deploymentId `01a15ce4-a6db-71d4-abca-8c4f22ec7bdd`.
- 테스트 주소: `intoss-private://english-words?_deploymentId=01a15ce4-a6db-71d4-abca-8c4f22ec7bdd&host=appsInTossHost`. 현재 보이는 상단 3개 작품 첫 장 준비와 visualViewport 모달 보정을 포함한다.
- 사전 통과한 동일 코드의 테스트 75개·lint·build:ait는 반복하지 않았다. 실제 토스 첫 장 로딩 속도·스크롤 후 준비 효과·iOS 키보드 가림은 사용자 확인 대기. 공개 검토 요청·출시·서버/DB 변경·커밋·푸시 없음.

## 그림책 현재 보이는 상단 3개 준비 (2026-10-21)

- 사용자 요청으로 난이도 목록의 고정 첫 두 작품 대신 현재 스크롤 영역과 화면에 실제 겹치는 작품 중 상단 3개의 첫 장을 준비하도록 변경했다. 일부만 보이는 행도 포함한다. 스크롤·리사이즈가 멈춘 뒤 100ms에 다시 계산하며 준비 참조는 최대 3장이다. 터치·포커스 시 해당 작품 준비도 유지한다.
- `PictureBooks.tsx`에서 스크롤 컨테이너·visual viewport 경계를 교차해 행을 선정한다. 캐시 적중 시 최근 사용 순서를 갱신해 겹치는 작품을 불필요하게 다시 준비하지 않는다. 타이머와 이벤트는 화면 전환 시 정리한다.
- 회귀 테스트에서 앞의 화면 밖 작품 제외·현재 상단 3개·스크롤 후 새 3개·최대 참조와 선택 동작을 확인했다. `pnpm.cmd --filter @t-crossword/toss test` 75개·`lint`·`build:ait` 및 `git diff --check` 통과. 이미지 품질·파일 변경 없음, 실제 토스 체감 속도 검증과 업로드 미실행.

## 그림책 목록 → 첫 장 로딩 준비 개선 (2026-10-21)

- 사용자는 목록에서 작품을 처음 클릭할 때 이미지 지연을 보고했다. `PictureBooks.tsx`에서 목록 표시 150ms 후 현재 난이도 앞 두 작품의 첫 장만 저우선순위로 로딩·decode한다. 버튼 pointerdown·focus·click에서도 해당 작품을 준비하며 선택은 decode 완료를 기다리지 않는다.
- 준비 이미지 참조는 최대 3장만 유지하고 화면 해제 시 정리한다. 모든 그림책을 일괄 로딩하지 않는다. 실제 표시 이미지는 eager·high 우선순위로 요청하고 기존 다음 페이지 준비·실패/재시도는 유지한다. 이미지 파일·해상도·품질·승인 해시는 변경하지 않았다. 웹/PWA에는 적용하지 않았다.
- `pictureBookPreviews.test.tsx`에서 앞 두 장만 준비·추가 작품 터치·클릭 중복 없음·화면 해제 정리를 확인했다. 토스 테스트 75개, lint, build:ait(타입·61편/119장·크기 검사) 및 diff 검사 통과. React 18의 fetchPriority 경고는 소문자 HTML 속성 전달로 수정 후 테스트 재통과했다.
- 최신 로컬 번들은 키보드 모달 보정도 포함한다. 실제 토스 첫 장 로딩 시간·메모리·키보드 검증과 업로드는 미실행이다. 초기 미리 준비는 상단 두 작품에 우선 효과가 있으며 다른 작품의 즉시 탭이나 디코딩 지연을 없앤다고 보장하지 않는다.

## 키보드 표시 시 입력 모달 가림 보정 (2026-10-21)

- 사용자 실제 토스 화면에서 상단 여백 축소와 퀴즈 진입은 확인했으나, iOS 키보드·입력 보조 바가 정답 칸과 모달 하단을 가린다.
- `Modal.tsx`에서 visualViewport가 레이아웃 높이보다 100px 이상 작아지면 보이는 영역 상단+8px에 고정하고 높이를 제한한다. viewport resize/scroll·입력 포커스에 반응하고 활성 입력이 가려지면 모달 내부를 스크롤한다. 키보드가 닫히면 기본 중앙 배치로 복귀하고 이벤트·예약 프레임을 해제한다.
- `AnswerModal.tsx` 입력에 lang=en·enterKeyHint=done을 추가했다. OS 키보드를 강제로 영어로 전환하는 보장은 없으며 한국어 입력 거부 안내는 유지한다.
- 회귀 검사에서 viewport 축소·재축소·복구를 확인했다. 토스 `test` 74개·`lint`·`build:ait`(타입·61편/119장·크기 검사 포함) 통과. 최초 회귀 검사는 jsdom inset 축약 속성의 top 미전개로 실패했고 inset 자체 검증으로 수정 후 통과했다. 실제 iOS 키보드·보조 바·자동 스크롤과 화면별 시각 검증은 미완료다. 수정 번들 생성, 업로드 미실행.

## 로컬 검토 후 토스 테스트 업로드 (2026-10-21)

- 사용자 `토스에 올려줘` 승인으로 최신 `english-words.ait`를 `ait deploy` 업로드했다. exit 0, 30,450,393바이트, deploymentId `01a15cd8-1912-7719-8847-ef2f6fd98c2a`.
- 테스트 주소: `intoss-private://english-words?_deploymentId=01a15cd8-1912-7719-8847-ef2f6fd98c2a&host=appsInTossHost`. 비게임 상단 Safe Area 재적용 제거본이며 개발 전용 미리보기 gateway·CSS가 프로덕션에 포함되지 않음을 사전 검색 확인했다.
- 동일 코드의 기존 build:ait·lint·73개 테스트·로컬 홈 시각 검사를 반복하지 않았다. 실제 토스 상단 겹침·여백·각 화면 가독성은 사용자 확인 대기. 공개 검토 요청·출시·서버/DB 변경·커밋·푸시 없음.

## 업로드 전 로컬 화면 검토 (2026-10-21)

- 사용자 요청에 따라 추가 업로드를 보류한다. 32px 축소 이후에도 여백이 넓다는 보고로 상단 `--toss-safe-area-top`의 재적용을 제거하고 브라우저 env 상단 안전 영역만 유지했다. 비게임 호스트 영역의 중복 가능성을 수정한 것이며 실제 토스 겹침·여백 최종 확인은 대기다.
- 사용자 로컬 화면의 Failed to fetch는 개발 도구의 mock 인증 코드를 실제 서버로 보내는 경로였다. 개발 진입점에만 로컬 preview gateway를 주입해 서버 요청 없이 잔액 10개·공통 엔진 퍼즐·화면 이동을 확인하도록 했다. roundId는 null이며 서버 힌트·보상 검증은 지원하지 않는다. 프로덕션은 기존 원격 gateway를 사용한다.
- 개발 도구 초기값을 iPhone 17 Pro 프레임·partner 상단 바·영어 낱말로 지정했다. 기존 브라우저 세션 설정은 초기값을 덮을 수 있어 AIT 패널에서 확인한다.
- 토스 `build:ait`(타입·콘텐츠·크기 포함), lint, 테스트 73개, `git diff --check` 통과. production JS에서 preview 함수·안내 문구 검색 결과 없음. 실제 토스 업로드·기기 검증은 보류한다.
- 로컬 headless Chrome 캡처에서 시뮬레이터 body 높이와 데스크톱 dvh 불일치로 하단 메뉴가 프레임 밖으로 나가는 것을 발견했다. 개발 전용 `preview.css`와 body 높이 동기화로 기본 세로 partner 프레임을 보정했다. 후속 `tmp/toss-local-layout2.png`를 열어 상단 바/앱 헤더 겹침 없음·잔액 10·하단 메뉴와 배너의 프레임 내 배치를 확인했다. 이 캡처는 기본 iPhone 17 Pro 모의 홈 화면이며 모든 기기·가로 화면·실제 토스 검증을 뜻하지 않는다. 변경 후 build:ait·lint 재통과. 프리뷰 설정은 배포에 포함하지 않는다.

## 신규 앱 상단 여백 수정본 테스트 업로드 (2026-10-21)

- 사용자 `자동으로 업로드 해줘` 승인으로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./english-words.ait --memo "비게임 영어 낱말 상단 여백 32px 축소"` 실행. 최초 제한 환경 fetch 실패 후 네트워크 권한 승인으로 재시도해 exit 0 성공했다.
- 새 앱 `english-words`에 30,450,386바이트 업로드 완료. deploymentId `01a15cd0-7bc7-79bb-bf82-4968aa3f6734`. 테스트 주소: `intoss-private://english-words?_deploymentId=01a15cd0-7bc7-79bb-bf82-4968aa3f6734&host=appsInTossHost`.
- 기존 통과한 동일 번들 검사는 반복하지 않았다. 수정본 실기기 상단 여백·가독성은 사용자 확인 대기. 공개 검토 요청·출시·서버/DB 변경·커밋·푸시는 하지 않았다.

## 신규 앱 상단 여백 축소 (2026-10-21)

- 사용자 기기 화면에서 잔액 10개 표시와 인증 오류 해소를 확인했다. 퀴즈·차감·보상 전체 검증을 뜻하지 않는다.
- `apps/toss/src/styles.css`의 앱 헤더 상단 padding을 44px→12px로 축소했다. Safe Area는 유지하고 전 화면 콘텐츠의 시작을 32px 위로 조정했다. 실제 기기 상단 여백·겹침은 수정 번들에서 재확인해야 한다.
- `pnpm.cmd --filter @t-crossword/toss build:ait` 통과(타입 검사·61편/119장·크기 검사 포함), `english-words.ait` 재생성. 기존 큰 JS 청크 경고 유지. CSS 변경으로 기존 기능 테스트는 반복하지 않았다. `git diff --check` 통과. 업로드·출시·커밋·푸시 미실행.

## 새 앱 mTLS 등록·서버 적용 (2026-10-21)

- 사용자 승인으로 `englishwords2026_public.crt`·`englishwords2026_private.key`를 새 앱 전용 Secrets 두 항목에 등록했다. 파일 본문은 출력하지 않았고 전달용 임시 파일은 finally에서 제거했다. 원본 파일·기존 앱 Secrets는 보존했다.
- `tossAppCredentials.ts`에서 정확한 테스트 Origin별 인증서를 선택하며 알 수 없는/없는 Origin은 거부한다. Origin은 인증서 선택에만 쓰고 실제 코드는 토스 mTLS로 검증한다. 신규 identity에 `english-words:`를 붙여 기존 앱 사용자 기록과 구분한다. 기존 identity 계산은 유지했다. 출시 Origin은 아직 등록·선택 대상이 아니므로 공개 출시 전 별도 확인이 필요하다.
- `pnpm.cmd --filter @t-crossword/toss-api build:edge` 통과. API 테스트는 exchangeCode Origin 전달에 맞춰 기존 기대값을 수정한 후 `pnpm.cmd --filter @t-crossword/toss-api test` 59개 통과·프로파일 1개 건너뜀. `git diff --check` 통과.
- 승인된 `supabase functions deploy toss-hints --project-ref zduyaejdjwfhsiazcmrn --use-api` 성공. 배포 후 두 앱 OPTIONS 204·임의 Origin 403·신규 Origin 무인증 balance 401·가짜 session 코드 401 확인. 실제 코드 교환과 잔액 조회는 기기 재시도 대기다. DB 변경·앱 번들 변경·업로드·커밋·푸시 없음.

## 토스 등록·인증서 이름 찾기 (2026-10-21)

- 후속 사용자 탐색기 화면: `D:\Download\mTLS_인증서_20261021`에 `englishwords2026_private.key`와 인증서 표시 이름 `englishwords2026_public`을 확인했다. 인증서 확장자는 미확인이다. 관리 문서에 경로·파일명만 기록했으며 파일 내용 조회·서버 등록은 하지 않았다.

- 관리 정보는 `docs/toss-app-registration.md`에서 확인한다. 신규 앱 `영어 낱말` / `english-words`, 인증서 관리 이름은 `englishwords2026`으로 안내했다. 실제 발급 완료·파일 보관 폴더·새 서버 인증 연결은 확인 대기다. 비밀 원문은 기록하지 않았다.

## 신규 앱 CORS 허용 적용 (2026-10-21)

- 새 앱 실기기 화면의 잔액 `Load failed`에 대해 OPTIONS 비교로 기존 테스트 Origin 204·신규 Origin 403을 확인했다.
- 사용자 승인으로 Supabase `TOSS_ALLOWED_ORIGINS`에 `https://english-words.private-apps.tossmini.com`을 추가했다. 기존 값은 CLI 해시와 주소 문자열의 SHA-256 일치로 확인하고 `https://t-crossword.private-apps.tossmini.com`을 보존했다. 키·인증서 원문 조회·교체, 함수 코드 배포·DB 변경은 하지 않았다.
- 변경 후 원격 검사: 기존·신규 Origin OPTIONS 204 및 정확한 Allow-Origin, 임의 Origin 403, 새 Origin의 무인증 balance POST 401 확인. 지갑·세션 생성 요청은 하지 않았다. 새 앱 실제 인증·잔액 조회는 사용자 재시도 대기이며 CORS 성공만으로 mTLS 호환을 확정하지 않는다.

## 비게임 신규 앱 테스트 번들 생성 (2026-10-21)

- 사용자 최종 결정은 기존 게임 앱 유지 + 별도 신규 앱 등록이다. 새 앱 `영어 낱말` / `english-words` / 비게임, `생활 → 교육 → 교육` 선택을 사용자 화면으로 확인했다.
- 토스 config의 appName과 HTML·앱 화면 제목을 변경했다. 일반/다크 모드 로고 600×600 PNG와 제작 기록은 `apps/toss/assets/branding/`에 준비했다.
- Node v24.22.0 / pnpm 10.34.7에서 `pnpm.cmd --filter @t-crossword/toss build:ait` 통과(타입 검사, 승인 61편·119장, dist 크기 검사 포함). `english-words.ait` 30,450,388바이트 생성, CLI deploymentId `01a15cbd-b25a-7bfb-8072-2825e78698e1`은 로컬 빌드 출력이며 업로드 성공을 뜻하지 않는다. 큰 JS 청크 경고 유지.
- `pnpm.cmd --filter @t-crossword/toss test` 73개, `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 새 앱 로그인/mTLS·서버 허용 Origin·잔액/광고·실기기 검증은 미실행이다. 기존 서버 설정을 임의 변경하지 않았으며 DB 변경·업로드·출시·커밋·푸시는 실행하지 않았다.

## 토스 비게임·교육 신규 등록 준비 (2026-10-21)

- 사용자는 출시 전 게임 등록 삭제 후 비게임 → 교육 신규 등록을 결정했다. 콘솔 처리 완료·최종 appName은 확인 대기다.
- `docs/toss-nongame-transition.md`에 등록 문구·설정/Origin·로그인/mTLS·기록/잔액·광고 점검을 정리했다. README에 전환 상태를 추가하고 게임 등급 준비 문서는 과거 이력으로 표시했다.
- 공식 비게임 가이드의 재접속 기록·연결 해제 데이터 처리·스크롤 가능한 화면의 배너 기준은 추가 검토 대상이다.
- 문서만 변경하여 빌드·테스트는 생략했다. 설정·서버·DB 변경, 업로드·출시·커밋·푸시와 새 앱 실기기 검증은 미실행이다.

## 작업 마무리 정리 (2026-10-20)

- 토스 최신 테스트 업로드 `01a15795-4db6-7171-96ea-96f4164e43e6`의 `단어장 보기` 한 줄 표시는 사용자가 실제 기기에서 정상 확인했다. 전체 기능은 사용자 테스트 진행 중이며 공개 검토·출시는 하지 않았다. 광고는 테스트 ID 및 시청 증명 미검증 경계를 유지한다.
- PWA 화면 변경은 `26b6786`으로 origin/main에 푸시했다. 호스팅의 실제 배포 완료·설치 PWA·오프라인 업데이트·네이티브 WebView 확인은 미실행이다. 하이브리드 배포는 향후 계획이며 현재 UI 분리 구조를 유지했다.
- 사용자는 게임제작업 등록을 신청했고 제작품목에 `영어 퍼즐 게임`을 입력했다고 보고했다. 등록 완료·토스 사업자 승인·정산·등급분류 신청/발급은 미확인이다. 제작품목의 범위·보완 여부는 담당 기관 확인 항목으로 남겼다. 개인 사업자 서류·주소·서명은 저장소에 수집하지 않았다.
- 마무리 재검증: `pnpm.cmd typecheck` 전체 통과. `pnpm.cmd test`는 기존 utils 패키지의 테스트 파일 부재로 실패해 전체 성공으로 보고하지 않는다. `pnpm.cmd --filter @t-crossword/core --filter @t-crossword/toss --filter @t-crossword/toss-api test`는 코어 48개·토스 73개·API 55개 통과, API 프로파일 1개 건너뜀. `pnpm.cmd --filter @t-crossword/toss-api build:edge`, 진단·동시성 스크립트 테스트 7개, 그림책 승인 검사 테스트 5개, 중급·고급 콘텐츠 검증 통과. 초급 `validate.py`는 존재하지 않아 실행 실패했으며 실제 초급 검사 경로를 아래 후속 검증에 기록한다.
- 앞선 웹 lint·타입 검사 포함 build/PWA 생성·38개 테스트와 토스 lint·build:ait 성공 기록을 유지하며 동일 코드 검사는 반복하지 않았다. 원격 DB·서버 재배포·토스 업로드·공개 출시·추가 부하 시험은 마무리 작업에서 실행하지 않았다. 임시 미리보기·브라우저 프로필·진단 작업 파일이 있는 `tmp/`는 커밋에서 제외하고 보존한다.
- 후속 초급 검사: 실제 README 경로 `python content/beginner-poems/build-gallery.py`로 45편·본문 초급 어휘 536종 검사 통과, `python content/test-vocabulary-audit.py` 회귀 검사 3개 통과. 문서·대상 파일 diff 검사 후 현재 세션의 토스·공통 출제·그림책·관련 문서를 함께 커밋·푸시하는 범위이며 임시 파일은 제외한다.

## PWA 화면을 토스 개선 흐름에 맞춤 (2026-10-20, 미배포)

- 사용자 요청으로 웹 홈 버튼을 `퀴즈 시작`·`단어장 보기` 좌우 한 줄로 정리하고 상단 여백을 줄였다. 단어장 제목은 `나의 단어장`으로 맞추고 현재 검색·분류 결과 수를 제목 옆으로 이동했다. 퀴즈 보상 안내 옆에 전체 정답 진행·새 퍼즐을 배치했다.
- 그림책 설명을 제목 옆으로 이동하고 난이도 선택 앞 간격을 줄였다. 목록 복귀는 모든 상세 페이지의 하단 한 곳에서 제공하며, 페이지 전환은 작품 제목 위치로 이동하고 목록 복귀 시 목록 스크롤 위치를 복원한다.
- 향후 하이브리드를 고려해 웹 viewport-fit 및 상단·좌우 Safe Area를 적용했다. 기존 하단 안전 여백·퀴즈 힌트 영역 스크롤·가로 배치를 유지했다. 플랫폼 간 UI import·새 의존성·광고·Capacitor 통합은 추가하지 않았다. 모바일 UI 분리 구조 변경이나 네이티브 배포 완료를 뜻하지 않는다.
- `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web build`(타입 검사·PWA 생성 포함), 웹 디렉터리에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`(38개) 통과. 기존 큰 JS 청크 경고 유지. 실제 브라우저·설치 PWA·노치/가로 회전·키보드·스크롤 복원·Android/iOS WebView 검증은 미실행이며 배포하지 않았다.


## 홈 버튼 한 줄 문구 테스트 업로드 (2026-10-20)

- 사용자 요청으로 `build:ait`와 `ait deploy`를 실행해 업로드했다. deploymentId `01a15795-4db6-7171-96ea-96f4164e43e6`, 번들 30,450,387바이트. 그림책 61편·119장 및 dist 32,906,902바이트 검사 통과. 공개 검토 요청·출시는 하지 않았으며 실제 토스 기기에서 버튼 문구 확인은 대기 중이다.

## 홈 버튼 내부 문구 줄바꿈 재보정 (2026-10-20, 아래는 업로드 전 기록)

- 사용자 최신 기기 화면에서 `단어장 보기`가 여전히 두 줄임을 확인했다. 버튼 바깥의 nowrap만 적용했던 이전 보정으로 실제 기기 문제를 해결했다고 간주하지 않는다. `App.tsx`에서 아이콘·텍스트를 명시적인 한 줄 라벨로 묶고 `styles.css`에서 inline-flex·nowrap·텍스트 16px·아이콘 24px·축소 방지를 적용했다. 두 버튼에 같은 구조를 사용한다.
- 토스 `test` 73개·`lint`·`build`(타입 검사 포함)·diff 검사 통과. 기존 큰 JS 청크 경고 유지. 실제 토스 기기에서 한 줄 표시·글자 확대 시 가독성은 미검증이다. `.ait` 재생성·업로드는 하지 않았다.

## 도봉구 게임제작업 등록 문의 경로 확인 (2026-10-20)

- 사용자가 사업장 소재지를 서울 도봉구로 확인했다. 도봉구청 공식 게임업 변경 민원 검색 본문에서 문화체육과·02-2091-2257을 확인하고 신규 제작업 담당 연결·등록 대상/예외·사업장/서류·비용 문의 문구를 등급분류 준비 문서에 추가했다. 직접 페이지 열기는 도구 오류로 실패했으며 신규 민원 담당·신규 비용을 확정하지 않았다. 변경 수수료를 신규 수수료로 인용하지 않는다.
- 문서·경로와 diff 검사만 수행했다. 기관 연락·등록 신청·개인 서류 수집·실행 코드 변경·배포는 하지 않았다.

## 게임 등급분류 준비 초안 (2026-10-20)

- 사용자가 기존 개인사업자의 토스 사업자 등록 요청을 완료했고 화면상 검토 중임을 확인했다. 동일 게임의 타 스토어 출시 이력 없음, 게임물제작업/배급업 등록증 없음으로 답했다. 실제 사업자 승인·정산 등록 완료는 미확인이다.
- `docs/toss-game-rating-preparation.md`에 GRAC 직접 신청 준비 경로, 관할 시·군·구 제작업 등록 대상/예외 문의 문구·장비 명세 틀, 실제 구현에 근거한 게임물내용설명서 초안, 촬영 순서·실행물 접근 확인·제출 전 체크를 작성했다. 정부24·토스 공식 자료를 확인했으나 GRAC 본문은 도구로 읽지 못해 최신 양식·수수료·간소화 자격은 미확인으로 남겼다.
- 어휘 3,339개 표제어/그림책 영어 본문의 제한된 키워드 검사로 총기·음주·범죄·자살 등을 뜻하는 학습 단어와 일부 fight 표현을 검토 후보로 기록했다. 한글·이미지·전체 맥락의 등급 검토를 완료한 것이 아니며 신청 등급/내용정보는 미결정이다. 기존 콘텐츠 교정/권리 검토와 등급 심사를 구분한다.
- 문서 경로·내용·diff 검사만 수행했다. 실행 코드 변경이 없어 테스트/빌드는 반복하지 않았다. 기관 문의·민원/심의 접수·결제·서류 제출·추가 배포·커밋·푸시 없음. 다음은 사업장 소재 시·군·구 기준 담당 부서와 제작업 등록 요건 확인이다.

## 홈 160px 그림 테스트 업로드·개인사업자 콘솔 등록 준비 (2026-10-20)

- 사용자 배포 승인으로 홈 그림 160px·내부 칸 36px·좌우 버튼 한 줄 표시 보정본을 업로드했다. `build:ait`(타입 검사·61편/119장·dist 32,906,542바이트)·diff 검사 통과. CSS 변경으로 기존 테스트는 반복하지 않았다. 기존 큰 JS 청크 경고 유지.
- `ait deploy` 성공(exit 0), 번들 30,450,349바이트, deploymentId `01a15771-f3e4-7862-9e8a-156f272ecc35`. 주소: `intoss-private://t-crossword?_deploymentId=01a15771-f3e4-7862-9e8a-156f272ecc35&host=appsInTossHost`. 실제 기기 배치 확인 대기. 키 내용 조회·출력, 서버/DB 변경·공개 출시·커밋·푸시 없음.
- 사용자는 기존 개인사업자를 토스 콘솔에 등록하려는 상황이라고 확인했다. 공식 사업자 등록 안내에서 워크스페이스 `내 정보`, 대표자 직접 등록 시 사업자등록증 제출, 서비스와 업종 일치·면세사업자 등록 제한·검토 영업일 1~2일을 확인했다. 계정의 실제 등록 상태 조회·서류 수집·사업자 정보 제출은 하지 않았다. 게임 등급분류와 정산 정보는 별도 등록 항목이다.

## 홈 그림 추가 확대·버튼 줄바꿈 보정 (2026-10-20, 미업로드)

- 사용자 최신 기기 화면을 기준으로 홈 그림을 144→160px, 내부 칸을 32→36px로 키웠다. 그림 여백은 유지해 추가 높이를 16px로 제한했다. 사진에서 `단어장 보기`가 두 줄로 꺾인 부분은 홈 버튼 글자 16px·줄바꿈 방지로 보정했다. TDS 버튼 높이와 좌우 배치는 유지한다.
- 토스 `build`(타입 검사 포함)·diff 검사 통과. 기존 큰 JS 청크 경고 유지. CSS 조정으로 테스트·lint는 반복하지 않았다. 실제 기기 배치·큰 글자 설정에서의 가독성은 미검증이다. `.ait` 재생성·업로드는 하지 않았다.

## 홈 좌우 버튼·144px 그림 테스트 업로드 완료 (2026-10-20)

- 사용자 `토스 배포해줘` 승인으로 홈 `퀴즈 시작`·`단어장 보기` 좌우 배치와 그림 144px·여백 조정본을 테스트 업로드했다. `build:ait`(타입 검사·61편/119장·dist 32,906,508바이트)·diff 검사 통과. 버튼 문구/동작 변경 시 통과한 테스트 73개·lint는 이후 CSS만 조정해 반복하지 않았다. 기존 큰 JS 청크 경고 유지.
- `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "홈 버튼 좌우 배치 및 그림 144px 여백 균형 조정"` 성공(exit 0). 번들 30,450,342바이트, deploymentId `01a15768-04c1-778c-94e9-7adae489a4ec`. 테스트 주소: `intoss-private://t-crossword?_deploymentId=01a15768-04c1-778c-94e9-7adae489a4ec&host=appsInTossHost`.
- 실제 기기 화면 균형·작은 화면 버튼 가독성은 사용자 확인 대기다. 기존 미리보기는 이전 128px 그림·세로 버튼 기준으로 최신 검증 자료가 아니다. 키 내용 조회·출력, 서버/DB 변경·공개 검토 요청·출시·커밋·푸시는 하지 않았다. 아래 미업로드 기록은 수정 당시 상태다.

## 홈 좌우 버튼으로 확보한 공간 재배분 (2026-10-20, 미업로드)

- 사용자 동의로 홈 그림을 128→144px, 내부 칸 28→32px로 키웠다. 그림 위/아래 여백은 20→24px, 설명 위는 12→16px로 조정했다. 좌우 한 줄 버튼·TDS 버튼 높이는 유지한다. 홈 전용 CSS만 수정했다.
- 토스 `build`(타입 검사 포함)·diff 검사 통과. 기존 큰 JS 청크 경고 유지. CSS 조정으로 기존 테스트·lint는 반복하지 않았다. 실제 기기 배치는 미검증이며 `.ait` 재생성·업로드하지 않았다.

## 홈 버튼 좌우 한 줄 배치 (2026-10-20, 미업로드)

- 사용자 동의에 따라 홈의 두 버튼을 `퀴즈 시작`·`단어장 보기`로 줄이고 동일 너비의 좌우 한 줄로 배치했다. 진한/연한 파랑과 TDS 버튼 높이를 유지하고 아이콘·좌우 패딩을 조정했다. `App.tsx`·`styles.css`·기존 동작 테스트의 버튼 문구를 갱신했다. 그림 128px·제목/본문 중간 크기 조정도 포함한다.
- 토스 `test` 73개·`lint`·`build:ait`(타입 검사 포함)·diff 검사 통과. 기존 큰 JS 청크 경고 유지. 실제 기기에서 좁은 화면·글자 확대 시 버튼 가독성은 미검증이며 업로드하지 않았다. 이전 홈 미리보기 이미지는 세로 버튼 배치이므로 최신 화면으로 간주하지 않는다.

## 홈 축소 강도 조정 (2026-10-20, 미업로드)

- 사용자가 최신 기기 화면에서 홈 축소가 과하다고 피드백했다. 홈 전용 CSS에서 장식 그림을 96→128px(초기 160px), 제목 16→18px, 환영 문구 18→20px, 설명 13→14px로 조정하고 그림 여백 20px·설명 위 12px·버튼 위 20px·버튼 사이 12px로 완화했다. 두 버튼 크기와 스크롤은 유지했다.
- 토스 `build`(타입 검사 포함)·diff 검사 통과. CSS 조정으로 테스트·lint는 반복하지 않았다. 실제 기기 버튼 노출·화면 균형은 미검증이며 `.ait` 생성·업로드는 하지 않았다.

## 홈·그림책 간격 수정 테스트 업로드 완료 (2026-10-20)

- 사용자 `업로드 해줘..` 승인으로 홈 그림·여백 축소와 그림책 상단 간격 축소를 포함한 최신 `.ait`를 생성·업로드했다. `pnpm.cmd --filter @t-crossword/toss build:ait` 통과(타입 검사·61편/119장·dist 32,906,437바이트). 기존 큰 JS 청크 경고 유지. CSS 변경이므로 기존 테스트는 반복하지 않았다.
- `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "홈 화면 그림 및 여백 축소, 그림책 상단 간격 정리"` 성공(exit 0). 번들 30,450,332바이트, deploymentId `01a15758-b611-7d22-bee2-c82f301fa6a0`. 테스트 주소: `intoss-private://t-crossword?_deploymentId=01a15758-b611-7d22-bee2-c82f301fa6a0&host=appsInTossHost`.
- diff 검사 통과. 실제 기기 홈 버튼 노출 범위·그림책 간격 확인은 사용자 진행 대기다. 키 내용 조회·출력, 서버/DB 변경·공개 검토 요청·출시·커밋·푸시는 하지 않았다. 아래 미업로드 문구는 수정 당시 기록이다.

## 홈 화면 그림·여백 축소 (2026-10-20, 미업로드)

- 사용자 기기 화면에서 홈 시작 버튼이 하단 메뉴 아래로 밀려 보인다는 맥락에 따라 홈 전용 CSS를 조정했다. 장식 그림 160→96px, 그림 위/아래 여백 40/32→12/12px, 제목·환영 문구·설명 크기/행간과 버튼 사이 여백을 줄였다. 시작/단어장 버튼의 TDS 크기와 기존 스크롤은 유지했다. 다른 화면의 스타일은 바꾸지 않았다.
- 토스 `build`(타입 검사 포함)·diff 검사 통과, 기존 큰 JS 청크 경고 유지. CSS 변경만 있어 테스트·lint는 반복하지 않았다. 실제 기기에서 두 버튼이 보이는 범위·글자 크기 설정별 가독성은 미검증이다. 그림책 상단 간격 수정도 로컬에 누적돼 있으며 `.ait` 재생성·업로드는 하지 않았다.

## 그림책 상단 세로 간격 축소 (2026-10-20, 미업로드)

- 사용자 기기 피드백으로 `styles.css`의 그림책 제목 영역 위/아래 패딩을 각각 16→8px, 난이도 버튼 위 여백을 20→8px로 줄였다. 앱 헤더와 제목 사이 8px, 제목과 난이도 사이 20px, 총 28px의 세로 공간을 줄였으며 다른 화면·버튼 크기는 유지한다.
- 토스 `build`(타입 검사 포함)·diff 검사 통과, 기존 큰 JS 청크 경고 유지. CSS 간격만 바꿔 기존 테스트·lint는 반복하지 않았다. 실제 기기 배치·새 `.ait` 생성·업로드는 미실행이다. 다음 업로드 전 `build:ait`가 필요하다.

## 화면 공간 정리 일괄 테스트 업로드 완료 (2026-10-20)

- 사용자 `업로드해줘..테스트 하게` 승인으로 배너 최하단 이동·안전 영역 조정, 퀴즈 진행/새 퍼즐을 보상 안내 옆으로 통합, 단어 수를 단어장 제목 옆으로 이동, 그림책 소개를 제목 옆으로 이동한 최신 번들을 업로드했다.
- `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "배너 최하단 배치 및 퀴즈 단어장 그림책 상단 공간 정리"` 성공(exit 0). 번들 30,450,338바이트, deploymentId `01a1574a-f255-7367-891b-bbf8d9e941df`. 테스트 주소: `intoss-private://t-crossword?_deploymentId=01a1574a-f255-7367-891b-bbf8d9e941df&host=appsInTossHost`.
- 동일 소스에서 이미 통과한 토스 테스트 73개·lint·build:ait(타입 검사 포함)는 반복하지 않고 업로드 전후 diff 검사를 수행했다. 실제 기기 배치·메뉴/광고 간격·작은 화면 가독성은 사용자 확인 대기다. 키 내용은 읽거나 출력하지 않았다. 서버/DB 변경·공개 검토 요청·출시·커밋·푸시 없음. 아래 미업로드 문구는 각 수정 당시 기록이다.

## 그림책 소개를 제목 옆으로 이동 (2026-10-20, 미업로드)

- 사용자 요청으로 토스 그림책의 `그림과 함께 영어 시·에세이·소설을 읽어 보세요.` 소개를 `그림책` 제목 옆에 배치했다. 제목은 유지하고 좁은 화면에서는 소개 문구가 줄바꿈된다. `PictureBooks.tsx`·`styles.css`를 수정했다.
- 토스 `test` 73개·`lint`·`build:ait`(타입 검사 포함)·diff 검사 통과. 실제 기기 배치는 미확인이다. 일괄 업로드 지시에 따라 업로드하지 않았다.

## 단어장 개수를 제목 옆으로 이동 (2026-10-20, 미업로드)

- 사용자 요청으로 토스 단어 수를 검색창 아래 별도 행에서 `나의 단어장` 제목 옆으로 옮겼다. 검색·전체/즐겨찾기/학습완료/오답노트 분류에 따른 결과 개수 갱신과 aria-live 안내는 유지한다. `App.tsx`·`styles.css`만 수정했다.
- 토스 `test` 73개·`lint`·`build:ait`(타입 검사 포함)·diff 검사 통과. 실제 기기 배치는 미확인이다. 수정 완료 후 일괄 업로드 지시에 따라 업로드하지 않았다.

## 퀴즈 상단 중복 행 제거·진행/새 퍼즐 통합 (2026-10-20, 미업로드)

- 사용자 요청으로 토스 퀴즈의 `초급 · 10×10 / 진행 숫자 / 새 퍼즐` 별도 행을 제거했다. 난이도·크기는 선택 버튼에서 확인하고, 진행 숫자와 새 퍼즐은 `🎁 완성하면 힌트 5개를 드려요.` 옆에 배치한다. 좁은 화면에서는 안내 문구만 줄바꿈하고 진행·버튼은 함께 유지한다.
- `App.tsx`, `styles.css`, 기존 퀴즈 흐름 회귀 검사를 갱신했다. 토스 `test` 73개·`lint`·`build:ait`(타입 검사 포함)·diff 검사 통과. 실제 토스 작은 화면 배치 검증은 미실행이다. 사용자의 수정 완료 후 일괄 업로드 지시에 따라 업로드하지 않았다. 배너 최하단 이동도 로컬에 유지한다.

## 배너를 하단 메뉴 아래로 이동 (2026-10-20, 로컬 완료·미업로드)

- 사용자의 최하단 배치 요청에 따라 `App.tsx`에서 배너를 하단 메뉴 뒤로 옮겼다. `styles.css`의 배너 간격은 위쪽 16px로 옮기고, 하단 안전 영역을 메뉴 대신 앱 셸에 적용해 배너 유무와 관계없이 최하단 요소를 보호한다.
- 토스 `test` 73개·`lint`·`build:ait`(타입 검사 포함, dist 32,905,775바이트)와 diff 검사 통과. 로컬 deploymentId `01a15741-42c4-7b2e-8fe8-3a15a185453b`. 기존 큰 JS 청크 경고 유지.
- `ait deploy` 업로드 권한 요청이 사용자에 의해 거절되어 명령은 실행되지 않았다. 기존 업로드본은 유지하며 최신 위치 변경의 실제 기기 검증은 미실행이다. 서버/DB 변경·커밋·푸시 없음.

## 광고 기기 피드백·배너 여백 및 대기 안내 수정 업로드 (2026-10-20)

- 사용자 확인: 그림책 하단 목록 버튼 정상. 제공한 기기 화면에서 광고 보상 잔액 16→21을 확인했다. 배너가 크고, 설정의 보상 광고는 성공하기도 하고 `다시 준비하기`로 표시되기도 한다고 보고했다. 첨부 오류 화면은 1분/24시간 지급 제한 안내이며 실제 광고 로드 장애 전체의 원인까지 확정한 것은 아니다.
- 배너 상단 12px·좌우 20px 바깥 여백을 제거해 높이 12px을 줄였다. 공식 API의 작은 높이 프리셋은 확인되지 않아 SDK 광고 본문 96px·표준 UI·메뉴와 16px 간격은 유지한다. 임의 배율/잘림 처리는 하지 않는다.
- prepare 성공 뒤 앱에 60초 대기 상태를 보관하며 모달 재진입에도 적용한다. 서버 `ad_reward_limit`은 일반 로드 오류와 구분해 남은 초와 이용 제한을 안내한다. 대기 해제 뒤 준비를 재개한다. 24시간 한도·다른 세션/앱 재실행은 서버 판정이 최종이며 이 경우 60초가 정확한 해제 시각을 뜻하지 않는다. DB/API/한도는 변경하지 않았다.
- 토스 `test` 73개·`lint`·`build:ait`(타입 검사·61편/119장·dist 32,905,770바이트)·diff 검사 통과. 기존 큰 JS 청크 경고 유지. `Ads.tsx`, `styles.css`, `ads.test.tsx`, 광고 문서를 갱신했다.
- 기존 승인된 테스트 업로드 흐름으로 `ait deploy` 성공(exit 0). 번들 30,450,207바이트, deploymentId `01a1573d-a6d1-78ca-a339-a5199c927829`. 주소: `intoss-private://t-crossword?_deploymentId=01a1573d-a6d1-78ca-a339-a5199c927829&host=appsInTossHost`. 수정본의 실제 배너 공간·대기 표시·광고 준비 안정성은 사용자 확인 대기다. 서버 배포·DB 변경·공개 출시·커밋·푸시 없음.

## 토스 광고 테스트 DB/API 적용·앱 업로드 완료 (2026-10-20)

- 사용자 `업로드까지 해줘` 승인으로 기존 crossword(`zduyaejdjwfhsiazcmrn`)에 `20261020_toss_test_ad_rewards.sql`만 CLI `db query --file`로 적용했다. 사전 새 테이블/RPC 부재·기존 지갑 존재, 적용 후 RLS true·anon 조회/실행 false·authenticated INSERT/실행 false·service_role 실행 true를 확인했다. 데이터 삭제·마이그레이션 이력 변경 없음.
- 서버 설정 `TOSS_TEST_AD_REWARDS=true` 한 개 등록 후 `toss-hints` 배포 성공, 함수 목록에서 v5 ACTIVE·verify_jwt false 유지를 확인했다. 기존 인증서/키는 읽거나 변경하지 않았다. 원격 경계 요청 3회: health 200·무인증 claim 401·활성화된 테스트 prepare에 가짜 세션 401(unauthorized), 모두 통과. 실제 시청/사용자 잔액 변경 시험은 아니다.
- `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "선택형 힌트 보상 광고 및 하단 배너 테스트, 그림책 목록 버튼 정리"` 성공(exit 0). 번들 **30,449,932바이트**, deploymentId `01a1572b-1006-7544-84b2-4adaf309a538`. 테스트 주소: `intoss-private://t-crossword?_deploymentId=01a1572b-1006-7544-84b2-4adaf309a538&host=appsInTossHost`.
- 기존 통과한 72개 앱/55개 API 테스트·workspace 타입 검사·lint·앱/Edge 빌드는 코드가 같아 반복하지 않았다. 문서 갱신과 diff 검사를 수행했다. 실제 토스에서 보상형 광고 완료 +5·중도 닫기 미지급·배너·작은 화면 공간 확인은 사용자 진행 대기다. 테스트 ID 전용/서버 시청 증명 미검증 한계는 [광고 문서](docs/toss-ads.md)를 따른다. 공개 검토 요청·출시·PWA 배포·커밋·푸시 없음.

## 토스 선택형 보상 광고·하단 배너 테스트 구현 (2026-10-20, 운영 미적용)

- 사용자는 광고를 최소화하는 방향으로 선택 시청 보상형(힌트 5개)과 하단 띠 배너를 선택했고, 광고 그룹이 없어 공식 테스트 ID로 진행하도록 지시했다. 기존 기능 기기 테스트는 마무리됐다고 했으며 신규 광고·하단에만 남긴 목록 버튼의 최신 번들 검증과는 구분한다.
- `Ads.tsx`에서 SDK 3.8.0 보상형 load/show·배너 initialize/attach를 연동했다. 상단 잔액·설정 버튼으로 시청을 선택하고 하단 메뉴 위에 배너 1개를 둔다. 자동 전면 광고 없음. 보상 화면 중 배너를 제거하며 실패/no-fill·미지원·시간 초과·콜백 정리를 처리한다.
- 새 테스트 전용 API prepare/claim, data RPC 타입/구현, 마이그레이션을 추가했다. 준비 단계 무지급, 완료 이벤트 뒤 고정 +5, 사용자/UUID별 중복·응답 유실 재시도 1회 지급, 만료/다른 사용자 거부, RLS·서버 전용 권한을 구현했다. 시험 보호 한도는 준비 요청 1분 1회·24시간 10회다. 서버 플래그는 기본 비활성화다. 시청 증명의 서버 검증이 없어 운영 광고로 전환하지 않으며 상세 한계는 [광고 문서](docs/toss-ads.md)에 기록했다.
- 검증: `pnpm.cmd typecheck` 전체 workspace 통과, 토스 `lint`·`test` 72개 통과, API `test` 55개 통과/프로파일 1개 건너뜀, API `build:edge` 통과. 토스 `build:ait`는 하단 목록 버튼 수정·광고 연동·콘텐츠 61편/119장을 포함해 생성했다. 기존 큰 JS 청크 경고 유지. PGlite는 단일 연결 검사이며 실제 원격 동시성·광고 네트워크 검증이 아니다.
- 운영 DB 마이그레이션 적용, `TOSS_TEST_AD_REWARDS` 활성화, API 배포는 명시적 승인 대기다. 광고 포함 앱은 아직 업로드하지 않았다. 실제 토스의 광고 표시·닫기·작은 화면/키보드·잔액 +5 검증은 미실행이다. PWA 수정·공개 검토 요청·출시·커밋·푸시 없음.

## 그림책 화살표 정렬·페이지 이동 위치 수정 테스트 업로드 (2026-10-20)

- 토스 이미지 좌우 화살표를 부모 flex 영역에서 중앙 정렬해 버튼 transform과 위치 계산의 충돌을 피했다. 장 이동 시 화면 맨 위 대신 작품 제목을 스크롤 영역 상단에 맞춘다. 최초 상세 진입·목록 위치 복원은 유지한다.
- 검증: 토스 typecheck·lint·일반 build 통과, 최신 전체 테스트 66개 통과. `pnpm.cmd --filter @t-crossword/toss build:ait` 통과(61편/119장, dist 32,899,654바이트). 기존 큰 JS 청크 경고 유지.
- 사용자 테스트 배포 요청으로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "그림책 화살표 정렬 및 페이지 이동 시 작품 제목 위치 맞춤"` 업로드 성공(exit 0). 최초 네트워크 제한 실패 후 권한 승인으로 재실행했다. 저장된 프로필을 사용했고 키 내용은 읽거나 출력하지 않았다. 번들 30,448,571바이트, deploymentId `01a1571b-6905-7bc2-bcbb-ede310b4374b`.
- 테스트 주소: `intoss-private://t-crossword?_deploymentId=01a1571b-6905-7bc2-bcbb-ede310b4374b&host=appsInTossHost`. 실제 기기의 화살표 높이·이전/다음 장 제목 위치 확인은 사용자 진행 대기다. 공개 검토 요청·출시·서버/DB 변경·커밋·푸시는 하지 않았다. PWA에는 이번 그림책 UI 수정을 적용하지 않았다.

## 토스 그림책 이미지 좌우 화살표 전환·단일 장 버튼 정리 (2026-10-20)

- 사용자 확인: 목록→상세→목록의 위치 복원 정상. 추가 요청에 따라 초·중·고급의 한 장 작품은 이전/다음 없이 목록 버튼만 제공하고, 두 장 이상은 이미지 좌우 화살표로 페이지 전환을 안내하도록 변경했다.
- `PictureBooks.tsx`에서 여러 장에만 TDS 화살표 버튼(접근성 이름 `이전 페이지`/`다음 페이지`)을 이미지 양끝 중앙에 배치했다. 첫 장 이전/마지막 장 다음은 비활성화하며 44×48px 터치 영역을 확보했다. 텍스트 이전/다음 버튼은 제거하고 상단·하단 목록 버튼, 페이지 숫자·해석·목록 위치 복원·이미지 사전 준비를 유지했다. 토스 전용 스타일·회귀 검사만 함께 갱신했다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/toss test` **66개**, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·61편/119장·dist **32,899,535바이트**·100MB 상한 포함), `git diff --check`. 세 난이도 단일 장에서 화살표 없음·목록 유지, 다중 장 화살표 클릭·첫/끝 장 비활성·페이지 전환·목록 위치 복원 회귀 통과. 기존 큰 JS 청크 경고 유지.
- 기존 승인된 토스 테스트 업로드 흐름으로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "그림책 단일 페이지 이동 버튼 제거 및 이미지 좌우 화살표"` 성공(exit 0). **30,448,572바이트**, deploymentId `01a154d6-5200-7daf-9fab-71ca8be6652a`, 테스트 주소 `intoss-private://t-crossword?_deploymentId=01a154d6-5200-7daf-9fab-71ca8be6652a&host=appsInTossHost`. 저장된 프로필을 사용했으며 키 내용은 읽거나 출력하지 않았다.
- 실제 토스에서 화살표 위치·이미지 본문 가독성·터치 반응은 사용자 확인 대기다. 웹 UI·광고·공개 검토 요청·출시·서버/DB 변경·커밋·푸시 없음. 기존 사용자 변경은 보존했다.

## 그림책 목록 복귀·버튼 수정 토스 테스트 업로드 완료 (2026-10-20)

- 사용자 `응 진행해` 승인 후 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "그림책 목록 스크롤 복원 및 모든 페이지 목록 버튼"` 성공(exit 0). 저장된 프로필을 사용하고 키 내용은 읽거나 출력하지 않았다.
- 기존 검증 완료 번들 **30,448,197바이트**를 재빌드 없이 업로드했다. deploymentId `01a154ce-a139-7905-bc55-7f989717662c`, 테스트 주소 `intoss-private://t-crossword?_deploymentId=01a154ce-a139-7905-bc55-7f989717662c&host=appsInTossHost`.
- 실제 토스에서 목록→상세→목록의 선택 전 위치 복원, 모든 상세 장 하단의 이전/목록/다음, 장 이동 시 맨 위, 기기 뒤로가기 복귀는 사용자 확인 대기다. CLI 업로드 성공을 기기 검증 완료로 간주하지 않는다. 기존 63개 테스트·lint·build:ait는 동일 코드라 반복하지 않았다. `git diff --check` 통과. 광고 추가·공개 검토 요청·출시·서버/DB 변경·커밋·푸시 없음.

## 토스 그림책 목록 복귀·모든 장의 목록 버튼 수정 (2026-10-20)

- 사용자 기기 피드백: 초급·중급에서 상세의 목록 버튼을 누르면 목록 하단으로 이동하고, 여러 장짜리 작품의 중간 장 하단에는 목록 버튼이 없었다. 고급의 목록 스크롤 문제는 목록이 짧아 사용자 미확인이다.
- 토스 `PictureBooks.tsx`에서 작품 선택 직전에 목록의 실제 main 스크롤 위치를 저장하고 목록 복귀 시 복원한다. 상세 진입·장 이동·난이도 변경은 맨 위로 이동한다. SDK 뒤로가기로 상세 선택이 해제되는 경로도 같은 복원 처리를 사용한다. 화면 갱신 직후 레이아웃 효과로 처리해 상세의 스크롤이 목록에 남지 않게 했다.
- 상세 하단 모든 장에 `이전 · 목록으로 · 다음`을 표시하며 첫 장 이전/마지막 장 다음은 비활성화한다. 상단 목록 버튼도 유지한다. 토스 전용 CSS로 세 버튼 공간을 균등 배치했다. 웹 UI/라우팅은 변경하지 않았다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/toss test` **63개**, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·61편/119장·dist **32,898,288바이트**·100MB 상한 포함), `git diff --check`. 초·중·고급에서 목록 위치 복원·상세/다음 장 맨 위·모든 장 목록 버튼·마지막 장 비활성·선택 해제 뒤 복귀·난이도 변경 초기화를 회귀 검사했다. 기존 큰 JS 청크 경고 유지.
- 로컬 `.ait` 생성 완료(deploymentId `01a154ce-a139-7905-bc55-7f989717662c`). 이번 수정의 테스트 업로드·실제 토스 스크롤/기기 뒤로가기 확인은 미실행이다. 자동 DOM 검사는 실제 기기 스크롤 검증을 대체하지 않는다. 기존 사용자 변경 보존, 커밋·푸시·서버 배포 없음.

## 승인된 원격 동시성·재시도 시험과 합성 데이터 정리 완료 (2026-10-20)

- 사용자 `응 진행해` 승인에 따라 기존 crossword 프로젝트에서 준비한 `node --env-file=apps/toss-api/.env.local scripts/verify-toss-concurrency.mjs --execute zduyaejdjwfhsiazcmrn` 실행 **exit 0**. 합성 사용자 1명·세션 2개, 최대 동시 2개, Edge 15회+세션 RPC 2회+범위 한정 조회 4회 = **총 21회**로 완료했다. 키·원문 세션 토큰은 출력/저장하지 않았다.
- 동일 판 요청 중첩/응답 폐기·재요청에서 판·스냅샷 각각 1개, 같은 힌트 UUID/다른 UUID의 같은 칸에서 중복 차감 없음, 다른 단어 힌트 응답 폐기·재요청에서도 잔액 10→9→8 유지, 최종 정답 중첩/응답 폐기·재요청에서 보상 +5 한 번·최종 13을 확인했다. DB 조회로 힌트 요청 4개·세션 2개·solved 두 단어 중복 없음·rewarded를 확인했다.
- 실행 ID `7db68583-74dc-4e2e-89a3-f4c1fc8d9314`의 scope와 cleanup.sql을 대조했다. 승인된 `npx.cmd --yes supabase@2.121.0 db query --linked --project-ref zduyaejdjwfhsiazcmrn --file tmp/toss-concurrency-7db68583-74dc-4e2e-89a3-f4c1fc8d9314/cleanup.sql` **exit 0**, `remaining_test_players: 0`. 생성한 합성 사용자 해시에 연결된 스냅샷·힌트 요청·판·세션·사용자만 한 트랜잭션으로 정리했다. FK/스키마 변경 없이 commit했으며 기존 사용자 전체 전후 집계 비교를 한 것은 아니다.
- [결과 기록](docs/verification/toss-concurrency-2026-10-20.json)과 [원격 검증 보고서](docs/toss-remote-verification.md), 무료 운영/재시도/API 문서에 실제 결과를 반영했다. 코드 변경이 없어 기존 테스트·빌드는 반복하지 않고 JSON 파싱·문서/diff 검토와 `git diff --check`를 수행했다.
- 한계: 응답 헤더 수신 후 본문을 버린 재시도이며 물리적 네트워크 단절을 주입한 것은 아니다. 실제 원격 트랜잭션을 중첩했지만 DB 연결 PID·강제 행 잠금 경합·대규모 부하·토스 SDK 인증/기기 Worker는 별도 미검증이다. 최신 계정 Usage·알림 수신·자동 모니터·월 호출량 강제 차단도 미완료다. 사용자 기기 테스트는 진행 중이다. 새 배포·요금제/Secrets 변경·커밋·푸시 없음.

## 서버 경계 후속 점검·무료 운영 대응 준비 (2026-10-20)

- 사용자 `진행해` 요청으로 Origin 읽기 진단·원격 동시성 시험 준비·무료 운영 대응 문서화를 진행했다. 운영 DB 쓰기/삭제·부하 시험은 구체화 후 별도 승인받기로 한 범위를 유지했다.
- 원격 읽기 총 7회: Origin 없는 health 200, 미허용 `.example`/`example.org` health 403, 처음 추정한 `.private-web` 주소는 403(예상 200과 달라 첫 진단 exit 1). 로컬 설정에서 Origin 항목만 확인한 `.private-apps` 주소로 다시 검사해 health 200·Access-Control-Allow-Origin 일치·사전 요청 204를 확인했고, 이전에 시간 초과된 미허용 Origin의 실제 POST도 403으로 통과했다. 비밀 키·인증서/업로드 키 내용은 읽거나 출력하지 않았고 허용 목록을 바꾸지 않았다. 이전 시간 초과는 재현되지 않았으나 원인 확정은 아니다. [실측 기록](docs/verification/toss-origin-2026-10-20.json) 보관.
- `diagnose-toss-origin.mjs`에 확인된 Origin 인수·시각/상태/지연 기록과 선택 검사를 추가했다. `verify-toss-device-api.mjs`도 실패한 검사만 선택할 수 있게 했다. 잘못된 검사명으로 0개를 실행하고 성공 처리하지 않도록 두 도구에 방어를 추가했다.
- `verify-toss-concurrency.mjs`는 기본 실행 시 계획만 출력한다. 승인 후에만 지정 프로젝트/서버 환경 일치 확인→합성 사용자 1명/세션 2개→동시 요청 최대 2개→판 재사용·힌트 차감·응답 본문 폐기/재시도·보상 1회→범위 한정 DB 조회를 총 **21회(Edge 15+RPC 2+조회 4)** 상한으로 실행한다. 운영 실행은 하지 않았다. 키·원문 세션 토큰 없는 실행 scope와 해당 합성 사용자만 삭제하는 SQL을 첫 요청 전에 준비하며 정리는 자동 실행하지 않는다. [시험 범위·실행/정리 절차](docs/toss-remote-verification.md)를 검토 가능하게 정리했다.
- [무료 운영 대응](docs/toss-free-operations.md)에 공식 Free/Spend Cap·호출 집계 기준, 수동 점검 주기 제안, 50/70/85/95% 내부 대응 기준, 예산 예시, 이상 증가/서비스 제한 대응과 승인 경계를 정리했다. 최신 계정 Usage·알림 수신은 조회하지 않았고 자동 모니터·함수 진입 전 차단을 구축한 것은 아니다. 월 호출량 강제 방어는 여전히 미완료다.
- 검증: `node --test scripts/verify-toss-concurrency.test.mjs scripts/toss-diagnostics.test.mjs` **7개 통과**, `node --check scripts/verify-toss-concurrency.mjs`·진단/경계 스크립트 구문 검사, 기본 계획 출력, `git diff --check` 통과. 로컬 도구 검사는 21회 상한·동시 2개·중복 차감/중복 판 탐지·삭제 범위·기본 무실행/비밀 비출력·잘못된 검사 선택 실패를 확인하며 실제 DB 동시성 검증은 아니다. 앱/API 실행 소스 변경이 없어 기존 빌드는 반복하지 않았다.
- 남은 승인: 기존 crossword에서 합성 데이터 시험 21회와 생성한 합성 데이터만 정리하는 SQL 1회. 실제 네트워크 단절·DB 연결 PID/강제 잠금 경합·대규모 부하·최신 Usage/알림은 별도 미검증이다. 사용자 토스 기기 테스트는 진행 중이며 통과로 간주하지 않는다. 서버 설정·배포·DB 변경·커밋·푸시 없음.

## 기기 출제 API 배포·토스 테스트 업로드 (2026-10-20)

- 사용자 `다음 진행해줘` 승인에 따라 준비한 API→앱 순서로 적용했다. 기존 crossword 프로젝트(`zduyaejdjwfhsiazcmrn`)에 `npx.cmd --yes supabase@2.121.0 functions deploy toss-hints --project-ref zduyaejdjwfhsiazcmrn --use-api` 성공(exit 0), 함수 목록에서 **v3 ACTIVE**, 기존 `verify_jwt: false` 유지를 확인했다. 신규 마이그레이션·DB 데이터 변경·Secrets/인증서·요금제 변경 없음.
- `scripts/verify-toss-device-api.mjs`를 추가해 실제 사용자 인증·지갑 변경 없는 경계 요청을 실행했다. health 200·무인증 balance 401·무인증 새 등록 401·무효 배치 400(`invalid_round_draft`)·유효 배치/가짜 세션 401 **5개 통과**. 마지막 미허용 Origin 검사는 20초 시간 초과로 exit 1, 해당 요청 1회만 따로 재확인해도 시간 초과였다. 원격 검사 전체 통과로 기록하지 않으며 원인 미확정이다. 실제 유효 세션 등록·차감·보상·다중 연결/물리적 응답 유실은 이 검사 범위가 아니다.
- 저장된 default 프로필로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "기기 출제와 판 등록, 검색 및 그림책 이동 개선"` 업로드 성공(exit 0). 최초 샌드박스 실행은 fetch 실패였고 권한 승인 후 재실행했다. 키 내용을 읽거나 출력하지 않았다. 기존 완성 번들을 재사용했고 같은 코드의 빌드·단위 검사는 반복하지 않았다.
- 업로드 번들 **30,447,979바이트**, SHA-256 `7a1876c72a4671094ecfc6ca54b43b193a92a53415af595de3675c6a5d93104f`. deploymentId `01a154af-c194-7925-99c1-1293b5e9e823`. 테스트 주소: `intoss-private://t-crossword?_deploymentId=01a154af-c194-7925-99c1-1293b5e9e823&host=appsInTossHost`.
- 새 버전에는 기기 출제·서버 판 등록·예문 활용형 가림·단어장 검색·그림책 페이지 전환 개선이 포함된다. 앱을 완전히 닫고 새 테스트 버전으로 열어 Worker 실행/초·중·고급 12×12·기존 잔액·힌트 차감·완성 +5·새 판/실패 재시도·검색/메뉴 반응·그림책 이동을 확인해야 한다. 기기 테스트는 사용자가 진행하며 통과로 간주하지 않는다.
- API/토스 README·구조·무료 운영·재시도·결정 문서를 실제 적용 상태로 갱신했다. 공개 검토 요청·출시·웹 배포·커밋·푸시는 미실행. 기존 사용자 변경은 보존했다. 문서·명령·diff 검토 및 `node --check scripts/verify-toss-device-api.mjs`, `git diff --check` 통과.

## 공통 엔진의 기기 출제로 토스 전환 (2026-10-19, 운영 미적용)

- 사용자 요청에 따라 웹/PWA·토스·향후 하이브리드 앱은 기기에서 공통 `packages/core` 엔진으로 출제하는 기준을 명시했다. 웹은 기존 기기 출제를 유지하며 학습완료 제외 함수를 공유한다. 모바일은 아직 준비 화면으로 실제 퍼즐 UI는 미구현이다.
- 토스는 앱 소유 module Web Worker에서 공통 엔진을 실행하고, 서버 미설정 모드도 같은 기기 출제를 사용한다. Worker 미지원 환경은 공통 엔진 직접 실행, Worker 시작/실행/메시지/시간 초과는 오류 안내·수동 재시도다. 등록 네트워크 실패·401·429에는 같은 생성 결과·배치·UUID를 유지하며, 명시적인 만료·불일치·배치 거부 후 다음 수동 시도에서 새로 생성한다.
- API `/round/register`는 단어 ID·배치를 공통 단어장과 생성 엔진의 후보·교차·번호 규칙으로 재구성·검증한다. 클라이언트 정답·한도·번호·그리드를 신뢰하지 않는다. 기존 SQL/RLS·판 스냅샷·차감/정답/보상 RPC를 재사용하며 신규 마이그레이션은 없다. 구버전 `/round` 서버 출제는 호환용으로 유지하고 두 경로의 요청 제한을 공유한다. 새 앱은 구버전 서버 출제로 자동 우회하지 않는다.
- 검증 통과: `pnpm.cmd typecheck` 전체(후속 토스/API 수정은 각각 build:ait/typecheck로 재확인), core `pnpm.cmd --filter @t-crossword/core test` **48개**, 토스 `pnpm.cmd --filter @t-crossword/toss test` **60개**, API `pnpm.cmd --filter @t-crossword/toss-api test` **51개**(프로파일 1개 의도적 건너뜀), 웹 디렉터리에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` **38개**, 웹·토스 `lint`, 웹 `build`, API `build`·`build:edge`, 토스 `build:ait`, `git diff --check`. 회귀 범위는 세 난이도×세 크기 생성/재구성 일치·위조/범위/중복/접촉/미연결 배치 거부·fingerprint의 기기/배치 결속·구버전 호환·Worker 수명·응답 불일치·재시도·PGlite 실제 SQL 등록 응답 유실 후 1회 저장이다.
- `.ait` 생성 완료. 토스 dist **32,897,706바이트**, 61편/119장·100MB 상한 통과. 어휘 포함 Worker 번들 약 1.07MB가 추가됐고 기존 큰 JS 청크 경고는 유지한다. AGENTS·구조·사양·양 앱 README·재시도/무료 운영 문서와 [기기 출제 결정](docs/decisions/20261019-device-puzzle-generation.md)을 갱신했다.
- 남은 적용: 승인된 **API 배포→새 토스 번들 업로드→실기기 확인**. 새 앱을 기존 API에 먼저 연결하면 등록 경로가 404다. 이번 작업에서 운영 배포·업로드·운영 DB 변경·커밋·푸시는 하지 않았다. 실제 Toss WebView Worker 실행·출제/화면 반응·힌트/보상·네트워크 유실·다중 DB 연결 검증은 미실행이다. 유효한 기기 배치는 최다 단어 출제·실제 학습 성취나 봇 방지를 증명하지 않으며, 함수 호출/저장 비용과 월 호출량 소모 방어 과제는 남는다. 기존 사용자 변경을 보존했다.

## 토스 그림책 페이지 전환 개선 (2026-10-19)

- 사용자 확인: 그림책은 잘 보이지만 페이지 이동이 매끄럽지 않다. 인증·퍼즐·힌트·보상 테스트는 사용자가 진행 중이며 통과 완료로 기록하지 않는다.
- `PictureBooks.tsx`에서 페이지마다 읽기 article 전체를 재생성하던 처리를 제거했다. 해석은 페이지 전환 시 닫히도록 별도로 초기화하고, 이미지 공간은 최초 기본 비율/이후 실제 이미지 크기로 확보한다. 현재 이미지 로드 후 다음 한 장만 미리 요청·디코딩하며 전체 작품을 미리 내려받지 않는다. 미리 준비 실패는 현재 페이지를 막지 않고 실제 이미지 오류·재시도 처리를 유지한다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/toss test` 47개(이미지 실패·재시도·페이지 전환 시 article/img 유지·크기 유지·해석 닫기 회귀 포함), `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·61편/119장·100MB 상한 포함), `git diff --check`. 기존 큰 JS 청크 경고 유지.
- 로컬 `.ait`를 다시 생성했으며 예문 가림·단어장 검색 개선을 포함한다. 콘솔 업로드와 실제 토스 기기의 이동·스크롤·이미지 디코딩 시간 검증은 미실행이다. 코드 개선만으로 체감 문제가 해결됐다고 확정하지 않는다.

## 토스 단어장 검색 반응 개선 (2026-10-19)

- 사용자 기기에서 하단 메뉴 이동·단어장 검색이 한 박자 늦는다는 피드백을 받았다. 실기기 프로파일링으로 원인을 확정한 상태는 아니다.
- `App.tsx`의 단어장 필터를 메모화하고 학습·즐겨찾기·오답노트 ID 조회를 Set으로 바꿨다. 검색은 `useDeferredValue`로 입력과 목록 갱신을 나누고, `WordList.tsx`로 목록을 분리·메모화하여 입력·잔액 변경 시 기존 카드의 불필요한 렌더링을 줄였다. 최초 단어장 진입의 카드 생성 비용과 네트워크 지연은 이 변경만으로 해결됐다고 판단하지 않는다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/toss test` 47개(전체 3,339개 학습 기록으로 검색·필터·즐겨찾기·오답노트 삭제 후 기록 보존·홈 복귀 검사 추가), `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·61편/119장·dist 100MB 상한 포함), `git diff --check`. 기존 큰 JS 청크 경고 유지.
- 예문 활용형 가림까지 포함한 로컬 `apps/toss/t-crossword.ait` 생성 완료. 이번 변경의 콘솔 업로드·실기기 응답 시간 측정은 미실행이며 사용자 기기에서 검색·메뉴 전환을 재확인해야 한다. 기존 사용자 변경을 보존했다.

## 예문 힌트 활용형 가림 (2026-10-19)

- 웹·토스가 사용하는 공통 `maskWordInExample`에 복수형·3인칭·과거형·진행형·불규칙형·비교급/최상급 가림을 적용했다. `score`의 예문은 `Our team _____ three goals.`로 표시하며 빈칸 길이는 정답 길이를 유지한다. 비교급은 명시한 형용사 목록에 적용하고 `teach`/`teacher` 같은 파생어는 구분한다.
- 원본 어휘 3,339개를 대상으로 예문에서 가림이 발생하는지 회귀 검사한다. `PERIOD`는 예문에 동의어 `time`만 있어 가리지 않는다. 이 검사는 문장 전체의 의미·모든 오탐 가능성을 검증하는 형태소 분석은 아니다. 향후 추가되는 불규칙형·비교급은 목록 보완이 필요할 수 있다.
- 검증 통과: `pnpm.cmd --filter @t-crossword/core test` 34개, `pnpm.cmd typecheck` 전체, `pnpm.cmd --filter @t-crossword/toss test` 46개, `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/toss build`, `git diff --check`. 웹·토스 빌드의 500 kB 청크 경고는 유지된다.
- 실제 브라우저·토스 기기 확인, 배포는 미실행. 기존 그림책·토스 UI 작업은 이번 변경 범위에 포함하지 않는다.

> 프로젝트 사양서(`crossword-project-spec.md`) 및 `AGENTS.md` 가이드라인에 따른 단계별 구현 현황입니다.  
> 완료된 항목은 `[x]`로 체크하여 관리합니다.

---

## 마무리 기록: API 안정화·배포·테스트 업로드 (2026-10-19)

- 요청 제한·바이트 단위 본문 상한·판 생성 UUID/DB 스냅샷 재사용·재시도 회귀 검사와 Edge 배포 소스를 정리했다. 운영 신규 SQL 적용·toss-hints v2 ACTIVE·최신 번들 테스트 업로드는 앞선 사용자 승인 범위에서 완료했다. 이번 마무리에서는 추가 배포·DB 변경·업로드를 하지 않는다.
- 기존 검증: API 46개·토스 46개, 전체 타입 검사, API Node/Edge 빌드, 토스 lint/build:ait 통과. 별도 로컬 CPU 108회/6요청 묶음과 실제 DB 롤백·권한/집계·원격 경계 요청 검사를 완료했다. 같은 코드 검사는 반복하지 않고 현재 문서·경로·diff·커밋 대상과 비밀 포함 여부, `git diff --check`를 확인한다. 일반 API 실행에서 프로파일 1개는 의도적으로 건너뛴다.
- AGENTS에 판 생성 재시도·적용 순서·키 등록/업로드 경계를 반영하고 구조·사양·앱 README·적용 문서를 맞췄다. 이 커밋은 API와 관련 소스·테스트·문서 범위다. 작업 시작 전부터 있던 그림책 원본/이미지·갤러리·콘텐츠 변환·앱 화면 수정은 포함하지 않고 그대로 보존한다. 로컬 키/인증서/설정·tmp·dist·.ait도 제외한다.
- 남은 검증은 사용자가 맡은 최신 토스 버전의 실제 사용·그림책·재시도와 실제 다중 DB 연결·Edge CPU/부하·월 호출량 소모 방어, 웹/PWA 기기/캐시 갱신이다. 기기 테스트를 많이 진행할 예정이라는 사용자 확인은 테스트 통과 결과로 간주하지 않는다. 진행 중 판은 앱 종료 후 복원하지 않는다. 공개 검토 요청·출시는 미실행이다.
- 현재 브랜치 main, 원격 origin/main으로 이번 범위만 커밋·일반 푸시한다. 커밋 해시와 푸시 결과·남은 작업 트리는 최종 보고에 기록한다.
- 스테이징 검사에서 처음 포함한 생성 Edge 번들의 의존성 주석 공백과 무료 운영 문서의 EOF 빈 줄을 발견했다. 번들은 Git 제외 대상으로 바꾸고 배포 전 `build:edge` 재생성을 명시했으며 문서 공백을 정리했다. 실행 코드는 변경하지 않았다. 최종 staged diff 검사를 기준으로 통과 여부를 확인한다.

## 토스 최신 번들 CLI 업로드 완료 (2026-10-19)

- 사용자 키 등록·업로드 승인 후 저장된 default 프로필로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "판 생성 재시도와 요청 제한 적용, 그림책 61편 연결"`을 실행해 업로드 성공(exit 0)을 확인했다. 최초 샌드박스 요청은 fetch 실패였으며 권한 승인 후 재실행했다. 키 내용은 읽거나 출력하지 않았다.
- 업로드한 번들은 기존 최신 30,159,418바이트 `.ait`이며 재빌드하지 않았다. deploymentId: `01a15094-d600-75c6-b2eb-f48c4a049b1f`. CLI 테스트 실행 주소: `intoss-private://t-crossword?_deploymentId=01a15094-d600-75c6-b2eb-f48c4a049b1f&host=appsInTossHost`.
- 콘솔 테스트 업로드까지만 완료했다. 공개 검토 요청·출시·커밋·푸시 없음. 최신 번들의 실제 토스 인증·판 생성 재시도·새 판 발급·힌트/보상·그림책 가독성·페이지 이동은 기기 확인 대기다. 실제 다중 DB 연결·Edge CPU/부하도 별도 미검증이다. 문서 변경 후 `git diff --check` 통과.

## 토스 DB 적용·API v2 배포 (2026-10-19)

- 사용자의 진행 승인으로 기존 crossword 프로젝트(`zduyaejdjwfhsiazcmrn`)에 신규 `20261019_toss_round_idempotency.sql`만 직접 적용했다. 기존 SQL 재실행·DB 초기화·CLI migration history 등록은 하지 않았다. 적용 전후 지갑 1개·판 19개·힌트 합계 16개를 보존했고 새 스냅샷은 0행이다.
- 실제 DB에서 새 테이블 RLS 활성·anon/authenticated 접근 차단, 두 RPC의 PUBLIC/anon/authenticated 실행 차단·service_role 허용을 확인했다. 합성 사용자/세션/판으로 중복 저장·재인증·설정 불일치·힌트 10→9·완성 9→14·중복 정답 14 유지 검사를 한 트랜잭션에서 실행하고 ROLLBACK했다. `passed_rolled_back` 통과 후 기존 집계를 재확인했다. 재실행 SQL은 `scripts/verify-toss-round-{schema,rollback}.sql`에 보관했다.
- 기존 Supabase에 `toss-hints` 배포 성공, 함수 목록 **v2 ACTIVE**·기존 `verify_jwt: false` 유지 확인. Secrets·인증서·probe JWT·요금제 변경 없음. 인스턴스별 요청 제한과 판 생성 스냅샷 코드가 함께 배포됐다.
- 원격 검사 통과: health 200·무인증 balance 401·요청 UUID 포함 무효 세션 round 401·미허용 Origin 403·기존 허용 HTTPS Origin preflight 204. 첫 로컬 개발 Origin 검사는 403이었고 HTTPS Origin으로 재확인했다. 실제 사용자 인증을 우회한 API 판 생성은 하지 않았다.
- 최신 `apps/toss/t-crossword.ait` 30,159,418바이트 준비. CLI `ait deploy --help`를 확인했으며 저장 프로필 `~/.ait/credentials`가 없어 테스트 업로드는 실행하지 않았다. 사용자 키를 채팅으로 요청하거나 자격 증명을 변경하지 않았다.
- API/토스 README·무료 운영 문서·[적용 보고서](docs/toss-round-idempotency.md)를 실제 상태로 갱신했다. 동일 코드의 기존 로컬 검사/빌드는 반복하지 않았고 `git diff --check` 통과. 미실행: 최신 번들 실제 토스 인증·같은 판 재시도·새 판 발급·물리적 응답 유실·다중 DB 연결 경합·Edge CPU/부하. 콘솔 업로드·공개 검수·커밋·푸시 없음.

## 토스 판 생성 요청 멱등성 구현 (2026-10-19, 운영 미적용)

- 판 생성 응답 유실 후 같은 요청으로 새 판이 추가되던 문제에 요청 UUID 기반 경로를 추가했다. 토스 gateway는 동일 난이도·크기·정규화한 학습완료 목록의 실패 요청 ID를 유지하고, 정상 응답 검증 후 다음 판에는 새 ID를 발급한다. 설정 변경은 새 ID, 만료/불일치의 명시적 거부 후에는 다음 수동 요청에 새 ID를 쓴다. 자동 반복 요청·앱 종료 후 복원은 추가하지 않았다.
- API는 사용자별 요청 결과를 출제 전에 조회하고, 미저장 요청만 출제 후 신규 RPC로 저장한다. SQL은 지갑 행 잠금 후 재조회해 먼저 저장된 후보를 반환하며 판과 스냅샷을 한 트랜잭션에서 저장한다. 재인증 후에도 같은 사용자면 같은 판을 반환하며 현재 잔액을 조회한다. 다른 사용자와 설정을 격리하고 빈 결과도 저장한다. ID 없는 구버전 요청은 기존 비멱등 경로로 호환한다.
- 신규 마이그레이션 `20261019_toss_round_idempotency.sql`과 `packages/data` 서버 RPC/타입을 추가했다. 스냅샷 테이블 RLS·클라이언트 권한 차단·서버 전용 두 함수 권한을 설정했다. 운영 DB에는 적용하지 않았다. DB→API→토스 번들 순서의 별도 승인된 적용이 필요하며 [규칙·검증·적용 순서](docs/toss-round-idempotency.md)에 기록했다.
- 검증 통과: `pnpm.cmd typecheck` 전체; API `test` **46개**(프로파일 1개 의도적 건너뜀); 토스 `test` **46개**; API `build`·`build:edge`; 토스 `lint`·`build:ait`; `git diff --check`. 새 SQL의 세션 갱신·사용자 격리·불일치·만료·빈 결과·중첩 후보·실패 롤백·60판 한도 재조회·권한과 HTTP 응답 폐기 후 1회 저장을 검사했다. 토스는 ID 유지/변경·재인증·429를 검사했다. 빌드 61편/119장 대응 및 dist 31,818,542바이트(<100MB) 통과, 기존 큰 청크 경고 유지.
- 한계: 저장 전 동시 조회가 모두 실패하면 출제 CPU는 중복될 수 있으나 판/결과 저장은 하나로 확정한다. HTTP 요청 제한·함수 호출량은 재시도에도 소비된다. 스냅샷은 24시간 후 같은 UUID 재사용을 거부하며 자동 삭제는 없다. 일반 판 시간당 60개와 빈 결과 시간당 60개는 별도 한도다. 새 경로의 실제 Edge CPU·다중 연결 경합·Supabase 통신·기기 확인은 미실행이며 PGlite 단일 연결 검사와 구분한다.
- 운영 DB 적용·배포·토스 업로드·자격 증명 변경·커밋·푸시 없음. 기존 미커밋 작업은 보존했다.

## 토스 CPU·중복 요청·응답 유실 로컬 검증 (2026-10-19)

- 로컬 API/SQL 회귀 검사를 확장했다. 힌트 UUID 12개 중첩 제출·같은 위치의 서로 다른 UUID·잔액 1의 다른 단어 요청·최종 정답 12개 중첩 제출에서 각각 1회 차감/초과 거부/+5 한 번을 확인했다. PGlite 한 연결의 직렬 큐 결과이며 실제 PostgreSQL 다중 연결의 행 잠금 경합을 증명하지 않는다.
- Edge 경로 어댑터→핸들러→실제 마이그레이션 SQL 처리 뒤 응답을 폐기하고 같은 힌트/최종 정답을 재요청해 잔액 9/14가 유지됨을 확인했다. SQL 브리지 검사이며 실제 PostgREST·네트워크 단절 검증은 아니다. 토스 gateway의 동일 최종 정답 재요청·429 자동 재시도 없음·재인증 상한, UI의 확인 전 성공/학습 기록 반영 보류와 재시도 후 반영도 검사했다.
- 세 난이도×세 크기×학습완료 4비율×seed 3개로 실제 `/round` 핸들러를 108회 측정했다(DB 가짜 저장소). 로컬 Node CPU 중앙값 16ms·관측 95백분위 282ms·최대 485ms, 최대 경과 488.1ms. 별도 고급 12×12 6개 묶음 모두 200, 묶음 CPU 2,562ms·경과 2,559.9ms. 다른 자동 검사와 병행하지 않은 최종 측정과 원시 표본을 [검증 보고서](docs/toss-api-local-verification.md)에 보관했다. hosted Edge CPU 한도 검증과 구분하며 생성 알고리즘은 변경하지 않았다.
- 현재 제한도 회귀 검사로 기록했다. `/round` 생성 응답을 잃고 재시도하면 새 UUID로 두 판이 등록된다. 직접 힌트 차감은 없지만 생성 작업·판 저장·생성 횟수를 다시 소비한다. 판 생성의 멱등성은 미구현이다.
- 검증: Node v24.22.0 / pnpm 10.34.7. `pnpm.cmd --filter @t-crossword/toss-api test` **33개 통과·프로파일 1개 의도적 건너뜀**, `pnpm.cmd --filter @t-crossword/toss test` **41개 통과**, API·토스 `typecheck` 통과. `$env:TOSS_PROFILE='1'`로 API `exec vitest run tests/puzzleProfile.test.ts` 별도 **1개 통과**, `git diff --check` 통과. 실행 코드·SQL·설정·의존성 변경이 없어 빌드는 반복하지 않았다.
- 미실행: 실제 Edge CPU/부하·Supabase 다중 연결 경합·물리적 네트워크 응답 유실·토스 기기 확인. psql/pg_ctl/Docker는 명령 경로에 없으며 설치하지 않았다. 원격 요청·배포·운영 DB/자격 증명 변경·커밋·푸시 없음. 다음은 승인된 테스트 환경에서 원격 CPU·동시성·재시도를 확인하는 단계이며 무료 호출량 자체의 소모 차단은 여전히 미완료다.

## 토스 API 인스턴스별 요청 제한 (2026-10-19)

- 공통 핸들러에서 전체 POST 600회/60초, 인증 교환 합계 20회/60초, 세션 해시별 전체 120회/60초 및 판 생성 6회·힌트 30회·잔액/정답 각각 90회/60초 제한을 추가했다. 외부 호출 전 429·한국어 대기 안내·Retry-After를 반환한다. 원본 토큰/IP는 저장하지 않고 최대 4,096개의 카운터만 보관하며 만료 후 회수한다. 잘못된 입력·재시도도 횟수에 포함된다.
- 본문 크기는 문자열 길이 대신 실제 UTF-8 스트림 65,536바이트로 제한하고 미등록 경로는 본문 처리 전에 거부한다. 새 의존성·DB 변경·앱 UI 변경 없음. 기존 작업 트리 변경을 보존했다.
- 환경: Node v24.22.0, pnpm 10.34.7. `pnpm.cmd --filter @t-crossword/toss-api test` **27개 통과**, `pnpm.cmd --filter @t-crossword/toss-api typecheck` 통과. 실행 코드 수정 후 API `build`·`build:edge` 통과(Node 약 1.84MB, Edge 약 1.83MB). 후속 변경은 회귀 테스트와 문서만이며 타입 검사를 다시 통과했다. `git diff --check` 통과. 인증 동시 요청/기간 만료·세션 격리·토큰 교체 전체 제한·퍼즐/세션 합산 한도·카운터 용량·초과 스트림 취소를 검사했다.
- API README와 무료 운영 문서에 수치·신뢰 경계·한계를 기록했다. Supabase 공식 호출량 문서상 429도 호출량에 집계된다. 이번 제한은 worker별 후속 작업 방어이며 **월 무료 호출량 소모 차단·다중 worker 전체 제한은 미완료**다. 재기동 시 초기화되고 인증 전체 한도는 정상 사용자에게도 공유된다.
- 미실행: 원격 함수 배포·실제 Edge CPU/부하·다중 연결 동시성·서버 처리 후 응답 유실 재시도·토스 기기 검증. 운영 DB·자격 증명 변경·커밋·푸시 없음. 다음 우선 검증은 퍼즐 생성 CPU와 DB 중복/동시 요청·응답 유실 재시도이며, 호출량 자체 보호에는 함수 진입 전 차단/직접 주소 우회 방지의 별도 검토가 필요하다.

## 마무리 기록 (2026-10-19)

- Supabase Edge 직접 연결·인증 시험 경로와 정답 모달 축소, 그림책 전체 검토·교정·토스 61편/119장 연결을 정리했다. Docker 구성은 미배포 참고용으로 보존한다. 공통 도메인 경계와 플랫폼별 UI 분리를 유지한다. `AGENTS.md`의 무료 운영·그림책 생성/승인 해시 규칙 및 관련 구조·사양·README·검토 문서를 현재 상태에 맞췄다.
- 사용자 확인: Supabase 직접 연결에서 기존 잔액·출제·힌트 차감·완성 보상 +5, 수정한 정답 모달 정상 동작. 실제 기기에서 가로 자동 회전은 되지 않았으며 정책상 금지라고 확정하지 않는다. 세로 화면 기준으로 확인을 진행한다.
- 사용자 Usage 화면 확인: 조직 전체 Free 플랜, 집계 2026-10-17~11-17, Edge Function Invocations 29/500,000회, DB 0.027/0.5GB, egress 0.002/5GB, storage 0.006/1GB, MAU 1/50,000, 한도 초과 없음. 직접 계정 접속 결과나 향후 비용 보장이 아니다. 아래 과거 ‘계정 무료 상태/사용량 미확인’ 기록을 대체한다.
- 이미 실행한 검증: API 테스트 20개·Node/Edge 빌드·전체 타입 검사, 토스 테스트 37개·lint·build:ait, 웹 테스트 38개·lint·build, 어휘 회귀 3개, 토스 콘텐츠 회귀 5개, 웹 빌드/PWA 검사 3개, 세 난이도 콘텐츠 검사·갤러리·웹/토스 이미지 변환 통과. 동일 코드 검사를 이번 마무리에서 불필요하게 반복하지 않았다. 이번 마무리에서는 diff·비밀 정보 포함 여부·스테이징 범위와 `git diff --check`를 확인한다.
- 최신 `.ait`는 30,159,334바이트, 압축 해제 31,820,241바이트, 그림책 119장이다. 원본·보정 이력·토스 WebP와 승인 해시를 배포 소스에 포함하며 로컬 환경 파일·인증서·키·임시 도구는 커밋에서 제외한다. 검토 범위·한계는 콘텐츠 최종 보고서를 따른다.
- 남은 작업: API 요청 제한·무료 호출량 소모 방어, 퍼즐 생성 CPU/부하, 실제 중복·동시 요청과 서버 처리 후 응답 유실 재시도 검증. 최신 그림책 토스 업로드·작은 화면 가독성·페이지 이동·해석·뒤로가기·이미지 재시도, 웹/PWA 기기·캐시 갱신은 미실행이다. 기존 큰 청크 경고 유지. 이번 마무리는 추가 배포·운영 DB 변경·자격 증명 변경을 포함하지 않는다.

## 그림책 전체 검토·토스 연결 완료 (2026-10-19)

- 전체 61편·119장의 영어·해석과 카드 제목·본문·페이지 번호·인물 역할을 대조하고 제작 기록·자체 참조 파일·도구 이용 조건을 검토했다. 초급 32편의 `work with you`를 `work with me`로 추가 교정하고 ImageGen 보정본·해석·제작 기록·웹 데이터를 맞췄다. 본문 초급 기본 어휘는 536종 유지. 이전 문서의 ‘토스 승인 작품 0편’은 과거 이력이다.
- [최종 검토 범위와 한계](content/picture-book-final-review-2026-10-19.md)를 기록하고 61편을 `approved`로 변경했다. 법률 의견·비침해 보증이나 실기기 검증을 뜻하지 않는다. `content/picture-book-approval.json`에 작품별 텍스트·이미지 해시를 보관하며 승인 후 내용이 바뀌면 빌드가 실패한다. 기존 제작 기록·PNG·보정 이력은 보존했다.
- 토스에서 초급 45편·중급 9편·고급 7편, 총 119장을 제공하도록 토스 전용 JSON·WebP를 생성했다. 원본 약 292.9MiB에서 토스 WebP 약 28.0MiB로 준비했다. 다른 앱의 UI·데이터·자산을 가져오지 않는다. 일반 빌드는 Node만 사용하며 Python/Pillow는 콘텐츠 제작 단계에만 필요하다. 승인·PNG/WebP 해시와 목록 밖 파일 검사를 유지했다.
- 검증 통과: `node --test scripts/check-toss-picture-books.mjs` 5개; `pnpm.cmd --filter @t-crossword/toss test` 37개; 토스 `lint`, `build:ait`(타입 검사·119장 dist 이미지 해시·전체 dist 100MB 상한 포함); 웹 `build`(타입 검사/PWA 포함); 초급 `build-gallery.py`, 중·고급 `build-preview.py`와 웹/토스 이미지 변환. Python 명령은 `tmp/picture-book-python/Scripts/python.exe -B`를 사용했으며 세부 명령은 최종 보고서에 기록했다. `git diff --check` 통과. 기존 큰 JS 청크 경고 유지.
- 최신 파일: `apps/toss/t-crossword.ait` **30,159,334바이트**, ZIP 압축 해제 합계 **31,820,241바이트**, WebP **119개**. 실제 ZIP 파일도 열어 개수와 100,000,000바이트 이내를 확인했다. dist는 31,818,214바이트다. 업로드·검수 요청·운영 배포·DB 변경·커밋·푸시는 실행하지 않았다.
- 남은 사용자 기기 검증: 최신 번들을 토스 콘솔 테스트에 올린 뒤 그림책 난이도별 목록·작품 읽기·페이지 이동·해석·뒤로가기·작은 화면 글자·이미지 실패 재시도를 확인한다. 이 콘텐츠의 전체 외부 작품 전수 대조나 독점적 권리 보증은 하지 않으며 앱 공개 책임 주체 표기는 출시 시 확인한다.

## 그림책 편집 검토 (2026-10-19)

- 후속 수정 완료: 초급 14편의 영어·해석과 고급 제목·해석·미스터리 6장/SF 8장을 교정했다. `copied → copy`로 분석되도록 접미사 규칙을 수정하고 `entitled → entity` 오인정을 막았다. 초급 문법어·복수형은 별도 보고하며 본문 기본 어휘는 536종이다. 기존 어휘 데이터 난이도는 변경하지 않았다.
- 내장 ImageGen으로 현재 사용하는 카드 16장의 본문을 보정하고 각각 시각 대조했다. 원본·중간 버전·실제 생성 프롬프트를 보존하며, SF 형제 관계 오류는 별도 정정 기록을 추가했다. 갤러리·어휘 보고서·웹 JSON·WebP를 재생성했다. `draft-unreviewed`와 토스 승인 작품 0편은 유지한다.
- 후속 검증: 임시 Python 3.15/Pillow 13 환경에서 초급 `build-gallery.py`, 중·고급 `build-preview.py`(어휘 검사 포함), `prepare-picture-books.py` 통과. `content/test-vocabulary-audit.py` 회귀 검사 3개, 웹 lint·build(타입 검사 포함), 웹 테스트 38개, `node --test apps/web/scripts/check-build.mjs` 3개 통과. 119장 원본/웹 대응·public/dist 바이트 일치·변경 16장 PNG→WebP 재변환 일치 확인. `git diff --check` 통과. 실제 기기·캐시 갱신·권리 검토는 미실행/미완료이며 기존 큰 청크 경고 유지. 상세 실제 명령은 검토 보고서에 기록했다. 아래 항목은 최초 검토 당시 이력이다.

- 초급 45편·중급 9편·고급 7편, 총 119장의 영어 원문·해석을 읽고 [작품별 검토 보고서](content/picture-book-review-2026-10-19.md)를 작성했다. 초급의 부자연스러운 문장·단복수, 번역 대응, 고급 해석 조사 오타와 SF 인물 보정 기록의 누나/여동생 불일치를 기록했다.
- 기존 어휘 보고서에서 `copied → cop`, `entitled → entity`의 의미상 잘못된 연결을 발견했다. 올바른 기본형·허용 정책을 확인하고 검사기를 고친 뒤 재검사가 필요하다. 콘텐츠·어휘 데이터·이미지·승인 상태는 변경하지 않았다.
- Node 읽기 전용 확인: 원본 119장의 텍스트·해석·페이지 제목과 웹 JSON 일치, 원본 PNG·웹 WebP 존재, 제작 기록 경로 대응 확인. 초급 본문 어휘 537종 및 제목·본문 초급 범위 확인. 이미지 픽셀·변환 최신성 검사는 아니다.
- 시각 확인은 초급·중급 전체 축소 모음과 고급 법정 9·10장 모음, 고급 SF 5장 및 중급 SF 4장 원본에 한정했다. 전체 119장 글자별 재대조·실기기 가독성은 미완료다. Python/py 실행 별칭 접근 오류로 기존 Python 검사·갤러리·웹 변환은 미실행이며 재설치는 하지 않았다.
- OpenAI 이용약관·공유 정책을 다시 확인했으나 제작 계정 계약·기존 어휘 데이터 권한·이미지 글꼴·외부 작품 유사성은 미확인이다. 원본 `draft-unreviewed` 및 토스 승인 작품 0편을 유지한다. 웹 변환기는 미승인 작품도 포함하므로 웹 배포 전 콘텐츠 제공 정책 점검이 필요하다. 문서 변경 후 `git diff --check` 통과. 커밋·푸시·배포 없음.

## 추가 작업 기록 (2026-10-19): 토스 전체 힌트 API의 Supabase 직접 연결

- 사용자 실제 토스 확인: Supabase 직접 연결의 기존 잔액 13개 유지·퍼즐 생성·힌트 1개 차감·완성 보상 +5가 모두 정상 동작한다고 확인했다. 기존 인증 probe 결과와 구분해 전체 Edge 경로 검증으로 기록한다. CPU 여유·부하·동시성·통신 실패 재시도와 계정 무료 사용량은 여전히 별도 확인 대상이다.
- 후속 UI: 사용자 화면에서 오답 안내로 정답 모달이 커지는 문제를 확인해 안내를 남은 횟수와 초기화/소진 후 입력 가능의 두 문장으로 줄이고 입력 칸 위아래 여백·안내 행간을 축소했다. 오답 표시 한도·입력·제출 규칙은 유지한다. 실제 iOS 키보드 상태의 최종 높이는 새 번들로 재확인이 필요하다.
- 모달 축소 검증: `pnpm.cmd --filter @t-crossword/toss test` 35개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사 포함), `git diff --check` 통과. 새 `.ait` 생성 완료·토스 업로드 미실행, 큰 청크 경고 유지.
- 사용자 제공 실제 토스 화면에서 인증 전용 probe 성공을 확인했다. 이어 기존 핸들러·지갑 RPC를 재사용하는 Edge 진입점과 경로 어댑터·번들 빌드를 추가하고 기존 프로젝트에 `toss-hints` v1 ACTIVE 배포를 완료했다. DB 마이그레이션·잔액 변경·유료 전환은 하지 않았다.
- 토스 전용 세션을 처리하므로 함수의 Supabase JWT 검증은 끄고 앱 내부의 mTLS 인증·세션 해시·DB 만료·소유권 검증을 유지한다. probe는 JWT 검증 유지. 기존 HTTPS 허용 Origin을 Secrets로 등록하고 인증서 Secrets는 재사용했다. 실제 비밀은 번들에 넣지 않는다.
- 무시되는 토스 API 주소를 Supabase 직접 주소로 바꾸고 임시 인증 시험 버튼을 비활성화해 최신 `.ait`를 만들었다. PC·터널을 호출하지 않는 새 번들이며 콘솔 업로드·기기 확인은 대기다. 기존 시험 프로세스는 임의 종료하지 않았다.
- 검증: `pnpm.cmd --filter @t-crossword/toss-api test` 20개, API `build:edge`·`build`, `pnpm.cmd typecheck` 전체, 토스 `lint`·`build:ait` 통과. Edge 번들 약 1.83MB, 토스 큰 청크 경고 유지. 원격 health 200/preflight 204/무인증 지갑 요청 401/무효 토스 코드 401/미허용 Origin 403/임의 토큰의 실제 DB 검증 401 확인. `git diff --check` 통과.
- 미검증: 새 Edge 경로의 실제 사용자 잔액·퍼즐 생성 CPU 제한·차감·보상·재시도·동시성, 계정 무료 플랜과 조직 누적 사용량. 무료 호출량 소모 방어·요청 제한은 남은 항목이다. 기존 Node 검증과 구분한다. 커밋·푸시·토스 업로드 없음. 최신 구성은 [무료 출시 문서](docs/toss-free-hosting.md)를 따른다.

## 방향 변경 기록 (2026-10-19): 무료·별도 서버 관리 없는 토스 출시

- 실제 코드 시험 준비: 토스 설정에 시험 빌드 전용 `무료 인증 연결 확인` 버튼과 로컬 `/auth-probe` 중계를 추가했다. SDK가 발급한 코드만 전송하고 비밀 키는 API에만 보관한다. 시험 경로는 명시적 설정·허용 Origin을 요구하며 DB·지갑 호출 없이 성공 여부만 반환한다. PC API와 임시 HTTPS 터널을 시작하고 새 주소를 무시되는 앱 설정에 반영해 `.ait`를 재생성했다. 토스 콘솔 업로드와 실제 버튼 확인은 사용자 진행 대기다. 정식 출시 구성으로 사용하지 않는다.
- 이번 자동 검사: API `build`(타입 검사 포함)·`test` 16개, 토스 `lint`·`build:ait`(타입 검사 포함)·`test` 35개 통과. `git diff --check` 통과. 토스 큰 청크 경고 유지. 인증 코드·키·토큰 출력/앱 번들 포함 없음. Supabase 함수 자체의 추가 배포·DB 변경·커밋·푸시는 하지 않았다.
- 사용자 CLI 로그인 후 승인된 시험 함수 배포 완료: 기존 crossword 프로젝트에 `toss-mtls-probe` v1 ACTIVE, `verify_jwt: true` 확인. 인증서·키·시험 토큰 3개를 Secrets에 등록했다. 토큰 없는 요청은 401, 무효 코드 시험은 함수 502 / 토스 응답 200 / `authenticated: false`를 반환해 hosted mTLS 클라이언트 생성·외부 응답 수신을 확인했다. 실제 유효 코드 인증 성공과 전체 API 이전은 아직 미검증이다. DB·잔액·기존 앱 연결 변경, 유료 전환·결제·커밋·푸시 없음. 임시 등록 파일에서 중복 인증서·키를 제거하고 무시되는 probe 토큰만 보관했다. CLI `.temp`를 Git에서 제외하고 `git diff --check` 통과.
- 후속 배포 준비(사용자 승인 후): Supabase CLI 2.121.0 임시 실행 성공. 기존 인증서·키를 비밀 출력 없이 검사해 일치·현재 유효·PKCS#8 비암호화 형식을 확인했다. `npx.cmd --yes supabase projects list`는 `AccessTokenRequiredError`로 실패해 배포 계정 로그인이 필요하다. 함수 배포와 Secrets 등록은 아직 실행하지 않았으며 키·인증서를 전송하지 않았다. 사용자가 로컬 터미널에서 `npx.cmd --yes supabase login`을 완료하면 승인된 시험 배포를 이어간다. DB·잔액·기존 앱 연결 변경 없음.
- 사용자 확정 기준을 AGENTS.md에 반영했다. 유료 Node 호스팅·Docker 운영 방향을 중단하고 기존 Supabase Edge Functions를 우선 검토한다. Docker 파일은 참고용으로 보존하며 설치나 배포를 요구하지 않는다.
- Deno 공식 mTLS 지원과 Supabase Free 월 함수 50만 회를 확인했다. 실제 Supabase 런타임 장애 보고도 있어 지원 확정과 구분했다. 기존 퍼즐 생성의 Edge CPU 2초 제한·번들·계정 전체 무료 사용량도 검증해야 한다.
- DB·잔액에 접근하지 않는 인증 전용 `supabase/functions/toss-mtls-probe/index.ts`를 준비했다. 게이트웨이 JWT와 추가 probe 토큰으로 제한하고 원문·식별키·비밀을 반환하지 않는다. [근거·시험 절차](docs/toss-free-hosting.md)에 확인 범위와 한계를 기록했다.
- 검증: 문서·소스 검토 및 `git diff --check` 통과. Deno·Supabase CLI가 명령 경로에 없어 Deno 타입 검사·런타임 실행은 미실행이다. 배포·Secrets 등록·실제 mTLS 교환·계정 무료 상태 확인·API 전환·커밋·푸시는 실행하지 않았다. 기존 사용자 설정과 작동 중인 Node 연결은 유지했다.

## 추가 작업 기록 (2026-10-19): 토스 API Docker 배포 준비

- 사용자 선택에 따라 업체에 종속되지 않는 Node 24 다단계 Dockerfile과 전용 허용 목록 방식의 dockerignore를 추가했다. 실행 이미지는 빌드 번들만 포함하고 node 사용자로 실행한다. 인증서·키·환경 파일은 빌드에서 제외하고 실행 시 비공개 설정/읽기 전용 마운트로 전달한다.
- API에 외부 호출 없는 `GET /healthz`와 SIGTERM/SIGINT 종료 처리를 추가했다. 진행 중 요청에 최대 15초를 주고 종료한다. 상태 확인은 DB·인증서 유효성 검사가 아니다.
- [배포 준비 문서](docs/toss-api-deployment.md)에 빌드·실행 예시, 비밀 설정·권한, HTTPS/요청 제한, 배포 승인·실기기 검증·복구 절차를 기록했다. 기존 임시 터널·로컬 비밀 설정은 변경하지 않았다.
- 검증: Node v24.22.0 / pnpm 10.34.7. `pnpm.cmd --filter @t-crossword/toss-api build`(타입 검사 포함) 및 `pnpm.cmd --filter @t-crossword/toss-api test` 14개 통과. `git diff --check` 통과. 새 의존성·lockfile 변경 없음.
- 미검증: Docker 명령이 현재 PC 경로에 없어 이미지 빌드·컨테이너 실행과 종료 신호 검증을 실행하지 못했다. Linux 번들 단독 실행·인증서 마운트 권한·호스팅 HTTPS/프록시 요청 제한·실제 기기 통합 검증이 남아 있다. 호스팅 선택·배포·DB 변경·커밋·푸시는 수행하지 않았다.

## 마무리 기록 (2026-10-18): 토스 앱·힌트 API와 고정 힌트 제목

- 토스 독립 React 18/TDS 앱과 Node 24 mTLS 인증 API, 공통 DTO·퍼즐 응답 검증·서버 전용 데이터 저장소, 토스 전용 지갑 마이그레이션을 정리했다. 웹·토스는 가로/세로 제목·진행 숫자를 고정하고 2열 문제 목록만 스크롤한다. 앱 UI·라우팅은 공유하지 않는다.
- 사용자 확인 기록: SQL Editor 적용, 실제 토스 인증·잔액 조회·힌트 10→9 차감·완성 보상 9→14, 오답노트 등록/숨김·학습 기록 보존. 이번 마무리에서는 기기 검증이나 DB 변경을 추가 실행하지 않았다. 아래 단계별 과거 미구현·미검증 기록보다 이 최신 상태와 앱 README를 우선한다.
- 문서: AGENTS.md의 화면·플랫폼 경계 규칙을 반영하고 구조·제품 사양·웹 보상 문서·토스 README의 현재 구현과 검증 범위를 맞췄다. 콘텐츠 원본은 변경하지 않았다. 토스 그림책은 승인된 작품 0편, 검토 대기 61편을 제외한다.
- 환경: Node v24.22.0 / pnpm 10.34.7. `pnpm.cmd typecheck`, `pnpm.cmd lint` 통과. `pnpm.cmd --filter @t-crossword/core test` 21개, `pnpm.cmd --filter @t-crossword/toss test` 33개, `pnpm.cmd --filter @t-crossword/toss-api test` 13개 통과. 웹은 apps/web에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 38개 통과.
- 빌드: `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/toss-api build` 통과. `node --test apps/web/scripts/check-build.mjs` 3개, `pnpm.cmd install --lockfile-only --frozen-lockfile --offline`, `git diff --check` 통과. 의존성을 재설치하지 않았다. 웹·토스의 500kB 초과 청크 경고는 남아 있다.
- 루트 `pnpm.cmd test`는 기존 packages/utils에 테스트 파일이 없어 실패했다. 관련 core·토스·API·웹 검사는 위 개별 명령으로 모두 통과했으며 루트 전체 테스트 성공으로 기록하지 않는다.
- 남은 작업: 상시 HTTPS API 호스팅·프록시 요청 제한·모니터링·세션/판 보관 정책, 실제 DB 동시성·통신 실패 재시도, 완전 종료 후 저장 기록·가로 회전·키보드·Safe Area·접근성 추가 검증, 그림책 편집·권리 검토와 광고 보상. 모바일 네이티브 검증·별도 배포·토스 업로드는 실행하지 않았다. 임시 터널 API 주소는 빌드 시 포함되므로 운영 전 주소 변경·재빌드가 필요하다.
- 커밋·일반 푸시 결과는 최종 보고에 기록한다. 비밀 환경변수·인증서·빌드 산출물은 커밋에서 제외한다.

## 추가 작업 기록 (2026-10-18): 퀴즈 배치·오답노트 삭제·완성 보상

- [x] 세로 화면은 그리드 위·힌트 아래, 가로 화면은 그리드 왼쪽·힌트 오른쪽으로 배치한다. 퀴즈 화면 높이를 하단 메뉴 위 공간에 맞추고 힌트 영역만 스크롤한다. 방향은 CSS 화면 너비·높이로 판단한다.
- [x] 오답노트에 단어별 삭제 버튼 추가. 숨김 목록을 로컬 저장하며 단어·힌트 사용 이력·즐겨찾기·학습완료 기록을 보존한다. 같은 단어에 다시 힌트를 사용하면 복귀하고 학습완료 초기화 후에도 숨김 상태를 유지한다. 기존 저장 데이터 호환·유효성 검사 포함.
- [x] 오답 붉은색 표시 횟수를 글자 수 × 2회에서 글자 수만큼으로 변경하고 안내 문구를 맞춘다. 창을 다시 열면 초기화되며 소진 후 입력·제출을 계속 허용한다.
- [x] 한 판 완성 시 현재 잔액에 힌트 5개를 추가하는 RPC·게임 훅 연결과 완료 팝업 지급 상태·실패 재시도 UI 구현. 퀴즈 화면에도 완성 보상 안내 추가. 마지막 글자를 힌트로 완성한 경우도 포함한다.
- [x] 서버 지급 기록은 사용자·판 UUID 조합으로 중복 방지하고, 고정 5개 증가와 기록을 한 트랜잭션으로 처리한다. 인증 사용자 자신의 잔액만 갱신하며 광고 보상 RPC 권한은 유지한다. 신규 마이그레이션은 파일만 준비했다.
- [x] `AGENTS.md`, 제품 사양서, PWA 검증 항목과 [완성 보상 문서](docs/puzzle-completion-rewards.md)를 현재 동작에 맞춰 정리한다. 구조 변경이 없어 `PROJECT_STRUCTURE.md`는 유지한다. 그림책 제작 문서는 관련 변경이 없어 유지한다.
- 검증: Node `v24.22.0`, pnpm `10.34.7`; `pnpm.cmd typecheck` 전체 워크스페이스 통과. `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web typecheck` 통과. 마무리 단계에서 마지막 보상 안내 문구까지 포함해 웹 빌드를 통과했고 `node --test apps/web/scripts/check-build.mjs`의 번들·PWA 캐시 검사 3개도 통과했다. 빌드의 500kB 초과 청크 경고는 남아 있다. 의존성 변경·재설치 없음.
- 웹 테스트: `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`, 6개 파일·38개 테스트 통과. 오답노트 기록 보존·재표시와 보상 요청·실패·완료 안내 테스트를 포함한다. 이 테스트는 실제 서버의 중복 지급·동시성 검증을 대신하지 않는다.
- 미실행: 운영 DB 마이그레이션 적용·실제 Supabase RPC/RLS/동시성 통합 검증, 브라우저·스마트폰·태블릿의 화면 회전·스크롤·입력 상호작용, 모바일·Toss 런타임 및 별도 배포. DB 적용 전 보상 지급은 활성화되지 않는다. `psql`·Supabase CLI·Docker가 현재 명령 경로에 없어 로컬 DB 실행 검증도 수행하지 못했다.
- 남은 제한: 완성 판정은 브라우저를 신뢰하므로 변조 앱의 새 UUID 허위 완성 요청은 막지 못한다. 화면 이탈·새로고침 후 보상 요청을 자동 복원하는 영속 대기열은 없다. 서버 판정이 필요한 범위와 배포 전 확인 사항은 보상 문서에 기록했다.
- 마무리 검사: 문서·diff 검토 및 `git diff --check` 통과. 커밋·일반 푸시 결과는 최종 보고에 기록한다.

## 추가 작업 기록 (2026-10-16): 입력 모달·오답노트 및 마무리 절차

- [x] 모달별 오답 붉은색 표시 한도: 글자 수 × 2회. 오답 영문 입력만 차감하고 정답 입력·삭제는 제외한다. 소진 후 입력·제출은 계속 가능하며 재실행 시 초기화한다.
- [x] 남은 오답 표시 횟수와 사용 안내를 모달에 표시한다.
- [x] 힌트 사용 후 기존 입력을 덮어쓰던 동작을 수정한다. 첫 번째 빈 셀에만 글자를 공개하고 빈 셀이 없으면 차감 없이 안내한다. 응답 대기 중 입력·제출을 차단한다.
- [x] 단어장 학습완료 옆에 오답노트 탭 추가. 힌트 차감 성공 시 단어 ID를 중복 없이 로컬 저장하고, 정답을 맞히거나 학습완료 기록을 초기화해도 보존한다.
- [x] 기존 저장 데이터 호환, 중복 방지·복원·초기화 시 보존, 잘못된 기록 검사 테스트 추가. 기존 학습완료·즐겨찾기 기록 유지.
- [x] `AGENTS.md`에 `마무리하자` 명령의 관련 문서 정리·검증·커밋·푸시 절차와 승인 범위를 기록한다.
- 검증: `pnpm --filter @t-crossword/web typecheck`, `pnpm --filter @t-crossword/web lint`, `pnpm --filter @t-crossword/web build` 통과. 기존 로컬 Node 22.23.3/pnpm 실행 파일로 호출했으며 의존성을 재설치하거나 프로젝트 필수 경로로 설정하지 않았다. 실행 시 `--config.verifyDepsBeforeRun=false`를 일회성 적용했다.
- 웹 테스트: `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 실행, 5개 파일·32개 테스트 통과. 추가 문서 변경 후 `git diff --check` 확인. 빌드에는 500kB 초과 청크 경고가 남아 있다.
- 미검증: 사용자가 담당하는 실제 브라우저·아이패드·스마트폰 동작, 모달 상호작용과 온라인 힌트 차감 통합 동작. 이번 변경에 대한 모바일·Toss 런타임 검증은 수행하지 않았다.
- 범위: 오답노트는 이 기기·브라우저에만 저장하며 변경 전 힌트 사용 이력을 소급 복원하지 않는다. 별도 추가된 `깔끔한 크로스워드 퍼즐 아이콘.png`는 이번 작업 커밋에서 제외한다.

## 📌 Phase 1. 모노레포 기반 구축 및 패키지 경계 설정
- [x] pnpm workspace 설정 (`pnpm-workspace.yaml`, 루트 `package.json`, `tsconfig.base.json`)
- [x] 패키지 디렉토리 구조 스캐폴딩
  - [x] `packages/contracts`: 공통 DTO, 인터페이스, 스키마
  - [x] `packages/core`: 프레임워크 독립적 도메인 로직 및 알고리즘
  - [x] `packages/data`: Supabase 데이터 접근 계층
  - [x] `packages/utils`: 순수 유틸리티 함수
  - [x] `apps/web`: React 19 + Vite + Tailwind CSS v4
  - [x] `apps/mobile`: Ionic React 8 + Capacitor 7
- [x] 워크스페이스 간 타입체크(`pnpm typecheck`) 및 패키지 참조 정상 연결 확인

---

## 📌 Phase 2. 도메인 모델 & 코어 알고리즘 (`@t-crossword/core`)
- [x] 도메인 타입 정의 (`packages/core/src/types/index.ts`)
  - `DifficultyLevel`, `GridSize`, `WordItem`, `CrosswordCell`, `CrosswordWord`, `CrosswordPuzzle`
- [x] 단어 길이별 힌트 한도 산출기 (`packages/core/src/utils/hintLimit.ts`)
  - 3~4자: 최대 1개 / 5~6자: 최대 2개 / 7자 이상: 최대 3개 / 3자 미만: 0개
- [x] 십자낱말 탐욕적 자동 배치 알고리즘 (`packages/core/src/algorithms/crosswordGenerator.ts`)
  - 8x8, 10x10, 12x12 격자 크기 지원
  - 단어 교차 검증 및 블록화(단어 간 인접 충돌) 방지 로직
  - 가로/세로 단어 번호 부여 및 셀 번호 동기화
- [x] 단어장 서비스 로직 (`packages/core/src/services/wordBankService.ts`)
- [x] CSV -> `vocab.json` 변환 스크립트 작성 (`scripts/convert-vocab.mjs`)

---

## 📌 Phase 3. 단어 데이터 정제 및 파이프라인 (이전 작업 이력)
> 정제·보강 스크립트와 중간 데이터는 사용자 요청으로 삭제했다. 현재 유지하는 변환 경로는 `words_completed.csv` → `scripts/convert-vocab.mjs` → `packages/core/src/assets/vocab.json`이다.
- [x] 단어 확장/보강 파이썬 파이프라인 (`enrich_words.py`)
- [x] 외래 스크립트(러시아어 키릴, 한자 등) 및 비정상 문자 필터링 장치
- [x] 단어 데이터 오류 자동 수리(Auto-repair) 및 한글 정제 로직 고도화
- [ ] 단어 데이터베이스(`words_completed.csv`) 최종 정제 및 `vocab.json` 반영 *(사용자 진행 중)*

---

## 📌 Phase 4. 웹 화면 구현 (`apps/web`) [기능 구현 진행 중; PWA·실기기 검증 미완료]
- [x] **4.1 게임 상태 관리 훅 (`useCrosswordGame.ts`)**
  - [x] 난이도(`beginner`, `intermediate`, `advanced`) 및 격자 크기(`8`, `10`, `12`) 상태 관리
  - [x] `@t-crossword/core`의 `generateCrossword`를 통한 퍼즐 생성/리셋
  - [x] 글로벌 힌트 지갑(초기 10개) 및 단어별 사용 힌트 카운트 추적
  - [x] 사용자 입력 글자 그리드 매핑 및 단어 일치 검증
  - [x] 전체 단어 완성 감지
- [x] **4.2 메인 십자낱말 보드 (`CrosswordBoard.tsx`)**
  - [x] 8x8 ~ 12x12 격자 그리드 반응형 렌더링
  - [x] 시작 셀 단어 번호(가로/세로) 표시
  - [x] 선택된 단어/셀 하이라이트
  - [x] 그리드는 표시 전용; 가로·세로 힌트 선택 시에만 [정답 입력 모달] 오픈
- [x] **4.3 가로/세로 힌트 목록 (`HintListSection.tsx`)**
  - [x] [가로 힌트] 및 [세로 힌트] 분리 카드형 레이아웃
  - [x] 단어 번호, 품사, 뜻, 글자 수 배지 표시
  - [x] 맞춘 단어 취소선 및 완료 체크 표시
  - [x] 항목 클릭 시 [정답 입력 모달] 오픈
- [x] **4.4 정답 입력 모달 (`WordInputModal.tsx`)**
  - [x] 단어 뜻, 품사, 글자 수 안내 헤더
  - [x] 글자 수만큼의 인라인 입력 셀
  - [x] 자동 포커스 이동 (Auto-Advance) 및 백스페이스 이전 칸 이동/삭제
  - [x] 단어별 힌트 버튼: 단어 한도(0/1, 0/2, 0/3) 표시, 클릭 시 빈 칸 1글자 공개 및 글로벌 힌트 -1 차감
  - [x] 정답 확인 시 보드에 글자 즉시 반영 후 모달 닫힘
- [x] **4.5 퍼즐 완성 축하 모달 (`PuzzleCompletionModal.tsx`)**
  - [x] 완주 축하 메시지 및 사용한 힌트 통계
  - [x] 출제된 단어/뜻 복습 리스트
  - [x] '다음 퍼즐 풀기' 액션
- [x] **4.6 퍼즐 화면 통합 (`QuizPage.tsx`)**
  - [x] 난이도 선택 버튼, 격자 크기(8x8, 10x10, 12x12) 버튼, 힌트 지갑 잔액 배지, '새 퍼즐' 버튼
  - [x] 보드 및 힌트 섹션 배치 (모바일/데스크톱 반응형)
- [x] **4.7 웹 타입 검사 및 프로덕션 빌드**
  - [x] 설치된 Node.js로 웹 `tsc --noEmit`, `vite build` 실행·통과 (상세 검증 이력은 아래 참고)
  - [ ] 최신 변경의 실제 브라우저·스마트폰·태블릿 화면 검증

### 추가 작업 기록 (2026-10-15)

개발 순서: **웹의 모든 기능 구현·검증 → 토스 미니앱 → 하이브리드 앱**. 플랫폼별 UI·라우팅·인증·저장은 분리하고, 퍼즐과 학습 관련 공통 규칙은 공유 패키지에서 관리한다.

#### 퍼즐 생성 및 출제 조건
- [x] 실제 교차를 요구하고 같은 방향 중복 배치·단어 앞뒤 및 측면 인접 충돌 방지
- [x] 교차 셀 보존, 시작 칸만 행 우선 순서로 번호 부여, 같은 시작 칸의 가로·세로 번호 통일
- [x] 원래 배치 외에 시작 단어·순서를 바꾼 8회 추가 시도 후 단어 수가 많은 퍼즐 선택
- [x] 초급: `beginner`, 중급: `beginner` + `intermediate`, 고급: 모든 난이도 포함
- [x] `isQuizUsed === false`인 단어만 출제; `true` 또는 미정의 값 제외
- [x] 정답 제출 또는 힌트로 단어 완성 시 학습완료 처리, 다음 퍼즐에서 제외
- [x] 출제 가능한 미학습 단어가 없으면 안내 표시

#### 화면 및 반응형 레이아웃
- [x] 홈(`/`): 환영 문구, 퍼즐 시작·단어장 버튼; 중앙 이미지는 임시 퍼즐 그림
- [x] 퀴즈(`/quiz`), 단어장(`/word-bank`), 설정(`/settings`) 화면 분리
- [x] 하단 홈·퀴즈 풀기·단어장·설정 메뉴; 본문만 스크롤하고 메뉴 영역 유지
- [x] 타이틀·설정 메뉴·그리드·힌트·단어장·하단 메뉴 폭 기준 정렬
- [x] 스마트폰 화면 폭에 맞춰 축소, 태블릿 등에서는 최대 896px까지 확장
- [x] 좁은 화면도 가로·세로 힌트 좌우 2열 유지; 여백 축소 및 영문 제목 숨김
- [x] 입력 후 그리드 행 높이가 늘어나지 않도록 동일 행 높이 및 셀 최소 크기 조정
- [x] 퀴즈 상단 단어장 링크, 단어장 상단 퍼즐 풀기 링크 제거
- [x] 작은 화면에서도 '새 퍼즐' 버튼 글자 표시

#### 정답 입력 모달
- [x] 방향·번호·길이: '가로 4번, 5자' 또는 '세로 4번, 5자'
- [x] '정답입력', 힌트·잔여 개수·닫기·입력 안내 문구 한국어 적용
- [x] 뜻 아래 영어 예문 표시; 정답 단어를 길이만큼 `_`로 가림
  - 대소문자 무시, 모든 반복 등장 처리, 다른 단어의 일부는 가리지 않음
- [x] 영문 이외의 문자 입력 시 영문 입력 및 한/영 전환 안내; 영문 입력 시 안내 해제
  - 웹에서 운영체제 입력 언어를 강제로 전환하는 기능은 적용하지 않음

#### 기기 학습 기록·단어장·설정
- [x] 웹 어댑터 `wordProgress.ts`: `localStorage`에 학습완료·즐겨찾기 단어 ID 저장
  - 저장 키: `t-crossword.word-progress.v1`; 원본 `vocab.json`은 수정하지 않음
  - 새로고침 후 복원, 다른 탭 저장 변경 반영, 읽기·쓰기 실패 안내
- [x] 단어장 전체·즐겨찾기·학습완료 탭, 단어·뜻 검색, 예문 표시, 즐겨찾기 토글
- [x] 설정: 학습완료 개수 및 학습 기록 초기화
  - 확인 창 후 초기화, 즐겨찾기 유지, 저장 실패 시 기존 학습 기록 보존
- [x] 앱 정보: 앱 이름·패키지 버전(`0.0.0`)·웹 기술 스택 표시
- [x] 앱 정보의 '유민이를 위하여' 문구 제거

#### 검증 이력 및 남은 작업
아래 명령은 `pnpm`이 셸 PATH에 없어 설치된 Node.js 실행 파일로 직접 실행했다.
Node 경로: `C:\Users\Administrator\AppData\Local\Author Software\nvm\installs\v24.21.0\node.exe`.

- [x] `packages/core`에서 `node node_modules/vitest/vitest.mjs run`: 마지막 실행 **20개 테스트 통과** (퍼즐 17개, 예문 가리기 3개)
- [x] `packages/core`에서 `node node_modules/typescript/bin/tsc --noEmit`: 통과
- [x] `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/wordProgress.test.ts`: 마지막 실행 **7개 테스트 통과** (저장·복원·재출제 제외·초기화·실패 처리)
- [x] `apps/web`에서 `node node_modules/typescript/bin/tsc --noEmit` 및 `node node_modules/vite/bin/vite.js build`: 예문 표시 변경까지 통과
  - 이후 고급 그림책 추가까지 웹 lint·타입 검사·빌드를 재실행해 통과했다(아래 그림책 검증 이력 참고).
  - 빌드에서 500kB 초과 청크 경고 발생; 번들 최적화 미완료
- [x] `apps/mobile` 타입 검사: 이전 공유 생성기 변경 시 통과; 이후 변경의 최신 검증은 미실행
- [x] 웹 ESLint 설치·flat config 구성 및 고급 그림책 추가 후 lint 통과 (`docs/lint.md` 참고)
- [ ] 실제 브라우저 및 스마트폰·태블릿에서 레이아웃·모달·하단 메뉴·저장·초기화 검증
- [x] PWA manifest·192/512px 아이콘·빌드 해시별 서비스 워커·업데이트 안내 구현
- [x] 오프라인 로컬 퍼즐·단어장·학습 기록 사용 경로 및 온라인 전용 힌트 안내 구현
- [ ] PWA 설치·오프라인 재실행·업데이트 실제 브라우저/기기 검증
- [ ] 웹 광고 시청·보상 검증 및 힌트 충전 UI 연결
- [ ] 모바일·토스 UI, 기기 저장 및 인증 어댑터 구현 (웹 연결 완료; 토스 저장·1차 UI는 구현했으며 실제 토스 저장·인증과 모바일 연결은 미검증/미완료)

학습완료·즐겨찾기는 해당 브라우저·사이트에 저장되며, 사이트 데이터 삭제 시 사라지고 다른 기기와 동기화되지 않는다. 힌트 잔액은 이 기록과 별개로 Supabase의 사용자별 `hint_balance`를 조회·차감하며, 새 퍼즐에서도 유지한다.

#### 개발 파일 정리
- [x] Aider 캐시 `.aider.tags.cache.v4/` 삭제
- [x] CSV → JSON 변환에 필요한 `words_completed.csv`, `scripts/convert-vocab.mjs` 및 기존 `vocab.json` 유지
- [x] 중간 데이터 삭제: `english_vocabulary_3342_completed.csv`, `word_progress.sqlite3`, `bad_words.txt`, `failed_words.csv`
- [x] 보강·검사·재처리 스크립트 삭제: `enrich_words.py`, `scripts/find_bad_words.py`, `scripts/find_invalid_words.py`, `scripts/run_redo.py`
- [x] 앱 소스·설정·환경 파일·의존성·웹 빌드 결과 유지; JSON 재변환은 실행하지 않음
- 변환 명령 (프로젝트 루트): `node scripts/convert-vocab.mjs words_completed.csv`

#### Vercel / PWA 준비
- [x] 루트 `vercel.json`: 웹 전용 빌드, SPA 경로 rewrite, 서비스 워커 캐시 갱신 헤더
- [x] 웹 build 스크립트에 `node scripts/build-pwa.mjs` 추가; 라이브러리 의존성 추가 없음
- [x] manifest·설치 아이콘·정적 앱 파일 precache; Supabase 응답은 캐시하지 않음
- [x] 새 버전 대기 안내 및 사용자 선택 시 업데이트; 오프라인에서는 힌트 사용 방지
- [x] 웹 `tsc --noEmit`, `vite build`, `node scripts/build-pwa.mjs`, `node --check dist/sw.js` 통과
- [x] 빌드 manifest와 PNG 아이콘의 192/512px 크기 확인
- [ ] Vercel 프로젝트 연결·환경 변수 설정·실제 배포 및 런타임 검증
- 배포 설정과 기능 범위: `docs/vercel-pwa.md` 참고. 배포 주소마다 기기 학습 기록 저장소는 분리된다.


---

### 그림책 콘텐츠와 읽기 화면

- [x] 하단 `그림책` 메뉴, 초급·중급·고급 선택 및 작품별 한글 해석 연결
- [x] 초급 동시·삽화 45편, 본문에서 초급 단어 537종 사용
- [x] 중·고등학생용 중급 9편·36장: 시·창작 에세이·소설 각 3편 (소설: SF·무협·환생 각 8장)
- [x] 성인용 고급 7편·38장의 영어 원문·한글 해석 작성: 시 2편(각 1장), 에세이 2편(각 3장), SF·현실 미스터리·법정 드라마 소설 각 1편(각 10장)
- [x] 고급 삽화 38장 제작·원문 대조·웹용 변환과 최종 연결 검증 (누적 웹용 이미지 119장)
- [x] 다중 페이지 이전·다음·목록 복귀, 페이지별 해석과 직접 접근 URL 연결
- [x] 난이도별 누적 어휘와 명시된 기본 문법어·활용형·파생형 검사 및 제작 기록 작성 (고급: 기본 어휘 594종, 고급 목록 135종 포함)
- [x] 고급 추가 후 웹 lint·typecheck·build, 웹 테스트 20개, 고급 원본·제작 기록·웹 JSON·빌드 이미지 대조, 서비스 워커 문법 검사 통과
  - 기존 500kB 초과 번들 경고는 남아 있음. 브라우저·기기 검증과 배포 전 편집·권리 검토는 별도.
- [ ] 실제 브라우저·기기에서 읽기·페이지 이동·오프라인 이미지 동작 검증 (사용자 확인 예정)
- [ ] 배포 전 콘텐츠 편집·권리 검토
- 콘텐츠와 검수 자료: `content/beginner-poems/`, `content/intermediate-readings/`, `content/advanced-readings/`. 웹용 이미지·목록 갱신: `python scripts/prepare-picture-books.py`.

### 초기 JavaScript 번들 최적화 (2026-10-16)

- [x] 홈을 제외한 퀴즈·단어장·그림책·설정을 경로별 동적 import로 분리하고 로딩·실패 안내 추가
- [x] 그림책 데이터와 공통 단어 데이터를 초기 홈의 정적 의존성에서 분리 (도메인 패키지 API 변경 없음)
- [x] 서비스 워커 등록을 페이지 load 이후 유휴 시간으로 지연; 분리된 JS는 설치 캐시에 포함해 기존 오프라인 메뉴 범위 유지
- 빌드 비교: 초기 JS 1,750.99kB → 557.27kB (약 68% 감소), Vite gzip 표시 491.88kB → 164.78kB. 전체 배포 용량과 설치 캐시 다운로드 총량을 줄인 수치는 아니다.
- [x] 웹 `lint`·`typecheck`·`build` 통과. 기존 로컬 pnpm 실행기에 `--config.verifyDepsBeforeRun=false --filter @t-crossword/web`를 지정해 각각 실행했다.
- [x] `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`: 웹 테스트 29개 통과
- [x] 루트에서 `node --test apps/web/scripts/check-build.mjs`: 초기 정적 의존성·메뉴 precache·오프라인 JS 응답 검사 3개 통과
- [x] `node --check apps/web/dist/sw.js`, `git diff --check` 통과
- 500kB 초과 청크 경고는 초기 공통 코드와 별도 단어 데이터에 남아 있다. 실제 브라우저·기기에서의 로딩 시간·PWA 설치·업데이트 확인은 사용자 확인 예정이며, 실제 배포 완료 여부는 별도 확인한다.

### 지침·연계 문서 동기화 (2026-10-16)

- [x] `AGENTS.md` 14~15절과 구조·사양서·그림책 README·lint/PWA 문서 연결
- [x] 사양서의 과거 공유 UI·통합 앱 경로·core 내 Supabase 배치 지침과 실행 명령을 현재 패키지 경계에 맞게 정리
- [x] Aider 읽기 설정에 사양서·진행표 추가 (실제 세션의 자동 로딩 여부는 별도 확인)
- 문서·읽기 설정만 변경했으며 앱 코드·의존성·배포 설정은 변경하지 않았다. 이 작업의 검증은 로컬 참조 경로·명령 대응·공백 검사이며, 위 실행 검사 이력과 구분한다.

## Phase 5. Supabase backend integration and hint RPC (implementation complete; project verification pending)

- [x] Create `user_profiles` schema with RLS, anonymous-user profile creation, and secure hint RPCs.
- [x] Add typed Supabase client and data functions for reading balances, atomically consuming hints, and server-only ad rewards.
- [x] Connect the web app to persistent anonymous Supabase sessions and the server-side hint balance.
- [ ] Configure root `.env.local`, enable anonymous sign-ins, apply the migration, and verify against a real Supabase project.
- [x] Restrict ad reward grants to `service_role` and provide a data helper for a trusted server; ad-platform verification remains in Phases 6 and 7.

## 📌 Phase 6. Toss 미니앱 구현 (`apps/toss` - Apps in Toss)

### 힌트 후속 구현 및 인증서 설정 (2026-10-18)

- 사용자 확인으로 최신 세로 화면의 난이도/크기 한 줄·힌트 목록 표시·스크롤과 설정 학습 초기화가 정상 동작함을 확인했다. 가로 회전 결과와 초기화 후 모든 보존 항목의 실기기 검증은 별도다. 하단 메뉴 명칭은 줄바꿈을 막았고, 상단 제목 여백은 위 56→44px·아래 16→12px로 줄였다. 토스 버튼과의 실제 간격은 새 번들에서 재확인이 필요하다.

- 실기기 퀴즈 레이아웃 회귀 수정: 난이도/크기 버튼이 두 줄로 내려가고 보드가 힌트 목록 공간을 소진하는 화면을 확인했다. 토스 설정 바를 고정 2그룹×3버튼의 한 줄 grid로 바꾸고, 세로 화면의 남은 공간을 보드/힌트에 3:2로 배분하며 힌트 최소 120px를 확보했다. 보드는 크기가 정해진 부모의 가로·세로 container 단위 중 작은 값에 맞춰 축소한다. 가로 화면은 좌우 배치를 유지한다. `apps/toss/src/styles.css`만 실행 코드 수정. 토스 `lint`·`build:ait`(타입 검사 포함), `git diff --check` 통과. CSS 배치 수정이라 동일 로직 테스트는 반복하지 않았으며 실제 iPhone 재확인·회전 검증은 대기다.

- 다음 단계 구현: 토스 하단에 그림책·설정을 추가했다. 그림책은 난이도·목록·읽기·이전/다음·목록 복귀·페이지별 해석·스크린리더 영어 원문·이미지 실패 재시도·AI 활용 고지를 제공하고 SDK 뒤로가기는 읽기→목록→홈으로 처리한다. 공통 원본에서 토스 소유 파일을 생성하는 `scripts/prepare-toss-picture-books.mjs`를 추가했다. 현재 원본 61편 모두 편집/권리 검토 전이므로 포함하지 않았다(승인 작품 0편). 원본의 명시적 `approved` 상태만 허용하며 토스 UI에는 준비 안내를 표시한다. 읽기 UI는 독립 테스트용 2쪽 자료로 검사했다. 실제 작품·삽화 연결은 미완료다.
- 설정의 학습 기록 초기화는 확인 창 후 저장 성공 시에만 반영하고 현재 판을 종료한다. 즐겨찾기·오답노트·힌트 잔액을 보존하며 저장 실패 시 기존 기록을 유지한다. 원격 DB 삭제·지갑 변경은 없다. 현재 기기에서 초기화한 기록이 완료 단어 재출제 기준이다.
- 이 단계 검증: `pnpm.cmd --filter @t-crossword/toss test` 33개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(콘텐츠 준비·타입 검사 포함), `git diff --check` 통과. 큰 청크 경고 유지. 실제 기기 메뉴·초기화·읽기·뒤로가기 검증은 미실행. 새 `.ait` 생성, 업로드·배포는 미실행이며 API·터널은 테스트용으로 유지했다.

- PWA·토스 힌트 스크롤 공통 개선: 가로/세로 제목과 진행 숫자를 스크롤 영역 밖의 고정 2열 헤더로 분리했다. 그 아래 가로·세로 문제 목록만 하나의 영역에서 함께 스크롤하며 화면 방향을 바꿔도 두 제목이 항상 보인다. 바깥 힌트 영역은 스크롤하지 않는다. 키보드 포커스는 내부 문제 목록에 제공한다. 웹 `HintListSection.tsx`·`QuizPage.tsx`, 토스 `App.tsx`·`styles.css` 수정.
- 검증: 웹/토스 각각 `lint`·타입 검사를 포함한 `build`/`build:ait` 통과, 토스 테스트 31개 통과. 큰 청크 경고 유지. 실제 브라우저·토스 기기의 가로/세로 스크롤 확인은 미실행이다. 최신 `.ait` 생성 완료, 배포·업로드 미실행.

- PWA와 토스의 홈/퀴즈 흐름 일관성 요청 반영: 토스 홈을 퍼즐 그림·동일한 환영 문구·퀴즈 시작/단어장 관리 버튼으로 변경하고 난이도·크기 설정을 퀴즈 내부로 이동했다. 설정 변경은 선택한 값으로 새 판을 생성하며 성공 후 선택 상태를 반영한다. 홈 왕복은 기존 판을 유지한다. 하단 메뉴에 독립 SVG 아이콘과 명칭을 함께 표시하고 상단 도구 겹침을 줄이도록 여백을 보완했다. TDS·토스 인증·저장·지갑과 독립 UI 경계를 유지한다. 그림책·설정은 후속 구현이다.
- 검증: `pnpm.cmd --filter @t-crossword/toss test` 31개(홈→단어장/퀴즈·설정 변경 전달·홈 왕복 시 판 보존 회귀 포함), `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사 포함) 통과. 큰 청크 경고 유지. 실제 토스 재업로드 후 홈·상단 여백·회전·작은 화면 검증은 미실행이다.
- 사용자가 오답노트에서 삭제한 `UGLY`가 학습완료 목록에 남아 있음을 확인했고, 새 번들의 동의어 보라색 반영도 확인했다.

- 추가 사용자 화면 확인: 오답노트 `UGLY` 1개에서 삭제 후 0개·빈 목록 안내로 전환됐으며 학습 10개·힌트 14개는 유지됐다. 마지막 홈 화면에도 같은 학습·잔액과 새 퍼즐 시작 버튼이 표시된다. 전체/학습완료 목록에서 `UGLY` 원본 유지 여부, 완전 종료·재접속 수행 여부와 미완성 판의 종료 후 미복원은 이 화면만으로 확정하지 않는다.

- 실제 토스 후속 검증: 사용자가 힌트 사용 단어의 오답노트 등록을 확인했다. 이어 제공한 완료 화면에서 초급 8×8 판의 10/10 완료·학습 10개와 완성 보상 안내, 잔액 9→14(+5)를 확인했다. 힌트 공개·차감·오답노트 등록·판 완성 보상까지 실제 사용자 흐름이 검증됐다. 오답노트 삭제 후 원본/기타 기록 보존, 앱 종료 후 잔액·학습 기록 유지 및 퍼즐 미복원은 확인 대기다.

- 사용자 제공 실제 토스 화면에서 4글자 문제의 힌트 사용 후 첫 글자 `U` 공개, 잔액 10→9, 단어별 사용량 1/1과 한도 도달 시 버튼 비활성화를 확인했다. 오답 표시 남은 횟수 4/4도 표시된다. 오답노트 등록 및 완성 보상 5개는 아직 별도 확인 대기다.
- 단어장 동의어 색상을 힌트와 같은 보라색(`#6d28d9`)으로 변경했다(`App.tsx`, `styles.css`). 토스 `build:ait`(타입 검사 포함)·`lint`·`git diff --check` 통과. 새 번들을 생성했으며 해당 단어장 색상의 실제 기기 반영은 별도 확인이 필요하다.

- 실제 토스 인증 후속 결과: 네트워크 제한 밖에서 API를 재시작한 뒤 사용자가 휴대폰에서 힌트 잔액 표시 성공을 확인했다. 실제 토스 인증·서버 지갑 잔액 조회 경로가 동작함을 확인했다. 힌트 1개 차감·오답노트 등록·판 완성 보상 5개와 재시도/재실행 검증은 아직 별도 확인이 필요하다. 앞선 실패 상태와 재시도 대기 기록은 이 결과로 갱신된다.

- CORS 수정 후 실기기에서 사용자 확인 실패가 표시됐다. 서버의 외부 통신 제한 가능성을 확인하기 위해 사용자 도구 승인 후 API를 네트워크 제한 밖에서 재시작했다. 선택적 인증 진단에 HTTP 상태·제한된 오류 코드/전송 코드만 추가했다. 토큰·인증 코드·인증서·응답 본문은 출력하지 않는다. API `build`와 `test` 13개, `git diff --check` 통과. 실제 인증 재시도 결과 대기 중이며 원인 확정·인증 성공으로 기록하지 않는다.

- 실기기 초기 `Load failed` 원인 확인: 서버에서 실제 테스트 Origin `https://t-crossword.private-apps.tossmini.com`의 CORS 차단을 확인했다. 로컬 API 허용 목록에 이 정확한 Origin을 추가하고 재시작했다. 진단은 환경 변수로 선택하는 거부 Origin 정규화 출력만 추가했으며 요청 본문·토큰·키는 출력하지 않는다. API 타입 검사/빌드는 통과했다. 실제 인증 성공 여부는 재시도 확인 대기다.

- 임시 HTTPS 준비: 사용자 요청으로 공식 Cloudflare `cloudflared` 2026.10.1을 PC 임시 폴더에 내려받아 로컬 API(8787) 터널을 실행했다. 무시되는 토스 `.env.local`에 발급된 HTTPS API 주소를 설정하고 `pnpm.cmd --filter @t-crossword/toss build:ait`를 다시 실행해 성공했다(큰 청크 경고 유지). 외부 HTTPS에서 CORS preflight 204와 미인증 요청 401을 확인했다. 사용자·잔액 변경은 없다. 실제 미니앱 실행 Origin 등록·콘솔 테스트 업로드·토스 인증은 아직 미실행이다. 재시작 시 주소 변경 가능성과 설정 절차는 API README에 기록했다.

- 후속 실제 연결 확인: 사용자가 SQL Editor 실행 성공 화면을 제공했다. 실제 Supabase의 `get_toss_hint_balance`에 존재하지 않는 세션 해시로 요청하여 서버 키는 예상한 `toss_session_expired`(28000), 공개 anon 키는 권한 거부(42501)를 반환함을 확인했다. 사용자 생성·잔액 변경은 없었다. 서버 전용 키 설정도 완료됐으며 키 값은 출력하지 않았다. 아래 DB 미적용·키 미설정 기록은 이 확인 전 상태다. 모든 테이블의 실제 RLS 조회·실제 토스 인증/차감/보상 통합 검증은 아직 미실행이다.

- 별도 `apps/toss-api` Node 24 서버, 토스 인증 코드 mTLS 교환, 공유 DTO·퍼즐 응답 검증·데이터 저장소와 토스 전용 지갑 SQL을 구현했다. 최초 10개, 한 글자당 1개 차감, 단어별 한도, 재시도 중복 차감 방지, 모든 정답 검증 후 판당 5개 지급을 처리한다. 기존 웹 지갑은 유지한다.
- 토스 화면의 잔액·힌트·오류 재시도·공개 글자 보존·오답노트 등록/재표시를 연결했다. 서버 URL이 없으면 힌트와 보상은 비활성이다. 아래 초기 기록의 힌트 미구현 상태는 이 기록으로 갱신된다.
- 사용자 제공 외부 폴더에서 인증서·개인 키 파싱, 키 쌍 일치와 현재 유효기간을 확인했다. 내용을 출력하지 않았다. 무시되는 API `.env.local`에 파일 경로와 기존 공개 Supabase URL을 설정했다. 서버 전용 키는 빈 값이며 프런트 서버 URL은 아직 활성화하지 않았다.
- 검증 통과: `pnpm.cmd typecheck`; `pnpm.cmd --filter @t-crossword/toss test` 30개; `pnpm.cmd --filter @t-crossword/toss-api test` 13개; `pnpm.cmd --filter @t-crossword/core test` 21개; 토스 `lint`·`build:ait`, API `build`, 웹 `build`. SQL은 PGlite에서 권한·소유권·한도·잔액·보상·멱등성을 검사했다. 실제 Supabase 부하 검증은 아니다.
- lockfile 기존 비토스 importer 보존 및 참조 1,376개 확인. `pnpm.cmd install --lockfile-only --frozen-lockfile --offline` 통과. 큰 청크 경고는 유지된다.
- 미실행: 실제 DB 마이그레이션 적용, 서버 전용 키 설정, 실제 mTLS 교환·HTTPS/CORS·토스 기기 통합 검증, 업로드·배포·커밋·푸시. 설정과 경계는 `apps/toss-api/README.md`, `docs/decisions/20261018-toss-hint-api.md` 참조.

- [x] `apps/toss` 스캐폴딩 (SDK 3.8.0 + 독립 Vite, `apps-in-toss.config.ts`)
- [x] React 18 + TDS Mobile/AIT 2.5.1 기반 홈·퍼즐 설정·퀴즈·정답 입력·완료 복습·단어장 1차 UI
- [x] 공유 core 공개 API로 퍼즐 생성·예문 마스킹·어휘 사용, 완료 단어 재출제 제외
- [x] 토스 SDK Storage/브라우저 별도 저장 어댑터, 학습완료·즐겨찾기 복원, 비동기 순차 저장·실패 재시도
- [x] SDK 뒤로가기 구독과 TDS Safe Area 연결 (실제 토스 동작 미검증)
- [x] `t-crossword.ait` 생성 성공; 업로드·배포 미실행
- [x] 글자별 입력·교차 셀 보존·오답 표시 횟수 및 중앙 정렬 정답 창
- [ ] 웹과의 나머지 기능 대응: 오답노트 힌트 등록 연동·그림책·설정
- [ ] Toss SDK 연동 (사용자 인증, 토스 리워드 광고)
- [ ] 서버 힌트 차감·완성 보상 5개와 토스 인증 사용자 연결
- [ ] Toss 샌드박스 환경 동작 검증

### 토스 1차 작업 기록 (2026-10-18)

- 정답 입력 창을 비교 이미지에 맞춰 중앙 정렬·보라색 동의어·글자별 칸으로 변경했다. 이미 완성된 교차 셀은 읽기 전용이며 포커스·방향키·백스페이스는 수정 가능한 셀로 이동한다. 올바른 단어 완성 시 한 번 자동 제출하고 수동 제출도 유지한다. 오답 붉은색 표시는 글자 수만큼 제공하고 정답 글자·삭제·한글 입력은 차감하지 않는다. 소진 후에도 입력·제출을 허용하며 재실행 시 초기화한다. 힌트 버튼은 실제 서버 미연결을 나타내는 `힌트 준비 중`으로 비활성화한다. 보드와 입력 창의 공개 셀 계산은 토스 전용 표시 도우미로 통일했다.
- 힌트 카드 왼쪽 정렬 및 동의어 보라색(`#6d28d9`) 요청도 반영했다. 웹 앱 화면·훅을 import하지 않고 토스 전용 UI를 유지한다.
- 입력 회귀 테스트를 위해 MIT `jsdom` 26.1.0을 토스 개발 의존성으로 추가했다. 최초 DOM 테스트에서 개발 도구가 공유 core 파일에 패널 import를 주입하는 문제를 발견해 플러그인을 개발 서버에만 적용하도록 수정했다. jsdom의 dialog·matchMedia·Safe Area 부재와 초기 포커스 타이머 대기는 테스트 환경에서 보완했다. 실제 토스 SDK 검증으로 간주하지 않는다.
- 검증: `pnpm.cmd --filter @t-crossword/toss test` 3개 파일·21개 통과. 교차 셀 보존·자동 제출 중복 방지·오답 표시 한도·소진 후 제출·정답/삭제/한글 입력 제외·백스페이스·재실행 초기화·빈 칸 안내를 DOM 조작으로 확인했다. `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/toss lint` 통과. lockfile의 기존 앱 해석을 보존하고 스냅샷 참조 1,371개를 확인했으며 `pnpm.cmd install --lockfile-only --frozen-lockfile --offline`·`git diff --check` 통과. 큰 청크 경고는 유지된다. 실제 브라우저·토스의 가상 키보드·레이아웃·포커스는 미검증이다.

- 웹 대비 퀴즈 안내 누락 보완: 상단에 `한 판을 모두 완성하면 힌트 5개를 드려요.`와 `보상 기능 준비 중`을 함께 표시했다. 실제 서버 지급 기능은 아직 미연결이다. 가로·세로 힌트 카드를 토스 전용 `ClueButton`으로 분리해 동의어가 있으면 별도 줄에 표시하고 빈 동의어는 생략한다. 추가 안내 높이를 반영해 가로 화면의 보드 높이를 조정했다.
- 해당 변경 검증: `pnpm.cmd --filter @t-crossword/toss test` 16개 통과(가로·세로 동의어 표시/빈 값 생략 포함), `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 실제 브라우저·토스 기기에서 긴 동의어 줄바꿈·회전·가독성 확인은 미실행이며 큰 번들 경고는 유지된다.

- 오답노트 누락 보완: 토스 단어장에 네 번째 탭·목록 필터·빈 목록 안내·목록에서만 삭제하는 버튼을 추가했다. 힌트 이력과 숨김 ID를 별도로 저장하고 기존 학습완료·즐겨찾기 기록을 보존한다. 힌트 사용 기능은 아직 토스에 없어 실제 플레이에서의 등록·재표시는 후속 연동 대상이다. 웹 오답노트를 자동 이전하거나 오답 제출을 힌트 사용으로 간주하지 않는다.
- 이 변경의 검증: `pnpm.cmd --filter @t-crossword/toss test` 14개 통과, `pnpm.cmd --filter @t-crossword/toss build:ait`와 `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 기존 기록 호환·숨김 후 저장 복원·다른 기록 보존·잘못된 필드 거부를 검사했다. 실제 브라우저 상호작용·토스 런타임 확인은 미실행이다.
- 이어 하기 범위 확정: 사용자 요청에 따라 앱을 켜 둔 동안만 지원한다. 종료·새로고침 후 진행 중 퍼즐 복원은 후속 구현 대상에서 제외하며 학습완료·즐겨찾기 등 기록 저장은 유지한다.

- 콘솔 등록 후 빌드 구성 확인: 사용자가 앱 이름 `영어 퍼즐`, `appName: t-crossword`, 앱 유형 `게임`으로 생성했다고 확인했다. `apps-in-toss.config.ts`의 `appName`·`webBundleDir: dist`·Vite 출력 및 `.ait` 생성 명령을 확인하고 토스 HTML/화면 제목을 `영어 퍼즐`로 맞췄다. SDK 3.8.0에 없는 예전 이름·게임 유형 필드를 추가하지 않았으며 콘솔 정보는 README에 기록했다. 콘솔 직접 조회·업로드·배포는 미실행이다. 아래 콘솔 미등록 기록은 1차 구현 시작 당시의 상태다.
- 등록 정보 반영 후 `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·웹 빌드·`t-crossword.ait` 생성), `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 큰 청크 경고는 유지되며 이름 변경에 무관한 기존 테스트를 반복하지 않았다.

- 콘솔 미등록 상태로 사용자와 `appName: t-crossword` 합의. 앱 SDK/TDS는 `apps/toss`에만 설치하고 다른 앱 UI·라우팅은 가져오지 않았다. TDS의 React 18 peer 요구를 따르며 웹의 React 19는 유지한다. 개발 도구 때문에 토스 패키지 Node 조건은 24 이상이다.
- SDK 3.x는 이전 Granite 설정·개발 명령과 달라 실제 설치한 CLI 도움말·설정 타입을 확인했다. Vite 5174 포트·공식 개발 도구 플러그인·`apps-in-toss.config.ts`로 구성했다. 상세 명령·이용 범위·남은 기능은 [토스 README](apps/toss/README.md)에 기록했다.
- 검증: `pnpm.cmd --filter @t-crossword/toss build:ait`로 타입 검사·프로덕션 Vite 빌드·`.ait` 생성 성공. `pnpm.cmd --filter @t-crossword/toss lint` 및 `pnpm.cmd typecheck` 전체 통과. `pnpm.cmd --filter @t-crossword/toss test`는 2개 파일·10개 테스트 통과. 최초 모달 렌더 테스트는 TDS Provider 누락으로 실패했으며 실제 앱과 동일한 Provider를 적용해 통과했다.
- SDK/TDS 의존성 추가로 `pnpm-lock.yaml` 갱신. pnpm 10이 기존 모바일 Ionic/react-router 연결까지 바꾼 것을 diff에서 발견해 기존 워크스페이스 importer·패키지·스냅샷을 보존하고 토스에 필요한 항목만 추가했다. 모든 기존 importer 해석 결과 동일 및 스냅샷 참조 1,255개 연결 확인. `pnpm.cmd install --lockfile-only --frozen-lockfile --offline` 통과. 모듈까지 설치하는 frozen 재검증은 pnpm의 비대화형 모듈 재구성 요구로 중단되어 임의 삭제·재설치를 수행하지 않았다. `protobufjs` 빌드 스크립트는 임의 승인하지 않았다. 토스 번들 약 2.33MB(gzip 약 687kB) 및 큰 청크 경고가 있어 초기 로드 최적화가 남아 있다.
- 추가 확인: `pnpm.cmd --filter @t-crossword/toss dev` 시작 성공, `http://localhost:5174/` 및 `/src/main.tsx` HTTP 200·엔트리 모듈의 개발 도구 주입 확인. 프로덕션 산출물에서 `ait-devtools`, `__AIT_DEVTOOLS`, `AitDevtoolsPanel`, `DEFAULT_STATE` 표식은 발견되지 않았다. 표식 검사만으로 개발 도구 코드 부재를 완전히 증명하지는 않는다. React 18 설치 이후 기존 웹의 `pnpm.cmd --filter @t-crossword/web build`도 통과했고 웹 산출물 해시가 이전과 동일했다. `git diff --check` 통과.
- 미실행: 실제 브라우저 상호작용·토스 샌드박스·토스앱, 네이티브 저장·뒤로가기·Safe Area·키보드·회전·포커스·기기 성능, 로그인·광고·서버 보상 통합과 업로드·배포. 콘솔 등록은 사용자가 완료했다고 확인했다. 기존 웹·모바일 UI 코드는 변경하지 않았다. HTTP 응답·렌더 테스트·개발 모의 실행을 기기 검증으로 간주하지 않는다.

---

## 📌 Phase 7. Mobile 앱 구현 (`apps/mobile` - Ionic + Capacitor)
- [x] Android 네이티브 기반·모바일 홈/퀴즈/단어장 1차·기기 Worker 공통 출제·로컬 기록
- [x] 모바일 타입 검사·저장 회귀 테스트·웹 빌드·Android sync
- [x] 그림책 61편/119장·글자별 입력·오답노트 숨김 삭제/복귀·Android 뒤로가기 코드 구현
- [x] 독립 Ionic UI에 홈/퀴즈/단어장/그림책 흐름·힌트 번호 정렬·그리드 트랙·읽기 화살표/해석/목록 반영
- [x] Android 프로젝트 설정·공식 App 7.1.2 플러그인 등록·Android sync
- [x] 모바일 익명 인증·서버 힌트 연결 코드와 로컬 자동 검사
- [ ] 모바일 운영 인증 설정·mobile-hints 배포·실제 가입/힌트 차감/완성 +5 검증
- [ ] 네이티브 저장 보강·세션 상실 정책과 입력/뒤로가기/그림책 최종 기기 검증
- [ ] iOS 프로젝트 설정·네이티브 통합·기기 검증
- [ ] AdMob 배너 연결·실제 높이 반영(현재 96px 가상 영역)
- [ ] AdMob 보상형 동영상 광고 플러그인 연동 (광고 시청 -> 힌트 충전)
- [ ] 모바일 기기/에뮬레이터 동작 검증

### 2026-10-21 소설·에세이 해석 문체 개선

- 중급·고급 소설·에세이 11편 69장의 영어 원문과 해석을 대조하고 55장의 직역투·추상적 표현·대사를 자연스럽게 다듬었다. 영어 원문·이미지·제목·시 작품은 변경하지 않았다.
- 원본 `books.json`, 웹·토스 파생 JSON, 검수 갤러리와 작품별 번역 검토·승인 해시를 갱신했다. 상세 범위와 한계: `content/translation-review-2026-10-21.md`.
- 검증 통과: 중급·고급 `build-preview.py`(어휘·이미지·제작 기록 검사 포함), `python scripts/prepare-picture-books.py`, `node scripts/prepare-toss-picture-books.mjs`, `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/web build`, `pnpm.cmd --config.verifyDepsBeforeRun=false --filter @t-crossword/toss build`, `git diff --check`. 두 빌드에 청크 크기 경고가 남아 있다.
- 원본은 해석만 55장 변경되었음을 HEAD 비교로 확인했다. 실제 브라우저·토스 기기 확인, 배포·업로드는 미실행.
