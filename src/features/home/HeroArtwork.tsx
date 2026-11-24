import portrait1200 from '../../../public/media/projects/portrait/maksym-portrait-1200.webp'
import portrait640 from '../../../public/media/projects/portrait/maksym-portrait-640.webp'
import { de } from '../../data/locales/de'
import styles from './Hero.module.css'

export function HeroArtwork() {
  return (
    <div className={styles.artwork}>
      <img
        className={styles.portrait}
        src={portrait1200}
        srcSet={`${portrait640} 640w, ${portrait1200} 1200w`}
        sizes="(min-width: 64rem) min(26rem, 35vw), (max-width: 35rem) min(18rem, calc(100vw - 2.5rem)), 22rem"
        width={1200}
        height={1607}
        alt={de.hero.portraitAlt}
        loading="eager"
        fetchPriority="high"
      />
    </div>
  )
}
