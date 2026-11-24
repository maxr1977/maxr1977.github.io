import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { de } from '../data/locales/de'
import styles from './SiteLayout.module.css'

export function SiteLayout() {
  const { pathname, hash, key, search } = useLocation()
  const navigationType = useNavigationType()
  const previousLocation = useRef<{ pathname: string; hash: string; search: string } | null>(null)
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    const before = previousLocation.current
    const isFirstVisit = before === null
    previousLocation.current = { pathname, hash, search }
    // URL filter changes keep keyboard focus and the current scroll position.
    if (before?.pathname === pathname && pathname === '/projekte' &&
      before.hash === hash && before.search !== search) return

    if (hash) {
      let id: string
      try {
        id = decodeURIComponent(hash.slice(1))
      } catch {
        return
      }
      const target = document.getElementById(id)
      if (target) {
        target.focus({ preventScroll: true })
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({
          behavior: reducedMotion || navigationType === 'POP' ? 'instant' : 'smooth',
          block: 'start',
        })
        return
      }
    }

    if (!isFirstVisit) {
      main.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash, key, search, navigationType])

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">{de.navigation.skip}</a>
      <SiteHeader />
      <main className={styles.main} id="main-content" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
