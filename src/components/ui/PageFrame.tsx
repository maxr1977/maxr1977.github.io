import { useId } from 'react'
import type { ReactNode } from 'react'
import { usePageMetadata } from '../../app/usePageMetadata'
import styles from './PageFrame.module.css'

type PageFrameProps = {
  title: string
  eyebrow: string
  description: string
  children?: ReactNode
}

export function PageFrame({ title, eyebrow, description, children }: PageFrameProps) {
  const headingId = useId()
  usePageMetadata(title, description)

  return (
    <section className={`container ${styles.page}`} aria-labelledby={headingId}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title} id={headingId}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children && <div className={styles.content}>{children}</div>}
    </section>
  )
}
