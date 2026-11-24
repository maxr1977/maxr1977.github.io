import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

const sections = ['start', 'profil', 'kompetenzen', 'kontakt'] as const

export function useHomeSection() {
  const { pathname } = useLocation()
  const [activeSection, setActiveSection] = useState<string>('start')

  useEffect(() => {
    if (pathname !== '/') return
    let frame = 0

    const update = () => {
      frame = 0
      const bar = document.querySelector('[data-header-bar]')
      const offset = (bar?.getBoundingClientRect().height ?? 76) + 48
      let active: string = 'start'
      for (const id of sections) {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= offset) active = id
      }
      setActiveSection(active)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [pathname])

  return pathname === '/' ? activeSection : null
}
