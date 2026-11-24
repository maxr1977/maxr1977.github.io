import { Link, useLocation } from 'react-router'
import { de } from '../../data/locales/de'
import styles from './SiteHeader.module.css'

type SiteNavLinksProps = {
  activeSection: string | null
  onNavigate?: () => void
  includeContact?: boolean
}

export function SiteNavLinks({ activeSection, onNavigate, includeContact = true }: SiteNavLinksProps) {
  const { pathname } = useLocation()

  return de.navigation.items.filter((item) => includeContact || item.to !== '/#kontakt').map((item) => {
    const isSection = 'section' in item
    const active = isSection ? activeSection === item.section :
      pathname === '/projekte' || pathname.startsWith('/projekte/')

    return (
      <Link key={item.to} className={styles.link} to={item.to}
        aria-current={active ? isSection ? 'location' : 'page' : undefined}
        onClick={onNavigate}>
        {item.label}
      </Link>
    )
  })
}
