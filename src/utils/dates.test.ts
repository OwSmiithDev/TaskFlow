import { afterEach, describe, expect, it, vi } from 'vitest'
import { isOverdue, parseLocalDate, todayLocal } from './dates'

afterEach(() => vi.useRealTimers())

describe('todayLocal', () => {
  it('returns the local date, not the UTC date', () => {
    // 2026-09-11T02:30Z is still 2026-09-10 23:30 in São Paulo (UTC-3).
    // The old implementation used toISOString(), which returned 2026-09-11 —
    // so completing a task after 21:00 stamped tomorrow's date.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-11T02:30:00Z'))

    expect(todayLocal()).toBe('2026-09-10')
    expect(new Date().toISOString().split('T')[0]).toBe('2026-09-11')
  })

  it('zero-pads month and day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'))
    expect(todayLocal()).toBe('2026-01-05')
  })
})

describe('parseLocalDate', () => {
  it('parses at local midnight, not UTC midnight', () => {
    const d = parseLocalDate('2026-09-10')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(10)
    expect(d.getHours()).toBe(0)
  })
})

describe('isOverdue', () => {
  it('is false for an empty deadline', () => {
    expect(isOverdue('')).toBe(false)
  })

  it('is false for today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T15:00:00Z'))
    expect(isOverdue('2026-09-10')).toBe(false)
  })

  it('is true for yesterday and false for tomorrow', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T15:00:00Z'))
    expect(isOverdue('2026-09-09')).toBe(true)
    expect(isOverdue('2026-09-11')).toBe(false)
  })

  it('does not flag today as overdue late in the local evening', () => {
    // Regression: a UTC-based "today" rolled over at 21:00 local, making a
    // deadline of today look overdue for the last three hours of the day.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-11T02:30:00Z')) // 23:30 local on the 10th
    expect(isOverdue('2026-09-10')).toBe(false)
  })
})
