import { describe, expect, it } from 'vitest'
import { formattedNumberToLatex, mathfieldLatexToExpression } from './mathfield'

describe('mathfield value conversion', () => {
  it('converts visual fractions, roots, powers, and operators to calculator expressions', () => {
    expect(mathfieldLatexToExpression('\\frac{1}{2}+\\sqrt{9}')).toBe('(1)/(2)+sqrt(9)')
    expect(mathfieldLatexToExpression('2^{3}\\times4\\div2')).toBe('2^3*4/2')
  })

  it('converts calculator constants and Ans', () => {
    expect(mathfieldLatexToExpression('2\\pi+\\mathrm{Ans}')).toBe('2pi+Ans')
  })

  it('formats scientific results for visual math input', () => {
    expect(formattedNumberToLatex('1.25e+12')).toBe('1.25\\times10^{12}')
    expect(formattedNumberToLatex('3.5e-9')).toBe('3.5\\times10^{-9}')
    expect(formattedNumberToLatex('2.5')).toBe('2.5')
  })
})
