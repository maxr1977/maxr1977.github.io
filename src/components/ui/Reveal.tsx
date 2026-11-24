import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Reveal.module.css'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string | undefined }) {
  const element = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!element.current || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setRevealed(true)
        observer.disconnect()
      }
    }, { threshold: 0.08 })

    observer.observe(element.current)
    return () => observer.disconnect()
  }, [])

  // Content is visible by default, including when the observer is unavailable.
  return (
    <div className={[styles.reveal, className].filter(Boolean).join(' ')}
      data-revealed={revealed || undefined} ref={element}>
      {children}
    </div>
  )
}
