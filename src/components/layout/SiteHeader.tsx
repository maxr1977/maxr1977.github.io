import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { de } from '../../data/locales/de'
import { site } from '../../data/site'
import { Icon } from '../ui/Icon'
import { MobileNav } from './MobileNav'
import { SiteNavLinks } from './SiteNavLinks'
import { useHomeSection } from './useHomeSection'
import styles from './SiteHeader.module.css'

export function SiteHeader() {
  const { key } = useLocation()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === key
  const button = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  const menuId = useId()
  const activeSection = useHomeSection()
  const close = useCallback(() => setOpenAt(null), [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        button.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) close()
    }
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) close()
    }
    const desktop = window.matchMedia('(min-width: 64rem)')
    const onBreakpointChange = () => {
      if (!desktop.matches) return
      const focusWasInMenu = document.activeElement?.closest('[data-mobile-menu]')
      close()
      if (focusWasInMenu || document.activeElement === button.current) header.current?.querySelector<HTMLAnchorElement>('[data-desktop-nav] a')?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('focusin', onFocusIn)
    desktop.addEventListener('change', onBreakpointChange)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('focusin', onFocusIn)
      desktop.removeEventListener('change', onBreakpointChange)
    }
  }, [open, close])

  return (
    <header className={styles.header} id="site-header" ref={header}>
      <div className={`container ${styles.inner}`} data-header-bar>
        <Link className={styles.brand} to="/#start" aria-label={de.navigation.brandLabel} onClick={close}>
          <span className={styles.monogram}>{site.brand}<span>.</span></span>
          <span className={styles.brandCopy}>
            <span>{site.name}</span>
            <small>{de.navigation.brandSubtitle}</small>
          </span>
        </Link>
        <nav className={styles.desktopNav} aria-label={de.navigation.label} data-desktop-nav>
          <SiteNavLinks activeSection={activeSection} includeContact={false} />
        </nav>
        <div className={styles.actions}>
          <Link className={styles.contact} aria-current={activeSection === 'kontakt' ? 'location' : undefined} to="/#kontakt" onClick={close}>
            {de.navigation.contact}<Icon name="arrowUpRight" />
          </Link>
          <button className={styles.toggle} type="button" aria-expanded={open}
            aria-controls={menuId} aria-label={open ? de.navigation.closeMenu : de.navigation.openMenu}
            ref={button} onClick={() => setOpenAt(open ? null : key)}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <div data-mobile-menu>
        <MobileNav id={menuId} open={open} activeSection={activeSection} onNavigate={close} />
      </div>
    </header>
  )
}
