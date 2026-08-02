import { describe, expect, it } from 'vitest'
import {
  calculate,
  convertModeValue,
  tCdf,
  tQuantile,
  toCumulativeProbability,
  validateInput,
} from './statistics'

describe('Student t distribution calculations', () => {
  it('calculates the 97.5th percentile with 10 degrees of freedom', () => {
    expect(tQuantile(0.975, 10)).toBeCloseTo(2.228139, 5)
  })

  it('calculates the 97.5th percentile with 1 degree of freedom', () => {
    expect(tQuantile(0.975, 1)).toBeCloseTo(12.706205, 5)
  })

  it('round-trips a quantile through the CDF', () => {
    const critical = tQuantile(0.995, 30)
    expect(tCdf(critical, 30)).toBeCloseTo(0.995, 8)
  })

  it('converts two-sided alpha to cumulative probability', () => {
    expect(toCumulativeProbability('two', 0.05)).toBeCloseTo(0.975, 12)
  })

  it('returns the correct two-sided critical value and interpretation', () => {
    const result = calculate({ mode: 'two', value: 0.05, degrees: 10 })
    expect(result.displayValue).toBe('±2.228139')
    expect(result.interpretation).toBe('P(|T| ≥ 2.228139) = 0.05')
  })

  it('preserves the selected tail when switching modes', () => {
    expect(convertModeValue('cumulative', 'right', 0.975)).toBeCloseTo(0.025, 12)
    expect(convertModeValue('right', 'two', 0.025)).toBeCloseTo(0.05, 12)
    expect(convertModeValue('cumulative', 'two', 0.975)).toBe(0.05)
  })

  it('rejects an invalid degree of freedom', () => {
    expect(validateInput({ mode: 'cumulative', value: 0.975, degrees: 0 }).success).toBe(false)
  })

  it('rejects a probability outside the selected mode range', () => {
    expect(validateInput({ mode: 'right', value: 0.9, degrees: 10 }).success).toBe(false)
  })
})
