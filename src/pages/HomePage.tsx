import { ArrowUpRight, Calculator, Sigma } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const tools = [
  {
    number: '01',
    href: '#/t',
    icon: Sigma,
    category: '통계',
    title: 't 임계값 계산기',
    description: '누적확률과 유의수준, 자유도로 Student t 분포의 임계값을 계산하고 확률 영역을 확인합니다.',
    specimen: 't₀.₉₇₅,₁₀',
    result: '2.228139',
  },
  {
    number: '02',
    href: '#/scientific',
    icon: Calculator,
    category: '일반 계산',
    title: '공학용 계산기',
    description: '괄호와 퍼센트, 거듭제곱, 로그와 지수 함수를 하나의 수식에서 계산합니다.',
    specimen: 'ln(e⁵) + 10%',
    result: '5.1',
  },
]

export default function HomePage() {
  const reduceMotion = useReducedMotion()

  return (
    <main className="mx-auto w-[min(1200px,calc(100%-32px))] pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-24">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-8 pb-12 sm:pb-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(360px,0.55fr)] lg:items-end lg:gap-20"
      >
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-primary">CALCULATION WORKSPACE</p>
          <h1 className="max-w-3xl text-balance text-[clamp(2.65rem,7vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.065em]">
            필요한 계산을<br />바로 시작하세요.
          </h1>
        </div>
        <div className="border-l-2 border-primary/25 pl-5 sm:pl-6">
          <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            통계 검정부터 일상적인 수식까지. 입력과 결과는 이 브라우저 안에서만 처리됩니다.
          </p>
          <p className="mt-4 text-xs font-semibold text-foreground">도구 2개 · 로그인 없음 · 서버 전송 없음</p>
        </div>
      </motion.div>

      <section className="border-y border-border" aria-labelledby="tool-list-title">
        <h2 id="tool-list-title" className="sr-only">사용 가능한 계산 도구</h2>
        {tools.map((tool, index) => {
          const Icon = tool.icon
          return (
            <motion.a
              key={tool.href}
              href={tool.href}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: reduceMotion ? 0 : 0.08 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`group grid gap-5 py-7 outline-none transition-colors focus-visible:bg-accent/60 sm:grid-cols-[64px_minmax(0,1fr)_minmax(230px,0.62fr)_44px] sm:items-center sm:gap-6 sm:py-9 ${index > 0 ? 'border-t border-border' : ''}`}
            >
              <div className="flex items-center gap-3 sm:block">
                <span className="text-[10px] font-semibold text-muted-foreground">{tool.number}</span>
                <span className="mt-0 grid size-10 place-items-center rounded-xl bg-secondary text-primary transition-transform duration-200 group-hover:-translate-y-0.5 sm:mt-3">
                  <Icon size={19} />
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.13em] text-primary">{tool.category}</p>
                <h3 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{tool.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{tool.description}</p>
              </div>
              <div className="border-l border-border pl-5 sm:pl-6">
                <p className="font-serif text-sm italic text-muted-foreground">{tool.specimen}</p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-primary tabular-nums sm:text-4xl">{tool.result}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-full border border-border bg-background transition-[transform,border-color,background-color] duration-200 group-hover:translate-x-1 group-hover:border-primary/35 group-hover:bg-accent" aria-hidden="true">
                <ArrowUpRight size={18} />
              </span>
            </motion.a>
          )
        })}
      </section>

      <footer className="mt-6 flex flex-col gap-1 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>계산 결과는 학습과 참고를 위한 일반 계산값입니다.</span>
        <a href="https://github.com/diuavjsix-hash/tool" target="_blank" rel="noreferrer" className="font-semibold hover:text-foreground">GitHub에서 코드 보기</a>
      </footer>
    </main>
  )
}
