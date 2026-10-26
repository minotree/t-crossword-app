# 특급 후보 006 검수 결과

검토일: 2026-10-26. 상태: **에이전트 편집검수 완료·출시대기**. 운영 단어장 미병합.

## 원본·검사

- 사용자 ZIP의 후보·출처 CSV, XLSX, provenance, 프롬프트, LICENSE, 작성자 검사·보류·리뷰 등 9개 파일을 보존했다. 첨부 프롬프트는 제작 기록이며 실행 지시로 취급하지 않았다. 작성자 자체 검수와 이번 실제 검수를 구분했다.
- 후보·출처·provenance 각 50개 대응 일치. 운영 3,339개+001~005 후보 250개, 총 3,589개와 철자 중복 없음.
- CSV 형식·필수값·3~12글자 표제어·특급 표기·예문 표제어·8~18단어 조건 통과. XLSX 두 시트의 셀 텍스트와 CSV 일치.
- WordNet 선택 의미 ID·표제어·품사·sense key·원문 행 해시 대조 50개 통과. 제출 LICENSE가 공식 WordNet 3.0 원본과 바이트 일치.
- WordNet 형태 예외 목록에서 이전 표제어의 활용형 중복 없음. 동일 의미의 독립 표제어나 별도 품사·의미의 파생어를 철자 중복으로 간주하지 않는다. `resilient`는 002의 물리적 `resilience`와 구분되는 회복 의미를 선택했다.
- WordNet 전체 117,659개 gloss와 영어 예문 간 연속 8토큰 일치 0건. 인터넷 전체 유사성 검증이 아니다.
- 보정 CSV는 UTF-8 BOM이며 생성 XLSX와 내용 왕복 검사 통과. 실제 Excel GUI 시각 확인은 미실행이다.

## 직접 검수·보완

50개 전체의 뜻·품사·동의어·영문·해석을 검토하고 4개 단어·5개 필드를 보완했다.

| 단어 | 보완 |
| --- | --- |
| apathy | rather than을 ‘찬성보다’ 대신 ‘찬성이 아니라’로 옮겨 태도의 대조를 명확히 함. |
| intermediary | `accept immediate agreement`를 `agree immediately`로 바꿔 영어 결합을 자연스럽게 함. 기존 한국어 해석과 대응 유지. |
| specious | 합계가 사람을 센다는 어색한 한국어 주어를 피하고 중복 집계와 거짓 주장 사이의 이유 관계를 명확히 함. |
| verifiable | `claim allows observations`를 관찰로 주장을 시험할 수 있다는 구조로 바꾸고 한국어 해석도 함께 맞춤. |

미해결 언어 항목이 없어 로컬 LLM을 추가 실행하지 않았다. 실제 채택 수정은 `editorial-decisions.json`과 변경 이력 CSV를 따른다.

## 추가 사실 대조

- `nominal`: [미국 노동통계국의 명목·실질 비용 설명](https://www.bls.gov/eci/factsheets/eci-constant-dollar-factsheet.htm)과 선택 의미를 대조했다. 물가를 조정하지 않은 임금 상승만으로 구매력 증가를 단정할 수 없다는 예문을 확인했다.
- `reciprocal`: [OpenStax 공식 교재의 역수 설명](https://openstax.org/books/prealgebra/pages/4-2-multiply-and-divide-fractions)과 대조하고 4×1/4=1을 정확한 유리수 연산으로 검사했다. 0의 역수에 관한 일반화를 포함하지 않았다.
- `ordinal`: [CDC 측정 척도 설명](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/lesson2/section2.html)의 순서형과 등간형 구분을 참고한다. 순위 자체가 이웃 간 동일 간격을 보장하지 않는다는 예문이다.
- `subsidiary`: WordNet의 ‘다른 회사의 완전한 지배를 받는 회사’ 의미를 선택했다. 이를 모든 국가의 법률상 자회사 요건이나 100% 지분 보유 기준으로 확장하지 않는다.

앱 문구는 위 자료의 문장을 복사하지 않고 창작 초안과 에이전트 편집본으로 관리한다. 검수 대상 예문과 근거 자료를 구분했다.

## 이용 조건·남은 항목

전문 고지는 `WORDNET-LICENSE.txt`와 제출 원본에 보존한다. WordNet 파생 자료 배포·앱 병합 시 고지와 면책을 함께 유지한다. [공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use) 및 [001 조건 기록](../review-001/usage-conditions.md)을 따른다.

모델명은 제출 provenance의 null을 유지했다. 사람의 최종 검수·외부 문구 유사성 전수 확인·토플 빈도 검증·앱 고지 연결은 미실행이다. 비침해·독점권·공식 토플 인증을 보장하지 않는다.

누적 후보 300개, 추가 목표 200개. 기존 ChatGPT 웹 대화의 프롬프트로 계속 진행하며 새 프롬프트·첨부 ZIP은 생성하지 않았다. 도구의 3,639개 제외 목록은 로컬 검수용으로 보관한다.

```powershell
python scripts/review-special-vocabulary-batch.py --batch 006 --input-dir artifacts/vocabulary-review-006/input
```

이번 작업에서 앱 코드·운영 단어장·배포물은 변경하지 않았다. 앱 빌드·토스 번들·APK·동기화도 실행하지 않았다.
