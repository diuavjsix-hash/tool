# 아키텍처

## 목표와 불변 조건

tool·lab은 GitHub Pages에서 동작하는 클라이언트 전용 계산 도구입니다. 구조를 바꿀 때 다음 조건을 우선합니다.

1. 계산은 브라우저 안에서 끝나며 사용자 입력을 외부로 전송하지 않습니다.
2. 계산 규칙은 화면과 분리된 순수 함수로 두고 단위 테스트할 수 있어야 합니다.
3. 도구별 무거운 의존성은 해당 페이지와 함께 지연 로딩합니다.
4. 해시 URL은 직접 링크와 뒤로·앞으로 이동을 지원해야 합니다.
5. 기존 계산의 대표값과 오류 의미를 의도 없이 바꾸지 않습니다.

## 모듈 지도

| 위치 | 책임 | 변경 시 주의점 |
| --- | --- | --- |
| `src/App.tsx` | 공통 헤더, 현재 라우트 상태, 페이지 지연 로딩 | 새 도구는 lazy import와 페이지 선택 추가 |
| `src/lib/routing.ts` | 해시 해석, 정규 링크, 페이지 제목 | `routing.test.ts`와 함께 변경 |
| `src/pages/HomePage.tsx` | 도구 홈의 소개 행 | 새 도구 진입점 추가 |
| `src/pages/TCalculatorPage.tsx` | t 입력 상태, 모드 전환, 결과 표시 | 계산식은 `statistics.ts`에 유지 |
| `src/lib/statistics.ts` | 검증, 확률 변환, t PDF·CDF·역 CDF, 그래프 데이터 | jStat 경계와 대표값 테스트 유지 |
| `src/components/DistributionChart.tsx` | t 분포 시각화 | 계산 결과를 재해석하지 않음 |
| `src/pages/ScientificCalculatorPage.tsx` | MathLive 필드, 키패드, 기록, 결과 UI | 문법은 엔진에 위임하고 기록은 세션에만 유지 |
| `src/lib/mathfield.ts` | MathLive LaTeX와 엔진 텍스트 문법 사이 변환 | 라이브러리 갱신 시 변환 테스트 우선 |
| `src/lib/scientificCalculator.ts` | 토큰화, Pratt 파싱, 평가, 결과 형식화 | 공개 계약과 오류 문구를 테스트로 고정 |
| `src/styles.css` | 색상 토큰, 계산기·그래프 공통 스타일 | 포커스, 오버플로, 모션 감소 확인 |

## 라우팅과 번들 경계

라우팅은 외부 라우터 없이 `window.location.hash`를 사용합니다.

```text
URL hash
  → routeFromHash()
  → AppRoute 상태
  → React.lazy 페이지 선택
  → document.title 갱신
```

알 수 없는 경로는 `#/`로 정리합니다. `vite.config.ts`의 `base: '/tool/'`과 해시 경로는 서로 다른 책임입니다. `base`는 정적 자산 위치, 해시는 클라이언트 화면 위치를 결정합니다.

공학용 계산기의 MathLive와 t 계산기의 Recharts·jStat은 각 페이지 청크에 남아야 합니다. 새 도구도 정적 import로 `App.tsx`에 합치지 말고 `React.lazy`를 사용합니다.

## t 계산기 데이터 흐름

```text
사용자 입력
  → Zod validateInput()
  → toCumulativeProbability()
  → jStat inverse CDF
  → CalculationResult
  ├─ 결과·해석 문구
  └─ createDistributionData() → Recharts
```

페이지는 입력 모드와 표시만 관리합니다. 확률 변환, 반올림과 해석 문구는 `statistics.ts`가 소유합니다. 모드를 바꿀 때 `convertModeValue()`가 같은 꼬리 확률을 최대한 보존하고 새 모드 범위로 제한합니다.

## 공학용 계산기 데이터 흐름

```text
MathLive 시각 수식(LaTeX)
  → mathfieldLatexToExpression()
  → 안전한 텍스트 문법
  → tokenize()
  → Pratt Parser / AST
  → evaluateNode()
  → formatCalculatorResult()
  → 결과와 세션 기록
```

