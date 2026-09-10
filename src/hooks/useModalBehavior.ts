import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * The three behaviours every `role="dialog"` needs and none of them had:
 *
 * 1. Escape closes it (only TaskModal handled this).
 * 2. Body scroll is locked while it is open, so the page behind doesn't move.
 * 3. Focus is trapped inside, so Tab can't walk into the page behind it —
 *    required by WCAG 2.4.3, and the reason a keyboard user could get lost.
 *
 * Attach the returned ref to the dialog panel.
 */
export function useModalBehavior<T extends HTMLElement = HTMLDivElement>(onClose: () => void) {
  const containerRef = useRef<T>(null)
  // Kept in a ref so a new inline callback each render doesn't re-bind listeners.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null

    function focusable(): HTMLElement[] {
      if (!containerRef.current) return []
      return Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement,
      )
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      // Wrap around at both ends, and pull focus back in if it escaped.
      if (e.shiftKey && (active === first || !containerRef.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !containerRef.current?.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    // Scroll lock — compensate for the scrollbar so the layout doesn't jump.
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      previouslyFocused?.focus?.()
    }
  }, [])

  return containerRef
}
