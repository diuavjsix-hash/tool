# 유지보수와 운영

## 자동 품질 관문

### Pull Request

`.github/workflows/quality.yml`이 `main` 대상 PR에서 `pnpm check`를 실행합니다. 문서 링크, 단위 테스트, TypeScript·빌드와 번들 예산 중 하나라도 실패하면 병합하지 않습니다.

### GitHub Pages

`.github/workflows/pages.yml`은 `main` 푸시와 수동 실행에서 다음 순서로 동작합니다.

1. 잠금 파일 기준 의존성 설치
2. `pnpm check`
3. Pages 구성과 `dist` 업로드
4. GitHub Pages 배포

배포 주소는 <https://diuavjsix-hash.github.io/tool/>이며 Vite `base`는 `/tool/`입니다.

## 번들 예산

`scripts/check-bundle-size.mjs`가 빌드 후 주요 JavaScript 청크의 비압축 크기를 검사합니다.

| 청크 | 예산 | 이유 |
| --- | ---: | --- |
| 공통 진입 | 450 KiB | 홈과 공통 셸의 초기 비용 제한 |
| t 계산기 | 550 KiB | Recharts와 jStat 포함 |
| 공학용 계산기 | 900 KiB | MathLive 포함 |

공학용 계산기 청크는 크지만 지연 로딩됩니다. 예산을 올리기 전에 중복 의존성, import 위치와 더 작은 대안을 먼저 검토하고 PR에 이유를 남깁니다.

## 정기 점검

### 매월

- Dependabot npm·GitHub Actions PR 검토
- `pnpm outdated`로 보류된 주요 버전 확인
- 배포 워크플로 최근 성공 여부와 실제 사이트 기본 계산 확인
- 브라우저 콘솔 오류와 모바일 가로 넘침 확인

### 기능 출시 전

- [계산 계약](CALCULATION_CONTRACTS.md)과 단위 테스트 일치
- 대표 t 값과 퍼센트·루트·분수 회귀 확인
- 홈, 직접 링크, 뒤로·앞으로 이동
- 데스크톱·모바일, 키보드와 스크린리더 상태 문구
- 개인정보 저장·전송 또는 새 외부 요청 유무 확인
- README와 변경 관련 문서 갱신

## 의존성 갱신 절차

1. 공식 릴리스 노트와 migration 문서를 읽습니다.
2. 한 PR에는 관련된 의존성 묶음만 갱신합니다.
3. 잠금 파일의 예상하지 않은 패키지 교체를 검토합니다.
4. `pnpm check`를 실행합니다.
5. UI 의존성은 실제 브라우저 검증을 추가합니다.

특히 다음 의존성은 별도 확인이 필요합니다.

- `mathlive`: LaTeX 변환, 키보드, 커서, Shadow DOM 스타일
- `jstat`: t inverse CDF 기준값과 극단 확률
- `recharts`: 그래프 영역, 반응형 크기와 툴팁
- `react`·`vite`: 지연 로딩, 빌드 청크와 GitHub Pages 자산 경로
- `tailwindcss`: 동적 class 탐지와 전역 디자인 토큰

## 배포 확인

배포가 성공한 뒤 최소한 다음 URL을 엽니다.

- `/tool/#/`
- `/tool/#/t`
- `/tool/#/scientific`

확인할 대표 동작:

```text
t: p=0.975, df=10 → 2.228139
calculator: 200 + 10% → 220
calculator: √9 → 3
calculator: 1/2 → 0.5
```

정적 자산이 404라면 `vite.config.ts`의 `base`, Pages artifact 경로와 배포 URL을 먼저 비교합니다. 화면이 홈으로 돌아가면 URL의 `#/` 이후 경로와 `routing.ts`를 확인합니다.

## 장애 대응과 롤백

1. GitHub Actions 로그에서 설치, 테스트, 빌드, 업로드, 배포 중 실패 단계를 찾습니다.
2. 로컬에서 같은 Node·pnpm 버전과 `pnpm install --frozen-lockfile`, `pnpm check`로 재현합니다.
3. 최근 변경이 원인이고 즉시 수정이 어렵다면 문제 커밋을 `git revert`하는 새 커밋을 만듭니다.
4. `git reset --hard`나 원격 강제 푸시로 공개 기록을 지우지 않습니다.
5. 복구 후 대표 계산과 직접 링크를 다시 확인합니다.

### 증상별 점검

| 증상 | 우선 확인 |
| --- | --- |
| 빈 화면·자산 404 | Vite `/tool/` base, Pages artifact, 브라우저 콘솔 |
| 직접 링크가 홈으로 이동 | `routeFromHash()` 허용 목록과 canonical hash |
| 수식은 보이나 계산 실패 | `mathfieldLatexToExpression()` 출력과 엔진 grammar |
| 방향키·분수 이동 이상 | MathLive 버전, command 이름, placeholder selection |
| t 값 차이 | 입력 모드 변환, jStat 버전, 기준값 테스트 |
| 빌드 청크 누락 | lazy import 이름과 bundle 검사 정규식 |

## 개인정보·보안 점검

현재 앱에는 백엔드, 인증, 분석 SDK, 네트워크 API와 영구 저장소가 없습니다. 다음 항목을 추가하면 배포 전 별도 검토가 필요합니다.

- `fetch`, WebSocket 또는 외부 SDK
- `localStorage`, IndexedDB, 쿠키
- 사용자 입력이 포함된 URL 또는 오류 보고
- 클립보드 읽기, 파일 업로드·다운로드
- 서드파티 폰트·이미지·스크립트

계산 엔진에는 `eval`, `new Function` 또는 임의 JavaScript 실행을 도입하지 않습니다.

## 문서 유지

- 새 결정은 관련 문서의 “왜”까지 갱신합니다.
- 파일명이나 링크를 바꾼 뒤 `pnpm check:docs`를 실행합니다.
- 계산 예시는 단위 테스트와 같은 값을 사용합니다.
- 문서에 현재 동작과 계획을 섞지 않습니다. 미구현 기능은 “현재 범위 밖”으로 명시합니다.
