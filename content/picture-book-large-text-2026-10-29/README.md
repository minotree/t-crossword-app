# 중급·고급 그림책 본문 확대

**2026-10-30 사용자 결정: 본문 확대를 철회하고 원래 이미지/단락 배치로 복원했다.** 현재 앱은 확대 전 중급 36장·고급 38장과 기존 WebP를 사용한다. 듣기·연속듣기 UI와 광고/반복 로직은 유지한다. 아래 확대 기록과 index.html은 비교 이력이며 현재 앱 적용본이 아니다. 현재 원본 갤러리는 각 intermediate-readings/index.html과 advanced-readings/index.html이다. 확대본 PNG/제작 기록은 삭제하지 않았다. 복원 직전 파일도 `artifacts/picture-book-before-original-layout-20261030.zip`에 보존한다.

2026-10-30 페이지 표시 수정(v3): `현재 / 전체`를 본문 아래에서 **제목·소제목 아래 오른쪽**으로 옮겼다. 모든 카드의 겹침·경계와 v2 대비 본문 픽셀 보존을 검사했다. 대표 장면은 The Memory Deposit 7/10을 확인했다. 현재 index.html은 v3이며 v2 비교는 index-v2.html에 보존한다. 제목 88px·소제목 72px·본문 64px는 유지한다.

v3 직전 백업(866개 파일, 528,977,916바이트)은 `artifacts/picture-book-page-number-backup-20261030/`에 보관한다. v2로 복원하는 명령은 `python scripts/backup-picture-book-layout.py restore --backup-dir artifacts/picture-book-page-number-backup-20261030`이다. 이후 변경이 있으면 복원은 쓰기 전에 중단한다. 복원 후 비교는 index-v2.html을 사용하고 앱 빌드를 다시 수행한다. 백업은 Git 제외 대상이다.

2026-10-30 후속 수정(v2): 제목 **88px**, 소제목 **72px**, 본문 **64px**로 크기 순서를 바로잡았다. v1 이미지와 조판/검수 기록(`*-v1.json`, `index-v1.html`)을 보존했다. 당시 비교 화면은 index-v2.html에 보존했다. 모든 페이지의 줄 범위·원문 대응을 검사하고 대표 4장의 시각 대조를 수행했다. 기존 전체 시각 검수와 이번 대표 검수를 구분한다.

v2 직전 상태 718개 파일은 `artifacts/picture-book-hierarchy-backup-20261030/`에 별도로 보관한다. 이 백업은 Git 제외 대상이다. 원래 백업의 완료 해시를 덮어쓰지 않았다. v1로 복원하려면 `python scripts/backup-picture-book-layout.py restore --backup-dir artifacts/picture-book-hierarchy-backup-20261030`을 실행한다. 이후 변경 보호 규칙은 동일하다. 비교 갤러리와 조판 보고서는 백업 범위 밖이므로 v1로 복원한 후에는 보존된 `index-v1.html`을 사용하고 앱 빌드를 다시 수행한다.

2026-10-29 시작, 2026-10-30 검수. 중급 36장과 고급 38장의 기존 삽화 상단을 그대로 보존하고 본문 영역을 Pillow로 다시 조판했다. AI 이미지 생성 호출은 0회다. 영어·해석·제목·페이지 순서와 작품 수는 유지한다.

- 본문 Source Serif 4 Regular 64px, 줄 간격 88px. 제목 88px·소제목 72px Semibold. 1024px 폭, v2 높이 1980~2546px(v1은 1918~2376px). 작은 화면에서는 세로 스크롤이 늘어난다.
- 기존 장식 테두리와 종이 질감의 본문 영역은 단색 크림 패널로 교체했다. 삽화는 기록된 crop 영역에서 픽셀 단위로 보존했다.
- 원본 PNG는 보존하며 `-large-text-v1.png`를 제작했다. 현재 연결은 v3다. 중급 기존 제작 기록은 `generation-records/revisions/before-large-text-20261029/`에 보존한다. 고급은 새 이미지 이름의 별도 기록을 사용한다.
- [전후 비교](index.html), [조판 기록](render-report.json), [시각 검수](visual-review.json). 원본 74장과 새 카드 전체의 19개 검수 시트를 대조했다. 글자 잘림·잔여 원문·제목·페이지 번호를 확인했다. 실제 휴대폰·토스 기기 검증은 별도다.
- 글꼴은 Adobe 공식 Source Serif 저장소의 고정 revision에서 받은 변경 없는 파일이다. `content/fonts/source-serif/provenance.json`과 `LICENSE.md`에 출처·해시·SIL OFL 1.1 조건을 보관한다. 앱에는 글꼴 바이너리 대신 조판된 이미지만 포함한다. 기존 삽화 권리 검토의 한계는 이전 검수 문서를 따른다.

## 백업과 복원

작업 전 570개 파일을 `artifacts/picture-book-layout-backup-20261029/before.zip`에 보관했다(약 307 MB). 이 백업은 Git 제외 대상이므로 별도 보관해야 한다.

```powershell
python scripts/backup-picture-book-layout.py verify
python scripts/check-large-picture-book-text.py
# 현재 작업 이후 다른 수정이 없을 때만 복원한다.
python scripts/backup-picture-book-layout.py restore
```

완료 시 기록한 `after.json` 해시와 현재 파일이 다르면 복원은 쓰기 전에 중단한다. 변경된 기존 파일만 원복하고 새 이미지·검수 자료는 삭제하지 않는다. 복원 후 앱 빌드는 다시 수행한다. 백업을 덮어쓰거나 이후 수정 후 `seal`을 다시 실행하지 않는다.

## 재생성

조판은 `scripts/reflow-picture-book-text.py`의 `stage` → 실제 시각 검수 → `activate` 순서다. 기존 버전 덮어쓰기를 거부하므로 다음 개정은 별도 버전으로 제작한다. 각 앱 준비 스크립트는 이 버전의 세로 높이를 축소하지 않는다. 승인 해시는 시각 검수 후 갱신했고 본문·해석은 변경하지 않았다.

현재 v3 높이: 1901~2453px.
