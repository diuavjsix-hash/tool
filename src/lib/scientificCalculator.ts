/** A session-only calculation record. Both forms are kept so the visual formula can be restored. */
export interface HistoryEntry {
  id: string
  expression: string
  latex: string
  result: string
  value: number
  createdAt: number
}

export type CalculatorEvaluation =
  | { success: true; value: number }
  | { success: false; error: string }

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' | '%' }
  | { type: 'leftParen' }
  | { type: 'rightParen' }
  | { type: 'eof' }

type ExpressionNode =
  | { kind: 'number'; value: number }
  | { kind: 'constant'; name: 'pi' | 'e' | 'ans' }
  | { kind: 'unary'; operator: '+' | '-'; operand: ExpressionNode }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '^'; left: ExpressionNode; right: ExpressionNode }
  | { kind: 'function'; name: 'sqrt' | 'ln' | 'log'; argument: ExpressionNode }
  | { kind: 'percent'; operand: ExpressionNode }

class CalculatorError extends Error {}

export const MAX_EXPRESSION_LENGTH = 256

function normalizeExpression(expression: string) {
  return expression
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/√/g, 'sqrt')
}

function tokenize(expression: string): Token[] {
  const normalized = normalizeExpression(expression)
  const tokens: Token[] = []
  let cursor = 0

  while (cursor < normalized.length) {
    const remaining = normalized.slice(cursor)
    const character = normalized[cursor]

    if (/\s/.test(character)) {
      cursor += 1
      continue
    }

    const numberMatch = remaining.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/)
    if (numberMatch) {
      const value = Number(numberMatch[0])
      if (!Number.isFinite(value)) throw new CalculatorError('숫자가 너무 크거나 올바르지 않습니다.')
      tokens.push({ type: 'number', value })
      cursor += numberMatch[0].length
      continue
    }

    const identifierMatch = remaining.match(/^[A-Za-z]+/)
    if (identifierMatch) {
      tokens.push({ type: 'identifier', value: identifierMatch[0].toLowerCase() })
      cursor += identifierMatch[0].length
      continue
    }

    if (character === 'π') {
      tokens.push({ type: 'identifier', value: 'pi' })
      cursor += 1
      continue
    }

    if ('+-*/^%'.includes(character)) {
      tokens.push({ type: 'operator', value: character as Extract<Token, { type: 'operator' }>['value'] })
      cursor += 1
      continue
    }

    if (character === '(') {
      tokens.push({ type: 'leftParen' })
      cursor += 1
      continue
    }

    if (character === ')') {
      tokens.push({ type: 'rightParen' })
      cursor += 1
      continue
    }

    throw new CalculatorError(`'${character}' 문자는 계산할 수 없습니다.`)
  }

  tokens.push({ type: 'eof' })
  return tokens
}

class Parser {
  private cursor = 0

  constructor(private readonly tokens: Token[]) {}

  parse() {
    const expression = this.parseExpression(0)
    const next = this.peek()

    if (next.type === 'rightParen') throw new CalculatorError('닫는 괄호가 너무 많습니다.')
    if (next.type !== 'eof') throw new CalculatorError('수식을 끝까지 해석할 수 없습니다.')
    return expression
  }

  private parseExpression(minimumBindingPower: number): ExpressionNode {
    let left = this.parsePrefix()

    while (true) {
      const next = this.peek()

      if (next.type === 'operator' && next.value === '%') {
        if (50 < minimumBindingPower) break
        this.consume()
        left = { kind: 'percent', operand: left }
        continue
      }

      const explicitOperator = next.type === 'operator' && next.value !== '%' ? next.value : null
      const implicitMultiplication = !explicitOperator && this.startsImplicitMultiplication(next)
      const operator = implicitMultiplication ? '*' : explicitOperator
      if (!operator) break

      const bindingPower = this.bindingPower(operator)
      if (bindingPower.left < minimumBindingPower) break
      if (!implicitMultiplication) this.consume()

      const right = this.parseExpression(bindingPower.right)
      left = { kind: 'binary', operator, left, right }
    }

    return left
  }

  private parsePrefix(): ExpressionNode {
    const token = this.consume()

    if (token.type === 'number') return { kind: 'number', value: token.value }

    if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
      return { kind: 'unary', operator: token.value, operand: this.parseExpression(30) }
    }

    if (token.type === 'leftParen') {
      const expression = this.parseExpression(0)
      if (this.peek().type !== 'rightParen') throw new CalculatorError('괄호가 닫히지 않았습니다.')
      this.consume()
      return expression
    }

