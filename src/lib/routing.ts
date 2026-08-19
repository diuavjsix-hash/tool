export const appRoutes = ['home', 't', 'scientific'] as const

export type AppRoute = (typeof appRoutes)[number]

export const routeTitles: Record<AppRoute, string> = {
  home: 'tool·lab — 계산 도구 모음',
  t: 't 임계값 계산기 — tool·lab',
  scientific: '공학용 계산기 — tool·lab',
}

/** Converts the URL hash into a known application route. Unknown routes fail closed. */
export function routeFromHash(hash: string): AppRoute | null {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  if (!path) return 'home'
  if (path === 't' || path === 'scientific') return path
  return null
}

/** Returns the canonical hash used by navigation and direct links. */
export function hashForRoute(route: AppRoute) {
  return route === 'home' ? '#/' : `#/${route}`
}
