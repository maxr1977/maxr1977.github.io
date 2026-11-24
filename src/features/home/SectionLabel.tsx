import styles from './SectionLabel.module.css'

type SectionLabelProps = {
  number: string
  label: string
  aside?: string
  rail?: boolean
}

export function SectionLabel({ number, label, aside, rail = false }: SectionLabelProps) {
  return (
    <div className={[styles.label, rail ? styles.rail : styles.row].filter(Boolean).join(' ')}>
      <p><span>{number}</span><span aria-hidden="true">/</span>{label}</p>
      {aside && <span className={styles.aside}>{aside}</span>}
    </div>
  )
}
