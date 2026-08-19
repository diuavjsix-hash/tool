import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, Copy, Delete, History, ShieldCheck, Trash2 } from 'lucide-react'
import { MathfieldElement } from 'mathlive'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { formattedNumberToLatex, mathfieldLatexToExpression } from '../lib/mathfield'
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
        'calculator-key inline-grid h-12 place-items-center rounded-xl border text-sm font-semibold tabular-nums outline-none transition-[transform,background-color,border-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-px sm:h-13',
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

function FractionKeyLabel() {
  return (
    <span className="grid min-w-5 place-items-center text-[10px] leading-none" aria-hidden="true">
      <span className="w-full border-b border-current px-1 pb-0.5">□</span>
      <span className="px-1 pt-0.5">□</span>
    </span>
  )
}

export default function ScientificCalculatorPage() {
  const reduceMotion = useReducedMotion()
  const mathfieldHostRef = useRef<HTMLDivElement>(null)
  const mathfieldRef = useRef<MathfieldElement | null>(null)
  const [expression, setExpression] = useState('')
  const [displayResult, setDisplayResult] = useState('0')
  const [answer, setAnswer] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [justEvaluated, setJustEvaluated] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const host = mathfieldHostRef.current
    if (!host) return

    MathfieldElement.soundsDirectory = null
    const mathfield = new MathfieldElement()
    mathfield.id = 'calculator-expression'
    mathfield.className = 'calculator-mathfield'
    mathfield.mathVirtualKeyboardPolicy = 'manual'
    mathfield.smartFence = true
    mathfield.smartSuperscript = true
    mathfield.popoverPolicy = 'off'
    mathfield.placeholder = '\\text{예: }200+10\\%\\;\\text{또는}\\;\\ln(e^5)'
    mathfield.setAttribute('aria-label', '계산식')
    mathfield.setAttribute('aria-describedby', 'calculator-status')

    const handleInput = () => {
      setExpression(mathfieldLatexToExpression(mathfield.value))
      setError(null)
      setJustEvaluated(false)
    }

    mathfield.addEventListener('input', handleInput)
    host.append(mathfield)
    mathfield.menuItems = []
    mathfieldRef.current = mathfield

    return () => {
      mathfield.removeEventListener('input', handleInput)
      mathfield.remove()
      mathfieldRef.current = null
    }
  }, [])

  const synchronizeMathfield = () => {
    const mathfield = mathfieldRef.current
    if (!mathfield) return
    setExpression(mathfieldLatexToExpression(mathfield.value))
    setError(null)
    setJustEvaluated(false)
  }

  const prepareMathfield = (kind: InputKind) => {
    const mathfield = mathfieldRef.current
    if (!mathfield) return null

    if (justEvaluated) {
      const value = kind === 'operator' && answer !== null
        ? formattedNumberToLatex(formatCalculatorResult(answer))
        : ''
      mathfield.setValue(value, { silenceNotifications: true })
      mathfield.position = mathfield.lastOffset
      setExpression(mathfieldLatexToExpression(value))
      setJustEvaluated(false)
    }

    mathfield.focus()
    return mathfield
  }

  const insertMath = (latex: string, kind: InputKind = 'value') => {
    const mathfield = prepareMathfield(kind)
    if (!mathfield) return
    mathfield.insert(latex, { insertionMode: 'replaceSelection', selectionMode: 'after' })
    synchronizeMathfield()
  }

  const insertTemplate = (emptyTemplate: string, selectedTemplate: string, kind: InputKind = 'value') => {
    const mathfield = prepareMathfield(kind)
    if (!mathfield) return
    const hasSelection = !mathfield.selectionIsCollapsed
    mathfield.insert(hasSelection ? selectedTemplate : emptyTemplate, {
      insertionMode: 'replaceSelection',
      selectionMode: hasSelection ? 'after' : 'placeholder',
    })
    synchronizeMathfield()
  }

  const appendSquare = () => {
    insertTemplate('^{2}', '\\left(#0\\right)^{2}', 'operator')
  }

  const toggleSign = () => {
    const mathfield = prepareMathfield('operator')
    if (!mathfield) return
    if (mathfield.selectionIsCollapsed && mathfield.value) mathfield.executeCommand('selectAll')
    mathfield.insert(mathfield.selectionIsCollapsed ? '-' : '-\\left(#0\\right)', {
      insertionMode: 'replaceSelection',
      selectionMode: 'after',
    })
    synchronizeMathfield()
  }

  const deleteBackward = () => {
    const mathfield = mathfieldRef.current
    if (!mathfield) return
    if (justEvaluated) {
      mathfield.setValue('', { silenceNotifications: true })
      setExpression('')
      setDisplayResult('0')
      setError(null)
      setJustEvaluated(false)
      mathfield.focus()
      return
    }
    mathfield.executeCommand('deleteBackward')
    synchronizeMathfield()
  }

  const clearCalculator = () => {
    const mathfield = mathfieldRef.current
    mathfield?.setValue('', { silenceNotifications: true })
    setExpression('')
    setDisplayResult('0')
    setAnswer(null)
    setError(null)
    setJustEvaluated(false)
    mathfield?.focus()
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
    const latex = mathfieldRef.current?.value ?? expression
    setDisplayResult(formatted)
    setAnswer(evaluation.value)
    setError(null)
    setJustEvaluated(true)
    setHistory((current) => [
      {
        id: `${createdAt}-${current.length}`,
        expression: expression.trim(),
        latex,
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
    const mathfield = mathfieldRef.current
    mathfield?.setValue(entry.latex, { silenceNotifications: true })
    if (mathfield) mathfield.position = mathfield.lastOffset
    setExpression(entry.expression)
    setDisplayResult(entry.result)
    setAnswer(entry.value)
    setError(null)
    setJustEvaluated(false)
    mathfield?.focus()
  }

  const moveCursor = (command: 'moveToPreviousChar' | 'moveToNextChar' | 'moveUp' | 'moveDown') => {
    const mathfield = mathfieldRef.current
    if (!mathfield) return
    mathfield.focus()
    mathfield.executeCommand(command)
  }

  return (
    <main className="mx-auto w-[min(1200px,calc(100%-24px))] pb-12 pt-8 sm:w-[min(1200px,calc(100%-32px))] sm:pt-12 lg:pb-20 lg:pt-16">
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
            <div
              ref={mathfieldHostRef}
              className="mt-3 min-h-10"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  calculateCurrentExpression()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  clearCalculator()
                }
              }}
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
                    title={displayResult}
                    className={cn(
                      'result-value mt-1 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold leading-none tracking-[-0.065em] tabular-nums',
                      displayResult.length > 18
                        ? 'text-[clamp(1.65rem,5vw,3rem)]'
                        : 'text-[clamp(2.45rem,8vw,5.25rem)]',
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

          <div className="mt-3 flex justify-end gap-1.5" role="group" aria-label="수식 커서 이동">
            <CalculatorKey tone="action" className="size-10 h-10" onClick={() => moveCursor('moveToPreviousChar')} aria-label="커서 왼쪽으로 이동"><ArrowLeft size={17} /></CalculatorKey>
            <CalculatorKey tone="action" className="size-10 h-10" onClick={() => moveCursor('moveUp')} aria-label="커서 위로 이동"><ArrowUp size={17} /></CalculatorKey>
            <CalculatorKey tone="action" className="size-10 h-10" onClick={() => moveCursor('moveDown')} aria-label="커서 아래로 이동"><ArrowDown size={17} /></CalculatorKey>
            <CalculatorKey tone="action" className="size-10 h-10" onClick={() => moveCursor('moveToNextChar')} aria-label="커서 오른쪽으로 이동"><ArrowRight size={17} /></CalculatorKey>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2" aria-label="공학 함수 키패드">
            <CalculatorKey tone="function" onClick={() => insertTemplate('\\ln\\left(\\placeholder{}\\right)', '\\ln\\left(#0\\right)')}>ln</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertTemplate('\\log\\left(\\placeholder{}\\right)', '\\log\\left(#0\\right)')}>log</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertTemplate('\\sqrt{\\placeholder{}}', '\\sqrt{#0}')}>√x</CalculatorKey>
            <CalculatorKey tone="function" onClick={appendSquare}>x²</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertTemplate('^{\\placeholder{}}', '\\left(#0\\right)^{\\placeholder{}}', 'operator')}>xʸ</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertTemplate('e^{\\placeholder{}}', 'e^{#0}')}>eˣ</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertTemplate('10^{\\placeholder{}}', '10^{#0}')}>10ˣ</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertMath('\\pi')}>π</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertMath('e')}>e</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertTemplate('\\frac{1}{\\placeholder{}}', '\\frac{1}{#0}')}>1/x</CalculatorKey>
            <CalculatorKey
              tone="function"
              onClick={() => insertTemplate('\\frac{\\placeholder{}}{\\placeholder{}}', '\\frac{#0}{\\placeholder{}}')}
              aria-label="분수 입력"
            >
              <FractionKeyLabel />
            </CalculatorKey>
          </div>

          <div className="mt-2 grid grid-cols-5 gap-2" aria-label="숫자 및 연산 키패드">
            <CalculatorKey tone="action" onClick={clearCalculator}>AC</CalculatorKey>
            <CalculatorKey tone="action" onClick={() => insertMath('(')}>(</CalculatorKey>
            <CalculatorKey tone="action" onClick={() => insertMath(')')}>)</CalculatorKey>
            <CalculatorKey tone="operator" onClick={() => insertMath('\\%', 'operator')}>%</CalculatorKey>
            <CalculatorKey tone="action" onClick={deleteBackward} aria-label="한 글자 삭제"><Delete className="block" size={18} /></CalculatorKey>

            {[7, 8, 9].map((number) => <CalculatorKey key={number} onClick={() => insertMath(String(number))}>{number}</CalculatorKey>)}
            <CalculatorKey tone="operator" onClick={() => insertMath('\\div', 'operator')}>÷</CalculatorKey>
            <CalculatorKey tone="function" onClick={() => insertMath('\\mathrm{Ans}')}>Ans</CalculatorKey>

            {[4, 5, 6].map((number) => <CalculatorKey key={number} onClick={() => insertMath(String(number))}>{number}</CalculatorKey>)}
            <CalculatorKey tone="operator" onClick={() => insertMath('\\times', 'operator')}>×</CalculatorKey>
            <CalculatorKey tone="function" onClick={toggleSign}>±</CalculatorKey>

            {[1, 2, 3].map((number) => <CalculatorKey key={number} onClick={() => insertMath(String(number))}>{number}</CalculatorKey>)}
            <CalculatorKey tone="operator" onClick={() => insertMath('-', 'operator')}>−</CalculatorKey>
            <CalculatorKey tone="equals" onClick={calculateCurrentExpression} className="row-span-2 h-auto" aria-label="계산하기">=</CalculatorKey>

            <CalculatorKey onClick={() => insertMath('0')} className="col-span-2">0</CalculatorKey>
            <CalculatorKey onClick={() => insertMath('.')}>.</CalculatorKey>
            <CalculatorKey tone="operator" onClick={() => insertMath('+', 'operator')}>+</CalculatorKey>
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
      </footer>
    </main>
  )
}
