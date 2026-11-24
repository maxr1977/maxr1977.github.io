import { PageFrame } from '../components/ui/PageFrame'
import { legalCopy as copy } from '../data/legal'
import { LegalContact } from '../components/layout/LegalContact'
import styles from '../components/layout/LegalPages.module.css'

export function ImpressumPage() {
  return (
    <PageFrame
      title={copy.impressum.title}
      eyebrow={copy.eyebrow}
      description={copy.impressum.description}
    >
      <div className={styles.document}>
        <section aria-labelledby="imprint-provider">
          <h2 id="imprint-provider">{copy.impressum.heading}</h2>
          <LegalContact />
        </section>
        <section aria-labelledby="imprint-purpose">
          <h2 id="imprint-purpose">{copy.impressum.purposeTitle}</h2>
          <p>{copy.impressum.purpose}</p>
        </section>
        <p className={styles.source}>
          <a
            href={copy.impressum.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.impressum.source}
          </a>
        </p>
      </div>
    </PageFrame>
  )
}
