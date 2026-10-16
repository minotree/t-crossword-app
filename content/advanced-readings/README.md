# 고급 그림책

공통 제작·권리·검수 규칙은 [AGENTS.md](../../AGENTS.md) 14~15절을 따른다. 이 문서의 편수·페이지 수는 현재 제작분의 기준이며 후속 작품의 고정 제한은 아니다.

성인 독자를 위해 새로 창작한 7편, 총 38장이다. 초급·중급·고급 어휘를 누적 사용하며, 책임·정체성·후회·관계의 회복을 다룬다.

| 작품 | 종류 | 분량 |
| --- | --- | --- |
| The Letter I Did Not Send / 대답하지 않은 편지 | 시 | 1장 |
| The Weight of an Ordinary Day / 평범한 하루의 무게 | 시 | 1장 |
| Without a Job Title / 직함 없이 나를 소개한다면 | 창작 에세이 | 3장 |
| The Life I Did Not Choose / 선택하지 않은 삶과 화해하기 | 창작 에세이 | 3장 |
| The Memory Deposit / 기억을 맡기는 가게 | SF 소설 | 10장 |
| The Last Customer / 문을 닫기 전 마지막 손님 | 현실 미스터리 소설 | 10장 |
| The Weight of a Signature / 서명 한 줄의 무게 | 법정 드라마 소설 | 10장 |

## 파일과 재생성

- `books.json`: 영어 원문, 직접 작성한 한글 해석, 장면 설명, 이미지 경로. 배열 순서가 읽기 순서다.
- `images/`: 삽화와 영어 원문이 함께 있는 원본 PNG 카드. SF 5·6·7·10장의 인물 보정본과 미스터리 9장·법정 드라마 2장의 영어 교정본은 `-v2`로 저장하고 원본도 보존한다. 실제 사용 경로는 `books.json`을 따른다.
- `generation-records/`: 페이지별 실제 프롬프트, 생성 도구·날짜·원본 위치·프로젝트 저장 위치.
- `vocabulary-report.json`: 목록의 기본 어휘와 난이도별 개수, 문법어, 활용형, 파생형 대응, 페이지별 단어 수.
- 어휘 종류 수는 작품 제목·페이지 제목·본문을 포함해 집계하며, 페이지별 단어 수는 본문 기준이다. 초급의 본문 전용 집계와 구분한다.
- `index.html`, `overview.jpg`, `review-*.jpg`: 원문·해석과 이미지를 대조하는 로컬 검수 자료.

```powershell
python content/advanced-readings/validate.py
python content/advanced-readings/build-preview.py
python scripts/prepare-picture-books.py
```

Python/Pillow가 필요하다. 마지막 명령은 세 난이도의 웹용 WebP와 JSON을 갱신한다. 웹 고급 탭에서 작품을 열고 이전·다음으로 이동하며 페이지별 `해석 보기`를 펼칠 수 있다.

원문 변경 시 해석·이미지 속 본문·생성 기록·검수 자료를 함께 갱신한다. 이미지 제작 전에 관사·수일치·시제와 번역 대응을 검토하고, 보정 후 본문과 인물 역할을 다시 대조한다. 파생 웹 JSON·WebP만 직접 고치지 않는다. 스크린리더용 영어 텍스트와 AI 활용 표시를 유지하며 오프라인 범위는 [웹/PWA 문서](../../docs/vercel-pwa.md)를 따른다.

## 어휘 정책

단어 목록에 없는 기본 문법어는 `validate.py`에 명시한다. 성인 영어 문장을 자연스럽게 유지하기 위해 목록 어휘의 활용형과 파생형·합성어도 사용하며 각각 보고한다. 예를 들어 `signature → sign`, `restriction → restrict`, `reconciliation → reconcile`, `shopkeeper → shop`이다. 파생형을 목록에 독립적으로 등록된 단어처럼 세지 않는다. 이 검사는 철자 대응 검사이며 단어의 뜻, 문법의 자연스러움, 교육 적합성을 자동 보증하지 않는다.

## 제작 및 권리 기록

