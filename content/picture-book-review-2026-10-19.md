# 그림책 편집 검토 (2026-10-19)

후속 전체 검토와 토스 반영은 [최종 검토 기록](picture-book-final-review-2026-10-19.md)을 따른다. 해당 작업에서 전체 119장 대조·제작 기록 검토를 마치고 61편의 원본을 `approved`로 기록했다. 아래의 승인 보류·토스 0편은 그 이전 작업 시점의 이력이다.

검토 대상은 초급 45편·45장, 중급 9편·36장, 고급 7편·38장으로 총 61편·119장이다. 전체 영어 원문·한글 해석을 읽고 문제를 식별한 뒤, 사용자 요청으로 아래와 같이 수정했다. 아래 최초 발견 표와 최초 검토 범위는 교정 전 이력이다. 배포·승인 상태는 변경하지 않았다.

## 후속 교정 완료

- 초급 01·03·21·22·25·26·28·31·36·37·38·42·44·45의 표현·단복수·해석을 교정했다. 21편은 `I thank my family for their care.`, 22편은 `Cook with care and smile with me.`로 화자를 명확히 했다.
- 초급 기본 문법어와 명시적 복수형을 별도 보고한다. 본문 기본 어휘는 536종으로 500종 목표를 유지한다. 표면형 단어 목록은 제목 포함, 목표 집계는 본문만 기준이다. 기존 어휘 데이터 난이도는 바꾸지 않았다.
- 중·고급 검사에서 `-ied`만 `y`를 복원하고, 중복 자음이 확인되는 경우에만 한 자음을 제거한다. `copied → copy`를 확인했다. `entitle`은 목록에 없으므로 SF 8장을 허용 어휘로 다시 썼고, `entitled`를 넣으면 검사가 실패하는 회귀 검사를 추가했다. 중급 528종·고급 592종은 제목 포함 기본 어휘 집계다.
- 고급 시 제목은 ‘보내지 않은 편지’, 법정 10장 조사는 `펜은`·`펜이`, 미스터리 2장 물건은 ‘아래쪽 상자’로 맞췄다. 미스터리의 돈은 ‘맡긴 돈’으로 설명하고 6장 영어를 `The money recorded as a deposit ...`로 교정했다.
- SF 보정 이력의 누나 지시는 당시 잘못된 요청으로 남기고 `advanced-readings/editorial-corrections-2026-10-19.json`에 여동생·오빠 관계와 인물 설정을 정정했다. 외형만으로 상대적 나이를 단정하지 않는다.
- 내장 ImageGen으로 현재 사용하는 16장(초급 14장·고급 2장)의 본문을 보정했다. 모델 식별자는 제공되지 않았다. 기존 카드만 참조했으며 외부 자료는 추가하지 않았다. 초급은 `images/beginner-XX-v2.png`(21·22는 `-v3.png`), 고급은 `images/advanced-sf-01-08-v2.png`, `images/advanced-mystery-01-06-v2.png`에 저장했다. 실제 프롬프트·도구·날짜·참조·출력 경로는 각 `generation-records/*-v2.json`, `*-v3.json`에 있다. 초급 최초 통합 기록은 별도 파일에 보존했다.
- 현재 보정본 16장을 각각 열어 제목·본문 전체·고급 페이지 번호·잘림을 원문과 대조했다. 초급 21·22 v2 중간 보정본도 보존한다. 이번 시각 검수는 변경된 카드에 한정한다.
- 갤러리·보고서와 웹 JSON·WebP를 원본에서 재생성했다. 원본/웹 JSON 119장 대응, public/dist 이미지 바이트 일치, 변경 16장의 원본을 같은 설정으로 변환한 WebP 바이트 일치를 확인했다. 최종 권리 검토 전 상태와 토스 승인 작품 0편은 유지한다.

## 후속 검증 결과

Python 별칭 대신 설치된 Python 3.15를 확인하고 임시 가상환경에 Pillow 13.0.0을 설치했다. 프로젝트 의존성·lockfile이나 필수 Python 경로 설정은 변경하지 않았다. 아래 실제 명령은 모두 통과했다.

```powershell
tmp/picture-book-python/Scripts/python.exe content/test-vocabulary-audit.py
tmp/picture-book-python/Scripts/python.exe -B content/beginner-poems/build-gallery.py
tmp/picture-book-python/Scripts/python.exe -B content/intermediate-readings/build-preview.py
tmp/picture-book-python/Scripts/python.exe -B content/advanced-readings/build-preview.py
tmp/picture-book-python/Scripts/python.exe -B scripts/prepare-picture-books.py
pnpm.cmd --filter @t-crossword/web lint
pnpm.cmd --filter @t-crossword/web build
# apps/web에서 실행
node ../../packages/core/node_modules/vitest/vitest.mjs run tests
# 저장소 루트에서 실행
node --test apps/web/scripts/check-build.mjs
# 이번 작업의 임시 원본/웹/dist 및 변환 대조 검사
tmp/picture-book-python/Scripts/python.exe -B tmp/check-picture-book-sync.py
git diff --check
```

