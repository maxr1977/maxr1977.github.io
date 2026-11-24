import type { PublishedProject } from '../../types/project'
import { ProjectCard } from './ProjectCard'
import { orderProjects } from './projectOrder'
import styles from './Portfolio.module.css'

export function ProjectGrid({
  projects,
  compact = false
}: {
  projects: readonly PublishedProject[]
  compact?: boolean
}) {
  const ordered = orderProjects(projects)
  const featureFirst = ordered.length === 3 && ordered[0]?.slug === 'studioflow'
  return (
    <div className={styles.projectGrid}>
      {ordered.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          featured={featureFirst && index === 0}
          headingLevel={compact ? 3 : 2}
          compact={compact}
        />
      ))}
    </div>
  )
}
