# 중급·고급 그림책 본문 확대 사전 검수 · 2026-10-29

중급 9편 36장·고급 7편 38장, 총 **74장 원본을 view_image로 각각 열어** 배치를 확인했다. 검토자는 Codex다. 현재 books.json이 참조하는 보정본(-v2 포함)을 대상으로 하며, 축소 모음만 보고 전수 검수로 기록하지 않았다. 각 원본의 경로·SHA-256·크기·본문 해시와 페이지별 관찰은 [review.json](review.json)에 고정한다. [원본 확인 갤러리](index.html)는 기존 PNG를 연결하며 픽셀을 수정하지 않는다.

## 결론

- 74장 모두 상단 삽화와 하단 밝은 읽기 패널이 구분되어 있다. 삽화 보존 + 본문 패널 새 조판으로 글자 확대가 가능하다는 시각적 판단이다. 이 검수에서 이미지 생성 호출·원본 이미지 수정·앱 변경은 하지 않았다.
- 일반 분리형 63장, 장식 테두리형 9장, 번짐 경계형 2장이다. 장식형은 중급 환생 소설 8장과 무협 2장째이며, 번짐형은 고급 미스터리 9장째·법정 드라마 10장째다.
- 분리형도 삽화 높이·제목 크기·쪽번호 위치가 다르다. 일괄 45%/50% 자르기는 부적절하다. 표의 Y는 **원본 상단 기준 대략적 경계(±20px)**이며 실제 크롭 승인이 아니다. 보정본을 만들 때 픽셀 경계를 다시 확인한다.
- 원본은 모두 1024×1536 PNG다. 편집 가능한 텍스트/삽화 레이어 파일은 해당 콘텐츠 디렉터리에서 찾지 못했다. 본문은 books.json에 별도 보존되어 있어 OCR 추출에 의존하지 않고 조판할 수 있다.
- 본문이 삽화 위에 겹쳐져 삽화 복원이나 AI 인페인팅이 반드시 필요한 페이지는 이번 범위에서 발견하지 못했다. 기존 종이 질감·장식은 새 조판에서 달라질 수 있다.

## 주의할 페이지

- `intermediate-poem-02-01`, `intermediate-poem-03-01`: 같은 제목이 크게/작게 반복된다. 새 패널에서는 한 번만 배치하는 방안을 검토한다. 시 5장 전체는 원문 행·연 구분을 보존한다.
- `intermediate-martial-01-02`: 상단 중앙 장식이 삽화 경계에 걸쳐 있어 크롭 기준을 개별 확인한다.
- `intermediate-second-life-01` 1~8장: 본문 외곽 테두리를 종전 높이 그대로 늘리면 장식과 본문이 어긋나므로 새로 배치한다.
- `advanced-mystery-01-09`, `advanced-courtroom-01-10`: 번진 삽화 끝을 직선으로 자르면 질감이 잘릴 수 있다. 번짐을 충분히 포함하고 새 패널과의 연결부를 확인한다.
- `advanced-sf-01-10`, `advanced-courtroom-01-09`, `advanced-courtroom-01-10`: 두 장면이 포함된 상단 구성을 모두 보존한다.

## 확대 작업 시 함께 바꿀 부분

1. 이미지 폭과 삽화는 유지하고 제목 공간을 정리한 뒤, 큰 본문 글씨에 맞게 하단 높이를 늘린다. 페이지/작품 ID·영어 원문·해석은 유지한다. 이 방식은 페이지 분할 없이 가능하지만 세로 스크롤은 길어진다.
2. 글씨 크기는 이미지 픽셀 수와 실제 표시 폭을 함께 정한다. 예를 들어 1024px 원본의 64px 글자는 320px 표시 폭에서 약 20px에 대응한다. 이는 새 서체의 조판 목표 예시이며 기존 생성 이미지의 실제 폰트 크기를 측정한 수치가 아니다. 최종 값은 샘플에서 확인한다.
3. **현재 변환 설정을 그대로 사용하면 확대 효과가 줄어든다.** `scripts/prepare-picture-books.py`와 `prepare-toss-picture-book-images.py`는 최대 1024×1536, `prepare-mobile-picture-books.py`는 최대 1200×1600으로 thumbnail 처리한다. 긴 새 원본을 이 높이에 맞춰 축소하면 폭도 함께 줄어든다. 본문 확대 시 최대 높이 정책을 조정하고 해상도·가독성·파일 용량을 함께 확인해야 한다.
4. 사용할 폰트 파일의 이용/재배포 조건과 필수 고지를 확인한다. 현재 이미지에 그려진 글자의 외형을 특정 폰트 라이선스로 간주하지 않는다.
5. 새 이미지는 버전 경로로 보존하고 각 앱용 WebP·갤러리·제작 기록을 갱신한다. 토스 승인 해시는 새 이미지의 실제 시각 대조 후에만 갱신한다. 해시 변경만으로 재검수를 대신하지 않는다.

