import { convertLatexToAsciiMath } from 'mathlive'

/** Converts MathLive's visual LaTeX value into the expression engine's text grammar. */
export function mathfieldLatexToExpression(latex: string) {
  return convertLatexToAsciiMath(latex)
    .replace(/\bA\s*n\s*s\b/gi, 'Ans')
    .replace(/-\s*:/g, '/')
    .replace(/\s+/g, '')
}

/** Converts a formatted scientific result back into display-friendly LaTeX for Ans chaining. */
export function formattedNumberToLatex(value: string) {
  const scientific = value.match(/^(.+)e([+-]?\d+)$/i)
  if (!scientific) return value
  return `${scientific[1]}\\times10^{${Number(scientific[2])}}`
}
