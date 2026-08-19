import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DistributionChart } from '../components/DistributionChart'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import {
  calculate,
  convertModeValue,
  formatProbability,
  modeConfig,
  type ProbabilityMode,
  validateInput,
} from '../lib/statistics'

const modes: { id: ProbabilityMode; label: string }[] = [
  { id: 'cumulative', label: '누적확률' },
  { id: 'right', label: '오른쪽 꼬리' },
  { id: 'two', label: '양측 꼬리' },
]

const degreePresets = [1, 5, 10, 30, 100]

function PresetButton({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      className="min-w-11 rounded-full px-3 tabular-nums"
    >
      {children}
    </Button>
  )
}

export default function TCalculatorPage() {
  const reduceMotion = useReducedMotion()
  const [mode, setMode] = useState<ProbabilityMode>('cumulative')
  const [probability, setProbability] = useState(modeConfig.cumulative.defaultValue)
  const [degrees, setDegrees] = useState(10)
  const [copied, setCopied] = useState(false)

  const config = modeConfig[mode]
  const validation = useMemo(() => validateInput({ mode, value: probability, degrees }), [mode, probability, degrees])
  const result = useMemo(() => (validation.success ? calculate(validation.data) : null), [validation])
  const errorMessage = validation.success ? null : validation.error.issues[0]?.message ?? '입력값을 확인해 주세요.'

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
    <main className="mx-auto w-[min(1200px,calc(100%-32px))] pb-12 pt-9 sm:pt-12 lg:pb-20 lg:pt-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 max-w-2xl sm:mb-10"
      >
        <h1 className="text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.055em]">
          Student&apos;s t distribution
        </h1>
      </motion.div>

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.52, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_24px_70px_-32px_rgba(15,40,33,0.28)] lg:grid lg:grid-cols-[360px_minmax(0,1fr)]"
        aria-label="t 임계값 계산기"
      >
        <aside className="border-b border-border bg-muted/35 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">계산 조건</p>
            </div>
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">LIVE</span>
          </div>

          <Tabs value={mode} onValueChange={(value) => changeMode(value as ProbabilityMode)} className="mb-8">
            <TabsList aria-label="확률 입력 방식">
              {modes.map((item) => <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>

          <div className="space-y-8">
            <div>
              <div className="mb-3 flex items-end justify-between gap-4">
                <label htmlFor="probability" className="text-sm font-semibold">
                  {config.label}
                  <span className="mt-1 block text-[11px] font-normal text-muted-foreground">{config.hint}</span>
                </label>
                <div className="relative w-32">
                  <Input
                    id="probability"
                    type="number"
                    value={probability}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onChange={(event) => setProbability(Number(event.target.value))}
                    className="pr-9"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 text-sm italic text-muted-foreground">{config.symbol}</span>
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
                  <PresetButton key={preset} active={Math.abs(probability - preset) < 1e-12} onClick={() => setProbability(preset)}>
                    {formatProbability(preset)}
                  </PresetButton>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between gap-4">
                <label htmlFor="degrees" className="text-sm font-semibold">
                  자유도
                  <span className="mt-1 block text-[11px] font-normal text-muted-foreground">1 이상의 정수</span>
                </label>
                <div className="relative w-32">
                  <Input
                    id="degrees"
                    type="number"
                    value={degrees}
                    min={1}
                    max={1_000_000}
                    step={1}
                    onChange={(event) => setDegrees(Number(event.target.value))}
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 text-sm italic text-muted-foreground">df</span>
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
                  <PresetButton key={preset} active={degrees === preset} onClick={() => setDegrees(preset)}>{preset}</PresetButton>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">계산식</span>
            <span className="ml-2 font-serif italic">{config.formula}</span>
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-7 lg:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {mode === 'two' ? '양측 t 임계값' : mode === 'right' ? '오른쪽 꼬리 t 임계값' : 't 임계값'}
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  id="result-value"
                  key={result?.displayValue ?? 'invalid'}
                  initial={reduceMotion ? false : { opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 text-[clamp(3.1rem,8vw,6.2rem)] font-semibold leading-none tracking-[-0.07em] text-primary tabular-nums"
                >
                  {result?.displayValue ?? '—'}
                </motion.p>
              </AnimatePresence>
              <p className="mt-3 text-xs text-muted-foreground">{config.caption}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={copyResult} disabled={!result} aria-label="결과 복사">
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? '복사됨' : '결과 복사'}</TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2 overflow-hidden rounded-xl bg-chart/40 px-1 sm:px-3">
            {result ? (
              <DistributionChart mode={mode} degrees={degrees} criticalValue={result.criticalValue} />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-xs text-muted-foreground sm:h-[300px]">올바른 값을 입력하면 분포가 표시됩니다.</div>
            )}
          </div>

          <dl className="mt-5 grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-background sm:grid-cols-[1fr_1fr_1.5fr]">
            <div className="p-4">
              <dt className="text-[10px] font-semibold text-muted-foreground">누적확률 p</dt>
              <dd className="mt-1.5 text-sm font-semibold tabular-nums">{result ? formatProbability(result.cumulativeProbability) : '—'}</dd>
            </div>
            <div className="p-4">
              <dt className="text-[10px] font-semibold text-muted-foreground">자유도 df</dt>
              <dd className="mt-1.5 text-sm font-semibold tabular-nums">{validation.success ? degrees.toLocaleString('ko-KR') : '—'}</dd>
            </div>
            <div className="col-span-2 border-t border-border p-4 sm:col-span-1 sm:border-t-0">
              <dt className="text-[10px] font-semibold text-muted-foreground">해석</dt>
              <dd className="mt-1.5 text-sm font-semibold tabular-nums">{result?.interpretation ?? '입력값을 확인해 주세요.'}</dd>
            </div>
          </dl>

          {errorMessage && <p className="mt-4 min-h-5 text-xs text-destructive" role="status">{errorMessage}</p>}
        </div>
      </motion.section>

      <footer className="mt-5 flex flex-col gap-1 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>jStat의 Student t 분포 함수를 사용합니다.</span>
      </footer>
    </main>
  )
}
