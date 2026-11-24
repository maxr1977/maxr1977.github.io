import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import type { PublishedImage } from '../../types/project'
import { projectLabels } from '../../data/projectLabels'
import { ProjectImage } from './ProjectImage'
import styles from './ImageViewer.module.css'

const copy = projectLabels.media

export function EnlargeableProjectImage({
  image,
  eager = false
}: {
  image: PublishedImage
  eager?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-label={`${copy.enlarge}: ${image.alt.de}`}
        onClick={() => setOpen(true)}
      >
        <ProjectImage image={image} eager={eager} />
        <span className={styles.hint} aria-hidden="true">
          {copy.enlarge}
        </span>
      </button>
      {open && <ImageDialog image={image} onClose={() => setOpen(false)} />}
    </>
  )
}

function ImageDialog({
  image,
  onClose
}: {
  image: PublishedImage
  onClose: () => void
}) {
  const [failed, setFailed] = useState(false)

  return (
    <Modal
      title={copy.viewerTitle}
      closeLabel={copy.closeImage}
      help={copy.viewerHelp}
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          {image.caption?.de && <p>{image.caption.de}</p>}
          <a href={image.src} target="_blank" rel="noopener noreferrer">
            {copy.openImage}
            <span className={styles.srOnly}>
              {' '}
              — {projectLabels.case.newTab}
            </span>
          </a>
        </div>
      }
    >
      <div
        className={styles.viewport}
        tabIndex={0}
        role="region"
        aria-label={copy.enlargedImage}
      >
        {failed ? (
          <p role="alert">{copy.unavailable}</p>
        ) : (
          <img
            className={styles.fullImage}
            src={image.src}
            alt={image.alt.de}
            width={image.width}
            height={image.height}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </Modal>
  )
}