    if (token.type === 'identifier') {
      if (token.value === 'pi' || token.value === 'e' || token.value === 'ans') {
        return { kind: 'constant', name: token.value }
      }

      if (token.value === 'sqrt' || token.value === 'ln' || token.value === 'log') {
        if (this.peek().type !== 'leftParen') {
          throw new CalculatorError(`${token.value} 함수에는 괄호가 필요합니다.`)
        }
        this.consume()
        const argument = this.parseExpression(0)
        if (this.peek().type !== 'rightParen') throw new CalculatorError('함수의 괄호가 닫히지 않았습니다.')
        this.consume()
        return { kind: 'function', name: token.value, argument }
      }

      throw new CalculatorError(`'${token.value}' 함수 또는 상수를 찾을 수 없습니다.`)
    }

    if (token.type === 'rightParen') throw new CalculatorError('괄호 안에 계산할 식이 없습니다.')
    if (token.type === 'eof') throw new CalculatorError('계산할 수식을 입력해 주세요.')
    throw new CalculatorError('연산자 뒤에 숫자나 수식이 필요합니다.')
  }

  private bindingPower(operator: '+' | '-' | '*' | '/' | '^') {
    if (operator === '+' || operator === '-') return { left: 10, right: 11 }
    if (operator === '*' || operator === '/') return { left: 20, right: 21 }
    return { left: 40, right: 40 }
  }

  private startsImplicitMultiplication(token: Token) {
    return token.type === 'identifier' || token.type === 'leftParen'
  }

  private peek() {
    return this.tokens[this.cursor]
  }

  private consume() {
    return this.tokens[this.cursor++]
  }
}

function evaluateNode(node: ExpressionNode, answer?: number): number {
  if (node.kind === 'number') return node.value

  if (node.kind === 'constant') {
    if (node.name === 'pi') return Math.PI
    if (node.name === 'e') return Math.E
    if (answer === undefined) throw new CalculatorError('먼저 계산한 결과가 없어 Ans를 사용할 수 없습니다.')
    return answer
  }

  if (node.kind === 'unary') {
    const value = evaluateNode(node.operand, answer)
    return node.operator === '-' ? -value : value
  }

  if (node.kind === 'percent') return evaluateNode(node.operand, answer) / 100

  if (node.kind === 'function') {
    const value = evaluateNode(node.argument, answer)
    if (node.name === 'sqrt') {
      if (value < 0) throw new CalculatorError('음수의 제곱근은 실수 범위에서 계산할 수 없습니다.')
      return Math.sqrt(value)
    }
    if (value <= 0) throw new CalculatorError('로그는 0보다 큰 값에서만 계산할 수 있습니다.')
    return node.name === 'ln' ? Math.log(value) : Math.log10(value)
  }

  const left = evaluateNode(node.left, answer)
  let right = evaluateNode(node.right, answer)

  if ((node.operator === '+' || node.operator === '-') && node.right.kind === 'percent') {
    right = left * right
  }

  if (node.operator === '+') return left + right
  if (node.operator === '-') return left - right
  if (node.operator === '*') return left * right
  if (node.operator === '/') {
    if (right === 0) throw new CalculatorError('0으로 나눌 수 없습니다.')
    return left / right
  }

  const powered = Math.pow(left, right)
  if (Number.isNaN(powered)) throw new CalculatorError('이 거듭제곱은 실수 범위에서 계산할 수 없습니다.')
  return powered
}

function trimScientificNotation(value: string) {
  const [mantissa, exponent] = value.split('e')
  const trimmedMantissa = mantissa.replace(/\.?0+$/, '')
  const normalizedExponent = Number(exponent).toString()
  return `${trimmedMantissa}e${Number(normalizedExponent) >= 0 ? '+' : ''}${normalizedExponent}`
}

export function formatCalculatorResult(value: number) {
  if (!Number.isFinite(value)) return '—'
  const normalized = Object.is(value, -0) ? 0 : value
  if (normalized === 0) return '0'

  const absolute = Math.abs(normalized)
  if (absolute >= 1e12 || absolute < 1e-9) {
    return trimScientificNotation(normalized.toExponential(11))
  }

  return Number(normalized.toPrecision(12)).toString()
}

/** Safely tokenizes, parses, and evaluates one expression without eval or dynamic code execution. */
export function evaluateExpression(expression: string, answer?: number): CalculatorEvaluation {
  const trimmed = expression.trim()
  if (!trimmed) return { success: false, error: '계산할 수식을 입력해 주세요.' }
  if (trimmed.length > MAX_EXPRESSION_LENGTH) {
    return { success: false, error: `수식은 ${MAX_EXPRESSION_LENGTH}자 이하로 입력해 주세요.` }
  }

  try {
    const syntaxTree = new Parser(tokenize(trimmed)).parse()
    const value = evaluateNode(syntaxTree, answer)
    if (!Number.isFinite(value)) throw new CalculatorError('결과가 너무 크거나 정의되지 않았습니다.')
    return { success: true, value: Object.is(value, -0) ? 0 : value }
  } catch (error) {
    return {
      success: false,
      error: error instanceof CalculatorError ? error.message : '수식을 계산하지 못했습니다.',
    }
  }
}
