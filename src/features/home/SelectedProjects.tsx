import { Link } from 'react-router'
import { projects } from 'virtual:portfolio-projects'
import { Icon } from '../../components/ui/Icon'
import { de } from '../../data/locales/de'
import { ProjectGrid } from '../projects/ProjectGrid'
import { selectedProjectSlugs } from '../projects/projectOrder'
import { SectionLabel } from './SectionLabel'
import styles from './SelectedProjects.module.css'

export function SelectedProjects() {
  const selected = projects.filter((project) =>
    selectedProjectSlugs.some((slug) => slug === project.slug)
  )
  if (!selected.length) return null
  return (
    <section
      className={styles.section}
      id="ausgewaehlte-projekte"
      aria-labelledby="selected-title"
    >
      <div className="container">
        <SectionLabel
          number={de.selectedProjects.number}
          label={de.selectedProjects.label}
        />
        <div className={styles.heading}>
          <div>
            <h2 id="selected-title">{de.selectedProjects.title}</h2>
            <p>{de.selectedProjects.description}</p>
          </div>
          <Link to="/projekte">
            {de.selectedProjects.all}
            <Icon name="arrowUpRight" />
          </Link>
        </div>
        <ProjectGrid projects={selected} compact />
      </div>
    </section>
  )
}
