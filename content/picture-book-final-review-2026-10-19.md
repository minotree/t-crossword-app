# 그림책 전체 검토와 토스 반영 (2026-10-19)

초급 45편·45장, 중급 9편·36장, 고급 7편·38장, 총 61편·119장을 검토했다. 현재 원본의 `reviewStatus: approved`는 아래 범위의 저장소 콘텐츠 검토 완료를 뜻한다. 토스 운영 배포 승인이나 법률 의견·비침해 보증을 뜻하지 않는다. 검토자는 Codex이며 별도의 인간 편집자 검토로 보고하지 않는다.

## 확인한 내용

- 앞선 전체 영어·해석 검토와 문장 교정에 이어 현재 사용하는 모든 카드의 제목·본문·페이지 번호·잘림을 시각적으로 대조했다. 초급은 `review-1.jpg`~`review-5.jpg`의 미변경 카드와 `review-expansion-1.jpg`~`7.jpg`, 이전 단계에서 확인한 01·03 보정 원본을 사용했다. 중급은 `review-1.jpg`~`9.jpg`, 고급은 `review-1.jpg`~`10.jpg`를 사용했다. 최신 보정 16장의 원본 확대 대조는 앞선 보고서에 있으며, 이번 32편 보정 원본도 추가 대조했다. 전체 모음 `overview.jpg`만 보고 완료 처리하지 않았다.
- 초급 32편의 `Draw one circle, work with you.`를 `...work with me.`로 교정하고 해석·단어 목록·이미지를 맞췄다. 내장 ImageGen의 실제 요청은 `beginner-poems/generation-records/beginner-32-v2.json`, 결과는 `beginner-poems/images/beginner-32-v2.png`에 있다. 기존 원본을 보존했다. 누적 교정 카드는 초급 15장·고급 2장이다.
- 중급·고급 다중 페이지에서 페이지 순서·주요 인물 역할·본문 연결을 확인했다. SF 기술자와 고령 남매, 법정의 사장·대리인·증인 역할을 구별할 수 있다. 의상·배경·얼굴의 세부 표현 차이는 남지만 본문 누락·주요 역할을 뒤집는 새 문제는 발견하지 못했다. 시의 명사구·생략은 장르 표현으로 유지했다.
- 사용 중인 카드 119장과 대응하는 제작 기록의 프롬프트·제작일·ImageGen 도구·참조 경로를 확인했다. 모델 식별자는 도구에 제공되지 않았다고 기록한다. 최초 이미지에는 외부 참조가 없고 보정 참조는 저장소 안의 자체 원본 카드다. 참조 파일 누락을 발견하지 못했다. 외부 작가·기존 캐릭터·브랜드를 재현하도록 지정한 기록이나 시각적으로 식별되는 해당 요소를 확인하지 못했다.
- 단어 자체와 외부 사전의 설명 문구는 구분한다. 이번 그림책의 영어·한글은 직접 창작·번역했다는 제작 기록을 근거로 검토했다. 기존 CSV의 뜻·예문·동의어를 그림책 본문으로 복사한 제작 과정은 없다. 기존 어휘 DB 전체의 권리 검토가 끝났다는 뜻은 아니며 그 범위는 별도다.
- 이미지 속 서체는 ImageGen이 생성한 카드 픽셀이다. 외부 폰트 파일이나 제3자 폰트 패키지를 그림책 자산에 추가·재배포하지 않았다. 특정 상용 서체의 라이선스를 확보했다고 주장하지 않는다. TDS 앱 폰트와 패키지 라이선스는 토스 앱의 기존 범위를 따른다.

## 이용 조건과 검토 한계

