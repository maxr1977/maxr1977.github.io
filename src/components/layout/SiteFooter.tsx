import { Link, NavLink } from 'react-router'
import { de } from '../../data/locales/de'
import { site } from '../../data/site'
import { releaseStatus } from '../../data/release'
import { Icon } from '../ui/Icon'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Link
          className={styles.brand}
          to="/#start"
          aria-label={de.navigation.brandLabel}
        >
          {site.brand}
          <span>.</span>
        </Link>
        <div className={styles.identity}>
          <p>
            © {new Date().getFullYear()} {de.footer.copyright}
          </p>
          <p className={styles.note}>{de.footer.status}</p>
        </div>
        <nav className={styles.nav} aria-label={de.footer.legalLabel}>
          <NavLink className={() => styles.legalLink} to="/impressum">
            {de.footer.impressum}
          </NavLink>
          <NavLink className={() => styles.legalLink} to="/datenschutz">
            {de.footer.privacy}
          </NavLink>
          {!releaseStatus.legalReviewApproved && (
            <span className={styles.note}>{de.footer.legalPending}</span>
          )}
        </nav>
        <Link className={styles.backTop} to="/#start">
          {de.footer.backTop}
          <Icon name="arrowUp" />
        </Link>
      </div>
    </footer>
  )
}
