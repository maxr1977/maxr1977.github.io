import { useEffect, useRef } from 'react'
import { de } from '../../data/locales/de'
import { SiteNavLinks } from './SiteNavLinks'
import styles from './SiteHeader.module.css'

type MobileNavProps = {
  id: string
  open: boolean
  activeSection: string | null
  onNavigate: () => void
}

export function MobileNav({ id, open, activeSection, onNavigate }: MobileNavProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLAnchorElement>('a')?.focus()
  }, [open])

  return (
    <div className={styles.mobilePanel} id={id} hidden={!open} ref={panel}>
      <nav className={`container ${styles.mobileLinks}`} aria-label={de.navigation.mobileLabel}>
        <SiteNavLinks activeSection={activeSection} onNavigate={onNavigate} />
      </nav>
    </div>
  )
}