- 제작일: 2026-10-16 (Asia/Seoul).
- 원문·해석: 이 작업에서 직접 창작·번역했다. 외부 작품의 문장·번역문·인물·줄거리를 참조하거나 개작하지 않았다. 에세이의 화자는 가상의 인물이다.
- 삽화: 내장 ImageGen 사용. 모델 식별자는 도구에서 제공하지 않는다. 외부 참조 이미지를 사용하지 않으며 특정 작가·기존 캐릭터·브랜드를 지정하지 않는다. 인물 보정에는 이번 작업의 원본 카드만 참조했다. 실제 프롬프트는 페이지별 생성 기록에 남긴다. 보정 기록에는 최초 제작 프롬프트와 보정 프롬프트·참조 원본을 함께 기록한다.
- SF의 기억 보관 기술, 동의·제한 변경 규정은 창작 설정이다. 현실의 의료 기술이나 실제 서비스로 설명하지 않는다.
- 법정 드라마는 명시적으로 가상의 도시·계약 사건·민사 절차를 사용한다. 실제 관할의 법률이나 판례를 설명하는 자료가 아니다. 신문·증거 검토·변론·판단의 서사이며 배심원이나 형사 처벌을 등장시키지 않는다.
- 기존 어휘 데이터의 출처·권리는 이번 작업에서 재검증하지 않았다. 생성 자체로 비침해나 독점적 권리를 보장하지 않는다. 배포 전 기존 작품 유사성·권리·원문과 번역을 검토해야 한다.
- `reviewStatus: draft-unreviewed`는 최종 편집·권리 검토 전 상태다. 기술 검증이나 이미지 대조를 수행해도 최종 권리 검토 완료로 바꾸지 않는다.
- 실제 사용하는 카드 38장의 제목·페이지 번호·영어 본문을 원문과 시각적으로 대조했다. SF의 인물 혼동과 두 장의 영어 표현을 보정한 뒤 다시 대조했다. 인물·배경의 세부 표현에는 생성 이미지 간 차이가 남을 수 있으며, 실제 기기에서의 가독성 확인과 최종 편집 검토는 별도다.

### 도구 이용 조건 확인 (2026-10-16)

[OpenAI 이용약관의 Content 항목](https://openai.com/policies/row-terms-of-use/)과 [기업용 Services Agreement 4항](https://openai.com/policies/services-agreement/)에서 법이 허용하는 범위의 결과물 권리 귀속, 유사 결과물 가능성, 이용자의 입력 권한·결과물 검토 책임을 확인했다. 이 확인은 별도 주문 계약이나 계정에 적용되는 모든 조건을 법률적으로 확정한 것이 아니다. [공유·출판 정책](https://openai.com/policies/sharing-publication-policy/)의 AI 활용 공개와 게시 전 검토 지침도 확인했다. 읽기 화면에는 AI를 활용한 창작 콘텐츠임을 표시한다. 최종 책임 주체의 표기와 공개 전 검토는 배포 시 확인해야 한다.

## 검증 기록

2026-10-16 최종 실행에서 다음 검사를 통과했다. 로컬 휴대용 Node 22.23.3을 해당 명령의 PATH에 추가해 실행했다. `verifyDepsBeforeRun=false`는 이 실행에서 pnpm의 자동 재설치를 막기 위한 옵션이며 저장소 설정을 바꾸지 않는다.

저장소 루트:

```powershell
python content/advanced-readings/build-preview.py
python scripts/prepare-picture-books.py
node tmp/lint-tools/pnpm/node_modules/pnpm/bin/pnpm.cjs --config.verifyDepsBeforeRun=false --filter @t-crossword/web lint
node tmp/lint-tools/pnpm/node_modules/pnpm/bin/pnpm.cjs --config.verifyDepsBeforeRun=false --filter @t-crossword/web typecheck
node tmp/lint-tools/pnpm/node_modules/pnpm/bin/pnpm.cjs --config.verifyDepsBeforeRun=false --filter @t-crossword/web build
node --check apps/web/dist/sw.js
git diff --check
```

`apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`: 테스트 20개 통과. 고급 목록 7편, 세 소설의 첫·끝 페이지, 해석 표시, 잘못된 페이지 번호 복구와 난이도 간 작품 분리를 포함한다. 별도 파일 대조로 고급 38장의 원문·해석·목록과 public/dist WebP 일치, 전체 WebP 119장을 확인했다.

어휘 검사 결과는 기본 어휘 594종(초급 244·중급 215·고급 135), 활용형 236종이다. 파생형·기본 문법어는 보고서에서 구분한다. 빌드는 성공했으며 기존 500kB 초과 청크 경고가 남아 있다. 실제 브라우저·기기·PWA 오프라인 동작과 최종 편집·권리 검토는 미완료다.
