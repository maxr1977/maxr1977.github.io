import { useState } from 'react'
import type { PublishedImage } from '../../types/project'
import { projectLabels as copy } from '../../data/projectLabels'
import styles from './Portfolio.module.css'

export function ProjectImage({ image, eager = false }: { image: PublishedImage; eager?: boolean }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={styles.mediaFallback} role="img"
        aria-label={`${image.alt.de} — ${copy.media.unavailable}`}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}>
        {copy.media.unavailable}
      </div>
    )
  }
  return (
    <img className={styles.image} src={image.src} alt={image.alt.de}
      width={image.width} height={image.height} loading={eager ? 'eager' : 'lazy'}
      decoding="async" onError={() => setFailed(true)} />
  )
}