중요한 경계는 다음과 같습니다.

- MathLive는 수식 편집과 시각 표현만 담당합니다.
- `mathfield.ts`는 `\frac`, `\sqrt`, 위첨자와 연산 기호를 엔진 문법으로 바꿉니다.
- `scientificCalculator.ts`만 숫자 의미와 퍼센트 규칙을 결정합니다.
- 기록에는 재계산용 텍스트 식과 시각 복원용 LaTeX를 모두 저장합니다.
- 기록은 `ScientificCalculatorPage`의 React 상태이며 저장소나 서버에 쓰지 않습니다.

### 파서 우선순위

엔진은 Pratt parser를 사용합니다. 높은 숫자가 먼저 결합합니다.

| 연산 | 결합력 | 결합 방향 |
| --- | ---: | --- |
| 후위 `%` | 50 | 후위 |
| `^` | 40 | 오른쪽 |
| 단항 `+`, `-` | 30 | 전위 |
| `*`, `/`, 암시적 곱셈 | 20 | 왼쪽 |
| `+`, `-` | 10 | 왼쪽 |

따라서 `-2^2`는 `-(2^2)`이고 `2^3^2`는 `2^(3^2)`입니다.

## 상태 소유권

| 상태 | 소유자 | 수명 |
| --- | --- | --- |
| 현재 경로 | `App` | 탭의 URL 수명 |
| t 입력·결과 | `TCalculatorPage` | 페이지가 마운트된 동안 |
| MathLive 필드 | `ScientificCalculatorPage` ref | 페이지가 마운트된 동안 |
| `Ans`, 결과, 오류 | `ScientificCalculatorPage` state | 페이지가 마운트된 동안 |
| 최근 기록 최대 30개 | `ScientificCalculatorPage` state | 새로고침 전까지 |
| 사용자 데이터 영구 저장 | 없음 | 해당 없음 |

## 새 도구 추가 절차

1. `src/pages/<ToolName>Page.tsx`를 만듭니다.
2. 계산 로직은 `src/lib/`의 독립 모듈과 테스트로 만듭니다.
3. `AppRoute`, `routeTitles`, `routeFromHash()`, `hashForRoute()`를 확장합니다.
4. `App.tsx`에 lazy import, 페이지 선택과 헤더 링크를 추가합니다.
5. `HomePage.tsx`에 도구 소개 행을 추가합니다.
6. 직접 링크, 잘못된 링크, 뒤로·앞으로 이동을 테스트합니다.
7. README, 계산 계약과 브라우저 검증 목록을 갱신합니다.
8. 번들 예산이 필요하면 `scripts/check-bundle-size.mjs`에 청크를 추가합니다.

## 새 수식 함수 추가 절차

예를 들어 삼각함수를 추가할 때는 다음 경계를 모두 갱신해야 합니다.

1. tokenizer가 인식할 식별자를 정합니다.
2. AST의 함수 이름 union과 parser 허용 목록을 확장합니다.
3. evaluator에 정의역·단위·오류 규칙을 구현합니다.
4. MathLive 버튼의 빈 템플릿과 선택 영역 템플릿을 추가합니다.
5. LaTeX→엔진 변환, 정상값, 경계값과 오류 테스트를 추가합니다.
6. [계산 계약](CALCULATION_CONTRACTS.md)에 의미와 제한을 기록합니다.

삼각함수라면 라디안/도 단위 선택이 계산 의미를 바꾸므로 UI보다 계약을 먼저 결정해야 합니다.

## 의도적으로 두지 않은 것

- 백엔드, 로그인, 원격 분석과 사용자 추적
- 계산 기록의 영구 저장
- 범용 CAS, 복소수 또는 임의 정밀도 연산
- 서버 라우팅이 필요한 path-based SPA 라우터

이 제약을 바꾸는 기능은 단순 UI 변경이 아니라 아키텍처 결정으로 취급하고, 개인정보·정밀도·배포 영향을 문서와 함께 검토합니다.