어휘 회귀 검사 3개·웹 테스트 38개·빌드/PWA 검사 3개 통과. 웹 build에는 타입 검사와 PWA 생성이 포함된다. 기존 500kB 초과 청크 경고는 남아 있다. 실제 브라우저·기기 가독성·캐시 갱신은 미실행이다. 최종 권리 검토와 웹 미승인 콘텐츠 제공 정책 점검도 남아 있어 `approved`로 변경하지 않았다. 커밋·푸시·배포는 실행하지 않았다.

## 우선 수정할 사항

| 위치 | 확인한 문제 | 권장 조치 |
| --- | --- | --- |
| 초급 01, 03 | `Little bird, sing with you.`, `Little bee, fly with you.`, `Dance with you.`는 명령문의 주어와 `you`가 같은 대상을 가리키는 것으로 읽혀, 한글의 ‘너와 함께’라는 화자 의도와 어긋난다. | 화자를 분명히 하고 `with me` 등 자연스러운 표현으로 교정. 초급 목록 밖 문법어가 필요하면 별도 정책에 기록. |
| 초급 03 | `Listen, happy music.`는 음악을 들으라는 뜻으로 자연스럽지 않다. | `Listen to ...` 구조로 교정. |
| 초급 21 | `Thank the family with the heart.`는 ‘진심으로 감사하다’의 자연스러운 표현이 아니다. | 관용적인 감사 표현으로 교정하고 초급 어휘 목표 재집계. |
| 초급 22 | `Sandwich, salad, hamburger, stop!`은 음식 이름 뒤의 명령이 무엇을 뜻하는지 모호하다. | 가게에서 음식을 고르는 장면에 맞게 다시 작성. |
| 초급 25, 28, 31 | `one sock, one shoe`, `brush the tooth`, `Wash the hand`, `Collect the toy`가 일반적인 옷 입기·양치·손 씻기·정리 장면과 맞지 않는 단수형이다. | 필요한 복수형을 허용·기록하고 이미지 및 번역과 함께 교정. 한 짝·한 개를 의도했다면 장면에서 그 이유를 드러낼 것. |
| 초급 26, 36, 37, 42, 44, 45 | `bright, not old`, `turn the radio`, `Drive the road`, `smile face beside face`, `the time can feel near`, `feel the drive`는 어휘를 끼워 맞춘 인상이 강하거나 초급에게 뜻이 불분명하다. | 각각 자연스러운 문맥으로 재작성. 특히 `turn the radio`에 `on`을 넣을지는 원래 장면 의도에 따라 확정. |
| 초급 38 | `Map the earth`는 지도를 제작한다는 뜻인데, 해석은 ‘지도를 보며 지구를 여행해요’다. | 원문 또는 해석을 장면 의도에 맞춰 통일. |
| 중급 환생 3장 / 어휘 검사 | 저장된 보고서가 `copied → cop`로 연결한다. 본문의 뜻은 `copy`의 과거형이다. | `validate.py`의 후보 우선순위를 수정하고 `copied → copy` 및 해당 기본형 난이도를 확인. 철자상 후보를 의미 검증으로 취급하지 않을 것. |
| 고급 SF 8장 / 어휘 검사 | `entitled → entity`로 연결한다. 문장의 뜻은 ‘권리를 주다’인 `entitle`이다. | 올바른 기본형과 난이도·별도 허용 정책을 확인해 검사와 보고서 수정. 잘못된 기본형으로 어휘 수를 유지하지 않을 것. |
| 고급 법정 10장 해석 | `펜는`, `펜가` 조사 오타. | `펜은`, `펜이`로 수정 후 원본·웹 JSON·갤러리 재생성. |
| 고급 미스터리 2장 해석 | `a lower box`를 ‘아래 서랍’으로 번역했다. | ‘아래쪽 상자’로 맞추거나 원문의 물건을 확정. |
| 고급 미스터리 6장 | `The distinct deposit`은 돈의 성격을 설명하는 문맥에서 어색하다. ‘보증금’으로 소개된 돈이 사실 지급할 보수였다는 반전도 용어상 혼동을 준다. | 돈을 맡긴 경위와 장부상의 표기를 구별하고 `distinct` 표현 교정. |
| 고급 시 01 제목 | `The Letter I Did Not Send`와 ‘대답하지 않은 편지’는 보내지 않음/답하지 않음의 차이가 있다. 본문에는 상대의 편지와 화자가 쓰는 글이 함께 나온다. | 의도한 편지를 확정하고 제목 대응을 검토. 의역 의도라면 기록. |
| 고급 SF 보정 기록 5·7·10장 | 보정 프롬프트는 `OLDER SISTER`로 지정하지만 해석은 여동생·오빠 관계다. 영어의 `sister`만으로 나이는 결정되지 않는다. | 해석을 기준으로 인물 설정표와 후속 보정 지시를 맞출 것. 원래 생성 기록은 실제 요청 이력이므로 덮어쓰지 말고 정정 기록 추가. 5장 이미지의 외형만으로 누나/여동생을 확정하지 않는다. |

