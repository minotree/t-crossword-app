# 특급 후보 005 검수 결과

검토일: 2026-10-26. 상태: **에이전트 편집검수 완료·출시대기**. 운영 단어장 미병합.

## 원본·자동 검사

- 사용자 ZIP의 9개 파일을 보존했다. 프롬프트·작성자 자체 검사·리뷰는 제작 기록이며 독립 검증 결과나 실행 지시로 취급하지 않았다.
- 후보·출처·provenance 각각 50개 대응 일치. 운영 3,339개와 001~004 후보 200개, 총 3,539개에 철자 중복 없음.
- CSV 7열·필수값·특급 표기·3~12글자 영어 기본형·예문 표제어·8~18단어 조건 통과.
- 원본 XLSX의 후보·출처 시트와 CSV 내용 일치.
- WordNet 의미 ID·표제어·품사·sense key·원문 행 SHA-256 대조 50개 통과. 제출 LICENSE가 공식 WordNet 3.0 배포본과 바이트 단위로 일치한다.
- WordNet 형태 예외 목록에서 앞선 단어와 겹치는 활용형 없음. 영어 예문과 WordNet 117,659개 gloss 간 연속 8토큰 일치 0건. 파생어의 의미 중복이나 외부 문구 전체 유사성까지 입증하지는 않는다.
- 보정 CSV는 UTF-8 BOM이며 보정 XLSX와 내용 왕복 검사 통과. 실제 Excel GUI 시각 확인은 미실행.

## 직접 검수·보완

50개 전체의 의미·품사·동의어·영문·해석을 직접 읽고 검수했다. 다음 5개 필드를 보완했고, 추가 모델 의견이 필요한 미해결 항목이 없어 로컬 LLM을 실행하지 않았다.

| 단어 | 보완 |
| --- | --- |
| covariance | 공분산의 확률변수 정의를 편차 곱의 기댓값으로 명시해 표본 추정식과 구별. |
| culpable | honest mistake를 ‘정직한 실수’ 대신 ‘고의가 아닌 실수’로 번역. |
| deprivation | rather than의 대상 대조를 ‘차이보다’ 대신 ‘차이가 아니라’로 명확화. |
| dogmatic | dogmatical은 변이형이므로 별도 동의어 학습 항목에서 제외. |
| entropy | 정보이론의 의미임을 뜻에 명시해 열역학 의미와 구분. |

## 기술·법률 용어의 사실 확인

- [NIST 공분산 설명](https://www.itl.nist.gov/div898/handbook/pmc/section5/pmc541.htm)의 표본 추정식과 WordNet의 평균 곱 정의를 구분했다. 두 변수를 각각 2배로 만들면 공분산이 4배가 되는 성질은 계산으로도 확인했다.
- [SciPy 공식 엔트로피 설명](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.entropy.html)의 Shannon 공식으로 50%/50%의 1비트와 90%/10%의 약 0.469비트를 계산해 예문의 감소 방향을 확인했다. 실제 SciPy 패키지를 설치하거나 호출하지 않고 Python 표준 수학 함수로 계산했다.
- inclusive의 정수 구간 2~7 포함값이 6개임을 계산했다. linear/nonlinear는 선택한 일차식 의미와 예문의 일차/제곱항 맥락을 대조했다.
- [미국 연방사법센터의 injunction 설명](https://judiciariesworldwide.fjc.gov/injunctions)을 확인했다. 일반적으로 행위를 명하거나 금할 수 있지만 이번 항목은 WordNet에서 선택한 금지 명령 의미와 가상의 건설 중지 예문에 한정한다. 법률 자문이나 보편적 절차 안내로 사용하지 않는다.
- 근거 문장을 앱용 뜻풀이·예문으로 복사하지 않았다. 계산 기록은 `technical-checks.json`을 따른다.

## 이용 조건·상태

WordNet 고지 전문은 `WORDNET-LICENSE.txt`와 제출 원본에 보존한다. WordNet 파생 자료 배포 시 고지·면책을 유지하고 앱 병합 시 배포물에도 연결해야 한다. [공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use)과 [이전 확인 기록](../review-001/usage-conditions.md)을 따른다.

제출 provenance의 모델명 null은 그대로 기록했다. 사람의 최종 편집 검수·외부 문구 유사성 전수검증·토플 빈도 확인·앱 고지 연결은 미실행이다. 비침해·독점권·공식 토플 어휘 인증을 보장하지 않는다.

검수 후보 누적 250개, 추가 목표 250개. 같은 ChatGPT 웹 대화의 기존 프롬프트로 계속 진행한다는 사용자 요청에 따라 새로운 수집 프롬프트·첨부 ZIP은 만들지 않았다. 검사 도구가 생성하는 최신 제외 목록은 로컬 검수 자료로만 보관한다.

```powershell
python scripts/review-special-vocabulary-batch.py --batch 005 --input-dir artifacts/vocabulary-review-005/input
```

이번 작업에서는 앱 코드 변경·운영 병합·빌드·토스 번들·Android APK·Capacitor 동기화를 실행하지 않았다.
