import { projectLabels as copy } from '../../data/projectLabels'
import styles from './Portfolio.module.css'

export function ProjectDemo({
  description,
  url
}: {
  description: string
  url?: string | undefined
}) {
  return (
    <section className={styles.demoPanel} aria-labelledby="case-demo">
      <div>
        <h2 id="case-demo">{copy.case.demo}</h2>
        <p>{description}</p>
      </div>
      {url ? (
        <a
          className={styles.demoLink}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.case.openDemo}
          <span className={styles.srOnly}> — {copy.case.newTab}</span>
        </a>
      ) : (
        <p className={styles.demoPending} role="status">
          {copy.case.demoPending}
        </p>
      )}
    </section>
  )
}
