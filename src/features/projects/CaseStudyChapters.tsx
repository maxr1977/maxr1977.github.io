import type { CaseChapter, PublishedImage } from '../../types/project'
import { EnlargeableProjectImage } from './EnlargeableProjectImage'
import styles from './Portfolio.module.css'
import { projectLabels } from '../../data/projectLabels'

export function CaseStudyChapters({
  chapters,
  images
}: {
  chapters: readonly CaseChapter[]
  images: readonly PublishedImage[]
}) {
  return (
    <div className={styles.chapters}>
      {chapters.map((chapter) => {
        const image = images.find((item) => item.id === chapter.imageId)
        return (
          <section
            key={chapter.id}
            className={styles.chapter}
            data-illustrated={!!image}
            data-examples={!!chapter.examples?.items.length}
            aria-labelledby={`chapter-${chapter.id}`}
          >
            <div className={styles.chapterText}>
              <h2 id={`chapter-${chapter.id}`}>{chapter.title}</h2>
              <p>{chapter.description}</p>
              {!!chapter.bullets?.length && (
                <ul className={styles.textList}>
                  {chapter.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            {!!chapter.examples?.items.length && (
              <div className={styles.exampleGrid}>
                {chapter.examples.items.map((example, index) => (
                  <section
                    className={styles.exampleCard}
                    key={example.title}
                    aria-labelledby={`example-${chapter.id}-${index}`}
                  >
                    <p
                      className={styles.exampleKind}
                      data-kind={chapter.examples!.kind}
                    >
                      {projectLabels.case[chapter.examples!.kind]}
                    </p>
                    <h3 id={`example-${chapter.id}-${index}`}>
                      {example.title}
                    </h3>
                    <dl>
                      {(
                        ['problem', 'diagnosis', 'solution', 'result'] as const
                      ).map(
                        (key) =>
                          example[key] && (
                            <div key={key}>
                              <dt>{projectLabels.case[key]}</dt>
                              <dd>{example[key]}</dd>
                            </div>
                          )
                      )}
                    </dl>
                  </section>
                ))}
              </div>
            )}
            {image && (
              <figure
                className={styles.chapterImage}
                data-portrait={image.height > image.width * 1.5}
              >
                <EnlargeableProjectImage image={image} />
                {image.caption?.de && (
                  <figcaption>{image.caption.de}</figcaption>
                )}
              </figure>
            )}
          </section>
        )
      })}
    </div>
  )
}
