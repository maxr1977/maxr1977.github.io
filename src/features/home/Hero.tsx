import { Link } from 'react-router'
import { ActionLink } from '../../components/ui/ActionLink'
import { Icon } from '../../components/ui/Icon'
import { de } from '../../data/locales/de'
import { HeroArtwork } from './HeroArtwork'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero} id="start" aria-labelledby="hero-title" tabIndex={-1}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.status}><span aria-hidden="true" />{de.hero.availability}</p>
          <p className={styles.eyebrow}>{de.hero.eyebrow}</p>
          <h1 className={styles.title} id="hero-title">
            <span>{de.hero.title}</span>
            {de.hero.titleConnector} <em>{de.hero.titleAccent}</em>
          </h1>
          <p className={styles.roles}>
            <strong>{de.hero.primaryRole}</strong>
            <span>{de.hero.otherRoles}</span>
          </p>
          <p className={styles.description}>{de.hero.description}</p>
          <div className={styles.actions}>
            <ActionLink to="/#kompetenzen">{de.hero.primaryAction}</ActionLink>
            <ActionLink to="/#kontakt" tone="ghost">{de.hero.secondaryAction}</ActionLink>
          </div>
          <p className={styles.location}><Icon name="pin" />{de.hero.location}</p>
        </div>
        <HeroArtwork />
      </div>
      <div className={`container ${styles.bottom}`}>
        <Link to="/#profil" className={styles.scrollLink}>
          <span aria-hidden="true" />{de.hero.scroll}
        </Link>
        <span className={styles.signature}>{de.hero.signature}</span>
      </div>
    </section>
  )
}
