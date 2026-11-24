import { Reveal } from '../../components/ui/Reveal'
import { de } from '../../data/locales/de'
import { SectionLabel } from './SectionLabel'
import styles from './IntroSection.module.css'

export function IntroSection() {
  return (
    <section className={styles.section} id="profil" tabIndex={-1} aria-labelledby="intro-title">
      <div className={`container ${styles.layout}`}>
        <SectionLabel number={de.intro.number} label={de.intro.label} rail />
        <Reveal>
          <p className={styles.kicker}>{de.intro.kicker}</p>
          <h2 className={styles.title} id="intro-title">
            {de.intro.title}<span>{de.intro.titleAccent}</span>
          </h2>
          <div className={styles.columns}>
            {de.intro.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ul className={styles.tags}>
            {de.intro.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
