import { useState } from 'react'
import { projectLabels as copy } from '../../data/projectLabels'
import type { PublishedVideo } from '../../types/project'
import { ProjectImage } from './ProjectImage'
import styles from './Portfolio.module.css'

export function ProjectVideo({ video }: { video: PublishedVideo }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div className={styles.videoBlock}>
      <p className={styles.videoTitle}>{video.title.de}</p>
      {failed ? <p role="status">{copy.media.videoUnavailable}</p> :
        video.kind === 'local' ? (
          <video className={styles.video} controls preload="none" playsInline
            poster={video.poster?.src} width={video.width} height={video.height}
            aria-label={video.title.de} onError={() => setFailed(true)}>
            <source src={video.src} type={video.mimeType} />
            {video.captions.map(track => (
              <track key={track.src} kind="captions" src={track.src}
                srcLang={track.language} label={track.label} default={track.language === 'de'} />
            ))}
            {copy.media.videoUnavailable}
          </video>
        ) : loaded ? (
          <iframe className={styles.embed} src={video.embedUrl} title={video.title.de}
            allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        ) : (
          <div className={styles.externalVideo}>
            {video.poster && <ProjectImage image={video.poster} />}
            <p>{copy.media.externalNotice}</p>
            <button className={styles.textButton} type="button" onClick={() => setLoaded(true)}>
              {copy.media.loadExternal}
            </button>
          </div>
        )}
      {video.transcript?.de && (
        <details className={styles.transcript}>
          <summary>{copy.media.transcript}</summary>
          <p>{video.transcript.de}</p>
        </details>
      )}
    </div>
  )
}
