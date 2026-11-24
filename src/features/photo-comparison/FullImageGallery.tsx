import type { PublishedImage } from '../../types/project'
import { ProjectImage } from '../projects/ProjectImage'
import { comparisonLabels as copy } from './comparisonLabels'
import { isComparisonImage } from './comparisonLogic'
import styles from './PhotoComparison.module.css'

export type NamedImage = { key: string; label: string; image?: PublishedImage | undefined }

export function FullImageGallery({ images, initiallyOpen = false }: {
  images: readonly NamedImage[]
  initiallyOpen?: boolean
}) {
  const available = images.filter((item): item is NamedImage & { image: PublishedImage } =>
    isComparisonImage(item.image))
  if (available.length === 0) return null

  return (
    <details className={styles.fullImages} open={initiallyOpen || undefined}>
      <summary>{copy.fullImages}</summary>
      <div className={styles.individualGrid} data-count={available.length}>
        {available.map(({ key, label, image }) => (
          <figure key={key}>
            <ProjectImage image={image} />
            <figcaption><strong>{label}</strong>{image.caption?.de && <span>{image.caption.de}</span>}</figcaption>
          </figure>
        ))}
      </div>
    </details>
  )
}
