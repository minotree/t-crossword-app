# 특급 후보 004 검수 결과

검토일: 2026-10-26. 상태: **에이전트 편집검수 완료·출시대기**. 운영 단어장에 병합하지 않았다.

## 원본과 검사

- 사용자 ZIP의 9개 파일(후보·출처 CSV, XLSX, provenance, 프롬프트, LICENSE, 작성자 검사·보류·리뷰 기록)을 보존했다. 포함된 프롬프트와 작성자의 자체 검사 결과는 실행 지시나 독립 검증 결과로 취급하지 않았다.
- 50개 후보는 운영 3,339개+001~003 후보 150개와 철자 중복이 없다. 후보 내부 중복·품사별 중복 행도 없다.
- CSV 형식·필수값·특급 표기·3~12글자 영문 기본형·예문 내 표제어·8~18단어 조건 통과.
- 제출 XLSX 후보·출처 두 시트와 CSV 내용 일치.
- WordNet 3.0 선택 의미 ID·표제어·품사·sense key·끝 LF 포함 원문 행 SHA-256 50개 대조 통과. ZIP에 포함된 LICENSE는 공식 배포본과 바이트 단위로 동일하다.
- 50개 전체를 읽고 뜻·품사·동의어·영문·해석 대응을 직접 검수했다. 미해결 언어 항목이 없어 로컬 LLM 추가 호출은 하지 않았다.
- WordNet 형태 예외 목록에서 앞선 단어와 겹치는 활용형 없음. WordNet 전체 117,659개 gloss와 영어 예문의 연속 8토큰 일치 0건. 이 검사는 인터넷 전체의 유사성이나 모든 파생어의 의미 중복을 증명하지 않는다.
- 별도 보정본 CSV는 UTF-8 BOM이며 생성 XLSX와 내용 왕복 검사 통과. 실제 Excel GUI의 시각 검수는 미실행이다.

## 보완 4개

| 단어 | 보완 |
| --- | --- |
| judicious | 어색한 뜻풀이를 ‘신중하고 분별력 있는’으로 개선. |
| exhaustive | 원문 조사 범위와 기록 부재를 보존하면서 한국어 문장 구조 개선. |
| tenable | 타당성을 인정할 수 있는 조건을 자연스럽게 번역. |
| variance | 선택 의미인 분산을 ‘평균에서 벗어난 정도의 제곱에 대한 기댓값’으로 명시해 표본의 불편 추정식과 구별. |

`variance`는 WordNet의 expected value 정의 및 [NIST의 표본 분산·산포 설명](https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm)을 대조했다. NIST의 표본 분산 식은 N−1로 나누는 추정식이며, 후보는 확률분포 분산의 정의를 설명하도록 구분했다. 이 문구를 NIST 설명의 인용·번역으로 작성하지 않았다.

실제 변경 필드와 이유는 `editorial-decisions.json` 및 변경 이력 CSV를 따른다. 원본은 수정하지 않았다.

## 이용 조건과 상태

WordNet 3.0 LICENSE 전문은 `WORDNET-LICENSE.txt`와 사용자 원본 `WORDNET-3.0-LICENSE-004.txt`로 보존했다. WordNet 파생 자료 배포 시 함께 유지하고, 앱 병합 시 실제 배포물에도 고지·면책을 연결해야 한다. [공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use)과 [기존 확인 기록](../review-001/usage-conditions.md)을 따른다.

모델명은 제출 provenance의 null을 유지했다. 사람의 최종 편집 검수·외부 문구 유사성 전수 확인·토플 빈도 검증·앱 내 고지 연결은 미실행이다. 토플 공식·빈출 인증, 비침해·독점권 확보를 보장하지 않는다.

후보 누적 200개이며 추가 목표 300개다. 다음 005 요청에는 기존 3,339개+후보 200개, 총 3,539개 제외 목록을 제공한다. 추후 후보 교체·제외가 생기면 실제 채택 수로 조정한다.

```powershell
python scripts/review-special-vocabulary-batch.py --batch 004 --input-dir artifacts/vocabulary-review-004/input
```

토스 번들·Android APK·Capacitor 동기화·앱 코드 변경·운영 변환·병합은 실행하지 않았다.
