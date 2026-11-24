import { projectLabels as copy } from '../../data/projectLabels'
import { categories } from './catalogFilters'
import type { ProjectFilter } from './catalogFilters'
import styles from './Portfolio.module.css'

type Props = { selected: ProjectFilter; onChange: (category: ProjectFilter) => void }

export function ProjectFilters({ selected, onChange }: Props) {
  return (
    <div className={styles.filters} role="group" aria-label={copy.catalog.filterLabel}>
      {categories.map(category => (
        <button id={`project-filter-${category}`} className={styles.filter} key={category}
          type="button" aria-pressed={category === selected} aria-controls="project-results"
          onClick={() => onChange(category)}>
          {category === 'all' ? copy.all : copy.categories[category]}
        </button>
      ))}
    </div>
  )
}
