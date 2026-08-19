import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Calculator, Code2, Home, Sigma } from 'lucide-react'
import { Button } from './components/ui/button'
import { TooltipProvider } from './components/ui/tooltip'
import { hashForRoute, routeFromHash, routeTitles, type AppRoute } from './lib/routing'

const HomePage = lazy(() => import('./pages/HomePage'))
const TCalculatorPage = lazy(() => import('./pages/TCalculatorPage'))
const ScientificCalculatorPage = lazy(() => import('./pages/ScientificCalculatorPage'))

function RouteLink({
  route,
  currentRoute,
  children,
  icon,
}: {
  route: AppRoute
  currentRoute: AppRoute
  children: React.ReactNode
  icon: React.ReactNode
}) {
  const active = route === currentRoute
  const href = hashForRoute(route)

  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 ${
        active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {icon}
      <span>{children}</span>
    </a>
  )
}

function App() {
  const reduceMotion = useReducedMotion()
  const [route, setRoute] = useState<AppRoute>(() => routeFromHash(window.location.hash) ?? 'home')

  useEffect(() => {
    const synchronizeRoute = () => {
      const nextRoute = routeFromHash(window.location.hash)
      if (nextRoute) {
        setRoute(nextRoute)
        return
      }

      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`)
      setRoute('home')
    }

    if (!window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`)
    }
    synchronizeRoute()
    window.addEventListener('hashchange', synchronizeRoute)
    return () => window.removeEventListener('hashchange', synchronizeRoute)
  }, [])

  useEffect(() => {
    document.title = routeTitles[route]
  }, [route])

  const Page = route === 'home' ? HomePage : route === 't' ? TCalculatorPage : ScientificCalculatorPage

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-[min(1200px,calc(100%-24px))] items-center justify-between sm:h-[72px] sm:w-[min(1200px,calc(100%-32px))]">
            <a href="#/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Sigma size={19} strokeWidth={2.2} />
              </span>
              <span>
                <strong className="block text-sm tracking-[-0.03em]">tool·lab</strong>
                <span className="hidden text-[10px] text-muted-foreground sm:block">calculation workspace</span>
              </span>
            </a>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <nav className="flex items-center" aria-label="도구 탐색">
                <RouteLink route="home" currentRoute={route} icon={<Home size={14} />}>
                  홈
                </RouteLink>
                <RouteLink route="t" currentRoute={route} icon={<Sigma size={14} />}>
                  t 값
                </RouteLink>
                <RouteLink route="scientific" currentRoute={route} icon={<Calculator size={14} />}>
                  공학용
                </RouteLink>
              </nav>
              <Button asChild variant="ghost" size="icon" className="ml-0.5 hidden sm:inline-flex">
                <a href="https://github.com/diuavjsix-hash/tool" target="_blank" rel="noreferrer" aria-label="GitHub 저장소 열기">
                  <Code2 size={16} />
                </a>
              </Button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={route}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="mx-auto grid min-h-[50vh] w-[min(1200px,calc(100%-32px))] place-items-center text-sm text-muted-foreground">도구를 불러오는 중입니다.</div>}>
              <Page />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

export default App
