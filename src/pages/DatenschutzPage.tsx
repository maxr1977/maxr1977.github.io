import { PageFrame } from '../components/ui/PageFrame'
import { legalCopy as copy } from '../data/legal'
import { releaseStatus } from '../data/release'
import { LegalContact } from '../components/layout/LegalContact'
import styles from '../components/layout/LegalPages.module.css'

export function DatenschutzPage() {
  return (
    <PageFrame
      title={copy.privacy.title}
      eyebrow={copy.eyebrow}
      description={copy.privacy.description}
    >
      <div className={styles.document}>
        {!releaseStatus.legalReviewApproved && (
          <aside className={styles.draft} aria-label={copy.privacy.draftTitle}>
            <strong>{copy.privacy.draftTitle}</strong>
            <p>{copy.privacy.draft}</p>
          </aside>
        )}
        <section aria-labelledby="privacy-responsible">
          <h2 id="privacy-responsible">{copy.responsible}</h2>
          <LegalContact />
        </section>
        {copy.privacy.sections.map((section) => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`}>
            <h2 id={`privacy-${section.id}`}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.id === 'complaint' && (
              <p className={styles.source}>
                <a
                  href={copy.privacy.authorityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.privacy.authority}
                </a>
              </p>
            )}
          </section>
        ))}
        {releaseStatus.openItems.length > 0 && (
          <section className={styles.draft} aria-labelledby="privacy-open">
            <h2 id="privacy-open">{copy.privacy.openTitle}</h2>
            <ul>
              {releaseStatus.openItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
        <p className={styles.source}>
          <a
            href={copy.privacy.hostingSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.privacy.hostingSource}
          </a>
          <br />
          <a
            href={copy.privacy.githubPrivacyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.privacy.githubPrivacy}
          </a>
        </p>
        <ul className={styles.source}>
          {[
            [copy.privacy.linkedinPrivacy, copy.privacy.linkedinPrivacyUrl],
            [copy.privacy.googlePrivacy, copy.privacy.googlePrivacyUrl],
            [copy.privacy.googleTransfers, copy.privacy.googleTransfersUrl],
            [copy.privacy.googleRetention, copy.privacy.googleRetentionUrl],
            [copy.privacy.gmailDeletion, copy.privacy.gmailDeletionUrl]
          ].map(([label, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.source}>
          {copy.updated}
          <br />
          <a
            href={copy.privacy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.privacy.source}
          </a>
        </p>
      </div>
    </PageFrame>
  )
}
