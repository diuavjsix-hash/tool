import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, ChevronDown, Copy, Delete, History, ShieldCheck, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import {
  evaluateExpression,
  formatCalculatorResult,
  type HistoryEntry,
} from '../lib/scientificCalculator'
import { cn } from '../lib/utils'

type InputKind = 'value' | 'operator'

interface CalculatorKeyProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'number' | 'operator' | 'function' | 'action' | 'equals'
}

function CalculatorKey({ tone = 'number', className, children, onMouseDown, ...props }: CalculatorKeyProps) {
  return (
    <button
      type="button"
      className={cn(
        'calculator-key h-12 rounded-xl border text-sm font-semibold tabular-nums outline-none transition-[transform,background-color,border-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-px sm:h-13',
        tone === 'number' && 'border-border bg-background text-foreground hover:border-primary/25 hover:bg-accent/55',
        tone === 'operator' && 'border-primary/15 bg-secondary text-secondary-foreground hover:bg-secondary/72',
        tone === 'function' && 'border-border/80 bg-muted/70 text-foreground hover:border-primary/25 hover:bg-accent',
        tone === 'action' && 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
        tone === 'equals' && 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        className,
      )}
      onMouseDown={(event) => {
        event.preventDefault()
        onMouseDown?.(event)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function timeLabel(timestamp: number) {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}

export default function ScientificCalculatorPage() {
  const reduceMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const [expression, setExpression] = useState('')
  const [displayResult, setDisplayResult] = useState('0')
  const [answer, setAnswer] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [copied, setCopied] = useState(false)

  const focusInput = (position: number) => {
    selectionRef.current = { start: position, end: position }
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(position, position)
    })
  }

  const selection = (base: string) => {
    const start = Math.min(selectionRef.current.start, base.length)
    const end = Math.min(selectionRef.current.end, base.length)
    return { start, end }
  }

  const editingContext = (kind: InputKind) => {
    if (justEvaluated) {
      const base = kind === 'operator' && answer !== null ? formatCalculatorResult(answer) : ''
      return { base, start: base.length, end: base.length }
    }

    const range = selection(expression)
    return { base: expression, ...range }
  }

  const updateExpression = (nextExpression: string, caret: number) => {
    setExpression(nextExpression.slice(0, 256))
    setJustEvaluated(false)
    setError(null)
    focusInput(Math.min(caret, 256))
  }

  const insertToken = (token: string, kind: InputKind = 'value') => {
    const { base, start, end } = editingContext(kind)
    const next = `${base.slice(0, start)}${token}${base.slice(end)}`
    updateExpression(next, start + token.length)
  }

  const wrapSelection = (prefix: string, suffix = ')') => {
    let { base, start, end } = editingContext('value')

    if (justEvaluated && answer !== null) {
      const previousResult = formatCalculatorResult(answer)
      base = previousResult
      start = 0
      end = previousResult.length
    }

    const selected = base.slice(start, end)
    const replacement = `${prefix}${selected}${suffix}`
    const next = `${base.slice(0, start)}${replacement}${base.slice(end)}`
    const caret = selected ? start + replacement.length : start + prefix.length
    updateExpression(next, caret)
  }

  const appendSquare = () => {
    const { base, start, end } = editingContext('operator')
    const selected = base.slice(start, end)
    const replacement = selected ? `(${selected})^2` : '^2'
    const next = `${base.slice(0, start)}${replacement}${base.slice(end)}`
    updateExpression(next, start + replacement.length)
  }

  const toggleSign = () => {
    if (justEvaluated && answer !== null) {
      const next = `-(${formatCalculatorResult(answer)})`
      updateExpression(next, next.length)
      return
    }

    const { start, end } = selection(expression)
    const selected = expression.slice(start, end)
    if (selected) {
      const replacement = `-(${selected})`
      updateExpression(`${expression.slice(0, start)}${replacement}${expression.slice(end)}`, start + replacement.length)
      return
    }

    if (expression.startsWith('-(') && expression.endsWith(')')) {
      const unwrapped = expression.slice(2, -1)
      updateExpression(unwrapped, unwrapped.length)
      return
    }

    const next = expression ? `-(${expression})` : '-'
    updateExpression(next, next.length)
  }

  const deleteBackward = () => {
    if (justEvaluated) {
      setExpression('')
      setDisplayResult('0')
      setError(null)
      setJustEvaluated(false)
      focusInput(0)
      return
    }

    const { start, end } = selection(expression)
    if (start !== end) {
      updateExpression(`${expression.slice(0, start)}${expression.slice(end)}`, start)
      return
    }
    if (start === 0) return
    updateExpression(`${expression.slice(0, start - 1)}${expression.slice(end)}`, start - 1)
  }

  const clearCalculator = () => {
    setExpression('')
    setDisplayResult('0')
    setAnswer(null)
    setError(null)
    setJustEvaluated(false)
    focusInput(0)
  }

  const calculateCurrentExpression = () => {
    const evaluation = evaluateExpression(expression, answer ?? undefined)
    if (!evaluation.success) {
      setDisplayResult('—')
      setError(evaluation.error)
      setJustEvaluated(false)
      return
    }

    const formatted = formatCalculatorResult(evaluation.value)
    const createdAt = Date.now()
    setDisplayResult(formatted)
    setAnswer(evaluation.value)
    setError(null)
    setJustEvaluated(true)
    setHistory((current) => [
      {
        id: `${createdAt}-${current.length}`,
        expression: expression.trim(),
        result: formatted,
        value: evaluation.value,
        createdAt,
      },
      ...current,
    ].slice(0, 30))
  }

  const copyResult = async () => {
    if (displayResult === '—') return
    await navigator.clipboard.writeText(displayResult)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const restoreHistory = (entry: HistoryEntry) => {
    setExpression(entry.expression)
    setDisplayResult(entry.result)
    setAnswer(entry.value)
    setError(null)
    setJustEvaluated(false)
    focusInput(entry.expression.length)
  }

  return (
    <main className="mx-auto w-[min(1200px,calc(100%-24px))] pb-12 pt-8 sm:w-[min(1200px,calc(100%-32px))] sm:pt-12 lg:pb-20 lg:pt-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 max-w-2xl sm:mb-9"
      >
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          EXPRESSION CALCULATOR
        </div>
        <h1 className="text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.055em]">
          수식을 쓰고, <span className="text-primary">한 번에</span> 계산하세요.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          퍼센트와 괄호, 거듭제곱, 로그와 지수 함수를 키패드 또는 키보드로 입력할 수 있습니다.
        </p>
      </motion.div>

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_24px_70px_-32px_rgba(15,40,33,0.28)] lg:grid lg:grid-cols-[minmax(0,1fr)_300px]"
        aria-label="공학용 계산기"
      >
        <div className="min-w-0 p-4 sm:p-7 lg:p-9">
          <div className="calculator-display rounded-[20px] border border-border/80 bg-muted/38 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="calculator-expression" className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">EXPRESSION</label>
              <span className="hidden text-[10px] text-muted-foreground sm:inline">Enter로 계산 · Esc로 초기화</span>
            </div>
            <input
              ref={inputRef}
              id="calculator-expression"
              value={expression}
              maxLength={256}
              spellCheck={false}
              autoComplete="off"
              inputMode="text"
              placeholder="예: 200 + 10% 또는 ln(e^5)"
              onChange={(event) => {
                setExpression(event.target.value)
                selectionRef.current = {
                  start: event.target.selectionStart ?? event.target.value.length,
                  end: event.target.selectionEnd ?? event.target.value.length,
                }
                setError(null)
                setJustEvaluated(false)
              }}
              onSelect={(event) => {
                selectionRef.current = {
                  start: event.currentTarget.selectionStart ?? expression.length,
                  end: event.currentTarget.selectionEnd ?? expression.length,
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  calculateCurrentExpression()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  clearCalculator()
                }
              }}
              aria-describedby="calculator-status"
              className="mt-3 w-full border-0 bg-transparent p-0 font-mono text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/65 sm:text-lg"
            />

            <div className="mt-6 flex min-h-20 items-end justify-between gap-4 border-t border-border pt-5 sm:min-h-24">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">RESULT</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={`${displayResult}-${error ?? ''}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      'mt-1 max-w-full overflow-x-auto text-[clamp(2.45rem,8vw,5.25rem)] font-semibold leading-none tracking-[-0.065em] tabular-nums',
                      error ? 'text-destructive' : 'text-primary',
                    )}
                  >
                    {displayResult}
                  </motion.p>
                </AnimatePresence>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" onClick={copyResult} disabled={displayResult === '—'} aria-label="결과 복사">
                    {copied ? <Check size={17} /> : <Copy size={17} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? '복사됨' : '결과 복사'}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2" aria-label="공학 함수 키패드">
            <CalculatorKey tone="function" onClick={() => wrapSelection('ln(')}>ln</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => wrapSelection('log(')}>log</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => wrapSelection('sqrt(')}>√x</CalculatorKey>
            <CalculatorKey tone="function" onClick={appendSquare}>x²</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertToken('^', 'operator')}>xʸ</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => wrapSelection('e^(')}>eˣ</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => wrapSelection('10^(')}>10ˣ</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertToken('π')}>π</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertToken('e')}>e</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => wrapSelection('1/(')}>1/x</CalculatorKey>
          </div>

          <div className="mt-2 grid grid-cols-5 gap-2" aria-label="숫자 및 연산 키패드">
            <CalculatorKey tone="action" onClick={clearCalculator}>AC</CalculatorKey>
            <CalculatorKey tone="action" onClick={() => insertToken('(')}>(</CalculatorKey>
            <CalculatorKey tone="action" onClick={() => insertToken(')')}>)</CalculatorKey>
            <CalculatorKey tone="operator" onClick={() => insertToken('%', 'operator')}>%</CalculatorKey>
            <CalculatorKey tone="action" onClick={deleteBackward} aria-label="한 글자 삭제"><Delete size={18} /></CalculatorKey>

            {[7, 8, 9].map((number) => <CalculatorKey key={number} onClick={() => insertToken(String(number))}>{number}</CalculatorKey>)}
            <CalculatorKey tone="operator" onClick={() => insertToken('÷', 'operator')}>÷</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertToken('Ans')}>Ans</CalculatorKey>

            {[4, 5, 6].map((number) => <CalculatorKey key={number} onClick={() => insertToken(String(number))}>{number}</CalculatorKey>)}
            <CalculatorKey tone="operator" onClick={() => insertToken('×', 'operator')}>×</CalculatorKey>
            <CalculatorKey tone="function" onClick={toggleSign}>±</CalculatorKey>

            {[1, 2, 3].map((number) => <CalculatorKey key={number} onClick={() => insertToken(String(number))}>{number}</CalculatorKey>)}
            <CalculatorKey tone="operator" onClick={() => insertToken('−', 'operator')}>−</CalculatorKey>
            <CalculatorKey tone="equals" onClick={calculateCurrentExpression} className="row-span-2 h-auto" aria-label="계산하기">=</CalculatorKey>

            <CalculatorKey onClick={() => insertToken('0')} className="col-span-2">0</CalculatorKey>
            <CalculatorKey onClick={() => insertToken('.')}>.</CalculatorKey>
            <CalculatorKey tone="operator" onClick={() => insertToken('+', 'operator')}>+</CalculatorKey>
          </div>

          <p
            id="calculator-status"
            className={cn('mt-4 flex min-h-5 items-start gap-2 text-xs leading-5', error ? 'text-destructive' : 'text-muted-foreground')}
            role="status"
            aria-live="polite"
          >
            {!error && <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />}
            {error ?? '퍼센트는 일반 계산기 방식으로 적용됩니다. 예: 200 + 10% = 220'}
          </p>
        </div>

        <aside className="border-t border-border bg-muted/28 lg:border-l lg:border-t-0" aria-label="최근 계산 기록">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 lg:px-6 lg:py-5">
            <button
              type="button"
              onClick={() => setHistoryOpen((current) => !current)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring lg:pointer-events-none"
              aria-expanded={historyOpen}
            >
              <History size={16} className="text-primary" />
              <span className="text-sm font-semibold">최근 계산</span>
              <span className="text-[10px] text-muted-foreground">{history.length}/30</span>
              <ChevronDown size={15} className={cn('ml-auto transition-transform lg:hidden', historyOpen && 'rotate-180')} />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setHistory([])}
              disabled={history.length === 0}
              aria-label="계산 기록 전체 삭제"
            >
              <Trash2 size={15} />
            </Button>
          </div>

          <div className={cn('history-content max-h-[430px] overflow-y-auto p-3 sm:p-4 lg:block lg:max-h-[668px]', historyOpen ? 'block' : 'hidden')}>
            {history.length === 0 ? (
              <div className="grid min-h-40 place-items-center px-5 text-center">
                <div>
                  <p className="text-sm font-semibold text-foreground">아직 계산 기록이 없습니다.</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">수식을 계산하면 이 탭에서만 최근 30개를 볼 수 있습니다.</p>
                </div>
              </div>
            ) : (
              <ol className="space-y-1.5">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => restoreHistory(entry)}
                      className="group w-full rounded-xl px-3 py-3 text-left outline-none transition-colors hover:bg-background focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">{entry.expression}</span>
                      <span className="mt-1 flex items-end justify-between gap-3">
                        <strong className="min-w-0 truncate text-lg tracking-[-0.035em] text-foreground tabular-nums group-hover:text-primary">{entry.result}</strong>
                        <time className="shrink-0 text-[9px] text-muted-foreground" dateTime={new Date(entry.createdAt).toISOString()}>{timeLabel(entry.createdAt)}</time>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </motion.section>

      <footer className="mt-5 flex flex-col gap-1 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>JavaScript Number 정밀도로 계산하며 결과는 최대 12자리 유효숫자로 표시합니다.</span>
        <span>계산식과 기록은 외부로 전송하거나 저장하지 않습니다.</span>
      </footer>
    </main>
  )
}
