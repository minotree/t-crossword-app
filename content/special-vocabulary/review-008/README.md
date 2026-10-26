# 특급 후보 008 검수 결과

검토일: 2026-10-26. 상태: **에이전트 편집검수 완료·출시대기**. 운영 단어장 미병합.

## 원본·검사

- ZIP의 후보·출처 CSV, XLSX, provenance, 프롬프트, LICENSE, 작성자 검증·보류·리뷰 등 9개 파일을 보존했다. 첨부 지시문은 제작 기록으로만 읽었고 작성자의 자체 검수 주장을 독립 검증 결과로 취급하지 않았다.
- 50개 후보는 운영 3,339개+이전 후보 350개와 철자 중복이 없다. CSV 형식·필수값·특급 표기·표제어 길이·예문 내 표제어 및 8~18단어 조건 통과.
- 제출 XLSX의 두 시트와 CSV 셀 텍스트 일치. 보정본은 UTF-8 BOM CSV이며 생성 XLSX와 내용 왕복 검사 통과. 실제 Excel GUI 시각 확인은 미실행.
- WordNet 선택 의미 ID·표제어·품사·sense key·원문 행 해시 50개 대조 통과. 제출 LICENSE와 공식 WordNet 3.0 전문 바이트 일치.
- WordNet 형태 예외 목록에서 앞선 단어의 활용형과 겹친 사례 없음. 같은 의미를 공유하는 별도 표제어를 철자 중복으로 세지는 않는다.
- 보정 예문과 WordNet 전체 117,659개 gloss 사이의 연속 8토큰 일치 0건. 외부 문구 전체의 유사성·비침해를 입증하는 검사는 아니다.

## 직접 검수·보완

50개 전체의 뜻·품사·동의어·영문·해석을 직접 검토했다. 아래 5개 단어·8개 필드를 보완했다.

| 단어 | 보완 |
| --- | --- |
| axiomatic | 변이형 axiomatical을 동의어 칸에서 제거. |
| cognate | 같은 언어에서 나온 단어 일반이 아니라 다른 어휘와 공통 조상 단어를 공유하는 뜻임을 명확화. |
| denounce | 모든 참가자에게 같은 책임을 묻지 않으면서 관행을 규탄한다는 문장을 자연스럽게 번역. |
| ineffable | ‘말로 표현하기 어렵다고 부른다’를 자연스러운 평가 표현으로 수정. |
| exonerate | 혐의 해소를 무죄 선고와 단순 동일시하지 않도록 뜻·동의어·영문·해석 4개 필드 함께 보완. |

`exonerate`는 WordNet의 형사 혐의 해소 의미를 유지하면서 표현을 보완했다. [Cornell LII에 수록된 미국 연방 형사소송규칙 29](https://www.law.cornell.edu/rules/frcrmp/rule_29)의 증거 불충분에 따른 acquittal과 [National Registry of Exonerations의 연구상 정의](https://www.exonerationregistry.org/understanding-registry)를 구분해 검토했다. 미 하원 법령 사이트의 직접 열기는 점검 안내로 실패해 해당 페이지 전체를 확인했다고 기록하지 않는다. Registry의 유죄판결 후 사건 선정 기준을 모든 일반 용례에 강제하지 않으며 특정 국가의 법률 자문이나 절차 안내로 사용하지 않는다. 외부 설명을 복사해 예문을 만든 것은 아니다.

추가 모델 의견이 필요한 미해결 항목이 없어 로컬 LLM은 호출하지 않았다. 채택 수정은 `editorial-decisions.json`과 변경 이력 CSV를 따른다.

## 개념·사실 대조

- `orthogonal`: 직각으로 놓인 좌표축 자체는 그 축에 표시한 확률변수의 독립성을 보장하지 않는다는 예문이다. 표준 직교축 위에서도 Y=X인 분포를 놓을 수 있음을 정확한 유리수 계산으로 확인했다. 구체적인 통계 추정 절차로 확대하지 않는다.
- `predicate`: WordNet의 문장 구성 성분인 술부 의미와 동사·보충 성분 설명에 맞췄다. 논리학의 술어 의미와 구분한다.
- `cognate`: 같은 조상 언어의 아무 단어가 아니라 같은 조상 단어에서 유래한 어휘라는 WordNet 정의를 대조했다.
- 역사·법원·위원회 등의 예문은 실제 특정 사건을 보도하는 문장이 아니라 창작 예문으로 관리한다.

## 이용 조건·남은 항목

WordNet 전문 고지·면책은 `WORDNET-LICENSE.txt`와 제출본에 보존했다. 파생 자료 배포 및 앱 병합 시에도 함께 유지한다. [공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use)과 [001 조건 기록](../review-001/usage-conditions.md)을 따른다.

생성 모델은 제출 provenance의 null을 유지했다. 사람의 최종 검수·외부 문구 유사성 전수검증·토플 빈도 검증·앱 고지 연결은 미실행이다. 비침해·독점권·공식 토플 어휘 인증을 보장하지 않는다.

누적 후보 400개·추가 목표 100개. 기존 ChatGPT 웹 대화에서 계속 진행하며 새 요청 프롬프트·첨부 ZIP은 만들지 않았다. 로컬 검수용 제외 목록은 3,739개다.

```powershell
python scripts/review-special-vocabulary-batch.py --batch 008 --input-dir artifacts/vocabulary-review-008/input
```

앱 변경·운영 병합·빌드·토스 번들·Android APK·Capacitor 동기화는 이번 작업에서 실행하지 않았다.
