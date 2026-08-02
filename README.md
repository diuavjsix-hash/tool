# t·finder

누적확률 또는 유의수준과 자유도를 입력해 Student t 분포의 임계값을 계산하고, 선택한 확률 영역을 분포 곡선 위에 표시하는 정적 웹 애플리케이션입니다.

- 실행 사이트: <https://diuavjsix-hash.github.io/tool/>
- 저장소: <https://github.com/diuavjsix-hash/tool>
- 서버 및 회원가입 불필요
- 입력값과 계산 결과를 외부로 전송하지 않음

## 제공 기능

| 입력 방식 | 정의 | 계산에 사용하는 누적확률 |
| --- | --- | --- |
| 누적확률 | `p = P(T ≤ t)` | `p` |
| 우측 유의수준 | `α = P(T ≥ t)` | `1 - α` |
| 양측 유의수준 | `α = P(|T| ≥ t)` | `1 - α / 2` |

- 자유도 `1–1,000,000` 입력
- 자주 사용하는 확률과 자유도 프리셋
- Student t 분포의 PDF, CDF, 역 CDF 계산
- 확률 영역과 임계값을 함께 보여주는 반응형 그래프
- 결과 복사와 입력 오류 안내
- 키보드 포커스 및 모션 감소 설정 지원

## 기술 스택

| 기술 | 사용 목적 | 선택 이유 |
| --- | --- | --- |
| React 19 | 컴포넌트와 입력 상태 관리 | 계산기 종류가 늘어나도 화면을 기능별로 분리하기 쉬움 |
| TypeScript | 정적 타입 검사 | 확률, 자유도, 입력 모드 사이의 실수를 빌드 단계에서 발견 |
| Vite 8 | 개발 서버와 프로덕션 빌드 | 정적 GitHub Pages 앱에 필요한 구성이 가볍고 빠름 |
| Tailwind CSS 4 | 레이아웃과 반응형 스타일 | 반복되는 간격·색상·상태 스타일을 일관되게 관리 |
| shadcn/ui + Radix UI | 버튼, 입력, 탭, 툴팁 | 접근성을 갖춘 UI 원형을 프로젝트 안에서 직접 소유하고 일관되게 확장 |
| jStat | 통계 계산 | Student t 분포의 PDF, CDF, 역 CDF 제공 |
| Recharts | 분포 그래프 | React 상태와 함께 그래프를 선언적으로 갱신 |
| Motion | UI 전환 | 입력 모드, 결과, 그래프 전환을 절제된 모션으로 표현 |
| Zod 4 | 런타임 입력 검증 | 확률 범위와 정수 자유도 규칙을 한 곳에서 관리 |
| Vitest | 계산 회귀 테스트 | UI 테스트보다 적은 비용으로 핵심 수치 정확성을 보장 |

현재 서버 통신이나 복잡한 다단계 폼이 없으므로 TanStack Query, Zustand, React Hook Form은 사용하지 않습니다. 필요해지는 시점에만 추가합니다.

## 프로젝트 구조

```text
.
├─ .github/workflows/pages.yml   # 테스트·빌드·GitHub Pages 배포
├─ src/
│  ├─ components/
│  │  ├─ ui/                    # shadcn/ui 방식의 재사용 UI 컴포넌트
│  │  │  ├─ button.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ tabs.tsx
│  │  │  └─ tooltip.tsx
│  │  └─ DistributionChart.tsx  # Recharts 기반 t 분포 시각화
│  ├─ lib/
│  │  ├─ statistics.ts          # 검증, 확률 변환, t 계산, 그래프 데이터
│  │  ├─ statistics.test.ts     # 대표 임계값과 입력 규칙 테스트
│  │  └─ utils.ts               # shadcn/ui 클래스 병합 도우미
│  ├─ types/
│  │  └─ jstat.d.ts             # 실제 사용하는 jStat API의 최소 타입 선언
│  ├─ App.tsx                   # 계산기 화면과 React 상태
│  ├─ main.tsx                  # React 진입점
│  └─ styles.css                # Tailwind 테마와 전역 스타일
├─ index.html                   # Vite HTML 진입점
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml          # 의존성 빌드 허용 목록
└─ vite.config.ts               # `/tool/` Pages 기본 경로와 테스트 설정
```

### 코드 책임 원칙

- 통계 공식과 값 변환은 `src/lib/statistics.ts`에만 둡니다.
- 화면 컴포넌트에서 jStat을 직접 호출하지 않습니다.
- 그래프 표현은 `DistributionChart.tsx`에 한정합니다.
- 버튼·입력·탭 같은 공통 요소는 `src/components/ui`의 shadcn/ui 컴포넌트를 재사용합니다.
- 입력 규칙이 바뀌면 Zod 스키마와 Vitest를 함께 수정합니다.
- 새로운 계산기를 추가할 때 기존 계산 함수를 복사하지 말고 공통 분포 계층을 설계합니다.

## 로컬 개발

### 요구 사항

- Node.js 24 권장
- pnpm 11.9 이상
- Git

### 설치 및 실행

```bash
pnpm install
pnpm dev
```

개발 서버가 출력한 로컬 주소를 브라우저에서 엽니다.

### 품질 확인

```bash
pnpm test
pnpm build
```

- `pnpm test`: 통계 계산 테스트만 빠르게 한 번 실행합니다.
- `pnpm build`: TypeScript 검사 후 GitHub Pages용 `dist/`를 생성합니다.
- `pnpm test:watch`: 계산 로직을 작업할 때 변경 사항을 계속 감시합니다.

