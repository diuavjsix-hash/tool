import { describe, expect, it } from 'vitest'
import { evaluateExpression, formatCalculatorResult } from './scientificCalculator'

function expectValue(expression: string, expected: number, answer?: number) {
  const result = evaluateExpression(expression, answer)
  expect(result.success).toBe(true)
  if (result.success) expect(result.value).toBeCloseTo(expected, 10)
}

describe('scientific calculator expression engine', () => {
  it('respects arithmetic precedence and parentheses', () => {
    expectValue('2 + 3 × 4', 14)
    expectValue('(2 + 3) × 4', 20)
  })

  it('uses right-associative powers and mathematical unary-minus precedence', () => {
    expectValue('2^3^2', 512)
    expectValue('-2^2', -4)
    expectValue('(-2)^2', 4)
  })

  it('evaluates logarithms, roots, exponents, and constants', () => {
    expectValue('sqrt(81)', 9)
    expectValue('log(1000)', 3)
    expectValue('ln(e)', 1)
    expectValue('10^3 + e^ln(5)', 1005)
  })

  it('supports implicit multiplication and the previous answer', () => {
    expectValue('2π', 2 * Math.PI)
    expectValue('2(3 + 4)', 14)
    expectValue('(1 + 2)(3 + 4)', 21)
    expectValue('Ans × 1.1', 55, 50)
  })

  it('accepts scientific notation from a previous displayed result', () => {
    expectValue('1.25e+3 + 5', 1255)
  })

  it('uses calculator-style percentage semantics', () => {
    expectValue('200 + 10%', 220)
    expectValue('200 - 10%', 180)
    expectValue('200 × 10%', 20)
    expectValue('10%', 0.1)
  })

  it('returns Korean errors for invalid or undefined expressions', () => {
    expect(evaluateExpression('1 / 0')).toMatchObject({ success: false, error: '0으로 나눌 수 없습니다.' })
    expect(evaluateExpression('sqrt(-1)')).toMatchObject({ success: false })
    expect(evaluateExpression('ln(0)')).toMatchObject({ success: false })
    expect(evaluateExpression('(2 + 3')).toMatchObject({ success: false })
    expect(evaluateExpression('2 @ 3')).toMatchObject({ success: false })
    expect(evaluateExpression('Ans + 1')).toMatchObject({ success: false })
  })
})

describe('calculator result formatting', () => {
  it('uses up to twelve significant digits and normalizes negative zero', () => {
    expect(formatCalculatorResult(1 / 3)).toBe('0.333333333333')
    expect(formatCalculatorResult(0.1 + 0.2)).toBe('0.3')
    expect(formatCalculatorResult(-0)).toBe('0')
  })

  it('uses compact scientific notation for extreme values', () => {
    expect(formatCalculatorResult(1.234567890123e15)).toBe('1.23456789012e+15')
    expect(formatCalculatorResult(1.25e-12)).toBe('1.25e-12')
  })
})
