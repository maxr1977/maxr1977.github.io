import { Link } from 'react-router'
import { Icon } from '../../components/ui/Icon'
import { projectLabels as copy } from '../../data/projectLabels'
import type { PublishedProject } from '../../types/project'
import { ProjectImage } from './ProjectImage'
import styles from './Portfolio.module.css'

export function ProjectCard({
  project,
  featured = false,
  compact = false,
  headingLevel = 2
}: {
  project: PublishedProject
  featured?: boolean
  compact?: boolean
  headingLevel?: 2 | 3
}) {
  const content = project.content.de
  const headingId = `project-card-${project.id}`
  const Heading = headingLevel === 3 ? 'h3' : 'h2'

  return (
    <article
      className={`${styles.card} ${featured ? styles.featuredCard : ''}`}
      aria-labelledby={headingId}
    >
      {project.cover && (
        <div
          className={`${styles.cardCover} ${project.restoration?.presentation?.allowCropping === false || !!content.chapters?.length ? styles.uncroppedCover : ''}`}
        >
          <ProjectImage image={project.cover} />
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span
            className={[styles.badge, styles[project.category]]
              .filter(Boolean)
              .join(' ')}
          >
            {copy.categories[project.category]}
          </span>
          <span>{copy.origins[project.origin]}</span>
        </div>
        <Heading className={styles.cardTitle} id={headingId}>
          {content.title}
        </Heading>
        {content.summary && <p className={styles.summary}>{content.summary}</p>}
        {project.tools.length > 0 && (
          <ul className={styles.tags}>
            {(compact ? project.tools.slice(0, 4) : project.tools).map(
              (tool) => (
                <li key={tool}>{tool}</li>
              )
            )}
          </ul>
        )}
        <Link
          className={styles.caseLink}
          to={`/projekte/${project.slug}`}
          aria-label={`${copy.catalog.openCase}: ${content.title}`}
        >
          {copy.catalog.openCase}
          <Icon name="arrowUpRight" />
        </Link>
      </div>
    </article>
  )
}
