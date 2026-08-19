import { describe, expect, it } from 'vitest'
import { hashForRoute, routeFromHash } from './routing'

describe('hash routing', () => {
  it('recognizes canonical routes and optional trailing slashes', () => {
    expect(routeFromHash('')).toBe('home')
    expect(routeFromHash('#/')).toBe('home')
    expect(routeFromHash('#/t')).toBe('t')
    expect(routeFromHash('#/t/')).toBe('t')
    expect(routeFromHash('#/scientific')).toBe('scientific')
  })

  it('rejects unknown or nested routes', () => {
    expect(routeFromHash('#/unknown')).toBeNull()
    expect(routeFromHash('#/scientific/history')).toBeNull()
  })

  it('builds canonical navigation hashes', () => {
    expect(hashForRoute('home')).toBe('#/')
    expect(hashForRoute('t')).toBe('#/t')
    expect(hashForRoute('scientific')).toBe('#/scientific')
  })
})
