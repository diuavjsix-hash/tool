# tool·lab

[![Deploy to Pages](https://github.com/diuavjsix-hash/tool/actions/workflows/pages.yml/badge.svg)](https://github.com/diuavjsix-hash/tool/actions/workflows/pages.yml)
[![Pull request checks](https://github.com/diuavjsix-hash/tool/actions/workflows/quality.yml/badge.svg)](https://github.com/diuavjsix-hash/tool/actions/workflows/quality.yml)

통계 계산과 일반 수식을 한곳에서 처리하는 정적 계산 도구 모음입니다. 계정이나 백엔드 없이 브라우저에서만 동작합니다.

- 실행 사이트: <https://diuavjsix-hash.github.io/tool/>
- 저장소: <https://github.com/diuavjsix-hash/tool>

## 문서 안내

| 문서 | 언제 읽으면 좋은가 |
| --- | --- |
| [기여 가이드](CONTRIBUTING.md) | 로컬 실행, 변경 절차, 테스트와 PR 준비 |
| [아키텍처](docs/ARCHITECTURE.md) | 파일별 책임, 데이터 흐름, 새 도구·함수 추가 방법 |
| [계산 계약](docs/CALCULATION_CONTRACTS.md) | t 분포 및 수식 엔진의 입력·출력·오류·정밀도 규칙 |
| [유지보수·운영](docs/MAINTENANCE.md) | 배포, 의존성 갱신, 장애 대응, 정기 점검 |
| [보안 정책](SECURITY.md) | 취약점 제보와 개인정보·실행 경계 |

계산 결과를 바꾸는 작업이라면 [계산 계약](docs/CALCULATION_CONTRACTS.md)과 해당 단위 테스트를 먼저 확인하세요.

## 제공 도구

### Student's t distribution

- 누적확률, 우측 유의수준, 양측 유의수준으로 임계값 계산
- 자유도 `1–1,000,000`과 확률·자유도 프리셋
- Student t 분포 그래프와 선택 확률 영역 표시
- 입력 모드 전환 시 같은 꼬리 확률을 보존

### 공학용 계산기

- 실제 수학 표기의 루트, 지수, 로그와 위·아래 분수 입력
- 사칙연산, 괄호, 단항 음수, 일반 계산기 방식 퍼센트
- `π`, `e`, `Ans`, 암시적 곱셈과 최근 계산 30개
- 화면 키패드, 물리 키보드와 상·하·좌·우 수식 커서 이동
- `eval` 없이 전용 토큰화·파싱·평가 엔진으로 계산

## 빠른 시작

요구 환경은 Node.js 24, pnpm 11.9 이상과 Git입니다. `.nvmrc`와 `packageManager`가 기준 버전을 고정합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

커밋 전 전체 검증:

```bash
pnpm check
```

`pnpm check`는 문서 링크, Vitest, TypeScript·프로덕션 빌드와 번들 크기 예산을 순서대로 검사합니다. 개별 명령은 다음과 같습니다.

| 명령 | 역할 |
| --- | --- |
| `pnpm test` | 계산·변환·라우팅 단위 테스트 |
| `pnpm test:watch` | 개발 중 관련 테스트 반복 실행 |
| `pnpm typecheck` | TypeScript 정적 검사 |
| `pnpm build` | 타입 검사 후 `dist` 프로덕션 빌드 |
| `pnpm check:docs` | Markdown 내부 문서 링크 검사 |
| `pnpm check:bundle` | 빌드된 주요 청크의 크기 예산 검사 |
| `pnpm preview` | 프로덕션 빌드 로컬 확인 |

## 구조 요약

```text
src/
├─ pages/                    화면 상태와 사용자 상호작용
├─ components/               그래프와 공용 UI
├─ lib/
│  ├─ statistics.ts          t 분포 검증·계산·그래프 데이터
│  ├─ scientificCalculator.ts 수식 토큰화·파싱·평가·표시
│  ├─ mathfield.ts           시각 수식과 엔진 문법 사이 변환
│  └─ routing.ts             해시 경로의 단일 규칙
├─ App.tsx                   공통 셸과 지연 로딩
└─ styles.css                디자인 토큰과 전역 스타일
```

공학용 계산기의 핵심 경계는 다음과 같습니다.

```text
MathLive 시각 수식 → 텍스트 문법 변환 → 토큰화 → 파싱 → 평가 → 결과 형식화
```

MathLive는 입력과 렌더링만 담당하며 계산 결과를 결정하지 않습니다. 자세한 책임과 확장 절차는 [아키텍처 문서](docs/ARCHITECTURE.md)에 있습니다.

## 경로와 배포

GitHub Pages 새로고침과 직접 링크를 위해 해시 경로를 사용합니다.

| URL | 화면 |
| --- | --- |
| `/tool/#/` | 도구 홈 |
| `/tool/#/t` | t 임계값 계산기 |
| `/tool/#/scientific` | 공학용 계산기 |

`main` 푸시는 테스트와 빌드가 성공한 경우에만 GitHub Pages로 배포됩니다. Pull Request에는 별도의 품질 검사 워크플로가 실행됩니다.

## 개인정보와 계산 범위

- 입력·결과·계산 기록을 서버, 쿠키 또는 브라우저 저장소에 저장하지 않습니다.
- 최근 기록은 현재 React 세션에만 있으며 새로고침하면 사라집니다.
- 내부 정밀도는 JavaScript `Number`를 따르며 결과는 최대 12자리 유효숫자로 표시합니다.
- 결과는 학습·참고용 일반 계산값이며 금융상품, 회계 또는 법적 규칙을 별도로 적용하지 않습니다.

새 기능을 제안하거나 계산 결과 오류를 발견했다면 GitHub 이슈 템플릿에 입력값, 예상값과 실제값을 함께 남겨 주세요.
