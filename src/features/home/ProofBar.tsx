import { de } from '../../data/locales/de'
import styles from './ProofBar.module.css'

export function ProofBar() {
  return (
    <aside className={styles.proof} aria-label={de.proof.label}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.label}>{de.proof.label}</p>
        <dl className={styles.items}>
          {de.proof.items.map((item) => (
            <div className={styles.item} key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}
