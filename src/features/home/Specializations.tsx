import { Reveal } from '../../components/ui/Reveal'
import { de } from '../../data/locales/de'
import { DisciplineCard } from './DisciplineCard'
import { SectionLabel } from './SectionLabel'
import styles from './Specializations.module.css'

export function Specializations() {
  return (
    <section className={styles.section} id="kompetenzen" tabIndex={-1} aria-labelledby="disciplines-title">
      <div className="container">
        <SectionLabel number={de.specializations.number} label={de.specializations.label}
          aside={de.specializations.aside} />
        <Reveal>
          <div className={styles.heading}>
            <h2 id="disciplines-title">{de.specializations.title}<span>{de.specializations.titleAccent}</span></h2>
            <p>{de.specializations.description}</p>
          </div>
        </Reveal>
        <div className={styles.grid}>
          {de.specializations.items.map((discipline) => (
            <Reveal className={styles.cardSlot} key={discipline.id}>
              <DisciplineCard discipline={discipline} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
