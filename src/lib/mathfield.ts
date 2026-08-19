import { convertLatexToAsciiMath } from 'mathlive'

export function mathfieldLatexToExpression(latex: string) {
  return convertLatexToAsciiMath(latex)
    .replace(/\bA\s*n\s*s\b/gi, 'Ans')
    .replace(/-\s*:/g, '/')
    .replace(/\s+/g, '')
}

export function formattedNumberToLatex(value: string) {
  const scientific = value.match(/^(.+)e([+-]?\d+)$/i)
  if (!scientific) return value
  return `${scientific[1]}\\times10^{${Number(scientific[2])}}`
}
