import { jStat } from 'jstat'
import { z } from 'zod'

export const probabilityModes = ['cumulative', 'right', 'two'] as const
export type ProbabilityMode = (typeof probabilityModes)[number]

export interface ModeConfig {
  label: string
  hint: string
  symbol: 'p' | 'α'
  min: number
  max: number
  step: number
  defaultValue: number
  presets: number[]
  caption: string
  formula: string
}

export const modeConfig: Record<ProbabilityMode, ModeConfig> = {
  cumulative: {
    label: '누적확률',
    hint: 'P(T ≤ t)',
    symbol: 'p',
    min: 0.001,
    max: 0.999,
    step: 0.001,
    defaultValue: 0.975,
    presets: [0.9, 0.95, 0.975, 0.99, 0.995],
    caption: '왼쪽 누적 영역',
    formula: 't = F⁻¹df(p)',
  },
  right: {
    label: '우측 유의수준',
    hint: 'α = P(T ≥ t)',
    symbol: 'α',
    min: 0.001,
    max: 0.25,
    step: 0.001,
    defaultValue: 0.025,
    presets: [0.1, 0.05, 0.025, 0.01, 0.005],
    caption: '오른쪽 꼬리 영역',
    formula: 't = F⁻¹df(1 − α)',
  },
  two: {
    label: '양측 유의수준',
    hint: 'α = P(|T| ≥ t)',
    symbol: 'α',
    min: 0.002,
    max: 0.5,
    step: 0.001,
    defaultValue: 0.05,
    presets: [0.2, 0.1, 0.05, 0.02, 0.01],
    caption: '양쪽 꼬리 영역',
    formula: '±t = ±F⁻¹df(1 − α/2)',
  },
}

const inputSchema = z
  .object({
    mode: z.enum(probabilityModes),
    value: z.number().finite(),
    degrees: z.number().int().min(1).max(1_000_000),
  })
  .superRefine(({ mode, value }, context) => {
    const config = modeConfig[mode]
    if (value < config.min || value > config.max) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: `${config.min} 이상 ${config.max} 이하로 입력해 주세요.`,
      })
    }
  })

export type CalculatorInput = z.infer<typeof inputSchema>

export interface CalculationResult {
  cumulativeProbability: number
  criticalValue: number
  displayValue: string
  interpretation: string
}

export interface DistributionPoint {
  x: number
  density: number
  shade: number | null
}

export function validateInput(input: CalculatorInput) {
  return inputSchema.safeParse(input)
}

export function toCumulativeProbability(mode: ProbabilityMode, value: number) {
  if (mode === 'right') return 1 - value
  if (mode === 'two') return 1 - value / 2
  return value
}

export function tQuantile(probability: number, degrees: number) {
  return jStat.studentt.inv(probability, degrees)
}

export function tCdf(value: number, degrees: number) {
  return jStat.studentt.cdf(value, degrees)
}

export function tDensity(value: number, degrees: number) {
  return jStat.studentt.pdf(value, degrees)
}

export function formatNumber(value: number, digits = 6) {
  if (!Number.isFinite(value)) return '—'
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000) return value.toExponential(5)
  return value.toFixed(digits).replace(/\.?0+$/, '')
}

export function formatProbability(value: number) {
  return Number(value.toFixed(6)).toString()
}

export function calculate(input: CalculatorInput): CalculationResult {
  const validation = inputSchema.parse(input)
  const cumulativeProbability = toCumulativeProbability(validation.mode, validation.value)
  const criticalValue = tQuantile(cumulativeProbability, validation.degrees)
  const absoluteCritical = Math.abs(criticalValue)

  if (validation.mode === 'two') {
    return {
      cumulativeProbability,
      criticalValue,
      displayValue: `±${formatNumber(absoluteCritical)}`,
      interpretation: `P(|T| ≥ ${formatNumber(absoluteCritical)}) = ${formatProbability(validation.value)}`,
    }
  }

  if (validation.mode === 'right') {
    return {
      cumulativeProbability,
      criticalValue,
      displayValue: formatNumber(criticalValue),
      interpretation: `P(T ≥ ${formatNumber(criticalValue)}) = ${formatProbability(validation.value)}`,
    }
  }

  return {
    cumulativeProbability,
    criticalValue,
    displayValue: formatNumber(criticalValue),
    interpretation: `P(T ≤ ${formatNumber(criticalValue)}) = ${formatProbability(cumulativeProbability)}`,
  }
}

export function createDistributionData(
  mode: ProbabilityMode,
  degrees: number,
  criticalValue: number,
): DistributionPoint[] {
  const absoluteCritical = Math.abs(criticalValue)
  const extent = Math.max(4.5, Math.min(500, absoluteCritical * 1.35 + 1.2))
  const pointCount = 420

  return Array.from({ length: pointCount + 1 }, (_, index) => {
    const x = -extent + (2 * extent * index) / pointCount
    const density = tDensity(x, degrees)
    const shaded =
      mode === 'two'
        ? Math.abs(x) >= absoluteCritical
        : mode === 'right'
          ? x >= criticalValue
          : x <= criticalValue

    return { x, density, shade: shaded ? density : null }
  })
}

export function convertModeValue(
  previousMode: ProbabilityMode,
  nextMode: ProbabilityMode,
  currentValue: number,
) {
  const cumulative = toCumulativeProbability(previousMode, currentValue)
  let nextValue = cumulative

  if (nextMode === 'right') nextValue = 1 - cumulative
  if (nextMode === 'two') nextValue = 2 * Math.min(cumulative, 1 - cumulative)

  const config = modeConfig[nextMode]
  const clamped = Math.min(config.max, Math.max(config.min, nextValue))
  return Number(clamped.toFixed(6))
}
