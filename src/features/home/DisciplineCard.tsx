import { Link } from 'react-router'
import { Icon } from '../../components/ui/Icon'
import { de } from '../../data/locales/de'
import styles from './Specializations.module.css'

type Discipline = (typeof de.specializations.items)[number]

export function DisciplineCard({ discipline }: { discipline: Discipline }) {
  const titleId = `discipline-${discipline.id}`

  return (
    <article className={[styles.card, styles[discipline.id]].filter(Boolean).join(' ')}
      aria-labelledby={titleId}>
      <div className={styles.cardTop}>
        <span className={styles.index}><span aria-hidden="true">/ </span>{discipline.number}</span>
        <span className={styles.icon}><Icon name={discipline.icon} /></span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.category}>{discipline.category}</p>
        <h3 id={titleId}>{discipline.title.map((line) => <span key={line}>{line}</span>)}</h3>
        <p className={styles.description}>{discipline.description}</p>
      </div>
      <ul className={styles.tags}>
        {discipline.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <Link className={styles.cardLink} to={`/projekte?category=${discipline.id}`}
        aria-label={discipline.linkLabel}>
        {de.specializations.link}<Icon name="arrowUpRight" />
      </Link>
    </article>
  )
}