2026-10-19에 [OpenAI 이용약관 Content](https://openai.com/policies/row-terms-of-use/)와 [Services Agreement 4항](https://openai.com/policies/services-agreement/)에서 법이 허용하는 범위의 출력 권리 귀속, 입력 권한·결과물 검토 책임, 유사 결과물 가능성을 확인했다. [공유·출판 정책](https://openai.com/policies/sharing-publication-policy/)도 확인했으며 토스 읽기 화면의 AI 활용 고지를 유지했다. 이 근거는 원본·보정본 모두의 도구 이용 검토에 적용했다. 실제 계정의 개별 주문 계약까지 확정한 것은 아니다.

검토된 제작 기록과 카드에서 배포를 보류할 구체적인 외부 자료를 발견하지 못해 이번 61편을 콘텐츠 승인 목록에 기록했다. 모든 외부 작품과의 전수 대조나 법률적 권리 확정, 독점성·비침해 보증은 하지 않는다. 추후 문제가 식별되면 해당 작품을 다시 보류한다. 제작 기록의 과거 `draft-unreviewed`는 당시 이력으로 보존한다.

작품별 검토 대상은 `picture-book-approval.json`에 ID·본문/해석을 포함한 원본 데이터 해시·현재 이미지 해시로 고정했다. 승인된 본문·해석·이미지 중 하나라도 바뀌면 토스 준비 단계가 실패한다. 해시 갱신으로 검토를 대신하지 말고, 변경 부분을 시각·편집 대조한 뒤 검토 기록을 갱신해야 한다.

## 토스 구현과 크기

- `scripts/prepare-toss-picture-book-images.py`는 공통 원본에서 토스 전용 WebP를 생성한다. 다른 앱의 데이터·파일·컴포넌트를 가져오지 않는다. Python/Pillow는 콘텐츠 제작 시에만 필요하며 결과 WebP와 이미지 해시 목록을 저장소에 포함한다.
- `scripts/prepare-toss-picture-books.mjs`는 Node만으로 승인 내용과 PNG/WebP 해시를 검증하고 토스 전용 JSON을 만든다. 승인 필터를 유지하며, 목록 밖의 이미지가 있으면 임의 삭제 없이 실패한다. 본문 변경·원본 변경·압축 파일 손상·미승인 제외에 대한 회귀 검사를 추가했다.
- 토스 `PictureBooks`는 WebP를 읽고 기존 TDS 화면·해석·페이지 이동·AI 고지를 유지한다. 실제 준비 데이터 61편·119장으로 렌더링 테스트를 추가했다. 서비스 워커나 별도 오프라인 약속은 추가하지 않았다.
- 원본 PNG 119장은 약 292.9MiB였으나 토스 WebP는 약 28.0MiB다. 최초 생성한 `.ait`는 30,159,265바이트, ZIP 압축 해제 합계는 31,820,185바이트였다. [공식 FAQ의 앱 번들 제한](https://developers-apps-in-toss.toss.im/guide/faq.md#launch-review)은 압축 해제 기준 100MB 이하라고 명시한다(2026-10-19 확인). `build:ait`에 이미지별 dist 해시와 dist 전체 100,000,000바이트 상한 검사를 넣었다. 최종 산출물의 측정값은 `progress.md`를 따른다.

## 검증 및 남은 항목

Node v24.22.0 / pnpm 10.34.7, 임시 Python 3.15/Pillow 13 환경을 사용했다. 개인 Python 경로를 필수 설정으로 추가하지 않았다. 검증 명령:

```powershell
node --test scripts/check-toss-picture-books.mjs
pnpm.cmd --filter @t-crossword/toss test
pnpm.cmd --filter @t-crossword/toss lint
pnpm.cmd --filter @t-crossword/toss build:ait
# 아래 Python은 설치된 Python/Pillow로 실행한다. 이번에는 임시 가상환경을 사용했다.
tmp/picture-book-python/Scripts/python.exe -B content/beginner-poems/build-gallery.py
tmp/picture-book-python/Scripts/python.exe -B content/intermediate-readings/build-preview.py
tmp/picture-book-python/Scripts/python.exe -B content/advanced-readings/build-preview.py
tmp/picture-book-python/Scripts/python.exe -B scripts/prepare-picture-books.py
tmp/picture-book-python/Scripts/python.exe -B scripts/prepare-toss-picture-book-images.py
pnpm.cmd --filter @t-crossword/web build
git diff --check
```

실행 결과는 `progress.md`에 기록한다. 토스 콘솔 업로드·검수 요청·운영 배포는 실행하지 않았다. 최신 `.ait`의 실제 토스 작은 화면 가독성·페이지 이동·해석·뒤로가기·이미지 재시도는 사용자의 기기 확인이 남아 있다. 앱 공개 책임 주체의 최종 표기도 출시 단계에서 확인한다. 생성·렌더링 테스트 통과를 실기기 검증으로 간주하지 않는다.
