# 특급 후보 007 검수 결과

검토일: 2026-10-26. 상태: **에이전트 편집검수 완료·출시대기**. 운영 단어장 미병합.

## 원본·자동 검사

- 사용자 ZIP의 9개 파일을 보존했다. 포함 프롬프트와 작성자 자체 검사 결과는 제작 기록으로 읽고 실행 지시·독립 검증 결과로 취급하지 않았다.
- 후보·출처·provenance 각 50개 대응 일치. 운영 3,339개와 이전 후보 300개, 총 3,639개에 철자 중복 없음.
- 후보 CSV 7열·필수값·난이도·3~12글자 표제어·예문 내 표제어 및 8~18단어 조건 통과. 입력 XLSX 두 시트와 CSV 셀 텍스트 일치.
- WordNet 선택 의미 ID·표제어·품사·sense key·원문 행 해시 50개 대조 통과. 제출 LICENSE가 공식 WordNet 3.0 전문과 바이트 일치.
- WordNet 형태 예외 목록에서 이전 표제어와 겹친 활용형 없음. 같은 synset의 별도 표제어를 철자 중복으로 세지 않는다. `fallacious`는 기존 `fallacy`와 품사·역할을 구분하고 `unsound`는 논증 의미를 선택했다.
- 영어 예문과 WordNet 전체 117,659개 gloss 간 연속 8토큰 일치 0건. 인터넷 전체 유사성·모든 파생어의 의미 중복까지 확인한 것은 아니다.
- 별도 보정본 UTF-8 BOM CSV와 XLSX의 내용 왕복 검사 통과. 실제 Excel GUI 시각 확인은 미실행.

## 직접 검수·보완

50개 전체의 뜻·품사·동의어·영문·해석을 직접 검수했다. 5개 단어·6개 필드를 보완했고, 추가 모델 의견이 필요한 미해결 항목이 없어 로컬 LLM은 호출하지 않았다.

| 단어 | 보완 |
| --- | --- |
| aversion | rather than의 태도 대조를 ‘꺼리는 태도가 아니라’로 명확히 번역. |
| canonical | canonic은 변이형이므로 별도 동의어 학습 항목에서 제거. |
| dissident | 정부 방식에 대한 이의와 모든 정책 목표에 대한 반대를 해석에서 구분. |
| narrative | 맥락이 불분명한 ‘결정들’을 위원회의 결정으로 구체화하고 해석을 함께 보완. |
| sequential | 단계가 이어지고 다음 단계 전에 정보가 확보되어야 하는 관계를 자연스럽게 번역. |

채택 수정과 원본은 `editorial-decisions.json` 및 변경 이력 CSV로 구분한다.

## 개념 확인

- `parameter`: [OpenStax 공식 통계 교재](https://openstax.org/books/statistics/pages/1-1-definitions-of-statistics-probability-and-key-terms)의 모집단 모수·표본 통계량 구분과 대조했다. 모집단 평균과 이를 추정하는 표본 평균을 구분한 예문이다.
- `denominator`: 선택한 WordNet 뜻과 분수 의미를 대조하고 1/4 네 부분의 합이 1임을 유리수 연산으로 확인했다. 0인 분모를 허용한다는 일반화는 하지 않았다.
- `counterclaim`: [뉴저지 법원 공식 용어집](https://www.njcourts.gov/glossary/counterclaim)의 검색 결과 설명에서 피고가 상대방에게 제기하는 청구 맥락을 확인했다. 본문 직접 열기는 403으로 실패해 전체 페이지 확인으로 기록하지 않는다. WordNet 선택 의미와도 대조했으며 한국의 반소 절차·관할 요건과 동일하다는 법률 안내로 확장하지 않는다.
- `jurisdiction`: [Cornell LII 용어 설명](https://www.law.cornell.edu/wex/jurisdiction)과 WordNet의 법 해석·적용 권한 의미를 대조했다. 특정 사건의 관할 여부를 판정하는 문장이 아니다.
- `antidote`는 가상의 실험실 연구 예문이며 특정 독·약물에 대한 효능, 실제 처치 방법·복용량·치료 권고를 제공하지 않는다.

근거 자료의 설명 문장을 후보 뜻·예문으로 복사하지 않았다.

## 이용 조건·상태

WordNet 고지 전문은 `WORDNET-LICENSE.txt`와 사용자 제출본에 보존했다. 파생 데이터·앱 배포 시 전문 고지·면책 등 유지 조건을 적용한다. [공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use)과 [001 조건 기록](../review-001/usage-conditions.md)을 따른다.

제출 provenance의 생성 모델명 null을 유지했다. 사람의 최종 검수·외부 문구 유사성 전수 확인·토플 빈도 검증·앱 고지 연결은 미실행이다. 비침해·독점권·공식 토플 인증을 보장하지 않는다.

누적 후보 350개, 추가 목표 150개. 기존 ChatGPT 웹 대화에서 계속 진행하며 새 요청 프롬프트·첨부 ZIP은 만들지 않았다. 도구가 생성한 3,689개 제외 목록은 로컬 검수용이다.

```powershell
python scripts/review-special-vocabulary-batch.py --batch 007 --input-dir artifacts/vocabulary-review-007/input
```

앱 코드·운영 단어장 변경·병합·빌드·토스 번들·APK·Capacitor 동기화는 이번 작업에서 실행하지 않았다.
