import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Code2, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DistributionChart } from './components/DistributionChart'
import {
  calculate,
  convertModeValue,
  formatProbability,
  modeConfig,
  type ProbabilityMode,
  validateInput,
} from './lib/statistics'

const modes: { id: ProbabilityMode; shortLabel: string }[] = [
  { id: 'cumulative', shortLabel: '누적확률' },
  { id: 'right', shortLabel: '우측 α' },
  { id: 'two', shortLabel: '양측 α' },
]

const degreePresets = [1, 5, 10, 30, 100]

function PresetButton({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1.5 text-[11px] tabular-nums transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? 'border-ink bg-ink text-paper' : 'border-line text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function App() {
  const reduceMotion = useReducedMotion()
  const [mode, setMode] = useState<ProbabilityMode>('cumulative')
  const [probability, setProbability] = useState(modeConfig.cumulative.defaultValue)
  const [degrees, setDegrees] = useState(10)
  const [copied, setCopied] = useState(false)

  const config = modeConfig[mode]
  const validation = useMemo(
    () => validateInput({ mode, value: probability, degrees }),
    [mode, probability, degrees],
  )
  const result = useMemo(
    () => (validation.success ? calculate(validation.data) : null),
    [validation],
  )
  const errorMessage = validation.success
    ? null
    : validation.error.issues[0]?.message ?? '입력값을 확인해 주세요.'

  const changeMode = (nextMode: ProbabilityMode) => {
    if (nextMode === mode) return
    setProbability(convertModeValue(mode, nextMode, probability))
    setMode(nextMode)
  }

  const copyResult = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.displayValue)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex h-[68px] w-[min(1180px,calc(100%-24px))] items-center justify-between border-b border-line sm:h-[76px] sm:w-[min(1180px,calc(100%-40px))]">
        <a href="./" className="group inline-flex items-baseline gap-2.5" aria-label="t finder 홈">
          <span className="font-serif text-2xl font-bold tracking-[-0.055em]">
            t<span className="text-accent">·</span>finder
          </span>
          <span className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-ink sm:inline">
            Student&apos;s t tool
          </span>
        </a>
        <a
          href="https://github.com/diuavjsix-hash/tool"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <Code2 size={15} strokeWidth={1.8} />
          <span className="hidden sm:inline">소스 보기</span>
        </a>
      </header>

      <main className="mx-auto w-[min(1180px,calc(100%-24px))] pb-16 pt-9 sm:w-[min(1180px,calc(100%-40px))] sm:pt-12">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-end gap-5 pb-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,410px)] md:gap-12 md:pb-10"
          aria-labelledby="page-title"
        >
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
              Critical value calculator
            </p>
            <h1
              id="page-title"
              className="max-w-3xl font-serif text-[clamp(2.8rem,7vw,5rem)] font-medium leading-[0.94] tracking-[-0.06em]"
            >
              확률에서 <em className="text-plot">t</em> 값으로.
            </h1>
          </div>
          <p className="max-w-[410px] text-sm leading-7 text-muted">
            누적확률 또는 유의수준과 자유도를 지정하면 Student t 분포의 임계값을 계산합니다.
            모든 연산은 브라우저 안에서 이루어집니다.
          </p>
        </motion.section>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="grid border-y border-ink bg-white/20 lg:grid-cols-[390px_minmax(0,1fr)]"
          aria-label="t 임계값 계산기"
        >
          <div className="border-b border-ink px-0 py-6 lg:border-b-0 lg:border-r lg:border-line lg:py-8 lg:pr-8">
            <div className="mb-5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              <span>01 / 입력</span>
              <span>실시간 계산</span>
            </div>

            <div
              className="mb-8 grid grid-cols-3 overflow-hidden rounded-sm border border-line"
              role="tablist"
              aria-label="확률 입력 방식"
            >
              {modes.map((item) => {
                const selected = item.id === mode
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => changeMode(item.id)}
                    className={`relative min-h-12 border-r border-line px-2 text-xs font-bold transition-colors last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent ${
                      selected ? 'bg-ink text-paper' : 'hover:bg-plot/5'
                    }`}
                  >
                    {item.shortLabel}
                    {selected && (
                      <motion.span
                        layoutId="selected-mode"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between gap-5">
                <label htmlFor="probability" className="text-sm font-bold">
                  {config.label}
                  <span className="mt-1 block text-[11px] font-normal text-muted">{config.hint}</span>
                </label>
                <div className="relative w-[132px]">
                  <input
                    id="probability"
                    type="number"
                    value={probability}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onChange={(event) => setProbability(Number(event.target.value))}
                    className="h-12 w-full rounded-sm border border-ink bg-canvas px-3 pr-10 text-sm font-bold tabular-nums outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 font-serif text-base italic text-muted">
                    {config.symbol}
                  </span>
                </div>
              </div>
              <input
                type="range"
                aria-label={`${config.label} 슬라이더`}
                value={probability}
                min={config.min}
                max={config.max}
                step={config.step}
                onChange={(event) => setProbability(Number(event.target.value))}
                className="range-input mb-4 w-full"
              />
              <div className="flex flex-wrap gap-2" aria-label="확률 빠른 선택">
                {config.presets.map((preset) => (
                  <PresetButton
                    key={preset}
                    active={Math.abs(probability - preset) < 1e-12}
                    onClick={() => setProbability(preset)}
                  >
                    {formatProbability(preset)}
                  </PresetButton>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-5">
                <label htmlFor="degrees" className="text-sm font-bold">
                  자유도
                  <span className="mt-1 block text-[11px] font-normal text-muted">1 이상의 정수</span>
                </label>
                <div className="relative w-[132px]">
                  <input
                    id="degrees"
                    type="number"
                    value={degrees}
                    min={1}
                    max={1_000_000}
                    step={1}
                    onChange={(event) => setDegrees(Number(event.target.value))}
                    className="h-12 w-full rounded-sm border border-ink bg-canvas px-3 pr-10 text-sm font-bold tabular-nums outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 font-serif text-base italic text-muted">df</span>
                </div>
              </div>
              <input
                type="range"
                aria-label="자유도 슬라이더"
                value={Math.min(200, Math.max(1, degrees || 1))}
                min={1}
                max={200}
                step={1}
                onChange={(event) => setDegrees(Number(event.target.value))}
                className="range-input mb-4 w-full"
              />
              <div className="flex flex-wrap gap-2" aria-label="자유도 빠른 선택">
                {degreePresets.map((preset) => (
                  <PresetButton key={preset} active={degrees === preset} onClick={() => setDegrees(preset)}>
                    {preset}
                  </PresetButton>
                ))}
              </div>
            </div>

            <p className="mt-9 border-t border-line pt-5 font-serif text-sm italic text-muted">{config.formula}</p>
          </div>

          <div className="min-w-0 py-6 lg:py-8 lg:pl-10">
            <div className="mb-4 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              <span>02 / 결과</span>
              <span>{config.caption}</span>
            </div>

            <div className="flex min-h-[112px] items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs text-muted">
                  {mode === 'two' ? '양측 t 임계값' : mode === 'right' ? '우측 t 임계값' : 't 임계값'}
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    id="result-value"
                    key={result?.displayValue ?? 'invalid'}
                    initial={reduceMotion ? false : { opacity: 0.25, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="truncate font-serif text-[clamp(3.7rem,9vw,6.8rem)] font-medium leading-none tracking-[-0.065em] text-plot tabular-nums"
                  >
                    {result?.displayValue ?? '—'}
                  </motion.p>
                </AnimatePresence>
              </div>
              <motion.button
                type="button"
                onClick={copyResult}
                disabled={!result}
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                className="mt-1 inline-flex min-w-[76px] items-center justify-center gap-1.5 rounded-sm border border-line px-3 py-2 text-[11px] font-bold text-muted transition hover:border-ink hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '복사됨' : '복사'}
              </motion.button>
            </div>

            {result ? (
              <DistributionChart mode={mode} degrees={degrees} criticalValue={result.criticalValue} />
            ) : (
              <div className="flex h-[260px] items-center justify-center border-b border-line text-xs text-muted sm:h-[300px]">
                올바른 값을 입력하면 분포가 표시됩니다.
              </div>
            )}

            <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-[1fr_1fr_1.45fr]">
              <div className="py-4 pr-4 sm:py-5">
                <dt className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-muted">누적확률 p</dt>
                <dd className="text-sm font-bold tabular-nums">
                  {result ? formatProbability(result.cumulativeProbability) : '—'}
                </dd>
              </div>
              <div className="border-l border-line px-4 py-4 sm:py-5">
                <dt className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-muted">자유도 df</dt>
                <dd className="text-sm font-bold tabular-nums">{validation.success ? degrees.toLocaleString('ko-KR') : '—'}</dd>
              </div>
              <div className="col-span-2 border-t border-line py-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:py-5 sm:pl-4">
                <dt className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-muted">해석</dt>
                <dd className="text-sm font-bold tabular-nums">{result?.interpretation ?? '입력값을 확인해 주세요.'}</dd>
              </div>
            </dl>

            <p className={`mt-4 min-h-5 text-xs ${errorMessage ? 'text-error' : 'text-muted'}`} role="status">
              {errorMessage ?? '값을 바꾸면 결과와 그래프가 즉시 갱신됩니다.'}
            </p>
          </div>
        </motion.section>

        <footer className="flex flex-col gap-1 pt-5 text-[10px] leading-5 text-muted sm:flex-row sm:justify-between">
          <span>jStat의 Student t 분포 함수를 사용하며 입력 데이터는 외부로 전송되지 않습니다.</span>
          <span>React · TypeScript · Vite</span>
        </footer>
      </main>
    </div>
  )
}

export default App