## 테스트 전략

테스트는 토큰과 실행 시간을 아끼면서 계산 정확도를 우선하도록 구성합니다.

현재 Vitest가 확인하는 핵심 사례:

- `df = 10`, `p = 0.975` → `t ≈ 2.228139`
- `df = 1`, `p = 0.975` → `t ≈ 12.706205`
- 역 CDF로 구한 t 값을 CDF에 다시 넣었을 때 원래 확률로 돌아오는지
- 양측 `α = 0.05`가 누적확률 `0.975`로 변환되는지
- 입력 모드 전환 시 같은 꼬리 확률이 유지되는지
- 잘못된 자유도와 확률 범위를 거부하는지

Playwright는 프로젝트 의존성에 포함하지 않습니다. 큰 UI 변경이나 배포 전 핵심 흐름을 확인할 때만 Codex의 브라우저 검증을 선택적으로 사용합니다. 기능이 여러 페이지로 커지면 별도의 Playwright 스모크 테스트 도입을 검토합니다.

## 디자인 원칙

- 통계 도구답게 입력, 결과, 해석을 첫 화면에서 바로 파악할 수 있어야 합니다.
- 종이색 배경, 짙은 잉크색, 하나의 주황 강조색을 유지합니다.
- 분포 그래프가 핵심 시각 요소이며 장식용 카드나 색상을 늘리지 않습니다.
- 모션은 모드 선택, 결과 변경, 그래프 갱신의 의미 전달에만 사용합니다.
- 모바일에서도 입력과 결과가 자연스러운 세로 흐름으로 이어져야 합니다.
- `prefers-reduced-motion` 사용자의 설정을 존중합니다.

## GitHub Pages 배포

`main` 브랜치에 변경 사항이 푸시되면 `.github/workflows/pages.yml`이 다음 순서로 실행됩니다.

1. pnpm 및 Node.js 설정
2. 잠금 파일 기준 의존성 설치
3. Vitest 계산 테스트
4. TypeScript 검사 및 Vite 빌드
5. `dist/`를 GitHub Pages에 배포

테스트나 빌드가 실패하면 사이트를 배포하지 않습니다. Vite의 `base`는 저장소 이름에 맞춰 `/tool/`로 설정되어 있습니다.

배포 확인:

1. 저장소의 **Actions** 탭에서 `Deploy static site to Pages` 실행 확인
2. 모든 단계가 초록색인지 확인
3. <https://diuavjsix-hash.github.io/tool/> 접속

## 지속 개발 절차

다른 Codex 채팅이나 다른 컴퓨터에서 작업을 시작할 때:

```bash
git switch main
git pull --ff-only
git switch -c codex/<작업-이름>
pnpm install
```

변경 후:

```bash
pnpm test
pnpm build
git status
```

확인된 파일만 스테이징하고 커밋합니다. 서로 다른 채팅에서 동시에 같은 파일을 수정하지 않는 것을 권장합니다.

Codex에 전달할 기본 요청 예시:

> `C:\Users\htt06\Documents\github_tool`의 t·finder를 이어서 개발해줘. 먼저 `git status`와 최신 main을 확인하고, 계산 로직 변경에는 Vitest를 실행해. 큰 UI 변경에서만 브라우저 검증을 사용하고, README와 테스트를 함께 갱신해줘.

## 기능 추가 체크리스트

- [ ] 사용자 관점의 입력과 결과 정의가 명확한가?
- [ ] 통계 공식과 꼬리 확률의 정의를 문서화했는가?
- [ ] 대표 기준값을 Vitest에 추가했는가?
- [ ] 극단값과 잘못된 입력을 처리하는가?
- [ ] 모바일과 키보드 조작이 가능한가?
- [ ] 불필요한 상태 관리·폼·서버 라이브러리를 추가하지 않았는가?
- [ ] `pnpm test`와 `pnpm build`가 통과하는가?
- [ ] README의 기능과 구조 설명을 갱신했는가?

## 발전 방향

우선순위 후보:

1. t 값에서 누적확률을 구하는 역방향 계산
2. 신뢰구간 계산기
3. 정규분포, 카이제곱분포, F 분포 계산기
4. 계산 결과를 URL 쿼리로 공유하는 기능
5. 한국어·영어 전환
6. 접근성 자동 검사 및 최소 Playwright 스모크 테스트

새 라이브러리는 기능 요구가 현재 도구로 해결되지 않을 때만 추가합니다.

## 문제 해결

### GitHub Pages에서 빈 화면이 나오는 경우

- `vite.config.ts`의 `base`가 `/tool/`인지 확인합니다.
- Actions에서 테스트·빌드·배포 중 어느 단계가 실패했는지 확인합니다.
- 브라우저 강력 새로고침 후 다시 확인합니다.

### pnpm이 의존성 빌드를 차단하는 경우

pnpm 11은 공급망 보안을 위해 의존성 설치 스크립트를 기본 차단합니다. 이 프로젝트는 Vite에 필요한 `esbuild`만 `pnpm-workspace.yaml`의 `allowBuilds`에서 허용합니다. 다른 패키지를 무조건 허용하지 말고, 실제 필요성과 출처를 검토한 후 명시적으로 추가합니다.

### 계산값이 예상과 다른 경우

- 누적확률, 우측 α, 양측 α 중 어떤 정의를 선택했는지 확인합니다.
- 자유도를 확인합니다.
- 신뢰할 수 있는 통계표 또는 다른 구현과 비교합니다.
- 재현되는 입력을 `statistics.test.ts`에 회귀 테스트로 추가합니다.