## 최초 검토 범위와 기술 확인 (교정 전)

- Node 읽기 전용 대조로 119장의 원문·해석·페이지 제목이 웹 JSON과 같고, 사용 중인 원본 PNG 및 웹 WebP가 존재함을 확인했다. 픽셀 동일성·WebP 변환의 최신 여부를 증명하는 검사는 아니다.
- 이미지 경로와 제작 기록의 `target` 대응을 확인했다. 본문은 최초 `creationPrompt` 또는 보정 `prompt`에 들어 있으며, SF 보정본은 본문 유지 지시와 최초 프롬프트를 함께 보관한다.
- 초급 본문만 집계한 어휘는 537종이고 제목·본문의 단어는 모두 현재 초급 목록에 있다. `words`는 제목 포함 집계이므로 본문 집계와 구별한다. 단어 목록 일치가 문장의 자연스러움을 뜻하지 않는다.
- 시각 검토: 초급·중급 `overview.jpg`로 전체 장면과 배치를 훑었다. 고급 `review-10.jpg`의 법정 9·10장, 고급 SF 5장 보정 원본, 중급 SF 4장 원본을 열어 확인했다. 확대 표본의 본문 잘림이나 명백한 원문 누락은 발견하지 못했다. 축소 모음은 119장 전체의 글자별 대조를 대신하지 않는다.
- 중급 SF 4장 삽화는 학생들이 실험실 밖 유리 너머에 있는 구도여서 원문의 관찰 장면과 연결된다. 고급 SF 5장은 두 고령 인물과 뒤편 기술자를 구분할 수 있다.
- 토스 목록은 0편이며 모든 원본은 `draft-unreviewed`다. 웹용 변환기는 이 상태를 걸러내지 않고 전 작품을 포함하므로, 웹 배포 전에도 별도의 콘텐츠 제외/승인 정책 점검이 필요하다.
- Python 및 py 실행 별칭이 파일 접근 오류로 실행되지 않았다. 기존 `validate.py`, `build-gallery.py`, `build-preview.py`, WebP 재생성은 이번에 실행하지 않았다. 중·고급 어휘 보고서는 기존 결과를 읽고 의미상 잘못된 연결을 검토했으며 재검사 통과로 보고하지 않는다.

## 제작·권리 기록 검토

기록에는 ImageGen, 2026-10-16 생성일, 실제 프롬프트, 파일 대응, 외부 참조 없음 또는 자체 원본 보정 참조가 있다. 구체 모델 식별자는 제공되지 않았다고 명시되어 있다. 이 기록은 창작 경위에 관한 저장소 기록이며 외부 작품과의 비유사성을 입증하지 않는다.

2026-10-19에 [OpenAI 이용약관 Content 항목](https://openai.com/policies/row-terms-of-use/)과 [공유·출판 정책](https://openai.com/policies/sharing-publication-policy/)을 다시 열어 확인했다. 이용약관은 법이 허용하는 범위에서 결과물 권리를 사용자에게 귀속시키지만, 유사 결과물 가능성과 입력 권한·공개 전 검토 책임도 명시한다. 실제 제작 계정에 적용되는 계약 종류는 확인하지 않았다. 도구 약관 확인으로 개별 작품의 비침해·독점성을 확정하지 않는다.

남은 항목: 기존 `words_completed.csv` 설명 문구의 출처·이용 권한, 이미지 속 글꼴의 식별·별도 이용 조건 적용 여부, 외부 작품과의 유사성, 최종 공개 책임 주체 표기, 전체 이미지 글자·페이지 번호 재대조, 실제 기기 가독성. 위 항목과 편집 문제를 해소하기 전 `approved`로 변경하지 않는다.

## 최초 권장 수정 순서 (위 교정 결과 참조)

1. 잘못된 기본형 연결부터 고치고 어휘 보고서를 재생성한다.
2. 초급의 문법어·복수형 허용 기준을 명시한 뒤 영어·해석 교정안을 확정한다. 원래 어휘 난이도 데이터는 수정하지 않는다.
3. 영어가 바뀐 카드만 버전 파일로 보정하고 제작 기록·갤러리·웹 파일을 함께 갱신한다.
4. 전체 카드의 글자 대조, 권리 근거 및 기기 가독성을 확인한 작품부터 개별 승인한다.
