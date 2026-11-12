# 앱 아이콘

## Android 런처 아이콘 (2026-11-11)

- 토스 콘솔 등록용 밝은 배경 로고 `apps/toss/assets/branding/app-logo-light-600-v1.png`를 재사용한다. 제작·권리 확인 이력은 `apps/toss/assets/branding/README.md`를 따른다.
- `powershell -NoProfile -File scripts/prepare-android-icons.ps1`로 Android 5개 밀도의 일반·원형·적응형 전경 PNG 15개를 준비한다. System.Drawing으로 크기만 변환하며 새 이미지를 생성하지 않는다.
- 일반·원형은 48/72/96/144/192px, 적응형 전경은 108/162/216/324/432px다. 전경은 원본을 캔버스의 8/9 크기로 중앙 배치해 런처 마스크 여백을 확보한다. 기존 흰색 적응형 배경과 리소스 참조를 유지한다.
- APK 생성·설치 및 실제 Mi A1 런처의 모양·아이콘 캐시 갱신 확인은 미실행이다. 토스·PWA 아이콘은 변경하지 않는다.

- 적용일: 2026-10-16
- 현재 원본: `apps/web/public/icons/app-icon-source (2).png` (사용자가 추가 제공한 파란색 격자 이미지)
- 이전 원본: `apps/web/public/icons/app-icon-source.png` (보존)
- 제작 경위: 사용자가 대화에 첨부한 이미지를 앱 아이콘으로 사용하도록 요청하고 위 경로에 저장함.
- 변환: Windows System.Drawing의 HighQualityBicubic 보간으로 원본 전체를 정사각 PNG 32·180·192·512px로 축소. 투명 영역은 흰색 배경에 합성하고 재생성·크롭 없이 원본 구도를 유지함.
- 아이콘 URL 버전: `20261016-2`.
- 용도: 32px는 favicon, 180px는 Apple touch icon, 192·512px는 PWA manifest 아이콘.
- 원본의 제작 도구·모델·프롬프트·참조 자료·저작자·라이선스는 제공되지 않아 미확인. 사용자의 적용 요청을 기록한 것이며 외부 배포 권리 검토 완료를 의미하지 않음.
- maskable 전용 안전 영역을 검수하지 않았으므로 manifest의 purpose는 `any`로 지정함.
- 실제 설치 아이콘 갱신은 기기에서 별도 확인해야 함.
