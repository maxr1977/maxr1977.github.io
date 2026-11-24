import type { PublishedImage } from '../../types/project'
import { ProjectImage } from './ProjectImage'
import styles from './Portfolio.module.css'

export function ProjectGallery({ images }: { images: readonly PublishedImage[] }) {
  if (images.length === 0) return null
  return (
    <div className={styles.gallery}>
      {images.map(image => (
        <figure key={image.id}>
          <ProjectImage image={image} />
          {image.caption?.de && <figcaption>{image.caption.de}</figcaption>}
        </figure>
      ))}
    </div>
  )
}
