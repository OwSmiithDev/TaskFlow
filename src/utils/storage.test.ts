import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJSON, readRaw, writeJSON, writeRaw } from './storage'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('readJSON', () => {
  it('round-trips a value', () => {
    writeJSON('k', { a: 1 })
    expect(readJSON('k', null)).toEqual({ a: 1 })
  })

  it('returns the fallback for a missing key', () => {
    expect(readJSON('missing', 'fb')).toBe('fb')
  })

  it('returns the fallback for corrupt JSON instead of throwing', () => {
    localStorage.setItem('k', '{not json')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readJSON('k', 'fb')).toBe('fb')
  })

  it('returns the fallback when localStorage itself throws', () => {
    // Safari private mode and blocked site data make the accessor throw.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readJSON('k', 'fb')).toBe('fb')
  })
})

describe('writeJSON', () => {
  it('reports success', () => {
    expect(writeJSON('k', 1)).toBe(true)
  })

  it('swallows a quota error and reports failure instead of crashing', () => {
    // Regression: the persistence effect called setItem unguarded, so a
    // quota-exceeded error thrown inside the effect took down the whole app.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => writeJSON('k', { big: 'payload' })).not.toThrow()
    expect(writeJSON('k', 1)).toBe(false)
    expect(warn).toHaveBeenCalled()
  })
})

describe('readRaw / writeRaw', () => {
  it('round-trips a string', () => {
    expect(writeRaw('k', 'kanban')).toBe(true)
    expect(readRaw('k')).toBe('kanban')
  })

  it('returns null for a missing key', () => {
    expect(readRaw('missing')).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(writeRaw('k', 'v')).toBe(false)
  })
})