## 검수 범위와 미확인 항목

74장 각각의 삽화/본문 분리·경계·장식·반복 제목·공간 사용을 확인했다. 전체 영어 철자/문장·번역·권리 검토를 새로 전수 수행한 것은 아니며, 기존 [2026-10-19 검토](../picture-book-final-review-2026-10-19.md)를 대체하지 않는다. 기존 콘텐츠 승인 상태는 변경하지 않는다. 이미지가 원본 크기에서 읽힌다는 사실은 작은 기기에서의 가독성 검증이 아니다. 새 조판 결과·글꼴 권리·기기 가독성·용량·빌드·배포는 미검증/미실행이다.

아래 단어 수는 **JSON 본문만** 정규식으로 센 토큰 수이며, 고유 어휘 수·난이도·문법 검사 결과가 아니다.

## 페이지별 기록

| 페이지 ID | 경계 Y 약(px) | 본문 토큰 | 배치 | 관찰/후속 확인 |
| --- | ---: | ---: | --- | --- |
| intermediate-poem-01-01 | 730 | 49 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-01-01 | 870 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-01-02 | 780 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-01-03 | 710 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-01 | 770 | 61 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-02 | 740 | 59 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-03 | 750 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-04 | 720 | 62 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-05 | 800 | 66 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-06 | 690 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-07 | 730 | 64 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-sf-01-08 | 640 | 67 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-poem-02-01 | 660 | 51 | straight-separation | 현재 작품 제목과 페이지 제목이 반복 표시됨; 새 조판에서 동일 제목 중복 제거 검토 |
| intermediate-poem-03-01 | 720 | 54 | straight-separation | 현재 작품 제목과 페이지 제목이 반복 표시됨; 새 조판에서 동일 제목 중복 제거 검토 |
| intermediate-essay-02-01 | 710 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-02-02 | 770 | 57 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-02-03 | 780 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-03-01 | 710 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-03-02 | 670 | 59 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-essay-03-03 | 730 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-01 | 800 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-02 | 710 | 59 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-martial-01-03 | 770 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-04 | 820 | 62 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-05 | 770 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-06 | 710 | 61 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-07 | 720 | 63 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-martial-01-08 | 790 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| intermediate-second-life-01-01 | 790 | 65 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-02 | 720 | 58 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-03 | 760 | 64 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-04 | 750 | 59 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-05 | 820 | 63 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-06 | 780 | 64 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-07 | 750 | 63 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| intermediate-second-life-01-08 | 710 | 60 | decorative-frame | 본문 장식 테두리를 새 패널 높이에 맞춰 재구성; 삽화 경계의 장식 침범 확인 |
| advanced-poem-01-01 | 690 | 51 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-poem-02-01 | 670 | 49 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-essay-01-01 | 720 | 52 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-essay-01-02 | 680 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-essay-01-03 | 720 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-essay-02-01 | 750 | 53 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-essay-02-02 | 730 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-essay-02-03 | 710 | 56 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-01 | 690 | 52 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-02 | 720 | 56 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-03 | 720 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-04 | 710 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-05 | 740 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-06 | 660 | 54 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-07 | 680 | 56 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-08 | 660 | 59 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-09 | 610 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-sf-01-10 | 750 | 56 | straight-separation | 상단 복수 장면을 한 삽화로 함께 보존; 장면 사이 여백을 본문 경계로 오인하지 않기 |
| advanced-mystery-01-01 | 710 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-02 | 740 | 56 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-03 | 690 | 56 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-04 | 650 | 57 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-05 | 670 | 57 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-06 | 610 | 62 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-07 | 690 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-08 | 670 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-mystery-01-09 | 750 | 57 | feathered-edge | 삽화 아래 가장자리의 번짐 보존; 단순 직선 크롭 시 질감 손실 주의 |
| advanced-mystery-01-10 | 640 | 62 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-01 | 650 | 61 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-02 | 710 | 61 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-03 | 620 | 60 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-04 | 640 | 57 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-05 | 610 | 58 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-06 | 620 | 55 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-07 | 580 | 63 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-08 | 710 | 56 | straight-separation | 삽화와 밝은 본문 패널 분리 확인; 제목·본문·쪽번호 전체 재조판 가능 |
| advanced-courtroom-01-09 | 690 | 60 | straight-separation | 상단 복수 장면을 한 삽화로 함께 보존; 장면 사이 여백을 본문 경계로 오인하지 않기 |
| advanced-courtroom-01-10 | 770 | 58 | feathered-edge | 삽화 아래 가장자리의 번짐 보존; 단순 직선 크롭 시 질감 손실 주의 / 상단 복수 장면을 한 삽화로 함께 보존; 장면 사이 여백을 본문 경계로 오인하지 않기 |
